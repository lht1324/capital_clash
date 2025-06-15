# 대륙 배치 시스템 개선 방안

## 용어 정의

이슈 설명에 따라 다음과 같이 용어를 정의합니다:

- **대륙**: 영역이 모인 사각형에 가까운 공간
- **영역**: 대륙을 이루는 정사각형들
- **대륙의 크기**: '영역'이 배치되었을 때 상하좌우의 가장 바깥쪽 선을 전부 연결했을 때 생기는 사각형의 크기

## 1. 현재 구현 방식 분석

### 1.1 영역 배치 알고리즘
현재 시스템은 다음과 같은 방식으로 투자자 영역을 배치합니다:

1. `treemapAlgorithm.ts`의 `calculateSquareLayout` 함수가 투자자 목록과 최대 사용자 수를 입력받습니다.
2. 각 투자자의 지분율에 따라 정사각형 크기를 계산합니다.
3. 정사각형들을 크기 기준으로 내림차순 정렬합니다.
4. `placeSquaresInHorizontalRectangle` 함수를 통해 세로 방향으로 먼저 채우고, 세로 공간이 부족하면 가로로 확장하는 방식으로 정사각형을 배치합니다.
5. 배치가 완료되면 `calculateBoundary` 함수로 전체 경계를 계산하고, `centerPlacements` 함수로 중앙 정렬합니다.

### 1.2 대륙 배치 방식
현재 각 대륙은 다음과 같이 배치됩니다:

1. `SingleContinent` 컴포넌트는 대륙의 위치(position_x, position_y, position_z)를 사용하여 3D 공간에 배치됩니다.
2. 대륙의 크기는 `CONTINENT_DEFAULT_LENGTH` 상수로 정의되며, 중앙 대륙은 다른 대륙보다 1.2배 큽니다.
3. `WorldScene` 컴포넌트는 모든 대륙을 렌더링하며, 각 대륙의 위치는 데이터베이스에 저장된 값을 사용합니다.

## 2. 문제점

현재 방식의 주요 문제점은 다음과 같습니다:

1. **고정된 대륙 크기**: 대륙의 크기가 `CONTINENT_DEFAULT_LENGTH` 상수로 고정되어 있어, 투자자 영역의 실제 크기와 일치하지 않을 수 있습니다.
2. **불규칙한 배치**: 투자자 영역이 세로 방향으로 먼저 채워지기 때문에, 투자자 수와 지분율에 따라 배치 형태가 크게 달라질 수 있습니다.
3. **대륙 간 관계 부재**: 각 대륙이 독립적으로 배치되어 있어, 대륙 간의 관계가 시각적으로 명확하지 않습니다.

## 3. 개선된 접근 방식

이슈 설명에 따라, 기존 알고리즘을 유지하면서 다음과 같은 6단계 접근 방식을 제안합니다:

### 3.1 단계별 접근 방식

1. **모든 영역의 placement 계산**
   - 기존 알고리즘(`calculateSquareLayout`)을 사용하여 투자자 영역을 배치합니다.
   - 투자자의 지분율에 따라 정사각형 크기를 계산하고, 세로 방향으로 먼저 채우는 방식으로 배치합니다.

2. **계산된 placement를 통해 각 대륙의 크기 얻기**
   - 배치가 완료된 후, `calculateBoundary` 함수를 통해 전체 경계를 계산합니다.
   - 계산된 경계를 기반으로 대륙의 실제 크기(width, height)를 결정합니다.

3. **중앙의 크기를 통해 중앙의 꼭짓점 좌표 얻기**
   - 중앙 대륙의 크기를 기반으로 네 개의 꼭짓점(북서, 북동, 남서, 남동) 좌표를 계산합니다.
   - 꼭짓점 좌표는 대륙 중심을 (0,0,0)으로 했을 때의 상대적 위치입니다.

4. **타 대륙의 크기를 얻고, 중앙의 꼭짓점 좌표를 기준으로 타 대륙의 꼭짓점 얻기**
   - 각 타 대륙(북서, 북동, 남서, 남동)의 크기를 계산합니다.
   - 다음과 같은 연결 관계를 설정합니다:
     - **북서 대륙**: 북서 대륙의 오른쪽 아래(남동) 꼭짓점이 중앙 대륙의 왼쪽 위(북서) 꼭짓점과 일치
     - **북동 대륙**: 북동 대륙의 왼쪽 아래(남서) 꼭짓점이 중앙 대륙의 오른쪽 위(북동) 꼭짓점과 일치
     - **남서 대륙**: 남서 대륙의 오른쪽 위(북동) 꼭짓점이 중앙 대륙의 왼쪽 아래(남서) 꼭짓점과 일치
     - **남동 대륙**: 남동 대륙의 왼쪽 위(북서) 꼭짓점이 중앙 대륙의 오른쪽 아래(남동) 꼭짓점과 일치

