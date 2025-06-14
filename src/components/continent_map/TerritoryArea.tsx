import * as THREE from "three";
import {memo, useEffect, useMemo, useRef, useState} from "react";

// 🌳 NEW: 개별 영역 컴포넌트 (직사각형) - 최적화된 버전
function TerritoryArea(
    {
        placement,
        cellLength,
        onTileClick
    }: {
        placement: any,
        boundary: any,
        cellLength: number,
        onTileClick: (investorId: string) => void
    }
) {
    const meshRef = useRef<THREE.Mesh>(null)
    const imageMeshRef = useRef<THREE.Mesh>(null)
    const [hovered, setHovered] = useState(false)
    const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null)

    // 🌳 NEW: Treemap 좌표를 3D 좌표로 변환 (직사각형)
    const width = useMemo(() => {
        return placement.width * cellLength;
    }, [placement.width, cellLength])
    const height = useMemo(() => {
        return placement.height * cellLength;
    }, [placement.height, cellLength])
    const x = useMemo(() => {
        return (placement.x + placement.width / 2) * cellLength;
    }, [placement.width, cellLength])
    const y = useMemo(() => {
        return -(placement.y + placement.height / 2) * cellLength;
    }, [placement.width, cellLength])

    // 🚀 호버 시에만 간단한 CSS 변환 사용
    const baseScale = useMemo(() => {
        return hovered ? 1.05 : 1.0;
    }, [hovered])
    const baseZ = useMemo(() => {
        return hovered ? 0.15 : 0.1;
    }, [hovered]);
    const imageZ = useMemo(() => {
        return hovered ? 0.35 : 0.3;
    }, [hovered]);

    useEffect(() => {
        const loader = new THREE.TextureLoader()
        const randomId: number = Math.floor(Math.random() * 30);
        loader.load(
            // '/test.jpg',
            `https://picsum.photos/id/${randomId}/800/800`,
            (loadedTexture) => {
                loadedTexture.flipY = true
                setImageTexture(loadedTexture)
                console.log(`🚀 공통 텍스처 로드 완료: test.jpg`)
            },
            undefined,
            (error) => {
                console.log(`randomId = ${randomId}`)
                console.error(`❌ 공통 텍스처 로드 실패:`, error)
            }
        )
    }, [])

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
                    // roughness={0.3}
                    metalness={0.1}
                />
            </mesh>

            {/* 🌳 NEW: 프로필 이미지 - 공통 텍스처 사용 */}
            {imageTexture && (
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
                    <meshBasicMaterial
                        map={imageTexture}
                        transparent={false}
                        opacity={1.0}
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
