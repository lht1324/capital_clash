'use client'

import {useCallback, memo, KeyboardEvent, useMemo} from 'react'
import {encodeBase64} from "@/utils/base64Utils";
import {Continent} from "@/api/types/supabase/Continents";
import {Player} from "@/api/types/supabase/Players";
import {useContinentStore} from "@/store/continentStore";
import {usePlayersStore} from "@/store/playersStore";
import {useUserStore} from "@/store/userStore";

export interface TerritoryInfoViewModalProps {
    territoryOwnerPlayerId: string,
    onClose: () => void
}
function TerritoryInfoViewModal({
    territoryOwnerPlayerId,
    onClose,
}: TerritoryInfoViewModalProps) {
    const { continentList } = useContinentStore();
    const {
        players,
        getSharePercentageByContinent,
        getContinentalRankByContinent,
        getOverallRank
    } = usePlayersStore();
    const { user } = useUserStore();

    const territoryOwnerPlayerInfo = useMemo(() => {
        return players[territoryOwnerPlayerId];
    }, [territoryOwnerPlayerId, players]);

    const isUserOpenedModal = useMemo(() => {
        return territoryOwnerPlayerInfo.user_id === user?.id;
    }, [territoryOwnerPlayerInfo.user_id, user?.id]);

    const userContinentalRank = useMemo(() => {
        return getContinentalRankByContinent(territoryOwnerPlayerInfo.id, territoryOwnerPlayerInfo.continent_id);
    }, [territoryOwnerPlayerInfo.id, territoryOwnerPlayerInfo.continent_id, getContinentalRankByContinent]);

    const userOverallRank = useMemo(() => {
        return getOverallRank(territoryOwnerPlayerInfo.id);
    }, [territoryOwnerPlayerInfo.id, getOverallRank]);

    const userSharePercentage = useMemo(() => {
        return getSharePercentageByContinent(territoryOwnerPlayerInfo.id, territoryOwnerPlayerInfo.continent_id);
    }, [territoryOwnerPlayerInfo.id, territoryOwnerPlayerInfo.continent_id, getSharePercentageByContinent]);

    // ESC 키로 모달 닫기
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose()
        }
    }, []);

    // 외부 링크 열기
    const openExternalLink = useCallback((url: string) => {
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            window.open(url, '_blank', 'noopener,noreferrer')
        } else if (url) {
            window.open(`https://${url}`, '_blank', 'noopener,noreferrer')
        }
    }, []);

    const openXLink = useCallback(() => {
        const userIdentifier = encodeBase64(territoryOwnerPlayerInfo.id);

        // const targetUrl = new URL("https://capital-clash.vercel.app");
        const targetUrl = new URL("http://localhost:3000/");
        targetUrl.searchParams.set("user_identifier", encodeURIComponent(userIdentifier));

        const continentName = continentList.find((continent) => {
            return continent.id === territoryOwnerPlayerInfo?.continent_id;
        })?.name;
        const titleText = userOverallRank === 1
            ? "World? Dominated. By me."
            : userContinentalRank === 1
                ? `${continentName} is mine.`
                : "See where I stand!";

        const currentContinentText = userContinentalRank === 1
            ? `Central (${continentName})`
            : continentName;
        const stakeText = `Total Stake - $${territoryOwnerPlayerInfo?.stake_amount.toLocaleString()}`;
        const overallRankText = `Overall Rank - #${userOverallRank}`;
        const continentalRankText = `Continental Rank - #${userContinentalRank}`;
        const intent = new URL("https://x.com/intent/post");

        intent.searchParams.set(
            "text",
            `${titleText}\n\n` +
            `${currentContinentText}\n` +
            `${stakeText}\n` +
            `${overallRankText}\n` +
            `${continentalRankText}\n\n` +
            `${targetUrl}\n\n` +
            "#CapitalClash"
        );

        window.open(intent.toString(), "_blank", "noopener,noreferrer");
    }, [territoryOwnerPlayerInfo, userOverallRank, userContinentalRank]);

    if (!territoryOwnerPlayerInfo) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">Can't find player's information.</p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onKeyDown={handleKeyDown}
            onClick={onClose}
            tabIndex={-1}
        >
            <div
                className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Territory Overview</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* X 공유 버튼 */}
                {isUserOpenedModal && territoryOwnerPlayerInfo?.x_url && <div className="flex justify-end mb-6">
                    <button
                        onClick={openXLink}
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center"
                    >
                        Share on
                        <img src="/ic_x_logo.svg" alt="Share on X" className="w-5 h-5 ml-1.5" />
                    </button>
                </div>}

                {/* 인스타그램 공유 버튼 */}
                {/*{isUserOpenedModal && territoryOwnerPlayerInfo?.instagram_url && <div className="flex justify-end mt-4">*/}
                {/*    <button*/}
                {/*        onClick={openXLink}*/}
                {/*        className="px-6 py-2 text-white rounded hover:opacity-90 transition-colors flex items-center"*/}
                {/*        style={{*/}
                {/*            background: 'linear-gradient(45deg, #833AB4, #C13584, #E1306C, #FD1D1D, #F56040, #F77737, #FCAF45, #FFDC80)',*/}
                {/*            backgroundSize: '200% 200%',*/}
                {/*        }}*/}
                {/*    >*/}
                {/*        Share on*/}
                {/*        <img src="/ic_instagram_logo.svg" alt="Share on Instagram" className="w-5 h-5 ml-1.5" />*/}
                {/*    </button>*/}
                {/*</div>}*/}

                {/* 투자자 이미지 */}
                {territoryOwnerPlayerInfo.image_status === 'approved' && territoryOwnerPlayerInfo.image_url && (
                    <div className="mb-6 text-center">
                        <img
                            src={territoryOwnerPlayerInfo.image_url}
                            alt={`${territoryOwnerPlayerInfo.name} Profile`}
                            className="w-full h-auto mx-auto object-cover rounded-lg border-2 border-gray-200"
                        />
                    </div>
                )}

                {/* 기본 정보 */}
                <div className="space-y-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-gray-700 mb-3">📄 Information</h3>
                        <div className="space-y-2 text-base">
                            <div className="flex justify-between">
                                <div className="flex flex-row w-fit">
                                    <div className="min-w-6 mr-2">👑</div>
                                    <span className="text-gray-600">Owner</span>
                                </div>
                                <span className="font-medium">{territoryOwnerPlayerInfo.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <div className="flex flex-row w-fit">
                                    <div className="min-w-6 mr-2">💰</div>
                                    <span className="text-gray-600">Stake Amount</span>
                                </div>
                                <span className="font-medium">${territoryOwnerPlayerInfo.stake_amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <div className="flex flex-row w-fit">
                                    <div className="min-w-6 mr-2">📈</div>
                                    <span className="text-gray-600">Continental Share</span>
                                </div>
                                <span className="font-medium">
                                    {userSharePercentage.toFixed(2)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <div className="flex flex-row w-fit">
                                    <div className="min-w-6 mr-2">🏅</div>
                                    <span className="text-gray-600">Continental Rank</span>
                                </div>
                                <span className={`${userContinentalRank === 1 ? "text-yellow-500" : "text-black-600"} font-medium`}>
                                    # {userContinentalRank}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <div className="flex flex-row w-fit">
                                    <div className="min-w-6 mr-2">🏆</div>
                                    <span className="text-gray-600">Overall Rank</span>
                                </div>
                                <span className={`${userOverallRank === 1 ? "text-yellow-500" : "text-black-600"} font-medium`}>
                                    # {userOverallRank}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 프로필 정보 */}
                {(territoryOwnerPlayerInfo.description || territoryOwnerPlayerInfo.x_url || territoryOwnerPlayerInfo.contact_email) && (
                    <div className="space-y-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg text-gray-700 mb-3">📝 Owner </h3>
                            {territoryOwnerPlayerInfo.description && (
                                <div className="mb-4">
                                    <label className="block text-m font-medium text-gray-600 mb-2">💬 Description</label>
                                    <p className="text-gray-800 text-sm leading-relaxed bg-white p-3 rounded border whitespace-pre-line">
                                        {territoryOwnerPlayerInfo.description}
                                    </p>
                                </div>
                            )}
                            {territoryOwnerPlayerInfo.x_url && (
                                <div className="flex flex-col mb-4">
                                    <div className="w-fit h-fit p-1 bg-gray-600 mb-2 rounded border">
                                        <img
                                            src="/ic_x_logo.svg"
                                            alt="Instagram"
                                            className="w-5 h-5"
                                        />
                                    </div>
                                    <button
                                        onClick={() => openExternalLink(territoryOwnerPlayerInfo?.x_url!)}
                                        // className="text-blue-600 hover:text-blue-800 underline text-sm bg-white px-3 py-2 rounded border hover:bg-blue-50 transition-colors"
                                        className="w-full text-left text-blue-600 hover:text-blue-800 underline text-sm bg-white px-3 py-2 rounded border hover:bg-blue-50 transition-colors"
                                    >
                                        {territoryOwnerPlayerInfo.x_url} ↗
                                    </button>
                                </div>
                            )}
                            {/*{territoryOwnerPlayerInfo.instagram_url && (*/}
                            {/*    <div className="flex flex-col mb-4">*/}
                            {/*        <div className="w-fit h-fit p-1 bg-transparent mb-1">*/}
                            {/*            <img*/}
                            {/*                src="/ic_instagram_logo.svg"*/}
                            {/*                alt="Instagram"*/}
                            {/*                className="w-6 h-6"*/}
                            {/*            />*/}
                            {/*        </div>*/}
                            {/*        <button*/}
                            {/*            onClick={() => openExternalLink(territoryOwnerPlayerInfo?.instagram_url!)}*/}
                            {/*            className="text-blue-600 hover:text-blue-800 underline text-sm bg-white px-3 py-2 rounded border hover:bg-blue-50 transition-colors"*/}
                            {/*        >*/}
                            {/*            {territoryOwnerPlayerInfo.instagram_url} ↗*/}
                            {/*        </button>*/}
                            {/*    </div>*/}
                            {/*)}*/}
                            {territoryOwnerPlayerInfo.contact_email && (
                                <div className="mb-4">
                                    <label className="block text-m font-medium text-gray-600 mb-2">📧 Contact</label>
                                    <p className="text-gray-800 text-sm bg-white p-3 rounded border">
                                        {territoryOwnerPlayerInfo.contact_email}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default memo(TerritoryInfoViewModal);
