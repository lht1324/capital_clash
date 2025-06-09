'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useContinentStore } from '@/store/continentStore'

interface InvestmentNotificationData {
  id: string
  investorName: string
  continentName: string
  amount: number
  totalInvestment: number
  timestamp: Date
}

interface InvestmentNotificationProps {
  notification: InvestmentNotificationData
  onClose: (id: string) => void
}

function InvestmentToast({ notification, onClose }: InvestmentNotificationProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      // 애니메이션 시간 후 실제 제거
      setTimeout(() => onClose(notification.id), 300)
    }, 5000)

    return () => clearTimeout(timer)
  }, [notification.id, onClose])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onClose(notification.id), 300)
  }

  return (
    <div className={`bg-gray-900 border-2 border-green-400 rounded-lg p-4 shadow-2xl max-w-sm mb-3 ${
      isExiting ? 'animate-slide-out' : 'animate-slide-in'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-green-400 text-lg">💰</span>
            <span className="text-sm font-medium text-white">New Investment</span>
          </div>
          
          <div className="space-y-1">
            <div className="text-sm text-gray-300">
              <span className="font-medium text-blue-400">{notification.investorName}</span>
              {' '}invested in{' '}
              <span className="font-medium text-purple-400">{notification.continentName}</span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Amount:</span>
              <span className="text-green-400 font-medium">${notification.amount.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Total:</span>
              <span className="text-blue-400 font-medium">${notification.totalInvestment.toLocaleString()}</span>
            </div>
            
            <div className="text-xs text-gray-500 mt-2">
              {notification.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-white transition-colors ml-2"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

interface InvestmentNotificationManagerProps {
  isEnabled: boolean
}

export default function InvestmentNotificationManager({ isEnabled }: InvestmentNotificationManagerProps) {
  const [notifications, setNotifications] = useState<InvestmentNotificationData[]>([])
  const { isSidebarOpen } = useContinentStore()

  // 🔥 실제 투자 알림만 처리 (테스트 로직 제거됨)
  // 실제 투자가 발생했을 때 알림을 추가하는 함수
  const addNotification = (notification: InvestmentNotificationData) => {
    setNotifications(prev => [notification, ...prev.slice(0, 4)]) // 최대 5개 유지
  }

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
  }, [isEnabled])

  const handleCloseNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  if (!isEnabled || notifications.length === 0) return null

  // 사이드바 상태에 따른 위치 계산
  const getToastPosition = () => {
    if (isSidebarOpen) {
      // 사이드바가 열려있으면 토글 버튼 아래, 사이드바 바깥쪽으로
      return "top-32"
    } else {
      // 사이드바가 닫혀있으면 토글 버튼 아래, 우상단으로
      return "top-32 right-4"
    }
  }
  
  const getToastStyle = () => {
    if (isSidebarOpen) {
      // 사이드바가 열려있으면 정확한 픽셀 값으로 위치 조정
      return { right: '336px' } // 320px(사이드바) + 16px(여유)
    }
    return {}
  }

  return (
    <div 
      className={`fixed z-50 max-w-sm transition-all duration-300 ${getToastPosition()}`}
      style={getToastStyle()}
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