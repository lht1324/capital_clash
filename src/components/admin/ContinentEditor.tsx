'use client'

import { useState, useEffect } from 'react'
import { useContinentStore, ContinentId, CONTINENTS } from '@/store/continentStore'
import { 
  MapIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
  Cog6ToothIcon,
  EyeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'

interface ContinentEditForm {
  name: string
  description: string
  color: string
  themeColor: string
  maxUsers: number
  position: [number, number, number]
  cameraTarget: [number, number, number]
  maxInitialShare: number
}

export default function ContinentEditor() {
  const { continents, updateContinentPositions } = useContinentStore()
  const [selectedContinentId, setSelectedContinentId] = useState<ContinentId | null>(null)
  const [editForm, setEditForm] = useState<ContinentEditForm | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const continentIds: ContinentId[] = ['northwest', 'northeast', 'center', 'southwest', 'southeast']

  const handleSelectContinent = (continentId: ContinentId) => {
    setSelectedContinentId(continentId)
    const continent = continents[continentId]
    setEditForm({
      name: continent.name,
      description: continent.description,
      color: continent.color,
      themeColor: continent.themeColor,
      maxUsers: continent.maxUsers,
      position: [...continent.position],
      cameraTarget: [...continent.cameraTarget],
      maxInitialShare: continent.maxInitialShare
    })
    setIsEditing(false)
  }

  const handleUpdatePosition = (axis: 'x' | 'y' | 'z', value: number, type: 'position' | 'camera') => {
    if (!editForm) return
    
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    
    if (type === 'position') {
      const newPosition = [...editForm.position] as [number, number, number]
      newPosition[axisIndex] = value
      setEditForm({ ...editForm, position: newPosition })
    } else {
      const newCameraTarget = [...editForm.cameraTarget] as [number, number, number]
      newCameraTarget[axisIndex] = value
      setEditForm({ ...editForm, cameraTarget: newCameraTarget })
    }
  }

  const handleSaveChanges = () => {
    if (!editForm || !selectedContinentId) return
    
    // Store 업데이트 로직 (실제 구현에서는 store action 추가 필요)
    console.log('대륙 업데이트:', selectedContinentId, editForm)
    setIsEditing(false)
    
    // 동적 위치 업데이트 실행
    updateContinentPositions()
  }

  const handleResetToDefault = () => {
    if (!selectedContinentId) return
    
    const defaultContinent = CONTINENTS[selectedContinentId]
    setEditForm({
      name: defaultContinent.name,
      description: defaultContinent.description,
      color: defaultContinent.color,
      themeColor: defaultContinent.themeColor,
      maxUsers: defaultContinent.maxUsers,
      position: [...defaultContinent.position],
      cameraTarget: [...defaultContinent.cameraTarget],
      maxInitialShare: defaultContinent.maxInitialShare
    })
  }

  const getPositionDisplay = (position: [number, number, number]) => {
    return `(${position[0].toFixed(1)}, ${position[1].toFixed(1)}, ${position[2].toFixed(1)})`
  }

  const getContinentStatusColor = (continentId: ContinentId) => {
    const continent = continents[continentId]
    const utilizationRate = continent.currentUsers / continent.maxUsers
    
    if (utilizationRate >= 0.8) return 'text-red-600 bg-red-50'
    if (utilizationRate >= 0.5) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <MapIcon className="h-8 w-8 text-blue-600 mr-3" />
            대륙 편집기
          </h2>
          <p className="mt-1 text-gray-600">
            대륙 위치, 속성 및 카메라 설정 관리
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              previewMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <EyeIcon className="h-4 w-4" />
            <span>{previewMode ? '편집 모드' : '미리보기'}</span>
          </button>
          
          <button
            onClick={updateContinentPositions}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <ArrowsPointingOutIcon className="h-4 w-4" />
            <span>동적 재배치</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Continent List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">대륙 목록</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {continentIds.map((continentId) => {
                const continent = continents[continentId]
                const isSelected = selectedContinentId === continentId
                
                return (
                  <div
                    key={continentId}
                    onClick={() => handleSelectContinent(continentId)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: continent.color }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{continent.name}</p>
                          <p className="text-sm text-gray-500 truncate">{continent.description}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getContinentStatusColor(continentId)}`}>
                          {continent.currentUsers}/{continent.maxUsers}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {getPositionDisplay(continent.position)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Add New Continent Button */}
          <button className="w-full mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
            <PlusIcon className="h-6 w-6 mx-auto mb-2" />
            <span className="text-sm">새 대륙 추가</span>
          </button>
        </div>

        {/* Continent Editor */}
        <div className="lg:col-span-2">
          {selectedContinentId && editForm ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-lg font-medium text-gray-900">기본 정보</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`px-3 py-1.5 rounded-md text-sm flex items-center space-x-1 ${
                        isEditing 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>{isEditing ? '저장' : '편집'}</span>
                    </button>
                    
                    <button
                      onClick={handleResetToDefault}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">대륙 이름</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">최대 사용자</label>
                    <input
                      type="number"
                      value={editForm.maxUsers}
                      onChange={(e) => setEditForm({ ...editForm, maxUsers: parseInt(e.target.value) })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      disabled={!isEditing}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">대륙 색상</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        disabled={!isEditing}
                        className="h-10 w-20 border border-gray-300 rounded-md disabled:opacity-50"
                      />
                      <input
                        type="text"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        disabled={!isEditing}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">테마 색상</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={editForm.themeColor}
                        onChange={(e) => setEditForm({ ...editForm, themeColor: e.target.value })}
                        disabled={!isEditing}
                        className="h-10 w-20 border border-gray-300 rounded-md disabled:opacity-50"
                      />
                      <input
                        type="text"
                        value={editForm.themeColor}
                        onChange={(e) => setEditForm({ ...editForm, themeColor: e.target.value })}
                        disabled={!isEditing}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Position Settings */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">위치 설정</h3>
                
                <div className="space-y-6">
                  {/* 대륙 위치 */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-4">대륙 위치</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {(['x', 'y', 'z'] as const).map((axis, index) => (
                        <div key={axis}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {axis.toUpperCase()} 축
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.position[index]}
                            onChange={(e) => handleUpdatePosition(axis, parseFloat(e.target.value), 'position')}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 카메라 타겟 */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-4">카메라 타겟</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {(['x', 'y', 'z'] as const).map((axis, index) => (
                        <div key={axis}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {axis.toUpperCase()} 축
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={editForm.cameraTarget[index]}
                            onChange={(e) => handleUpdatePosition(axis, parseFloat(e.target.value), 'camera')}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <Cog6ToothIcon className="h-5 w-5 mr-2" />
                  고급 설정
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최대 초기 지분율 (0-1)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={editForm.maxInitialShare}
                    onChange={(e) => setEditForm({ ...editForm, maxInitialShare: parseFloat(e.target.value) })}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    첫 배치 시 단일 투자자가 가질 수 있는 최대 지분 비율
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    변경사항 저장
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">편집할 대륙을 선택해주세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 