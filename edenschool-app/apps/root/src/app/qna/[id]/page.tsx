import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { sanitizeUserHtml, stripHtml } from '@/lib/sanitize';
import {
  selectQnaPostById,
  selectQnaCommentList,
  updateQnaPostReadCount,
} from '@edenschool/common/queries/qna';
import { QnaComments } from './QnaComments';
import { QnaActions } from './QnaActions';

interface PageProps {
  params: Promise<{ id: string }>;
}

// 동적 메타태그 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await selectQnaPostById(Number(id));
  if (!post) return { title: '질문게시판 - 이든배움국어학원' };

  const description = post.metaDescription || stripHtml(post.contents).slice(0, 150);

  return {
    title: `${post.subject} - 이든배움국어학원 질문게시판`,
    description,
    openGraph: {
      title: `${post.subject} - 이든배움국어학원 질문게시판`,
      description,
      type: 'article',
    },
  };
}

export default async function QnaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const postId = Number(id);
  if (!postId || !Number.isInteger(postId) || postId <= 0) redirect('/qna');

  await updateQnaPostReadCount(postId);

  const post = await selectQnaPostById(postId);
  if (!post) redirect('/qna');

  const comments = await selectQnaCommentList(postId);
  const session = await getSession();
  const currentUserId = session.user?.id;
  const isOwner = currentUserId === post.userId;

  // 렌더링 전 HTML 살균 (이중 방어)
  const safeContents = sanitizeUserHtml(post.contents);
  const plainText = stripHtml(post.contents);

  // JSON-LD 구조화 데이터
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: post.subject,
      text: plainText.slice(0, 500),
      dateCreated: post.date,
      author: { '@type': 'Person', name: post.writer },
      answerCount: comments.length,
      suggestedAnswer: comments.map((c) => ({
        '@type': 'Answer',
        text: c.text,
        dateCreated: c.date,
        author: { '@type': 'Person', name: c.writer },
      })),
    },
  };

  // 클라이언트에 전달할 댓글 데이터 (userId 대신 isOwner boolean)
  const commentsForClient = comments.map((c) => ({
    id: c.id,
    text: c.text,
    isOwner: currentUserId === c.userId,
    writer: c.writer || '',
    date: c.date || '',
  }));

  return (
    <div className="eden-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{post.subject}</h1>
            {isOwner && <QnaActions postId={postId} />}
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
            {post.writer} &middot; {post.date} &middot; 조회 {post.readCount}
          </span>
        </div>
        <div className="eden-card-body">
          <div className="eden-post-body" dangerouslySetInnerHTML={{ __html: safeContents }} />
        </div>
      </div>

      <QnaComments
        postId={postId}
        comments={commentsForClient}
        isLoggedIn={!!currentUserId}
      />

      <a href="/qna" className="eden-btn eden-btn-secondary">
        <i className="fas fa-list"></i> 목록
      </a>
    </div>
  );
}
