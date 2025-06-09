'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  BellIcon
} from '@heroicons/react/24/outline'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number // 자동 삭제 시간 (ms), undefined면 수동 삭제
  timestamp: Date
  actions?: {
    label: string
    action: () => void
    variant?: 'primary' | 'secondary'
  }[]
}

interface NotificationSystemProps {
  maxNotifications?: number
}

// 전역 알림 관리를 위한 상태
let notificationListeners: ((notifications: Notification[]) => void)[] = []
let currentNotifications: Notification[] = []

// 전역 알림 함수들
export const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
  const newNotification: Notification = {
    ...notification,
    id: `notification_${Date.now()}_${Math.random()}`,
    timestamp: new Date()
  }
  
  currentNotifications = [newNotification, ...currentNotifications]
  notificationListeners.forEach(listener => listener(currentNotifications))
  
  // 자동 삭제 설정
  if (notification.duration !== undefined) {
    setTimeout(() => {
      removeNotification(newNotification.id)
    }, notification.duration)
  }
}

export const removeNotification = (id: string) => {
  currentNotifications = currentNotifications.filter(n => n.id !== id)
  notificationListeners.forEach(listener => listener(currentNotifications))
}

export const clearAllNotifications = () => {
  currentNotifications = []
  notificationListeners.forEach(listener => listener(currentNotifications))
}

// 편의 함수들
export const showSuccess = (title: string, message: string, duration = 5000) => {
  addNotification({ type: 'success', title, message, duration })
}

export const showError = (title: string, message: string, duration?: number) => {
  addNotification({ type: 'error', title, message, duration })
}

export const showWarning = (title: string, message: string, duration = 7000) => {
  addNotification({ type: 'warning', title, message, duration })
}

export const showInfo = (title: string, message: string, duration = 5000) => {
  addNotification({ type: 'info', title, message, duration })
}

export default function NotificationSystem({ maxNotifications = 5 }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    const listener = (newNotifications: Notification[]) => {
      setNotifications(newNotifications.slice(0, maxNotifications))
    }
    
    notificationListeners.push(listener)
    setNotifications(currentNotifications.slice(0, maxNotifications))
    
    return () => {
      notificationListeners = notificationListeners.filter(l => l !== listener)
    }
  }, [maxNotifications])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
    }
  }

  const getNotificationColors = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 w-80 sm:w-96 max-w-[calc(100vw-2rem)]">
      {/* 알림 헤더 */}
      <div className="bg-white shadow-lg rounded-t-lg border border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellIcon className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900 text-sm sm:text-base">
              <span className="hidden sm:inline">알림 ({notifications.length})</span>
              <span className="sm:hidden">알림 {notifications.length}</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-gray-400 hover:text-gray-600 text-sm"
              aria-label={isMinimized ? "알림 펼치기" : "알림 접기"}
            >
              {isMinimized ? '펼치기' : '접기'}
            </button>
            <button
              onClick={clearAllNotifications}
              className="text-gray-400 hover:text-gray-600 text-sm"
              aria-label="모든 알림 삭제"
            >
              전체 삭제
            </button>
          </div>
        </div>
      </div>

      {/* 알림 목록 */}
      {!isMinimized && (
        <div className="bg-white shadow-lg rounded-b-lg border-x border-b border-gray-200 max-h-96 overflow-y-auto">
          <div className="divide-y divide-gray-200">
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`p-4 ${getNotificationColors(notification.type)} transition-all duration-300 ${
                  index === 0 ? 'animate-slide-in-right' : ''
                }`}
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {notification.title}
                        </h4>
                        <p className="text-sm opacity-90 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs opacity-70 mt-2">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="flex-shrink-0 ml-2 text-current opacity-70 hover:opacity-100"
                        aria-label="알림 삭제"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* 액션 버튼들 */}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="flex space-x-2 mt-3">
                        {notification.actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={() => {
                              action.action()
                              removeNotification(notification.id)
                            }}
                            className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                              action.variant === 'primary'
                                ? 'bg-white bg-opacity-20 hover:bg-opacity-30'
                                : 'bg-black bg-opacity-10 hover:bg-opacity-20'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 진행 상황 알림을 위한 특별한 컴포넌트
interface ProgressNotificationProps {
  id: string
  title: string
  progress: number // 0-100
  message?: string
  onCancel?: () => void
}

export function ProgressNotification({ 
  id, 
  title, 
  progress, 
  message,
  onCancel 
}: ProgressNotificationProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <InformationCircleIcon className="h-5 w-5 text-blue-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{title}</h4>
              {message && (
                <p className="text-sm opacity-90 mt-1">{message}</p>
              )}
              
              {/* 진행 바 */}
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>진행률</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-2">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
                >
                  취소
                </button>
              )}
              <button
                onClick={() => removeNotification(id)}
                className="text-current opacity-70 hover:opacity-100"
                aria-label="알림 삭제"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 