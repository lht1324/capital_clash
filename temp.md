# Approved 상태에서 새 이미지 업로드 시 기존 이미지 삭제 가능성 분석

## 현재 구현 상태

### 1. 이미지 업로드 프로세스
현재 시스템에서 이미지 업로드는 다음과 같이 처리됩니다:

1. **ImageUploadModal**: 사용자가 이미지를 선택하고 업로드 버튼을 클릭
2. **handleImageUpload** (Sidebar.tsx): storageAPI.uploadImage 호출
3. **storageAPI.uploadImage**:
    - Supabase Storage에 새 이미지 파일 업로드
    - images 테이블에 새 레코드 삽입 (status: 'pending')
    - investors 테이블의 image_url과 image_status 업데이트

### 2. 기존 이미지 처리 방식
**현재는 기존 이미지를 자동으로 삭제하지 않습니다:**
- 새 이미지 업로드 시 investors 테이블의 image_url만 새 URL로 덮어씀
- 기존 이미지 파일은 Storage에 그대로 남아있음
- images 테이블의 기존 레코드도 그대로 유지됨

## 기존 이미지 삭제 가능성

### ✅ 기술적으로 가능함

**이미 구현된 삭제 기능:**
```typescript
// storageAPI.deleteImage 함수가 이미 구현되어 있음
async deleteImage(imageId: string, filePath: string): Promise<boolean> {
    // 1. Storage에서 파일 삭제
    // 2. images 테이블에서 레코드 삭제
}
```

**필요한 정보 추출 기능:**
```typescript
// URL에서 파일 경로 추출 기능도 구현되어 있음
getFilePathFromUrl(url: string): string | null
```

## 구현 방안

### 1. handleImageUpload 함수 수정
Approved 상태에서 새 이미지 업로드 시 기존 이미지를 삭제하도록 로직 추가:

```typescript
const handleImageUpload = useCallback(async (file: File) => {
    // 기존 코드...

    // Approved 상태이고 기존 이미지가 있는 경우 삭제
    if (imageStatus === ImageStatus.APPROVED && imageUrl) {
        try {
            // 1. 기존 이미지의 images 테이블 레코드 찾기
            const existingImages = await storageAPI.getImagesByInvestorId(userInvestmentInfo.id);
            const approvedImage = existingImages.find(img => img.status === 'approved');

            if (approvedImage) {
                // 2. 파일 경로 추출
                const filePath = storageAPI.getFilePathFromUrl(approvedImage.original_url);

                if (filePath) {
                    // 3. 기존 이미지 삭제
                    await storageAPI.deleteImage(approvedImage.id, filePath);
                    console.log('기존 승인된 이미지 삭제 완료');
                }
            }
        } catch (error) {
            console.error('기존 이미지 삭제 실패:', error);
            // 삭제 실패해도 새 이미지 업로드는 계속 진행
        }
    }

    // 새 이미지 업로드 (기존 코드)
    const { imageData, error } = await storageAPI.uploadImage(file, user.id, userInvestmentInfo.id);
    // ...
}, [user, userInvestmentInfo, imageStatus, imageUrl]);
```

### 2. 대안: 백엔드 트리거 방식
PostgreSQL 트리거를 사용하여 investors 테이블의 image_url이 변경될 때 자동으로 기존 이미지 정리:

```sql
-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION cleanup_old_images()
RETURNS TRIGGER AS $$
BEGIN
    -- image_url이 변경되었고 기존 URL이 있는 경우
    IF OLD.image_url IS NOT NULL AND OLD.image_url != NEW.image_url THEN
        -- 기존 이미지 레코드를 삭제 대기 상태로 표시
        UPDATE images 
        SET status = 'to_be_deleted' 
        WHERE investor_id = NEW.id 
        AND original_url = OLD.image_url 
        AND status = 'approved';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER cleanup_old_images_trigger
    BEFORE UPDATE ON investors
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_old_images();
```

## 권장사항

### ✅ 즉시 구현 가능
1. **프론트엔드 방식**: handleImageUpload 함수 수정으로 즉시 구현 가능
2. **사용자 경험**: "기존 이미지를 교체하시겠습니까?" 확인 메시지 추가
3. **오류 처리**: 기존 이미지 삭제 실패 시에도 새 이미지 업로드는 계속 진행

### 🔄 장기적 개선
1. **백엔드 트리거**: 데이터 일관성 보장
2. **배치 작업**: 주기적으로 미사용 이미지 파일 정리
3. **이미지 버전 관리**: 삭제 대신 버전 히스토리 관리

