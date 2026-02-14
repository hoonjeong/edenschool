import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { selectPostInfoById, selectCommentList, updatePostReadCount } from '@edenschool/common/queries/post';
import { selectPostFileInfoListById } from '@edenschool/common/queries/file';

export default async function PostViewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const id = Number(params.id);
  if (!id) redirect('/board');

  await updatePostReadCount(id);

  const post = await selectPostInfoById(id);
  if (!post) redirect('/board');

  const files = await selectPostFileInfoListById(id);
  const comments = await selectCommentList(id);
  const session = await getSession();

  return (
    <div className="container mt-4">
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-1">{post.subject}</h5>
          <small className="text-muted">
            {post.writer} | {post.date} | 조회 {post.readCount}
          </small>
        </div>
        <div className="card-body">
          <div dangerouslySetInnerHTML={{ __html: post.contents }} />
        </div>
      </div>

      {files.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title">첨부파일</h6>
            <ul className="list-unstyled mb-0">
              {files.map((file) => (
                <li key={file.id}>
                  <a href={`/api/file/download/${file.id}`} download>
                    <i className="fas fa-download" /> {file.filename}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <h6 className="card-title">댓글 ({comments.length})</h6>

          {session.user && (
            <form action="/api/comment" method="POST" className="mb-3">
              <input type="hidden" name="postId" value={id} />
              <input type="hidden" name="userId" value={session.user.id} />
              <div className="input-group">
                <input type="text" name="text" className="form-control" placeholder="댓글을 입력하세요" required />
                <div className="input-group-append">
                  <button type="submit" className="btn btn-primary">등록</button>
                </div>
              </div>
            </form>
          )}

          {comments.length > 0 ? (
            <ul className="list-group">
              {comments.map((c) => (
                <li key={c.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{c.writer}</strong>
                      <small className="text-muted ml-2">{c.date}</small>
                    </div>
                    {session.user && session.user.id === c.userId && (
                      <form action="/api/comment/delete" method="POST" style={{ display: 'inline' }}>
                        <input type="hidden" name="commentId" value={c.id} />
                        <input type="hidden" name="postId" value={id} />
                        <button type="submit" className="btn btn-sm btn-outline-danger">삭제</button>
                      </form>
                    )}
                  </div>
                  <p className="mb-0 mt-1">{c.text}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted mb-0">댓글이 없습니다.</p>
          )}
        </div>
      </div>

      <a href="/board" className="btn btn-secondary">목록</a>
    </div>
  );
}
