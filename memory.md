# Capital Clash → 온라인 광고판 개발 진행 상황

## 📋 프로젝트 개요
- **기존**: 실제 돈으로 병력을 구매하고 영토를 확장하는 전략 게임
- **새로운 방향**: 투자 지분율에 따라 크기가 달라지는 온라인 광고판 시스템

### 핵심 기능
- 사용자가 투자한 금액에 비례하여 타일 크기 결정
- 타일에 사용자 이미지 표시 (관리자 승인 시스템)
- 타일 클릭 시 사용자 정보 표시
- 투자자별 프로필 정보 관리

## 🛠 기술 스택
- **Frontend**: Next.js 14 (App Router), React Three Fiber, TypeScript, Tailwind CSS
- **상태관리**: Zustand
- **3D 렌더링**: Three.js
- **라이브러리**: maxrects-packer (Treemap 배치)
- **Backend**: Supabase (계획)

## ✅ 완료된 단계

### 1단계: 투자자 정보 타입 확장 및 타일 위치 저장 ✅
**완료 일시**: 2024년 현재 세션

**작업 내용**:
- `src/store/continentStore.ts`의 `Investor` 인터페이스 확장
  ```typescript
  interface Investor {
    // 기존 필드들...
    imageStatus?: 'none' | 'pending' | 'approved' | 'rejected'
    tilePosition?: { x: number, y: number, size: number, continentId: string }
    profileInfo?: { description: string, website?: string, contact?: string }
    ratio?: number  // 🆕 사진 비율 (width/height)
  }
  ```

- 새로운 액션 함수 추가:
  - `updateInvestorPositions`: 타일 배치 완료 후 위치 정보 저장
  - `updateInvestorProfile`: 프로필 정보 업데이트
  - `updateImageStatus`: 이미지 승인 상태 관리

- 기존 투자자 생성 함수들에서 새 필드 초기화:
  - `addInvestor`
  - `generateTestData` 
  - `generate50TestData`

### 2단계: 타일 클릭 시 설정 패널 (테스트 가능한 버전) ✅
**완료 일시**: 2024년 현재 세션

**작업 내용**:

1. **TileSettingsPanel 컴포넌트 생성** (`src/components/TileSettingsPanel.tsx`)
   - 투자자 정보 표시 (투자금, 지분율, 색상, 위치)
   - 이미지 업로드 인터페이스
   - 프로필 정보 입력 폼 (소개글, 웹사이트, 연락처)
   - 테스트용 관리자 승인/거절 버튼

2. **ContinentMap 컴포넌트 수정** (`src/components/ContinentMap.tsx`)
   - 타일 클릭 이벤트 처리 연동
   - TileSettingsPanel 모달 표시/숨김 로직
   - 컴포넌트 간 prop 전달 체인 구성:
     ```
     ContinentMap → WorldScene → SingleContinent → TerritorySystem → TerritoryArea
     ```

3. **자동 위치 정보 업데이트**
   - `TerritorySystem`에서 타일 배치 완료 시 자동으로 `updateInvestorPositions` 호출
   - 무한 루프 방지를 위한 조건부 업데이트 로직 구현

4. **테스트 환경 구성**
   - `InvestmentPanel`에 "4명 테스트 데이터 생성" 버튼 추가
   - 개발 서버 정상 실행 확인

**해결된 이슈**:
- Maximum update depth exceeded 에러 (무한 루프) 해결
- TypeScript 타입 에러 모두 해결

### 3단계: 기존 알고리즘 분석 및 백업 시스템 정리 ✅
**완료 일시**: 2025년 1월 현재 세션

**작업 내용**:

1. **현재 활성화된 알고리즘 확인**
   - 정사방형 배치 시스템 (calculateSquareLayout) 활성화 상태
   - 하이브리드 방식: N×N 격자 + 나선형 배치
   - 투자자 수가 완전제곱수이고 지분이 동일할 때 N×N 격자 사용
   - 그 외 경우 나선형 배치 (중심거리 최적화, 15도 간격 탐색)

2. **백업 Voronoi 시스템 삭제**
   - `src/lib/territoryManager.ts` 파일 완전 삭제
   - `continentStore.ts`에서 `redistributeTerritories` 함수 제거
   - ContinentActions 인터페이스에서 관련 함수 제거
   - TypeScript 에러 없이 완료

