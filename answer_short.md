# 조회수 데이터 관리 방안 분석

## 현재 문제점

현재 조회수 데이터 관리 방식에는 두 가지 주요 문제점이 있습니다:

1. **복잡한 주간 데이터 구조**: 현재는 몇 번째 주인지를 추적하는 복잡한 데이터 구조가 사용되고 있으나, 실제로는 월요일부터 일요일까지의 요일별 조회수만 필요합니다.

2. **조회 기반 업데이트 한계**: 현재 `previousSundayDailyView` 값은 사용자가 해당 영역을 조회할 때만 업데이트되므로, 조회되지 않는 영역의 데이터는 업데이트되지 않는 문제가 있습니다.

## 개선 방안

### 1. 단순화된 요일별 데이터 구조

몇 번째 주인지에 대한 개념이 필요 없고, 단순히 월요일부터 일요일까지의 요일별 조회수만 필요한 경우 데이터 구조를 크게 단순화할 수 있습니다.

#### 데이터 구조

```typescript
type Investor = {
    // 기존 필드들...
    daily_views: number[7]  // [월, 화, 수, 목, 금, 토, 일] 형식의 고정 배열
    previous_sunday_view: number  // 지난 주 일요일 조회수 (월요일 변화량 계산용)
}
```

이 접근법에서는 `daily_views` 배열이 항상 7개의 요소를 가지며, 각 요소는 해당 요일의 조회수를 나타냅니다. 특정 주를 구분하지 않고, 현재 주의 요일별 조회수만 추적합니다.

#### 구현 방법

1. **조회수 업데이트**: 사용자가 프로필을 조회할 때 현재 요일의 조회수만 증가시킵니다.

```typescript
// 현재 요일 인덱스 구하기 (0 = 월요일, ..., 6 = 일요일)
const dayOfWeek = (new Date().getDay() + 6) % 7;

// 해당 요일의 조회수 증가
const updatedDailyViews = [...investorInfo.daily_views];
updatedDailyViews[dayOfWeek]++;

// 데이터베이스 업데이트
updateInvestorDailyViews(investorId, updatedDailyViews);
```

2. **주간 리셋**: 매주 월요일에 처음 접속한 사용자가 있을 때, 지난 주 일요일 조회수를 저장하고 모든 요일 조회수를 리셋합니다.

```typescript
// 현재 요일이 월요일(0)인지 확인
if (dayOfWeek === 0) {
    // 마지막 업데이트가 지난 주인지 확인
    const lastUpdated = new Date(investorInfo.updated_at || 0);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    if (lastUpdated < yesterday) {
        // 지난 주 일요일 조회수 저장
        const previousSundayView = investorInfo.daily_views[6];

        // 새 주의 조회수 리셋 (월요일 조회수는 1로 설정)
        const newDailyViews = [1, 0, 0, 0, 0, 0, 0];

        // 데이터베이스 업데이트
        updateInvestorDailyViews(
            investorId, 
            newDailyViews, 
            previousSundayView
        );
    }
}
```

#### 장점

1. **단순성**: 데이터 구조가 매우 단순하고 이해하기 쉽습니다.
2. **저장 공간 효율**: 항상 7개의 숫자만 저장하므로 저장 공간이 일정합니다.
3. **구현 용이성**: 복잡한 날짜 계산이나 주 식별 로직이 필요 없습니다.
4. **성능**: 간단한 배열 접근만으로 데이터를 처리할 수 있어 성능이 좋습니다.

#### 단점

1. **히스토리 부재**: 이전 주들의 데이터가 저장되지 않아 장기적인 추세 분석이 어렵습니다.
2. **데이터 손실**: 매주 리셋 시 이전 주의 상세 데이터가 손실됩니다(일요일 조회수만 보존).
3. **동시성 문제**: 여러 사용자가 동시에 월요일에 접속할 경우, 리셋 로직에 경쟁 조건이 발생할 수 있습니다.

#### 확장 가능성

필요에 따라 최소한의 히스토리를 유지하면서도 단순성을 유지할 수 있습니다:

```typescript
type Investor = {
    // 기존 필드들...
    daily_views: number[7]  // 현재 주 [월, 화, 수, 목, 금, 토, 일]
    previous_week_views: number[7]  // 지난 주 [월, 화, 수, 목, 금, 토, 일]
    total_views: number  // 누적 총 조회수
}
```

