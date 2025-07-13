import {ImageStatus, Player} from '@/api/types/supabase/Players';
import {supabase} from '@/lib/supabase/supabaseClient';
import {PlayerUpdateInfo, UpdateType} from "@/api/types/supabase/players/PlayerUpdates";
import {calculateSquareLayout, getContinentPosition, PlacementResult, Position} from "@/lib/spiralPlacementAlgorithm";
import {Continent} from '@/api/types/supabase/Continents';
import {createWithEqualityFn} from "zustand/traditional";
import {
    CENTRAL_INCREASE_RATIO,
    CONTINENT_MAX_USER_COUNT
} from "@/components/main/continent_map/continent_map_public_variables";

export interface PlayersStore {
    // --- 상태 (State) ---
    isPlayersInitialized: boolean;

    players: Record<string, Player>; // ID 기반의 빠른 조회를 위한 객체
    playerList: Player[]; // 목록 순회를 위한 배열
    vipPlayerList: Player[]; // 대륙별 1위 플레이어 목록
    placementResultRecord: Record<string, PlacementResult>
    continentPositionRecord: Record<string, Position>
    continentListForReference: Continent[],
    lastUpdatedPlayerList: PlayerUpdateInfo[];
    screenSize: { screenWidth: number, screenHeight: number },

    // --- 액션 (Actions) ---
    initializePlayers: (
        initialPlayerList: Player[],
        initialPlacementResultRecord: Record<string, PlacementResult>,
        continentList: Continent[],
        screenWidth: number,
        screenHeight: number,
    ) => void;
    subscribeToPlayers: () => () => Promise<'ok' | 'timed out' | 'error'>; // 구독 해제 함수를 반환
    setScreenSize: (screenWidth: number, screenHeight: number) => void;

    getSharePercentageByContinent: (playerId: string, continentId: string) => number;
    getContinentalRankByContinent: (playerId: string, continentId: string) => number;
    getOverallRank: (playerId: string) => number;
    getViewsRank: (playerId: string) => number;
}

/**
 * 대륙별 최고 투자자 목록을 계산하는 헬퍼 함수
 * @param players - 전체 플레이어 객체
 * @returns 대륙별 1위 플레이어 배열
 */
const _calculateVipPlayerList = (players: Record<string, Player>): Player[] => {
    const vipsByContinent: Record<string, Player> = {};

    Object.values(players).forEach((player) => {
        const playerContinentId = player.continent_id;
        const currentContinentVip = vipsByContinent[playerContinentId];

        if (!currentContinentVip || (currentContinentVip && currentContinentVip.stake_amount < player.stake_amount)) {
            vipsByContinent[playerContinentId] = player;
        }
    })

    return Object.values(vipsByContinent);
};

function _calculateContinentalLayoutInfo(
    playerList: Player[],
    vipPlayerList: Player[],
    prevPlacementResultRecord: Record<string, PlacementResult>,
    prevContinentPositionRecord: Record<string, Position>,
    rerenderingContinentIdList: string[],
    continentList: Continent[],
    screenWidth: number,
    screenHeight: number,
) {
    const placementResultRecord: Record<string, PlacementResult> = { };
    const continentPositionRecord: Record<string, Position> = { };

    continentList.forEach((continent) => {
        const filteredPlayerListByContinent = continent.id !== "central"
            ? playerList.filter((player) => {
                return player.continent_id === continent.id;
            })
            : vipPlayerList;

        const doesNeedRerendering = rerenderingContinentIdList.find(id => continent.id === id);

        if (filteredPlayerListByContinent.length !== 0) {
            placementResultRecord[continent.id] = doesNeedRerendering
                ? calculateSquareLayout(
                    filteredPlayerListByContinent,
                    continent.id
                )
                : prevPlacementResultRecord[continent.id]
        } else {
            const defaultLength = continent.id !== "central"
                ? CONTINENT_MAX_USER_COUNT
                : CONTINENT_MAX_USER_COUNT * CENTRAL_INCREASE_RATIO;

            placementResultRecord[continent.id] = {
                placements: [],
                boundary: {
                    minX: 0,
                    maxX: defaultLength,
                    minY: 0,
                    maxY: defaultLength,
                    width: defaultLength,
                    height: defaultLength
                },
                continentId: continent.id
            }
        }

        continentPositionRecord[continent.id] = doesNeedRerendering
            ? getContinentPosition(
                placementResultRecord[continent.id],
                placementResultRecord["central"],
                screenWidth,
                screenHeight
            )
            : prevContinentPositionRecord[continent.id];
    });

    return {
        newPlacementResultRecord: placementResultRecord,
        newContinentPositionRecord: continentPositionRecord,
    }
}

