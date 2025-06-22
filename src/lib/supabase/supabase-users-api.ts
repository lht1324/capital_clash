import { supabase } from './supabase'
import { Database } from '@/types/database'

type Tables = Database['public']['Tables']
type UserRow = Tables['users']['Row']


export const usersAPI = {
    async getAll(): UserRow[] {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error

        return data || [];
    },

    async getByUserid(userId: string): Promise<UserRow> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        console.log("data", data)

        if (error) throw error

        return data
    }
}