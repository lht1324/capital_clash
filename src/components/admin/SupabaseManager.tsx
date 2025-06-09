'use client'

import { useState, useEffect } from 'react'
import { useContinentStore } from '@/store/continentStore'
import { showSuccess, showError, showInfo, showWarning } from '@/components/admin/NotificationSystem'
import { 
  CloudArrowUpIcon, 
  CloudArrowDownIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface SupabaseManagerProps {
  isOpen: boolean
  onClose: () => void
}

export default function SupabaseManager({ isOpen, onClose }: SupabaseManagerProps) {
  const { continents, syncWithSupabase, migrateToSupabase, enableRealTimeSync } = useContinentStore()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [dbStats, setDbStats] = useState<{
    continents: number
    investors: number
    lastSync: Date | null
  }>({ continents: 0, investors: 0, lastSync: null })

  // 컴포넌트 마운트 시 자동 연결 테스트
  useEffect(() => {
    if (isOpen && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      checkConnection()
    }
  }, [isOpen])

  // Supabase 연결 상태 확인
  const checkConnection = async () => {
    setIsLoading(true)
    setConnectionStatus('connecting')
    
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setConnectionStatus('error')
        showError('연결 실패', 'Supabase 환경 변수가 설정되지 않았습니다.')
        return
      }

      const { supabase } = await import('@/lib/supabase')
      const { continents: continentsApi, investors: investorsApi } = await import('@/lib/supabase-api')
      
      // 연결 테스트 및 데이터 통계 수집
      const [continentsData, investorsData] = await Promise.all([
        continentsApi.getAll(),
        investorsApi.getAll()
      ])
      
      setDbStats({
        continents: continentsData.length,
        investors: investorsData.length,
        lastSync: new Date()
      })
      
      setConnectionStatus('connected')
      setIsConnected(true)
      showSuccess('연결 성공', `Supabase 데이터베이스에 성공적으로 연결되었습니다!\n대륙 ${continentsData.length}개, 투자자 ${investorsData.length}명`)
      
    } catch (error: any) {
      setConnectionStatus('error')
      setIsConnected(false)
      showError('연결 실패', `연결 중 오류 발생: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 로컬 데이터를 Supabase로 업로드
  const uploadToSupabase = async () => {
    if (!isConnected) {
      showWarning('업로드 실패', 'Supabase에 먼저 연결해주세요.')
      return
    }

    setIsLoading(true)
    try {
      showInfo('업로드 시작', '로컬 데이터를 Supabase로 업로드하고 있습니다...')
      
      await migrateToSupabase()
      
      // 업로드 후 통계 갱신
      await checkConnection()
      
      const continentCount = Object.keys(continents).length
      const investorCount = Object.values(continents).reduce((total, continent) => 
        total + Object.keys(continent.investors).length, 0
      )
      
      showSuccess('업로드 완료', `${continentCount}개 대륙, ${investorCount}명 투자자 데이터가 성공적으로 업로드되었습니다!`)
      
    } catch (error: any) {
      showError('업로드 실패', `업로드 중 오류 발생: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Supabase에서 데이터 다운로드
  const downloadFromSupabase = async () => {
    if (!isConnected) {
      showWarning('다운로드 실패', 'Supabase에 먼저 연결해주세요.')
      return
    }

    setIsLoading(true)
    try {
      showInfo('다운로드 시작', 'Supabase에서 데이터를 다운로드하고 있습니다...')
      
      await syncWithSupabase()
      
      showSuccess('다운로드 완료', 'Supabase 데이터가 성공적으로 다운로드되어 로컬 스토어에 적용되었습니다!')
      
    } catch (error: any) {
      showError('다운로드 실패', `다운로드 중 오류 발생: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 실시간 동기화 활성화
  const enableRealTime = async () => {
    if (!isConnected) {
      showWarning('동기화 실패', 'Supabase에 먼저 연결해주세요.')
      return
    }

    try {
      enableRealTimeSync()
      showSuccess('실시간 동기화 활성화', '이제 Supabase 데이터 변경사항이 실시간으로 반영됩니다!')
      
    } catch (error: any) {
      showError('동기화 실패', `실시간 동기화 활성화 중 오류 발생: ${error.message}`)
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600'
      case 'connecting': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      case 'connecting': return <WifiIcon className="h-5 w-5 text-yellow-600 animate-pulse" />
      case 'error': return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
      default: return <WifiIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Supabase 연결됨'
      case 'connecting': return '연결 중...'
      case 'error': return '연결 실패'
      default: return '연결되지 않음'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🗄️ Supabase 데이터 관리</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Connection Status */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon()}
                <div>
                  <p className={`font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? 
                      `URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}` : 
                      '환경 변수가 설정되지 않았습니다.'
                    }
                  </p>
                </div>
              </div>
              
              {isConnected && (
                <div className="text-right">
                  <div className="text-sm text-gray-600">데이터베이스 현황</div>
                  <div className="font-medium text-gray-900">
                    대륙 {dbStats.continents}개 | 투자자 {dbStats.investors}명
                  </div>
                  {dbStats.lastSync && (
                    <div className="text-xs text-gray-500">
                      마지막 동기화: {dbStats.lastSync.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 로컬 데이터 현황 */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">로컬 데이터 현황</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-blue-800 font-medium">대륙: {Object.keys(continents).length}개</div>
                <div className="text-sm text-blue-600">
                  {Object.entries(continents).map(([id, continent]) => (
                    <div key={id}>{continent.name} ({Object.keys(continent.investors).length}명)</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-blue-800 font-medium">
                  총 투자자: {Object.values(continents).reduce((total, continent) => 
                    total + Object.keys(continent.investors).length, 0
                  )}명
                </div>
                <div className="text-sm text-blue-600">
                  총 투자금액: ${Object.values(continents).reduce((total, continent) => 
                    total + continent.totalInvestment, 0
                  ).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Connection Test */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <WifiIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="font-medium text-gray-900">연결 테스트</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Supabase 데이터베이스 연결 상태를 확인하고 통계를 가져옵니다.
              </p>
              <button
                onClick={checkConnection}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium"
              >
                {isLoading && connectionStatus === 'connecting' ? '연결 확인 중...' : '연결 테스트'}
              </button>
            </div>

            {/* Upload to Supabase */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <CloudArrowUpIcon className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="font-medium text-gray-900">로컬 → Supabase</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                현재 로컬 데이터를 Supabase 데이터베이스로 업로드합니다.
              </p>
              <button
                onClick={uploadToSupabase}
                disabled={isLoading || !isConnected}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium"
              >
                {isLoading ? '업로드 중...' : '데이터 업로드'}
              </button>
            </div>

            {/* Download from Supabase */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <CloudArrowDownIcon className="h-6 w-6 text-purple-600 mr-2" />
                <h3 className="font-medium text-gray-900">Supabase → 로컬</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Supabase 데이터를 다운로드하여 로컬 스토어에 적용합니다.
              </p>
              <button
                onClick={downloadFromSupabase}
                disabled={isLoading || !isConnected}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg font-medium"
              >
                {isLoading ? '다운로드 중...' : '데이터 다운로드'}
              </button>
            </div>

            {/* Real-time Sync */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <WifiIcon className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="font-medium text-gray-900">실시간 동기화</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Supabase 데이터 변경사항을 실시간으로 감지하고 자동 동기화합니다.
              </p>
              <button
                onClick={enableRealTime}
                disabled={isLoading || !isConnected}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium"
              >
                실시간 동기화 활성화
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">✅ 사용 방법</h4>
              <ol className="text-sm text-green-800 space-y-1">
                <li>1. <strong>"연결 테스트"</strong>로 Supabase 연결을 확인하세요.</li>
                <li>2. <strong>"데이터 업로드"</strong>로 로컬 데이터를 클라우드에 저장하세요.</li>
                <li>3. <strong>"데이터 다운로드"</strong>로 클라우드 데이터를 가져오세요.</li>
                <li>4. <strong>"실시간 동기화"</strong>로 자동 동기화를 활성화하세요.</li>
              </ol>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">⚠️ 주의사항</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• 업로드 시 기존 Supabase 데이터가 덮어씌워집니다.</li>
                <li>• 다운로드 시 현재 로컬 데이터가 대체됩니다.</li>
                <li>• 실시간 동기화는 세션 중에만 유지됩니다.</li>
                <li>• 대용량 데이터의 경우 시간이 소요될 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 