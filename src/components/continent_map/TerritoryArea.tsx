import * as THREE from "three";
import {memo, useEffect, useMemo, useRef, useState} from "react";
import {Placement} from "@/lib/treemapAlgorithm";

// 텍스트를 Canvas에 그리고, 이를 텍스처로 변환하는 함수
function createTextCanvas(text: string, width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    if (context) {
        // 캔버스 초기화
        context.fillStyle = 'transparent';
        context.fillRect(0, 0, width, height);

        // 텍스트 스타일 설정
        context.fillStyle = 'white';
        context.font = `bold ${Math.floor(height / 3)}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // 텍스트가 너무 길면 두 줄로 나누기
        const maxWidth = width * 0.9;
        if (context.measureText(text).width > maxWidth) {
            // 텍스트를 단어 단위로 분할
            const words = text.split(' ');
            let line1 = '';
            let line2 = '';
            let currentLine = '';

            // 첫 번째 줄에 최대한 많은 단어를 넣기
            for (let i = 0; i < words.length; i++) {
                const testLine = currentLine + words[i] + ' ';
                if (context.measureText(testLine).width <= maxWidth) {
                    currentLine = testLine;
                } else {
                    // 첫 번째 줄이 채워졌으면, 나머지는 두 번째 줄로
                    line1 = currentLine.trim();
                    line2 = words.slice(i).join(' ');
                    break;
                }

                // 모든 단어가 첫 번째 줄에 들어가면
                if (i === words.length - 1) {
                    line1 = currentLine.trim();
                }
            }

            // 두 줄 텍스트 그리기
            context.fillText(line1, width / 2, height / 2 - height / 6);
            if (line2) {
                context.fillText(line2, width / 2, height / 2 + height / 6);
            }
        } else {
            // 한 줄로 충분한 경우
            context.fillText(text, width / 2, height / 2);
        }
    }

    return canvas;
}

// 텍스트를 렌더링하는 컴포넌트
function TextPlane({ text, width, height, position }: { text: string, width: number, height: number, position: [number, number, number] }) {
    const [textTexture, setTextTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        // 텍스트 캔버스 생성
        const canvas = createTextCanvas(text, width * 100, height * 100);

        // 캔버스를 텍스처로 변환
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        setTextTexture(texture);

        // 컴포넌트 언마운트 시 텍스처 해제
        return () => {
            texture.dispose();
        };
    }, [text, width, height]);

    if (!textTexture) return null;

    return (
        <mesh position={position}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial map={textTexture} transparent opacity={1} />
        </mesh>
    );
}

// 🌳 NEW: 개별 영역 컴포넌트 (직사각형) - 최적화된 버전
function TerritoryArea(
    {
        placement,
        cellLength,
        onTileClick
    }: {
        placement: Placement,
        cellLength: number,
        onTileClick: (investorId: string, dailyViews: number[]) => void
    }
) {
    const meshRef = useRef<THREE.Mesh>(null)
    const imageMeshRef = useRef<THREE.Mesh>(null)
    const [hovered, setHovered] = useState(false)
    const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null)

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
        if (placement.investor.image_url) {
            const loader = new THREE.TextureLoader()
            const randomId: number = Math.floor(Math.random() * 30);
            loader.load(
                // `https://picsum.photos/id/${randomId}/800/800`,
                placement.investor.image_url,
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
        }
    }, [])

    return (
        <group position={[x, y, 1.1]}>
            {/* 🌳 NEW: 기본 직사각형 베이스 - 최적화된 애니메이션 */}
            {!imageTexture && <mesh
                ref={meshRef}
                position={[0, 0, baseZ]}
                scale={[baseScale, baseScale, baseScale]}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={() => {
                    if (!imageTexture) {
                        console.log(`(Calc) name = ${placement.investor.name}, (x, y) = (${placement.x}, ${placement.y}), size = ${placement.width}x${placement.height}, cellLength = ${cellLength}`)
                        onTileClick(placement.investor.id, placement.investor.daily_views)
                    }
                }}
            >
                <boxGeometry args={[width, height, 0.2]} />
                <meshStandardMaterial
                    color={placement.investor.area_color}
                    opacity={hovered ? 1.0 : 0.9}
                    transparent={!hovered}
                    // roughness={0.3}
                    // metalness={0.1}
                />
            </mesh>}

            {/* 🌳 NEW: 프로필 이미지 - 공통 텍스처 사용 */}
            {imageTexture && (
                <mesh
                    ref={imageMeshRef}
                    position={[0, 0, imageZ]}
                    scale={[baseScale, baseScale, baseScale]}
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                    onClick={() => {
                        console.log(`(Calc) name = ${placement.investor.name}, (x, y) = (${placement.x}, ${placement.y}), size = ${placement.width}x${placement.height}, cellLength = ${cellLength}`)
                        onTileClick(placement.investor.id, placement.investor.daily_views)
                    }}
                >
                    <planeGeometry args={[width, height]} />
                    <meshBasicMaterial
                        map={imageTexture}
                        transparent={true}
                        opacity={1.0}
                    />
                </mesh>
            )}

            {/* 🌳 NEW: 호버 시 투자자 정보 표시 (큰 직사각형에만) */}
            {hovered && placement.investor.name && (
                <group position={[0, height / 4, 0.5]}>
                    <mesh>
                        <planeGeometry args={[width * 0.8, height * 0.3]} />
                        <meshBasicMaterial color="black" opacity={0.7} transparent />
                    </mesh>
                    {/* 투자자 이름 텍스트 렌더링 */}
                    <TextPlane 
                        text={placement.investor.name} 
                        width={width * 0.8}
                        height={height * 0.3}
                        position={[0, 0, 0.01]} 
                    />
                </group>
            )}
        </group>
    )
}

export default memo(TerritoryArea);
