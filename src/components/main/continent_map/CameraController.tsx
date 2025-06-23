import {useFrame, useThree} from "@react-three/fiber";
import {memo, useCallback, useEffect, useMemo, useRef, useState} from "react";
import * as THREE from 'three'
import {useContinentStore} from "@/store/continentStore";

function CameraController() {
    const { camera, gl } = useThree()
    const {
        selectedContinentId,
        continents,
        isWorldView,
        setSelectedContinentId,
        setWorldView,
        cameraTarget,
        setCameraTarget,
        resetSelection
    } = useContinentStore()

    const [isDragging, setIsDragging] = useState(false)
    const [currentCameraPosition, setCurrentCameraPosition] = useState({ x: 0, y: 0 });
    const previousMouse = useRef({ x: 0, y: 0 })
    const cameraPosition = useRef(new THREE.Vector3(0, 20, 40))
    const targetPosition = useRef(new THREE.Vector3(0, 0, 40))

    const nearestContinentId = useMemo(() => {
        let nearestContinent: string | null = null;
        let minDistance = Infinity

        Object.values(continents).forEach((continent) => {
            const [x, y, z] = [continent.position_x, continent.position_y, continent.position_z]
            const distance = Math.sqrt(
                Math.pow(currentCameraPosition.x - x, 2) +
                Math.pow(currentCameraPosition.y - y, 2)
            )

            if (distance < minDistance && distance < 15) {
                minDistance = distance
                nearestContinent = continent.id
            }
        })

        return nearestContinent
    }, [currentCameraPosition]);

    useEffect(() => {
        if (nearestContinentId && nearestContinentId !== selectedContinentId) {
            const continent = continents[nearestContinentId]
            console.log('위치 기반 드롭다운 변경:', continent.name)
            setSelectedContinentId(nearestContinentId)
            setWorldView(false)
        }

        if (!nearestContinentId && !isWorldView) {
            console.log('세계 지도로 드롭다운 변경')
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
    }, [])

    const handlePointerMove = useCallback((event: PointerEvent) => {
        if (!isDragging) return

        const deltaX = event.clientX - previousMouse.current.x
        const deltaY = event.clientY - previousMouse.current.y

        previousMouse.current = {
            x: event.clientX,
            y: event.clientY
        }

        const movementSpeed = 0.03  // 0.1 → 0.03으로 조정
        targetPosition.current.x -= deltaX * movementSpeed
        targetPosition.current.y += deltaY * movementSpeed
    }, [isDragging])

    const handlePointerUp = useCallback(() => {
        setIsDragging(false)
        // 드래그 종료 시 즉시 위치 기반 업데이트 실행
        // updateDropdownBasedOnPosition()
    }, [])

    const handleWheel = useCallback((event: WheelEvent) => {
        event.preventDefault()
        const zoomSpeed = 0.015
        targetPosition.current.z += event.deltaY * zoomSpeed
        // Z축 제한 범위를 기존대로 복원
        targetPosition.current.z = Math.max(20, Math.min(100, targetPosition.current.z))
    }, [])

    // 초기 월드 뷰 설정 (컴포넌트 마운트 시 한 번)
    useEffect(() => {
        console.log('🏠 CameraController 초기화: 월드 뷰로 설정')
        // 카메라를 월드 뷰 위치로 설정
        targetPosition.current.set(0, -2.5, 60)
        cameraPosition.current.set(0, -2.5, 60)
        resetSelection()
    }, [])

    // 드롭다운 선택에 따른 카메라 이동 처리
    useEffect(() => {
        if (cameraTarget) {
            const [x, y, z] = cameraTarget
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
        // 부드러운 카메라 이동
        cameraPosition.current.lerp(targetPosition.current, 0.12)
        camera.position.copy(cameraPosition.current)
        setCurrentCameraPosition((prevPosition: { x: number, y: number }) => {
            const isXPosChanged = prevPosition.x.toFixed(1) !== camera.position.x.toFixed(1)
            const isYPosChanged = prevPosition.y.toFixed(1) !== camera.position.y.toFixed(1)

            if (isXPosChanged || isYPosChanged) {
                return { x: camera.position.x, y: camera.position.y };
            } else {
                return prevPosition;
            }
        });
    })

    return null
}

export default memo(CameraController)