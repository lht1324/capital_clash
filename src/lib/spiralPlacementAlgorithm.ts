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
import {Continent} from "@/api/types/supabase/Continents";

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

enum SpiralDirection {
    EAST = "EAST",
    SOUTH = "SOUTH",
    WEST = "WEST",
    NORTH = "NORTH",
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
    // 1. 전처리
    const squares = preprocessPlayers(filteredPlayerListByContinent);
    
    // 2. 중심 기반 나선형 배치
    return placeSpiralLayout(squares);
}

function preprocessPlayers(players: Player[]): Square[] {
    const totalStakeAmount = players.reduce((acc, player) => acc + player.stake_amount, 0);
    
    return players.map((player) => {
        const sharePercentage = Math.max(0.01, player.stake_amount / totalStakeAmount);
        const area = sharePercentage * CONTINENT_MAX_USER_COUNT * CONTINENT_MAX_USER_COUNT;
        const sideLength = Math.floor(Math.sqrt(area));
        
        return {
            playerId: player.id,
            sideLength: Math.max(1, sideLength)
        };
    }).sort((a, b) => b.sideLength - a.sideLength);
}

function placeSpiralLayout(squares: Square[]): { placements: Placement[], boundary: Boundary } {
    if (squares.length === 0) {
        return {
            placements: [],
            boundary: {
                minX: 0,
                maxX: 99,
                minY: 0,
                maxY: 99,
                width: CONTINENT_MAX_USER_COUNT,
                height: CONTINENT_MAX_USER_COUNT
            }
        };
    }

    if (squares.length === 1) {
        const square = squares[0];

        return {
            placements: [{
                playerId: square.playerId,
                x: -(square.sideLength / 2),
                y: -(square.sideLength / 2),
                width: square.sideLength,
                height: square.sideLength
            }],
            boundary: {
                minX: 0,
                minY: 0,
                maxX: 99,
                maxY: 99,
                width: CONTINENT_MAX_USER_COUNT,
                height: CONTINENT_MAX_USER_COUNT,
            }
        };
    }
    
    const placements: Placement[] = [];
    
    // 1. 중앙 배치
    const centerSquare = squares[0];
    const centerPlacement = {
        playerId: centerSquare.playerId,
        x: 48.5 - (centerSquare.sideLength / 2),
        y: 48.5 - (centerSquare.sideLength / 2),
        width: centerSquare.sideLength,
        height: centerSquare.sideLength
    };
    placements.push(centerPlacement);
    
    // 2. 4방향 나선형 배치
    let remainingSquares = squares.slice(1);
    const firstPlacementSquare = remainingSquares[0];
    let currentDirection = SpiralDirection.EAST;
    let currentBoundary = {
        minX: centerPlacement.x,
        maxX: centerPlacement.x + centerPlacement.width,
        minY: centerPlacement.y,
        maxY: centerPlacement.y + centerPlacement.height,
    }
    let lastCycleBoundary = {
        minX: centerPlacement.x,
        maxX: centerPlacement.x + centerPlacement.width,
        minY: centerPlacement.y,
        maxY: centerPlacement.y + centerPlacement.height,
    }
    let lastPlacementInfo = {
        lastDirection: SpiralDirection.EAST,
        lastPlacement: centerPlacement,
    }

    while (remainingSquares.length > 0) {
        const nextSquare = remainingSquares[0];
        const nextSquarePosition = calculateNextPosition(nextSquare, currentDirection, lastCycleBoundary, lastPlacementInfo);

        const newPlacement = createPlacement(nextSquare, nextSquarePosition);
        placements.push(newPlacement);
        lastPlacementInfo = {
            lastDirection: currentDirection,
            lastPlacement: newPlacement
        }
        remainingSquares.shift();

        const { isSlightDifference, isExceeded } = exceedsBoundary(nextSquarePosition, nextSquare, currentBoundary, currentDirection)

        if (isExceeded) {
            // 첫 번째 경계 초과: 한 번 허용하고 동적 확장
            currentBoundary = expandBoundary(currentBoundary, nextSquare, nextSquarePosition, currentDirection, isSlightDifference);

            const prevDirection: SpiralDirection = currentDirection;
            const newDirection = changeDirection(prevDirection);

            if (prevDirection !== newDirection) {
                switch (prevDirection) {
                    case SpiralDirection.EAST: {
                        lastCycleBoundary = {
                            ...lastCycleBoundary,
                            minY: lastPlacementInfo.lastPlacement.y,
                        }
                        if (lastCycleBoundary.minY < currentBoundary.minY) {
                            currentBoundary = {
                                ...currentBoundary,
                                minY: lastCycleBoundary.minY,
                            }
                        }
                        break;
                    }
                    case SpiralDirection.SOUTH: {
                        lastCycleBoundary = {
                            ...lastCycleBoundary,
                            maxX: lastPlacementInfo.lastPlacement.x + lastPlacementInfo.lastPlacement.width,
                        }
                        if (currentBoundary.maxX < lastCycleBoundary.maxX) {
                            currentBoundary = {
                                ...currentBoundary,
                                maxX: lastCycleBoundary.maxX,
                            }
                        }
                        break;
                    }
                    case SpiralDirection.WEST: {
                        lastCycleBoundary = {
                            ...lastCycleBoundary,
                            maxY: lastPlacementInfo.lastPlacement.y + lastPlacementInfo.lastPlacement.height,
                        }
                        if (currentBoundary.maxY < lastCycleBoundary.maxY) {
                            currentBoundary = {
                                ...currentBoundary,
                                maxY: lastCycleBoundary.maxY,
                            }
                        }
                        break;
                    }
                    case SpiralDirection.NORTH: {
                        lastCycleBoundary = {
                            ...lastCycleBoundary,
                            minX: lastPlacementInfo.lastPlacement.x,
                        }
                        if (lastCycleBoundary.minX < currentBoundary.minX) {
                            currentBoundary = {
                                ...currentBoundary,
                                minX: lastCycleBoundary.minX,
                            }
                        }
                        break;
                    }
                }
            }

            currentDirection = newDirection;
        }
    }
    
    // 3. 후처리
    const continentBoundary = calculateContinentBoundary(placements);
    const centeredPlacements = centerPlacements(placements, continentBoundary);
    
    return {
        placements: centeredPlacements,
        boundary: continentBoundary,
    };
}

