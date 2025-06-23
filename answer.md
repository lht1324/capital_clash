# Capital Clash 프로젝트 - Next.js 서버/클라이언트 사이드 분석 결과

## 📋 프로젝트 개요
- **프로젝트명**: Capital Clash Frontend
- **프레임워크**: Next.js 15.3.3 (App Router 사용)
- **백엔드**: Supabase
- **상태 관리**: Zustand
- **스타일링**: Tailwind CSS

## 🏗️ 전체 아키텍처 구조

### 폴더 구조
```
src/
├── app/                    # Next.js App Router (서버 사이드)
│   ├── layout.tsx         # 루트 레이아웃 (서버 컴포넌트)
│   ├── page.tsx           # 메인 페이지 (클라이언트 컴포넌트)
│   └── admin/             # 관리자 페이지
│       ├── layout.tsx     # 관리자 레이아웃 (서버 컴포넌트)
│       └── page.tsx       # 관리자 페이지 (클라이언트 컴포넌트)
├── components/            # UI 컴포넌트들 (대부분 클라이언트 사이드)
│   ├── admin/            # 관리자 컴포넌트
│   └── main/             # 메인 애플리케이션 컴포넌트
├── lib/                  # 유틸리티 및 API 로직
│   └── supabase/         # Supabase API 함수들
├── store/                # Zustand 상태 관리 (클라이언트 사이드)
├── hooks/                # 커스텀 훅 (클라이언트 사이드)
├── types/                # TypeScript 타입 정의
└── utils/                # 유틸리티 함수들
```

## 🔍 서버 사이드 vs 클라이언트 사이드 분석

### ✅ 서버 사이드 (Server Components)
1. **레이아웃 컴포넌트들**
   - `src/app/layout.tsx` - 루트 레이아웃
   - `src/app/admin/layout.tsx` - 관리자 레이아웃
   - 메타데이터 설정 및 HTML 구조 제공

2. **API 로직**
   - `src/lib/supabase/` 폴더의 API 함수들
   - 서버에서 실행되는 데이터베이스 쿼리 로직

### ❌ 클라이언트 사이드 (Client Components)
**대부분의 컴포넌트가 클라이언트 사이드로 구성됨**

1. **페이지 컴포넌트들**
   - `src/app/page.tsx` - 메인 페이지
   - `src/app/admin/page.tsx` - 관리자 페이지

2. **UI 컴포넌트들** (모두 'use client' 지시어 사용)
   - 헤더, 사이드바, 모달 등 모든 인터랙티브 컴포넌트
   - 지도 컴포넌트 (Three.js 사용)
   - 폼 및 입력 컴포넌트들

3. **상태 관리**
   - Zustand 스토어들 (continentStore, investorsStore, userStore)
   - 클라이언트 사이드에서만 동작

4. **커스텀 훅**
   - `useOnSizeChanged.tsx`
   - `useSupabaseData.ts`

## 📊 분석 결과 요약

### 🔴 문제점: 서버/클라이언트 분리가 제대로 되지 않음

1. **과도한 클라이언트 사이드 의존성**
   - 거의 모든 페이지와 컴포넌트가 클라이언트 컴포넌트로 구성
   - Next.js App Router의 서버 컴포넌트 장점을 활용하지 못함

2. **API 라우트 부재**
   - Next.js API 라우트를 사용하지 않음
   - 모든 데이터 페칭이 클라이언트에서 직접 Supabase로 연결

3. **SEO 및 성능 최적화 부족**
   - 서버 사이드 렌더링의 이점을 충분히 활용하지 못함
   - 초기 로딩 시 모든 JavaScript가 클라이언트에서 실행

### 💡 개선 권장사항

1. **서버 컴포넌트 활용 증대**
   - 정적 콘텐츠나 초기 데이터 로딩은 서버 컴포넌트로 변경
   - 인터랙션이 필요한 부분만 클라이언트 컴포넌트로 분리

2. **API 라우트 도입**
   - `app/api/` 폴더에 API 라우트 추가
   - 민감한 데이터 처리는 서버 사이드에서 수행

3. **하이브리드 렌더링 전략**
   - 페이지별로 SSR, SSG, CSR을 적절히 조합
   - 데이터 특성에 따른 렌더링 방식 선택

## 🎯 결론

현재 프로젝트는 **Next.js를 사용하고 있지만 대부분이 클라이언트 사이드로 구성**되어 있어, 사실상 **SPA(Single Page Application)에 가까운 구조**입니다. Next.js의 서버 사이드 렌더링과 하이브리드 렌더링의 장점을 충분히 활용하지 못하고 있는 상태입니다.

**분리 상태**: ❌ **제대로 분리되지 않음** - 개선 필요