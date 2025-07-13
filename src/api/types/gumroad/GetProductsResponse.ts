export interface GetProductsResponse {
    success: boolean;
    products: Product[];
}

/** Gumroad 상품 응답용 타입  */
export interface Product {
    name: string;
    preview_url: string | null;          // 미리보기 파일 URL
    description: string;                 // HTML 설명
    customizable_price: boolean;         // PWYW 여부
    require_shipping: boolean;           // 실제 배송 필요 여부
    custom_receipt: string | null;
    custom_permalink: string | null;
    subscription_duration: number | null;
    id: string;                          // Gumroad 내부 ID(Base64-like)
    url: string | null;                  // 완전한 상품 URL(없을 수 있음)
    price: number;                       // 기본가(￠ 단위)
    currency: string;                    // 통화 코드(e.g. “usd”)
    short_url: string;                   // 짧은 URL
    thumbnail_url: string | null;
    tags: string[];                      // 태그 목록
    formatted_price: string;             // 예: “$1+”
    published: boolean;
    file_info: Record<string, unknown>;  // 첨부 파일 메타
    max_purchase_count: number | null;   // 구매 한도(없으면 null)
    deleted: boolean;
    custom_fields: unknown[];            // Checkout Custom Fields
    custom_summary: string | null;       // 요약 문구
    is_tiered_membership: boolean;       // 멤버십 상품 여부
    recurrences: unknown | null;         // 구독 옵션(멤버십일 때)
    variants: unknown[];                 // 상품 변형
    custom_delivery_url: string | null;  // 결제 후 리다이렉트 URL
    sales_count: number;                 // 판매 횟수
    sales_usd_cents: number;             // 총 매출(센트)
}