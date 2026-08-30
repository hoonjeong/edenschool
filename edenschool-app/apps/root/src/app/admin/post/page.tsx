import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin-session';
import { selectPostListByCode } from '@edenschool/common/queries/post';

export default async function PostPage() {
  const session = await requireAdminSession();

  const posts = await selectPostListByCode('P');

  return (
    <div>
          <h4>게시물 관리</h4>
          <hr />
          <div className="mb-3">
            <Link href="/admin/write" className="btn btn-primary btn-sm">
              글쓰기
            </Link>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover table-sm">
              <thead className="thead-dark">
                <tr>
                  <th>제목</th>
                  <th style={{ width: '80px' }}>작성자</th>
                  <th style={{ width: '60px' }}>날짜</th>
                  <th style={{ width: '80px' }}>조회수</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-3">
                      게시물이 없습니다.
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        {/* 이 화면에는 별도 수정 버튼이 없으므로 제목 클릭 = 편집기로 이동.
                            (기존의 /admin/post-info?id= 는 id 를 무시하고 전체 목록만 보여줬다.) */}
                        <Link href={`/admin/write?id=${post.id}`}>
                          {post.subject}
                        </Link>
                      </td>
                      <td className="text-center">{post.writer}</td>
                      <td className="text-center">{post.date}</td>
                      <td className="text-center">{post.readCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-muted">총 {posts.length}건</p>
    </div>
  );
}
