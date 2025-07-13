import {useFrame, useThree} from "@react-three/fiber";
import {memo, useCallback, useEffect, useMemo, useRef, useState} from "react";
import * as THREE from 'three'
import {useContinentStore} from "@/store/continentStore";
import {usePlayersStore} from "@/store/playersStore";
import {useCameraStateStore} from "@/store/cameraStateStore";
import {Position} from "@/lib/spiralPlacementAlgorithm";
import {getWorldViewPositionZ} from "@/utils/cameraUtils";

function CameraController({
    initialPosition
}: {
    initialPosition: Position | null,
}) {
    const { camera, gl } = useThree();
    const { continentList } = useContinentStore();
    const {
        placementResultRecord,
        continentPositionRecord,
        screenSize: { screenWidth, screenHeight },
    } = usePlayersStore();
    const {
        selectedContinentId,
        isWorldView,
        setSelectedContinentId,
        setWorldView,
        cameraTarget,
        setCameraTarget
    } = useCameraStateStore();

    const [isDragging, setIsDragging] = useState(false);
    const [currentCameraPosition, setCurrentCameraPosition] = useState({ x: 0, y: 0 });
    const previousMouse = useRef({ x: 0, y: 0 });
    const cameraPosition = useRef(new THREE.Vector3());
    const targetPosition = useRef(new THREE.Vector3());
    
    // 모바일 핀치 줌을 위한 상태
    const [isPinching, setIsPinching] = useState(false);
    const initialPinchDistance = useRef(0);
    const lastPinchDistance = useRef(0);

    const nearestContinentId = useMemo(() => {
        let nearestContinent: string | null = null;
        let minDistance = Infinity;

        const cameraMidpoint = currentCameraPosition;

        continentList.forEach((continent) => {
            const continentMidpoint = continentPositionRecord[continent.id];

            if (continentMidpoint) {
                const distanceX = cameraMidpoint.x - continentMidpoint.x;
                const distanceY = cameraMidpoint.y - continentMidpoint.y;
                const midpointDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                if (!nearestContinent || (nearestContinent && minDistance > midpointDistance)) {
                    minDistance = midpointDistance;
                    nearestContinent = continent.id;
                }
            }
        });

        return nearestContinent;
    }, [continentList, continentPositionRecord, currentCameraPosition]);

    const maxZ = useMemo(() => {
        return getWorldViewPositionZ(
            continentList,
            placementResultRecord,
            continentPositionRecord,
            screenWidth,
            screenHeight,
        ) * 1.2;
    }, [continentList, placementResultRecord, continentPositionRecord, screenWidth, screenHeight]);

    useEffect(() => {
        if (nearestContinentId && nearestContinentId !== selectedContinentId) {
            setSelectedContinentId(nearestContinentId)
            setWorldView(false)
        }

        if (!nearestContinentId && !isWorldView) {
            setWorldView(true)
        }
    }, [nearestContinentId, selectedContinentId]);

    // Canvas 마우스 이벤트 설정
    const handlePointerDown = useCallback((event: PointerEvent) => {
        event.preventDefault()
        setIsDragging(true)
        previousMouse.current = {
            x: event.clientX,
            y: event.clientY
        }
    }, []);

    const handlePointerMove = useCallback((event: PointerEvent) => {
        if (!isDragging || event.pointerType === 'touch') return

        const deltaX = event.clientX - previousMouse.current.x
        const deltaY = event.clientY - previousMouse.current.y

        previousMouse.current = {
            x: event.clientX,
            y: event.clientY
        }

        // 트랙패드 감지: 작은 움직임이 연속적으로 오면 트랙패드
        const isTrackpad = Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5;
        const movementSpeed = isTrackpad ? 0.09 : 0.03; // 트랙패드일 때 3배 더 빠르게
        
        targetPosition.current.x -= deltaX * movementSpeed
        targetPosition.current.y += deltaY * movementSpeed
    }, [isDragging]);

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
    }, [])

    const handleWheel = useCallback((event: WheelEvent) => {
        event.preventDefault();
        
        // 트랙패드 감지: deltaY가 작고 연속적이면 트랙패드
        const isTrackpad = Math.abs(event.deltaY) < 10;
        const zoomSpeed = isTrackpad ? 0.18 : 0.015; // 트랙패드일 때 12배 더 민감하게
        
        // targetPosition.current.z += event.deltaY * zoomSpeed;
        // // Z축 제한 범위를 기존대로 복원
        // targetPosition.current.z = Math.max(20, Math.min(maxZ, targetPosition.current.z));

        // Z축 제한 범위를 기존대로 복원
        const newZ = targetPosition.current.z + event.deltaY * zoomSpeed;
        targetPosition.current.z = Math.max(20, Math.min(maxZ, newZ));
    }, [maxZ]);

    // 모바일 터치 이벤트 핸들러들
    const handleTouchStart = useCallback((event: TouchEvent) => {
        event.preventDefault();
        
        if (event.touches.length === 2) {
            // 핀치 줌 시작
            setIsPinching(true);
            setIsDragging(false);
            
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const distance = Math.sqrt(
                Math.pow(touch1.clientX - touch2.clientX, 2) + 
                Math.pow(touch1.clientY - touch2.clientY, 2)
            );
            
            initialPinchDistance.current = distance;
            lastPinchDistance.current = distance;
        } else if (event.touches.length === 1 && !isPinching) {
            // 단일 터치 드래그 시작
            setIsDragging(true);
            const touch = event.touches[0];
            previousMouse.current = {
                x: touch.clientX,
                y: touch.clientY
            };
        }
    }, [isPinching]);

    const handleTouchMove = useCallback((event: TouchEvent) => {
        event.preventDefault();
        
        if (event.touches.length === 2 && isPinching) {
            // 핀치 줌 처리
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            const currentDistance = Math.sqrt(
                Math.pow(touch1.clientX - touch2.clientX, 2) + 
                Math.pow(touch1.clientY - touch2.clientY, 2)
            );

            const deltaDistance = currentDistance - lastPinchDistance.current;
            const zoomSpeed = 0.15; // 모바일 핀치 줌 속도

            const newZ = targetPosition.current.z - deltaDistance * zoomSpeed;
            targetPosition.current.z = Math.max(20, Math.min(maxZ, newZ));
            
            lastPinchDistance.current = currentDistance;
        } else if (event.touches.length === 1 && isDragging && !isPinching) {
            // 단일 터치 드래그 처리
            const touch = event.touches[0];
            const deltaX = touch.clientX - previousMouse.current.x;
            const deltaY = touch.clientY - previousMouse.current.y;
            
            previousMouse.current = {
                x: touch.clientX,
                y: touch.clientY
            };

            const movementSpeed = 0.09; // 모바일 터치 드래그 속도
            targetPosition.current.x -= deltaX * movementSpeed;
            targetPosition.current.y += deltaY * movementSpeed;
        }
    }, [isDragging, isPinching, maxZ]);

    const handleTouchEnd = useCallback((event: TouchEvent) => {
        if (event.touches.length < 2) {
            setIsPinching(false);
        }
        if (event.touches.length === 0) {
            setIsDragging(false);
        }
    }, []);

    useEffect(() => {
        if (!initialPosition) return;

        const { x, y, z } = initialPosition;

        targetPosition.current.set(x, y, z);
        cameraPosition.current.copy(targetPosition.current);
        camera.position.copy(targetPosition.current);
    }, [initialPosition, camera]);

    // 드롭다운 선택에 따른 카메라 이동 처리
    useEffect(() => {
        if (cameraTarget) {
            const { x, y, z } = cameraTarget;
            console.log('드롭다운 선택으로 카메라 이동:', x, y, z)
            targetPosition.current.set(x, y, z)
            setCameraTarget(null)
        }
    }, [cameraTarget, setCameraTarget]);

    useEffect(() => {
        const canvas = gl.domElement
        const isHorizontalScreen = screenWidth >= screenHeight;
        
        // 기존 이벤트들
        canvas.addEventListener('pointerdown', handlePointerDown)
        canvas.addEventListener('wheel', handleWheel)
        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('pointerup', handlePointerUp)

        // 모바일 터치 이벤트들
        if (!isHorizontalScreen) {
            canvas.addEventListener('touchstart', handleTouchStart, { passive: true })
            canvas.addEventListener('touchmove', handleTouchMove, { passive: true })
            canvas.addEventListener('touchend', handleTouchEnd, { passive: true })
        }

        return () => {
            canvas.removeEventListener('pointerdown', handlePointerDown)
            canvas.removeEventListener('wheel', handleWheel)
            document.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('pointerup', handlePointerUp)

            if (!isHorizontalScreen) {
                canvas.removeEventListener('touchstart', handleTouchStart)
                canvas.removeEventListener('touchmove', handleTouchMove)
                canvas.removeEventListener('touchend', handleTouchEnd)
            }
        }
    }, [gl, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, screenWidth, screenHeight]);

    useFrame(() => {
        setCurrentCameraPosition((prevPosition: { x: number, y: number }) => {
            const isXPosChanged = prevPosition.x.toFixed(1) !== camera.position.x.toFixed(1)
            const isYPosChanged = prevPosition.y.toFixed(1) !== camera.position.y.toFixed(1)

            if (isXPosChanged || isYPosChanged) {
                return { x: camera.position.x, y: camera.position.y };
            } else {
                return prevPosition;
            }
        });
        cameraPosition.current.lerp(targetPosition.current, 0.12);
        // cameraPosition.current.lerp(targetPosition.current, 1.2);
        camera.position.copy(cameraPosition.current);
    })

    return null
}

export default memo(CameraController)