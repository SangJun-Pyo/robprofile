// Detail Analysis Page - KV Pool-based Recommendations

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

async function fetchRecommendations(userId) {
  const response = await fetch(`/api/recommend?userId=${userId}`);
  if (!response.ok) {
    console.error('Recommendations fetch failed');
    return null;
  }
  return response.json();
}

function renderDetail(data, recommendations) {
  const { profile, avatarUrl, stats, archetypeScores } = data;

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

  // Recommended games (from /api/recommend)
  renderRecommendations(recommendations, primary);

  // Show result
  document.getElementById('detail-loading').classList.add('hidden');
  document.getElementById('detail-result').classList.remove('hidden');
}

function renderRecommendations(recData, primaryArchetype) {
  const gamesList = document.getElementById('games-list');
  const poolInfo = document.getElementById('pool-info');

  // Show pool update time if available
  if (recData && recData.updatedAt && poolInfo) {
    const updateTime = new Date(recData.updatedAt).toLocaleString();
    poolInfo.textContent = `${i18n.t('pool_updated') || 'Pool updated'}: ${updateTime}`;
    poolInfo.classList.remove('hidden');
  }

  const recommendations = recData?.recommendations || [];

  if (recommendations.length === 0) {
    gamesList.innerHTML = `
      <div class="empty-state">
        <p>${i18n.t('no_recommendations') || 'Unable to load recommendations. Please try again later.'}</p>
      </div>
    `;
    return;
  }

  const PLACEHOLDER_IMG = 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Png/noFilter';

  gamesList.innerHTML = recommendations.map((game) => {
    const score = game.recommendScore || game.recommendationScore || 0;
    const matchLevel = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
    const matchLabel = score >= 70
      ? (i18n.t('great_match') || 'Great Match')
      : score >= 40
        ? (i18n.t('good_match') || 'Good Match')
        : (i18n.t('suggested') || 'Suggested');

    // Render why tags (matched archetypes)
    const whyTags = (game.why || []).slice(0, 3).map(tag =>
      `<span class="why-tag">${ARCHETYPES[tag]?.icon || ''} ${i18n.t(tag) || tag}</span>`
    ).join('');

    // Render game tags
    const tagsHtml = (game.tags || []).slice(0, 4).map(tag =>
      `<span class="game-tag">${tag}</span>`
    ).join('');

    // Use resolved CDN URL; fall back to placeholder if empty
    const imgSrc = game.iconUrl || PLACEHOLDER_IMG;

    return `
      <a href="${game.gameUrl}" target="_blank" rel="noopener" class="game-link">
        <div class="game-item">
          <img
            src="${imgSrc}"
            alt="${escapeHtml(game.name)}"
            class="game-icon"
            loading="lazy"
            onerror="if(!this.dataset.retried){this.dataset.retried='1';this.src='${PLACEHOLDER_IMG}';console.warn('Thumbnail failed:',this.alt,this.src)}"
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
                <div class="score-fill" style="width: ${score}%"></div>
              </div>
              <span class="score-value">${score}%</span>
            </div>
            <span class="match-badge ${matchLevel}">${matchLabel}</span>
            <div class="recommendation-reason">
              ${whyTags || i18n.t('recommended_for_' + primaryArchetype) || `Recommended for your ${i18n.t(primaryArchetype)} playstyle`}
            </div>
          </div>
        </div>
      </a>
    `;
  }).join('');
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
    // Fetch both detail and recommendations in parallel
    const [detailData, recData] = await Promise.all([
      fetchDetailAnalysis(userId),
      fetchRecommendations(userId)
    ]);

    renderDetail(detailData, recData);
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
