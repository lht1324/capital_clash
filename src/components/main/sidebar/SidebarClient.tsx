'use client'

import {memo, useCallback, useEffect, useMemo, useState} from 'react'
import { calculateInvestorCoordinates } from "@/lib/treemapAlgorithm";
import { storageAPI } from '@/lib/supabase/supabase-storage-api';
import { investorsAPI } from "@/lib/supabase/supabase-investors-api";
import {useComponentStateStore} from "@/store/componentStateStore";
import {useCameraStateStore} from "@/store/cameraStateStore";
import TerritoryInfoEditModal from "@/components/main/sidebar/TerritoryInfoEditModal";
import OverviewTab from "@/components/main/sidebar/OverviewTab";
import TerritoryTab from "@/components/main/sidebar/TerritoryTab";
import StatsTab from "@/components/main/sidebar/StatsTab";
import PurchaseTerritoryModal from '../PurchaseTerritoryModal'
import ImageUploadModal from './ImageUploadModal'
import {Continent} from "@/api/server/supabase/types/Continents";
import {ImageStatus, Player} from "@/api/server/supabase/types/Players";
import {User} from "@/api/server/supabase/types/Users";

export interface SidebarClientProps {
    user?: User | null
    /* 원본 데이터 */
    continentList: Continent[];      // 대륙 전체
    playerList: Player[];            // 전체 플레이어
    vipPlayerList: Player[];         // 상위 4명

    /* 사용자-특화 데이터 */
    userInvestmentInfo: Player | null;     // 로그인 사용자의 투자 정보 (없으면 undefined)
    filteredPlayerListByContinent: Player[];  // 같은 대륙 플레이어만
    isVip: boolean;                  // 상위 4명 안에 포함?
    isUserInvestmentInfoExist: boolean;

    /* 금액·지분 */
    investmentAmount: number;        // 내가 투자한 금액
    totalInvestmentAmount: number;   // 내 대륙 총 투자 금액
    sharePercentage: number;         // 내 지분(%)

    /* 랭킹 */
    userContinentRank: number;       // 대륙 내 순위 (없으면 –1)
    userOverallRank: number;         // 전체 순위 (없으면 –1)
    userViewsRank: number;           // 조회수 순위 (없으면 –1)

    /* 프로필 이미지 · 상태 */
    imageUrl?: string;               // 이미지 URL (없으면 undefined)
    imageStatus: ImageStatus;        // PENDING | APPROVED | REJECTED …

    /* 부가 정보 */
    continentName: string;           // 사용자가 속한 대륙 이름 ("-": 미정)
    userCreatedDate: string;         // 가입 일자(로컬 문자열) 또는 "-"
    userDailyViewList: number[];     // 최근 7일 조회수
    userPreviousSundayView: number;  // 전 주 일요일 조회수
}

