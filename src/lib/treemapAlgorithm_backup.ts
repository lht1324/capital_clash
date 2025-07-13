/* ===========================================================================
   📐 Cell-Based Fixed-Ratio Treemap Pack -- Capital Clash 온라인 광고판용
   ---------------------------------------------------------------------------
   ● 입력  : 가중치(share, 0–1) + 고정 비율(ratio = w / h)
   ● 출력  : 각 투자자의 셀 단위 좌표(x, y, w, h)
   ● 제약  : 총 셀 개수 2500개 (50×50), 가로세로 비율 고정
   ● 단계
       1) share → 셀 개수        : cellsᵢ = shareᵢ * 2500
       2) 셀 개수 + 비율 → (w, h) : 비율에 맞는 최대 직사각형 계산
       3) MaxRects pack         : 셀 단위 직사각형들을 빈틈없이 배치
       4) 결과 → 3D 공간        : 셀 좌표 → 3D 월드 좌표 변환
   ========================================================================== */

import { Player } from "@/api/types/supabase/Players";
import {
    CENTRAL_INCREASE_RATIO,
    CONTINENT_DEFAULT_LENGTH, CONTINENT_MAX_USER_COUNT
} from "@/components/main/continent_map/continent_map_public_variables";

export type PlacementResult = {
    placements: Placement[],
    boundary: Boundary,
    continentId: string
}

export type Placement = {
    playerId: string,
    x: number,  // 중심 기준으로 좌표 조정
    y: number,
    width: number,
    height: number
}

export type Boundary = {
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    width: number,
    height: number
}

export type Square = {
    playerId: string,
    sideLength: number, // 최소 1×1
}

export type Position = {
    x: number,
    y: number,
    z: number
}

/**---------------------------------------------------------------------------*
 * 광고판 스타일 배치 알고리즘 (Billboard-Style Placement)
 *---------------------------------------------------------------------------*/
export function calculateSquareLayout(filteredPlayerListByContinent: Player[], continentId: string): PlacementResult {
    console.log('🏢 Billboard-Style 배치 알고리즘 시작')

    if (filteredPlayerListByContinent.length === 0) {
        return {
            placements: [],
            boundary: {
                minX: 0,
                maxX: 0,
                minY: 0,
                maxY: 0,
                width: 0,
                height: 0
            },
            continentId: continentId
        }
    }

    try {
        const result = calculateRectangularSquareLayout(filteredPlayerListByContinent);
        console.log(`✅ Billboard 배치 완료: ${result.placements.length}개 정사방형`)
        return {
            ...result,
            continentId: continentId
        }
    } catch (error) {
        console.error(`❌ Billboard 에러, 간단 배치로 대체:`, error)

        // 에러 시 간단한 배치로 대체
        const placements = filteredPlayerListByContinent.map((player, index) => ({
            playerId: player.id,
            x: (index % 2) * 10 - 5,
            y: Math.floor(index / 2) * 10 - 5,
            width: 8,
            height: 8
        }))

        return {
            placements: placements,
            boundary: { minX: -10, maxX: 15, minY: -10, maxY: 15, width: 25, height: 25 },
            continentId: continentId
        }
    }
}

function calculateRectangularSquareLayout(filteredPlayerListByContinent: Player[]) {
    // 1. 각 투자자의 지분율에 따라 정사각형 크기 계산
    const totalStakeAmount = filteredPlayerListByContinent.reduce((acc, player) => {
        return acc + player.stake_amount;
    }, 0);
    const squares = filteredPlayerListByContinent.map((player) => {
        const sharePercentage = player.stake_amount / totalStakeAmount;
        const area = sharePercentage * CONTINENT_MAX_USER_COUNT * CONTINENT_MAX_USER_COUNT;
        const sideLength = Math.floor(Math.sqrt(area));

        return {
            playerId: player.id,
            sideLength: Math.max(1, sideLength)
        };
    });

    // 2. 정사각형을 크기 기준 내림차순 정렬
    squares.sort((a, b) => b.sideLength - a.sideLength);

    // 3. 직사각형 영역 내에 정사각형 배치 (가로 직사각형 형태)
    return placeSquaresInHorizontalRectangle(squares);
}

/**
 * 가로 직사각형 형태로 정사각형을 배치하는 함수
 * 세로 방향으로 먼저 채우고, 세로 공간이 부족하면 가로로 확장
 */
