'use client'

import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { useRef, useState, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { useContinentStore, type Continent } from '@/store/continentStore'

function CameraController() {
  const { camera, gl } = useThree()
  const { selectedContinent, continents, isWorldView, setSelectedContinent, setWorldView, cameraTarget, setCameraTarget } = useContinentStore()
  
  const [isDragging, setIsDragging] = useState(false)
  const previousMouse = useRef({ x: 0, y: 0 })
  const cameraPosition = useRef(new THREE.Vector3(0, 0, 30))
  const targetPosition = useRef(new THREE.Vector3(0, 0, 30))
  
  // 드롭다운 선택에 따른 카메라 이동 처리
  useEffect(() => {
    if (cameraTarget) {
      const [x, y, z] = cameraTarget
      console.log('드롭다운 선택으로 카메라 이동:', x, y, z)
      targetPosition.current.set(x, y, z)
      setCameraTarget(null) // 이동 완료 후 타겟 초기화
    }
  }, [cameraTarget, setCameraTarget])
  
  // 현재 위치 기반 드롭다운 반영 함수 (포커싱 없음)
  const updateDropdownBasedOnPosition = useCallback(() => {
    if (isDragging) return // 드래그 중에는 업데이트 안함

    const currentPos = camera.position
    let nearestContinent: string | null = null
    let minDistance = Infinity
    
    Object.values(continents).forEach((continent) => {
      const [x, y, z] = continent.position
      const distance = Math.sqrt(
        Math.pow(currentPos.x - x, 2) + 
        Math.pow(currentPos.y - y, 2)
      )
      
      if (distance < minDistance && distance < 15) { // 15 단위 내에서만 감지
        minDistance = distance
        nearestContinent = continent.id
      }
    })
    
    // 드롭다운만 변경, 카메라 이동 없음
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
  
  // Canvas 마우스 이벤트 설정 - 전역 이벤트로 수정
  useEffect(() => {
    const canvas = gl.domElement
    
    const handlePointerDown = (event: PointerEvent) => {
      setIsDragging(true)
      previousMouse.current = { x: event.clientX, y: event.clientY }
      canvas.style.cursor = 'grabbing'
      event.preventDefault()
    }
    
    // 전역에서 pointermove와 pointerup 처리 (드래그 상태 유지)
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging) return
      
      const deltaX = event.clientX - previousMouse.current.x
      const deltaY = event.clientY - previousMouse.current.y
      
      // 이동 방향을 마우스와 반대로 - 지도를 잡아당기는 느낌 (속도 1.5배 증가)
      const sensitivity = 0.015 // 0.01 -> 0.015로 1.5배 증가
      targetPosition.current.x -= deltaX * sensitivity  // 마우스 반대 방향
      targetPosition.current.y += deltaY * sensitivity  // 마우스 반대 방향
      
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
      // 줌 속도 증가 (0.002 -> 0.008로 4배 증가)
      const zoomSpeed = 0.008
      targetPosition.current.z += event.deltaY * zoomSpeed
      targetPosition.current.z = Math.max(5, Math.min(50, targetPosition.current.z))
    }
    
    // Canvas에는 pointerdown과 wheel만
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('wheel', handleWheel)
    
    // 전역에는 pointermove와 pointerup (드래그 상태 유지)
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
    // 부드러운 카메라 이동 - 속도 증가
    cameraPosition.current.lerp(targetPosition.current, 0.12) // 0.08 -> 0.12로 속도 증가
    camera.position.copy(cameraPosition.current)
    
    // 현재 위치 기반 드롭다운 업데이트 (포커싱 없음)
    updateDropdownBasedOnPosition()
  })
  
  return null
}

function SingleContinent({ continent }: { continent: Continent }) {
  const [x, y, z] = continent.position
  
  return (
    <group position={[x, y, z]}>
      {/* 대륙 기반 지형 */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[8, 8, 1]} />
        <meshStandardMaterial color={continent.color} opacity={0.8} transparent />
      </mesh>
      
      {/* 투자 영역들 */}
      <mesh position={[2, 2, 0.5]}>
        <cylinderGeometry args={[1, 1, 0.5]} />
        <meshStandardMaterial color={continent.color} opacity={0.6} transparent />
      </mesh>
      
      <mesh position={[-2, 1, 0.5]}>
        <cylinderGeometry args={[0.8, 0.8, 0.5]} />
        <meshStandardMaterial color={continent.color} opacity={0.6} transparent />
      </mesh>
      
      <mesh position={[1, -2, 0.5]}>
        <cylinderGeometry args={[1.2, 1.2, 0.5]} />
        <meshStandardMaterial color={continent.color} opacity={0.6} transparent />
      </mesh>
      
      <mesh position={[-1.5, -1.5, 0.5]}>
        <cylinderGeometry args={[0.7, 0.7, 0.5]} />
        <meshStandardMaterial color={continent.color} opacity={0.6} transparent />
      </mesh>
      
      {/* 대륙 표시판 */}
      <mesh position={[0, 0, 1]}>
        <boxGeometry args={[6, 1, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

function WorldScene() {
  const { continents } = useContinentStore()

  return (
    <group>
      {/* 전역 조명 */}
      <ambientLight intensity={0.5} />
      <pointLight position={[20, 20, 20]} intensity={1} />
      <pointLight position={[-20, -20, 20]} intensity={0.5} />
      
      {/* 모든 대륙 렌더링 */}
      {Object.values(continents).map((continent) => (
        <SingleContinent key={continent.id} continent={continent} />
      ))}
    </group>
  )
}

export default function ContinentMap() {
  const { selectedContinent, continents, isWorldView } = useContinentStore()
  
  // 현재 선택된 대륙 정보 (있으면 해당 대륙, 없으면 중앙 대륙)
  const displayContinent = selectedContinent ? continents[selectedContinent] : continents.center
  
  return (
    <main className="w-full h-screen bg-gray-900">
      {/* 3D Canvas */}
      <Canvas 
        camera={{ 
          position: [0, 0, 30], 
          fov: 75 
        }}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
      >
        <CameraController />
        <WorldScene />
      </Canvas>
      
      {/* 우상단 정보 */}
      <div className="absolute top-20 right-4 text-white bg-black bg-opacity-80 p-4 rounded-lg">
        <h2 className="font-bold" style={{ color: displayContinent.color }}>
          {isWorldView ? '세계 지도' : displayContinent.name}
        </h2>
        <div className="text-sm mt-2">
          {isWorldView ? (
            <>
              <p>🌍 전체 5개 대륙</p>
              <p>📊 총 사용자: {Object.values(continents).reduce((sum, c) => sum + c.currentUsers, 0)}명</p>
            </>
          ) : (
            <>
              <p>👥 사용자: {displayContinent.currentUsers}/{displayContinent.maxUsers}</p>
              <p>💰 총 투자금: ₩0</p>
            </>
          )}
          <p className="text-xs text-gray-400 mt-1">Stage 1-3: 세계 지도 시스템</p>
        </div>
      </div>
    </main>
  )
} 