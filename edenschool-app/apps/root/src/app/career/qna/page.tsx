import { CareerShell, CareerError } from '@/components/career/CareerShell';
import { listCounsels, type CounselItem } from '@/lib/careernet/client';

/** 상담사례 분류코드(gubun) 첫 글자별 그룹 */
const GROUPS: { key: string; name: string; icon: string }[] = [
  { key: 'A', name: '흥미와 적성', icon: 'fa-heart' },
  { key: 'B', name: '자신감과 갈등', icon: 'fa-balance-scale' },
  { key: 'D', name: '진학과 입시', icon: 'fa-university' },
  { key: 'E', name: '공부와 학교생활', icon: 'fa-pencil-alt' },
  { key: 'C', name: '직업별 궁금증', icon: 'fa-briefcase' },
];

export default async function QnaPage({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
  const { g } = await searchParams;
  const group = GROUPS.find((x) => x.key === g) ?? GROUPS[0];

  let items: CounselItem[] = [];
  try {
    items = await listCounsels();
  } catch (e) {
    return (
      <CareerShell title="진로 고민 Q&A">
        <CareerError error={e} />
      </CareerShell>
    );
  }
  const filtered = items.filter((x) => x.gubun.startsWith(group.key));

  return (
    <CareerShell title="진로 고민 Q&A" desc="또래 학생들의 실제 진로 고민과 커리어넷 전문 상담 답변입니다.">
      <div className="eden-tabs">
        {GROUPS.map((x) => (
          <a key={x.key} href={`/career/qna?g=${x.key}`} className={`eden-tab${x.key === group.key ? ' active' : ''}`}>
            <i className={`fas ${x.icon}`} style={{ marginRight: 6 }}></i>
            {x.name}
          </a>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="eden-empty">사례가 없습니다.</div>
      ) : (
        <ul className="eden-list-group">
          {filtered.map((x) => (
            <li key={x.code} className="eden-list-item">
              <a href={`/career/qna/${x.code}?g=${encodeURIComponent(x.gubun)}`}>
                <i className="far fa-comment-dots" style={{ marginRight: 8, color: '#94a3b8' }}></i>
                {x.memo.trim()}
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="career-note">출처: 커리어넷 진로상담사례(진로탐험대)</div>
    </CareerShell>
  );
}
