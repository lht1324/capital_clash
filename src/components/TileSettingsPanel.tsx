'use client'

import { useState } from 'react'
import { useContinentStore, type Investor, type ContinentId } from '@/store/continentStore'

interface TileSettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  investorId: string
  continentId: ContinentId
}

export default function TileSettingsPanel({ 
  isOpen, 
  onClose, 
  investorId, 
  continentId 
}: TileSettingsPanelProps) {
  const { continents, updateInvestorProfile, updateImageStatus } = useContinentStore()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [profileData, setProfileData] = useState({
    description: '',
    website: '',
    contact: ''
  })

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = () => {
    if (imageFile) {
      updateImageStatus(continentId, investorId, 'pending', imagePreview)
      alert('이미지가 업로드되어 승인 대기 중입니다.')
      setImageFile(null)
      setImagePreview('')
    }
  }

  const handleProfileUpdate = () => {
    updateInvestorProfile(continentId, investorId, {
      profileInfo: profileData
    })
    alert('프로필 정보가 업데이트되었습니다.')
  }

  const handleApproveImage = () => {
    updateImageStatus(continentId, investorId, 'approved')
    alert('이미지가 승인되었습니다!')
  }

  const handleRejectImage = () => {
    updateImageStatus(continentId, investorId, 'rejected')
    alert('이미지가 거절되었습니다.')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{investor.name}</h2>
            <p className="text-gray-600">영역 설정 패널</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">투자자 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-600">투자금액:</span>
              <span className="ml-2 font-semibold">${investor.investment.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">지분율:</span>
              <span className="ml-2 font-semibold">{(investor.share * 100).toFixed(2)}%</span>
            </div>
            <div>
              <span className="text-gray-600">영역 색상:</span>
              <span 
                className="ml-2 inline-block w-6 h-6 rounded border"
                style={{ backgroundColor: investor.color }}
              ></span>
            </div>
            <div>
              <span className="text-gray-600">위치:</span>
              <span className="ml-2 font-semibold">
                {investor.tilePosition 
                  ? `(${investor.tilePosition.x}, ${investor.tilePosition.y})` 
                  : '배치 대기중'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">영역 이미지 설정</h3>
          
          <div className="mb-4">
            <span className="text-gray-600">현재 상태:</span>
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              investor.imageStatus === 'approved' ? 'bg-green-100 text-green-800' :
              investor.imageStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              investor.imageStatus === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {investor.imageStatus === 'approved' ? '승인됨' :
               investor.imageStatus === 'pending' ? '승인 대기중' :
               investor.imageStatus === 'rejected' ? '거절됨' :
               '이미지 없음'}
            </span>
          </div>

          {investor.imageUrl && (
            <div className="mb-4">
              <p className="text-gray-600 mb-2">현재 이미지:</p>
              <img 
                src={investor.imageUrl} 
                                  alt="현재 영역 이미지" 
                className="w-32 h-32 object-cover border rounded"
              />
            </div>
          )}

          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            {imagePreview && (
              <div>
                <p className="text-gray-600 mb-2">미리보기:</p>
                <img 
                  src={imagePreview} 
                  alt="미리보기" 
                  className="w-32 h-32 object-cover border rounded"
                />
              </div>
            )}
            
            <button
              onClick={handleImageUpload}
              disabled={!imageFile}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
            >
              이미지 업로드
            </button>
          </div>

          {investor.imageStatus === 'pending' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 mb-2 text-sm">⚡ 테스트용 관리자 기능:</p>
              <div className="space-x-2">
                <button
                  onClick={handleApproveImage}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  승인
                </button>
                <button
                  onClick={handleRejectImage}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  거절
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">프로필 정보</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-600 mb-1">소개글:</label>
              <textarea
                value={profileData.description}
                onChange={(e) => setProfileData({...profileData, description: e.target.value})}
                placeholder="본인 또는 회사 소개를 입력하세요..."
                className="w-full p-2 border border-gray-300 rounded"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">웹사이트:</label>
              <input
                type="url"
                value={profileData.website}
                onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                placeholder="https://example.com"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">연락처:</label>
              <input
                type="text"
                value={profileData.contact}
                onChange={(e) => setProfileData({...profileData, contact: e.target.value})}
                placeholder="이메일 또는 전화번호"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <button
              onClick={handleProfileUpdate}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              프로필 업데이트
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
} 