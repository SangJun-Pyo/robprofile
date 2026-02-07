// Recommendation Engine v2 - Discover/Charts based recommendations
// Uses Roblox explore-api + custom tagging system

// Archetype → Tag mapping for scoring
export const ARCHETYPE_TO_TAGS = {
  explorer: {
    want: ['adventure', 'openworld', 'exploration', 'story', 'quest', 'horror', 'survival', 'mystery'],
    avoid: ['idle', 'afk', 'simulator']
  },
  grinder: {
    want: ['simulator', 'tycoon', 'idle', 'upgrade', 'farm', 'grind', 'incremental', 'rebirth'],
    avoid: ['pvp', 'competitive']
  },
  socializer: {
    want: ['social', 'hangout', 'party', 'cafe', 'roleplay', 'town', 'life', 'friends'],
    avoid: ['pvp', 'shooter', 'fps']
  },
  competitor: {
    want: ['pvp', 'fps', 'shooter', 'arena', 'ranked', 'battle', 'fighting', 'combat', 'war'],
    avoid: ['idle', 'afk', 'hangout']
  },
  builder: {
    want: ['build', 'sandbox', 'create', 'design', 'craft', 'construct', 'creative', 'architect'],
    avoid: ['pvp', 'shooter']
  },
  trader: {
    want: ['trade', 'trading', 'market', 'economy', 'shop', 'business', 'tycoon', 'money'],
    avoid: ['obby', 'parkour']
  },
  roleplayer: {
    want: ['roleplay', 'rp', 'life', 'story', 'family', 'school', 'hospital', 'brookhaven', 'bloxburg'],
    avoid: ['simulator', 'idle', 'pvp']
  },
  casual: {
    want: ['obby', 'minigame', 'casual', 'easy', 'parkour', 'escape', 'tower', 'race', 'fun'],
    avoid: ['grind', 'competitive', 'ranked']
  }
};

// Genre to tag mapping
const GENRE_TO_TAGS = {
  'Adventure': ['adventure', 'exploration'],
  'Horror': ['horror', 'story'],
  'Survival': ['survival', 'adventure'],
  'RPG': ['story', 'quest', 'adventure'],
  'Simulation': ['simulator'],
  'Tycoon': ['tycoon', 'simulator', 'business'],
  'Fighting': ['pvp', 'fighting', 'combat'],
  'FPS': ['fps', 'shooter', 'pvp'],
  'Sports': ['sports', 'competitive'],
  'Town and City': ['social', 'life', 'roleplay', 'town'],
  'Comedy': ['casual', 'fun'],
  'Sci-Fi': ['adventure', 'story'],
  'Fantasy': ['story', 'roleplay', 'adventure'],
  'Naval': ['adventure', 'pvp'],
  'Military': ['pvp', 'shooter', 'battle'],
  'Building': ['build', 'sandbox', 'creative'],
  'Medieval': ['roleplay', 'story', 'pvp'],
  'All Genres': []
};

