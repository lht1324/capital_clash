'use client'

import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useContinentStore, type Continent, type ContinentId } from '@/store/continentStore'
import TileSettingsPanel from './TileSettingsPanel'

function CameraController() {
  const { camera, gl } = useThree()
  const { selectedContinent, continents, isWorldView, setSelectedContinent, setWorldView, cameraTarget, setCameraTarget, resetSelection } = useContinentStore()
  
  const [isDragging, setIsDragging] = useState(false)
  const previousMouse = useRef({ x: 0, y: 0 })
  const cameraPosition = useRef(new THREE.Vector3(0, 0, 60))
  const targetPosition = useRef(new THREE.Vector3(0, 0, 60))
  
  // 초기 월드 뷰 설정 (컴포넌트 마운트 시 한 번)
  useEffect(() => {
    console.log('🏠 CameraController 초기화: 월드 뷰로 설정')
    // 카메라를 월드 뷰 위치로 설정
    targetPosition.current.set(0, 0, 80)
    cameraPosition.current.set(0, 0, 80)
    resetSelection()
  }, [])
  
  // 드롭다운 선택에 따른 카메라 이동 처리
  useEffect(() => {
    if (cameraTarget) {
      const [x, y, z] = cameraTarget
      console.log('드롭다운 선택으로 카메라 이동:', x, y, z)
      targetPosition.current.set(x, y, z)
      setCameraTarget(null)
    }
  }, [cameraTarget, setCameraTarget])
  
  // 현재 위치 기반 드롭다운 반영 함수 (재활성화)
  const updateDropdownBasedOnPosition = useCallback(() => {
    if (isDragging) return

    const currentPos = camera.position
    let nearestContinent: string | null = null
    let minDistance = Infinity
    
    Object.values(continents).forEach((continent) => {
      const [x, y, z] = continent.position
      const distance = Math.sqrt(
        Math.pow(currentPos.x - x, 2) + 
        Math.pow(currentPos.y - y, 2)
      )
      
      if (distance < minDistance && distance < 30) {
        minDistance = distance
        nearestContinent = continent.id
      }
    })
    
    if (nearestContinent && nearestContinent !== selectedContinent) {
      const continent = continents[nearestContinent as keyof typeof continents]
      console.log('위치 기반 드롭다운 변경:', continent.name)
      setSelectedContinent(nearestContinent as any)
      setWorldView(false)
    } else if (!nearestContinent && !isWorldView) {
      console.log('세계 지도로 드롭다운 변경')
      setWorldView(true)
    }
  }, [camera, continents, selectedContinent, isWorldView, isDragging, setSelectedContinent, setWorldView])
  
  // Canvas 마우스 이벤트 설정
  useEffect(() => {
    const canvas = gl.domElement
    
    const handlePointerDown = (event: PointerEvent) => {
      setIsDragging(true)
      previousMouse.current = { x: event.clientX, y: event.clientY }
      canvas.style.cursor = 'grabbing'
      event.preventDefault()
    }
    
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging) return
      
      const deltaX = event.clientX - previousMouse.current.x
      const deltaY = event.clientY - previousMouse.current.y
      
      const sensitivity = 0.015
      targetPosition.current.x -= deltaX * sensitivity
      targetPosition.current.y += deltaY * sensitivity
      
      previousMouse.current = { x: event.clientX, y: event.clientY }
      event.preventDefault()
    }
    
    const handlePointerUp = (event: PointerEvent) => {
      if (isDragging) {
        setIsDragging(false)
        canvas.style.cursor = 'grab'
        event.preventDefault()
      }
    }
    
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const zoomSpeed = 0.008
      targetPosition.current.z += event.deltaY * zoomSpeed
      targetPosition.current.z = Math.max(15, Math.min(120, targetPosition.current.z))
    }
    
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('wheel', handleWheel)
    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('wheel', handleWheel)
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }
  }, [gl, isDragging])
  
  useFrame(() => {
    cameraPosition.current.lerp(targetPosition.current, 0.12)
    camera.position.copy(cameraPosition.current)
    updateDropdownBasedOnPosition()
  })
  
  return null
}

// 새로운 정사각형 중앙 나선형 배치 시스템 (개선됨)
const TOTAL_CELLS = 2500 // 2500개 셀 고정
const CELL_SIZE = 0.4 // 셀 크기 조정 (기본 대륙과 비례 맞춤)
const MIN_SQUARE_SIZE = 3 // 최소 정사각형 크기 (3×3)

