import {Continent} from "@/api/types/supabase/Continents";
import {PlacementResult, Position} from "@/lib/treemapAlgorithm";
import {
    CENTRAL_INCREASE_RATIO,
    CONTINENT_DEFAULT_LENGTH, CONTINENT_MAP_FOV,
    CONTINENT_MAX_USER_COUNT
} from "@/components/main/continent_map/continent_map_public_variables";
import {MathUtils} from "three";

export function getWorldViewPositionZ(
    continentList: Continent[],
    placementResultRecord: Record<string, PlacementResult>,
    continentPositionRecord: Record<string, Position>
) {
    const worldBoundary = getWorldBoundary(continentList, placementResultRecord, continentPositionRecord);

    const height = worldBoundary.height;
    const cellLength = CONTINENT_DEFAULT_LENGTH / CONTINENT_MAX_USER_COUNT;
    const realHeight = height * cellLength;
    const ratio = 0.8;
    const fov = MathUtils.degToRad(CONTINENT_MAP_FOV);

    return height / (2 * ratio * Math.tan(fov / 2));
}

function getWorldBoundary(
    continentList: Continent[],
    placementResultRecord: Record<string, PlacementResult>,
    continentPositionRecord: Record<string, Position>
) {
    const cellLength = CONTINENT_DEFAULT_LENGTH / CONTINENT_MAX_USER_COUNT;

    let minX =  Infinity, minY =  Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    // 1) 실제로 존재하는 대륙들만으로 1차 박스
    continentList.forEach((continent) => {
        const placementResult = placementResultRecord[continent.id];
        if (!placementResult) return;                // 인구 0 → skip

        const boundary = placementResult.boundary;
        const { x = 0, y = 0, z = 0 } = continentPositionRecord[continent.id] ?? {};

        console.log(`${continent.id} boundary`, boundary);
        minX = Math.min(minX, boundary.minX * cellLength + x);
        maxX = Math.max(maxX, boundary.maxX * cellLength + x);
        minY = Math.min(minY, boundary.minY * cellLength + y);
        maxY = Math.max(maxY, boundary.maxY * cellLength + y);
    });

    if (minX === Infinity) throw new Error('No active continents');

    // 2) 중심 계산
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    // 3) 좌/우·상/하 “가장 먼 거리”를 양쪽에 동일 적용
    const halfW = Math.max(cx - minX, maxX - cx);
    const halfH = Math.max(maxY - cy, cy - minY);

    return {
        minX: cx - halfW,
        maxX: cx + halfW,
        minY: cy - halfH,
        maxY: cy + halfH,
        centerX: cx,
        centerY: cy,
        width:  halfW * 2,
        height: halfH * 2,
    };
}