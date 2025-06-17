'use client'

import { useContinentStore } from '@/store/continentStore'
import { useInvestorStore } from "@/store/investorsStore";
import { useCallback, useEffect, useMemo, KeyboardEvent } from 'react'

interface TerritoryInfoModalProps {
    isOpen: boolean
    onClose: () => void
    investorId: string
}

export default function TerritoryInfoModal({
    isOpen,
    onClose,
    investorId,
}: TerritoryInfoModalProps) {
    const { continents } = useContinentStore();
    const { investors, updateInvestorDailyViews, getTotalInvestmentByContinent } = useInvestorStore();

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

    // 👁️ 프로필 열릴 때 조회수 증가
    useEffect(() => {
        if (isOpen && investorId) {
            // updateInvestorDailyViews()
        }
    }, [isOpen, investorId, updateInvestorDailyViews])

    if (!isOpen) return null

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

                {/* 투자자 이미지 */}
                {investorInfo.image_status === 'approved' && investorInfo.image_url && (
                    <div className="mb-6 text-center">
                        <img
                            src={investorInfo.image_url}
                            alt={`${investorInfo.name} 프로필`}
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
                                <div className="w-fit">
                                    <span className="mr-3">👑</span>
                                    <span className="text-gray-600">Owner</span>
                                </div>
                                <span className="font-medium">{investorInfo.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <div className="w-fit">
                                    <span className="mw-5 mr-3">💰</span>
                                    <span className="text-gray-600">Investment Amount</span>
                                </div>
                                <span className="font-medium">${investorInfo.investment_amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <div className="w-fit">
                                    <span className="mr-3">📈</span>
                                    <span className="text-gray-600">Continental Share</span>
                                </div>
                                <span className="font-medium">
                                    {((investorInfo.investment_amount / getTotalInvestmentByContinent(investorInfo.continent_id)) * 100).toFixed(2)}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <div className="w-fit">
                                    <span className="mr-3">🏅</span>
                                    <span className="text-gray-600">Continental Rank</span>
                                </div>
                                <span className={`${userContinentRank === 1 ? "text-yellow-500" : "text-black-600"} font-medium`}>
                                    # {userContinentRank}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <div className="w-fit">
                                    <span className="mr-3">🏆</span>
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
                {(investorInfo.description || investorInfo.website_url || investorInfo.contact_email) && (
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

                            {investorInfo.website_url && (
                                <div className="mb-4">
                                    <label className="block text-m font-medium text-gray-600 mb-2">🌐 Website</label>
                                    <button
                                        onClick={() => openExternalLink(investorInfo.website_url!)}
                                        className="text-blue-600 hover:text-blue-800 underline text-sm bg-white px-3 py-2 rounded border hover:bg-blue-50 transition-colors"
                                    >
                                        {investorInfo.website_url} ↗
                                    </button>
                                </div>
                            )}

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

                {/* 닫기 버튼 */}
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
