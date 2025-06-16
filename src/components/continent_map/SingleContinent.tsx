// src/components/continent_map/SingleContinent.tsx
import { Continent, useContinentStore } from "@/store/continentStore";
import { memo, useEffect, useMemo } from "react";
import TerritoryArea from "@/components/continent_map/TerritoryArea";
import {Boundary, Placement, PlacementResult, Position} from "@/lib/treemapAlgorithm";
import * as THREE from "three";

function SingleContinent({
    continent,
    placementResult,
    position,
    cellLength,
    onTileClick
}: {
    continent: Continent;
    placementResult: PlacementResult;
    position: Position;
    cellLength: number;
    onTileClick: (investorId: string) => void;
}) {
    const { updateContinentUsers } = useContinentStore();

    // 투자자 수 업데이트
    useEffect(() => {
        if (updateContinentUsers) {
            // updateContinentUsers(continent.id, placementResult?.placements.length || 0);
        }
    }, [continent.id, placementResult, updateContinentUsers]);

    return (
        <group position={[position.x, position.y, position.z]}>
            {/* 대륙 기본 모양 */}
            {!placementResult && (
                <mesh>
                    <boxGeometry args={[cellLength * continent.max_users, cellLength * continent.max_users, 1]} />
                    <meshStandardMaterial
                        color={continent.color}
                        opacity={0.9}
                        transparent={true}
                        roughness={0.7}
                        metalness={0.3}
                    />
                </mesh>
            )}

            {/* 투자자 영역 */}
            {placementResult && (
                <group>
                    {placementResult.placements.map(placement => (
                        <TerritoryArea
                            key={placement.investor.id}
                            placement={placement}
                            cellLength={cellLength}
                            onTileClick={onTileClick}
                        />
                    ))}
                </group>
            )}
        </group>
    );
}

export default memo(SingleContinent);
