import { create } from 'zustand'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Investor } from "@/store/investorsStore";
import { usersAPI } from "@/lib/supabase/supabase-users-api";
import supabase from "@/lib/supabase/supabase";

type User = {
    id: string,
    name: string,
    email: string,
    avatar_url?: string,
    external_url?: string,
    created_at: string,
    updated_at: string,
    role: string,
}

interface UserState {
    user: User | null

    fetchUser: () => Promise<void>

    initializeUser: (user: User | null) => void
    clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
    user: null,

    fetchUser: async () => {
        console.log('🔄 유저 정보 불러오기 시작')

        try {
            const getUser = () => {
                return new Promise((resolve: (result: SupabaseUser) => void, reject) => {
                    supabase.auth.onAuthStateChange((event, session) => {
                        console.log("session.user", session?.user)
                        if (session?.user) {
                            resolve(session.user as SupabaseUser)
                        } else {
                            reject(Error("로그인 실패"))
                        }
                    })
                });
            }

            const authUser = await getUser();

            const user = await usersAPI.getByUserid(authUser.id);
            console.log("userStore user", user)
            set({ user: user })

            console.log('✅ 유저 정보 로드 완료')
        } catch (error) {
            console.error('❌ 유저 정보 로드 실패:', error)
        }
    },
    initializeUser: (user) => set({ user }),
    clearUser: () => set({ user: null })
}))