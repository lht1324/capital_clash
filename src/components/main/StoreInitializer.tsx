'use client'

import {Continent} from "@/api/types/supabase/Continents";
import {Player} from "@/api/types/supabase/Players";
import {PlacementResult, Position} from "@/lib/treemapAlgorithm";
import {User} from "@/api/types/supabase/Users";
import { useEffect } from "react";
import {useContinentStore} from "@/store/continentStore";
import {usePlayersStore} from "@/store/playersStore";
import {useUserStore} from "@/store/userStore";

export interface StoreInitializerProps {
    continentList: Continent[],
    playerList: Player[],
    placementResultRecord: Record<string, PlacementResult>,
    continentPositionRecord: Record<string, Position>,
    user: User | null,
}

function StoreInitializer(props: StoreInitializerProps) {
    const { isContinentsInitialized, initializeContinents } = useContinentStore();
    const { isPlayersInitialized, initializePlayers, subscribeToPlayers } = usePlayersStore();
    const { isUsersInitialized, initializeUser } = useUserStore();

    useEffect(() => {
        if (!isContinentsInitialized) {
            initializeContinents(props.continentList);
        }
        if (!isPlayersInitialized) {
            initializePlayers(
                props.playerList,
                props.placementResultRecord,
                props.continentPositionRecord,
                props.continentList
            );
        }
        if (!isUsersInitialized) {
            initializeUser(props.user);
        }

        if (isPlayersInitialized) {
            // 구독 해제 시 재연결 로직 추가
            const unsubscribe = subscribeToPlayers();
            return () => unsubscribe();
        }
    }, [isContinentsInitialized, isPlayersInitialized, isUsersInitialized, props]);

    return null
}

export default StoreInitializer;