import { create } from 'zustand'
import {Continent} from "@/api/types/supabase/Continents";

interface ContinentStore {
    // 상태
    isContinentsInitialized: boolean

    continents: Record<string, Continent>
    continentList: Continent[],

    // 액션
    initializeContinents: (initialContinentList: Continent[]) => void
}

export const useContinentStore = create<ContinentStore>((set) => ({
    // 초기 상태
    isContinentsInitialized: false,

    continents: {},
    continentList: [],

    initializeContinents: (initialContinentList: Continent[]) => {
        const continentsMap = initialContinentList.reduce((acc, player) => {
            acc[player.id] = player;
            return acc;
        }, {} as Record<string, Continent>);

        set({
            continents: continentsMap,
            continentList: initialContinentList,
            isContinentsInitialized: true,
        });
    }
}))
