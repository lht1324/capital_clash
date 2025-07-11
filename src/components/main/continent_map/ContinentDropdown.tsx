'use client'

import { useCallback, useMemo, useState, memo } from 'react'
import { useCameraStateStore } from "@/store/cameraStateStore";
import {Continent} from "@/api/types/supabase/Continents";
import {Player} from "@/api/types/supabase/Players";
import {PlacementResult, Position} from "@/lib/spiralPlacementAlgorithm";
import {
    CENTRAL_INCREASE_RATIO,
    CONTINENT_DEFAULT_LENGTH,
    CONTINENT_MAP_FOV, CONTINENT_MAX_USER_COUNT
} from "@/components/main/continent_map/continent_map_public_variables";
import {MathUtils} from "three";
import {getWorldViewPositionZ} from "@/utils/cameraUtils";
import {usePlayersStore} from "@/store/playersStore";
import {useContinentStore} from "@/store/continentStore";

const DROPDOWN_CAMERA_MOVE_Z = 25;

function ContinentDropdown() {
    const { continentList } = useContinentStore();
    const {
        playerList,
        vipPlayerList,
        placementResultRecord,
        continentPositionRecord,
        screenSize: { screenWidth, screenHeight },
    } = usePlayersStore();

    const {
        selectedContinentId,
        isWorldView,
        setSelectedContinentId,
        setWorldView,
        setCameraTarget,
        resetContinentSelection,
    } = useCameraStateStore();

    const [isOpen, setIsOpen] = useState(false);

    const isMobile = useMemo(() => {
        return screenWidth < screenHeight || screenWidth <= 768;
    }, [screenWidth, screenHeight]);

    // 현재 선택 상태에 따른 표시 (안전한 접근)
    const selectedContinentData = useMemo(() => {
        return continentList.find((continent) => {
            return continent.id === selectedContinentId;
        }) ?? null
    }, [continentList, selectedContinentId]);

    const currentDisplay = useMemo(() => {
        return isWorldView
            ? { name: 'World Map', description: 'All continents at a glance.', color: '#6B7280' }
            : selectedContinentData || { name: 'Loading...', description: 'Loading continent data', color: '#6B7280' }
    }, [isWorldView, selectedContinentData]);

    const getFilteredPlayerListByContinent = useCallback((continentId: string | null) => {
        return continentId !== "central"
            ? playerList.filter((player) => {
                return player.continent_id === continentId;
            })
            : vipPlayerList;
    }, [playerList, vipPlayerList]);

    // 현재 대륙의 투자 통계 (안전한 접근)
    const currentContinentInfo = useMemo(() => {
        const filteredPlayerListByContinent = getFilteredPlayerListByContinent(selectedContinentId);
        const totalStakeAmountByContinent = selectedContinentId !== "central"
            ? filteredPlayerListByContinent.reduce((acc, player) => {
                return acc + player.stake_amount;
            }, 0)
            : vipPlayerList.reduce((acc, player) => {
                return acc + player.stake_amount;
            }, 0)

        return selectedContinentId && selectedContinentData
            ? {
                totalStakeAmount: totalStakeAmountByContinent,
                playerCount: filteredPlayerListByContinent.length,
                maxUsers: selectedContinentData.max_users || 0
            } : null
    }, [playerList, vipPlayerList, selectedContinentId, selectedContinentData]);

    const handleWorldViewSelect = useCallback(() => {
        const worldViewPositionZ = getWorldViewPositionZ(
            continentList,
            placementResultRecord,
            continentPositionRecord,
            screenWidth,
            screenHeight
        );

        resetContinentSelection();
        setCameraTarget({
            x: 0, y: 0, z: worldViewPositionZ
        })
        setIsOpen(false)
    }, [continentList, placementResultRecord, continentPositionRecord]);

    const handleContinentSelect = useCallback((continentId: string) => {
        const continent = continentList.find((continent) => {
            return continent.id === continentId;
        });

        if (continent) {
            const height = placementResultRecord[continentId].boundary.height;
            const cellLength = CONTINENT_DEFAULT_LENGTH / CONTINENT_MAX_USER_COUNT;
            const realHeight = continent.id !== "central"
                ? height * cellLength
                : height * cellLength * CENTRAL_INCREASE_RATIO;
            const ratio = continent.id !== "central" ? 0.6 : 0.7;
            const fov = MathUtils.degToRad(CONTINENT_MAP_FOV);

            setSelectedContinentId(continentId);
            setWorldView(false);
            setCameraTarget({
                ...continentPositionRecord[continentId],
                z: realHeight / (2 * ratio * Math.tan(fov / 2))
            });
            // H / (2 · r · tan(F / 2))
            setIsOpen(false)
        } else {
            console.warn(`⚠️ 대륙 '${continentId}'가 존재하지 않습니다. 세계 뷰로 전환합니다.`)
            resetContinentSelection();
            setIsOpen(false)
        }
    }, [continentList, placementResultRecord, continentPositionRecord]);

    return (
        <div className="fixed top-20 left-4 z-30">
            {continentList ? (<div className="relative">
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
                        <div className="font-bold text-sm">{currentDisplay.name}, {JSON.stringify(isMobile)}, {screenWidth}, {screenHeight}</div>
                        <div className="text-xs text-gray-300">{currentDisplay.description}</div>
                        {!isWorldView && currentContinentInfo && (
                            <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                                <div className="flex justify-between">
                                    <span>💰 Total Stake:</span>
                                    <span
                                        className="text-green-400">${currentContinentInfo.totalStakeAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>👥 Number of Players:</span>
                                    <span
                                        className="text-blue-400">{currentContinentInfo.playerCount}/{currentContinentInfo.maxUsers}</span>
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
                        {continentList.map((continent: Continent) => {
                            const isCentral = continent.id === "central";
                            const currentPlayerCount = getFilteredPlayerListByContinent(continent.id).length;

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
                                    {!isMobile && <div className={`text-xs ${isCentral ? "text-yellow-400" : "text-gray-300"}`}>{continent.description}</div>}
                                    <div className={`${isCentral ? "font-bold " : ""}text-xs ${isCentral ? "text-yellow-400" : "text-gray-400"}`}>
                                        {currentPlayerCount}/{continent.max_users} {`${currentPlayerCount === 1 ? "player" : "players"}`}
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
                        className="text-sm">Loading continent data...</span>
                </div>
            </div>)}
        </div>
    )
}

export default memo(ContinentDropdown);