function placeSquaresInHorizontalRectangle(squares: Square[]) {
    // 초기 직사각형 영역 설정 (가로:세로 = 1:1 시작)
    let maxLength = CONTINENT_MAX_USER_COUNT;

    // 배치된 정사각형 정보
    const placements: Placement[] = [];

    // 현재 열과 행의 위치 (세로 방향 우선)
    let currentX = 0;
    let currentY = 0;
    let columnWidth = 0;

    for (const square of squares) {
        // 현재 열에 배치 가능한지 확인
        if (currentY + square.sideLength <= maxLength) {
            // 현재 열에 배치
            placements.push({
                playerId: square.playerId,
                x: currentX,
                y: currentY,
                width: square.sideLength,
                height: square.sideLength
            });

            // 현재 열의 너비 업데이트
            columnWidth = Math.max(columnWidth, square.sideLength);

            // Y 위치 업데이트 (세로 방향으로 이동)
            currentY += square.sideLength;
        } else {
            // 새 열로 이동
            currentY = 0;
            currentX += columnWidth;
            columnWidth = square.sideLength;

            // 새 열에 배치
            placements.push({
                playerId: square.playerId,
                x: currentX,
                y: currentY,
                width: square.sideLength,
                height: square.sideLength
            });

            // Y 위치 업데이트
            currentY += square.sideLength;
        }
    }

    // 전체 경계 계산
    const boundary = calculateBoundary(placements);

    // 중앙 정렬을 위한 좌표 조정
    const centeredPlacements = centerPlacements(placements, boundary);

    return {
        placements: centeredPlacements,
        boundary
    };
}

function calculateBoundary(placements: Placement[]) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    placements.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x + p.width);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y + p.height);
    });

    return {
        minX, maxX, minY, maxY,
        width: maxX - minX,
        height: maxY - minY
    };
}

function centerPlacements(placements: Placement[], boundary: Boundary) {
    const offsetX = Math.floor(boundary.width / 2);
    const offsetY = Math.floor(boundary.height / 2);

    return placements.map(p => ({
        ...p,
        x: p.x - offsetX,
        y: p.y - offsetY
    }));
}

// 투자자 좌표 계산 함수
export function calculatePlayerCoordinates(
    vipPlayerList: Player[],
    filteredPlayerListByUserContinent: Player[],
    userContinentId: string,
    userPlayerInfoId: string,
): Position | null {
    const isVip = !!(vipPlayerList.find((player) => {
        return player.id === userPlayerInfoId;
    }));

    const cellLength = !isVip
        ? CONTINENT_DEFAULT_LENGTH / CONTINENT_MAX_USER_COUNT
        : CONTINENT_DEFAULT_LENGTH * CENTRAL_INCREASE_RATIO / CONTINENT_MAX_USER_COUNT;

    // 4. 영역 배치 계산
    const centralPlacementResult = calculateSquareLayout(vipPlayerList, "central");
    const userPlacementResult = isVip
        ? centralPlacementResult
        : calculateSquareLayout(filteredPlayerListByUserContinent, userContinentId);

    const userPlacementInfo = userPlacementResult.placements.find((placement) => {
        return placement.playerId === userPlayerInfoId;
    });

    if (!userPlacementInfo) return null;

    if (!isVip) {
        const placementResultRecord: Record<string, PlacementResult> = {
            "central": centralPlacementResult,
            [userContinentId]: userPlacementResult
        };
        const userContinentPosition = getContinentPositions(placementResultRecord)[userContinentId];

        return getPositionByUserPlacementInfo(
            userPlacementInfo,
            cellLength,
            userContinentPosition,
        );
    }

    return getPositionByUserPlacementInfo(userPlacementInfo, cellLength);
}

function getPositionByUserPlacementInfo(userPlacementInfo: Placement, cellLength: number, continentPosition?: Position) {
    if (continentPosition) {
        const continentMiddleX = continentPosition.x;
        const continentMiddleY = continentPosition.y;
        const userMiddleX = (userPlacementInfo.x + userPlacementInfo.width / 2) * cellLength;
        const userMiddleY = -(userPlacementInfo.y + userPlacementInfo.height / 2) * cellLength; // y좌표계 방향 치환

        return {
            x: continentMiddleX + userMiddleX,
            y: continentMiddleY + userMiddleY,
            z: 20 + (userPlacementInfo.width / 10 * 2)
        };
    } else {
        return {
            x: (userPlacementInfo.x + userPlacementInfo.width / 2) * cellLength,
            y: -(userPlacementInfo.y + userPlacementInfo.height / 2) * cellLength,
            z: 20 + (userPlacementInfo.width / 10 * 2 * CENTRAL_INCREASE_RATIO)
        }
    }
}

