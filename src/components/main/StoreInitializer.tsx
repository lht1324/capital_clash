'use client'

import {Continent} from "@/api/types/supabase/Continents";
import {Player} from "@/api/types/supabase/Players";
import {calculatePlayerCoordinates, PlacementResult, Position} from "@/lib/treemapAlgorithm";
import {User} from "@/api/types/supabase/Users";
import {useEffect, useRef} from "react";
import {useContinentStore} from "@/store/continentStore";
import {usePlayersStore} from "@/store/playersStore";
import {useUserStore} from "@/store/userStore";
import {supabase} from "@/lib/supabase/supabaseClient";
import {usersClientAPI} from "@/api/client/supabase/usersClientAPI";
import {useCameraStateStore} from "@/store/cameraStateStore";

export interface StoreInitializerProps {
    continentList: Continent[],
    playerList: Player[],
    placementResultRecord: Record<string, PlacementResult>,
    continentPositionRecord: Record<string, Position>,
    targetPlayerId: string | null,
}

function StoreInitializer(props: StoreInitializerProps) {
    const { isContinentsInitialized, initializeContinents } = useContinentStore();
    const {
        isPlayersInitialized,
        players,
        playerList,
        vipPlayerList,
        initializePlayers,
        subscribeToPlayers
    } = usePlayersStore();
    const { initializeUser } = useUserStore();
    const { setExternalCameraTarget } = useCameraStateStore();

    useEffect(() => {
        if (!isContinentsInitialized) {
            initializeContinents(props.continentList);
        }
    }, [props, isContinentsInitialized, initializeContinents]);

    useEffect(() => {
        if (!isPlayersInitialized) {
            initializePlayers(
                props.playerList,
                props.placementResultRecord,
                props.continentPositionRecord,
                props.continentList
            );
        }

        if (isPlayersInitialized) {
            const unsubscribePlayers = subscribeToPlayers();

            return () => {
                unsubscribePlayers();
            }
        }
    }, [props, isPlayersInitialized, initializePlayers, subscribeToPlayers]);

    useEffect(() => {
        // onAuthStateChange 리스너 설정
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user ?? null;

            if (currentUser) {
                usersClientAPI.getUserById(currentUser.id).then((user) => {
                    initializeUser(user);
                });
            } else {
                initializeUser(null);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        }
    }, [initializeUser]);

    useEffect(() => {
        if (isPlayersInitialized) {
            if (props.targetPlayerId) {
                const player = players[props.targetPlayerId];
                console.log("playerInit", player);

                if (player) {
                    const playerCoordinates = calculatePlayerCoordinates(
                        vipPlayerList,
                        playerList.filter((otherPlayer) => {
                            return otherPlayer.continent_id === player.continent_id;
                        }),
                        player.continent_id,
                        player.id
                    )
                    console.log("playerCoordinatesInit", playerCoordinates);

                    if (playerCoordinates) {
                        setExternalCameraTarget(playerCoordinates);
                    }
                }
            }
        }
    }, [props.targetPlayerId, isPlayersInitialized, players, playerList, vipPlayerList, setExternalCameraTarget]);

    return null
}

export default StoreInitializer;