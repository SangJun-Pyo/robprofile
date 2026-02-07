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

// API Base URL (same origin - backend handles Roblox API calls)
const API_BASE = '/api';

// OAuth Helper - starts login flow
function startOAuthLogin() {
  window.location.href = `${API_BASE}/oauth/login`;
}

// Handle OAuth callback - redirect to detailed analysis
function handleOAuthCallback(userId, username, displayName) {
  // Redirect to detailed analysis page
  window.location.href = `/detail.html?userId=${userId}`;
}

// Current analyzed user (for detail link)
let currentAnalyzedUserId = null;

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

// Roblox API (via backend - no CORS issues)
const RobloxAPI = {
  // Search users by keyword (for autocomplete)
  async searchUsers(keyword) {
    if (!keyword || keyword.length < 2) return [];
    try {
      const response = await fetch(`${API_BASE}/users/search?keyword=${encodeURIComponent(keyword)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  },

  // Resolve username to user ID
  async getUserByUsername(username) {
    const response = await fetch(`${API_BASE}/users/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('User not found');
      }
      throw new Error('API request failed');
    }

    return response.json();
  },

  // Get full analysis data (profile, avatar, badges, groups)
  async getAnalysisData(userId) {
    const response = await fetch(`${API_BASE}/analyze/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch analysis data');
    }
    return response.json();
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

// Autocomplete Controller
const Autocomplete = {
  container: null,
  input: null,
  debounceTimer: null,
  isOpen: false,

  init(inputElement) {
    this.input = inputElement;
    this.createContainer();
    this.setupListeners();
  },

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'autocomplete-container';
    this.container.innerHTML = '<ul class="autocomplete-list"></ul>';
    this.input.parentElement.style.position = 'relative';
    this.input.parentElement.appendChild(this.container);
  },

  setupListeners() {
    // Input event with debounce
    this.input.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      const query = e.target.value.trim();

      if (query.length < 2) {
        this.close();
        return;
      }

      this.debounceTimer = setTimeout(() => this.search(query), 300);
    });

    // Close on blur (with delay for click)
    this.input.addEventListener('blur', () => {
      setTimeout(() => this.close(), 200);
    });

    // Keyboard navigation
    this.input.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      const items = this.container.querySelectorAll('.autocomplete-item');
      const active = this.container.querySelector('.autocomplete-item.active');
      let index = Array.from(items).indexOf(active);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          index = Math.min(index + 1, items.length - 1);
          this.setActive(items, index);
          break;
        case 'ArrowUp':
          e.preventDefault();
          index = Math.max(index - 1, 0);
          this.setActive(items, index);
          break;
        case 'Enter':
          if (active) {
            e.preventDefault();
            this.selectItem(active);
          }
          break;
        case 'Escape':
          this.close();
          break;
      }
    });
  },

  setActive(items, index) {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
  },

  async search(query) {
    const users = await RobloxAPI.searchUsers(query);
    this.render(users);
  },

  render(users) {
    const list = this.container.querySelector('.autocomplete-list');

    if (users.length === 0) {
      this.close();
      return;
    }

    list.innerHTML = users.slice(0, 3).map((user, index) => `
      <li class="autocomplete-item ${index === 0 ? 'active' : ''}" data-username="${user.name}" data-userid="${user.id}">
        <span class="autocomplete-name">${user.name}</span>
        ${user.displayName !== user.name ? `<span class="autocomplete-display">(@${user.displayName})</span>` : ''}
      </li>
    `).join('');

    // Add click handlers
    list.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.selectItem(item);
      });
    });

    this.open();
  },

  selectItem(item) {
    const username = item.getAttribute('data-username');
    this.input.value = username;
    this.close();
    // Trigger form submit
    this.input.closest('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
  },

  open() {
    this.container.classList.add('open');
    this.isOpen = true;
  },

  close() {
    this.container.classList.remove('open');
    this.isOpen = false;
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
      scoresChart: document.getElementById('scores-chart'),
      viewDetailBtn: document.getElementById('view-detail-btn')
    };

    this.elements.form?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Initialize autocomplete
    if (this.elements.usernameInput) {
      Autocomplete.init(this.elements.usernameInput);
    }
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

    // Store user ID for detail link
    currentAnalyzedUserId = user.id;

    // User info
    this.elements.avatar.src = avatarUrl || 'https://tr.rbxcdn.com/30DAY-AvatarHeadshot-placeholder/150/150/AvatarHeadshot/Png/noFilter';
    this.elements.username.textContent = user.displayName || user.name;

    // Show and update detail button
    if (this.elements.viewDetailBtn && user.id) {
      this.elements.viewDetailBtn.href = `/detail.html?userId=${user.id}`;
      this.elements.viewDetailBtn.classList.remove('hidden');
    }

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

      // Step 2: Get all analysis data from backend
      const data = await RobloxAPI.getAnalysisData(user.id);

      // Step 3: Analyze
      const result = AnalysisEngine.computeResult(data.badges, data.groups);

      // Step 4: Show result
      this.showResult(
        { ...user, ...data.profile },
        data.avatarUrl,
        result
      );

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
async function init() {
  initTheme();
  UI.init();

  // Setup OAuth login buttons
  document.getElementById('login-cta')?.addEventListener('click', (e) => {
    e.preventDefault();
    startOAuthLogin();
  });
  document.getElementById('full-login-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    startOAuthLogin();
  });

  // Check for OAuth callback result in URL
  const urlParams = new URLSearchParams(window.location.search);
  const oauthResult = urlParams.get('oauth');

  if (oauthResult === 'success') {
    const userId = urlParams.get('userId');
    const username = urlParams.get('username');
    const displayName = urlParams.get('displayName');

    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);

    // Auto-analyze the verified user
    if (userId) {
      handleOAuthCallback(userId, username, displayName);
    }
  } else if (oauthResult === 'error') {
    const reason = urlParams.get('reason');
    console.error('OAuth failed:', reason);
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname);
    // Show error message briefly
    UI.showError(i18n.t('error_login') || 'Login failed. Please try again.');
    setTimeout(() => {
      UI.elements.error?.classList.add('hidden');
    }, 5000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