function changeDirection(currentDirection: SpiralDirection) {
    switch (currentDirection) {
        case SpiralDirection.EAST: return SpiralDirection.SOUTH;
        case SpiralDirection.SOUTH: return SpiralDirection.WEST;
        case SpiralDirection.WEST: return SpiralDirection.NORTH;
        case SpiralDirection.NORTH: return SpiralDirection.EAST;
    }
}

function calculateNextPosition(
    nextSquare: Square,
    currentDirection: SpiralDirection,
    lastCycleBoundary: { minX: number, maxX: number, minY: number, maxY: number },
    // centerPlacement: Placement,
    lastPlacementInfo: { lastDirection: SpiralDirection, lastPlacement: Placement },
): { x: number, y: number } {
    const { lastDirection, lastPlacement } = lastPlacementInfo;

    switch (currentDirection) {
        case SpiralDirection.EAST: {
            const baselineY = lastPlacement.y;
            const isOverlapped = baselineY + nextSquare.sideLength > lastCycleBoundary.minY;

            return {
                x: lastPlacement.x + lastPlacement.width,
                y: !isOverlapped || (lastDirection === currentDirection)
                    ? baselineY
                    : lastCycleBoundary.minY - nextSquare.sideLength,
            }
        }
        case SpiralDirection.SOUTH: {
            const baselineX = lastPlacement.x + lastPlacement.width;
            const isOverlapped = baselineX - nextSquare.sideLength < lastCycleBoundary.maxX;

            return {
                x: !isOverlapped
                    ? baselineX - nextSquare.sideLength
                    : lastCycleBoundary.maxX,
                y: lastPlacement.y + lastPlacement.height,
            }
        }
        case SpiralDirection.WEST: {
            const baselineY = lastPlacement.y + lastPlacement.height;
            const isOverlapped = baselineY - nextSquare.sideLength < lastCycleBoundary.maxY;

            return {
                x: lastPlacement.x - nextSquare.sideLength,
                y: !isOverlapped
                    ? baselineY - nextSquare.sideLength
                    : lastCycleBoundary.maxY,
            }
        }
        case SpiralDirection.NORTH: {
            const baselineX = lastPlacement.x;
            const isOverlapped = baselineX + nextSquare.sideLength > lastCycleBoundary.minX;

            return {
                x: !isOverlapped
                    ? baselineX
                    : lastCycleBoundary.minX - nextSquare.sideLength,
                y: lastPlacement.y - nextSquare.sideLength,
            }
        }
    }
}