이 확장된 구조에서는 현재 주와 지난 주의 요일별 조회수를 모두 저장하면서, 총 조회수도 별도로 관리합니다. 이렇게 하면 주간 비교가 가능하면서도 데이터 구조의 복잡성을 최소화할 수 있습니다.

### 2. 조회되지 않는 영역 처리 방법

현재 `previousSundayDailyView` 값은 사용자가 해당 영역을 조회할 때만 업데이트되므로, 조회되지 않는 영역의 데이터는 업데이트되지 않는 문제가 있습니다. 이 문제를 해결하기 위한 여러 방법을 살펴보겠습니다.

#### 2.1 일괄 업데이트 API 추가

자주 방문하는 페이지(예: 메인 페이지)에서 모든 영역의 데이터를 주기적으로 업데이트하는 API를 호출하는 방법입니다.

```typescript
// pages/api/update-all-stats.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 현재 요일 확인 (0 = 월요일, ..., 6 = 일요일)
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7;

    // 월요일에만 실행
    if (dayOfWeek !== 0) {
      return res.status(200).json({ message: '오늘은 월요일이 아니므로 업데이트가 필요하지 않습니다.' });
    }

    // 이번 주 월요일 날짜 계산
    const thisMonday = new Date(today);
    thisMonday.setHours(0, 0, 0, 0);

    // 모든 투자자 정보 가져오기
    const { data: investors, error } = await supabase
      .from('investors')
      .select('id, daily_views, updated_at')
      .lt('updated_at', thisMonday.toISOString()); // 이번 주에 아직 업데이트되지 않은 데이터만

    if (error) throw error;

    if (!investors || investors.length === 0) {
      return res.status(200).json({ message: '업데이트할 데이터가 없습니다.' });
    }

    // 각 투자자의 일요일 조회수를 previous_sunday_view에 저장
    const SUNDAY_INDEX = 6;
    const updates = investors.map(investor => {
      return supabase
        .from('investors')
        .update({
          previous_sunday_view: investor.daily_views[SUNDAY_INDEX],
          updated_at: new Date().toISOString()
        })
        .eq('id', investor.id);
    });

    await Promise.all(updates);

    return res.status(200).json({ 
      success: true, 
      updatedCount: investors.length 
    });
  } catch (error) {
    console.error('Failed to update all stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

메인 페이지에서 이 API를 호출:

```typescript
// src/pages/index.tsx
useEffect(() => {
  // 페이지 로드 시 한 번만 실행
  fetch('/api/update-all-stats')
    .then(response => response.json())
    .catch(error => console.error('Failed to update all stats:', error));
}, []);
```

#### 장점:
- 자주 방문하는 페이지를 통해 대부분의 데이터가 업데이트됨
- 서버리스 환경에서도 구현 가능
- 추가 인프라 비용 없음

#### 단점:
- 트래픽이 적은 사이트에서는 효과가 제한적
- 모든 데이터가 정확히 같은 시간에 업데이트되지 않음
- 대량의 데이터 처리 시 API 타임아웃 가능성

#### 2.2 관리자 기능 추가

관리자가 필요할 때 모든 데이터를 수동으로 업데이트할 수 있는 기능을 추가합니다.

```typescript
// src/components/admin/UpdateStatsButton.tsx
import { useState } from 'react';

