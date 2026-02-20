import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function MajorViewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/major-view');

  const params = await searchParams;
  const id = params.id;
  if (!id) redirect('/major');

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>학과 상세</h2>
        <p>워크넷 학과정보 API를 이용한 학과 상세 정보</p>
      </div>

      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-body">
          <div className="eden-empty">
            <i className="fas fa-graduation-cap"></i>
            학과 상세 정보를 불러오는 중입니다. (학과코드: {id})
          </div>
        </div>
      </div>

      <a href="/major" className="eden-btn eden-btn-secondary">
        <i className="fas fa-list"></i> 목록
      </a>
    </div>
  );
}
