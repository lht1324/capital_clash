# Gumroad Ping 문서

## 개요

Gumroad Ping은 제품이 구매될 때마다 실시간으로 알려주는 간단한 알림 서비스입니다.

예를 들어, Gumroad Ping을 다음과 같은 용도로 사용할 수 있습니다:

* 웹사이트에서 구매자에게 공개적으로 감사 인사하기
* QR 코드 생성하기
* 자체 플랫폼에 계정 생성하기

## 작동 방식

Ping은 계정 설정에서 지정한 URL로 **HTTP POST 요청** 형태로 전송됩니다. 

### 기술적 세부사항

- **페이로드 형식**: `x-www-form-urlencoded`
- **재시도 정책**: 엔드포인트가 200 HTTP 상태 코드를 반환하지 않으면, POST는 3시간 동안 1시간마다 한 번 재시도됩니다
- **보안**: HTTPS 엔드포인트 사용을 강력히 권장합니다

## API 구독

API를 통해 향후 판매 알림을 구독할 수도 있습니다.

## 전송되는 파라미터

각 요청에서 Gumroad는 다음 파라미터들을 전송합니다:

| 파라미터 | 설명 |
|----------|------|
| `sale_id` | 판매 고유 식별자 |
| `sale_timestamp` | 판매가 발생한 시간 |
| `order_number` | sale_id의 숫자 버전 |
| `seller_id` | 판매자 고유 식별자 |
| `product_id` | 제품 고유 식별자 |
| `product_permalink` | 제품의 고유 링크 |
| `short_product_id` | 제품의 짧은 고유 식별자 |
| `product_name` | 제품 이름 |
| `email` | 구매자의 이메일 주소 |
| `url_params` | URL 매개변수 딕셔너리 |
| `full_name` | 구매자 이름 (제공된 경우) |
| `price` | 구매 가격 (센트 단위) |
| `gumroad_fee` | Gumroad 수수료 (센트 단위) |
| `currency` | 통화 코드 (예: USD, EUR) |
| `quantity` | 구매 수량 |
| `discover_fee_charged` | 발견 수수료 부과 여부 |
| `can_contact` | 연락 가능 여부 |
| `referrer` | 추천인 URL |
| `card` | 사용된 카드 정보 |
| `order_id` | 주문 ID |
| `used_coupon` | 사용된 쿠폰 정보 |
| `custom_fields` | 커스텀 필드 정보 |
| `shipping_information` | 배송 정보 |
| `is_recurring_charge` | 정기 결제 여부 |
| `affiliate` | 제휴사 정보 |
| `affiliate_credit_amount_cents` | 제휴사 크레딧 금액 (센트 단위) |
| `ip_country` | 구매자의 IP 국가 |
| `is_gift_receiver_purchase` | 선물 수령자 구매 여부 |
| `refunded` | 환불 여부 |
| `disputed` | 분쟁 여부 |
| `dispute_won` | 분쟁 승리 여부 |
| `id` | 고유 ID |
| `created_at` | 생성 시간 |
| `updated_at` | 업데이트 시간 |
| `test` | 테스트 구매 여부 |

## 구현 예시

### 기본 웹훅 엔드포인트 설정

```javascript
// Express.js 예시
app.post('/gumroad/ping', (req, res) => {
    const {
        sale_id,
        product_id,
        email,
        price,
        product_name,
        full_name
    } = req.body;
    
    console.log('새로운 구매:', {
        sale_id,
        product_id,
        email,
        price,
        product_name,
        full_name
    });
    
    // 구매 처리 로직
    // ...
    
    // 200 상태 코드 반환 (중요!)
    res.status(200).send('OK');
});
```

### Next.js API Route 예시

```javascript
// /api/gumroad/ping/route.ts
export async function POST(request) {
    try {
        const formData = await request.formData();
        
        const saleData = {
            sale_id: formData.get('sale_id'),
            product_id: formData.get('product_id'),
            email: formData.get('email'),
            price: formData.get('price'),
            product_name: formData.get('product_name'),
            full_name: formData.get('full_name')
        };
        
        // 구매 처리 로직
        await processPurchase(saleData);
        
        return new Response('OK', { status: 200 });
    } catch (error) {
        console.error('Gumroad ping 처리 오류:', error);
        return new Response('Error', { status: 500 });
    }
}
```

## 설정 방법

1. **Gumroad 계정** 로그인
2. **Settings** → **Advanced** 탭으로 이동
3. **"Ping endpoint"** 필드에 웹훅 URL 입력
   - 예: `https://yoursite.com/api/gumroad/ping`
4. **"Update settings"** 클릭하여 저장
5. **"Send test ping to URL"** 버튼으로 테스트

## 보안 고려사항

### HTTPS 사용
- 보안상의 이유로 **HTTPS 엔드포인트 사용을 강력히 권장**합니다

### 요청 검증
- Gumroad에서 온 요청인지 검증하는 로직을 구현하는 것이 좋습니다
- IP 화이트리스트 또는 서명 검증 사용 고려

### 오류 처리
- 엔드포인트는 반드시 **200 HTTP 상태 코드**를 반환해야 합니다
- 그렇지 않으면 Gumroad가 재시도합니다

## 활용 사례

### 1. 자동 계정 생성
```javascript
if (product_id === 'your_subscription_product_id') {
    await createUserAccount(email, full_name);
    await sendWelcomeEmail(email);
}
```

### 2. 라이센스 키 발급
```javascript
if (product_id === 'your_software_product_id') {
    const licenseKey = generateLicenseKey();
    await saveLicense(email, licenseKey);
    await sendLicenseEmail(email, licenseKey);
}
```

### 3. 접근 권한 부여
```javascript
if (product_id === 'your_course_product_id') {
    await grantCourseAccess(email);
    await sendAccessInstructions(email);
}
```

## 주의사항

1. **중복 처리**: 같은 `sale_id`가 여러 번 올 수 있으므로 중복 처리 방지 로직 필요
2. **데이터 검증**: 받은 데이터의 유효성을 항상 검증
3. **에러 로깅**: 처리 실패 시 적절한 로깅 구현
4. **응답 속도**: 웹훅 처리는 빠르게 완료하고 200 응답 반환

이 문서는 Gumroad Ping의 모든 기능과 구현 방법을 포함하고 있습니다.