### 4단계: Fixed-Ratio Treemap 알고리즘 구현 ✅
**완료 일시**: 2025년 1월 현재 세션

**작업 내용**:

1. **라이브러리 설치 및 알고리즘 구현**
   - `npm install maxrects-packer` 설치 완료
   - `src/lib/treemapAlgorithm.ts` 신규 생성
   - GPT o3 제공 Fixed-Ratio Treemap Pack 알고리즘 적용
   - PhotoSpec, PackedRect 인터페이스 정의
   - packFixedRatioTreemap 함수 구현
   - calculateTreemapLayout 어댑터 함수 생성

2. **기존 알고리즘 교체**
   - `calculateSquareLayout`에서 `calculateTreemapLayout` 호출로 변경
   - try-catch로 에러 처리 및 fallback 구현

3. **테스트 데이터 개선**
   - **4명 테스트 데이터**: 다양한 극단적 비율 (17:3, 1:1, 3:17, 29:13)
   - **50명 테스트 데이터**: 랜덤 지분율(0.1%~10%) + 다양한 비율 카테고리
     - 일반적 비율 (40%): 16:9, 4:3, 1:1 등
     - 와이드 비율 (20%): 21:9, 17:3, 8:3 등
     - 세로 비율 (20%): 9:21, 3:17, 3:8 등
     - 특이한 비율 (10%): 29:13, 19:8, 31:11 등
     - 극단적 비율 (10%): 10:1, 1:12, 50:7 등

4. **렌더링 시스템 수정**
   - TerritoryArea 컴포넌트를 정사방형에서 직사각형으로 변경
   - width, height 별도 처리
   - ContinentPiece 컴포넌트도 직사각형/정사방형 모두 지원하도록 개선

5. **UI 개선**
   - InvestmentPanel에 "🌳 50명 Treemap 테스트" 버튼 추가
   - generate50TestData 함수 연동

### 5단계: NaN 에러 해결 및 데이터 구조 통합 ✅
**완료 일시**: 2025년 1월 현재 세션

**작업 내용**:

1. **근본 원인 분석**
   - THREE.js NaN 에러의 원인: 데이터 구조 불일치
   - ContinentPiece는 `placement.size` 사용 (정사방형용)
   - TerritoryArea는 `placement.width, placement.height` 사용 (직사각형용)
   - Treemap 결과에는 `size`가 없어서 `undefined` × cellSize = NaN 발생

2. **데이터 구조 통합**
   - ContinentPiece 컴포넌트 수정하여 width/height와 size 모두 지원
   - 조건부 렌더링으로 Treemap과 기존 알고리즘 모두 호환
   - 안전장치 제거하고 근본 문제 해결

3. **컨테이너 크기 문제 해결**
   - 오버플로우 원인: containerW=100이 50명을 수용하기에 너무 작음
   - MaxRects가 50개 bin 생성 → 첫 번째 bin만 사용 → 49명 누락
   - containerW를 1000으로 증가하여 해결

### 6단계: 성능 최적화 및 동적 크기 계산 ✅
**완료 일시**: 2025년 1월 현재 세션

**작업 내용**:

1. **성능 최적화**
   - 200+ 디버깅 로그 제거 (50명 × 4개 로그)
   - 불필요한 객체 생성 및 중복 콘솔 출력 최소화
   - 핵심 로그 1개만 유지

2. **셀 기반 동적 크기 계산 시스템**
   ```typescript
   const cellW = 1           // 한 셀의 기본 크기 (1×1)
   const maxCells = 2500     // 허용할 최대 셀 개수 (50×50)
   
   // 극단적 비율 분석
   const maxRatio = Math.max(...ratios)  // 가장 가로가 긴 비율
   const minRatio = Math.min(...ratios)  // 가장 세로가 긴 비율
   
   // 안전한 컨테이너 크기 계산
   const maxWidthNeeded = Math.ceil(Math.sqrt(maxCells * maxRatio))
   const maxHeightNeeded = Math.ceil(Math.sqrt(maxCells / minRatio))
   const containerW = Math.max(50, maxWidthNeeded)
   const containerH = Math.max(50, maxHeightNeeded)
   ```

3. **동적 컨테이너 적용**
   - 고정 50×50 대신 비율에 따른 동적 크기 계산
   - 극단적 비율(17:3, 1:12 등)도 안전하게 수용
   - 최소 크기 보장 (50×50 이상)
   - 오버플로우 방지를 위한 안전 코드

