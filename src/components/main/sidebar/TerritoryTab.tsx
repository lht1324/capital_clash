import {memo, useCallback, useMemo} from "react";
import {ImageStatus} from "@/api/types/supabase/Players";
import {useContinentStore} from "@/store/continentStore";
import {usePlayersStore} from "@/store/playersStore";
import {useUserStore} from "@/store/userStore";

function TerritoryTab({
    onClickMoveToTerritory,
    onClickSwitchContinent,
    onClickOpenImageUploadModal,
    onClickOpenPurchaseModal,
    onClickOpenProfileEditModal,
} : {
    onClickMoveToTerritory: () => void,
    onClickSwitchContinent: (selectedContinentId: string) => void,
    onClickOpenImageUploadModal: () => void,
    onClickOpenPurchaseModal: () => void,
    onClickOpenProfileEditModal: () => void,
}) {
    const { continents, continentList } = useContinentStore();
    const { playerList, getSharePercentageByContinent } = usePlayersStore();
    const { user } = useUserStore();

    const userPlayerInfo = useMemo(() => {
        return playerList.find((player) => {
            return player.user_id === user?.id;
        }) ?? null;
    }, [playerList, user?.id]);

    const investmentAmount = useMemo(() => {
        return userPlayerInfo?.investment_amount ?? 0;
    }, [userPlayerInfo?.investment_amount]);

    const sharePercentage = useMemo(() => {
        return userPlayerInfo
            ? getSharePercentageByContinent(userPlayerInfo.id, userPlayerInfo?.continent_id)
            : 0.01;
    }, [userPlayerInfo, getSharePercentageByContinent]);

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
        return userPlayerInfo?.continent_id
            ? continents[userPlayerInfo.continent_id].name
            : "-"
    }, [userPlayerInfo?.continent_id, continents]);

    const createdDate = useMemo(() => {
        return userPlayerInfo?.created_at
            ? new Date(userPlayerInfo.created_at).toLocaleString()
            : "-"
    }, [userPlayerInfo?.created_at]);

    const getContinentPlayerCount = useCallback((continentId: string) => {
        return playerList.filter((player) => {
            return player.continent_id === continentId;
        }).length;
    }, [playerList]);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Territory Management</h3>

            {userPlayerInfo ? (
                <>
                    {/* 현재 영역 상세 정보 */}
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-white text-lg">{continentName}</h4>
                            <div className="text-right">
                                <div
                                    className="text-green-400 font-medium text-lg">${investmentAmount.toLocaleString()}</div>
                                <div className="text-blue-400 text-sm">{sharePercentage.toFixed(2)}% Share</div>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-3 mt-3">
                            <div className="flex flex-col items-start mb-3">
                                <span className={`text-sm ${imageStatusColor} mb-1`}>
                                    {imageStatusText}
                                </span>
                                <span className="text-xs text-gray-400">{createdDate}</span>
                            </div>

                            <div className="space-y-2">
                                <button
                                    className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded text-sm transition-colors"
                                    onClick={() => { onClickMoveToTerritory(); }}
                                >
                                    🚀 Move to Territory
                                </button>
                                <button
                                    onClick={() => onClickOpenImageUploadModal()}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-sm transition-colors flex items-center justify-center space-x-2"
                                >
                                    <span>📷</span>
                                    <span>{imageUrl ? "Replace" : "Upload"} Image</span>
                                </button>
                                <button
                                    onClick={() => onClickOpenProfileEditModal()}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm transition-colors flex items-center justify-center space-x-2"
                                >
                                    <span>✏️</span>
                                    <span>Edit Territory Display</span>
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
                        <button
                            onClick={() => onClickOpenPurchaseModal()}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors font-medium">
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
                            {continentList.filter((continent) => {
                                return continent.id !== "central";
                            }).map((continent) => {
                                const currentCount = getContinentPlayerCount(continent.id);
                                const isFull = currentCount >= continent.max_users;
                                const isCurrentContinent = userPlayerInfo?.continent_id === continent.id

                                // 대륙 이동 판매 -> $5
                                return (
                                    <button
                                        key={continent.id}
                                        disabled={isFull || isCurrentContinent}
                                        onClick={() => { onClickSwitchContinent(continent.id); }}
                                        className={`w-full ${
                                            isFull || isCurrentContinent
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:opacity-90'
                                        } text-white p-3 rounded-lg transition-all flex justify-between items-center`}
                                        style={{ backgroundColor: `${continent.color}` }}
                                    >
                                        <span className="font-medium">
                                            {continent.name}
                                            {isCurrentContinent && ' (Current)'}
                                        </span>
                                        <span className={`text-sm ${isFull ? 'text-red-200' : 'text-white'}`}>
                                            {currentCount}/{continent.max_users}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="text-xs text-gray-400 text-center">
                            Red marks indicate that continent is full.
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
                        {continentList.filter((continent) => {
                            return continent.id !== "central";
                        }).map((continent) => {
                            const currentCount = getContinentPlayerCount(continent.id);
                            const isFull = currentCount >= continent.max_users

                            return (
                                <button
                                    key={continent.id}
                                    onClick={() => !isFull && onClickOpenPurchaseModal()}
                                    disabled={isFull}
                                    className={`w-full ${
                                        isFull ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                                    } text-white p-3 rounded-lg transition-all`}
                                    style={{ backgroundColor: `${continent.color}` }}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{continent.name}</span>
                                        <div className="text-right">
                                            <div className={`text-xs ${isFull ? 'text-red-200' : 'text-white/80'}`}>
                                                {currentCount}/{continent.max_users}
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
    )
}

export default memo(TerritoryTab);
