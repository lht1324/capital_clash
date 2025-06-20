import { create } from 'zustand'
import { supabase } from '@/lib/supabase/supabase'
import { investorsAPI } from '@/lib/supabase/supabase-investors-api'
import { areContributorListsEqualById } from "@/utils/contributorUtils";

export type Investor = {
    id: string
    user_id: string
    continent_id: string
    name?: string
    description?: string
    x_url?: string
    instagram_url?: string
    contact_email?: string
    investment_amount: number
    image_url?: string
    image_status?: 'none' | 'pending' | 'approved' | 'rejected'
    created_at?: string
    updated_at?: string
    daily_views: number[]
    previous_sunday_view: number
    last_viewed_at?: string
    area_color?: string
}

interface InvestorStore {
    // 상태
    isLoading: boolean
    error: Error | null
    investors: Record<string, Investor>

    // 액션
    fetchInvestors: () => Promise<void>
    insertInvestor: (userId: string, selectedContinentId: string, investmentAmount: number, name: string) => Promise<void>
    updateInvestor: (investor: Partial<Investor>) => Promise<void>
    updateInvestorInvestmentAmount: (investor: Partial<Investor>, investmentAmount: number) => Promise<void>
    updateInvestorDailyViews: (id: string, dailyViews: number[]) => Promise<Investor>
    subscribeToInvestors: () => Promise<void>
    unsubscribeFromInvestors: () => void

    // 헬퍼 함수
    getFilteredInvestorListByContinent: (continentId: string) => Investor[]
    getTotalInvestmentByContinent: (continentId: string) => number
    getIsSharePercentageChangedByContinent: (prevInvestorList: Investor[], continentId: string) => boolean
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
                    area_color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                    name: name
                }
                console.log('➕ 새 투자자 추가 시작:', newInvestorInfo)
                const result = await investorsAPI.create(newInvestorInfo)

                if (!result) throw new Error('투자자 추가 후 데이터를 받지 못했습니다.')

                set(state => ({
                    investors: {
                        ...state.investors,
                        [result.id]: result
                    }
                }))
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

                set(state => ({
                    investors: {
                        ...state.investors,
                        [updatedInvestor.id]: { ...state.investors[updatedInvestor.id], ...updatedInvestor }
                    }
                }))
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

                // 상태 업데이트
                set(state => ({
                    investors: {
                        ...state.investors,
                        [updatedInvestor.id]: { ...state.investors[updatedInvestor.id], ...updatedInvestor }
                    }
                }))
                console.log('✅ 투자자 투자금액 업데이트 완료:', updatedInvestor.id)
                return updatedInvestor
            } catch (error) {
                console.error('❌ 투자자 투자금액 업데이트 실패:', error)
                throw error
            }
        },

        updateInvestorDailyViews: async (id: string, dailyViews: number[]) => {
            console.log('🔄 투자자 조회수 업데이트 시작:', id)
            try {
                const updatedInvestor = await investorsAPI.updateDailyViews(id, dailyViews)

                if (!updatedInvestor) throw new Error('투자자 조회수 업데이트 후 데이터를 받지 못했습니다.')

                set(state => ({
                    investors: {
                        ...state.investors,
                        [updatedInvestor.id]: { ...state.investors[updatedInvestor.id], ...updatedInvestor }
                    }
                }))
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

            investorsSubscription = supabase
                .channel('investors_changes')
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'investors'
                    },
                    async (payload) => {
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
                    }
                )
                .subscribe()

            console.log('✅ 실시간 구독 설정 완료')
        },

        // 구독 해제
        unsubscribeFromInvestors: () => {
            if (investorsSubscription) {
                investorsSubscription.unsubscribe()
                investorsSubscription = null
                console.log('🔄 투자자 실시간 구독 해제')
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

        getIsSharePercentageChangedByContinent: (prevInvestorList, continentId) => {
            const state = get();
            const newInvestorList = Object.values(state.investors);

            const getFilteredInvestorList = (investorList: Investor[], continentId: string) => {
                const filteredList = continentId !== "central"
                    ? investorList.filter((investor) => {
                        return investor.continent_id === continentId;
                    })
                    : Object.values(
                        investorList.reduce((vipList, investor) => {
                            const investorContinentId = investor.continent_id;

                            if (!vipList[investorContinentId] || investor.investment_amount > vipList[investorContinentId].investment_amount) {
                                vipList[investorContinentId] = investor
                            }

                            return vipList
                        }, { } as Record<string, Investor>)
                    )

                return [...filteredList].sort((a, b) => a.id.localeCompare(b.id));
            }
            const filteredPrevInvestorListByContinent = getFilteredInvestorList(prevInvestorList, continentId);
            const filteredNewInvestorListByContinent = getFilteredInvestorList(newInvestorList, continentId);

            if (!areContributorListsEqualById(filteredPrevInvestorListByContinent, filteredNewInvestorListByContinent)) {
                return true;
            }

            const prevTotalInvestAmount = filteredPrevInvestorListByContinent.reduce((acc, investor) => {
                return acc + investor.investment_amount;
            }, 0);
            const newTotalInvestAmount = filteredNewInvestorListByContinent.reduce((acc, investor) => {
                return acc + investor.investment_amount;
            }, 0);

            let isChanged = false;

            filteredPrevInvestorListByContinent.forEach((prevInvestor, index) => {
                const newInvestor = filteredNewInvestorListByContinent[index];
                const prevInvestorAmount = prevInvestor.investment_amount;
                const newInvestorAmount = newInvestor.investment_amount;

                const prevSharePercentage = prevInvestorAmount / prevTotalInvestAmount;
                const newSharePercentage = newInvestorAmount / newTotalInvestAmount;

                isChanged = prevSharePercentage !== newSharePercentage;

                if (isChanged) {
                    return;
                }
            })

            return isChanged;
        }
    }
})
