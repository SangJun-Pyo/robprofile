// GET /api/admin/refresh-games?key=...
// Fetches popular games from Roblox explore-api and stores in KV
// v2.0 - explore-api only, chunked metadata, robust parsing

import { generateTags } from '../../lib/tags-config.js';
import { CACHE_KEY, STATUS_KEY } from '../../lib/constants.js';
import { robustFetch } from '../../lib/fetch-utils.js';

const MIN_PLAYING = 500;
const METADATA_BATCH_SIZE = 35;
const METADATA_CONCURRENCY = 3;

// Store fetch diagnostics
const diagnostics = {
  requests: [],
  errors: []
};

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const authKey = url.searchParams.get('key');
  const colo = request.cf?.colo || 'unknown';
  const timestamp = new Date().toISOString();

  // Reset diagnostics
  diagnostics.requests = [];
  diagnostics.errors = [];

  // Auth check
  const expectedKey = env.GAMES_REFRESH_KEY;
  if (expectedKey && authKey !== expectedKey) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Check if KV is bound
  if (!env.ROBPROFILE_CACHE) {
    return jsonResponse({
      error: 'KV not configured',
      help: 'Add ROBPROFILE_CACHE KV binding in Cloudflare Pages settings'
    }, 500);
  }

  try {
    const result = await fetchAllGames();

    if (result.fetchedUniverseIdsCount === 0) {
      const status = {
        success: false,
        updatedAt: timestamp,
        count: 0,
        error: 'No universe IDs fetched from explore-api',
        source: { api: 'roblox explore-api', sortsUsed: 0, universeIdsFetched: 0, enriched: 0, filtered: 0 }
      };
      await saveStatus(env, status);

      return jsonResponse({
        error: 'No games fetched',
        message: 'Roblox explore-api may be unavailable',
        timestamp,
        colo,
        diagnostics
      }, 500);
    }

    if (result.filteredGames.length === 0) {
      const status = {
        success: false,
        updatedAt: timestamp,
        count: 0,
        error: 'All games filtered out',
        source: {
          api: 'roblox explore-api',
          sortsUsed: result.sources.discoverApi?.success || 0,
          universeIdsFetched: result.counts.fetched,
          enriched: result.counts.enriched,
          filtered: 0
        }
      };
      await saveStatus(env, status);

      return jsonResponse({
        error: 'No games passed filter',
        counts: result.counts,
        filter: `playing >= ${MIN_PLAYING}`,
        timestamp,
        colo,
        diagnostics
      }, 500);
    }

    // Store in KV
    const poolData = {
      updatedAt: timestamp,
      source: 'roblox explore-api',
      fetchedUniverseIdsCount: result.counts.fetched,
      enrichedGamesCount: result.counts.enriched,
      filteredGamesCount: result.counts.filtered,
      count: result.filteredGames.length,
      items: result.filteredGames
    };

    await env.ROBPROFILE_CACHE.put(CACHE_KEY, JSON.stringify(poolData), {
      expirationTtl: 6 * 60 * 60 // 6 hours
    });

    // Save success status (compact — only meta consumed by refresh-status)
    const status = {
      success: true,
      updatedAt: timestamp,
      count: result.filteredGames.length,
      source: {
        api: 'roblox explore-api',
        sortsUsed: result.sources.discoverApi?.success || 0,
        universeIdsFetched: result.counts.fetched,
        enriched: result.counts.enriched,
        filtered: result.counts.filtered
      }
    };
    await saveStatus(env, status);

    return jsonResponse({
      success: true,
      message: `Stored ${result.filteredGames.length} games in KV`,
      updatedAt: timestamp,
      colo,
      counts: result.counts,
      first3Games: result.filteredGames.slice(0, 3).map(g => ({
        name: g.name,
        playing: g.playing,
        universeId: g.universeId
      })),
      sources: result.sources
    });

  } catch (err) {
    const status = {
      success: false,
      updatedAt: timestamp,
      count: 0,
      error: err.message
    };
    await saveStatus(env, status);

    return jsonResponse({
      error: 'Failed to refresh games',
      details: err.message,
      timestamp,
      colo,
      diagnostics
    }, 500);
  }
}

