// Internationalization (i18n) Module
const i18n = {
  currentLocale: 'en',

  messages: {
    en: {
      // Navigation
      nav_analyze: "Analyze",
      nav_about: "About",
      nav_about_us: "About Us",
      nav_archetypes: "Archetypes",
      nav_faq: "FAQ",
      nav_contact: "Contact",

      // Hero
      hero_title: "Discover Your Roblox Playstyle",
      hero_subtitle: "Find out what type of Roblox player you are with our free analysis tool. Like MBTI for gamers!",
      hero_cta: "Start Free Analysis",

      // Quick Analysis
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

      // Full Analysis CTA
      full_analysis: "Full Analysis",
      full_desc: "Login with Roblox OAuth and complete a survey for personalized, high-confidence results.",
      feature_1: "8-question personality survey",
      feature_2: "Primary & Secondary archetype",
      feature_3: "Detailed score breakdown",
      feature_4: "Shareable result card",
      get_started: "Get Started",

      // About Section
      about_title: "About Roblox Archetype",
      about_what_title: "What is Roblox Archetype?",
      about_what_desc: "Roblox Archetype is a free tool that analyzes your Roblox gaming behavior and categorizes your playstyle into one of 8 distinct archetypes. Think of it as MBTI for Roblox players! Our algorithm examines your public profile data, badges, and group memberships to understand how you enjoy playing Roblox.",
      about_how_title: "How Does It Work?",
      about_how_desc: "Simply enter your Roblox username, and our system will analyze publicly available data from your profile. We look at patterns in your badges, the types of groups you've joined, and other public signals to determine your dominant playstyle. The analysis takes just a few seconds and requires no login.",
      about_privacy_title: "Your Privacy Matters",
      about_privacy_desc: "We only access publicly available information from Roblox. We never store your personal data, passwords, or any private information. Our analysis is based solely on public profile data that anyone can see on Roblox.",

      // Archetypes Section
      archetypes_title: "The 8 Player Archetypes",
      archetypes_intro: "Every Roblox player has a unique way of enjoying the platform. Discover which archetype best describes your playstyle.",

      // Archetypes
      explorer: "Explorer",
      explorer_desc: "Enjoys discovering new games and genres.",
      explorer_full: "Explorers love discovering new games and genres, always jumping between trending titles and hidden gems. They collect badges across many different games rather than grinding one title, and they're always the first to try something new.",
      grinder: "Grinder",
      grinder_desc: "Focuses on long-term progression and repetition.",
      grinder_full: "Grinders thrive on progression and achievement, dedicating hours to simulator games and tycoons where effort leads to visible progress. Their badge collections run deep in a few games, reflecting their patience and commitment to reaching every milestone.",
      socializer: "Socializer",
      socializer_desc: "Plays mainly for social interaction.",
      socializer_full: "Socializers play Roblox primarily for the community, enjoying hangout games and making friends in experiences like Adopt Me and Brookhaven. They belong to many groups and measure their enjoyment by the connections they make, not the achievements they earn.",
      competitor: "Competitor",
      competitor_desc: "Enjoys PvP, ranking, and skill improvement.",
      competitor_full: "Competitors live for the thrill of victory, dominating leaderboards and skill-based challenges in PvP games. They belong to competitive clans, practice seriously, and collect combat-oriented badges that reflect their drive to master game mechanics.",
      builder: "Builder",
      builder_desc: "Interested in creating, building, and customization.",
      builder_full: "Builders are the creative souls of Roblox, drawn to sandbox games, construction experiences, and Roblox Studio. They often belong to developer groups and express themselves through design, building, and sharing their own games or assets.",
      trader: "Trader",
      trader_desc: "Focused on item value and trading.",
      trader_full: "Traders master the economic side of Roblox through limited items and in-game trading. They follow market trends, join trading communities, and build impressive collections of rare and limited-edition items.",
      roleplayer: "Roleplayer",
      roleplayer_desc: "Immerses in story, character, and roleplay.",
      roleplayer_full: "Roleplayers immerse themselves in stories and characters, transforming every game into a storytelling opportunity. They seek out roleplay communities where imagination and collaborative narratives thrive, from Bloxburg businesses to fantasy quests.",
      casual: "Casual",
      casual_desc: "Light, short play sessions without deep focus.",
      casual_full: "Casuals play Roblox for pure fun and relaxation, without worrying about rankings or achievements. They enjoy quick, pressure-free sessions across whatever looks interesting, reminding everyone that gaming is ultimately about having fun.",

      // FAQ Section
      faq_title: "Frequently Asked Questions",
      faq_q1: "Is this service free?",
      faq_a1: "Yes! Roblox Archetype is completely free to use. Simply enter your username and get your results instantly.",
      faq_q2: "Is my account safe?",
      faq_a2: "Absolutely. We only read publicly available information from your Roblox profile. We never ask for or store passwords, and we cannot access any private data.",
      faq_q3: "How accurate is the analysis?",
      faq_a3: "Our quick analysis provides an estimate based on public data. For more accurate results, we recommend the full analysis which includes a personality survey. The quick analysis typically has 25-60% confidence.",
      faq_q4: "Can I have multiple archetypes?",
      faq_a4: "Yes! Most players have traits from multiple archetypes. We show your primary archetype along with scores for all 8 types, so you can see your complete gaming personality profile.",
      faq_q5: "Why can't you find my account?",
      faq_a5: "Make sure you're entering your exact Roblox username (not display name). If your profile is set to private, some features may be limited.",
      faq_q6: "Is this affiliated with Roblox?",
      faq_a6: "No, Roblox Archetype is an independent fan project and is not affiliated with, endorsed by, or sponsored by Roblox Corporation.",
      faq_q7: "What data do you use for the analysis?",
      faq_a7: "Our quick analysis uses only publicly available data — badges, group memberships, account age, and avatar. We never access private messages, friend lists, or any data not visible on your public profile.",
      faq_q8: "Can my archetype change over time?",
      faq_a8: "Yes! Your archetype reflects your current gaming behavior from your public profile. As you play new games, join different groups, and earn new badges, your scores can shift — re-analyze periodically to see the change.",
      faq_q9: "Why is my confidence score low?",
      faq_a9: "A low confidence score means your public profile has limited data for our algorithm. Making your badges and groups public, or using the full analysis with Roblox login, can improve your result.",
      faq_q10: "How is this different from other personality quizzes?",
      faq_a10: "Unlike quizzes that rely on self-reported answers, we analyze actual behavioral data from your Roblox profile — badges, groups, and account activity — to show how you actually play, not just how you think you play.",

      // How to Read Results Guide
      guide_title: "How to Read Your Results",
      guide_primary_title: "Primary Archetype",
      guide_primary_desc: "Your primary archetype is the playstyle that most strongly matches your public profile data. It appears at the top of your results with a large icon and name. This represents the dominant pattern in how you interact with the Roblox platform based on the data available to our algorithm.",
      guide_scores_title: "Score Breakdown",
      guide_scores_desc: "Below your primary archetype, you'll see a bar chart showing your scores across all eight archetypes on a 0-100 scale. Most players score in multiple categories, reflecting the natural diversity of gaming interests. A high score in several archetypes simply means you enjoy a well-rounded gaming experience.",
      guide_confidence_title: "Confidence Meter",
      guide_confidence_desc: "The confidence percentage tells you how reliable the analysis is for your specific profile. Higher confidence means more data was available and signals aligned strongly. A low confidence score (below 40%) suggests limited public data, and you may want to try the full analysis for better results.",

      // Tips for Accurate Analysis
      tips_title: "Tips for Accurate Analysis",
      tips_public_title: "Make Your Profile Public",
      tips_public_desc: "Our quick analysis relies on publicly visible data. If your inventory, badges, or groups are set to private, the algorithm has fewer signals to work with. Temporarily enabling public visibility for these sections can significantly improve your results.",
      tips_username_title: "Use Your Exact Username",
      tips_username_desc: "Enter your Roblox username, not your display name. Usernames are unique identifiers while display names can be duplicated. If you're not sure of your username, check your Roblox profile URL \u2014 it contains your exact username after the /users/ path.",
      tips_full_title: "Try the Full Analysis",
      tips_full_desc: "For the most accurate results, use the full analysis option which combines OAuth-verified data with a personality survey. The survey provides self-reported data points that complement the algorithmic analysis, resulting in higher confidence scores and more nuanced archetype profiles.",

      // Disclaimer page
      disclaimer: "Disclaimer",

      // Contact Form
      partnership: "Contact & Partnership",
      contact_desc: "Have questions, feedback, or partnership inquiries? We'd love to hear from you!",
      form_name: "Name / Company",
      form_name_placeholder: "John Doe / ABC Inc.",
      form_email: "Email",
      form_subject: "Subject",
      subject_general: "General Inquiry",
      subject_feedback: "Feedback",
      subject_bug: "Bug Report",
      subject_partnership: "Partnership",
      form_message: "Message",
      form_message_placeholder: "Tell us about your inquiry...",
      form_submit: "Send Message",

      // Footer
      footer_desc: "Free playstyle analysis tool for Roblox players. Discover your gaming personality today!",
      footer_links: "Quick Links",
      footer_legal: "Legal",
      privacy_policy: "Privacy Policy",
      terms_of_service: "Terms of Service",
      footer_note: "This is a fan project, not affiliated with Roblox Corporation.",

      // Errors
      error_not_found: "User not found. Please check the username.",
      error_api: "Failed to fetch data. Please try again.",
      error_login: "Login failed. Please try again.",

      // Auth
      logout: "Logout",
      analyze_my_account: "Analyze My Account",

      // Detail Page
      loading_detail: "Analyzing your playstyle...",
      stat_badges: "Badges Earned",
      stat_groups: "Groups",
      stat_account_age: "Days on Roblox",
      secondary_type: "Secondary:",
      back_home: "Back to Home",
      member_for: "Member for",
      personalized_insight: "Personalized Insight",
      recommended_games: "Recommended Games",
      live_games_note: "(Live games with 500+ players)",
      recommendations_desc: "Games from Roblox Discover, ranked by how well they match your playstyle.",
      disclaimer_text: "These are personalized recommendations based on your playstyle archetype, not a record of your gameplay history.",
      no_recommendations: "Unable to load recommendations. Please try again later.",
      error_no_user: "No user ID provided. Please go back and try again.",
      view_detail: "View Detailed Analysis",
      great_match: "Great Match",
      good_match: "Good Match",
      suggested: "Suggested",
      visits: "visits",
      playing: "playing",
      recommended_for_explorer: "Recommended for your Explorer playstyle",
      recommended_for_grinder: "Recommended for your Grinder playstyle",
      recommended_for_socializer: "Recommended for your Socializer playstyle",
      recommended_for_competitor: "Recommended for your Competitor playstyle",
      recommended_for_builder: "Recommended for your Builder playstyle",
      recommended_for_trader: "Recommended for your Trader playstyle",
      recommended_for_roleplayer: "Recommended for your Roleplayer playstyle",
      recommended_for_casual: "Recommended for your Casual playstyle",

      // Personalized Insights
      insight_explorer: "You have a natural curiosity for discovering new experiences. Your playstyle suggests you enjoy variety and adventure. We recommend games that offer exploration, quests, and new worlds to discover.",
      insight_grinder: "Your dedication to progression is impressive! You thrive on long-term goals and visible achievements. We suggest games with deep progression systems, prestige mechanics, and rewarding grind loops.",
      insight_socializer: "Connection is at the heart of your gaming experience. You value community and friendships. We recommend games with vibrant social features, hangout spaces, and cooperative gameplay.",
      insight_competitor: "You're driven by challenge and the thrill of competition. Improvement and victory motivate you. We suggest games with PvP, ranked modes, and skill-based matchmaking.",
      insight_builder: "Creativity flows through your gameplay. You love to design, construct, and express yourself. We recommend sandbox games, building experiences, and creative tools.",
      insight_trader: "You have a keen eye for value and economics. Strategic thinking is your strength. We suggest games with trading systems, market economies, and business simulations.",
      insight_roleplayer: "Your imagination transforms every game into a story. Character and narrative drive your experience. We recommend games with rich lore, roleplay communities, and immersive worlds.",
      insight_casual: "You play for pure enjoyment without pressure. Fun and relaxation are your priorities. We suggest accessible games with quick sessions and simple mechanics."
    },
    ko: {
      // Navigation
      nav_analyze: "분석",
      nav_about: "소개",
      nav_about_us: "소개",
      nav_archetypes: "유형",
      nav_faq: "FAQ",
      nav_contact: "문의",

      // Hero
      hero_title: "나의 Roblox 플레이스타일 찾기",
      hero_subtitle: "무료 분석 도구로 어떤 유형의 Roblox 플레이어인지 알아보세요. 게이머를 위한 MBTI!",
      hero_cta: "무료 분석 시작",

      // Quick Analysis
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

      // Full Analysis CTA
      full_analysis: "상세 분석",
      full_desc: "Roblox OAuth 로그인 후 설문을 완료하면 개인화된 고신뢰도 결과를 받을 수 있습니다.",
      feature_1: "8문항 성향 설문",
      feature_2: "주요 & 보조 유형 분석",
      feature_3: "상세 점수 분석",
      feature_4: "공유 가능한 결과 카드",
      get_started: "시작하기",

      // About Section
      about_title: "Roblox Archetype 소개",
      about_what_title: "Roblox Archetype이란?",
      about_what_desc: "Roblox Archetype은 여러분의 Roblox 게임 행동을 분석하여 8가지 플레이스타일 유형 중 하나로 분류하는 무료 도구입니다. Roblox 플레이어를 위한 MBTI라고 생각하세요! 우리의 알고리즘은 공개 프로필 데이터, 뱃지, 그룹 멤버십을 분석하여 여러분이 Roblox를 어떻게 즐기는지 파악합니다.",
      about_how_title: "어떻게 작동하나요?",
      about_how_desc: "Roblox 사용자명을 입력하면 시스템이 프로필의 공개 데이터를 분석합니다. 뱃지 패턴, 가입한 그룹 유형 및 기타 공개 신호를 확인하여 지배적인 플레이스타일을 결정합니다. 분석은 몇 초 만에 완료되며 로그인이 필요 없습니다.",
      about_privacy_title: "개인정보 보호",
      about_privacy_desc: "우리는 Roblox에서 공개적으로 사용 가능한 정보만 접근합니다. 개인 데이터, 비밀번호 또는 비공개 정보를 저장하지 않습니다. 분석은 Roblox에서 누구나 볼 수 있는 공개 프로필 데이터만을 기반으로 합니다.",

      // Archetypes Section
      archetypes_title: "8가지 플레이어 유형",
      archetypes_intro: "모든 Roblox 플레이어는 플랫폼을 즐기는 고유한 방식이 있습니다. 어떤 유형이 여러분의 플레이스타일을 가장 잘 설명하는지 알아보세요.",

      // Archetypes
      explorer: "탐험형",
      explorer_desc: "새로운 게임과 장르를 찾아다니는 성향.",
      explorer_full: "탐험형은 새로운 게임과 장르를 발견하는 것을 좋아하며 인기 게임과 숨겨진 명작을 넘나듭니다. 하나의 게임보다는 다양한 게임에서 뱃지를 수집하고, 새로 출시된 경험을 가장 먼저 시도합니다.",
      grinder: "파밍형",
      grinder_desc: "반복 루프와 장기 성장을 즐기는 성향.",
      grinder_full: "파밍형은 성장과 성취에서 보람을 느끼며 시뮬레이터, 타이쿤 등 노력이 보상으로 이어지는 게임을 즐깁니다. 뱃지 컬렉션은 몇몇 게임에 집중되어 있지만 수많은 플레이 시간을 반영합니다.",
      socializer: "사교형",
      socializer_desc: "사람들과 어울리는 것이 중심인 성향.",
      socializer_full: "사교형은 주로 커뮤니티를 위해 Roblox를 플레이하며 Adopt Me, Brookhaven 같은 행아웃 게임에서 친구를 사귑니다. 많은 그룹에 속하며 성취보다 인간관계로 즐거움을 측정합니다.",
      competitor: "경쟁형",
      competitor_desc: "승부/랭킹/실력 향상을 즐기는 성향.",
      competitor_full: "경쟁형은 승리의 스릴을 위해 PvP 게임과 랭킹에서 활약합니다. 경쟁 클랜에 속하고 연습을 진지하게 하며, 전투 지향적인 뱃지로 자신의 실력을 증명합니다.",
      builder: "창작형",
      builder_desc: "만들기/건축/커스터마이징에 관심이 큰 성향.",
      builder_full: "창작형은 Roblox의 창의적인 영혼으로, 샌드박스 게임과 Roblox Studio를 통해 자신을 표현합니다. 개발자 그룹에 속하고 자신만의 게임이나 에셋을 만드는 경우도 많습니다.",
      trader: "경제형",
      trader_desc: "아이템 가치/거래에 관심이 큰 성향.",
      trader_full: "경제형은 리미티드 아이템 거래와 시장 동향 파악에 능숙합니다. 트레이딩 커뮤니티에 참여하며 희귀 수집품으로 가치 있는 인벤토리를 구축합니다.",
      roleplayer: "몰입형",
      roleplayer_desc: "스토리/캐릭터/역할놀이에 몰입하는 성향.",
      roleplayer_full: "몰입형은 스토리와 캐릭터에 빠져들며 모든 게임을 스토리텔링의 기회로 변환합니다. 롤플레이 중심 커뮤니티에서 상상력과 협업 서사를 통해 게임을 즐깁니다.",
      casual: "라이트형",
      casual_desc: "부담 없이 가볍게 즐기는 성향.",
      casual_full: "라이트형은 랭킹이나 성취에 연연하지 않고 순수한 재미와 휴식을 위해 Roblox를 즐깁니다. 짧은 세션으로 자유롭게 플레이하며 게임의 즐거움을 있는 그대로 느낍니다.",

      // FAQ Section
      faq_title: "자주 묻는 질문",
      faq_q1: "이 서비스는 무료인가요?",
      faq_a1: "네! Roblox Archetype은 완전 무료입니다. 사용자명을 입력하면 즉시 결과를 받을 수 있습니다.",
      faq_q2: "내 계정은 안전한가요?",
      faq_a2: "물론입니다. Roblox 프로필의 공개 정보만 읽습니다. 비밀번호를 요청하거나 저장하지 않으며, 비공개 데이터에 접근할 수 없습니다.",
      faq_q3: "분석은 얼마나 정확한가요?",
      faq_a3: "빠른 분석은 공개 데이터를 기반으로 추정치를 제공합니다. 더 정확한 결과를 원하시면 성격 설문이 포함된 상세 분석을 권장합니다. 빠른 분석의 신뢰도는 보통 25-60%입니다.",
      faq_q4: "여러 유형을 가질 수 있나요?",
      faq_a4: "네! 대부분의 플레이어는 여러 유형의 특성을 가지고 있습니다. 주요 유형과 함께 8가지 유형 모두의 점수를 보여드려 완전한 게임 성격 프로필을 확인할 수 있습니다.",
      faq_q5: "왜 내 계정을 찾을 수 없나요?",
      faq_a5: "정확한 Roblox 사용자명(표시 이름이 아님)을 입력했는지 확인하세요. 프로필이 비공개로 설정되어 있으면 일부 기능이 제한될 수 있습니다.",
      faq_q6: "Roblox와 제휴되어 있나요?",
      faq_a6: "아니요, Roblox Archetype은 독립적인 팬 프로젝트이며 Roblox Corporation과 제휴, 보증 또는 후원 관계가 없습니다.",
      faq_q7: "분석에 어떤 데이터를 사용하나요?",
      faq_a7: "빠른 분석은 뱃지, 그룹 멤버십, 계정 연령, 아바타 등 공개 데이터만 사용합니다. 비공개 메시지, 친구 목록 등 공개 프로필에서 볼 수 없는 데이터에는 절대 접근하지 않습니다.",
      faq_q8: "유형이 시간이 지나면 바뀔 수 있나요?",
      faq_a8: "네! 유형은 공개 프로필에 나타난 현재 게임 행동을 반영합니다. 다른 게임을 플레이하거나 새 그룹에 가입하면 점수가 변할 수 있으니, 주기적으로 재분석해 보세요.",
      faq_q9: "왜 신뢰도 점수가 낮나요?",
      faq_a9: "낮은 신뢰도는 공개 프로필 데이터가 제한적이라는 의미입니다. 뱃지와 그룹을 공개로 설정하거나 Roblox 로그인으로 상세 분석을 이용하면 더 나은 결과를 얻을 수 있습니다.",
      faq_q10: "다른 성격 퀴즈와 무엇이 다른가요?",
      faq_a10: "자가 보고에 의존하는 퀴즈와 달리, 실제 프로필 데이터(뱃지, 그룹, 계정 활동)를 분석하여 실제 플레이 방식을 반영합니다.",

      // How to Read Results Guide
      guide_title: "결과 읽는 법",
      guide_primary_title: "대표 유형",
      guide_primary_desc: "대표 유형은 공개 프로필 데이터와 가장 강하게 일치하는 플레이스타일입니다. 결과 상단에 큰 아이콘과 이름으로 표시됩니다. 알고리즘에 사용 가능한 데이터를 기반으로 Roblox 플랫폼과 상호작용하는 방식의 지배적인 패턴을 나타냅니다.",
      guide_scores_title: "점수 분석",
      guide_scores_desc: "대표 유형 아래에 8가지 유형 모두에 대한 0-100 점수를 보여주는 막대 차트가 표시됩니다. 대부분의 플레이어는 여러 카테고리에서 점수를 받으며, 이는 게임 관심사의 자연스러운 다양성을 반영합니다. 여러 유형에서 높은 점수를 받는 것은 균형 잡힌 게임 경험을 즐긴다는 것을 의미합니다.",
      guide_confidence_title: "신뢰도 미터",
      guide_confidence_desc: "신뢰도 백분율은 특정 프로필에 대한 분석의 신뢰성을 알려줍니다. 높은 신뢰도는 더 많은 데이터가 있고 신호가 강하게 정렬되었음을 의미합니다. 낮은 신뢰도(40% 미만)는 공개 데이터가 제한적임을 시사하며, 더 나은 결과를 위해 상세 분석을 시도하는 것이 좋습니다.",

      // Tips for Accurate Analysis
      tips_title: "정확한 분석을 위한 팁",
      tips_public_title: "프로필 공개 설정",
      tips_public_desc: "빠른 분석은 공개적으로 볼 수 있는 데이터에 의존합니다. 인벤토리, 뱃지 또는 그룹이 비공개로 설정되어 있으면 알고리즘이 작업할 신호가 적어집니다. 이러한 섹션의 공개 설정을 일시적으로 활성화하면 결과를 크게 개선할 수 있습니다.",
      tips_username_title: "정확한 사용자명 사용",
      tips_username_desc: "표시 이름이 아닌 Roblox 사용자명을 입력하세요. 사용자명은 고유 식별자인 반면 표시 이름은 중복될 수 있습니다. 사용자명이 확실하지 않으면 Roblox 프로필 URL을 확인하세요 \u2014 /users/ 경로 뒤에 정확한 사용자명이 포함되어 있습니다.",
      tips_full_title: "상세 분석 시도",
      tips_full_desc: "가장 정확한 결과를 위해 OAuth 인증 데이터와 성격 설문을 결합하는 상세 분석 옵션을 사용하세요. 설문은 알고리즘 분석을 보완하는 자가 보고 데이터 포인트를 제공하여 더 높은 신뢰도 점수와 더 섬세한 유형 프로필을 제공합니다.",

      // Disclaimer
      disclaimer: "면책 조항",

      // Contact Form
      partnership: "문의 & 제휴",
      contact_desc: "질문, 피드백 또는 제휴 문의가 있으신가요? 연락 주세요!",
      form_name: "이름 / 회사명",
      form_name_placeholder: "홍길동 / ABC 주식회사",
      form_email: "이메일",
      form_subject: "문의 유형",
      subject_general: "일반 문의",
      subject_feedback: "피드백",
      subject_bug: "버그 신고",
      subject_partnership: "제휴",
      form_message: "문의 내용",
      form_message_placeholder: "문의 내용을 작성해주세요...",
      form_submit: "메시지 보내기",

      // Footer
      footer_desc: "Roblox 플레이어를 위한 무료 플레이스타일 분석 도구. 오늘 당신의 게임 성격을 발견하세요!",
      footer_links: "빠른 링크",
      footer_legal: "법적 고지",
      privacy_policy: "개인정보처리방침",
      terms_of_service: "이용약관",
      footer_note: "이 서비스는 팬 프로젝트이며, Roblox Corporation과 무관합니다.",

      // Errors
      error_not_found: "사용자를 찾을 수 없습니다. 사용자명을 확인해주세요.",
      error_api: "데이터를 가져오지 못했습니다. 다시 시도해주세요.",
      error_login: "로그인에 실패했습니다. 다시 시도해주세요.",

      // Auth
      logout: "로그아웃",
      analyze_my_account: "내 계정으로 분석",

      // Detail Page
      loading_detail: "플레이스타일 분석 중...",
      stat_badges: "획득 배지",
      stat_groups: "그룹",
      stat_account_age: "가입 일수",
      secondary_type: "부유형:",
      back_home: "홈으로 돌아가기",
      member_for: "가입 기간:",
      personalized_insight: "맞춤형 인사이트",
      recommended_games: "추천 게임",
      live_games_note: "(500명 이상 플레이 중인 게임)",
      recommendations_desc: "Roblox Discover의 게임을 플레이스타일에 맞게 순위를 매겼습니다.",
      disclaimer_text: "이 게임들은 플레이스타일 분석을 기반으로 한 개인화된 추천이며, 실제 게임 플레이 기록이 아닙니다.",
      no_recommendations: "추천을 불러올 수 없습니다. 나중에 다시 시도해주세요.",
      error_no_user: "사용자 ID가 제공되지 않았습니다. 다시 시도해주세요.",
      view_detail: "상세 분석 보기",
      great_match: "최고 매칭",
      good_match: "좋은 매칭",
      suggested: "추천",
      visits: "방문",
      playing: "플레이 중",
      recommended_for_explorer: "Explorer 플레이스타일에 추천",
      recommended_for_grinder: "Grinder 플레이스타일에 추천",
      recommended_for_socializer: "Socializer 플레이스타일에 추천",
      recommended_for_competitor: "Competitor 플레이스타일에 추천",
      recommended_for_builder: "Builder 플레이스타일에 추천",
      recommended_for_trader: "Trader 플레이스타일에 추천",
      recommended_for_roleplayer: "Roleplayer 플레이스타일에 추천",
      recommended_for_casual: "Casual 플레이스타일에 추천",

      // Personalized Insights
      insight_explorer: "새로운 경험을 발견하는 호기심이 있으시네요. 플레이스타일에 맞춰 탐험과 모험이 가득한 게임을 선별했습니다.",
      insight_grinder: "성장에 대한 열정이 대단하시네요! 플레이스타일에 맞춰 깊은 성장 시스템이 있는 게임을 선별했습니다.",
      insight_socializer: "게임 경험의 핵심에 연결이 있습니다. 플레이스타일에 맞춰 활발한 커뮤니티가 있는 게임을 선별했습니다.",
      insight_competitor: "도전과 경쟁의 스릴에 동기부여를 받습니다. 플레이스타일에 맞춰 PvP와 스킬 기반 게임을 선별했습니다.",
      insight_builder: "게임플레이에 창의력이 흐릅니다. 플레이스타일에 맞춰 샌드박스와 창작 게임을 선별했습니다.",
      insight_trader: "가치와 경제에 대한 날카로운 눈이 있습니다. 플레이스타일에 맞춰 거래와 경제 시스템이 있는 게임을 선별했습니다.",
      insight_roleplayer: "상상력이 모든 게임을 스토리로 바꿉니다. 플레이스타일에 맞춰 몰입감 있는 롤플레이 게임을 선별했습니다.",
      insight_casual: "부담 없이 순수한 즐거움을 위해 플레이합니다. 플레이스타일에 맞춰 재미있고 접근하기 쉬운 게임을 선별했습니다."
    }
  },

  async init() {
    const saved = localStorage.getItem('locale');

    if (saved && this.messages[saved]) {
      // User has a saved preference - use it
      this.currentLocale = saved;
    } else {
      // No saved preference - detect from IP
      try {
        const response = await fetch('/api/geo');
        if (response.ok) {
          const { country } = await response.json();
          // Korean IP → Korean, otherwise English
          this.currentLocale = (country === 'KR') ? 'ko' : 'en';
        }
      } catch (e) {
        // Fallback to English on error
        this.currentLocale = 'en';
      }
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
