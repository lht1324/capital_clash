'use client'

import {useState, useEffect, memo, useCallback, useMemo} from 'react'
import { X } from 'lucide-react'
import { useContinentStore } from '@/store/continentStore'
import {Investor, useInvestorStore} from "@/store/investorsStore";
import {getShortEnglishLocaleString} from "@/utils/numberUtils";

type ContributionNotificationData = {
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

interface ContributionNotificationManagerProps {
    isEnabled: boolean
}

type ContributionNotificationProps = {
    notification: ContributionNotificationData
    onClose: (id: string) => void
}

function InvestmentNotificationManager({ isEnabled }: ContributionNotificationManagerProps) {
    const { continents, isSidebarOpen } = useContinentStore()
    const { investors, getStakeUpdatedPlayerList } = useInvestorStore();

    const [notifications, setNotifications] = useState<ContributionNotificationData[]>([])
    const [playerList, setPlayerList] = useState<Investor[]>([]);

    // 🔥 실제 투자 알림만 처리 (테스트 로직 제거됨)
    // 실제 투자가 발생했을 때 알림을 추가하는 함수
    const addNotification = useCallback((notification: ContributionNotificationData) => {
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
        setPlayerList((prevPlayerList) => {
            if (prevPlayerList.length !== 0) {
                const updatedPlayerList = getStakeUpdatedPlayerList(prevPlayerList);
                const notificationList = updatedPlayerList.map((updatedPlayerInfo) => {
                    const { player: updatedPlayer, isNewUser } = updatedPlayerInfo;
                    const prevPlayer = prevPlayerList.find((player) => {
                        return player.id === updatedPlayer.id;
                    });

                    const additionalStakeAmount = prevPlayer
                        ? updatedPlayer.investment_amount - prevPlayer.investment_amount
                        : updatedPlayer.investment_amount;

                    return {
                        id: updatedPlayer.id,
                        investorName: updatedPlayer.name,
                        continentName: continents[updatedPlayer.continent_id].name,
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

            return Object.values(investors);
        })
    }, [investors]);

    if (!isEnabled || notifications.length === 0) return null

    return (
        <div
            className={`fixed z-50 max-w-sm transition-all duration-300 ${toastPosition}`}
            style={toastStyle}
        >
            {notifications.map(notification => (
                <InvestmentToast
                    key={notification.id}
                    notification={notification}
                    onClose={handleCloseNotification}
                />
            ))}
        </div>
    )
}

function InvestmentToast({ notification, onClose }: ContributionNotificationProps) {
    const [isExiting, setIsExiting] = useState(false);

    const isNewStake = useMemo(() => {
        return notification.notificationType === NotificationType.NEW_STAKE;
    }, [notification.notificationType]);

    const handleClose = useCallback(() => {
        setIsExiting(true)
        setTimeout(() => onClose(notification.id), 300)
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true)
            // 애니메이션 시간 후 실제 제거
            setTimeout(() => onClose(notification.id), 300)
        }, 10000)

        return () => clearTimeout(timer)
    }, [notification.id, onClose]);

    useEffect(() => {
        console.log(`newNotification[${notification.investorName}`, notification)
    }, [notification])

    return (
        <div className={`bg-gradient-to-r from-gray-900 to-gray-800 border border-green-500 rounded-xl p-5 shadow-lg shadow-green-900/20 max-w-sm mb-3 ${
            isExiting ? 'animate-slide-out' : 'animate-slide-in'
        }`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3 bg-gray-800/50 p-2 rounded-lg">
                        <span className="text-green-400 text-xl">{isNewStake ? "💰" : "🔥"}</span>
                        <span className="text-base font-bold text-white">{isNewStake ? "Stake dropped!" : "Here comes a new challenger!"}</span>
                    </div>

                    <div className="space-y-2">
                        <div className="text-base text-gray-200 flex flex-wrap items-center">
                            <span className="font-medium text-purple-400 mr-1">[{notification.continentName}]</span>
                            <span className="font-medium text-blue-400">{notification.investorName}</span>
                        </div>

                        <div className="flex text-lg mt-2 mb-2 border-t border-gray-700"/>
                        {/* + $1M -> $47M*/}
                        <div className="flex flex-col justify-center">
                            <div className="w-fit flex flex-row align-middle">
                                <span className="text-base text-gray-400 mr-1">+</span>
                                <span className="text-green-400 font-bold text-lg">
                                    ${getShortEnglishLocaleString(notification.additionalStakeAmount)}
                                </span>
                                <span className="text-base text-gray-400 ml-1 mr-1">{"=>"}</span>
                                <span className="text-blue-400 font-bold text-lg">
                                    ${getShortEnglishLocaleString(notification.totalStakeAmount)}
                                </span>
                            </div>
                            <span className="text-xs text-gray-500">{notification.timestamp.toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white transition-colors ml-2 bg-gray-800/30 p-1 rounded-full"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    )
}

export default memo(InvestmentNotificationManager);
