'use client'

import { useMemo, memo, useEffect } from "react"; // useEffect 추가
import { usePlayersStore } from "@/store/playersStore"; // 스토어 import
import { useShallow } from 'zustand/react/shallow'; // 스토어 import
import ContinentDropdown from "@/components/main/continent_map/ContinentDropdown";
import ContinentMap from "@/components/main/continent_map/ContinentMap";
import InvestmentNotificationManager from "@/components/main/notification/NotificationManager";
import { Continent } from "@/api/types/supabase/Continents";
import { Player } from "@/api/types/supabase/Players";
import { User } from "@/api/types/supabase/Users";
import { PlacementResult, Position } from "@/lib/treemapAlgorithm";
import {useContinentStore} from "@/store/continentStore";
import {useUserStore} from "@/store/userStore";

export interface ContinentMapWrapperClientProps {
    initialContinentList: Continent[],
    initialPlayerList: Player[],
    initialPlacementResultRecord: Record<string, PlacementResult>,
    initialContinentPositionRecord: Record<string, Position>,
    initialUser: User | null,
}

// props 인터페이스에 맞게 함수 인자도 수정합니다.
function ContinentMapWrapperClient(props: ContinentMapWrapperClientProps) {
    // 2. playerList와 vipPlayerList는 Zustand 스토어에서 직접 가져옵니다.
    const { initializeContinents } = useContinentStore();
    const {
        isInitialized,
        initializePlayers,
        subscribeToPlayers
    } = usePlayersStore();
    const { initializeUser } = useUserStore();

    // 3. 스토어를 초기화하고 구독을 설정하는 useEffect
    useEffect(() => {
        if (!isInitialized) {
            initializePlayers(
                props.initialPlayerList,
                props.initialPlacementResultRecord,
                props.initialContinentPositionRecord,
                props.initialContinentList
            );
            initializeUser(props.initialUser);
            initializeContinents(props.initialContinentList);
        } else {
            const unsubscribe = subscribeToPlayers();
            return () => unsubscribe();
        }
    }, [isInitialized, initializePlayers, initializeContinents, initializeUser, props, subscribeToPlayers]);

    // 4. 렌더링 조건: isInitialized로 스토어 준비 상태를 확인
    if (!isInitialized) {
        return <main className="flex w-full pt-16">Loading players...</main>;
    }

    return (
        <main className="flex w-full pt-16">
            <ContinentDropdown/>
            <ContinentMap/>
            <InvestmentNotificationManager
                isEnabled={true}
            />
        </main>
    )
}

export default memo(ContinentMapWrapperClient);
