'use client'

import { useState } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import PurchaseTileModal from '@/components/PurchaseTileModal'
import { useContinentStore, type ContinentId } from '@/store/continentStore'
import { getCurrentUserTileInfo } from '@/utils/userUtils'

interface UserProfile {
  id: string
  name: string
  email: string
  joinDate: string
  avatar?: string
  bio?: string
}

interface MyTile {
  id: string
  continentId: string
  continentName: string
  investment: number
  sharePercentage: number
  tilePosition?: { x: number, y: number, size: number }
  imageStatus?: 'none' | 'pending' | 'approved' | 'rejected'
  createdDate: string
  imageUrl?: string
}

interface Transaction {
  id: string
  date: string
  type: 'purchase' | 'upgrade' | 'transfer'
  amount: number
  description: string
  status: 'completed' | 'pending' | 'failed'
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'tile' | 'settings'>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  
  const { addInvestor, continents } = useContinentStore()
  
  // 현재 사용자의 영역 정보 확인
  const userTileInfo = getCurrentUserTileInfo(continents)

  // 현재 사용자 정보
  const user: UserProfile = {
    id: 'user_001',
    name: 'investor_01',
    email: 'investor01@example.com',
    joinDate: '2024-01-15',
    bio: '전략적 투자를 통해 안정적인 수익을 추구합니다.'
  }

  // 사용자의 단일 영역 정보
  const myTile: MyTile | null = {
    id: 'tile_1',
    continentId: 'northwest',
    continentName: '북서방 대륙',
    investment: 425000,
    sharePercentage: 6.6,
    tilePosition: { x: 0, y: 0, size: 18 },
    imageStatus: 'approved',
    createdDate: '2024-01-20',
    imageUrl: '/api/placeholder/400/300'
  }

  // 영역이 없는 경우 테스트
  // const myTile: MyTile | null = null

  // 투자 히스토리 (단일 영역 기준)
  const transactions: Transaction[] = [
    {
      id: 'tx_001',
      date: '2024-01-20',
      type: 'purchase',
      amount: 300000,
      description: '북서방 대륙 영역 최초 구매',
      status: 'completed'
    },
    {
      id: 'tx_002',
      date: '2024-01-25',
      type: 'upgrade',
      amount: 75000,
      description: '북서방 대륙 영역 업그레이드 (15×15 → 18×18)',
      status: 'completed'
    },
    {
      id: 'tx_003',
      date: '2024-02-01',
      type: 'upgrade',
      amount: 50000,
      description: '북서방 대륙 영역 추가 투자',
      status: 'completed'
    }
  ]

  const currentRank = 15
  const monthlyGrowth = 18.5
  const weeklyReturn = 320

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return '🛒'
      case 'upgrade': return '⬆️'
      case 'transfer': return '🔄'
      default: return '💰'
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'text-blue-400'
      case 'upgrade': return 'text-green-400'
      case 'transfer': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'pending': return 'text-yellow-400'
      case 'failed': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

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

  // 영역 구매 처리
  const handlePurchase = async (continentId: ContinentId, amount: number) => {
    console.log(`🛒 프로필에서 영역 구매: ${continentId}, $${amount.toLocaleString()}`)
    
    // 새로운 투자자 생성
    const newInvestor = {
      id: `investor_${Date.now()}`,
      name: `새 투자자 ${Math.floor(Math.random() * 1000)}`,
      investment: amount,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      imageUrl: '/test.jpg',
      ratio: 16/9,
      imageStatus: 'none' as const,
      profileInfo: {
        description: '새로운 투자자입니다.',
        website: '',
        contact: ''
      }
    }
    
    try {
      // 🔥 Supabase에 투자자 추가
      await addInvestor(continentId, newInvestor)
      alert(`🎉 ${continentId} 대륙에 $${amount.toLocaleString()} 투자가 완료되었습니다!`)
    } catch (error) {
      console.error('투자 실패:', error)
      alert('❌ 투자에 실패했습니다. 다시 시도해주세요.')
    }
  }

