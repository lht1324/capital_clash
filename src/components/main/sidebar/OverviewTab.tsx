import {memo, useMemo} from "react";
import {ImageStatus} from "@/api/types/supabase/Players";
import {useContinentStore} from "@/store/continentStore";
import {usePlayersStore} from "@/store/playersStore";
import {useUserStore} from "@/store/userStore";

function OverviewTab({
    onClickOpenImageUploadModal,
    onClickOpenPurchaseModal
} : {
    onClickOpenImageUploadModal: () => void,
    onClickOpenPurchaseModal: () => void
}) {
    const { continents } = useContinentStore();
    const {
        playerList,
        vipPlayerList,
        getSharePercentageByContinent,
        getContinentalRankByContinent,
        getOverallRank,
        getViewsRank
    } = usePlayersStore();
    const { user } = useUserStore();

    const userPlayerInfo = useMemo(() => {
        return playerList.find((player) => {
            return player.user_id === user?.id;
        }) ?? null;
    }, [playerList, user?.id]);

    const isUserVip = useMemo(() => {
        return !!(vipPlayerList.find((player) => {
            return player.user_id === user?.id;
        }));
    }, [vipPlayerList, user?.id]);

    const userInvestmentAmount = useMemo(() => {
        return userPlayerInfo?.stake_amount ?? 0;
    }, [userPlayerInfo?.stake_amount]);

    const userSharePercentage = useMemo(() => {
        return userPlayerInfo
            ? getSharePercentageByContinent(userPlayerInfo.id, userPlayerInfo?.continent_id)
            : 0.01;
    }, [userPlayerInfo, getSharePercentageByContinent]);

    const userContinentalRank = useMemo(() => {
        return userPlayerInfo
            ? getContinentalRankByContinent(userPlayerInfo.id, userPlayerInfo.continent_id)
            : -1;
    }, [userPlayerInfo, getContinentalRankByContinent]);

    const userOverallRank = useMemo(() => {
        return userPlayerInfo?.id
            ? getOverallRank(userPlayerInfo.id)
            : -1;
    }, [userPlayerInfo?.id, getOverallRank]);

    const userViewsRank = useMemo(() => {
        return userPlayerInfo?.id
            ? getViewsRank(userPlayerInfo.id)
            : -1;
    }, [userPlayerInfo?.id, getViewsRank]);

    const imageUrl = useMemo(() => {
        return userPlayerInfo?.image_url ?? null;
    }, [userPlayerInfo?.image_url]);

    const imageStatusColor = useMemo(() => {
        switch (userPlayerInfo?.image_status) {
            case ImageStatus.APPROVED: return 'text-green-400'
            case ImageStatus.PENDING: return 'text-yellow-400'
            case ImageStatus.REJECTED: return 'text-red-400'
            default: return 'text-gray-400'
        }
    }, [userPlayerInfo?.image_status]);

    const imageStatusText = useMemo(() => {
        switch (userPlayerInfo?.image_status) {
            case ImageStatus.APPROVED: return '✅ Approved'
            case ImageStatus.PENDING: return '⏳ Under Review'
            case ImageStatus.REJECTED: return '❌ Rejected'
            default: return '📷 Not uploaded'
        }
    }, [userPlayerInfo?.image_status]);

    const continentName = useMemo(() => {
        return continents[userPlayerInfo?.continent_id ?? ""]?.name ?? null
    }, [continents, userPlayerInfo?.continent_id]);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Investment Status</h3>

            {userPlayerInfo ? (
                <>
                    {/* 전체 요약 */}
                    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Investment</span>
                            <span
                                className="text-xl font-bold text-green-400">${userInvestmentAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Continental Share</span>
                            <span className="text-lg font-semibold text-blue-400">{userSharePercentage.toFixed(2)}%</span>
                        </div>
                        {userContinentalRank !== -1 && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Continental Rank</span>
                                <span className="text-lg font-semibold text-white">#{userContinentalRank}</span>
                            </div>
                        )}
                        {userOverallRank !== -1 && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Overall Rank</span>
                                <span className="text-lg font-semibold text-white">#{userOverallRank}</span>
                            </div>
                        )}
                    </div>

                    {/* 현재 영역 정보 */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-white mb-3">Current Territory</h4>

                        {/* Current Image Preview */}
                        {userPlayerInfo?.image_status && (
                            <div className="mb-4 p-3 rounded-lg bg-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-white">Territory Image</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${imageStatusColor}`}>
                                        {imageStatusText}
                                    </span>
                                </div>

                                <div className="aspect-square bg-gray-600 rounded-lg overflow-hidden mb-2">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt="Territory Image"
                                            className="w-full h-full object-cover"
                                        />
                                    ) :  (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <div className="text-center">
                                                <div className="text-2xl mb-2">⚠</div>
                                                <div className="text-xs">Image is not exist.</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => onClickOpenImageUploadModal()}
                                    className="w-full text-xs bg-gray-600 hover:bg-gray-500 text-white py-1 px-2 rounded transition-colors"
                                >
                                    {imageUrl ? "Replace" : "Upload New"}
                                </button>
                            </div>
                        )}
                        <div className="space-y-2">
                            {continentName && <div className="flex justify-between items-center">
                                <span className="text-gray-300">Continent</span>
                                <div className="flex items-end gap-1 w-fit">
                                    {isUserVip && <span className="text-white font-medium "><b>Central</b></span>}
                                    <span className="text-white font-medium">{isUserVip ? `(${continentName})` : continentName}</span>
                                </div>
                            </div>}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Image Status</span>
                                <span className={imageStatusColor}>
                                    {imageStatusText}
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* 영역이 없는 경우 */
                <div className="bg-gray-800 rounded-lg p-6 text-center">
                    <div className="text-4xl mb-4">🎯</div>
                    <h4 className="text-lg font-semibold text-white mb-2">No territory</h4>
                    <p className="text-gray-400 mb-4">Start your investment by purchasing your territory!</p>
                    <button
                        onClick={() => onClickOpenPurchaseModal()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Purchase Territory
                    </button>
                </div>
            )}
        </div>
    )
}

export default memo(OverviewTab);