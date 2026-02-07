// Detail Analysis Page - Personalized Recommendations

const ARCHETYPES = {
  explorer: { icon: '🧭', color: '#4CAF50' },
  grinder: { icon: '⚔️', color: '#FF5722' },
  socializer: { icon: '💬', color: '#E91E63' },
  competitor: { icon: '🏆', color: '#FFC107' },
  builder: { icon: '🔧', color: '#2196F3' },
  trader: { icon: '💰', color: '#9C27B0' },
  roleplayer: { icon: '🎭', color: '#00BCD4' },
  casual: { icon: '🎮', color: '#607D8B' }
};

const PERSONALIZED_INSIGHTS = {
  explorer: "You have a natural curiosity for discovering new experiences. Your playstyle suggests you enjoy variety and adventure. We recommend games that offer exploration, quests, and new worlds to discover.",
  grinder: "Your dedication to progression is impressive! You thrive on long-term goals and visible achievements. We suggest games with deep progression systems, prestige mechanics, and rewarding grind loops.",
  socializer: "Connection is at the heart of your gaming experience. You value community and friendships. We recommend games with vibrant social features, hangout spaces, and cooperative gameplay.",
  competitor: "You're driven by challenge and the thrill of competition. Improvement and victory motivate you. We suggest games with PvP, ranked modes, and skill-based matchmaking.",
  builder: "Creativity flows through your gameplay. You love to design, construct, and express yourself. We recommend sandbox games, building experiences, and creative tools.",
  trader: "You have a keen eye for value and economics. Strategic thinking is your strength. We suggest games with trading systems, market economies, and business simulations.",
  roleplayer: "Your imagination transforms every game into a story. Character and narrative drive your experience. We recommend games with rich lore, roleplay communities, and immersive worlds.",
  casual: "You play for pure enjoyment without pressure. Fun and relaxation are your priorities. We suggest accessible games with quick sessions and simple mechanics."
};

// Theme Toggle
function initTheme() {
  const THEME_KEY = 'theme';
  const getPreferredTheme = () => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  };

  applyTheme(getPreferredTheme());
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
}

