import { notFound } from 'next/navigation';
import { CareerShell, CareerError } from '@/components/career/CareerShell';
import { getCounsel, cleanText } from '@/lib/careernet/client';

export default async function QnaDetailPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ g?: string }> }) {
  const { code } = await params;
  const { g } = await searchParams;
  if (!/^[A-Z]\d+$/.test(code) || !g || !/^[A-Z0-9]+$/.test(g)) notFound();

  let item;
  try {
    item = await getCounsel(code, g);
  } catch (e) {
    return (
      <CareerShell title="진로 고민 Q&A">
        <CareerError error={e} />
      </CareerShell>
    );
  }
  if (!item) notFound();

  return (
    <CareerShell title="진로 고민 Q&A">
      <div className="eden-card">
        <div className="eden-card-header">
          <i className="fas fa-question-circle"></i> {cleanText(item.question)}
        </div>
        <div className="eden-card-body">
          <div className="career-section-title">
            <i className="fas fa-comment-dots"></i> 상담 답변
          </div>
          <div className="career-text">{cleanText(item.answer)}</div>
          <div className="career-note">출처: 커리어넷 진로상담사례(진로탐험대)</div>
        </div>
      </div>
      <div className="career-eden-box career-mt">
        <strong>이든배움 한마디</strong> — 진로 고민은 글로 정리하면 절반은 풀립니다. 이 답변을 읽고 나의 상황을 한 문단으로 써 보세요. 담당 선생님과의 상담 자료가 됩니다.
      </div>
      <div className="career-mt">
        <a href={`/career/qna?g=${g.charAt(0)}`} className="eden-btn eden-btn-secondary">
          <i className="fas fa-list"></i> 목록으로
        </a>
      </div>
    </CareerShell>
  );
}
