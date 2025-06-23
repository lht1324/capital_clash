# useSupabaseData.ts 구독 해제 및 재구독 문제 분석

## 1. unsubscribeFromInvestors() 호출 시점

### 📍 호출되는 상황들

**1. 페이지 가시성 변화 시 (visibilitychange 이벤트)**
```typescript
const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
        console.log('🔄 페이지 포커스 감지, 실시간 연결 확인 중...')
        unsubscribeFromInvestors() // 기존 구독 정리
        subscribeToInvestors() // 새로운 구독 설정
        console.log('🔄 실시간 연결 재설정 완료')
    }
}
```
- 사용자가 다른 탭에서 돌아올 때
- 브라우저 창을 최소화했다가 다시 활성화할 때
- 모바일에서 앱을 백그라운드에서 포그라운드로 전환할 때

**2. 네트워크 상태 변화 시 (online/offline 이벤트)**
```typescript
const handleNetworkChange = () => {
    if (navigator.onLine) {
        console.log('🌐 네트워크 연결 감지, 실시간 연결 재설정 중...')
        unsubscribeFromInvestors()
        subscribeToInvestors()
    } else {
        console.log('🔌 네트워크 연결 끊김')
    }
}
```
- 네트워크 연결이 끊어졌다가 다시 연결될 때
- WiFi에서 모바일 데이터로 전환될 때

**3. 컴포넌트 언마운트 시 (useEffect cleanup)**
```typescript
return () => {
    unsubscribeFromInvestors()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('online', handleNetworkChange)
    window.removeEventListener('offline', handleNetworkChange)
}
```
- 페이지를 떠날 때
- 컴포넌트가 제거될 때

## 2. 재구독이 안 되는 문제 원인

### ⚠️ 주요 문제점들

**1. 비동기 구독 해제로 인한 타이밍 문제**
```typescript
unsubscribeFromInvestors: () => {
    if (investorsSubscription) {
        // 먼저 진행 중인 비동기 작업 취소
        const state = get();
        if (state.abortController) {
            state.abortController.abort();
        }

        // 약간의 지연 후 구독 해제 (진행 중인 작업이 정리될 시간 제공)
        setTimeout(() => {
            investorsSubscription!!.unsubscribe().then();
            investorsSubscription = null
            console.log('🔄 투자자 실시간 구독 해제')
        }, 100);
    }
}
```

**문제점:**
- `setTimeout`으로 100ms 지연 후 구독 해제
- `unsubscribeFromInvestors()` 호출 직후 `subscribeToInvestors()` 호출
- 구독 해제가 완료되기 전에 재구독 시도
- `investorsSubscription`이 아직 null이 아닌 상태에서 재구독 시도

**2. subscribeToInvestors에서 Early Return 문제**
```typescript
subscribeToInvestors: async () => {
    console.log('🔄 투자자 실시간 구독 시작')
    if (investorsSubscription) {
        console.log('⚠️ 이미 구독 중입니다.')
        return  // 여기서 함수 종료!
    }
    // ... 구독 로직
}
```

**문제점:**
- 구독 해제가 비동기로 처리되어 `investorsSubscription`이 아직 null이 아님
- 재구독 시도 시 "이미 구독 중입니다" 메시지와 함께 함수 종료
- 실제로는 구독이 해제되고 있는 중이지만 새로운 구독이 설정되지 않음

**3. 실행 순서 문제**
```typescript
// useSupabaseData.ts에서
unsubscribeFromInvestors() // 비동기로 100ms 후 해제
subscribeToInvestors()     // 즉시 실행되지만 early return
```

**실제 실행 순서:**
1. `unsubscribeFromInvestors()` 호출 → setTimeout 시작
2. `subscribeToInvestors()` 호출 → `investorsSubscription`이 아직 존재하므로 early return
3. 100ms 후 실제 구독 해제 완료
4. **결과: 구독이 해제된 상태로 남아있음**

## 3. 해결 방안

### ✅ 권장 해결책

**1. 동기적 구독 해제 또는 Promise 기반 처리**
```typescript
unsubscribeFromInvestors: async () => {
    if (investorsSubscription) {
        const state = get();
        if (state.abortController) {
            state.abortController.abort();
        }

        // 동기적으로 즉시 구독 해제
        await investorsSubscription.unsubscribe();
        investorsSubscription = null;
        console.log('🔄 투자자 실시간 구독 해제');
    }
}
```

**2. useSupabaseData.ts에서 순차적 처리**
```typescript
const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
        console.log('🔄 페이지 포커스 감지, 실시간 연결 확인 중...')
        await unsubscribeFromInvestors() // 구독 해제 완료 대기
        await subscribeToInvestors()     // 그 다음 재구독
        console.log('🔄 실시간 연결 재설정 완료')
    }
}
```

**3. 강제 재구독 옵션 추가**
```typescript
subscribeToInvestors: async (forceReconnect = false) => {
    console.log('🔄 투자자 실시간 구독 시작')
    if (investorsSubscription && !forceReconnect) {
        console.log('⚠️ 이미 구독 중입니다.')
        return
    }
    
    // 강제 재연결인 경우 기존 구독 정리
    if (forceReconnect && investorsSubscription) {
        await investorsSubscription.unsubscribe();
        investorsSubscription = null;
    }
    
    // ... 구독 로직
}
```

## 4. 결론

**현재 문제의 핵심:**
- 비동기 구독 해제와 즉시 재구독 시도로 인한 타이밍 문제
- `investorsSubscription` 상태가 정리되기 전에 재구독 시도
- 결과적으로 구독이 해제된 상태로 남아 실시간 업데이트가 중단됨

**해결 필요사항:**
1. 구독 해제를 동기적으로 처리하거나 Promise 기반으로 변경
2. 재구독 전에 구독 해제 완료를 보장
3. 강제 재연결 옵션 추가로 예외 상황 처리