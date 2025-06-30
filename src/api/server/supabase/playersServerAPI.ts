
import { Player } from "@/api/types/supabase/Players";
import { supabase } from "@/lib/supabase/supabaseClient";

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
            .single();

        console.log("data", data)
        console.log("error", error)

        if (error) throw error

        return data || null
    },
}