// Keyword detection for tagging
const KEYWORD_TAGS = [
  { keywords: ['simulator', 'sim'], tag: 'simulator' },
  { keywords: ['tycoon'], tag: 'tycoon' },
  { keywords: ['idle', 'afk'], tag: 'idle' },
  { keywords: ['obby', 'obstacle'], tag: 'obby' },
  { keywords: ['parkour'], tag: 'parkour' },
  { keywords: ['roleplay', ' rp ', ' rp'], tag: 'roleplay' },
  { keywords: ['pvp'], tag: 'pvp' },
  { keywords: ['fps', 'shooter', 'gun'], tag: 'fps' },
  { keywords: ['trade', 'trading'], tag: 'trade' },
  { keywords: ['build', 'building', 'construct'], tag: 'build' },
  { keywords: ['sandbox'], tag: 'sandbox' },
  { keywords: ['survival'], tag: 'survival' },
  { keywords: ['horror', 'scary'], tag: 'horror' },
  { keywords: ['adventure', 'quest'], tag: 'adventure' },
  { keywords: ['hangout', 'chill'], tag: 'hangout' },
  { keywords: ['battle', 'war', 'fight'], tag: 'battle' },
  { keywords: ['arena'], tag: 'arena' },
  { keywords: ['escape'], tag: 'escape' },
  { keywords: ['tower'], tag: 'tower' },
  { keywords: ['race', 'racing'], tag: 'race' },
  { keywords: ['life', 'town', 'city'], tag: 'life' },
  { keywords: ['story', 'mystery'], tag: 'story' },
  { keywords: ['school', 'hospital', 'cafe', 'restaurant'], tag: 'social' },
  { keywords: ['family', 'adopt'], tag: 'family' },
  { keywords: ['upgrade', 'rebirth', 'prestige'], tag: 'upgrade' },
  { keywords: ['grind', 'farm'], tag: 'grind' },
  { keywords: ['minigame', 'mini game'], tag: 'minigame' },
  { keywords: ['easy', 'casual', 'simple'], tag: 'casual' },
  { keywords: ['ranked', 'competitive'], tag: 'ranked' }
];

/**
 * Generate tags for a game based on genre, name, and attributes
 */
export function generateGameTags(game) {
  const tags = new Set();
  const nameLower = (game.name || '').toLowerCase();
  const descLower = (game.description || '').toLowerCase();
  const textToSearch = `${nameLower} ${descLower}`;

  // 1. Genre-based tags
  const genreTags = GENRE_TO_TAGS[game.genre] || [];
  genreTags.forEach(tag => tags.add(tag));

  // 2. Keyword-based tags
  for (const { keywords, tag } of KEYWORD_TAGS) {
    for (const kw of keywords) {
      if (textToSearch.includes(kw)) {
        tags.add(tag);
        break;
      }
    }
  }

  // 3. maxPlayers-based tags (social/party indicator)
  if (game.maxPlayers && game.maxPlayers >= 50) {
    tags.add('social');
    tags.add('party');
  }

  // 4. Popularity-based tags
  if (game.playing && game.playing >= 10000) {
    tags.add('popular');
  }

  return Array.from(tags);
}

/**
 * Calculate recommendation score for a game based on user's archetype
 */
export function calculateRecommendationScore(game, archetypeScores) {
  const gameTags = game.tags || generateGameTags(game);

  let matchScore = 0;
  let totalWeight = 0;

  // Calculate weighted match score across all archetypes
  for (const [archetype, userScore] of Object.entries(archetypeScores)) {
    if (userScore <= 0) continue;

    const mapping = ARCHETYPE_TO_TAGS[archetype];
    if (!mapping) continue;

    let archetypeMatch = 0;

    // Count want tag matches
    const wantMatches = gameTags.filter(tag => mapping.want.includes(tag)).length;
    archetypeMatch += wantMatches * 0.3; // Each want match adds 0.3

    // Penalize avoid tag matches
    const avoidMatches = gameTags.filter(tag => mapping.avoid.includes(tag)).length;
    archetypeMatch -= avoidMatches * 0.2; // Each avoid match subtracts 0.2

    // Cap at 1.0
    archetypeMatch = Math.min(Math.max(archetypeMatch, 0), 1);

    matchScore += archetypeMatch * userScore;
    totalWeight += userScore;
  }

  // Normalize match score (0-1)
  const normalizedMatch = totalWeight > 0 ? matchScore / totalWeight : 0;

  // Popularity score (log scale, 0-1)
  const popularityScore = calculatePopularityScore(game.playing, game.visits);

  // Freshness score (0-1)
  const freshnessScore = calculateFreshnessScore(game.updated);

  // Final score: 55% match + 30% popularity + 15% freshness
  const finalScore = Math.round(
    100 * (0.55 * normalizedMatch + 0.30 * popularityScore + 0.15 * freshnessScore)
  );

  return Math.min(Math.max(finalScore, 0), 100);
}

