import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
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
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
