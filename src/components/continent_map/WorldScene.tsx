// src/components/continent_map/WorldScene.tsx
import { useContinentStore } from "@/store/continentStore";
import { memo, useEffect, useMemo, useState } from "react";
import SingleContinent from "@/components/continent_map/SingleContinent";
import {Investor, useInvestorStore} from "@/store/investorsStore";
import {
    calculateSquareLayout,
    Boundary,
    Placement,
    PlacementResult,
    getContinentPositions
} from "@/lib/treemapAlgorithm";
import * as THREE from "three";
import {
    CENTRAL_INCREASE_RATIO,
    CONTINENT_DEFAULT_LENGTH, CONTINENT_MAX_USER_COUNT
} from "@/components/continent_map/continent_map_public_variables";

function WorldScene() {
    const { continents } = useContinentStore();
    const { getFilteredInvestorListByContinent, investors } = useInvestorStore();

    const continentList = useMemo(() => {
        return Object.values(continents);
    }, [continents]);
    const investorList = useMemo(() => {
        return Object.values(investors);
    }, [investors]);

    // 모든 대륙의 placementResult 계산
    const placementResults = useMemo(() => {
        const results: Record<string, PlacementResult> = {};

        continentList.forEach(continent => {
            console.log(`continent[${continent.name}]`, continent)
            const filteredInvestorListByContinent = continent.id !== "central"
                ? investorList.filter((investor) => { return investor.continent_id === continent.id })
                : Object.values(
                    investorList.reduce((acc, investor) => {
                        const id = investor.continent_id;
                        if (!acc[id] || investor.investment_amount > acc[id].investment_amount) {
                            acc[id] = investor; // 최고 투자금액 기준
                        }
                        return acc;
                    }, {} as Record<string, Investor>)
                );

            if (filteredInvestorListByContinent.length > 0) {
                results[continent.id] = calculateSquareLayout(
                    filteredInvestorListByContinent,
                    continent.id
                );
            }
        });

        return results;
    }, [continentList, investorList]);

    // 대륙 위치 계산
    const continentPositions = useMemo(() => {
        return getContinentPositions(placementResults);
    }, [placementResults]);

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
                <line key={`grid-line-${index}`} geometry={geometry}>
                    <lineBasicMaterial attach="material" color="#2a5298" linewidth={1} opacity={0.3} transparent />
                </line>
            ))}

            {/* 모든 대륙 렌더링 */}
            {continentList.map(continent => {
                const placementResult = placementResults[continent.id] || null;
                const position = continentPositions[continent.id];
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
                        onTileClick={(investorId) => {}}
                    />
                );
            })}
        </>
    );
}

export default memo(WorldScene);
