# 💰 구매 기능 구현 계획

## 📊 현재 판매 상품 분석

### 1. 영역 구매 (PurchaseTerritoryModal)
**기능:** 새로운 영역 구매 또는 기존 영역 투자 확대
- **신규 구매:** 사용자가 처음으로 대륙을 선택하고 투자
- **추가 투자:** 기존 영역에 추가 투자하여 점유율 확대

### 2. 대륙 변경 (TerritoryTab)
**기능:** 기존 투자금을 유지하며 다른 대륙으로 이전
- **현재 구현:** 무료 대륙 변경
- **향후 계획:** 대륙 변경 시 수수료 부과 ($5)

## 🎯 Polar 제품 구조 설계

### 제품 카테고리

#### 1. **영역 투자 상품 (Territory Investment)**
```typescript
// 제품 구조 예시
{
  name: "Territory Investment Package",
  description: "Secure your digital territory and expand your influence",
  pricing: {
    type: "one_time", // 일회성 구매
    amount: "dynamic" // 사용자 입력 금액에 따라 동적
  },
  benefits: [
    "Territory ownership",
    "Share percentage calculation",
    "Ranking participation"
  ]
}
```

#### 2. **프리미엄 기능 구독 (Premium Features)**
```typescript
{
  name: "Capital Clash Premium",
  description: "Unlock advanced features and benefits",
  pricing: {
    type: "recurring",
    interval: "monthly",
    amount: 999 // $9.99/month
  },
  benefits: [
    "Priority territory placement",
    "Advanced analytics",
    "Custom profile themes",
    "Image upload without review",
    "Unlimited continent transfers"
  ]
}
```

#### 3. **대륙 변경 상품 (Continent Transfer)**
```typescript
{
  name: "Continent Transfer",
  description: "Move your investment to a different continent",
  pricing: {
    type: "one_time",
    amount: 500 // $5.00
  },
  benefits: [
    "Instant continent transfer",
    "Investment amount preservation",
    "Ranking reset protection"
  ]
}
```

## 🔧 기술적 구현 계획

### 1. **Polar SDK 통합**

#### 설치 및 설정
```bash
npm install @polar-sh/sdk
```

#### 환경 변수 설정
```typescript
// .env.local
POLAR_ACCESS_TOKEN=your_access_token
POLAR_ORGANIZATION_ID=your_org_id
POLAR_SERVER=sandbox # or production
```

#### Polar 클라이언트 초기화
```typescript
// lib/polar/polar-client.ts
import { PolarApi } from '@polar-sh/sdk'

export const polarClient = new PolarApi({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.POLAR_SERVER
})
```

### 2. **제품 생성 및 관리**

#### 동적 투자 상품 생성
```typescript
// lib/polar/products.ts
export async function createTerritoryInvestmentProduct(amount: number) {
  return await polarClient.products.create({
    name: `Territory Investment - $${amount}`,
    description: `Invest $${amount} in your digital territory`,
    pricing: {
      type: 'one_time',
      amount: amount * 100 // cents 단위
    }
  })
}
```

#### 프리미엄 구독 상품
```typescript
export async function createPremiumSubscription() {
  return await polarClient.products.create({
    name: "Capital Clash Premium",
    description: "Advanced features and benefits",
    pricing: {
      type: 'recurring',
      interval: 'month',
      amount: 999 // $9.99
    }
  })
}
```

### 3. **체크아웃 프로세스 통합**

#### PurchaseTerritoryModal 수정
```typescript
// components/main/PurchaseTerritoryModal.tsx 수정
const handlePolarCheckout = async () => {
  try {
    // 1. 동적 제품 생성 또는 기존 제품 사용
    const product = await createTerritoryInvestmentProduct(investmentAmount)

    // 2. 체크아웃 세션 생성
    const checkout = await polarClient.checkout.create({
      products: [product.id],
      metadata: {
        userId: user.id,
        continentId: selectedContinentId,
        investmentType: isAdditionalInvestment ? 'additional' : 'new',
        investorName: investorName
      }
    })

    // 3. 체크아웃 페이지로 리디렉션
    window.location.href = checkout.url
  } catch (error) {
    console.error('체크아웃 생성 실패:', error)
  }
}
```