5. **타 대륙의 꼭짓점을 기준으로 타 대륙의 크기를 이용해 배치할 공간 구하기**
   - 각 타 대륙의 꼭짓점과 크기를 기반으로 대륙의 위치(position_x, position_y, position_z)를 계산합니다.
   - 이 위치는 대륙의 중심점이 되며, 3D 공간에서의 배치 기준이 됩니다.

6. **배치하기**
   - 계산된 위치를 사용하여 각 대륙을 3D 공간에 배치합니다.
   - 중앙 대륙은 원래 위치에 그대로 두고, 타 대륙만 새로 계산된 위치로 이동합니다.

## 4. 구현 방법

### 4.1 단계 1-2: 영역 배치 및 대륙 크기 계산

```typescript
// TerritorySystem.tsx 파일 수정
function TerritorySystem({ investorList, maxUserCount, cellLength, onTileClick, onContinentSizeCalculated }) {
    // 단계 1: 기존 알고리즘을 사용하여 모든 영역의 placement 계산
    const placementResult = useMemo(() => {
        if (investorList.length === 0) return null
        return calculateSquareLayout(investorList, maxUserCount)
    }, [investorList, maxUserCount])

    if (!placementResult) return null

    const { placements, boundary } = placementResult

    // 단계 2: 계산된 placement의 경계를 통해 대륙의 실제 크기 계산
    // 영역의 경계(boundary)에 셀 크기(cellLength)를 곱하여 실제 대륙 크기 결정
    const continentWidth = boundary.width * cellLength
    const continentHeight = boundary.height * cellLength

    // 계산된 대륙 크기를 상위 컴포넌트로 전달
    useEffect(() => {
        if (onContinentSizeCalculated) {
            onContinentSizeCalculated({
                width: continentWidth,
                height: continentHeight,
                boundary
            })
        }
    }, [continentWidth, continentHeight, boundary, onContinentSizeCalculated])

    return (
        <group>
            {placements.map((placement) => (
                <TerritoryArea
                    key={placement.investor.id}
                    placement={placement}
                    cellLength={cellLength}
                    continentalTotalInvestmentAmount={0}
                    onTileClick={onTileClick}
                />
            ))}
        </group>
    )
}
```

### 4.2 단계 3-4: 중앙 및 타 대륙의 꼭짓점 계산

```typescript
// 새로운 유틸리티 함수 (continentUtils.ts)
export function calculateContinentCorners(continent, size) {
    const halfWidth = size.width / 2
    const halfHeight = size.height / 2

    // 중앙 대륙의 꼭짓점 계산
    if (continent.id === "central") {
        return {
            northWest: [-halfWidth, halfHeight, 0],
            northEast: [halfWidth, halfHeight, 0],
            southWest: [-halfWidth, -halfHeight, 0],
            southEast: [halfWidth, -halfHeight, 0]
        }
    }

    // 다른 대륙의 경우, 위치에 따라 연결될 꼭짓점 계산
    const position = [continent.position_x, continent.position_y, continent.position_z]

    // 대륙 ID에 따라 중앙 대륙과 연결될 꼭짓점 반환
    // 이슈 설명의 4번 단계에 맞게 다음과 같은 연결 관계 설정:
    switch (continent.id) {
        case "northwest":
            // 북서 대륙의 오른쪽 아래(남동) 꼭짓점이 중앙 대륙의 왼쪽 위(북서) 꼭짓점과 일치
            return { connectPoint: [halfWidth, -halfHeight, 0] } // 남동 꼭짓점
        case "northeast":
            // 북동 대륙의 왼쪽 아래(남서) 꼭짓점이 중앙 대륙의 오른쪽 위(북동) 꼭짓점과 일치
            return { connectPoint: [-halfWidth, -halfHeight, 0] } // 남서 꼭짓점
        case "southwest":
            // 남서 대륙의 오른쪽 위(북동) 꼭짓점이 중앙 대륙의 왼쪽 아래(남서) 꼭짓점과 일치
            return { connectPoint: [halfWidth, halfHeight, 0] } // 북동 꼭짓점
        case "southeast":
            // 남동 대륙의 왼쪽 위(북서) 꼭짓점이 중앙 대륙의 오른쪽 아래(남동) 꼭짓점과 일치
            return { connectPoint: [-halfWidth, halfHeight, 0] } // 북서 꼭짓점
        default:
            return { connectPoint: [0, 0, 0] }
    }
}
```

