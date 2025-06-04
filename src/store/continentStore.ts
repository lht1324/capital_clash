import { create } from 'zustand'

// 대륙 타입 정의
export type ContinentId = 'north' | 'east' | 'south' | 'west' | 'center'

export interface Continent {
  id: ContinentId
  name: string
  color: string
  themeColor: string
  description: string
  maxUsers: number
  currentUsers: number
  position: [number, number, number] // [x, y, z]
  cameraTarget: [number, number, number] // 카메라 타겟 위치
}

// 5개 대륙 정의 - 세계 지도 배치
export const CONTINENTS: Record<ContinentId, Continent> = {
  north: {
    id: 'north',
    name: '북방 대륙',
    color: '#3B82F6', // 파란색
    themeColor: '#EFF6FF',
    description: '차가운 북방의 전략가들',
    maxUsers: 50,
    currentUsers: 0,
    position: [0, 15, 0], // 북쪽 상단
    cameraTarget: [0, 15, 15]
  },
  east: {
    id: 'east',
    name: '동방 대륙',
    color: '#EF4444', // 빨간색
    themeColor: '#FEF2F2',
    description: '떠오르는 태양의 용사들',
    maxUsers: 50,
    currentUsers: 0,
    position: [15, 0, 0], // 동쪽 우측
    cameraTarget: [15, 0, 15]
  },
  south: {
    id: 'south',
    name: '남방 대륙',
    color: '#10B981', // 초록색
    themeColor: '#F0FDF4',
    description: '무성한 남방의 정복자들',
    maxUsers: 50,
    currentUsers: 0,
    position: [0, -15, 0], // 남쪽 하단
    cameraTarget: [0, -15, 15]
  },
  west: {
    id: 'west',
    name: '서방 대륙',
    color: '#F59E0B', // 주황색
    themeColor: '#FFFBEB',
    description: '석양의 제국 건설자들',
    maxUsers: 50,
    currentUsers: 0,
    position: [-15, 0, 0], // 서쪽 좌측
    cameraTarget: [-15, 0, 15]
  },
  center: {
    id: 'center',
    name: '중앙 대륙',
    color: '#8B5CF6', // 보라색
    themeColor: '#FAF5FF',
    description: '황제들의 VIP 영역',
    maxUsers: 20,
    currentUsers: 0,
    position: [0, 0, 0], // 정중앙
    cameraTarget: [0, 0, 17]
  }
}

// Store 상태 정의
export interface ContinentState {
  selectedContinent: ContinentId | null
  continents: Record<ContinentId, Continent>
  isLoading: boolean
  isWorldView: boolean
  cameraTarget: [number, number, number] | null // 카메라 이동 타겟
}

// Store 액션 정의
export interface ContinentActions {
  selectContinent: (continentId: ContinentId) => void
  setSelectedContinent: (continentId: ContinentId | null) => void
  updateContinentUsers: (continentId: ContinentId, userCount: number) => void
  setLoading: (loading: boolean) => void
  resetSelection: () => void
  setWorldView: (isWorldView: boolean) => void
  setCameraTarget: (target: [number, number, number] | null) => void
}

// Store 타입
export type ContinentStore = ContinentState & ContinentActions

// Store 생성
export const useContinentStore = create<ContinentStore>()((set) => ({
  // 초기 상태 - 세계 지도 뷰로 시작
  selectedContinent: null,
  continents: CONTINENTS,
  isLoading: false,
  isWorldView: true,
  cameraTarget: null,

  // 액션들
  selectContinent: (continentId: ContinentId) => {
    const continent = CONTINENTS[continentId]
    set({ 
      selectedContinent: continentId, 
      isWorldView: false,
      cameraTarget: continent.cameraTarget
    })
  },

  setSelectedContinent: (continentId: ContinentId | null) => 
    set({ selectedContinent: continentId }),

  updateContinentUsers: (continentId: ContinentId, userCount: number) =>
    set((state) => ({
      continents: {
        ...state.continents,
        [continentId]: {
          ...state.continents[continentId],
          currentUsers: userCount
        }
      }
    })),

  setLoading: (loading: boolean) => 
    set({ isLoading: loading }),

  resetSelection: () => 
    set({ 
      selectedContinent: null, 
      isWorldView: true,
      cameraTarget: [0, 0, 30]
    }),

  setWorldView: (isWorldView: boolean) => 
    set({ isWorldView }),

  setCameraTarget: (target: [number, number, number] | null) => 
    set({ cameraTarget: target })
})) 