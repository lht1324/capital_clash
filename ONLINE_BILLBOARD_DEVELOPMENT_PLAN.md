# 🎯 Capital Clash → 온라인 광고판 개발 계획서

## 📋 프로젝트 개요

### 현재 상태
- **기존 컨셉**: 실제 돈으로 병력을 구매하고 영토를 확장하는 전략 게임
- **새로운 방향**: 투자 지분율에 따라 크기가 달라지는 온라인 광고판 시스템

### 핵심 아이디어
- 사용자가 투자한 금액에 비례하여 타일 크기 결정
- 타일에 사용자 이미지 표시
- 타일 클릭 시 사용자 정보 표시
- 관리자 승인 시스템을 통한 컨텐츠 품질 관리

## 🎮 사용자 플로우

### 투자자 플로우
1. **투자하기**: 원하는 대륙에 투자 금액 입력
2. **타일 확인**: 지분율에 따른 타일 크기 자동 배정
3. **타일 설정**: 타일 클릭하여 설정 패널 열기
4. **이미지 업로드**: 타일에 표시될 이미지 업로드
5. **정보 입력**: 소개글, 웹사이트, 연락처 입력
6. **승인 대기**: 관리자 승인 후 타일에 반영

### 관리자 플로우
1. **승인 대기 목록 확인**: 업로드된 이미지들 검토
2. **승인/거절 결정**: 컨텐츠 품질 및 적절성 판단
3. **즉시 반영**: 승인 시 해당 타일에 이미지 즉시 적용

### 방문자 플로우
1. **대륙 탐색**: 3D 지도에서 대륙 선택
2. **타일 확인**: 투자자별 타일 크기 및 이미지 확인
3. **정보 조회**: 타일 클릭하여 투자자 정보 확인
4. **외부 연결**: 웹사이트 방문 또는 연락처 확인

## 🛠 기술 스택

### 현재 구현된 기술
- **Frontend**: Next.js 14 (App Router), React Three Fiber, TypeScript
- **3D 렌더링**: Three.js, React Three Fiber
- **상태 관리**: Zustand
- **스타일링**: Tailwind CSS
- **배포**: Vercel

### 추가 예정 기술
- **Backend**: Supabase (데이터베이스, 인증, 스토리지)
- **결제**: Lemon Squeezy
- **실시간 동기화**: Supabase Realtime

## 📊 현재 코드 구조 분석

### 주요 컴포넌트
- `ContinentMap.tsx`: 3D 지도 렌더링 및 타일 시스템
- `InvestmentPanel.tsx`: 투자자 관리 패널
- `ContinentDropdown.tsx`: 대륙 선택 드롭다운
- `Header.tsx`: 상단 헤더

### 상태 관리 (Zustand)
```typescript
interface Investor {
  id: string
  name: string
  investment: number
  share: number
  territories: Territory[]
  color: string
}

interface Continent {
  id: ContinentId
  name: string
  color: string
  totalInvestment: number
  investors: Record<string, Investor>
  // ... 기타 속성
}
```

### 타일 배치 시스템
- **격자형 배치**: 투자자 수가 완전제곱수이고 지분이 동일한 경우
- **나선형 배치**: 그 외의 경우
- **동적 크기 조정**: 지분율에 따른 타일 크기 자동 계산

## 🚀 단계별 개발 계획

### 1단계: 투자자 정보 타입 확장 및 타일 위치 저장 (1일)

#### 구현 사항
- 투자자 타입에 이미지 및 위치 정보 추가
- 타일 배치 완료 후 위치 정보 자동 저장
- 이미지 승인 상태 관리

#### 코드 변경사항
```typescript
// src/store/continentStore.ts 수정
interface Investor {
  id: string
  name: string
  investment: number
  share: number
  territories: Territory[]
  color: string
  // 새로 추가
  imageUrl?: string
  imageStatus: 'none' | 'pending' | 'approved' | 'rejected'
  tilePosition?: { x: number, y: number, size: number }
  profileInfo?: {
    description: string
    website?: string
    contact?: string
  }
}

// 타일 위치 업데이트 함수 추가
const updateInvestorPositions = (continentId: ContinentId, placements: any[]) => {
  // 모든 투자자의 타일 위치 정보 업데이트
}
```

#### 테스트 체크리스트
- [ ] 투자자 추가 시 새로운 필드들이 올바르게 초기화되는지 확인
- [ ] 타일 배치 변경 시 위치 정보가 올바르게 저장되는지 확인
- [ ] 타입 에러 없이 컴파일되는지 확인

### 2단계: 타일 설정 패널 UI 구현 (2일)

#### 구현 사항
- 타일 클릭 시 설정 패널 모달 표시
- 이미지 업로드 인터페이스
- 프로필 정보 입력 폼
- 현재 타일 정보 표시

#### 새로운 컴포넌트
```typescript
// src/components/TileSettingsPanel.tsx 생성
const TileSettingsPanel = ({ investor, isOpen, onClose, onUpdate }) => {
  // 이미지 업로드 상태 관리
  // 프로필 정보 입력 폼
  // 현재 타일 위치 및 크기 정보 표시
  // 승인 상태별 UI 처리
}
```

#### UI 기능
- **현재 타일 정보**: 위치, 크기, 지분율, 투자 금액 표시
- **이미지 업로드**: 파일 선택 및 미리보기
- **승인 상태 표시**: pending/approved/rejected 상태별 다른 UI
- **프로필 정보**: 소개글, 웹사이트, 연락처 입력
- **반응형 디자인**: 모바일 환경 고려

#### 테스트 체크리스트
- [ ] 모달 열기/닫기 동작 확인
- [ ] 이미지 파일 선택 기능 동작 확인
- [ ] 폼 입력 및 유효성 검사 확인
- [ ] 반응형 레이아웃 확인