function createPlacement(square: Square, position: { x: number, y: number }): Placement {
    return {
        playerId: square.playerId,
        x: position.x,
        y: position.y,
        width: square.sideLength,
        height: square.sideLength
    };
}

function exceedsBoundary(
    position: { x: number, y: number },
    newSquare: Square,
    currentBoundary: { minX: number, maxX: number, minY: number, maxY: number }, 
    direction: SpiralDirection
): { isSlightDifference: boolean, isExceeded: boolean } {
    const squareLeft = position.x;
    const squareRight = position.x + newSquare.sideLength;
    const squareTop = position.y;
    const squareBottom = position.y + newSquare.sideLength;

    let isSlightDifference: boolean;
    let isExceeded: boolean;
    
    switch (direction) {
        case SpiralDirection.EAST: {
            // isSlightDifference = Math.abs(squareRight - currentBoundary.maxX) <= 10
            isSlightDifference = squareRight <= currentBoundary.maxX && (currentBoundary.maxX - squareRight) <= 10
            isExceeded = squareRight >= currentBoundary.maxX;
            break;

            // return isSlightDifference || isExceeded;
        }
        case SpiralDirection.SOUTH: {
            // isSlightDifference = Math.abs(squareBottom - currentBoundary.maxY) <= 10
            isSlightDifference = squareBottom <= currentBoundary.maxY && (currentBoundary.maxY - squareBottom) <= 10
            isExceeded = squareBottom >= currentBoundary.maxY;
            break;

            // return isSlightDifference || isExceeded;
        }
        case SpiralDirection.WEST: {
            // isSlightDifference = Math.abs(squareLeft - currentBoundary.minX) <= 10
            isSlightDifference = squareLeft >= currentBoundary.minX && (squareLeft - currentBoundary.minX) <= 10
            isExceeded = squareLeft <= currentBoundary.minX;
            break;

            // return isSlightDifference || isExceeded;
        }
        case SpiralDirection.NORTH: {
            // isSlightDifference = Math.abs(squareTop - currentBoundary.minY) <= 10
            isSlightDifference = squareTop >= currentBoundary.minY && (squareTop - currentBoundary.minY) <= 10
            isExceeded = squareTop <= currentBoundary.minY;
            break;
            // return isSlightDifference || isExceeded;
        }
    }

    return { isSlightDifference, isExceeded }
}

function expandBoundary(
    currentBoundary: { minX: number, maxX: number, minY: number, maxY: number },
    nextSquare: Square,
    nextSquarePosition: { x: number, y: number },
    lastDirection: SpiralDirection,
    isSlightDifference: boolean,
) {
    const newBoundary = { ...currentBoundary };
    
    switch (lastDirection) {
        case SpiralDirection.EAST: {
            newBoundary.maxX = nextSquarePosition.x + nextSquare.sideLength;
            break;
        }
        case SpiralDirection.SOUTH: {
            newBoundary.maxY = nextSquarePosition.y + nextSquare.sideLength;
            break;
        }
        case SpiralDirection.WEST: {
            newBoundary.minX = nextSquarePosition.x;
            break;
        }
        case SpiralDirection.NORTH: {
            newBoundary.minY = nextSquarePosition.y;
            break;
        }
    }
    
    return newBoundary;
}

