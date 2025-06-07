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

// @ts-ignore - maxrects-packer 타입 정의가 없으므로 무시
import { MaxRectsPacker } from 'maxrects-packer';

/**---------------------------------------------------------------------------*
 * 1) 입 력 타 입 정 의
 *---------------------------------------------------------------------------*/
interface PhotoSpec {
  id: string;      // 고유 키
  share: number;   // 0 ~ 1 (지분율)
  ratio: number;   // width / height  (ex. 16/9 = 1.777…)
}

interface PackedRect extends PhotoSpec {
  x: number; y: number;        // 좌상단 좌표 (셀 단위)
  width: number; height: number; // 크기 (셀 단위)
}

/**---------------------------------------------------------------------------*
 * 2) 셀 기반 크기 계산 함수
 *---------------------------------------------------------------------------*/
function calculateCellBasedSize(share: number, ratio: number, totalCells: number = 2500): { width: number, height: number } {
  // 1. 지분율로 사용 가능한 셀 개수 계산
  const availableCells = Math.round(share * totalCells);
  
  // 2. 비율에 맞는 최대 직사각형 찾기
  // width = ratio * height 이므로
  // 면적 = width * height = ratio * height * height = ratio * height²
  // height = √(면적 / ratio)
  // width = ratio * height
  
  const height = Math.floor(Math.sqrt(availableCells / ratio));
  const width = Math.floor(ratio * height);
  
  // 3. 실제 사용된 셀 개수
  const actualCells = width * height;
  
  console.log(`📊 셀 계산: 지분${(share*100).toFixed(1)}%, 비율${ratio.toFixed(2)}:1 → ${availableCells}셀 가능 → ${width}×${height}=${actualCells}셀 사용`);
  
  return { width: Math.max(1, width), height: Math.max(1, height) };
}

/**---------------------------------------------------------------------------*
 * 3) 핵심 함수 구현 (셀 기반)
 *---------------------------------------------------------------------------*/
export function packCellBasedTreemap(
  photos   : PhotoSpec[],
  maxCells : number = 2500,       // 총 셀 개수 (50×50)
  containerSize = 100             // 컨테이너 기본 크기 (셀 단위)
): PackedRect[] {
  console.log(`🎯 Cell-Based Treemap 시작: ${photos.length}개 항목, 최대 셀: ${maxCells}개`)
  
  if (photos.length === 0) return []
  
  /* ---------------------------------------------------------
     A. 셀 기반 크기 계산 (O(N))
  --------------------------------------------------------- */
  const rects = photos.map(p => {
    const { width, height } = calculateCellBasedSize(p.share, p.ratio, maxCells);
    
    return { 
      ...p, 
      width, 
      height 
    };
  });
  
  // 실제 사용된 총 셀 개수 확인
  const totalUsedCells = rects.reduce((sum, r) => sum + (r.width * r.height), 0);
  console.log(`📊 총 사용 셀: ${totalUsedCells}/${maxCells} (${(totalUsedCells/maxCells*100).toFixed(1)}%)`);

  /* ---------------------------------------------------------
     B. 동적 컨테이너 크기 계산
  --------------------------------------------------------- */
  const ratios = photos.map(p => p.ratio);
  const maxRatio = Math.max(...ratios);
  const minRatio = Math.min(...ratios);
  
  // 극단적 비율에 대응할 수 있는 컨테이너 크기
  const maxWidthNeeded = Math.ceil(Math.sqrt(maxCells * maxRatio));
  const maxHeightNeeded = Math.ceil(Math.sqrt(maxCells / minRatio));
  
  const containerW = Math.max(containerSize, maxWidthNeeded);
  const containerH = Math.max(containerSize, maxHeightNeeded);
  
  console.log(`📐 컨테이너 크기: ${containerW}×${containerH} (최대 ${containerW * containerH}셀 용량)`);

  /* ---------------------------------------------------------
     C. MaxRects 패커 설정 & 배치 (셀 단위)
  --------------------------------------------------------- */
  const packer = new MaxRectsPacker(
    containerW,   // 컨테이너 가로 (셀 단위)
    containerH,   // 컨테이너 세로 (셀 단위)
    0,            // padding (0 여백)
    { smart: true, pot: false, square: false }
  );

  // 각 rect를 개별적으로 추가
  rects.forEach(r => {
    packer.add(r.width, r.height, r);
  });

  // 오버플로우 체크
  if (packer.bins.length > 1) {
    console.warn(`⚠️ 오버플로우 발생: ${packer.bins.length}개 bin 생성됨. 컨테이너 크기를 늘리거나 총 지분을 줄이세요.`);
  }

  const bin = packer.bins[0];
  if (!bin) {
    console.error(`❌ 패킹 실패: bin이 생성되지 않았습니다.`);
    return []
  }

  console.log(`📦 패킹 완료: ${bin.rects.length}개 배치, 최종 높이: ${bin.height}셀`);

  /* ---------------------------------------------------------
     D. 셀 좌표 반환
  --------------------------------------------------------- */
  return bin.rects.map((r: any) => ({
    id     : r.data.id,
    share  : r.data.share,
    ratio  : r.data.ratio,
    x      : r.x,
    y      : r.y,
    width  : r.width,
    height : r.height,
  }));
}

