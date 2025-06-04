'use client'

import Header from '@/components/Header'
import ContinentSelector from '@/components/ContinentSelector'
import ContinentMap from '@/components/ContinentMap'

export default function Home() {
  return (
    <>
      {/* 상단 헤더 */}
      <Header />
      
      {/* 좌상단 대륙 선택 버튼 */}
      <ContinentSelector />
      
      {/* 메인 지도 - 항상 표시 */}
      <ContinentMap />
    </>
  )
}