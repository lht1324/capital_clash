# 계산 방식과 DB 업데이트 방식의 리소스 사용량 비교 분석

## 개요

이 문서는 Capital Clash 프로젝트에서 사용되는 두 가지 주요 방식의 리소스 사용량을 비교 분석합니다:
1. **계산 방식**: 매번 모든 투자자의 좌표를 새로 계산하는 방식
2. **DB 업데이트 방식**: 신규 투자가 들어올 때 특정 대륙의 유저의 x, y 값을 DB에 업데이트하는 방식

특히 신규 투자가 들어와서 특정 대륙의 유저 위치가 변경될 경우, 어떤 방식이 더 효율적인지 분석합니다.

## 현재 구현 방식 분석

### 계산 방식 (현재 구현)

현재 Capital Clash는 투자자의 위치를 다음과 같은 과정으로 계산합니다:

1. `treemapAlgorithm.ts`의 `calculateSquareLayout` 함수가 투자자 목록을 입력으로 받습니다.
2. 각 투자자의 지분율(투자 금액 / 총 투자 금액)을 계산합니다.
3. 지분율에 따라 각 투자자에게 할당될 영역의 크기를 계산합니다.
4. 계산된 영역 크기를 기반으로 각 투자자의 영역 위치(x, y, width, height)를 결정합니다.
5. 이 계산 결과는 `WorldScene` 컴포넌트에서 사용되어 각 대륙과 투자자 영역을 렌더링합니다.

```typescript
// 투자자 영역 계산 핵심 로직 (treemapAlgorithm.ts)
function calculateRectangularSquareLayout(investorList: Investor[]) {
    // 1. 각 투자자의 지분율에 따라 정사각형 크기 계산
    const totalInvestmentAmount = investorList.reduce((acc, investor) => {
        return acc + investor.investment_amount;
    }, 0);
    const squares = investorList.map(investor => {
        const sharePercentage = investor.investment_amount / totalInvestmentAmount;
        const area = sharePercentage * CONTINENT_MAX_USER_COUNT * CONTINENT_MAX_USER_COUNT;
        const sideLength = Math.floor(Math.sqrt(area));

        return {
            investor,
            sideLength: Math.max(1, sideLength)
        };
    });

    // 2. 정사각형을 크기 기준 내림차순 정렬
    squares.sort((a, b) => b.sideLength - a.sideLength);

    // 3. 직사각형 영역 내에 정사각형 배치
    return placeSquaresInHorizontalRectangle(squares);
}
```

### DB 업데이트 방식 (대안)

DB 업데이트 방식은 다음과 같이 구현할 수 있습니다:

1. 신규 투자가 들어오면 해당 대륙의 모든 투자자의 위치를 계산합니다.
2. 계산된 위치 정보(x, y, width, height)를 DB에 저장합니다.
3. 이후 렌더링 시에는 DB에서 위치 정보를 직접 가져와 사용합니다.

```typescript
// DB 업데이트 방식 예시 코드
async function updateInvestorPositions(continentId: string) {
    // 1. 해당 대륙의 모든 투자자 정보 가져오기
    const investors = await investorsAPI.getByContinent(continentId);

    // 2. 위치 계산
    const placementResult = calculateSquareLayout(investors, continentId);

    // 3. 계산된 위치 정보를 DB에 저장
    for (const placement of placementResult.placements) {
        await investorsAPI.updatePosition(
            placement.investor.id, 
            placement.x, 
            placement.y, 
            placement.width, 
            placement.height
        );
    }
}
```

## 리소스 사용량 비교 분석

### 계산 방식의 리소스 사용량

1. **CPU 사용량**:
   - 매번 모든 투자자의 위치를 새로 계산해야 합니다.
   - 계산 복잡도: O(n log n) (정렬 때문에)
   - 투자자 수가 많아질수록 계산 부하가 증가합니다.

2. **메모리 사용량**:
   - 모든 투자자 정보와 계산 결과를 메모리에 저장해야 합니다.
   - 메모리 복잡도: O(n)

3. **네트워크 사용량**:
   - 초기 투자자 정보를 가져오는 API 호출 외에는 추가 네트워크 사용이 없습니다.
   - 클라이언트 측에서 계산이 이루어지므로 서버 부하가 적습니다.

