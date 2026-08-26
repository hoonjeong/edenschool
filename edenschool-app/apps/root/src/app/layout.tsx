import 'bootstrap/dist/css/bootstrap.min.css';
import './student.css';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { BootstrapClient } from '@/components/BootstrapClient';
import { SessionHeartbeatWrapper } from '@/components/SessionHeartbeatWrapper';
import { PopupModal } from '@/components/PopupModal';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: process.env.SITE_TITLE || '부천국어학원 이든배움국어학원',
  // 검색결과 스니펫으로 그대로 노출되는 문구. 학원 특징이 드러나도록 구체적으로 작성한다.
  description:
    process.env.SITE_DESCRIPTION ||
    '부천 상동 국어 전문학원. 상원고·상동고·송내고·부명고·정명고 등 학교별 전담 선생님이 내신 시험 유형에 맞춰 지도합니다. 중·고등 국어, 수능올인반, 초등 독서논술 운영.',
  keywords:
    process.env.SITE_KEYWORDS ||
    '부천국어학원,이든배움국어학원,상동국어학원,부천 고등국어,부천 중등국어,상원고 국어,상동고 국어,송내고 국어,부명고 국어,정명고 국어,상일고 국어,수능국어,초등 독서논술',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: process.env.SITE_TITLE || '부천국어학원 이든배움국어학원',
    title: process.env.SITE_TITLE || '부천국어학원 이든배움국어학원',
    description:
      process.env.SITE_DESCRIPTION ||
      '부천 상동 국어 전문학원. 학교별 전담 선생님이 내신 시험 유형에 맞춰 지도합니다. 중·고등 국어, 수능올인반, 초등 독서논술 운영.',
    url: SITE_URL,
    images: [{ url: '/assets/img/logo.jpg' }],
  },
  // 네이버 서치어드바이저 사이트 소유확인 (구글은 DNS TXT로 확인됨)
  verification: {
    other: { 'naver-site-verification': 'e8eda68484bfe78170300bf88ae39b63b9364c7a' },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isAdmin = pathname.startsWith('/admin');
  // /reading(독서교육원)은 자체 레이아웃(AppShell)을 쓰므로 학생용 크롬(Navbar 등) 제외
  const isReading = pathname.startsWith('/reading');
  const isPlain = isAdmin || isReading;
  const isAbout = pathname === '/';

  const bodyClasses = [
    !isPlain ? 'eden-body' : '',
    isAbout ? 'eden-about-page' : '',
  ].filter(Boolean).join(' ') || undefined;

  return (
    <html lang="ko">
      <head>
        <link href="https://fonts.googleapis.com/css?family=Black+Han+Sans:400" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css?family=Nanum+Gothic:400" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.0/css/all.css" integrity="sha384-lZN37f5QGtY3VHgisS14W3ExzMWZxybE1SJSEsQp9S+oqd12jhcu+A56Ebc1zFSJ" crossOrigin="anonymous" />
      </head>
      <body className={bodyClasses}>
        {!isPlain && <Navbar />}
        {!isPlain && isAbout && <PopupModal />}
        {children}
        {!isPlain && <SessionHeartbeatWrapper />}
        <BootstrapClient />
      </body>
    </html>
  );
}
