'use client'

import {supabase} from "@/lib/supabase/supabaseClient";
import {REALTIME_SUBSCRIBE_STATES, RealtimeChannel} from "@supabase/realtime-js";

class SupabaseChannelManager {
    private channel: RealtimeChannel | null;
    private isSubscribed: boolean = false;

    constructor() {
        this.channel = null;
    }

    public subscribeToInvestors(onPayload: (payload: any) => void, onStateChanged: (state: REALTIME_SUBSCRIBE_STATES) => void): void {
        if (this.channel) {
            console.log("⚠️ 이미 구독 중입니다.");
            return;
        }

        console.log("🔄 투자자 실시간 구독 시작");

        this.channel = supabase
            .channel("players_changes")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "players"
                },
                (payload) => {
                    console.log("📡 실시간 투자자 데이터 변경:", payload);
                    onPayload(payload);
                }
            )
            .subscribe((status: REALTIME_SUBSCRIBE_STATES, err: Error | undefined) => {
                if (err) {
                    console.error('❌ 구독 에러:', err);
                    console.error('❌ 구독 에러 상세:', JSON.stringify(err, null, 2));
                } else {
                    console.log("✅ Supabase subscription status:", status);

                    onStateChanged(status);

                    if (status === 'SUBSCRIBED') {
                        console.log('✅ 실시간 구독 성공!');
                    }
                }
            });
    }

    public unsubscribeToInvestors(): void {
        if (this.channel) {
            console.log('🔄 투자자 실시간 구독 해제 시작');
            this.channel.unsubscribe();
            this.channel = null;
            console.log('✅ 실시간 구독 해제 완료');
        } else {
            console.log("⚠️ 구독 중인 채널이 없습니다.");
        }
    }
}

export const supabaseChannelManager = new SupabaseChannelManager();
