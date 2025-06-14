/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['three'],  // three.js 트랜스파일 설정 추가
    images: {
        domains: ['https://azfjxkiykdztdarmenst.supabase.co', 'lh3.googleusercontent.com'], // Supabase Storage 도메인 및 Google 이미지 호스트
    },
}

module.exports = nextConfig 
