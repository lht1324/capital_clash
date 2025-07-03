'use client'

import {memo, useMemo, useCallback, useState, useEffect} from "react";
import {Canvas} from '@react-three/fiber'
import {getWorldViewPositionZ} from "@/utils/cameraUtils";
import CameraController from "@/components/main/continent_map/CameraController";
import WorldScene from "@/components/main/continent_map/WorldScene";
import TerritoryInfoViewModal from "@/components/main/continent_map/TerritoryInfoViewModal";
import {CONTINENT_MAP_FOV} from "@/components/main/continent_map/continent_map_public_variables";
import {playersClientAPI} from "@/api/client/supabase/playersClientAPI";
import {usePlayersStore} from "@/store/playersStore";
import {useContinentStore} from "@/store/continentStore";
import {useComponentStateStore} from "@/store/componentStateStore";
import {useCameraStateStore} from "@/store/cameraStateStore";
import CheckoutSuccessModal from "@/components/main/continent_map/CheckoutSuccessModal";
import {Position} from "@/lib/treemapAlgorithm";

function ContinentMap() {
    const { continentList } = useContinentStore();
    const { players, placementResultRecord, continentPositionRecord } = usePlayersStore();
    const { externalCameraTarget, setCameraTarget, setExternalCameraTarget } = useCameraStateStore();
    const { checkoutSuccessStatus } = useComponentStateStore();

    const [initialPosition, setInitialPosition] = useState<Position | null>(null);
    const [isTerritoryInfoModalOpen, setIsTerritoryInfoModalOpen] = useState(false);
    const [territoryOwnerId, setTerritoryOwnerId] = useState<string | null>(null);

    const initialCameraPositionZ = useMemo(() => {
        return getWorldViewPositionZ(continentList, placementResultRecord, continentPositionRecord);
    }, [continentList, placementResultRecord, continentPositionRecord]);

    const defaultPosition = useMemo(() => {
        return { x: 0, y: 0, z: initialCameraPositionZ };
    }, [initialCameraPositionZ]);

    const updateDailyViews = useCallback(async (playerId: string) => {
        try {
            // Get the current day of the week (0 = Monday, 1 = Tuesday, ..., 6 = Sunday)
            const dayOfWeek = (new Date().getDay() + 6) % 7;
            const prevDailyViews = players[playerId]?.daily_views ?? [];

            // Create a copy of the daily views array
            const updatedDailyViews = [...prevDailyViews];

            // Increment the view count for the current day
            updatedDailyViews[dayOfWeek]++;

            // Update the daily views in the database
            await playersClientAPI.patchPlayersById(playerId, {
                daily_views: updatedDailyViews
            })
        } catch (error) {
            console.log("error", error);
        }
    }, [players]);

    useEffect(() => {
        if (!initialPosition) {
            if (externalCameraTarget) {
                setInitialPosition(externalCameraTarget);
                setExternalCameraTarget(null);
            } else {
                setInitialPosition(defaultPosition);
            }
        }
    }, [initialPosition, externalCameraTarget, defaultPosition]);

    return (
        <main className="w-full h-screen" style={{ backgroundColor: '#37aff7' }}>
            {/* 3D Canvas */}
            <Canvas
                camera={{
                    position: [defaultPosition.x, defaultPosition.y, defaultPosition.z], // 초기 카메라 Z 위치 조정
                    fov: CONTINENT_MAP_FOV  // FOV 감소로 원근감 조정
                }}
                className="w-full h-full"
                style={{ cursor: 'grab' }}
            >
                {initialPosition && <CameraController initialPosition={initialPosition}/>}
                <WorldScene
                    onTileClick={async (investorId: string) => {
                        setTerritoryOwnerId(investorId);
                        setIsTerritoryInfoModalOpen(true);
                        await updateDailyViews(investorId);
                    }}
                />
            </Canvas>
            {isTerritoryInfoModalOpen && territoryOwnerId && <TerritoryInfoViewModal
                territoryOwnerPlayerId={territoryOwnerId}
                onClose={() => {
                    setTerritoryOwnerId(null);
                    setIsTerritoryInfoModalOpen(false);
                }}
            />}
            {checkoutSuccessStatus && <CheckoutSuccessModal/>}
        </main>
    )
}

export default memo(ContinentMap);