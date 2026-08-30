import { headers } from 'next/headers';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import {
  selectPostInfoById,
  selectCommentList,
  updatePostReadCount,
} from '@edenschool/common/queries/post';
import { selectPostFileInfoListById } from '@edenschool/common/queries/file';
import { sanitizeAdminHtml, stripHtml, addImageAlt, absolutizeLegacyPaths } from '@/lib/sanitize';
import { getSiteUrl, SITE_NAME } from '@/lib/site';
import { isCrawler } from '@/lib/crawler';
import { boardListPath, boardPostPath, categoryByCode, encodePathname, isSamePath, DEFAULT_CATEGORY } from '@/lib/board';
import { BoardComments } from './BoardComments';

interface PageProps {
  params: Promise<{ category: string; slug: string }>;
}

/** 슬러그 앞부분의 숫자를 게시글 id 로 해석 ("123-제목" → 123) */
function parseId(slug: string): number | null {
  const m = /^(\d+)(?:-|$)/.exec(slug);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** YouTube/Vimeo embed 링크를 iframe으로 변환 */
function embedVideos(html: string): string {
  return html.replace(
    /<a\s+href="(https?:\/\/(?:www\.)?(?:youtube\.com\/embed\/|player\.vimeo\.com\/video\/)[^"]+)"[^>]*>[^<]*<\/a>/gi,
    '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:16px 0"><iframe src="$1" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>'
  );
}

// 동적 메타태그 생성 (게시글별 제목/설명/OG)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const id = parseId(slug);
  if (!id) return { title: `게시판 - ${SITE_NAME}` };

  const post = await selectPostInfoById(id);
  if (!post) return { title: `게시판 - ${SITE_NAME}` };

  const title = `${post.subject} - ${SITE_NAME}`;
  const description = post.metaDescription || stripHtml(post.contents).slice(0, 150);
  // canonical 은 항상 정식 슬러그 URL. 잘못된 슬러그로 들어와도 한 주소로 합쳐진다.
  const url = `${await getSiteUrl()}${encodePathname(boardPostPath(post))}`;

  return {
    title,
    description,
    keywords: post.metaKeyword || undefined,
    alternates: { canonical: url },
    openGraph: { title, description, type: 'article', url },
  };
}

export default async function BoardPostPage({ params }: PageProps) {
  const { category, slug } = await params;
  const id = parseId(slug);
  if (!id) notFound();

  const post = await selectPostInfoById(id);
  if (!post) notFound();

  // 카테고리·슬러그가 정식 형태와 다르면 정식 URL로 영구 이동 (중복 URL 방지).
  // 요청 경로는 디코딩/인코딩 상태가 환경에 따라 다르므로 isSamePath 로 정규화 비교한다.
  // (단순 문자열 비교는 같은 주소를 다르다고 판단해 무한 리디렉트를 일으킨다.)
  const canonicalPath = boardPostPath(post);
  if (!isSamePath(`/board/${category}/${slug}`, canonicalPath)) {
    permanentRedirect(canonicalPath);
  }

  const cat = categoryByCode(post.category) ?? DEFAULT_CATEGORY;
  const headerList = await headers();
  // 크롤러 방문으로 조회수가 부풀지 않도록 사람 요청에서만 집계
  if (!isCrawler(headerList.get('user-agent'))) {
    await updatePostReadCount(id);
  }

  const files = await selectPostFileInfoListById(id);
  const comments = await selectCommentList(id);
  const session = await getSession();
  const site = await getSiteUrl();

  // JSON-LD 구조화 데이터 (검색엔진/AI 검색용)
  const plainText = stripHtml(post.contents);
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.subject,
      description: post.metaDescription || plainText.slice(0, 150),
      articleBody: plainText.slice(0, 500),
      articleSection: cat.label,
      datePublished: post.date?.replace(/\./g, '-'),
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME },
      mainEntityOfPage: `${site}${encodePathname(canonicalPath)}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '게시판', item: `${site}/board/notice` },
        { '@type': 'ListItem', position: 2, name: cat.label, item: `${site}${boardListPath(cat.slug)}` },
        { '@type': 'ListItem', position: 3, name: post.subject, item: `${site}${encodePathname(canonicalPath)}` },
      ],
    },
  ];

  return (
    <div className="eden-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <nav className="eden-breadcrumb" aria-label="위치">
        <a href="/board/notice">게시판</a>
        <span aria-hidden="true"> &rsaquo; </span>
        <a href={boardListPath(cat.slug)}>{cat.label}</a>
      </nav>

      <div className="eden-card" style={{ marginBottom: 20 }}>
        <div className="eden-card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{post.subject}</h1>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
            {post.writer} &middot; {post.date} &middot; 조회 {post.readCount}
          </span>
        </div>
        <div className="eden-card-body">
          <div className="eden-post-body" dangerouslySetInnerHTML={{ __html: embedVideos(addImageAlt(absolutizeLegacyPaths(sanitizeAdminHtml(post.contents)), post.subject)) }} />
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
                <a href={`/api/board/file/${file.id}`} download>
                  {file.filename}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <BoardComments
        postId={id}
        isLoggedIn={!!session.user}
        comments={comments.map((c) => ({
          id: c.id,
          text: c.text,
          writer: c.writer ?? '',
          date: c.date ?? '',
          isOwner: session.user?.id === c.userId,
        }))}
      />

      <a href={boardListPath(cat.slug)} className="eden-btn eden-btn-secondary">
        <i className="fas fa-list"></i> 목록
      </a>
    </div>
  );
}
