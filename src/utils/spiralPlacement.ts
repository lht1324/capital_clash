// 🌀 소용돌이 배치 알고리즘
const GRID_SIZE = 50
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE

// 소용돌이 배치 메인 함수
export const spiralPlacement = (investors: any[]) => {
  console.log(`🌀 소용돌이 배치 시작: ${investors.length}명`)
  
  if (investors.length === 0) return []
  
  // 1. 투자자들을 지분 크기 순으로 정렬 (큰 것부터)
  const sortedInvestors = [...investors].sort((a, b) => b.share - a.share)
  console.log('📊 크기 순 정렬:', sortedInvestors.map(inv => `${inv.name}: ${inv.share.toFixed(1)}%`))
  
  // 2. 각 투자자의 크기 계산 (지분에 따른 정사각형 크기)
  const investorSizes = sortedInvestors.map(investor => {
    const targetCells = Math.round(investor.share * TOTAL_CELLS)
    const side = Math.max(1, Math.floor(Math.sqrt(targetCells)))
    return {
      investor,
      size: side,
      targetCells
    }
  })
  
  // 3. 50x50 격자에 소용돌이 배치
  const occupied = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  const placedSquares: any[] = []
  const centerX = Math.floor(GRID_SIZE / 2)
  const centerY = Math.floor(GRID_SIZE / 2)
  
  console.log(`🎯 중심점: (${centerX}, ${centerY})`)
  
  for (let i = 0; i < investorSizes.length; i++) {
    const { investor, size } = investorSizes[i]
    let placed = false
    
    if (i === 0) {
      // 가장 큰 투자자를 중심에 배치
      const startX = centerX - Math.floor(size / 2)
      const startY = centerY - Math.floor(size / 2)
      
      if (canPlaceAt(occupied, startX, startY, size)) {
        placeAt(occupied, startX, startY, size)
        placedSquares.push({
          investor,
          gridX: startX,
          gridY: startY,
          gridSize: size
        })
        console.log(`🎯 중심 배치: ${investor.name} ${size}×${size} → (${startX}, ${startY})`)
        placed = true
      }
    } else {
      // 나머지는 소용돌이 패턴으로 배치
      const spiralPositions = generateSpiralPositions(centerX, centerY, GRID_SIZE)
      
      for (const pos of spiralPositions) {
        const startX = pos.x - Math.floor(size / 2)
        const startY = pos.y - Math.floor(size / 2)
        
        if (canPlaceAt(occupied, startX, startY, size)) {
          placeAt(occupied, startX, startY, size)
          placedSquares.push({
            investor,
            gridX: startX,
            gridY: startY,
            gridSize: size
          })
          console.log(`🌀 소용돌이 배치: ${investor.name} ${size}×${size} → (${startX}, ${startY})`)
          placed = true
          break
        }
      }
    }
    
    if (!placed) {
      console.log(`❌ 배치 실패: ${investor.name}, 1×1로 축소 시도`)
      // 배치 실패시 1×1로 축소해서 재시도
      const spiralPositions = generateSpiralPositions(centerX, centerY, GRID_SIZE)
      for (const pos of spiralPositions) {
        if (canPlaceAt(occupied, pos.x, pos.y, 1)) {
          placeAt(occupied, pos.x, pos.y, 1)
          placedSquares.push({
            investor,
            gridX: pos.x,
            gridY: pos.y,
            gridSize: 1
          })
          console.log(`🔧 1×1 배치: ${investor.name} → (${pos.x}, ${pos.y})`)
          break
        }
      }
    }
  }
  
  console.log(`🌀 소용돌이 배치 완료: ${placedSquares.length}개`)
  return placedSquares
}

// 배치 가능 여부 확인
function canPlaceAt(occupied: boolean[][], startX: number, startY: number, size: number): boolean {
  if (startX < 0 || startY < 0 || startX + size > GRID_SIZE || startY + size > GRID_SIZE) {
    return false
  }
  
  for (let y = startY; y < startY + size; y++) {
    for (let x = startX; x < startX + size; x++) {
      if (occupied[y][x]) {
        return false
      }
    }
  }
  return true
}

// 격자에 배치하기
function placeAt(occupied: boolean[][], startX: number, startY: number, size: number): void {
  for (let y = startY; y < startY + size; y++) {
    for (let x = startX; x < startX + size; x++) {
      occupied[y][x] = true
    }
  }
}

// 격자 기반 시계방향 나선형 좌표 생성 (중심에서 시작해서 빈틈없이)
function generateSpiralPositions(centerX: number, centerY: number, gridSize: number): {x: number, y: number}[] {
  const positions: {x: number, y: number}[] = []
  
  // 시계방향 나선: 오른쪽 → 아래 → 왼쪽 → 위
  const directions = [
    { dx: 1, dy: 0 },   // 오른쪽
    { dx: 0, dy: 1 },   // 아래  
    { dx: -1, dy: 0 },  // 왼쪽
    { dx: 0, dy: -1 }   // 위
  ]
  
  let x = centerX
  let y = centerY
  let steps = 1  // 각 방향으로 이동할 걸음 수
  let directionIndex = 0  // 현재 방향 (0: 오른쪽, 1: 아래, 2: 왼쪽, 3: 위)
  
  // 나선형으로 좌표 생성
  while (positions.length < gridSize * gridSize) {
    // 현재 방향으로 steps만큼 이동
    for (let i = 0; i < steps; i++) {
      const direction = directions[directionIndex]
      x += direction.dx
      y += direction.dy
      
      // 격자 범위 내에 있는 좌표만 추가
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        positions.push({ x, y })
      }
      
      // 격자 밖으로 나가면 종료
      if (x < -1 || x > gridSize || y < -1 || y > gridSize) {
        return positions
      }
    }
    
    // 방향 변경 (시계방향)
    directionIndex = (directionIndex + 1) % 4
    
    // 오른쪽이나 왼쪽 방향일 때 걸음 수 증가
    if (directionIndex === 0 || directionIndex === 2) {
      steps++
    }
  }
  
  return positions
} 