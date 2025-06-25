import { useMemo, useState, memo } from 'react'
import { useContinentStore, type ContinentId } from '@/store/continentStore'
import { useInvestorStore, type Investor } from "@/store/investorsStore";
import {Continent} from "@/api/server/supabase/types/Continents";
import {Player} from "@/api/server/supabase/types/Players";

interface RankingData {
    id: string
    name?: string
    investmentAmount: number
    sharePercentage: number
    continentId: ContinentId
    continentName: string
    dailyViews: number[]
}

function RankingModal({
    continentList,
    playerList,
    onClose
}: {
    continentList: Continent[],
    playerList: Player[],
    onClose: () => void
}) {
    const [activeTab, setActiveTab] = useState<'stake' | 'views'>('stake');
    const [selectedContinentId, setSelectedContinentId] = useState<ContinentId | null>(null);

    const continentInfoMap = useMemo(() => {
        return new Map(continentList.map((continent) => {
            return [
                continent.id,
                {
                    name: continent.name,
                    color: continent.color,
                    totalInvestment: playerList.filter((player: Player) => {
                        return player.continent_id === continent.id
                    }).reduce((acc, player) => {
                        return acc + player.investment_amount
                    }, 0)
                }
            ]
        }))
    }, [continentList, playerList])

    const rankingDataList: RankingData[] = useMemo(() => {
        return playerList.map((player: Player) => {
            const continentInfo = continentInfoMap.get(player.continent_id);

            const continentName = continentInfo?.name ?? "-"
            const totalInvestment = continentInfo?.totalInvestment ?? 0;

            return {
                id: player.id,
                name: player.name,
                investmentAmount: player.investment_amount,
                sharePercentage: (player.investment_amount / totalInvestment) * 100,
                continentId: player.continent_id,
                continentName: continentName,
                dailyViews: player.daily_views || [0, 0, 0, 0, 0, 0, 0]
            }
        })
    }, [playerList, continentInfoMap]);

    const filteredRankingDataList = useMemo(() => {
        return selectedContinentId
            ? rankingDataList.filter((rankingItem) => rankingItem.continentId === selectedContinentId)
            : rankingDataList;
    }, [rankingDataList, selectedContinentId]);

    const rankingItemList = useMemo(() => {
        const getTotalViewCount = (dailyViews: number[]) => {
            return dailyViews.reduce((acc, dailyView) => acc + dailyView, 0);
        }

        return filteredRankingDataList.sort((a, b) => {
            return activeTab === "stake"
                ? b.investmentAmount - a.investmentAmount
                : getTotalViewCount(b.dailyViews) - getTotalViewCount(a.dailyViews);
        })
    }, [activeTab, filteredRankingDataList]);

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
                                    onClick={() => setSelectedContinentId(null)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                        !selectedContinentId
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    All Continents
                                </button>
                                {continentList.map((continent) => (
                                    <button
                                        key={continent.id}
                                        onClick={() => setSelectedContinentId(continent.id)}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center space-x-2 ${
                                            selectedContinentId === continent.id
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
                                    onClick={() => setActiveTab('stake')}
                                    className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                                        activeTab === 'stake'
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
                            {rankingItemList.map((investor, index) => (
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
                                                    style={{ backgroundColor: continentInfoMap.get(investor.continentId)?.color }}
                                                />
                                                <span className="text-gray-400">{investor.continentName}</span>
                                            </div>
                                        </div>
                                        <div className="mt-1 flex items-center space-x-4 text-sm">
                                            <div className="text-green-400">
                                                ${investor.investmentAmount.toLocaleString()}
                                            </div>
                                            <div className="text-blue-400">
                                                {investor.sharePercentage.toFixed(2)}%
                                            </div>
                                            <div className="text-purple-400">
                                                {investor.dailyViews.reduce((acc, dailyView) => {
                                                    return acc + dailyView
                                                }, 0).toLocaleString()} views
                                            </div>
                                        </div>
                                    </div>

                                    {/* 추세 */}
                                    <div className="hidden sm:flex items-end space-x-1 h-8">
                                        {investor.dailyViews.map((views, i) => {
                                            const maxViews = Math.max(...investor.dailyViews, 1)
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

                            {rankingItemList.length === 0 && (
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

export default memo(RankingModal);