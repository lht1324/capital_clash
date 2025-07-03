import { Player } from "@/api/types/supabase/Players";
import { createSupabaseServer } from "@/lib/supabase/supabaseServer";

// 🧑‍💼 투자자 관련 함수들
export const playersServerAPI = {
    // 모든 투자자 조회
    async getPlayers(): Promise<Player[]> {
        const supabase = await createSupabaseServer();

        const { data, error } = await supabase
            .from('investors')
            .select('*')
            .order('created_at', { ascending: true })

        if (error) throw error
        return data || []
    },

    // 새 투자자 추가
    async postPlayers(player: Partial<Player>): Promise<Player> {
        const supabase = await createSupabaseServer();

        const { data, error } = await supabase
            .from('investors')
            .insert([player])
            .select()

        if (error) throw error
        return data?.[0] || null
    },

    // 특정 사용자의 투자자 정보 조회
    async getPlayersByPlayerId(playerId: string): Promise<Player | null> {
        const supabase = await createSupabaseServer();

        const { data, error } = await supabase
            .from('investors')
            .select('*')
            .eq('id', playerId)
            .single();

        if (error) throw error
        return data || null
    },

    // 특정 사용자의 투자자 정보 조회
    async getPlayersByUserId(userId: string): Promise<Player | null> {
        const supabase = await createSupabaseServer();

        const { data, error } = await supabase
            .from('investors')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error
        return data || null
    },

    // 투자자 정보 업데이트
    async patchPlayersById(playerId: string, player: Partial<Player>): Promise<Player | null> {
        const supabase = await createSupabaseServer();

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
