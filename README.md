# 타이틀

I don't plan on making a game full of dreams and hopes.

Win.

Trampling.

Show other losers that you're the best.

# 💰 돈으로 밀어붙이는 전쟁

실제 돈으로 병력을 구매하고 영토를 확장하는 전략 게임

## 🎯 MVP 목표

1주 안에 "실결제 → 전투 → 영토 변화" 성공시키기

## 🛠 기술 스택

- **Frontend**: Next.js 14 + React-Three-Fiber + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions)
- **Payment**: Lemon Squeezy Sandbox
- **Map Generation**: OpenAI GPT API
- **Deployment**: Vercel

## 📁 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/          # React 컴포넌트
│   ├── game/           # 게임 관련 컴포넌트
│   ├── ui/             # 재사용 가능한 UI 컴포넌트
│   └── auth/           # 인증 관련 컴포넌트
├── lib/                # 유틸리티 및 설정
│   ├── supabase.ts     # Supabase 클라이언트
│   └── utils.ts        # 공통 유틸리티
├── types/              # TypeScript 타입 정의
│   └── game.ts         # 게임 관련 타입
└── hooks/              # 커스텀 React 훅
```

## 🚀 개발 시작하기

1. 의존성 설치:
   ```bash
   npm install
   ```

2. 환경 변수 설정:
   ```bash
   cp .env.example .env.local
   # .env.local 파일을 편집하여 실제 값 입력
   ```

3. 개발 서버 실행:
   ```bash
   npm run dev
   ```

## 📋 개발 단계

- [x] **0단계**: 프로젝트 구조 생성
- [ ] **1단계**: Supabase 설정 및 DB 스키마
- [ ] **2단계**: 시즌 맵 생성 (GPT API)
- [ ] **3단계**: 회원가입 및 이미지 업로드
- [ ] **4단계**: 결제 시스템 (Lemon Squeezy)
- [ ] **5단계**: 전투 API
- [ ] **6단계**: 맵 렌더링 (React-Three-Fiber)
- [ ] **7단계**: 통합 테스트

## 🎮 게임 룰

- 10×10 격자의 대륙에서 진행
- ₩5 = 1,000 병력 구매
- 인접한 타일에만 공격 가능
- 승률 공식: `P = 0.02 + 0.96 / (1+e^(2·log10(A/D)))`
- 승리 시 타일 소유권 이동, 공격 병력 20% 소모
- 패배 시 공격 병력 전량 손실

## 📊 데이터베이스 스키마

자세한 내용은 `MVP_OVERVIEW.md` 참조

## 🔗 관련 링크

- [MVP 전체 계획](./MVP_OVERVIEW.md)
- [Supabase 프로젝트 설정](https://supabase.com)
- [Lemon Squeezy 대시보드](https://lemonsqueezy.com)
- [Vercel 배포](https://vercel.com) 