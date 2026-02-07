// Detail Analysis Page

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

const RECOMMENDATIONS = {
  explorer: "You thrive on discovering new experiences. Try checking out the 'Discover' page regularly and join gaming communities that share hidden gems. Consider games with open worlds and multiple areas to explore.",
  grinder: "Your dedication to progression is impressive! Look for games with prestige systems, seasonal events, and long-term goals. Joining groups focused on your favorite games can help you find the best grinding strategies.",
  socializer: "Your strength lies in building connections. Consider joining community-focused groups, hosting events, or helping new players. Games with trading, hangout spaces, and cooperative gameplay suit you best.",
  competitor: "You're driven by challenge and improvement. Look for games with ranked modes, tournaments, and skill-based matchmaking. Consider joining competitive clans to find worthy opponents.",
  builder: "Your creativity sets you apart. Explore sandbox games, building competitions, and consider learning Roblox Studio to create your own experiences. Developer communities would welcome your talents.",
  trader: "You have a keen eye for value. Stay updated on limited releases, join trading groups, and consider diversifying your portfolio across different item categories. Knowledge is your best investment.",
  roleplayer: "Your imagination brings games to life. Look for games with rich lore, character customization, and active RP communities. Consider writing backstories for your characters to deepen immersion.",
  casual: "You enjoy gaming without pressure, and that's perfectly valid! Explore trending games, try new genres occasionally, and remember that gaming is about having fun. No need to optimize everything."
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
  const { profile, avatarUrl, stats, games, archetypeScores, groups } = data;

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
  document.getElementById('detail-account-age').textContent = `Member for ${ageText.trim()}`;

  // Stats
  document.getElementById('stat-badges').textContent = stats.totalBadges.toLocaleString();
  document.getElementById('stat-games').textContent = stats.uniqueGames.toLocaleString();
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
          <div class="score-bar">
            <div class="score-fill" style="width: ${percent}%; background-color: ${ARCHETYPES[key].color}"></div>
          </div>
        </div>
        <span class="score-value">${percent}%</span>
      </div>
    `;
  }).join('');

  // Recommendation
  document.getElementById('recommendation-text').textContent =
    i18n.t(`recommendation_${primary}`) || RECOMMENDATIONS[primary];

  // Games list
  const gamesList = document.getElementById('games-list');
  if (games.length === 0) {
    gamesList.innerHTML = `
      <div class="empty-state">
        <p>${i18n.t('no_games_found') || 'No games found based on badge data.'}</p>
      </div>
    `;
  } else {
    gamesList.innerHTML = games.slice(0, 30).map((game, index) => `
      <a href="https://www.roblox.com/games/${game.rootPlaceId}" target="_blank" rel="noopener" class="game-link">
        <div class="game-item">
          <img
            src="https://thumbnails.roblox.com/v1/games/icons?universeIds=${game.universeId}&size=150x150&format=Png"
            alt="${game.name}"
            class="game-icon"
            onerror="this.src='https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Png/noFilter'"
          >
          <div class="game-info">
            <div class="game-name">${escapeHtml(game.name)}</div>
            <div class="game-meta">
              ${game.genre ? `<span>${game.genre}</span> · ` : ''}
              <span>${formatNumber(game.visits)} visits</span>
              ${game.playing ? ` · <span>${formatNumber(game.playing)} playing</span>` : ''}
            </div>
          </div>
          <div class="game-engagement">
            <div class="engagement-bar">
              <div class="engagement-fill" style="width: ${game.engagementScore}%"></div>
            </div>
            <div class="engagement-label">
              <span class="badge-count">🏅 ${game.badgeCount}</span>
            </div>
          </div>
        </div>
      </a>
    `).join('');
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
