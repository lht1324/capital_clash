# StatsTab의 월요일 Change 표시 개선 방안

## 현재 문제점

현재 StatsTab 컴포넌트에서는 요일별 조회수를 표시하고, 각 요일마다 전날 대비 변화량(Change)을 보여주고 있습니다. 월요일의 경우 `previousSundayView` 값(지난 주 일요일 조회수)과 비교하여 변화량을 계산합니다:

```typescript
const change = dayOfWeek !== 0
    ? dailyViews[dayOfWeek] - dailyViews[dayOfWeek - 1]
    : dailyViews[dayOfWeek] - previousSundayView;
```

이 방식은 다음과 같은 문제점이 있습니다:

1. 주간 경계를 넘어가는 비교가 사용자에게 직관적이지 않을 수 있음
2. 지난 주 일요일 데이터가 없거나 0인 경우 변화량이 왜곡될 수 있음
3. 다른 요일과 달리 월요일만 다른 주의 데이터와 비교하므로 일관성이 떨어짐

## 개선 방안

### 방안 1: 주간 비교 표시 (Week-over-Week)

월요일의 Change를 지난 주 월요일과 비교하여 표시하는 방식입니다.

#### 구현 방법:
1. `Investor` 타입에 `previous_week_views` 배열 추가 (지난 주 요일별 조회수)
2. 월요일의 Change 계산 로직 변경:

```typescript
const change = dayOfWeek !== 0
    ? dailyViews[dayOfWeek] - dailyViews[dayOfWeek - 1]  // 화~일요일: 전날 대비
    : dailyViews[dayOfWeek] - (previousWeekViews ? previousWeekViews[dayOfWeek] : 0);  // 월요일: 지난 주 월요일 대비
```

#### 장점:
- 같은 요일끼리 비교하므로 더 의미 있는 통계 제공
- 주간 성장 패턴을 더 명확하게 파악 가능

#### 단점:
- 추가 데이터 저장 필요
- 첫 주에는 비교 데이터가 없음

### 방안 2: 특별 표시 사용 (Special Indicator)

월요일의 Change에 특별한 표시를 추가하여 다른 요일과 다른 계산 방식임을 명시합니다.

#### 구현 방법:
```typescript
// 변화량 표시 부분 수정
<div className="text-right flex items-center justify-end space-x-1">
    <>
        <span className={`text-sm font-medium ${changeColor}`}>
            {change > 0 ? '+' : ''}
            {
                change !== 0 && dayOfWeek <= currentDayOfWeek
                    ? change
                    : "-"
            }
            {/* 월요일인 경우 특별 표시 추가 */}
            {dayOfWeek === 0 && change !== 0 && dayOfWeek <= currentDayOfWeek && 
                <span className="text-xs ml-1 opacity-70">(vs Sun)</span>}
        </span>
        <span className={`text-xs ${changeColor}`}>{changeIcon}</span>
    </>
</div>
```

#### 장점:
- 기존 데이터 구조 유지 가능
- 사용자에게 명확한 정보 제공

#### 단점:
- UI 공간을 더 차지함
- 여전히 주간 경계를 넘는 비교

### 방안 3: 주간 요약 섹션 분리 (Separate Weekly Summary)

월요일의 Change를 일반 요일별 표에서 제외하고, 대신 주간 요약 섹션에 주간 변화량을 표시합니다.

