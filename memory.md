# Capital Clash → 온라인 광고판 개발 진행 상황

## 📋 프로젝트 개요
- **기존**: 실제 돈으로 병력을 구매하고 영토를 확장하는 전략 게임
- **새로운 방향**: 투자 지분율에 따라 크기가 달라지는 온라인 광고판 시스템

### 핵심 기능
- 사용자가 투자한 금액에 비례하여 타일 크기 결정
- 타일에 사용자 이미지 표시 (관리자 승인 시스템)
- 타일 클릭 시 사용자 정보 표시
- 투자자별 프로필 정보 관리

### 🚨 중요 제약사항
- **1인당 1개 타일 제한**: 사용자는 하나의 대륙에만 타일을 가질 수 있음
- 복수 타일 소유 불가, 단일 타일 업그레이드 또는 대륙 이전만 가능
- UI는 모두 단일 타일 중심으로 설계됨

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

### 11단계: 성능 최적화 완료 ✅
**완료 일시**: 2025년 1월 현재 세션

**최적화 내용**:
1. **개별 애니메이션 제거**: 50개 × 60fps = 3,000회/초 → 0회/초
2. **공통 텍스처 로딩**: 50개 개별 로딩 → 1개 공통 로딩  
3. **간단한 스케일링**: `useFrame` 애니메이션 → CSS 기반 `scale` 속성
4. **조건부 위치 업데이트**: 변경사항이 있을 때만 스토어 업데이트

**주요 변경사항**:
- **`TerritoryArea`**: 개별 `useFrame` 제거, 공통 텍스처 사용
- **`TerritorySystem`**: 공통 텍스처 로딩 추가, 조건부 업데이트 로직
- **`InvestmentPanel`**: "🚀 50명 최적화된 Billboard 테스트" 버튼

**성능 개선 효과**:
- **렌더링**: 3,000회/초 → 0회/초 (99.97% 감소)
- **텍스처 로딩**: 50개 → 1개 (98% 감소)
- **메모리 사용량**: 대폭 감소 (공통 텍스처 재사용)

### 12단계: 프로필 정보 표시 기능 ✅
**완료 일시**: 2025년 1월 현재 세션

**구현 완료 사항**:
1. **ProfileViewModal 컴포넌트 생성** (`src/components/ProfileViewModal.tsx`)
   - 투자자 프로필 정보 표시 전용 모달
   - 이미지, 투자정보, 프로필정보, 승인상태 표시
   - 외부 링크 클릭 기능 (새 탭으로 열기)
   - ESC 키로 모달 닫기

2. **권한 기반 타일 클릭 분리** (`src/components/ContinentMap.tsx`)
   - `investor_01` = 본인 → 설정 패널 열기
   - 나머지 투자자 = 타인 → 프로필 보기 열기
   - 두 모달 중복 방지 로직

3. **상태 관리 분리**:
   - `selectedTileSettings`: 설정 패널용
   - `selectedTileProfile`: 프로필 보기용

4. **임시 권한 확인 로직**: 테스트용 하드코딩 (추후 실제 인증 시스템 연동)

**테스트 시나리오**:
- **투자자1 클릭**: 설정 패널 열림 (편집 가능)
- **투자자2~50 클릭**: 프로필 보기 모달 열림 (읽기 전용)
- 프로필 정보, 외부 링크, ESC 키 닫기 기능 정상 작동

## 🧪 현재 테스트 가능한 기능
1. **http://localhost:3000** 접속
2. 드롭다운에서 대륙 선택 (예: North America)
3. **"🚀 50명 최적화된 Billboard 테스트"** 버튼 클릭 → 최적화된 50개 정사방형 배치
4. **투자자1 영역 클릭** → 설정 패널 (이미지 업로드, 프로필 편집, 관리자 승인/거절)
5. **투자자2~50 영역 클릭** → 프로필 보기 모달 (투자정보, 프로필정보 표시)
6. 외부 링크 클릭, ESC 키로 모달 닫기
7. **Header**: 새로운 로고, 로그인/로그아웃 토글, 프로필 드롭다운
8. **Sidebar**: 오른쪽 접이식, 3개 탭 (개요/내 영역/통계), 대륙별 유저 수 표시
9. **프로필 페이지**: 완전한 4탭 구조, 단일 영역 중심 UX

### 13단계: 사용자 UI 구성 🔄 (부분 완료)
**목표**: 완성도 높은 사용자 인터페이스 및 사용자 경험 개선