// 🏢 NEW: Billboard-Style 배치 알고리즘 (광고판 스타일)
import { calculateBillboardLayout } from '../lib/treemapAlgorithm'

function calculateSquareLayout(investors: any[]) {
  console.log('🏢 Billboard-Style 배치 알고리즘 시작')
  
  if (investors.length === 0) return { placements: [], boundary: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 } }
  
  try {
    // Billboard 알고리즘 사용
    const result = calculateBillboardLayout(investors)
    console.log(`✅ Billboard 배치 완료: ${result.placements.length}개 정사방형`)
    return result
  } catch (error) {
    console.error(`❌ Billboard 에러, 간단 배치로 대체:`, error)
    
    // 에러 시 간단한 배치로 대체
    const placements = investors.map((investor, index) => ({
      investor,
      x: (index % 2) * 10 - 5,
      y: Math.floor(index / 2) * 10 - 5,
      width: 8,
      height: 8
    }))
    
    return { 
      placements, 
      boundary: { minX: -10, maxX: 15, minY: -10, maxY: 15, width: 25, height: 25 } 
    }
  }
}

// N×N 격자 배치 함수
function calculateGridLayout(investors: any[], gridSize: number) {
  const squareSize = Math.floor(Math.sqrt(Math.round(investors[0].share * TOTAL_CELLS)))
  const actualSize = Math.max(MIN_SQUARE_SIZE, squareSize)
  
  console.log(`📐 격자 배치: ${gridSize}×${gridSize}, 각 정사각형 크기: ${actualSize}×${actualSize}`)
  
  const placements = []
  
  // 격자 중앙 정렬을 위한 시작 위치 계산
  const totalGridSize = gridSize * actualSize
  const startX = -Math.floor(totalGridSize / 2)
  const startY = -Math.floor(totalGridSize / 2)
  
  for (let i = 0; i < investors.length; i++) {
    const gridX = i % gridSize
    const gridY = Math.floor(i / gridSize)
    
    const x = startX + gridX * actualSize
    const y = startY + gridY * actualSize
    
    placements.push({
      investor: investors[i],
      x,
      y,
      size: actualSize
    })
    
    console.log(`  ✅ ${investors[i].name}: 격자(${gridX},${gridY}) → 좌표(${x},${y}) ${actualSize}×${actualSize}`)
  }
  
  // 경계 계산
  const boundary = {
    minX: startX,
    maxX: startX + totalGridSize - 1,
    minY: startY,
    maxY: startY + totalGridSize - 1,
    width: totalGridSize,
    height: totalGridSize
  }
  
  console.log(`🏔️ 격자 경계: (${boundary.minX},${boundary.minY}) ~ (${boundary.maxX},${boundary.maxY}) = ${boundary.width}×${boundary.height}`)
  console.log('✅ N×N 격자 배치 완료')
  
  return { placements, boundary }
}

