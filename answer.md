# 이미지 업로드 및 저장 플로우

## 개요
이 문서는 사용자가 모달에서 이미지를 추가하고 업로드했을 때, 해당 이미지가 Supabase의 'investor-images' 버킷에 저장되고, 이미지 URL이 investors 테이블의 image_url 필드에 저장되는 전체 플로우를 설명합니다.

## 이미지 업로드 플로우

### 1. 사용자 인터페이스 (UI) 흐름
1. **업로드 버튼 클릭**: 사용자가 TerritoryTab에서 "Upload Image" 버튼을 클릭합니다.
2. **모달 열기**: 버튼 클릭 시 `onClickOpenImageUploadModal` 함수가 호출되어 이미지 업로드 모달이 열립니다.
3. **이미지 선택**: 사용자는 다음 두 가지 방법 중 하나로 이미지를 선택할 수 있습니다:
   - 파일 선택 버튼을 클릭하여 파일 탐색기에서 이미지 선택
   - 이미지 파일을 모달 영역으로 드래그 앤 드롭
4. **이미지 미리보기**: 선택한 이미지의 미리보기가 표시됩니다.
5. **업로드 버튼 클릭**: 사용자가 "Upload Image" 버튼을 클릭하여 이미지 업로드를 시작합니다.

### 2. 데이터 처리 흐름
1. **파일 유효성 검사**:
   - 파일 형식 검사 (JPG, PNG, GIF만 허용)
   - 파일 크기 검사 (5MB 이하만 허용)

2. **Supabase Storage 업로드**:
   - 선택한 이미지 파일은 `storageAPI.uploadImage` 함수를 통해 Supabase Storage의 'investor-images' 버킷에 업로드됩니다.
   - 파일 경로는 `{userId}/{investorId}/{timestamp}_{filename}` 형식으로 생성됩니다.
   - 업로드 시 캐시 제어 설정(3600초)이 적용됩니다.

3. **공개 URL 생성**:
   - 업로드된 이미지의 공개 URL이 Supabase Storage의 `getPublicUrl` 메서드를 통해 생성됩니다.
   - 이 URL은 인증 없이 누구나 접근할 수 있는 형태입니다.

4. **데이터베이스 업데이트**:
   - **images 테이블 업데이트**: 이미지 메타데이터(사용자 ID, 투자자 ID, 원본 URL, 파일 크기, 파일 타입, 상태 등)가 images 테이블에 저장됩니다.
   - **investors 테이블 업데이트**: 생성된 공개 URL이 investors 테이블의 image_url 필드에 저장되고, image_status 필드는 'pending'으로 설정됩니다.

5. **상태 업데이트**:
   - 업로드가 완료되면 이미지 상태가 'pending'으로 변경됩니다.
   - 이는 이미지가 관리자의 승인을 기다리고 있음을 의미합니다.

### 3. 이미지 상태 관리
이미지는 다음 네 가지 상태 중 하나를 가질 수 있습니다:
- **none**: 이미지가 업로드되지 않은 상태
- **pending**: 이미지가 업로드되어 관리자의 승인을 기다리는 상태
- **approved**: 관리자가 이미지를 승인한 상태
- **rejected**: 관리자가 이미지를 거부한 상태

## 기술적 구현 세부사항

### 1. 컴포넌트 간 상호작용
- **TerritoryTab.tsx**: "Upload Image" 버튼을 제공하고, 클릭 시 `onClickOpenImageUploadModal` 함수를 호출합니다.
- **Sidebar.tsx**: 이미지 업로드 모달의 열기/닫기 상태를 관리하고, `handleImageUpload` 함수를 통해 이미지 업로드 로직을 처리합니다.
- **ImageUploadModal.tsx**: 이미지 선택, 미리보기, 업로드 UI를 제공하고, 업로드 버튼 클릭 시 `onUpload` 콜백을 통해 선택된 파일을 Sidebar.tsx의 `handleImageUpload` 함수로 전달합니다.

### 2. Supabase Storage API 활용
```typescript
// 이미지 업로드 함수
async uploadImage(file: File, userId: string, investorId: string) {
    // 1. 파일 경로 생성 (userId/investorId/파일명)
    const filePath = `${userId}/${investorId}/${Date.now()}_${file.name}`

    // 2. Storage에 파일 업로드
    const { data: storageData, error: storageError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        })

    // 3. 파일의 공개 URL 가져오기
    const { data: { publicUrl } } = supabase
        .storage
        .from(BUCKET_NAME)
        .getPublicUrl(storageData.path)

    // 4. 데이터베이스 업데이트 로직...
}
```

### 3. 데이터베이스 업데이트
```typescript
// 이미지 메타데이터를 데이터베이스에 저장
const imageData = {
    user_id: userId,
    investor_id: investorId,
    original_url: publicUrl,
    file_size: file.size,
    file_type: file.type,
    status: 'pending'
}

// images 테이블에 저장
const { data: dbData, error: dbError } = await supabase
    .from('images')
    .insert([imageData])
    .select()
    .single()

// investors 테이블 업데이트
await supabase
    .from('investors')
    .update({
        image_url: publicUrl,
        image_status: 'pending',
        updated_at: new Date().toISOString()
    })
    .eq('id', investorId)
```

## 에러 처리 및 사용자 피드백
1. **업로드 실패 시**: 사용자에게 오류 메시지를 표시하고, 콘솔에 상세 오류 정보를 기록합니다.
2. **업로드 성공 시**: 사용자에게 성공 메시지를 표시하고, 모달을 닫습니다.
3. **상태 변경 시**: 이미지 상태가 변경될 때마다 UI가 업데이트되어 현재 상태를 사용자에게 표시합니다.

## 보안 고려사항
1. **파일 유효성 검사**: 허용된 파일 형식과 크기만 업로드할 수 있도록 클라이언트 측에서 검사합니다.
2. **사용자 인증**: 로그인한 사용자만 이미지를 업로드할 수 있습니다.
3. **경로 구조화**: 파일 경로에 사용자 ID와 투자자 ID를 포함하여 다른 사용자의 파일에 접근할 수 없도록 합니다.

## 결론
이 구현을 통해 사용자는 자신의 영역에 대한 이미지를 쉽게 업로드할 수 있으며, 업로드된 이미지는 Supabase의 'investor-images' 버킷에 안전하게 저장됩니다. 이미지 URL은 investors 테이블의 image_url 필드에 저장되어 애플리케이션의 다른 부분에서 쉽게 접근할 수 있습니다. 또한 이미지 상태 관리 시스템을 통해 관리자가 업로드된 이미지를 검토하고 승인할 수 있는 워크플로우가 제공됩니다.
