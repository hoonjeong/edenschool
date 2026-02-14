import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default async function MajorPage() {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/major');

  return (
    <div className="container mt-4">
      <h4>학과 검색</h4>
      <p className="text-muted">워크넷 학과정보 API를 이용한 학과 검색</p>

      <form action="/major" method="GET" className="mb-4">
        <div className="input-group">
          <input type="text" name="keyword" className="form-control" placeholder="학과명을 입력하세요" />
          <div className="input-group-append">
            <button type="submit" className="btn btn-primary">검색</button>
          </div>
        </div>
      </form>

      <div className="text-center text-muted py-5">
        학과명을 입력하여 검색하세요.
      </div>
    </div>
  );
}
