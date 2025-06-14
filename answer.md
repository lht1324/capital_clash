# 정사각형 배치 알고리즘 분석 및 개선 방안

## 필수 제약 조건
1. **모든 배치 대상은 정사각형이다.** 비율은 바뀌지 않는다.
2. **배치 후 전체 형태는 사각형이어야 한다.** 이는 정사각형이 아닌 직사각형이어도 상관 없다.
3. **배치 대상의 크기로 내림차순 정렬한 뒤 클 수록 왼쪽 위, 작을 수록 오른쪽 아래로 쏠려야 한다.**

## 현재 알고리즘 분석

### 알고리즘 개요
현재 `treemapAlgorithm.ts`에 구현된 알고리즘은 셀 기반 고정 비율 트리맵(Cell-Based Fixed-Ratio Treemap)으로, 투자자의 지분율에 따라 정사각형 영역을 할당하고 이를 그리드에 배치하는 방식입니다.

### 주요 특징
1. **셀 기반 접근법**: 그리드(maxUsers × maxUsers)를 기준으로 각 투자자에게 지분율에 비례하는 셀 수를 할당합니다.
2. **정사각형 형태**: 각 투자자에게 할당된 영역은 정사각형 형태로 생성됩니다.
3. **크기 기반 정렬**: 큰 정사각형부터 배치하여 효율적인 공간 활용을 시도합니다.
4. **행 우선 배치**: 왼쪽에서 오른쪽으로, 위에서 아래로 순차적으로 배치합니다.

### 현재 알고리즘의 문제점
1. **불규칙한 전체 형태**: 배치 결과가 직사각형 형태가 아닌 불규칙한 형태가 될 수 있습니다.
2. **행 기반 배치의 한계**: 첫 번째 행에서만 경계 확장이 가능하고, 이후 행에서는 기존 경계 내에서만 배치하는 제약이 있습니다.
3. **강제 배치 문제**: 적절한 위치를 찾지 못할 경우 새로운 행을 추가하여 강제 배치하는데, 이로 인해 전체 형태가 더욱 불규칙해질 수 있습니다.

## 개선 방안: 직사각형 영역 기반 정사각형 배치 알고리즘

### 알고리즘 개요
직사각형 영역 내에 정사각형을 효율적으로 배치하는 알고리즘으로, 전체 형태를 직사각형으로 유지하면서 크기에 따라 정렬된 정사각형을 배치합니다.

### 주요 개선 사항
1. **직사각형 전체 형태**: 전체 레이아웃이 직사각형 형태를 유지합니다.
2. **정사각형 유지**: 각 투자자의 영역은 정사각형 형태를 유지합니다.
3. **크기 기반 정렬 및 배치**: 큰 정사각형은 왼쪽 위에, 작은 정사각형은 오른쪽 아래에 배치됩니다.
4. **효율적인 공간 활용**: 직사각형 영역 내에서 정사각형을 효율적으로 배치하여 공간 활용도를 높입니다.

### 구현 방법

#### 1. 기본 알고리즘 흐름
```typescript
function rectangularSquareLayout(investorList: Investor[], maxUsers: number) {
  // 1. 각 투자자의 지분율에 따라 정사각형 크기 계산
  const totalInvestmentAmount = investorList.reduce((acc, investor) => acc + investor.investment_amount, 0);
  const squares = investorList.map(investor => {
    const sharePercentage = investor.investment_amount / totalInvestmentAmount;
    const area = sharePercentage * maxUsers * maxUsers;
    const sideLength = Math.floor(Math.sqrt(area));

    return {
      investor,
      sideLength: Math.max(1, sideLength)
    };
  });

  // 2. 정사각형을 크기 기준 내림차순 정렬
  squares.sort((a, b) => b.sideLength - a.sideLength);

  // 3. 직사각형 영역 내에 정사각형 배치
  return placeSquaresInRectangle(squares, maxUsers);
}
```

