import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// channel 뻑 났을 때 비상용
// function createSupabaseClient(): SupabaseClient<Database> {
//     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
//     const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
//
//     if (!supabaseUrl || !supabaseAnonKey) {
//         throw new Error('Supabase 환경 변수가 설정되지 않았습니다.')
//     }
//
//     return createClient<Database>(supabaseUrl, supabaseAnonKey, {
//         auth: {
//             autoRefreshToken: true,
//             persistSession: true,
//             detectSessionInUrl: true,
//         },
//         realtime: {
//             params: {
//                 eventsPerSecond: 10,
//             },
//             // ----- Temporary Solution -----
//             WebSocket: (url: string) => new WebSocket(url),
//         } as unknown as RealtimeClientOptions,
//     });
// }

// 앱 전체에서 공유될 단일 클라이언트 인스턴스
export const supabase = createClient();
