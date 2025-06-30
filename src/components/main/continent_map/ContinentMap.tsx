'use client'

import {memo, useMemo, useCallback, useState, useEffect} from "react";
import {Canvas} from '@react-three/fiber'
import CameraController from "@/components/main/continent_map/CameraController";
import WorldScene from "@/components/main/continent_map/WorldScene";
import TerritoryInfoViewModal, {TerritoryInfoViewModalProps} from "@/components/main/TerritoryInfoViewModal";
import {Player} from "@/api/types/supabase/Players";
import {Continent} from "@/api/types/supabase/Continents";
import {User} from "@/api/types/supabase/Users";
import {PlacementResult, Position} from "@/lib/treemapAlgorithm";
import {CONTINENT_MAP_FOV} from "@/components/main/continent_map/continent_map_public_variables";
import {getWorldViewPositionZ} from "@/utils/cameraUtils";
import {useCameraStateStore} from "@/store/cameraStateStore";
import {playersClientAPI} from "@/api/client/supabase/playersClientAPI";
import {usePlayersStore} from "@/store/playersStore";
import {useContinentStore} from "@/store/continentStore";
import {useUserStore} from "@/store/userStore";

function ContinentMap() {
    const { continentList } = useContinentStore();
    const { players, playerList, placementResultRecord, continentPositionRecord } = usePlayersStore();
    const { user } = useUserStore();
    const { setCameraTarget } = useCameraStateStore();

    const [isTerritoryInfoModalOpen, setIsTerritoryInfoModalOpen] = useState(false);
    const [territoryOwnerId, setTerritoryOwnerId] = useState<string | null>(null);

    const territoryOwnerPlayerInfo = useMemo(() => {
        return territoryOwnerId
            ? players[territoryOwnerId] ?? null
            : null
    }, [territoryOwnerId]);

    const filteredPlayerListByContinent = useMemo(() => {
        return playerList.filter((player: Player) => {
            return player.continent_id === territoryOwnerPlayerInfo?.continent_id;
        })
    }, [playerList, territoryOwnerPlayerInfo]);

    const continentalTotalStakeAmount = useMemo(() => {
        return playerList.filter((player: Player) => {
            return player.continent_id === territoryOwnerPlayerInfo?.continent_id;
        }).reduce((acc, player) => {
            return acc + player.investment_amount;
        }, 0);
    }, [playerList, territoryOwnerPlayerInfo]);

    const territoryInfoViewModalProps: TerritoryInfoViewModalProps | null = useMemo(() => {
        return territoryOwnerPlayerInfo ? {
            continentList: continentList,
            territoryOwnerPlayerInfo: territoryOwnerPlayerInfo,
            isUserOpenedModal: territoryOwnerPlayerInfo?.user_id === user?.id,
            userContinentalRank: (() => {
                return filteredPlayerListByContinent.sort((a, b) => {
                    return b.investment_amount - a.investment_amount;
                }).findIndex((investor) => {
                    return investor.id === territoryOwnerPlayerInfo?.id;
                }) + 1;
            })(),
            userOverallRank: (() => {
                return playerList.sort((a, b) => {
                    return b.investment_amount - a.investment_amount;
                }).findIndex((player: Player) => {
                    return player.id === territoryOwnerPlayerInfo.id;
                }) + 1;
            })(),
            userSharePercentage: (() => {
                const userStakeAmount = territoryOwnerPlayerInfo?.investment_amount ?? 0;
                const calcResult = userStakeAmount / continentalTotalStakeAmount * 100;

                return calcResult > 0.01 ? calcResult : 0.01;
            })(),
            onClose: () => {
                setTerritoryOwnerId(null);
                setIsTerritoryInfoModalOpen(false);
            },
        } : null;
    }, [territoryOwnerPlayerInfo, user, continentList, playerList, filteredPlayerListByContinent, continentalTotalStakeAmount]);

    const initialCameraPositionZ = useMemo(() => {
        return getWorldViewPositionZ(continentList, placementResultRecord, continentPositionRecord);
    }, [continentList, placementResultRecord, continentPositionRecord]);

    const updateDailyViews = useCallback(async (playerId: string) => {
        try {
            // Get the current day of the week (0 = Monday, 1 = Tuesday, ..., 6 = Sunday)
            const dayOfWeek = (new Date().getDay() + 6) % 7;
            const prevDailyViews = players[playerId]?.daily_views ?? [];

            // Create a copy of the daily views array
            const updatedDailyViews = [...prevDailyViews];

            // 주간 초기화 로직 추가해야 함
            console.log(`prevUpdatedDailyViews(${dayOfWeek})`, updatedDailyViews);
            // Increment the view count for the current day
            updatedDailyViews[dayOfWeek]++;
            console.log(`newUpdatedDailyViews(${dayOfWeek})`, updatedDailyViews);

            // Update the daily views in the database
            await playersClientAPI.patchPlayersById(playerId, {
                daily_views: updatedDailyViews
            })
        } catch (error) {
            console.log("error", error);
        }
    }, [players]);

    useEffect(() => {
        setCameraTarget({ x: 0, y: 0, z: initialCameraPositionZ });
    }, [initialCameraPositionZ]);

    useEffect(() => {
        console.log("players update");
    }, [players]);

    useEffect(() => {
        console.log("playerList update");
    }, [playerList]);

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
                <CameraController/>
                <WorldScene
                    onTileClick={async (investorId: string) => {
                        setTerritoryOwnerId(investorId);
                        setIsTerritoryInfoModalOpen(true);
                        await updateDailyViews(investorId);
                    }}
                />
            </Canvas>
            {isTerritoryInfoModalOpen && territoryInfoViewModalProps && <TerritoryInfoViewModal
                {...territoryInfoViewModalProps}
            />}
        </main>
    )
}

export default memo(ContinentMap);