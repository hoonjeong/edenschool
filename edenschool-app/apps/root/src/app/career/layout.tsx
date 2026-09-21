import './career.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이든 진로국어 | 이든배움국어학원',
  description: '커리어넷 공공 데이터로 보는 진로와 국어 역량. 학과별 국어 선택과목, 직업별 국어 역량 리포트, 진로심리검사, 부천 고등학교 정보.',
};

// 커리어넷 API 호출과 세션 확인이 있어 요청 시 렌더링
export const dynamic = 'force-dynamic';

export default function CareerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
