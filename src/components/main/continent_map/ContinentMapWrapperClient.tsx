'use client'

import {useMemo, memo} from "react";
import ContinentDropdown from "@/components/main/continent_map/ContinentDropdown";
import ContinentMap from "@/components/main/continent_map/ContinentMap";
import InvestmentNotificationManager from "@/components/main/notification/NotificationManager";
import {Continent} from "@/api/server/supabase/types/Continents";
import {Player} from "@/api/server/supabase/types/Players";
import {PlacementResult, Position} from "@/lib/treemapAlgorithm";

export interface ContinentMapWrapperClientProps {
    continentList: Continent[],
    playerList: Player[],
    vipPlayerList: Player[],
    placementResultRecord: Record<string, PlacementResult>,
    continentPositionRecord: Record<string, Position>
}

function ContinentMapWrapperClient(props: ContinentMapWrapperClientProps) {
    const {
        continentList,
        playerList,
        vipPlayerList,
        placementResultRecord,
        continentPositionRecord,
    } = useMemo(() => {
        return props;
    }, [props]);

    return (
        <main className="flex w-full pt-16">
            <ContinentDropdown
                continentList={continentList}
                playerList={playerList}
                vipPlayerList={vipPlayerList}
                placementResultRecord={placementResultRecord}
                continentPositionRecord={continentPositionRecord}
            />

            {/* 메인 지도 - 항상 표시 */}
            <ContinentMap
                continentList={continentList}
                playerList={playerList}
                placementResultRecord={placementResultRecord}
                continentPositionRecord={continentPositionRecord}
            />

            {/* 실시간 투자 알림 시스템 */}
            <InvestmentNotificationManager
                continentList={continentList}
                playerList={playerList}
                isEnabled={true}
            />
        </main>
    )
}

export default memo(ContinentMapWrapperClient);