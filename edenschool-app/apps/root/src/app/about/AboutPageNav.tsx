/** 학원소개 3부작 사이를 오가는 하단 네비게이션 */

export type AboutPageKey = 'start' | 'expertise' | 'clinic';

const PAGES: { key: AboutPageKey; label: string; title: string; href: string }[] = [
  { key: 'start', label: '시작', title: '이든배움국어학원의 시작', href: '/' },
  { key: 'expertise', label: '전문성', title: '전문성에 전문성을 더하다', href: '/about/expertise' },
  { key: 'clinic', label: '관리', title: '학원과 과외, 두마리 토끼를 잡다', href: '/about/clinic' },
];

export function AboutPageNav({ current }: { current: AboutPageKey }) {
  const others = PAGES.filter((p) => p.key !== current);

  return (
    <section className="about-pagenav">
      <div className="about-pagenav-inner">
        <span className="about-label">MORE</span>
        <h2>이든배움국어학원 이야기</h2>
        <div className="about-pagenav-grid">
          {others.map((p) => (
            <a className="about-pagenav-card" href={p.href} key={p.key}>
              <span className="about-pagenav-label">{p.label}</span>
              <strong>{p.title}</strong>
              <span className="about-pagenav-more">
                이어서 읽기 <i className="fas fa-arrow-right" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
