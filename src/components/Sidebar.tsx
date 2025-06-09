'use client'

import { useState } from 'react'
import { useContinentStore, type ContinentId } from '@/store/continentStore'
import PurchaseTileModal from './PurchaseTileModal'
import ImageUploadModal from './ImageUploadModal'
import { getCurrentUserTileInfo } from '@/utils/userUtils'

interface MyTile {
  id: string
  continentId: string
  continentName: string
  investment: number
  sharePercentage: number
  tilePosition?: { x: number, y: number, size: number }
  imageStatus?: 'none' | 'pending' | 'approved' | 'rejected'
  createdDate: string
  view_count?: number
  daily_views?: number[]
}

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tile' | 'stats'>('overview')
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false)
  const [imageStatus, setImageStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('pending')

  // 각 대륙별 현재 유저 수 계산
  const { continents, addInvestor, isSidebarOpen, setSidebarOpen } = useContinentStore()

  // 현재 사용자의 영역 정보 가져오기
  const userTileInfo = getCurrentUserTileInfo(continents)

  const getContinentUserCount = (continentId: string) => {
    const continent = continents[continentId as keyof typeof continents]
    return Object.keys(continent?.investors || {}).length
  }

  // 현재 사용자의 영역 정보 (실제 데이터 사용)
  const myTile = userTileInfo.hasExistingTile ? {
    id: userTileInfo.investorId ?? '',
    continentId: userTileInfo.continentId ?? '',
    continentName: continents[userTileInfo.continentId as keyof typeof continents]?.name || '',
    investment: userTileInfo.investment ?? 0,
    sharePercentage: userTileInfo.share ? userTileInfo.share * 100 : 0,
    tilePosition: userTileInfo.tilePosition,
    imageStatus: userTileInfo.imageStatus,
    createdDate: userTileInfo.createdDate ?? '',
    view_count: userTileInfo.view_count ?? 0,
    daily_views: userTileInfo.daily_views ?? [0,0,0,0,0,0,0]
  } : null

  const avgDailyReturn = 12.5
  const currentRank = 15
  const monthlyGrowth = 18.5

  const getImageStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'text-green-400'
      case 'pending': return 'text-yellow-400'
      case 'rejected': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getImageStatusText = (status?: string) => {
    switch (status) {
      case 'approved': return '✅ 승인됨'
      case 'pending': return '⏳ 검토중'
      case 'rejected': return '❌ 거절됨'
      default: return '📷 이미지 없음'
    }
  }

  // Handle territory purchase
  const handlePurchase = async (continentId: ContinentId, amount: number) => {
    console.log(`🛒 Territory purchase from sidebar: ${continentId}, $${amount.toLocaleString()}`)
    try {
      await addInvestor(continentId, {
        id: `investor_${Date.now()}`,
        name: `투자자_${Math.floor(Math.random() * 10000)}`,
        investment: amount,
        imageStatus: 'none',
        profileInfo: { description: '' },
      })
      alert(`🎉 Investment of $${amount.toLocaleString()} in ${continentId} continent completed!`)
    } catch (error) {
      console.error('투자 실패:', error)
      alert('❌ Investment failed. Please try again.')
    }
  }

  // Handle additional investment
  const handleAdditionalInvestment = async (amount: number) => {
    if (!userTileInfo.continentId) return
    console.log(`💰 Additional investment from sidebar: ${userTileInfo.continentId}, $${amount.toLocaleString()}`)
    try {
      await addInvestor(userTileInfo.continentId, {
        id: `investor_${Date.now()}`,
        name: `추가투자_${Math.floor(Math.random() * 10000)}`,
        investment: amount,
        imageStatus: 'none',
        profileInfo: { description: '' },
      })
      alert(`💰 Additional investment of $${amount.toLocaleString()} in ${userTileInfo.continentId} continent completed!`)
    } catch (error) {
      console.error('추가 투자 실패:', error)
      alert('❌ Additional investment failed. Please try again.')
    }
  }

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    console.log(`🖼️ Image uploaded: ${file.name}, Size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`)

    try {
      // TODO: Supabase Storage에 이미지 업로드
      // TODO: 업로드된 이미지 URL을 투자자 정보에 저장
      alert(`✅ Image "${file.name}" uploaded successfully! Your image is now under review.`)
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      alert('❌ Image upload failed. Please try again.')
    }
  }

  // Test function to cycle through different image states
  const cycleImageStatus = () => {
    const statusCycle = ['none', 'pending', 'approved', 'rejected'] as const
    const currentIndex = statusCycle.indexOf(imageStatus)
    const nextIndex = (currentIndex + 1) % statusCycle.length
    const nextStatus = statusCycle[nextIndex]

    setImageStatus(nextStatus)
    alert(`Status changed to: ${nextStatus}`)
  }

  return (
      <>
        {/* 사이드바 토글 버튼 - 오른쪽으로 이동 */}
        <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className={`fixed top-20 z-20 bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-l-lg border border-r-0 border-gray-700 transition-all duration-300 flex items-center gap-2 ${
                isSidebarOpen ? 'right-80' : 'right-0'
            }`}
        >
          <span className="text-sm font-medium">My Info</span>
          <svg
              className={`w-5 h-5 transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 사이드바 - 오른쪽으로 이동 */}
        <div
            className={`fixed top-16 right-0 h-[calc(100vh-4rem)] bg-gray-900 border-l border-gray-700 z-20 transition-transform duration-300 ${
                isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            style={{ width: '320px' }}
        >
          <div className="flex flex-col h-full">
            {/* 탭 헤더 */}
            <div className="flex border-b border-gray-700">
              <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'overview'
                          ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
              >
                📊 개요
              </button>
              <button
                  onClick={() => setActiveTab('tile')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'tile'
                          ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
              >
                🎯 My Territory
              </button>
              <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'stats'
                          ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
              >
                📈 통계
              </button>
            </div>

            {/* 탭 내용 */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Investment Status</h3>

                    {myTile ? (
                        <>
                          {/* 전체 요약 */}
                          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Investment</span>
                              <span className="text-xl font-bold text-green-400">${myTile.investment.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Share</span>
                              <span className="text-lg font-semibold text-blue-400">{myTile.sharePercentage.toFixed(1)}%</span>
                            </div>
                            {userTileInfo.rank && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">현재 순위</span>
                                  <span className="text-lg font-semibold text-white">#{userTileInfo.rank}위</span>
                                </div>
                            )}
                            {userTileInfo.dailyReturn && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">일평균 수익</span>
                                  <span className="text-lg font-semibold text-green-400">+₩{userTileInfo.dailyReturn.toLocaleString()}</span>
                                </div>
                            )}
                          </div>

                          {/* 현재 영역 정보 */}
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-white mb-3">Current Territory</h4>

                            {/* Current Image Preview */}
                            {myTile.imageStatus !== 'none' && (
                                <div className="mb-4 p-3 rounded-lg bg-gray-700">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-white">Territory Image</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getImageStatusColor(myTile.imageStatus)}`}>
                                {myTile.imageStatus === 'pending' ? '🔄 Review' :
                                    myTile.imageStatus === 'approved' ? '✅ Live' :
                                        '❌ Rejected'}
                              </span>
                                  </div>

                                  <div className="aspect-square bg-gray-600 rounded-lg overflow-hidden mb-2">
                                    {myTile.imageStatus === 'approved' ? (
                                        <img
                                            src="/test.jpg"
                                            alt="Territory Image"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : myTile.imageStatus === 'pending' ? (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                          <div className="text-center">
                                            <div className="text-2xl mb-2">🔄</div>
                                            <div className="text-xs">Under Review</div>
                                          </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                          <div className="text-center">
                                            <div className="text-2xl mb-2">❌</div>
                                            <div className="text-xs">Rejected</div>
                                          </div>
                                        </div>
                                    )}
                                  </div>

                                  <button
                                      onClick={() => setIsImageUploadModalOpen(true)}
                                      className="w-full text-xs bg-gray-600 hover:bg-gray-500 text-white py-1 px-2 rounded transition-colors"
                                  >
                                    {myTile.imageStatus === 'approved' ? 'Replace' :
                                        myTile.imageStatus === 'pending' ? 'Upload New' :
                                            'Upload New'}
                                  </button>
                                </div>
                            )}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-300">대륙</span>
                                <span className="text-white font-medium">{myTile.continentName}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-300">위치</span>
                                <span className="text-white">({myTile.tilePosition?.x}, {myTile.tilePosition?.y})</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-300">크기</span>
                                <span className="text-white">{myTile.tilePosition?.size}×{myTile.tilePosition?.size}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-300">이미지 상태</span>
                                <span className={getImageStatusColor(myTile.imageStatus)}>
                            {getImageStatusText(myTile.imageStatus)}
                          </span>
                              </div>
                            </div>
                          </div>
                        </>
                    ) : (
                        /* 영역이 없는 경우 */
                        <div className="bg-gray-800 rounded-lg p-6 text-center">
                          <div className="text-4xl mb-4">🎯</div>
                          <h4 className="text-lg font-semibold text-white mb-2">영역이 없습니다</h4>
                          <p className="text-gray-400 mb-4">Start your investment by purchasing your first territory!</p>
                          <button
                              onClick={() => setIsPurchaseModalOpen(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            {userTileInfo.hasExistingTile ? 'Additional Investment' : 'Territory Purchase'}
                          </button>
                        </div>
                    )}
                  </div>
              )}

              {activeTab === 'tile' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Territory Management</h3>

                    {myTile ? (
                        <>
                          {/* 현재 영역 상세 정보 */}
                          <div className="bg-gray-800 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium text-white text-lg">{myTile.continentName}</h4>
                                <p className="text-sm text-gray-400">
                                  위치: ({myTile.tilePosition?.x}, {myTile.tilePosition?.y})
                                </p>
                                <p className="text-sm text-gray-400">
                                  크기: {myTile.tilePosition?.size}×{myTile.tilePosition?.size} 셀
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-green-400 font-medium text-lg">${myTile.investment.toLocaleString()}</div>
                                <div className="text-blue-400 text-sm">{myTile.sharePercentage.toFixed(1)}% Share</div>
                              </div>
                            </div>

                            <div className="border-t border-gray-700 pt-3 mt-3">
                              <div className="flex justify-between items-center mb-3">
                          <span className={`text-sm ${getImageStatusColor(myTile.imageStatus)}`}>
                            {getImageStatusText(myTile.imageStatus)}
                          </span>
                                <span className="text-xs text-gray-400">생성일: {myTile.createdDate}</span>
                              </div>

                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                      onClick={cycleImageStatus}
                                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors"
                                  >
                                    Test Status 🔄
                                  </button>
                                  <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition-colors">
                                    View 👁️
                                  </button>
                                </div>
                                <button
                                    onClick={() => setIsImageUploadModalOpen(true)}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-sm transition-colors flex items-center justify-center space-x-2"
                                >
                                  <span>📷</span>
                                  <span>Upload Image</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* 영역 업그레이드 옵션 */}
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-white mb-3">Territory Upgrade</h4>
                            <p className="text-sm text-gray-400 mb-3">
                              Increase your territory size and secure higher share percentage with additional investment.
                            </p>
                            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
                              + Add Investment
                            </button>
                          </div>

                          {/* 영역 이전 옵션 */}
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-white mb-3">Continent Transfer</h4>
                            <p className="text-sm text-gray-400 mb-3">
                              You can transfer to another continent with your current investment amount.
                            </p>

                            {/* X 모양 대륙 현황 */}
                            <div className="space-y-2 mb-3">
                              {[
                                { id: 'northwest', name: '북서방 대륙', color: 'bg-blue-600' },
                                { id: 'northeast', name: '북동방 대륙', color: 'bg-red-600' },
                                { id: 'southwest', name: '남서방 대륙', color: 'bg-green-600' },
                                { id: 'southeast', name: '남동방 대륙', color: 'bg-orange-600' }
                              ].map((continent) => {
                                const currentCount = getContinentUserCount(continent.id)
                                const isFull = currentCount >= 50
                                const isCurrentContinent = myTile?.continentId === continent.id

                                return (
                                    <button
                                        key={continent.id}
                                        disabled={isFull || isCurrentContinent}
                                        className={`w-full ${continent.color} ${
                                            isFull || isCurrentContinent
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:opacity-90'
                                        } text-white p-3 rounded-lg transition-all flex justify-between items-center`}
                                    >
                              <span className="font-medium">
                                {continent.name}
                                {isCurrentContinent && ' (현재)'}
                              </span>
                                      <span className={`text-sm ${isFull ? 'text-red-200' : 'text-white'}`}>
                                {currentCount}/50
                              </span>
                                    </button>
                                )
                              })}
                            </div>

                            <div className="text-xs text-gray-400 text-center">
                              빨간색 표시는 인원이 가득 찬 대륙입니다
                            </div>
                          </div>
                        </>
                    ) : (
                        /* 영역이 없는 경우 */
                        <div className="space-y-4">
                          <div className="bg-gray-800 rounded-lg p-6 text-center">
                            <div className="text-4xl mb-4">🎯</div>
                            <h4 className="text-lg font-semibold text-white mb-2">No Territory Owned</h4>
                            <p className="text-gray-400 mb-4">
                              Choose a continent and purchase your first territory to begin!
                            </p>
                          </div>

                          {/* 대륙 선택 옵션 */}
                          <div className="space-y-2">
                            {[
                              { id: 'northwest', name: '북서방 대륙', color: 'bg-blue-600', price: '₩100,000' },
                              { id: 'northeast', name: '북동방 대륙', color: 'bg-red-600', price: '₩90,000' },
                              { id: 'southwest', name: '남서방 대륙', color: 'bg-green-600', price: '₩80,000' },
                              { id: 'southeast', name: '남동방 대륙', color: 'bg-orange-600', price: '₩70,000' }
                            ].map((continent) => {
                              const currentCount = getContinentUserCount(continent.id)
                              const isFull = currentCount >= 50

                              return (
                                  <button
                                      key={continent.id}
                                      onClick={() => !isFull && setIsPurchaseModalOpen(true)}
                                      disabled={isFull}
                                      className={`w-full ${continent.color} ${
                                          isFull ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                                      } text-white p-3 rounded-lg transition-all`}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-medium">{continent.name}</span>
                                      <div className="text-right">
                                        <div className="text-sm">{continent.price}부터</div>
                                        <div className={`text-xs ${isFull ? 'text-red-200' : 'text-white/80'}`}>
                                          {currentCount}/50
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                              )
                            })}
                          </div>
                        </div>
                    )}
                  </div>
              )}

              {activeTab === 'stats' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">조회수 통계</h3>

                    {myTile ? (
                        <>
                          {/* Weekly Views Trend */}
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-white mb-4">Weekly Views Trend</h4>

                            {/* Table Header */}
                            <div className="grid grid-cols-3 gap-4 pb-3 border-b border-gray-700 mb-3">
                              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Day</div>
                              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Views</div>
                              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Change</div>
                            </div>

                            {/* Table Body */}
                            <div className="space-y-3">
                              {[0,1,2,3,4,5,6].map((index) => {
                                // 요일명 계산 (월~일)
                                const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
                                const shorts = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
                                const views = myTile.daily_views?.[index] ?? null
                                // 변화량 계산 (오늘-어제 등)
                                const change = index > 0 && myTile.daily_views ? (myTile.daily_views[index] - myTile.daily_views[index-1]) : null
                                const isToday = index === 0
                                const isPast = index < 0
                                const isFuture = index > 0
                                const changeColor = change !== null && change >= 0 ? 'text-green-400' : 'text-red-400'
                                const changeIcon = change !== null ? (change >= 0 ? '↗' : '↘') : ''
                                return (
                                    <div key={shorts[index]} className={`grid grid-cols-3 gap-4 py-2 px-3 rounded-lg transition-all duration-200 ${isToday ? 'bg-purple-500/20 border border-purple-500/30' : isPast ? 'hover:bg-gray-700/50' : 'opacity-60'}`}>
                                      <div className="flex items-center">
                                        <span className={`font-medium ${isToday ? 'text-purple-300' : isFuture ? 'text-gray-500' : 'text-white'}`}>{days[index]}</span>
                                      </div>
                                      <div className="text-right">
                                        {views !== null ? (
                                            <span className={`text-lg font-semibold ${isToday ? 'text-purple-300' : 'text-gray-200'}`}>{views.toLocaleString()}</span>
                                        ) : (
                                            <span className="text-lg font-semibold text-gray-500">-</span>
                                        )}
                                      </div>
                                      <div className="text-right flex items-center justify-end space-x-1">
                                        {change !== null ? (
                                            <>
                                              <span className={`text-sm font-medium ${changeColor}`}>{change > 0 ? '+' : ''}{change}</span>
                                              <span className={`text-xs ${changeColor}`}>{changeIcon}</span>
                                            </>
                                        ) : (
                                            <span className="text-sm font-medium text-gray-500">-</span>
                                        )}
                                      </div>
                                    </div>
                                )
                              })}
                            </div>

                            {/* Summary */}
                            <div className="mt-4 pt-3 border-t border-gray-700">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Current Total</span>
                                <span className="text-white font-semibold">{myTile.view_count?.toLocaleString() ?? 0} views</span>
                              </div>
                              <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-gray-400">Daily Average</span>
                                <span className="text-purple-400 font-semibold">{myTile.daily_views ? Math.round(myTile.daily_views.reduce((a,b)=>a+b,0)/myTile.daily_views.length) : 0} views</span>
                              </div>
                            </div>
                          </div>

                          {/* Views Metrics */}
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-white mb-3">Views Metrics</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-purple-400">{/* 월간 성장률 등은 추후 구현 */}+0.0%</div>
                                <div className="text-xs text-gray-400">Monthly Growth</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-400">{/* 조회수 랭킹 등은 추후 구현 */}#-</div>
                                <div className="text-xs text-gray-400">Views Rank</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">7 Days</div>
                                <div className="text-xs text-gray-400">Streak Up</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-400">🔥 Hot</div>
                                <div className="text-xs text-gray-400">Popularity</div>
                              </div>
                            </div>
                          </div>

                          {/* Views Analytics */}
                          <div className="bg-gray-800 rounded-lg p-4">
                            <h4 className="text-md font-semibold text-white mb-3">Views Analytics</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Today</span>
                                <span className="text-white">{myTile.daily_views?.[0]?.toLocaleString() ?? 0} views</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">vs Yesterday</span>
                                <span className="text-green-400">
                            {(() => {
                              // 안전하게 diff 계산
                              const diff =
                                  (myTile.daily_views?.[0] ?? 0) - (myTile.daily_views?.[1] ?? 0);

                              return `${diff > 0 ? '+' : ''}${diff}`;
                            })()} views
                          </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">This Week</span>
                                <span className="text-purple-400">{myTile.daily_views ? myTile.daily_views.reduce((a,b)=>a+b,0) : 0} views</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Daily Average</span>
                                <span className="text-blue-400">{myTile.daily_views ? Math.round(myTile.daily_views.reduce((a,b)=>a+b,0)/myTile.daily_views.length) : 0} views</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Peak Day</span>
                                <span className="text-yellow-400">{myTile.daily_views ? Math.max(...myTile.daily_views) : 0} views</span>
                              </div>
                            </div>
                          </div>
                        </>
                    ) : (
                        /* 영역이 없는 경우 */
                        <div className="bg-gray-800 rounded-lg p-6 text-center">
                          <div className="text-4xl mb-4">📊</div>
                          <h4 className="text-lg font-semibold text-white mb-2">No View Statistics</h4>
                          <p className="text-gray-400">Purchase a territory to view statistics.</p>
                        </div>
                    )}
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* 영역 구매 모달 */}
        <PurchaseTileModal
            isOpen={isPurchaseModalOpen}
            onClose={() => setIsPurchaseModalOpen(false)}
            onPurchase={handlePurchase}
            onAdditionalInvestment={handleAdditionalInvestment}
        />

        {/* 이미지 업로드 모달 */}
        <ImageUploadModal
            isOpen={isImageUploadModalOpen}
            onClose={() => setIsImageUploadModalOpen(false)}
            onUpload={handleImageUpload}
            currentImageStatus={myTile?.imageStatus}
        />
      </>
  )
}