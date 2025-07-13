import {User} from "@/api/types/supabase/Users";
import {createSupabaseServer} from "@/lib/supabase/supabaseServer";

export const usersServerAPI = {
    async postUsers(user: Partial<User>): Promise<User | null> {
        try {
            const supabase = await createSupabaseServer();

            const { data, error } = await supabase
                .from('users')
                .insert([user])
                .select()
                .single();

            if (error) throw error;

            return data || null
        } catch (error) {
            console.log(error);
            return null;
        }
    },

    async getUsers(): Promise<User[]> {
        try {
            const supabase = await createSupabaseServer();

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error

            return data || [];
        } catch (error) {
            console.log(error);
            return [];
        }
    },

    async getUsersByUserid(userId: string): Promise<User | null> {
        try {
            console.log('🔄 유저 정보 불러오기 시작');

            const supabase = await createSupabaseServer();

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