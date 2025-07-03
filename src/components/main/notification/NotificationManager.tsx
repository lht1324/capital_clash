'use client'

import {useState, useEffect, memo, useCallback, useMemo} from 'react'
import {UpdateType} from "@/api/types/supabase/players/PlayerUpdates";
import {useContinentStore} from "@/store/continentStore";
import {usePlayersStore} from "@/store/playersStore";
import {useComponentStateStore} from "@/store/componentStateStore";
import {Player} from "@/api/types/supabase/Players";
import NotificationToast from "@/components/main/notification/NotificationToast";

export interface NotificationData {
    id: string
    investorName: string
    continentName: string
    continentColor: string
    additionalStakeAmount: number
    totalStakeAmount: number
    timestamp: Date
    notificationType: NotificationType
}

export enum NotificationType {
    NEW_STAKE = 'NEW_STAKE',
    NEW_USER = 'NEW_USER',
    CONTINENT_CHANGE = 'CONTINENT_CHANGE',
    NO_NEED_TO_NOTIFY = 'NO_NEED_TO_NOTIFY'
}

interface NotificationManagerProps {
    // continentList: Continent[],
    // playerList: Player[],
    isEnabled: boolean
}

function NotificationManager({
    // continentList,
    // playerList,
    isEnabled
}: NotificationManagerProps) {
    const { continentList } = useContinentStore();
    const { lastUpdatedPlayerList } = usePlayersStore();
    const { isSidebarOpen } = useComponentStateStore();

    const [notifications, setNotifications] = useState<NotificationData[]>([])

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
        if (lastUpdatedPlayerList.length === 0) return;

        const notificationList: NotificationData[] = lastUpdatedPlayerList.map((updatedPlayerInfo) => {
            const { player: updatedPlayer, updateType, previousStake } = updatedPlayerInfo;

            const additionalStakeAmount = updateType === UpdateType.STAKE_CHANGE && previousStake !== undefined
                ? updatedPlayer.stake_amount - previousStake
                : updatedPlayer.stake_amount;

            const continent = continentList.find((continent) => {
                return continent.id === updatedPlayer.continent_id;
            }) ?? null;
            const continentName = continent?.name ?? "-";
            const continentColor = continent?.color ?? "#6B7280";

            let notificationType: NotificationType;
            switch (updateType) {
                case UpdateType.NEW_PLAYER: {
                    notificationType = NotificationType.NEW_USER;
                    break;
                }
                case UpdateType.STAKE_CHANGE: {
                    notificationType = NotificationType.NEW_STAKE;
                    break;
                }
                case UpdateType.CONTINENT_CHANGE: {
                    notificationType = NotificationType.CONTINENT_CHANGE;
                    break;
                }
                default: {
                    notificationType = NotificationType.NO_NEED_TO_NOTIFY;
                }
            }

            return notificationType !== NotificationType.NO_NEED_TO_NOTIFY
                ? {
                    id: updatedPlayer.id,
                    investorName: updatedPlayer.name,
                    continentName: continentName,
                    continentColor: continentColor,
                    additionalStakeAmount: additionalStakeAmount,
                    totalStakeAmount: updatedPlayer.stake_amount,
                    timestamp: new Date(),
                    notificationType: notificationType
                }
                : null;
        }).filter((notificationData) => {
            return notificationData !== null;
        });

        setNotifications(notificationList);
    }, [lastUpdatedPlayerList, continentList]);

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
