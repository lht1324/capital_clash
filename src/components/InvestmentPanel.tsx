'use client'

import { useState } from 'react'
import { useContinentStore } from '@/store/continentStore'

export default function InvestmentPanel() {
  const { 
    selectedContinent, 
    continents, 
    isWorldView,
    addInvestor,
    updateInvestment,
    animatingTerritories,
    generateTestData,
    generate50TestData
  } = useContinentStore()
  
  const [newInvestorName, setNewInvestorName] = useState('')
  const [investmentAmount, setInvestmentAmount] = useState(100)
  const [selectedInvestorId, setSelectedInvestorId] = useState('')
  
  // 현재 선택된 대륙 정보
  const currentContinent = selectedContinent ? continents[selectedContinent] : null
  
  if (isWorldView || !currentContinent) {
    return (
      <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg">
        <p className="text-sm text-gray-400">🌍 세계 지도 모드</p>
        <p className="text-xs text-gray-500">대륙을 선택해주세요</p>
      </div>
    )
  }
  

  
  const handleAddInvestor = () => {
    if (!selectedContinent || !newInvestorName.trim() || investmentAmount <= 0) return
    
    const newInvestor = {
      id: `investor_${Date.now()}`,
      name: newInvestorName.trim(),
      investment: investmentAmount,
      color: '' // 자동 생성됨
    }
    
    addInvestor(selectedContinent, newInvestor)
    setNewInvestorName('')
    setInvestmentAmount(100)
  }
  
  const handleUpdateInvestment = () => {
    if (!selectedContinent || !selectedInvestorId || investmentAmount <= 0) return
    
    updateInvestment(selectedContinent, selectedInvestorId, investmentAmount)
    setInvestmentAmount(100)
  }
  
  const investorsList = Object.values(currentContinent.investors)
  const totalInvestment = currentContinent.totalInvestment
  
  return (
          <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg w-80 max-h-72 overflow-y-auto">
      <div className="mb-4">
        <h3 className="font-bold text-lg mb-2" style={{ color: currentContinent.color }}>
          {currentContinent.name}
        </h3>
        <div className="text-sm space-y-1">
          <p>💰 총 투자금: <span className="text-green-400">${totalInvestment.toLocaleString()}</span></p>
          <p>👥 투자자 수: {investorsList.length}명</p>
          <p>📍 최대 첫 지분: {(currentContinent.maxInitialShare * 100).toFixed(0)}%</p>

        </div>
      </div>
      

      
      {/* 새 투자자 추가 섹션 */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <h4 className="font-semibold mb-2">👤 새 투자자 추가</h4>
        
        <div className="space-y-2">
          <input
            type="text"
            placeholder="투자자 이름"
            value={newInvestorName}
            onChange={(e) => setNewInvestorName(e.target.value)}
            className="w-full px-2 py-1 bg-gray-700 rounded text-sm"
          />
          
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="투자금 ($)"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(Number(e.target.value))}
              className="flex-1 px-2 py-1 bg-gray-700 rounded text-sm"
              min="1"
            />
            
            <button
              onClick={handleAddInvestor}
              disabled={!newInvestorName.trim() || investmentAmount <= 0}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors disabled:opacity-50"
            >
              추가
            </button>
          </div>
        </div>
      </div>
      
      {/* 기존 투자자 관리 섹션 */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <h4 className="font-semibold mb-2">💼 투자 관리</h4>
        
        {investorsList.length > 0 ? (
          <div className="space-y-2">
            <select
              value={selectedInvestorId}
              onChange={(e) => setSelectedInvestorId(e.target.value)}
              className="w-full px-2 py-1 bg-gray-700 rounded text-sm"
            >
              <option value="">투자자 선택</option>
              {investorsList.map((investor) => (
                <option key={investor.id} value={investor.id}>
                  {investor.name} (${investor.investment.toLocaleString()} - {(investor.share * 100).toFixed(1)}%)
                </option>
              ))}
            </select>
            
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="추가 투자금 ($)"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                className="flex-1 px-2 py-1 bg-gray-700 rounded text-sm"
                min="1"
              />
              
              <button
                onClick={handleUpdateInvestment}
                disabled={!selectedInvestorId || investmentAmount <= 0 || animatingTerritories}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm transition-colors disabled:opacity-50"
              >
                {animatingTerritories ? '처리중...' : '투자'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">투자자를 먼저 추가해주세요</p>
        )}
      </div>
      
      {/* 투자자 목록 */}
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <h4 className="font-semibold mb-2">📊 투자자 현황</h4>
        
        {investorsList.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {investorsList
              .sort((a, b) => b.investment - a.investment)
              .map((investor) => (
                <div 
                  key={investor.id} 
                  className="flex items-center justify-between text-xs p-2 bg-gray-700 rounded"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: investor.color }}
                    />
                    <span className="font-medium">{investor.name}</span>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-green-400">${investor.investment.toLocaleString()}</div>
                    <div className="text-gray-400">{(investor.share * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">아직 투자자가 없습니다</p>
        )}
      </div>
      
      {/* 테스트 데이터 생성 버튼 */}
      {investorsList.length === 0 && (
        <div className="p-3 bg-blue-900 rounded">
          <h4 className="font-semibold mb-2 text-blue-300">🧪 빠른 테스트</h4>
          <div className="space-y-2">
            <button
              onClick={() => selectedContinent && generateTestData(selectedContinent)}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            >
              4명 테스트 데이터 생성
            </button>
            <button
              onClick={() => selectedContinent && generate50TestData(selectedContinent)}
              className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
            >
              🏢 50명 Billboard 테스트
            </button>
          </div>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        🎯 투자자를 추가하면 Grid 시스템으로 영역이 배정됩니다
      </div>
    </div>
  )
} 