// 대륙 위치 계산
export function getContinentPositions(placementResultsByContinent: Record<string, PlacementResult>) {
    const continentSizes = getContinentSizes(placementResultsByContinent);
    const centralCornerCoordinatesRecord = getCentralCornerCoordinatesRecord(continentSizes["central"]);

    if (!centralCornerCoordinatesRecord) return {};

    const positions: Record<string, Position> = {
        central: {
            x: 0,
            y: 0,
            z: 0
        }
    };

    Object.entries(continentSizes).forEach(([continentId, continentSize]) => {
        if (continentId === "central") return;

        const cornerCoordinate = centralCornerCoordinatesRecord[continentId];

        // 대륙 배치 방식 수정: 각 대륙이 중앙 대륙의 꼭짓점에 닿도록 조정
        // 대륙 ID에 따라 위치 조정 방식을 다르게 적용
        let x = 0, y = 0;

        switch(continentId) {
            case "northwest":
                // 북서쪽 대륙: 오른쪽 아래 모서리가 중앙 대륙의 북서쪽 꼭짓점에 닿도록
                x = cornerCoordinate.x - (continentSize.width / 2) - (continentSize.width * 0.2);
                y = cornerCoordinate.y + (continentSize.height / 2) - (continentSize.height * 0.4);
                break;
            case "northeast":
                // 북동쪽 대륙: 왼쪽 아래 모서리가 중앙 대륙의 북동쪽 꼭짓점에 닿도록
                x = cornerCoordinate.x + (continentSize.width / 2) + (continentSize.width * 0.2);
                y = cornerCoordinate.y + (continentSize.height / 2) - (continentSize.height * 0.4);
                break;
            case "southwest":
                // 남서쪽 대륙: 오른쪽 위 모서리가 중앙 대륙의 남서쪽 꼭짓점에 닿도록
                x = cornerCoordinate.x - (continentSize.width / 2) - (continentSize.width * 0.2);
                y = cornerCoordinate.y - (continentSize.height / 2) + (continentSize.height * 0.4);
                break;
            case "southeast":
                // 남동쪽 대륙: 왼쪽 위 모서리가 중앙 대륙의 남동쪽 꼭짓점에 닿도록
                x = cornerCoordinate.x + (continentSize.width / 2) + (continentSize.width * 0.2);
                y = cornerCoordinate.y - (continentSize.height / 2) + (continentSize.height * 0.4);
                break;
            default:
                // 기본 계산 방식 (기존 코드와 동일)
                x = cornerCoordinate.x - continentSize.width / 2;
                y = cornerCoordinate.y - continentSize.height / 2;
        }

        positions[continentId] = {
            x: x,
            y: y,
            z: 0
        }
    });

    return positions;
}

