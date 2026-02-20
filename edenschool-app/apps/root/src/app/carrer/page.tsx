import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function CarrerPage() {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/carrer');

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>진로 검색</h2>
        <p>워크넷 직업정보 API를 이용한 진로 검색</p>
      </div>

      <div className="eden-card">
        <div className="eden-card-body">
          <form action="/carrer" method="GET">
            <div className="eden-input-row">
              <input type="text" name="keyword" placeholder="직업명을 입력하세요" />
              <button type="submit" className="eden-btn eden-btn-primary">검색</button>
            </div>
          </form>
        </div>
      </div>

      <div className="eden-empty" style={{ marginTop: 20 }}>
        <i className="fas fa-search"></i>
        직업명을 입력하여 검색하세요.
      </div>
    </div>
  );
}
