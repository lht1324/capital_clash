import { supabase } from './supabase'
import { Database } from '@/types/database'

type Tables = Database['public']['Tables']
type InvestorRow = Tables['investors']['Row']

// 🧑‍💼 투자자 관련 함수들
export const investorsAPI = {
    // 모든 투자자 조회
    async getAll() {
        const { data, error } = await supabase
            .from('investors')
            .select('*')
            .order('created_at', { ascending: true })

        if (error) throw error
        return data || []
    },

    // 새 투자자 추가
    async create(investor: Partial<InvestorRow>) {
        const { data, error } = await supabase
            .from('investors')
            .insert([investor])
            .select()

        if (error) throw error
        return data?.[0] || null
    },

    // 특정 사용자의 투자자 정보 조회
    async getByUserId(userId: string): Promise<InvestorRow> {
        const { data, error } = await supabase
            .from('investors')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error) throw error
        return data
    },

    // 투자자 정보 업데이트
    async update(investor: Partial<InvestorRow>) {
        const { data, error } = await supabase
            .from('investors')
            .update(investor)
            .eq('user_id', investor.user_id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    // 투자금과 지분율 업데이트 (영역 구매 후)
    async updateInvestment(id: string, amount: number, sharePercentage: number) {
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

    // 특정 사용자의 투자 내역 조회
    async getInvestmentsByUserId(userId: string) {
        const { data, error } = await supabase
            .from('investments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    }
}
