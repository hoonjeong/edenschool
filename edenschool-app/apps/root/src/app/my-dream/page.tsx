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
    <div className="container mt-4">
      <h4>나의 꿈</h4>

      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">관심 직업</h6>
        </div>
        <div className="card-body">
          {careers.length > 0 ? (
            <ul className="list-group">
              {careers.map((item) => (
                <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <a href={`/carrer-view?id=${item.id1}`}>{item.name}</a>
                  <form action="/api/dream/delete" method="POST" style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="btn btn-sm btn-outline-danger">삭제</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mb-0">저장된 관심 직업이 없습니다.</p>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">관심 학과</h6>
        </div>
        <div className="card-body">
          {majors.length > 0 ? (
            <ul className="list-group">
              {majors.map((item) => (
                <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <a href={`/major-view?id=${item.id1}`}>{item.name}</a>
                  <form action="/api/dream/delete" method="POST" style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="btn btn-sm btn-outline-danger">삭제</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mb-0">저장된 관심 학과가 없습니다.</p>
          )}
        </div>
      </div>

      <div className="mt-3">
        <a href="/carrer" className="btn btn-outline-primary mr-2">진로 검색</a>
        <a href="/major" className="btn btn-outline-primary">학과 검색</a>
      </div>
    </div>
  );
}
