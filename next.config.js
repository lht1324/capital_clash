/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['three'],  // three.js 트랜스파일 설정 추가
    images: {
        domains: ['your-supabase-project.supabase.co'], // Supabase Storage 도메인
    },
}

module.exports = nextConfig 