async function saveStatus(env, status) {
  try {
    await env.ROBPROFILE_CACHE.put(STATUS_KEY, JSON.stringify(status), {
      expirationTtl: 24 * 60 * 60
    });
  } catch (e) {
    console.error('Failed to save status:', e);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

/**
 * Tracked fetch with diagnostics — delegates to robustFetch for timeout/retry/429.
 */
async function trackedFetch(url, label) {
  const result = await robustFetch(url, { timeoutMs: 5000, maxRetries: 1 });

  diagnostics.requests.push({
    label,
    url,
    status: result.status,
    ok: result.ok,
    bodyPreview: result.ok
      ? JSON.stringify(result.data).slice(0, 500)
      : (result.error || '').slice(0, 500),
    durationMs: result.durationMs
  });

  if (!result.ok) {
    diagnostics.errors.push({
      label,
      url,
      error: result.error,
      durationMs: result.durationMs
    });
  }

  return result;
}

/**
 * Extract universeIds from explore-api get-sort-content response.
 * The response structure can vary, so we try multiple paths.
 */
function extractUniverseIds(data) {
  const ids = new Map(); // universeId -> { universeId, placeId }

  function addEntry(universeId, placeId) {
    const uid = Number(universeId);
    if (uid && uid > 0 && !ids.has(uid)) {
      ids.set(uid, { universeId: uid, placeId: placeId ? Number(placeId) : null });
    }
  }

  function extractFromArray(arr) {
    if (!Array.isArray(arr)) return;
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue;
      const uid = item.universeId || item.UniverseId || item.universe_id;
      const pid = item.placeId || item.rootPlaceId || item.PlaceId || item.RootPlaceId || item.place_id;
      if (uid) {
        addEntry(uid, pid);
      }
    }
  }

  if (!data || typeof data !== 'object') return ids;

  // Path 1: data.games[] (common)
  extractFromArray(data.games);

  // Path 2: data.experiences[]
  extractFromArray(data.experiences);

  // Path 3: data.data[] (generic wrapper)
  extractFromArray(data.data);

  // Path 4: data.sorts[].games[] or data.sorts[].experiences[]
  if (Array.isArray(data.sorts)) {
    for (const sort of data.sorts) {
      extractFromArray(sort?.games);
      extractFromArray(sort?.experiences);
    }
  }

  // Path 5: data.sortContents[] or data.sortContent[]
  extractFromArray(data.sortContents);
  extractFromArray(data.sortContent);

  // Path 6: data is itself an array
  if (Array.isArray(data)) {
    extractFromArray(data);
  }

  // Path 7: data has numbered/keyed entries containing universeId directly
  // e.g. { "0": { universeId: ... }, "1": { universeId: ... } }
  if (ids.size === 0) {
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const uid = val.universeId || val.UniverseId;
        const pid = val.placeId || val.rootPlaceId;
        if (uid) addEntry(uid, pid);
      }
    }
  }

  return ids;
}

/**
 * Fetch games from Roblox explore-api only
 */
async function fetchAllGames() {
  const allGames = new Map();
  const sources = {
    discoverApi: { attempted: 0, success: 0, universeIds: 0, sortDetails: [] }
  };

  // Discover API (explore-api)
  const sessionId = crypto.randomUUID();
  const sortsUrl = `https://apis.roblox.com/explore-api/v1/get-sorts?sessionId=${sessionId}`;
  const sortsResult = await trackedFetch(sortsUrl, 'discover-sorts');

  if (sortsResult.ok) {
    const sorts = sortsResult.data.sorts || [];
    // Use up to 5 sorts to get a broad pool
    const usefulSorts = sorts.slice(0, 5);

    for (const sort of usefulSorts) {
      sources.discoverApi.attempted++;
      const sortId = sort.topicId || sort.sortId || sort.token;
      if (!sortId) continue;

      const contentUrl = `https://apis.roblox.com/explore-api/v1/get-sort-content?sessionId=${sessionId}&sortId=${sortId}`;
      const contentResult = await trackedFetch(contentUrl, `discover-content-${sortId}`);

      if (contentResult.ok) {
        sources.discoverApi.success++;

        const extracted = extractUniverseIds(contentResult.data);
        const countFromSort = extracted.size;
        sources.discoverApi.universeIds += countFromSort;
        sources.discoverApi.sortDetails.push({
          sortId,
          name: sort.name || sort.displayName || sortId,
          extracted: countFromSort,
          responseKeys: Object.keys(contentResult.data || {})
        });

        for (const [uid, entry] of extracted) {
          if (!allGames.has(uid)) {
            allGames.set(uid, entry);
          }
        }
      }
    }
  }

  const fetchedUniverseIdsCount = allGames.size;

  if (fetchedUniverseIdsCount === 0) {
    return {
      filteredGames: [],
      fetchedUniverseIdsCount: 0,
      counts: { fetched: 0, enriched: 0, filtered: 0 },
      sources
    };
  }

  // Fetch full metadata in chunks with concurrency limit
  const universeIds = Array.from(allGames.keys());
  const gamesWithMeta = await fetchGamesMetadataChunked(universeIds);

  const enrichedGamesCount = gamesWithMeta.length;

  // Resolve actual thumbnail CDN URLs
  const enrichedIds = gamesWithMeta.map(g => g.universeId);
  const thumbnailMap = await fetchThumbnailsChunked(enrichedIds);

  // Filter: playing >= 500 only
  const filteredGames = gamesWithMeta
    .filter(g => g.playing >= MIN_PLAYING)
    .map(g => ({
      universeId: g.universeId,
      placeId: g.rootPlaceId,
      name: g.name,
      description: (g.description || '').slice(0, 500),
      creatorName: g.creator?.name || 'Unknown',
      playing: g.playing || 0,
      visits: g.visits || 0,
      favorites: g.favoritedCount || 0,
      genre: g.genre || '',
      iconUrl: thumbnailMap.get(g.universeId) || '',
      gameUrl: `https://www.roblox.com/games/${g.rootPlaceId}`,
      tags: generateTags(g)
    }));

  return {
    filteredGames,
    fetchedUniverseIdsCount,
    counts: {
      fetched: fetchedUniverseIdsCount,
      enriched: enrichedGamesCount,
      filtered: filteredGames.length
    },
    sources
  };
}

