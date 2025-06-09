# Capital Clash 정사방형 배치 알고리즘 문서

## 📋 개요
**위치**: `src/components/ContinentMap.tsx` → `calculateSquareLayout()` 함수  
**타입**: 하이브리드 알고리즘 (조건부 N×N 격자 + 나선형 배치)  
**목적**: 투자자 지분에 따른 정사각형 타일 최적 배치

---

## 🎯 메인 알고리즘: `calculateSquareLayout()`

### 🔍 **조건 분기 로직**
```typescript
// 조건 체크
const gridSize = Math.sqrt(investorCount)
const isSquareGrid = gridSize % 1 === 0  // 완전제곱수 체크 (4, 9, 16, 25명 등)

const firstShare = investors[0].share
const allSharesEqual = investors.every(inv => 
  Math.abs(inv.share - firstShare) < 0.001  // 오차 0.1% 허용
)

// 분기 결정
if (isSquareGrid && allSharesEqual) {
  return calculateGridLayout(investors, gridSize)    // ✅ N×N 격자
} else {
  return calculateSpiralLayout(investors)            // ✅ 나선형
}
```

### 📊 **적용 조건**
- **N×N 격자**: 투자자 수가 완전제곱수 **AND** 모든 지분이 동일
- **나선형**: 그 외 모든 경우

---

## 🏗️ 1. N×N 격자 배치 (`calculateGridLayout`)

### 🎯 **적용 사례**
- **4명**: 2×2 격자 (각각 25%)
- **9명**: 3×3 격자 (각각 11.11%)  
- **16명**: 4×4 격자 (각각 6.25%)
- **25명**: 5×5 격자 (각각 4%)

### 🔧 **알고리즘 단계**

#### 1단계: 정사각형 크기 계산
```typescript
const squareSize = Math.floor(Math.sqrt(Math.round(investors[0].share * TOTAL_CELLS)))
const actualSize = Math.max(MIN_SQUARE_SIZE, squareSize)
```
- `TOTAL_CELLS = 2500` (50×50 격자)
- `MIN_SQUARE_SIZE = 3` (최소 3×3 크기 보장)

#### 2단계: 격자 중앙 정렬 배치
```typescript
const totalGridSize = gridSize * actualSize
const startX = -Math.floor(totalGridSize / 2)
const startY = -Math.floor(totalGridSize / 2)

for (let i = 0; i < investors.length; i++) {
  const gridX = i % gridSize           // 격자 X 좌표
  const gridY = Math.floor(i / gridSize)  // 격자 Y 좌표
  
  const x = startX + gridX * actualSize
  const y = startY + gridY * actualSize
}
```

#### 3단계: 경계 계산
```typescript
const boundary = {
  minX: startX,
  maxX: startX + totalGridSize - 1,
  minY: startY,
  maxY: startY + totalGridSize - 1,
  width: totalGridSize,
  height: totalGridSize
}
```

---

## 🌀 2. 나선형 배치 (`calculateSpiralLayout`)

### 🎯 **적용 사례**
- **불균등 지분**: 대주주 40%, 중주주 30%, 소주주 20%, 10%
- **완전제곱수가 아닌 수**: 3명, 5명, 7명, 12명 등
- **복합 시나리오**: 대부분의 실제 상황

### 🔧 **알고리즘 단계**

#### 1단계: 투자자별 정사각형 크기 계산
```typescript
const squareAreas = investors.map(investor => {
  const calculatedSide = Math.floor(Math.sqrt(Math.round(investor.share * TOTAL_CELLS)))
  const actualSide = Math.max(MIN_SQUARE_SIZE, calculatedSide)
  return { investor, side: actualSide, area: actualSide * actualSide }
})
```

#### 2단계: 크기 기준 내림차순 정렬
```typescript
squareAreas.sort((a, b) => b.side - a.side)  // 큰 투자자부터 배치
```

#### 3단계: 중심 거리 최적화 배치
```typescript
// 중심 좌표
const CENTER_X = 50, CENTER_Y = 50

// 중심으로부터 거리 계산
const calculateCenterDistance = (x, y, size) => {
  const squareCenterX = x + size / 2
  const squareCenterY = y + size / 2
  return Math.sqrt(Math.pow(squareCenterX - CENTER_X, 2) + Math.pow(squareCenterY - CENTER_Y, 2))
}
```

