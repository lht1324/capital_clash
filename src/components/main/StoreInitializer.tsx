'use client'

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {Continent} from "@/api/types/supabase/Continents";
import {Player} from "@/api/types/supabase/Players";
import {User as AuthUser} from "@supabase/auth-js";
import {User} from "@/api/types/supabase/Users";
import {calculatePlayerCoordinates, PlacementResult, Position} from "@/lib/treemapAlgorithm";
import {useContinentStore} from "@/store/continentStore";
import {usePlayersStore} from "@/store/playersStore";
import {useUserStore} from "@/store/userStore";
import {useComponentStateStore} from "@/store/componentStateStore";
import {useCameraStateStore} from "@/store/cameraStateStore";
import {supabase} from "@/lib/supabase/supabaseClient";
import {usersClientAPI} from "@/api/client/supabase/usersClientAPI";
import {CheckoutSuccessStatus} from "@/api/types/polar/CheckoutSuccessStatus";

export interface StoreInitializerProps {
    continentList: Continent[],
    playerList: Player[],
    placementResultRecord: Record<string, PlacementResult>,
    continentPositionRecord: Record<string, Position>,

    // params
    targetPlayerId?: string | null,
    checkoutSuccessStatus?: CheckoutSuccessStatus | null,
}

function StoreInitializer(props: StoreInitializerProps) {
    const router = useRouter();

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
    const { setCheckoutSuccessStatus } = useComponentStateStore();
    const { setExternalCameraTarget } = useCameraStateStore();

    // ContinentStore
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
    }, [isPlayersInitialized, initializePlayers, props.playerList, props.placementResultRecord, props.continentPositionRecord, props.continentList]);

    // PlayersStore - Subscription
    useEffect(() => {
        if (!isPlayersInitialized) return;

        let unsubscribePlayers: (() => Promise<"ok" | "timed out" | "error">) | null = subscribeToPlayers();

        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                console.log('🔄 페이지 포커스 감지, 실시간 연결 재설정 중...');
                if (unsubscribePlayers) await unsubscribePlayers();
                unsubscribePlayers = subscribeToPlayers();
                console.log('🔄 실시간 연결 재설정 완료');
            }
        };

        const handleNetworkChange = async () => {
            if (navigator.onLine) {
                console.log('🌐 네트워크 연결 감지, 실시간 연결 재설정 중...');
                if (unsubscribePlayers) await unsubscribePlayers();
                unsubscribePlayers = subscribeToPlayers();
            } else {
                console.log('🔌 네트워크 연결 끊김');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleNetworkChange);
        window.addEventListener('offline', handleNetworkChange);

        return () => {
            if (unsubscribePlayers) {
                unsubscribePlayers();
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleNetworkChange);
            window.removeEventListener('offline', handleNetworkChange);
        };
    }, [isPlayersInitialized, subscribeToPlayers]);

    // UserStore
    useEffect(() => {
        // onAuthStateChange 리스너 설정
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            const authUser: AuthUser | null = session?.user ?? null;

            if (authUser) {
                usersClientAPI.getUserById(authUser.id).then((user: User | null) => {
                    if (user) {
                        initializeUser(user);
                    } else {
                        usersClientAPI.postUsers({
                            id: authUser.id,
                            email: authUser.user_metadata?.email ?? "",
                            name: authUser.user_metadata?.name ?? "",
                            avatar_url: authUser.user_metadata?.avatar_url ?? "",
                            external_url: authUser.user_metadata?.external_url ?? "",
                        }).then((newUser: User | null) => {
                            initializeUser(newUser);
                        });
                    }
                });
            } else {
                initializeUser(null);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        }
    }, [initializeUser]);

    // ComponentStore
    useEffect(() => {
        if (props.checkoutSuccessStatus) {
            setCheckoutSuccessStatus(props.checkoutSuccessStatus);

            const url = new URL(window.location.href);
            url.searchParams.delete("checkout_success_status");
            window.history.replaceState(null, "", url);
        }
    }, [props.checkoutSuccessStatus, setCheckoutSuccessStatus, router]);

    // CameraStore
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

                        const url = new URL(window.location.href);
                        url.searchParams.delete("user_identifier");
                        window.history.replaceState(null, "", url);
                    }
                }
            }
        }
    }, [props.targetPlayerId, isPlayersInitialized, players, playerList, vipPlayerList, setExternalCameraTarget, router]);

    return null
}

export default StoreInitializer;