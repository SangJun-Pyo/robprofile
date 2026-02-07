// GET /api/detail/[userId]
// Detailed analysis: badges → games reverse mapping + engagement scoring

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

    // Step 3: Extract unique universeIds from badges
    const universeMap = new Map(); // universeId -> { badges: [], count: 0 }

    for (const badge of allBadges) {
      const universeId = badge.awarder?.id;
      if (!universeId) continue;

      if (!universeMap.has(universeId)) {
        universeMap.set(universeId, {
          universeId,
          badges: [],
          badgeCount: 0
        });
      }

      const entry = universeMap.get(universeId);
      entry.badges.push({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        imageUrl: badge.imageUrl
      });
      entry.badgeCount++;
    }

    // Step 4: Fetch game metadata for unique universes (batch request)
    const universeIds = Array.from(universeMap.keys());
    const gamesMetadata = await fetchGamesMetadata(universeIds);

    // Step 5: Merge game metadata with badge data and calculate engagement
    const games = [];
    const maxBadgeCount = Math.max(...Array.from(universeMap.values()).map(e => e.badgeCount), 1);

    for (const [universeId, entry] of universeMap) {
      const gameMeta = gamesMetadata[universeId];
      if (!gameMeta) continue;

      // Calculate engagement score (0-100)
      const engagementScore = Math.round((entry.badgeCount / maxBadgeCount) * 100);

      games.push({
        universeId,
        name: gameMeta.name,
        description: gameMeta.description,
        creator: gameMeta.creator,
        rootPlaceId: gameMeta.rootPlaceId,
        genre: gameMeta.genre,
        playing: gameMeta.playing,
        visits: gameMeta.visits,
        maxPlayers: gameMeta.maxPlayers,
        iconUrl: `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=150x150&format=Png&isCircular=false`,
        badgeCount: entry.badgeCount,
        engagementScore,
        badges: entry.badges.slice(0, 5) // Top 5 badges per game
      });
    }

    // Sort by engagement score (badge count)
    games.sort((a, b) => b.engagementScore - a.engagementScore);

    // Step 6: Fetch avatar thumbnail
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

    // Step 7: Fetch groups for additional context
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

    // Step 8: Calculate detailed archetype scores
    const archetypeScores = calculateDetailedArchetypeScores(games, allBadges, groups, profile);

    // Step 9: Build response
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
        uniqueGames: games.length,
        totalGroups: groups.length,
        accountAgeDays: Math.floor((Date.now() - new Date(profile.created).getTime()) / (1000 * 60 * 60 * 24))
      },
      games: games.slice(0, 50), // Top 50 games by engagement
      archetypeScores,
      groups: groups.slice(0, 20) // Top 20 groups
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
  const limit = 100; // Max per request

  while (badges.length < maxBadges) {
    const url = new URL(`https://badges.roblox.com/v1/users/${userId}/badges`);
    url.searchParams.set('limit', limit);
    url.searchParams.set('sortOrder', 'Desc'); // Most recent first
    if (cursor) {
      url.searchParams.set('cursor', cursor);
    }

    const response = await fetch(url.toString());
    if (!response.ok) break;

    const data = await response.json();
    badges.push(...(data.data || []));

    cursor = data.nextPageCursor;
    if (!cursor) break; // No more pages
  }

  return badges.slice(0, maxBadges);
}

// Fetch game metadata in batches
async function fetchGamesMetadata(universeIds) {
  const metadata = {};
  if (universeIds.length === 0) return metadata;

  // Batch in groups of 100 (API limit)
  const batchSize = 100;
  for (let i = 0; i < universeIds.length; i += batchSize) {
    const batch = universeIds.slice(i, i + batchSize);
    const url = `https://games.roblox.com/v1/games?universeIds=${batch.join(',')}`;

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        for (const game of (data.data || [])) {
          metadata[game.id] = game;
        }
      }
    } catch (e) {
      console.error('Games metadata fetch error:', e);
    }
  }

  return metadata;
}