// 기존 나선형 배치 함수 (이름 변경)
function calculateSpiralLayout(investors: any[]) {
  const GRID_SIZE = 50
  const CENTER_X = GRID_SIZE
  const CENTER_Y = GRID_SIZE
  
  // 1. 각 투자자별 정사각형 크기 계산 (최소 크기 적용)
  const squareAreas = investors.map(investor => {
    const calculatedSide = Math.floor(Math.sqrt(Math.round(investor.share * TOTAL_CELLS)))
    const actualSide = Math.max(MIN_SQUARE_SIZE, calculatedSide)
    return {
      investor,
      side: actualSide,
      area: actualSide * actualSide,
      originalShare: investor.share
    }
  })
  
  // 2. 크기 기준 내림차순 정렬
  squareAreas.sort((a, b) => b.side - a.side)
  
  console.log('📊 투자자별 정사각형 크기 (거리 최적화):')
  squareAreas.forEach(area => {
    const isMinSize = area.side === MIN_SQUARE_SIZE
    console.log(`  ${area.investor.name}: ${area.side}×${area.side} (지분: ${(area.originalShare * 100).toFixed(1)}%)${isMinSize ? ' [최소크기]' : ''}`)
  })
  
  const placements: Array<{
    investor: any,
    x: number,
    y: number,
    size: number
  }> = []
  
  // 중심으로부터 거리 계산 함수
  const calculateCenterDistance = (x: number, y: number, size: number): number => {
    const squareCenterX = x + size / 2
    const squareCenterY = y + size / 2
    return Math.sqrt(Math.pow(squareCenterX - CENTER_X, 2) + Math.pow(squareCenterY - CENTER_Y, 2))
  }
  
  // 각도 기반 나선형 탐색 함수
  const findBestPositionSpiral = (size: number): { x: number, y: number } => {
    const maxRadius = GRID_SIZE + 20
    let bestX = -1, bestY = -1
    let minDistance = Infinity
    
    for (let radius = 0; radius < maxRadius; radius += 2) { // 2씩 증가로 성능 최적화
      const positions: { x: number, y: number }[] = []
      
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
      
      for (const pos of positions) {
        if (canPlaceSquare(pos.x, pos.y, size, placements)) {
          const distance = calculateCenterDistance(pos.x, pos.y, size)
          if (distance < minDistance) {
            minDistance = distance
            bestX = pos.x
            bestY = pos.y
          }
        }
      }
      
      // 이번 반지름에서 찾았으면 바로 반환 (가장 가까운 위치)
      if (bestX !== -1) {
        break
      }
    }
    
    return { x: bestX, y: bestY }
  }
  
  // 3. 모든 투자자를 거리 최적화로 배치
  for (let i = 0; i < squareAreas.length; i++) {
    const current = squareAreas[i]
    const position = findBestPositionSpiral(current.side)
    
    if (position.x !== -1 && position.y !== -1) {
      const distance = calculateCenterDistance(position.x, position.y, current.side)
      placements.push({
        investor: current.investor,
        x: position.x,
        y: position.y,
        size: current.side
      })
      
      console.log(`✅ 최적 배치: ${current.investor.name} at (${position.x}, ${position.y}) ${current.side}×${current.side}, 중심거리: ${distance.toFixed(1)}`)
    } else {
      console.error(`❌ 배치 실패: ${current.investor.name} ${current.side}×${current.side}`)
    }
  }
  
  // 4. 전체 경계 계산 (중심 좌표 보정)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  
  placements.forEach(p => {
    // 실제 좌표를 원점 기준으로 변환
    const adjustedX = p.x - CENTER_X
    const adjustedY = p.y - CENTER_Y
    
    minX = Math.min(minX, adjustedX)
    maxX = Math.max(maxX, adjustedX + p.size - 1)
    minY = Math.min(minY, adjustedY)
    maxY = Math.max(maxY, adjustedY + p.size - 1)
    
    // 배치 좌표도 원점 기준으로 조정
    p.x = adjustedX
    p.y = adjustedY
  })
  
  const boundary = {
    minX, maxX, minY, maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  }
  
  console.log(`🏔️ 나선형 경계 (원점 기준): (${minX},${minY}) ~ (${maxX},${maxY}) = ${boundary.width}×${boundary.height}`)
  console.log('✅ 나선형 배치 완료')
  
  return { placements, boundary }
}

// 정사각형 배치 가능성 확인 함수
function canPlaceSquare(x: number, y: number, size: number, existingPlacements: any[]) {
  for (const existing of existingPlacements) {
    // 두 정사각형이 겹치는지 확인
    if (!(x + size <= existing.x || // 새로운 사각형이 기존 사각형 왼쪽에 있음
          x >= existing.x + existing.size || // 새로운 사각형이 기존 사각형 오른쪽에 있음
          y + size <= existing.y || // 새로운 사각형이 기존 사각형 위쪽에 있음
          y >= existing.y + existing.size)) { // 새로운 사각형이 기존 사각형 아래쪽에 있음
      return false // 겹침
    }
  }
  return true // 겹치지 않음
}

