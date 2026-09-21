/**
 * 「이든 진로국어」 메뉴의 학원 측 콘텐츠와 코드표.
 *
 * API 가 주지 않는 것(국어 과목 설명 카드, 수행평가 구성 틀, 담당 학교 목록 등)을 여기 모은다.
 * 클라이언트 컴포넌트에서도 import 하므로 서버 전용 모듈(db, fetch 클라이언트)을 끌어오지 않는다.
 *
 * ※ 과목 설명·수행평가 틀은 기획서 기준으로 작성한 초안이다. 담당 선생님 검토 후 게시할 것.
 */

/* ───────────────── 메뉴 ───────────────── */

export interface CareerMenuItem {
  href: string;
  title: string;
  desc: string;
  icon: string; // font-awesome 5 클래스
}

export interface CareerMenuGroup {
  key: 'A' | 'B' | 'C';
  title: string;
  items: CareerMenuItem[];
}

export const CAREER_MENU: CareerMenuGroup[] = [
  {
    key: 'A',
    title: '국어 × 진로',
    items: [
      { href: '/career/major-subjects', title: '학과별 국어 선택과목 가이드', desc: '희망 학과에 맞는 고교학점제 국어 선택과목', icon: 'fa-book-open' },
      { href: '/career/job-report', title: '직업별 국어 역량 리포트', desc: '직업에서 국어 지식·언어 능력이 얼마나 중요한지', icon: 'fa-chart-bar' },
      { href: '/career/reading-guide', title: '진로 연계 주제 탐구 독서 가이드', desc: '학과에서 배우는 내용과 탐구 방향', icon: 'fa-book-reader' },
      { href: '/career/assessment-topics', title: '진로 연계 수행평가 주제 은행', desc: '희망 직업으로 만드는 발표·토론·글쓰기 주제', icon: 'fa-pen-fancy' },
      { href: '/career/today-job', title: '오늘의 직업 읽기', desc: '직업 설명문을 읽고 한 문장으로 요약하기', icon: 'fa-calendar-day' },
    ],
  },
  {
    key: 'B',
    title: '진로 탐색',
    items: [
      { href: '/career/test', title: '진로심리검사 센터', desc: '커리어넷 공인 심리검사를 홈페이지에서 바로', icon: 'fa-clipboard-check' },
      { href: '/career/subject-map', title: '계열별 국어 과목 지도', desc: '계열마다 많이 권장되는 국어 과목 통계', icon: 'fa-map' },
      { href: '/career/compare', title: '대학 학과 비교 카드', desc: '관심 학과 두 개를 나란히 비교', icon: 'fa-columns' },
      { href: '/career/themes', title: '테마별 직업 둘러보기', desc: '관심 분야에서 출발하는 가벼운 직업 탐색', icon: 'fa-th-large' },
      { href: '/career/qna', title: '진로 고민 Q&A', desc: '또래의 진로 고민과 전문 상담 답변', icon: 'fa-comments' },
    ],
  },
  {
    key: 'C',
    title: '학년·대상별',
    items: [
      { href: '/career/high-schools', title: '중3 고등학교 탐색', desc: '부천 지역 고등학교와 특성화고 학과', icon: 'fa-school' },
      { href: '/career/resources', title: '학부모 진로 자료실', desc: '공공기관 발행 진로 자료 모음', icon: 'fa-folder-open' },
      { href: '/career/portfolio', title: '나의 진로 포트폴리오', desc: '관심 학과·직업·검사 결과 모아 보기 (학원생 전용)', icon: 'fa-user-graduate' },
    ],
  },
];

export const CAREER_MENU_FLAT: CareerMenuItem[] = CAREER_MENU.flatMap((g) => g.items);

/* ───────────────── 2022 개정 교육과정 국어 선택과목 ───────────────── */

export type KoreanTrack = '일반 선택' | '진로 선택' | '융합 선택';

export interface KoreanSubjectCard {
  name: string;
  track: KoreanTrack;
  /** 무엇을 배우는지 */
  learn: string;
  /** 시험·수행평가 형태 */
  assess: string;
  /** 이든배움 수업 연결 */
  eden: string;
}

