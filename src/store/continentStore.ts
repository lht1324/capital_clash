import { create } from 'zustand'
import { continentsAPI } from '@/lib/supabase/supabase-continents-api'
import type { Database } from '@/types/database'
import { useInvestorsStore } from './investorsStore'

type ContinentRow = Database['public']['Tables']['continents']['Row']

export type Investor = {
    id: string
    userId: string
    continentId: string
    name?: string
    title?: string
    investment_amount: number
    share_percentage: number
    image_url?: string
    image_status?: 'none' | 'pending' | 'approved' | 'rejected'
    ratio?: number

    area_color?: string
}

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

    // admin에만 남음
    investors: Record<string, Investor>
}

export type ContinentId = string

interface ContinentStore {
    // 상태
    isLoading: boolean
    error: Error | null
    continents: Record<ContinentId, Continent>
    selectedContinentId: ContinentId | null
    isWorldView: boolean
    cameraTarget: [number, number, number] | null
    isSidebarOpen: boolean

    // 액션
    fetchContinents: () => Promise<void>
    updateContinent: (id: ContinentId, updates: Partial<ContinentRow>) => Promise<void>
    setSelectedContinentId: (id: ContinentId | null) => void
    setWorldView: (isWorld: boolean) => void
    setCameraTarget: (target: [number, number, number] | null) => void
    resetSelection: () => void
    addInvestor: (continentId: ContinentId, investorData: any) => Promise<void>

    updateContinentUsers: (id: ContinentId, count: number) => void
    setSidebarOpen: (isOpen: boolean) => void
}

export const useContinentStore = create<ContinentStore>((set) => ({
    // 초기 상태
    isLoading: false,
    error: null,
    continents: {},
    selectedContinentId: null,
    isWorldView: true,
    cameraTarget: null,
    isSidebarOpen: false,

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

    setSelectedContinentId: (id) => {
        console.log('🎯 setSelectedContinentId 호출됨:', id)
        set({ selectedContinentId: id })
    },
    setWorldView: (isWorld) => {
        console.log('🌍 setWorldView 호출됨:', isWorld)
        set({ isWorldView: isWorld })
    },
    setCameraTarget: (target) => set({ cameraTarget: target }),
    resetSelection: () => set({ selectedContinentId: null, isWorldView: true, cameraTarget: null }),

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

    // 사이드바 상태 관리
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

    // 투자자 추가
    addInvestor: async (continentId, investorData) => {
        console.log('🔄 투자자 추가 시작:', continentId, investorData)
        try {
            // 기존 데이터 형식을 Supabase 형식으로 변환
            const { investment, imageStatus, profileInfo, ...rest } = investorData

            // useInvestorsStore의 addInvestor 메서드 호출
            await useInvestorsStore.getState().addInvestor({
                user_id: rest.userId || rest.user_id || '', // userId 또는 user_id 사용
                continent_id: continentId,
                name: rest.name || '',
                investment_amount: investment || 0,
                share_percentage: 0, // 초기값, 나중에 계산
                image_status: imageStatus || 'none',
                area_color: rest.area_color || '#FFFFFF',
            })

            console.log('✅ 투자자 추가 완료')
        } catch (error) {
            console.error('❌ 투자자 추가 실패:', error)
            throw error
        }
    }
}))
