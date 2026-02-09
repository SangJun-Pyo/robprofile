// GET /api/recommend?userId=...
// Returns personalized game recommendations based on user's archetype scores

import { calculateRecommendScore } from '../lib/tags-config.js';
import { CACHE_KEY } from '../lib/constants.js';

const MAX_RECOMMENDATIONS = 12;

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const branch = env.CF_PAGES_BRANCH || 'unknown';

  // Validate userId
  if (!userId || !/^\d+$/.test(userId)) {
    return new Response(JSON.stringify({ error: 'Invalid userId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // (a) KV binding 존재 여부
  const kvExists = !!env.ROBPROFILE_CACHE;
  console.log(`[recommend] (a) KV binding exists: ${kvExists}`);

  if (!kvExists) {
    console.log('[recommend] KV binding missing — falling back to live API');
    return await fallbackRecommendations(userId, null, branch);
  }

  try {
    // Step 1: Get user's archetype scores
    const archetypeData = await fetchUserArchetype(userId);

    if (!archetypeData) {
      return new Response(JSON.stringify({ error: 'Failed to analyze user' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // (b) KV key 이름
    console.log(`[recommend] (b) KV key: "${CACHE_KEY}"`);

    // Step 2: Load games pool from KV (raw string first for diagnostics)
    const rawString = await env.ROBPROFILE_CACHE.get(CACHE_KEY, 'text');

    // (c) raw string 길이
    const rawLen = rawString ? rawString.length : 0;
    console.log(`[recommend] (c) KV raw string length: ${rawLen}`);

    // (d) JSON.parse
    let poolData = null;
    try {
      if (rawString) {
        poolData = JSON.parse(rawString);
        console.log('[recommend] (d) JSON.parse: success');
      } else {
        console.log('[recommend] (d) JSON.parse: skipped (empty value)');
      }
    } catch (parseErr) {
      console.error(`[recommend] (d) JSON.parse: FAILED — ${parseErr.message}`);
      return new Response(JSON.stringify({
        error: 'KV data corrupted',
        details: parseErr.message,
        branch
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // (e) pool 배열 길이
    const poolLen = poolData?.items?.length ?? 0;
    console.log(`[recommend] (e) pool items length: ${poolLen}`);

    // (f) 실행 환경
    const colo = request.cf?.colo || 'unknown';
    console.log(`[recommend] (f) env: branch=${branch}, colo=${colo}`);

    if (!poolData || !poolData.items || poolData.items.length === 0) {
      console.log('[recommend] Pool empty — falling back to live API');
      return await fallbackRecommendations(userId, archetypeData, branch);
    }

    // Step 3: Score each game
    const scoredGames = poolData.items.map(game => {
      const { score, matchedTags } = calculateRecommendScore(game, archetypeData.scores);
      return {
        ...game,
        recommendScore: score,
        why: matchedTags
      };
    });

    // Step 4: Sort by score and take top N
    scoredGames.sort((a, b) => b.recommendScore - a.recommendScore);
    const recommendations = scoredGames.slice(0, MAX_RECOMMENDATIONS);

    return new Response(JSON.stringify({
      updatedAt: poolData.updatedAt,
      branch,
      basis: {
        primary: archetypeData.primary,
        secondary: archetypeData.secondary,
        confidence: archetypeData.confidence
      },
      recommendations: recommendations.map(g => ({
        universeId: g.universeId,
        placeId: g.placeId,
        name: g.name,
        genre: g.genre,
        playing: g.playing,
        visits: g.visits,
        iconUrl: g.iconUrl,
        gameUrl: g.gameUrl,
        tags: g.tags,
        recommendScore: g.recommendScore,
        why: g.why
      }))
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      }
    });

  } catch (err) {
    console.error('Recommend error:', err);
    return new Response(JSON.stringify({
      error: 'Recommendation failed',
      details: err.message,
      branch
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Fetch user's archetype scores from detail API logic
 */
async function fetchUserArchetype(userId) {
  try {
    // Fetch badges
    const badgesUrl = `https://badges.roblox.com/v1/users/${userId}/badges?limit=100&sortOrder=Desc`;
    const badgesResponse = await fetch(badgesUrl);
    const badges = badgesResponse.ok ? (await badgesResponse.json()).data || [] : [];

    // Fetch groups
    const groupsUrl = `https://groups.roblox.com/v2/users/${userId}/groups/roles`;
    const groupsResponse = await fetch(groupsUrl);
    const groups = groupsResponse.ok ? (await groupsResponse.json()).data || [] : [];

    // Fetch profile for account age
    const profileUrl = `https://users.roblox.com/v1/users/${userId}`;
    const profileResponse = await fetch(profileUrl);
    const profile = profileResponse.ok ? await profileResponse.json() : {};

    // Calculate archetype scores (simplified version)
    return calculateArchetypeScores(badges, groups, profile);
  } catch (e) {
    console.error('Archetype fetch error:', e);
    return null;
  }
}

/**
 * Calculate archetype scores from badges and groups
 */
function calculateArchetypeScores(badges, groups, profile) {
  const keywords = {
    explorer: ['adventure', 'explore', 'discover', 'world', 'quest', 'mystery', 'horror', 'survival'],
    grinder: ['simulator', 'tycoon', 'idle', 'upgrade', 'farm', 'grind', 'rebirth'],
    socializer: ['social', 'hangout', 'party', 'cafe', 'roleplay', 'town', 'life', 'friends'],
    competitor: ['pvp', 'fps', 'shooter', 'arena', 'ranked', 'battle', 'fighting', 'combat', 'war'],
    builder: ['build', 'sandbox', 'create', 'design', 'craft', 'construct', 'creative'],
    trader: ['trade', 'trading', 'market', 'economy', 'shop', 'business', 'tycoon', 'money'],
    roleplayer: ['roleplay', 'rp', 'life', 'story', 'family', 'school', 'hospital'],
    casual: ['obby', 'minigame', 'casual', 'easy', 'parkour', 'escape', 'tower', 'race', 'fun']
  };

  const scores = {
    explorer: 0, grinder: 0, socializer: 0, competitor: 0,
    builder: 0, trader: 0, roleplayer: 0, casual: 0
  };

  // Analyze badges
  for (const badge of badges) {
    const text = `${badge.name} ${badge.description || ''}`.toLowerCase();
    for (const [archetype, kws] of Object.entries(keywords)) {
      for (const kw of kws) {
        if (text.includes(kw)) {
          scores[archetype] += 1;
        }
      }
    }
  }

  // Analyze groups (weighted more)
  for (const g of groups) {
    const text = (g.group?.name || '').toLowerCase();
    for (const [archetype, kws] of Object.entries(keywords)) {
      for (const kw of kws) {
        if (text.includes(kw)) {
          scores[archetype] += 2;
        }
      }
    }
  }

  // Meta signals
  if (badges.length > 50) scores.grinder += 3;
  if (badges.length > 100) scores.grinder += 5;
  if (groups.length > 10) scores.socializer += 3;
  if (groups.length > 20) scores.socializer += 5;

  // Account age
  if (profile.created) {
    const accountAgeDays = Math.floor((Date.now() - new Date(profile.created).getTime()) / (1000 * 60 * 60 * 24));
    if (accountAgeDays > 365 * 3) scores.grinder += 3;
    if (accountAgeDays < 180 && badges.length < 20) scores.casual += 5;
  }

  // Normalize
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const normalized = {};
  for (const [key, value] of Object.entries(scores)) {
    normalized[key] = Math.round((value / total) * 100) / 100;
  }

  // Determine primary/secondary
  const sorted = Object.entries(normalized).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0][0];
  const secondary = sorted[1][0];

  // Confidence
  const signalStrength = Math.min((badges.length + groups.length * 2) / 80, 1);
  const margin = sorted[0][1] - sorted[1][1];
  const confidence = Math.min(0.5 * signalStrength + 0.5 * margin * 2, 0.95);

  return {
    scores: normalized,
    primary,
    secondary,
    confidence: Math.max(confidence, 0.3)
  };
}

/**
 * Fallback: fetch recommendations directly from Roblox API
 */
async function fallbackRecommendations(userId, archetypeData = null, branch = 'unknown') {
  try {
    // Get archetype if not provided
    if (!archetypeData) {
      archetypeData = await fetchUserArchetype(userId);
    }

    if (!archetypeData) {
      return new Response(JSON.stringify({ error: 'Failed to analyze user' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch popular games directly
    const url = 'https://games.roblox.com/v1/games/list?model.sortToken=GamesPageMostEngagingSort&model.maxRows=50';
    const response = await fetch(url);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch games' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const gameEntries = data.games || [];

    // Get metadata for these games (chunk to avoid 400)
    const universeIds = gameEntries.map(g => g.universeId).filter(Boolean);
    const idsBatch = universeIds.slice(0, 50);
    const metaUrl = `https://games.roblox.com/v1/games?universeIds=${idsBatch.join(',')}`;
    const metaResponse = await fetch(metaUrl);
    const metaData = metaResponse.ok ? await metaResponse.json() : { data: [] };

    // Resolve thumbnail CDN URLs
    const thumbUrl = `https://thumbnails.roblox.com/v1/games/icons?universeIds=${idsBatch.join(',')}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`;
    const thumbResponse = await fetch(thumbUrl);
    const thumbData = thumbResponse.ok ? await thumbResponse.json() : { data: [] };
    const thumbMap = new Map();
    for (const entry of (thumbData.data || [])) {
      if (entry.imageUrl && entry.state === 'Completed') {
        thumbMap.set(entry.targetId, entry.imageUrl);
      }
    }

    // Process games
    const { generateTags } = await import('../lib/tags-config.js');

    const games = (metaData.data || [])
      .filter(g => g.playing >= 500)
      .map(g => {
        const tags = generateTags(g);
        const { score, matchedTags } = calculateRecommendScore({ ...g, tags }, archetypeData.scores);
        return {
          universeId: g.id,
          placeId: g.rootPlaceId,
          name: g.name,
          genre: g.genre,
          playing: g.playing,
          visits: g.visits,
          iconUrl: thumbMap.get(g.id) || '',
          gameUrl: `https://www.roblox.com/games/${g.rootPlaceId}`,
          tags,
          recommendScore: score,
          why: matchedTags
        };
      });

    games.sort((a, b) => b.recommendScore - a.recommendScore);

    return new Response(JSON.stringify({
      updatedAt: new Date().toISOString(),
      source: 'live_fallback',
      branch,
      basis: {
        primary: archetypeData.primary,
        secondary: archetypeData.secondary,
        confidence: archetypeData.confidence
      },
      recommendations: games.slice(0, MAX_RECOMMENDATIONS)
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60'
      }
    });

  } catch (err) {
    console.error('Fallback error:', err);
    return new Response(JSON.stringify({
      error: 'Fallback failed',
      details: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
