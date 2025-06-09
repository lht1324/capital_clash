'use client'

import { useState } from 'react'
import { useContinentStore, ContinentId, CONTINENTS } from '@/store/continentStore'
import { showSuccess, showError, showInfo } from '@/components/admin/NotificationSystem'
import { 
  XMarkIcon, 
  PlusIcon,
  TrashIcon,
  GlobeAltIcon,
  SwatchIcon,
  UsersIcon,
  EyeIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ContinentWizardProps {
  isOpen: boolean
  onClose: () => void
}

interface NewContinentConfig {
  id: string
  name: string
  color: string
  themeColor: string
  description: string
  maxUsers: number
  position: [number, number, number]
  cameraTarget: [number, number, number]
}

export default function ContinentWizard({ isOpen, onClose }: ContinentWizardProps) {
  const { continents, resetAllContinents, createNewContinent } = useContinentStore()
  const [step, setStep] = useState<'reset' | 'create' | 'preview'>('reset')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [newContinents, setNewContinents] = useState<NewContinentConfig[]>([])
  const [isCreating, setIsCreating] = useState(false)

  // 기본 대륙 템플릿들
  const defaultTemplates: NewContinentConfig[] = [
    {
      id: 'northwest',
      name: '북서방 대륙',
      color: '#3B82F6',
      themeColor: '#EFF6FF',
      description: '차가운 북서방의 전략가들',
      maxUsers: 50,
      position: [-20, 20, 0],
      cameraTarget: [-20, 20, 35]
    },
    {
      id: 'northeast',
      name: '북동방 대륙',
      color: '#EF4444',
      themeColor: '#FEF2F2',
      description: '떠오르는 북동방의 용사들',
      maxUsers: 50,
      position: [20, 20, 0],
      cameraTarget: [20, 20, 35]
    },
    {
      id: 'southwest',
      name: '남서방 대륙',
      color: '#10B981',
      themeColor: '#F0FDF4',
      description: '무성한 남서방의 정복자들',
      maxUsers: 50,
      position: [-20, -20, 0],
      cameraTarget: [-20, -20, 35]
    },
    {
      id: 'southeast',
      name: '남동방 대륙',
      color: '#F59E0B',
      themeColor: '#FFFBEB',
      description: '석양의 남동방 제국 건설자들',
      maxUsers: 50,
      position: [20, -20, 0],
      cameraTarget: [20, -20, 35]
    },
    {
      id: 'center',
      name: '중앙 대륙',
      color: '#8B5CF6',
      themeColor: '#FAF5FF',
      description: '황제들의 VIP 영역',
      maxUsers: 20,
      position: [0, 0, 0],
      cameraTarget: [0, 0, 40]
    }
  ]

  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#6366F1'
  ]

  const handleReset = async () => {
    setIsCreating(true)
    showInfo('초기화 시작', '모든 대륙 데이터를 삭제하고 있습니다...')
    
    try {
      await resetAllContinents()
      setShowResetConfirm(false)
      setStep('create')
      setNewContinents([defaultTemplates[0]]) // 첫 번째 템플릿으로 시작
      showSuccess('초기화 완료', '대륙 데이터가 성공적으로 초기화되었습니다!')
    } catch (error) {
      console.error('대륙 초기화 실패:', error)
      showError('초기화 실패', '대륙 초기화 중 오류가 발생했습니다.')
    } finally {
      setIsCreating(false)
    }
  }

  const addNewContinent = () => {
    const newId = `continent_${Date.now()}`
    setNewContinents([...newContinents, {
      id: newId,
      name: `새 대륙 ${newContinents.length + 1}`,
      color: colorOptions[newContinents.length % colorOptions.length],
      themeColor: '#F8FAFC',
      description: '새로운 대륙입니다',
      maxUsers: 50,
      position: [0, 0, 0],
      cameraTarget: [0, 0, 35]
    }])
  }

  const removeContinent = (index: number) => {
    setNewContinents(newContinents.filter((_, i) => i !== index))
  }

  const updateContinent = (index: number, updates: Partial<NewContinentConfig>) => {
    setNewContinents(newContinents.map((continent, i) => 
      i === index ? { ...continent, ...updates } : continent
    ))
  }

  const useTemplate = (template: NewContinentConfig) => {
    setNewContinents([...newContinents, { ...template, id: `${template.id}_${Date.now()}` }])
  }

  const createContinents = async () => {
    setIsCreating(true)
    showInfo('대륙 생성 중', `${newContinents.length}개의 새로운 대륙을 생성하고 있습니다...`)
    
    try {
      for (let i = 0; i < newContinents.length; i++) {
        const continent = newContinents[i]
        await createNewContinent(continent)
        showInfo('생성 진행 중', `${continent.name} 생성 완료 (${i + 1}/${newContinents.length})`)
      }
      showSuccess('대륙 생성 완료', `${newContinents.length}개의 대륙이 성공적으로 생성되었습니다!`)
      onClose()
    } catch (error) {
      console.error('대륙 생성 실패:', error)
      showError('대륙 생성 실패', '대륙 생성 중 오류가 발생했습니다.')
    } finally {
      setIsCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <GlobeAltIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">대륙 생성 마법사</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center space-x-8">
            <div className={`flex items-center space-x-2 ${step === 'reset' ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'reset' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="text-sm font-medium">초기화</span>
            </div>
            <div className={`flex items-center space-x-2 ${step === 'create' ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="text-sm font-medium">생성</span>
            </div>
            <div className={`flex items-center space-x-2 ${step === 'preview' ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="text-sm font-medium">미리보기</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Reset */}
          {step === 'reset' && (
            <div className="space-y-6">
              <div className="text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">기존 대륙 데이터 초기화</h3>
                <p className="text-gray-600 mb-6">
                  새 대륙을 생성하기 전에 기존의 모든 대륙과 투자자 데이터를 삭제합니다.
                  <br />
                  <strong>이 작업은 되돌릴 수 없습니다.</strong>
                </p>
              </div>

              {/* 현재 대륙 상태 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">현재 대륙 현황</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.values(continents).map((continent) => (
                    <div key={continent.id} className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center space-x-2 mb-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: continent.color }}
                        />
                        <span className="font-medium text-sm">{continent.name}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        투자자: {Object.keys(continent.investors).length}명
                        <br />
                        총 투자: ${continent.totalInvestment.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!showResetConfirm ? (
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    데이터 초기화 진행
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-red-800">최종 확인</span>
                  </div>
                  <p className="text-red-700 mb-4">
                    정말로 모든 대륙과 투자자 데이터를 삭제하시겠습니까?
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleReset}
                      disabled={isCreating}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      {isCreating ? '초기화 중...' : '확인, 삭제합니다'}
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Create */}
          {step === 'create' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">새 대륙 구성</h3>
                <button
                  onClick={addNewContinent}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>대륙 추가</span>
                </button>
              </div>

              {/* 템플릿 선택 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">기본 템플릿 사용</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {defaultTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => useTemplate(template)}
                      className="bg-white hover:bg-blue-50 border border-blue-200 rounded-lg p-3 text-left transition-colors"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: template.color }}
                        />
                        <span className="font-medium text-sm">{template.name}</span>
                      </div>
                      <p className="text-xs text-gray-600">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 대륙 편집 */}
              <div className="space-y-4">
                {newContinents.map((continent, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">대륙 {index + 1}</h4>
                      {newContinents.length > 1 && (
                        <button
                          onClick={() => removeContinent(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 기본 정보 */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            대륙 이름
                          </label>
                          <input
                            type="text"
                            value={continent.name}
                            onChange={(e) => updateContinent(index, { name: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            설명
                          </label>
                          <textarea
                            value={continent.description}
                            onChange={(e) => updateContinent(index, { description: e.target.value })}
                            rows={2}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            최대 사용자 수
                          </label>
                          <input
                            type="number"
                            value={continent.maxUsers}
                            onChange={(e) => updateContinent(index, { maxUsers: parseInt(e.target.value) || 50 })}
                            min="1"
                            max="100"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* 색상 및 위치 */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            대륙 색상
                          </label>
                          <div className="flex space-x-2">
                            {colorOptions.map((color) => (
                              <button
                                key={color}
                                onClick={() => updateContinent(index, { color })}
                                className={`w-8 h-8 rounded-full border-2 ${continent.color === color ? 'border-gray-800' : 'border-gray-300'}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            위치 (X, Y, Z)
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {continent.position.map((coord, coordIndex) => (
                              <input
                                key={coordIndex}
                                type="number"
                                value={coord}
                                onChange={(e) => {
                                  const newPosition = [...continent.position] as [number, number, number]
                                  newPosition[coordIndex] = parseFloat(e.target.value) || 0
                                  updateContinent(index, { position: newPosition })
                                }}
                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            카메라 타겟 (X, Y, Z)
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {continent.cameraTarget.map((coord, coordIndex) => (
                              <input
                                key={coordIndex}
                                type="number"
                                value={coord}
                                onChange={(e) => {
                                  const newTarget = [...continent.cameraTarget] as [number, number, number]
                                  newTarget[coordIndex] = parseFloat(e.target.value) || 0
                                  updateContinent(index, { cameraTarget: newTarget })
                                }}
                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('reset')}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium"
                >
                  이전
                </button>
                <button
                  onClick={() => setStep('preview')}
                  disabled={newContinents.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                  다음
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">생성 미리보기</h3>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">생성될 대륙 목록</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newContinents.map((continent, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center space-x-2 mb-3">
                        <div 
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: continent.color }}
                        />
                        <span className="font-medium">{continent.name}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">설명:</span> {continent.description}</p>
                        <p><span className="font-medium">최대 사용자:</span> {continent.maxUsers}명</p>
                        <p><span className="font-medium">위치:</span> ({continent.position.join(', ')})</p>
                        <p><span className="font-medium">카메라:</span> ({continent.cameraTarget.join(', ')})</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-yellow-800">주의사항</span>
                </div>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• 총 {newContinents.length}개의 새 대륙이 생성됩니다</li>
                  <li>• 기존 데이터는 이미 삭제되었습니다</li>
                  <li>• 생성 후에는 관리자 페이지에서 개별 편집이 가능합니다</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('create')}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium"
                >
                  이전
                </button>
                <button
                  onClick={createContinents}
                  disabled={isCreating}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>생성 중...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      <span>대륙 생성 완료</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 