### 3단계: 클릭 이벤트 연동 및 이미지 조건부 렌더링 (1일)

#### 구현 사항
- 타일 클릭 이벤트 처리
- 승인된 이미지만 타일에 표시
- 설정 패널과 메인 컴포넌트 연동

#### 코드 변경사항
```typescript
// src/components/ContinentMap.tsx 수정
// TerritoryArea 컴포넌트에 클릭 이벤트 추가
const handleTileClick = (event) => {
  event.stopPropagation()
  setSelectedInvestorForSettings(placement.investor)
  setShowSettingsPanel(true)
}

// 이미지 조건부 렌더링
<meshBasicMaterial 
  map={useTexture(
    placement.investor.imageStatus === 'approved' && placement.investor.imageUrl 
      ? placement.investor.imageUrl 
      : '/test.jpg'
  )} 
/>
```

#### 기능
- **클릭 이벤트**: 타일 클릭 시 설정 패널 열기
- **이미지 렌더링**: 승인 상태에 따른 이미지 표시
- **기본 이미지**: 승인되지 않은 경우 기본 이미지 표시
- **상태 동기화**: 설정 변경 시 즉시 반영

#### 테스트 체크리스트
- [ ] 타일 클릭 시 올바른 투자자 정보로 패널이 열리는지 확인
- [ ] 이미지 승인 상태에 따라 올바른 이미지가 표시되는지 확인
- [ ] 설정 변경 후 즉시 반영되는지 확인

### 4단계: 배치 변경 시 위치 자동 업데이트 (0.5일)

#### 구현 사항
- 투자 변경 시 타일 재배치 감지
- 모든 투자자의 위치 정보 자동 업데이트
- 실시간 위치 정보 동기화

#### 코드 변경사항
```typescript
// src/components/ContinentMap.tsx 수정
// TerritorySystem 컴포넌트에 useEffect 추가
useEffect(() => {
  if (placements.length > 0) {
    updateInvestorPositions(continent.id, placements)
  }
}, [placements, continent.id])
```

#### 테스트 체크리스트
- [ ] 새로운 투자자 추가 시 모든 위치 정보 업데이트 확인
- [ ] 투자 금액 변경 시 위치 정보 업데이트 확인
- [ ] 위치 정보가 올바르게 저장되는지 확인

## 📋 추후 구현 예정 기능

### 5단계: Supabase 통합 (2일)
- 데이터베이스 스키마 설계
- 실시간 데이터 동기화
- 이미지 스토리지 연동

### 6단계: 관리자 승인 시스템 (2일)
- 관리자 패널 구현
- 승인 대기 목록 표시
- 승인/거절 처리 기능

### 7단계: 결제 시스템 연동 (3일)
- Lemon Squeezy 통합
- 실시간 결제 처리
- 투자 내역 관리

### 8단계: 사용자 인증 (2일)
- Supabase Auth 연동
- 사용자별 투자 내역 관리
- 권한 관리 시스템

## 🎯 MVP 목표

### 핵심 기능 (1-4단계)
- ✅ 투자 기반 타일 크기 배정
- ✅ 타일 클릭 시 설정 패널
- ✅ 이미지 업로드 및 조건부 표시
- ✅ 프로필 정보 관리
- ✅ 타일 위치 자동 추적

### 예상 완성 시기
**총 4.5일** (약 1주일)

## 🧪 테스트 전략

### 단위 테스트
- Zustand 스토어 상태 변경 테스트
- 타일 배치 알고리즘 테스트
- 이미지 로딩 및 렌더링 테스트

### 통합 테스트
- 타일 클릭 → 설정 패널 → 저장 플로우
- 투자 변경 → 타일 재배치 → 위치 업데이트 플로우
- 이미지 업로드 → 승인 처리 → 타일 반영 플로우

### 사용자 테스트
- 다양한 투자 시나리오 테스트
- 모바일/데스크톱 환경 테스트
- 다중 사용자 동시 접속 테스트

## 🔒 보안 고려사항

### 이미지 업로드
- 파일 타입 검증 (jpg, png, gif만 허용)
- 파일 크기 제한 (최대 5MB)
- 악성 코드 스캔

### 컨텐츠 관리
- 관리자 승인 시스템으로 부적절한 컨텐츠 차단
- 이미지 메타데이터 제거
- 자동 리사이징 및 최적화

### 데이터 보호
- 사용자 개인정보 암호화
- API 요청 인증 및 권한 확인
- CORS 설정 및 보안 헤더

## 📈 성능 최적화

### 3D 렌더링
- 텍스처 압축 및 최적화
- LOD (Level of Detail) 시스템 도입
- 오클루전 컬링 적용

### 이미지 처리
- 자동 이미지 압축
- WebP 포맷 지원
- CDN을 통한 이미지 배포

### 상태 관리
- 불필요한 리렌더링 방지
- 메모이제이션 적용
- 상태 구조 최적화

## 🚀 배포 전략

### 개발 환경
- Vercel Preview 배포
- 실시간 피드백 수집
- A/B 테스트 준비

### 프로덕션 환경
- Vercel Production 배포
- 모니터링 시스템 구축
- 오류 추적 및 분석

## 📝 문서화

### 개발 문서
- API 문서 작성
- 컴포넌트 사용법 가이드
- 상태 관리 패턴 문서

### 사용자 가이드
- 투자자용 사용 설명서
- 관리자용 운영 가이드
- FAQ 및 문제해결 가이드

---

## 📞 연락처

이 개발 계획서에 대한 질문이나 수정사항이 있으시면 언제든지 말씀해 주세요.

**마지막 업데이트**: 2025년 06월 06일 