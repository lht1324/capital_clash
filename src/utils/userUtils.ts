import { ContinentId } from '@/store/continentStore'
import { Investor } from "@/store/investorsStore";

// 현재 사용자의 영역 정보 타입
export interface UserTileInfo {
    hasExistingTile: boolean
    continentId?: ContinentId
    investmentAmount?: number
}

// 현재 사용자의 영역 소유 상태 확인
export const getCurrentUserTileInfo = (investorList: Investor[], userId?: string): UserTileInfo => {
    let tileInfo = null;

    console.log(`userId = ${userId}`)
    investorList.forEach((investor) => {
        console.log(`investor.user_id = ${investor.user_id}, userId = ${userId}`)
        if (userId && investor.user_id === userId) {
            tileInfo = {
                hasExistingTile: true,
                continentId: investor.continent_id as ContinentId,
                investmentAmount: investor.investment_amount,
            }
        }
    })

    return tileInfo
        ? tileInfo
        : {
            hasExistingTile: false
        }
}