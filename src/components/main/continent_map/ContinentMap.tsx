'use client'

import {Canvas} from '@react-three/fiber'
import CameraController from "@/components/main/continent_map/CameraController";
import WorldScene from "@/components/main/continent_map/WorldScene";
import TerritoryInfoViewModal from "@/components/main/TerritoryInfoViewModal";
import {memo, useMemo, useCallback, useState, useEffect} from "react";
import { useInvestorStore } from '@/store/investorsStore';
import {Player} from "@/api/server/supabase/types/Players";
import {Continent} from "@/api/server/supabase/types/Continents";
import {PlacementResult, Position} from "@/lib/treemapAlgorithm";
import {CONTINENT_MAP_FOV} from "@/components/main/continent_map/continent_map_public_variables";
import {getWorldViewPositionZ} from "@/utils/cameraUtils";
import {useCameraStateStore} from "@/store/cameraStateStore";

function ContinentMap({
    continentList,
    playerList,
    placementResultRecord,
    continentPositionRecord,
}: {
    continentList: Continent[],
    playerList: Player[],
    placementResultRecord: Record<string, PlacementResult>,
    continentPositionRecord: Record<string, Position>
}) {
    const { updateInvestorDailyViews } = useInvestorStore(); // Client API
    const { setCameraTarget } = useCameraStateStore();

    const [isTerritoryInfoModalOpen, setIsTerritoryInfoModalOpen] = useState(false);
    const [openedInvestorId, setOpenedInvestorId] = useState<string | null>(null);

    const initialCameraPositionZ = useMemo(() => {
        return getWorldViewPositionZ(continentList, placementResultRecord, continentPositionRecord);
    }, [continentList, placementResultRecord, continentPositionRecord]);

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

    useEffect(() => {
        setCameraTarget({ x: 0, y: 0, z: initialCameraPositionZ });
    }, [initialCameraPositionZ]);

    return (
        <main className="w-full h-screen" style={{ backgroundColor: '#37aff7' }}>
            {/* 3D Canvas */}
            <Canvas
                camera={{
                    position: [0, 0, initialCameraPositionZ],  // 초기 카메라 Z 위치 조정
                    fov: CONTINENT_MAP_FOV  // FOV 감소로 원근감 조정
                }}
                className="w-full h-full"
                style={{ cursor: 'grab' }}
            >
                <CameraController
                    continentList={continentList}
                    continentPositionRecord={continentPositionRecord}
                />
                <WorldScene
                    continentList={continentList}
                    placementResultRecord={placementResultRecord}
                    continentPositionRecord={continentPositionRecord}
                    onTileClick={(investorId: string, dailyViews: number[]) => {
                        setOpenedInvestorId(investorId);
                        updateDailyViews(investorId, dailyViews);
                        setIsTerritoryInfoModalOpen(true);
                    }}
                />
            </Canvas>
            {isTerritoryInfoModalOpen && openedInvestorId && <TerritoryInfoViewModal
                continentList={continentList}
                playerList={playerList}
                openedInvestorId={openedInvestorId}
                onClose={() => {
                    setOpenedInvestorId(null);
                    setIsTerritoryInfoModalOpen(false);
                }}
            />}
        </main>
    )
}

export default memo(ContinentMap);