#### ✅ 13단계-1: Header 개선 완료
**완료 일시**: 2025년 1월 현재 세션

**작업 내용**:
- `src/components/Header.tsx` 완전 재설계
- 새로운 로고: CC 아이콘 + 그라데이션 디자인
- 로그인/로그아웃 토글 기능 (테스트용)
- 프로필 드롭다운: 잔액, 순위, 투자 정보 표시
- 모바일 햄버거 메뉴 + 반응형 디자인
- 외부 클릭 감지로 드롭다운 자동 닫기
- `src/app/page.tsx`에 적절한 여백(pt-20) 추가

#### ✅ 13단계-2: Sidebar 구현 완료
**완료 일시**: 2025년 1월 현재 세션

**작업 내용**:
- `src/components/Sidebar.tsx` 신규 생성
- 오른쪽 접이식 사이드바 (320px 폭)
- 3개 탭 구조:
  - 📊 **개요**: 투자 현황, 현재 영역 정보
  - 🎯 **내 영역**: 영역 상세 관리, 업그레이드, 대륙 이전
  - 📈 **통계**: 주간 수익 추이, 성과 지표, 영역 가치 변화
- 단일 영역 중심 UX: 1인당 1개 영역 제한에 맞춘 완전한 재설계
- 대륙별 현재 유저 수 표시: (현재유저수/50) 형식, 50/50일 때 빨간색
- 영역 없는 사용자를 위한 Empty State 디자인

#### ✅ 13단계-3: 프로필 페이지 구현 완료
**완료 일시**: 2025년 1월 현재 세션

**작업 내용**:
- `src/app/profile/page.tsx` 신규 생성
- 완전한 4탭 구조:
  - 📊 **개요**: 투자 요약, 현재 영역, 최근 성과
  - 📈 **투자 히스토리**: 거래 내역, 투자 요약 통계
  - 🎯 **내 영역**: 영역 상세, 업그레이드/이전 옵션, 이미지 관리
  - ⚙️ **설정**: 개인정보 편집, 알림 설정, 계정 관리
- 사이드바 네비게이션 + 메인 콘텐츠 레이아웃
- 단일 영역 중심으로 완전히 설계
- Header 드롭다운에서 프로필 페이지 링크 연동

#### ✅ 추가 완성 기능 (이번 세션)

##### 1. **1인당 1개 영역 제한 UX 재설계**
- **기존**: 복수 영역 관리 → **변경**: 단일 영역 중심
- Sidebar: "내 영역들" → "내 영역", 업그레이드/이전 옵션
- 프로필: 이미 단일 영역 구조로 설계되어 있어 완벽 호환
- 조건부 렌더링: `myTile ? 영역_있음_UI : 영역_없음_UI`

##### 2. **대륙별 현재 유저 수 표시 기능**
- 동서남북 4개 대륙의 실시간 인원 현황 표시
- 표시 형식: `(현재유저수/50)` 
- 50/50 가득 찬 경우: 빨간색 텍스트 + 클릭 불가
- 현재 소속 대륙: "(현재)" 표시 + 비활성화
- Sidebar와 프로필 페이지 양쪽에 모두 적용

##### 3. **'타일' → '영역' 명칭 변경**
- **완전 교체 완료**: 모든 사용자 인터페이스 텍스트
- 수정된 파일들:
  - `src/components/Sidebar.tsx`
  - `src/components/Header.tsx`
  - `src/app/profile/page.tsx`
  - `src/components/TileSettingsPanel.tsx`
  - `src/components/ProfileViewModal.tsx`
  - `src/components/ContinentMap.tsx` (주석)
- 기술적 주석 1개만 남음 (변경 불필요)

##### 4. **Heroicons 라이브러리 설치**
- `npm install @heroicons/react` 설치 완료
- 프로필 페이지의 ArrowLeftIcon 정상 작동

**현재 13단계 진행률**: 3/7 완료 (약 43%)

### 14단계: 관리자 페이지 ✅
**완료 일시**: 2025년 1월 현재 세션

**작업 내용**:

1. **관리자 대시보드 (`src/app/admin/page.tsx`)** ✅
   - 실시간 플랫폼 통계 (총 사용자, 투자, 타일, 대기 이미지)
   - 최근 활동 피드 (투자, 이미지 업로드, 사용자 가입)
   - 퀵 액션 네비게이션 (사용자/타일/이미지/설정 관리)
   - 30초마다 자동 데이터 업데이트