// Fetch detailed analysis
async function fetchDetailAnalysis(userId) {
  const response = await fetch(`/api/detail/${userId}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch analysis');
  }
  return response.json();
}

// Render the detail page
function renderDetail(data) {
  const { profile, avatarUrl, stats, recommendations, archetypeScores, groups } = data;

  // User header
  document.getElementById('detail-avatar').src = avatarUrl ||
    'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Png/noFilter';
  document.getElementById('detail-displayname').textContent = profile.displayName;
  document.getElementById('detail-username').textContent = profile.name;

  // Account age text
  const years = Math.floor(stats.accountAgeDays / 365);
  const months = Math.floor((stats.accountAgeDays % 365) / 30);
  let ageText = '';
  if (years > 0) ageText += `${years} year${years > 1 ? 's' : ''} `;
  if (months > 0 || years === 0) ageText += `${months} month${months !== 1 ? 's' : ''}`;
  document.getElementById('detail-account-age').textContent =
    `${i18n.t('member_for') || 'Member for'} ${ageText.trim()}`;

  // Stats
  document.getElementById('stat-badges').textContent = stats.totalBadges.toLocaleString();
  document.getElementById('stat-games').textContent = stats.gamesAnalyzed.toLocaleString();
  document.getElementById('stat-groups').textContent = stats.totalGroups.toLocaleString();
  document.getElementById('stat-age').textContent = stats.accountAgeDays.toLocaleString();

  // Archetype result
  const primary = archetypeScores.primary;
  const secondary = archetypeScores.secondary;

  document.getElementById('detail-archetype-icon').textContent = ARCHETYPES[primary].icon;
  document.getElementById('detail-archetype-name').textContent = i18n.t(primary);
  document.getElementById('detail-secondary-icon').textContent = ARCHETYPES[secondary].icon;
  document.getElementById('detail-secondary-name').textContent = i18n.t(secondary);

  // Confidence
  const confidence = Math.round(archetypeScores.confidence * 100);
  document.getElementById('detail-confidence-bar').style.width = `${confidence}%`;
  document.getElementById('detail-confidence-value').textContent = `${confidence}%`;

  // Scores grid
  const scoresGrid = document.getElementById('detail-scores-grid');
  const sortedScores = Object.entries(archetypeScores.scores)
    .sort((a, b) => b[1] - a[1]);

  scoresGrid.innerHTML = sortedScores.map(([key, value]) => {
    const percent = Math.round(value * 100);
    return `
      <div class="score-item">
        <span class="score-icon">${ARCHETYPES[key].icon}</span>
        <div class="score-info">
          <div class="score-name">${i18n.t(key)}</div>
          <div class="score-bar-container">
            <div class="score-bar-fill" style="width: ${percent}%; background-color: ${ARCHETYPES[key].color}"></div>
          </div>
        </div>
        <span class="score-percent">${percent}%</span>
      </div>
    `;
  }).join('');

  // Personalized insight
  document.getElementById('recommendation-text').textContent =
    i18n.t(`insight_${primary}`) || PERSONALIZED_INSIGHTS[primary];

  // Recommended games list
  const gamesList = document.getElementById('games-list');
  if (!recommendations || recommendations.length === 0) {
    gamesList.innerHTML = `
      <div class="empty-state">
        <p>${i18n.t('no_recommendations') || 'Unable to generate recommendations. Try analyzing more data.'}</p>
      </div>
    `;
  } else {
    gamesList.innerHTML = recommendations.slice(0, 20).map((game) => {
      const matchLevel = game.recommendationScore >= 70 ? 'high'
        : game.recommendationScore >= 40 ? 'medium' : 'low';
      const matchLabel = game.recommendationScore >= 70
        ? (i18n.t('great_match') || 'Great Match')
        : game.recommendationScore >= 40
          ? (i18n.t('good_match') || 'Good Match')
          : (i18n.t('suggested') || 'Suggested');

      return `
        <a href="${game.gameUrl}" target="_blank" rel="noopener" class="game-link">
          <div class="game-item">
            <img
              src="https://thumbnails.roblox.com/v1/games/icons?universeIds=${game.universeId}&size=150x150&format=Png"
              alt="${escapeHtml(game.name)}"
              class="game-icon"
              onerror="this.src='https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Png/noFilter'"
            >
            <div class="game-info">
              <div class="game-name">${escapeHtml(game.name)}</div>
              <div class="game-meta">
                ${game.genre ? `<span>${game.genre}</span> · ` : ''}
                <span>${formatNumber(game.visits)} ${i18n.t('visits') || 'visits'}</span>
                ${game.playing ? ` · <span>${formatNumber(game.playing)} ${i18n.t('playing') || 'playing'}</span>` : ''}
              </div>
            </div>
            <div class="game-recommendation">
              <div class="recommendation-score">
                <div class="score-bar">
                  <div class="score-fill" style="width: ${game.recommendationScore}%"></div>
                </div>
                <span class="score-value">${game.recommendationScore}%</span>
              </div>
              <span class="match-badge ${matchLevel}">${matchLabel}</span>
              <div class="recommendation-reason">${game.recommendationReason}</div>
            </div>
          </div>
        </a>
      `;
    }).join('');
  }

  // Show result, hide loading
  document.getElementById('detail-loading').classList.add('hidden');
  document.getElementById('detail-result').classList.remove('hidden');
}

// Show error
function showError(message) {
  document.getElementById('detail-loading').classList.add('hidden');
  document.getElementById('detail-error').classList.remove('hidden');
  document.getElementById('detail-error-message').textContent = message;
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

// Initialize
async function init() {
  initTheme();

  // Get userId from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId');

  if (!userId) {
    showError(i18n.t('error_no_user') || 'No user ID provided. Please go back and try again.');
    return;
  }

  try {
    const data = await fetchDetailAnalysis(userId);
    renderDetail(data);
  } catch (err) {
    console.error('Detail analysis error:', err);
    showError(err.message || i18n.t('error_api') || 'Failed to load analysis. Please try again.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
