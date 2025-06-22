# Next.js의 layout.tsx와 page.tsx 작동 과정

## layout.tsx 작동 방식

layout.tsx는 Next.js에서 여러 페이지에 공통적으로 적용되는 UI 레이아웃을 정의하는 파일입니다. 이 파일은 페이지 콘텐츠를 감싸는 구조를 제공합니다.

### 루트 layout.tsx
- 위치: `src/app/layout.tsx`
- 역할: 애플리케이션의 모든 페이지에 적용되는 기본 HTML 구조를 정의합니다.
- 주요 기능:
  - `<html>`, `<body>` 태그 설정
  - 메타데이터(title, description) 정의
  - 글꼴 설정 (Inter 폰트)
  - `children` prop을 통해 중첩된 레이아웃이나 페이지 콘텐츠를 렌더링

```tsx
// 예시: src/app/layout.tsx
export default function RootLayout({
    children,
}: {
    children: ReactNode
}) {
    return (
        <html lang="ko">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
```

### 중첩된 layout.tsx (admin 예시)
- 위치: `src/app/admin/layout.tsx`
- 역할: 특정 경로(/admin)에 대한 레이아웃을 정의합니다.
- 주요 기능:
  - 'use client' 지시어를 사용하여 클라이언트 컴포넌트로 정의
  - 관리자 권한 확인 및 인증 로직 구현
  - 권한이 없는 사용자를 홈페이지로 리다이렉트
  - 헤더와 같은 공통 UI 요소 포함
  - `children` prop을 통해 admin 경로의 페이지 콘텐츠를 렌더링

## page.tsx 작동 방식

page.tsx는 특정 라우트에서 표시되는 UI 컴포넌트를 정의하는 파일입니다. 이 파일은 해당 경로의 실제 페이지 콘텐츠를 구성합니다.

### 루트 page.tsx
- 위치: `src/app/page.tsx`
- 역할: 애플리케이션의 홈페이지(/) 콘텐츠를 정의합니다.
- 주요 기능:
  - 'use client' 지시어를 사용하여 클라이언트 컴포넌트로 정의
  - 데이터 로딩 상태 관리
  - Supabase 데이터 초기화 및 실시간 구독
  - 메인 페이지 UI 컴포넌트 렌더링 (Header, Sidebar, ContinentMap 등)

### 중첩된 page.tsx (admin 예시)
- 위치: `src/app/admin/page.tsx`
- 역할: 관리자 페이지(/admin) 콘텐츠를 정의합니다.
- 주요 기능:
  - 'use client' 지시어를 사용하여 클라이언트 컴포넌트로 정의
  - 관리자 대시보드 UI 렌더링
  - 관리자 기능 카드 그리드 표시

## 파일 간 상호작용 과정

Next.js에서 layout.tsx와 page.tsx 파일이 함께 작동하는 과정은 다음과 같습니다:

1. 사용자가 특정 URL에 접근하면 Next.js 라우터가 해당 경로를 분석합니다.
2. 경로에 해당하는 page.tsx 파일을 찾습니다.
3. 해당 경로와 상위 경로의 모든 layout.tsx 파일을 찾아 중첩 구조를 생성합니다.
4. 가장 바깥쪽 루트 layout.tsx부터 안쪽으로 중첩하여 렌더링합니다:
   - 루트 layout.tsx → 중간 경로 layout.tsx → 최종 경로 layout.tsx → page.tsx

### 예시: /admin 경로 접근 시 렌더링 과정
1. 사용자가 /admin 경로에 접근
2. Next.js가 다음 파일들을 순서대로 처리:
   - `src/app/layout.tsx` (루트 레이아웃)
   - `src/app/admin/layout.tsx` (admin 레이아웃)
   - `src/app/admin/page.tsx` (admin 페이지)
3. 렌더링 결과:
   ```
   <RootLayout>
     <AdminLayout>
       <AdminPage />
     </AdminLayout>
   </RootLayout>
   ```

이러한 구조는 코드 재사용성을 높이고, 일관된 UI를 유지하면서도 각 페이지에 특화된 콘텐츠를 제공할 수 있게 합니다.

## Next.js의 파일 기반 라우팅 시스템

Next.js는 일반 React와 달리 명시적인 라우팅 설정 코드(React Router 등)가 필요 없는 파일 시스템 기반 라우팅을 사용합니다. 이는 Next.js의 가장 큰 특징 중 하나입니다.

### 일반 React와 Next.js 라우팅의 차이점

#### 일반 React 라우팅 (React Router 사용 시)
```jsx
// App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
```

#### Next.js 라우팅
Next.js에서는 위와 같은 명시적인 라우팅 코드가 필요 없습니다. 대신 파일 시스템의 구조가 곧 라우팅 구조가 됩니다.

### App Router의 작동 방식

Next.js의 App Router는 `src/app` 디렉토리 내의 폴더 구조를 기반으로 라우팅을 자동으로 구성합니다:

1. **폴더 = URL 경로**: 각 폴더는 URL 경로의 세그먼트에 매핑됩니다.
   - `src/app/` → `/` (루트 경로)
   - `src/app/admin/` → `/admin`
   - `src/app/products/categories/` → `/products/categories`

2. **특수 파일**:
   - `page.tsx`: 해당 경로의 UI를 렌더링
   - `layout.tsx`: 해당 경로와 하위 경로의 공통 레이아웃 정의
   - `loading.tsx`: 로딩 상태 UI
   - `error.tsx`: 에러 상태 UI
   - `not-found.tsx`: 404 페이지

3. **동적 라우팅**:
   - `[id]` 형식의 폴더명으로 동적 세그먼트 정의
   - 예: `src/app/products/[id]/page.tsx` → `/products/1`, `/products/2` 등

### Capital Clash 프로젝트의 라우팅 구조 예시

```
src/app/
├── layout.tsx      # 루트 레이아웃 (/)
├── page.tsx        # 홈페이지 (/)
├── admin/
│   ├── layout.tsx  # 관리자 레이아웃 (/admin)
│   └── page.tsx    # 관리자 페이지 (/admin)
```

이 구조에서:
- `/` 경로는 `src/app/page.tsx`에 의해 처리됩니다.
- `/admin` 경로는 `src/app/admin/page.tsx`에 의해 처리됩니다.

### 파일 시스템 기반 라우팅의 장점

1. **직관적인 구조**: 폴더 구조만 보고도 애플리케이션의 라우팅 구조를 쉽게 이해할 수 있습니다.
2. **코드 감소**: 명시적인 라우팅 설정 코드가 필요 없어 코드량이 줄어듭니다.
3. **자동 코드 분할**: 각 경로는 자동으로 별도의 번들로 분할되어 성능이 향상됩니다.
4. **쉬운 확장성**: 새 페이지를 추가하려면 해당 경로에 폴더와 page.tsx 파일만 생성하면 됩니다.

이러한 파일 시스템 기반 라우팅은 개발자가 라우팅 로직보다 UI 컴포넌트와 비즈니스 로직에 집중할 수 있게 해주며, 프로젝트 구조를 더 명확하고 일관되게 유지할 수 있게 합니다.