export const usePlayersStore = createWithEqualityFn<PlayersStore>((set, get) => ({
    // --- 초기 상태 ---
    isPlayersInitialized: false,

    players: {},
    playerList: [],
    vipPlayerList: [],
    placementResultRecord: {},
    continentPositionRecord: {},
    continentListForReference: [],
    lastUpdatedPlayerList: [],
    screenSize: { screenWidth: 1920, screenHeight: 1080 },

    // --- 액션 구현 ---
    initializePlayers: (
        initialPlayerList: Player[],
        initialPlacementResultRecord: Record<string, PlacementResult>,
        continentList: Continent[],
        screenWidth: number,
        screenHeight: number
    ) => {
        const { isPlayersInitialized } = get();
        if (isPlayersInitialized) {
            console.log('⚠️ PlayerStore가 이미 초기화되었습니다. 중복 실행을 방지합니다.');
            return;
        }
        const playersMap = initialPlayerList.reduce((acc, player) => {
            acc[player.id] = player;
            return acc;
        }, {} as Record<string, Player>);
        const vipPlayerList = _calculateVipPlayerList(playersMap);
        const continentPositionRecord: Record<string, Position> = {};

        continentList.forEach((continent) => {
            continentPositionRecord[continent.id] = getContinentPosition(
                initialPlacementResultRecord[continent.id],
                initialPlacementResultRecord["central"],
                screenWidth,
                screenHeight
            );
        });

        set({
            players: playersMap,
            playerList: initialPlayerList,
            vipPlayerList: vipPlayerList,
            placementResultRecord: initialPlacementResultRecord,
            continentPositionRecord: continentPositionRecord,
            continentListForReference: continentList,
            isPlayersInitialized: true
        });
        console.log('✅ PlayerStore 초기화 완료.');
    },

    subscribeToPlayers: () => {
        console.log('🔄 Players 실시간 구독을 시작합니다...');

        const channel = supabase
            .channel('players_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'players'
                },
                (payload) => {
                    console.log("payload received", payload)
                    const {
                        players: previousPlayers,
                        continentListForReference: continentList,
                        screenSize: { screenWidth, screenHeight },
                    } = get();
                    const updatedInfos: PlayerUpdateInfo[] = [];
                    let newPlayers: Record<string, Player> = previousPlayers;

                    switch (payload.eventType) {
                        case 'INSERT': {
                            const newPlayer = payload.new as Player;
                            updatedInfos.push({ player: newPlayer, updateType: UpdateType.NEW_PLAYER });
                            newPlayers = { ...previousPlayers, [newPlayer.id]: newPlayer };
                            console.log('📡 INSERT 감지:', newPlayer);
                            break;
                        }

                        case 'UPDATE': {
                            const updatedPlayer = payload.new as Player;
                            const oldPlayer = previousPlayers[updatedPlayer.id];

                            // 1. 어떤 필드가 변경되었든, 항상 플레이어 데이터를 최신 상태로 업데이트합니다.
                            newPlayers = { ...previousPlayers, [updatedPlayer.id]: updatedPlayer };
                            console.log('📡 UPDATE 감지:', updatedPlayer);

                            // 2. 알림을 위해 어떤 정보가 변경되었는지 별도로 확인합니다.
                            if (oldPlayer) {
                                const isStakeAmountChanged = oldPlayer.stake_amount !== updatedPlayer.stake_amount
                                    && oldPlayer.continent_id === updatedPlayer.continent_id;
                                const isImageStatusChanged = oldPlayer.image_status !== updatedPlayer.image_status;
                                const isContinentChanged = oldPlayer.continent_id !== updatedPlayer.continent_id;
                                const isAreaColorChanged = oldPlayer.area_color !== updatedPlayer.area_color;

                                if (isStakeAmountChanged || isImageStatusChanged || isContinentChanged) {
                                    if (isStakeAmountChanged) {
                                        updatedInfos.push({ player: updatedPlayer, updateType: UpdateType.STAKE_CHANGE, previousStake: oldPlayer.stake_amount });
                                    } else if (isImageStatusChanged) {
                                        switch(updatedPlayer.image_status) {
                                            case ImageStatus.APPROVED: {
                                                updatedInfos.push({ player: updatedPlayer, updateType: UpdateType.IMAGE_APPROVED })
                                                break;
                                            }
                                            case ImageStatus.REJECTED: {
                                                updatedInfos.push({ player: updatedPlayer, updateType: UpdateType.IMAGE_REJECTED })
                                                break;
                                            }
                                            case ImageStatus.PENDING: {
                                                updatedInfos.push({ player: updatedPlayer, updateType: UpdateType.IMAGE_PENDING })
                                                break;
                                            }
                                            default: {
                                                break;
                                            }
                                        }
                                    } else if (isContinentChanged) {
                                        updatedInfos.push({ player: updatedPlayer, updateType: UpdateType.CONTINENT_CHANGE })
                                    } else {
                                        updatedInfos.push({ player: updatedPlayer, updateType: UpdateType.AREA_COLOR_CHANGE })
                                    }
                                } else {
                                    updatedInfos.push({ player: updatedPlayer, updateType: UpdateType.NONE_UI_UPDATE });
                                }
                            }
                            break;
                        }

                        case 'DELETE': {
                            const deletedPlayer = payload.old as Player;
                            updatedInfos.push({ player: deletedPlayer, updateType: UpdateType.PLAYER_REMOVED });
                            const { [deletedPlayer.id]: _, ...rest } = previousPlayers;
                            newPlayers = rest;
                            console.log('📡 DELETE 감지:', deletedPlayer);
                            break;
                        }

                        default:
                            return;
                    }

                    if (newPlayers !== previousPlayers) {
                        const newPlayerList = Object.values(newPlayers);

                        const needUIUpdate = updatedInfos.some((updatedInfo) => {
                            return updatedInfo.updateType !== UpdateType.NONE_UI_UPDATE;
                        })

                        if (needUIUpdate) {
                            const continentIdsToRerender = new Set<string>();

                            for (const { updateType, player } of updatedInfos) {
                                // 1) 공통 케이스: 새 대륙 ID
                                if (
                                    updateType === UpdateType.STAKE_CHANGE ||
                                    updateType === UpdateType.NEW_PLAYER ||
                                    updateType === UpdateType.CONTINENT_CHANGE
                                ) {
                                    continentIdsToRerender.add(player.continent_id);
                                }

                                // 2) 대륙 이동이면 이전 대륙 ID도 추가
                                if (updateType === UpdateType.CONTINENT_CHANGE) {
                                    const prevContinentId = previousPlayers[player.id]?.continent_id;

                                    if (prevContinentId) continentIdsToRerender.add(prevContinentId);
                                }
                            }

                            const rerenderingContinentIdList = [...continentIdsToRerender, "central"];

                            console.log("rerenderingList", rerenderingContinentIdList)

                            if (rerenderingContinentIdList.length !== 0) {
                                const {
                                    placementResultRecord: prevPlacementResultRecord,
                                    continentPositionRecord: prevContinentPositionRecord
                                } = get();

                                const newVipList = _calculateVipPlayerList(newPlayers);

                                console.log("newVipList", newVipList);
                                const { newPlacementResultRecord, newContinentPositionRecord } = _calculateContinentalLayoutInfo(
                                    newPlayerList,
                                    newVipList,
                                    prevPlacementResultRecord,
                                    prevContinentPositionRecord,
                                    rerenderingContinentIdList,
                                    continentList,
                                    screenWidth,
                                    screenHeight
                                )

                                set({
                                    players: newPlayers,
                                    playerList: newPlayerList,
                                    vipPlayerList: newVipList,
                                    placementResultRecord: newPlacementResultRecord,
                                    continentPositionRecord: newContinentPositionRecord,
                                    lastUpdatedPlayerList: updatedInfos
                                });
                            } else {
                                set({
                                    players: newPlayers,
                                    playerList: newPlayerList,
                                    lastUpdatedPlayerList: updatedInfos
                                });
                            }
                        } else {
                            set({
                                players: newPlayers,
                                playerList: newPlayerList,
                                lastUpdatedPlayerList: updatedInfos
                            });
                        }
                    }
                }
            )
            .subscribe();

        const unsubscribe = async () => {
            console.log('🚫 Players 실시간 구독을 해제합니다.');
            return await supabase.removeChannel(channel);
        };

        return unsubscribe;
    },

    setScreenSize: (screenWidth, screenHeight) => {
        set({
            screenSize: {
                screenWidth: screenWidth,
                screenHeight: screenHeight,
            },
        })
    },

    getSharePercentageByContinent: (playerId, continentId) => {
        const { players, playerList } = get();
        const player = players[playerId];

        const filteredPlayerListByContinent = playerList.filter((player) => {
            return player.continent_id === continentId;
        });

        const continentalTotalStake = filteredPlayerListByContinent.reduce((acc, player) => {
            return acc + player.stake_amount;
        }, 0);
        const newSharePercentage = (player.stake_amount / continentalTotalStake) * 100;

        return newSharePercentage > 0.01
            ? newSharePercentage
            : 0.01;
    },


    getContinentalRankByContinent: (playerId: string, continentId: string) => {
        const { playerList } = get();

        return playerList.filter((player) => {
            return player.continent_id === continentId;
        }).sort((a, b) => {
            return b.stake_amount - a.stake_amount;
        }).findIndex((player) => {
            return player.id === playerId;
        }) + 1;
    },

    getOverallRank: (playerId: string) => {
        const { playerList } = get();

        return playerList.sort((a, b) => {
            return b.stake_amount - a.stake_amount;
        }).findIndex((player) => {
            return player.id === playerId;
        }) + 1;
    },

    getViewsRank: (playerId: string) => {
        const sumDailyViews = (dailyViews: number[]) => {
            return dailyViews.reduce((acc, dailyView) => acc + dailyView, 0);
        }

        const { playerList } = get();

        return playerList.sort((a, b) => {
            return sumDailyViews(b.daily_views) - sumDailyViews(a.daily_views);
        }).findIndex((player) => {
            return player.id === playerId;
        }) + 1;
    },
}));

// --- 셀렉터 (Selectors) ---
export const selectPlayerById = (id: string) => {
    console.log("select")
    return (state: PlayersStore) => state.players[id];
}