'use client'

import {memo, useCallback, useEffect, useMemo, useState} from 'react'
import {calculatePlayerCoordinates} from "@/lib/treemapAlgorithm";
import {useComponentStateStore} from "@/store/componentStateStore";
import {useCameraStateStore} from "@/store/cameraStateStore";
import TerritoryInfoEditModal from "@/components/main/sidebar/TerritoryInfoEditModal";
import OverviewTab from "@/components/main/sidebar/OverviewTab";
import TerritoryTab from "@/components/main/sidebar/TerritoryTab";
import StatsTab from "@/components/main/sidebar/StatsTab";
import PurchaseTerritoryModal from '../PurchaseTerritoryModal'
import ImageUploadModal from './ImageUploadModal'
import {ImageStatus} from "@/api/types/supabase/Players";
import {useContinentStore} from "@/store/continentStore";
import {usePlayersStore} from "@/store/playersStore";
import {useUserStore} from "@/store/userStore";
import {playersClientAPI} from "@/api/client/supabase/playersClientAPI";
import {polarClientAPI} from "@/api/client/polar/polarClientAPI";
import {imagesClientAPI} from "@/api/client/supabase/imagesClientAPI";

export interface SidebarClientProps {

}

function SidebarClient(props: SidebarClientProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'territory' | 'stats'>('overview')
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
    const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);

    // 각 대륙별 현재 유저 수 계산
    const { isSidebarOpen, setIsSidebarOpen } = useComponentStateStore();
    const { setCameraTarget } = useCameraStateStore();

    const { continents } = useContinentStore();
    const { playerList, vipPlayerList } = usePlayersStore();
    const { user } = useUserStore();

    const userPlayerInfo = useMemo(() => {
        return playerList.find((player) => {
            return player.user_id === user?.id;
        }) ?? null;
    }, [playerList, user?.id]);

    const userImageUrl = useMemo(() => {
        return userPlayerInfo?.image_url ?? null;
    }, [userPlayerInfo?.image_url]);

    const userImageStatus = useMemo(() => {
        return userPlayerInfo?.image_status ?? ImageStatus.PENDING;
    }, [userPlayerInfo?.image_status]);

    const onClickMoveToTerritory = useCallback(() => {
        if (userPlayerInfo) {
            const filteredPlayerListByContinent = playerList.filter((player) => {
                return player.continent_id === userPlayerInfo.continent_id;
            });

            const userCoordinates = calculatePlayerCoordinates(
                vipPlayerList,
                filteredPlayerListByContinent,
                userPlayerInfo.continent_id,
                userPlayerInfo.id,
            );

            if (userCoordinates) {
                setCameraTarget(userCoordinates);
            }
        }
    }, [userPlayerInfo, playerList, vipPlayerList, setCameraTarget]);

    const onClickSwitchContinent = useCallback(async (selectedContinentId: string) => {
        if (!userPlayerInfo) {
            console.error('User or territory info not found');
            return;
        }

        const prevContinentName = continents[userPlayerInfo.continent_id]?.name;
        const selectedContinentName = continents[selectedContinentId]?.name;
        const isConfirmed = confirm(`Are you sure you wanna move from ${prevContinentName} to ${selectedContinentName}?`);

        if (isConfirmed) {
            try {
                const isAlreadyChangedContinent = userPlayerInfo.is_changed_continent; // once free, patchPlayers or postCheckout

                if (isAlreadyChangedContinent) {
                    const getProductsResponse = await polarClientAPI.getProductsClient();

                    const productId = getProductsResponse.items.find((item) => {
                        return item.name.includes("continent");
                    })?.id;

                    if (!productId || !user) {
                        throw new Error("No product found.");
                    }

                    const postCheckoutsResponse = await polarClientAPI.postCheckoutsChangeContinentClient(
                        productId,
                        userPlayerInfo.id,
                        selectedContinentId,
                        user.email,
                    );

                    window.location.assign(postCheckoutsResponse.url);
                } else {
                    await playersClientAPI.patchPlayersById(
                        userPlayerInfo.id,
                        {
                            continent_id: selectedContinentId,
                            is_changed_continent: true,
                        }
                    )

                    alert(`Continent moved from ${continents[userPlayerInfo.continent_id]?.name} to ${continents[selectedContinentId]?.name}!`);
                }
            } catch (error) {
                console.error('Failed to switch continent:', error);
            }
        }
    }, [continents, user, userPlayerInfo]);

    // Handle image upload
    const handleImageUpload = useCallback(async (file: File) => {
        console.log(`🖼️ Image uploaded: ${file.name}, Size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`)

        if (!user || !userPlayerInfo) {
            alert('❌ Unable to verify login status or stake information.')
            return
        }

        try {
            // Approved 상태이고 기존 이미지가 있는 경우 삭제
            if (userImageUrl) {
                try {
                    console.log('🗑️ 기존 이미지 삭제 시작...')

                    const { isDeleteSuccess } = await imagesClientAPI.deleteImage(userImageUrl);

                    if (isDeleteSuccess) {
                        console.log('✅ 기존 이미지 삭제 완료');
                    } else {
                        console.warn('⚠️ 기존 이미지 삭제에 실패했지만 새 이미지 업로드를 계속 진행합니다.');
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
            const result = await imagesClientAPI.postImage(file, user.id, userPlayerInfo.id);

            // 성공 메시지 표시
            if (result) {
                alert(
                    `✅ Image successfully ${userImageStatus === ImageStatus.APPROVED ? "replaced" : "uploaded"}! Image is currently under review.`
                )
            } else {
                throw Error('Image upload failed.');
            }
            // console.log('업로드 성공:', imageData)
        } catch (error) {
            console.error('이미지 업로드 실패:', error)
            alert('❌ Image upload failed. Please try again.')
        }
    }, [user, userPlayerInfo, userImageUrl, userImageStatus]);

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
                                onClickOpenImageUploadModal={() => setIsImageUploadModalOpen(true)}
                                onClickOpenPurchaseModal={() => { setIsPurchaseModalOpen(true) }}
                            />
                        )}

                        {activeTab === 'territory' && (
                            <TerritoryTab
                                onClickMoveToTerritory={onClickMoveToTerritory}
                                onClickSwitchContinent={onClickSwitchContinent}
                                onClickOpenImageUploadModal={() => setIsImageUploadModalOpen(true)}
                                onClickOpenPurchaseModal={() => { setIsPurchaseModalOpen(true) }}
                                onClickOpenProfileEditModal={() => { setIsProfileEditModalOpen(true) }}
                            />
                        )}

                        {activeTab === 'stats' && (
                            <StatsTab/>
                        )}
                    </div>
                </div>
            </div>

            {/* 영역 구매 모달 */}
            {isPurchaseModalOpen && <PurchaseTerritoryModal
                onClose={() => setIsPurchaseModalOpen(false)}
            />}

            {/* 프로필 수정 모달 */}
            {isProfileEditModalOpen && userPlayerInfo && <TerritoryInfoEditModal
                onClose={() => setIsProfileEditModalOpen(false)}
            />}

            {/* 이미지 업로드 모달 */}
            {isImageUploadModalOpen && <ImageUploadModal
                onClose={() => setIsImageUploadModalOpen(false)}
                onUpload={handleImageUpload}
            />}
        </>)
    )
}

export default memo(SidebarClient);