  // 추가 투자 처리
  const handleAdditionalInvestment = async (amount: number) => {
    if (!userTileInfo.continentId) return
    
    console.log(`💰 프로필에서 추가 투자: ${userTileInfo.continentId}, $${amount.toLocaleString()}`)
    
    const additionalInvestor = {
      id: `investor_${Date.now()}`,
      name: `추가 투자 ${Math.floor(Math.random() * 1000)}`,
      investment: amount,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      imageUrl: '/test.jpg',
      ratio: 16/9,
      imageStatus: 'none' as const,
      profileInfo: {
        description: '추가 투자입니다.',
        website: '',
        contact: ''
      }
    }
    
    try {
      await addInvestor(userTileInfo.continentId, additionalInvestor)
      alert(`💰 ${userTileInfo.continentId} 대륙에 $${amount.toLocaleString()} 추가 투자가 완료되었습니다!`)
    } catch (error) {
      console.error('추가 투자 실패:', error)
      alert('❌ 추가 투자에 실패했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 헤더 */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>홈으로 돌아가기</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold">프로필</h1>
          <div></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 사이드바 네비게이션 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-lg p-4 sticky top-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold">
                  {user.name[0].toUpperCase()}
                </div>
                <h2 className="text-lg font-semibold">{user.name}</h2>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  📊 개요
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'history'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  📈 투자 히스토리
                </button>
                <button
                  onClick={() => setActiveTab('tile')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'tile'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  🎯 내 영역
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  ⚙️ 설정
                </button>
              </nav>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 투자 요약 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6">
                    <div className="text-green-100 text-sm">총 투자금</div>
                    <div className="text-2xl font-bold text-white">
                      {myTile ? `₩${myTile.investment.toLocaleString()}` : '₩0'}
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6">
                    <div className="text-blue-100 text-sm">지분율</div>
                    <div className="text-2xl font-bold text-white">
                      {myTile ? `${myTile.sharePercentage.toFixed(1)}%` : '0%'}
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6">
                    <div className="text-purple-100 text-sm">현재 순위</div>
                    <div className="text-2xl font-bold text-white">
                      {myTile ? `#${currentRank}` : 'N/A'}
                    </div>
                  </div>
                </div>

                {myTile ? (
                  <>
                    {/* 현재 영역 정보 */}
                    <div className="bg-gray-900 rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">현재 영역</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-lg font-medium text-blue-400 mb-2">{myTile.continentName}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">위치:</span>
                              <span>({myTile.tilePosition?.x}, {myTile.tilePosition?.y})</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">크기:</span>
                              <span>{myTile.tilePosition?.size}×{myTile.tilePosition?.size} 셀</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">생성일:</span>
                              <span>{myTile.createdDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">이미지 상태:</span>
                              <span className={getImageStatusColor(myTile.imageStatus)}>
                                {getImageStatusText(myTile.imageStatus)}
                              </span>
                            </div>
                          </div>
                        </div>
                                                  <div className="bg-gray-800 rounded-lg p-4">
                            <div className="text-center text-4xl mb-2">🏢</div>
                            <div className="text-center text-gray-400 text-sm">영역 미리보기</div>
                          </div>
                      </div>
                    </div>

                    {/* 최근 성과 */}
                    <div className="bg-gray-900 rounded-lg p-6">
                      <h3 className="text-xl font-semibold mb-4">최근 성과</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">+{monthlyGrowth}%</div>
                          <div className="text-gray-400 text-sm">월간 수익률</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">₩{weeklyReturn.toLocaleString()}</div>
                          <div className="text-gray-400 text-sm">주간 수익</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">⭐ 4.2</div>
                          <div className="text-gray-400 text-sm">투자 등급</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* 영역이 없는 경우 */
                  <div className="bg-gray-900 rounded-lg p-8 text-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-2xl font-semibold text-white mb-2">아직 영역이 없습니다</h3>
                    <p className="text-gray-400 mb-6">
                      첫 번째 영역을 구매하여 Capital Clash에 참여하세요!
                    </p>
                    <button 
                      onClick={() => setIsPurchaseModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      {userTileInfo.hasExistingTile ? '추가 투자하기' : '영역 구매하기'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">투자 히스토리</h3>
                  
                  {myTile && transactions.length > 0 ? (
                    <>
                      {/* 투자 요약 */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-800 rounded-lg p-4">
                          <div className="text-gray-400 text-sm">총 거래 횟수</div>
                          <div className="text-xl font-bold">{transactions.length}회</div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                          <div className="text-gray-400 text-sm">총 투자금</div>
                          <div className="text-xl font-bold text-green-400">
                            ₩{transactions.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                          <div className="text-gray-400 text-sm">평균 거래액</div>
                          <div className="text-xl font-bold">
                            ₩{Math.round(transactions.reduce((sum, tx) => sum + tx.amount, 0) / transactions.length).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* 거래 내역 */}
                      <div className="space-y-3">
                        {transactions.map((tx) => (
                          <div key={tx.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{getTransactionIcon(tx.type)}</span>
                                <div>
                                  <div className="font-medium">{tx.description}</div>
                                  <div className="text-sm text-gray-400">{tx.date}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-bold ${getTransactionColor(tx.type)}`}>
                                  ₩{tx.amount.toLocaleString()}
                                </div>
                                <div className={`text-sm ${getStatusColor(tx.status)}`}>
                                  {tx.status === 'completed' ? '완료' : 
                                   tx.status === 'pending' ? '대기중' : '실패'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📈</div>
                      <h4 className="text-lg font-semibold text-white mb-2">투자 히스토리가 없습니다</h4>
                      <p className="text-gray-400">첫 번째 영역을 구매하여 투자를 시작하세요.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tile' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">영역 관리</h3>
                  
                  {myTile ? (
                    <>
                      {/* 현재 영역 상세 */}
                      <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-lg font-semibold text-blue-400 mb-4">{myTile.continentName}</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-400">투자금:</span>
                                <span className="font-medium text-green-400">₩{myTile.investment.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">지분율:</span>
                                <span className="font-medium text-blue-400">{myTile.sharePercentage.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">위치:</span>
                                <span>({myTile.tilePosition?.x}, {myTile.tilePosition?.y})</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">크기:</span>
                                <span>{myTile.tilePosition?.size}×{myTile.tilePosition?.size} 셀</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">생성일:</span>
                                <span>{myTile.createdDate}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">이미지 상태:</span>
                                <span className={getImageStatusColor(myTile.imageStatus)}>
                                  {getImageStatusText(myTile.imageStatus)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-6xl mb-2">🏢</div>
                              <div className="text-gray-400 text-sm">영역 미리보기</div>
                              <div className="text-gray-400 text-sm">{myTile.tilePosition?.size}×{myTile.tilePosition?.size}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 영역 관리 옵션 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-800 rounded-lg p-4">
                          <h5 className="font-medium text-white mb-2">영역 업그레이드</h5>
                          <p className="text-sm text-gray-400 mb-3">
                            추가 투자로 영역 크기를 늘리세요
                          </p>
                          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
                            + 추가 투자하기
                          </button>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                          <h5 className="font-medium text-white mb-2">대륙 이전</h5>
                          <p className="text-sm text-gray-400 mb-3">
                            다른 대륙으로 이전하세요
                          </p>
                          <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors">
                            🌍 대륙 변경
                          </button>
                        </div>
                      </div>

                      {/* 이미지 관리 */}
                      <div className="bg-gray-800 rounded-lg p-6">
                        <h5 className="font-medium text-white mb-4">영역 이미지 관리</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="bg-gray-700 rounded-lg p-4 mb-3">
                              <div className="text-center text-4xl">📷</div>
                              <div className="text-center text-sm text-gray-400 mt-2">현재 이미지</div>
                            </div>
                            <div className={`text-center text-sm ${getImageStatusColor(myTile.imageStatus)}`}>
                              {getImageStatusText(myTile.imageStatus)}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                              새 이미지 업로드
                            </button>
                            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors">
                              이미지 수정
                            </button>
                            <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors">
                              이미지 삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎯</div>
                      <h4 className="text-xl font-semibold text-white mb-2">영역이 없습니다</h4>
                      <p className="text-gray-400 mb-6">
                        원하는 대륙에 첫 번째 영역을 구매하여 시작하세요!
                      </p>
                      
                      {/* 대륙 선택 옵션 */}
                      <div className="max-w-md mx-auto space-y-3">
                        {[
                          { name: '북서방 대륙', color: 'bg-blue-600', price: '₩100,000' },
                          { name: '북동방 대륙', color: 'bg-red-600', price: '₩90,000' },
                          { name: '남서방 대륙', color: 'bg-green-600', price: '₩80,000' },
                          { name: '남동방 대륙', color: 'bg-orange-600', price: '₩70,000' },
                          { name: '중앙 대륙', color: 'bg-purple-600', price: '₩200,000' }
                        ].map((continent) => (
                          <button
                            key={continent.name}
                            className={`w-full ${continent.color} hover:opacity-90 text-white p-4 rounded-lg transition-all flex justify-between items-center`}
                          >
                            <span className="font-medium">{continent.name}</span>
                            <span className="text-sm">{continent.price}부터</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* 개인정보 */}
                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">개인정보</h3>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {isEditing ? '취소' : '편집'}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">사용자명</label>
                      {isEditing ? (
                        <input
                          type="text"
                          defaultValue={user.name}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <div className="text-white">{user.name}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">이메일</label>
                      {isEditing ? (
                        <input
                          type="email"
                          defaultValue={user.email}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <div className="text-white">{user.email}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">자기소개</label>
                      {isEditing ? (
                        <textarea
                          defaultValue={user.bio}
                          rows={3}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <div className="text-white">{user.bio || '자기소개가 없습니다.'}</div>
                      )}
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="flex space-x-3 mt-4">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                        저장
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  )}
                </div>

                {/* 알림 설정 */}
                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">알림 설정</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">투자 결과 알림</div>
                        <div className="text-sm text-gray-400">영역 거래 완료 시 알림을 받습니다</div>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">시장 업데이트</div>
                        <div className="text-sm text-gray-400">대륙별 시장 변동 소식을 받습니다</div>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">순위 변동 알림</div>
                        <div className="text-sm text-gray-400">내 순위가 변경될 때 알림을 받습니다</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 계정 관리 */}
                <div className="bg-gray-900 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">계정 관리</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors text-left">
                      비밀번호 변경
                    </button>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-left">
                      계정 연동 설정
                    </button>
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors text-left">
                      계정 삭제
                    </button>
                  </div>
                </div>
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
    </div>
  )
} 