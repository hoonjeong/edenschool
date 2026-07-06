import { selectPostInfoList } from '@edenschool/common/queries/post';
import { BoardList } from '@/components/BoardList';
import { stripHtml } from '@/lib/sanitize';

function toPreview(html?: string): string {
  if (!html) return '';
  const text = stripHtml(html);
  return text.length > 160 ? text.slice(0, 160) + '…' : text;
}

const CATEGORIES = [
  { code: 'N', label: '공지사항' },
  { code: 'S', label: '이든이야기' },
  { code: 'C', label: '입시정보' },
  { code: 'D', label: '입시자료' },
  { code: 'R', label: '수강후기' },
];

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || 'N';
  const list = await selectPostInfoList('P', category);

  return (
    <div className="eden-container">
      <div className="eden-page-header">
        <h2>게시판</h2>
      </div>

      {/* 카테고리 탭 */}
      <div className="eden-tabs">
        {CATEGORIES.map((cat) => (
          <a
            key={cat.code}
            href={`/board?category=${cat.code}`}
            className={`eden-tab${category === cat.code ? ' active' : ''}`}
          >
            {cat.label}
          </a>
        ))}
        <a href="/qna" className="eden-tab">
          질문게시판
        </a>
      </div>

      <BoardList
        items={list.map((item) => ({
          id: item.id,
          subject: item.subject,
          href: `/post-view?id=${item.id}`,
          preview: toPreview(item.contents),
          commentCount: item.commentCount ?? 0,
        }))}
      />
    </div>
  );
}
