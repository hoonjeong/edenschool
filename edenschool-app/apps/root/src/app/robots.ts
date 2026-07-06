import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

// 요청 host 기반 sitemap URL이 필요하므로 요청 시 생성
export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSiteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 관리자·API·로그인 필요한 학생 전용 영역은 크롤링 제외
      disallow: [
        '/admin',
        '/api',
        '/myinfo',
        '/lecture',
        '/lecture-view',
        '/test',
        '/test-view',
        '/my-dream',
        '/ai-career',
      ],
    },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