function SidebarClient(props: SidebarClientProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'territory' | 'stats'>('overview')
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
    const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);

    // 각 대륙별 현재 유저 수 계산
    const { isSidebarOpen, setIsSidebarOpen } = useComponentStateStore();
    const { setCameraTarget } = useCameraStateStore();

    // 로그인하지 않은 경우 아무것도 렌더링하지 않음
    // if (!user) return null;

    const {
        user,
        /* 원본 데이터 */
        continentList,
        playerList,
        vipPlayerList,
        /* 사용자-특화 데이터 */
        userInvestmentInfo,
        filteredPlayerListByContinent,
        isVip,
        isUserInvestmentInfoExist,
        /* 금액·지분 */
        investmentAmount,
        totalInvestmentAmount,
        sharePercentage,
        /* 랭킹 */
        userContinentRank,
        userOverallRank,
        userViewsRank,
        /* 프로필 이미지 · 상태 */
        imageUrl,
        imageStatus,
        /* 부가 정보 */
        continentName,
        userCreatedDate,
        userDailyViewList,
        userPreviousSundayView,
    } = useMemo(() => {
        return props;
    }, [props]);

    const onClickMoveToTerritory = useCallback(() => {
        const userCoordinates = calculateInvestorCoordinates(
            vipPlayerList,
            filteredPlayerListByContinent,
            continentName.toLowerCase(),
            isVip,
            user?.id,
        );

        if (userCoordinates) {
            setCameraTarget(userCoordinates);
        }
    }, [vipPlayerList, filteredPlayerListByContinent, isVip, user?.id, setCameraTarget]);

    const onClickSwitchContinent = useCallback(async (selectedContinentId: string) => {
        if (!userInvestmentInfo) {
            console.error('User or investment info not found');
            return;
        }

        const selectedContinentName = continentList.find((continent) => {
            return continent.id === selectedContinentId;
        })?.name;
        const isConfirmed = confirm(`Are you sure you wanna move from ${continentName} to ${selectedContinentName}?`);

        if (isConfirmed) {
            try {
                // Update the investor's continent_id
                const result = await investorsAPI.updateContinentId(userInvestmentInfo.id, selectedContinentId);
                console.log(`Continent switched to: ${selectedContinentId}`, result);
            } catch (error) {
                console.error('Failed to switch continent:', error);
            }
        }
    }, [userInvestmentInfo]);

    // Handle image upload
    const handleImageUpload = useCallback(async (file: File) => {
        console.log(`🖼️ Image uploaded: ${file.name}, Size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`)

        if (!user || !userInvestmentInfo) {
            alert('❌ 로그인 상태 또는 투자 정보를 확인할 수 없습니다.')
            return
        }

        try {
            // Approved 상태이고 기존 이미지가 있는 경우 삭제
            if (imageUrl) {
                try {
                    console.log('🗑️ 기존 이미지 삭제 시작...')

                    // 1. 기존 이미지의 images 테이블 레코드 찾기
                    const imageList = await storageAPI.getImagesByInvestorId(userInvestmentInfo.id);
                    const existingImage = imageList.find((imageInfo) => {
                        return imageInfo.original_url === imageUrl;
                    });

                    if (existingImage) {
                        // 2. 파일 경로 추출
                        const filePath = storageAPI.getFilePathFromUrl(existingImage.original_url);

                        if (filePath) {
                            // 3. 기존 이미지 삭제
                            const deleteSuccess = await storageAPI.deleteImage(existingImage.id, filePath);
                            if (deleteSuccess) {
                                console.log('✅ 기존 이미지 삭제 완료');
                            } else {
                                console.warn('⚠️ 기존 이미지 삭제에 실패했지만 새 이미지 업로드를 계속 진행합니다.');
                            }
                        } else {
                            console.log('✅ 기존 이미지 경로가 존재하지 않습니다.');
                        }
                    }
                } catch (deleteError) {
                    console.error('❌ 기존 이미지 삭제 실패:', deleteError);
                    // 삭제 실패해도 새 이미지 업로드는 계속 진행
                }
            }

            // 로딩 상태 표시 (실제 구현에서는 상태 변수를 사용할 수 있음)
            const loadingMessage = `이미지를 업로드 중입니다...`
            console.log(loadingMessage)

            // Supabase Storage에 이미지 업로드
            const { imageData, error } = await storageAPI.uploadImage(
                file,
                user.id,
                userInvestmentInfo.id
            )

            console.log("imageData", imageData);
            console.log("error", error);
            if (error) {
                throw error
            }

            // 성공 메시지 표시
            const successMessage = imageStatus === ImageStatus.APPROVED 
                ? `✅ 이미지 "${file.name}"가 성공적으로 교체되었습니다! 이미지는 현재 검토 중입니다.`
                : `✅ 이미지 "${file.name}"가 성공적으로 업로드되었습니다! 이미지는 현재 검토 중입니다.`;
            alert(successMessage)
            console.log('업로드 성공:', imageData)
        } catch (error) {
            console.error('이미지 업로드 실패:', error)
            alert('❌ 이미지 업로드에 실패했습니다. 다시 시도해 주세요.')
        }
    }, [user, userInvestmentInfo, imageStatus, imageUrl]);

    useEffect(() => {
        if (!user) {
            setIsSidebarOpen(false);
        }
    }, [user]);

    return (
        (user && <>
            {/* 사이드바 토글 버튼 - 오른쪽으로 이동 */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
                            onClick={() => setActiveTab('territory')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'territory'
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
                                continentName={continentName}
                                onClickOpenImageUploadModal={() => setIsImageUploadModalOpen(true)}
                                onClickOpenPurchaseModal={() => { setIsPurchaseModalOpen(true) }}
                            />
                        )}

                        {activeTab === 'territory' && (
                            <TerritoryTab
                                isUserInvestmentInfoExist={isUserInvestmentInfoExist}
                                investorList={playerList}
                                investmentAmount={investmentAmount}
                                sharePercentage={sharePercentage}
                                imageUrl={imageUrl}
                                imageStatus={imageStatus}
                                createdDate={userCreatedDate}
                                continentName={continentName}
                                continentList={continentList.filter((continent) => continent.id !== "central")}
                                onClickMoveToTerritory={onClickMoveToTerritory}
                                onClickSwitchContinent={onClickSwitchContinent}
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
            {isPurchaseModalOpen && <PurchaseTerritoryModal
                continentList={continentList}
                playerList={playerList}
                user={user}
                userPlayerInfo={userInvestmentInfo}
                onClose={() => setIsPurchaseModalOpen(false)}
            />}

            {/* 프로필 수정 모달 */}
            {isProfileEditModalOpen && userInvestmentInfo && <TerritoryInfoEditModal
                user={user}
                userPlayerInfo={userInvestmentInfo}
                onClose={() => setIsProfileEditModalOpen(false)}
            />}

            {/* 이미지 업로드 모달 */}
            {isImageUploadModalOpen && <ImageUploadModal
                onClose={() => setIsImageUploadModalOpen(false)}
                onUpload={handleImageUpload}
                currentImageStatus={imageStatus}
            />}
        </>)
    )
}

export default memo(SidebarClient);