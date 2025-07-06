'use client'

import { useMemo, memo } from "react";
import { useContinentStore } from "@/store/continentStore";
import { usePlayersStore } from "@/store/playersStore";
import { useUserStore } from "@/store/userStore";
import ContinentDropdown from "@/components/main/continent_map/ContinentDropdown";
import ContinentMap from "@/components/main/continent_map/ContinentMap";
import NotificationManager from "@/components/main/notification/NotificationManager";

export interface ContinentMapWrapperClientProps {

}

// props 인터페이스에 맞게 함수 인자도 수정합니다.
function ContinentMapWrapperClient(props: ContinentMapWrapperClientProps) {
    const { isContinentsInitialized } = useContinentStore();
    const { isPlayersInitialized } = usePlayersStore();
    const { isUsersInitialized } = useUserStore();

    const isInitialized = useMemo(() => {
        return isContinentsInitialized && isPlayersInitialized && isUsersInitialized;
    }, [isContinentsInitialized, isPlayersInitialized, isUsersInitialized]);

    return (
        (isInitialized ? <main className="flex w-full pt-16">
            <ContinentDropdown/>
            <ContinentMap/>
            <NotificationManager/>
        </main> : <main className="flex flex-col w-full h-screen justify-center items-center bg-gray-50 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">Loading data...</p>
            <p className="text-gray-600 dark:text-gray-400">Please wait a moment.</p>
        </main>)
    )
}

export default memo(ContinentMapWrapperClient);