export const KOREAN_SUBJECTS: KoreanSubjectCard[] = [
  {
    name: '화법과 언어',
    track: '일반 선택',
    learn: '말하기·듣기의 원리와 국어 문법(음운·단어·문장·담화)을 함께 배웁니다. 발표·토론·면접 같은 실제 의사소통 상황을 다룹니다.',
    assess: '지필은 문법 개념 문제 비중이 크고, 수행평가는 발표·토론·연설 실습이 많습니다.',
    eden: '학교별 전담 선생님이 문법 내신 유형을 잡고, 클리닉에서 발표문·토론 개요를 1:1로 점검합니다.',
  },
  {
    name: '독서와 작문',
    track: '일반 선택',
    learn: '다양한 글을 읽고 목적에 맞게 쓰는 과정을 통합해 배웁니다. 정보 전달·설득·성찰의 글이 중심입니다.',
    assess: '지필은 비문학 독해, 수행평가는 요약문·논설문·보고서 쓰기가 대표적입니다.',
    eden: '비문학 독해 훈련과 글쓰기 첨삭을 병행합니다. 수행평가 글은 클리닉에서 구조부터 문장까지 봐 드립니다.',
  },
  {
    name: '문학',
    track: '일반 선택',
    learn: '고전·현대 시와 소설, 극·수필을 갈래별로 감상하고 해석하는 방법을 배웁니다.',
    assess: '지필 비중이 가장 크며 학교별 교과서·부교재 작품이 그대로 출제됩니다. 수행평가는 감상문·창작이 많습니다.',
    eden: '학교별 작품 목록에 맞춘 내신 대비가 핵심입니다. 기출 분석으로 출제 경향을 미리 잡습니다.',
  },
  {
    name: '주제 탐구 독서',
    track: '진로 선택',
    learn: '관심 분야의 책과 자료를 골라 스스로 주제를 정해 깊이 읽고, 탐구 결과를 정리해 발표합니다.',
    assess: '지필보다 과정 중심 수행평가가 중심입니다. 독서 기록·탐구 보고서·발표가 평가됩니다.',
    eden: '진로 연계 독서 가이드로 책과 탐구 질문을 정하고, 보고서 작성을 단계별로 지도합니다.',
  },
  {
    name: '문학과 영상',
    track: '진로 선택',
    learn: '문학 작품이 영화·드라마·웹툰 등 영상 매체로 바뀌는 과정을 비교하고, 직접 영상 서사를 기획해 봅니다.',
    assess: '작품 비교 분석 보고서, 시나리오·스토리보드 제작 같은 수행평가가 많습니다.',
    eden: '원작 읽기와 각색 분석을 함께 다루고, 기획안·시나리오 글쓰기를 첨삭합니다.',
  },
  {
    name: '직무 의사소통',
    track: '진로 선택',
    learn: '직업 현장에서 쓰는 보고서·제안서·공문·면접 등 실제 직무 상황의 말하기와 글쓰기를 배웁니다.',
    assess: '모의 면접, 업무용 문서 작성, 프레젠테이션 수행평가가 중심입니다.',
    eden: '희망 직업의 실제 문서 형식을 살펴보고, 면접·발표 연습을 클리닉에서 진행합니다.',
  },
  {
    name: '독서 토론과 글쓰기',
    track: '융합 선택',
    learn: '한 권의 책을 함께 읽고 쟁점을 찾아 토론한 뒤, 자기 생각을 글로 정리하는 과정을 배웁니다.',
    assess: '토론 참여도, 논증 글쓰기, 독서 토론 기록이 수행평가로 평가됩니다.',
    eden: '토론 논제 분석과 입론·반론 작성을 지도하고, 토론 후 글쓰기를 첨삭합니다.',
  },
  {
    name: '매체 의사소통',
    track: '융합 선택',
    learn: '뉴스·SNS·영상 등 매체의 표현 방식을 비판적으로 읽고, 매체 자료를 직접 제작해 소통하는 방법을 배웁니다.',
    assess: '매체 비평문, 카드뉴스·영상 제작, 발표가 대표적인 수행평가입니다.',
    eden: '매체 자료 분석 글쓰기와 발표 원고 작성을 지도합니다.',
  },
  {
    name: '언어생활 탐구',
    track: '융합 선택',
    learn: '일상 언어 현상(신조어·높임 표현·지역어 등)을 자료로 수집하고 탐구해 보고서로 정리합니다.',
    assess: '언어 자료 조사 보고서와 탐구 발표가 중심입니다.',
    eden: '문법 지식을 탐구 활동으로 확장해 보고서 작성까지 단계별로 돕습니다.',
  },
];

