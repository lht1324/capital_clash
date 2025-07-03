import { createSupabaseServer } from "@/lib/supabase/supabaseServer";
import {Continent} from "@/api/types/supabase/Continents";

export const continentsServerAPI = {
    // 모든 대륙 조회
    async getContinents(): Promise<Continent[]> {
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