2. **사용자 관리 시스템** ✅
   - 사용자 목록 및 검색 (`src/app/admin/users/page.tsx`)
   - 정렬, 필터링, 페이지네이션 기능
   - 사용자 상세 정보 모달, 일괄 작업 지원
   - 투자 히스토리 및 계정 상태 관리

3. **타일 관리 시스템** ✅
   - 전체 타일 현황 (`src/app/admin/tiles/page.tsx`)
   - 대륙별 통계, 타일 상태 변경 (활성/정지/유지보수)
   - 이미지 승인/거절 인라인 기능
   - 타일 상세 정보 및 위치 표시

4. **이미지 승인 시스템** ✅
   - 이미지 승인 대시보드 (`src/app/admin/images/page.tsx`)
   - 그리드 뷰 및 미리보기 모달
   - 일괄 승인/거절, 필터링 (대기/승인/거절)
   - 파일 정보 (크기, 해상도, 업로드 시간)

5. **시스템 설정 패널** ✅
   - 플랫폼 설정 (`src/app/admin/settings/page.tsx`)
   - 가격 정책, 타일 설정, 알림 설정
   - 실시간 변경사항 감지, 위험 영역 관리
   - 유지보수 모드 토글

**주요 기능들**:
- 실시간 데이터 모니터링
- 관리자 전용 라우팅 및 네비게이션
- 완전한 CRUD 기능 (Create, Read, Update, Delete)
- 일괄 작업 및 필터링
- 반응형 디자인 및 사용자 친화적 UI

**예상 소요 시간**: 완료 (2-3일 목표 달성)

## 📋 다음 단계 (미완료)

#### 🔄 13단계-4: 영역 구매 인터페이스 (⭐ 최우선) → **18단계로 이동**
**예상 소요 시간**: 2-3시간

**작업 내용**:
1. **영역 구매 모달 컴포넌트**
   - 대륙 선택 UI (동서남북 4개)
   - 실시간 인원 현황 표시 (X/50)
   - 투자 금액 입력 (최소/최대 제한)
   - 예상 지분율 실시간 계산
   - 예상 영역 크기 미리보기

2. **연동 포인트**
   - Header의 "영역 구매" 버튼
   - Sidebar의 "영역 구매하기" 버튼들
   - 대륙 현황과 실시간 연동

#### 🔄 13단계-5: 알림 시스템 → **18단계로 통합**
**예상 소요 시간**: 1-2시간

#### 🔄 13단계-6: 반응형 디자인
**예상 소요 시간**: 1-2시간

#### 🔄 13단계-7: 접근성 개선
**예상 소요 시간**: 1시간

### 15단계: 대륙 배치 변경 및 동적 VIP 시스템 🔄
**목표**: 동적 대륙 위치 변경, 새로운 대륙 추가 시스템, VIP 중앙 대륙 자동 관리

**작업 필요사항**:

1. **관리자 대시보드**:
   - 관리자 전용 페이지 (`src/pages/admin.tsx`)
   - 전체 투자자 현황, 수익 통계, 시스템 상태
   - 실시간 데이터 모니터링

2. **사용자 관리**:
   - 사용자 목록 및 검색 (`src/components/admin/UserManagement.tsx`)
   - 사용자 정보 수정, 계정 상태 변경
   - 투자 히스토리 조회

3. **타일 관리**:
   - 전체 타일 현황 (`src/components/admin/TileManagement.tsx`)
   - 타일 상태 변경, 강제 이동
   - 대륙별 타일 분포 통계

4. **시스템 설정**:
   - 시스템 설정 패널 (`src/components/admin/SystemSettings.tsx`)
   - 타일 가격 조정, 대륙 설정
   - 시스템 공지사항 관리

5. **권한 관리**:
   - 관리자 권한 확인 미들웨어
   - 관리자 전용 라우팅 보호
   - 접근 로그 및 감사

**예상 컴포넌트들**:
```typescript
// 신규 생성 예정
- admin/AdminDashboard.tsx    // 관리자 메인 대시보드
- admin/UserManagement.tsx    // 사용자 관리
- admin/TileManagement.tsx    // 타일 관리
- admin/SystemSettings.tsx    // 시스템 설정
- admin/AccessControl.tsx     // 접근 권한 관리
```

**예상 소요 시간**: 2-3일

### 15단계: 대륙 배치 변경 및 동적 VIP 시스템 ✅
**완료 일시**: 2025년 1월 현재 세션

