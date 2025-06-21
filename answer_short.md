# 실시간 투자자 데이터 연결 문제 분석

## 문제 상황
investorsStore에서 "실시간 투자자 데이터 변경" 로그가 나타나지만, 페이지를 나갔다가 다시 들어올 경우 이 로그가 표시되지 않는 경우가 있습니다. 이는 실시간 연동이 끊어지는 상황이 발생할 수 있음을 의미합니다.

또한 다음과 같은 에러 메시지가 로그에 나타나는 경우가 있습니다:
```
Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received
```

이 오류는 Supabase 실시간 연결과 관련된 문제로, 비동기 응답을 처리하는 도중 메시지 채널이 닫혀버리는 상황을 나타냅니다.

## 원인 분석

### 1. 컴포넌트 라이프사이클에 따른 구독 관리
- `useSupabaseData` 훅에서 컴포넌트가 마운트될 때 `subscribeToInvestors()`를 호출하여 실시간 구독을 설정합니다.
- 컴포넌트가 언마운트될 때 `unsubscribeFromInvestors()`를 호출하여 구독을 해제합니다.
- 페이지를 나갔다가 다시 돌아오면 컴포넌트가 언마운트되었다가 다시 마운트되는 과정에서 구독이 해제되고 다시 설정됩니다.
- 이 과정에서 일시적으로 실시간 연결이 끊어진 상태가 발생할 수 있습니다.

### 2. 네트워크 연결 문제
- 사용자의 네트워크 연결이 불안정할 경우 Supabase 실시간 연결이 끊어질 수 있습니다.
- 현재 코드에는 네트워크 연결 상태를 모니터링하거나 연결이 끊어졌을 때 자동으로 재연결하는 명시적인 로직이 없습니다.

### 3. Supabase 실시간 연결 제한
- Supabase의 실시간 연결은 일정 시간 동안 활동이 없으면 자동으로 끊어질 수 있습니다.
- 현재 설정에서는 `eventsPerSecond: 10`으로 이벤트 제한이 있지만, 연결 유지나 재연결에 관한 추가 설정이 없습니다.

### 4. 연결 상태 모니터링 부재
- 현재 코드에서는 실시간 연결 상태를 모니터링하거나 로깅하는 메커니즘이 없어 연결이 끊어졌을 때 이를 감지하고 사용자에게 알리거나 자동으로 재연결하는 기능이 없습니다.

### 5. 비동기 이벤트 처리와 메시지 채널 닫힘 문제
- "A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received" 오류는 비동기 이벤트 리스너가 처리 중일 때 메시지 채널이 닫히는 경우 발생합니다.
- `subscribeToInvestors` 함수에서 사용하는 이벤트 리스너는 `async` 함수로, 비동기 처리를 수행합니다:
  ```typescript
  async (payload) => {
      console.log('📡 실시간 투자자 데이터 변경:', payload)
      // 비동기 처리 로직...
  }
  ```
- 페이지 이동이나 컴포넌트 언마운트 시 `unsubscribeFromInvestors`가 호출되어 메시지 채널이 닫히지만, 이전에 시작된 비동기 처리가 아직 완료되지 않은 경우 이 오류가 발생할 수 있습니다.
- 이는 실시간 연결이 예기치 않게 끊어지는 또 다른 원인이 될 수 있습니다.

## 해결 방안

### 1. 비동기 이벤트 리스너 안전하게 처리하기
```typescript
// investorsStore.ts의 subscribeToInvestors 함수 수정
subscribeToInvestors: async () => {
    console.log('🔄 투자자 실시간 구독 시작')
    if (investorsSubscription) {
        console.log('⚠️ 이미 구독 중입니다.')
        return
    }

    // 비동기 작업 취소를 위한 AbortController 사용
    const abortController = new AbortController();
    const signal = abortController.signal;

    investorsSubscription = supabase
        .channel('investors_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'investors'
            },
            (payload) => {
                // 비동기 함수를 즉시 실행하지만 결과를 기다리지 않음
                (async () => {
                    // 취소 신호 확인
                    if (signal.aborted) return;

                    try {
                        console.log('📡 실시간 투자자 데이터 변경:', payload)

                        // 변경 유형에 따른 처리
                        if (payload.eventType === 'INSERT') {
                            const newInvestor = payload.new as Investor
                            set(state => ({
                                investors: {
                                    ...state.investors,
                                    [newInvestor.id]: newInvestor
                                }
                            }))
                        } else if (payload.eventType === 'UPDATE') {
                            // 나머지 처리 로직...
                        }
                    } catch (error) {
                        if (!signal.aborted) {
                            console.error('실시간 데이터 처리 오류:', error)
                        }
                    }
                })();

                // 동기적으로 false 반환 (비동기 응답을 기다리지 않음)
                return false;
            }
        )
        .subscribe()

    // AbortController를 저장하여 나중에 사용
    set(state => ({ ...state, abortController }))

    console.log('✅ 실시간 구독 설정 완료')
},

// 구독 해제 함수 수정
unsubscribeFromInvestors: () => {
    if (investorsSubscription) {
        // 먼저 진행 중인 비동기 작업 취소
        const state = get();
        if (state.abortController) {
            state.abortController.abort();
        }

        // 약간의 지연 후 구독 해제 (진행 중인 작업이 정리될 시간 제공)
        setTimeout(() => {
            investorsSubscription.unsubscribe()
            investorsSubscription = null
            console.log('🔄 투자자 실시간 구독 해제')
        }, 100);
    }
},
```

