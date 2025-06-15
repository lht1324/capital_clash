import {Continent, useContinentStore} from "@/store/continentStore";
import {memo, useEffect, useMemo} from "react";
import TerritorySystem from "@/components/continent_map/TerritorySystem";
import {Investor} from "@/store/investorsStore";

const CONTINENT_DEFAULT_LENGTH = 20 // 셀 크기 2배 증가
function SingleContinent({ continent, investorList }: { continent: Continent, investorList: Investor[] }) {
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

    return (
        <group position={position}>
            {/* 대륙 기본 모양 */}
            {investorList.length === 0 && <mesh>
                <boxGeometry args={[continentLength, continentLength, 1]} /> {/* 대륙 크기 2배 증가 */}
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
            />}
        </group>
    )
}

export default memo(SingleContinent);