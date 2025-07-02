import { createSupabaseServer } from "@/lib/supabase/supabaseServer";
import {Continent} from "@/api/types/supabase/Continents";

// 🌍 대륙 관련 함수들
export const continentsServerAPI = {
    // 모든 대륙 조회
    async getAll(): Promise<Continent[]> {
        const supabase = await createSupabaseServer();

        const { data, error } = await supabase
            .from('continents')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true })

        if (error) throw error
        return data || []
    },

    // 대륙 업데이트
    async update(id: string, updates: Partial<Continent>): Promise<Continent> {
        const supabase = await createSupabaseServer();

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