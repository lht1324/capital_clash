'use client'

import * as THREE from "three";
import {memo, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Placement} from "@/lib/spiralPlacementAlgorithm";
import {PlayersStore, usePlayersStore} from "@/store/playersStore";

// 🌳 NEW: 개별 영역 컴포넌트 (직사각형) - 최적화된 버전
function TerritoryArea({
    placement,
    cellLength,
    onTileClick
}: {
    placement: Placement,
    cellLength: number,
    onTileClick: () => void
}) {
    const meshRef = useRef<THREE.Mesh>(null)
    const imageMeshRef = useRef<THREE.Mesh>(null)
    const [hovered, setHovered] = useState(false)
    const [imageTexture, setImageTexture] = useState<THREE.Texture | null>(null)

    const selectPlayer = useCallback((state: PlayersStore) => {
        return state.players[placement.playerId];
    }, [placement.playerId])

    const player = usePlayersStore(selectPlayer);

    if (!player) return null;

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

    const linearColor = useMemo(() => {
        return new THREE.Color(player.area_color).convertSRGBToLinear();
    }, [player.area_color]);

    useEffect(() => {
        if (player.image_url && player.image_status === "approved") {
            const loader = new THREE.TextureLoader()
            loader.load(
                player.image_url,
                (loadedTexture) => {
                    loadedTexture.flipY = true
                    setImageTexture(loadedTexture)
                },
                undefined,
                (error) => {
                    console.error(`❌ 텍스처 로드 실패:`, error)
                }
            )
        } else {
            setImageTexture(null);
        }
    }, [player.image_url, player.image_status]);

    return (
        <group position={[x, y, 1.1]}>
            {/* 🌳 NEW: 기본 직사각형 베이스 - 최적화된 애니메이션 */}
            {!imageTexture && (
                <>
                    <mesh
                        ref={meshRef}
                        position={[0, 0, baseZ]}
                        scale={[baseScale, baseScale, baseScale]}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
                        onClick={() => {
                            if (!imageTexture) {
                                onTileClick();
                            }
                        }}
                    >
                        <boxGeometry args={[width, height, 0.2]} />
                        <meshStandardMaterial
                            color={linearColor}
                            opacity={hovered ? 1.0 : 0.9}
                            transparent={!hovered}
                        />
                    </mesh>
                    {/* 테두리 선 */}
                    <lineSegments
                        position={[0, 0, baseZ + 0.01]}
                        scale={[baseScale, baseScale, baseScale]}
                    >
                        <edgesGeometry args={[new THREE.BoxGeometry(width, height, 0.2)]} />
                        {/*<lineBasicMaterial color="white" linewidth={1} />*/}
                        <lineBasicMaterial color="white" opacity={0.8} linewidth={1} />
                    </lineSegments>
                </>
            )}

            {/* 🌳 NEW: 프로필 이미지 - 공통 텍스처 사용 */}
            {imageTexture && (
                <>
                    <mesh
                        ref={imageMeshRef}
                        position={[0, 0, imageZ]}
                        scale={[baseScale, baseScale, baseScale]}
                        onPointerOver={() => setHovered(true)}
                        onPointerOut={() => setHovered(false)}
                        onClick={() => {
                            onTileClick();
                        }}
                    >
                        <planeGeometry args={[width, height]} />
                        <meshBasicMaterial
                            map={imageTexture}
                            transparent={true}
                            opacity={1.0}
                        />
                    </mesh>
                    {/* 이미지 테두리 선 */}
                    <lineSegments
                        position={[0, 0, imageZ + 0.01]}
                        scale={[baseScale, baseScale, baseScale]}
                    >
                        <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
                        <lineBasicMaterial color="white" opacity={0.8}  linewidth={1} />
                    </lineSegments>
                </>
            )}

            {/* 🌳 NEW: 호버 시 투자자 정보 표시 (큰 직사각형에만) */}
            {hovered && (
                <group position={[0, height / 4, 0.5]}>
                    <mesh>
                        <planeGeometry args={[width * 0.8, height * 0.3]} />
                        <meshBasicMaterial color="black" opacity={0.7} transparent />
                    </mesh>
                    {/* 투자자 이름 텍스트 렌더링 */}
                    <TextPlane 
                        text={player.name}
                        width={width * 0.8}
                        height={height * 0.3}
                        position={[0, 0, 0.01]} 
                    />
                </group>
            )}
        </group>
    )
}

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

export default memo(TerritoryArea);
