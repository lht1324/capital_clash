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

    if (!isInitialized) {
        return <main className="flex w-full pt-16">Loading players...</main>;
    }

    return (
        (isInitialized && <main className="flex w-full pt-16">
            <ContinentDropdown/>
            <ContinentMap/>
            <NotificationManager/>
        </main>)
    )
}

export default memo(ContinentMapWrapperClient);