function calculateContinentBoundary(placementList: Placement[]) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    placementList.forEach((placement) => {
        minX = Math.min(minX, placement.x);
        maxX = Math.max(maxX, placement.x + placement.width);
        minY = Math.min(minY, placement.y);
        maxY = Math.max(maxY, placement.y + placement.height);
    });

    return {
        minX, maxX, minY, maxY,
        width: maxX - minX,
        height: maxY - minY
    };
}

function centerPlacements(placementList: Placement[], continentBoundary: Boundary) {
    const continentMidpointX = continentBoundary.minX + continentBoundary.width / 2;
    const continentMidpointY = continentBoundary.minY + continentBoundary.height / 2;


    return placementList.map((placement) => ({
        ...placement,
        x: placement.x - continentMidpointX,
        y: placement.y - continentMidpointY,
    }));
}

// 투자자 좌표 계산 함수
export function calculatePlayerCoordinates(
    vipPlayerList: Player[],
    filteredPlayerListByUserContinent: Player[],
    continentId: string,
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
        : calculateSquareLayout(filteredPlayerListByUserContinent, continentId);

    const userPlacementInfo = userPlacementResult.placements.find((placement) => {
        return placement.playerId === userPlayerInfoId;
    });

    if (!userPlacementInfo) return null;

    if (!isVip) {
        const placementResultRecord: Record<string, PlacementResult> = {
            "central": centralPlacementResult,
            [continentId]: userPlacementResult
        };
        const userContinentPosition = getContinentPositions(placementResultRecord)[continentId];

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
                x = cornerCoordinate.x - (continentSize.realWidth / 2) - (continentSize.realWidth * 0.2);
                y = cornerCoordinate.y + (continentSize.realHeight / 2) - (continentSize.realHeight * 0.4);
                break;
            case "northeast":
                // 북동쪽 대륙: 왼쪽 아래 모서리가 중앙 대륙의 북동쪽 꼭짓점에 닿도록
                x = cornerCoordinate.x + (continentSize.realWidth / 2) + (continentSize.realWidth * 0.2);
                y = cornerCoordinate.y + (continentSize.realHeight / 2) - (continentSize.realHeight * 0.4);
                break;
            case "southwest":
                // 남서쪽 대륙: 오른쪽 위 모서리가 중앙 대륙의 남서쪽 꼭짓점에 닿도록
                x = cornerCoordinate.x - (continentSize.realWidth / 2) - (continentSize.realWidth * 0.2);
                y = cornerCoordinate.y - (continentSize.realHeight / 2) + (continentSize.realHeight * 0.4);
                break;
            case "southeast":
                // 남동쪽 대륙: 왼쪽 위 모서리가 중앙 대륙의 남동쪽 꼭짓점에 닿도록
                x = cornerCoordinate.x + (continentSize.realWidth / 2) + (continentSize.realWidth * 0.2);
                y = cornerCoordinate.y - (continentSize.realHeight / 2) + (continentSize.realHeight * 0.4);
                break;
            default:
                // 기본 계산 방식 (기존 코드와 동일)
                x = cornerCoordinate.x - continentSize.realWidth / 2;
                y = cornerCoordinate.y - continentSize.realHeight / 2;
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
    screenWidth: number,
    screenHeight: number,
) {
    const continentSize = getContinentSize(placementResult);
    const centralContinentSize = getContinentSize(centralPlacementResult);
    const cornerCoordinate = getContinentCornerCoordinate(placementResult.continentId, centralContinentSize);

    // 대륙 배치 방식 수정: 각 대륙이 중앙 대륙의 꼭짓점에 닿도록 조정
    // 대륙 ID에 따라 위치 조정 방식을 다르게 적용
    let x = 0, y = 0;
    const isHorizontalScreen = screenWidth >= screenHeight;
    const screenRatio = isHorizontalScreen
        ? screenWidth / screenHeight
        : screenHeight / screenWidth;
    const horizontalGap = continentSize.width * (screenRatio * 0.1);
    const verticalGap = continentSize.height * (screenRatio * 0.2);
    const continentWidth = continentSize.width;
    const continentHeight = continentSize.height;

    if (placementResult.continentId !== "central") {
        if (isHorizontalScreen) {
            x = placementResult.continentId.includes("west")
                ? cornerCoordinate.x - (continentWidth / 2) - horizontalGap
                : cornerCoordinate.x + (continentWidth / 2) + horizontalGap;

            y = placementResult.continentId.includes("north")
                ? cornerCoordinate.y + (continentHeight / 2) - verticalGap
                : cornerCoordinate.y - (continentHeight / 2) + verticalGap;
        } else {
            x = placementResult.continentId.includes("west")
                ? cornerCoordinate.x - (continentWidth / 2) + verticalGap
                : cornerCoordinate.x + (continentWidth / 2) - verticalGap;

            y = placementResult.continentId.includes("north")
                ? cornerCoordinate.y + (continentHeight / 2) + horizontalGap
                : cornerCoordinate.y - (continentHeight / 2) - horizontalGap;
        }
    } else {
        x = 0;
        y = 0;
    }

    return {
        x: x,
        y: y,
        z: 0
    }
}

function getContinentSize(placementResult: PlacementResult) {
    const cellLength = placementResult.continentId !== "central"
        ? CONTINENT_DEFAULT_LENGTH / CONTINENT_MAX_USER_COUNT
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
            coordinate = {
                x: -(width / 2),
                y: height / 2,
                z: 0
            };
            break;
        }
        case "northeast": {
            coordinate = {
                x: width / 2,
                y: height / 2,
                z: 0
            };
            break;
        }
        case "southwest": {
            coordinate = {
                x: -(width / 2),
                y: -(height / 2),
                z: 0
            };
            break;
        }
        case "southeast": {
            coordinate = {
                x: width / 2,
                y: -(height / 2),
                z: 0
            };
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
    centralContinentSize: { realWidth: number, realHeight: number },
) {
    const cornerCoordinatesRecord: Record<string, Position> = { };
    const { realWidth, realHeight } = centralContinentSize;

    cornerCoordinatesRecord["northwest"] = { x: -(realWidth / 2), y: realHeight / 2, z: 0 };
    cornerCoordinatesRecord["northeast"] = { x: realWidth / 2, y: realHeight / 2, z: 0 };
    cornerCoordinatesRecord["southwest"] = { x: -(realWidth / 2), y: -(realHeight / 2), z: 0 };
    cornerCoordinatesRecord["southeast"] = { x: realWidth / 2, y: -(realHeight / 2), z: 0 };

    return cornerCoordinatesRecord;
}

function getContinentSizes(placementResultByContinent: Record<string, PlacementResult>) {
    const sizes: Record<string, { realWidth: number, realHeight: number }> = {};

    Object.values(placementResultByContinent).forEach((placementResult) => {
        // cellLength 계산 방식을 WorldScene.tsx와 통일
        const cellLength = placementResult.continentId !== "central"
            ? CONTINENT_DEFAULT_LENGTH / CONTINENT_MAX_USER_COUNT
            : CONTINENT_DEFAULT_LENGTH * CENTRAL_INCREASE_RATIO / CONTINENT_MAX_USER_COUNT;

        sizes[placementResult.continentId] = {
            realWidth: placementResult.boundary.width * cellLength,
            realHeight: placementResult.boundary.height * cellLength
        };
    });

    return sizes;
}
