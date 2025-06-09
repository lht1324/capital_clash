'use client'

import { useEffect, useState } from 'react'
import { 
  EyeIcon,
  EyeSlashIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  KeyIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

// 키보드 단축키 도움말
const keyboardShortcuts = [
  { key: 'Tab', description: '다음 요소로 이동' },
  { key: 'Shift + Tab', description: '이전 요소로 이동' },
  { key: 'Enter', description: '선택된 요소 활성화' },
  { key: 'Space', description: '버튼 클릭 또는 체크박스 토글' },
  { key: 'Escape', description: '모달 또는 드롭다운 닫기' },
  { key: 'Arrow Keys', description: '리스트나 메뉴에서 탐색' },
  { key: 'Ctrl + /', description: '키보드 단축키 도움말 열기' }
]

interface AccessibilityHelperProps {
  enableKeyboardHelp?: boolean
  enableFocusIndicator?: boolean
  enableHighContrast?: boolean
}

export default function AccessibilityHelper({ 
  enableKeyboardHelp = true,
  enableFocusIndicator = true,
  enableHighContrast = false
}: AccessibilityHelperProps) {
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [highContrastMode, setHighContrastMode] = useState(enableHighContrast)
  const [announcements, setAnnouncements] = useState<string[]>([])
  const [fontSize, setFontSize] = useState('normal')

  // 키보드 단축키 리스너
  useEffect(() => {
    if (!enableKeyboardHelp) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + / 키로 도움말 토글
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault()
        setShowKeyboardHelp(!showKeyboardHelp)
      }
      
      // Escape 키로 도움말 닫기
      if (e.key === 'Escape' && showKeyboardHelp) {
        setShowKeyboardHelp(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboardHelp, showKeyboardHelp])

  // 고대비 모드 적용
  useEffect(() => {
    if (highContrastMode) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [highContrastMode])

  // 폰트 크기 조절
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize)
  }, [fontSize])

  // 포커스 가시성 개선
  useEffect(() => {
    if (!enableFocusIndicator) return

    const style = document.createElement('style')
    style.textContent = `
      /* 향상된 포커스 인디케이터 */
      *:focus {
        outline: 3px solid #3B82F6 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 1px #ffffff !important;
      }
      
      /* 고대비 모드 */
      .high-contrast {
        filter: contrast(150%) brightness(110%);
      }
      
      .high-contrast * {
        text-shadow: none !important;
        box-shadow: none !important;
      }
      
      /* 폰트 크기 조절 */
      [data-font-size="small"] {
        font-size: 14px;
      }
      
      [data-font-size="normal"] {
        font-size: 16px;
      }
      
      [data-font-size="large"] {
        font-size: 18px;
      }
      
      [data-font-size="larger"] {
        font-size: 20px;
      }
    `
    
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [enableFocusIndicator])

  // 스크린 리더를 위한 실시간 알림
  const announceToScreenReader = (message: string) => {
    setAnnouncements(prev => [...prev, message])
    
    // 알림 후 제거 (스크린 리더가 읽은 후)
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1))
    }, 1000)
  }

  // 전역 접근성 함수 등록
  useEffect(() => {
    // @ts-ignore
    window.announceToScreenReader = announceToScreenReader
  }, [])

  const toggleHighContrast = () => {
    setHighContrastMode(!highContrastMode)
    announceToScreenReader(
      highContrastMode ? '고대비 모드가 비활성화되었습니다' : '고대비 모드가 활성화되었습니다'
    )
  }

  const changeFontSize = (size: string) => {
    setFontSize(size)
    announceToScreenReader(`폰트 크기가 ${size}으로 변경되었습니다`)
  }

  return (
    <>
      {/* 스크린 리더용 실시간 알림 영역 */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        role="status"
      >
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>

      {/* 접근성 도구 패널 */}
      <div className="fixed bottom-4 left-4 z-50">
        <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">접근성 도구</h3>
          
          <div className="space-y-3">
            {/* 고대비 모드 토글 */}
            <button
              onClick={toggleHighContrast}
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 w-full text-left"
              aria-pressed={highContrastMode}
              aria-label={`고대비 모드 ${highContrastMode ? '비활성화' : '활성화'}`}
            >
              {highContrastMode ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
              <span>고대비 모드</span>
            </button>

            {/* 폰트 크기 조절 */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">폰트 크기</label>
              <select
                value={fontSize}
                onChange={(e) => changeFontSize(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="폰트 크기 선택"
              >
                <option value="small">작게</option>
                <option value="normal">보통</option>
                <option value="large">크게</option>
                <option value="larger">매우 크게</option>
              </select>
            </div>

            {/* 키보드 도움말 버튼 */}
            {enableKeyboardHelp && (
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 w-full text-left"
                aria-label="키보드 단축키 도움말 열기"
              >
                <KeyIcon className="h-4 w-4" />
                <span>키보드 도움말</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 키보드 단축키 도움말 모달 */}
      {showKeyboardHelp && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-labelledby="keyboard-help-title"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 
                  id="keyboard-help-title"
                  className="text-lg font-medium text-gray-900"
                >
                  키보드 단축키
                </h2>
                <button
                  onClick={() => setShowKeyboardHelp(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="도움말 닫기"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                {keyboardShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <kbd className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded font-mono">
                      {shortcut.key}
                    </kbd>
                    <span className="text-sm text-gray-600 ml-3 flex-1">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowKeyboardHelp(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// 키보드 네비게이션을 위한 유틸리티 훅
export function useKeyboardNavigation(items: HTMLElement[], options?: {
  loop?: boolean
  onSelect?: (index: number) => void
}) {
  const { loop = true, onSelect } = options || {}

  useEffect(() => {
    let currentIndex = 0

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          currentIndex = loop ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1)
          items[currentIndex]?.focus()
          break
          
        case 'ArrowUp':
          e.preventDefault()
          currentIndex = loop ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0)
          items[currentIndex]?.focus()
          break
          
        case 'Enter':
        case ' ':
          e.preventDefault()
          onSelect?.(currentIndex)
          break
      }
    }

    items.forEach((item, index) => {
      item.addEventListener('keydown', handleKeyDown)
      item.addEventListener('focus', () => {
        currentIndex = index
      })
    })

    return () => {
      items.forEach(item => {
        item.removeEventListener('keydown', handleKeyDown)
      })
    }
  }, [items, loop, onSelect])
}

// 포커스 트랩 유틸리티 (모달 등에서 사용)
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    ) as NodeListOf<HTMLElement>

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      document.removeEventListener('keydown', handleTabKey)
    }
  }, [containerRef, isActive])
} 