import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { selectPostInfoById, selectCommentList, updatePostReadCount } from '@edenschool/common/queries/post';
import { selectPostFileInfoListById } from '@edenschool/common/queries/file';
import { sanitizeAdminHtml } from '@/lib/sanitize';

/** YouTube/Vimeo embed 링크를 iframe으로 변환 */
function embedVideos(html: string): string {
  return html.replace(
    /<a\s+href="(https?:\/\/(?:www\.)?(?:youtube\.com\/embed\/|player\.vimeo\.com\/video\/)[^"]+)"[^>]*>[^<]*<\/a>/gi,
    '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:16px 0"><iframe src="$1" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>'
  );
}

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
    <div className="eden-container">
      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{post.subject}</span>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
            {post.writer} &middot; {post.date} &middot; 조회 {post.readCount}
          </span>
        </div>
        <div className="eden-card-body">
          <div dangerouslySetInnerHTML={{ __html: embedVideos(sanitizeAdminHtml(post.contents)) }} />
        </div>
      </div>

      {files.length > 0 && (
        <div className="eden-card" style={{ marginBottom: 20 }}>
          <div className="eden-card-header">
            <i className="fas fa-paperclip"></i> 첨부파일
          </div>
          <div className="eden-card-body">
            {files.map((file) => (
              <div key={file.id} className="eden-file-item">
                <i className="fas fa-file-alt"></i>
                <a href={`/api/file/download/${file.id}`} download>
                  {file.filename}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header">
          <i className="fas fa-comments"></i> 댓글 ({comments.length})
        </div>
        <div className="eden-card-body">
          {session.user && (
            <form action="/api/comment" method="POST" style={{ marginBottom: comments.length > 0 ? 16 : 0 }}>
              <input type="hidden" name="postId" value={id} />
              <input type="hidden" name="userId" value={session.user.id} />
              <div className="eden-input-row">
                <input type="text" name="text" placeholder="댓글을 입력하세요" required />
                <button type="submit" className="eden-btn eden-btn-primary">등록</button>
              </div>
            </form>
          )}

          {comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="eden-comment">
                <div className="eden-comment-header">
                  <div>
                    <span className="eden-comment-author">{c.writer}</span>
                    <span className="eden-comment-date" style={{ marginLeft: 8 }}>{c.date}</span>
                  </div>
                  {session.user && session.user.id === c.userId && (
                    <form action="/api/comment/delete" method="POST" style={{ display: 'inline' }}>
                      <input type="hidden" name="commentId" value={c.id} />
                      <input type="hidden" name="postId" value={id} />
                      <button type="submit" className="eden-btn eden-btn-danger eden-btn-sm">삭제</button>
                    </form>
                  )}
                </div>
                <p className="eden-comment-text">{c.text}</p>
              </div>
            ))
          ) : (
            <div className="eden-empty" style={{ padding: '20px 0' }}>
              댓글이 없습니다.
            </div>
          )}
        </div>
      </div>

      <a href="/board" className="eden-btn eden-btn-secondary">
        <i className="fas fa-list"></i> 목록
      </a>
    </div>
  );
}
