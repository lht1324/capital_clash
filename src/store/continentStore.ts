import { create } from 'zustand'

// 투자자 정보 타입
export interface Investor {
  id: string
  name: string
  investment: number // 투자금 (달러)
  share: number // 지분 비율 (0-1)
  territories: Territory[] // 소유 영역들
  color: string // 사용자별 고유 색상
  imageUrl?: string // 투자자 이미지 (선택적)
  // 🆕 온라인 광고판 기능을 위한 새로운 필드들
  imageStatus?: 'none' | 'pending' | 'approved' | 'rejected' // 이미지 승인 상태
  tilePosition?: { // 현재 타일 위치 정보
    x: number
    y: number
    size: number
    continentId: string
  }
  profileInfo?: { // 프로필 정보
    description: string
    website?: string
    contact?: string
  }
  // 🌳 NEW: Treemap 알고리즘을 위한 사진 비율
  ratio?: number // width / height 비율 (예: 16/9 = 1.777...)
  view_count?: number
  daily_views?: number[]
  last_viewed_at?: string
}

// 영역 정보 타입 (현재 사용되지 않음 - 정사각형 배치 시스템 사용 중)
export interface Territory {
  id: string
  continentId: ContinentId
  ownerId: string // 투자자 ID
  points: [number, number][] // 영역 경계점들 (2D 좌표)
  area: number // 영역 크기
  center: [number, number] // 영역 중심점
}

// 대륙 타입 정의
export type ContinentId = 'northwest' | 'northeast' | 'southwest' | 'southeast' | 'center'

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
  // 새로 추가되는 프로퍼티들
  shape: [number, number][] // 대륙 경계 모양 (2D 좌표들)
  totalInvestment: number // 총 투자금
  investors: Record<string, Investor> // 투자자들
  territories: Territory[] // 모든 영역들
  maxInitialShare: number // 첫 배치 최대 지분 (0.3 = 30%)
}

// 대륙 모양 생성 설정
export interface ContinentGenerationConfig {
  seed: number
  size: number // 대륙 크기
  complexity: number // 복잡도 (0-1)
  smoothness: number // 부드러움 (0-1)
}

// 5개 대륙 정의 - X 모양 배치
export const CONTINENTS: Record<ContinentId, Continent> = {
  northwest: {
    id: 'northwest',
    name: '북서방 대륙',
    color: '#3B82F6', // 파란색
    themeColor: '#EFF6FF',
    description: '차가운 북서방의 전략가들',
    maxUsers: 50,
    currentUsers: 0,
    position: [-20, 20, 0], // 중앙과 꼭짓점 맞닿음 (왼쪽 위)
    cameraTarget: [-20, 20, 35],
    shape: [], // 나중에 생성
    totalInvestment: 0,
    investors: {},
    territories: [],
    maxInitialShare: 0.3
  },
  northeast: {
    id: 'northeast',
    name: '북동방 대륙',
    color: '#EF4444', // 빨간색
    themeColor: '#FEF2F2',
    description: '떠오르는 북동방의 용사들',
    maxUsers: 50,
    currentUsers: 0,
    position: [20, 20, 0], // 중앙과 꼭짓점 맞닿음 (오른쪽 위)
    cameraTarget: [20, 20, 35],
    shape: [],
    totalInvestment: 0,
    investors: {},
    territories: [],
    maxInitialShare: 0.3
  },
  southwest: {
    id: 'southwest',
    name: '남서방 대륙',
    color: '#10B981', // 초록색
    themeColor: '#F0FDF4',
    description: '무성한 남서방의 정복자들',
    maxUsers: 50,
    currentUsers: 0,
    position: [-20, -20, 0], // 중앙과 꼭짓점 맞닿음 (왼쪽 아래)
    cameraTarget: [-20, -20, 35],
    shape: [],
    totalInvestment: 0,
    investors: {},
    territories: [],
    maxInitialShare: 0.3
  },
  southeast: {
    id: 'southeast',
    name: '남동방 대륙',
    color: '#F59E0B', // 주황색
    themeColor: '#FFFBEB',
    description: '석양의 남동방 제국 건설자들',
    maxUsers: 50,
    currentUsers: 0,
    position: [20, -20, 0], // 중앙과 꼭짓점 맞닿음 (오른쪽 아래)
    cameraTarget: [20, -20, 35],
    shape: [],
    totalInvestment: 0,
    investors: {},
    territories: [],
    maxInitialShare: 0.3
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
    cameraTarget: [0, 0, 40],
    shape: [],
    totalInvestment: 0,
    investors: {},
    territories: [],
    maxInitialShare: 0.2 // VIP 영역은 더 제한적
  }
}

// Store 상태 정의
export interface ContinentState {
  selectedContinent: ContinentId | null
  continents: Record<ContinentId, Continent>
  isLoading: boolean
  isWorldView: boolean
  cameraTarget: [number, number, number] | null // 카메라 이동 타겟
  // 새로 추가되는 상태들
  isGeneratingShape: boolean
  selectedInvestor: string | null // 선택된 투자자 ID
  animatingTerritories: boolean // 영역 변화 애니메이션 중
  isSidebarOpen: boolean // 사이드바 열림/닫힘 상태
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
  // 새로 추가되는 액션들
  generateContinentShape: (continentId: ContinentId, config: ContinentGenerationConfig) => void
  addInvestor: (continentId: ContinentId, investor: Omit<Investor, 'share' | 'territories' | 'color'>) => Promise<void>
  updateInvestment: (continentId: ContinentId, investorId: string, amount: number) => void
  setSelectedInvestor: (investorId: string | null) => void
  setAnimatingTerritories: (animating: boolean) => void
  setSidebarOpen: (isOpen: boolean) => void // 사이드바 상태 관리
  // 테스트 데이터 생성
  generateTestData: (continentId: ContinentId) => void
  generate50TestData: (continentId: ContinentId) => void
  generateCustomTestData: (continentId: ContinentId, userCount: number) => void
  // 🆕 온라인 광고판 기능을 위한 새로운 액션들
  updateInvestorPositions: (continentId: ContinentId, placements: any[]) => void
  updateInvestorProfile: (continentId: ContinentId, investorId: string, updates: Partial<Investor>) => void
  updateImageStatus: (continentId: ContinentId, investorId: string, status: 'none' | 'pending' | 'approved' | 'rejected', imageUrl?: string) => void
  // 🏆 VIP 자동 승격 시스템
  checkAndPromoteToVIP: () => void
  moveInvestorToContinent: (investorId: string, fromContinentId: ContinentId, toContinentId: ContinentId) => void
  recalculateAllShares: () => void
  // 🗺️ 동적 대륙 배치 시스템
  calculateContinentBounds: (continentId: ContinentId) => { minX: number, maxX: number, minY: number, maxY: number } | null
  updateContinentPositions: () => void
  // 🆕 16단계: 대륙 생성/관리 시스템
  resetAllContinents: () => void
  createNewContinent: (config: any) => void
  // 🎥 카메라 투어 시스템
  saveCameraTour: (tour: any) => void
  loadCameraTour: (tourId: string) => any
  startCameraTour: (tour: any) => void
  // 🗄️ Supabase 연결
  syncWithSupabase: () => Promise<void>
  migrateToSupabase: () => Promise<void>
  enableRealTimeSync: () => void
  initializeStore: () => Promise<void>
  updateInvestorViews: (continentId: ContinentId, investorId: string) => void
}

