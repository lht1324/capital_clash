'use client'

import {Canvas, useThree} from '@react-three/fiber'
import CameraController from "@/components/continent_map/CameraController";
import WorldScene from "@/components/continent_map/WorldScene";
import TerritoryInfoViewModal from "@/components/TerritoryInfoViewModal";
import {memo, useEffect, useMemo, useState} from "react";

function ContinentMap() {
    const [isTerritoryInfoModalOpen, setIsTerritoryInfoModalOpen] = useState(false);
    const [investorId, setinvestorId] = useState<string | null>(null);

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
                <CameraInitialSetup/>
                <CameraController />
                <WorldScene
                    onTileClick={(investorId) => {
                        setinvestorId(investorId);
                        setIsTerritoryInfoModalOpen(true);
                    }}
                />
            </Canvas>
            {investorId && <TerritoryInfoViewModal
                isOpen={isTerritoryInfoModalOpen}
                onClose={() => {
                    setinvestorId(null);
                    setIsTerritoryInfoModalOpen(false);
                }}
                investorId={investorId}
            />}
        </main>
    )
}

function CameraInitialSetup() {
    const { size, camera } = useThree();

    useEffect(() => {
        // 화면 크기에 따른 줌 레벨 계산
        const monitorWidth = window.screen.width;
        const monitorHeight = window.screen.height;

        const maxContinentRange = 40;
        const aspectRatio = monitorWidth / monitorHeight;
        const adjustmentFactor = aspectRatio <= (16 / 9) ? 2 : 3;

        console.log(`ratio = ${aspectRatio}, 16/9 = ${16 / 9}`)
        // 카메라 위치 설정
        camera.position.z = maxContinentRange * adjustmentFactor * (1 + 0.2 * (1 - Math.min(monitorWidth, monitorHeight) / 1000));
    }, [camera]);

    return null;
}

export default memo(ContinentMap);