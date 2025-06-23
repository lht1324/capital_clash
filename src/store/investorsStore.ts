import { create } from 'zustand'
import { supabase } from '@/lib/supabase/supabase'
import { investorsAPI } from '@/lib/supabase/supabase-investors-api'
import { arePlayerListsEqualById } from "@/utils/playerUtils";

export type Investor = {
    id: string
    user_id: string
    continent_id: string
    name: string
    description?: string
    x_url?: string
    instagram_url?: string
    contact_email?: string
    investment_amount: number
    image_url?: string
    image_status?: 'pending' | 'approved' | 'rejected'
    created_at: string
    updated_at: string
    daily_views: number[]
    previous_sunday_view: number
    last_viewed_at?: string
    area_color?: string
}

export enum ImageStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}

interface InvestorStore {
    // 상태
    isLoading: boolean
    error: Error | null
    investors: Record<string, Investor>
    abortController?: AbortController

    // 액션
    fetchInvestors: () => Promise<void>
    insertInvestor: (userId: string, selectedContinentId: string, investmentAmount: number, name: string) => Promise<void>
    updateInvestor: (investor: Partial<Investor>) => Promise<void>
    updateInvestorInvestmentAmount: (investor: Partial<Investor>, investmentAmount: number) => Promise<void>
    updatePlayerImageStatus: (playerId: string, imageStatus: ImageStatus) => Promise<void>
    updateInvestorDailyViews: (id: string, dailyViews: number[]) => Promise<Investor>
    subscribeToInvestors: () => Promise<void>
    unsubscribeFromInvestors: () => void

    // 헬퍼 함수
    getFilteredInvestorListByContinent: (continentId: string) => Investor[]
    getTotalInvestmentByContinent: (continentId: string) => number
    getPlayerInfoChangedByContinent: (prevPlayerList: Investor[], continentId: string) => boolean
    getStakeUpdatedPlayerList: (prevPlayerList: Investor[]) => { player: Investor, isNewUser: boolean }[]
}

