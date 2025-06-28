'use client'

import {useState, useEffect, memo, useCallback, useMemo} from 'react'
import {Investor, useInvestorStore} from "@/store/investorsStore";
import {useComponentStateStore} from "@/store/componentStateStore";
import NotificationToast from "@/components/main/notification/NotificationToast";
import {Continent} from "@/api/types/supabase/Continents";
import {Player} from "@/api/types/supabase/Players";

export interface NotificationData {
    id: string
    investorName: string
    continentName: string
    additionalStakeAmount: number
    totalStakeAmount: number
    timestamp: Date
    notificationType: NotificationType
}

export enum NotificationType {
    NEW_STAKE = 'NEW_STAKE',
    NEW_USER = 'NEW_USER',
}

interface NotificationManagerProps {
    continentList: Continent[],
    playerList: Player[],
    isEnabled: boolean
}

function NotificationManager({
    continentList,
    playerList,
    isEnabled
}: NotificationManagerProps) {
    const { isSidebarOpen } = useComponentStateStore();
    const { getStakeUpdatedPlayerList } = useInvestorStore();

    const [notifications, setNotifications] = useState<NotificationData[]>([])
    const [triggerPlayerList, setTriggerPlayerList] = useState<Player[]>([]);

    // 🔥 실제 투자 알림만 처리 (테스트 로직 제거됨)
    // 실제 투자가 발생했을 때 알림을 추가하는 함수
    const addNotification = useCallback((notification: NotificationData) => {
        setNotifications((prev) => {
            return [notification, ...prev.slice(0, 4)];
        }) // 최대 5개 유지
    }, []);

    const handleCloseNotification = useCallback((id: string) => {
        setNotifications((prev) => {
            return prev.filter(notification => notification.id !== id);
        })
    }, []);

    // 사이드바 상태에 따른 위치 계산
    const toastPosition = useMemo(() => {
        return isSidebarOpen
            ? "top-32" // 사이드바가 열려있으면 토글 버튼 아래, 사이드바 바깥쪽으로
            : "top-32 right-4"; // 사이드바가 닫혀있으면 토글 버튼 아래, 우상단으로
    }, [isSidebarOpen]);

    const toastStyle = useMemo(() => {
        return isSidebarOpen
            // 사이드바가 열려있으면 정확한 픽셀 값으로 위치 조정
            ? { right: '336px' } // 320px(사이드바) + 16px(여유)
            : { }
    }, [isSidebarOpen]);

    // 전역 알림 함수로 등록 (실제 투자 시 호출됨)
    useEffect(() => {
        if (!isEnabled) return

        // 전역 window 객체에 알림 함수 등록
        if (typeof window !== 'undefined') {
            (window as any).addInvestmentNotification = addNotification
        }

        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).addInvestmentNotification
            }
        }
    }, [isEnabled]);

    useEffect(() => {
        setTriggerPlayerList((prevTriggerPlayerList) => {
            if (prevTriggerPlayerList.length !== 0) {
                const updatedPlayerList = getStakeUpdatedPlayerList(prevTriggerPlayerList);
                const notificationList = updatedPlayerList.map((updatedPlayerInfo) => {
                    const { player: updatedPlayer, isNewUser } = updatedPlayerInfo;
                    const prevPlayer = prevTriggerPlayerList.find((player) => {
                        return player.id === updatedPlayer.id;
                    });

                    const additionalStakeAmount = prevPlayer
                        ? updatedPlayer.investment_amount - prevPlayer.investment_amount
                        : updatedPlayer.investment_amount;

                    const continentName = continentList.find((continent) => {
                        return continent.id === updatedPlayer.continent_id;
                    })?.name ?? "-";

                    return {
                        id: updatedPlayer.id,
                        investorName: updatedPlayer.name,
                        continentName: continentName,
                        additionalStakeAmount: additionalStakeAmount,
                        totalStakeAmount: updatedPlayer.investment_amount,
                        timestamp: new Date(),
                        notificationType: isNewUser
                            ? NotificationType.NEW_USER
                            : NotificationType.NEW_STAKE
                    }
                });

                setNotifications(notificationList)
            }

            return prevTriggerPlayerList;
        })
    }, [playerList]);

    if (!isEnabled || notifications.length === 0) return null

    return (
        <div
            className={`fixed z-50 max-w-sm transition-all duration-300 ${toastPosition}`}
            style={toastStyle}
        >
            {notifications.map(notification => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                    onClose={handleCloseNotification}
                />
            ))}
        </div>
    )
}

export default memo(NotificationManager);