/**---------------------------------------------------------------------------*
 * 4) Capital Clash 연동을 위한 어댑터 함수 (셀 기반)
 *---------------------------------------------------------------------------*/
export function calculateTreemapLayout(investors: any[]) {
  console.log('🌳 Cell-Based Treemap 레이아웃 계산 시작', investors)
  
  if (investors.length === 0) return { 
    placements: [], 
    boundary: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 } 
  }

  // Investor → PhotoSpec 변환
  const photos: PhotoSpec[] = investors.map(investor => ({
    id: investor.id,
    share: investor.share,
    ratio: investor.ratio || (16/9) // 기본값: 16:9 비율
  }))

  // 지분 총합 확인
  const totalShare = photos.reduce((sum, p) => sum + p.share, 0)
  console.log(`🔍 지분 총합: ${(totalShare * 100).toFixed(1)}%`)
  
  if (totalShare > 1.0) {
    console.warn(`⚠️ 지분 총합이 100%를 초과: ${(totalShare * 100).toFixed(1)}%`)
    // 정규화
    photos.forEach(p => p.share = p.share / totalShare)
    console.log(`✅ 지분 정규화 완료: 총합 100%로 조정`)
  }

  // 🔧 셀 기반 패킹 실행
  const packed = packCellBasedTreemap(photos, 2500, 50);

  // PackedRect → Placement 변환 (셀 → 3D 좌표)
  const placements = packed.map(rect => {
    const investor = investors.find(inv => inv.id === rect.id)
    return {
      investor,
      x: rect.x - 25,  // 셀 중심 기준으로 좌표 조정 (50/2 = 25)
      y: rect.y - 25,
      width: rect.width,
      height: rect.height
    }
  })

  // 경계 계산 (셀 단위)
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  
  placements.forEach(p => {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x + p.width)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y + p.height)
  })

  const boundary = {
    minX, maxX, minY, maxY,
    width: maxX - minX,
    height: maxY - minY
  }

  console.log(`✅ Cell-Based Treemap 완료: ${placements.length}/${photos.length}개 배치`)
  console.log(`📊 각 투자자별 최종 셀 배치:`)
  placements.forEach(p => {
    const actualCells = p.width * p.height;
    const expectedCells = Math.round(p.investor.share * 2500);
    console.log(`  ${p.investor.name}: ${p.width}×${p.height}=${actualCells}셀 (목표: ${expectedCells}셀, 효율: ${(actualCells/expectedCells*100).toFixed(1)}%)`);
  })
  
  return { placements, boundary }
}

/**---------------------------------------------------------------------------*
 * 5) 광고판 스타일 배치 알고리즘 (Billboard-Style Placement)
 *---------------------------------------------------------------------------*/
interface SquareSpec {
  id: string;
  share: number;
  size: number;  // 정사방형 한 변의 길이
}

interface PlacedSquare extends SquareSpec {
  x: number;
  y: number;
}

function calculateSquareSize(share: number, totalCells: number = 2500): number {
  const availableCells = Math.round(share * totalCells);
  
  // 완전제곱수 중 availableCells보다 작거나 같은 가장 큰 값 찾기
  let bestSize = 1;
  for (let size = 1; size * size <= availableCells; size++) {
    bestSize = size;
  }
  
  console.log(`📊 정사방형 계산: 지분${(share*100).toFixed(1)}% → ${availableCells}셀 가능 → ${bestSize}×${bestSize}=${bestSize*bestSize}셀 사용`);
  
  return Math.max(1, bestSize);
}

