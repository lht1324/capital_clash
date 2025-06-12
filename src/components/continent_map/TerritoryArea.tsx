import * as THREE from "three";
import {memo, useRef, useState} from "react";

// 🌳 NEW: 개별 영역 컴포넌트 (직사각형) - 최적화된 버전
function TerritoryArea(
    {
        placement,
        boundary,
        cellLength,
        onTileClick,
        sharedTexture
    }: {
        placement: any,
        boundary: any,
        cellLength: number,
        onTileClick: (investorId: string) => void,
        sharedTexture: THREE.Texture | null
    }
) {
    const meshRef = useRef<THREE.Mesh>(null)
    const imageMeshRef = useRef<THREE.Mesh>(null)
    const [hovered, setHovered] = useState(false)

    // 🚀 개별 애니메이션 제거 - 호버 상태만 관리
    // useFrame 제거로 50개 × 60fps = 3000회/초 → 0회/초

    // 🌳 NEW: Treemap 좌표를 3D 좌표로 변환 (직사각형)
    const width = placement.width * cellLength
    const height = placement.height * cellLength
    const x = (placement.x + placement.width/2) * cellLength
    const y = -(placement.y + placement.height/2) * cellLength

    // 🚀 호버 시에만 간단한 CSS 변환 사용
    const baseScale = hovered ? 1.05 : 1.0
    const baseZ = hovered ? 0.15 : 0.1
    const imageZ = hovered ? 0.35 : 0.3

    return (
        <group position={[x, y, 1.1]}>
            {/* 🌳 NEW: 기본 직사각형 베이스 - 최적화된 애니메이션 */}
            <mesh
                ref={meshRef}
                position={[0, 0, baseZ]}
                scale={[baseScale, baseScale, baseScale]}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={() => {
                    console.log(`🎯 ${placement.investor.name} 클릭: ${placement.width}×${placement.height} (지분: ${(placement.investor.share_percentage * 100).toFixed(1)}%, 비율: ${(placement.investor.ratio || 1).toFixed(2)})`)
                    onTileClick(placement.investor.id)
                }}
            >
                <boxGeometry args={[width, height, 0.2]} />
                <meshStandardMaterial
                    color={placement.investor.color}
                    opacity={hovered ? 1.0 : 0.9}
                    transparent={!hovered}
                    roughness={0.3}
                    metalness={0.1}
                />
            </mesh>

            {/* 🌳 NEW: 프로필 이미지 - 공통 텍스처 사용 */}
            {sharedTexture && (
                <mesh
                    ref={imageMeshRef}
                    position={[0, 0, imageZ]}
                    scale={[baseScale, baseScale, baseScale]}
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                    onClick={() => {
                        console.log(`🖼️ ${placement.investor.name} 이미지 클릭 (지분: ${(placement.investor.share_percentage * 100).toFixed(1)}%, 비율: ${(placement.investor.ratio || 1).toFixed(2)})`)
                        onTileClick(placement.investor.id)
                    }}
                >
                    <planeGeometry args={[width, height]} />
                    <meshStandardMaterial
                        map={sharedTexture}
                        transparent={false}
                        opacity={1.0}
                        roughness={0.1}
                        metalness={0.0}
                    />
                </mesh>
            )}

            {/* 🌳 NEW: 호버 시 투자자 정보 표시 (큰 직사각형에만) */}
            {hovered && placement.width * placement.height > 100 && (
                <group position={[0, height / 4, 0.5]}>
                    <mesh>
                        <planeGeometry args={[width * 0.8, height * 0.3]} />
                        <meshBasicMaterial color="black" opacity={0.7} transparent />
                    </mesh>
                    {/* TODO: 텍스트 렌더링은 나중에 추가 */}
                </group>
            )}
        </group>
    )
}

export default memo(TerritoryArea);