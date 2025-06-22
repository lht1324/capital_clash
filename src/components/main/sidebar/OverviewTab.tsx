import {memo} from "react";

function OverviewTab({
    isUserInvestmentInfoExist,
    isVip,
    investmentAmount,
    sharePercentage,
    userContinentRank,
    userOverallRank,
    imageUrl,
    imageStatus,
    imageStatusColor,
    imageStatusText,
    continentName,
    onClickOpenImageUploadModal,
    onClickOpenPurchaseModal
} : {
    isUserInvestmentInfoExist: boolean,
    isVip: boolean,
    investmentAmount: number,
    sharePercentage: number,
    userContinentRank: number,
    userOverallRank: number,
    imageUrl?: string,
    imageStatus: string,
    imageStatusColor: string,
    imageStatusText: string,
    continentName: string,
    onClickOpenImageUploadModal: () => void,
    onClickOpenPurchaseModal: () => void
}) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Investment Status</h3>

            {isUserInvestmentInfoExist ? (
                <>
                    {/* 전체 요약 */}
                    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Investment</span>
                            <span
                                className="text-xl font-bold text-green-400">${investmentAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Continental Share</span>
                            <span className="text-lg font-semibold text-blue-400">{sharePercentage.toFixed(2)}%</span>
                        </div>
                        {userContinentRank !== -1 && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Continental Rank</span>
                                <span className="text-lg font-semibold text-white">#{userContinentRank}</span>
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
                        {imageStatus && imageStatus !== 'none' && (
                            <div className="mb-4 p-3 rounded-lg bg-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-white">Territory Image</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${imageStatusColor}`}>
                                        {
                                            imageStatus === 'pending'
                                                ? '🔄 Review'
                                                : imageStatus === 'approved'
                                                    ? '✅ Live'
                                                    : '❌ Rejected'
                                        }
                                    </span>
                                </div>

                                <div className="aspect-square bg-gray-600 rounded-lg overflow-hidden mb-2">
                                    {imageUrl && imageStatus === 'approved' ? (
                                        <img
                                            src={imageUrl}
                                            alt="Territory Image"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : imageStatus === 'pending' ? (
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
                                    onClick={() => onClickOpenImageUploadModal()}
                                    className="w-full text-xs bg-gray-600 hover:bg-gray-500 text-white py-1 px-2 rounded transition-colors"
                                >
                                    {
                                        imageStatus === 'approved'
                                            ? 'Replace'
                                            : imageStatus === 'pending'
                                                ? 'Upload New'
                                                : 'Upload New'
                                    }
                                </button>
                            </div>
                        )}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">Continent</span>
                                <div className="flex items-end gap-1 w-fit">
                                    {isVip && <span className="text-white font-medium "><b>Central</b></span>}
                                    <span className="text-white font-medium">{isVip ? `(${continentName})` : continentName}</span>
                                </div>
                            </div>
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