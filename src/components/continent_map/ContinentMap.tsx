'use client'

import { Canvas } from '@react-three/fiber'
import CameraController from "@/components/continent_map/CameraController";
import WorldScene from "@/components/continent_map/WorldScene";

export default function ContinentMap() {
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