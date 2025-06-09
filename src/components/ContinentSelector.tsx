'use client'

import { useState } from 'react'
import { useContinentStore, ContinentId } from '@/store/continentStore'

export default function ContinentSelector() {
  const { 
    selectedContinent, 
    continents, 
    selectContinent,
    resetSelection,
    isWorldView
  } = useContinentStore()
  
  const [isOpen, setIsOpen] = useState(false)

  // 🛡️ 디버깅을 위한 로그
  console.log('🔍 ContinentSelector 상태 확인:', {
    continents: continents ? Object.keys(continents) : 'null',
    continentsLength: continents ? Object.keys(continents).length : 0,
    selectedContinent,
    isWorldView
  })

  // 🛡️ continents가 완전히 비어있지 않다면 표시 (로딩 조건 완화)
  if (!continents || Object.keys(continents).length < 2) {
    return (
      <div className="fixed top-20 left-4 z-30">
        <div className="bg-black bg-opacity-80 text-white p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse"></div>
            <span className="text-sm">대륙 데이터 로딩 중... ({continents ? Object.keys(continents).length : 0}/5)</span>
          </div>
        </div>
      </div>
    )
  }

  const handleContinentSelect = (continentId: ContinentId) => {
    // 🛡️ 선택하려는 대륙이 실제로 존재하는지 확인
    if (continents[continentId]) {
      selectContinent(continentId)
      setIsOpen(false)
    } else {
      console.warn(`⚠️ 대륙 '${continentId}'가 존재하지 않습니다. 세계 뷰로 전환합니다.`)
      resetSelection()
      setIsOpen(false)
    }
  }

  const handleWorldView = () => {
    resetSelection()
    setIsOpen(false)
  }

  // 현재 선택 상태에 따른 표시 (안전한 접근)
  const selectedContinentData = selectedContinent ? continents[selectedContinent] : null
  const currentDisplay = isWorldView 
    ? { name: '세계 지도', description: '모든 대륙 보기', color: '#6B7280' }
    : selectedContinentData || { name: '로딩 중...', description: '대륙 정보 불러오는 중', color: '#6B7280' }
    
  // 현재 대륙의 투자 통계 (안전한 접근)
  const currentStats = !isWorldView && selectedContinent && selectedContinentData ? {
    totalInvestment: selectedContinentData.totalInvestment || 0,
    investorCount: Object.keys(selectedContinentData.investors || {}).length,
    maxUsers: selectedContinentData.maxUsers || 0
  } : null

  return (
    <div className="fixed top-20 left-4 z-30">
      <div className="relative">
        {/* 현재 선택된 뷰 버튼 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 bg-black bg-opacity-80 text-white p-3 rounded-lg hover:bg-opacity-90 transition-all duration-300 min-w-[200px]"
          style={{ 
            borderLeft: `4px solid ${currentDisplay.color}` 
          }}
        >
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentDisplay.color }}
          />
          <div className="flex-1 text-left">
            <div className="font-bold text-sm">{currentDisplay.name}</div>
            <div className="text-xs text-gray-300">{currentDisplay.description}</div>
            {currentStats && (
              <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                <div className="flex justify-between">
                  <span>💰 투자금:</span>
                  <span className="text-green-400">${currentStats.totalInvestment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>👥 투자자:</span>
                  <span className="text-blue-400">{currentStats.investorCount}/{currentStats.maxUsers}</span>
                </div>
              </div>
            )}
          </div>
          <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </button>

        {/* 뷰 선택 드롭다운 */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 bg-black bg-opacity-90 rounded-lg overflow-hidden shadow-xl min-w-[200px]">
            {/* 세계 지도 뷰 옵션 */}
            <button
              onClick={handleWorldView}
              className={`w-full flex items-center space-x-3 p-3 hover:bg-white hover:bg-opacity-10 transition-colors ${
                isWorldView ? 'bg-white bg-opacity-5' : ''
              }`}
              style={{ 
                borderLeft: isWorldView 
                  ? '4px solid #6B7280' 
                  : '4px solid transparent' 
              }}
            >
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <div className="flex-1 text-left">
                <div className="font-bold text-sm text-white">🌍 세계 지도</div>
                <div className="text-xs text-gray-300">모든 대륙 한눈에 보기</div>
                <div className="text-xs text-gray-400">전체 뷰</div>
              </div>
            </button>

            {/* 구분선 */}
            <div className="border-t border-gray-600 my-1"></div>

            {/* 개별 대륙 옵션들 */}
            {Object.values(continents).map((continent) => (
              <button
                key={continent.id}
                onClick={() => handleContinentSelect(continent.id)}
                className={`w-full flex items-center space-x-3 p-3 hover:bg-white hover:bg-opacity-10 transition-colors ${
                  !isWorldView && selectedContinent === continent.id ? 'bg-white bg-opacity-5' : ''
                }`}
                style={{ 
                  borderLeft: !isWorldView && selectedContinent === continent.id 
                    ? `4px solid ${continent.color}` 
                    : '4px solid transparent' 
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: continent.color }}
                />
                <div className="flex-1 text-left">
                  <div className="font-bold text-sm text-white">{continent.name}</div>
                  <div className="text-xs text-gray-300">{continent.description}</div>
                  <div className="text-xs text-gray-400">
                    {continent.currentUsers}/{continent.maxUsers} 명
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* 클릭 외부 감지용 오버레이 */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-[-1]" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </div>
  )
} 