export function UpdateStatsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleUpdate = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/update-all-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setResult(`성공적으로 ${data.updatedCount}개의 데이터를 업데이트했습니다.`);
    } catch (error) {
      setResult('업데이트 중 오류가 발생했습니다.');
      console.error('Update failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleUpdate}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isLoading ? '업데이트 중...' : '모든 통계 업데이트'}
      </button>

      {result && (
        <p className="mt-2 text-sm text-gray-600">{result}</p>
      )}
    </div>
  );
}
```

#### 장점:
- 관리자가 필요할 때 데이터를 업데이트할 수 있음
- 구현이 간단함
- 추가 인프라 비용 없음

#### 단점:
- 수동 작업이 필요함
- 정기적인 업데이트를 잊을 수 있음
- 대량의 데이터 처리 시 시간이 오래 걸릴 수 있음

#### 2.3 Vercel Cron Jobs 활용

Vercel Pro 계정을 사용하는 경우, Cron Jobs를 활용하여 정기적으로 모든 데이터를 업데이트할 수 있습니다.

```typescript
// pages/api/cron/update-stats.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 인증 확인 (보안을 위해)
  const authHeader = req.headers.authorization;
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 모든 투자자 정보 가져오기
    const { data: investors, error } = await supabase
      .from('investors')
      .select('id, daily_views');

    if (error) throw error;

    // 각 투자자의 일요일 조회수를 previous_sunday_view에 저장
    const SUNDAY_INDEX = 6;
    const updates = investors.map(investor => {
      return supabase
        .from('investors')
        .update({
          previous_sunday_view: investor.daily_views[SUNDAY_INDEX],
          updated_at: new Date().toISOString()
        })
        .eq('id', investor.id);
    });

    await Promise.all(updates);

    return res.status(200).json({ 
      success: true, 
      updatedCount: investors.length 
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

vercel.json 파일에 Cron Job 설정:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-stats",
      "schedule": "0 0 * * 1"  // 매주 월요일 자정에 실행
    }
  ]
}
```

#### 장점:
- 완전 자동화된 업데이트
- 모든 데이터가 정확한 시간에 업데이트됨
- 사용자 활동에 의존하지 않음

#### 단점:
- Vercel Pro 계정 필요 (추가 비용)
- 대량의 데이터 처리 시 실행 시간 제한에 걸릴 수 있음
- 서버리스 환경의 제약 사항 적용

#### 2.4 하이브리드 접근법

사용자 활동 기반 업데이트와 정기적인 일괄 업데이트를 결합하는 방법입니다.

1. **사용자 활동 기반 업데이트**: 사용자가 영역을 조회할 때 해당 영역의 데이터를 업데이트합니다.
2. **정기적인 일괄 업데이트**: 자주 방문하는 페이지에서 API를 호출하거나 Cron Job을 사용하여 모든 데이터를 주기적으로 업데이트합니다.

```typescript
// 사용자 활동 기반 업데이트 (TerritoryInfoViewModal.tsx)
useEffect(() => {
  if (isOpen && investorId && investorInfo) {
    const dayOfWeek = (new Date().getDay() + 6) % 7;
    const updatedDailyViews = [...investorInfo.daily_views];
    updatedDailyViews[dayOfWeek]++;

    // 월요일이고 마지막 업데이트가 지난 주인 경우
    if (dayOfWeek === 0) {
      const lastUpdated = new Date(investorInfo.updated_at || 0);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      if (lastUpdated < yesterday) {
        updateInvestorDailyViews(
          investorId, 
          updatedDailyViews, 
          investorInfo.daily_views[6]  // 지난 주 일요일 조회수
        ).catch(error => console.error('Failed to update views:', error));
        return;
      }
    }

    updateInvestorDailyViews(investorId, updatedDailyViews)
      .catch(error => console.error('Failed to update views:', error));
  }
}, [isOpen, investorId, investorInfo, updateInvestorDailyViews]);

