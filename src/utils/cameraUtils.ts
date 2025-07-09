import {Continent} from "@/api/types/supabase/Continents";
import {PlacementResult, Position} from "@/lib/spiralPlacementAlgorithm";
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
    const paddingRatio = 0.2; // 지도 상에서 대륙 위아래와 화면 경계 간격의 비율
    const continentalRatio = 1 - paddingRatio;
    const fov = MathUtils.degToRad(CONTINENT_MAP_FOV);

    return height / (2 * continentalRatio * Math.tan(fov / 2));
}

function getWorldBoundary(
    continentList: Continent[],
    placementResultRecord: Record<string, PlacementResult>,
    continentPositionRecord: Record<string, Position>
) {
    let minX =  Infinity, minY =  Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    // 1) 실제로 존재하는 대륙들만으로 1차 박스
    continentList.forEach((continent) => {
        const cellLength = continent.id !== "central"
            ? CONTINENT_DEFAULT_LENGTH / CONTINENT_MAX_USER_COUNT
            : CONTINENT_DEFAULT_LENGTH / CONTINENT_MAX_USER_COUNT * CENTRAL_INCREASE_RATIO;

        const placementResult = placementResultRecord[continent.id];

        const boundary = placementResult.boundary;
        const { x = 0, y = 0, z = 0 } = continentPositionRecord[continent.id] ?? {};

        minX = Math.min(minX, x - (boundary.width * cellLength / 2));
        maxX = Math.max(maxX, x + (boundary.width * cellLength / 2));
        minY = Math.min(minY, y - (boundary.height * cellLength / 2));
        maxY = Math.max(maxY, y + (boundary.height * cellLength / 2));
    });

    if (minX === Infinity) throw Error("No continents are active.");

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