#### 구현 방법:
```typescript
// 월요일 Change 표시 제외
const showChange = dayOfWeek !== 0;

// 요일별 표시 부분
<div className="text-right flex items-center justify-end space-x-1">
    {showChange ? (
        <>
            <span className={`text-sm font-medium ${changeColor}`}>
                {change > 0 ? '+' : ''}
                {change !== 0 && dayOfWeek <= currentDayOfWeek ? change : "-"}
            </span>
            <span className={`text-xs ${changeColor}`}>{changeIcon}</span>
        </>
    ) : (
        <span className="text-sm text-gray-500">-</span>
    )}
</div>

// 주간 요약 섹션에 추가
<div className="mt-4 pt-3 border-t border-gray-700">
    {/* 기존 요약 정보 */}
    <div className="flex justify-between items-center text-sm">
        <span className="text-gray-400">Current Total</span>
        <span className="text-white font-semibold">{totalView} views</span>
    </div>
    <div className="flex justify-between items-center text-sm mt-1">
        <span className="text-gray-400">Daily Average</span>
        <span className="text-purple-400 font-semibold">{averageDailyView.toFixed(0)} views</span>
    </div>
    
    {/* 주간 변화량 추가 */}
    <div className="flex justify-between items-center text-sm mt-1">
        <span className="text-gray-400">Weekly Change</span>
        <span className={`font-semibold ${weeklyChangeColor}`}>
            {weeklyChange > 0 ? '+' : ''}{weeklyChange} views
        </span>
    </div>
</div>
```

#### 장점:
- 일관된 일별 비교 유지
- 주간 변화량을 더 명확하게 표시

#### 단점:
- 주간 변화량 계산 로직 추가 필요
- UI 재구성 필요

### 방안 4: 상대적 변화율 표시 (Relative Change)

절대적 숫자 대신 상대적 변화율(%)을 표시하여 규모에 상관없이 변화의 의미를 전달합니다.

#### 구현 방법:
```typescript
// 변화율 계산
const calculateChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round((current - previous) / previous * 100);
};

// 월요일 변화율 계산
const changePercentage = dayOfWeek !== 0
    ? calculateChangePercentage(dailyViews[dayOfWeek], dailyViews[dayOfWeek - 1])
    : calculateChangePercentage(dailyViews[dayOfWeek], previousSundayView);

// 표시 부분
<div className="text-right flex items-center justify-end space-x-1">
    <>
        <span className={`text-sm font-medium ${changeColor}`}>
            {changePercentage > 0 ? '+' : ''}
            {
                change !== 0 && dayOfWeek <= currentDayOfWeek
                    ? `${changePercentage}%`
                    : "-"
            }
        </span>
        <span className={`text-xs ${changeColor}`}>{changeIcon}</span>
    </>
</div>
```

#### 장점:
- 규모에 상관없이 변화의 의미 전달
- 기존 데이터 구조 유지 가능

#### 단점:
- 절대적 숫자 정보 손실
- 기준값이 0이거나 매우 작을 때 변화율이 왜곡될 수 있음

### 방안 5: 토글 가능한 비교 모드 (Toggleable Comparison Mode)

사용자가 원하는 비교 모드(일별/주별)를 선택할 수 있게 합니다.

#### 구현 방법:
```typescript
// 상태 추가
const [comparisonMode, setComparisonMode] = useState<'daily' | 'weekly'>('daily');

// 토글 버튼 추가
<div className="flex justify-between items-center mb-3">
    <h4 className="text-md font-semibold text-white">Weekly Views Trend</h4>
    <div className="flex text-xs bg-gray-700 rounded-md overflow-hidden">
        <button 
            onClick={() => setComparisonMode('daily')}
            className={`px-2 py-1 ${comparisonMode === 'daily' ? 'bg-blue-500 text-white' : 'text-gray-300'}`}
        >
            Daily
        </button>
        <button 
            onClick={() => setComparisonMode('weekly')}
            className={`px-2 py-1 ${comparisonMode === 'weekly' ? 'bg-blue-500 text-white' : 'text-gray-300'}`}
        >
            Weekly
        </button>
    </div>
</div>

// 변화량 계산 로직 수정
const change = comparisonMode === 'daily'
    ? (dayOfWeek !== 0
        ? dailyViews[dayOfWeek] - dailyViews[dayOfWeek - 1]
        : dailyViews[dayOfWeek] - previousSundayView)
    : dailyViews[dayOfWeek] - (previousWeekViews ? previousWeekViews[dayOfWeek] : 0);
```

#### 장점:
- 사용자가 원하는 비교 방식 선택 가능
- 다양한 인사이트 제공

#### 단점:
- UI 복잡성 증가
- 추가 데이터 필요

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