export function calculateBillboardLayout(investors: any[]) {
  console.log('🏢 새로운 셀 기반 배치 알고리즘 시작', investors);
  
  if (investors.length === 0) return { 
    placements: [], 
    boundary: { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 } 
  };

  // 1. 각 사용자의 지분율에 따라 차지할 셀 개수 계산
  const totalCells = 2500;
  const squares = investors.map(investor => {
    const cellCount = Math.round(investor.share * totalCells);
    const size = Math.floor(Math.sqrt(cellCount)); // 정사각형으로 만들기 위한 한 변의 길이
    return {
      id: investor.id,
      investor: investor,
      size: Math.max(1, size), // 최소 1×1
      cellCount: cellCount
    };
  });

  // 2. 사각형 크기에 따른 내림차순 정렬
  squares.sort((a, b) => b.size - a.size);
  
  console.log('📊 정렬된 사각형들:');
  squares.forEach((sq, i) => {
    console.log(`  ${i+1}. ${sq.investor.name || sq.id}: ${sq.size}×${sq.size} (지분: ${(sq.investor.share * 100).toFixed(1)}%, 셀: ${sq.cellCount}개)`);
  });

  // 3. 배치 상태 초기화
  let currentBoundaryW = 50; // 가로 경계 (셀 단위)
  let currentBoundaryH = 50; // 세로 경계 (셀 단위)
  const placed = []; // 배치된 사각형들

  // 4. 순회 배치 알고리즘
  for (let i = 0; i < squares.length; i++) {
    const square = squares[i];
    let foundPosition = false;
    
    console.log(`🔍 배치 시도 ${i+1}/${squares.length}: ${square.id} ${square.size}×${square.size}`);
    
    // y=0부터 순회 시작
    for (let y = 0; y < currentBoundaryH && !foundPosition; y++) {
      for (let x = 0; x < currentBoundaryW && !foundPosition; x++) {
        
        // 겹침 검사: 기존 배치된 사각형들과 겹치지 않는지 확인
        let canPlace = true;
        for (const existing of placed) {
          if (!(x + square.size <= existing.x || 
                existing.x + existing.size <= x || 
                y + square.size <= existing.y || 
                existing.y + existing.size <= y)) {
            canPlace = false;
            break;
          }
        }
        
        if (canPlace) {
          // y=0일 때: 경계 확장 가능
          if (y === 0) {
            // 경계를 넘는 경우 경계 확장
            if (x + square.size > currentBoundaryW) {
              currentBoundaryW = x + square.size;
              console.log(`🔧 y=0에서 경계 확장: 가로 ${currentBoundaryW}셀로 확장`);
            }
            
            // 배치 실행
            placed.push({
              ...square,
              x: x,
              y: y
            });
            
            console.log(`✅ 배치 완료: ${square.id} at (${x},${y}) ${square.size}×${square.size} [y=0, 경계확장가능]`);
            foundPosition = true;
            
          } else {
            // y≥1일 때: 확장된 경계 내에서만 배치
            if (x + square.size <= currentBoundaryW) {
              // 배치 실행
              placed.push({
                ...square,
                x: x,
                y: y
              });
              
              console.log(`✅ 배치 완료: ${square.id} at (${x},${y}) ${square.size}×${square.size} [y≥1, 경계내]`);
              foundPosition = true;
            } else {
              // 경계를 넘으면 x=0으로 돌아가서 다음 행으로
              console.log(`⚠️ y≥1에서 경계 초과: (${x},${y}) + ${square.size} > ${currentBoundaryW}, 다음 행으로`);
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
      
      currentBoundaryW = Math.max(currentBoundaryW, square.size);
      currentBoundaryH = newY + square.size;
      
      console.log(`🆘 강제 배치: ${square.id} at (0,${newY}) ${square.size}×${square.size}, 새 경계: ${currentBoundaryW}×${currentBoundaryH}`);
    }
  }

  // 5. Placement 형식으로 변환
  const placements = placed.map(square => {
    return {
      investor: square.investor,
      x: square.x - Math.floor(currentBoundaryW / 2),  // 중심 기준으로 좌표 조정
      y: square.y - Math.floor(currentBoundaryH / 2),
      width: square.size,
      height: square.size
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



// 특정 위치에 정사방형 배치 가능한지 확인
function canPlaceSquareAt(
  placed: PlacedSquare[], 
  x: number, 
  y: number, 
  size: number, 
  boundaryW: number, 
  boundaryH: number,
  allowExpansion: boolean = true
): boolean {
  
  // 경계 체크 (확장 허용 시에는 체크하지 않음)
  if (!allowExpansion && (x + size > boundaryW || y + size > boundaryH)) {
    return false;
  }
  
  // 기존 배치된 정사방형들과 겹치는지 확인
  for (const existing of placed) {
    if (rectanglesOverlap(x, y, size, size, existing.x, existing.y, existing.size, existing.size)) {
      return false;
    }
  }
  
  return true;
}

// 두 직사각형이 겹치는지 확인
function rectanglesOverlap(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean {
  return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
}

/*---------------------------------------------------------------------------*
 5) 사용 예시 & 테스트
---------------------------------------------------------------------------*/
const demo = [
  { id: 'A', share: 0.10, ratio: 16 / 9 },
  { id: 'B', share: 0.10, ratio: 1 },
  { id: 'C', share: 0.10, ratio: 4 / 3 },
  { id: 'D', share: 0.10, ratio: 16 / 10 },
  { id: 'E', share: 0.12, ratio: 17 / 8 },
  { id: 'F', share: 0.05, ratio: 13 / 4 },
  { id: 'G', share: 0.13, ratio: 2 },
];

// 테스트 실행 함수
export function testTreemapAlgorithm() {
  console.log('🧪 Treemap 알고리즘 테스트 시작')
  const packed = packCellBasedTreemap(demo, 2500, 50);
  console.table(packed);
  return packed
}

/*  🔗 TODO:
    - 추가 옵션: container padding, outer margin, min/max scaling 등
    - 모바일 회전 대응: packCellBasedTreemap(photos, newWidth)
    - 퍼포먼스 향상: Web Worker + off-main-thread packing
*/ 