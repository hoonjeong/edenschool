import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { selectMyDreamByUserId } from '@edenschool/common/queries/dream';

export default async function MyDreamPage() {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/my-dream');

  const list = await selectMyDreamByUserId(session.user.id);

  const careers = list.filter((d) => d.type === 'C');
  const majors = list.filter((d) => d.type === 'M');

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>나의 꿈</h2>
        <p>관심 직업과 학과를 관리하세요.</p>
      </div>

      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-briefcase"></i> 관심 직업
        </div>
        <div className="eden-card-body">
          {careers.length > 0 ? (
            <ul className="eden-list-group">
              {careers.map((item) => (
                <li key={item.id} className="eden-list-item">
                  <a href={`/carrer-view?id=${item.id1}`}>{item.name}</a>
                  <form action="/api/dream/delete" method="POST" style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="eden-btn eden-btn-danger eden-btn-sm">삭제</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <div className="eden-empty" style={{ padding: '20px 0' }}>
              저장된 관심 직업이 없습니다.
            </div>
          )}
        </div>
      </div>

      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-graduation-cap"></i> 관심 학과
        </div>
        <div className="eden-card-body">
          {majors.length > 0 ? (
            <ul className="eden-list-group">
              {majors.map((item) => (
                <li key={item.id} className="eden-list-item">
                  <a href={`/major-view?id=${item.id1}`}>{item.name}</a>
                  <form action="/api/dream/delete" method="POST" style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="eden-btn eden-btn-danger eden-btn-sm">삭제</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <div className="eden-empty" style={{ padding: '20px 0' }}>
              저장된 관심 학과가 없습니다.
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <a href="/carrer" className="eden-btn eden-btn-outline">
          <i className="fas fa-search"></i> 진로 검색
        </a>
        <a href="/major" className="eden-btn eden-btn-outline">
          <i className="fas fa-search"></i> 학과 검색
        </a>
      </div>
    </div>
  );
}
