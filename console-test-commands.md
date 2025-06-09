# 🧪 VIP 시스템 콘솔 테스트 가이드

## 브라우저 콘솔에서 직접 테스트하는 방법

### 1. 개발 서버 실행
```bash
npm run dev
```

### 2. 브라우저에서 http://localhost:3000/admin/vip 접속

### 3. F12 (개발자 도구) → Console 탭 열기

### 4. 다음 명령어들을 순서대로 실행:

#### 📊 맞춤형 테스트 데이터 생성 (북서40명, 북동30명, 남서20명, 남동10명)
```javascript
// 1. Store 접근
const store = window.useContinentStore.getState()

// 2. 맞춤형 데이터 생성
store.generateCustomTestData('northwest', 40)  // 북서방 40명
store.generateCustomTestData('northeast', 30)  // 북동방 30명
store.generateCustomTestData('southwest', 20)  // 남서방 20명
store.generateCustomTestData('southeast', 10)  // 남동방 10명

console.log('✅ 총 100명 투자자 데이터 생성 완료!')
```

#### 🏆 전체 투자자 순위 확인
```javascript
// 3. 전체 투자자 순위 확인
const continents = store.continents
const allInvestors = []

Object.entries(continents).forEach(([continentId, continent]) => {
  if (continentId !== 'center') {
    Object.values(continent.investors).forEach(investor => {
      allInvestors.push({ 
        investor, 
        continentName: continent.name,
        continentId 
      })
    })
  }
})

allInvestors.sort((a, b) => b.investor.investment - a.investor.investment)

console.log('📈 전체 투자자 상위 10명:')
allInvestors.slice(0, 10).forEach((item, index) => {
  const rank = index + 1
  const isVipCandidate = rank <= 4 ? '🌟 VIP 후보' : '   일반'
  console.log(`${isVipCandidate} ${rank}위: ${item.investor.name} ($${item.investor.investment.toLocaleString()}) - ${item.continentName}`)
})
```

#### 👑 VIP 자동 승격 실행
```javascript
// 4. VIP 자동 승격 시스템 실행
console.log('🎯 VIP 자동 승격 시스템 실행...')
store.checkAndPromoteToVIP()

// 결과 확인
const centerInvestors = Object.values(store.continents.center.investors)
console.log(`👑 중앙 대륙 VIP: ${centerInvestors.length}명`)
centerInvestors.forEach((investor, index) => {
  console.log(`   VIP ${index + 1}: ${investor.name} ($${investor.investment.toLocaleString()})`)
})
```

#### 🗺️ 동적 대륙 위치 업데이트 확인
```javascript
// 5. 대륙 경계 및 위치 확인
const centerBounds = store.calculateContinentBounds('center')
if (centerBounds) {
  console.log(`📐 중앙 대륙 경계: (${centerBounds.minX}, ${centerBounds.minY}) → (${centerBounds.maxX}, ${centerBounds.maxY})`)
  console.log(`📏 중앙 대륙 크기: ${centerBounds.maxX - centerBounds.minX} × ${centerBounds.maxY - centerBounds.minY}`)
}

// 동적 위치 업데이트
store.updateContinentPositions()
console.log('✅ 대륙 위치 동적 업데이트 완료')

// 새로운 위치 확인
Object.values(store.continents).forEach(continent => {
  if (continent.id !== 'center') {
    console.log(`🌍 ${continent.name} 새 위치: (${continent.position.join(', ')})`)
  }
})
```

#### 📊 최종 결과 요약
```javascript
// 6. 최종 결과 요약
console.log('\n' + '='.repeat(50))
console.log('📊 최종 테스트 결과 요약:')

Object.values(store.continents).forEach(continent => {
  const investorCount = Object.keys(continent.investors).length
  console.log(`🌍 ${continent.name}: ${investorCount}명, $${continent.totalInvestment.toLocaleString()}`)
})

console.log('\n🎉 VIP 시스템 테스트 완료!')
```

## 🎯 UI에서 테스트하는 방법

### /admin/vip 페이지에서:
1. **"맞춤형 데이터 (100명)"** 버튼 클릭
2. 콘솔 로그 확인 (F12 → Console)
3. **"VIP 수동 승격"** 버튼으로 재실행 가능
4. 상위 투자자 순위와 VIP 멤버 실시간 확인

### /admin/continents 페이지에서:
1. **"동적 재배치"** 버튼으로 위치 업데이트
2. 대륙별 위치 실시간 편집 가능
3. 카메라 타겟 조정

## ✅ 예상 결과

- **총 투자자**: 100명 (북서40 + 북동30 + 남서20 + 남동10)
- **각 대륙 지분율**: 정확히 100% (불규칙한 분배)
- **VIP 승격**: 전체 상위 4명이 중앙 대륙으로 자동 이주
- **동적 위치**: 중앙 대륙 크기에 맞춰 다른 대륙 위치 자동 조정
- **실시간 업데이트**: 투자금 변경 시 즉시 VIP 재계산

## 🔧 문제 해결

### Store가 undefined인 경우:
```javascript
// Zustand store를 전역에서 접근 가능하게 만들기
import { useContinentStore } from './store/continentStore'
window.useContinentStore = useContinentStore
```

### 데이터가 보이지 않는 경우:
```javascript
// 강제 리렌더링
window.location.reload()
``` 