export const KOREAN_SUBJECT_NAMES = KOREAN_SUBJECTS.map((s) => s.name);

/** 커리어넷 relate_subject_2022 의 subject_name → 우리 표기 */
export function normalizeTrack(name: string): KoreanTrack | null {
  const n = name.replace(/\s/g, '');
  if (n.startsWith('일반')) return '일반 선택';
  if (n.startsWith('진로')) return '진로 선택';
  if (n.startsWith('융합')) return '융합 선택';
  return null;
}

/** 과목 문자열에서 국어 과목만 골라낸다 (띄어쓰기·전각 기호 차이 무시) */
export function isKoreanSubject(subject: string): boolean {
  const key = subject.replace(/\s/g, '');
  return KOREAN_SUBJECT_NAMES.some((k) => k.replace(/\s/g, '') === key);
}

export function findKoreanSubject(subject: string): KoreanSubjectCard | undefined {
  const key = subject.replace(/\s/g, '');
  return KOREAN_SUBJECTS.find((s) => s.name.replace(/\s/g, '') === key);
}

/* ───────────────── 직업 리포트: 언어 관련 항목 ───────────────── */

/** 업무수행능력 중 국어 역량과 직결되는 항목 (직업마다 상위 10개만 제공되므로 있을 때만 표시) */
export const LANGUAGE_PERFORMS = ['글쓰기', '읽고 이해하기', '말하기', '듣고 이해하기', '설득', '협상', '가르치기', '논리적 분석', '판단과 의사결정'];

export const KOREAN_KNOWLEDGE = '국어';

/* ───────────────── 코드표 ───────────────── */

export const MAJOR_SUBJECT_CODES: { code: string; name: string; short: string }[] = [
  { code: '100391', name: '인문계열', short: '인문' },
  { code: '100392', name: '사회계열', short: '사회' },
  { code: '100393', name: '교육계열', short: '교육' },
  { code: '100394', name: '공학계열', short: '공학' },
  { code: '100395', name: '자연계열', short: '자연' },
  { code: '100396', name: '의약계열', short: '의약' },
  { code: '100397', name: '예체능계열', short: '예체능' },
];

export interface JobTheme {
  code: string;
  name: string;
  icon: string;
}

export const JOB_THEMES: JobTheme[] = [
  { code: '102420', name: 'AI/로봇', icon: 'fa-robot' },
  { code: '102421', name: 'IT/SW', icon: 'fa-laptop-code' },
  { code: '102422', name: '게임', icon: 'fa-gamepad' },
  { code: '102423', name: '공학', icon: 'fa-cogs' },
  { code: '102424', name: '교육', icon: 'fa-chalkboard-teacher' },
  { code: '102425', name: '금융', icon: 'fa-coins' },
  { code: '102426', name: '동물', icon: 'fa-paw' },
  { code: '102427', name: '디자인', icon: 'fa-palette' },
  { code: '102428', name: '미용/패션', icon: 'fa-tshirt' },
  { code: '102429', name: '방송', icon: 'fa-broadcast-tower' },
  { code: '102430', name: '법/수사', icon: 'fa-gavel' },
  { code: '102431', name: '사회복지', icon: 'fa-hands-helping' },
  { code: '102432', name: '스포츠', icon: 'fa-running' },
  { code: '102433', name: '여행', icon: 'fa-plane' },
  { code: '102434', name: '영화/드라마', icon: 'fa-film' },
  { code: '102435', name: '우주/항공', icon: 'fa-rocket' },
  { code: '102436', name: '음식', icon: 'fa-utensils' },
  { code: '102437', name: '음악', icon: 'fa-music' },
  { code: '102438', name: '의료/바이오', icon: 'fa-heartbeat' },
  { code: '102439', name: '환경/생태', icon: 'fa-leaf' },
];

/** 특별 묶음 「국어를 좋아하는 학생을 위한 직업」 — 적성유형 코드 */
export const KOREAN_LOVER_APTDS = [
  { code: '104737', name: '인문계 교육 관련직' },
  { code: '104742', name: '인문 및 사회과학 관련직' },
  { code: '104744', name: '언어 관련 전문직' },
  { code: '104745', name: '작가 관련직' },
];

/* ───────────────── 심리검사 ───────────────── */

export type TestVersion = 'v1' | 'v2';

