// Roblox Archetype App

// Archetype definitions with icons
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

// Roblox API Proxy (using public endpoints)
const RobloxAPI = {
  // Resolve username to user ID
  async getUserByUsername(username) {
    const response = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: true })
    });
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data[0];
    }
    throw new Error('User not found');
  },

  // Get user profile
  async getUserProfile(userId) {
    const response = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  // Get user avatar thumbnail
  async getAvatarUrl(userId) {
    const response = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`
    );
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].imageUrl;
    }
    return null;
  },

  // Get user badges (public)
  async getUserBadges(userId) {
    try {
      const response = await fetch(
        `https://badges.roblox.com/v1/users/${userId}/badges?limit=100&sortOrder=Desc`
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
    } catch {
      return [];
    }
  },

  // Get user groups (public)
  async getUserGroups(userId) {
    try {
      const response = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
    } catch {
      return [];
    }
  }
};

// Analysis Engine
const AnalysisEngine = {
  // Keywords for each archetype (heuristic detection)
  keywords: {
    explorer: ['adventure', 'explore', 'discover', 'world', 'travel', 'quest', 'mystery'],
    grinder: ['simulator', 'tycoon', 'idle', 'clicker', 'farm', 'grind', 'afk', 'upgrade'],
    socializer: ['hangout', 'chat', 'party', 'club', 'social', 'friends', 'rp', 'cafe'],
    competitor: ['pvp', 'fight', 'battle', 'war', 'arena', 'tournament', 'ranked', 'fps', 'shooter'],
    builder: ['build', 'create', 'studio', 'design', 'craft', 'sandbox', 'block'],
    trader: ['trade', 'trading', 'market', 'economy', 'shop', 'sell', 'buy', 'limited'],
    roleplayer: ['roleplay', 'rp', 'story', 'life', 'adopt', 'family', 'school', 'hospital'],
    casual: ['obby', 'minigame', 'fun', 'easy', 'simple', 'casual', 'escape']
  },

  analyzeSignals(badges, groups) {
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

    // Analyze badge names
    badges.forEach(badge => {
      const text = (badge.name + ' ' + (badge.description || '')).toLowerCase();
      Object.entries(this.keywords).forEach(([type, keywords]) => {
        keywords.forEach(kw => {
          if (text.includes(kw)) {
            scores[type] += 1;
          }
        });
      });
    });

    // Analyze group names
    groups.forEach(g => {
      const text = (g.group?.name || '').toLowerCase();
      Object.entries(this.keywords).forEach(([type, keywords]) => {
        keywords.forEach(kw => {
          if (text.includes(kw)) {
            scores[type] += 2; // Groups weighted more
          }
        });
      });
    });

    // Add base scores based on counts
    if (badges.length > 50) scores.grinder += 3;
    if (badges.length > 100) scores.grinder += 5;
    if (groups.length > 10) scores.socializer += 3;
    if (groups.length > 20) scores.socializer += 5;

    return scores;
  },

  normalizeScores(scores) {
    const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
    const normalized = {};
    Object.entries(scores).forEach(([key, value]) => {
      normalized[key] = Math.min(value / total, 1);
    });
    return normalized;
  },

  computeResult(badges, groups) {
    const rawScores = this.analyzeSignals(badges, groups);
    const normalizedScores = this.normalizeScores(rawScores);

    // Sort by score
    const sorted = Object.entries(normalizedScores)
      .sort((a, b) => b[1] - a[1]);

    const primary = sorted[0][0];
    const secondary = sorted[1][0];

    // Calculate confidence based on signal strength and margin
    const signalStrength = Math.min((badges.length + groups.length * 2) / 50, 1);
    const margin = sorted[0][1] - sorted[1][1];
    const confidence = Math.min(0.4 * signalStrength + 0.6 * margin * 3, 0.85);

    return {
      primary,
      secondary,
      scores: normalizedScores,
      confidence: Math.max(confidence, 0.25) // Minimum 25% confidence for quick
    };
  }
};

