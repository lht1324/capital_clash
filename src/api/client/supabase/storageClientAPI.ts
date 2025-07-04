import { supabase } from '@/lib/supabase/supabaseClient'
import { Database } from '@/types/database'

type Tables = Database['public']['Tables']
type ImageRow = Tables['images']['Row']

// 버킷 이름 상수
const BUCKET_NAME = 'player-images'

// 🖼️ 이미지 스토리지 관련 함수들
export const storageClientAPI = {
    // 이미지 업로드
    async uploadImage(
        file: File,
        userId: string,
        playerId: string
    ): Promise<{ imageData: ImageRow | null; error: Error | null }> {
        try {
            // 1. 파일 경로 생성 (userId/playerId/파일명)
            const filePath = `${userId}/${playerId}/${Date.now()}_${file.name}`

            // 2. Storage에 파일 업로드
            const { data: storageData, error: storageError } = await supabase
                .storage
                .from(BUCKET_NAME)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (storageError) {
                console.log("storageError");
                throw storageError;
            }

            // 3. 파일의 공개 URL 가져오기
            const { data: { publicUrl } } = supabase
                .storage
                .from(BUCKET_NAME)
                .getPublicUrl(storageData.path)

            // 4. 이미지 메타데이터를 데이터베이스에 저장
            const imageData = {
                user_id: userId,
                player_id: playerId,
                original_url: publicUrl,
                file_size: file.size,
                file_type: file.type,
                status: 'pending' as const
            }

            const { data: dbData, error: dbError } = await supabase
                .from('images')
                .insert([imageData])
                .select()
                .single()

            if (dbError) {
                console.log("dbError");
                throw dbError
            }

            // 5. 투자자 테이블의 이미지 URL 및 상태 업데이트
            await supabase
                .from('players')
                .update({
                    image_url: publicUrl,
                    image_status: 'pending',
                    updated_at: new Date().toISOString()
                })
                .eq('id', playerId)

            return { imageData: dbData, error: null }
        } catch (error) {
            console.error('이미지 업로드 오류:', error)
            return { imageData: null, error: error as Error }
        }
    },

    // 이미지 조회
    async getImagesByPlayerId(playerId: string): Promise<ImageRow[]> {
        const { data, error } = await supabase
            .from('images')
            .select('*')
            .eq('player_id', playerId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    },

    // 이미지 삭제
    async deleteImage(imageId: string, filePath: string): Promise<boolean> {
        try {
            // 1. 스토리지에서 파일 삭제
            const { error: storageError } = await supabase
                .storage
                .from(BUCKET_NAME)
                .remove([filePath])

            console.log("storageError", storageError)
            if (storageError) throw storageError

            // 2. 데이터베이스에서 이미지 레코드 삭제
            const { error: dbError } = await supabase
                .from('images')
                .delete()
                .eq('id', imageId)

            console.log("dbError", dbError)
            if (dbError) throw dbError

            return true
        } catch (error) {
            console.error('이미지 삭제 오류:', error)
            return false
        }
    },

    // 이미지 URL에서 파일 경로 추출
    getFilePathFromUrl(url: string): string | null {
        try {
            const storageUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl('').data.publicUrl
            return url.replace(storageUrl, '')
        } catch (error) {
            console.error('URL에서 파일 경로 추출 오류:', error)
            return null
        }
    }
}