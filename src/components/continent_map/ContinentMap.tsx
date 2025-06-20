'use client'

import {Canvas, useThree} from '@react-three/fiber'
import CameraController from "@/components/continent_map/CameraController";
import WorldScene from "@/components/continent_map/WorldScene";
import TerritoryInfoViewModal from "@/components/TerritoryInfoViewModal";
import {memo, useCallback, useEffect, useMemo, useState} from "react";
import { useInvestorStore } from '@/store/investorsStore';

function ContinentMap() {
    const { updateInvestorDailyViews } = useInvestorStore();

    const [isTerritoryInfoModalOpen, setIsTerritoryInfoModalOpen] = useState(false);
    const [investorId, setInvestorId] = useState<string | null>(null);

    // 1. weekly로 수정.
    /*
    {
        "previous_week_daily_views": number[]
        "current_week_daily_views": number[]
    }
     */
    // 2. admin 제작, 이미지 컨펌과 수동 업데이트 기능만 일단 파 둠.
    // 👁️ 프로필 열릴 때 조회수 증가
    const updateDailyViews = useCallback((investorId: string, dailyViews: number[]) => {
        // Get the current day of the week (0 = Monday, 1 = Tuesday, ..., 6 = Sunday)
        const dayOfWeek = (new Date().getDay() + 6) % 7;

        // Create a copy of the daily views array
        const updatedDailyViews = [...dailyViews];

        // Increment the view count for the current day
        updatedDailyViews[dayOfWeek]++;

        // Update the daily views in the database
        updateInvestorDailyViews(investorId, updatedDailyViews)
            .catch(error => console.error('Failed to update daily views:', error));
    }, [updateInvestorDailyViews]);

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
                    onTileClick={(investorId: string, dailyViews: number[]) => {
                        setInvestorId(investorId);
                        updateDailyViews(investorId, dailyViews);
                        setIsTerritoryInfoModalOpen(true);
                    }}
                />
            </Canvas>
            {isTerritoryInfoModalOpen && investorId && <TerritoryInfoViewModal
                onClose={() => {
                    setInvestorId(null);
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