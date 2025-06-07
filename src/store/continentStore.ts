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
    position: [0, 35, 0], // 북쪽 상단 (40→35, 적당한 거리)
    cameraTarget: [0, 35, 35],
    shape: [], // 나중에 생성
    totalInvestment: 0,
    investors: {},
    territories: [],
    maxInitialShare: 0.3
  },
  east: {
    id: 'east',
    name: '동방 대륙',
    color: '#EF4444', // 빨간색
    themeColor: '#FEF2F2',
    description: '떠오르는 태양의 용사들',
    maxUsers: 50,
    currentUsers: 0,
    position: [40, 0, 0], // 동쪽 우측 (15→40)
    cameraTarget: [40, 0, 35],
    shape: [],
    totalInvestment: 0,
    investors: {},
    territories: [],
    maxInitialShare: 0.3
  },
  south: {
    id: 'south',
    name: '남방 대륙',
    color: '#10B981', // 초록색
    themeColor: '#F0FDF4',
    description: '무성한 남방의 정복자들',
    maxUsers: 50,
    currentUsers: 0,
    position: [0, -35, 0], // 남쪽 하단 (40→35, 적당한 거리)
    cameraTarget: [0, -35, 35],
    shape: [],
    totalInvestment: 0,
    investors: {},
    territories: [],
    maxInitialShare: 0.3
  },
  west: {
    id: 'west',
    name: '서방 대륙',
    color: '#F59E0B', // 주황색
    themeColor: '#FFFBEB',
    description: '석양의 제국 건설자들',
    maxUsers: 50,
    currentUsers: 0,
    position: [-40, 0, 0], // 서쪽 좌측 (15→40)
    cameraTarget: [-40, 0, 35],
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
  addInvestor: (continentId: ContinentId, investor: Omit<Investor, 'share' | 'territories'>) => void
  updateInvestment: (continentId: ContinentId, investorId: string, amount: number) => void
  setSelectedInvestor: (investorId: string | null) => void
  setAnimatingTerritories: (animating: boolean) => void
  // 테스트 데이터 생성
  generateTestData: (continentId: ContinentId) => void
  generate50TestData: (continentId: ContinentId) => void
  // 🆕 온라인 광고판 기능을 위한 새로운 액션들
  updateInvestorPositions: (continentId: ContinentId, placements: any[]) => void
  updateInvestorProfile: (continentId: ContinentId, investorId: string, updates: Partial<Investor>) => void
  updateImageStatus: (continentId: ContinentId, investorId: string, status: 'none' | 'pending' | 'approved' | 'rejected', imageUrl?: string) => void
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

  addInvestor: (continentId: ContinentId, investor: Omit<Investor, 'share' | 'territories' | 'color'>) => {
    const state = get()
    const continent = state.continents[continentId]
    
    // 투자자별 색상 생성
    const investorColors = [
      '#FF6B6B', // 빨강
      '#4ECDC4', // 청록
      '#45B7D1', // 파랑
      '#96CEB4', // 초록
      '#FFEAA7', // 노랑
      '#DDA0DD', // 보라
      '#98D8C8', // 민트
      '#F7DC6F', // 연노랑
      '#BB8FCE', // 연보라
      '#85C1E9', // 연파랑
    ]
    
    const currentInvestorCount = Object.keys(continent.investors).length
    const investorColor = investorColors[currentInvestorCount % investorColors.length]
    
    // 지분 계산
    const newTotalInvestment = continent.totalInvestment + investor.investment
    let share = investor.investment / newTotalInvestment
    
    // 모든 기존 투자자들의 지분 재계산
    const updatedInvestors: Record<string, Investor> = {}
    Object.entries(continent.investors).forEach(([id, existingInvestor]) => {
      updatedInvestors[id] = {
        ...existingInvestor,
        share: existingInvestor.investment / newTotalInvestment
      }
    })
    
    const newInvestor: Investor = {
      ...investor,
      share,
      territories: [],
      color: investorColor,
      // 🆕 새 필드들 초기화
      imageStatus: 'none',
      tilePosition: undefined,
      profileInfo: undefined
    }
    
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
    
    console.log(`✅ 투자자 추가: ${investor.name}, 지분: ${(share * 100).toFixed(1)}%, 색상: ${investorColor}`)
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
  },

  setSelectedInvestor: (investorId: string | null) => 
    set({ selectedInvestor: investorId }),

  setAnimatingTerritories: (animating: boolean) => 
    set({ animatingTerritories: animating }),

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
  }
})) 