function calculatePopularityScore(playing, visits) {
  // Prioritize current players (playing) over total visits
  if (!playing && !visits) return 0.3;

  let score = 0;

  // Playing score (0-0.6)
  if (playing) {
    // Log scale: 500 = 0.3, 5000 = 0.45, 50000 = 0.6
    const logPlaying = Math.log10(playing + 1);
    score += Math.min((logPlaying - 2.7) / 2.5, 0.6) * 0.6;
  }

  // Visits score (0-0.4)
  if (visits) {
    // Log scale: 1M = 0.2, 100M = 0.3, 1B = 0.4
    const logVisits = Math.log10(visits + 1);
    score += Math.min(logVisits / 10, 0.4) * 0.4;
  }

  return Math.min(score + 0.3, 1); // Base 0.3 + calculated
}

function calculateFreshnessScore(updatedDate) {
  if (!updatedDate) return 0.5;

  const updated = new Date(updatedDate);
  const now = new Date();
  const daysSinceUpdate = (now - updated) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate < 7) return 1.0;    // Updated within a week
  if (daysSinceUpdate < 30) return 0.85;  // Within a month
  if (daysSinceUpdate < 90) return 0.7;   // Within 3 months
  if (daysSinceUpdate < 180) return 0.5;  // Within 6 months
  if (daysSinceUpdate < 365) return 0.3;  // Within a year
  return 0.2;                              // Older than a year
}

/**
 * Get recommendation reason based on primary archetype
 */
export function getRecommendationReason(primaryArchetype) {
  const reasons = {
    explorer: 'Great for discovering new adventures',
    grinder: 'Perfect for long-term progression',
    socializer: 'Ideal for meeting new friends',
    competitor: 'Challenge yourself against others',
    builder: 'Express your creativity',
    trader: 'Master the in-game economy',
    roleplayer: 'Immerse yourself in stories',
    casual: 'Quick fun without commitment'
  };
  return reasons[primaryArchetype] || 'Suggested for you';
}

/**
 * Fetch Discover/Charts games from Roblox
 */
export async function fetchDiscoverGames(minPlaying = 500) {
  const games = new Map();

  try {
    // Generate a session ID
    const sessionId = crypto.randomUUID();

    // Step 1: Get sort list
    const sortsUrl = `https://apis.roblox.com/explore-api/v1/get-sorts?sessionId=${sessionId}`;
    const sortsResponse = await fetch(sortsUrl);

    if (!sortsResponse.ok) {
      console.error('Failed to fetch sorts:', sortsResponse.status);
      // Fallback: use games.roblox.com popular games
      return await fetchFallbackGames(minPlaying);
    }

    const sortsData = await sortsResponse.json();
    const sorts = sortsData.sorts || [];

    // Find useful sort IDs (Popular, Trending, Top Rated, etc.)
    const targetSortTokens = ['Popular', 'PopularWorldwide', 'TopRated', 'MostEngaging', 'Trending'];
    const usefulSorts = sorts.filter(s =>
      targetSortTokens.some(t => s.token?.includes(t) || s.name?.includes(t))
    ).slice(0, 3); // Take up to 3 sorts

    if (usefulSorts.length === 0 && sorts.length > 0) {
      // Use first available sort
      usefulSorts.push(sorts[0]);
    }

    // Step 2: Get content for each sort
    for (const sort of usefulSorts) {
      try {
        const contentUrl = `https://apis.roblox.com/explore-api/v1/get-sort-content?sessionId=${sessionId}&sortId=${sort.topicId || sort.sortId || sort.token}`;
        const contentResponse = await fetch(contentUrl);

        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          const experiences = contentData.experiences || contentData.games || [];

          for (const exp of experiences) {
            const universeId = exp.universeId || exp.placeId;
            if (universeId && !games.has(universeId)) {
              games.set(universeId, {
                universeId,
                placeId: exp.placeId || exp.rootPlaceId
              });
            }
          }
        }
      } catch (e) {
        console.error('Error fetching sort content:', e);
      }
    }
  } catch (e) {
    console.error('Error in fetchDiscoverGames:', e);
    return await fetchFallbackGames(minPlaying);
  }

  if (games.size === 0) {
    return await fetchFallbackGames(minPlaying);
  }

  // Step 3: Fetch full metadata for all games
  const universeIds = Array.from(games.keys());
  const gamesWithMeta = await fetchGamesMetadataBatch(universeIds);

  // Step 4: Filter by minPlaying and add tags
  const filteredGames = gamesWithMeta
    .filter(g => g.playing >= minPlaying)
    .map(g => ({
      ...g,
      tags: generateGameTags(g),
      iconUrl: `https://thumbnails.roblox.com/v1/games/icons?universeIds=${g.universeId}&size=150x150&format=Png&isCircular=false`,
      gameUrl: `https://www.roblox.com/games/${g.rootPlaceId}`
    }));

  return filteredGames;
}

