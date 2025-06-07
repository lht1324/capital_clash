'use client'

import Header from '@/components/Header'
import ContinentSelector from '@/components/ContinentSelector'
import ContinentMap from '@/components/ContinentMap'
import InvestmentPanel from '@/components/InvestmentPanel'

export default function Home() {
  return (
    <>
      {/* 상단 헤더 */}
      <Header />
      
      {/* 좌상단 대륙 선택 버튼 */}
      <ContinentSelector />
      
      {/* 메인 지도 - 항상 표시 */}
      <ContinentMap />
      
      {/* 우하단 투자 패널 */}
      <InvestmentPanel />
    </>
  )
}