// 🌳 NEW: Billboard 배치 시스템 (정사방형 & 행 우선 순회)
function TerritorySystem({ 
  investors, 
  onTileClick, 
  continentId 
}: { 
  investors: any[], 
  onTileClick: (investorId: string) => void,
  continentId: string 
}) {
  const { updateInvestorPositions } = useContinentStore()
  const [sharedTexture, setSharedTexture] = useState<THREE.Texture | null>(null)

  // 🚀 공통 텍스처 로딩 - 50개 개별 로딩 → 1개 공통 로딩
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(
      '/test.jpg',
      (loadedTexture) => {
        loadedTexture.flipY = true
        setSharedTexture(loadedTexture)
        console.log(`🚀 공통 텍스처 로드 완료: test.jpg`)
      },
      undefined,
      (error) => {
        console.error(`❌ 공통 텍스처 로드 실패:`, error)
      }
    )
  }, [])

  // 🌳 NEW: Billboard 알고리즘으로 배치 계산
  const placementResult = useMemo(() => {
    if (investors.length === 0) return { placements: [], boundary: { minX: 0, maxX: 50, minY: 0, maxY: 50, width: 50, height: 50 } }
    
    const result = calculateBillboardLayout(investors)
    
    if (result.placements.length === 0) {
      console.warn('⚠️ Billboard 배치 실패, 빈 배열 반환')
      return { placements: [], boundary: { minX: 0, maxX: 50, minY: 0, maxY: 50, width: 50, height: 50 } }
    }
    
    console.log(`🏢 Billboard 배치 완료: ${result.placements.length}개, 경계: ${result.boundary.width}×${result.boundary.height}`)
    
    return result
  }, [investors])

  // 🚀 최적화: 위치 업데이트 조건부 실행
  useEffect(() => {
    if (placementResult.placements.length > 0) {
      const hasPositionChanges = placementResult.placements.some(placement => {
        const investor = placement.investor
        return !investor.tilePosition || 
               investor.tilePosition.x !== placement.x ||
               investor.tilePosition.y !== placement.y ||
               investor.tilePosition.size !== Math.max(placement.width, placement.height)
      })

      if (hasPositionChanges) {
        console.log(`📍 위치 변경 감지, 스토어 업데이트 실행`)
        // Billboard는 width/height를 사용하므로 size로 변환
        const positionUpdates = placementResult.placements.map(placement => ({
          investorId: placement.investor.id,
          x: placement.x,
          y: placement.y,
          size: Math.max(placement.width, placement.height) // width/height 중 최대값을 size로 사용
        }))
        updateInvestorPositions(continentId as any, positionUpdates)
      }
    }
  }, [placementResult.placements, continentId, updateInvestorPositions])

  return (
    <group>
      {placementResult.placements.map((placement) => (
        <TerritoryArea
          key={placement.investor.id}
          placement={placement}
          boundary={placementResult.boundary}
          cellSize={CELL_SIZE}
          onTileClick={onTileClick}
          sharedTexture={sharedTexture}
        />
      ))}
    </group>
  )
}

