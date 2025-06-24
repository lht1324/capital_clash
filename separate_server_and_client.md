# Sidebar.tsx 서버/클라이언트 분리 예시

## 🔍 현재 상태 (분리되지 않음)

### 현재 Sidebar.tsx 구조
```typescript
'use client'  // 전체가 클라이언트 컴포넌트

export default function Sidebar() {
    // 1. 상태 관리 (클라이언트에서만 가능)
    const [activeTab, setActiveTab] = useState('overview')
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)

    // 2. 스토어 사용 (클라이언트에서만 가능)
    const { continents, isSidebarOpen, setSidebarOpen } = useContinentStore()
    const { investors } = useInvestorStore()
    const { user } = useUserStore()

    // 3. 복잡한 계산 로직 (서버에서도 가능)
    const userInvestmentInfo = useMemo(() => {
        return investorList.find((investor) => investor.user_id === user?.id)
    }, [user, investorList])

    // 4. 이벤트 핸들러 (클라이언트에서만 가능)
    const handleImageUpload = useCallback(async (file: File) => {
        // API 호출 로직
    }, [user, userInvestmentInfo])

    // 5. UI 렌더링 (인터랙션 포함)
    return (
        <div>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
                토글 버튼
            </button>
            {/* 복잡한 UI 구조 */}
        </div>
    )
}
```

**문제점:**
- 모든 로직이 클라이언트에서 실행됨
- 초기 데이터 로딩도 클라이언트에서 처리
- SEO 최적화 불가능
- 초기 로딩 시간 증가

---

## ✅ 분리 후 상태 (서버 + 클라이언트 조합)

### 1. 서버 컴포넌트 (SidebarContainer.tsx)
```typescript
// 서버 컴포넌트 - 'use client' 없음
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import SidebarClient from './SidebarClient'

interface SidebarData {
    user: User | null
    userInvestmentInfo: Investor | null
    continents: Record<string, Continent>
    investors: Investor[]
}

export default async function SidebarContainer() {
    // 서버에서 초기 데이터 페칭
    const supabase = createServerComponentClient({ cookies })

    // 1. 사용자 정보 가져오기 (서버에서)
    const { data: { user } } = await supabase.auth.getUser()

    // 2. 투자자 정보 가져오기 (서버에서)
    const { data: investors } = await supabase
        .from('investors')
        .select('*')

    // 3. 대륙 정보 가져오기 (서버에서)
    const { data: continents } = await supabase
        .from('continents')
        .select('*')

    // 4. 사용자 투자 정보 계산 (서버에서)
    const userInvestmentInfo = investors?.find(
        investor => investor.user_id === user?.id
    ) || null

    // 5. 초기 데이터를 클라이언트 컴포넌트에 전달
    const sidebarData: SidebarData = {
        user,
        userInvestmentInfo,
        continents: continents?.reduce((acc, continent) => {
            acc[continent.id] = continent
            return acc
        }, {} as Record<string, Continent>) || {},
        investors: investors || []
    }

    // 로그인하지 않은 경우 서버에서 처리
    if (!user) {
        return null
    }

    return <SidebarClient initialData={sidebarData} />
}
```