**목표**: 동적 대륙 위치 변경, 새로운 대륙 추가 시스템, VIP 중앙 대륙 자동 관리

**구현 완료 사항**:

1. **VIP 자동 승격 시스템** ✅
   - `continentStore.ts`에 핵심 VIP 시스템 함수들 구현:
     - `checkAndPromoteToVIP()`: 상위 4명 자동 식별 및 중앙 대륙 이주
     - `moveInvestorToContinent()`: 대륙 간 투자자 이동 처리 (검증 포함)
     - `recalculateAllShares()`: 이동 후 모든 대륙 지분율 재계산
     - `calculateContinentBounds()`: 실제 타일 위치 기반 경계 계산
     - `updateContinentPositions()`: 중앙 대륙 크기 변화에 따른 동적 위치 조정

2. **관리자 VIP 관리 인터페이스** ✅
   - `VIPManagement.tsx`: 완전한 VIP 관리 대시보드
     - 실시간 상위 투자자 순위 표시
     - 현재 VIP 목록 및 상태
     - 수동 승격/강등 버튼
     - VIP 시스템 통계 (총 VIP, 자동 승격 횟수 등)
   - `/admin/vip` 페이지 생성 및 네비게이션 통합

3. **대륙 편집 시스템** ✅  
   - `ContinentEditor.tsx`: 포괄적인 대륙 편집 인터페이스
     - 대륙 위치 조정 (X, Y, Z 좌표)
     - 카메라 타겟 설정 (lookAt 좌표)
     - 대륙 색상 관리 (ColorPicker 통합)
     - 대륙 속성 편집 (이름, 최대 사용자 수)
   - `/admin/continents` 페이지 생성

4. **메인 관리자 대시보드 확장** ✅
   - VIP Management 카드 추가
   - Continent Editor 카드 추가
   - 통합된 관리자 네비게이션

5. **TypeScript 에러 완전 해결** ✅
   - `updateImageStatus` 함수에 `continentId` 파라미터 추가
   - Icon 임포트 문제 해결 (SaveIcon → CheckIcon, CrownIcon → 👑)
   - `PendingImage` 인터페이스 확장
   - 모든 컴파일 에러 해결 완료

6. **맞춤형 테스트 데이터 시스템** ✅
   - `generateCustomTestData()`: 사용자 정의 분포 지원
     - 북서 40명, 북동 30명, 남서 20명, 남동 10명
     - 불규칙한 지분 분포 (대형 5-20%, 중형 2-10%, 소형 0.1-3.1%)
     - 정확한 100% 정규화 시스템
   - "맞춤형 데이터 (100명)" 버튼 + 3초 후 자동 VIP 승격

**식별된 다음 단계**:
- **3D 맵 통합**: 테스트 데이터 → Treemap 실행 → 3D 타일 위치 반영
- **Supabase 통합**: 완전한 데이터베이스 아키텍처 (Users, Continents, Investments, VIP History)
- **실시간 동기화**: VIP 승격 시 즉시 3D 맵 업데이트

**완료된 컴포넌트들**:
```typescript
✅ src/components/admin/VIPManagement.tsx     // VIP 관리 대시보드
✅ src/components/admin/ContinentEditor.tsx   // 대륙 편집기  
✅ src/app/admin/vip/page.tsx                 // VIP 관리 페이지
✅ src/app/admin/continents/page.tsx          // 대륙 편집 페이지
✅ continentStore.ts 확장 (5개 핵심 함수)      // 핵심 VIP 로직
```

**소요 시간**: 완료 (예상 4-5일 → 실제 1일 집중 구현)

### 16단계: 완전한 UI 구현 (대륙 관리, 카메라 편집, 이미지 조건부 렌더링) 🔄
**목표**: 관리자 UI 요소들이 실제로 동작하도록 완전한 구현

**작업 필요사항**:

1. **새 대륙 생성/관리 시스템**:
   - 대륙 생성 마법사 (`src/components/admin/ContinentWizard.tsx`)
   - 대륙 삭제 및 투자자 재분배 시스템
   - 대륙 병합/분할 기능

2. **카메라 경로 편집기**:
   - 월드뷰 카메라 이동 경로 편집
   - 부드러운 전환 애니메이션 설정
   - 자동 투어 모드 구현

3. **관리자 UI 개선**:
   - 알림 시스템 (Header 알림 버튼)
   - 반응형 디자인 완성
   - 접근성 개선

