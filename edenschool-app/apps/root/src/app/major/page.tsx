import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function MajorPage() {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/major');

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>학과 검색</h2>
        <p>워크넷 학과정보 API를 이용한 학과 검색</p>
      </div>

      <div className="eden-card">
        <div className="eden-card-body">
          <form action="/major" method="GET">
            <div className="eden-input-row">
              <input type="text" name="keyword" placeholder="학과명을 입력하세요" />
              <button type="submit" className="eden-btn eden-btn-primary">검색</button>
            </div>
          </form>
        </div>
      </div>

      <div className="eden-empty" style={{ marginTop: 20 }}>
        <i className="fas fa-search"></i>
        학과명을 입력하여 검색하세요.
      </div>
    </div>
  );
}
