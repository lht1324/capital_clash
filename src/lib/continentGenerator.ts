// 대륙 생성 유틸리티
import { ContinentGenerationConfig } from '@/store/continentStore'

// 간단한 Perlin noise 구현 (2D)
class PerlinNoise {
  private gradients: { [key: string]: [number, number] } = {}
  private seed: number

  constructor(seed: number = 0) {
    this.seed = seed
    this.gradients = {}
  }

  // 그라디언트 벡터 생성 (결정론적)
  private getGradient(x: number, y: number): [number, number] {
    const key = `${x},${y}`
    if (this.gradients[key]) {
      return this.gradients[key]
    }

    // 시드 기반 해시 함수
    const hash = (x * 374761393 + y * 668265263 + this.seed) % 2147483647
    const angle = (hash / 2147483647) * 2 * Math.PI
    
    const gradient: [number, number] = [Math.cos(angle), Math.sin(angle)]
    this.gradients[key] = gradient
    return gradient
  }

  // 선형 보간
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a)
  }

  // 부드러운 보간 (smoothstep)
  private smoothstep(t: number): number {
    return t * t * (3 - 2 * t)
  }

  // 도트 그라디언트
  private dotGridGradient(ix: number, iy: number, x: number, y: number): number {
    const gradient = this.getGradient(ix, iy)
    const dx = x - ix
    const dy = y - iy
    return dx * gradient[0] + dy * gradient[1]
  }

  // 노이즈 값 계산
  noise(x: number, y: number): number {
    // 그리드 좌표
    const x0 = Math.floor(x)
    const x1 = x0 + 1
    const y0 = Math.floor(y)
    const y1 = y0 + 1

    // 보간 가중치
    const sx = this.smoothstep(x - x0)
    const sy = this.smoothstep(y - y0)

    // 각 모서리에서의 도트 그라디언트
    const n0 = this.dotGridGradient(x0, y0, x, y)
    const n1 = this.dotGridGradient(x1, y0, x, y)
    const ix0 = this.lerp(n0, n1, sx)

    const n2 = this.dotGridGradient(x0, y1, x, y)
    const n3 = this.dotGridGradient(x1, y1, x, y)
    const ix1 = this.lerp(n2, n3, sx)

    return this.lerp(ix0, ix1, sy)
  }

  // 다중 옥타브 노이즈 (더 복잡한 모양)
  octaveNoise(x: number, y: number, octaves: number, persistence: number = 0.5): number {
    let value = 0
    let amplitude = 1
    let frequency = 1
    let maxValue = 0

    for (let i = 0; i < octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude
      maxValue += amplitude
      amplitude *= persistence
      frequency *= 2
    }

    return value / maxValue
  }
}

// 대륙 경계점 생성
export function generateContinentShape(config: ContinentGenerationConfig): [number, number][] {
  const { seed, size, complexity, smoothness } = config
  const noise = new PerlinNoise(seed)
  
  const points: [number, number][] = []
  const numPoints = Math.max(16, Math.floor(32 * complexity)) // 복잡도에 따른 점 개수
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI
    
    // 기본 반지름 (더 다양한 크기)
    let radius = size * (0.3 + Math.random() * 0.4) // 30% ~ 70% 기본 크기
    
    // 각도별 노이즈 좌표 계산 (더 큰 스케일)
    const noiseX = Math.cos(angle) * 2.0
    const noiseY = Math.sin(angle) * 2.0
    
    // 여러 주파수의 노이즈 조합
    const noiseValue1 = noise.octaveNoise(noiseX * 0.5, noiseY * 0.5, 3, 0.5)
    const noiseValue2 = noise.octaveNoise(noiseX * 1.5, noiseY * 1.5, 2, 0.3)
    const noiseValue3 = noise.octaveNoise(noiseX * 3.0, noiseY * 3.0, 1, 0.2)
    
    // 노이즈 값들을 조합하여 더 복잡한 모양 생성
    const combinedNoise = noiseValue1 + noiseValue2 * 0.5 + noiseValue3 * 0.3
    
    // 반지름 변형 (50% ~ 150% 범위로 더 극적인 변화)
    radius *= (1 + combinedNoise * complexity * 1.0)
    
    // 최소/최대 반지름 제한
    radius = Math.max(size * 0.2, Math.min(size * 1.2, radius))
    
    // 좌표 계산
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    
    points.push([x, y])
  }
  
  // 부드러움 적용 (평균화)
  if (smoothness > 0) {
    const smoothedPoints: [number, number][] = []
    const smoothingRadius = Math.floor(smoothness * 3) + 1
    
    for (let i = 0; i < points.length; i++) {
      let sumX = 0, sumY = 0, count = 0
      
      for (let j = -smoothingRadius; j <= smoothingRadius; j++) {
        const idx = (i + j + points.length) % points.length
        sumX += points[idx][0]
        sumY += points[idx][1]
        count++
      }
      
      smoothedPoints.push([sumX / count, sumY / count])
    }
    
    return smoothedPoints
  }
  
  return points
}

// 사전 정의된 대륙 모양들 (50명 수용 가능 크기)
export const PRESET_CONTINENTS = {
  // 아프리카 스타일 - 세로로 긴 형태
  africa: {
    seed: 12345,
    size: 20, // 8 → 20 (2.5배)
    complexity: 0.7,
    smoothness: 0.5
  },
  // 유럽 스타일 - 복잡한 해안선
  europe: {
    seed: 67890,
    size: 18, // 7 → 18 (2.6배)
    complexity: 0.9,
    smoothness: 0.3
  },
  // 아시아 스타일 - 큰 크기
  asia: {
    seed: 24680,
    size: 25, // 10 → 25 (2.5배)
    complexity: 0.8,
    smoothness: 0.4
  },
  // 남미 스타일 - 삼각형 모양
  southAmerica: {
    seed: 13579,
    size: 20, // 8 → 20 (2.5배)
    complexity: 0.6,
    smoothness: 0.6
  },
  // 오세아니아 스타일 - 작고 복잡한 형태
  oceania: {
    seed: 97531,
    size: 15, // 6 → 15 (2.5배)
    complexity: 1.0,
    smoothness: 0.2
  }
}

// 랜덤 대륙 생성 설정 (50명 수용 가능한 크기)
export function generateRandomContinentConfig(): ContinentGenerationConfig {
  return {
    seed: Math.floor(Math.random() * 1000000),
    size: 18 + Math.random() * 8, // 18-26 범위 (3배 확대)
    complexity: 0.4 + Math.random() * 0.6, // 0.4-1.0 범위
    smoothness: 0.2 + Math.random() * 0.6 // 0.2-0.8 범위
  }
}

// 대륙 면적 계산 (신발끈 공식)
export function calculateContinentArea(points: [number, number][]): number {
  let area = 0
  const n = points.length
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += points[i][0] * points[j][1]
    area -= points[j][0] * points[i][1]
  }
  
  return Math.abs(area) / 2
}

// 점이 폴리곤 내부에 있는지 확인 (Ray casting)
export function isPointInContinent(point: [number, number], continentShape: [number, number][]): boolean {
  const [x, y] = point
  let inside = false
  
  for (let i = 0, j = continentShape.length - 1; i < continentShape.length; j = i++) {
    const [xi, yi] = continentShape[i]
    const [xj, yj] = continentShape[j]
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  
  return inside
}

// 대륙 중심점 계산
export function getContinentCenter(points: [number, number][]): [number, number] {
  let centerX = 0, centerY = 0
  
  for (const [x, y] of points) {
    centerX += x
    centerY += y
  }
  
  return [centerX / points.length, centerY / points.length]
} 