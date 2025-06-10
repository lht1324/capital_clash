import { create } from 'zustand'
import type { Database } from '@/types/database'
import { supabase } from '@/lib/supabase'

export type Investor = {
  id: string
  name: string
  investment: number
  continent_id: string
  color: string
  imageUrl?: string
  imageStatus?: 'none' | 'pending' | 'approved' | 'rejected'
  profileInfo?: {
    description: string
    website: string
    contact: string
  }
}

interface InvestorsStore {
  // 상태
  isLoading: boolean
  error: Error | null
  investors: Record<string, Investor>
  
  // 액션
  fetchInvestors: () => Promise<void>
  addInvestor: (investor: Omit<Investor, 'id'>) => Promise<void>
  updateInvestor: (id: string, updates: Partial<Investor>) => Promise<void>
  subscribeToInvestors: () => Promise<void>
  unsubscribeFromInvestors: () => void
  
  // 헬퍼 함수
  getInvestorsByContinent: (continentId: string) => Investor[]
  getTotalInvestmentByContinent: (continentId: string) => number
}

export const useInvestorsStore = create<InvestorsStore>((set, get) => {
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
        const { data, error } = await supabase
          .from('investors')
          .select('*')
        
        if (error) throw error
        
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
    addInvestor: async (investor) => {
      console.log('➕ 새 투자자 추가 시작:', investor)
      try {
        const { data, error } = await supabase
          .from('investors')
          .insert([investor])
          .select()
        
        if (error) throw error
        if (!data || data.length === 0) throw new Error('투자자 추가 후 데이터를 받지 못했습니다.')
        
        const newInvestor = data[0]
        set(state => ({
          investors: {
            ...state.investors,
            [newInvestor.id]: newInvestor
          }
        }))
        console.log('✅ 새 투자자 추가 완료:', newInvestor.id)
      } catch (error) {
        console.error('❌ 투자자 추가 실패:', error)
        throw error
      }
    },
    
    // 투자자 정보 업데이트
    updateInvestor: async (id, updates) => {
      console.log('🔄 투자자 정보 업데이트 시작:', id, updates)
      try {
        const { data, error } = await supabase
          .from('investors')
          .update(updates)
          .eq('id', id)
          .select()
        
        if (error) throw error
        if (!data || data.length === 0) throw new Error('투자자 업데이트 후 데이터를 받지 못했습니다.')
        
        const updatedInvestor = data[0]
        set(state => ({
          investors: {
            ...state.investors,
            [id]: { ...state.investors[id], ...updatedInvestor }
          }
        }))
        console.log('✅ 투자자 정보 업데이트 완료:', id)
      } catch (error) {
        console.error('❌ 투자자 정보 업데이트 실패:', error)
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
      return Object.values(state.investors)
        .filter(investor => investor.continent_id === continentId)
    },
    
    // 특정 대륙의 총 투자금 계산
    getTotalInvestmentByContinent: (continentId) => {
      const state = get()
      return Object.values(state.investors)
        .filter(investor => investor.continent_id === continentId)
        .reduce((total, investor) => total + investor.investment, 0)
    }
  }
}) 