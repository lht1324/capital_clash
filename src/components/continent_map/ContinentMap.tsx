'use client'

import { Canvas } from '@react-three/fiber'
import { useContinentStore } from '@/store/continentStore'
import CameraController from "@/components/continent_map/CameraController";
import WorldScene from "@/components/continent_map/WorldScene";

// 새로운 정사각형 중앙 나선형 배치 시스템 (개선됨)
const TOTAL_CELLS = 2500 // 2500개 셀 고정
const CELL_SIZE = 0.8 // 셀 크기 2배 증가
const MIN_SQUARE_SIZE = 3 // 최소 정사각형 크기 (3×3)

export default function ContinentMap() {
    const { selectedContinentId, continents, isWorldView } = useContinentStore()

    // 현재 선택된 대륙 정보 (있으면 해당 대륙, 없으면 중앙 대륙)
    const displayContinent = selectedContinentId ? continents[selectedContinentId] : continents.center

    return (
        <main className="w-full h-screen" style={{ backgroundColor: '#37aff7' }}>
            {/* 3D Canvas */}
            <Canvas
                camera={{
                    position: [0, 0, 40],  // 초기 카메라 Z 위치 조정
                    fov: 60  // FOV 감소로 원근감 조정
                }}
                className="w-full h-full"
                style={{ cursor: 'grab' }}
            >
                <CameraController />
                <WorldScene />
            </Canvas>
        </main>
    )
}