export const useInvestorStore = create<InvestorStore>((set, get) => {
    // 실시간 구독 핸들러
    let investorsSubscription: ReturnType<typeof supabase.channel> | null = null;

    return {
        // 초기 상태
        isLoading: false,
        error: null,
        investors: {},

        // 투자자 정보 불러오기
        fetchInvestors: async () => {
            set({ isLoading: true, error: null })
            console.log('🔄 투자자 정보 불러오기 시작')

            try {
                const data = await investorsAPI.getAll()

                const investorsMap = data.reduce((acc, investor) => ({
                    ...acc,
                    [investor.id]: investor
                }), {} as Record<string, Investor>)

                set({ investors: investorsMap })
                console.log('✅ 투자자 정보 로드 완료:', Object.keys(investorsMap).length, '명')
            } catch (error) {
                console.error('❌ 투자자 정보 로드 실패:', error)
                set({ error: error as Error })
            } finally {
                set({ isLoading: false })
            }
        },

        // 새 투자자 추가
        insertInvestor: async (userId: string, continentId: string, investmentAmount: number, name: string) => {
            try {
                const newInvestorInfo = {
                    user_id: userId,
                    continent_id: continentId,
                    investment_amount: investmentAmount,
                    area_color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                    name: name
                }
                console.log('➕ 새 투자자 추가 시작:', newInvestorInfo)
                const result = await investorsAPI.create(newInvestorInfo)

                if (!result) throw new Error('투자자 추가 후 데이터를 받지 못했습니다.')

                console.log('✅ 새 투자자 추가 완료:', result.id)
            } catch (error) {
                console.error('❌ 투자자 추가 실패:', error)
                throw error
            }
        },

        // 투자자 정보 업데이트
        updateInvestor: async (investor) => {
            console.log('🔄 투자자 정보 업데이트 시작:', investor)
            try {
                const updatedInvestor = await investorsAPI.update(investor)

                if (!updatedInvestor) throw new Error('투자자 업데이트 후 데이터를 받지 못했습니다.')

                console.log('✅ 투자자 정보 업데이트 완료:', updatedInvestor.id)
            } catch (error) {
                console.error('❌ 투자자 정보 업데이트 실패:', error)
                throw error
            }
        },

        updateInvestorInvestmentAmount: async (investor: Partial<Investor>, additionalInvestmentAmount: number) => {
            console.log('🔄 투자자 투자금액 업데이트 시작:', investor.user_id, additionalInvestmentAmount)
            try {
                const originalInvestmentAmount = investor.investment_amount
                    ? investor.investment_amount
                    : 0

                // 투자자의 investment_amount 업데이트
                const updatedInvestor = await investorsAPI.update({
                    ...investor,
                    investment_amount: originalInvestmentAmount + additionalInvestmentAmount,
                    updated_at: new Date().toISOString()
                })

                if (!updatedInvestor) throw new Error('투자자 업데이트 후 데이터를 받지 못했습니다.')

                console.log('✅ 투자자 투자금액 업데이트 완료:', updatedInvestor.id)
                return updatedInvestor
            } catch (error) {
                console.error('❌ 투자자 투자금액 업데이트 실패:', error)
                throw error
            }
        },

        updatePlayerImageStatus: async (playerId: string, imageStatus: ImageStatus) => {
            console.log('🔄 투자자 이미지 상태 업데이트 시작:', playerId)
            try {
                const updatedPlayer = await investorsAPI.updateImageStatus(playerId, imageStatus)

                if (!updatedPlayer) throw new Error('투자자 이미지 상태 업데이트 후 데이터를 받지 못했습니다.')

                console.log('✅ 투자자 이미지 상태 업데이트 완료:', updatedPlayer.id)
                return updatedPlayer
            } catch (error) {
                console.error('❌ 투자자 이미지 상태 업데이트 실패:', error)
                throw error
            }
        },

        updateInvestorDailyViews: async (id: string, dailyViews: number[]) => {
            console.log('🔄 투자자 조회수 업데이트 시작:', id)
            try {
                const updatedInvestor = await investorsAPI.updateDailyViews(id, dailyViews)

                if (!updatedInvestor) throw new Error('투자자 조회수 업데이트 후 데이터를 받지 못했습니다.')

                console.log('✅ 투자자 조회수 업데이트 완료:', updatedInvestor.id)
                return updatedInvestor
            } catch (error) {
                console.error('❌ 투자자 조회수 업데이트 실패:', error)
                throw error
            }
        },

        // 실시간 구독 설정
        subscribeToInvestors: async () => {
            console.log('🔄 투자자 실시간 구독 시작')
            if (investorsSubscription) {
                console.log('⚠️ 이미 구독 중입니다.')
                return
            }

            // 비동기 작업 취소를 위한 AbortController 사용
            const abortController = new AbortController();
            const signal = abortController.signal;

            investorsSubscription = supabase
                .channel('investors_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'investors'
                    },
                    (payload) => {
                        // 비동기 함수를 즉시 실행하지만 결과를 기다리지 않음
                        (async () => {
                            // 취소 신호 확인
                            if (signal.aborted) return;

                            try {
                                console.log('📡 실시간 투자자 데이터 변경:', payload)

                                // 변경 유형에 따른 처리
                                if (payload.eventType === 'INSERT') {
                                    const newInvestor = payload.new as Investor
                                    set(state => ({
                                        investors: {
                                            ...state.investors,
                                            [newInvestor.id]: newInvestor
                                        }
                                    }))
                                } else if (payload.eventType === 'UPDATE') {
                                    const updatedInvestor = payload.new as Investor
                                    set(state => ({
                                        investors: {
                                            ...state.investors,
                                            [updatedInvestor.id]: {
                                                ...state.investors[updatedInvestor.id],
                                                ...updatedInvestor
                                            }
                                        }
                                    }))
                                } else if (payload.eventType === 'DELETE') {
                                    const deletedId = payload.old.id
                                    set(state => {
                                        const { [deletedId]: _, ...rest } = state.investors
                                        return { investors: rest }
                                    })
                                }
                            } catch (error) {
                                if (!signal.aborted) {
                                    console.error('실시간 데이터 처리 오류:', error)
                                }
                            }
                        })();

                        // 동기적으로 false 반환 (비동기 응답을 기다리지 않음)
                        return false;
                    }
                )
                .subscribe()

            // AbortController를 저장하여 나중에 사용
            set(state => ({ ...state, abortController }))

            console.log('✅ 실시간 구독 설정 완료')
        },

        // 구독 해제
        unsubscribeFromInvestors: () => {
            if (investorsSubscription) {
                // 먼저 진행 중인 비동기 작업 취소
                const state = get();
                if (state.abortController) {
                    state.abortController.abort();
                }

                // 약간의 지연 후 구독 해제 (진행 중인 작업이 정리될 시간 제공)
                setTimeout(() => {
                    investorsSubscription!!.unsubscribe().then();
                    investorsSubscription = null
                    console.log('🔄 투자자 실시간 구독 해제')
                }, 100);
            }
        },

        // 특정 대륙의 투자자 목록 가져오기
        getFilteredInvestorListByContinent: (continentId) => {
            const state = get()
            const investorList = Object.values(state.investors)

            return continentId !== "central"
                ? investorList.filter((investor) => investor.continent_id === continentId)
                : Object.values(
                    investorList
                        .reduce((acc, inv) => {
                            const id = inv.continent_id;
                            if (!acc[id] || inv.investment_amount > acc[id].investment_amount) {
                                acc[id] = inv; // 최고 투자금액 기준
                            }
                            return acc;
                        }, {} as Record<string, Investor>)
                );
        },

        // 특정 대륙의 총 투자금 계산
        getTotalInvestmentByContinent: (continentId: string) => {
            const state = get()
            const investorList = Object.values(state.investors)
            let filteredInvestorList: Investor[]

            if (continentId !== "central") {
                filteredInvestorList = investorList
                    .filter(investor => investor.continent_id === continentId)
            } else {
                filteredInvestorList = Object.values(
                    investorList.reduce((vipList, investor) => {
                        const investorContinentId = investor.continent_id;

                        if (!vipList[investorContinentId] || investor.investment_amount > vipList[investorContinentId].investment_amount) {
                            vipList[investorContinentId] = investor
                        }

                        return vipList
                    }, { } as Record<string, Investor>)
                )
            }

            return filteredInvestorList
                .reduce((total, investor) => total + investor.investment_amount, 0)
        },

        getPlayerInfoChangedByContinent: (prevPlayerList, continentId) => {
            const state = get();
            const newInvestorList = Object.values(state.investors);

            if (prevPlayerList.length === 0) {
                return true;
            }

            const getFilteredPlayerList = (playerList: Investor[], continentId: string) => {
                const filteredList = continentId !== "central"
                    ? playerList.filter((player) => {
                        return player.continent_id === continentId;
                    })
                    : Object.values(
                        playerList.reduce((vipList, investor) => {
                            const investorContinentId = investor.continent_id;

                            if (!vipList[investorContinentId] || investor.investment_amount > vipList[investorContinentId].investment_amount) {
                                vipList[investorContinentId] = investor
                            }

                            return vipList
                        }, { } as Record<string, Investor>)
                    )

                return [...filteredList].sort((a, b) => a.id.localeCompare(b.id));
            }
            const filteredPrevPlayerListByContinent = getFilteredPlayerList(prevPlayerList, continentId);
            const filteredNewPlayerListByContinent = getFilteredPlayerList(newInvestorList, continentId);

            if (!arePlayerListsEqualById(filteredPrevPlayerListByContinent, filteredNewPlayerListByContinent)) {
                return true;
            }

            const prevTotalStakeAmount = filteredPrevPlayerListByContinent.reduce((acc, investor) => {
                return acc + investor.investment_amount;
            }, 0);
            const newTotalStakeAmount = filteredNewPlayerListByContinent.reduce((acc, investor) => {
                return acc + investor.investment_amount;
            }, 0);

            return filteredPrevPlayerListByContinent.some((prevPlayer, index) => {
                const newPlayer = filteredNewPlayerListByContinent[index];
                const prevStakeAmount = prevPlayer.investment_amount;
                const newStakeAmount = newPlayer.investment_amount;

                const prevSharePercentage = (prevStakeAmount / prevTotalStakeAmount) > 0.01
                    ? prevStakeAmount / prevTotalStakeAmount
                    : 0.01;
                const newSharePercentage = (newStakeAmount / newTotalStakeAmount) > 0.01
                    ? newStakeAmount / newTotalStakeAmount
                    : 0.01;

                const prevImageStatus = prevPlayer.image_status;
                const newImageStatus = newPlayer.image_status;
                const prevImageUrl = prevPlayer.image_url;
                const newImageUrl = newPlayer.image_url;

                const isImageApproved = prevImageStatus === ImageStatus.PENDING && newImageStatus === ImageStatus.APPROVED;
                const isImageRejected = prevImageStatus === ImageStatus.PENDING && newImageStatus === ImageStatus.REJECTED;
                const isImageForceApproved = prevImageStatus === ImageStatus.REJECTED && newImageStatus === ImageStatus.APPROVED;
                const isImageReplaced = (prevImageStatus === ImageStatus.APPROVED && newImageStatus === ImageStatus.PENDING)
                    && (prevImageUrl !== newImageUrl);

                return (prevSharePercentage !== newSharePercentage)
                    || isImageApproved || isImageRejected || isImageForceApproved || isImageReplaced;
            })
        },

        getStakeUpdatedPlayerList(prevPlayerList: Investor[]) {
            const state = get();
            const newPlayerList = Object.values(state.investors);
            const updatedPlayerList: { player: Investor, isNewUser: boolean }[] = [];

            const sortedPrevPlayerList = [...prevPlayerList].sort((a, b) => {
                return a.id.localeCompare(b.id);
            });
            const sortedNewPlayerList = [...newPlayerList].sort((a, b) => {
                return a.id.localeCompare(b.id);
            });

            const isSameList = arePlayerListsEqualById(sortedPrevPlayerList, sortedNewPlayerList);

            if ((sortedPrevPlayerList.length === sortedNewPlayerList.length) && isSameList) {
                const isNotChanged = sortedPrevPlayerList.every((prevPlayer, index) => {
                    const newPlayer = sortedNewPlayerList[index];

                    return prevPlayer.investment_amount === newPlayer.investment_amount;
                })

                if (isNotChanged) {
                    return [];
                }
            }

            // 1. prevPlayerList와 newPlayerList를 비교해 동일한 id를 가진 player의
            // investment_amount가 다르다면 updatedPlayerList에 push
            sortedPrevPlayerList.forEach((prevPlayer) => {
                // 동일한 ID를 가진 새 contributor 찾기
                const newPlayer = sortedNewPlayerList.find((contributor) => {
                    return contributor.id === prevPlayer.id;
                });

                // 새 player가 존재하고 investment_amount가 다르다면 updatedPlayerList에 추가
                if (newPlayer && prevPlayer.investment_amount !== newPlayer.investment_amount) {
                    updatedPlayerList.push({
                        player: newPlayer,
                        isNewUser: false
                    });
                }
            });

            // 2. prevPlayerList에는 없지만 newPlayerList에는 존재하는 contributor를
            // 신규 가입 유저로 가정하고 updatedPlayerList에 push
            const prevPlayerIds = new Set(sortedPrevPlayerList.map((prevPlayer) => {
                return prevPlayer.id;
            }));

            sortedNewPlayerList.forEach((newPlayer) => {
                // prevContributorList에 없는 ID를 가진 contributor는 신규 가입 유저
                if (!prevPlayerIds.has(newPlayer.id)) {
                    updatedPlayerList.push({
                        player: newPlayer,
                        isNewUser: true
                    });
                }
            });

            // 3. updatedContributorList 반환
            return updatedPlayerList;
        }
    }
})