export function getContinentPosition(
    placementResult: PlacementResult,
    centralPlacementResult: PlacementResult,
) {
    const continentSize = getContinentSize(placementResult);
    const centralContinentSize = getContinentSize(centralPlacementResult);
    const cornerCoordinate = getContinentCornerCoordinate(placementResult.continentId, centralContinentSize);

    // 대륙 배치 방식 수정: 각 대륙이 중앙 대륙의 꼭짓점에 닿도록 조정
    // 대륙 ID에 따라 위치 조정 방식을 다르게 적용
    let x = 0, y = 0;

    switch(placementResult.continentId) {
        case "northwest":
            // 북서쪽 대륙: 오른쪽 아래 모서리가 중앙 대륙의 북서쪽 꼭짓점에 닿도록
            x = cornerCoordinate.x - (continentSize.width / 2) - (continentSize.width * 0.2);
            y = cornerCoordinate.y + (continentSize.height / 2) - (continentSize.height * 0.4);
            break;
        case "northeast":
            // 북동쪽 대륙: 왼쪽 아래 모서리가 중앙 대륙의 북동쪽 꼭짓점에 닿도록
            x = cornerCoordinate.x + (continentSize.width / 2) + (continentSize.width * 0.2);
            y = cornerCoordinate.y + (continentSize.height / 2) - (continentSize.height * 0.4);
            break;
        case "southwest":
            // 남서쪽 대륙: 오른쪽 위 모서리가 중앙 대륙의 남서쪽 꼭짓점에 닿도록
            x = cornerCoordinate.x - (continentSize.width / 2) - (continentSize.width * 0.2);
            y = cornerCoordinate.y - (continentSize.height / 2) + (continentSize.height * 0.4);
            break;
        case "southeast":
            // 남동쪽 대륙: 왼쪽 위 모서리가 중앙 대륙의 남동쪽 꼭짓점에 닿도록
            x = cornerCoordinate.x + (continentSize.width / 2) + (continentSize.width * 0.2);
            y = cornerCoordinate.y - (continentSize.height / 2) + (continentSize.height * 0.4);
            break;
        case "central":
            // 남동쪽 대륙: 왼쪽 위 모서리가 중앙 대륙의 남동쪽 꼭짓점에 닿도록
            x = 0;
            y = 0;
            break;
        default:
            // 기본 계산 방식 (기존 코드와 동일)
            x = cornerCoordinate.x - continentSize.width / 2;
            y = cornerCoordinate.y - continentSize.height / 2;
    }

    return {
        x: x,
        y: y,
        z: 0
    }
}

function getContinentSize(placementResult: PlacementResult) {
    const cellLength = placementResult.continentId !== "central"
        ? CONTINENT_DEFAULT_LENGTH / CONTINENT_MAX_USER_COUNT  // 일반 대륙은 max_users 대신 100 사용
        : CONTINENT_DEFAULT_LENGTH * CENTRAL_INCREASE_RATIO / CONTINENT_MAX_USER_COUNT;

    return {
        width: placementResult.boundary.width * cellLength,
        height: placementResult.boundary.height * cellLength
    }
}

function getContinentCornerCoordinate(
    continentId: string,
    centralContinentSize: { width: number, height: number }
) {
    const { width, height } = centralContinentSize;
    let coordinate = { x: 0, y: 0, z: 0 };

    switch(continentId) {
        case "northwest": {
            coordinate = { x: -(width / 2), y: height / 2, z: 0 };
            break;
        }
        case "northeast": {
            coordinate = { x: width / 2, y: height / 2, z: 0 };
            break;
        }
        case "southwest": {
            coordinate = { x: -(width / 2), y: -(height / 2), z: 0 };
            break;
        }
        case "southeast": {
            coordinate = { x: width / 2, y: -(height / 2), z: 0 };
            break;
        }
        default: {
            break;
        }
    }

    return coordinate;
}

// 중앙 대륙 꼭짓점 계산
function getCentralCornerCoordinatesRecord(
    centralContinentSize: { width: number, height: number },
) {
    const cornerCoordinatesRecord: Record<string, Position> = { };
    console.log("centralContinentSize", centralContinentSize)
    const { width, height } = centralContinentSize;

    cornerCoordinatesRecord["northwest"] = { x: -(width / 2), y: height / 2, z: 0 };
    cornerCoordinatesRecord["northeast"] = { x: width / 2, y: height / 2, z: 0 };
    cornerCoordinatesRecord["southwest"] = { x: -(width / 2), y: -(height / 2), z: 0 };
    cornerCoordinatesRecord["southeast"] = { x: width / 2, y: -(height / 2), z: 0 };

    return cornerCoordinatesRecord;
}

function getContinentSizes(placementResultByContinent: Record<string, PlacementResult>) {
    const sizes: Record<string, { width: number, height: number }> = {};

    Object.values(placementResultByContinent).forEach((placementResult) => {
        // cellLength 계산 방식을 WorldScene.tsx와 통일
        const cellLength = placementResult.continentId !== "central"
            ? CONTINENT_DEFAULT_LENGTH / CONTINENT_MAX_USER_COUNT  // 일반 대륙은 max_users 대신 100 사용
            : CONTINENT_DEFAULT_LENGTH * CENTRAL_INCREASE_RATIO / CONTINENT_MAX_USER_COUNT;

        sizes[placementResult.continentId] = {
            width: placementResult.boundary.width * cellLength,
            height: placementResult.boundary.height * cellLength
        };
    });

    return sizes;
}
