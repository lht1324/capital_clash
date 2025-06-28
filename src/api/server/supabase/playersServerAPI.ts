import supabase from '@/lib/supabase/supabase'
import {Player} from "@/api/types/supabase/Players";

// 🧑‍💼 투자자 관련 함수들
export const playersServerAPI = {
    // 모든 투자자 조회
    async getAll(): Promise<Player[]> {
        const { data, error } = await supabase
            .from('investors')
            .select('*')
            .order('created_at', { ascending: true })

        if (error) throw error
        return data || []
    },

    // 새 투자자 추가
    async create(player: Partial<Player>): Promise<Player> {
        const { data, error } = await supabase
            .from('investors')
            .insert([player])
            .select()

        if (error) throw error
        return data?.[0] || null
    },

    // 특정 사용자의 투자자 정보 조회
    async getByUserId(userId: string): Promise<Player> {
        const { data, error } = await supabase
            .from('investors')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error) throw error
        return data
    },

    // 투자자 정보 업데이트
    async update(playerId: string, player: Partial<Player>): Promise<Player | null> {
        const { data, error } = await supabase
            .from('investors')
            .update(player)
            .eq('id', playerId)
            .select()
            .single()

        if (error) throw error

        return data || null
    },

    // 투자금과 지분율 업데이트 (영역 구매 후)
    async updateInvestment(id: string, amount: number, sharePercentage: number): Promise<Player> {
        console.log('🔄 투자금 및 지분율 업데이트:', id, amount, sharePercentage)

        const { data, error } = await supabase
            .from('investors')
            .update({
                investment_amount: amount,
                share_percentage: sharePercentage,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        console.log('✅ 투자금 및 지분율 업데이트 완료:', data)
        return data
    },

    async updateContinentId(id: string, selectedContinentId: string): Promise<Player> {
        const { data, error } = await supabase
            .from('investors')
            .update({
                continent_id: selectedContinentId,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        console.log('✅ 투자금 및 지분율 업데이트 완료:', data)
        return data
    },

    async updateImageStatus(id: string, imageStatus: string): Promise<Player> {
        const { data, error } = await supabase
            .from('investors')
            .update({
                image_status: imageStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        console.log('✅ 투자금 및 지분율 업데이트 완료:', data)
        return data
    },

    async updateDailyViews(id: string, dailyViews: number[]): Promise<Player> {
        const { data, error } = await supabase
            .from('investors')
            .update({
                daily_views: dailyViews,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        console.log('✅ 투자금 및 지분율 업데이트 완료:', data)
        return data
    },
}
