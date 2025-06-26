import { create } from 'zustand'
import { continentsAPI } from '@/lib/supabase/supabase-continents-api'
import type { Database } from '@/types/database'
import { useInvestorStore } from './investorsStore'

type ContinentRow = Database['public']['Tables']['continents']['Row']

export type Continent = ContinentRow & {
    id: string,
    name: string,
    color: string,
    theme_color: string,
    description: string,
    current_users: number,
    max_users: string,
    position_x: number,
    position_y: number,
    position_z: number,
    camera_target_x: number,
    camera_target_y: number,
    camera_target_z: number,
    is_active: boolean,
    created_at: string,
    updated_at: string,
}

export type ContinentId = string

interface ContinentStore {
    // 상태
    isLoading: boolean
    error: Error | null
    continents: Record<ContinentId, Continent>

    // 액션
    fetchContinents: () => Promise<void>
    updateContinent: (id: ContinentId, updates: Partial<ContinentRow>) => Promise<void>

    updateContinentUsers: (id: ContinentId, count: number) => void
}

export const useContinentStore = create<ContinentStore>((set) => ({
    // 초기 상태
    isLoading: false,
    error: null,
    continents: {},

    // 대륙 정보 불러오기
    fetchContinents: async () => {
        set({ isLoading: true, error: null })
        console.log('🌍 대륙 정보 불러오기 시작')

        try {
            const data = await continentsAPI.getAll()
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
            const updatedContinent = await continentsAPI.update(id, updates)
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
    },
}))
