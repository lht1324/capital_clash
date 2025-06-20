import { supabase } from './supabase'
import { Database } from '@/types/database'

type Tables = Database['public']['Tables']
type ContinentRow = Tables['continents']['Row']

// 🌍 대륙 관련 함수들
export const continentsAPI = {
    // 모든 대륙 조회
    async getAll() {
        const { data, error } = await supabase
            .from('continents')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true })

        if (error) throw error
        return data || []
    },

    // 대륙 업데이트
    async update(id: string, updates: Partial<ContinentRow>) {
        const { data, error } = await supabase
            .from('continents')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    }
}