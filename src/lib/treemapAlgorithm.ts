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

import {Investor} from "@/store/investorsStore";

export type Square = {
    investor: Investor,
    sideLength: number, // 최소 1×1
}

export type Placement = {
    investor: Investor,
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

/**---------------------------------------------------------------------------*
 * 광고판 스타일 배치 알고리즘 (Billboard-Style Placement)
 *---------------------------------------------------------------------------*/
export function calculateSquareLayout(investorList: Investor[], maxUserCount: number) {
    console.log('🏢 Billboard-Style 배치 알고리즘 시작')

    if (investorList.length === 0) return { placements: [], boundary: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 } }

    try {
        // Billboard 알고리즘 사용
        // const result = calculateBillboardLayout(investorList, maxUserCount)
        const result = calculateRectangularSquareLayout(investorList, maxUserCount);
        console.log(`✅ Billboard 배치 완료: ${result.placements.length}개 정사방형`)
        return result
    } catch (error) {
        console.error(`❌ Billboard 에러, 간단 배치로 대체:`, error)

        // 에러 시 간단한 배치로 대체
        const placements = investorList.map((investor, index) => ({
            investor,
            x: (index % 2) * 10 - 5,
            y: Math.floor(index / 2) * 10 - 5,
            width: 8,
            height: 8
        }))

        return {
            placements,
            boundary: { minX: -10, maxX: 15, minY: -10, maxY: 15, width: 25, height: 25 }
        }
    }
}

function calculateRectangularSquareLayout(investorList: Investor[], maxUsers: number) {
    // 1. 각 투자자의 지분율에 따라 정사각형 크기 계산
    const totalInvestmentAmount = investorList.reduce((acc, investor) => acc + investor.investment_amount, 0);
    const squares = investorList.map(investor => {
        const sharePercentage = investor.investment_amount / totalInvestmentAmount;
        const area = sharePercentage * maxUsers * maxUsers;
        const sideLength = Math.floor(Math.sqrt(area));

        return {
            investor,
            sideLength: Math.max(1, sideLength)
        };
    });

    // 2. 정사각형을 크기 기준 내림차순 정렬
    squares.sort((a, b) => b.sideLength - a.sideLength);

    // 3. 직사각형 영역 내에 정사각형 배치 (가로 직사각형 형태)
    return placeSquaresInHorizontalRectangle(squares, maxUsers);
}

/**
 * 가로 직사각형 형태로 정사각형을 배치하는 함수
 * 세로 방향으로 먼저 채우고, 세로 공간이 부족하면 가로로 확장
 */
function placeSquaresInHorizontalRectangle(squares: Square[], maxSize: number) {
    // 초기 직사각형 영역 설정 (가로:세로 = 1:1 시작)
    let width = maxSize;
    let height = maxSize;

    // 배치된 정사각형 정보
    const placements: Placement[] = [];

    // 현재 열과 행의 위치 (세로 방향 우선)
    let currentX = 0;
    let currentY = 0;
    let columnWidth = 0;

    for (const square of squares) {
        // 현재 열에 배치 가능한지 확인
        if (currentY + square.sideLength <= height) {
            // 현재 열에 배치
            placements.push({
                investor: square.investor,
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
                investor: square.investor,
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