// Calculate archetype scores based on detailed game/badge/group analysis
function calculateDetailedArchetypeScores(games, badges, groups, profile) {
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

  // Genre keywords mapping
  const genreKeywords = {
    explorer: ['adventure', 'explore', 'discover', 'world', 'travel', 'quest', 'mystery', 'horror', 'survival'],
    grinder: ['simulator', 'tycoon', 'idle', 'clicker', 'farm', 'grind', 'afk', 'upgrade', 'incremental'],
    socializer: ['hangout', 'chat', 'party', 'club', 'social', 'friends', 'cafe', 'restaurant', 'town'],
    competitor: ['pvp', 'fight', 'battle', 'war', 'arena', 'tournament', 'ranked', 'fps', 'shooter', 'combat', 'sword'],
    builder: ['build', 'create', 'studio', 'design', 'craft', 'sandbox', 'block', 'construct', 'architect'],
    trader: ['trade', 'trading', 'market', 'economy', 'shop', 'sell', 'buy', 'limited', 'merchant'],
    roleplayer: ['roleplay', 'rp', 'story', 'life', 'adopt', 'family', 'school', 'hospital', 'brookhaven', 'bloxburg'],
    casual: ['obby', 'minigame', 'fun', 'easy', 'simple', 'casual', 'escape', 'parkour', 'race']
  };

  // 1. Analyze games by name/genre (weighted by engagement)
  for (const game of games) {
    const text = `${game.name} ${game.description || ''} ${game.genre || ''}`.toLowerCase();
    const weight = game.engagementScore / 100; // 0-1

    for (const [archetype, keywords] of Object.entries(genreKeywords)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          scores[archetype] += 3 * weight; // Weighted by engagement
        }
      }
    }
  }

  // 2. Analyze badges
  for (const badge of badges) {
    const text = `${badge.name} ${badge.description || ''}`.toLowerCase();
    for (const [archetype, keywords] of Object.entries(genreKeywords)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          scores[archetype] += 0.5;
        }
      }
    }
  }

  // 3. Analyze groups
  for (const g of groups) {
    const text = (g.group?.name || '').toLowerCase();
    for (const [archetype, keywords] of Object.entries(genreKeywords)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          scores[archetype] += 2;
        }
      }
    }
  }

  // 4. Apply meta-signals
  // Many unique games = Explorer
  if (games.length > 20) scores.explorer += 5;
  if (games.length > 40) scores.explorer += 5;

  // Many badges in few games = Grinder
  const avgBadgesPerGame = badges.length / Math.max(games.length, 1);
  if (avgBadgesPerGame > 3) scores.grinder += 5;
  if (avgBadgesPerGame > 5) scores.grinder += 5;

  // Many groups = Socializer
  if (groups.length > 10) scores.socializer += 3;
  if (groups.length > 20) scores.socializer += 5;

  // Account age signals
  const accountAgeDays = Math.floor((Date.now() - new Date(profile.created).getTime()) / (1000 * 60 * 60 * 24));
  if (accountAgeDays > 365 * 3) scores.grinder += 3; // 3+ years = dedicated
  if (accountAgeDays < 180 && badges.length < 20) scores.casual += 5; // New + few badges = casual

  // 5. Normalize scores
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const normalized = {};
  for (const [key, value] of Object.entries(scores)) {
    normalized[key] = Math.round((value / total) * 100) / 100;
  }

  // 6. Sort and determine primary/secondary
  const sorted = Object.entries(normalized).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0][0];
  const secondary = sorted[1][0];

  // 7. Calculate confidence
  const signalStrength = Math.min((badges.length + games.length * 2 + groups.length) / 100, 1);
  const margin = sorted[0][1] - sorted[1][1];
  const confidence = Math.min(0.5 * signalStrength + 0.5 * margin * 2, 0.95);

  return {
    scores: normalized,
    primary,
    secondary,
    confidence: Math.max(confidence, 0.3)
  };
}
