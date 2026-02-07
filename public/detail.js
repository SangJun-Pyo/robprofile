// Detail Analysis Page - Discover-based Recommendations

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
  explorer: "You have a natural curiosity for discovering new experiences. We've selected games that offer exploration, adventure, and new worlds to discover based on your playstyle.",
  grinder: "Your dedication to progression is impressive! We've selected games with deep progression systems and rewarding grind loops that match your playstyle.",
  socializer: "Connection is at the heart of your gaming. We've selected games with vibrant communities and social features that match your playstyle.",
  competitor: "You're driven by challenge and competition. We've selected games with PvP and skill-based gameplay that match your playstyle.",
  builder: "Creativity flows through your gameplay. We've selected sandbox and creative games that match your playstyle.",
  trader: "You have a keen eye for value. We've selected games with trading and economy systems that match your playstyle.",
  roleplayer: "Your imagination transforms games into stories. We've selected immersive roleplay experiences that match your playstyle.",
  casual: "You play for pure enjoyment. We've selected fun, accessible games that match your laid-back playstyle."
};

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

async function fetchDetailAnalysis(userId) {
  const response = await fetch(`/api/detail/${userId}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch analysis');
  }
  return response.json();
}

function renderDetail(data) {
  const { profile, avatarUrl, stats, recommendations, archetypeScores } = data;

  // User header
  document.getElementById('detail-avatar').src = avatarUrl ||
    'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Png/noFilter';
  document.getElementById('detail-displayname').textContent = profile.displayName;
  document.getElementById('detail-username').textContent = profile.name;

  // Account age
  const years = Math.floor(stats.accountAgeDays / 365);
  const months = Math.floor((stats.accountAgeDays % 365) / 30);
  let ageText = '';
  if (years > 0) ageText += `${years} year${years > 1 ? 's' : ''} `;
  if (months > 0 || years === 0) ageText += `${months} month${months !== 1 ? 's' : ''}`;
  document.getElementById('detail-account-age').textContent =
    `${i18n.t('member_for') || 'Member for'} ${ageText.trim()}`;

  // Stats
  document.getElementById('stat-badges').textContent = stats.totalBadges.toLocaleString();
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

  // Recommended games
  const gamesList = document.getElementById('games-list');
  if (!recommendations || recommendations.length === 0) {
    gamesList.innerHTML = `
      <div class="empty-state">
        <p>${i18n.t('no_recommendations') || 'Unable to load recommendations. Please try again later.'}</p>
      </div>
    `;
  } else {
    gamesList.innerHTML = recommendations.map((game) => {
      const matchLevel = game.recommendationScore >= 70 ? 'high'
        : game.recommendationScore >= 40 ? 'medium' : 'low';
      const matchLabel = game.recommendationScore >= 70
        ? (i18n.t('great_match') || 'Great Match')
        : game.recommendationScore >= 40
          ? (i18n.t('good_match') || 'Good Match')
          : (i18n.t('suggested') || 'Suggested');

      // Render tags (max 4)
      const tagsHtml = (game.tags || []).slice(0, 4).map(tag =>
        `<span class="game-tag">${tag}</span>`
      ).join('');

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
                ${game.genre ? `<span>${game.genre}</span>` : ''}
                <span class="playing-badge">
                  <span class="playing-dot"></span>
                  ${formatNumber(game.playing)} ${i18n.t('playing') || 'playing'}
                </span>
                <span>${formatNumber(game.visits)} ${i18n.t('visits') || 'visits'}</span>
              </div>
              <div class="game-tags">${tagsHtml}</div>
            </div>
            <div class="game-recommendation">
              <div class="recommendation-score">
                <div class="score-bar">
                  <div class="score-fill" style="width: ${game.recommendationScore}%"></div>
                </div>
                <span class="score-value">${game.recommendationScore}%</span>
              </div>
              <span class="match-badge ${matchLevel}">${matchLabel}</span>
              <div class="recommendation-reason">${i18n.t('recommended_for_' + primary) || game.recommendationReason || `Recommended for your ${i18n.t(primary)} playstyle`}</div>
            </div>
          </div>
        </a>
      `;
    }).join('');
  }

  // Show result
  document.getElementById('detail-loading').classList.add('hidden');
  document.getElementById('detail-result').classList.remove('hidden');
}

function showError(message) {
  document.getElementById('detail-loading').classList.add('hidden');
  document.getElementById('detail-error').classList.remove('hidden');
  document.getElementById('detail-error-message').textContent = message;
}

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

async function init() {
  initTheme();

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
