import supabase from "@/lib/supabase/supabase";
import {User as SupabaseUser} from "@supabase/auth-js/dist/module/lib/types";
import {User} from "@/api/types/supabase/Users";

export const usersServerAPI = {
    async getAll(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error

        return data || [];
    },

    async getByUserid(userId?: string): Promise<User | null> {
        if (!userId) return null;

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