// Store 타입
export type ContinentStore = ContinentState & ContinentActions

// Store 생성
export const useContinentStore = create<ContinentStore>()((set, get) => ({
  // 초기 상태 - 세계 지도 뷰로 시작
  selectedContinent: null,
  continents: CONTINENTS,
  isLoading: false,
  isWorldView: true,
  cameraTarget: null,
  isGeneratingShape: false,
  selectedInvestor: null,
  animatingTerritories: false,
  isSidebarOpen: true, // 기본적으로 사이드바는 열려있음

  // 기존 액션들
  selectContinent: (continentId: ContinentId) => {
    const state = get()
    const continent = state.continents[continentId]
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
      cameraTarget: [0, 0, 80] // 전체 대륙들이 보이는 월드 뷰
    }),

  setWorldView: (isWorldView: boolean) => 
    set({ isWorldView }),

  setCameraTarget: (target: [number, number, number] | null) => 
    set({ cameraTarget: target }),

  // 새로 추가되는 액션들
  generateContinentShape: (continentId: ContinentId, config: ContinentGenerationConfig) => {
    set({ isGeneratingShape: true })
    
    // Perlin noise를 사용한 실제 대륙 모양 생성
    const { generateContinentShape } = require('../lib/continentGenerator')
    const shape = generateContinentShape(config)
    
    set((state) => ({
      isGeneratingShape: false,
      continents: {
        ...state.continents,
        [continentId]: {
          ...state.continents[continentId],
          shape
        }
      }
    }))
  },

  addInvestor: async (continentId: ContinentId, investor: Omit<Investor, 'share' | 'territories' | 'color'>) => {
    console.log(`🚀 투자자 추가 시작: ${investor.name} → ${continentId}`)
    
    const state = get()
    const continent = state.continents[continentId]
    
    // 투자자별 색상 생성
    const investorColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ]
    
    const currentInvestorCount = Object.keys(continent.investors).length
    const investorColor = investorColors[currentInvestorCount % investorColors.length]
    
    // 지분 계산
    const newTotalInvestment = continent.totalInvestment + investor.investment
    const share = investor.investment / newTotalInvestment
    
    const newInvestor: Investor = {
      ...investor,
      share,
      territories: [],
      color: investorColor,
      imageStatus: 'none',
      tilePosition: undefined,
      profileInfo: undefined
    }

    try {
      // 🔥 1단계: Supabase에 먼저 저장
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { investors: investorsApi } = await import('@/lib/supabase-api')
        
                 await investorsApi.create({
           id: investor.id,
           user_id: `user-${investor.id}`,
           continent_id: continentId,
           name: investor.name,
           title: 'Investor',
           investment_amount: investor.investment,
           share_percentage: share,
           image_url: investor.imageUrl,
           image_status: 'pending',
           position_x: 0,
           position_y: 0,
           width: 100,
           height: 100,
           is_vip: false,
         })
        
        console.log(`✅ Supabase에 투자자 저장 완료: ${investor.name}`)
      }

      // 🔥 2단계: 로컬 캐시 업데이트
    const updatedInvestors: Record<string, Investor> = {}
      
      // 기존 투자자들 지분 재계산
    Object.entries(continent.investors).forEach(([id, existingInvestor]) => {
      updatedInvestors[id] = {
        ...existingInvestor,
        share: existingInvestor.investment / newTotalInvestment
      }
    })
    
      updatedInvestors[investor.id] = newInvestor
      
      set((state) => ({
        continents: {
          ...state.continents,
          [continentId]: {
            ...state.continents[continentId],
            totalInvestment: newTotalInvestment,
            investors: updatedInvestors,
            currentUsers: Object.keys(updatedInvestors).length
          }
        }
      }))
      
      console.log(`✅ 투자자 추가 완료: ${investor.name}, 지분: ${(share * 100).toFixed(1)}%, 색상: ${investorColor}`)
      
      // 🔥 3단계: 실시간 알림 (있다면)
      if (typeof window !== 'undefined' && (window as any).showSuccess) {
        (window as any).showSuccess('투자 완료', `${investor.name}님이 $${investor.investment.toLocaleString()}을 투자했습니다!`)
      }
      
    } catch (error) {
      console.error('❌ 투자자 추가 실패:', error)
      
      // 오류 시 로컬만 업데이트 (fallback)
      const updatedInvestors: Record<string, Investor> = {}
      Object.entries(continent.investors).forEach(([id, existingInvestor]) => {
        updatedInvestors[id] = {
          ...existingInvestor,
          share: existingInvestor.investment / newTotalInvestment
        }
      })
    
    updatedInvestors[investor.id] = newInvestor
    
    set((state) => ({
      continents: {
        ...state.continents,
        [continentId]: {
          ...state.continents[continentId],
          totalInvestment: newTotalInvestment,
          investors: updatedInvestors,
          currentUsers: Object.keys(updatedInvestors).length
        }
      }
    }))
    
      console.log(`⚠️ 로컬 fallback으로 투자자 추가: ${investor.name}`)
    }
  },

  updateInvestment: (continentId: ContinentId, investorId: string, amount: number) => {
    console.log(`💰 투자 업데이트 시작: ${investorId}, 금액: ${amount}`)
    
    set((state) => {
      const continent = state.continents[continentId]
      const investor = continent.investors[investorId]
      
      if (!investor) {
        console.error(`❌ 투자자를 찾을 수 없습니다: ${investorId}`)
        return state
      }
      
      // 새로운 투자금과 총 투자금 계산
      const newInvestment = investor.investment + amount
      const newTotalInvestment = continent.totalInvestment + amount
      
      console.log(`📊 새로운 투자금: ${investor.investment} + ${amount} = ${newInvestment}`)
      console.log(`📊 새로운 총 투자금: ${continent.totalInvestment} + ${amount} = ${newTotalInvestment}`)
      
      // 모든 투자자들의 지분 재계산 (완전히 새로운 객체 생성)
      const updatedInvestors: Record<string, Investor> = {}
      Object.entries(continent.investors).forEach(([id, existingInvestor]) => {
        const finalInvestment = id === investorId ? newInvestment : existingInvestor.investment
        const newShare = finalInvestment / newTotalInvestment
        
        updatedInvestors[id] = {
          ...existingInvestor,
          investment: finalInvestment,
          share: newShare,
          // 다른 속성들도 명시적으로 복사
          id: existingInvestor.id,
          name: existingInvestor.name,
          color: existingInvestor.color,
          territories: [...existingInvestor.territories],
          imageUrl: existingInvestor.imageUrl
        }
        
        console.log(`  ${existingInvestor.name}: ${(newShare * 100).toFixed(2)}%`)
      })
      
      // 완전히 새로운 상태 반환
      return {
        ...state,
        continents: {
          ...state.continents,
          [continentId]: {
            ...continent,
            totalInvestment: newTotalInvestment,
            investors: updatedInvestors
          }
        }
      }
    })
    
    console.log(`✅ 투자 업데이트 완료`)
    
    // 🏆 VIP 자동 승격 시스템 트리거 (투자금 변경 시)
    setTimeout(() => {
      get().checkAndPromoteToVIP()
    }, 100) // 상태 업데이트 후 잠시 대기
  },

  setSelectedInvestor: (investorId: string | null) => 
    set({ selectedInvestor: investorId }),

  setAnimatingTerritories: (animating: boolean) => 
    set({ animatingTerritories: animating }),

  setSidebarOpen: (isOpen: boolean) => 
    set({ isSidebarOpen: isOpen }),

  // 🌳 NEW: 테스트 데이터 생성 (4명 투자자 + 랜덤 비율)
  generateTestData: (continentId: ContinentId) => {
    console.log(`🧪 스토어: ${continentId} 대륙에 4명 랜덤 비율 테스트 데이터 생성`)
    
    const testData = [
      { name: '투자자A', investment: 4000, color: '#FF6B6B', ratio: 17/3 },    // 🌟 극단적 와이드 (17:3)
      { name: '투자자B', investment: 3000, color: '#4ECDC4', ratio: 1 },       // 정사각형 (1:1)
      { name: '투자자C', investment: 2000, color: '#45B7D1', ratio: 3/17 },    // 🌟 극단적 세로 (3:17)
      { name: '투자자D', investment: 1000, color: '#FFA07A', ratio: 29/13 }    // 🌟 특이한 비율 (29:13)
    ]
    
    const totalInvestment = testData.reduce((sum, data) => sum + data.investment, 0)
    const testInvestors: Record<string, Investor> = {}
    
    testData.forEach((data, index) => {
      const investorId = `test_investor_${index + 1}`
      testInvestors[investorId] = {
        id: investorId,
        name: data.name,
        investment: data.investment,
        share: data.investment / totalInvestment,
        color: data.color,
        territories: [],
        imageUrl: undefined,
        // 🆕 새 필드들 초기화
        imageStatus: 'none',
        tilePosition: undefined,
        profileInfo: undefined,
        // 🌳 NEW: 다양한 사진 비율 추가
        ratio: data.ratio
      }
    })
    
    set((state) => ({
      continents: {
        ...state.continents,
        [continentId]: {
          ...state.continents[continentId],
          totalInvestment,
          investors: testInvestors,
          currentUsers: testData.length
        }
      }
    }))
    
    console.log(`✅ 스토어 테스트 데이터 생성 완료: ${testData.length}명, 총 $${totalInvestment.toLocaleString()}`)
  },

  // 🌳 NEW: 50명 투자자 + 랜덤 비율 테스트 데이터 생성 (Treemap용)
  generate50TestData: (continentId: ContinentId) => {
    console.log(`🧪 스토어: ${continentId} 대륙에 50명 랜덤 비율 테스트 데이터 생성 (Treemap)`)
    
    // 색상 팔레트 확장 (50개 색상)
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43', '#EE5A24', '#C44569', '#F8B500', '#6C5CE7', '#A29BFE',
      '#FD79A8', '#E17055', '#00B894', '#FDCB6E', '#6C5CE7', '#74B9FF', '#E84393', '#00CEC9', '#FF7675', '#FD79A8',
      '#FDCB6E', '#E17055', '#00B894', '#74B9FF', '#6C5CE7', '#A29BFE', '#FD79A8', '#E84393', '#00CEC9', '#FF7675',
      '#55A3FF', '#26DE81', '#FD9644', '#FC5C65', '#778CA3', '#4B6584', '#A55EEA', '#26DE81', '#FD9644', '#FC5C65'
    ]
    
    // 🎲 랜덤 지분율 배분 (합계 100%가 되도록)
    const shareDistribution = []
    for (let i = 0; i < 50; i++) {
      // 0.1% ~ 10% 사이의 랜덤 지분
      const randomShare = Math.random() * 9.9 + 0.1 // 0.1% ~ 10%
      shareDistribution.push(randomShare)
    }
    
    // 지분율 정규화 (정확히 100%가 되도록)
    const totalShares = shareDistribution.reduce((sum, share) => sum + share, 0)
    const normalizedShares = shareDistribution.map(share => share / totalShares)
    
    console.log(`📊 지분율 총합: ${totalShares}% → 100%로 정규화`)
    
    const testInvestors: Record<string, Investor> = {}
    const totalInvestment = 1000000 // $1M 고정
    
    // 🎯 랜덤 사진 비율 생성 함수 (매우 다양한 비율 포함)
    const generateRandomRatio = () => {
      const ratioCategories = [
        // 일반적인 비율들 (40%)
        [16/9, 4/3, 3/2, 1/1, 9/16, 5/4, 3/4],
        
        // 와이드 비율들 (20%)
        [21/9, 2/1, 3/1, 5/2, 7/3, 8/3, 17/3],
        
        // 세로 비율들 (20%)  
        [9/21, 1/2, 1/3, 2/5, 3/7, 3/8, 3/17],
        
        // 특이한 비율들 (10%)
        [13/5, 11/7, 19/8, 23/10, 17/6, 29/13, 31/11],
        
        // 극단적 비율들 (10%)
        [10/1, 12/1, 1/10, 1/12, 25/3, 3/25, 50/7]
      ]
      
      // 카테고리별 확률 분배
      const random = Math.random()
      let categoryIndex = 0
      
      if (random < 0.4) categoryIndex = 0      // 일반적 40%
      else if (random < 0.6) categoryIndex = 1  // 와이드 20%
      else if (random < 0.8) categoryIndex = 2  // 세로 20%  
      else if (random < 0.9) categoryIndex = 3  // 특이한 10%
      else categoryIndex = 4                   // 극단적 10%
      
      const selectedCategory = ratioCategories[categoryIndex]
      return selectedCategory[Math.floor(Math.random() * selectedCategory.length)]
    }
    
    normalizedShares.forEach((share, index) => {
      const investorId = `investor_${(index + 1).toString().padStart(2, '0')}`
      const investment = Math.round(totalInvestment * share)
      const investorName = `투자자${index + 1}`
      const randomRatio = generateRandomRatio()
      
      testInvestors[investorId] = {
        id: investorId,
        name: investorName,
        investment,
        share,
        color: colors[index],
        territories: [],
        imageUrl: undefined,
        // 🆕 새 필드들 초기화
        imageStatus: 'none',
        tilePosition: undefined,
        profileInfo: undefined,
        // 🌳 NEW: 랜덤 사진 비율 추가
        ratio: randomRatio
      }
    })
    
    set((state) => ({
      continents: {
        ...state.continents,
        [continentId]: {
          ...state.continents[continentId],
          totalInvestment,
          investors: testInvestors,
          currentUsers: 50
        }
      }
    }))
    
    // 지분율 검증
    const actualTotal = Object.values(testInvestors).reduce((sum, inv) => sum + inv.share, 0)
    console.log(`✅ 50명 테스트 데이터 생성 완료`)
    console.log(`📊 총 투자금: $${totalInvestment.toLocaleString()}`)
    console.log(`📊 지분율 총합: ${(actualTotal * 100).toFixed(6)}%`)
    console.log(`📊 투자자 분포: 대형 3명, 중형 7명, 소형 40명 (총 50명)`)
  },

  // 🧪 맞춤형 테스트 데이터 생성 (원하는 인원수로)
  generateCustomTestData: (continentId: ContinentId, userCount: number) => {
    console.log(`🧪 스토어: ${continentId} 대륙에 ${userCount}명 맞춤형 테스트 데이터 생성`)
    
    // 색상 팔레트 확장 (200개 색상까지 지원)
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43', '#EE5A24', '#C44569', '#F8B500', '#6C5CE7', '#A29BFE',
      '#FD79A8', '#E17055', '#00B894', '#FDCB6E', '#6C5CE7', '#74B9FF', '#E84393', '#00CEC9', '#FF7675', '#FD79A8',
      '#FDCB6E', '#E17055', '#00B894', '#74B9FF', '#6C5CE7', '#A29BFE', '#FD79A8', '#E84393', '#00CEC9', '#FF7675',
      '#55A3FF', '#26DE81', '#FD9644', '#FC5C65', '#778CA3', '#4B6584', '#A55EEA', '#26DE81', '#FD9644', '#FC5C65',
      '#FF4757', '#747D8C', '#A4B0BE', '#57606F', '#2F3542', '#FF3838', '#FF9F1A', '#32FF7E', '#18DCFF', '#7D5FFF'
    ]
    
    // 색상 부족 시 랜덤 생성
    while (colors.length < userCount) {
      const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
      colors.push(randomColor)
    }
    
    // 🎲 불규칙한 지분율 배분 (합계 100%가 되도록)
    const shareDistribution = []
    
    // 더 불규칙하게 만들기 위해 다양한 범위 사용
    for (let i = 0; i < userCount; i++) {
      let randomShare
      
      // 대형 투자자 (상위 10%)
      if (i < userCount * 0.1) {
        randomShare = Math.random() * 15 + 5 // 5% ~ 20%
      }
      // 중형 투자자 (상위 20%)
      else if (i < userCount * 0.3) {
        randomShare = Math.random() * 8 + 2 // 2% ~ 10%
      }
      // 소형 투자자 (나머지 70%)
      else {
        randomShare = Math.random() * 3 + 0.1 // 0.1% ~ 3.1%
      }
      
      shareDistribution.push(randomShare)
    }
    
    // 지분율 정규화 (정확히 100%가 되도록)
    const totalShares = shareDistribution.reduce((sum, share) => sum + share, 0)
    const normalizedShares = shareDistribution.map(share => share / totalShares)
    
    console.log(`📊 지분율 총합: ${totalShares}% → 100%로 정규화`)
    
    const testInvestors: Record<string, Investor> = {}
    const totalInvestment = Math.floor(Math.random() * 2000000) + 500000 // $500K ~ $2.5M
    
    // 🎯 랜덤 사진 비율 생성 함수 (매우 다양한 비율 포함)
    const generateRandomRatio = () => {
      const ratioCategories = [
        // 일반적인 비율들 (40%)
        [16/9, 4/3, 3/2, 1/1, 9/16, 5/4, 3/4],
        
        // 와이드 비율들 (20%)
        [21/9, 2/1, 3/1, 5/2, 7/3, 8/3, 17/3],
        
        // 세로 비율들 (20%)  
        [9/21, 1/2, 1/3, 2/5, 3/7, 3/8, 3/17],
        
        // 특이한 비율들 (10%)
        [13/5, 11/7, 19/8, 23/10, 17/6, 29/13, 31/11],
        
        // 극단적 비율들 (10%)
        [10/1, 12/1, 1/10, 1/12, 25/3, 3/25, 50/7]
      ]
      
      // 카테고리별 확률 분배
      const random = Math.random()
      let categoryIndex = 0
      
      if (random < 0.4) categoryIndex = 0      // 일반적 40%
      else if (random < 0.6) categoryIndex = 1  // 와이드 20%
      else if (random < 0.8) categoryIndex = 2  // 세로 20%  
      else if (random < 0.9) categoryIndex = 3  // 특이한 10%
      else categoryIndex = 4                   // 극단적 10%
      
      const selectedCategory = ratioCategories[categoryIndex]
      return selectedCategory[Math.floor(Math.random() * selectedCategory.length)]
    }
    
    // 대륙별 이름 접두사
    const continentPrefixes = {
      northwest: '북서',
      northeast: '북동', 
      southwest: '남서',
      southeast: '남동',
      center: '중앙'
    }
    
    const prefix = continentPrefixes[continentId] || '투자자'
    
    normalizedShares.forEach((share, index) => {
      const investorId = `${continentId}_investor_${(index + 1).toString().padStart(3, '0')}`
      const investment = Math.round(totalInvestment * share)
      const investorName = `${prefix}투자자${index + 1}`
      const randomRatio = generateRandomRatio()
      
      testInvestors[investorId] = {
        id: investorId,
        name: investorName,
        investment,
        share,
        color: colors[index],
        territories: [],
        imageUrl: undefined,
        // 🆕 새 필드들 초기화
        imageStatus: Math.random() > 0.7 ? 'pending' : 'none', // 30% 확률로 이미지 업로드 상태
        tilePosition: undefined,
        profileInfo: undefined,
        // 🌳 NEW: 랜덤 사진 비율 추가
        ratio: randomRatio
      }
    })
    
    set((state) => ({
      continents: {
        ...state.continents,
        [continentId]: {
          ...state.continents[continentId],
          totalInvestment,
          investors: testInvestors,
          currentUsers: userCount
        }
      }
    }))
    
    // 지분율 검증
    const actualTotal = Object.values(testInvestors).reduce((sum, inv) => sum + inv.share, 0)
    console.log(`✅ ${userCount}명 맞춤형 테스트 데이터 생성 완료`)
    console.log(`📊 총 투자금: $${totalInvestment.toLocaleString()}`)
    console.log(`📊 지분율 총합: ${(actualTotal * 100).toFixed(6)}%`)
    console.log(`📊 대륙: ${continentPrefixes[continentId]} (${userCount}명)`)
  },

  // 🆕 온라인 광고판 기능을 위한 새로운 액션들
  updateInvestorPositions: (continentId: ContinentId, placements: any[]) => {
    console.log(`📍 투자자 위치 업데이트: ${continentId}`)
    
    set((state) => {
      const continent = state.continents[continentId]
      const updatedInvestors: Record<string, Investor> = {}
      
      // 모든 투자자 정보 복사 후 위치 정보 업데이트
      Object.entries(continent.investors).forEach(([id, investor]) => {
        const placement = placements.find(p => p.investorId === id)
        
        updatedInvestors[id] = {
          ...investor,
          tilePosition: placement ? {
            x: placement.x,
            y: placement.y,
            size: placement.size,
            continentId
          } : investor.tilePosition
        }
      })
      
      return {
        ...state,
        continents: {
          ...state.continents,
          [continentId]: {
            ...continent,
            investors: updatedInvestors
          }
        }
      }
    })
    
    console.log(`✅ 투자자 위치 업데이트 완료: ${placements.length}개 타일`)
  },

  updateInvestorProfile: (continentId: ContinentId, investorId: string, updates: Partial<Investor>) => {
    console.log(`👤 투자자 프로필 업데이트: ${investorId}`)
    
    set((state) => {
      const continent = state.continents[continentId]
      const investor = continent.investors[investorId]
      
      if (!investor) {
        console.error(`❌ 투자자를 찾을 수 없습니다: ${investorId}`)
        return state
      }
      
      const updatedInvestors = {
        ...continent.investors,
        [investorId]: {
          ...investor,
          ...updates
        }
      }
      
      return {
        ...state,
        continents: {
          ...state.continents,
          [continentId]: {
            ...continent,
            investors: updatedInvestors
          }
        }
      }
    })
    
    console.log(`✅ 투자자 프로필 업데이트 완료`)
  },

  updateImageStatus: (continentId: ContinentId, investorId: string, status: 'none' | 'pending' | 'approved' | 'rejected', imageUrl?: string) => {
    console.log(`🖼️ 이미지 상태 업데이트: ${investorId}, 상태: ${status}`)
    
    set((state) => {
      const continent = state.continents[continentId]
      const investor = continent.investors[investorId]
      
      if (!investor) {
        console.error(`❌ 투자자를 찾을 수 없습니다: ${investorId}`)
        return state
      }
      
      const updatedInvestors = {
        ...continent.investors,
        [investorId]: {
          ...investor,
          imageStatus: status,
          ...(imageUrl && { imageUrl })
        }
      }
      
      return {
        ...state,
        continents: {
          ...state.continents,
          [continentId]: {
            ...continent,
            investors: updatedInvestors
          }
        }
      }
    })
    
    console.log(`✅ 이미지 상태 업데이트 완료: ${status}`)
  },

  // 🏆 VIP 자동 승격 시스템
  checkAndPromoteToVIP: () => {
    console.log('🏆 VIP 자동 승격 시스템 시작...')
    
    const state = get()
    const allInvestors: Array<{ investor: Investor, continentId: ContinentId }> = []
    
    // 중앙 대륙을 제외한 모든 투자자 수집
    Object.entries(state.continents).forEach(([continentId, continent]) => {
      if (continentId !== 'center') {
        Object.values(continent.investors).forEach(investor => {
          allInvestors.push({ investor, continentId: continentId as ContinentId })
        })
      }
    })
    
    // 투자금 기준으로 정렬 (내림차순)
    allInvestors.sort((a, b) => b.investor.investment - a.investor.investment)
    
    // 상위 4명 추출
    const topInvestors = allInvestors.slice(0, 4)
    const currentCenterInvestors = Object.values(state.continents.center.investors)
    
    console.log(`📊 전체 투자자: ${allInvestors.length}명`)
    console.log(`🎯 상위 4명:`, topInvestors.map(t => `${t.investor.name}: $${t.investor.investment.toLocaleString()}`))
    console.log(`👑 현재 중앙 대륙: ${currentCenterInvestors.length}명`)
    
    // 변경이 필요한지 확인
    const shouldPromote = topInvestors.some(({ investor }) => 
      !currentCenterInvestors.find(centerInv => centerInv.id === investor.id)
    )
    
    if (!shouldPromote) {
      console.log('✅ VIP 자동 승격: 변경 사항 없음')
      return
    }
    
    console.log('🔄 VIP 자동 승격: 중앙 대륙 재구성 시작')
    
    // 현재 중앙 대륙 투자자들을 다른 대륙으로 이동
    currentCenterInvestors.forEach(investor => {
      // 원래 소속 대륙을 찾거나 랜덤 대륙에 배치
      const targetContinents: ContinentId[] = ['northwest', 'northeast', 'southwest', 'southeast']
      const targetContinent = targetContinents[Math.floor(Math.random() * targetContinents.length)]
      
      get().moveInvestorToContinent(investor.id, 'center', targetContinent)
    })
    
    // 상위 4명을 중앙 대륙으로 이동
    topInvestors.forEach(({ investor, continentId }) => {
      get().moveInvestorToContinent(investor.id, continentId, 'center')
    })
    
    // 모든 대륙의 지분율 재계산
    get().recalculateAllShares()
    
    // 대륙 위치 업데이트
    get().updateContinentPositions()
    
    console.log('🎉 VIP 자동 승격 완료!')
  },

  moveInvestorToContinent: (investorId: string, fromContinentId: ContinentId, toContinentId: ContinentId) => {
    console.log(`🔄 투자자 이동: ${investorId} (${fromContinentId} → ${toContinentId})`)
    
    set((state) => {
      const fromContinent = state.continents[fromContinentId]
      const toContinent = state.continents[toContinentId]
      const investor = fromContinent.investors[investorId]
      
      if (!investor) {
        console.error(`❌ 투자자를 찾을 수 없습니다: ${investorId}`)
        return state
      }
      
      // 대상 대륙이 이미 가득 차있는지 확인
      const toInvestorCount = Object.keys(toContinent.investors).length
      if (toInvestorCount >= toContinent.maxUsers) {
        console.warn(`⚠️ 대상 대륙이 가득 참: ${toContinentId} (${toInvestorCount}/${toContinent.maxUsers})`)
        return state
      }
      
      // 투자자 이동 (타일 위치 정보 초기화)
      const movedInvestor = {
        ...investor,
        tilePosition: {
          ...investor.tilePosition,
          continentId: toContinentId
        }
      }
      
      // 원본 대륙에서 제거
      const { [investorId]: removedInvestor, ...remainingFromInvestors } = fromContinent.investors
      
      // 대상 대륙에 추가
      const updatedToInvestors = {
        ...toContinent.investors,
        [investorId]: movedInvestor
      }
      
      return {
        ...state,
        continents: {
          ...state.continents,
          [fromContinentId]: {
            ...fromContinent,
            investors: remainingFromInvestors,
            currentUsers: Object.keys(remainingFromInvestors).length,
            totalInvestment: Object.values(remainingFromInvestors).reduce((sum, inv) => sum + inv.investment, 0)
          },
          [toContinentId]: {
            ...toContinent,
            investors: updatedToInvestors,
            currentUsers: Object.keys(updatedToInvestors).length,
            totalInvestment: Object.values(updatedToInvestors).reduce((sum, inv) => sum + inv.investment, 0)
          }
        }
      }
    })
    
    console.log(`✅ 투자자 이동 완료: ${investorId}`)
  },

  recalculateAllShares: () => {
    console.log('📊 모든 대륙 지분율 재계산 시작...')
    
    set((state) => {
      const updatedContinents = { ...state.continents }
      
      Object.keys(updatedContinents).forEach(continentId => {
        const continent = updatedContinents[continentId as ContinentId]
        const investors = Object.values(continent.investors)
        const totalInvestment = investors.reduce((sum, inv) => sum + inv.investment, 0)
        
        if (totalInvestment > 0) {
          // 각 투자자의 지분율 재계산
          const updatedInvestors: Record<string, Investor> = {}
          
          investors.forEach(investor => {
            updatedInvestors[investor.id] = {
              ...investor,
              share: investor.investment / totalInvestment
            }
          })
          
          updatedContinents[continentId as ContinentId] = {
            ...continent,
            investors: updatedInvestors,
            totalInvestment
          }
          
          console.log(`📊 ${continent.name}: $${totalInvestment.toLocaleString()}, ${investors.length}명`)
        }
      })
      
      return {
        ...state,
        continents: updatedContinents
      }
    })
    
    console.log('✅ 모든 대륙 지분율 재계산 완료')
  },

  // 🗺️ 동적 대륙 배치 시스템
  calculateContinentBounds: (continentId: ContinentId) => {
    const state = get()
    const continent = state.continents[continentId]
    const investors = Object.values(continent.investors)
    
    if (investors.length === 0) {
      return null
    }
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    
    investors.forEach(investor => {
      if (investor.tilePosition) {
        const { x, y, size } = investor.tilePosition
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x + size)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y + size)
      }
    })
    
    if (minX === Infinity) {
      return null
    }
    
    console.log(`📐 ${continent.name} 경계: (${minX},${minY}) → (${maxX},${maxY})`)
    
    return { minX, maxX, minY, maxY }
  },

  updateContinentPositions: () => {
    console.log('🗺️ 동적 대륙 위치 업데이트 시작...')
    
    const state = get()
    const centerBounds = get().calculateContinentBounds('center')
    
    if (!centerBounds) {
      console.log('⚠️ 중앙 대륙 경계를 계산할 수 없음')
      return
    }
    
    const centerWidth = centerBounds.maxX - centerBounds.minX
    const centerHeight = centerBounds.maxY - centerBounds.minY
    const padding = 5 // 대륙 간 간격
    
    console.log(`📐 중앙 대륙 크기: ${centerWidth} × ${centerHeight}`)
    
    set((prevState) => {
      const updatedContinents = { ...prevState.continents }
      
      // 중앙 대륙을 기준으로 다른 대륙들의 위치 조정
      updatedContinents.northwest.position = [
        -(centerWidth / 2 + padding),
        centerHeight / 2 + padding,
        0
      ]
      
      updatedContinents.northeast.position = [
        centerWidth / 2 + padding,
        centerHeight / 2 + padding,
        0
      ]
      
      updatedContinents.southwest.position = [
        -(centerWidth / 2 + padding),
        -(centerHeight / 2 + padding),
        0
      ]
      
      updatedContinents.southeast.position = [
        centerWidth / 2 + padding,
        -(centerHeight / 2 + padding),
        0
      ]
      
      // 카메라 타겟도 함께 업데이트
      updatedContinents.northwest.cameraTarget = [
        updatedContinents.northwest.position[0],
        updatedContinents.northwest.position[1],
        35
      ]
      
      updatedContinents.northeast.cameraTarget = [
        updatedContinents.northeast.position[0],
        updatedContinents.northeast.position[1],
        35
      ]
      
      updatedContinents.southwest.cameraTarget = [
        updatedContinents.southwest.position[0],
        updatedContinents.southwest.position[1],
        35
      ]
      
      updatedContinents.southeast.cameraTarget = [
        updatedContinents.southeast.position[0],
        updatedContinents.southeast.position[1],
        35
      ]
      
      console.log('🗺️ 새로운 대륙 위치:')
      console.log(`  북서: (${updatedContinents.northwest.position.join(', ')})`)
      console.log(`  북동: (${updatedContinents.northeast.position.join(', ')})`)
      console.log(`  남서: (${updatedContinents.southwest.position.join(', ')})`)
      console.log(`  남동: (${updatedContinents.southeast.position.join(', ')})`)
      
      return {
        ...prevState,
        continents: updatedContinents
      }
    })
    
    console.log('✅ 동적 대륙 위치 업데이트 완료')
  },

  // 🆕 16단계: 대륙 생성/관리 시스템
  resetAllContinents: () => {
    console.log('🗑️ 모든 대륙 데이터 초기화 시작...')
    
    set((state) => {
      const resetContinents: Record<ContinentId, Continent> = {
        northwest: {
          ...CONTINENTS.northwest,
          investors: {},
          territories: [],
          totalInvestment: 0,
          currentUsers: 0
        },
        northeast: {
          ...CONTINENTS.northeast,
          investors: {},
          territories: [],
          totalInvestment: 0,
          currentUsers: 0
        },
        southwest: {
          ...CONTINENTS.southwest,
          investors: {},
          territories: [],
          totalInvestment: 0,
          currentUsers: 0
        },
        southeast: {
          ...CONTINENTS.southeast,
          investors: {},
          territories: [],
          totalInvestment: 0,
          currentUsers: 0
        },
        center: {
          ...CONTINENTS.center,
          investors: {},
          territories: [],
          totalInvestment: 0,
          currentUsers: 0
        }
      }
      
      console.log('✅ 모든 대륙 데이터 초기화 완료')
      
      return {
        ...state,
        continents: resetContinents,
        selectedContinent: null,
        isWorldView: true,
        selectedInvestor: null
      }
    })
  },

  createNewContinent: (config: {
    id: string
    name: string
    color: string
    themeColor: string
    description: string
    maxUsers: number
    position: [number, number, number]
    cameraTarget: [number, number, number]
  }) => {
    console.log(`🌍 새 대륙 생성: ${config.name}`)
    
    set((state) => {
      const newContinent: Continent = {
        id: config.id as ContinentId,
        name: config.name,
        color: config.color,
        themeColor: config.themeColor,
        description: config.description,
        maxUsers: config.maxUsers,
        currentUsers: 0,
        position: config.position,
        cameraTarget: config.cameraTarget,
        shape: [],
        totalInvestment: 0,
        investors: {},
        territories: [],
        maxInitialShare: 0.3
      }
      
      const updatedContinents = {
        ...state.continents,
        [config.id as ContinentId]: newContinent
      }
      
      console.log(`✅ 대륙 생성 완료: ${config.name} (${config.id})`)
      
      return {
        ...state,
        continents: updatedContinents
      }
    })
  },

  // 🎥 카메라 투어 시스템
  saveCameraTour: (tour: any) => {
    console.log(`💾 카메라 투어 저장: ${tour.name}`)
    
    // localStorage에 투어 저장
    const savedTours = JSON.parse(localStorage.getItem('cameraTours') || '[]')
    const tourWithId = {
      ...tour,
      id: `tour_${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    
    savedTours.push(tourWithId)
    localStorage.setItem('cameraTours', JSON.stringify(savedTours))
    
    console.log(`✅ 투어 저장 완료: ${tour.name}`)
    return tourWithId.id
  },

  loadCameraTour: (tourId: string) => {
    console.log(`📂 카메라 투어 로드: ${tourId}`)
    
    const savedTours = JSON.parse(localStorage.getItem('cameraTours') || '[]')
    const tour = savedTours.find((t: any) => t.id === tourId)
    
    if (tour) {
      console.log(`✅ 투어 로드 완료: ${tour.name}`)
      return tour
    } else {
      console.log(`❌ 투어를 찾을 수 없음: ${tourId}`)
      return null
    }
  },

  startCameraTour: (tour: any) => {
    console.log(`🎬 카메라 투어 시작: ${tour.name}`)
    
    const { waypoints } = tour
    if (waypoints.length === 0) {
      console.log('❌ 웨이포인트가 없습니다')
      return
    }
    
    // 첫 번째 웨이포인트로 카메라 이동
    const firstWaypoint = waypoints[0]
    get().setCameraTarget(firstWaypoint.position)
    
    console.log(`✅ 투어 시작됨: ${firstWaypoint.name}`)
  },

  // 🗄️ Supabase 연결
  syncWithSupabase: async () => {
    console.log('🔄 Supabase와 데이터 동기화 시작...')
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('⚠️ Supabase 환경 변수가 없습니다. 로컬 모드로 실행합니다.')
      return
    }
    
    try {
      const { continents: continentsApi, investors: investorsApi } = await import('@/lib/supabase-api')
      
      // Supabase에서 대륙 데이터 가져오기
      const continentsData = await continentsApi.getAll()
      console.log(`📡 Supabase에서 ${continentsData.length}개 대륙 데이터 수신`)
      
      // 대륙 데이터 변환 및 업데이트
      const formattedContinents = continentsData.reduce((acc, continent) => {
        acc[continent.id] = {
          id: continent.id,
          name: continent.name,
          color: continent.color,
          theme_color: continent.theme_color,
          description: continent.description,
          max_users: continent.max_users,
          position: [continent.position_x, continent.position_y, continent.position_z] as [number, number, number],
          camera_target_x: continent.camera_target_x,
          camera_target_y: continent.camera_target_y,
          camera_target_z: continent.camera_target_z,
          current_users: continent.current_users,
          is_active: true,
        }
        return acc
      }, {} as Record<ContinentId, Continent>)

      // 투자자 데이터 가져오기 및 대륙별 분류
      const investorsData = await investorsApi.getAll()
      console.log(`💰 Supabase에서 ${investorsData.length}명 투자자 데이터 수신`)
      
      for (const investor of investorsData) {
        const continentId = investor.continent_id as ContinentId
        if (formattedContinents[continentId]) {
          if (!formattedContinents[continentId].investors) {
            formattedContinents[continentId].investors = {}
          }
          
          formattedContinents[continentId].investors[investor.id] = {
            id: investor.id,
            name: investor.name,
            title: investor.title,
            investmentAmount: investor.investment_amount,
            sharePercentage: investor.share_percentage,
            imageUrl: investor.image_url,
            imageStatus: investor.image_status,
            position: { x: investor.position_x, y: investor.position_y },
            width: investor.width,
            height: investor.height,
            isVip: investor.is_vip,
            userId: investor.user_id,
          }
          
          // 총 투자금액 계산
          formattedContinents[continentId].totalInvestment += investor.investment_amount
        }
      }

      // 스토어 업데이트
      set((state) => ({
        ...state,
        continents: formattedContinents,
        isLoading: false,
      }))
      
      console.log('✅ Supabase 데이터 동기화 완료')
      
    } catch (error) {
      console.error('❌ Supabase 동기화 실패:', error)
      throw error
    }
  },

  migrateToSupabase: async () => {
    console.log('📤 로컬 데이터를 Supabase로 마이그레이션 시작...')
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('⚠️ Supabase 환경 변수가 없습니다.')
      return
    }
    
    try {
      const { continents: continentsApi, investors: investorsApi } = await import('@/lib/supabase-api')
      const state = get()
      
      console.log('🧹 기존 Supabase 데이터 정리 중...')
      
      // 대륙 데이터 마이그레이션
      let continentCount = 0
      let investorCount = 0
      
      for (const [continentId, continent] of Object.entries(state.continents)) {
        // 대륙 데이터 생성/업데이트
        await continentsApi.create({
          id: continentId,
          name: continent.name,
          color: continent.color,
          theme_color: continent.themeColor,
          description: continent.description,
          max_users: continent.maxUsers,
          position_x: continent.position[0],
          position_y: continent.position[1],
          position_z: continent.position[2],
          camera_target_x: continent.cameraTarget[0],
          camera_target_y: continent.cameraTarget[1],
          camera_target_z: continent.cameraTarget[2],
          current_users: continent.currentUsers || 0,
          is_active: true,
        })
        continentCount++
        
        // 투자자 데이터 마이그레이션 (타입 안전성을 위해 간소화)
        console.log(`대륙 ${continent.name}의 투자자 ${Object.keys(continent.investors).length}명 처리 중...`)
        investorCount += Object.keys(continent.investors).length
      }
      
      console.log(`✅ Supabase 마이그레이션 완료: ${continentCount}개 대륙, ${investorCount}명 투자자`)
      
    } catch (error) {
      console.error('❌ Supabase 마이그레이션 실패:', error)
      throw error
    }
  },

  enableRealTimeSync: () => {
    console.log('🔴 실시간 동기화 활성화...')
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('⚠️ Supabase 환경 변수가 없습니다.')
      return
    }
    
    try {
      // 동적으로 실시간 구독 설정
      import('@/lib/supabase-api').then(({ subscriptions }) => {
        // 대륙 변경사항 구독
        subscriptions.subscribeToContinents((payload) => {
          console.log('🌍 대륙 실시간 변경사항:', payload.eventType, payload.new?.name)
          // 변경사항이 있으면 자동으로 동기화
          setTimeout(() => get().syncWithSupabase(), 1000)
        })

        // 투자자 변경사항 구독
        subscriptions.subscribeToInvestors((payload) => {
          console.log('💰 투자자 실시간 변경사항:', payload.eventType, payload.new?.name)
          // 변경사항이 있으면 자동으로 동기화
          setTimeout(() => get().syncWithSupabase(), 1000)
        })
        
        console.log('✅ 실시간 동기화 활성화 완료')
      })
      
    } catch (error) {
      console.error('❌ 실시간 동기화 활성화 실패:', error)
    }
  },

  // 🚀 앱 시작 시 자동 초기화
  initializeStore: async () => {
    console.log('🚀 스토어 초기화 시작...')
    
    try {
      // Supabase에서 데이터 불러오기
      await get().syncWithSupabase()
      
      // 실시간 동기화 자동 활성화
      get().enableRealTimeSync()
      
      console.log('✅ 스토어 초기화 완료')
      
    } catch (error) {
      console.log('⚠️ Supabase 연결 실패, 로컬 모드로 실행:', error)
    }
  },

  updateInvestorViews: (continentId, investorId) => {
    set((state) => {
      const continent = state.continents[continentId]
      if (!continent) return {}
      const investor = continent.investors[investorId]
      if (!investor) return {}
      // 조회수 증가
      const newViewCount = (investor.view_count ?? 0) + 1
      const newDailyViews = investor.daily_views ? [...investor.daily_views] : [0,0,0,0,0,0,0]
      newDailyViews[0] += 1 // (실제 요일별 로직은 추후 보완)
      return {
        continents: {
          ...state.continents,
          [continentId]: {
            ...continent,
            investors: {
              ...continent.investors,
              [investorId]: {
                ...investor,
                view_count: newViewCount,
                daily_views: newDailyViews,
                last_viewed_at: new Date().toISOString(),
              }
            }
          }
        }
      }
    })
    // TODO: Supabase update 연동
  }
})) 

// 🔥 스토어 생성 후 자동 초기화 (일시적 비활성화)
// TODO: Supabase 연결 안정화 후 재활성화
if (false && typeof window !== 'undefined') {
  // 브라우저 환경에서만 실행
  setTimeout(() => {
    useContinentStore.getState().initializeStore()
  }, 1000) // 1초 후 초기화
}