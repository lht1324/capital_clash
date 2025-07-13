# Gumroad API 문서

## 개요

Gumroad API는 REST 기반의 OAuth API로, 개발자가 Gumroad 플랫폼과 통합할 수 있도록 제공됩니다.

### 기본 정보
- **프로토콜**: REST API
- **응답 형식**: JSON
- **인증 방식**: OAuth 2.0
- **베이스 URL**: `https://api.gumroad.com/v2`

## 인증

### OAuth 애플리케이션 등록
API를 사용하기 전에 Gumroad에서 OAuth 애플리케이션을 등록해야 합니다.

### 인증 범위 (Scopes)
- `view_profile`: 사용자 공개 정보 읽기
- `edit_products`: 제품 읽기/쓰기
- `view_sales`: 판매 정보 읽기  
- `mark_sales_as_shipped`: 판매 발송 표시
- `refund_sales`: 판매 환불

## API 엔드포인트

### 제품 관리

#### 모든 제품 조회
```http
GET /products
```

**응답 예시:**
```json
{
  "success": true,
  "products": [
    {
      "id": "product_id",
      "name": "제품명",
      "price": 1000,
      "currency": "USD"
    }
  ]
}
```

#### 특정 제품 상세 조회
```http
GET /products/:id
```

#### 제품 삭제
```http
DELETE /products/:id
```

#### 제품 활성화/비활성화
```http
PUT /products/:id/enable
PUT /products/:id/disable
```

### 판매 관리

#### 판매 목록 조회
```http
GET /sales
```

**쿼리 파라미터:**
- `after`: 특정 날짜 이후 판매
- `before`: 특정 날짜 이전 판매
- `page`: 페이지 번호

**응답 예시:**
```json
{
  "success": true,
  "sales": [
    {
      "id": "sale_id",
      "email": "buyer@example.com",
      "price": 1000,
      "currency": "USD",
      "timestamp": "2023-01-01T00:00:00Z"
    }
  ]
}
```

#### 특정 판매 상세 조회
```http
GET /sales/:id
```

#### 판매 발송 표시
```http
PUT /sales/:id/mark_as_shipped
```

#### 판매 환불
```http
PUT /sales/:id/refund
```

**요청 본문:**
```json
{
  "amount": 1000
}
```

### 라이선스 관리

#### 라이선스 검증
```http
POST /licenses/verify
```

**요청 본문:**
```json
{
  "product_permalink": "product-name",
  "license_key": "license_key"
}
```

**응답 예시:**
```json
{
  "success": true,
  "uses": 1,
  "purchase": {
    "email": "buyer@example.com",
    "timestamp": "2023-01-01T00:00:00Z"
  }
}
```

#### 라이선스 활성화/비활성화
```http
PUT /licenses/enable
PUT /licenses/disable
```

### 사용자 정보

#### 현재 사용자 정보 조회
```http
GET /user
```

**응답 예시:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "사용자명",
    "email": "user@example.com"
  }
}
```

## 오류 처리

### HTTP 상태 코드
- `200`: 성공
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스 없음
- `500`: 서버 오류

### 오류 응답 형식
```json
{
  "success": false,
  "message": "오류 메시지",
  "error": "ERROR_CODE"
}
```

## 추가 기능

### 리소스 구독 (Resource Subscriptions)
특정 이벤트가 발생했을 때 웹훅을 통해 알림을 받을 수 있습니다.

#### 구독 생성
```http
POST /resource_subscriptions
```

**요청 본문:**
```json
{
  "post_url": "https://yoursite.com/webhook",
  "resource_name": "sale"
}
```

### 구독자 관리

#### 구독자 목록 조회
```http
GET /subscribers
```

#### 구독자 추가
```http
POST /subscribers
```

**요청 본문:**
```json
{
  "email": "subscriber@example.com"
}
```

### 제품 변형 (Variants)
제품에 다양한 옵션을 추가할 수 있습니다.

#### 변형 조회
```http
GET /products/:id/variants
```

#### 변형 생성
```http
POST /products/:id/variants
```

**요청 본문:**
```json
{
  "name": "변형명",
  "price": 1500
}
```

## 사용 예시

### JavaScript로 제품 목록 가져오기
```javascript
const accessToken = 'your_access_token';

fetch('https://api.gumroad.com/v2/products', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
.then(response => response.json())
.then(data => {
  console.log('제품 목록:', data.products);
})
.catch(error => {
  console.error('오류:', error);
});
```

### 판매 정보 조회
```javascript
fetch('https://api.gumroad.com/v2/sales', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
.then(response => response.json())
.then(data => {
  console.log('판매 목록:', data.sales);
});
```

## 제한사항

### 속도 제한 (Rate Limiting)
- API 호출에는 속도 제한이 적용됩니다
- 구체적인 제한은 Gumroad 문서를 참조하세요

### 데이터 제한
- 한 번에 가져올 수 있는 데이터 양에 제한이 있습니다
- 페이지네이션을 사용하여 대량의 데이터를 처리하세요

## 추가 참고사항

- 모든 API 요청은 HTTPS를 통해 이루어져야 합니다
- 액세스 토큰은 안전하게 보관하세요
- API 응답의 `success` 필드를 확인하여 요청 성공 여부를 판단하세요
- 개발 중에는 테스트 환경을 사용하는 것을 권장합니다

더 자세한 정보는 [공식 Gumroad API 문서](https://gumroad.com/api)를 참조하세요.