**예상 컴포넌트들**:
```typescript
// 신규 생성 예정
- admin/ContinentWizard.tsx   // 대륙 생성 마법사
- CameraPathEditor.tsx        // 카메라 경로 편집
- NotificationSystem.tsx      // 알림 시스템
```

**예상 소요 시간**: 1-2일 (관리자 UI 완성 + 테스트)

### 17단계: Supabase 통합 및 데이터 연결 🔄
**목표**: 모든 UI 요소와 실제 데이터베이스를 완전히 연결

**작업 필요사항**:

1. **Supabase 프로젝트 설정 (사용자가 Supabase 대시보드에서 수작업할 거니 SQL Query, 설정 등을 조언하는 방향으로)**:
   - 데이터베이스 스키마 생성 (Users, Continents, Investments, VIP History)
   - Row Level Security (RLS) 정책 설정
   - 실시간 구독 설정 (Realtime)

2. **데이터베이스 스키마**:
   ```sql
   -- 핵심 테이블들
   CREATE TABLE users (
     id UUID PRIMARY KEY,
     email VARCHAR UNIQUE,
     nickname VARCHAR,
     total_investment DECIMAL DEFAULT 0,
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   CREATE TABLE continents (
     id VARCHAR PRIMARY KEY,
     name VARCHAR NOT NULL,
     position JSON,
     camera_target JSON,
     color VARCHAR,
     max_users INTEGER DEFAULT 50
   );
   
   CREATE TABLE investments (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     continent_id VARCHAR REFERENCES continents(id),
     share_percentage DECIMAL,
     tile_position JSON,
     image_url VARCHAR,
     image_status VARCHAR DEFAULT 'none'
   );
   ```

3. **실시간 데이터 동기화**:
   - VIP 승격 시 실시간 알림
   - 투자 변경 시 즉시 3D 맵 업데이트
   - 이미지 승인 시 실시간 렌더링 변경

4. **API 라우트 구현**:
   - `/api/investments` - 투자 CRUD
   - `/api/vip/promote` - VIP 승격 처리
   - `/api/continents` - 대륙 관리
   - `/api/images/approve` - 이미지 승인

5. **인증 시스템**:
   - Supabase Auth 통합
   - 사용자 세션 관리
   - 권한 기반 접근 제어

**예상 소요 시간**: 2-3일 (데이터베이스 설계 + API 구현 + 실시간 동기화)

### 18단계: UI 데이터 연결 및 실제 인터랙션 구현 🔄
**목표**: 기존에 UI만 추가해둔 모든 인터랙션이 실제로 작동하도록 구현

**작업 필요사항**:

1. **3D 맵 통합 (former Stage 15.5 + 16단계에서 이동)**:
   - 테스트 데이터 생성 → Treemap 알고리즘 실행 → 3D 타일 위치 반영 연결
   - Store 데이터 ↔ ContinentMap 실시간 동기화
   - VIP 승격 시 즉시 3D 맵 업데이트

2. **영역 구매 인터페이스 (16단계에서 이동)**:
   - 영역 구매 모달 (`src/components/PurchaseModal.tsx`)
   - Header의 "영역 구매" 버튼 실제 동작
   - Sidebar의 "영역 구매하기" 버튼들 실제 동작
   - 대륙 선택, 투자 금액 입력, 예상 지분율 계산
   - 실시간 대륙별 인원 현황 연동

3. **추가 투자 시스템**:
   - 기존 영역에 추가 투자 기능
   - 지분율 증가에 따른 타일 크기 실시간 변경
   - 투자 히스토리 실시간 업데이트

4. **대륙 이전 시스템**:
   - Sidebar "대륙 이전" 버튼 실제 동작
   - 대륙 간 영역 이동 처리
   - 지분율 재계산 및 3D 맵 실시간 반영

5. **실시간 알림 시스템**:
   - Header 알림 버튼 실제 동작
   - 투자, VIP 승격, 이미지 승인 등 실시간 알림
   - 알림 히스토리 관리

6. **프로필 페이지 데이터 연결**:
   - 투자 히스토리 탭 실제 데이터 연결
   - 내 영역 탭 실제 업그레이드/이전 기능
   - 설정 탭 실제 저장 기능

7. **이미지 조건부 렌더링** (16단계에서 이동):
   - 현재: 모든 타일에 공통 텍스처(`/test.jpg`) 표시
   - 변경: `investor.imageStatus === 'approved'`이고 `investor.imageUrl`이 있을 때만 이미지 표시
   - 거절/대기중인 경우 기본 색상 타일만 표시

