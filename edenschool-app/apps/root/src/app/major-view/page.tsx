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
    <div className="container mt-4">
      <h4>학과 상세</h4>
      <p className="text-muted">워크넷 학과정보 API를 이용한 학과 상세 정보</p>

      <div className="card mb-4">
        <div className="card-body">
          <p className="text-center text-muted py-3">
            학과 상세 정보를 불러오는 중입니다. (학과코드: {id})
          </p>
        </div>
      </div>

      <a href="/major" className="btn btn-secondary">목록</a>
    </div>
  );
}