// 정기적인 일괄 업데이트 (메인 페이지 또는 Cron Job)
```

#### 장점:
- 사용자 활동이 많은 영역은 실시간으로 업데이트됨
- 조회가 적은 영역도 주기적으로 업데이트됨
- 데이터 일관성 유지

#### 단점:
- 구현 복잡성 증가
- 중복 업데이트 가능성
- 추가 인프라 비용 가능성 (Cron Job 사용 시)

## 주간/월간 데이터 저장 방법

### 제안된 월간 데이터 구조

다음과 같은 JSONB 객체 구조를 사용하여 월간 일별 조회수 데이터를 저장할 수 있습니다:

```typescript
{
    previousMonthDailyViews: number[][], // [[0, 0, 0, 0, 0, 0, 0], [1, 2, 3, 4, 5, 6, 7], ...]
    currentMonthDailyViews: number[][]
}
```

이 구조에서:
- `previousMonthDailyViews`: 지난 달의 일별 조회수를 주 단위로 저장하는 2차원 배열입니다. 각 내부 배열은 한 주의 7일 조회수를 나타냅니다.
- `currentMonthDailyViews`: 현재 달의 일별 조회수를 주 단위로 저장하는 2차원 배열입니다.

#### 장점:
- 구조가 단순하고 직관적입니다.
- 주 단위로 데이터가 구성되어 있어 주간 통계를 쉽게 계산할 수 있습니다.
- 현재 달과 이전 달의 데이터를 명확하게 구분할 수 있습니다.
- 기존의 `daily_views` 배열과 유사한 구조로, 기존 로직을 확장하기 쉽습니다.

#### 단점:
- 월마다 주의 수가 다를 수 있어 배열 길이가 일정하지 않을 수 있습니다(4주 또는 5주).
- 특정 날짜의 데이터를 찾으려면 주와 요일 인덱스를 계산해야 합니다.
- 여러 달의 데이터를 저장하려면 구조를 더 확장해야 합니다.
- 월이 바뀔 때 데이터를 이동시키는 로직이 필요합니다.

#### 개선 제안:
이 구조를 약간 수정하여 다음과 같이 사용할 수도 있습니다:

```typescript
{
    monthlyViews: {
        [yearMonth: string]: number[][] // '2023-01': [[0, 0, 0, 0, 0, 0, 0], ...], '2023-02': [...]
    }
}
```

이렇게 하면 여러 달의 데이터를 유연하게 저장할 수 있고, 키를 통해 특정 연월의 데이터에 쉽게 접근할 수 있습니다.

만약 주간, 월간 처리를 위해 전 주, 전전 주, 전전전 주, 전 달, 전전 달 등의 데이터를 저장해야 한다면, Supabase에 다음과 같은 방식으로 저장할 수 있습니다:

### 1. JSON 컬럼 활용

Supabase(PostgreSQL)의 JSONB 타입을 활용하여 히스토리 데이터를 저장합니다.

```typescript
// Investor 타입 확장
type Investor = {
    // 기존 필드들...
    daily_views: number[]
    previous_sunday_view: number

    // 추가 필드
    weekly_history: {
        [key: string]: {  // ISO 형식의 날짜 문자열 (주의 시작일)
            daily_views: number[]
            total_views: number
        }
    }
    monthly_history: {
        [key: string]: {  // 'YYYY-MM' 형식
            total_views: number
            weekly_totals: number[]
        }
    }
}
```

#### 장점:
- 유연한 구조로 다양한 형태의 데이터 저장 가능
- 스키마 변경 없이 새로운 속성 추가 가능
- 단일 컬럼에 모든 히스토리 데이터 저장

#### 단점:
- 복잡한 쿼리가 어려울 수 있음
- 인덱싱 제한
- 대량의 데이터에서 성능 이슈 가능성

### 2. 별도 테이블 생성

히스토리 데이터를 위한 별도의 테이블을 생성합니다.

```sql
-- 주간 통계 테이블
CREATE TABLE weekly_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID REFERENCES investors(id),
    week_start_date DATE NOT NULL,  -- 주의 시작일(월요일)
    daily_views INTEGER[] NOT NULL,  -- 요일별 조회수
    total_views INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 월간 통계 테이블
CREATE TABLE monthly_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID REFERENCES investors(id),
    year_month VARCHAR(7) NOT NULL,  -- 'YYYY-MM' 형식
    total_views INTEGER NOT NULL,
    weekly_totals INTEGER[] NOT NULL,  -- 주별 총 조회수
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_weekly_stats_investor_id ON weekly_stats(investor_id);
CREATE INDEX idx_weekly_stats_week_start ON weekly_stats(week_start_date);
CREATE INDEX idx_monthly_stats_investor_id ON monthly_stats(investor_id);
CREATE INDEX idx_monthly_stats_year_month ON monthly_stats(year_month);
```

#### 장점:
- 관계형 데이터베이스의 장점 활용 (인덱싱, 조인 등)
- 복잡한 쿼리 및 분석 용이
- 데이터 무결성 보장

#### 단점:
- 스키마 변경이 필요할 때 마이그레이션 작업 필요
- 여러 테이블 간 조인 필요
- 구현 복잡성 증가

### 3. 시계열 데이터 최적화

TimescaleDB와 같은 PostgreSQL 확장을 활용하여 시계열 데이터에 최적화된 방식으로 저장합니다.

```sql
-- TimescaleDB 확장 설치 (Supabase에서 지원하는 경우)
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 시계열 테이블 생성
CREATE TABLE investor_views (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    investor_id UUID NOT NULL,
    views INTEGER NOT NULL,
    period_type VARCHAR(10) NOT NULL,  -- 'daily', 'weekly', 'monthly'
    PRIMARY KEY(time, investor_id, period_type)
);

