'use client'

import { useSupabaseData } from '@/hooks/useSupabaseData'
import { useState, memo } from "react";
import Header from '@/components/main/header/Header'
import Sidebar from '@/components/main/sidebar/Sidebar'
import ContinentDropdown from '@/components/main/continent_map/ContinentDropdown'
import ContinentMap from '@/components/main/continent_map/ContinentMap'
import InvestmentNotificationManager from '@/components/main/InvestmentNotification'

function Home() {
    const [isLoading, setIsLoading] = useState(true);

    // Supabase 데이터 초기화 및 실시간 구독
    useSupabaseData(
        () => {
            setIsLoading(false);
        }
    )

    return (
        !isLoading ? (<div className="min-h-screen">
            {/* 상단 헤더 */}
            <Header />

            {/* 사이드바 */}
            <Sidebar />

            {/* 메인 컨텐츠 영역 - Header 높이만큼 상단 여백 추가 */}
            <main className="pt-16">
                {/* 좌상단 대륙 선택 버튼 */}
                <ContinentDropdown />

                {/* 메인 지도 - 항상 표시 */}
                <ContinentMap />

                {/* 실시간 투자 알림 시스템 */}
                <InvestmentNotificationManager isEnabled={true} />
            </main>
        </div>) : (<div>
        </div>)
    )
}

export default memo(Home);