#### 대륙 변경 결제 통합
```typescript
// TerritoryTab.tsx 수정
const handleContinentTransferPurchase = async (targetContinentId: string) => {
  try {
    const checkout = await polarClient.checkout.create({
      products: [CONTINENT_TRANSFER_PRODUCT_ID],
      metadata: {
        userId: user.id,
        fromContinentId: userInvestmentInfo.continent_id,
        toContinentId: targetContinentId
      }
    })

    window.location.href = checkout.url
  } catch (error) {
    console.error('대륙 변경 체크아웃 실패:', error)
  }
}
```

### 4. **웹훅 처리**

#### 결제 완료 처리
```typescript
// pages/api/webhooks/polar.ts
import { investorsAPI } from '@/lib/supabase/supabase-investors-api'

export default async function handler(req: Request) {
  const event = req.body

  switch (event.type) {
    case 'order.created':
      await handleOrderCreated(event.data)
      break
    case 'subscription.created':
      await handleSubscriptionCreated(event.data)
      break
  }
}

async function handleOrderCreated(order: any) {
  const { userId, continentId, investmentType, investorName } = order.metadata

  if (investmentType === 'new') {
    // 새로운 투자자 생성
    await investorsAPI.insertInvestor(
      userId,
      continentId,
      order.amount / 100, // cents to dollars
      investorName
    )
  } else if (investmentType === 'additional') {
    // 기존 투자자 업데이트
    const investor = await investorsAPI.getInvestorByUserId(userId)
    await investorsAPI.updateInvestorInvestmentAmount(
      investor,
      order.amount / 100
    )
  }
}
```

### 5. **고객 포털 통합**

#### 구독/주문 관리 페이지
```typescript
// pages/billing.tsx
import { CustomerPortal } from '@polar-sh/sdk'

export default function BillingPage() {
  const handlePortalAccess = async () => {
    const portal = await CustomerPortal({
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      getCustomerId: () => user.polarCustomerId,
      server: process.env.POLAR_SERVER
    })

    window.location.href = portal.url
  }

  return (
    <button onClick={handlePortalAccess}>
      💳 Manage Billing
    </button>
  )
}
```

## 📈 단계별 구현 로드맵

### Phase 1: 기본 통합 (1-2주)
1. **Polar SDK 설치 및 설정**
2. **기본 제품 생성 (Territory Investment)**
3. **PurchaseTerritoryModal 결제 통합**
4. **웹훅 기본 처리**

### Phase 2: 고급 기능 (2-3주)
1. **프리미엄 구독 상품 추가**
2. **대륙 변경 유료화**
3. **고객 포털 통합**
4. **결제 히스토리 관리**

### Phase 3: 최적화 (1-2주)
1. **결제 UX 개선**
2. **에러 처리 강화**
3. **분석 및 메트릭스 연동**
4. **테스트 및 배포**

## 🛡️ 보안 및 검증

### 결제 검증
```typescript
// 결제 완료 후 검증 로직
const verifyPayment = async (orderId: string) => {
  const order = await polarClient.orders.get(orderId)

  if (order.status === 'succeeded') {
    // 결제 성공 - 데이터베이스 업데이트
    await processSuccessfulPayment(order)
  }
}
```

### 중복 결제 방지
```typescript
// 주문 ID를 사용한 중복 처리 방지
const processedOrders = new Set()

const handleOrderCreated = async (order: any) => {
  if (processedOrders.has(order.id)) {
    return // 이미 처리됨
  }

  processedOrders.add(order.id)
  // 주문 처리 로직
}
```

이 계획을 따라 구현하면 현재의 영역 구매 시스템을 Polar의 강력한 결제 인프라와 완벽하게 통합할 수 있으며, 향후 확장 가능한 수익화 모델을 구축할 수 있습니다.