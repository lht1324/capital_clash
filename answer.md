# 투자자 데이터 업데이트 최적화 방안

## 현재 문제점
현재 `daily_views`, `x_url`, `email` 등을 업데이트할 때마다 investors 테이블의 row 한 개가 업데이트되고, 이로 인해 모든 영역들이 새로 그려지는 비효율적인 상황이 발생하고 있습니다.

## 코드 분석 결과

### 1. 현재 렌더링 프로세스
- `WorldScene.tsx`에서 `useInvestorStore`의 `investors` 상태를 구독하고 있습니다.
- `investors` 상태가 변경될 때마다 `placementResults`가 재계산되고, 모든 대륙이 다시 렌더링됩니다.
- 이는 `useMemo` 훅을 사용하고 있지만, 의존성 배열에 `investorList`가 포함되어 있어 투자자 데이터가 변경될 때마다 재계산이 발생합니다.

### 2. 최적화 가능성 분석
투자자의 `investment_amount`가 변경된 경우에만 해당 대륙을 다시 그리도록 최적화하는 것은 가능합니다. 다음과 같은 방법으로 구현할 수 있습니다:

1. `investorsStore.ts`에서 투자자 데이터 업데이트 시 이전 값과 새 값을 비교하여 `investment_amount`가 변경되었는지 확인합니다.
2. `investment_amount`가 변경된 경우, 해당 투자자가 속한 대륙 ID를 저장합니다.
3. `WorldScene.tsx`에서 `placementResults`를 계산할 때, 변경된 대륙 ID가 있는 경우 해당 대륙만 재계산하고 나머지는 이전 계산 결과를 재사용합니다.

## 구현 방안

### 1. `investorsStore.ts` 수정
```typescript
interface InvestorStore {
  // 기존 상태
  investors: Record<string, Investor>;
  
  // 추가할 상태
  changedContinents: Set<string>;
  
  // 기존 액션
  updateInvestor: (investor: Partial<Investor>) => Promise<void>;
  
  // 추가할 헬퍼 함수
  resetChangedContinents: () => void;
}

// updateInvestor 함수 수정
updateInvestor: async (investor) => {
  try {
    const currentInvestor = get().investors[investor.id];
    const updatedInvestor = await investorsAPI.update(investor);
    
    // investment_amount가 변경되었는지 확인
    if (currentInvestor && updatedInvestor && 
        currentInvestor.investment_amount !== updatedInvestor.investment_amount) {
      // 변경된 대륙 ID 저장
      set(state => ({
        changedContinents: state.changedContinents.add(updatedInvestor.continent_id)
      }));
    }
    
    // 기존 상태 업데이트 로직...
  } catch (error) {
    // 에러 처리...
  }
}
```

### 2. `WorldScene.tsx` 수정
```typescript
function WorldScene({ onTileClick }: { onTileClick: (investorId: string, dailyViews: number[]) => void }) {
  const { continents } = useContinentStore();
  const { investors, changedContinents, resetChangedContinents } = useInvestorStore();
  
  // 이전 placementResults 저장
  const [prevPlacementResults, setPrevPlacementResults] = useState<Record<string, PlacementResult>>({});
  
  // 모든 대륙의 placementResult 계산 (최적화)
  const placementResults = useMemo(() => {
    console.log("placementResults useMemo");
    const results = { ...prevPlacementResults };
    const investorList = Object.values(investors);
    
    continentList.forEach(continent => {
      // 변경된 대륙이거나 이전에 계산되지 않은 대륙만 재계산
      if (changedContinents.has(continent.id) || !results[continent.id]) {
        // 기존 계산 로직...
        results[continent.id] = calculateSquareLayout(
          filteredInvestorListByContinent,
          continent.id
        );
      }
    });
    
    // 변경된 대륙 목록 초기화
    resetChangedContinents();
    // 계산 결과 저장
    setPrevPlacementResults(results);
    
    return results;
  }, [continentList, investors, changedContinents, prevPlacementResults]);
  
  // 나머지 코드...
}
```

## 결론

투자자의 `investment_amount`가 변경된 경우에만 해당 대륙을 다시 그리도록 최적화하는 것은 가능합니다. 이를 통해 `daily_views`, `x_url`, `email` 등의 업데이트 시 불필요한 재렌더링을 방지할 수 있습니다. 

위 구현 방안은 Zustand 상태 관리 라이브러리를 활용하여 변경된 대륙을 추적하고, React의 `useMemo` 훅을 사용하여 필요한 부분만 재계산하는 방식으로 동작합니다. 이 방식을 적용하면 애플리케이션의 성능이 향상될 것으로 예상됩니다.