import '../about.css';
import { AboutClient } from '../AboutClient';
import { AboutFooter } from '../AboutFooter';
import { AboutPageNav } from '../AboutPageNav';

export const metadata = {
  title: '학원과 과외, 두마리 토끼를 잡다 | 이든배움국어학원',
  description:
    '강의와 자료는 대형학원의 체계로 전문성 있게, 관리는 매주 진행되는 1:1 클리닉으로 과외처럼 개별 맞춤 보충합니다. 이든배움국어학원이 학원과 과외를 함께 잡는 방식입니다.',
};

/** 이 글의 두 축 — 강의·자료 / 관리 */
const AXES = [
  {
    icon: 'fas fa-layer-group',
    tag: '강의와 자료',
    title: '대형학원의 체계로',
    desc: '학교별 전담제로 강의와 자료의 전문성을 더욱 강화하고, 동영상 강의 시스템이나 자료 시스템 구축 등 혼자서는 만들 수 없는 시스템을 구축하였습니다.',
  },
  {
    icon: 'fas fa-user-check',
    tag: '관리',
    title: '과외식 1:1 밀착 클리닉으로',
    desc: '매주 진행되는 1:1 밀착 클리닉으로 수업 이해도를 점검하며, 학생마다 부족한 부분을 따로 보충합니다. 수업은 학교별로 함께하지만, 클리닉 관리는 개별로 진행합니다.',
  },
];

/** 강의와 자료 — 대형학원의 체계 3축 */
const SYSTEM_CARDS = [
  {
    icon: 'fas fa-route',
    title: '학교별 전담제',
    desc: '학교별 전담제 시스템으로, 학교마다 전담 선생님이 있어 강의와 자료, 수업의 내용 등 학교별 수업의 전문성을 강화하였습니다.',
  },
  {
    icon: 'fas fa-folder-open',
    title: '학교별 기출과 자료',
    desc: '18년 동안 학교별 기출과 내신 자료, 수행평가 유형이 쌓였습니다. 시험마다 자체 제작 교재와 예상 문제로 시험지의 결을 미리 맞춰봅니다.',
  },
  {
    icon: 'fas fa-chalkboard-teacher',
    title: '강의 시스템',
    desc: '5개 전문관과 동영상 강의, 온라인 학습 관리까지. 빠진 수업은 강의로 따라잡고, 학습 이력은 기록으로 남습니다.',
  },
];

/** 학원 / 과외 / 이든배움 비교 */
const COMPARE_ROWS = [
  { item: '커리큘럼', academy: '체계적', tutor: '선생님 개인차', eden: '학교별 맞춤 커리큘럼' },
  { item: '기출 · 자료', academy: '풍부함', tutor: '확보 어려움', eden: '18년간 쌓인 학교별 자료' },
  { item: '강의', academy: '전문 강사진', tutor: '1:1 설명', eden: '학교 전담 선생님 강의' },
  { item: '개별 보충', academy: '부족함', tutor: '밀착 보충', eden: '매주 1:1 클리닉' },
  { item: '관리 단위', academy: '반 단위', tutor: '학생 단위', eden: '수업은 반 단위, 관리는 학생 단위' },
];

