import './about/about.css';
import { AboutClient } from './about/AboutClient';

const SCHOOLS = [
  '상원고', '상동고', '송내고', '부명고', '상일고',
  '중원고', '중흥고', '정명고', '계남고', '소명여고',
];

const FOOTER = (
  <div className="about-footer">
    이든배움진학지도보습학원 교육청등록 제5569호 사업자번호 130-92-61827 경기 부천시 소향로 29 (상동, 그린프라자) 503호, 504호 &copy; 이든배움진학지도보습학원 edenschool.kr <br />
    이든배움국어상동2관입시학원 교육청등록 제6380호<br />이든배움국어상동3관입시학원 교육청등록 제6646호<br />이든국어독서교육원논술학원 교육청등록 제6673호<br />이든배움국어상동5관입시학원 교육청등록 제6739호
  </div>
);

export default function HomePage() {
  return (
    <>
      <AboutClient />

      {/* Hero Section */}
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
          <h1>참되고 선한 가르침</h1>
          <p>이든배움국어학원입니다</p>
          <div className="about-scroll-indicator">
            <span>스크롤</span>
            <i className="fas fa-chevron-down" />
          </div>
        </div>
      </section>

      {/* Section 1: 이든배움의 시작 */}
      <section className="about-section" data-animate>
        <div className="about-section-inner">
          <span className="about-label">SINCE 2008</span>
          <h2>이든배움의 시작</h2>

          <div className="about-quote">
            &lsquo;어떻게 하면, 부천 지역 학생들에게<br />
            좋은 가르침을 줄 수 있을까?&rsquo;
          </div>

          <p>이든배움국어학원은 이 질문에서 시작되었습니다.</p>

          <p>
            <strong>&lsquo;이든&rsquo;</strong>은 중세국어에서 &lsquo;참되다, 어질다&rsquo;라는 의미로 쓰인 순 우리말로,
            이든배움은 참되고 선한 가르침을 제공하고자 하는 이든의 사명이 담긴 이름입니다.
          </p>

          <div className="about-stat-row">
            <div className="about-stat-card">
              <div className="about-stat-number">17년</div>
              <div className="about-stat-label">역사</div>
            </div>
            <div className="about-stat-card">
              <div className="about-stat-number">5개</div>
              <div className="about-stat-label">전문관 운영</div>
            </div>
            <div className="about-stat-card">
              <div className="about-stat-number">10개</div>
              <div className="about-stat-label">전담 학교</div>
            </div>
          </div>

          <p>
            이든배움국어학원은, 17년 전 부천 상동지역에서 교습소로 시작하여
            학생과 학부모님의 응원에 힘입어,
            지금은 상동지역에서만 <strong>5개의 전문관</strong>을 운영하는 학원으로 성장하였습니다.
          </p>

          <p>
            많은 시간이 흘렀고 많은 변화가 있었지만
            처음 시작할 때 마음속에 담아두었던 그 질문은 잊지 않고 있습니다.
          </p>
        </div>
      </section>

      {/* Section 2: 학교별 수업 */}
      <section className="about-section about-section-gray" data-animate>
        <div className="about-section-inner">
          <span className="about-label">PROMISE</span>
          <h2>이든배움국어학원이 개원부터 지켜온 약속<br /><span className="accent">&ldquo;학교별 수업&rdquo;</span></h2>

          <p>
            17년 전부터 지켜온 이든배움국어학원의 첫 번째 원칙은 &ldquo;학교별 수업&rdquo;입니다.
          </p>

          <p>
            고등 국어 과목의 특성상, 학교별로 수업을 하는 것이 최선이라고 생각했습니다.
          </p>

          <p>
            같은 내용을 배우더라도, 학교마다 다른 고유의 특징, 시험 유형, 시험 난이도 등이
            명확하게 반영되려면, 학교별 반구성이라는 원칙을 고집해야만 했습니다.
          </p>

          <p>
            개원 초기부터 이 원칙을 지키기 위해 노력하였습니다.
          </p>
        </div>
      </section>

      {/* Section 3: 학교별 전문가 양성 */}
      <section className="about-section" data-animate>
        <div className="about-section-inner">
          <span className="about-label">GROWTH</span>
          <h2>더 발전하기 위한 노력<br /><span className="accent">학교별 전문가 양성</span></h2>

          <p>
            아무리 좋은 선생님을 모셔도, 그리고 학교별로 반을 배정하더라도&hellip;
            <br />한 선생님께서 너무 많은 학교를 맡으시게 되면,
            수업 준비에 너무 많은 시간과 에너지가 들게 되어,
            학생들에게 온전히 집중하기 힘들다는 사실을 깨달았습니다.
          </p>

          <p>
            학교마다 교과서도 다르고, 시험 유형과 난이도도 천차만별이기 때문에,
            한 명의 선생님이 4~5학교를 맡게 되면,
            집중하기가 너무 힘든 환경이 만들어지기 때문입니다.
          </p>

          <div className="about-highlight">
            &ldquo;부천지역 학교에만 집중하자&rdquo;
          </div>

          <p>
            코로나가 시작된 2020년부터, 이든배움국어학원은 새로운 시스템을 준비하기 시작했습니다.
          </p>

          <p>
            부천 상동지역 학생들이 많이 다니는 학교에만 집중하면 어떨까?
            <br />궁극적으로는 <strong>한 명의 선생님이 한 곳의 학교에만 집중할 수 있다면?</strong>
          </p>

          <div className="about-school-grid" data-animate>
            {SCHOOLS.map((school) => (
              <div className="about-school-item" key={school}>{school}</div>
            ))}
          </div>

          <p>
            한 학교 1, 2, 3학년만을 집중해서 관리하면,
            학생들에게 집중할 수 있는 시간도 많아지고,
            학교에 대한 전문성은 더욱 강화되지 않을까?
          </p>

          <p>
            이 결정을 내리는 것이 쉽지는 않았습니다.
            당시에 학원의 소문을 듣고, 인천이나 시흥, 안산에서도 학생들이 오고 있는 상황이었기 때문입니다.
          </p>

          <p>
            하지만 이든배움국어학원은 학생들에게 더 좋은 가르침을 제공해야 한다는
            개원 초기의 첫 마음을 잊지 않고 실천하기 위해서
            과감한 결단을 내렸습니다.
          </p>

          <div className="about-feature-card">
            <p>
              상원고 전임 김보름 선생님은 상원고 1, 2, 3학년만 전담하며 관리하십니다.
              상원고에 대한 전문성을 쌓기 위해 노력하며,
              정규수업 외에도 매주 진행되는 1:1 클리닉으로,
              학생 한 명 한 명을 개별관리하기 위해 노력해주십니다.
            </p>
          </div>

          <p>
            송내고, 상동고, 상일고, 부명고도 마찬가지입니다.
          </p>

          <p>
            나머지 학교도 한 선생님에게 1학교, 최대 2학교만 배정하여,
            학교별 전문성을 강화하고,
            학생들에게 집중할 수 있는 환경을 제공합니다.
          </p>

          <p>
            고등부가 그 시작이었고,
            지속되는 좋은 성과를 경험한 후에는
            중등부도 같은 시스템을 도입하기 위해 노력하고 있습니다.
          </p>
        </div>
      </section>

      {/* Section 4: 마무리 */}
      <section className="about-section about-section-closing-gradient" data-animate>
        <div className="about-section-inner">
          <div className="about-quote">
            어떻게 하면, 부천 지역 학생들에게<br />
            좋은 가르침을 줄 수 있을까?
          </div>

          <p>
            처음 시작했던 그 마음으로
            학생들에게 좋은 가르침을 제공하기 위한 노력으로,
          </p>

          <p className="about-highlight">
            참되고 선한 가르침 이든배움국어학원
          </p>

          <p>
            이라는 이름이 헛되지 않도록
            늘 노력하는 이든배움국어학원이 되겠습니다.
          </p>

          <p className="about-signature">- 대표원장 서효정 드림</p>
        </div>
      </section>

      {/* Section 5: 학원 소개 영상 */}
      <section className="about-video-section" data-animate>
        <div className="about-video-section-inner">
          <span className="about-label">VIDEO</span>
          <h2>이든배움국어학원 소개 영상</h2>
          <p>이든배움국어학원을 영상으로 만나보세요</p>
          <div className="about-video-player">
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src="https://www.youtube.com/embed/oeW-xeHUekc"
                title="이든배움국어학원 소개 영상"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {FOOTER}
    </>
  );
}
