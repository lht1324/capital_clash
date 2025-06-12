'use client'

import { useContinentStore, type ContinentId } from '@/store/continentStore'
import { useEffect } from 'react'

interface ProfileViewModalProps {
  isOpen: boolean
  onClose: () => void
  investorId: string
  continentId: ContinentId
}

export default function ProfileViewModal({ 
  isOpen, 
  onClose, 
  investorId, 
  continentId 
}: ProfileViewModalProps) {
  const { continents, updateInvestorViews } = useContinentStore()

  // 👁️ 프로필 열릴 때 조회수 증가
  useEffect(() => {
    if (isOpen && investorId && continentId) {
      updateInvestorViews(continentId, investorId)
    }
  }, [isOpen, investorId, continentId, updateInvestorViews])

  if (!isOpen) return null

  const continent = continents[continentId]
  const investor = continent?.investors[investorId]

  if (!investor) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">투자자 정보를 찾을 수 없습니다.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ESC 키로 모달 닫기
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  // 외부 링크 열기
  const openExternalLink = (url: string) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else if (url) {
      window.open(`https://${url}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">👤 투자자 프로필</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 투자자 이미지 */}
        {investor.imageStatus === 'approved' && investor.imageUrl && (
          <div className="mb-6 text-center">
            <img 
              src={investor.imageUrl} 
              alt={`${investor.name} 프로필`}
              className="w-32 h-32 mx-auto object-cover rounded-lg border-2 border-gray-200"
            />
          </div>
        )}

        {/* 기본 정보 */}
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">📊 투자 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">👤 투자자명:</span>
                <span className="font-medium">{investor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">💰 투자금:</span>
                <span className="font-medium">${investor.investment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">📈 지분율:</span>
                <span className="font-medium">{(investor.share_percentage * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🎨 영역 색상:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: investor.color }}
                  ></div>
                  <span className="font-mono text-xs">{investor.color}</span>
                </div>
              </div>
              {investor.tilePosition && (
                <div className="flex justify-between">
                  <span className="text-gray-600">📍 영역 위치:</span>
                  <span className="font-medium">
                    ({investor.tilePosition.x}, {investor.tilePosition.y}) 
                    {investor.tilePosition.size}×{investor.tilePosition.size}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 프로필 정보 */}
        {investor.profileInfo && (
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-3">📝 프로필 정보</h3>
              
              {investor.profileInfo.description && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">💬 소개글:</label>
                  <p className="text-gray-800 text-sm leading-relaxed bg-white p-3 rounded border">
                    {investor.profileInfo.description}
                  </p>
                </div>
              )}

              {investor.profileInfo.website && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">🌐 웹사이트:</label>
                  <button
                    onClick={() => openExternalLink(investor.profileInfo!.website!)}
                    className="text-blue-600 hover:text-blue-800 underline text-sm bg-white px-3 py-2 rounded border hover:bg-blue-50 transition-colors"
                  >
                    {investor.profileInfo.website} ↗
                  </button>
                </div>
              )}

              {investor.profileInfo.contact && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">📧 연락처:</label>
                  <p className="text-gray-800 text-sm bg-white p-3 rounded border">
                    {investor.profileInfo.contact}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 이미지 승인 상태 표시 */}
        <div className="mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">🖼️ 이미지 상태</h3>
            <div className="flex items-center gap-2">
              {investor.imageStatus === 'approved' && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  ✅ 승인됨
                </span>
              )}
              {investor.imageStatus === 'pending' && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  ⏳ 승인 대기중
                </span>
              )}
              {investor.imageStatus === 'rejected' && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  ❌ 거절됨
                </span>
              )}
              {investor.imageStatus === 'none' && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  📷 이미지 없음
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
} 