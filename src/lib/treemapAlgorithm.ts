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

/**---------------------------------------------------------------------------*
 * 광고판 스타일 배치 알고리즘 (Billboard-Style Placement)
 *---------------------------------------------------------------------------*/
export function calculateSquareLayout(investorList: Investor[], maxUserCount: number) {
    console.log('🏢 Billboard-Style 배치 알고리즘 시작')

    if (investorList.length === 0) return { placements: [], boundary: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 } }

    try {
        // Billboard 알고리즘 사용
        const result = calculateBillboardLayout(investorList, maxUserCount)
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

export function calculateBillboardLayout(investorList: Investor[], maxUsers: number) {
    console.log('🏢 새로운 셀 기반 배치 알고리즘 시작', investorList);

    if (investorList.length === 0) return {
        placements: [],
        boundary: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
    };

    // 1. 각 사용자의 지분율에 따라 차지할 셀 개수 계산
    const totalCells = maxUsers * maxUsers;
    const totalInvestmentAmount = investorList.reduce((acc, investor) => { return acc + investor.investment_amount; }, 0);
    const squares = investorList.map(investor => {
        const allowedCellCount = Math.round(Number((investor.investment_amount / totalInvestmentAmount).toFixed(2)) * totalCells);
        const squareLength = Math.floor(Math.sqrt(allowedCellCount)); // 정사각형으로 만들기 위한 한 변의 길이
        return {
            id: investor.id,
            investor: investor,
            length: Math.max(1, squareLength), // 최소 1×1
            allowedCellCount: allowedCellCount
        };
    });

    // 2. 사각형 크기에 따른 내림차순 정렬
    squares.sort((a, b) => b.length - a.length);

    console.log('📊 정렬된 사각형들:');
    squares.forEach((square, i) => {
        console.log(`  ${i+1}. ${square.investor.name || square.id}: ${square.length}×${square.length} (지분: ${(square.investor.investment_amount / totalInvestmentAmount * 100).toFixed(1)}%, 셀: ${square.allowedCellCount}개)`);
    });

    // 3. 배치 상태 초기화
    let currentBoundaryW = maxUsers; // 가로 경계 (셀 단위)
    let currentBoundaryH = maxUsers; // 세로 경계 (셀 단위)
    const placed = []; // 배치된 사각형들

    // 4. 순회 배치 알고리즘
    for (let i = 0; i < squares.length; i++) {
        const square = squares[i];
        let foundPosition = false;

        console.log(`🔍 배치 시도 ${i+1}/${squares.length}: [${square.id}] ${square.length}×${square.length}`);

        // y=0부터 순회 시작
        for (let row = 0; row < currentBoundaryH && !foundPosition; row++) {
            for (let column = 0; column < currentBoundaryW && !foundPosition; column++) {

                // 겹침 검사: 기존 배치된 사각형들과 겹치지 않는지 확인
                let canPlace = true;
                for (const existing of placed) {
                    if (!(column + square.length <= existing.x ||
                        existing.x + existing.length <= column ||
                        row + square.length <= existing.y ||
                        existing.y + existing.length <= row)) {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    // y=0일 때: 경계 확장 가능
                    if (row === 0) {
                        // 경계를 넘는 경우 경계 확장
                        if (column + square.length > currentBoundaryW) {
                            currentBoundaryW = column + square.length;
                            console.log(`🔧 y=0에서 경계 확장: 가로 ${currentBoundaryW}셀로 확장`);
                        }

                        // 배치 실행
                        placed.push({
                            ...square,
                            x: column,
                            y: row
                        });

                        console.log(`✅ 배치 완료: ${square.id} at (${column}, ${row}) ${square.length}×${square.length} [y=0, 경계확장가능]`);
                        foundPosition = true;

                    } else {
                        // y≥1일 때: 확장된 경계 내에서만 배치
                        if (column + square.length <= currentBoundaryW) {
                            // 배치 실행
                            placed.push({
                                ...square,
                                x: column,
                                y: row
                            });

                            console.log(`✅ 배치 완료: ${square.id} at (${column}, ${row}) ${square.length}×${square.length} [y≥1, 경계내]`);
                            foundPosition = true;
                        } else {
                            // 경계를 넘으면 x=0으로 돌아가서 다음 행으로
                            console.log(`⚠️ y≥1에서 경계 초과: (${column}, ${row}) + ${square.length} > ${currentBoundaryW}, 다음 행으로`);
                            break; // 내부 x 루프 종료, 다음 y로
                        }
                    }
                }
            }
        }

        // 배치하지 못한 경우 강제 배치 (새 행 생성)
        if (!foundPosition) {
            const newY = currentBoundaryH;
            placed.push({
                ...square,
                x: 0,
                y: newY
            });

            currentBoundaryW = Math.max(currentBoundaryW, square.length);
            currentBoundaryH = newY + square.length;

            console.log(`🆘 강제 배치: ${square.id} at (0,${newY}) ${square.length}×${square.length}, 새 경계: ${currentBoundaryW}×${currentBoundaryH}`);
        }
    }

    // 5. Placement 형식으로 변환
    const placements = placed.map(square => {
        return {
            investor: square.investor,
            x: square.x - Math.floor(currentBoundaryW / 2),  // 중심 기준으로 좌표 조정
            y: square.y - Math.floor(currentBoundaryH / 2),
            width: square.length,
            height: square.length
        };
    });

    // 6. 경계 계산
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    placements.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x + p.width);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y + p.height);
    });

    const boundary = {
        minX, maxX, minY, maxY,
        width: maxX - minX,
        height: maxY - minY
    };

    // 7. 결과 출력
    console.log(`🏢 배치 완료: ${placed.length}/${squares.length}개`);
    console.log(`📐 최종 경계: ${currentBoundaryW}×${currentBoundaryH} (셀 단위)`);
    console.log(`🎯 배치 결과:`);
    placements.forEach((p, i) => {
        console.log(`  ${i+1}. ${p.investor.name || p.investor.id}: (${p.x},${p.y}) ${p.width}×${p.height}`);
    });

    return { placements, boundary };
}