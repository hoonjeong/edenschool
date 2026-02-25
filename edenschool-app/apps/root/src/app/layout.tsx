import 'bootstrap/dist/css/bootstrap.min.css';
import './student.css';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Navbar } from '@/components/Navbar';
import { BootstrapClient } from '@/components/BootstrapClient';
import { SessionHeartbeatWrapper } from '@/components/SessionHeartbeatWrapper';
import { PopupModal } from '@/components/PopupModal';

export const metadata: Metadata = {
  title: process.env.SITE_TITLE || '부천국어학원 이든배움국어학원',
  description: process.env.SITE_DESCRIPTION || '부천국어학원 이든배움국어학원입니다.',
  keywords: process.env.SITE_KEYWORDS || '부천국어학원,이든배움국어학원',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isAdmin = pathname.startsWith('/admin');
  const isAbout = pathname === '/';

  const bodyClasses = [
    !isAdmin ? 'eden-body' : '',
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
        {!isAdmin && <Navbar />}
        {!isAdmin && <PopupModal />}
        {children}
        {!isAdmin && <SessionHeartbeatWrapper />}
        <BootstrapClient />
      </body>
    </html>
  );
}