### 2. 클라이언트 컴포넌트 (SidebarClient.tsx)
```typescript
'use client'  // 인터랙션이 필요한 부분만 클라이언트

import { useState, useCallback, useMemo } from 'react'
import { SidebarData } from './types'

interface Props {
    initialData: SidebarData
}

export default function SidebarClient({ initialData }: Props) {
    // 1. 인터랙션 상태만 클라이언트에서 관리
    const [activeTab, setActiveTab] = useState<'overview' | 'territory' | 'stats'>('overview')
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)

    // 2. 서버에서 받은 초기 데이터 사용
    const { user, userInvestmentInfo, continents, investors } = initialData

    // 3. 클라이언트에서만 필요한 계산 (인터랙션 관련)
    const sharePercentage = useMemo(() => {
        if (!userInvestmentInfo) return 0
        const totalAmount = investors
            .filter(inv => inv.continent_id === userInvestmentInfo.continent_id)
            .reduce((sum, inv) => sum + inv.investment_amount, 0)
        return (userInvestmentInfo.investment_amount / totalAmount) * 100
    }, [userInvestmentInfo, investors])

    // 4. 이벤트 핸들러 (클라이언트에서만 가능)
    const handleImageUpload = useCallback(async (file: File) => {
        if (!user || !userInvestmentInfo) return

        try {
            // API 호출 로직
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            })
            // 처리 로직...
        } catch (error) {
            console.error('Upload failed:', error)
        }
    }, [user, userInvestmentInfo])

    return (
        <>
            {/* 토글 버튼 - 인터랙션 필요 */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="fixed top-20 right-0 z-20"
            >
                My Info
            </button>

            {/* 사이드바 내용 */}
            <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                {/* 탭 버튼들 - 인터랙션 필요 */}
                <div className="tab-header">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={activeTab === 'overview' ? 'active' : ''}
                    >
                        Overview
                    </button>
                    {/* 다른 탭들... */}
                </div>

                {/* 탭 내용 렌더링 */}
                {activeTab === 'overview' && (
                    <OverviewTab
                        userInvestmentInfo={userInvestmentInfo}
                        sharePercentage={sharePercentage}
                        onImageUpload={handleImageUpload}
                    />
                )}
            </div>
        </>
    )
}
```

### 3. API 라우트 추가 (app/api/upload-image/route.ts)
```typescript
// 서버 사이드 API 처리
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const supabase = createRouteHandlerClient({ cookies })

    try {
        // 인증 확인
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 파일 업로드 처리
        const formData = await request.formData()
        const file = formData.get('file') as File

        // Supabase Storage에 업로드
        const { data, error } = await supabase.storage
            .from('images')
            .upload(`${user.id}/${file.name}`, file)

        if (error) throw error

        return NextResponse.json({ success: true, data })
    } catch (error) {
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
```

---

## 📊 분리의 장점

### ✅ 성능 개선
- **초기 로딩 속도 향상**: 서버에서 데이터를 미리 가져와서 전달
- **JavaScript 번들 크기 감소**: 서버 로직이 클라이언트로 전송되지 않음
- **캐싱 최적화**: 서버 컴포넌트는 자동으로 캐싱됨

### ✅ SEO 최적화
- **서버 사이드 렌더링**: 초기 HTML에 데이터가 포함됨
- **메타데이터 설정**: 서버에서 동적 메타데이터 생성 가능

### ✅ 보안 강화
- **민감한 로직 보호**: API 키, 데이터베이스 쿼리가 서버에서만 실행
- **인증 처리**: 서버에서 안전하게 사용자 인증 확인

### ✅ 개발 경험 개선
- **명확한 책임 분리**: 서버 로직과 클라이언트 로직이 명확히 구분
- **타입 안전성**: 서버에서 클라이언트로 전달되는 데이터의 타입 보장

---

## 🎯 분리 원칙

1. **서버 컴포넌트에서 처리할 것들:**
    - 초기 데이터 페칭
    - 데이터베이스 쿼리
    - 인증 확인
    - 정적 계산 로직

2. **클라이언트 컴포넌트에서 처리할 것들:**
    - 사용자 인터랙션 (클릭, 입력 등)
    - 상태 관리 (useState, useEffect)
    - 브라우저 API 사용
    - 실시간 업데이트

이렇게 분리하면 Next.js의 장점을 최대한 활용하면서도 사용자 경험을 향상시킬 수 있습니다.

---

## 📁 Sidebar 분리에 따른 폴더 구조 변경