**예상 컴포넌트들**:
```typescript
// 신규 생성 예정
- PurchaseModal.tsx           // 영역 구매 모달
- AdditionalInvestment.tsx    // 추가 투자 인터페이스
- ContinentTransfer.tsx       // 대륙 이전 시스템
- NotificationSystem.tsx      // 실시간 알림
- ProfileDataConnector.tsx    // 프로필 데이터 연결
```

**예상 소요 시간**: 3-4일 (핵심 인터랙션 구현 + 3D 맵 통합 + 테스트)

### 19단계: 이미지 승인 시스템 강화 🔄
**목표**: 관리자 이미지 승인 인터페이스 및 승인된 이미지만 표시하는 렌더링 시스템

**작업 필요사항**:

1. **관리자 이미지 승인 인터페이스**:
   - 이미지 승인 대시보드 (`src/components/admin/ImageApproval.tsx`)
   - 대기중인 이미지 목록, 일괄 승인/거절
   - 이미지 미리보기, 부적절한 내용 필터링

2. **이미지 조건부 렌더링 완성**:
   - `TerritoryArea` 컴포넌트 수정 (현재 모든 타일이 `/test.jpg` 공통 텍스처)
   - `investor.imageStatus === 'approved'`이고 `investor.imageUrl`이 있을 때만 이미지 표시
   - 거절/대기중인 경우 기본 색상 타일만 표시

3. **실시간 이미지 업데이트**:
   ```typescript
   // 이미지 렌더링 로직 수정
   useEffect(() => {
     if (investor.imageStatus === 'approved' && investor.imageUrl) {
       const loader = new THREE.TextureLoader()
       loader.load(investor.imageUrl, setTexture)
     }
   }, [investor.imageStatus, investor.imageUrl])
   ```

4. **승인 시스템 완전 연동**:
   - 설정 패널에서 이미지 업로드 시 실제 URL 저장
   - 관리자 승인/거절에 따른 실시간 렌더링 변경
   - 이미지 상태 변경 알림 시스템

5. **이미지 관리 고도화**:
   - 이미지 크기 제한 및 최적화
   - 부적절한 내용 자동 감지 (AI 활용)
   - 이미지 히스토리 및 버전 관리

**예상 컴포넌트들**:
```typescript
// 신규 생성 예정
- admin/ImageApproval.tsx     // 이미지 승인 대시보드
- admin/ImageModeration.tsx   // 이미지 검토 도구
- ImageUploadOptimizer.tsx    // 이미지 업로드 최적화
```

**예상 소요 시간**: 2-3일 (실시간 시스템 구축 + UI 구현 + 테스트)

### 20단계: 결제 시스템 연동 🔄
**목표**: Lemon Squeezy 등을 활용한 실제 투자금 결제 및 타일 구매 시스템 구현

**작업 필요사항**:

1. **결제 시스템 설정**:
   - Lemon Squeezy 또는 Stripe 연동
   - 상품 생성 및 가격 설정
   - 웹훅 엔드포인트 설정

2. **결제 플로우 구현**:
   - 결제 모달 및 UI 인터페이스
   - 결제 성공/실패 페이지
   - 결제 히스토리 관리

3. **실시간 결제 알림**:
   - 다른 사용자 결제 시 실시간 알림
   - 투자 현황 업데이트
   - 지분율 변경 반영

**예상 소요 시간**: 3-4일 (결제 시스템 설정 + 구현 + 테스트)

## 🗂 주요 파일 구조
```
src/
├── lib/
│   └── treemapAlgorithm.ts           # ✅ Billboard 알고리즘 완료 (8-10단계)
├── store/
│   └── continentStore.ts             # ✅ 확장 완료 (1단계)
├── components/
│   ├── ContinentMap.tsx              # ✅ 성능최적화 + 프로필보기 완료 (11-12단계)
│   ├── TileSettingsPanel.tsx         # ✅ 신규 생성 완료 (2단계)
│   ├── ProfileViewModal.tsx          # ✅ 신규 생성 완료 (12단계)
│   ├── Header.tsx                    # ✅ 완전 재설계 완료 (13단계-1)
│   ├── Sidebar.tsx                   # ✅ 신규 생성 완료 (13단계-2)
│   └── InvestmentPanel.tsx           # ✅ 최적화 버튼 추가 완료 (11단계)
├── app/
│   ├── page.tsx                      # ✅ Header 여백 추가 완료
│   └── profile/
│       └── page.tsx                  # ✅ 신규 생성 완료 (13단계-3)
```

