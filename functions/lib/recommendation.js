// Recommendation Rules & Engine
// Maps Archetypes to game preferences for personalized recommendations

export const RECOMMENDATION_RULES = {
  explorer: {
    name: 'Explorer',
    primaryGenres: ['Adventure', 'Horror', 'Survival'],
    secondaryGenres: ['RPG', 'Story', 'Puzzle'],
    keywords: ['explore', 'quest', 'world', 'mystery', 'adventure', 'discover', 'journey', 'travel', 'open world', 'horror', 'survival'],
    antiKeywords: ['simulator', 'tycoon', 'idle', 'afk'],
    scoring: {
      genreMatch: 0.35,
      keywordMatch: 0.25,
      popularity: 0.15,
      engagement: 0.15,
      freshness: 0.10
    },
    preferHighPlayers: false, // Explorers like hidden gems too
    reasonTemplate: 'Perfect for discovering new adventures'
  },

  grinder: {
    name: 'Grinder',
    primaryGenres: ['Simulation', 'Tycoon', 'Idle'],
    secondaryGenres: ['RPG', 'Strategy'],
    keywords: ['simulator', 'tycoon', 'idle', 'clicker', 'farm', 'grind', 'upgrade', 'rebirth', 'prestige', 'afk', 'incremental'],
    antiKeywords: ['pvp', 'battle', 'fight'],
    scoring: {
      genreMatch: 0.30,
      keywordMatch: 0.30,
      popularity: 0.10,
      engagement: 0.25,
      freshness: 0.05
    },
    preferHighPlayers: false,
    reasonTemplate: 'Great for long-term progression'
  },

  socializer: {
    name: 'Socializer',
    primaryGenres: ['Social', 'Town and City', 'Comedy'],
    secondaryGenres: ['Roleplay', 'Hangout'],
    keywords: ['hangout', 'chat', 'party', 'club', 'social', 'friends', 'cafe', 'restaurant', 'town', 'city', 'school', 'life'],
    antiKeywords: ['pvp', 'fight', 'battle', 'war'],
    scoring: {
      genreMatch: 0.30,
      keywordMatch: 0.25,
      popularity: 0.20,
      engagement: 0.15,
      freshness: 0.10
    },
    preferHighPlayers: true, // Socializers want active communities
    reasonTemplate: 'Perfect for meeting new friends'
  },

  competitor: {
    name: 'Competitor',
    primaryGenres: ['Fighting', 'FPS', 'Sports'],
    secondaryGenres: ['Action', 'Battle Arena'],
    keywords: ['pvp', 'fight', 'battle', 'war', 'arena', 'tournament', 'ranked', 'fps', 'shooter', 'combat', 'sword', 'gun', 'competitive'],
    antiKeywords: ['hangout', 'social', 'cafe', 'idle'],
    scoring: {
      genreMatch: 0.35,
      keywordMatch: 0.30,
      popularity: 0.15,
      engagement: 0.15,
      freshness: 0.05
    },
    preferHighPlayers: true, // Need opponents
    reasonTemplate: 'Challenge yourself against others'
  },

  builder: {
    name: 'Builder',
    primaryGenres: ['Sandbox', 'Building', 'Creative'],
    secondaryGenres: ['Tycoon', 'Simulation'],
    keywords: ['build', 'create', 'studio', 'design', 'craft', 'sandbox', 'block', 'construct', 'architect', 'creative', 'house'],
    antiKeywords: ['pvp', 'fight', 'shooter'],
    scoring: {
      genreMatch: 0.35,
      keywordMatch: 0.30,
      popularity: 0.10,
      engagement: 0.15,
      freshness: 0.10
    },
    preferHighPlayers: false,
    reasonTemplate: 'Express your creativity'
  },

  trader: {
    name: 'Trader',
    primaryGenres: ['Simulation', 'Tycoon', 'Strategy'],
    secondaryGenres: ['RPG', 'Social'],
    keywords: ['trade', 'trading', 'market', 'economy', 'shop', 'sell', 'buy', 'merchant', 'business', 'money', 'rich', 'millionaire'],
    antiKeywords: ['obby', 'parkour'],
    scoring: {
      genreMatch: 0.30,
      keywordMatch: 0.35,
      popularity: 0.15,
      engagement: 0.15,
      freshness: 0.05
    },
    preferHighPlayers: true, // Need trading partners
    reasonTemplate: 'Master the in-game economy'
  },

  roleplayer: {
    name: 'Roleplayer',
    primaryGenres: ['Roleplay', 'Town and City', 'Fantasy'],
    secondaryGenres: ['Social', 'Adventure', 'Story'],
    keywords: ['roleplay', 'rp', 'story', 'life', 'adopt', 'family', 'school', 'hospital', 'brookhaven', 'bloxburg', 'fantasy', 'medieval'],
    antiKeywords: ['simulator', 'idle', 'afk', 'pvp'],
    scoring: {
      genreMatch: 0.35,
      keywordMatch: 0.30,
      popularity: 0.15,
      engagement: 0.10,
      freshness: 0.10
    },
    preferHighPlayers: true, // Need RP partners
    reasonTemplate: 'Immerse yourself in stories'
  },

  casual: {
    name: 'Casual',
    primaryGenres: ['Obby', 'Minigames', 'Comedy'],
    secondaryGenres: ['Puzzle', 'Adventure'],
    keywords: ['obby', 'minigame', 'fun', 'easy', 'simple', 'casual', 'escape', 'parkour', 'race', 'obstacle', 'tower'],
    antiKeywords: ['grind', 'farm', 'idle', 'competitive', 'ranked'],
    scoring: {
      genreMatch: 0.30,
      keywordMatch: 0.25,
      popularity: 0.25,
      engagement: 0.10,
      freshness: 0.10
    },
    preferHighPlayers: true, // Popular = fun
    reasonTemplate: 'Quick fun without commitment'
  }
};

