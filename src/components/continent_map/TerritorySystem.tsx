import {memo, useMemo, useState} from "react";
import * as THREE from "three";
import {calculateSquareLayout} from "@/lib/treemapAlgorithm";
import TerritoryArea from "@/components/continent_map/TerritoryArea";
import {Investor} from "@/store/investorsStore";

// 🌳 NEW: Billboard 배치 시스템 (정사방형 & 행 우선 순회)
function TerritorySystem(
    {
        investorList,
        maxUserCount,
        cellLength,
        onTileClick,
        continentId
    }: {
        investorList: Investor[],
        maxUserCount: number,
        cellLength: number,
        onTileClick: (investorId: string) => void,
        continentId: string
    }
) {
    const placementResult = useMemo(() => {
        if (investorList.length === 0) return null
        return calculateSquareLayout(investorList, maxUserCount)
    }, [investorList])

    if (!placementResult) return null

    const { placements, boundary } = placementResult

    console.log('🎨 대륙 생성 및 실제 배치')

    // 경계 기준 대륙 크기 계산 (고정 셀 크기 사용)
    const continentWidth = boundary.width * cellLength
    const continentHeight = boundary.height * cellLength

    console.log(`🌍 대륙 크기: ${continentWidth}×${continentHeight} (${boundary.width}×${boundary.height} 격자)`)

    return (
        <group>
            {placements.map((placement) => (
                <TerritoryArea
                    key={placement.investor.id}
                    placement={placement}
                    cellLength={cellLength}
                    onTileClick={onTileClick}
                />
            ))}
        </group>
    )
}

export default memo(TerritorySystem)