import { supabase } from "@/lib/supabase/supabaseClient";
import {baseGetFetch} from "@/api/baseFetch";
import {User} from "@/api/types/supabase/Users";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL + "users/";

export const usersClientAPI = {
    async signInWithOAuth() {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        })
    },

    async signOutWithOAuth(onSuccess: () => void) {
        try {
            await supabase.auth.signOut();
            onSuccess();
        } catch (error) {
            console.error('로그아웃 중 오류 발생:', error)
        }
    },

    async getUserById(id: string): Promise<User | null> {
        try {
            return await baseGetFetch(`${BASE_URL}${id}`);
        } catch (error) {
            console.error('Error fetching user by ID:', error);
            return null;
        }
    }
};