## 🧪 현재 테스트 가능한 기능
1. **http://localhost:3000** 접속
2. 드롭다운에서 대륙 선택 (예: North America)
3. **"4명 테스트 데이터 생성"** 버튼 클릭 → 다양한 비율의 4개 직사각형 확인
4. **"🌳 50명 Treemap 테스트"** 버튼 클릭 → 50개 다양한 비율 직사각형 빈틈없이 배치
5. 생성된 타일 클릭
6. 설정 패널에서:
   - 이미지 업로드 
   - 프로필 정보 입력
   - 관리자 승인/거절 시뮬레이션

## 📋 다음 단계 (미완료)

### 7단계: 이미지 조건부 렌더링 시스템 🔄
**목표**: 승인된 이미지만 타일에 표시되도록 수정

**작업 필요사항**:
1. `TerritoryArea` 컴포넌트 수정 (`src/components/ContinentMap.tsx`)
   - 현재: 모든 타일에 `/test.jpg` 표시
   - 변경: `investor.imageStatus === 'approved'`이고 `investor.imageUrl`이 있을 때만 이미지 표시
   - 거절/대기중인 경우 기본 색상 타일만 표시

2. 이미지 렌더링 로직 수정:
   ```typescript
   // 현재 구조
   useEffect(() => {
     const loader = new THREE.TextureLoader()
     loader.load('/test.jpg', ...) // 모든 타일에 적용
   })
   
   // 변경 필요
   useEffect(() => {
     if (investor.imageStatus === 'approved' && investor.imageUrl) {
       const loader = new THREE.TextureLoader()
       loader.load(investor.imageUrl, ...)
     }
   }, [investor.imageStatus, investor.imageUrl])
   ```

### 8단계: 성능 최적화 완료 🔄
**목표**: 나머지 성능 병목 해결

**작업 필요사항**:
1. **텍스처 로딩 최적화**: 50개 개별 로딩 → 공통 텍스처 재사용
2. **애니메이션 최적화**: 50개 개별 useFrame → 통합 애니메이션 관리
3. **메모리 최적화**: 불필요한 geometry/material 정리

### 9단계: 프로필 정보 표시 기능 🔄
**목표**: 타일 클릭 시 프로필 정보를 표시하는 별도 모달 추가

**작업 필요사항**:
1. `ProfileViewModal` 컴포넌트 생성
   - 투자자 프로필 정보 표시 전용 모달
   - 이미지, 소개글, 웹사이트, 연락처 표시
   - 외부 링크 클릭 기능

2. 타일 클릭 동작 개선:
   - 현재: 설정 패널만 열림
   - 변경: 두 가지 모드 구분
     - 일반 방문자: ProfileViewModal 열림
     - 투자자 본인: TileSettingsPanel 열림

3. 권한 관리 시스템 기초:
   - 임시로 투자자 ID 기반 본인 확인
   - 추후 실제 인증 시스템 연동 준비

## 🗂 주요 파일 구조
```
src/
├── lib/
│   └── treemapAlgorithm.ts           # 🆕 Fixed-Ratio Treemap 알고리즘 (4단계)
├── store/
│   └── continentStore.ts             # ✅ 확장 완료 (1단계)
├── components/
│   ├── ContinentMap.tsx              # ✅ Treemap 연동 완료 (4-6단계)
│   ├── TileSettingsPanel.tsx         # ✅ 신규 생성 완료 (2단계)
│   ├── InvestmentPanel.tsx           # ✅ 테스트 버튼 추가 완료 (4단계)
│   └── ProfileViewModal.tsx          # 🔄 9단계에서 생성 예정
└── app/
    └── page.tsx                      # 수정 불필요
```

## 🚀 알고리즘 요약
### **Fixed-Ratio Treemap Pack 알고리즘**
1. **입력**: 지분율(0.01%~10%) + 사진 비율(다양한 width/height 비율)
2. **크기 계산**: `면적 = 지분 × 총면적`, `가로 = √(면적 × 비율)`, `세로 = 가로 ÷ 비율`
3. **MaxRects 패킹**: 계산된 직사각형들을 빈틈없이 테트리스처럼 배치
4. **3D 변환**: 픽셀 크기 → 3D 공간 크기 (×0.4 스케일링)