// Genre normalization mapping (Roblox genres can vary)
export const GENRE_ALIASES = {
  'All Genres': 'Mixed',
  'Building': 'Sandbox',
  'Horror': 'Horror',
  'Town and City': 'Social',
  'Military': 'Action',
  'Comedy': 'Comedy',
  'Medieval': 'Fantasy',
  'Sci-Fi': 'SciFi',
  'Naval': 'Action',
  'FPS': 'FPS',
  'RPG': 'RPG',
  'Sports': 'Sports',
  'Fighting': 'Fighting',
  'Western': 'Adventure'
};

/**
 * Calculate recommendation score for a game based on user's archetype
 */
export function calculateRecommendationScore(game, archetypeScores) {
  const gameName = (game.name || '').toLowerCase();
  const gameDesc = (game.description || '').toLowerCase();
  const gameGenre = game.genre || 'All Genres';
  const gameText = `${gameName} ${gameDesc}`;

  let totalScore = 0;
  let totalWeight = 0;

  // Calculate weighted score across all archetypes
  for (const [archetype, userScore] of Object.entries(archetypeScores)) {
    if (userScore <= 0) continue;

    const rules = RECOMMENDATION_RULES[archetype];
    if (!rules) continue;

    let archetypeGameScore = 0;

    // 1. Genre matching
    const genreScore = calculateGenreScore(gameGenre, rules);
    archetypeGameScore += genreScore * rules.scoring.genreMatch;

    // 2. Keyword matching
    const keywordScore = calculateKeywordScore(gameText, rules);
    archetypeGameScore += keywordScore * rules.scoring.keywordMatch;

    // 3. Popularity (visits)
    const popularityScore = calculatePopularityScore(game.visits, rules.preferHighPlayers);
    archetypeGameScore += popularityScore * rules.scoring.popularity;

    // 4. Engagement (badge count if available)
    const engagementScore = (game.badgeCount || 0) > 0
      ? Math.min((game.badgeCount / 10) * 100, 100)
      : 50; // Neutral if no badge data
    archetypeGameScore += (engagementScore / 100) * rules.scoring.engagement;

    // 5. Freshness (update date)
    const freshnessScore = calculateFreshnessScore(game.updated);
    archetypeGameScore += freshnessScore * rules.scoring.freshness;

    // Weight by user's archetype score
    totalScore += archetypeGameScore * userScore;
    totalWeight += userScore;
  }

  // Normalize to 0-100
  const finalScore = totalWeight > 0
    ? Math.round((totalScore / totalWeight) * 100)
    : 0;

  // Determine primary reason
  const primaryArchetype = Object.entries(archetypeScores)
    .sort((a, b) => b[1] - a[1])[0][0];
  const reason = RECOMMENDATION_RULES[primaryArchetype]?.reasonTemplate || 'Suggested for you';

  return {
    score: Math.min(finalScore, 100),
    reason
  };
}

