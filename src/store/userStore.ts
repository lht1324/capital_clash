import { create } from 'zustand'
import {User} from "@/api/types/supabase/Users";

interface UserState {
    isUsersInitialized: boolean

    user: User | null

    initializeUser: (user: User | null) => void
    clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
    isUsersInitialized: false,

    user: null,

    initializeUser: (user) => set({ user: user, isUsersInitialized: true }),
    clearUser: () => set({ user: null })
}))