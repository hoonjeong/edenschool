import type { NextConfig } from 'next';

// 정식 도메인. SITE_URL 이 설정된 운영 환경에서만 www → apex 정규화를 활성화한다.
// (개발/IP 접속 환경에서 잘못된 리디렉트가 걸리지 않도록 미설정 시 건너뛴다.)
const canonicalHost = (() => {
  if (!process.env.SITE_URL) return null;
  try {
    return new URL(process.env.SITE_URL).host.replace(/^www\./, '');
  } catch {
    return null;
  }
})();

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
      // 첨삭 답안 이미지를 여러 장(최대 20장) 서버 액션으로 전달하므로 한도 상향.
      // 클라이언트에서 리사이즈·압축(최대 1600px JPEG)하지만 장수 대비 여유를 둔다.
      bodySizeLimit: '16mb',
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
  async redirects() {
    return [
      // www → apex 도메인 정규화. canonical/sitemap 이 한 호스트로만 노출되게 한다.
      ...(canonicalHost
        ? [
            {
              source: '/:path*',
              has: [{ type: 'host' as const, value: `www.${canonicalHost}` }],
              destination: `https://${canonicalHost}/:path*`,
              permanent: true,
            },
          ]
        : []),
    ];
  },
  async rewrites() {
    return [
      // 레거시 게시물 본문 이미지: image-view.html?id=<file_info.id>
      // 게시글 보기(/post-view)에서 상대경로가 /image-view.html 로 해석됨
      { source: '/image-view.html', destination: '/api/legacy-image' },
      // 에디터(/admin/write)에서는 상대경로가 /admin/image-view.html 로 해석됨 (작성 중 미리보기용)
      { source: '/admin/image-view.html', destination: '/api/legacy-image' },
      // 레거시(구 JSP) 게시글 URL: post-view.html?id=<id>
      // 리디렉트가 아니라 rewrite 로 처리해 /post-view 페이지가 곧바로 정식 slug URL 로 308 이동하게 한다.
      // (301 → 308 두 번 튕기지 않도록 홉을 하나로 줄인다.) 쿼리스트링은 자동 보존.
      { source: '/post-view.html', destination: '/post-view' },
    ];
  },
};

export default nextConfig;
