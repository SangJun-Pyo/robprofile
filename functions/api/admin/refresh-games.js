// GET /api/admin/refresh-games?key=...
// Fetches popular games from Roblox and stores in KV
// v1.2 - Enhanced error diagnostics

import { generateTags } from '../../lib/tags-config.js';

const MIN_PLAYING = 500;
const MIN_VISITS_FALLBACK = 1000000;
const CACHE_KEY = 'games_pool_v1';
const STATUS_KEY = 'refresh_status_v1';

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
    // Fetch games from multiple sources
    const result = await fetchAllGames();

    if (result.rawCount === 0) {
      const status = {
        success: false,
        timestamp,
        colo,
        error: 'No games fetched from any source',
        diagnostics: diagnostics
      };
      await saveStatus(env, status);

      return jsonResponse({
        error: 'No games fetched',
        message: 'Roblox API may be unavailable',
        timestamp,
        colo,
        diagnostics
      }, 500);
    }

    if (result.games.length === 0) {
      const status = {
        success: false,
        timestamp,
        colo,
        error: 'All games filtered out',
        rawCount: result.rawCount,
        filteredCount: 0,
        diagnostics
      };
      await saveStatus(env, status);

      return jsonResponse({
        error: 'No games passed filter',
        rawCount: result.rawCount,
        filteredCount: 0,
        filter: `playing >= ${MIN_PLAYING} OR visits >= ${MIN_VISITS_FALLBACK}`,
        timestamp,
        colo,
        diagnostics
      }, 500);
    }

    // Store in KV
    const poolData = {
      updatedAt: timestamp,
      source: 'roblox public api',
      count: result.games.length,
      items: result.games
    };

    await env.ROBPROFILE_CACHE.put(CACHE_KEY, JSON.stringify(poolData), {
      expirationTtl: 6 * 60 * 60 // 6 hours
    });

    // Save success status
    const status = {
      success: true,
      timestamp,
      colo,
      rawCount: result.rawCount,
      filteredCount: result.games.length,
      sources: result.sources
    };
    await saveStatus(env, status);

    return jsonResponse({
      success: true,
      message: `Stored ${result.games.length} games in KV`,
      updatedAt: timestamp,
      colo,
      rawCount: result.rawCount,
      filteredCount: result.games.length,
      sources: result.sources,
      sample: result.games.slice(0, 3).map(g => ({ name: g.name, playing: g.playing, tags: g.tags }))
    });

  } catch (err) {
    const status = {
      success: false,
      timestamp,
      colo,
      error: err.message,
      stack: err.stack?.slice(0, 500),
      diagnostics
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
      expirationTtl: 24 * 60 * 60 // 24 hours
    });
  } catch (e) {
    console.error('Failed to save status:', e);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Tracked fetch with diagnostics
 */
async function trackedFetch(url, label) {
  const startTime = Date.now();
  let response;
  let bodyPreview = '';

  try {
    response = await fetch(url);
    const text = await response.text();
    bodyPreview = text.slice(0, 300);

    diagnostics.requests.push({
      label,
      url,
      status: response.status,
      ok: response.ok,
      bodyPreview: response.ok ? '(success)' : bodyPreview,
      durationMs: Date.now() - startTime
    });

    if (response.ok) {
      return { ok: true, data: JSON.parse(text) };
    } else {
      return { ok: false, status: response.status, body: bodyPreview };
    }
  } catch (e) {
    diagnostics.errors.push({
      label,
      url,
      error: e.message,
      durationMs: Date.now() - startTime
    });
    return { ok: false, error: e.message };
  }
}

/**
 * Fetch games from multiple Roblox API sources
 */
async function fetchAllGames() {
  const allGames = new Map();
  const sources = {
    gamesApi: { attempted: 0, success: 0, games: 0 },
    discoverApi: { attempted: 0, success: 0, games: 0 }
  };

  // Source 1: Games API - Popular sorts
  const sortTokens = ['GamesPageMostEngagingSort', 'GamesPageHomeSorts'];

  for (const sortToken of sortTokens) {
    sources.gamesApi.attempted++;
    const url = `https://games.roblox.com/v1/games/list?model.sortToken=${sortToken}&model.maxRows=50`;
    const result = await trackedFetch(url, `games-api-${sortToken}`);

    if (result.ok) {
      sources.gamesApi.success++;
      const gameEntries = result.data.games || [];
      sources.gamesApi.games += gameEntries.length;

      for (const g of gameEntries) {
        if (g.universeId && !allGames.has(g.universeId)) {
          allGames.set(g.universeId, {
            universeId: g.universeId,
            placeId: g.placeId
          });
        }
      }
    }
  }

  // Source 2: Discover API (explore-api)
  const sessionId = crypto.randomUUID();
  const sortsUrl = `https://apis.roblox.com/explore-api/v1/get-sorts?sessionId=${sessionId}`;
  const sortsResult = await trackedFetch(sortsUrl, 'discover-sorts');

  if (sortsResult.ok) {
    const sorts = sortsResult.data.sorts || [];
    const usefulSorts = sorts.slice(0, 3);

    for (const sort of usefulSorts) {
      sources.discoverApi.attempted++;
      const sortId = sort.topicId || sort.sortId || sort.token;
      const contentUrl = `https://apis.roblox.com/explore-api/v1/get-sort-content?sessionId=${sessionId}&sortId=${sortId}`;
      const contentResult = await trackedFetch(contentUrl, `discover-content-${sortId}`);

      if (contentResult.ok) {
        sources.discoverApi.success++;
        const experiences = contentResult.data.experiences || contentResult.data.games || [];
        sources.discoverApi.games += experiences.length;

        for (const exp of experiences) {
          const universeId = exp.universeId || exp.placeId;
          if (universeId && !allGames.has(universeId)) {
            allGames.set(universeId, {
              universeId,
              placeId: exp.placeId || exp.rootPlaceId
            });
          }
        }
      }
    }
  }

  const rawCount = allGames.size;

  if (rawCount === 0) {
    return { games: [], rawCount: 0, sources };
  }

  // Fetch full metadata for all collected games
  const universeIds = Array.from(allGames.keys());
  const gamesWithMeta = await fetchGamesMetadata(universeIds);

  // Filter and tag games
  const filteredGames = gamesWithMeta
    .filter(g => {
      if (g.playing >= MIN_PLAYING) return true;
      if (!g.playing && g.visits >= MIN_VISITS_FALLBACK) return true;
      return false;
    })
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
      iconUrl: `https://thumbnails.roblox.com/v1/games/icons?universeIds=${g.universeId}&size=150x150&format=Png`,
      gameUrl: `https://www.roblox.com/games/${g.rootPlaceId}`,
      tags: generateTags(g)
    }));

  return {
    games: filteredGames,
    rawCount: gamesWithMeta.length,
    sources
  };
}

/**
 * Batch fetch game metadata
 */
async function fetchGamesMetadata(universeIds) {
  const games = [];
  const batchSize = 100;

  for (let i = 0; i < universeIds.length; i += batchSize) {
    const batch = universeIds.slice(i, i + batchSize);
    const url = `https://games.roblox.com/v1/games?universeIds=${batch.join(',')}`;
    const result = await trackedFetch(url, `metadata-batch-${i}`);

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
    }
  }

  return games;
}
