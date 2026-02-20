import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function CarrerViewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/carrer-view');

  const params = await searchParams;
  const id = params.id;
  if (!id) redirect('/carrer');

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>진로 상세</h2>
        <p>워크넷 직업정보 API를 이용한 진로 상세 정보</p>
      </div>

      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-body">
          <div className="eden-empty">
            <i className="fas fa-briefcase"></i>
            직업 상세 정보를 불러오는 중입니다. (직업코드: {id})
          </div>
        </div>
      </div>

      <a href="/carrer" className="eden-btn eden-btn-secondary">
        <i className="fas fa-list"></i> 목록
      </a>
    </div>
  );
}
