import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin-session';
import { selectPostList } from '@edenschool/common/queries/post';

export default async function PostInfoPage() {
  const session = await requireAdminSession();

  const posts = await selectPostList();

  return (
    <div>
          <h4>게시물 목록</h4>
          <hr />

          <div className="table-responsive">
            <table className="table table-bordered table-hover table-sm">
              <thead className="thead-dark">
                <tr>
                  <th>번호</th>
                  <th>제목</th>
                  <th style={{ width: '100px' }}>작성자</th>
                  <th style={{ width: '120px' }}>날짜</th>
                  <th style={{ width: '100px' }}>수정하기</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-3">
                      게시물이 없습니다.
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id}>
                      <td className="text-center">{post.id}</td>
                      <td>
                        <a
                          href={`https://edenschool.kr/post-view.html?id=${post.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {post.subject}
                        </a>
                      </td>
                      <td className="text-center">{post.writer}</td>
                      <td className="text-center">{post.date}</td>
                      <td className="text-center">
                        <Link href={`/admin/write?id=${post.id}`}>수정하기</Link>
                      </td>
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