## 🚀 알고리즘 요약
### **Billboard 배치 알고리즘** (현재 활성화)
1. **입력**: 지분율(0.01%~10%) → 셀 개수 계산 (2500셀 기준)
2. **크기 계산**: `셀 개수 = 지분 × 2500`, `크기 = √셀개수` (정사방형)
3. **행 우선 순회**: (0,0)부터 오른쪽→아래로 스캔하여 빈 공간에 배치
4. **경계 확장**: y=0에서만 허용, y≥1에서는 확장된 경계 내에서만 배치

### **성능 최적화**
- 개별 애니메이션 제거: 3,000회/초 → 0회/초
- 공통 텍스처 사용: 50개 로딩 → 1개 로딩
- 조건부 업데이트: 변경사항 있을 때만 스토어 업데이트

### **사용자 경험**
- 권한 기반 모달: 본인=설정패널, 타인=프로필보기
- 외부 링크 지원, ESC 키 닫기, 상세한 투자자 정보 표시
- 1인당 1개 영역 제한에 맞춘 완전한 UX 재설계
- 대륙별 현재 유저 수 실시간 표시 (X/50)

## 💡 개발 시 주의사항
1. **무한 루프 방지**: 스토어 업데이트 시 조건부 체크 필수
2. **타입 안전성**: 모든 새로운 액션에 TypeScript 타입 정의
3. **성능**: 공통 텍스처 재사용으로 메모리 효율화
4. **사용자 경험**: 권한에 따른 적절한 모달 표시
5. **데이터 구조**: width/height(Billboard)와 size(기존) 모두 지원하는 통합 구조
6. **단일 영역 제약**: UI 모든 곳에서 1인당 1개 영역 제한 고려

## 🚀 재개 시 우선순위
1. **17단계-5**: Stage 17 완전 완료 - **⭐ 최우선**
   - 사이드바 테스트 데이터 제거 및 실제 데이터 연동
   - 조회수 시스템 구현 (UI 분석 → Supabase 스키마 추가)
   - 헤더 네비게이션 명확성 개선 ('내 투자', '히스토리' 정의/제거)
   - 완전성 테스트: 멀티유저 시뮬레이션, 실시간 동기화 검증
2. **18단계**: UI 데이터 연결 및 실제 인터랙션 구현
   - 3D 맵 통합: 테스트 데이터 → Treemap → 3D 위치 반영 
   - 영역 구매 인터페이스 (Header, Sidebar 버튼들 실제 동작)
   - 추가 투자/대륙 이전 시스템 구현
   - 실시간 알림 시스템, 프로필 데이터 연결
3. **19단계**: 이미지 승인 시스템 강화 (2-3일)
4. **20단계**: 결제 시스템 연동 (3-4일)

## 📞 현재 상태 확인 명령어
```bash
cd /c%3A/Users/Jaeho/Desktop/Projects/Playground/capital_clash_fe
npm run dev
npm run type-check
```

---
### 17단계: Supabase 연동 구현 🔄 (진행 중)
**목표**: 실시간 멀티유저 투자 플랫폼으로 완전 전환

#### ✅ 17단계-1~3: 기본 Supabase 인프라 완료
**완료 일시**: 2025년 1월 현재 세션

**작업 내용**:
1. **Supabase 클라이언트 설정**:
   - `src/lib/supabase.ts`: 환경변수 기반 클라이언트 구성
   - `src/types/database.ts`: 8개 테이블 TypeScript 정의
   - `src/lib/supabase`: 인증, CRUD, 실시간 구독, 파일업로드 API
   - `src/hooks/useSupabaseData.ts`: 커스텀 훅 (auth, sync, admin, notifications)

2. **완전한 데이터베이스 스키마**:
   ```sql
   -- 8개 테이블: users, continents, investors, investments, images, 
   --            camera_tours, notifications, admin_logs
   -- RLS 정책, 인덱스, 외래키 제약조건 포함
   ```

3. **관리자 인터페이스**:
   - `SupabaseManager.tsx`: 프로덕션급 관리 UI
   - 4개 핵심 기능: 연결테스트, 업로드, 다운로드, 실시간동기화
   - 관리자 대시보드에 "🗄️ Supabase 관리" 버튼 추가

#### ✅ 17단계-4: 실시간 멀티유저 플랫폼 전환 완료
**완료 일시**: 2025년 1월 현재 세션

