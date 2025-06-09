# Capital Clash → 온라인 광고판 개발 진행 상황

## 📋 프로젝트 개요
- **기존**: 실제 돈으로 병력을 구매하고 영토를 확장하는 전략 게임
- **새로운 방향**: 투자 지분율에 따라 크기가 달라지는 온라인 광고판 시스템

### 핵심 기능
- 사용자가 투자한 금액에 비례하여 타일 크기 결정
- 타일에 사용자 이미지 표시 (관리자 승인 시스템)
- 타일 클릭 시 사용자 정보 표시
- 투자자별 프로필 정보 관리

### 🚨 중요 제약사항
- **1인당 1개 타일 제한**: 사용자는 하나의 대륙에만 타일을 가질 수 있음
- 복수 타일 소유 불가, 단일 타일 업그레이드 또는 대륙 이전만 가능
- UI는 모두 단일 타일 중심으로 설계됨

## 🛠 기술 스택
- **Frontend**: Next.js 14 (App Router), React Three Fiber, TypeScript, Tailwind CSS
- **상태관리**: Zustand
- **3D 렌더링**: Three.js
- **라이브러리**: maxrects-packer (Treemap 배치)
- **Backend**: Supabase

## ✅ 완료된 단계 (1-16)

### 핵심 구현 사항
1. **투자자 정보 시스템**:
   - 타일 위치, 이미지 상태, 프로필 정보 관리
   - 실시간 위치 정보 업데이트

2. **UI 컴포넌트**:
   - 설정 패널: 투자자 정보, 이미지 업로드, 프로필 관리
   - 프로필 보기: 투자 정보, 통계, 외부 링크
   - Header: 새로운 로고, 로그인/로그아웃, 프로필 드롭다운
   - Sidebar: 3개 탭 (개요/내 영역/통계)

3. **Billboard 배치 알고리즘**:
   - 셀 기반 계산 (50×50 기준)
   - 지분율에 따른 정사방형 크기 결정
   - 행 우선 순회 방식 배치
   - 성능 최적화: 3,000회/초 → 0회/초

4. **관리자 시스템**:
   - 사용자/타일/이미지 관리
   - 실시간 통계 및 모니터링
   - 시스템 설정 및 유지보수

## 🔄 최근 업데이트 및 이슈

### 초기화 및 재구현 시작
**완료 일시**: 2025년 1월 현재 세션

**1. 초기화된 부분**:
- 인증 관련 파일 제거:
  - `src/app/auth/callback/page.tsx`
  - `src/hooks/useAuth.ts`
  - `src/store/userStore.ts`
  - `src/app/RootLayoutClient.tsx`
- UI 컴포넌트 제거:
  - `src/components/ui/button.tsx`
  - `src/components/ui/avatar.tsx`
  - `src/components/ui/dropdown-menu.tsx`
- Three.js 관련:
  - `src/components/ThreeCanvas.tsx`
  - `src/components/ThreeProvider.tsx`
  - `src/contexts/ThreeContext.tsx`

**2. 재구현 완료된 부분**:
- 헤더 UI 재구성:
  - 로고: 왼쪽 배치 (Capital Clash)
  - 주요 버튼: 중앙 배치 (Leaderboard, Purchase Territory)
  - 로그인: 오른쪽 배치 (Google OAuth)
- 모달 시스템:
  - RankingModal: 리더보드 표시
  - PurchaseTileModal: 영역 구매 인터페이스
- 인증 시스템:
  - userStore: 로그인 상태 관리
  - Google OAuth: Supabase 연동
  - 실시간 상태 감지 및 업데이트

**3. 현재 상태**:
- ✅ 헤더 UI 완성
- ✅ 모달 시스템 작동
- ✅ 로그인 시스템 작동 (Google OAuth)
- ✅ 실시간 상태 관리

## 🔄 진행 중인 단계

### 17단계: Supabase 통합 및 실시간 멀티유저 플랫폼 전환
**현재 상태**: 17/20 단계 (85% 완료)

#### ✅ 완료된 부분
1. **Supabase 인프라**:
   - 클라이언트 설정 및 타입 정의
   - 8개 테이블 스키마 구현
   - API 및 커스텀 훅 구현

2. **실시간 멀티유저 시스템**:
   - Supabase 우선 저장 구조
   - 자동 스토어 초기화
   - 실시간 동기화

3. **조회수 시스템**:
   - 세션 기반 중복 방지
   - 실시간 통계 및 순위
   - 관리자 기능 구현

#### 🔄 진행 필요
1. **사이드바 실제 데이터 연동**
2. **헤더 네비게이션 개선**
3. **완전성 테스트 진행**

## 📋 예정된 단계

### 18단계: UI 데이터 연결 및 실제 인터랙션
1. **3D 맵 통합**:
   - Treemap → 3D 위치 반영
   - 실시간 업데이트
   - 이미지 조건부 렌더링

2. **영역 구매 시스템**:
   - 구매 모달 구현
   - 실시간 지분율 계산
   - 결제 시스템 준비

3. **추가 투자/이전 시스템**:
   - 지분율 증가에 따른 크기 변경
   - 24시간 쿨다운
   - VIP 검증

4. **실시간 알림 시스템**:
   - 투자/VIP/이미지 알림
   - 알림 히스토리
   - 커스텀 UI

### 19단계: 이미지 승인 시스템
1. **관리자 인터페이스**:
   - 승인 대시보드
   - 일괄 처리
   - 자동 필터링

2. **실시간 업데이트**:
   - 승인 상태 반영
   - 렌더링 최적화
   - 히스토리 관리

### 20단계: 결제 시스템
1. **결제 통합**:
   - Lemon Squeezy 연동
   - 결제 플로우
   - 실시간 알림

2. **관리 시스템**:
   - 결제 히스토리
   - 환불 처리
   - 통계 대시보드

## 🗂 주요 파일 구조
```
src/
├── lib/
│   ├── treemapAlgorithm.ts    # Billboard 알고리즘
│   ├── supabase.ts            # Supabase 클라이언트
│   └── supabase-api.ts        # API 래퍼
├── store/
│   └── continentStore.ts      # 상태 관리
├── components/
│   ├── ContinentMap.tsx       # 3D 맵
│   ├── TileSettingsPanel.tsx  # 설정 패널
│   ├── ProfileViewModal.tsx   # 프로필 보기
│   ├── Header.tsx             # 헤더
│   └── Sidebar.tsx            # 사이드바
└── app/
    ├── page.tsx               # 메인 페이지
    ├── profile/              # 프로필
    └── admin/                # 관리자
```

## 📞 개발 명령어
```bash
cd /c%3A/Users/Jaeho/Desktop/Projects/Playground/capital_clash_fe
npm run dev
npm run type-check
```
