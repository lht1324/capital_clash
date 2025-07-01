'use client'

import {Continent} from "@/api/types/supabase/Continents";
import {Player} from "@/api/types/supabase/Players";
import {PlacementResult, Position} from "@/lib/treemapAlgorithm";
import {User} from "@/api/types/supabase/Users";
import {useEffect, useRef} from "react";
import {useContinentStore} from "@/store/continentStore";
import {usePlayersStore} from "@/store/playersStore";
import {useUserStore} from "@/store/userStore";
import {supabase} from "@/lib/supabase/supabaseClient";
import {usersClientAPI} from "@/api/client/supabase/usersClientAPI";

export interface StoreInitializerProps {
    continentList: Continent[],
    playerList: Player[],
    placementResultRecord: Record<string, PlacementResult>,
    continentPositionRecord: Record<string, Position>,
    // user: User | null, // 이제 서버에서 user 정보를 받지 않습니다.
}

function StoreInitializer(props: StoreInitializerProps) {
    const { isContinentsInitialized, initializeContinents } = useContinentStore();
    const { isPlayersInitialized, initializePlayers, subscribeToPlayers } = usePlayersStore();
    const { isUsersInitialized, initializeUser } = useUserStore();

    let unsubscribePlayers: (() => void) | null = null;
    let authListener: any = null;

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
            // onAuthStateChange 리스너 설정
            const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
                const currentUser = session?.user ?? null;

                authListener = listener;

                console.log("listenerUser", currentUser);

                if (currentUser) {
                    usersClientAPI.getUserById(currentUser.id).then((user) => {
                        console.log("listenerUserListener", user);
                        initializeUser(user);
                    });
                } else {
                    initializeUser(null);
                }
            });
        }

        if (isPlayersInitialized) {
            unsubscribePlayers = subscribeToPlayers();
        }

        return () => {
            if (isPlayersInitialized) {
                unsubscribePlayers ? unsubscribePlayers() : null;
            }
            authListener?.subscription.unsubscribe();
        };
    }, [isContinentsInitialized, isPlayersInitialized, props, initializeContinents, initializePlayers, initializeUser, subscribeToPlayers]);

    return null
}

export default StoreInitializer;