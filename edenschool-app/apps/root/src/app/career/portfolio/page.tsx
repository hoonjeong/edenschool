import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { CareerShell } from '@/components/career/CareerShell';
import { PortfolioDeleteButton } from '@/components/career/PortfolioDeleteButton';
import { selectPortfolioByUserId, type PortfolioItem } from '@edenschool/common/queries/career-portfolio';

const SECTIONS: { kind: PortfolioItem['kind']; title: string; icon: string; empty: string; link: string }[] = [
  { kind: 'major', title: '관심 학과', icon: 'fa-graduation-cap', empty: '학과별 국어 선택과목 가이드에서 학과를 저장해 보세요.', link: '/career/major-subjects' },
  { kind: 'job', title: '관심 직업', icon: 'fa-briefcase', empty: '직업별 국어 역량 리포트에서 직업을 저장해 보세요.', link: '/career/job-report' },
  { kind: 'test', title: '심리검사 결과', icon: 'fa-clipboard-check', empty: '진로심리검사 센터에서 검사를 마치고 결과 링크를 저장해 보세요.', link: '/career/test' },
  { kind: 'summary', title: '오늘의 직업 읽기 요약', icon: 'fa-pen', empty: '오늘의 직업 읽기에서 한 문장 요약을 저장해 보세요.', link: '/career/today-job' },
];

function itemHref(item: PortfolioItem): string | null {
  switch (item.kind) {
    case 'major':
      return `/career/major-subjects/${item.refId}`;
    case 'job':
      return `/career/job-report/${item.refId}`;
    case 'test':
      return item.content;
    default:
      return null;
  }
}

export default async function PortfolioPage() {
  const session = await getSession();
  if (!session.user) redirect('/login?referer=/career/portfolio');

  let items: PortfolioItem[] = [];
  let unavailable = false;
  try {
    items = await selectPortfolioByUserId(session.user.id);
  } catch (e) {
    // sql/career-portfolio.sql 미적용 상태
    console.error('career_portfolio select error:', e instanceof Error ? e.message : e);
    unavailable = true;
  }

  return (
    <CareerShell title="나의 진로 포트폴리오" desc={`${session.user.name ?? ''} 학생의 진로 탐색 기록입니다.`}>
      {unavailable ? (
        <div className="eden-empty">
          <i className="fas fa-tools"></i>
          포트폴리오 저장소를 준비하고 있습니다. 잠시 후 다시 이용해 주세요.
        </div>
      ) : (
        SECTIONS.map((sec) => {
          const list = items.filter((i) => i.kind === sec.kind);
          return (
            <div key={sec.kind} className="eden-card" style={{ marginBottom: 16 }}>
              <div className="eden-card-header">
                <i className={`fas ${sec.icon}`}></i> {sec.title}
                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>{list.length}건</span>
              </div>
              <div className="eden-card-body">
                {list.length === 0 ? (
                  <div className="career-note" style={{ marginTop: 0 }}>
                    {sec.empty} <a href={sec.link}>바로 가기</a>
                  </div>
                ) : (
                  <ul className="eden-list-group">
                    {list.map((item) => {
                      const href = itemHref(item);
                      return (
                        <li key={item.id} className="eden-list-item" style={{ alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            {href ? (
                              <a href={href} target={item.kind === 'test' ? '_blank' : undefined} rel={item.kind === 'test' ? 'noopener noreferrer' : undefined}>
                                {item.title}
                                {item.kind === 'test' && <i className="fas fa-external-link-alt" style={{ marginLeft: 6, fontSize: 11 }}></i>}
                              </a>
                            ) : (
                              <strong>{item.title}</strong>
                            )}
                            {item.kind === 'summary' && item.content && <div style={{ fontSize: 14, marginTop: 4, lineHeight: 1.6 }}>{item.content}</div>}
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.insertTime}</div>
                          </div>
                          <PortfolioDeleteButton id={item.id} />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          );
        })
      )}
    </CareerShell>
  );
}
