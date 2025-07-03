import {User} from "@/api/types/supabase/Users";
import {createSupabaseServer} from "@/lib/supabase/supabaseServer";

export const usersServerAPI = {
    async getUsers(): Promise<User[]> {
        const supabase = await createSupabaseServer();

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error

        return data || [];
    },

    async getUsersByUserid(userId?: string): Promise<User | null> {
        if (!userId) return null;

        const supabase = await createSupabaseServer();

        console.log('🔄 유저 정보 불러오기 시작')

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            console.log('✅ 유저 정보 로드 완료')

            return data ?? null;
        } catch (error) {
            console.error('❌ 유저 정보 로드 실패:', error)
            return null;
        }
    }
}