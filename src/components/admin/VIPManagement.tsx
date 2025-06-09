'use client'

import { useState, useEffect } from 'react'
import { useContinentStore } from '@/store/continentStore'
import { 
  ArrowPathIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PlayIcon,
  InformationCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline'

interface TopInvestor {
  id: string
  name: string
  investment: number
  currentContinent: string
  rank: number
}

export default function VIPManagement() {
  const { continents, checkAndPromoteToVIP, calculateContinentBounds, generate50TestData, generateCustomTestData } = useContinentStore()
  const [isPromoting, setIsPromoting] = useState(false)
  const [lastPromotionTime, setLastPromotionTime] = useState<Date | null>(null)
  const [topInvestors, setTopInvestors] = useState<TopInvestor[]>([])
  const [centerInvestors, setCenterInvestors] = useState<TopInvestor[]>([])
  const [centerBounds, setCenterBounds] = useState<{ minX: number, maxX: number, minY: number, maxY: number } | null>(null)

  // 상위 투자자 및 중앙 대륙 현황 계산
  useEffect(() => {
    const allInvestors: Array<{ investor: any, continentId: string, continentName: string }> = []
    
    // 중앙 대륙을 제외한 모든 투자자 수집
    Object.entries(continents).forEach(([continentId, continent]) => {
      if (continentId !== 'center') {
        Object.values(continent.investors).forEach(investor => {
          allInvestors.push({ 
            investor, 
            continentId, 
            continentName: continent.name 
          })
        })
      }
    })
    
    // 투자금 기준으로 정렬
    allInvestors.sort((a, b) => b.investor.investment - a.investor.investment)
    
    // 상위 투자자 목록 생성
    const topList = allInvestors.slice(0, 10).map((item, index) => ({
      id: item.investor.id,
      name: item.investor.name,
      investment: item.investor.investment,
      currentContinent: item.continentName,
      rank: index + 1
    }))
    
    setTopInvestors(topList)
    
    // 현재 중앙 대륙 투자자들
    const centerList = Object.values(continents.center.investors).map((investor, index) => ({
      id: investor.id,
      name: investor.name,
      investment: investor.investment,
      currentContinent: '중앙 대륙 - 황제들의 VIP 영역',
      rank: index + 1
    }))
    
    setCenterInvestors(centerList)
    
    // 중앙 대륙 경계 계산
    const bounds = calculateContinentBounds('center')
    setCenterBounds(bounds)
  }, [continents, calculateContinentBounds])

  const handleManualPromotion = async () => {
    setIsPromoting(true)
    try {
      checkAndPromoteToVIP()
      setLastPromotionTime(new Date())
    } catch (error) {
      console.error('VIP 승격 중 오류:', error)
    }
    setIsPromoting(false)
  }

  const handleGenerateTestData = () => {
    // 여러 대륙에 테스트 데이터 생성
    const continentIds = ['northwest', 'northeast', 'southwest', 'southeast']
    continentIds.forEach(continentId => {
      generate50TestData(continentId as any)
    })
  }

  const handleGenerateCustomTestData = () => {
    console.log('🚀 맞춤형 테스트 데이터 생성 시작...')
    
    // 북서, 북동, 남서, 남동 순으로 40명, 30명, 20명, 10명
    const customData = [
      { continentId: 'northwest', userCount: 40 },
      { continentId: 'northeast', userCount: 30 },
      { continentId: 'southwest', userCount: 20 },
      { continentId: 'southeast', userCount: 10 }
    ]
    
    customData.forEach(({ continentId, userCount }) => {
      generateCustomTestData(continentId as any, userCount)
    })
    
    console.log('📊 총 100명의 투자자 데이터 생성 완료!')
    console.log('⏳ VIP 자동 승격 시스템 3초 후 실행...')
    
    // VIP 자동 승격 시스템 실행 (약간의 지연 후)
    setTimeout(() => {
      checkAndPromoteToVIP()
    }, 3000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <div className="h-8 w-8 text-yellow-600 mr-3 flex items-center justify-center text-2xl">👑</div>
            VIP 관리 시스템
          </h2>
          <p className="mt-1 text-gray-600">
            상위 4명 투자자 자동 승격 및 중앙 대륙 관리
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleGenerateTestData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            기본 테스트 데이터
          </button>
          <button
            onClick={handleGenerateCustomTestData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            맞춤형 데이터 (100명)
          </button>
          <button
            onClick={handleManualPromotion}
            disabled={isPromoting}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all disabled:opacity-50"
          >
            {isPromoting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                승격 중...
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4 mr-2" />
                VIP 수동 승격
              </>
            )}
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-6 w-6 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-yellow-900">VIP 자동 승격 시스템</h3>
            <div className="mt-2 text-sm text-yellow-800 space-y-1">
              <p>• 전체 플랫폼에서 <strong>투자금 상위 4명</strong>을 자동으로 중앙 대륙(VIP 영역)으로 승격</p>
              <p>• 지분율 변경 시 실시간으로 재계산하여 <strong>즉시 대륙 재구성</strong></p>
              <p>• 중앙 대륙 크기에 따라 <strong>다른 대륙들의 위치 동적 조정</strong></p>
              <p>• 기존 중앙 대륙 투자자들은 자동으로 다른 대륙에 재배치</p>
            </div>
            {lastPromotionTime && (
              <p className="mt-3 text-sm text-yellow-700">
                마지막 승격: {formatTime(lastPromotionTime)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">현재 VIP 인원</p>
              <p className="text-2xl font-bold text-gray-900">{centerInvestors.length}</p>
              <p className="text-sm text-gray-600">/ 4명 (최적)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">VIP 총 투자금</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(continents.center.totalInvestment)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPinIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">중앙 대륙 크기</p>
              {centerBounds ? (
                <p className="text-2xl font-bold text-gray-900">
                  {centerBounds.maxX - centerBounds.minX} × {centerBounds.maxY - centerBounds.minY}
                </p>
              ) : (
                <p className="text-2xl font-bold text-gray-500">-</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current VIP Members */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <div className="h-5 w-5 text-yellow-600 mr-2 flex items-center justify-center">👑</div>
            현재 VIP 멤버들 (중앙 대륙)
          </h3>
        </div>
        <div className="overflow-hidden">
          {centerInvestors.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl text-gray-400 mx-auto mb-4">👑</div>
              <p className="text-gray-500">현재 VIP 멤버가 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">테스트 데이터를 생성하고 VIP 승격을 실행해보세요</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {centerInvestors.map((investor, index) => (
                <div key={investor.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center text-white text-lg">
                        👑
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{investor.name}</div>
                      <div className="text-sm text-gray-500">VIP #{index + 1}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(investor.investment)}
                    </div>
                    <div className="text-sm text-gray-500">{investor.currentContinent}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Investors (Candidates) */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">전체 투자자 순위 (VIP 후보)</h3>
          <p className="text-sm text-gray-600 mt-1">상위 4명이 자동으로 VIP 영역으로 승격됩니다</p>
        </div>
        <div className="overflow-hidden">
          {topInvestors.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">투자자 데이터가 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">테스트 데이터를 생성해주세요</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {topInvestors.map((investor) => (
                <div key={investor.id} className={`px-6 py-4 flex items-center justify-between ${
                  investor.rank <= 4 ? 'bg-yellow-50' : ''
                }`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${
                        investor.rank <= 4 
                          ? 'bg-gradient-to-br from-yellow-500 to-orange-600' 
                          : 'bg-gray-400'
                      }`}>
                        {investor.rank}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{investor.name}</div>
                      <div className="text-sm text-gray-500">
                        {investor.rank <= 4 ? '🏆 VIP 후보' : '일반 투자자'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(investor.investment)}
                    </div>
                    <div className="text-sm text-gray-500">{investor.currentContinent}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 