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
  const [validationError, setValidationError] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  
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

  // 투자 금액 유효성 검사
  const validateInvestmentAmount = (value: string) => {
    const amount = parseFloat(value)
    if (!value) {
      setValidationError('투자 금액을 입력해주세요.')
      return false
    }
    if (isNaN(amount)) {
      setValidationError('유효한 숫자를 입력해주세요.')
      return false
    }
    
    // 선택된 대륙의 최소 투자금액 체크
    if (selectedContinent) {
      const minInvestment = continents[selectedContinent].min_investment
      if (amount < minInvestment) {
        setValidationError(`최소 투자 금액은 $${minInvestment}입니다.`)
        return false
      }
    } else if (amount < 1) {
      setValidationError('최소 투자 금액은 $1입니다.')
      return false
    }
    
    setValidationError('')
    return true
  }

  // 중복 투자 검증
  const validateDuplicateInvestment = (continentId: ContinentId) => {
    if (isAdditionalInvestment) return true
    
    // 다른 대륙에 이미 투자한 경우
    if (userTileInfo.hasExistingTile && userTileInfo.continentId !== continentId) {
      setValidationError('이미 다른 대륙에 투자하셨습니다. 추가 투자만 가능합니다.')
      return false
    }
    
    // 선택한 대륙이 가득 찬 경우
    const userCount = getContinentUserCount(continentId)
    if (userCount >= 50) {
      setValidationError('선택한 대륙이 가득 찼습니다. 다른 대륙을 선택해주세요.')
      return false
    }
    
    return true
  }

  // 실시간 계산 결과
  const amount = parseFloat(investmentAmount) || 0
  const sharePercentage = selectedContinent ? calculateSharePercentage(amount, selectedContinent) : 0
  const expectedSize = calculateExpectedSize(sharePercentage)
  const expectedCells = Math.round(sharePercentage * 2500 / 100)

  // 입력 검증
  const isValidAmount = amount >= 1
  const isValidContinent = isAdditionalInvestment ? true : (selectedContinent && validateDuplicateInvestment(selectedContinent))
  const canPurchase = isValidAmount && isValidContinent && !validationError

  // 투자 금액 변경 핸들러
  const handleAmountChange = (value: string) => {
    setInvestmentAmount(value)
    validateInvestmentAmount(value)
    setShowPreview(!!value && parseFloat(value) > 0)
  }

  // 모달 열림/닫힘 시 초기화
  useEffect(() => {
    if (isOpen) {
      if (isAdditionalInvestment && userTileInfo.continentId) {
        setSelectedContinent(userTileInfo.continentId)
      } else {
        setSelectedContinent(null)
      }
      setInvestmentAmount('')
      setValidationError('')
      setShowPreview(false)
    }
  }, [isOpen, isAdditionalInvestment, userTileInfo.continentId])

  // 구매/추가투자 처리
  const handlePurchase = async () => {
    if (!canPurchase) return
    
    setIsCalculating(true)
    
    try {
      if (isAdditionalInvestment) {
        if (onAdditionalInvestment) {
          await onAdditionalInvestment(amount)
        }
      } else {
        if (onPurchase && selectedContinent) {
          await onPurchase(selectedContinent, amount)
        }
      }
      
      // 성공 시 모달 닫기
      setTimeout(() => {
        setIsCalculating(false)
        onClose()
      }, 1000)
      
    } catch (error) {
      setIsCalculating(false)
      setValidationError('투자 처리 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
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
          <div className="p-6 space-y-8">
            {/* 추가 투자 모드일 때 현재 영역 정보 표시 */}
            {isAdditionalInvestment && userTileInfo.continentId && (
              <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-700/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-2xl">📍</span>
                  <span>현재 영역 정보</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
                    <span className="text-gray-300">대륙</span>
                    <span className="text-white font-medium">
                      {continentOptions.find(c => c.id === userTileInfo.continentId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
                    <span className="text-gray-300">현재 투자금</span>
                    <span className="text-green-400 font-medium">
                      ${userTileInfo.investment?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
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
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-sm">1</span>
                  대륙 선택
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {continentOptions.map((continent) => {
                    const userCount = getContinentUserCount(continent.id)
                    const isFull = userCount >= 50
                    const isSelected = selectedContinent === continent.id
                    const minInvestment = continents[continent.id].min_investment
                    
                    return (
                      <button
                        key={continent.id}
                        onClick={() => !isFull && setSelectedContinent(continent.id)}
                        disabled={isFull}
                        className={`p-5 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-purple-500/20 scale-[1.02]'
                            : isFull
                            ? 'border-gray-600/50 bg-gray-800/50 opacity-50 cursor-not-allowed'
                            : 'border-gray-600/50 bg-gray-800/50 hover:border-gray-400 hover:scale-[1.01] hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: continent.color + '20' }}
                          >
                            <div 
                              className="w-6 h-6 rounded-lg"
                              style={{ backgroundColor: continent.color }}
                            />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-white mb-1">{continent.name}</div>
                            <div className="text-sm text-gray-400 mb-2">{continent.position}</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-gray-700 overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all"
                                  style={{ 
                                    width: `${(userCount / 50) * 100}%`,
                                    backgroundColor: isFull ? '#EF4444' : '#10B981'
                                  }}
                                />
                              </div>
                              <span className={`text-sm ${isFull ? 'text-red-400' : 'text-green-400'}`}>
                                {userCount}/50
                              </span>
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
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {isAdditionalInvestment ? (
                  <>
                    <span className="text-2xl">💵</span>
                    <span>추가 투자 금액</span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-sm">2</span>
                    <span>투자 금액</span>
                  </>
                )}
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-gray-400">$</div>
                    <input
                      type="number"
                      value={investmentAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="투자 금액을 입력하세요"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all text-lg"
                      min="1"
                      step="1"
                    />
                  </div>
                  {validationError && (
                    <p className="mt-3 text-red-400 text-sm flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{validationError}</span>
                    </p>
                  )}
                </div>

                {/* 실시간 미리보기 */}
                {showPreview && selectedContinent && (
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-600/50 space-y-6">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <span className="text-xl">📊</span>
                      <span>투자 결과 미리보기</span>
                    </h4>
                    
                    {/* 투자 정보 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
                        <div className="text-sm text-gray-400">예상 지분율</div>
                        <div className="text-2xl font-semibold text-blue-400">
                          {sharePercentage.toFixed(2)}%
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
                        <div className="text-sm text-gray-400">예상 영역 크기</div>
                        <div className="text-2xl font-semibold text-green-400">
                          {expectedSize}×{expectedSize}
                        </div>
                      </div>
                    </div>

                    {/* 시각적 미리보기 */}
                    <div className="relative w-full aspect-square bg-gray-900/50 rounded-xl overflow-hidden border border-gray-700/50">
                      <div 
                        className="absolute bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-2 border-blue-400"
                        style={{
                          width: `${(expectedSize / 50) * 100}%`,
                          height: `${(expectedSize / 50) * 100}%`,
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="text-center bg-gray-900/80 px-6 py-3 rounded-xl backdrop-blur-sm">
                          <div className="text-sm text-gray-400">예상 셀 개수</div>
                          <div className="text-2xl font-semibold text-white">{expectedCells}셀</div>
                        </div>
                      </div>
                    </div>

                    {/* 투자 효과 설명 */}
                    <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4 text-sm text-gray-300 leading-relaxed">
                      {isAdditionalInvestment ? (
                        <>
                          현재 지분율 <span className="text-gray-200 font-medium">{userTileInfo.sharePercentage?.toFixed(2)}%</span>에서{' '}
                          <span className="text-blue-400 font-medium">{sharePercentage.toFixed(2)}%</span>로 증가하며,
                          영역 크기가 <span className="text-green-400 font-medium">{expectedSize}×{expectedSize}</span>로 변경됩니다.
                        </>
                      ) : (
                        <>
                          선택하신 대륙에서 <span className="text-blue-400 font-medium">{sharePercentage.toFixed(2)}%</span>의 지분을 가지며,{' '}
                          <span className="text-green-400 font-medium">{expectedSize}×{expectedSize}</span> 크기의 영역을 차지하게 됩니다.
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="p-6 flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handlePurchase}
              disabled={!canPurchase || isCalculating}
              className={`px-6 py-3 rounded-xl transition-all ${
                canPurchase && !isCalculating
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:opacity-90'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isCalculating ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>처리 중...</span>
                </span>
              ) : (
                isAdditionalInvestment ? '추가 투자하기' : '영역 구매하기'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
} 