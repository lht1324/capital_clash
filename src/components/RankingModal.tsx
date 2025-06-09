import { useState } from 'react'
import { useContinentStore, type ContinentId } from '@/store/continentStore'

interface RankingModalProps {
  isOpen: boolean
  onClose: () => void
}

interface RankingItem {
  id: string
  name: string
  investment: number
  sharePercentage: number
  continentId: ContinentId
  continentName: string
  view_count: number
  daily_views: number[]
}

export default function RankingModal({ isOpen, onClose }: RankingModalProps) {
  const [activeTab, setActiveTab] = useState<'investment' | 'views'>('investment')
  const [selectedContinent, setSelectedContinent] = useState<ContinentId | null>(null)
  const { continents } = useContinentStore()

  // 모든 투자자 데이터 수집 및 정렬
  const getAllInvestors = () => {
    const investors: RankingItem[] = []

    Object.entries(continents).forEach(([continentId, continent]) => {
      Object.entries(continent.investors).forEach(([id, investor]) => {
        investors.push({
          id,
          name: investor.name,
          investment: investor.investment,
          sharePercentage: (investor.investment / continent.totalInvestment) * 100,
          continentId: continentId as ContinentId,
          continentName: continent.name,
          view_count: investor.view_count || 0,
          daily_views: investor.daily_views || [0,0,0,0,0,0,0]
        })
      })
    })

    return investors
  }

  // 대륙별 투자자 필터링
  const getFilteredInvestors = () => {
    const investors = getAllInvestors()
    
    if (selectedContinent) {
      return investors.filter(investor => investor.continentId === selectedContinent)
    }
    
    return investors
  }

  // 투자금액 기준 정렬
  const getInvestmentRanking = () => {
    return getFilteredInvestors().sort((a, b) => b.investment - a.investment)
  }

  // 조회수 기준 정렬
  const getViewsRanking = () => {
    return getFilteredInvestors().sort((a, b) => b.view_count - a.view_count)
  }

  // 대륙 옵션
  const continentOptions = [
    { id: 'northwest' as ContinentId, name: 'Northwest', color: '#3B82F6' },
    { id: 'northeast' as ContinentId, name: 'Northeast', color: '#EF4444' },
    { id: 'southwest' as ContinentId, name: 'Southwest', color: '#10B981' },
    { id: 'southeast' as ContinentId, name: 'Southeast', color: '#F59E0B' }
  ]

  if (!isOpen) return null

  const rankingData = activeTab === 'investment' ? getInvestmentRanking() : getViewsRanking()

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-start justify-center pt-20 p-4"
        onClick={onClose}
      >
        {/* 모달 콘텐츠 */}
        <div 
          className="bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl max-h-[calc(100vh-6rem)] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">🏆 Leaderboard</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          {/* 필터 및 탭 */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* 대륙 필터 */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedContinent(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    !selectedContinent
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All Continents
                </button>
                {continentOptions.map((continent) => (
                  <button
                    key={continent.id}
                    onClick={() => setSelectedContinent(continent.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center space-x-2 ${
                      selectedContinent === continent.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: continent.color }}
                    />
                    <span>{continent.name}</span>
                  </button>
                ))}
              </div>

              {/* 정렬 기준 탭 */}
              <div className="flex bg-gray-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('investment')}
                  className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                    activeTab === 'investment'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  💰 Investment
                </button>
                <button
                  onClick={() => setActiveTab('views')}
                  className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                    activeTab === 'views'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  👀 Views
                </button>
              </div>
            </div>
          </div>

          {/* 랭킹 목록 */}
          <div className="p-6">
            <div className="space-y-3">
              {rankingData.map((investor, index) => (
                <div
                  key={investor.id}
                  className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4"
                >
                  {/* 순위 */}
                  <div className="w-12 text-center">
                    {index === 0 ? (
                      <span className="text-2xl">🥇</span>
                    ) : index === 1 ? (
                      <span className="text-2xl">🥈</span>
                    ) : index === 2 ? (
                      <span className="text-2xl">🥉</span>
                    ) : (
                      <span className="text-xl font-bold text-gray-400">#{index + 1}</span>
                    )}
                  </div>

                  {/* 투자자 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{investor.name}</span>
                      <div className="flex items-center space-x-1 text-sm">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: continentOptions.find(c => c.id === investor.continentId)?.color }}
                        />
                        <span className="text-gray-400">{investor.continentName}</span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm">
                      <div className="text-green-400">
                        ${investor.investment.toLocaleString()}
                      </div>
                      <div className="text-blue-400">
                        {investor.sharePercentage.toFixed(2)}%
                      </div>
                      <div className="text-purple-400">
                        {investor.view_count.toLocaleString()} views
                      </div>
                    </div>
                  </div>

                  {/* 추세 */}
                  <div className="hidden sm:flex items-end space-x-1 h-8">
                    {investor.daily_views.map((views, i) => {
                      const maxViews = Math.max(...investor.daily_views, 1)
                      const height = (views / maxViews) * 100
                      
                      return (
                        <div
                          key={i}
                          className="w-1 bg-blue-500 rounded-t"
                          style={{
                            height: `${height}%`,
                            opacity: i === 6 ? 0.8 : 0.3
                          }}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}

              {rankingData.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🏆</div>
                  <h3 className="text-lg font-medium text-white mb-2">No Data Available</h3>
                  <p className="text-gray-400">There are no investors in the selected continent yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 