export interface TestCatalogItem {
  version: TestVersion;
  /** 검사번호 */
  qno: string;
  name: string;
  target: '중학생' | '고등학생';
  trgetSe: string;
  desc: string;
  minutes: number;
}

export const TEST_CATALOG: TestCatalogItem[] = [
  { version: 'v2', qno: '33', name: '직업흥미검사(H)', target: '중학생', trgetSe: '100206', desc: '어떤 종류의 일에 흥미를 느끼는지 알아봅니다.', minutes: 20 },
  { version: 'v2', qno: '34', name: '직업흥미검사(H)', target: '고등학생', trgetSe: '100207', desc: '어떤 종류의 일에 흥미를 느끼는지 알아봅니다.', minutes: 20 },
  { version: 'v1', qno: '24', name: '직업가치관검사', target: '중학생', trgetSe: '100206', desc: '직업을 고를 때 무엇을 중요하게 여기는지 알아봅니다.', minutes: 15 },
  { version: 'v1', qno: '25', name: '직업가치관검사', target: '고등학생', trgetSe: '100207', desc: '직업을 고를 때 무엇을 중요하게 여기는지 알아봅니다.', minutes: 15 },
  { version: 'v1', qno: '20', name: '직업적성검사', target: '중학생', trgetSe: '100206', desc: '나의 능력이 어떤 직업 분야에 맞는지 알아봅니다.', minutes: 20 },
  { version: 'v1', qno: '21', name: '직업적성검사', target: '고등학생', trgetSe: '100207', desc: '나의 능력이 어떤 직업 분야에 맞는지 알아봅니다.', minutes: 20 },
  { version: 'v1', qno: '35', name: '진로성숙도검사', target: '중학생', trgetSe: '100206', desc: '진로를 준비하는 태도와 능력이 얼마나 갖춰졌는지 알아봅니다.', minutes: 20 },
  { version: 'v1', qno: '36', name: '진로성숙도검사', target: '고등학생', trgetSe: '100207', desc: '진로를 준비하는 태도와 능력이 얼마나 갖춰졌는지 알아봅니다.', minutes: 20 },
  { version: 'v1', qno: '26', name: '진로개발역량검사', target: '중학생', trgetSe: '100206', desc: '진로를 스스로 설계하고 실천하는 역량을 알아봅니다.', minutes: 15 },
  { version: 'v1', qno: '27', name: '진로개발역량검사', target: '고등학생', trgetSe: '100207', desc: '진로를 스스로 설계하고 실천하는 역량을 알아봅니다.', minutes: 15 },
];

export function findTest(qno: string): TestCatalogItem | undefined {
  return TEST_CATALOG.find((t) => t.qno === qno);
}

/**
 * 직업가치관검사(24·25) 49번 문항: 8개 가치 중 중요한 순서로 3개를 고른다.
 * 문항 API 는 보기를 주지 않아(5점 척도 보기만 옴) 커리어넷 직업가치관검사의 8개 가치를 여기서 제공한다.
 * 전송 형식은 "49=8,1,4" (매뉴얼 p.8).
 */
export const VALUE_TEST_RANK_ITEM = 49;
export const VALUE_TEST_VALUES: { val: string; text: string }[] = [
  { val: '1', text: '능력 발휘' },
  { val: '2', text: '자율성' },
  { val: '3', text: '보수' },
  { val: '4', text: '안정성' },
  { val: '5', text: '사회적 인정' },
  { val: '6', text: '사회봉사' },
  { val: '7', text: '자기 계발' },
  { val: '8', text: '창의성' },
];

/** 진로성숙도검사(35·36) 13번: 1·2순위 두 개, '기타' 선택 시 주관식 */
export const MATURITY_TEST_RANK_ITEM = 13;

/* ───────────────── 수행평가 주제 은행 ───────────────── */

export interface AssessmentType {
  key: string;
  name: string;
  subject: string; // 관련 국어 과목
  /** {job} 자리에 직업명이 들어간다 */
  topics: string[];
  /** 글·발표 구성 틀 */
  frame: string[];
}

