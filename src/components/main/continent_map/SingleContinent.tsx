'use client'

import {memo, useEffect, useMemo} from "react";
import TerritoryArea from "@/components/main/continent_map/TerritoryArea";
import {Continent} from "@/api/types/supabase/Continents";
import {usePlayersStore, PlayersStore} from "@/store/playersStore";
import {shallow} from "zustand/shallow";
import {
    CONTINENT_DEFAULT_LENGTH,
    CONTINENT_MAX_USER_COUNT,
    CENTRAL_INCREASE_RATIO,
} from "./continent_map_public_variables";

function SingleContinent({
    continent,
    onTileClick
}: {
    continent: Continent;
    onTileClick: (playerId: string) => void;
}) {
    const { placementResult, position } = usePlayersStore((state: PlayersStore) => ({
        placementResult: state.placementResultRecord[continent.id],
        position: state.continentPositionRecord[continent.id],
    }), shallow);

    useEffect(() => {
        console.log(`[${continent.name}] position`, position)
    }, [continent.name, position]);

    const cellLength = useMemo(() => {
        return continent.id !== "central"
            ? CONTINENT_DEFAULT_LENGTH / CONTINENT_MAX_USER_COUNT  // 일반 대륙은 max_users 대신 100 사용
            : CONTINENT_DEFAULT_LENGTH * CENTRAL_INCREASE_RATIO / CONTINENT_MAX_USER_COUNT;
    }, [continent.id]);

    const continentDefaultLength = useMemo(() => {
        return continent.id !== "central"
            ? CONTINENT_DEFAULT_LENGTH
            : CONTINENT_DEFAULT_LENGTH * CENTRAL_INCREASE_RATIO;
    }, [continent.id]);

    return (
        (position && <group position={[position.x, position.y, position.z]}>
            {/* 대륙 기본 모양 */}
            {!placementResult && (
                <mesh>
                    {/*<boxGeometry args={[cellLength * CONTINENT_MAX_USER_COUNT, cellLength * CONTINENT_MAX_USER_COUNT, 1]} />*/}
                    <boxGeometry args={[continentDefaultLength, continentDefaultLength, 1]} />
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
            {placementResult && (<group>
                {placementResult.placements.map((placement) => {
                    return <TerritoryArea
                        key={placement.playerId}
                        placement={placement}
                        cellLength={cellLength}
                        onTileClick={() => {
                            onTileClick(placement.playerId);
                        }}
                    />
                })}
            </group>)}
        </group>)
    );
}

export default memo(SingleContinent);
