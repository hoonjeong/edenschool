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
      // 관리자·API·로그인 필요한 학생 전용 영역은 크롤링 제외.
      // middleware.ts 의 protectedPaths 와 짝을 이룬다(로그인 리디렉트만 받는 크롤 예산 낭비 방지).
      disallow: [
        '/admin',
        '/api',
        '/reading',
        '/myinfo',
        '/lecture',
        '/lecture-view',
        '/free-lecture',
        '/special-lecture',
        '/school-lecture',
        '/test',
        '/test-view',
        '/carrer',
        '/carrer-view',
        '/major',
        '/major-view',
        '/my-dream',
        '/ai-career',
        '/login',
        '/logout',
        '/join',
        '/join-step2',
        '/find-email',
        '/find-pass',
        '/qna/write',
        // 주의: 레거시 /post-view, /post-view.html 은 절대 disallow 하지 않는다.
        // 크롤러가 접근하지 못하면 301 을 볼 수 없어 기존 색인의 링크 자산이 새 URL로 승계되지 않는다.
      ],
    },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