// 개별 대륙 조각 (직사각형/정사각형 모두 지원)
function ContinentPiece({ 
  placement, 
  boundary, 
  cellSize,
  onTileClick,
  sharedTexture
}: {
  placement: any,
  boundary: any,
  cellSize: number,
  onTileClick: (investorId: string) => void,
  sharedTexture: THREE.Texture | null
}) {
  // 🔧 Treemap(width,height) 또는 기존(size) 모두 지원
  const width = placement.width ? placement.width * cellSize : placement.size * cellSize
  const height = placement.height ? placement.height * cellSize : placement.size * cellSize
  const x = placement.width 
    ? (placement.x + placement.width/2) * cellSize 
    : (placement.x + placement.size/2) * cellSize
  const y = placement.height 
    ? -(placement.y + placement.height/2) * cellSize 
    : -(placement.y + placement.size/2) * cellSize
  
  console.log(`🏔️ ContinentPiece - ${placement.investor?.name}:`, {
    hasWidthHeight: !!(placement.width && placement.height),
    hasSize: !!placement.size,
    finalWidth: width,
    finalHeight: height,
    x, y
  })
  
  return (
    <mesh position={[x, y, 0]}>
      <boxGeometry args={[width, height, 0.5]} />
      <meshStandardMaterial 
        color="#8B7355"
        opacity={0.8}
        transparent={true}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}

// 🌳 NEW: 개별 영역 컴포넌트 (직사각형) - 최적화된 버전
function TerritoryArea({ 
  placement, 
  boundary, 
  cellSize,
  onTileClick,
  sharedTexture
}: {
  placement: any,
  boundary: any,
  cellSize: number,
  onTileClick: (investorId: string) => void,
  sharedTexture: THREE.Texture | null
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const imageMeshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  // 🚀 개별 애니메이션 제거 - 호버 상태만 관리
  // useFrame 제거로 50개 × 60fps = 3000회/초 → 0회/초
  
  // 🌳 NEW: Treemap 좌표를 3D 좌표로 변환 (직사각형)
  const width = placement.width * cellSize
  const height = placement.height * cellSize
  const x = (placement.x + placement.width/2) * cellSize
  const y = -(placement.y + placement.height/2) * cellSize
  
  // 🚀 호버 시에만 간단한 CSS 변환 사용
  const baseScale = hovered ? 1.05 : 1.0
  const baseZ = hovered ? 0.15 : 0.1
  const imageZ = hovered ? 0.35 : 0.3

  return (
    <group position={[x, y, 0]}>
      {/* 🌳 NEW: 기본 직사각형 베이스 - 최적화된 애니메이션 */}
      <mesh 
        ref={meshRef}
        position={[0, 0, baseZ]}
        scale={[baseScale, baseScale, baseScale]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => {
          console.log(`🎯 ${placement.investor.name} 클릭: ${placement.width}×${placement.height} (지분: ${(placement.investor.share * 100).toFixed(1)}%, 비율: ${(placement.investor.ratio || 1).toFixed(2)})`)
          onTileClick(placement.investor.id)
        }}
      >
        <boxGeometry args={[width, height, 0.2]} />
        <meshStandardMaterial 
          color={placement.investor.color}
          opacity={hovered ? 1.0 : 0.9}
          transparent={!hovered}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* 🌳 NEW: 프로필 이미지 - 공통 텍스처 사용 */}
      {sharedTexture && (
        <mesh 
          ref={imageMeshRef}
          position={[0, 0, imageZ]}
          scale={[baseScale, baseScale, baseScale]}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={() => {
            console.log(`🖼️ ${placement.investor.name} 이미지 클릭 (지분: ${(placement.investor.share * 100).toFixed(1)}%, 비율: ${(placement.investor.ratio || 1).toFixed(2)})`)
            onTileClick(placement.investor.id)
          }}
        >
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial 
            map={sharedTexture}
            transparent={false}
            opacity={1.0}
            roughness={0.1}
            metalness={0.0}
          />
        </mesh>
      )}
      
      {/* 🌳 NEW: 호버 시 투자자 정보 표시 (큰 직사각형에만) */}
      {hovered && placement.width * placement.height > 100 && (
        <group position={[0, height/4, 0.5]}>
          <mesh>
            <planeGeometry args={[width * 0.8, height * 0.3]} />
            <meshBasicMaterial color="black" opacity={0.7} transparent />
          </mesh>
          {/* TODO: 텍스트 렌더링은 나중에 추가 */}
        </group>
      )}
    </group>
  )
}

function SingleContinent({ continent, onTileClick }: { continent: Continent, onTileClick: (investorId: string) => void }) {
  const { updateContinentUsers } = useContinentStore()
  const [x, y, z] = continent.position
  
  // 스토어에서 실제 투자자 데이터 가져오기
  const investorsList = Object.values(continent.investors)
  
  return (
    <group position={[x, y, z]}>
      {investorsList.length > 0 ? (
        <TerritorySystem investors={investorsList} onTileClick={onTileClick} continentId={continent.id} />
      ) : (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[50 * CELL_SIZE, 50 * CELL_SIZE, 1]} />
          <meshStandardMaterial 
            color={continent.color} 
            opacity={1.0} 
            transparent={false} 
            roughness={0.6}
            metalness={0.2}
          />
        </mesh>
      )}
    </group>
  )
}

function WorldScene({ onTileClick }: { onTileClick: (investorId: string) => void }) {
  const { continents } = useContinentStore()
  
  return (
    <>
      {Object.values(continents).map((continent) => (
        <SingleContinent key={continent.id} continent={continent} onTileClick={onTileClick} />
      ))}
    </>
  )
}

export default function ContinentMap() {
  const [selectedTile, setSelectedTile] = useState<{
    investorId: string
    continentId: ContinentId
  } | null>(null)
  const { selectedContinent } = useContinentStore()

  const handleTileClick = (investorId: string) => {
    if (selectedContinent) {
      setSelectedTile({ investorId, continentId: selectedContinent })
    }
  }

  const handleCloseTilePanel = () => {
    setSelectedTile(null)
  }

  return (
    <div className="w-full h-screen bg-blue-200">
      <Canvas
        camera={{ position: [0, 0, 60], fov: 50 }}
        style={{ cursor: 'grab' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <CameraController />
        <WorldScene onTileClick={handleTileClick} />
      </Canvas>
      
      {/* 타일 설정 패널 */}
      {selectedTile && (
        <TileSettingsPanel
          isOpen={true}
          onClose={handleCloseTilePanel}
          investorId={selectedTile.investorId}
          continentId={selectedTile.continentId}
        />
      )}
    </div>
  )
} 