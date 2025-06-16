'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import { useContinentStore, ContinentId, Continent } from '@/store/continentStore'
import { useInvestorStore } from '@/store/investorsStore'

const DROPDOWN_CAMERA_MOVE_Z = 25;

export default function ContinentDropdown() {
    const {
      selectedContinentId,
      continents,
      resetSelection,
      isWorldView
    } = useContinentStore()
    const { getTotalInvestmentByContinent, getFilteredInvestorListByContinent } = useInvestorStore()

    const [isOpen, setIsOpen] = useState(false)

    const loadedContinentCount = useMemo(() => {
        return continents
            ? Object.keys(continents).length
            : 0
    }, [continents]);

    const handleContinentSelect = useCallback((continentId: ContinentId) => {
        // 🛡️ 선택하려는 대륙이 실제로 존재하는지 확인
        console.log("continents", continents);
        if (continents[continentId]) {
            // 상태 동시 업데이트
            const store = useContinentStore.getState()
            store.setSelectedContinentId(continentId)
            store.setWorldView(false)

            // 카메라 이동 설정 (Z축 조정)
            const continent = continents[continentId]
            console.log("continent", continent);
            store.setCameraTarget([
                continent.position_x,
                continent.position_y,
                DROPDOWN_CAMERA_MOVE_Z  // 고정된 Z값으로 설정
            ])

            setIsOpen(false)
        } else {
            console.warn(`⚠️ 대륙 '${continentId}'가 존재하지 않습니다. 세계 뷰로 전환합니다.`)
            resetSelection()
            setIsOpen(false)
        }
    }, [continents]);

    const handleWorldViewSelect = useCallback(() => {
        const store = useContinentStore.getState()
        store.resetSelection()
        // 세계지도 뷰의 기본 카메라 위치로 이동 (Z축 조정)
        store.setCameraTarget([0, 0, 60])
        setIsOpen(false)
    }, []);

    // 현재 선택 상태에 따른 표시 (안전한 접근)
    const selectedContinentData = useMemo(() => {
        return selectedContinentId
            ? continents[selectedContinentId]
            : null
    }, [selectedContinentId]);

    const currentDisplay = useMemo(() => {
        return isWorldView
            ? { name: 'World Map', description: 'All continents at a glance.', color: '#6B7280' }
            : selectedContinentData || { name: 'Loading...', description: 'Loading continent data', color: '#6B7280' }
    }, [isWorldView, selectedContinentData]);

    // 현재 대륙의 투자 통계 (안전한 접근)
    const currentContinentInfo = useMemo(() => {
        return selectedContinentId && selectedContinentData
            ? {
                totalInvestment: getTotalInvestmentByContinent(selectedContinentId),
                investorCount: getFilteredInvestorListByContinent(selectedContinentId).length,
                maxUsers: selectedContinentData.max_users || 0
            } : null
    }, [selectedContinentId, selectedContinentData]);

    return (
        <div className="fixed top-20 left-4 z-30">
            {continents ? (<div className="relative">
                {/* 현재 선택된 뷰 버튼 */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center space-x-3 bg-black bg-opacity-80 text-white p-3 rounded-lg hover:bg-opacity-90 transition-all duration-300 min-w-[300px]"
                    style={{ borderLeft: `4px solid ${currentDisplay.color}` }}
                >
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: currentDisplay.color }}
                    />
                    <div className="flex-1 text-left">
                        <div className="font-bold text-sm">{currentDisplay.name}</div>
                        <div className="text-xs text-gray-300">{currentDisplay.description}</div>
                        {!isWorldView && currentContinentInfo && (
                            <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                                <div className="flex justify-between">
                                    <span>💰 Total Investment:</span>
                                    <span
                                        className="text-green-400">${currentContinentInfo.totalInvestment.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>👥 Number of Investors:</span>
                                    <span
                                        className="text-blue-400">{currentContinentInfo.investorCount}/{currentContinentInfo.maxUsers}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                        ▼
                    </div>
                </button>

                {/* 뷰 선택 드롭다운 */}
                {isOpen && (
                    <div
                        className="absolute top-full left-0 mt-2 bg-black bg-opacity-90 rounded-lg overflow-hidden shadow-xl min-w-[200px]">
                        {/* 세계 지도 뷰 옵션 */}
                        <button
                            onClick={handleWorldViewSelect}
                            className={`w-full flex items-center space-x-3 p-3 hover:bg-white hover:bg-opacity-10 transition-colors ${
                                isWorldView ? 'bg-white bg-opacity-5' : ''
                            }`}
                            style={{
                                borderLeft: isWorldView
                                    ? '4px solid #6B7280'
                                    : '4px solid transparent'
                            }}
                        >
                            <div className="w-3 h-3 rounded-full bg-gray-500"/>
                            <div className="flex-1 text-left">
                                <div className="font-bold text-sm text-white">🌍 World Map</div>
                                <div className="text-xs text-gray-300">All continents at a glance.</div>
                                {/*<div className="text-xs text-gray-400">전체 뷰</div>*/}
                            </div>
                        </button>

                        {/* 구분선 */}
                        <div className="border-t border-gray-600 my-1"></div>

                        {/* 개별 대륙 옵션들 */}
                        {Object.values(continents).map((continent: Continent) => {
                            const isCentral = continent.id === "central";

                            return <button
                                key={continent.id}
                                onClick={() => handleContinentSelect(continent.id)}
                                className={`w-full flex items-center space-x-3 p-3 hover:bg-white hover:bg-opacity-10 transition-colors ${
                                    !isWorldView && (selectedContinentId === continent.id) ? 'bg-white bg-opacity-5' : ''
                                }`}
                                style={{
                                    borderLeft: !isWorldView && (selectedContinentId === continent.id)
                                        ? `4px solid ${continent.color}`
                                        : '4px solid transparent'
                                }}
                            >
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{backgroundColor: continent.color}}
                                />
                                <div className="flex-1 text-left">
                                    <div className={`font-bold text-sm ${isCentral ? "text-yellow-400" : "text-white"}`}>{continent.name}</div>
                                    <div className={`text-xs ${isCentral ? "text-yellow-400" : "text-gray-300"}`}>{continent.description}</div>
                                    <div className={`${isCentral ? "font-bold " : ""}text-xs ${isCentral ? "text-yellow-400" : "text-gray-400"}`}>
                                        {getFilteredInvestorListByContinent(continent.id).length}/{continent.max_users} people
                                    </div>
                                </div>
                            </button>
                        })}
                    </div>
                )}

                {/* 클릭 외부 감지용 오버레이 */}
                {isOpen && (<div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsOpen(false)}
                />)}
            </div>) : (<div className="bg-black bg-opacity-80 text-white p-3 rounded-lg">
                {/* 🛡️ continents가 완전히 비어있지 않다면 표시 (로딩 조건 완화) */}
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse"></div>
                    <span
                        className="text-sm">Loading continent data... ({loadedContinentCount}/5)</span>
                </div>
            </div>)}
        </div>
    )
}