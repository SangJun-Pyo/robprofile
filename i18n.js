// Internationalization (i18n) Module
const i18n = {
  currentLocale: 'en',

  messages: {
    en: {
      title: "Roblox Archetype",
      subtitle: "Discover Your Playstyle",
      quick_title: "Quick Analysis",
      no_login: "No Login Required",
      quick_desc: "Enter your Roblox username to get a quick playstyle estimate based on public data.",
      username_placeholder: "Roblox Username",
      analyze: "Analyze",
      loading: "Analyzing your playstyle...",
      quick_guess: "Quick Guess",
      primary_type: "Primary Type",
      confidence: "Confidence",
      all_scores: "All Archetype Scores",
      want_accurate: "Want more accurate results?",
      login_roblox: "Login with Roblox",
      full_analysis: "Full Analysis",
      full_desc: "Login with Roblox OAuth and complete a survey for personalized, high-confidence results.",
      feature_1: "8-question personality survey",
      feature_2: "Primary & Secondary archetype",
      feature_3: "Detailed score breakdown",
      feature_4: "Shareable result card",
      get_started: "Get Started",
      partnership: "Partnership Inquiry",
      form_name: "Name / Company",
      form_name_placeholder: "John Doe / ABC Inc.",
      form_email: "Email",
      form_message: "Message",
      form_message_placeholder: "Tell us about your partnership proposal...",
      form_submit: "Submit",
      footer_note: "This is a fan project, not affiliated with Roblox Corporation.",
      error_not_found: "User not found. Please check the username.",
      error_api: "Failed to fetch data. Please try again.",

      // Archetypes
      explorer: "Explorer",
      explorer_desc: "Enjoys discovering new games and genres.",
      grinder: "Grinder",
      grinder_desc: "Focuses on long-term progression and repetition.",
      socializer: "Socializer",
      socializer_desc: "Plays mainly for social interaction.",
      competitor: "Competitor",
      competitor_desc: "Enjoys PvP, ranking, and skill improvement.",
      builder: "Builder",
      builder_desc: "Interested in creating, building, and customization.",
      trader: "Trader",
      trader_desc: "Focused on item value and trading.",
      roleplayer: "Roleplayer",
      roleplayer_desc: "Immerses in story, character, and roleplay.",
      casual: "Casual",
      casual_desc: "Light, short play sessions without deep focus."
    },
    ko: {
      title: "Roblox Archetype",
      subtitle: "나의 플레이스타일 찾기",
      quick_title: "빠른 분석",
      no_login: "로그인 불필요",
      quick_desc: "Roblox 사용자명을 입력하면 공개 데이터 기반으로 빠르게 플레이스타일을 분석합니다.",
      username_placeholder: "Roblox 사용자명",
      analyze: "분석하기",
      loading: "플레이스타일 분석 중...",
      quick_guess: "빠른 추측",
      primary_type: "대표 유형",
      confidence: "신뢰도",
      all_scores: "전체 유형 점수",
      want_accurate: "더 정확한 결과를 원하시나요?",
      login_roblox: "Roblox로 로그인",
      full_analysis: "상세 분석",
      full_desc: "Roblox OAuth 로그인 후 설문을 완료하면 개인화된 고신뢰도 결과를 받을 수 있습니다.",
      feature_1: "8문항 성향 설문",
      feature_2: "주요 & 보조 유형 분석",
      feature_3: "상세 점수 분석",
      feature_4: "공유 가능한 결과 카드",
      get_started: "시작하기",
      partnership: "제휴 문의",
      form_name: "이름 / 회사명",
      form_name_placeholder: "홍길동 / ABC 주식회사",
      form_email: "이메일",
      form_message: "문의 내용",
      form_message_placeholder: "제휴 제안 내용을 작성해주세요...",
      form_submit: "제출하기",
      footer_note: "이 서비스는 팬 프로젝트이며, Roblox Corporation과 무관합니다.",
      error_not_found: "사용자를 찾을 수 없습니다. 사용자명을 확인해주세요.",
      error_api: "데이터를 가져오지 못했습니다. 다시 시도해주세요.",

      // Archetypes
      explorer: "탐험형",
      explorer_desc: "새로운 게임과 장르를 찾아다니는 성향.",
      grinder: "파밍형",
      grinder_desc: "반복 루프와 장기 성장을 즐기는 성향.",
      socializer: "사교형",
      socializer_desc: "사람들과 어울리는 것이 중심인 성향.",
      competitor: "경쟁형",
      competitor_desc: "승부/랭킹/실력 향상을 즐기는 성향.",
      builder: "창작형",
      builder_desc: "만들기/건축/커스터마이징에 관심이 큰 성향.",
      trader: "경제형",
      trader_desc: "아이템 가치/거래에 관심이 큰 성향.",
      roleplayer: "몰입형",
      roleplayer_desc: "스토리/캐릭터/역할놀이에 몰입하는 성향.",
      casual: "라이트형",
      casual_desc: "부담 없이 가볍게 즐기는 성향."
    }
  },

  init() {
    const saved = localStorage.getItem('locale');
    if (saved && this.messages[saved]) {
      this.currentLocale = saved;
    }
    this.updateUI();
    this.setupListeners();
  },

  setLocale(locale) {
    if (this.messages[locale]) {
      this.currentLocale = locale;
      localStorage.setItem('locale', locale);
      this.updateUI();
    }
  },

  t(key) {
    return this.messages[this.currentLocale][key] || this.messages['en'][key] || key;
  },

  updateUI() {
    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    // Update language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.id === `lang-${this.currentLocale}`);
    });

    // Update HTML lang attribute
    document.documentElement.lang = this.currentLocale;
  },

  setupListeners() {
    document.getElementById('lang-en')?.addEventListener('click', () => this.setLocale('en'));
    document.getElementById('lang-ko')?.addEventListener('click', () => this.setLocale('ko'));
  }
};

// Initialize i18n when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
  i18n.init();
}
