import {Continent, useContinentStore} from "@/store/continentStore";
import {memo, useEffect} from "react";
import TerritorySystem from "@/components/continent_map/TerritorySystem";
import {Investor} from "@/store/investorsStore";

const CELL_SIZE = 0.8 // 셀 크기 2배 증가
function SingleContinent({ continent, investorList }: { continent: Continent, investorList: Investor[] }) {
    const { updateContinentUsers } = useContinentStore()

    // Supabase 데이터 구조에 맞게 position 처리
    const position: [number, number, number] = [
        continent.position_x || 0,
        continent.position_y || 0,
        continent.position_z || 0
    ]

    const continentLength = 20;

    // 스토어에서 실제 투자자 데이터 가져오기
    // const investorsList = Object.values(continent.investors || {})

    // 투자자 수 업데이트
    useEffect(() => {
        if (updateContinentUsers) {
            updateContinentUsers(continent.id, investorList.length)
        }
    }, [continent.id, investorList.length, updateContinentUsers])

    console.log("length", (continentLength / continent.max_users))
    return (
        <group position={position}>
            {/* 대륙 기본 모양 */}
            <mesh>
                <boxGeometry args={[continentLength, continentLength, 1]} /> {/* 대륙 크기 2배 증가 */}
                <meshStandardMaterial
                    color={continent.color}
                    opacity={0.9}
                    transparent={true}
                    roughness={0.7}
                    metalness={0.3}
                />
            </mesh>

            {/* 투자자 영역 시스템 */}
            <TerritorySystem
                investorList={investorList}
                maxUserCount={continent.max_users}
                cellLength={continentLength / continent.max_users}
                onTileClick={(investorId) => { }}
                continentId={continent.id}
            />
        </group>
    )
}

export default memo(SingleContinent);