#### 2. 직사각형 영역 내 정사각형 배치
```typescript
function placeSquaresInRectangle(squares: Square[], maxSize: number) {
  // 초기 직사각형 영역 설정 (가로:세로 = 1:1 시작)
  let width = maxSize;
  let height = maxSize;

  // 배치된 정사각형 정보
  const placements = [];

  // 현재 행과 열의 위치
  let currentX = 0;
  let currentY = 0;
  let rowHeight = 0;

  for (const square of squares) {
    // 현재 행에 배치 가능한지 확인
    if (currentX + square.sideLength <= width) {
      // 현재 행에 배치
      placements.push({
        investor: square.investor,
        x: currentX,
        y: currentY,
        width: square.sideLength,
        height: square.sideLength
      });

      // 현재 행의 높이 업데이트
      rowHeight = Math.max(rowHeight, square.sideLength);

      // X 위치 업데이트
      currentX += square.sideLength;
    } else {
      // 새 행으로 이동
      currentX = 0;
      currentY += rowHeight;
      rowHeight = square.sideLength;

      // 새 행에 배치
      placements.push({
        investor: square.investor,
        x: currentX,
        y: currentY,
        width: square.sideLength,
        height: square.sideLength
      });

      // X 위치 업데이트
      currentX += square.sideLength;
    }
  }

  // 전체 경계 계산
  const boundary = calculateBoundary(placements);

  // 중앙 정렬을 위한 좌표 조정
  const centeredPlacements = centerPlacements(placements, boundary);

  return {
    placements: centeredPlacements,
    boundary
  };
}
```

#### 3. 경계 계산 및 중앙 정렬
```typescript
function calculateBoundary(placements) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  placements.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x + p.width);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y + p.height);
  });

  return {
    minX, maxX, minY, maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function centerPlacements(placements, boundary) {
  const offsetX = Math.floor(boundary.width / 2);
  const offsetY = Math.floor(boundary.height / 2);

  return placements.map(p => ({
    ...p,
    x: p.x - offsetX,
    y: p.y - offsetY
  }));
}
```

### 개선된 배치 알고리즘의 장점

1. **직사각형 전체 형태 보장**: 알고리즘이 정사각형들을 직사각형 영역 내에 배치하므로, 전체 형태가 직사각형으로 유지됩니다.
2. **정사각형 형태 유지**: 각 투자자의 영역은 정사각형 형태를 유지하여 제약 조건을 만족합니다.
3. **크기 기반 정렬 및 배치**: 큰 정사각형부터 배치하고, 왼쪽 위에서 오른쪽 아래로 배치하여 제약 조건을 만족합니다.
4. **효율적인 공간 활용**: 행 기반 배치를 통해 직사각형 영역 내에서 정사각형을 효율적으로 배치합니다.
5. **단순한 구현**: 복잡한 알고리즘 없이 간단한 행 기반 배치로 구현할 수 있어 유지보수가 용이합니다.

## 가로 직사각형 배치 방식 구현

위에서 설명한 알고리즘은 가로 방향으로 먼저 채우고, 가로 공간이 부족하면 세로로 확장하는 방식으로 구현되어 있습니다. 이로 인해 많은 정사각형이 있을 경우 세로로 긴 직사각형 형태가 됩니다. 가로로 긴 직사각형 형태로 변경하기 위해서는 배치 방향을 변경해야 합니다.

### 가로 직사각형 배치 알고리즘 개요

세로 방향으로 먼저 채우고, 세로 공간이 부족하면 가로로 확장하는 방식으로 구현하여 가로로 긴 직사각형 형태를 만듭니다.

### 구현 방법

#### 1. 기본 알고리즘 흐름 수정
```typescript
function rectangularSquareLayout(investorList: Investor[], maxUsers: number) {
  // 1. 각 투자자의 지분율에 따라 정사각형 크기 계산
  const totalInvestmentAmount = investorList.reduce((acc, investor) => acc + investor.investment_amount, 0);
  const squares = investorList.map(investor => {
    const sharePercentage = investor.investment_amount / totalInvestmentAmount;
    const area = sharePercentage * maxUsers * maxUsers;
    const sideLength = Math.floor(Math.sqrt(area));

    return {
      investor,
      sideLength: Math.max(1, sideLength)
    };
  });

  // 2. 정사각형을 크기 기준 내림차순 정렬
  squares.sort((a, b) => b.sideLength - a.sideLength);

  // 3. 직사각형 영역 내에 정사각형 배치 (가로 직사각형 형태)
  return placeSquaresInHorizontalRectangle(squares, maxUsers);
}
```

