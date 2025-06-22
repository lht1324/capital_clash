import { useState, useRef, ChangeEvent } from 'react'
import { storageAPI } from '@/lib/supabase/supabase-storage-api'
import { useUserStore } from '@/store/userStore'

interface ImageUploaderProps {
  investorId: string
  onUploadSuccess?: (imageUrl: string) => void
  onUploadError?: (error: Error) => void
}

export default function ImageUploader({ 
  investorId, 
  onUploadSuccess, 
  onUploadError 
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 사용자 정보 가져오기
  const { user } = useUserStore()
  
  // 파일 선택 핸들러
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }
    
    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }
    
    // 이미지 미리보기 생성
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    // 자동 업로드 시작
    handleUpload(file)
  }
  
  // 파일 업로드 핸들러
  const handleUpload = async (file: File) => {
    if (!user?.id) {
      alert('로그인이 필요합니다.')
      return
    }
    
    setIsUploading(true)
    setUploadProgress(10) // 시작 진행률
    
    try {
      // 진행률 시뮬레이션 (실제로는 업로드 진행률을 받아올 수 있으면 좋음)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)
      
      // 이미지 업로드
      const { imageData, error } = await storageAPI.uploadImage(
        file,
        user.id,
        investorId
      )
      
      clearInterval(progressInterval)
      
      if (error) {
        throw error
      }
      
      setUploadProgress(100)
      
      // 성공 콜백 호출
      if (imageData && onUploadSuccess) {
        onUploadSuccess(imageData.original_url)
      }
      
      // 1초 후 업로드 상태 초기화
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)
      
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      setIsUploading(false)
      setUploadProgress(0)
      
      // 에러 콜백 호출
      if (onUploadError) {
        onUploadError(error as Error)
      }
    }
  }
  
  // 파일 선택 버튼 클릭 핸들러
  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }
  
  // 미리보기 취소 핸들러
  const handleCancelPreview = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">이미지 업로드</h3>
        <p className="text-sm text-gray-500 mb-4">
          JPG, PNG 형식의 이미지를 업로드할 수 있습니다. (최대 5MB)
        </p>
        
        {/* 파일 입력 (숨김) */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/gif"
          className="hidden"
        />
        
        {/* 이미지 미리보기 */}
        {previewUrl ? (
          <div className="relative mb-4">
            <img 
              src={previewUrl} 
              alt="미리보기" 
              className="w-full h-auto rounded-lg shadow-md"
            />
            {!isUploading && (
              <button
                onClick={handleCancelPreview}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                aria-label="미리보기 취소"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={handleSelectFile}
            disabled={isUploading}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-900">
              클릭하여 이미지 선택
            </p>
            <p className="mt-1 text-xs text-gray-500">
              또는 이미지를 여기에 끌어다 놓으세요
            </p>
          </button>
        )}
        
        {/* 업로드 진행률 */}
        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {uploadProgress < 100 
                ? `업로드 중... ${uploadProgress}%` 
                : '업로드 완료!'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}