export default function ClinicPage() {
  return (
    <>
      <AboutClient />

      {/* Hero */}
      <section className="about-hero">
        <video
          className="about-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/api/video/back.mp4" type="video/mp4" />
        </video>
        <div className="about-hero-overlay-top" />
        <div className="about-hero-overlay-bottom" />
        <div className="about-hero-content">
          <h1>학원과 과외,<br />두마리 토끼를 잡다</h1>
          <p>강의와 자료는 학원처럼, 관리는 과외처럼</p>
          <div className="about-scroll-indicator">
            <span>스크롤</span>
            <i className="fas fa-chevron-down" />
          </div>
        </div>
      </section>

      {/* Section 1: 오래된 고민 + 두 축 제시 */}
      <section className="about-section" data-animate>
        <div className="about-section-inner">
          <span className="about-label">DILEMMA</span>
          <h2>학원이냐, 과외냐</h2>

          <div className="about-quote">
            강의와 자료는 학원이 낫고,<br />
            관리는 과외가 낫다
          </div>

          <p>
            학부모님들께서 오래 하시던 고민입니다.
          </p>

          <p>
            학원은 커리큘럼과 자료, 강의의 전문성이 있지만{' '}
            <strong>학생 한 명을 따로 챙기기는 어렵고</strong>,
            과외는 개별 관리는 되지만{' '}
            <strong>학교별 분석, 자료나 커리큘럼의 전문성이 부족한 경우가 많습니다.</strong>
          </p>

          <p>
            그래서 둘 중 하나를 고르고 나머지 하나는 포기하는 것이
            오랫동안 당연한 일이었습니다.
          </p>

          <div className="about-highlight">
            이든배움국어학원은 이 둘을 나눠서 해결했습니다.
          </div>

          <div className="about-card-grid about-card-grid-2" data-animate>
            {AXES.map((a) => (
              <div className="about-card" key={a.tag}>
                <div className="about-card-icon"><i className={a.icon} /></div>
                <span className="about-card-tag">{a.tag}</span>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: 강의와 자료 = 대형학원의 체계 */}
      <section className="about-section about-section-gray" data-animate>
        <div className="about-section-inner">
          <span className="about-label">LECTURE &amp; DATA</span>
          <h2>강의와 자료는,<br /><span className="accent">대형학원의 체계</span>로</h2>

          <p>
            좋은 관리가 좋은 수업을 대신할 수는 없습니다.
            <br />먼저 <strong>강의와 자료의 전문성</strong>부터 갖춰야 한다고 생각했습니다.
          </p>

          <p>
            18년 동안 5개 전문관으로 성장하며,
            학원의 규모가 있어야만 만들 수 있는 것들을 쌓아왔습니다.
          </p>

          <div className="about-card-grid" data-animate>
            {SYSTEM_CARDS.map((c) => (
              <div className="about-card" key={c.title}>
                <div className="about-card-icon"><i className={c.icon} /></div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>

          <p>
            여기까지는 체계를 갖춘 학원이라면 해낼 수 있는 부분입니다.
            <br />이든배움국어학원이 한 걸음 더 들어간 곳은 그다음, <strong>관리</strong>입니다.
          </p>
        </div>
      </section>

      {/* Section 3: 관리 = 매주 1:1 클리닉 */}
      <section className="about-section" data-animate>
        <div className="about-section-inner">
          <span className="about-label">CARE</span>
          <h2>관리는,<br />매주 진행되는 <span className="accent">1:1 클리닉</span>으로</h2>

          <p>
            아무리 좋은 커리큘럼과 자료도,
            그 수업을 듣는 학생이 어디서 막혔는지 모르면 소용이 없습니다.
          </p>

          <p>
            그리고 막히는 지점은 학생마다 다르기 때문에,
            보충은 반 단위가 아니라 <strong>한 명 단위</strong>여야 합니다.
            <br />그래서 이든배움국어학원은 정규수업과 별도로,{' '}
            <strong>매주 1:1 클리닉</strong>을 운영합니다.
          </p>

          <p>
            정규수업이 끝나면 그걸로 끝이 아닙니다.
            매주 정해진 시간에 학생 한 명씩 따로 마주 앉아,
            수업 이해도를 점검하고 부족한 부분을 채웁니다.
            <br />문제가 생겼을 때만 부르는 보충이 아니라,{' '}
            <strong>처음부터 커리큘럼 안에 들어 있는 시간</strong>입니다.
          </p>

          <div className="about-feature-card">
            <p>
              이것은 한 선생님이 <strong>한 학교만 전담</strong>하기 때문에 가능한 일입니다.
              담당 학교를 늘리지 않는 이유도 여기에 있습니다.
              수업 준비에 쫓기지 않아야, 학생 한 명과 따로 마주 앉을 시간이 남습니다.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: 비교 */}
      <section className="about-section about-section-gray" data-animate>
        <div className="about-section-inner">
          <span className="about-label">COMPARE</span>
          <h2>학원의 강의와 자료,<br />과외의 관리를 <span className="accent">한 곳에서</span></h2>

          <div className="about-compare" data-animate>
            <table>
              <thead>
                <tr>
                  <th scope="col">&nbsp;</th>
                  <th scope="col">일반 학원</th>
                  <th scope="col">과외</th>
                  <th scope="col" className="about-compare-eden">이든배움국어학원</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((r) => (
                  <tr key={r.item}>
                    <th scope="row">{r.item}</th>
                    <td>{r.academy}</td>
                    <td>{r.tutor}</td>
                    <td className="about-compare-eden">{r.eden}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 5: 마무리 */}
      <section className="about-section about-section-closing-gradient" data-animate>
        <div className="about-section-inner">
          <div className="about-quote">
            강의와 자료는 학원처럼,<br />
            관리는 과외처럼
          </div>

          <p>
            대형학원의 체계 위에 과외의 개별 관리를 얹는 일은
            품이 훨씬 많이 드는 방식입니다.
          </p>

          <p>
            그럼에도 이 방식을 고집하는 이유는,
            그것이 학생에게 가장 좋은 가르침이라고 믿기 때문입니다.
          </p>

          <p className="about-highlight">
            학원과 과외, 두마리 토끼를 잡다
          </p>
        </div>
      </section>

      <AboutPageNav current="clinic" />

      <AboutFooter />
    </>
  );
}
