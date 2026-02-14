import { requireAdminSession } from '@/lib/admin-session';
import { selectClassInfoAll } from '@edenschool/common/queries/class';
import Link from 'next/link';

export default async function ClassManagerPage() {
  const session = await requireAdminSession();

  const classList = await selectClassInfoAll();

  return (
    <div>
          <h4>수강반 관리</h4>
          <hr />
          <div className="mb-3">
            <Link href="/admin/new-class" className="btn btn-primary btn-sm">수강반 추가</Link>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered table-hover table-sm">
              <thead className="thead-dark">
                <tr>
                  <th>반이름</th>
                  <th>학년</th>
                  <th>요일</th>
                  <th>시간</th>
                  <th>1교시선생</th>
                  <th>2교시선생</th>
                  <th>수강인원</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {classList.map((c: any) => (
                  <tr key={c.id} className={c.liveStatus === 0 ? 'table-secondary' : ''}>
                    <td>{c.name}</td>
                    <td>{c.grade}{c.year}</td>
                    <td>{c.day}</td>
                    <td>{String(c.hour).padStart(2, '0')}:{String(c.minute).padStart(2, '0')}</td>
                    <td>{c.teacherOne}</td>
                    <td>{c.teacherTwo}</td>
                    <td>{c.liveCount}명</td>
                    <td>
                      {c.liveStatus === 1 ? (
                        <span className="badge badge-success">진행</span>
                      ) : (
                        <span className="badge badge-secondary">종강</span>
                      )}
                    </td>
                    <td>
                      <Link href={`/admin/class-info?id=${c.id}`} className="btn btn-info btn-sm mr-1">보기</Link>
                      {c.liveStatus === 1 ? (
                        <form action="/api/admin/class/end" method="post" style={{ display: 'inline' }}>
                          <input type="hidden" name="id" value={c.id} />
                          <button type="submit" className="btn btn-warning btn-sm mr-1">종강</button>
                        </form>
                      ) : (
                        <form action="/api/admin/class/restart" method="post" style={{ display: 'inline' }}>
                          <input type="hidden" name="id" value={c.id} />
                          <button type="submit" className="btn btn-success btn-sm mr-1">재개</button>
                        </form>
                      )}
                      <form action="/api/admin/class/delete" method="post" style={{ display: 'inline' }}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="btn btn-danger btn-sm">삭제</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {classList.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-muted py-3">등록된 수강반이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-muted">총 {classList.length}개 수강반</p>
    </div>
  );
}