### 4.3 단계 5-6: 타 대륙의 배치 공간 계산 및 배치

```typescript
// WorldScene.tsx 파일 수정
function WorldScene() {
    const { continents } = useContinentStore();
    const { getFilteredInvestorListByContinent } = useInvestorStore();

    // 각 대륙의 크기 정보를 저장할 상태
    const [continentSizes, setContinentSizes] = useState({});

    // 중앙 대륙 찾기
    const centralContinent = useMemo(() => {
        return Object.values(continents).find(c => c.id === "central");
    }, [continents]);

    // 다른 대륙들 (북서, 북동, 남서, 남동)
    const otherContinents = useMemo(() => {
        return Object.values(continents).filter(c => c.id !== "central");
    }, [continents]);

    // 중앙 대륙의 크기 정보가 계산되면 호출되는 함수
    const handleCentralContinentSizeCalculated = useCallback((size) => {
        setContinentSizes(prev => ({
            ...prev,
            central: size
        }));
    }, []);

    // 다른 대륙의 크기 정보가 계산되면 호출되는 함수
    const handleOtherContinentSizeCalculated = useCallback((id, size) => {
        setContinentSizes(prev => ({
            ...prev,
            [id]: size
        }));
    }, []);

    // 중앙 대륙의 꼭짓점 계산
    const centralCorners = useMemo(() => {
        if (!centralContinent || !continentSizes.central) return null;
        return calculateContinentCorners(centralContinent, continentSizes.central);
    }, [centralContinent, continentSizes.central]);

    // 단계 5-6: 타 대륙의 배치 공간 계산 및 배치 함수
    const calculateContinentPosition = useCallback((continent, centralCorners) => {
        // 중앙 대륙의 꼭짓점 정보나 해당 대륙의 크기 정보가 없으면 기존 위치 사용
        if (!centralCorners || !continentSizes[continent.id]) return [
            continent.position_x,
            continent.position_y,
            continent.position_z
        ];

        // 단계 4: 해당 대륙의 꼭짓점 계산
        const corners = calculateContinentCorners(continent, continentSizes[continent.id]);

        // 단계 5: 타 대륙의 꼭짓점을 기준으로 배치할 공간 계산
        // 중앙 대륙의 꼭짓점과 타 대륙의 연결 지점을 맞추기 위한 위치 계산
        switch (continent.id) {
            case "northwest":
                // 북서 대륙의 오른쪽 아래(남동) 꼭짓점이 중앙 대륙의 왼쪽 위(북서) 꼭짓점과 일치하도록 위치 계산
                return [
                    centralCorners.northWest[0] - corners.connectPoint[0],
                    centralCorners.northWest[1] - corners.connectPoint[1],
                    continent.position_z
                ];
            case "northeast":
                // 북동 대륙의 왼쪽 아래(남서) 꼭짓점이 중앙 대륙의 오른쪽 위(북동) 꼭짓점과 일치하도록 위치 계산
                return [
                    centralCorners.northEast[0] - corners.connectPoint[0],
                    centralCorners.northEast[1] - corners.connectPoint[1],
                    continent.position_z
                ];
            case "southwest":
                // 남서 대륙의 오른쪽 위(북동) 꼭짓점이 중앙 대륙의 왼쪽 아래(남서) 꼭짓점과 일치하도록 위치 계산
                return [
                    centralCorners.southWest[0] - corners.connectPoint[0],
                    centralCorners.southWest[1] - corners.connectPoint[1],
                    continent.position_z
                ];
            case "southeast":
                // 남동 대륙의 왼쪽 위(북서) 꼭짓점이 중앙 대륙의 오른쪽 아래(남동) 꼭짓점과 일치하도록 위치 계산
                return [
                    centralCorners.southEast[0] - corners.connectPoint[0],
                    centralCorners.southEast[1] - corners.connectPoint[1],
                    continent.position_z
                ];
            default:
                return [
                    continent.position_x,
                    continent.position_y,
                    continent.position_z
                ];
        }
    }, [continentSizes]);

    return (
        <>
            {/* 전역 조명 */}
            <ambientLight intensity={0.8} />
            <pointLight position={[20, 20, 20]} intensity={1} />
            <pointLight position={[-20, -20, 20]} intensity={0.5} />

            {/* 중앙 대륙 렌더링 */}
            {centralContinent && (
                <SingleContinent
                    key={centralContinent.id}
                    continent={centralContinent}
                    investorList={getFilteredInvestorListByContinent(centralContinent.id)}
                    onContinentSizeCalculated={handleCentralContinentSizeCalculated}
                />
            )}

            {/* 단계 6: 계산된 위치를 사용하여 주변 대륙 배치 */}
            {centralCorners && otherContinents.map((continent) => {
                // 단계 5에서 계산한 위치 정보를 사용하여 타 대륙의 최종 위치 결정
                const position = calculateContinentPosition(continent, centralCorners);

                return (
                    <SingleContinent
                        key={continent.id}
                        continent={{
                            ...continent,
                            position_x: position[0],
                            position_y: position[1],
                            position_z: position[2]
                        }}
                        investorList={getFilteredInvestorListByContinent(continent.id)}
                        onContinentSizeCalculated={(size) => handleOtherContinentSizeCalculated(continent.id, size)}
                    />
                );
            })}
        </>
    );
}
```

