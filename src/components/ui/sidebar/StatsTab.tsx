import {memo, useMemo} from "react";

function StatsTab({
    isUserInvestmentInfoExist,
    dailyViews
} : {
    isUserInvestmentInfoExist: boolean,
    dailyViews: number[]
}) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const totalView = useMemo(() => {
        return dailyViews.reduce((acc, dailyView) => acc + dailyView, 0);
    }, [dailyViews]);
    const averageDailyView = useMemo(() => {
        return totalView / dailyViews.length;
    }, [totalView, dailyViews]);

    const currentDayOfWeek = useMemo(() => {
        const day = new Date().getDay();

        return day === 0
            ? 7
            : day
    }, [])

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">View Statistics</h3>

            {isUserInvestmentInfoExist ? (
                <>
                    {/* Weekly Views Trend */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-white mb-4">Weekly Views Trend</h4>

                        {/* Table Header */}
                        <div className="grid grid-cols-3 gap-4 pb-3 border-b border-gray-700 mb-3">
                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Day</div>
                            <div
                                className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Views
                            </div>
                            <div
                                className="text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Change
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="space-y-3">
                            {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                                // 요일명 계산 (월~일)
                                const views = dailyViews[dayOfWeek]
                                // 변화량 계산 (오늘-어제 등)
                                const change = dayOfWeek > 0
                                    ? dailyViews[dayOfWeek] - dailyViews[dayOfWeek - 1]
                                    : null;
                                const today = days[dayOfWeek];
                                const shortToday = shortDays[dayOfWeek];
                                const isToday = dayOfWeek === 0
                                const isPast = dayOfWeek < 0
                                const isFuture = dayOfWeek > 0
                                const changeColor = change !== null && change >= 0 ? 'text-green-400' : 'text-red-400'
                                const changeIcon = change !== null ? (change >= 0 ? '↗' : '↘') : ''
                                return (
                                    <div key={shortToday}
                                         className={`grid grid-cols-3 gap-4 py-2 px-3 rounded-lg transition-all duration-200 ${
                                             isToday
                                                 ? 'bg-purple-500/20 border border-purple-500/30'
                                                 : isPast
                                                     ? 'hover:bg-gray-700/50'
                                                     : 'opacity-60'
                                         }`}>
                                        <div className="flex items-center">
                                            <span
                                                className={`font-medium ${isToday ? 'text-purple-300' : isFuture ? 'text-gray-500' : 'text-white'}`}>{today}</span>
                                        </div>
                                        <div className="text-right">
                                            {views !== null ? (
                                                <span
                                                    className={`text-lg font-semibold ${isToday ? 'text-purple-300' : 'text-gray-200'}`}>{views.toLocaleString()}</span>
                                            ) : (
                                                <span className="text-lg font-semibold text-gray-500">-</span>
                                            )}
                                        </div>
                                        <div className="text-right flex items-center justify-end space-x-1">
                                            {change !== null ? (
                                                <>
                                                    <span
                                                        className={`text-sm font-medium ${changeColor}`}>{change > 0 ? '+' : ''}{change}</span>
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
                                <span
                                    className="text-white font-semibold">{totalView} views</span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-gray-400">Daily Average</span>
                                <span
                                    className="text-purple-400 font-semibold">{averageDailyView.toFixed(0)} views</span>
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
                                <span
                                    className="text-white">{dailyViews[currentDayOfWeek]} views</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">This Week</span>
                                <span
                                    className="text-purple-400">{totalView} views</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Daily Average</span>
                                <span
                                    className="text-blue-400">{averageDailyView} views</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Peak Day</span>
                                <span
                                    className="text-yellow-400">{Math.max(...dailyViews)} views</span>
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
    )
}

export default memo(StatsTab);