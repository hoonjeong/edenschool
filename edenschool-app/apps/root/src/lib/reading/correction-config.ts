// AI 서술형 첨삭 — 옵션/척도 설정
// 원장·강사 요청 사항(학년별 강도, 글 종류, 개별 방향성, 중점 척도, 이든 방향성) 반영

// ── 2. 학년별 첨삭 강도 ────────────────────────────────
export interface GradeIntensity {
  grade: string;
  focus: string; // 화면 표시용 요약
  guide: string; // AI 지시문에 주입되는 상세 방향
}

export const GRADE_INTENSITY: GradeIntensity[] = [
  {
    grade: "초1",
    focus: "칭찬 · 정확한 문장 형성 · 글밥 늘리기",
    guide:
      "칭찬을 중심으로 자신감을 키운다. 완결된 한 문장을 바르게 쓰도록 돕고, 짧은 글을 조금씩 늘려(글밥 늘리기) 쓰도록 격려한다. 지적은 최소화하고 성취감을 준다.",
  },
  {
    grade: "초2",
    focus: "칭찬 · 기초 맞춤법 · 문장 완성 · 글밥 늘리기",
    guide:
      "칭찬을 유지하되 기초 맞춤법과 띄어쓰기를 부드럽게 바로잡는다. 주어-서술어가 호응하는 완성된 문장과 분량 늘리기를 함께 지도한다.",
  },
  {
    grade: "초3",
    focus: "격려 · 문단 개념 · 맞춤법 교정 · 구성 시작",
    guide:
      "격려와 교정을 균형 있게 한다. 처음-가운데-끝 문단 개념을 익히게 하고, 맞춤법 교정을 본격화한다. 생각의 이유를 한 문장 덧붙이도록 유도한다.",
  },
  {
    grade: "초4",
    focus: "균형 교정 · 구성/표현 강화 · 어휘 확장",
    guide:
      "칭찬과 교정을 균형 있게 하되 글의 구성과 표현을 강화한다. 근거 제시와 어휘 확장을 지도하고, 문단 간 흐름을 다듬게 한다.",
  },
  {
    grade: "초5",
    focus: "정확한 교정 · 논리/구성 · 다양한 표현",
    guide:
      "정확한 교정을 중심으로 논리적 구성과 다양한 어휘·표현을 요구한다. 주제 통일성과 문단 긴밀성을 점검하고, 설득력 있는 근거를 강조한다.",
  },
  {
    grade: "초6",
    focus: "정확한 교정/맞춤법 · 중등 이상 문장 · 조건 서술",
    guide:
      "정확한 교정과 맞춤법을 엄격히 적용한다. 중학생 이상 수준의 문장 구사, 조건에 맞는 서술, 주제 심화와 논리적 완성도를 요구한다. 상투적 표현을 지양하도록 지도한다.",
  },
];

// ── 3. 글의 종류 ──────────────────────────────────────
export interface Genre {
  key: string;
  label: string;
  lens: string; // 종류별 분석 관점
}

export const GENRES: Genre[] = [
  { key: "explain", label: "설명문", lens: "정보의 정확성·객관성, 논리적 순서, 명료한 전달" },
  { key: "review", label: "감상문(독후감)", lens: "감상의 진솔함, 근거 있는 생각, 책 내용과의 연결" },
  { key: "argue", label: "논설문", lens: "주장의 명확성, 근거의 타당성, 설득력과 논리 구조" },
  { key: "poem", label: "시", lens: "이미지·비유·운율, 함축과 정서 표현, 참신한 시어" },
  { key: "story", label: "소설 창작물", lens: "인물·사건·배경 구성, 이야기 흐름, 상상력과 개연성" },
  { key: "diary", label: "일기", lens: "하루의 관찰과 느낌, 솔직한 표현, 구체적 경험 서술" },
  { key: "interview", label: "인터뷰", lens: "질문의 적절성, 대화의 자연스러움, 핵심 정보 전달" },
  { key: "travel", label: "기행문", lens: "여정과 견문·감상의 구성, 장소의 생생한 묘사" },
  { key: "letter", label: "편지", lens: "대상에 맞는 어조, 진심 전달, 형식의 완결성" },
];