/**
 * Fetch game metadata in chunks with concurrency limit.
 * Failed chunks are logged but don't fail the whole operation.
 */
async function fetchGamesMetadataChunked(universeIds) {
  const games = [];
  const chunks = [];

  // Split into chunks
  for (let i = 0; i < universeIds.length; i += METADATA_BATCH_SIZE) {
    chunks.push(universeIds.slice(i, i + METADATA_BATCH_SIZE));
  }

  // Process chunks with concurrency limit
  for (let i = 0; i < chunks.length; i += METADATA_CONCURRENCY) {
    const batch = chunks.slice(i, i + METADATA_CONCURRENCY);
    const promises = batch.map((chunk, idx) => {
      const chunkIndex = i + idx;
      const url = `https://games.roblox.com/v1/games?universeIds=${chunk.join(',')}`;
      return trackedFetch(url, `metadata-chunk-${chunkIndex}(${chunk.length}ids)`);
    });

    const results = await Promise.all(promises);

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const chunkIndex = i + j;
      if (result.ok) {
        for (const game of (result.data.data || [])) {
          games.push({
            universeId: game.id,
            rootPlaceId: game.rootPlaceId,
            name: game.name,
            description: game.description,
            genre: game.genre,
            playing: game.playing,
            visits: game.visits,
            favoritedCount: game.favoritedCount,
            maxPlayers: game.maxPlayers,
            created: game.created,
            updated: game.updated,
            creator: game.creator
          });
        }
      } else {
        diagnostics.errors.push({
          label: `metadata-chunk-${chunkIndex}-failed`,
          detail: `Chunk of ${batch[j]?.length || '?'} IDs failed`,
          status: result.status,
          body: result.body?.slice(0, 200) || result.error
        });
      }
    }
  }

  return games;
}

/**
 * Batch-resolve actual thumbnail CDN URLs from Roblox thumbnails API.
 * Returns Map<universeId, imageUrl>.
 */
async function fetchThumbnailsChunked(universeIds) {
  const thumbnails = new Map();
  const chunks = [];

  for (let i = 0; i < universeIds.length; i += METADATA_BATCH_SIZE) {
    chunks.push(universeIds.slice(i, i + METADATA_BATCH_SIZE));
  }

  for (let i = 0; i < chunks.length; i += METADATA_CONCURRENCY) {
    const batch = chunks.slice(i, i + METADATA_CONCURRENCY);
    const promises = batch.map((chunk, idx) => {
      const chunkIndex = i + idx;
      const url = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${chunk.join(',')}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`;
      return trackedFetch(url, `thumbnails-chunk-${chunkIndex}(${chunk.length}ids)`);
    });

    const results = await Promise.all(promises);

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      if (result.ok) {
        for (const entry of (result.data.data || [])) {
          if (entry.imageUrl && entry.state === 'Completed') {
            thumbnails.set(entry.targetId, entry.imageUrl);
          }
        }
      }
    }
  }

  return thumbnails;
}
