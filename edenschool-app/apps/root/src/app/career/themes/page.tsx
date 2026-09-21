import { CareerShell } from '@/components/career/CareerShell';
import { JOB_THEMES, KOREAN_LOVER_APTDS } from '@/lib/careernet/content';

export default function ThemesPage() {
  return (
    <CareerShell title="테마별 직업 둘러보기" desc="관심 분야에서 출발해 직업을 가볍게 탐색해 보세요.">
      <div className="eden-card" style={{ marginBottom: 20, borderColor: '#fdba74' }}>
        <div className="eden-card-header" style={{ background: '#fff7ed' }}>
          <i className="fas fa-star" style={{ color: '#c2410c' }}></i> 국어를 좋아하는 학생을 위한 직업
        </div>
        <div className="eden-card-body">
          <p style={{ fontSize: 13, color: '#475569', marginBottom: 10 }}>
            언어·글쓰기·인문 지식이 핵심인 적성유형을 모았습니다. {KOREAN_LOVER_APTDS.map((a) => a.name).join(', ')}
          </p>
          <a href="/career/themes/korean" className="eden-btn eden-btn-primary">
            <i className="fas fa-book"></i> 직업 보기
          </a>
        </div>
      </div>

      <div className="career-grid">
        {JOB_THEMES.map((t) => (
          <a key={t.code} href={`/career/themes/${t.code}`} className="career-menu-card" style={{ textAlign: 'center' }}>
            <i className={`fas ${t.icon}`}></i>
            <h4>{t.name}</h4>
          </a>
        ))}
      </div>
    </CareerShell>
  );
}
