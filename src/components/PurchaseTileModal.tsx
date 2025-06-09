'use client'

import { useState, useEffect } from 'react'
import { useContinentStore, type ContinentId } from '@/store/continentStore'
import { getCurrentUserTileInfo, type UserTileInfo } from '@/utils/userUtils'

interface PurchaseTileModalProps {
  isOpen: boolean
  onClose: () => void
  onPurchase?: (continentId: ContinentId, amount: number) => void
  onAdditionalInvestment?: (amount: number) => void
}

export default function PurchaseTileModal({ isOpen, onClose, onPurchase, onAdditionalInvestment }: PurchaseTileModalProps) {
  const { continents } = useContinentStore()
  
  const [selectedContinent, setSelectedContinent] = useState<ContinentId | null>(null)
  const [investmentAmount, setInvestmentAmount] = useState<string>('')
  const [isCalculating, setIsCalculating] = useState(false)
  
  // 현재 사용자의 영역 정보 확인
  const userTileInfo: UserTileInfo = getCurrentUserTileInfo(continents)
  const isAdditionalInvestment = userTileInfo.hasExistingTile

  // 대륙별 현재 투자자 수 계산
  const getContinentUserCount = (continentId: ContinentId) => {
    const continent = continents[continentId]
    return Object.keys(continent?.investors || {}).length
  }

  // 대륙별 총 투자금 계산
  const getTotalInvestment = (continentId: ContinentId) => {
    const continent = continents[continentId]
    if (!continent) return 0
    
    return Object.values(continent.investors).reduce((total, investor) => {
      return total + investor.investment
    }, 0)
  }

  // 예상 지분율 계산
  const calculateSharePercentage = (amount: number, continentId: ContinentId) => {
    if (!amount || amount <= 0) return 0
    
    const totalInvestment = getTotalInvestment(continentId)
    const newTotal = totalInvestment + amount
    return (amount / newTotal) * 100
  }

  // 예상 영역 크기 계산 (셀 기반)
  const calculateExpectedSize = (sharePercentage: number) => {
    const cells = Math.round(sharePercentage * 2500 / 100)
    return Math.floor(Math.sqrt(cells))
  }

  // 실시간 계산 결과
  const amount = parseFloat(investmentAmount) || 0
  const sharePercentage = selectedContinent ? calculateSharePercentage(amount, selectedContinent) : 0
  const expectedSize = calculateExpectedSize(sharePercentage)
  const expectedCells = Math.round(sharePercentage * 2500 / 100)

  // 입력 검증
  const isValidAmount = amount >= 1 // $1 이상
  const isValidContinent = isAdditionalInvestment ? true : (selectedContinent && getContinentUserCount(selectedContinent) < 50)
  const canPurchase = isValidAmount && isValidContinent

  // 모달 열림/닫힘 시 초기화
  useEffect(() => {
    if (isOpen) {
      // 추가 투자 모드일 때는 기존 대륙으로 자동 설정
      if (isAdditionalInvestment && userTileInfo.continentId) {
        setSelectedContinent(userTileInfo.continentId)
      } else {
        setSelectedContinent(null)
      }
      setInvestmentAmount('')
    }
  }, [isOpen, isAdditionalInvestment, userTileInfo.continentId])

  // 구매/추가투자 처리
  const handlePurchase = () => {
    if (!canPurchase) return
    
    setIsCalculating(true)
    
    if (isAdditionalInvestment) {
      // 추가 투자 로직 실행
      if (onAdditionalInvestment) {
        onAdditionalInvestment(amount)
      }
    } else {
      // 신규 구매 로직 실행
      if (onPurchase && selectedContinent) {
        onPurchase(selectedContinent, amount)
      }
    }
    
    setTimeout(() => {
      setIsCalculating(false)
      onClose()
    }, 1000)
  }

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // 대륙 정보 배열 (X 모양 순서)
  const continentOptions = [
    { id: 'northwest' as ContinentId, name: '북서방 대륙', color: '#3B82F6', position: '왼쪽 위' },
    { id: 'northeast' as ContinentId, name: '북동방 대륙', color: '#EF4444', position: '오른쪽 위' },
    { id: 'southwest' as ContinentId, name: '남서방 대륙', color: '#10B981', position: '왼쪽 아래' },
    { id: 'southeast' as ContinentId, name: '남동방 대륙', color: '#F59E0B', position: '오른쪽 아래' }
  ]

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-start justify-center pt-20 p-4"
        onClick={onClose}
      >
        {/* 모달 콘텐츠 */}
        <div 
          className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[calc(100vh-6rem)] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">
              {isAdditionalInvestment ? '💰 추가 투자' : '🎯 영역 구매'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          {/* 콘텐츠 */}
          <div className="p-6 space-y-6">
            {/* 추가 투자 모드일 때 현재 영역 정보 표시 */}
            {isAdditionalInvestment && userTileInfo.continentId && (
              <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4 border border-blue-700">
                <h3 className="text-lg font-semibold text-white mb-2">📍 현재 영역</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-300">대륙</span>
                    <span className="text-white font-medium">
                      {continentOptions.find(c => c.id === userTileInfo.continentId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">현재 투자금</span>
                    <span className="text-green-400 font-medium">
                      ${userTileInfo.investment?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">현재 지분율</span>
                    <span className="text-blue-400 font-medium">
                      {userTileInfo.sharePercentage?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 단계 1: 대륙 선택 (신규 구매시만) */}
            {!isAdditionalInvestment && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">1️⃣ 대륙 선택</h3>
              <div className="grid grid-cols-2 gap-4">
                {continentOptions.map((continent) => {
                  const userCount = getContinentUserCount(continent.id)
                  const isFull = userCount >= 50
                  const isSelected = selectedContinent === continent.id
                  
                  return (
                    <button
                      key={continent.id}
                      onClick={() => !isFull && setSelectedContinent(continent.id)}
                      disabled={isFull}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-400 bg-blue-400 bg-opacity-10'
                          : isFull
                          ? 'border-gray-600 bg-gray-800 opacity-50 cursor-not-allowed'
                          : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: continent.color }}
                        />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-white">{continent.name}</div>
                          <div className="text-sm text-gray-400">{continent.position}</div>
                          <div className={`text-sm ${isFull ? 'text-red-400' : 'text-green-400'}`}>
                            {userCount}/50 명 {isFull && '(가득참)'}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              </div>
            )}

            {/* 단계 2: 투자 금액 입력 */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                {isAdditionalInvestment ? '💰 추가 투자 금액' : '2️⃣ 투자 금액'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    투자 금액 ($1 이상)
                  </label>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="예: 500"
                    min="1"
                    step="1"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-lg"
                  />
                </div>
                
                {/* 빠른 선택 버튼들 */}
                <div className="flex flex-wrap gap-2">
                  {[10, 50, 100, 250, 500, 1000, 2500, 5000].map((presetAmount) => (
                    <button
                      key={presetAmount}
                      onClick={() => setInvestmentAmount(presetAmount.toString())}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                    >
                      ${presetAmount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 단계 3: 예상 결과 */}
            {(selectedContinent || isAdditionalInvestment) && amount > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  {isAdditionalInvestment ? '📊 투자 후 예상 결과' : '3️⃣ 예상 결과'}
                </h3>
                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {isAdditionalInvestment ? '투자 대륙' : '선택 대륙'}
                    </span>
                    <span className="text-white font-medium">
                      {continentOptions.find(c => c.id === (selectedContinent || userTileInfo.continentId))?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {isAdditionalInvestment ? '추가 투자 금액' : '투자 금액'}
                    </span>
                    <span className="text-green-400 font-medium">${amount.toLocaleString()}</span>
                  </div>
                  
                  {isAdditionalInvestment && userTileInfo.investment && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">총 투자 금액</span>
                      <span className="text-green-400 font-medium">
                        ${(userTileInfo.investment + amount).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">예상 지분율</span>
                    <span className="text-blue-400 font-medium">{sharePercentage.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">예상 영역 크기</span>
                    <span className="text-purple-400 font-medium">
                      {expectedSize}×{expectedSize} ({expectedCells}셀)
                    </span>
                  </div>
                  
                  {!isValidAmount && (
                    <div className="text-red-400 text-sm">
                      ⚠️ 투자 금액은 $1 이상이어야 합니다
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-between p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handlePurchase}
              disabled={!canPurchase || isCalculating}
              className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                canPurchase && !isCalculating
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isCalculating 
                ? (isAdditionalInvestment ? '투자 중...' : '구매 중...') 
                : (isAdditionalInvestment ? '추가 투자하기' : '영역 구매하기')
              }
            </button>
          </div>
        </div>
      </div>
    </>
  )
} 