'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import PurchaseTileModal from '../../PurchaseTileModal'
import TerritoryInfoEditModal from "@/components/TerritoryInfoEditModal";
import ImageUploadModal from '../../ImageUploadModal'
import { getCurrentUserTileInfo } from '@/utils/userUtils'
import { useUserStore } from '@/store/userStore'
import { useContinentStore } from '@/store/continentStore'
import {Investor, useInvestorStore} from "@/store/investorsStore";
import OverviewTab from "@/components/ui/sidebar/OverviewTab";
import TerritoryTab from "@/components/ui/sidebar/TerritoryTab";
import StatsTab from "@/components/ui/sidebar/StatsTab";
import { storageAPI } from '@/lib/supabase/supabase-storage-api';
import {calculateInvestorCoordinates} from "@/lib/treemapAlgorithm";

export default function Sidebar() {
    const [activeTab, setActiveTab] = useState<'overview' | 'tile' | 'stats'>('overview')
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
    const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false)
    const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false)
    // const [imageStatus, setImageStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('pending')

    // 각 대륙별 현재 유저 수 계산
    const { continents, isSidebarOpen, setSidebarOpen, setCameraTarget } = useContinentStore();
    const { investors } = useInvestorStore();
    const { user } = useUserStore()

    // 로그인하지 않은 경우 아무것도 렌더링하지 않음
    // if (!user) return null;

    const continentList = useMemo(() => {
        const list = Object.values(continents).filter((continent) => continent.id !== "central");

        return list.length !== 0
            ? list
            : [];
    }, [continents]);
    const investorList = useMemo(() => {
        const list = Object.values(investors);

        return list.length !== 0
            ? list
            : [];
    }, [investors]);
    const vipInvestorRecord = useMemo(() => {
        return investorList
            .reduce((acc, investor) => {
                const id = investor.continent_id;
                if (!acc[id] || investor.investment_amount > acc[id].investment_amount) {
                    acc[id] = investor; // 최고 투자금액 기준
                }
                return acc;
            }, {} as Record<string, Investor>)
    }, [investorList]);

    // user.user_id -> investors.user_id
    // 현재 사용자의 정보 (실제 데이터 사용)

    const userInvestmentInfo = useMemo(() => {
        return investorList.find((investor) => investor.user_id === user?.id)
    }, [user, investorList]);

    const filteredInvestorListByContinent = useMemo(() => {
        return investorList.filter((investor) => {
            return investor.continent_id === userInvestmentInfo?.continent_id;
        })
    }, [investorList, userInvestmentInfo])

    const isVip = useMemo(() => {
        const vipInvestor = vipInvestorRecord[userInvestmentInfo?.continent_id ?? ""];
        const isUserIdValid = !(!userInvestmentInfo?.user_id);

        return isUserIdValid && vipInvestor?.user_id === userInvestmentInfo?.user_id;
    }, [vipInvestorRecord, userInvestmentInfo]);

    const isUserInvestmentInfoExist = useMemo(() => {
        return !(!userInvestmentInfo);
    }, [userInvestmentInfo])

    const investmentAmount = useMemo(() => {
        return userInvestmentInfo
            ? userInvestmentInfo.investment_amount
            : 0;
    }, [userInvestmentInfo]);

    const totalInvestmentAmount = useMemo(() => {
        if (userInvestmentInfo) {
            return filteredInvestorListByContinent.reduce((acc, investor) => {
                return acc + investor.investment_amount;
            }, 0);
        } else {
            return 0;
        }
    }, [userInvestmentInfo, filteredInvestorListByContinent]);

    const sharePercentage = useMemo(() => {
        const newSharePercentage = investmentAmount / totalInvestmentAmount * 100;

        return newSharePercentage > 0.01
            ? newSharePercentage
            : 0.01;
    }, [investmentAmount, totalInvestmentAmount]);

    const userContinentRank = useMemo(() => {
        if (userInvestmentInfo) {
            const userIndex = filteredInvestorListByContinent.sort((a, b) => {
                return b.investment_amount - a.investment_amount;
            }).findIndex((investor) => {
                return investor.user_id === userInvestmentInfo.user_id;
            });

            return userIndex + 1;
        } else {
            return -1
        }
    }, [userInvestmentInfo, filteredInvestorListByContinent]);

    const userOverallRank = useMemo(() => {
        if (userInvestmentInfo) {
            const userIndex = investorList.sort((a, b) => {
                return b.investment_amount - a.investment_amount;
            }).findIndex((investor) => {
                return investor.user_id === userInvestmentInfo.user_id;
            });

            return userIndex + 1;
        } else {
            return -1
        }
    }, [investorList, userInvestmentInfo]);

    const userViewsRank = useMemo(() => {
        if (userInvestmentInfo) {
            const sumDailyViews = (dailyViews: number[]) => {
                return dailyViews.reduce((acc, dailyView) => acc + dailyView, 0);
            }
            const userIndex = investorList
                .sort((a, b) => sumDailyViews(b.daily_views) - sumDailyViews(a.daily_views))
                .findIndex((investor) => investor.user_id === userInvestmentInfo.user_id);

            return userIndex + 1;
        } else {
            return -1
        }
    }, [investorList, userInvestmentInfo])

    const imageUrl = useMemo(() => {
        return userInvestmentInfo?.image_url
    }, [userInvestmentInfo]);

    const imageStatus = useMemo(() => {
        return userInvestmentInfo?.image_status ?? "none"
    }, [userInvestmentInfo]);

    const continentName = useMemo(() => {
        return userInvestmentInfo
            ? continents[userInvestmentInfo.continent_id].name
            : "-";
    }, [continents, userInvestmentInfo]);

    const imageStatusColor = useMemo(() => {
        switch (imageStatus) {
            case 'approved': return 'text-green-400'
            case 'pending': return 'text-yellow-400'
            case 'rejected': return 'text-red-400'
            default: return 'text-gray-400'
        }
    }, [imageStatus]);

    const imageStatusText = useMemo(() => {
        switch (imageStatus) {
            case 'approved': return '✅ Approved'
            case 'pending': return '⏳ Under Review'
            case 'rejected': return '❌ Rejected'
            default: return '📷 Not uploaded'
        }
    }, [imageStatus]);

    const userCreatedDate = useMemo(() => {
        return userInvestmentInfo?.created_at
            ? new Date(userInvestmentInfo.created_at).toLocaleString()
            : "-"
    }, [userInvestmentInfo])

    const userDailyViewList = useMemo(() => {
        return userInvestmentInfo?.daily_views
            ? userInvestmentInfo.daily_views
            : [0, 0, 0, 0, 0, 0, 0]
    }, [userInvestmentInfo]);
    const userPreviousSundayView = useMemo(() => {
        return userInvestmentInfo?.previous_sunday_view
            ? userInvestmentInfo.previous_sunday_view
            : 0
    }, [userInvestmentInfo]);

    const onClickMoveToTerritory = useCallback(() => {
        const userCoordinates = calculateInvestorCoordinates(
            Object.values(vipInvestorRecord),
            filteredInvestorListByContinent,
            continentName.toLowerCase(),
            isVip,
            user?.id,
        );

        if (userCoordinates) {
            setCameraTarget([userCoordinates.x, userCoordinates.y, userCoordinates.z]);
        }
    }, [vipInvestorRecord, filteredInvestorListByContinent, isVip, user?.id, setCameraTarget]);

    // Handle image upload
    const handleImageUpload = useCallback(async (file: File) => {
        console.log(`🖼️ Image uploaded: ${file.name}, Size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`)

        if (!user || !userInvestmentInfo) {
            alert('❌ 로그인 상태 또는 투자 정보를 확인할 수 없습니다.')
            return
        }

        try {
            // 로딩 상태 표시 (실제 구현에서는 상태 변수를 사용할 수 있음)
            const loadingMessage = `이미지를 업로드 중입니다...`
            console.log(loadingMessage)

            // Supabase Storage에 이미지 업로드
            const { imageData, error } = await storageAPI.uploadImage(
                file, 
                user.id, 
                userInvestmentInfo.id
            )

            if (error) {
                throw error
            }

            // 성공 메시지 표시
            alert(`✅ 이미지 "${file.name}"가 성공적으로 업로드되었습니다! 이미지는 현재 검토 중입니다.`)
            console.log('업로드 성공:', imageData)
        } catch (error) {
            console.error('이미지 업로드 실패:', error)
            alert('❌ 이미지 업로드에 실패했습니다. 다시 시도해 주세요.')
        }
    }, [user, userInvestmentInfo]);

    return (
        (user && <>
            {/* 사이드바 토글 버튼 - 오른쪽으로 이동 */}
            <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className={`fixed top-20 z-20 bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-l-lg border border-r-0 border-gray-700 transition-all duration-300 flex items-center gap-2 ${
                    isSidebarOpen ? 'right-80' : 'right-0'
                }`}
            >
                <span className="text-sm font-medium">My Info</span>
                <svg
                    className={`w-5 h-5 transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* 사이드바 - 오른쪽으로 이동 */}
            <div
                className={`fixed top-16 right-0 h-[calc(100vh-4rem)] bg-gray-900 border-l border-gray-700 z-20 transition-transform duration-300 ${
                    isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                style={{ width: '320px' }}
            >
                <div className="flex flex-col h-full">
                    {/* 탭 헤더 */}
                    <div className="flex border-b border-gray-700">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'overview'
                                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            📊 Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('tile')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'tile'
                                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            🎯 My Territory
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'stats'
                                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            📈 Stats
                        </button>
                    </div>

                    {/* 탭 내용 */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {activeTab === 'overview' && (
                            <OverviewTab
                                isUserInvestmentInfoExist={isUserInvestmentInfoExist}
                                isVip={isVip}
                                investmentAmount={investmentAmount}
                                sharePercentage={sharePercentage}
                                userContinentRank={userContinentRank}
                                userOverallRank={userOverallRank}
                                imageUrl={imageUrl}
                                imageStatus={imageStatus}
                                imageStatusColor={imageStatusColor}
                                imageStatusText={imageStatusText}
                                continentName={continentName}
                                onClickOpenImageUploadModal={() => setIsImageUploadModalOpen(true)}
                                onClickOpenPurchaseModal={() => { setIsPurchaseModalOpen(true) }}
                            />
                        )}

                        {activeTab === 'tile' && (
                            <TerritoryTab
                                isUserInvestmentInfoExist={isUserInvestmentInfoExist}
                                investorList={investorList}
                                investmentAmount={investmentAmount}
                                sharePercentage={sharePercentage}
                                imageStatusColor={imageStatusColor}
                                imageStatusText={imageStatusText}
                                createdDate={userCreatedDate}
                                continentName={continentName}
                                continentList={continentList}
                                onClickMoveToTerritory={onClickMoveToTerritory}
                                onClickOpenImageUploadModal={() => setIsImageUploadModalOpen(true)}
                                onClickOpenPurchaseModal={() => { setIsPurchaseModalOpen(true) }}
                                onClickOpenProfileEditModal={() => { setIsProfileEditModalOpen(true) }}
                            />
                        )}

                        {activeTab === 'stats' && (
                            <StatsTab
                                isUserInvestmentInfoExist={isUserInvestmentInfoExist}
                                dailyViews={userDailyViewList}
                                previousSundayView={userPreviousSundayView}
                                userViewsRank={userViewsRank}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* 영역 구매 모달 */}
            <PurchaseTileModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
            />

            {/* 프로필 수정 모달 */}
            <TerritoryInfoEditModal
                isOpen={isProfileEditModalOpen}
                onClose={() => setIsProfileEditModalOpen(false)}
            />

            {/* 이미지 업로드 모달 */}
            <ImageUploadModal
                isOpen={isImageUploadModalOpen}
                onClose={() => setIsImageUploadModalOpen(false)}
                onUpload={handleImageUpload}
                currentImageStatus={imageStatus}
            />
        </>)
    )
}