/**
 * Fallback: fetch popular games directly from games.roblox.com
 */
async function fetchFallbackGames(minPlaying = 500) {
  try {
    // Use games.roblox.com/v1/games/list with popular sort
    const url = 'https://games.roblox.com/v1/games/list?model.sortToken=GamesPageMostEngagingSort&model.gameFilters=0&model.maxRows=50';
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Fallback games fetch failed:', response.status);
      return [];
    }

    const data = await response.json();
    const gameEntries = data.games || [];

    // Extract universe IDs
    const universeIds = gameEntries
      .map(g => g.universeId)
      .filter(id => id);

    if (universeIds.length === 0) return [];

    // Fetch full metadata
    const gamesWithMeta = await fetchGamesMetadataBatch(universeIds);

    return gamesWithMeta
      .filter(g => g.playing >= minPlaying)
      .map(g => ({
        ...g,
        tags: generateGameTags(g),
        iconUrl: `https://thumbnails.roblox.com/v1/games/icons?universeIds=${g.universeId}&size=150x150&format=Png&isCircular=false`,
        gameUrl: `https://www.roblox.com/games/${g.rootPlaceId}`
      }));
  } catch (e) {
    console.error('Fallback fetch error:', e);
    return [];
  }
}

/**
 * Batch fetch game metadata from games.roblox.com
 */
async function fetchGamesMetadataBatch(universeIds) {
  const games = [];
  const batchSize = 100;

  for (let i = 0; i < universeIds.length; i += batchSize) {
    const batch = universeIds.slice(i, i + batchSize);
    const url = `https://games.roblox.com/v1/games?universeIds=${batch.join(',')}`;

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        for (const game of (data.data || [])) {
          games.push({
            universeId: game.id,
            rootPlaceId: game.rootPlaceId,
            name: game.name,
            description: game.description,
            genre: game.genre,
            playing: game.playing,
            visits: game.visits,
            maxPlayers: game.maxPlayers,
            created: game.created,
            updated: game.updated,
            creator: game.creator
          });
        }
      }
    } catch (e) {
      console.error('Batch metadata fetch error:', e);
    }
  }

  return games;
}

/**
 * Get personalized recommendations for a user
 */
export async function getPersonalizedRecommendations(archetypeScores, limit = 20) {
  // Fetch discover games
  const discoverGames = await fetchDiscoverGames(500);

  if (discoverGames.length === 0) {
    return [];
  }

  // Score each game
  const scoredGames = discoverGames.map(game => ({
    ...game,
    recommendationScore: calculateRecommendationScore(game, archetypeScores),
    recommendationReason: getRecommendationReason(
      Object.entries(archetypeScores).sort((a, b) => b[1] - a[1])[0][0]
    )
  }));

  // Sort by score and return top N
  scoredGames.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return scoredGames.slice(0, limit);
}
