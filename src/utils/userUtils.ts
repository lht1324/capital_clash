import { ContinentId } from '@/store/continentStore'

// 현재 사용자 ID (실제로는 인증 시스템에서 가져와야 함)
export const CURRENT_USER_ID = 'investor_01'

// 현재 사용자의 영역 정보 타입
export interface UserTileInfo {
  hasExistingTile: boolean
  continentId?: ContinentId
  investment?: number
  sharePercentage?: number
}

// 현재 사용자의 영역 소유 상태 확인
export const getCurrentUserTileInfo = (continents: any): UserTileInfo => {
  for (const [continentId, continent] of Object.entries(continents)) {
    const investors = (continent as any)?.investors || {}
    
    for (const [investorId, investor] of Object.entries(investors)) {
      if (investorId === CURRENT_USER_ID) {
        return {
          hasExistingTile: true,
          continentId: continentId as ContinentId,
          investment: (investor as any).investment,
          sharePercentage: (investor as any).share
        }
      }
    }
  }
  
  return {
    hasExistingTile: false
  }
} 