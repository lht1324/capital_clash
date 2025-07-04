'use client'

import {memo, useMemo} from "react";
import SingleContinent from "@/components/main/continent_map/SingleContinent";
import * as THREE from "three";
import {useContinentStore} from "@/store/continentStore";
import {usePlayersStore} from "@/store/playersStore";

function WorldScene({
    onTileClick,
}: {
    onTileClick: (playerId: string) => void;
}) {
    const { continentList } = useContinentStore();
    const { placementResultRecord, continentPositionRecord } = usePlayersStore();

    // 전체 화면을 커버하는 격자 무늬 생성
    const gridLines = useMemo(() => {
        const geometries = [];
        const gridSize = 100; // 격자 크기 확장
        const gridStep = 2.5;  // 2.5 단위로 격자 생성 (10x10 크기로 보이도록 조정)

        // x축 방향 선 (-gridSize부터 gridSize까지)
        for (let y = -gridSize; y <= gridSize; y += gridStep) {
            const points = [
                new THREE.Vector3(-gridSize, y, 0.5),
                new THREE.Vector3(gridSize, y, 0.5)
            ];
            geometries.push(new THREE.BufferGeometry().setFromPoints(points));
        }

        // y축 방향 선 (-gridSize부터 gridSize까지)
        for (let x = -gridSize; x <= gridSize; x += gridStep) {
            const points = [
                new THREE.Vector3(x, -gridSize, 0.5),
                new THREE.Vector3(x, gridSize, 0.5)
            ];
            geometries.push(new THREE.BufferGeometry().setFromPoints(points));
        }

        return geometries;
    }, []);

    return (
        <>
            {/* 전역 조명 */}
            <ambientLight intensity={1}/>
            {/* 메모리 좀 많이 먹으면 이걸로 수정 */}
            {/*<directionalLight position={[-20, -20, 20]} intensity={1} />*/}
            {/*<directionalLight position={[-20, 20, 20]} intensity={1} />*/}
            {/*<directionalLight position={[20, -20, 20]} intensity={1} />*/}
            {/*<directionalLight position={[20, 20, 20]} intensity={1} />*/}
            {continentList.map((continent) => {
                const continentPosition = continentPositionRecord[continent.id];

                if (continentPosition) {
                    return <directionalLight key={continent.id} position={[continentPosition.x, continentPosition.y, 20]} intensity={1.2} />
                }
            })}
            {/* 전체 화면 격자 무늬 */}
            {gridLines.map((geometry, index) => (
                <primitive
                    key={`grid-line-${index}`}
                    object={new THREE.Line(
                        geometry,
                        new THREE.LineBasicMaterial({
                            color: "#2a5298",
                            opacity: 0.3,
                            transparent: true
                        })
                    )}
                />
            ))}

            {/* 모든 대륙 렌더링 */}
            {continentList.map((continent) => {
                if (placementResultRecord[continent.id]) {
                    return (
                        <SingleContinent
                            key={continent.id}
                            continent={continent}
                            onTileClick={onTileClick}
                        />
                    );
                }
            })}
        </>
    );
}

export default memo(WorldScene);