#### 2. 가로 직사각형 배치 함수 구현
```typescript
function placeSquaresInHorizontalRectangle(squares: Square[], maxSize: number) {
  // 초기 직사각형 영역 설정 (가로:세로 = 1:1 시작)
  let width = maxSize;
  let height = maxSize;

  // 배치된 정사각형 정보
  const placements = [];

  // 현재 열과 행의 위치 (세로 방향 우선)
  let currentX = 0;
  let currentY = 0;
  let columnWidth = 0;

  for (const square of squares) {
    // 현재 열에 배치 가능한지 확인
    if (currentY + square.sideLength <= height) {
      // 현재 열에 배치
      placements.push({
        investor: square.investor,
        x: currentX,
        y: currentY,
        width: square.sideLength,
        height: square.sideLength
      });

      // 현재 열의 너비 업데이트
      columnWidth = Math.max(columnWidth, square.sideLength);

      // Y 위치 업데이트 (세로 방향으로 이동)
      currentY += square.sideLength;
    } else {
      // 새 열로 이동
      currentY = 0;
      currentX += columnWidth;
      columnWidth = square.sideLength;

      // 새 열에 배치
      placements.push({
        investor: square.investor,
        x: currentX,
        y: currentY,
        width: square.sideLength,
        height: square.sideLength
      });

      // Y 위치 업데이트
      currentY += square.sideLength;
    }
  }

  // 전체 경계 계산 및 중앙 정렬은 기존과 동일
  const boundary = calculateBoundary(placements);
  const centeredPlacements = centerPlacements(placements, boundary);

  return {
    placements: centeredPlacements,
    boundary
  };
}
```

### 가로 직사각형 배치 알고리즘의 장점

1. **가로로 긴 직사각형 형태**: 세로 방향으로 먼저 채우고 가로로 확장하는 방식으로 가로로 긴 직사각형 형태를 만듭니다.
2. **시각적 균형**: 가로로 긴 직사각형은 일반적으로 화면 비율에 더 적합하여 시각적으로 균형 잡힌 레이아웃을 제공합니다.
3. **효율적인 화면 공간 활용**: 대부분의 디스플레이가 가로로 더 넓기 때문에, 가로로 긴 직사각형은 화면 공간을 더 효율적으로 활용할 수 있습니다.
4. **모든 제약 조건 만족**: 세로 직사각형 배치와 마찬가지로 모든 제약 조건(정사각형 유지, 직사각형 전체 형태, 크기 기반 정렬 및 배치)을 만족합니다.

## 결론

현재 구현된 셀 기반 트리맵 알고리즘은 정사각형 형태와 크기 기반 정렬이라는 제약 조건은 만족하지만, 전체 형태가 직사각형이 아닌 불규칙한 형태가 될 수 있다는 문제가 있습니다. 제안된 직사각형 영역 기반 정사각형 배치 알고리즘은 모든 제약 조건을 만족하면서 효율적인 공간 활용이 가능합니다.

또한, 배치 방향을 변경하여 세로로 긴 직사각형 대신 가로로 긴 직사각형 형태로 배치할 수 있습니다. 이는 대부분의 디스플레이가 가로로 더 넓기 때문에 화면 공간을 더 효율적으로 활용할 수 있는 장점이 있습니다.

이 알고리즘을 적용하면 Capital Clash 프로젝트의 핵심 요구사항인 "모든 배치 대상은 정사각형이고, 배치 후 전체 형태는 사각형이어야 하며, 크기로 내림차순 정렬한 뒤 클 수록 왼쪽 위, 작을 수록 오른쪽 아래로 쏠려야 한다"는 목표를 달성할 수 있습니다.

## 배치 대상 수 증가에 따른 형태 수렴성 분석

배치 대상의 수가 적을 때는 전체 형태가 직사각형에 가까워도 상관없지만, 배치 대상의 수가 많아질수록 전체 형태가 정사각형에 수렴하는 현상에 대해 분석해 보겠습니다.

### 정사각형 수렴 현상의 자연스러움

배치 대상의 수가 많아질수록 전체 형태가 정사각형에 수렴하는 것은 자연스러운 현상이며, 다음과 같은 이유로 발생합니다:

