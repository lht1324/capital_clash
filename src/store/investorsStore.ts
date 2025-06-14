import { create } from 'zustand'
import type { Database } from '@/types/database'
import { supabase } from '@/lib/supabase/supabase'
import { investorsAPI } from '@/lib/supabase/supabase-investors-api'

export type Investor = {
    id: string
    user_id: string
    continent_id: string
    name?: string
    description?: string
    website_url?: string
    contact_email?: string
    investment_amount: number
    image_url?: string                  // image_url
    image_status?: 'none' | 'pending' | 'approved' | 'rejected'  // image_status
    created_at?: string
    updated_at?: string
    daily_views: number[]
    previous_sunday_view: number
    last_viewed_at?: string
    area_color?: string                    // area_color
}

interface InvestorStore {
    // 상태
    isLoading: boolean
    error: Error | null
    investors: Record<string, Investor>

    // 액션
    fetchInvestors: () => Promise<void>
    insertInvestor: (userId: string, selectedContinentId: string, investmentAmount: number) => Promise<void>
    updateInvestor: (investor: Partial<Investor>) => Promise<void>
    updateInvestorInvestmentAmount: (investor: Partial<Investor>, investmentAmount: number) => Promise<void>
    subscribeToInvestors: () => Promise<void>
    unsubscribeFromInvestors: () => void

    // 헬퍼 함수
    getInvestorsByContinent: (continentId: string) => Investor[]
    getTotalInvestmentByContinent: (continentId: string) => number
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


        /*
        const handlePurchase = async (continentId: ContinentId, amount: number) => {
            console.log(`🛒 프로필에서 영역 구매: ${continentId}, $${amount.toLocaleString()}`)

            // 새로운 투자자 생성
            const newInvestor = {
                user_id: user?.id,
                continent_id: continentId,
                investment_amount: amount,
                area_color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
            }

            try {
                // 🔥 Supabase에 투자자 추가
                await addInvestor(continentId, newInvestor)
                alert(`🎉 ${continentId} 대륙에 $${amount.toLocaleString()} 투자가 완료되었습니다!`)
            } catch (error) {
                console.error('투자 실패:', error)
                alert('❌ 투자에 실패했습니다. 다시 시도해주세요.')
            }
        }
         */
        // 새 투자자 추가
        insertInvestor: async (userId: string, continentId: string, investmentAmount: number) => {
            try {
                const newInvestorInfo = {
                    user_id: userId,
                    continent_id: continentId,
                    investment_amount: investmentAmount,
                    area_color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
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
        getInvestorsByContinent: (continentId) => {
            const state = get()
            const investorList = Object.values(state.investors)

            if (continentId !== "central") {
                return investorList
                    .filter(investor => investor.continent_id === continentId)
            } else {
                const temp = Object.values(
                    investorList.reduce((vipList, investor) => {
                        const investorContinentId = investor.continent_id;

                        if (!vipList[investorContinentId] || investor.investment_amount > vipList[investorContinentId].investment_amount) {
                            vipList[investorContinentId] = investor
                        }

                        return vipList
                    }, { } as Record<string, Investor>)
                )
                console.log("temp", temp)
                return temp;
            }
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
        }
    }
})