#### 4단계: 각도 기반 나선형 탐색
```typescript
const findBestPositionSpiral = (size) => {
  const maxRadius = GRID_SIZE + 20
  
  for (let radius = 0; radius < maxRadius; radius += 2) {  // 2씩 증가 (성능 최적화)
    const positions = []
    
    if (radius === 0) {
      // 중심에서 시작
      positions.push({ 
        x: CENTER_X - Math.floor(size / 2), 
        y: CENTER_Y - Math.floor(size / 2) 
      })
    } else {
      // 각도 기반 나선형 탐색 (15도 간격)
      for (let angle = 0; angle < 360; angle += 15) {
        const rad = (angle * Math.PI) / 180
        const x = Math.round(CENTER_X + radius * Math.cos(rad) - size / 2)
        const y = Math.round(CENTER_Y + radius * Math.sin(rad) - size / 2)
        positions.push({ x, y })
      }
    }
    
    // 충돌 검사 및 최적 위치 선택
    for (const pos of positions) {
      if (canPlaceSquare(pos.x, pos.y, size, existingPlacements)) {
        const distance = calculateCenterDistance(pos.x, pos.y, size)
        if (distance < minDistance) {
          return { x: pos.x, y: pos.y }  // 가장 가까운 위치 반환
        }
      }
    }
  }
}
```

#### 5단계: 충돌 검사 함수
```typescript
function canPlaceSquare(x, y, size, existingPlacements) {
  for (const existing of existingPlacements) {
    // 두 정사각형이 겹치는지 검사
    if (!(x >= existing.x + existing.size || 
          x + size <= existing.x || 
          y >= existing.y + existing.size || 
          y + size <= existing.y)) {
      return false  // 겹침
    }
  }
  return true  // 배치 가능
}
```

#### 6단계: 좌표계 보정
```typescript
// 격자 좌표를 원점 기준으로 변환
placements.forEach(p => {
  p.x = p.x - CENTER_X  // 중심 좌표 보정
  p.y = p.y - CENTER_Y
})
```

---

## 🎨 3. 렌더링 시스템

### 📊 **컴포넌트 체인**
```
TerritorySystem → TerritoryArea (개별 정사각형)
```

### 🔧 **TerritoryArea 렌더링**
```typescript
// 격자 좌표를 3D 좌표로 변환
const size = placement.size * CELL_SIZE  // CELL_SIZE = 1.0
const x = (placement.x + placement.size/2) * CELL_SIZE
const y = -(placement.y + placement.size/2) * CELL_SIZE  // Y축 반전

// 3D 메시 생성
<boxGeometry args={[size, size, 0.2]} />          // 기본 정사각형
<planeGeometry args={[size, size]} />              // 이미지 플레인
```

### 🎭 **애니메이션 효과**
- **호버 시**: 1.05배 확대 + Z축 0.05 상승
- **클릭 이벤트**: `onTileClick(investorId)` 호출

---

## ⚙️ 4. 핵심 설정값

```typescript
const TOTAL_CELLS = 2500        // 50×50 격자 총 셀 수
const MIN_SQUARE_SIZE = 3       // 최소 정사각형 크기 (3×3)
const CELL_SIZE = 1.0           // 3D 공간에서 1셀 = 1.0 단위
const CENTER_X = 50             // 격자 중심 X 좌표
const CENTER_Y = 50             // 격자 중심 Y 좌표
const GRID_SIZE = 50            // 격자 크기 (50×50)
```

---

## 🔍 5. 성능 최적화

### ✅ **나선형 탐색 최적화**
- **반지름 증가**: 2씩 증가 (radius += 2)
- **각도 간격**: 15도 간격 (24개 방향)
- **조기 종료**: 해당 반지름에서 찾으면 즉시 반환

### ✅ **메모리 최적화**
- **useMemo**: `placementResult` 캐싱
- **조건부 업데이트**: 위치 변경 시만 스토어 업데이트
- **충돌 검사**: O(n) 선형 검사

---

## 📊 6. 알고리즘 복잡도

### 🏗️ **N×N 격자**
- **시간 복잡도**: O(n) - 단순 격자 배치
- **공간 복잡도**: O(n) - 투자자 수에 비례

### 🌀 **나선형 배치**
- **시간 복잡도**: O(n × r × a) 
  - n: 투자자 수
  - r: 최대 반지름 (GRID_SIZE + 20)
  - a: 각도 수 (24개)
- **공간 복잡도**: O(n) - 배치 결과 저장

### 📈 **실제 성능**
- **4명 (2×2)**: ~1ms (격자)
- **50명 (나선형)**: ~10-50ms (반지름/크기에 따라)
- **최악의 경우**: 큰 정사각형들로 인한 배치 실패 시 긴 탐색

---

## 🎯 7. 장단점 분석

### ✅ **장점**
- **직관적인 배치**: 중심에서 바깥으로 확산
- **동일 지분 최적화**: N×N 격자로 완벽한 균등 배치
- **유연한 크기 지원**: 3×3부터 큰 정사방형까지
- **실시간 성능**: 50명까지 빠른 배치

### ⚠️ **한계**
- **정사각형만 지원**: 자연스러운 영역 모양 불가
- **빈 공간 발생**: 비효율적인 공간 사용
- **완벽한 지분 반영 어려움**: 최소 크기 제약으로 인한 오차

---

**마지막 업데이트**: 2025년 1월 (백업 Voronoi 시스템 제거 후)
