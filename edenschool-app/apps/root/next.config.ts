import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '0' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  transpilePackages: ['@edenschool/common'],
  serverExternalPackages: ['pdf-parse', 'cfb', 'exceljs', '@prisma/client', '@prisma/adapter-mariadb', 'mariadb'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      // 레거시 게시물 본문 이미지: image-view.html?id=<file_info.id>
      // 게시글 보기(/post-view)에서 상대경로가 /image-view.html 로 해석됨
      { source: '/image-view.html', destination: '/api/legacy-image' },
      // 에디터(/admin/write)에서는 상대경로가 /admin/image-view.html 로 해석됨 (작성 중 미리보기용)
      { source: '/admin/image-view.html', destination: '/api/legacy-image' },
    ];
  },
};

export default nextConfig;
