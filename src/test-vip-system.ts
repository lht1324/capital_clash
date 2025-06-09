// 🧪 VIP 시스템 테스트 스크립트
// 이 파일은 실제 앱에서 실행되지 않고 테스트 목적으로만 사용됩니다

import { useContinentStore } from './store/continentStore'

export const testVIPSystem = () => {
  const store = useContinentStore.getState()
  
  console.log('🚀 VIP 시스템 테스트 시작')
  console.log('=' .repeat(50))
  
  // 1. 맞춤형 테스트 데이터 생성
  console.log('📊 1단계: 맞춤형 테스트 데이터 생성')
  
  const customData = [
    { continentId: 'northwest', userCount: 40, name: '북서방 대륙' },
    { continentId: 'northeast', userCount: 30, name: '북동방 대륙' },
    { continentId: 'southwest', userCount: 20, name: '남서방 대륙' },
    { continentId: 'southeast', userCount: 10, name: '남동방 대륙' }
  ]
  
  customData.forEach(({ continentId, userCount, name }) => {
    console.log(`📍 ${name}에 ${userCount}명 투자자 생성 중...`)
    store.generateCustomTestData(continentId as any, userCount)
  })
  
  console.log('\n✅ 총 100명의 투자자 데이터 생성 완료!')
  
  // 2. 현재 상태 확인
  console.log('\n📊 2단계: 현재 대륙별 현황 확인')
  const continents = store.continents
  
  Object.values(continents).forEach(continent => {
    const investorCount = Object.keys(continent.investors).length
    const totalInvestment = continent.totalInvestment
    
    console.log(`🌍 ${continent.name}: ${investorCount}명, $${totalInvestment.toLocaleString()}`)
    
    if (investorCount > 0) {
      const investors = Object.values(continent.investors)
      const topInvestor = investors.reduce((max, inv) => inv.investment > max.investment ? inv : max)
      console.log(`   💰 최대 투자자: ${topInvestor.name} ($${topInvestor.investment.toLocaleString()})`)
    }
  })
  
  // 3. 전체 상위 투자자 순위 확인
  console.log('\n🏆 3단계: 전체 상위 투자자 순위 (VIP 후보)')
  
  const allInvestors: Array<{ investor: any, continentName: string }> = []
  
  Object.entries(continents).forEach(([continentId, continent]) => {
    if (continentId !== 'center') {
      Object.values(continent.investors).forEach(investor => {
        allInvestors.push({ investor, continentName: continent.name })
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
  
  // 4. VIP 자동 승격 실행
  console.log('\n🎯 4단계: VIP 자동 승격 시스템 실행')
  store.checkAndPromoteToVIP()
  
  // 5. 결과 확인
  console.log('\n👑 5단계: VIP 승격 결과 확인')
  const centerInvestors = Object.values(store.continents.center.investors)
  
  if (centerInvestors.length > 0) {
    console.log(`✅ 중앙 대륙 VIP: ${centerInvestors.length}명`)
    centerInvestors.forEach((investor, index) => {
      console.log(`   👑 VIP ${index + 1}: ${investor.name} ($${investor.investment.toLocaleString()})`)
    })
  } else {
    console.log('❌ 중앙 대륙에 VIP가 없습니다')
  }
  
  // 6. 동적 대륙 위치 업데이트 테스트
  console.log('\n🗺️  6단계: 동적 대륙 위치 업데이트')
  const centerBounds = store.calculateContinentBounds('center')
  
  if (centerBounds) {
    console.log(`📐 중앙 대륙 경계: (${centerBounds.minX}, ${centerBounds.minY}) → (${centerBounds.maxX}, ${centerBounds.maxY})`)
    console.log(`📏 중앙 대륙 크기: ${centerBounds.maxX - centerBounds.minX} × ${centerBounds.maxY - centerBounds.minY}`)
  }
  
  store.updateContinentPositions()
  console.log('✅ 대륙 위치 동적 업데이트 완료')
  
  console.log('\n' + '=' .repeat(50))
  console.log('🎉 VIP 시스템 테스트 완료!')
  
  return {
    totalInvestors: allInvestors.length,
    vipCount: centerInvestors.length,
    topInvestors: allInvestors.slice(0, 4),
    centerBounds
  }
}

// 브라우저 콘솔에서 실행할 수 있는 전역 함수
if (typeof window !== 'undefined') {
  (window as any).testVIPSystem = testVIPSystem
} 