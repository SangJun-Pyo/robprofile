// GET /api/detail/[userId]
// Detailed analysis with Discover-based personalized game recommendations

import {
  ARCHETYPE_TO_TAGS,
  generateGameTags,
  calculateRecommendationScore,
  getRecommendationReason,
  getPersonalizedRecommendations
} from '../../lib/recommendation.js';

export async function onRequestGet(context) {
  const { params } = context;
  const userId = params.userId;

  // Validate userId
  if (!userId || !/^\d+$/.test(userId)) {
    return new Response(
      JSON.stringify({ error: 'Invalid user ID' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Step 1: Fetch user profile
    const profileResponse = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    if (!profileResponse.ok) {
      if (profileResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('Failed to fetch profile');
    }
    const profile = await profileResponse.json();

    // Step 2: Fetch badges with pagination (up to 200)
    const allBadges = await fetchBadgesWithPagination(userId, 200);

    // Step 3: Fetch groups
    let groups = [];
    try {
      const groupsResponse = await fetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        groups = groupsData.data || [];
      }
    } catch (e) {
      console.error('Groups fetch error:', e);
    }

    // Step 4: Fetch avatar thumbnail
    let avatarUrl = null;
    try {
      const thumbResponse = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
      );
      if (thumbResponse.ok) {
        const thumbData = await thumbResponse.json();
        avatarUrl = thumbData.data?.[0]?.imageUrl || null;
      }
    } catch (e) {
      console.error('Avatar fetch error:', e);
    }

    // Step 5: Calculate archetype scores
    const archetypeScores = calculateDetailedArchetypeScores(allBadges, groups, profile);

    // Step 6: Get personalized recommendations from Discover/Charts
    const recommendations = await getPersonalizedRecommendations(archetypeScores.scores, 25);

    // Step 7: Build response
    const response = {
      profile: {
        id: profile.id,
        name: profile.name,
        displayName: profile.displayName,
        description: profile.description,
        created: profile.created,
        isBanned: profile.isBanned,
        hasVerifiedBadge: profile.hasVerifiedBadge
      },
      avatarUrl,
      stats: {
        totalBadges: allBadges.length,
        totalGroups: groups.length,
        accountAgeDays: Math.floor((Date.now() - new Date(profile.created).getTime()) / (1000 * 60 * 60 * 24))
      },
      archetypeScores,
      recommendations,
      groups: groups.slice(0, 20)
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 min cache
      }
    });

  } catch (err) {
    console.error('Detail analysis error:', err);
    return new Response(
      JSON.stringify({ error: 'Analysis failed', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Fetch badges with pagination
async function fetchBadgesWithPagination(userId, maxBadges) {
  const badges = [];
  let cursor = null;
  const limit = 100;

  while (badges.length < maxBadges) {
    const url = new URL(`https://badges.roblox.com/v1/users/${userId}/badges`);
    url.searchParams.set('limit', limit);
    url.searchParams.set('sortOrder', 'Desc');
    if (cursor) {
      url.searchParams.set('cursor', cursor);
    }

    const response = await fetch(url.toString());
    if (!response.ok) break;

    const data = await response.json();
    badges.push(...(data.data || []));

    cursor = data.nextPageCursor;
    if (!cursor) break;
  }

  return badges.slice(0, maxBadges);
}

// Calculate archetype scores based on badges and groups
function calculateDetailedArchetypeScores(badges, groups, profile) {
  const scores = {
    explorer: 0,
    grinder: 0,
    socializer: 0,
    competitor: 0,
    builder: 0,
    trader: 0,
    roleplayer: 0,
    casual: 0
  };

  // Use ARCHETYPE_TO_TAGS for keyword matching
  const archetypeKeywords = {};
  for (const [archetype, mapping] of Object.entries(ARCHETYPE_TO_TAGS)) {
    archetypeKeywords[archetype] = mapping.want;
  }

  // 1. Analyze badges
  for (const badge of badges) {
    const text = `${badge.name} ${badge.description || ''}`.toLowerCase();
    for (const [archetype, keywords] of Object.entries(archetypeKeywords)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          scores[archetype] += 1;
        }
      }
    }
  }

  // 2. Analyze groups
  for (const g of groups) {
    const text = (g.group?.name || '').toLowerCase();
    for (const [archetype, keywords] of Object.entries(archetypeKeywords)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          scores[archetype] += 2;
        }
      }
    }
  }

  // 3. Apply meta-signals
  // Many badges = likely Grinder
  if (badges.length > 50) scores.grinder += 3;
  if (badges.length > 100) scores.grinder += 5;

  // Many groups = likely Socializer
  if (groups.length > 10) scores.socializer += 3;
  if (groups.length > 20) scores.socializer += 5;

  // Account age signals
  const accountAgeDays = Math.floor((Date.now() - new Date(profile.created).getTime()) / (1000 * 60 * 60 * 24));
  if (accountAgeDays > 365 * 3) scores.grinder += 3;
  if (accountAgeDays < 180 && badges.length < 20) scores.casual += 5;

  // 4. Normalize scores to 0-1
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const normalized = {};
  for (const [key, value] of Object.entries(scores)) {
    normalized[key] = Math.round((value / total) * 100) / 100;
  }

  // 5. Determine primary/secondary
  const sorted = Object.entries(normalized).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0][0];
  const secondary = sorted[1][0];

  // 6. Calculate confidence
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
