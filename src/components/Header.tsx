'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import PurchaseTileModal from './PurchaseTileModal'
import { useContinentStore, type ContinentId } from '@/store/continentStore'
import { getCurrentUserTileInfo } from '@/utils/userUtils'

interface UserProfile {
  name: string
  balance: number
  totalInvestment: number
  rank: number
}

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false) // 테스트용 로그인 상태
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const { addInvestor, continents, selectedContinent } = useContinentStore()
  
  // 현재 사용자의 영역 정보 확인
  const userTileInfo = getCurrentUserTileInfo(continents)
  
  // 전체 투자 통계 계산
  const calculateTotalStats = () => {
    let totalInvestment = 0
    let totalInvestors = 0
    
    Object.values(continents).forEach(continent => {
      totalInvestment += continent.totalInvestment
      totalInvestors += Object.keys(continent.investors).length
    })
    
    return { totalInvestment, totalInvestors }
  }
  
  const { totalInvestment, totalInvestors } = calculateTotalStats()
  
  // 테스트용 사용자 데이터
  const userProfile: UserProfile = {
    name: 'investor_01',
    balance: 1250,
    totalInvestment: 3750,
    rank: 15
  }

  const toggleLogin = () => {
    setIsLoggedIn(!isLoggedIn)
    setIsProfileDropdownOpen(false)
  }

  // 영역 구매 처리
  const handlePurchase = async (continentId: ContinentId, amount: number) => {
    console.log(`🛒 영역 구매: ${continentId}, $${amount.toLocaleString()}`)
    try {
      await addInvestor(continentId, {
        id: `investor_${Date.now()}`,
        name: `투자자_${Math.floor(Math.random() * 10000)}`,
        investment: amount,
        imageStatus: 'none',
        profileInfo: { description: '' },
      })
      alert(`🎉 ${continentId} 대륙에 $${amount.toLocaleString()} 투자가 완료되었습니다!`)
    } catch (error) {
      console.error('투자 실패:', error)
      alert('❌ 투자에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // 추가 투자 처리
  const handleAdditionalInvestment = async (amount: number) => {
    if (!userTileInfo.continentId) return
    console.log(`💰 추가 투자: ${userTileInfo.continentId}, $${amount.toLocaleString()}`)
    try {
      await addInvestor(userTileInfo.continentId, {
        id: `investor_${Date.now()}`,
        name: `추가투자_${Math.floor(Math.random() * 10000)}`,
        investment: amount,
        imageStatus: 'none',
        profileInfo: { description: '' },
      })
      alert(`💰 ${userTileInfo.continentId} 대륙에 $${amount.toLocaleString()} 추가 투자가 완료되었습니다!`)
    } catch (error) {
      console.error('추가 투자 실패:', error)
      alert('❌ 추가 투자에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 bg-black bg-opacity-90 backdrop-blur-sm text-white border-b border-gray-800 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 및 브랜딩 */}
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CC</span>
              </div>
              <div>
          <h1 className="text-xl font-bold">Capital Clash</h1>
                <span className="text-xs text-gray-400 hidden sm:block">온라인 광고판 투자 플랫폼</span>
              </div>
            </div>
        </div>
        
          {/* 데스크톱 네비게이션 */}
        <nav className="hidden md:flex items-center space-x-6">
            <button className="hover:text-blue-400 transition-colors px-3 py-2 rounded-md hover:bg-gray-800">
              🏆 랭킹
            </button>
            <button 
              onClick={() => setIsPurchaseModalOpen(true)}
              className="hover:text-blue-400 transition-colors px-3 py-2 rounded-md hover:bg-gray-800"
            >
              {userTileInfo.hasExistingTile ? '💰 추가 투자' : '🛒 영역 구매'}
            </button>
            <button className="hover:text-blue-400 transition-colors px-3 py-2 rounded-md hover:bg-gray-800">
              📊 내 투자
            </button>
            <button className="hover:text-blue-400 transition-colors px-3 py-2 rounded-md hover:bg-gray-800">
              📈 히스토리
            </button>
        </nav>
        
          {/* 사용자 영역 */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              // 로그인 상태
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <div className="text-right text-sm">
                    <div className="text-green-400 font-medium">₩{userProfile.balance.toLocaleString()}</div>
                    <div className="text-gray-400 text-xs">#{userProfile.rank}위</div>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 프로필 드롭다운 */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="p-4 border-b border-gray-700">
                      <div className="font-medium">{userTileInfo.investorId || 'Guest'}</div>
                      {userTileInfo.investment > 0 && (
                        <div className="text-sm text-gray-400">총 투자: ${userTileInfo.investment.toLocaleString()}</div>
                      )}
                    </div>
                    
                    {/* Platform Statistics */}
                    <div className="p-4 border-b border-gray-700 bg-gray-800">
                      <div className="text-sm font-medium text-white mb-2">📊 Platform Stats</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Total Investment:</span>
                          <span className="text-green-400 font-medium">${totalInvestment.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Total Investors:</span>
                          <span className="text-blue-400 font-medium">{totalInvestors.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <Link href="/profile" className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors block">
                        👤 프로필 설정
                      </Link>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors">
                        🎯 내 영역 관리
                      </button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors">
                        💰 결제 히스토리
                      </button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors">
                        ⚙️ 설정
                      </button>
                      <hr className="border-gray-700 my-2" />
                      <button
                        onClick={toggleLogin}
                        className="w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors text-red-400"
                      >
                        🚪 로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // 로그아웃 상태
        <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-400">
                  <span>게스트 모드</span>
                </div>
                <button
                  onClick={toggleLogin}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  로그인
                </button>
              </div>
            )}

            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 py-4">
            <nav className="flex flex-col space-y-2">
              <button className="text-left px-4 py-3 hover:bg-gray-800 transition-colors rounded-md">
                🏆 랭킹
              </button>
              <button 
                onClick={() => setIsPurchaseModalOpen(true)}
                className="text-left px-4 py-3 hover:bg-gray-800 transition-colors rounded-md"
              >
                {userTileInfo.hasExistingTile ? '💰 추가 투자' : '🛒 영역 구매'}
              </button>
              <button className="text-left px-4 py-3 hover:bg-gray-800 transition-colors rounded-md">
                📊 내 투자
              </button>
              <button className="text-left px-4 py-3 hover:bg-gray-800 transition-colors rounded-md">
                📈 히스토리
              </button>
              {!isLoggedIn && (
                <button
                  onClick={toggleLogin}
                  className="text-left px-4 py-3 bg-blue-600 hover:bg-blue-700 transition-colors rounded-md font-medium"
                >
            로그인
          </button>
              )}
            </nav>
        </div>
        )}
      </div>
      
      {/* 영역 구매 모달 */}
      <PurchaseTileModal 
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onPurchase={handlePurchase}
        onAdditionalInvestment={handleAdditionalInvestment}
      />
    </header>
  )
} 