// ── 4. 개별화된 첨삭 방향성(톤) ─────────────────────────
export interface Tone {
  key: string;
  label: string;
  emoji: string;
  desc: string;
  guide: string;
}

export const TONES: Tone[] = [
  {
    key: "praise",
    label: "칭찬 중심",
    emoji: "🍯",
    desc: "순한맛 · 자신감 키우기",
    guide: "잘한 점을 풍부하게 칭찬하고 고칠 점은 최소한만 부드럽게 제안한다.",
  },
  {
    key: "balanced",
    label: "균형",
    emoji: "⚖️",
    desc: "칭찬과 교정 균형",
    guide: "잘한 점과 고칠 점을 균형 있게 제시하고 구체적 개선 방법을 안내한다.",
  },
  {
    key: "correct",
    label: "정확한 교정",
    emoji: "✏️",
    desc: "보통맛 · 꼼꼼한 교정",
    guide: "맞춤법·문장·구성의 오류를 정확히 짚고 올바른 예시를 제시한다.",
  },
  {
    key: "spicy",
    label: "매운맛 교정",
    emoji: "🌶️",
    desc: "강한 교정 · 실력 도약",
    guide:
      "높은 기준으로 엄격하게 교정한다. 상투적 표현·논리 허점·구성 약점을 직설적으로 지적하되 대안을 반드시 함께 제시한다.",
  },
];

// ── 5. 지도 강사 중점 척도 ─────────────────────────────
export interface Metric {
  key: string;
  label: string;
  desc: string;
}

export const METRICS: Metric[] = [
  { key: "fluency", label: "유창성", desc: "읽기 자연스러운 문장 흐름" },
  { key: "expression", label: "표현력", desc: "생생하고 개성 있는 표현" },
  { key: "vocab", label: "어휘 구사", desc: "정확하고 풍부한 낱말 사용" },
  { key: "sentence", label: "문장 완성도", desc: "호응·완결된 정확한 문장" },
  { key: "unity", label: "주제 통일성", desc: "주제에서 벗어나지 않음" },
  { key: "cohesion", label: "긴밀성", desc: "문단·문장 간 유기적 연결" },
  { key: "spelling", label: "맞춤법", desc: "맞춤법·띄어쓰기 정확성" },
  { key: "structure", label: "구성력", desc: "처음-가운데-끝 짜임새" },
];

// 동일학년 비교(REQ 9)용 핵심 지표
export const COMPARE_METRICS = [
  "sentence", // 문장력
  "vocab", // 어휘력
  "spelling", // 맞춤법
  "structure", // 구성력
  "expression", // 주제표현력(표현력)
] as const;

// ── 6. 이든 독서교육원이 추구하는 방향성(전체 분석에 공통 반영) ──
// ※ 원장·강사(@jjangteacher @jiyeonmin)와 확정 예정. 아래는 초안 기본값 — 설정에서 수정 가능.
export const EDEN_PHILOSOPHY_DEFAULT = `이든 국어 독서교육원은 아이가 '자기 생각을 가진 글'을 쓰도록 돕는다.
1) 생각의 씨앗을 존중한다 — 정답을 주기보다 스스로 생각을 넓히도록 질문한다.
2) 정확함과 자신감을 함께 키운다 — 교정은 하되 글쓰기를 좋아하게 만든다.
3) 읽기와 쓰기를 잇는다 — 책에서 얻은 생각을 자기 언어로 표현하게 한다.
4) 한 걸음 더 — 첨삭에서 끝내지 않고 '다시 써보면 좋을 방향'을 제시한다.`;

// ── 7. 첨삭 요청/응답 형태 ─────────────────────────────
export interface GenInput {
  answerText: string;
  problemText?: string;
  gradeLevel: string;
  genre: string;
  tone: string;
  metrics: string[];
  custom?: string;
  edenDirection: string;
}

export interface GenOutput {
  scores: Record<string, number>; // metricKey → 0~100
  resultText: string;
  summary: string;
}

export const DEFAULT_CORRECTION_OPTIONS = {
  gradeLevel: "초4",
  genre: "review",
  tone: "balanced",
  metrics: ["sentence", "vocab", "spelling", "structure", "expression", "unity"],
  custom: "",
};
