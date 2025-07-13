export interface GetSalesResponse {
    success: boolean,
    next_page_url: string,
    next_page_key: string,
    sales: Sale[],
}
/** ──────────────────────────────────────────────────────────────
 *  Gumroad “Sale” 통합 타입
 *  두 가지 소스(공식 예시 · AI 명세)의 필드를 모두 포괄한다.
 *  ⇒ 사용처에 따라 대부분의 필드를 optional(?) 로 두어
 *     빠진 값이 있어도 타입 오류 없이 파싱·가공 가능하도록 설계.
 * ────────────────────────────────────────────────────────────── */

export interface Sale {
    /** 기본 식별자 및 상품 */
    id: string;
    product_id: string;
    product_name: string;

    /** 구매자 정보 */
    email: string;
    full_name?: string;          // 일부 응답엔 없음
    purchase_email?: string;     // 공식 예시용 별칭
    country?: string;
    zip_code?: string;

    /** 판매자·퍼처서 */
    seller_id?: string;
    purchaser_id?: string;

    /** 가격 · 통화 */
    price: number;               // ¢ 단위
    currency?: string;           // “usd”
    currency_symbol?: string;    // “$”
    formatted_display_price?: string;
    formatted_total_price?: string;
    amount_refundable_in_currency?: string;
    gumroad_fee?: number;        // 공식 예시(¢)
    gumroad_fee_charged?: number;
    discover_fee_charged?: number | boolean; // 예시엔 boolean false
    is_additional_contribution?: boolean;

    /** 시간 */
    created_at: string;          // ISO8601
    timestamp?: string;          // “about …”
    daystamp?: string;           // “5 Jan 2021 11:38 AM”

    /** 결제 상태 */
    refunded?: boolean;
    partially_refunded?: boolean;
    disputed?: boolean;
    dispute_won?: boolean;
    chargedback?: boolean;
    paid?: boolean;

    /** 구독 · 멤버십 */
    subscription_id?: string | null;
    subscription_duration?: 'weekly' | 'monthly' | 'yearly' | string | null;
    subscription_payment_number?: number;
    subscription_cancelled_at?: string | null;
    subscription_failed_at?: string | null;
    subscription_ended_at?: string | null;
    is_recurring_billing?: boolean;
    recurring_charge?: boolean;
    cancelled?: boolean;   // 구독 취소 여부
    ended?: boolean;       // 구독 종료 여부

    /** 라이선스 */
    license_key?: string | null;
    license_id?: string | null;
    license_disabled?: boolean;

    /** 커스텀 필드·변수 */
    custom_fields?: Record<string, string>;
    has_custom_fields?: boolean;
    variants?: Record<string, string>;            // { "Tier": "Premium" }
    has_variants?: boolean;
    variants_and_quantity?: string;               // “(Premium)”
    product_has_variants?: boolean;

    /** 배송 주소 (실물 상품) */
    shipping_address?: {
        name: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };

    /** 주문·수량·참고 */
    order_number?: string;   // AI 명세(문자열)
    order_id?: number;       // 공식 예시(숫자)
    quantity?: number;
    is_product_physical?: boolean;
    referrer?: string;       // “direct” 등

    /** 선물 */
    is_gift?: boolean;                 // AI 명세
    is_gift_sender_purchase?: boolean; // 공식 예시
    is_gift_receiver_purchase?: boolean;
    gift_email?: string | null;
    gift_note?: string | null;

    /** 결제 수단 */
    card?: {
        brand?: string;   // AI 명세(“visa” 등)
        last4?: string;
        visual?: string | null;  // 공식 예시
        type?: string | null;
    };
    paypal?: {
        payer_id: string;
        payment_id: string;
    };

    /** 제휴·쿠폰·오퍼 */
    affiliate?: {
        id?: string;          // AI 명세
        email?: string;       // 둘 다 존재
        amount?: string;      // “$2.50”
    };
    offer_code?: {
        name: string;                 // “FLAT50”
        displayed_amount_off: string; // “50%”
    };

    /** 기타 */
    product_permalink?: string;
    can_contact?: boolean;
    is_following?: boolean;
}