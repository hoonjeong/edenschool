import '../about.css';
import { AboutClient } from '../AboutClient';
import { AboutFooter } from '../AboutFooter';
import { AboutPageNav } from '../AboutPageNav';

export const metadata = {
  title: '전문성에 전문성을 더하다 | 이든배움국어학원',
  description:
    '이든배움국어학원은 학교별 전담 선생님 시스템으로 운영합니다. 한 선생님이 한 학교의 1·2·3학년을 전담하여 시험 유형과 수행평가까지 학교의 전문성을 쌓아갑니다.',
};

/** 학교별 전담 선생님 배정 현황 */
const TEACHERS = [
  { school: '상원고', name: '김보름 선생님' },
  { school: '송내고', name: '이우용 선생님' },
  { school: '상동고', name: '이창완 선생님' },
  { school: '부명고', name: '박옥선 선생님' },
  { school: '정명고', name: '박정영 선생님' },
  { school: '상일고', name: '권지영 선생님' },
  { school: '중원고 · 중흥고', name: '김소솜 선생님' },
];

export default function ExpertisePage() {
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
          <h1>전문성에 전문성을 더하다</h1>
          <p>학교별 전담 선생님 시스템</p>
          <div className="about-scroll-indicator">
            <span>스크롤</span>
            <i className="fas fa-chevron-down" />
          </div>
        </div>
      </section>

      {/* Section 1: 전문성이란 무엇일까요 */}
      <section className="about-section" data-animate>
        <div className="about-section-inner">
          <span className="about-label">QUESTION</span>
          <h2>그런데, <span className="accent">전문성</span>이란 무엇일까요?</h2>

          <p>
            이든배움국어학원은 국어 전문성을 높이기 위해 최선을 다합니다.
          </p>

          <div className="about-quote">
            선생님의 뛰어난 강의 실력과 학교별 반 구성은<br />
            이제 국어학원의 <strong>기본</strong>이 되었습니다.
          </div>

          <p>
            그렇다면 그 기본 위에 무엇을 더 쌓아야 할까요.
            <br />더 나은 전문성을 위해 오래 고민했고,
          </p>

          <div className="about-highlight">
            &ldquo;학교별 전담 선생님 시스템&rdquo;에서 답을 찾았습니다.
          </div>
        </div>
      </section>

      {/* Section 2: 학교별 전담 선생님 */}
      <section className="about-section about-section-gray" data-animate>
        <div className="about-section-inner">
          <span className="about-label">SYSTEM</span>
          <h2>학교별 전담 선생님이<br /><span className="accent">학교의 전문성</span>을 쌓아갑니다</h2>

          <p>
            이든배움국어학원은 전문성을 높이기 위해
            학교별 전담 선생님을 두는 방식으로 운영하고 있습니다.
          </p>

          <p>
            <strong>한 선생님이 한 학교의 1·2·3학년을 전부 맡아</strong>,
            담당하는 학교에 대한 전문성을 극대화 하는 구조입니다.
          </p>

          <p>
            또한 학생들에게 집중하는 환경을 위해,
            대부분의 선생님이 한 학교만 담당하고 계시며,
            담당 학교도 최대 2학교만 맡도록 노력하고 있습니다.
          </p>

          <div className="about-feature-card">
            <p>
              예를 들어, 상원고를 맡은 <strong>김보름 선생님</strong>은
              수년째 상원고 1·2·3학년만 전담하십니다.
              오랜 기간 상원고만을 담당하셨기에,
              상원고의 국어 시험 유형은 물론 수행평가 등
              학교의 특징까지 파악해 시험에 맞게 지도해 드립니다.
            </p>
          </div>

          <p>마찬가지로, 학교마다 전담 선생님이 계십니다.</p>

          <div className="about-teacher-grid" data-animate>
            {TEACHERS.map((t) => (
              <div className="about-teacher-card" key={t.school}>
                <span className="about-teacher-school">{t.school}</span>
                <span className="about-teacher-name">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: 5관까지 확장한 이유 */}
      <section className="about-section" data-animate>
        <div className="about-section-inner">
          <span className="about-label">BRANCH</span>
          <h2>이든배움국어학원이<br /><span className="accent">5관까지 확장한 이유</span></h2>

          <p>
            단순히 관이 많은 학원을 추구하는 것이 아닙니다.
          </p>

          <p>
            각 관마다 학교를 다르게 배정하여,
            학생들이 학교별로 집중하며 공부할 수 있는 환경을 만들기 위해
            노력하고 있습니다.
          </p>

          <div className="about-feature-card">
            <p>
              24년 3월에 개원한 <strong>이든배움국어 상동5관</strong>은
              중원고 · 중흥고 · 석천중 전문관으로 만들어졌습니다.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: 담당 학교를 늘리지 않는 이유 */}
      <section className="about-section about-section-gray" data-animate>
        <div className="about-section-inner">
          <span className="about-label">FOCUS</span>
          <h2>담당 학교를<br /><span className="accent">늘리지 않는 이유</span></h2>

          <p>
            강의 실력이 아무리 뛰어난 선생님이라도,
            여러 학교를 함께 맡으면 한 학교의 전문성을 쌓기가 쉽지 않습니다.
          </p>

          <p>
            맡는 학교가 늘어날수록 살펴야 할 진도표와 부교재,
            기출 자료와 수행평가 관리도 함께 늘어나기 때문입니다.
            <br />준비할 일이 늘어나면 <strong>학생 한 명 한 명에게 집중할 수 있는 여유가 없습니다.</strong>
          </p>

          <div className="about-highlight">
            &ldquo;상동 · 중동 지역 학교에 집중하자&rdquo;
          </div>

          <p>
            그래서 이든배움국어학원은 다른 지역 학교를 과감히 내려놓고,
            상동 · 중동 지역 학교에 집중하기로 했습니다.
          </p>

          <p>
            수강 대상은 좁아지지만,
            학교 하나를 보는 깊이는 지킬 수 있다고 판단했습니다.
          </p>
        </div>
      </section>

      {/* Section 5: 마무리 */}
      <section className="about-section about-section-closing-gradient" data-animate>
        <div className="about-section-inner">
          <div className="about-quote">
            학교별 전문성과 학생에 대한 집중,<br />
            두 가지를 함께 지키는 것
          </div>

          <p>
            이것이 이든배움국어학원이 가장 공을 들이는 부분이며,
            전문성 위에 전문성을 한 겹 더 쌓아가는 방식입니다.
          </p>

          <p className="about-highlight">
            전문성에 전문성을 더하다
          </p>
        </div>
      </section>

      <AboutPageNav current="expertise" />

      <AboutFooter />
    </>
  );
}
