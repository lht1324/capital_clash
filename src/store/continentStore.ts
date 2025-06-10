import { create } from 'zustand'
import { continents } from '@/lib/supabase-api'
import type { Database } from '@/types/database'

type ContinentRow = Database['public']['Tables']['continents']['Row']

export type Investor = {
  id: string
  name: string
  investment: number
  color: string
  imageUrl?: string
  ratio?: number
  imageStatus?: 'none' | 'pending' | 'approved' | 'rejected'
  profileInfo?: {
    description: string
    website: string
    contact: string
  }
}

export type Continent = ContinentRow & {
  investors: Record<string, Investor>
}

export type ContinentId = string

interface ContinentStore {
  // 상태
  isLoading: boolean
  error: Error | null
  continents: Record<ContinentId, Continent>
  selectedContinent: ContinentId | null
  isWorldView: boolean
  cameraTarget: [number, number, number] | null
  
  // 액션
  fetchContinents: () => Promise<void>
  updateContinent: (id: ContinentId, updates: Partial<ContinentRow>) => Promise<void>
  setSelectedContinent: (id: ContinentId | null) => void
  setWorldView: (isWorld: boolean) => void
  setCameraTarget: (target: [number, number, number] | null) => void
  resetSelection: () => void
  updateContinentUsers: (id: ContinentId, count: number) => void
}

export const useContinentStore = create<ContinentStore>((set) => ({
  // 초기 상태
  isLoading: false,
  error: null,
  continents: {},
  selectedContinent: null,
  isWorldView: true,
  cameraTarget: null,
  
  // 대륙 정보 불러오기
  fetchContinents: async () => {
    set({ isLoading: true, error: null })
    console.log('🌍 대륙 정보 불러오기 시작')
    
    try {
      const data = await continents.getAll()
      console.log('📥 받은 대륙 데이터:', data)
      
      const continentsMap = data.reduce((acc, continent) => ({
        ...acc,
        [continent.id]: {
          ...continent,
          investors: {}  // 초기에는 빈 투자자 목록으로 시작
        }
      }), {} as Record<ContinentId, Continent>)
      
      set({ continents: continentsMap })
      console.log('✅ 대륙 정보 저장 완료:', continentsMap)
    } catch (error) {
      console.error('❌ 대륙 정보 불러오기 실패:', error)
      set({ error: error as Error })
    } finally {
      set({ isLoading: false })
    }
  },
  
  // 대륙 정보 업데이트
  updateContinent: async (id, updates) => {
    try {
      const updatedContinent = await continents.update(id, updates)
      set(state => ({
        continents: {
          ...state.continents,
          [id]: {
            ...state.continents[id],
            ...updatedContinent
          }
        }
      }))
    } catch (error) {
      console.error('❌ 대륙 정보 업데이트 실패:', error)
      throw error
    }
  },
  
  setSelectedContinent: (id) => {
    console.log('🎯 setSelectedContinent 호출됨:', id)
    set({ selectedContinent: id })
  },
  setWorldView: (isWorld) => {
    console.log('🌍 setWorldView 호출됨:', isWorld)
    set({ isWorldView: isWorld })
  },
  setCameraTarget: (target) => set({ cameraTarget: target }),
  resetSelection: () => set({ selectedContinent: null, isWorldView: true, cameraTarget: null }),
  
  updateContinentUsers: (id, count) => {
    set(state => ({
      continents: {
        ...state.continents,
        [id]: {
          ...state.continents[id],
          current_users: count
        }
      }
    }))
  }
}))