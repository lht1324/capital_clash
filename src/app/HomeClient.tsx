'use client'

import { useSupabaseData } from '@/hooks/useSupabaseData'
import { useState, memo } from "react";
import Header from '@/components/main/header/Header'
import Sidebar from '@/components/main/sidebar/Sidebar'
import ContinentDropdown from '@/components/main/continent_map/ContinentDropdown'
import ContinentMap from '@/components/main/continent_map/ContinentMap'
import InvestmentNotificationManager from '@/components/main/InvestmentNotification'

function HomeClient() {
    const [isLoading, setIsLoading] = useState(true);

    // Supabase 데이터 초기화 및 실시간 구독
    useSupabaseData(
        () => {
            setIsLoading(false);
        }
    )

    return (
        <div className="flex w-full">
            {/*<Header />*/}
            {/* 메인 컨텐츠 영역 - Header 높이만큼 상단 여백 추가 */}
            {!isLoading ? (<main className="flex-1 pt-16">
                <ContinentDropdown />

                {/* 메인 지도 - 항상 표시 */}
                <ContinentMap />

                {/* 실시간 투자 알림 시스템 */}
                <InvestmentNotificationManager isEnabled={true} />
            </main>) : (<main className="flex-1 pt-16 flex items-center justify-center text-gray-400">
                Loading…
            </main>)}
        </div>
    )
}

export default memo(HomeClient);