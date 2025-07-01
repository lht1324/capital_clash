import {memo, useCallback, useMemo} from "react";
import {usePlayersStore} from "@/store/playersStore";
import {useUserStore} from "@/store/userStore";

function StatsTab() {
    const { playerList, getViewsRank } = usePlayersStore();
    const { user } = useUserStore();

    const userPlayerInfo = useMemo(() => {
        return playerList.find((player) => {
            return player.user_id === user?.id;
        }) ?? null;
    }, [playerList, user?.id]);

    const userDailyViews = useMemo(() => {
        return userPlayerInfo?.daily_views ?? [0, 0, 0, 0, 0, 0, 0];
    }, [userPlayerInfo?.daily_views]);

    const userViewsRank = useMemo(() => {
        return userPlayerInfo?.id
            ? getViewsRank(userPlayerInfo.id)
            : -1;
    }, [userPlayerInfo?.id, getViewsRank]);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const weeklyViews = useMemo(() => {
        return userDailyViews.reduce((acc, dailyView) => {
            return acc + dailyView;
        }, 0);
    }, [userDailyViews]);
    const averageDailyView = useMemo(() => {
        return weeklyViews / 7;
    }, [weeklyViews]);

    const currentDayOfWeek = useMemo(() => {
        const day = new Date().getDay();

        return day === 0
            ? 6
            : day - 1
    }, []);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">View Statistics</h3>

            {userPlayerInfo ? (
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
                            {days.map((dayOfWeekText, dayOfWeek) => {
                                // 요일명 계산 (월~일)
                                const dailyViewCount = userDailyViews[dayOfWeek]

                                const isToday = dayOfWeek === currentDayOfWeek;
                                const isPast = dayOfWeek < currentDayOfWeek;
                                const isFuture = dayOfWeek > currentDayOfWeek;

                                const changeRate = isToday && dayOfWeek !== 0
                                    ? (dailyViewCount - averageDailyView) / averageDailyView * 100
                                    : isPast
                                        ? dayOfWeek !== 0
                                            ? (dailyViewCount - userDailyViews[dayOfWeek - 1]) / userDailyViews[dayOfWeek - 1] * 100
                                            : 0
                                        : 0

                                const changeColor = changeRate !== 0 && dayOfWeek <= currentDayOfWeek
                                    ? changeRate > 0
                                        ? 'text-green-400'
                                        : 'text-red-400'
                                    : 'text-gray-400';
                                return (
                                    <div key={dayOfWeekText}
                                         className={`grid grid-cols-3 gap-4 py-2 px-3 rounded-lg transition-all duration-200 ${
                                             isToday
                                                 ? 'bg-purple-500/20 border border-purple-500/30'
                                                 : isPast
                                                     ? 'hover:bg-gray-700/50'
                                                     : 'opacity-60'
                                         }`}>
                                        <div className="flex items-center">
                                            <span
                                                className={`font-medium ${
                                                    isToday
                                                        ? 'text-purple-300'
                                                        : isFuture
                                                            ? 'text-gray-500'
                                                            : 'text-white'
                                                }`
                                            }>
                                                {dayOfWeekText}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            {dailyViewCount !== null ? (
                                                <span
                                                    className={`text-lg font-semibold ${
                                                        isToday
                                                            ? 'text-purple-300'
                                                            : 'text-gray-200'
                                                    }`
                                                }>
                                                    {dailyViewCount.toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="text-lg font-semibold text-gray-500">-</span>
                                            )}
                                        </div>
                                        {changeRate !== 0 && <div className="text-right flex items-center justify-end space-x-1">
                                            <span className={`text-sm font-medium ${changeColor}`}>
                                                {`${changeRate.toFixed(0)}%`}
                                            </span>
                                        </div>}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Summary */}
                        <div className="mt-4 pt-3 border-t border-gray-700">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Current Total</span>
                                <span
                                    className="text-white font-semibold">{weeklyViews} views</span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-gray-400">Daily Average</span>
                                <span
                                    className="text-purple-400 font-semibold">{averageDailyView.toFixed(0)} views</span>
                            </div>
                        </div>
                    </div>

                    {/* Views Analytics */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-white mb-3">Views Analytics</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Views Rank</span>
                                <span
                                    className="text-blue-400">{userViewsRank ? `#${userViewsRank}` : "-"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Today</span>
                                <span
                                    className="text-white">{userDailyViews[currentDayOfWeek]} views</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">This Week</span>
                                <span
                                    className="text-purple-400">{weeklyViews} views</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Daily Average</span>
                                <span
                                    className="text-blue-400">{averageDailyView.toFixed(0)} views</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Peak Day</span>
                                <span
                                    className="text-yellow-400">{Math.max(...userDailyViews)} views</span>
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