### 2. 연결 상태 모니터링 추가
```typescript
// supabase.ts에 연결 상태 모니터링 추가
supabase.realtime.onOpen(() => {
  console.log('🟢 실시간 연결 설정됨')
})

supabase.realtime.onClose(() => {
  console.log('🔴 실시간 연결 끊어짐')
})

supabase.realtime.onError((error) => {
  console.error('❌ 실시간 연결 오류:', error)
})
```

### 2. 자동 재연결 로직 구현
```typescript
// useSupabaseData.ts에 재연결 로직 추가
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('🔄 페이지 포커스 감지, 실시간 연결 확인 중...')
      // 연결 상태 확인 후 필요시 재연결
      if (!supabase.realtime.isConnected()) {
        unsubscribeFromInvestors() // 기존 구독 정리
        subscribeToInvestors() // 새로운 구독 설정
        console.log('🔄 실시간 연결 재설정 완료')
      }
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}, [subscribeToInvestors, unsubscribeFromInvestors])
```

### 3. 네트워크 상태 감지 및 대응
```typescript
// 네트워크 상태 변화 감지
useEffect(() => {
  const handleNetworkChange = () => {
    if (navigator.onLine) {
      console.log('🌐 네트워크 연결 감지, 실시간 연결 재설정 중...')
      unsubscribeFromInvestors()
      subscribeToInvestors()
    } else {
      console.log('🔌 네트워크 연결 끊김')
    }
  }

  window.addEventListener('online', handleNetworkChange)
  window.addEventListener('offline', handleNetworkChange)

  return () => {
    window.removeEventListener('online', handleNetworkChange)
    window.removeEventListener('offline', handleNetworkChange)
  }
}, [subscribeToInvestors, unsubscribeFromInvestors])
```

## 결론
실시간 투자자 데이터 연결 문제는 크게 두 가지 증상으로 나타납니다:

1. **실시간 데이터 변경 로그가 표시되지 않음**: 페이지 이동 시 구독이 해제되고 재설정되는 과정, 네트워크 연결 문제, 또는 Supabase 실시간 연결의 제한으로 인해 발생할 수 있습니다.

2. **"A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received" 오류**: 비동기 이벤트 리스너가 처리 중일 때 메시지 채널이 닫히는 경우 발생합니다. 이는 페이지 이동이나 컴포넌트 언마운트 시 진행 중인 비동기 작업이 적절히 취소되지 않아 발생하는 문제입니다.

위에서 제안한 해결 방안을 구현하면 다음과 같은 효과를 얻을 수 있습니다:

- **비동기 이벤트 리스너 안전하게 처리**: AbortController를 사용하여 진행 중인 비동기 작업을 안전하게 취소하고, 이벤트 리스너가 명시적으로 false를 반환하도록 하여 "message channel closed" 오류를 방지합니다.

- **연결 상태 모니터링 및 자동 재연결**: 실시간 연결 상태를 모니터링하고 필요할 때 자동으로 재연결하여 실시간 데이터 변경 로그가 표시되지 않는 문제를 해결합니다.

- **네트워크 상태 감지 및 대응**: 네트워크 연결 상태 변화를 감지하고 적절히 대응하여 연결 안정성을 향상시킵니다.

이러한 개선 사항을 통해 Supabase 실시간 연결의 안정성을 크게 향상시키고, 사용자 경험을 개선할 수 있을 것입니다.
