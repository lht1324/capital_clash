import {Player} from '@/api/types/supabase/Players';
import {supabase} from '@/lib/supabase/supabaseClient';
import {PlayerUpdateInfo, UpdateType} from "@/api/types/supabase/players/PlayerUpdates";
import {calculateSquareLayout, getContinentPosition, PlacementResult, Position} from "@/lib/treemapAlgorithm";
import {Continent} from '@/api/types/supabase/Continents';
import {createWithEqualityFn} from "zustand/traditional";

export interface PlayersStore {
    // --- 상태 (State) ---
    players: Record<string, Player>; // ID 기반의 빠른 조회를 위한 객체
    playerList: Player[]; // 목록 순회를 위한 배열
    vipPlayerList: Player[]; // 대륙별 1위 플레이어 목록
    placementResultRecord: Record<string, PlacementResult>
    continentPositionRecord: Record<string, Position>
    continentListForReference: Continent[],
    isInitialized: boolean;
    lastUpdatedPlayerList: PlayerUpdateInfo[];

    // --- 액션 (Actions) ---
    initializePlayers: (
        initialPlayerList: Player[],
        initialPlacementResultRecord: Record<string, PlacementResult>,
        initialContinentPositionRecord: Record<string, Position>,
        continentList: Continent[]
    ) => void;
    subscribeToPlayers: () => () => void; // 구독 해제 함수를 반환
}

/**
 * 대륙별 최고 투자자 목록을 계산하는 헬퍼 함수
 * @param players - 전체 플레이어 객체
 * @returns 대륙별 1위 플레이어 배열
 */
const _calculateVipPlayerList = (players: Record<string, Player>): Player[] => {
    const vipsByContinent: Record<string, Player> = {};
    for (const playerId in players) {
        const player = players[playerId];
        const continentId = player.continent_id;

        if (!vipsByContinent[continentId] || player.investment_amount > vipsByContinent[continentId].investment_amount) {
            vipsByContinent[continentId] = player;
        }
    }
    return Object.values(vipsByContinent);
};

function _calculateContinentalLayoutInfo(
    playerList: Player[],
    vipPlayerList: Player[],
    prevPlacementResultRecord: Record<string, PlacementResult>,
    prevContinentPositionRecord: Record<string, Position>,
    rerenderingContinentIdList: string[],
    continentList: Continent[]
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
            // placementResultRecord[continent.id] = calculateSquareLayout(
            //     filteredPlayerListByContinent,
            //     continent.id
            // )
        }

        if (placementResultRecord[continent.id]) {
            continentPositionRecord[continent.id] = doesNeedRerendering
                ? getContinentPosition(
                    placementResultRecord[continent.id],
                    placementResultRecord["central"]
                )
                : prevContinentPositionRecord[continent.id];
        }
    });

    return {
        newPlacementResultRecord: placementResultRecord,
        newContinentPositionRecord: continentPositionRecord,
    }
}

export const usePlayersStore = createWithEqualityFn<PlayersStore>((set, get) => ({
    // --- 초기 상태 ---
    players: {},
    playerList: [],
    vipPlayerList: [],
    placementResultRecord: {},
    continentPositionRecord: {},
    continentListForReference: [],
    isInitialized: false,
    lastUpdatedPlayerList: [],

    // --- 액션 구현 ---
    initializePlayers: (
        initialPlayerList: Player[],
        initialPlacementResultRecord: Record<string, PlacementResult>,
        initialContinentPositionRecord: Record<string, Position>,
        continentList: Continent[]) => {
        const { isInitialized } = get();
        if (isInitialized) {
            console.log('⚠️ PlayerStore가 이미 초기화되었습니다. 중복 실행을 방지합니다.');
            return;
        }
        const playersMap = initialPlayerList.reduce((acc, player) => {
            acc[player.id] = player;
            return acc;
        }, {} as Record<string, Player>);
        const vipPlayerList = _calculateVipPlayerList(playersMap);

        set({
            players: playersMap,
            playerList: initialPlayerList,
            vipPlayerList: vipPlayerList,
            placementResultRecord: initialPlacementResultRecord,
            continentPositionRecord: initialContinentPositionRecord,
            continentListForReference: continentList,
            isInitialized: true
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
                    table: 'investors'
                },
                (payload) => {
                    console.log("payload received", payload)
                    const { players: previousPlayers, continentListForReference: continentList } = get();
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
                                const isStakeAmountChanged = oldPlayer.investment_amount !== updatedPlayer.investment_amount;
                                const isImageStatusChanged = oldPlayer.image_status !== updatedPlayer.image_status;

                                if (isStakeAmountChanged || isImageStatusChanged) {
                                    if (isStakeAmountChanged) {
                                        updatedInfos.push({ player: updatedPlayer, updateType: UpdateType.STAKE_CHANGE, previousStake: oldPlayer.investment_amount });
                                    } else {
                                        if (updatedPlayer.image_status === 'approved') updatedInfos.push({ player: updatedPlayer, updateType: UpdateType.IMAGE_APPROVED });
                                        else if (updatedPlayer.image_status === 'rejected') updatedInfos.push({ player: updatedPlayer, updateType: UpdateType.IMAGE_REJECTED });
                                        else if (updatedPlayer.image_status === 'pending') updatedInfos.push({ player: updatedPlayer, updateType: UpdateType.IMAGE_PENDING });
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
                            const rerenderingContinentIdList = [...new Set(updatedInfos.filter((updatedInfo) => {
                                return updatedInfo.updateType === UpdateType.STAKE_CHANGE || updatedInfo.updateType === UpdateType.NEW_PLAYER;
                            }).map((updatedInfo) => {
                                return updatedInfo.player.continent_id;
                            }))];

                            if (rerenderingContinentIdList.length !== 0) {
                                const {
                                    placementResultRecord: prevPlacementResultRecord,
                                    continentPositionRecord: prevContinentPositionRecord
                                } = get();

                                const newVipList = _calculateVipPlayerList(newPlayers);
                                const { newPlacementResultRecord, newContinentPositionRecord } = _calculateContinentalLayoutInfo(
                                    newPlayerList,
                                    newVipList,
                                    prevPlacementResultRecord,
                                    prevContinentPositionRecord,
                                    rerenderingContinentIdList,
                                    continentList
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

        const unsubscribe = () => {
            console.log('🚫 Players 실시간 구독을 해제합니다.');
            supabase.removeChannel(channel);
        };

        return unsubscribe;
    },
}));

// --- 셀렉터 (Selectors) ---
export const selectPlayerById = (id: string) => {
    console.log("select")
    return (state: PlayersStore) => state.players[id];
}