-- 하이퍼테이블로 변환
SELECT create_hypertable('investor_views', 'time');
```

#### 장점:
- 시계열 데이터에 최적화된 성능
- 자동 파티셔닝 및 인덱싱
- 시간 기반 집계 함수 지원

#### 단점:
- Supabase에서 TimescaleDB 지원 여부 확인 필요
- 학습 곡선
- 구현 복잡성

## 권장 방안

위 방안들 중에서 **방안 3: 주간 요약 섹션 분리**가 가장 균형 잡힌 접근법으로 보입니다. 이 방안은:

1. 일별 비교의 일관성을 유지하면서도
2. 주간 변화량을 명확하게 표시하고
3. 기존 UI 구조를 크게 해치지 않으며
4. 사용자에게 더 의미 있는 정보를 제공합니다

구현 시 고려사항:
- 주간 변화량은 이번 주 총 조회수와 지난 주 총 조회수의 차이로 계산
- 첫 주 사용자를 위한 예외 처리 필요
- 주간 변화량에 대한 시각적 표시(색상, 아이콘)를 일관되게 적용

이 방안은 기존 데이터 구조를 크게 변경하지 않으면서도 사용자에게 더 명확하고 의미 있는 통계 정보를 제공할 수 있습니다.

데이터 저장 방식으로는 초기에는 **JSON 컬럼 활용** 방식이 구현 복잡성과 유지보수 측면에서 유리하지만, 데이터가 많아지고 복잡한 분석이 필요해지면 **별도 테이블 생성** 방식으로 마이그레이션하는 것이 좋습니다.

제안된 월간 데이터 구조(`previousMonthDailyViews`, `currentMonthDailyViews`)는 간단한 프로젝트에서 시작하기에 적합한 구조입니다. 하지만 장기적으로는 개선 제안에서 언급한 키-값 구조(`monthlyViews` 객체)를 사용하여 더 유연하게 여러 달의 데이터를 관리하는 것이 좋습니다. 이 구조는 JSON 컬럼 활용 방식과 잘 어울리며, 필요에 따라 별도 테이블로 마이그레이션할 수 있는 기반이 됩니다.

## [key: string] 인덱싱을 사용한 데이터 접근 방법

`weekly_history`나 `monthly_history`와 같이 동적 키를 사용하는 객체에서 데이터에 접근하는 방법을 알아보겠습니다.

### 연월(YYYY-MM) 키 생성 및 데이터 접근

```typescript
// 현재 날짜에서 연월 키 생성하기
const now = new Date();
const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
// 예: '2023-11'

// 특정 연월의 데이터 접근하기
const monthData = investor.monthly_history[yearMonth];
if (monthData) {
  console.log(`${yearMonth}의 총 조회수:`, monthData.total_views);
  console.log(`${yearMonth}의 주간 조회수:`, monthData.weekly_totals);
}

// 이전 달 데이터 접근하기
const prevMonth = new Date(now);
prevMonth.setMonth(prevMonth.getMonth() - 1);
const prevYearMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
const prevMonthData = investor.monthly_history[prevYearMonth];
```

### 주 단위 키 생성 및 데이터 접근

```typescript
// 현재 날짜가 속한 주의 시작일(월요일) 구하기
const getWeekStartDate = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 일요일이면 전 주 월요일로 조정
  d.setDate(diff);
  return d;
};

// 주 시작일을 ISO 문자열로 변환 (YYYY-MM-DD)
const weekStart = getWeekStartDate(new Date());
const weekKey = weekStart.toISOString().split('T')[0];
// 예: '2023-11-20'

// 특정 주의 데이터 접근하기
const weekData = investor.weekly_history[weekKey];
if (weekData) {
  console.log(`${weekKey} 주의 일별 조회수:`, weekData.daily_views);
  console.log(`${weekKey} 주의 총 조회수:`, weekData.total_views);
}

