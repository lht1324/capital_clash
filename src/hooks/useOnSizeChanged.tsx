import { useEffect, useRef, RefObject } from "react";

/**
 * ref를 사용하는 컴포넌트의 사이즈 변경을 측정하는 Hook.
 * @param {React.RefObject<any>} ref - 측정하고 싶은 컴포넌트의 ref
 * @param {(DOMRect) => {}} onSizeChanged - 변경 확인 시 호출되는 callback
 * @returns {void}
 */
export function useOnSizeChanged(ref: RefObject<any>, onSizeChanged: (rect: DOMRect) => void): void {
    const onSizeChangedRef = useRef(onSizeChanged);
    onSizeChangedRef.current = onSizeChanged;

    return useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            if (ref.current) {
                const rect = ref.current.getBoundingClientRect();
                onSizeChangedRef.current(rect);
            }
        });

        resizeObserver.observe(ref.current);
        return () => resizeObserver.disconnect();
    }, [ref]);
}