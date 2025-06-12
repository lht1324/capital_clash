import {useContinentStore} from "@/store/continentStore";
import {memo, useCallback, useEffect, useMemo, useState} from "react";
import * as THREE from "three";
import {calculateBillboardLayout, calculateSquareLayout} from "@/lib/treemapAlgorithm";
import TerritoryArea from "@/components/continent_map/TerritoryArea";
import {Investor} from "@/store/investorsStore";

// 🌳 NEW: Billboard 배치 시스템 (정사방형 & 행 우선 순회)
// const CELL_SIZE = 0.1 // 셀 크기 2배 증가

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
    // const { updateInvestorPositions } = useContinentStore()
    const [sharedTexture, setSharedTexture] = useState<THREE.Texture | null>(null)

    const placementResult = useMemo(() => {
        if (investorList.length === 0) return null
        return calculateSquareLayout(investorList, maxUserCount)
    }, [investorList])

    // 🚀 공통 텍스처 로딩 - 50개 개별 로딩 → 1개 공통 로딩
    useEffect(() => {
        const loader = new THREE.TextureLoader()
        loader.load(
            '/test.jpg',
            (loadedTexture) => {
                loadedTexture.flipY = true
                setSharedTexture(loadedTexture)
                console.log(`🚀 공통 텍스처 로드 완료: test.jpg`)
            },
            undefined,
            (error) => {
                console.error(`❌ 공통 텍스처 로드 실패:`, error)
            }
        )
    }, [])

    // 배치 완료 후 위치 정보 업데이트 (한 번만 실행)
    // useEffect(() => {
    //     if (placementResult) {
    //         const { placements } = placementResult
    //
    //         // 이미 위치 정보가 업데이트되었는지 확인 (무한 루프 방지)
    //         const needsUpdate = placements.some((placement: any) => {
    //             const investor = placement.investor
    //             return !investor.tilePosition ||
    //                 investor.tilePosition.x !== placement.x ||
    //                 investor.tilePosition.y !== placement.y ||
    //                 investor.tilePosition.size !== placement.size ||
    //                 investor.tilePosition.continentId !== continentId
    //         })
    //
    //         if (needsUpdate) {
    //             // placement 정보를 updateInvestorPositions에 맞는 형태로 변환
    //             const positionUpdates = placements.map((placement: any) => ({
    //                 investorId: placement.investor.id,
    //                 x: placement.x,
    //                 y: placement.y,
    //                 size: placement.size
    //             }))
    //
    //             console.log(`📍 위치 정보 업데이트: ${continentId} 대륙, ${positionUpdates.length}개 타일`)
    //             updateInvestorPositions(continentId as any, positionUpdates)
    //         }
    //     }
    // }, [placementResult, continentId, updateInvestorPositions])

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
                    boundary={placementResult.boundary}
                    cellLength={cellLength}
                    onTileClick={onTileClick}
                    sharedTexture={sharedTexture}
                />
            ))}
        </group>
    )
}

export default memo(TerritorySystem)