// UI Controller
const UI = {
  elements: {},

  init() {
    this.elements = {
      form: document.getElementById('quick-form'),
      usernameInput: document.getElementById('username-input'),
      loading: document.getElementById('loading'),
      error: document.getElementById('error'),
      errorMessage: document.getElementById('error-message'),
      result: document.getElementById('quick-result'),
      avatar: document.getElementById('result-avatar'),
      username: document.getElementById('result-username'),
      primaryIcon: document.getElementById('primary-icon'),
      primaryName: document.getElementById('primary-name'),
      primaryDesc: document.getElementById('primary-desc'),
      confidenceBar: document.getElementById('confidence-bar'),
      confidenceText: document.getElementById('confidence-text'),
      scoresChart: document.getElementById('scores-chart')
    };

    this.elements.form?.addEventListener('submit', (e) => this.handleSubmit(e));
  },

  showLoading() {
    this.elements.loading?.classList.remove('hidden');
    this.elements.error?.classList.add('hidden');
    this.elements.result?.classList.add('hidden');
  },

  hideLoading() {
    this.elements.loading?.classList.add('hidden');
  },

  showError(message) {
    this.hideLoading();
    this.elements.errorMessage.textContent = message;
    this.elements.error?.classList.remove('hidden');
    this.elements.result?.classList.add('hidden');
  },

  showResult(user, avatarUrl, result) {
    this.hideLoading();
    this.elements.error?.classList.add('hidden');
    this.elements.result?.classList.remove('hidden');

    // User info
    this.elements.avatar.src = avatarUrl || 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Png/noFilter';
    this.elements.username.textContent = user.displayName || user.name;

    // Primary archetype
    const primary = result.primary;
    this.elements.primaryIcon.textContent = ARCHETYPES[primary].icon;
    this.elements.primaryName.textContent = i18n.t(primary);
    this.elements.primaryDesc.textContent = i18n.t(`${primary}_desc`);

    // Confidence
    const confidencePercent = Math.round(result.confidence * 100);
    this.elements.confidenceBar.style.width = `${confidencePercent}%`;
    this.elements.confidenceText.textContent = `${confidencePercent}%`;

    // Scores chart
    this.renderScoresChart(result.scores);
  },

  renderScoresChart(scores) {
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const maxScore = Math.max(...Object.values(scores), 0.01);

    this.elements.scoresChart.innerHTML = sorted.map(([key, value]) => {
      const percent = Math.round((value / maxScore) * 100);
      const displayPercent = Math.round(value * 100);
      return `
        <div class="score-row">
          <span class="name">${ARCHETYPES[key].icon} ${i18n.t(key)}</span>
          <div class="bar">
            <div class="bar-fill" style="width: ${percent}%; background-color: ${ARCHETYPES[key].color}"></div>
          </div>
          <span class="value">${displayPercent}%</span>
        </div>
      `;
    }).join('');
  },

  async handleSubmit(e) {
    e.preventDefault();
    const username = this.elements.usernameInput.value.trim();
    if (!username) return;

    this.showLoading();

    try {
      // Step 1: Resolve username
      const user = await RobloxAPI.getUserByUsername(username);

      // Step 2: Fetch data in parallel
      const [profile, avatarUrl, badges, groups] = await Promise.all([
        RobloxAPI.getUserProfile(user.id),
        RobloxAPI.getAvatarUrl(user.id),
        RobloxAPI.getUserBadges(user.id),
        RobloxAPI.getUserGroups(user.id)
      ]);

      // Step 3: Analyze
      const result = AnalysisEngine.computeResult(badges, groups);

      // Step 4: Show result
      this.showResult({ ...user, ...profile }, avatarUrl, result);

    } catch (err) {
      console.error('Analysis error:', err);
      if (err.message === 'User not found') {
        this.showError(i18n.t('error_not_found'));
      } else {
        this.showError(i18n.t('error_api'));
      }
    }
  }
};

// Initialize app
function init() {
  initTheme();
  UI.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
