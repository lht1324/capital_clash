import {createClient, RealtimeClientOptions, SupabaseClient} from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Supabase 클라이언트 인스턴스를 생성하는 함수
function createSupabaseClient(): SupabaseClient<Database> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase 환경 변수가 설정되지 않았습니다.')
    }

    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
            // Sup
            WebSocket: (url: string) => new WebSocket(url),
        } as unknown as RealtimeClientOptions,
    });
}

// 앱 전체에서 공유될 단일 클라이언트 인스턴스
export const supabase = createSupabaseClient();
