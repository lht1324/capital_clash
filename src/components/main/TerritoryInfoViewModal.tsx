'use client'

import { useContinentStore } from '@/store/continentStore'
import { useInvestorStore } from "@/store/investorsStore";
import {useCallback, useEffect, useMemo, KeyboardEvent, memo} from 'react'
import {encodeBase64} from "@/utils/base64Utils";
import {useUserStore} from "@/store/userStore";

function TerritoryInfoViewModal({
    onClose,
    investorId,
}: {
    onClose: () => void
    investorId: string
}) {
    const { continents } = useContinentStore();
    const { investors, updateInvestorDailyViews, getTotalInvestmentByContinent } = useInvestorStore();
    const { user } = useUserStore();

    const investorList = useMemo(() => {
        return Object.values(investors);
    }, [investors])

    const investorInfo = useMemo(() => {
        return investorList.find((investor) => {
            return investor.id === investorId;
        })
    }, [investorList, investorId])

    const filteredInvestorListByContinent = useMemo(() => {
        return investorList.filter((investor) => {
            return investor.continent_id === investorInfo?.continent_id;
        })
    }, [investorList, investorInfo]);

    const userContinentRank = useMemo(() => {
        if (investorInfo) {
            const userIndex = filteredInvestorListByContinent.sort((a, b) => {
                return b.investment_amount - a.investment_amount;
            }).findIndex((investor) => {
                return investor.id === investorInfo?.id;
            });

            return userIndex + 1;
        } else {
            return -1
        }
    }, [investorInfo, filteredInvestorListByContinent]);

    const userOverallRank = useMemo(() => {
        if (investorInfo) {
            const userIndex = investorList.sort((a, b) => {
                return b.investment_amount - a.investment_amount;
            }).findIndex((investor) => {
                return investor.id === investorInfo.id;
            });

            return userIndex + 1;
        } else {
            return -1
        }
    }, [investorList, investorInfo]);

    const isUserOpenedModal = useMemo(() => {
        return investorInfo?.user_id === user?.id;
    }, [investorInfo, user]);

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
        const userIdentifier = encodeBase64(investorId);

        const targetUrl = new URL("https://capital-clash.vercel.app");
        targetUrl.searchParams.set("user_identifier", encodeURIComponent(userIdentifier));

        const continentName = continents[investorInfo?.continent_id ?? ""]?.name;
        const titleText = userOverallRank === 1
            ? "World? Dominated. By me."
            : userContinentRank === 1
                ? `${continentName} is mine.`
                : "See where I stand!";
        const currentContinentText = userContinentRank === 1
            ? `Central (${continentName})`
            : continentName;
        const contributionText = `Total Contribution - $${investorInfo?.investment_amount.toLocaleString()}`;
        const overallRankText = `Overall Rank - #${userOverallRank}`;
        const continentalRankText = `Continental Rank - #${userContinentRank}`;
        const intent = new URL("https://x.com/intent/post");
        intent.searchParams.set(
            "text",
            `${titleText}

${currentContinentText}
${contributionText}
${overallRankText}
${continentalRankText}

${targetUrl}

#CapitalClash`
        );

        window.open(intent.toString(), "_blank", "noopener,noreferrer");
    }, [investorId, investorInfo, continents, userOverallRank, userContinentRank]);

    if (!investorInfo) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">Can't find investor's information.</p>
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
                {isUserOpenedModal && investorInfo?.x_url && <div className="flex justify-end mb-6">
                    <button
                        onClick={openXLink}
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center"
                    >
                        Share on
                        <img src="/ic_x_logo.svg" alt="Share on X" className="w-5 h-5 ml-1.5" />
                    </button>
                </div>}

                {/* 인스타그램 공유 버튼 */}
                {/*{isUserOpenedModal && investorInfo?.instagram_url && <div className="flex justify-end mt-4">*/}
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
                {investorInfo.image_status === 'approved' && investorInfo.image_url && (
                    <div className="mb-6 text-center">
                        <img
                            src={investorInfo.image_url}
                            alt={`${investorInfo.name} Profile`}
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
                                <span className="font-medium">{investorInfo.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <div className="flex flex-row w-fit">
                                    <div className="min-w-6 mr-2">💰</div>
                                    <span className="text-gray-600">Investment Amount</span>
                                </div>
                                <span className="font-medium">${investorInfo.investment_amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <div className="flex flex-row w-fit">
                                    <div className="min-w-6 mr-2">📈</div>
                                    <span className="text-gray-600">Continental Share</span>
                                </div>
                                <span className="font-medium">
                                    {((investorInfo.investment_amount / getTotalInvestmentByContinent(investorInfo.continent_id)) * 100).toFixed(2)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <div className="flex flex-row w-fit">
                                    <div className="min-w-6 mr-2">🏅</div>
                                    <span className="text-gray-600">Continental Rank</span>
                                </div>
                                <span className={`${userContinentRank === 1 ? "text-yellow-500" : "text-black-600"} font-medium`}>
                                    # {userContinentRank}
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
                {(investorInfo.description || investorInfo.x_url || investorInfo.contact_email) && (
                    <div className="space-y-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg text-gray-700 mb-3">📝 Owner </h3>
                            {investorInfo.description && (
                                <div className="mb-4">
                                    <label className="block text-m font-medium text-gray-600 mb-2">💬 Description</label>
                                    <p className="text-gray-800 text-sm leading-relaxed bg-white p-3 rounded border">
                                        {investorInfo.description}
                                    </p>
                                </div>
                            )}
                            {investorInfo.x_url && (
                                <div className="flex flex-col mb-4">
                                    <div className="w-fit h-fit p-1 bg-gray-600 mb-2 rounded border">
                                        <img
                                            src="/ic_x_logo.svg"
                                            alt="Instagram"
                                            className="w-5 h-5"
                                        />
                                    </div>
                                    <button
                                        onClick={() => openExternalLink(investorInfo?.x_url!)}
                                        className="text-blue-600 hover:text-blue-800 underline text-sm bg-white px-3 py-2 rounded border hover:bg-blue-50 transition-colors"
                                    >
                                        {investorInfo.x_url} ↗
                                    </button>
                                </div>
                            )}
                            {/*{investorInfo.instagram_url && (*/}
                            {/*    <div className="flex flex-col mb-4">*/}
                            {/*        <div className="w-fit h-fit p-1 bg-transparent mb-1">*/}
                            {/*            <img*/}
                            {/*                src="/ic_instagram_logo.svg"*/}
                            {/*                alt="Instagram"*/}
                            {/*                className="w-6 h-6"*/}
                            {/*            />*/}
                            {/*        </div>*/}
                            {/*        <button*/}
                            {/*            onClick={() => openExternalLink(investorInfo?.instagram_url!)}*/}
                            {/*            className="text-blue-600 hover:text-blue-800 underline text-sm bg-white px-3 py-2 rounded border hover:bg-blue-50 transition-colors"*/}
                            {/*        >*/}
                            {/*            {investorInfo.instagram_url} ↗*/}
                            {/*        </button>*/}
                            {/*    </div>*/}
                            {/*)}*/}
                            {investorInfo.contact_email && (
                                <div className="mb-4">
                                    <label className="block text-m font-medium text-gray-600 mb-2">📧 Contact</label>
                                    <p className="text-gray-800 text-sm bg-white p-3 rounded border">
                                        {investorInfo.contact_email}
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
