// src/components/continent_map/WorldScene.tsx
import { useContinentStore } from "@/store/continentStore";
import {memo, useEffect, useMemo, useRef, useState} from "react";
import SingleContinent from "@/components/continent_map/SingleContinent";
import {Investor, useInvestorStore} from "@/store/investorsStore";
import {
    calculateSquareLayout,
    PlacementResult,
    getContinentPositions, Position, getContinentPosition
} from "@/lib/treemapAlgorithm";
import * as THREE from "three";
import {
    CENTRAL_INCREASE_RATIO,
    CONTINENT_DEFAULT_LENGTH, CONTINENT_MAX_USER_COUNT
} from "@/components/continent_map/continent_map_public_variables";
import {arePlayerListsEqualById, getFilteredPlayerList} from "@/utils/playerUtils";

type SharePercentageInfo = {
    id: string;
    sharePercentage: number;
}

function WorldScene({
    onTileClick,
}: {
    onTileClick: (investorId: string, dailyViews: number[]) => void;
}) {
    const { continents } = useContinentStore();
    const { investors, getFilteredInvestorListByContinent, getIsSharePercentageChangedByContinent } = useInvestorStore();

    const continentList = useMemo(() => {
        return Object.values(continents);
    }, [continents]);
    const [investorList, setInvestorList] = useState<Investor[]>([]);
    const [isSharePercentageChangedByContinent, setIsSharePercentageChangedByContinent] = useState<Record<string, boolean>>({ });
    const [placementResults, setPlacementResults] = useState<Record<string, PlacementResult>>({});
    const [continentPositions, setContinentPositions] = useState<Record<string, Position>>({});

    const isPlacementResultsInitialized = useMemo(() => {
        return Object.keys(continents).length === Object.keys(placementResults).length;
    }, [continents, placementResults]);
    const isContinentPositionsInitialized = useMemo(() => {
        return Object.keys(continentPositions).length === Object.keys(continentList).length;
    }, [continents, continentPositions]);

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

    useEffect(() => {
        setInvestorList((prevInvestorList) => {
            const isChangedRecord: Record<string, boolean> = { };

            continentList.forEach((continent) => {
                isChangedRecord[continent.id] = getIsSharePercentageChangedByContinent(prevInvestorList, continent.id);
            })

            setIsSharePercentageChangedByContinent(isChangedRecord);

            return Object.values(investors);
        })
    }, [continentList, investors]);

    // 모든 대륙의 placementResult 계산
    useEffect(() => {
        const isChanged = !(Object.values(isSharePercentageChangedByContinent).every((isChanged) => {
            return !isChanged;
        }))

        console.log(`isChanged = ${isChanged}`)
        console.log("isSharePercentageChangedByContinent", isSharePercentageChangedByContinent);

        if (isChanged && investorList.length > 0) {
            setPlacementResults(prevPlacementResults => {
                const continentIdList = Object.keys(isSharePercentageChangedByContinent);
                const placementResultRecord: Record<string, PlacementResult> = {};

                if (continentIdList.length !== 0) {
                    continentIdList.forEach((continentId) => {
                        const filteredInvestorListByContinent = getFilteredPlayerList(investorList, continentId);

                        if (filteredInvestorListByContinent.length > 0) {
                            placementResultRecord[continentId] = isSharePercentageChangedByContinent[continentId]
                                ? calculateSquareLayout(
                                    filteredInvestorListByContinent,
                                    continentId
                                )
                                : prevPlacementResults[continentId];
                        }
                    });
                }

                setContinentPositions((prevContinentPositions) => {
                    const continentPositionRecord: Record<string, Position> = { };

                    console.log("placementResultRecord", placementResultRecord);
                    continentIdList.forEach((continentId) => {
                        console.log(`[${continentId}]`, placementResultRecord[continentId]);
                        continentPositionRecord[continentId] = isSharePercentageChangedByContinent[continentId]
                            ? getContinentPosition(
                                placementResultRecord[continentId],
                                placementResultRecord["central"]
                            )
                            : prevContinentPositions[continentId]
                    });

                    return continentPositionRecord;
                });

                return placementResultRecord;
            });
        }
    }, [investorList, isSharePercentageChangedByContinent]);

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
            {isPlacementResultsInitialized && isContinentPositionsInitialized && continentList.map((continent) => {
                const placementResult = placementResults[continent.id];
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
                        onTileClick={onTileClick}
                    />
                );
            })}
        </>
    );
}

export default memo(WorldScene);
