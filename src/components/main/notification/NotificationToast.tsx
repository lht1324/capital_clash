import {useCallback, useEffect, useMemo, useState, memo} from "react";
import {getShortEnglishLocaleString} from "@/utils/numberUtils";
import {X} from "lucide-react";
import {NotificationData, NotificationType} from "@/components/main/notification/NotificationManager";

export interface NotificationToastProps {
    notification: NotificationData
    onClose: (id: string) => void
}

function NotificationToast({ notification, onClose }: NotificationToastProps) {
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

export default memo(NotificationToast);