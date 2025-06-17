# Viewport와 모니터 비율 측정에 관한 설명

## Viewport란 무엇인가?

React Three Fiber의 `useThree` 훅에서 제공하는 `size` 객체는 Canvas 컴포넌트의 현재 크기를 나타냅니다. 여기서 말하는 "Viewport"는 다음과 같은 의미를 가집니다:

1. **Canvas 컴포넌트의 크기**: `ContinentMap.tsx`에서 Canvas는 `className="w-full h-full"`로 설정되어 있고, 이 Canvas의 부모 요소인 main은 `className="w-full h-screen"`으로 설정되어 있습니다. 따라서 Canvas는 화면 전체 높이와 너비를 차지하게 됩니다.

2. **브라우저 기준 Viewport**: 브라우저에서 Viewport는 주소 표시줄, 탭, 상태 표시줄 등을 제외한 실제 콘텐츠가 표시되는 영역을 의미합니다. 레이아웃 구조에서는 크롬 상단 바, 화면 헤더, 지도, 작업 표시줄 등을 제외한 실제 콘텐츠 영역입니다.

3. **Three.js 렌더링 영역**: React Three Fiber는 Three.js를 기반으로 하며, `size` 객체는 Three.js 렌더러가 사용하는 렌더링 영역의 크기를 나타냅니다.

## 모니터 비율 측정 방법

모니터의 비율을 측정하는 방법은 다음과 같습니다:

1. **window.screen API 사용**:
   ```javascript
   const monitorWidth = window.screen.width;
   const monitorHeight = window.screen.height;
   const aspectRatio = monitorWidth / monitorHeight;
   ```
   이 방법은 모니터의 전체 해상도를 기준으로 비율을 계산합니다.

2. **window.innerWidth/innerHeight 사용**:
   ```javascript
   const viewportWidth = window.innerWidth;
   const viewportHeight = window.innerHeight;
   const viewportRatio = viewportWidth / viewportHeight;
   ```
   이 방법은 브라우저 창의 내부 크기(Viewport)를 기준으로 비율을 계산합니다.

3. **React Three Fiber의 useThree 훅 사용**:
   ```javascript
   const { size } = useThree();
   const canvasRatio = size.width / size.height;
   ```
   이 방법은 Canvas 컴포넌트의 크기를 기준으로 비율을 계산합니다.

## CameraInitialSetup 함수에서의 size 변수

`CameraInitialSetup` 함수에서 사용하는 `size` 변수는 React Three Fiber의 `useThree` 훅을 통해 얻은 Canvas 컴포넌트의 크기입니다. 이 크기는 브라우저 창의 크기가 변경되거나 Canvas 컴포넌트의 크기가 변경될 때마다 업데이트됩니다.

```javascript
function CameraInitialSetup() {
    const { size, camera } = useThree();
    
    useEffect(() => {
        // 화면 크기에 따른 줌 레벨 계산
        const maxContinentRange = 40;
        const aspectRatio = size.width / size.height;
        const adjustmentFactor = aspectRatio < (16 / 9) ? 1.5 : 1;
        
        // 카메라 위치 설정
        camera.position.z = maxContinentRange * adjustmentFactor * (1 + 0.2 * (1 - Math.min(size.width, size.height) / 1000));
    }, [size, camera]);
    
    return null;
}
```

이 함수는 Canvas의 크기 비율에 따라 카메라의 줌 레벨을 동적으로 조정하여, 다양한 화면 크기에서 모든 대륙이 화면에 담기도록 합니다.