// 이전 주 데이터 접근하기
const prevWeekStart = new Date(weekStart);
prevWeekStart.setDate(prevWeekStart.getDate() - 7);
const prevWeekKey = prevWeekStart.toISOString().split('T')[0];
const prevWeekData = investor.weekly_history[prevWeekKey];
```

### 데이터 존재 여부 확인 및 안전한 접근

객체에서 특정 키의 데이터가 존재하는지 확인하는 방법은 여러 가지가 있습니다:

```typescript
// 1. in 연산자 사용
if (yearMonth in investor.monthly_history) {
  // 데이터 존재
}

// 2. 직접 접근 후 undefined 체크
if (investor.monthly_history[yearMonth] !== undefined) {
  // 데이터 존재
}

// 3. 옵셔널 체이닝 사용 (TypeScript 3.7+)
const totalViews = investor.monthly_history?.[yearMonth]?.total_views ?? 0;
```

### 모든 기록 순회하기

객체의 모든 키-값 쌍을 순회하는 방법:

```typescript
// Object.entries() 사용
Object.entries(investor.monthly_history).forEach(([yearMonth, data]) => {
  console.log(`${yearMonth}: 총 조회수 ${data.total_views}`);
});

// 특정 기간 내 데이터만 필터링하여 순회
const startDate = new Date('2023-01-01');
const endDate = new Date('2023-06-30');

Object.entries(investor.weekly_history)
  .filter(([weekKey]) => {
    const weekDate = new Date(weekKey);
    return weekDate >= startDate && weekDate <= endDate;
  })
  .forEach(([weekKey, data]) => {
    console.log(`${weekKey} 주의 총 조회수: ${data.total_views}`);
  });
```

이러한 방식으로 동적 키를 사용하는 객체에서 효율적으로 데이터를 접근하고 관리할 수 있습니다.

## 요일만 구분하는 단순화된 접근법

만약 몇 번째 주인지에 대한 개념이 필요 없고, 단순히 월요일부터 일요일까지의 요일만 구분하면 된다면, 데이터 구조와 처리 로직을 크게 단순화할 수 있습니다.

### 단순화된 데이터 구조

```typescript
type Investor = {
    // 기존 필드들...
    daily_views: number[7]  // [월, 화, 수, 목, 금, 토, 일] 형식의 고정 배열
    previous_sunday_view: number  // 지난 주 일요일 조회수 (월요일 변화량 계산용)
}
```

이 접근법에서는 `daily_views` 배열이 항상 7개의 요소를 가지며, 각 요소는 해당 요일의 조회수를 나타냅니다. 특정 주를 구분하지 않고, 현재 주의 요일별 조회수만 추적합니다.

### 구현 방법

1. **조회수 업데이트**: 사용자가 프로필을 조회할 때 현재 요일의 조회수만 증가시킵니다.

```typescript
// 현재 요일 인덱스 구하기 (0 = 월요일, ..., 6 = 일요일)
const dayOfWeek = (new Date().getDay() + 6) % 7;

// 해당 요일의 조회수 증가
const updatedDailyViews = [...investorInfo.daily_views];
updatedDailyViews[dayOfWeek]++;

