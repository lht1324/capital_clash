'use client'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-black bg-opacity-80 text-white p-4 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Capital Clash</h1>
          <span className="text-sm text-gray-300">돈으로 밀어붙이는 전쟁</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <button className="hover:text-blue-400 transition-colors">랭킹</button>
          <button className="hover:text-blue-400 transition-colors">상점</button>
          <button className="hover:text-blue-400 transition-colors">히스토리</button>
        </nav>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm">
            <span className="text-green-400">₩0</span>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors">
            로그인
          </button>
        </div>
      </div>
    </header>
  )
} 