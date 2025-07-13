import {memo, useCallback, useEffect, useMemo, useState} from "react";
import {getShortEnglishLocaleString} from "@/utils/numberUtils";
import {X} from "lucide-react";
import {NotificationData, NotificationType} from "@/components/main/notification/NotificationManager";

export interface NotificationToastProps {
    notification: NotificationData
    onClose: (id: string, timestamp: Date) => void
}

function NotificationToast({ notification, onClose }: NotificationToastProps) {
    const [isExiting, setIsExiting] = useState(false);

    const notificationEmoji = useMemo(() => {
        return notification.notificationType === NotificationType.NEW_STAKE
            ? "💰"
            : notification.notificationType === NotificationType.NEW_USER
                ? "🔥"
                : "️🚨";
    }, [notification.notificationType]);

    const notificationTitle = useMemo(() => {
        const tailWindStyle = "text-[16px] font-bold text-white";

        return notification.notificationType === NotificationType.NEW_STAKE
            ? <span className={tailWindStyle}>
                Stake dropped!
            </span>
            : notification.notificationType === NotificationType.NEW_USER
                ? <span className={tailWindStyle}>
                    Here comes a new challenger!
                </span>
                : <span className={tailWindStyle}>
                    Attention, <b style={{ color: notification.continentColor }}>{notification.continentName}</b>! Incoming!
                </span>;
    }, [notification.notificationType, notification.continentName, notification.continentColor]);

    const notificationStakeInfo = useMemo(() => {
        const fontSizeNormal = "text-[16px]";
        const fontSizeSmall = "text-[14px]"

        return notification.notificationType === NotificationType.NEW_STAKE ? (<div className="w-fit flex flex-row align-middle">
            <span className={`${fontSizeSmall} text-gray-400 mr-1`}>+</span>
            <span className={`${fontSizeNormal} font-bold text-green-400`}>
                ${getShortEnglishLocaleString(notification.additionalStakeAmount)}
            </span>
            <span className={`${fontSizeSmall} text-gray-400 ml-1 mr-1`}>
                {"=>"}
            </span>
            <span className={`${fontSizeNormal} font-bold text-blue-400`}>
                ${getShortEnglishLocaleString(notification.totalStakeAmount)}
            </span>
        </div>) : (<div className="w-fit flex flex-row align-center">
            <span className={`${fontSizeNormal} text-gray-400 mr-1`}>
                {"Total Stack:"}
            </span>
            <span className={`${fontSizeNormal} font-bold text-blue-400`}>
                ${getShortEnglishLocaleString(notification.totalStakeAmount)}
            </span>
        </div>)
    }, [notification.notificationType, notification.additionalStakeAmount, notification.totalStakeAmount]);

    const handleClose = useCallback(() => {
        setIsExiting(true)
        setTimeout(() => onClose(notification.id, notification.timestamp), 300)
    }, [notification.id, notification.timestamp]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true)
            // 애니메이션 시간 후 실제 제거
            setTimeout(() => onClose(notification.id, notification.timestamp), 300)
        }, 10000)

        return () => clearTimeout(timer)
    }, [notification.id, notification.timestamp, onClose]);

    return (
        <div className={`bg-gradient-to-r from-gray-900 to-gray-800 border border-green-500 rounded-xl p-5 shadow-lg shadow-green-900/20 max-w-sm mb-3 ${
            isExiting ? 'animate-slide-out' : 'animate-slide-in'
        }`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3 pt-2 pb-2 rounded-lg">
                        <span className="text-green-400 text-[18px]">{notificationEmoji}</span>
                        {notificationTitle}
                    </div>

                    <div className="space-y-2">
                        <div className="text-base text-gray-200 flex flex-wrap items-center">
                            <span
                                className="font-medium text-[16px] mr-1"
                                style={{ color: `${notification.continentColor}`}}
                            >
                                [{notification.continentName}]
                            </span>
                            <span className="font-medium text-[16px] text-blue-400">{notification.playerName}</span>
                        </div>

                        <div className="flex text-lg mt-2 mb-2 border-t border-gray-700"/>
                        {/* 대륙 변경, 신규 유저일 땐 토탈만 보여주자*/}
                        <div className="flex flex-col justify-center">
                            {notificationStakeInfo}
                            <span className="text-xs text-gray-500 mt-1">{notification.timestamp.toLocaleTimeString()}</span>
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

export default memo(NotificationToast);