// 데이터베이스 업데이트
updateInvestorDailyViews(investorId, updatedDailyViews);
```

2. **주간 리셋**: 매주 월요일에 처음 접속한 사용자가 있을 때, 지난 주 일요일 조회수를 저장하고 모든 요일 조회수를 리셋합니다.

```typescript
// 현재 요일이 월요일(0)인지 확인
if (dayOfWeek === 0) {
    // 마지막 업데이트가 지난 주인지 확인
    const lastUpdated = new Date(investorInfo.updated_at || 0);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    if (lastUpdated < yesterday) {
        // 지난 주 일요일 조회수 저장
        const previousSundayView = investorInfo.daily_views[6];

        // 새 주의 조회수 리셋 (월요일 조회수는 1로 설정)
        const newDailyViews = [1, 0, 0, 0, 0, 0, 0];

        // 데이터베이스 업데이트
        updateInvestorDailyViews(
            investorId, 
            newDailyViews, 
            previousSundayView
        );
    }
}
```

### 장점

1. **단순성**: 데이터 구조가 매우 단순하고 이해하기 쉽습니다.
2. **저장 공간 효율**: 항상 7개의 숫자만 저장하므로 저장 공간이 일정합니다.
3. **구현 용이성**: 복잡한 날짜 계산이나 주 식별 로직이 필요 없습니다.
4. **성능**: 간단한 배열 접근만으로 데이터를 처리할 수 있어 성능이 좋습니다.

### 단점

1. **히스토리 부재**: 이전 주들의 데이터가 저장되지 않아 장기적인 추세 분석이 어렵습니다.
2. **데이터 손실**: 매주 리셋 시 이전 주의 상세 데이터가 손실됩니다(일요일 조회수만 보존).
3. **동시성 문제**: 여러 사용자가 동시에 월요일에 접속할 경우, 리셋 로직에 경쟁 조건이 발생할 수 있습니다.

### 확장 가능성

필요에 따라 최소한의 히스토리를 유지하면서도 단순성을 유지할 수 있습니다:

```typescript
type Investor = {
    // 기존 필드들...
    daily_views: number[7]  // 현재 주 [월, 화, 수, 목, 금, 토, 일]
    previous_week_views: number[7]  // 지난 주 [월, 화, 수, 목, 금, 토, 일]
    total_views: number  // 누적 총 조회수
}
```

이 확장된 구조에서는 현재 주와 지난 주의 요일별 조회수를 모두 저장하면서, 총 조회수도 별도로 관리합니다. 이렇게 하면 주간 비교가 가능하면서도 데이터 구조의 복잡성을 최소화할 수 있습니다.

## 결론 및 권장 사항

분석한 내용을 바탕으로 다음과 같은 권장 사항을 제시합니다:

### 1. 데이터 구조 단순화

몇 번째 주인지에 대한 개념이 필요 없고 월-일 요일별 조회수만 필요한 경우, 다음과 같은 단순화된 데이터 구조를 사용하는 것이 좋습니다:

```typescript
type Investor = {
    // 기존 필드들...
    daily_views: number[7]  // [월, 화, 수, 목, 금, 토, 일] 형식의 고정 배열
    previous_sunday_view: number  // 지난 주 일요일 조회수 (월요일 변화량 계산용)
}
```

이 구조는 다음과 같은 장점이 있습니다:
- 데이터 구조가 단순하고 이해하기 쉬움
- 저장 공간이 효율적이고 일정함
- 구현이 간단하고 성능이 좋음

필요에 따라 최소한의 히스토리를 유지하기 위해 `previous_week_views` 배열을 추가할 수 있습니다.

### 2. 조회되지 않는 영역 처리

조회되지 않는 영역의 데이터 업데이트 문제를 해결하기 위해 프로젝트 규모와 요구사항에 따라 다음과 같은 접근법을 권장합니다:

#### 소규모 프로젝트
- **일괄 업데이트 API + 사용자 활동 기반 업데이트**: 메인 페이지 등 자주 방문하는 페이지에서 일괄 업데이트 API를 호출하고, 개별 영역 조회 시 해당 영역의 데이터를 업데이트합니다.
- **관리자 기능 추가**: 필요할 때 관리자가 수동으로 모든 데이터를 업데이트할 수 있는 기능을 제공합니다.

이 접근법은 추가 인프라 비용 없이 구현이 간단하면서도 대부분의 데이터를 업데이트할 수 있습니다.

#### 중대규모 프로젝트
- **하이브리드 접근법**: 사용자 활동 기반 업데이트와 Vercel Cron Jobs를 결합하여 모든 데이터를 정확하게 업데이트합니다.
- **데이터베이스 트리거 활용**: Supabase에서 지원하는 경우, PostgreSQL 트리거를 사용하여 자동으로 데이터를 업데이트합니다.

이 접근법은 추가 비용이 발생할 수 있지만, 모든 데이터를 정확하게 업데이트하고 데이터 일관성을 유지할 수 있습니다.

### 최종 권장 사항

1. **데이터 구조**: 단순화된 요일별 배열 구조를 사용하여 데이터 관리를 간소화합니다.
2. **업데이트 방식**: 
   - 소규모 프로젝트: 일괄 업데이트 API + 사용자 활동 기반 업데이트
   - 중대규모 프로젝트: 하이브리드 접근법 (사용자 활동 + Cron Jobs)

이러한 접근법을 통해 데이터 구조를 단순화하면서도 조회되지 않는 영역의 데이터도 효과적으로 업데이트할 수 있습니다.