1. **통계적 균일화**: 배치 대상의 수가 증가할수록 각 대상의 상대적 크기 차이가 줄어들고, 전체 레이아웃에서 차지하는 비중이 균일화됩니다. 이로 인해 전체 형태가 정사각형에 가까워지는 경향이 있습니다.

2. **행/열 균형**: 현재 알고리즘은 행 우선(가로 직사각형) 또는 열 우선(세로 직사각형) 배치 방식을 사용합니다. 배치 대상의 수가 많아질수록 행과 열의 수가 균형을 이루게 되어 전체 형태가 정사각형에 가까워집니다.

3. **공간 채움 효율**: 많은 수의 작은 정사각형들이 큰 공간을 채울 때, 가장 효율적인 형태는 정사각형에 가까운 형태입니다. 이는 수학적으로 증명된 사실로, 배치 대상의 수가 증가할수록 이 효과가 더욱 두드러집니다.

4. **경계 효과 감소**: 배치 대상의 수가 적을 때는 경계 부분의 불규칙성이 전체 형태에 큰 영향을 미치지만, 수가 많아질수록 경계 효과의 상대적 영향이 감소하여 전체 형태가 더 규칙적인 정사각형에 가까워집니다.

### 정사각형 수렴의 가능성과 조건

배치 대상의 수가 많아질수록 전체 형태가 정사각형에 수렴하는 것은 가능하며, 다음과 같은 조건에서 더욱 두드러집니다:

1. **배치 대상 크기의 균일성**: 배치 대상의 크기 차이가 작을수록 정사각형 수렴 현상이 더 강하게 나타납니다. 투자자들의 투자 금액이 비슷할수록 각 정사각형의 크기도 비슷해지므로, 전체 형태가 정사각형에 가까워집니다.

2. **배치 알고리즘의 특성**: 현재 구현된 알고리즘은 행 또는 열 방향으로 순차적으로 배치하는 방식을 사용합니다. 이러한 방식은 배치 대상의 수가 많아질수록 행과 열의 수가 균형을 이루게 되어 정사각형 형태로 수렴하게 됩니다.

3. **공간 활용 최적화**: 알고리즘이 공간 활용을 최적화하도록 설계되어 있다면, 배치 대상의 수가 많아질수록 가장 효율적인 형태인 정사각형에 가까워지는 경향이 있습니다.

### 정사각형 수렴의 장점

배치 대상의 수가 많아질수록 전체 형태가 정사각형에 수렴하는 것은 다음과 같은 장점이 있습니다:

1. **시각적 균형**: 정사각형은 가장 균형 잡힌 형태로, 시각적으로 안정감을 줍니다. 배치 대상이 많을 때 전체 형태가 정사각형에 가까워지면 더 균형 잡힌 시각적 표현이 가능합니다.

2. **공간 활용 효율**: 정사각형은 동일한 둘레 대비 최대 면적을 가지는 형태로, 공간 활용 측면에서 가장 효율적입니다. 배치 대상이 많을 때 정사각형에 가까운 형태는 화면 공간을 효율적으로 활용할 수 있습니다.

3. **확장성**: 정사각형 형태는 새로운 배치 대상이 추가되거나 제거될 때도 전체 레이아웃의 변화를 최소화할 수 있어, 동적인 데이터에 대한 시각적 안정성을 제공합니다.

4. **일관된 사용자 경험**: 배치 대상의 수에 관계없이 전체 형태가 정사각형에 수렴하면, 사용자는 일관된 시각적 경험을 얻을 수 있습니다.

### 결론적 분석

배치 대상의 수가 적을 때는 전체 형태가 직사각형에 가까워도 상관없지만, 배치 대상의 수가 많아질수록 전체 형태가 정사각형에 수렴하는 것은 자연스럽고 바람직한 현상입니다. 이는 통계적, 수학적 원리에 따른 결과이며, 시각적 균형과 공간 활용 효율 측면에서도 장점이 있습니다.

현재 구현된 알고리즘은 배치 대상의 수가 많아질수록 자연스럽게 정사각형 형태로 수렴하는 특성을 가지고 있으므로, 별도의 수정 없이도 이러한 요구사항을 만족시킬 수 있습니다. 따라서 Capital Clash 프로젝트에서는 배치 대상의 수가 적을 때는 직사각형 형태를, 많을 때는 정사각형에 가까운 형태를 자연스럽게 제공할 수 있을 것입니다.