export const ASSESSMENT_TYPES: AssessmentType[] = [
  {
    key: 'presentation',
    name: '발표',
    subject: '화법과 언어',
    topics: ['{job}이(가) 하는 일과 10년 뒤 변화 예측', '{job}에게 필요한 역량 세 가지와 그 이유', '내가 {job}을(를) 꿈꾸는 이유와 준비 계획'],
    frame: ['도입: 직업을 처음 알게 된 계기 또는 질문 던지기', '전개 1: 하는 일 (커리어넷 자료 근거 제시)', '전개 2: 전망과 변화 (직업 전망 자료 인용)', '마무리: 나의 다짐 + 청중에게 남기는 한 문장'],
  },
  {
    key: 'debate',
    name: '토론',
    subject: '독서 토론과 글쓰기',
    topics: ['인공지능 시대에도 {job}은(는) 계속 필요하다', '{job}의 자격 기준은 더 엄격해져야 한다', '{job}의 일자리 전망은 밝다'],
    frame: ['논제 정의: 핵심 용어의 뜻을 먼저 정한다', '입론: 주장 + 근거 2개 (직업 전망·하는 일 자료 활용)', '반론 예상: 상대가 제기할 반박과 재반박 준비', '최종 발언: 가장 강한 근거 하나로 마무리'],
  },
  {
    key: 'essay',
    name: '논설문',
    subject: '독서와 작문',
    topics: ['{job}의 사회적 역할은 무엇이어야 하는가', '{job}이(가) 되기 위한 교육 과정은 적절한가', '{job}과(와) 관련된 사회 문제와 해결 방안'],
    frame: ['서론: 문제 상황 제시 + 주장 예고', '본론 1: 근거 ① (통계·전망 자료)', '본론 2: 근거 ② + 예상 반론과 반박', '결론: 주장 재확인 + 제안'],
  },
  {
    key: 'proposal',
    name: '건의문',
    subject: '화법과 언어',
    topics: ['학교에 {job} 진로 체험 프로그램을 건의합니다', '{job} 관련 동아리 개설을 건의합니다', '{job}에 대한 진로 특강 개최를 건의합니다'],
    frame: ['수신자와 자기소개', '건의 배경: 현재 상황과 문제점', '건의 내용: 구체적 요청 사항 (직업 정보 근거 포함)', '기대 효과와 감사 인사'],
  },
  {
    key: 'report',
    name: '탐구 보고서',
    subject: '주제 탐구 독서',
    topics: ['{job}의 직업 만족도가 높은/낮은 이유 분석', '{job}이(가) 되는 경로 비교: 학과·자격·경력', '{job}과(와) 유사 직업의 차이 탐구'],
    frame: ['탐구 동기와 질문', '자료 수집 방법 (커리어넷·도서·인터뷰)', '탐구 결과 정리 (표·그래프 활용)', '결론과 느낀 점, 참고 자료 출처'],
  },
];

/* ───────────────── 계열별 추천 도서 (학원 콘텐츠) ───────────────── */

export interface ReadingRecommendation {
  title: string;
  author: string;
  questions: string[];
}

/**
 * 계열(lClass)별 추천 도서와 탐구 질문.
 * ※ 담당 선생님이 학기마다 보완하는 목록이다. 비어 있는 계열은 화면에 "준비 중"으로 표시된다.
 */
export const READING_BY_CLASS: Record<string, ReadingRecommendation[]> = {
  인문계열: [],
  사회계열: [],
  교육계열: [],
  공학계열: [],
  자연계열: [],
  의약계열: [],
  예체능계열: [],
};

/* ───────────────── 중3 고등학교 탐색 ───────────────── */

/** 이든배움 전담 선생님 배정 학교 */
export const EDEN_PARTNER_SCHOOLS = ['상원고등학교', '상동고등학교', '송내고등학교', '부명고등학교', '상일고등학교', '정명고등학교', '소명여자고등학교', '중원고등학교', '중흥고등학교'];

export function isPartnerSchool(name: string): boolean {
  return EDEN_PARTNER_SCHOOLS.includes(name.trim());
}

/* ───────────────── 학부모 자료실 코드 ───────────────── */

export const COSE_TARGETS = [
  { code: 'M', name: '중학교' },
  { code: 'I', name: '일반고등학교' },
  { code: 'C', name: '공통' },
];

export const COSE_ACTIVITY_TYPES = [
  { code: '102331', name: '진로심리검사' },
  { code: '102333', name: '직업정보' },
  { code: '102336', name: '학교·학과 정보' },
];

/* ───────────────── 출처 표기 ───────────────── */

export const CAREERNET_CREDIT = '자료: 커리어넷(한국직업능력연구원) Open API';