### **동적 컨테이너 크기**
- 극단적 비율에 대응하는 안전한 크기 자동 계산
- 기본 2,500셀(50×50) 제한 내에서 최대한 활용
- 오버플로우 방지 및 모든 투자자 수용 보장

## 💡 개발 시 주의사항
1. **무한 루프 방지**: 스토어 업데이트 시 조건부 체크 필수
2. **타입 안전성**: 모든 새로운 액션에 TypeScript 타입 정의
3. **성능**: Three.js 텍스처 로딩 최적화 고려 (7-8단계 예정)
4. **사용자 경험**: 로딩 상태 및 에러 처리 추가
5. **데이터 구조**: width/height(Treemap)와 size(기존) 모두 지원하는 통합 구조

## 🚀 재개 시 우선순위
1. **7단계 완료**: 이미지 조건부 렌더링 (30분 예상)
2. **8단계 완료**: 성능 최적화 완료 (1시간 예상)
3. **9단계 완료**: 프로필 정보 표시 모달 (1시간 예상)
4. **코드 정리**: 불필요한 콘솔 로그 제거
5. **문서화**: README 업데이트

## 📞 현재 상태 확인 명령어
```bash
cd /c%3A/Users/Jaeho/Desktop/Projects/Playground/capital_clash_fe
npm run dev
npm run type-check
```

---
**마지막 업데이트**: 2025년 1월 현재 세션 - Fixed-Ratio Treemap 알고리즘 완전 구현 완료
### 7단계: 셀 기반 TreeMap 알고리즘 재구현 ✅
**완료 일시**: 2025년 1월 현재 세션

**문제점 분석**:
- 기존: 픽셀 기반 계산 → 이미지가 타일 크기에 맞춰서 확대/축소
- 원인: `면적 = 지분 × containerW²` (픽셀 기반) → 이미지 스케일링 발생

**사용자 요구사항**:
1. 2500개 셀 (50×50) 기준으로 계산
2. 지분율 50% + 비율 4:3 = 1250개 셀 → 40×30 = 1200개 셀 사용
3. 이미지는 고정 크기, 타일 크기 무관

**해결 방안**:
1. **새로운 셀 기반 계산 로직**:
   ```typescript
   // 기존 (픽셀 기반)
   const area = p.share * containerW * containerW;
   const width = Math.sqrt(area * p.ratio);
   
   // 새로운 (셀 기반)
   const availableCells = Math.round(share * 2500);
   const height = Math.floor(Math.sqrt(availableCells / ratio));
   const width = Math.floor(ratio * height);
   ```

2. **함수명 변경**:
   - `packFixedRatioTreemap` → `packCellBasedTreemap`
   - 매개변수: `maxCells = 2500`, `containerSize = 50`

3. **상세 로깅 추가**:
   - 각 투자자별 셀 사용량 표시
   - 목표 대비 실제 효율성 계산
   - 총 셀 사용률 모니터링

**테스트 상태**:
- TypeScript 타입 체크 통과 ✅
- 개발 서버 실행 중 (백그라운드)
- 브라우저 테스트 필요

### 8단계: Billboard-Style 배치 알고리즘 구현 ✅
**완료 일시**: 2025년 1월 현재 세션

**구현 내용**:
1. **새로운 알고리즘 특징**:
   - 왼쪽 위부터 오른쪽 아래로 순회 배치
   - 정사방형만 사용 (완전제곱수 기반 크기)
   - 영역 간 빈공간 없음 (붙어서 배치)
   - 우하단 빈공간만 허용

2. **핵심 로직**:
   ```typescript
   // 지분 → 완전제곱수 크기 계산
   let bestSize = 1;
   for (let size = 1; size * size <= availableCells; size++) {
     bestSize = size;
   }
   
   // 왼쪽 위부터 순회하면서 빈 공간 찾기
   for (let y = 0; y < currentBoundaryH; y++) {
     for (let x = 0; x < currentBoundaryW; x++) {
       if (canPlaceSquareAt(placed, x, y, size, ...)) {
         // 배치 실행
       }
     }
   }
   ```

3. **경계 확장 규칙**:
   - 첫 배치에서만 50×50 경계 확장 허용
   - 이후 배치는 확장된 경계 내에서만 진행
   - 예측 가능한 최대 크기 보장