## Bucket 삭제 문제 분석

### 🔍 현재 상황
이미지 교체 시 **images 테이블에서는 삭제되지만 bucket에서는 삭제되지 않는** 문제가 발생하고 있습니다.

### 📋 storageAPI.deleteImage 함수 분석

```typescript
async deleteImage(imageId: string, filePath: string): Promise<boolean> {
    try {
        // 1. 스토리지에서 파일 삭제
        const { error: storageError } = await supabase
            .storage
            .from(BUCKET_NAME)
            .remove([filePath])

        if (storageError) throw storageError

        // 2. 데이터베이스에서 이미지 레코드 삭제
        const { error: dbError } = await supabase
            .from('images')
            .delete()
            .eq('id', imageId)

        if (dbError) throw dbError

        return true
    } catch (error) {
        console.error('이미지 삭제 오류:', error)
        return false
    }
}
```

### ⚠️ 잠재적 문제점들

#### 1. **파일 경로 추출 문제**
```typescript
getFilePathFromUrl(url: string): string | null {
    try {
        const storageUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl('').data.publicUrl
        return url.replace(storageUrl, '')
    } catch (error) {
        console.error('URL에서 파일 경로 추출 오류:', error)
        return null
    }
}
```

**문제점:**
- `getPublicUrl('')`로 빈 경로를 사용하여 기본 URL을 가져오는 방식이 불안정할 수 있음
- URL 형식이 예상과 다를 경우 잘못된 파일 경로가 추출될 수 있음
- 추출된 파일 경로가 실제 Storage의 파일 경로와 일치하지 않을 수 있음

#### 2. **Supabase Storage 권한 문제**
- Storage bucket의 RLS(Row Level Security) 정책이 파일 삭제를 차단할 수 있음
- 사용자가 업로드한 파일이라도 삭제 권한이 없을 수 있음
- bucket 정책에서 DELETE 작업이 허용되지 않았을 수 있음

#### 3. **에러 처리 문제**
- `storageError`가 발생해도 함수가 `false`를 반환하지만, 실제로는 데이터베이스 삭제는 실행되지 않음
- 하지만 try-catch 구조상 storage 삭제가 실패하면 전체 함수가 실패로 처리됨

### 🔧 해결 방안

#### 1. **파일 경로 추출 개선**
```typescript
getFilePathFromUrl(url: string): string | null {
    try {
        // 더 안정적인 URL 파싱 방법
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');

        // Supabase Storage URL 패턴: /storage/v1/object/public/bucket-name/file-path
        const bucketIndex = pathParts.findIndex(part => part === BUCKET_NAME);
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            return pathParts.slice(bucketIndex + 1).join('/');
        }

        return null;
    } catch (error) {
        console.error('URL에서 파일 경로 추출 오류:', error);
        return null;
    }
}
```

#### 2. **Storage 권한 확인**
Supabase 대시보드에서 다음 사항들을 확인해야 합니다:
- Storage bucket의 RLS 정책 설정
- 파일 삭제 권한 설정
- 사용자별 접근 권한 정책

#### 3. **삭제 로직 개선**
```typescript
async deleteImage(imageId: string, filePath: string): Promise<boolean> {
    let storageDeleted = false;
    let dbDeleted = false;

    try {
        // 1. 스토리지에서 파일 삭제 시도
        const { error: storageError } = await supabase
            .storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (storageError) {
            console.warn('Storage 파일 삭제 실패:', storageError);
        } else {
            storageDeleted = true;
            console.log('Storage 파일 삭제 성공');
        }

        // 2. 데이터베이스에서 이미지 레코드 삭제 (Storage 삭제 실패와 무관하게 실행)
        const { error: dbError } = await supabase
            .from('images')
            .delete()
            .eq('id', imageId);

        if (dbError) {
            console.error('DB 레코드 삭제 실패:', dbError);
        } else {
            dbDeleted = true;
            console.log('DB 레코드 삭제 성공');
        }

        // 3. 결과 반환 (적어도 하나라도 성공하면 true)
        return storageDeleted || dbDeleted;

    } catch (error) {
        console.error('이미지 삭제 중 예외 발생:', error);
        return false;
    }
}
```

### ✅ 권장 조치사항

1. **즉시 확인 필요:**
   - Supabase Storage bucket의 RLS 정책 확인
   - 파일 삭제 권한 설정 확인
   - 실제 파일 경로와 추출된 경로 비교