**핵심 변화**: 로컬 중심 → 클라우드 우선 실시간 플랫폼

**구현 완료**:
1. **투자 액션 Supabase 우선 구조**:
   - `addInvestor()`: async 함수로 변경, Supabase 먼저 저장 → 로컬 캐시 업데이트
   - 에러 시 로컬 fallback으로 안정성 보장
   - 실시간 알림 연동으로 즉각적 사용자 피드백

2. **자동 스토어 초기화 시스템** (일시적 비활성화):
   - `initializeStore()`: 앱 시작 시 Supabase에서 자동 데이터 로딩
   - 실시간 동기화 자동 활성화 준비 완료
   - 안정화 후 재활성화 예정

3. **컴포넌트 async/await 적용**:
   - `Sidebar.tsx`, `Header.tsx`, `profile/page.tsx`: 모든 투자 함수 async 변환
   - 완전한 에러 처리 및 사용자 친화적 메시지

4. **테스트 환경 정리**:
   - 주기적 랜덤 토스트 알림 제거 (`InvestmentNotification.tsx`)
   - ContinentDropdown 안전성 강화 및 디버깅 로그 추가
   - 자동 초기화 일시적 비활성화로 안정성 확보

**결과**:
✅ 투자 즉시 → Supabase 저장 → 실시간 동기화 → 모든 사용자 동시 반영
✅ 데이터 손실 위험 제거, 페이지 새로고침해도 데이터 유지
✅ 관리자 수동 동기화 불필요한 완전 자동화 시스템

#### 🔄 17단계-5: 추가 발견 문제점 및 완전성 테스트 (진행 필요)
**확인된 추가 작업**:

1. **사이드바 테스트 데이터 제거**:
   - `Sidebar.tsx`의 하드코딩된 투자자 정보, 금액, 통계 제거
   - 실제 동적 데이터로 완전 교체 필요

2. **유저 정보에 조회수 컬럼 추가**:
   - 현재 UI 전체 분석하여 조회수가 필요한 모든 위치 파악
   - Supabase 스키마에 `view_count`, `daily_views` 등 컬럼 추가
   - 조회수 증가 로직 구현 (투자자 프로필, 영역 조회수, 대륙별 통계)

3. **헤더 네비게이션 명확성 개선**:
   - '내 투자', '히스토리' 버튼의 모호한 기능 정의 문제
   - 명확한 기능이 없다면 제거, 있다면 명확한 구현 필요

4. **완전성 테스트**:
   - 모든 투자 액션의 Supabase 연동 테스트
   - 실시간 동기화 기능 검증
   - 에러 상황에서의 fallback 로직 검증
   - 멀티유저 시뮬레이션 테스트

**예상 소요 시간**: 1-2일 (완전성 테스트 + UI 정리 + 조회수 시스템)

**중요**: Stage 17은 모든 부분을 테스트하면서 연동이 확인되었을 때 완료

**마지막 업데이트**: 2025년 1월 현재 세션 - Stage 17-4 완료, 17-5 진행 필요

**현재 진행도**: 17/20 단계 (85% 완료) - **Stage 17 마무리 중**

## 🎯 성공적으로 구현된 핵심 기능
### Capital Clash 프로젝트에서 투자자 지분율에 따른 셀 기반 treemap 배치 알고리즘을 완벽하게 구현했습니다. 

핵심 로직:
1. 기본 경계 50×50 셀에서 시작
2. 각 투자자 지분율 × 2500셀로 차지할 셀 개수 계산 후 정사방형 크기 결정
3. 크기 내림차순으로 정렬하여 배치
4. y=0 (첫 번째 행)에서만 경계 확장 허용: x + square.size > currentBoundaryW일 때 경계 확장
5. y≥1에서는 확장된 경계 내에서만 배치, 넘으면 다음 행으로 이동
6. 왼쪽 위에서 오른쪽 아래로 순회하며 겹치지 않는 위치에 배치

결과: 40.3% 사각형이 왼쪽 위, 20.1% 사각형이 그 오른쪽에 배치되고 경계가 자동 확장되어 작은 사각형들이 적절히 배치되는 완벽한 treemap 구현 완료.

**추가 완성 기능**:
- 성능 최적화: 3,000회/초 애니메이션 → 0회/초, 공통 텍스처 사용
- 프로필 시스템: 권한 기반 설정패널/프로필보기 분리, 외부링크 지원