4. **코드 변경사항**:
   - `src/lib/treemapAlgorithm.ts`: `calculateBillboardLayout` 함수 추가
   - `src/components/ContinentMap.tsx`: Billboard 알고리즘으로 교체
   - `src/components/InvestmentPanel.tsx`: 버튼 텍스트 "🏢 50명 Billboard 테스트"로 변경

**테스트 상태**:
- TypeScript 타입 체크 통과 ✅
- 브라우저 테스트 필요

### 9단계: Billboard 배치 알고리즘 점수 시스템 개선 ✅
**완료 일시**: 2025년 1월 현재 세션

**문제점 분석**:
- 지분율 내림차순 정렬은 정상
- 하지만 왼쪽 위 순회 방식으로 인해 작은 사각형들이 큰 사각형들 사이에 끼어듦
- 결과: 큰 사각형들끼리 붙지 못하는 비자연스러운 배치

**해결 방안**:
1. **점수 기반 최적 위치 선택**:
   ```typescript
   // 기존: 첫 번째로 들어가는 자리에 배치
   for (let y = 0; y <= currentBoundaryH - square.size; y++) {
     for (let x = 0; x <= currentBoundaryW - square.size; x++) {
       if (canPlaceSquareAt(...)) { 배치; break; }
     }
   }
   
   // 개선: 모든 자리를 검사해서 최고 점수 위치에 배치
   for (모든 위치) {
     if (배치가능) {
       score = calculatePlacementScore(...);
       if (score > bestScore) { bestPosition = 위치; }
     }
   }
   ```

2. **스마트 점수 계산 시스템**:
   - **기본 점수**: 왼쪽 위 우선 (100-x, 100-y)
   - **인접성 보너스**: 큰 사각형과 변이 맞닿으면 `existing.size × 2` 점수
   - **첫 배치 보너스**: (0,0) 위치에 +1000 점수  
   - **두 번째 배치 보너스**: 첫 번째 바로 옆에 +500 점수

3. **인접성 감지 로직**:
   - 변 접촉: 최고 보너스
   - 모서리 접촉: 중간 보너스
   - 큰 사각형(70% 이상 크기)과의 인접성만 계산

**기대 효과**:
- 큰 사각형들끼리 서로 붙어서 배치
- 작은 사각형들은 큰 사각형들의 배치가 끝난 후 빈 공간에 자연스럽게 배치
- 더욱 광고판다운 깔끔한 레이아웃

### 10단계: 진짜 행 우선 순회 방식 구현 ✅
**완료 일시**: 2025년 1월 현재 세션

**문제점 파악**:
- 이전 구현: "모든 위치 검사 후 점수 기반 최적 배치" (이건 순회가 아님)
- 사용자 의도: "행 우선 스캔" (텍스트 읽는 방식과 동일)

**올바른 순회 방식**:
```typescript
// 행 우선 순회: 위에서 아래로, 왼쪽에서 오른쪽으로
for (let y = 0; y <= currentBoundaryH - square.size && !foundPosition; y++) {
  for (let x = 0; x <= currentBoundaryW - square.size && !foundPosition; x++) {
    if (canPlaceSquareAt(...) && 경계체크통과) {
      배치하고 break;
    }
  }
}
```

**핵심 로직**:
1. **첫 번째**: (0,0)부터 스캔해서 첫 빈자리에 배치
2. **두 번째**: 다시 (0,0)부터 스캔하되, 첫 번째 사각형 피해서 배치
3. **경계 확장**: 첫 배치에서만 허용, 이후는 확장된 경계 내에서만
4. **행 우선**: 왼쪽부터 채우고, 한 행이 다 차면 다음 행으로

**예시 시나리오**:
```
1. (0,0)에 35×35 배치 → 경계 확장 없음 (50×50 내)
2. (35,0)부터 스캔 → 25×25 배치 시 50 초과 → 경계를 55×50으로 확장
3. 다음 사각형은 (0,1)부터 스캔 → 기존 사각형들 피해서 배치
```

**제거한 복잡한 로직**:
- 점수 계산 시스템 (calculatePlacementScore)
- 인접성 보너스 계산 (calculateAdjacencyBonus)
- 최적 위치 탐색 알고리즘

**결과**: 진짜 "순회" 방식으로 자연스러운 왼쪽→오른쪽 배치

**다음 작업**: 11단계 - 이미지 조건부 렌더링 시스템
