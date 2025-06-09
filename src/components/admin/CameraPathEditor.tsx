'use client'

import { useState, useEffect } from 'react'
import { useContinentStore, ContinentId } from '@/store/continentStore'
import { showSuccess, showError, showInfo } from '@/components/admin/NotificationSystem'
import { 
  XMarkIcon, 
  PlusIcon,
  TrashIcon,
  VideoCameraIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  ArrowPathIcon,
  MapIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

interface CameraPathEditorProps {
  isOpen: boolean
  onClose: () => void
}

interface CameraWaypoint {
  id: string
  name: string
  position: [number, number, number]
  target: [number, number, number]
  duration: number // 이 지점에서 머무는 시간 (초)
  continentId?: ContinentId // 연관된 대륙 (선택적)
}

interface CameraTransition {
  duration: number // 이동 시간 (초)
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

interface CameraTour {
  name: string
  waypoints: CameraWaypoint[]
  transitions: CameraTransition[]
  loop: boolean
  autoStart: boolean
}

export default function CameraPathEditor({ isOpen, onClose }: CameraPathEditorProps) {
  const { continents, setCameraTarget, saveCameraTour, loadCameraTour, startCameraTour } = useContinentStore()
  const [currentTour, setCurrentTour] = useState<CameraTour>({
    name: '기본 투어',
    waypoints: [],
    transitions: [],
    loop: true,
    autoStart: false
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit')

  // 기본 카메라 웨이포인트들 (대륙별)
  const defaultWaypoints: CameraWaypoint[] = [
    {
      id: 'world_overview',
      name: '월드 오버뷰',
      position: [0, 0, 80],
      target: [0, 0, 0],
      duration: 3,
      continentId: undefined
    },
    {
      id: 'northwest',
      name: '북서방 대륙',
      position: [-20, 20, 35],
      target: [-20, 20, 0],
      duration: 4,
      continentId: 'northwest'
    },
    {
      id: 'northeast',
      name: '북동방 대륙',
      position: [20, 20, 35],
      target: [20, 20, 0],
      duration: 4,
      continentId: 'northeast'
    },
    {
      id: 'center',
      name: '중앙 대륙 (VIP)',
      position: [0, 0, 40],
      target: [0, 0, 0],
      duration: 5,
      continentId: 'center'
    },
    {
      id: 'southwest',
      name: '남서방 대륙',
      position: [-20, -20, 35],
      target: [-20, -20, 0],
      duration: 4,
      continentId: 'southwest'
    },
    {
      id: 'southeast',
      name: '남동방 대륙',
      position: [20, -20, 35],
      target: [20, -20, 0],
      duration: 4,
      continentId: 'southeast'
    }
  ]

  const easingOptions = [
    { value: 'linear', label: '선형 (Linear)' },
    { value: 'ease-in', label: '천천히 시작 (Ease In)' },
    { value: 'ease-out', label: '천천히 끝 (Ease Out)' },
    { value: 'ease-in-out', label: '부드럽게 (Ease In-Out)' }
  ]

  // 초기 투어 설정
  useEffect(() => {
    if (currentTour.waypoints.length === 0) {
      const defaultTransitions = defaultWaypoints.map(() => ({
        duration: 2,
        easing: 'ease-in-out' as const
      }))
      
      setCurrentTour({
        ...currentTour,
        waypoints: defaultWaypoints,
        transitions: defaultTransitions
      })
    }
  }, [])

  const addWaypoint = () => {
    const newWaypoint: CameraWaypoint = {
      id: `waypoint_${Date.now()}`,
      name: `웨이포인트 ${currentTour.waypoints.length + 1}`,
      position: [0, 0, 40],
      target: [0, 0, 0],
      duration: 3,
      continentId: undefined
    }

    const newTransition: CameraTransition = {
      duration: 2,
      easing: 'ease-in-out'
    }

    setCurrentTour({
      ...currentTour,
      waypoints: [...currentTour.waypoints, newWaypoint],
      transitions: [...currentTour.transitions, newTransition]
    })
  }

  const removeWaypoint = (index: number) => {
    setCurrentTour({
      ...currentTour,
      waypoints: currentTour.waypoints.filter((_, i) => i !== index),
      transitions: currentTour.transitions.filter((_, i) => i !== index)
    })
  }

  const updateWaypoint = (index: number, updates: Partial<CameraWaypoint>) => {
    setCurrentTour({
      ...currentTour,
      waypoints: currentTour.waypoints.map((waypoint, i) => 
        i === index ? { ...waypoint, ...updates } : waypoint
      )
    })
  }

  const updateTransition = (index: number, updates: Partial<CameraTransition>) => {
    setCurrentTour({
      ...currentTour,
      transitions: currentTour.transitions.map((transition, i) => 
        i === index ? { ...transition, ...updates } : transition
      )
    })
  }

  const useContinentPosition = (waypointIndex: number, continentId: ContinentId) => {
    const continent = continents[continentId]
    updateWaypoint(waypointIndex, {
      position: [continent.position[0], continent.position[1], continent.cameraTarget[2]],
      target: continent.position,
      continentId
    })
  }

  const previewWaypoint = (waypoint: CameraWaypoint) => {
    setCameraTarget(waypoint.position)
    setCurrentWaypointIndex(currentTour.waypoints.findIndex(w => w.id === waypoint.id))
  }

  const startTour = () => {
    if (currentTour.waypoints.length === 0) return
    
    setIsPlaying(true)
    setCurrentWaypointIndex(0)
    setPreviewMode('preview')
    
    // 첫 번째 웨이포인트로 이동
    setCameraTarget(currentTour.waypoints[0].position)
    
    // 투어 자동 진행 로직
    playTourSequence()
  }

  const playTourSequence = async () => {
    for (let i = 0; i < currentTour.waypoints.length; i++) {
      if (!isPlaying) break
      
      setCurrentWaypointIndex(i)
      const waypoint = currentTour.waypoints[i]
      
      // 웨이포인트로 이동
      setCameraTarget(waypoint.position)
      
      // 지정된 시간만큼 대기
      await new Promise(resolve => 
        setTimeout(resolve, (waypoint.duration * 1000) / playbackSpeed)
      )
      
      // 다음 웨이포인트로 전환 (마지막이 아닌 경우)
      if (i < currentTour.waypoints.length - 1) {
        const transition = currentTour.transitions[i]
        await new Promise(resolve => 
          setTimeout(resolve, (transition.duration * 1000) / playbackSpeed)
        )
      }
    }
    
    // 루프 설정 확인
    if (currentTour.loop && isPlaying) {
      playTourSequence()
    } else {
      stopTour()
    }
  }

  const pauseTour = () => {
    setIsPlaying(false)
  }

  const stopTour = () => {
    setIsPlaying(false)
    setCurrentWaypointIndex(0)
    setPreviewMode('edit')
    setCameraTarget([0, 0, 80]) // 월드뷰로 복귀
  }

  const getTotalTourDuration = () => {
    const waypointTime = currentTour.waypoints.reduce((sum, w) => sum + w.duration, 0)
    const transitionTime = currentTour.transitions.reduce((sum, t) => sum + t.duration, 0)
    return waypointTime + transitionTime
  }

  const saveTour = () => {
    try {
      const tourId = saveCameraTour(currentTour)
      showSuccess('투어 저장 완료', `"${currentTour.name}" 투어가 성공적으로 저장되었습니다!`)
    } catch (error) {
      showError('투어 저장 실패', '투어 저장 중 오류가 발생했습니다.')
    }
  }

  const exportTour = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentTour, null, 2))
      const downloadAnchorNode = document.createElement('a')
      downloadAnchorNode.setAttribute("href", dataStr)
      downloadAnchorNode.setAttribute("download", `${currentTour.name}_tour.json`)
      document.body.appendChild(downloadAnchorNode)
      downloadAnchorNode.click()
      downloadAnchorNode.remove()
      showSuccess('투어 내보내기 완료', `"${currentTour.name}" 투어 파일이 다운로드됩니다.`)
    } catch (error) {
      showError('투어 내보내기 실패', '투어 내보내기 중 오류가 발생했습니다.')
    }
  }

  const importTour = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    showInfo('투어 가져오기', '투어 파일을 읽고 있습니다...')

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedTour = JSON.parse(e.target?.result as string)
        setCurrentTour(importedTour)
        showSuccess('투어 가져오기 완료', `"${importedTour.name}" 투어를 성공적으로 가져왔습니다!`)
      } catch (error) {
        showError('투어 가져오기 실패', '투어 파일을 읽는 중 오류가 발생했습니다.')
      }
    }
    reader.readAsText(file)
    
    // 파일 입력 초기화
    event.target.value = ''
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <VideoCameraIcon className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">카메라 경로 편집기</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tour Controls */}
        <div className="px-6 py-4 bg-purple-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-1">
                  투어 이름
                </label>
                <input
                  type="text"
                  value={currentTour.name}
                  onChange={(e) => setCurrentTour({ ...currentTour, name: e.target.value })}
                  className="border border-purple-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 mb-1">
                  재생 속도
                </label>
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="border border-purple-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 mb-1">
                  총 시간
                </label>
                <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm font-medium">
                  {getTotalTourDuration()}초
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  id="loop"
                  checked={currentTour.loop}
                  onChange={(e) => setCurrentTour({ ...currentTour, loop: e.target.checked })}
                  className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="loop" className="text-sm text-purple-900">
                  루프
                </label>
              </div>

              {!isPlaying ? (
                <button
                  onClick={startTour}
                  disabled={currentTour.waypoints.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>투어 시작</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={pauseTour}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                  >
                    <PauseIcon className="h-4 w-4" />
                    <span>일시정지</span>
                  </button>
                  <button
                    onClick={stopTour}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                  >
                    <StopIcon className="h-4 w-4" />
                    <span>정지</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 투어 관리 버튼들 */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={saveTour}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded font-medium text-sm"
              title="투어 저장"
            >
              💾 저장
            </button>
            <button
              onClick={exportTour}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-medium text-sm"
              title="투어 내보내기"
            >
              📥 내보내기
            </button>
            <label className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded font-medium text-sm cursor-pointer">
              📤 가져오기
              <input
                type="file"
                accept=".json"
                onChange={importTour}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="p-6">
          {/* Mode Toggle */}
          <div className="flex items-center space-x-2 mb-6">
            <button
              onClick={() => setPreviewMode('edit')}
              className={`px-4 py-2 rounded-lg font-medium ${previewMode === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              편집 모드
            </button>
            <button
              onClick={() => setPreviewMode('preview')}
              className={`px-4 py-2 rounded-lg font-medium ${previewMode === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              미리보기 모드
            </button>
          </div>

          {previewMode === 'edit' && (
            <>
              {/* Add Waypoint Button */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">카메라 웨이포인트</h3>
                <button
                  onClick={addWaypoint}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>웨이포인트 추가</span>
                </button>
              </div>

              {/* Waypoints List */}
              <div className="space-y-4">
                {currentTour.waypoints.map((waypoint, index) => (
                  <div key={waypoint.id} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={waypoint.name}
                          onChange={(e) => updateWaypoint(index, { name: e.target.value })}
                          className="font-medium bg-transparent border-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
                        />
                        {isPlaying && currentWaypointIndex === index && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            현재 재생 중
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => previewWaypoint(waypoint)}
                          className="text-blue-600 hover:text-blue-800"
                          title="미리보기"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeWaypoint(index)}
                          className="text-red-600 hover:text-red-800"
                          title="삭제"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 카메라 위치 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          카메라 위치 (X, Y, Z)
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {waypoint.position.map((coord, coordIndex) => (
                            <input
                              key={coordIndex}
                              type="number"
                              value={coord}
                              onChange={(e) => {
                                const newPosition = [...waypoint.position] as [number, number, number]
                                newPosition[coordIndex] = parseFloat(e.target.value) || 0
                                updateWaypoint(index, { position: newPosition })
                              }}
                              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          ))}
                        </div>
                      </div>

                      {/* 카메라 타겟 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          카메라 타겟 (X, Y, Z)
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {waypoint.target.map((coord, coordIndex) => (
                            <input
                              key={coordIndex}
                              type="number"
                              value={coord}
                              onChange={(e) => {
                                const newTarget = [...waypoint.target] as [number, number, number]
                                newTarget[coordIndex] = parseFloat(e.target.value) || 0
                                updateWaypoint(index, { target: newTarget })
                              }}
                              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          ))}
                        </div>
                      </div>

                      {/* 설정 */}
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            머무는 시간 (초)
                          </label>
                          <input
                            type="number"
                            value={waypoint.duration}
                            onChange={(e) => updateWaypoint(index, { duration: parseFloat(e.target.value) || 1 })}
                            min="0.5"
                            step="0.5"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            연관 대륙
                          </label>
                          <select
                            value={waypoint.continentId || ''}
                            onChange={(e) => updateWaypoint(index, { continentId: e.target.value as ContinentId || undefined })}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="">없음</option>
                            {Object.values(continents).map((continent) => (
                              <option key={continent.id} value={continent.id}>
                                {continent.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* 대륙 위치 빠른 적용 */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 mb-2">빠른 대륙 위치 적용:</p>
                      <div className="flex space-x-2">
                        {Object.values(continents).map((continent) => (
                          <button
                            key={continent.id}
                            onClick={() => useContinentPosition(index, continent.id)}
                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
                          >
                            {continent.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 전환 설정 (마지막 웨이포인트가 아닌 경우) */}
                    {index < currentTour.waypoints.length - 1 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          다음 웨이포인트로의 전환
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              전환 시간 (초)
                            </label>
                            <input
                              type="number"
                              value={currentTour.transitions[index]?.duration || 2}
                              onChange={(e) => updateTransition(index, { duration: parseFloat(e.target.value) || 1 })}
                              min="0.1"
                              step="0.1"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              이징 함수
                            </label>
                            <select
                              value={currentTour.transitions[index]?.easing || 'ease-in-out'}
                              onChange={(e) => updateTransition(index, { easing: e.target.value as any })}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                              {easingOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {currentTour.waypoints.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <VideoCameraIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>웨이포인트를 추가하여 카메라 경로를 만들어보세요.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {previewMode === 'preview' && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <MapIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-blue-900 mb-2">투어 미리보기 모드</h3>
                <p className="text-blue-700 mb-4">
                  좌측 3D 뷰에서 카메라 경로를 확인할 수 있습니다.
                  <br />
                  "투어 시작" 버튼을 클릭하여 전체 경로를 자동으로 재생해보세요.
                </p>
                
                {isPlaying && (
                  <div className="bg-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <ClockIcon className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        진행 상황: {currentWaypointIndex + 1} / {currentTour.waypoints.length}
                      </span>
                    </div>
                    <div className="bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentWaypointIndex + 1) / currentTour.waypoints.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-sm text-blue-700 mt-2">
                      현재: {currentTour.waypoints[currentWaypointIndex]?.name}
                    </p>
                  </div>
                )}
              </div>

              {/* 투어 요약 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">투어 요약</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">웨이포인트:</span>
                    <span className="ml-2 font-medium">{currentTour.waypoints.length}개</span>
                  </div>
                  <div>
                    <span className="text-gray-600">총 시간:</span>
                    <span className="ml-2 font-medium">{getTotalTourDuration()}초</span>
                  </div>
                  <div>
                    <span className="text-gray-600">루프:</span>
                    <span className="ml-2 font-medium">{currentTour.loop ? '예' : '아니오'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">재생 속도:</span>
                    <span className="ml-2 font-medium">{playbackSpeed}x</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 