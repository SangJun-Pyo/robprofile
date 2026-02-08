# Roblox Archetype (robprofile)

Roblox 유저의 플레이/선호 패턴을 설문 기반으로 수집해 **아키타입(Archetype)** 으로 분류하고,  
결과를 바탕으로 **맞춤형 Roblox 게임을 추천**해주는 웹서비스입니다.

- 핵심 목표: “성향 보여주기”에서 끝나는 게 아니라 **추천까지 연결되는 경험**을 만드는 것
- Live: https://robprofile.pages.dev  

---

## What it does

### Flow
1. 사용자 설문/선택 입력
2. 점수화(가중치 기반) → 아키타입 분류
3. 결과 페이지에서
   - 아키타입 설명
   - 추천 게임 리스트 제공

### Why Archetype?
유저의 취향/플레이 스타일을 구조화하면, 단순 인기순이 아니라  
**“이 유저에게 맞는 게임”**을 추천하는 기준을 만들 수 있다고 생각했습니다.

---

## Tech Stack

### Frontend
- HTML / CSS / JavaScript (Vanilla)

### Backend / API
- Node.js (Express)
- Serverless Functions (Firebase Functions)

### Hosting / Deploy
- Cloudflare Pages (pages.dev)
- Firebase Hosting (functions/api)
- GitHub (version control)

### Integration
- Roblox 관련 외부 API 연동(프로필/게임 데이터 조회)

### Data / Recommendation Logic
- 설문 응답 정형화
- 점수/가중치 기반 Archetype 분류
- Archetype → 추천 게임 매핑(룰 기반)

### Reliability
- 환경변수 관리
- 에러 핸들링/예외 케이스 처리
- 캐시 적용(응답 속도/안정성 개선)