2. **코드 개선:**
   - `getFilePathFromUrl` 함수 개선
   - `deleteImage` 함수의 에러 처리 강화
   - 삭제 실패 시 상세한 로그 추가

3. **테스트:**
   - 실제 파일 삭제가 작동하는지 테스트
   - 다양한 URL 형식에 대한 파일 경로 추출 테스트

## 결론

**Approved 상태에서 새 이미지 업로드 시 기존 이미지 삭제는 완전히 가능합니다.**

하지만 **현재 bucket에서 파일이 삭제되지 않는 문제**는 주로 다음 원인들로 인해 발생할 수 있습니다:
1. 파일 경로 추출 로직의 문제
2. Supabase Storage 권한 설정 문제
3. 에러 처리 로직의 문제

이러한 문제들을 해결하기 위해서는 Storage 권한 설정 확인과 코드 개선이 필요합니다.

## 🔍 문제점 상세 분석

### 문제 1: images 테이블에서 기존 이미지 row 제거되지 않음

#### 🔍 현재 상황
Sidebar.tsx의 handleImageUpload 함수에서 다음과 같이 구현되어 있습니다:

```typescript
// 1. 기존 이미지의 images 테이블 레코드 찾기
const existingImages = await storageAPI.getImagesByInvestorId(userInvestmentInfo.id);
const approvedImage = existingImages.find(img => img.status === 'approved');

if (approvedImage) {
    // 2. 파일 경로 추출
    const filePath = storageAPI.getFilePathFromUrl(approvedImage.original_url);

    if (filePath) {
        // 3. 기존 이미지 삭제
        const deleteSuccess = await storageAPI.deleteImage(approvedImage.id, filePath);
    }
}
```

#### ⚠️ 잠재적 문제점들

**1. getFilePathFromUrl 함수의 문제:**
```typescript
getFilePathFromUrl(url: string): string | null {
    try {
        const storageUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl('').data.publicUrl
        return url.replace(storageUrl, '')
    } catch (error) {
        console.error('URL에서 파일 경로 추출 오류:', error)
        return null
    }
}
```

- `getPublicUrl('')`로 빈 경로를 사용하는 방식이 불안정
- URL 형식이 예상과 다를 경우 잘못된 파일 경로 추출
- 추출된 경로가 null이면 deleteImage 함수가 호출되지 않음

**2. deleteImage 함수의 에러 처리:**
```typescript
async deleteImage(imageId: string, filePath: string): Promise<boolean> {
    try {
        // 1. 스토리지에서 파일 삭제
        const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([filePath])
        if (storageError) throw storageError

        // 2. 데이터베이스에서 이미지 레코드 삭제
        const { error: dbError } = await supabase.from('images').delete().eq('id', imageId)
        if (dbError) throw dbError

        return true
    } catch (error) {
        console.error('이미지 삭제 오류:', error)
        return false
    }
}
```

- Storage 삭제가 실패하면 전체 함수가 실패로 처리됨
- DB 레코드 삭제가 실행되지 않음
- 부분적 성공 상황을 처리하지 못함

### 문제 2: bucket에서 기존 이미지 제거되지 않음

#### 🔍 근본 원인 분석

**1. 파일 경로 추출 실패:**
- `getPublicUrl('')` 방식의 불안정성
- Supabase Storage URL 구조 변경 시 대응 불가
- 실제 파일 경로와 추출된 경로 불일치

**2. Storage 권한 문제:**
- RLS 정책에서 DELETE 권한 제한
- 사용자별 파일 접근 권한 설정 문제
- bucket 정책 설정 오류

**3. 에러 처리 로직 문제:**
- Storage 삭제 실패 시 전체 프로세스 중단
- 상세한 에러 정보 부족
- 재시도 로직 없음

## 🔧 구체적 해결 방안

### 1. getFilePathFromUrl 함수 개선

```typescript
getFilePathFromUrl(url: string): string | null {
    try {
        console.log('🔍 원본 URL:', url);

        // 방법 1: URL 객체를 사용한 파싱
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');

        // Supabase Storage URL 패턴: /storage/v1/object/public/bucket-name/file-path
        const bucketIndex = pathParts.findIndex(part => part === BUCKET_NAME);
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            const extractedPath = pathParts.slice(bucketIndex + 1).join('/');
            console.log('✅ 추출된 파일 경로:', extractedPath);
            return extractedPath;
        }

        // 방법 2: 정규식을 사용한 패턴 매칭 (백업)
        const regex = new RegExp(`/${BUCKET_NAME}/(.+)$`);
        const match = urlObj.pathname.match(regex);
        if (match && match[1]) {
            console.log('✅ 정규식으로 추출된 파일 경로:', match[1]);
            return match[1];
        }

        console.warn('⚠️ 파일 경로 추출 실패 - 패턴 불일치');
        return null;
    } catch (error) {
        console.error('❌ URL에서 파일 경로 추출 오류:', error);
        return null;
    }
}
```