### 🔴 분리 전 구조
```
src/
└── components/
    └── main/
        └── sidebar/
            ├── Sidebar.tsx                    # 모든 로직이 하나의 파일에 집중
            ├── OverviewTab.tsx
            ├── TerritoryTab.tsx
            ├── StatsTab.tsx
            ├── ImageUploadModal.tsx
            └── TerritoryInfoEditModal.tsx
```

### ✅ 분리 후 구조
```
src/
├── app/
│   └── api/                                   # 🆕 API 라우트 추가
│       └── upload-image/
│           └── route.ts                       # 이미지 업로드 API
│
└── components/
    └── main/
        └── sidebar/
            ├── SidebarContainer.tsx           # 🆕 서버 컴포넌트 (데이터 페칭)
            ├── SidebarClient.tsx              # 🆕 클라이언트 컴포넌트 (인터랙션)
            ├── GetProductsTypes.ts                       # 🆕 타입 정의 분리
            ├── OverviewTab.tsx                # 기존 파일 (수정됨)
            ├── TerritoryTab.tsx               # 기존 파일 (수정됨)
            ├── StatsTab.tsx                   # 기존 파일 (수정됨)
            ├── ImageUploadModal.tsx           # 기존 파일
            └── TerritoryInfoEditModal.tsx     # 기존 파일
```

### 📋 변경 사항 상세

#### 🆕 새로 생성되는 파일들

1. **`SidebarContainer.tsx`** (서버 컴포넌트)
    - 기존 `Sidebar.tsx`의 데이터 페칭 로직 담당
    - 서버에서 초기 데이터 로딩
    - 인증 상태 확인

2. **`SidebarClient.tsx`** (클라이언트 컴포넌트)
    - 기존 `Sidebar.tsx`의 인터랙션 로직 담당
    - 사용자 이벤트 처리
    - 상태 관리

3. **`GetProductsTypes.ts`** (타입 정의)
    - 서버-클라이언트 간 데이터 전달 타입
    - 인터페이스 정의 분리

4. **`app/api/upload-image/route.ts`** (API 라우트)
    - 이미지 업로드 서버 로직
    - 인증 및 파일 처리

#### 🔄 수정되는 파일들

1. **`OverviewTab.tsx`**, **`TerritoryTab.tsx`**, **`StatsTab.tsx`**
    - Props 인터페이스 변경
    - 서버에서 전달받은 데이터 사용
    - 이벤트 핸들러 Props로 전달받음

#### ❌ 삭제되는 파일들

1. **`Sidebar.tsx`** (기존 파일)
    - `SidebarContainer.tsx`와 `SidebarClient.tsx`로 분리됨

### 🔄 사용 방법 변경

#### 분리 전 (기존)
```typescript
// 페이지에서 직접 사용
import Sidebar from '@/components/main/sidebar/Sidebar'

export default function MainPage() {
    return (
        <div>
            <Sidebar />  {/* 모든 로직이 클라이언트에서 실행 */}
        </div>
    )
}
```

#### 분리 후 (개선)
```typescript
// 페이지에서 서버 컴포넌트 사용
import SidebarContainer from '@/components/main/sidebar/SidebarContainer'

export default function MainPage() {
    return (
        <div>
            <SidebarContainer />  {/* 서버에서 데이터 로딩 후 클라이언트로 전달 */}
        </div>
    )
}
```

### 📊 구조 변경의 이점

1. **명확한 책임 분리**
    - 서버 로직과 클라이언트 로직이 파일 단위로 분리
    - 각 파일의 역할이 명확해짐

2. **재사용성 향상**
    - 타입 정의가 별도 파일로 분리되어 재사용 가능
    - API 라우트가 다른 컴포넌트에서도 활용 가능

3. **유지보수성 개선**
    - 서버 로직 수정 시 클라이언트 코드에 영향 없음
    - 각 파일의 크기가 작아져 관리하기 쉬움

4. **성능 최적화**
    - 서버 컴포넌트는 클라이언트 번들에 포함되지 않음
    - 초기 로딩 시간 단축
