'use server'

import {NextRequest, NextResponse} from "next/server";

export async function POST(nextReq: NextRequest) {
    try {
        // Gumroad에서 전송된 form data 파싱
        const formData = await nextReq.formData();
        
        const eventData = {
            sale_id: formData.get('sale_id'),
            product_id: formData.get('product_id'),
            email: formData.get('email'),
            full_name: formData.get('full_name'),
            price: formData.get('price'),
            player_id: formData.get('url_params[player_id]'),
            original_price: formData.get('url_params[price]'),
            refunded: formData.get('refunded'),
            disputed: formData.get('disputed'),
            dispute_won: formData.get('dispute_won'),
            is_recurring_charge: formData.get('is_recurring_charge'),
        };

        console.log("eventData", eventData);

        console.log('🔔 Gumroad Ping 수신:', eventData);

        // 이벤트 타입 결정 및 처리
        if (eventData.refunded === 'true') {
            console.log('💸 환불 처리:', eventData.sale_id);
            // TODO: 환불 처리 로직
        } else if (eventData.disputed === 'true') {
            if (eventData.dispute_won === 'true') {
                console.log('✅ 분쟁 승리:', eventData.sale_id);
                // TODO: 분쟁 승리 처리 로직
            } else {
                console.log('⚠️ 분쟁 발생:', eventData.sale_id);
                // TODO: 분쟁 처리 로직
            }
        } else if (eventData.is_recurring_charge === 'true') {
            console.log('🔄 정기 결제:', eventData.sale_id);
            // TODO: 정기 결제 처리 로직
        } else {
            console.log('🛒 새로운 구매:', eventData.sale_id);
            // TODO: 일반 구매 처리 로직
        }

        // Gumroad에게 성공 응답 (필수!)
        return new Response('OK', { status: 200 });
    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        )
    }
}