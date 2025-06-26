'use client'

import {memo, useMemo} from "react";
import SingleContinent from "@/components/main/continent_map/SingleContinent";
import {
    PlacementResult,
    Position
} from "@/lib/treemapAlgorithm";
import * as THREE from "three";
import {
    CENTRAL_INCREASE_RATIO,
    CONTINENT_DEFAULT_LENGTH, CONTINENT_MAX_USER_COUNT
} from "@/components/main/continent_map/continent_map_public_variables";
import {getFilteredPlayerList} from "@/utils/playerUtils";
import {Continent} from "@/api/server/supabase/types/Continents";

function WorldScene({
    continentList,
    placementResultRecord,
    continentPositionRecord,
    onTileClick,
}: {
    continentList: Continent[];
    placementResultRecord: Record<string, PlacementResult>
    continentPositionRecord: Record<string, Position>,
    onTileClick: (investorId: string, dailyViews: number[]) => void;
}) {
    // 전체 화면을 커버하는 격자 무늬 생성
    const gridLines = useMemo(() => {
        const geometries = [];
        const gridSize = 100; // 격자 크기 확장
        const gridStep = 2.5;  // 2.5 단위로 격자 생성 (10x10 크기로 보이도록 조정)

        // x축 방향 선 (-gridSize부터 gridSize까지)
        for (let y = -gridSize; y <= gridSize; y += gridStep) {
            const points = [
                new THREE.Vector3(-gridSize, y, 0.5),
                new THREE.Vector3(gridSize, y, 0.5)
            ];
            geometries.push(new THREE.BufferGeometry().setFromPoints(points));
        }

        // y축 방향 선 (-gridSize부터 gridSize까지)
        for (let x = -gridSize; x <= gridSize; x += gridStep) {
            const points = [
                new THREE.Vector3(x, -gridSize, 0.5),
                new THREE.Vector3(x, gridSize, 0.5)
            ];
            geometries.push(new THREE.BufferGeometry().setFromPoints(points));
        }

        return geometries;
    }, []);

    return (
        <>
            {/* 전역 조명 */}
            <ambientLight intensity={0.8} />
            <pointLight position={[20, 20, 20]} intensity={1} />
            <pointLight position={[-20, -20, 20]} intensity={0.5} />

            {/* 전체 화면 격자 무늬 */}
            {gridLines.map((geometry, index) => (
                <primitive
                    key={`grid-line-${index}`}
                    object={new THREE.Line(
                        geometry,
                        new THREE.LineBasicMaterial({
                            color: "#2a5298",
                            opacity: 0.3,
                            transparent: true
                        })
                    )}
                />
            ))}

            {/* 모든 대륙 렌더링 */}
            {continentList.map((continent) => {
                const placementResult = placementResultRecord[continent.id];

                if (placementResult) {
                    const position = continentPositionRecord[continent.id];
                    // cellLength 계산 방식을 treemapAlgorithm.ts의 getContinentSizes 함수와 통일
                    const cellLength = continent.id !== "central"
                        ? CONTINENT_DEFAULT_LENGTH / CONTINENT_MAX_USER_COUNT  // 일반 대륙은 max_users 대신 100 사용
                        : CONTINENT_DEFAULT_LENGTH * CENTRAL_INCREASE_RATIO / CONTINENT_MAX_USER_COUNT;

                    return (
                        <SingleContinent
                            key={continent.id}
                            continent={continent}
                            placementResult={placementResult}
                            position={position}
                            cellLength={cellLength}
                            onTileClick={onTileClick}
                        />
                    );
                }
            })}
        </>
    );
}

export default memo(WorldScene);