### 4.4 구현을 위한 SingleContinent 컴포넌트 수정

```typescript
// SingleContinent.tsx 파일 수정
function SingleContinent({ 
    continent, 
    investorList,
    onContinentSizeCalculated
}) {
    const { updateContinentUsers } = useContinentStore()

    // Supabase 데이터 구조에 맞게 position 처리
    const position: [number, number, number] = [
        continent.position_x || 0,
        continent.position_y || 0,
        continent.position_z || 0
    ]

    const continentLength = useMemo(() => {
        return continent.id !== "central"
            ? CONTINENT_DEFAULT_LENGTH
            : CONTINENT_DEFAULT_LENGTH * 1.2;
    }, [continent]);

    // 투자자 수 업데이트
    useEffect(() => {
        if (updateContinentUsers) {
            updateContinentUsers(continent.id, investorList.length)
        }
    }, [continent.id, investorList.length, updateContinentUsers])

    // 단계 2: 계산된 placement를 통해 대륙의 크기를 얻고 상위 컴포넌트로 전달
    const handleContinentSizeCalculated = useCallback((size) => {
        if (onContinentSizeCalculated) {
            onContinentSizeCalculated(size);
        }
    }, [onContinentSizeCalculated]);

    return (
        <group position={position}>
            {/* 대륙 기본 모양 */}
            {investorList.length === 0 && <mesh>
                <boxGeometry args={[continentLength, continentLength, 1]} />
                <meshStandardMaterial
                    color={continent.color}
                    opacity={0.9}
                    transparent={true}
                    roughness={0.7}
                    metalness={0.3}
                />
            </mesh>}

            {/* 투자자 영역 시스템 */}
            {investorList.length !== 0 && <TerritorySystem
                investorList={investorList}
                maxUserCount={continent.max_users}
                cellLength={continentLength / continent.max_users}
                onTileClick={(investorId) => { }}
                onContinentSizeCalculated={handleContinentSizeCalculated}
            />}
        </group>
    )
}
```

## 5. 예상되는 결과 및 이점

이 개선된 접근 방식을 통해 다음과 같은 결과와 이점을 얻을 수 있습니다:

1. **정확한 대륙 크기**: 투자자 영역의 실제 크기에 맞게 대륙의 크기가 결정됩니다.
2. **일관된 배치**: 중앙 대륙의 꼭짓점과 다른 대륙의 꼭짓점이 맞춰지므로, 대륙 간의 관계가 시각적으로 명확해집니다.
3. **기존 알고리즘 유지**: 기존의 영역 배치 알고리즘은 그대로 유지되므로, 투자자 영역의 배치 방식은 변경되지 않습니다.
4. **유연한 확장성**: 새로운 대륙이 추가되더라도 동일한 방식으로 배치할 수 있습니다.

이 접근 방식은 기존 알고리즘을 유지하면서도, 대륙 간의 관계를 시각적으로 명확하게 표현할 수 있는 장점이 있습니다. 특히, 중앙 대륙을 중심으로 다른 대륙들이 일관되게 배치되므로, 사용자가 전체 구조를 쉽게 이해할 수 있습니다.
