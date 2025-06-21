# 투자자 데이터 업데이트 알림 시스템 분석

## 요구사항 분석

투자자 데이터가 업데이트될 때마다 다음 형식의 알림을 표시해야 합니다:

```
[name] of [continentName] contributed $[additionalAmount]!
Total contribution: $[totalContribution]
Continental Share: $[sharePercentage]
```

이 알림은 투자자 데이터가 업데이트될 때마다 자동으로 표시되어야 합니다.

## 현재 시스템 분석

### 1. 데이터 업데이트 감지 메커니즘

현재 시스템은 Supabase의 실시간 구독 기능을 사용하여 투자자 데이터의 변경사항을 감지합니다:

- `investorsStore.ts`의 `subscribeToInvestors` 함수는 'investors' 테이블의 모든 변경 이벤트(INSERT, UPDATE, DELETE)를 구독합니다.
- 변경 이벤트가 발생하면 로컬 상태를 자동으로 업데이트합니다.
- 특히 `payload.eventType === 'UPDATE'` 조건에서 투자자 데이터 업데이트를 감지합니다.

### 2. 기존 알림 시스템

프로젝트에는 이미 두 가지 알림 시스템이 구현되어 있습니다:

1. **관리자용 알림 시스템** (`NotificationSystem.tsx`)
   - 다양한 유형의 알림(성공, 오류, 경고, 정보)을 지원합니다.
   - 전역 상태를 사용하여 알림을 관리합니다.
   - `showSuccess`, `showError`, `showWarning`, `showInfo` 등의 함수를 제공합니다.

2. **투자 알림 시스템** (`InvestmentNotification.tsx`)
   - 투자 관련 알림을 위한 전용 컴포넌트입니다.
   - 투자자 이름, 대륙 이름, 투자 금액, 총 투자 금액 등의 정보를 표시합니다.
   - 전역 window 객체에 `addInvestmentNotification` 함수를 등록하여 어디서든 호출할 수 있게 합니다.
   - 메인 페이지에 이미 `<InvestmentNotificationManager isEnabled={true} />` 형태로 통합되어 있습니다.

## 구현 방안

### 1. 업데이트 감지 및 알림 트리거

투자자 데이터 업데이트를 감지하고 알림을 트리거하는 가장 적절한 위치는 `investorsStore.ts`의 `subscribeToInvestors` 함수 내부입니다:

```typescript
// 변경 유형에 따른 처리
if (payload.eventType === 'UPDATE') {
    const updatedInvestor = payload.new as Investor
    const previousInvestor = state.investors[updatedInvestor.id]
    
    // investment_amount가 변경된 경우에만 알림 표시
    if (previousInvestor && 
        updatedInvestor.investment_amount > previousInvestor.investment_amount) {
        
        // 추가 투자 금액 계산
        const additionalAmount = updatedInvestor.investment_amount - previousInvestor.investment_amount
        
        // 대륙 이름 가져오기
        const continentStore = useContinentStore.getState()
        const continentName = continentStore.continents[updatedInvestor.continent_id]?.name || '알 수 없는 대륙'
        
        // 총 투자 금액 계산
        const totalContribution = updatedInvestor.investment_amount
        
        // 대륙 내 점유율 계산
        const totalContinentInvestment = getTotalInvestmentByContinent(updatedInvestor.continent_id)
        const sharePercentage = (totalContribution / totalContinentInvestment) * 100
        
        // 알림 표시
        if (typeof window !== 'undefined' && window.addInvestmentNotification) {
            window.addInvestmentNotification({
                id: `investment_${Date.now()}`,
                investorName: updatedInvestor.name || '익명의 투자자',
                continentName: continentName,
                amount: additionalAmount,
                totalInvestment: totalContribution,
                sharePercentage: sharePercentage,
                timestamp: new Date()
            })
        }
    }
    
    // 기존 상태 업데이트 코드
    set(state => ({
        investors: {
            ...state.investors,
            [updatedInvestor.id]: {
                ...state.investors[updatedInvestor.id],
                ...updatedInvestor
            }
        }
    }))
}
```

### 2. 알림 컴포넌트 수정

현재 `InvestmentNotificationData` 인터페이스에는 `sharePercentage` 필드가 없으므로, 이를 추가해야 합니다:

```typescript
interface InvestmentNotificationData {
  id: string
  investorName: string
  continentName: string
  amount: number
  totalInvestment: number
  sharePercentage: number  // 추가된 필드
  timestamp: Date
}
```

그리고 `InvestmentToast` 컴포넌트를 수정하여 새로운 형식에 맞게 알림을 표시해야 합니다:

```tsx
<div className="space-y-1">
  <div className="text-sm text-gray-300">
    <span className="font-medium text-blue-400">{notification.investorName}</span>
    {' '}of{' '}
    <span className="font-medium text-purple-400">{notification.continentName}</span>
    {' '}contributed{' '}
    <span className="text-green-400 font-medium">${notification.amount.toLocaleString()}</span>!
  </div>
  
  <div className="flex justify-between text-xs">
    <span className="text-gray-400">Total contribution:</span>
    <span className="text-blue-400 font-medium">${notification.totalInvestment.toLocaleString()}</span>
  </div>
  
  <div className="flex justify-between text-xs">
    <span className="text-gray-400">Continental Share:</span>
    <span className="text-yellow-400 font-medium">{notification.sharePercentage.toFixed(2)}%</span>
  </div>
  
  <div className="text-xs text-gray-500 mt-2">
    {notification.timestamp.toLocaleTimeString()}
  </div>
</div>
```

## 구현 시 고려사항

1. **성능 최적화**: 대량의 업데이트가 동시에 발생할 경우, 알림이 너무 많이 표시되지 않도록 제한하는 메커니즘이 필요할 수 있습니다.

2. **타입 안전성**: `window.addInvestmentNotification`을 호출할 때 타입 안전성을 보장하기 위해 전역 타입 선언을 추가하는 것이 좋습니다.

3. **에러 처리**: 알림 표시 과정에서 발생할 수 있는 오류를 적절히 처리해야 합니다.

4. **테스트**: 알림 시스템이 다양한 시나리오에서 올바르게 작동하는지 테스트해야 합니다.

## 결론

투자자 데이터 업데이트 알림 시스템은 기존의 코드 구조를 활용하여 비교적 쉽게 구현할 수 있습니다. 주요 구현 단계는 다음과 같습니다:

1. `investorsStore.ts`의 `subscribeToInvestors` 함수에서 투자자 데이터 업데이트를 감지합니다.
2. 업데이트된 데이터를 기반으로 필요한 정보(이름, 대륙 이름, 추가 투자 금액, 총 투자 금액, 점유율)를 계산합니다.
3. `window.addInvestmentNotification` 함수를 호출하여 알림을 표시합니다.
4. `InvestmentNotification.tsx`를 수정하여 새로운 형식에 맞게 알림을 표시합니다.

이러한 접근 방식은 기존 코드 구조를 최대한 활용하면서도 요구사항을 충족하는 효과적인 알림 시스템을 구현할 수 있습니다.