### 2. deleteImage 함수 개선

```typescript
async deleteImage(imageId: string, filePath: string): Promise<{
    storageDeleted: boolean;
    dbDeleted: boolean;
    success: boolean;
}> {
    console.log('🗑️ 이미지 삭제 시작:', { imageId, filePath });

    let storageDeleted = false;
    let dbDeleted = false;

    // 1. Storage에서 파일 삭제 시도
    try {
        const { error: storageError } = await supabase
            .storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (storageError) {
            console.warn('⚠️ Storage 파일 삭제 실패:', storageError);
            console.warn('파일 경로:', filePath);
        } else {
            storageDeleted = true;
            console.log('✅ Storage 파일 삭제 성공');
        }
    } catch (error) {
        console.error('❌ Storage 삭제 중 예외:', error);
    }

    // 2. DB에서 레코드 삭제 (Storage 삭제 실패와 무관하게 실행)
    try {
        const { error: dbError } = await supabase
            .from('images')
            .delete()
            .eq('id', imageId);

        if (dbError) {
            console.error('❌ DB 레코드 삭제 실패:', dbError);
        } else {
            dbDeleted = true;
            console.log('✅ DB 레코드 삭제 성공');
        }
    } catch (error) {
        console.error('❌ DB 삭제 중 예외:', error);
    }

    const success = storageDeleted || dbDeleted;
    console.log('🏁 삭제 결과:', { storageDeleted, dbDeleted, success });

    return { storageDeleted, dbDeleted, success };
}
```

### 3. handleImageUpload 함수 개선

```typescript
// Approved 상태이고 기존 이미지가 있는 경우 삭제
if (imageStatus === ImageStatus.APPROVED && imageUrl) {
    try {
        console.log('🗑️ 기존 승인된 이미지 삭제 시작...')

        // 1. 기존 이미지의 images 테이블 레코드 찾기
        const existingImages = await storageAPI.getImagesByInvestorId(userInvestmentInfo.id);
        const approvedImage = existingImages.find(img => img.status === 'approved');

        if (approvedImage) {
            console.log('📋 삭제할 이미지 정보:', approvedImage);

            // 2. 파일 경로 추출
            const filePath = storageAPI.getFilePathFromUrl(approvedImage.original_url);
            console.log('📁 추출된 파일 경로:', filePath);

            if (filePath) {
                // 3. 기존 이미지 삭제
                const deleteResult = await storageAPI.deleteImage(approvedImage.id, filePath);

                if (deleteResult.success) {
                    if (deleteResult.storageDeleted && deleteResult.dbDeleted) {
                        console.log('✅ 기존 이미지 완전 삭제 완료');
                    } else if (deleteResult.dbDeleted) {
                        console.warn('⚠️ DB 레코드는 삭제되었으나 Storage 파일 삭제 실패');
                    } else if (deleteResult.storageDeleted) {
                        console.warn('⚠️ Storage 파일은 삭제되었으나 DB 레코드 삭제 실패');
                    }
                } else {
                    console.error('❌ 기존 이미지 삭제 완전 실패');
                }
            } else {
                console.error('❌ 파일 경로 추출 실패 - 삭제 불가');
            }
        } else {
            console.warn('⚠️ 승인된 이미지를 찾을 수 없음');
        }
    } catch (deleteError) {
        console.error('❌ 기존 이미지 삭제 과정에서 예외 발생:', deleteError);
    }
}
```

## 📋 즉시 확인해야 할 사항

1. **Supabase Storage 설정:**
   - bucket의 RLS 정책 확인
   - 파일 삭제 권한 설정 확인
   - 사용자별 접근 권한 정책 검토

2. **실제 URL 구조 확인:**
   - 실제 이미지 URL 형식 확인
   - getPublicUrl('') 결과값 확인
   - 파일 경로 추출 테스트

3. **에러 로그 분석:**
   - 실제 삭제 실패 시 발생하는 에러 메시지 확인
   - Storage API 응답 상세 분석
