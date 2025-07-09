import {useFrame, useThree} from "@react-three/fiber";
import {memo, useCallback, useEffect, useMemo, useRef, useState} from "react";
import * as THREE from 'three'
import {useContinentStore} from "@/store/continentStore";
import {usePlayersStore} from "@/store/playersStore";
import {useCameraStateStore} from "@/store/cameraStateStore";
import {Position} from "@/lib/spiralPlacementAlgorithm";

function CameraController({
    initialPosition
}: {
    initialPosition: Position | null,
}) {
    const { camera, gl } = useThree();
    const { continentList } = useContinentStore();
    const { continentPositionRecord } = usePlayersStore();
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
        if (!isDragging) return

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
        
        targetPosition.current.z += event.deltaY * zoomSpeed;
        // Z축 제한 범위를 기존대로 복원
        targetPosition.current.z = Math.max(20, Math.min(100, targetPosition.current.z));
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
    }, [cameraTarget, setCameraTarget])

    useEffect(() => {
        const canvas = gl.domElement
        canvas.addEventListener('pointerdown', handlePointerDown)
        canvas.addEventListener('wheel', handleWheel)

        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('pointerup', handlePointerUp)

        return () => {
            canvas.removeEventListener('pointerdown', handlePointerDown)
            canvas.removeEventListener('wheel', handleWheel)
            document.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('pointerup', handlePointerUp)
        }
    }, [gl, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel])

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
        camera.position.copy(cameraPosition.current);
    })

    return null
}

export default memo(CameraController)