function calculateGenreScore(gameGenre, rules) {
  const normalizedGenre = GENRE_ALIASES[gameGenre] || gameGenre;

  if (rules.primaryGenres.some(g =>
    normalizedGenre.toLowerCase().includes(g.toLowerCase()) ||
    g.toLowerCase().includes(normalizedGenre.toLowerCase())
  )) {
    return 1.0;
  }

  if (rules.secondaryGenres.some(g =>
    normalizedGenre.toLowerCase().includes(g.toLowerCase()) ||
    g.toLowerCase().includes(normalizedGenre.toLowerCase())
  )) {
    return 0.6;
  }

  return 0.2; // Neutral score for unmatched genres
}

function calculateKeywordScore(gameText, rules) {
  let positiveMatches = 0;
  let negativeMatches = 0;

  for (const keyword of rules.keywords) {
    if (gameText.includes(keyword)) {
      positiveMatches++;
    }
  }

  for (const keyword of rules.antiKeywords) {
    if (gameText.includes(keyword)) {
      negativeMatches++;
    }
  }

  // Positive keywords boost, negative keywords reduce
  const positiveScore = Math.min(positiveMatches / 3, 1.0); // Cap at 3 matches
  const negativeScore = Math.min(negativeMatches / 2, 0.5); // Cap penalty at 0.5

  return Math.max(positiveScore - negativeScore, 0);
}

function calculatePopularityScore(visits, preferHigh) {
  if (!visits) return 0.5;

  // Log scale for visits (games range from 0 to billions)
  const logVisits = Math.log10(visits + 1);
  const maxLog = 10; // 10 billion visits

  const normalizedPopularity = Math.min(logVisits / maxLog, 1.0);

  if (preferHigh) {
    return normalizedPopularity;
  } else {
    // For explorers/builders, mid-popularity is fine
    return 0.3 + normalizedPopularity * 0.7;
  }
}

function calculateFreshnessScore(updatedDate) {
  if (!updatedDate) return 0.5;

  const updated = new Date(updatedDate);
  const now = new Date();
  const daysSinceUpdate = (now - updated) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate < 30) return 1.0;      // Updated within a month
  if (daysSinceUpdate < 90) return 0.8;      // Within 3 months
  if (daysSinceUpdate < 180) return 0.6;     // Within 6 months
  if (daysSinceUpdate < 365) return 0.4;     // Within a year
  return 0.2;                                 // Older than a year
}

/**
 * Get top recommended games for a user
 */
export function getRecommendedGames(games, archetypeScores, limit = 20) {
  const scoredGames = games.map(game => {
    const { score, reason } = calculateRecommendationScore(game, archetypeScores);
    return {
      ...game,
      recommendationScore: score,
      recommendationReason: reason
    };
  });

  // Sort by recommendation score
  scoredGames.sort((a, b) => b.recommendationScore - a.recommendationScore);

  // Return top N
  return scoredGames.slice(0, limit);
}
