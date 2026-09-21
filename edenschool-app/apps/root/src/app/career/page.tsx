import { CareerShell } from '@/components/career/CareerShell';
import { CAREER_MENU } from '@/lib/careernet/content';

export default function CareerHomePage() {
  return (
    <CareerShell title="이든 진로국어" desc="어떤 진로를 선택하든 국어 역량이 필요하다는 것을 공공 데이터로 확인해 보세요.">
      <div className="career-eden-box">
        <strong>이든 진로국어</strong>는 커리어넷(한국직업능력연구원)의 학과·직업·심리검사 데이터를 <strong>국어 과목과 국어 역량</strong>에 연결해 보여 줍니다.
        희망 학과의 국어 선택과목, 희망 직업에서 국어가 차지하는 비중, 진로와 이어지는 독서·수행평가 주제까지 한곳에서 살펴볼 수 있습니다.
      </div>

      {CAREER_MENU.map((group) => (
        <section key={group.key}>
          <h3 className="career-group-title">
            {group.key}. {group.title}
          </h3>
          <div className="career-grid">
            {group.items.map((item) => (
              <a key={item.href} href={item.href} className="career-menu-card">
                <i className={`fas ${item.icon}`}></i>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </a>
            ))}
          </div>
        </section>
      ))}
    </CareerShell>
  );
}