4. **응답 시간**:
   - 클라이언트 측에서 즉시 계산되므로 응답이 빠릅니다.
   - 투자자 수가 많아지면 계산 시간이 길어질 수 있습니다.

### DB 업데이트 방식의 리소스 사용량

1. **CPU 사용량**:
   - 신규 투자가 들어올 때만 계산이 필요합니다.
   - 서버 측에서 계산이 이루어질 경우 클라이언트 CPU 부하가 감소합니다.
   - 계산 복잡도는 동일하지만, 계산 빈도가 감소합니다.

2. **메모리 사용량**:
   - 계산 결과를 DB에 저장하므로 클라이언트 메모리 부하가 감소합니다.
   - 그러나 DB 저장 공간이 추가로 필요합니다.

3. **네트워크 사용량**:
   - 위치 정보를 DB에 저장하고 가져오는 추가 API 호출이 필요합니다.
   - 투자자 수가 많을수록 네트워크 트래픽이 증가합니다.
   - 특히 신규 투자가 들어올 때마다 모든 투자자의 위치 정보를 업데이트하는 API 호출이 필요합니다.

4. **응답 시간**:
   - DB 업데이트 및 조회에 시간이 소요되므로 응답 시간이 길어질 수 있습니다.
   - 그러나 계산 시간이 절약되므로 투자자 수가 매우 많을 경우 오히려 응답이 빨라질 수 있습니다.

## 시나리오별 분석

### 시나리오 1: 소규모 사용자 (대륙당 10-20명)

- **계산 방식**: 계산량이 적어 빠르게 처리 가능, 메모리 사용량도 적음
- **DB 업데이트 방식**: 네트워크 오버헤드가 계산 이점보다 큼, 응답 시간이 더 길어질 수 있음
- **결론**: 소규모 사용자의 경우 **계산 방식이 더 효율적**

### 시나리오 2: 중규모 사용자 (대륙당 50-100명)

- **계산 방식**: 계산량이 증가하지만 여전히 클라이언트에서 처리 가능
- **DB 업데이트 방식**: 네트워크 오버헤드가 있지만, 계산 빈도 감소로 인한 이점이 생김
- **결론**: 중규모 사용자의 경우 **두 방식의 효율성이 비슷**하며, 구현 복잡성과 유지보수 용이성을 고려해야 함

### 시나리오 3: 대규모 사용자 (대륙당 100명 이상)

- **계산 방식**: 계산량이 많아 클라이언트 성능에 따라 지연 발생 가능
- **DB 업데이트 방식**: 계산 빈도 감소로 인한 이점이 네트워크 오버헤드보다 커짐
- **결론**: 대규모 사용자의 경우 **DB 업데이트 방식이 더 효율적**

## 결론

### 리소스 사용량 측면에서의 비교

1. **계산 방식의 장점**:
   - 구현이 단순하고 직관적
   - 추가 DB 스키마 변경이 필요 없음
   - 네트워크 사용량이 적음
   - 실시간 반응성이 좋음

2. **DB 업데이트 방식의 장점**:
   - 계산 빈도 감소로 CPU 사용량 절약
   - 클라이언트 메모리 사용량 감소
   - 대규모 사용자에게 더 효율적
   - 서버 측 계산으로 클라이언트 성능 차이에 덜 의존적

### 최종 권장 사항

현재 Capital Clash의 사용자 규모와 성장 계획을 고려할 때:

1. **현재 단계 (소규모~중규모 사용자)**: 
   - 현재 구현된 **계산 방식을 유지**하는 것이 합리적
   - 구현이 단순하고 유지보수가 용이하며, 현재 사용자 규모에서는 성능 문제가 크지 않음

2. **향후 대규모 확장 시**:
   - 사용자 수가 크게 증가하면 **하이브리드 방식 도입 고려**
   - 자주 변경되는 대륙은 계산 방식 유지, 변경이 적은 대륙은 DB 업데이트 방식 적용
   - 또는 서버 측 계산 후 결과만 클라이언트에 전달하는 방식 고려

3. **모니터링 및 최적화**:
   - 사용자 증가에 따른 성능 변화를 지속적으로 모니터링
   - 병목 지점 발견 시 해당 부분만 최적화하는 점진적 접근 권장
