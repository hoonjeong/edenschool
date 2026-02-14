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
    <div className="container mt-4">
      <h4>진로 상세</h4>
      <p className="text-muted">워크넷 직업정보 API를 이용한 진로 상세 정보</p>

      <div className="card mb-4">
        <div className="card-body">
          <p className="text-center text-muted py-3">
            직업 상세 정보를 불러오는 중입니다. (직업코드: {id})
          </p>
        </div>
      </div>

      <a href="/carrer" className="btn btn-secondary">목록</a>
    </div>
  );
}
