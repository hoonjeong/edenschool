// AI 첨삭 결과 생성 엔진 (목업)
// ※ 실제 LLM 연동 대신, 답안 텍스트와 옵션을 바탕으로 '이든 분석지'와 척도별 점수를 생성한다.
//   실서비스에서는 이 함수 내부를 Claude API 호출로 교체하면 된다. (options/eden 방향성은 그대로 프롬프트로 주입)

import { METRICS, GRADE_INTENSITY, TONES, GENRES } from "./correction-config";

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

// 텍스트 기반 결정론적 해시 (0~1)
function seedFrom(text: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function analyzeText(t: string) {
  const clean = t.trim();
  const sentences = clean.split(/[.!?。\n]/).filter((s) => s.trim().length > 0);
  const words = clean.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  const avgSentLen = sentences.length ? words.length / sentences.length : 0;
  return {
    length: clean.length,
    sentenceCount: sentences.length,
    wordCount: words.length,
    lexicalVariety: words.length ? uniqueWords.size / words.length : 0,
    avgSentLen,
  };
}

function clamp(n: number) {
  return Math.max(20, Math.min(98, Math.round(n)));
}

export function generateCorrection(input: GenInput): GenOutput {
  const a = analyzeText(input.answerText);
  const gradeNum = Number(input.gradeLevel.replace(/\D/g, "")) || 4;

  // ── 척도별 점수 산출(휴리스틱 + 결정론적 변주) ──
  const base: Record<string, number> = {
    fluency: 55 + a.avgSentLen * 2 + seedFrom(input.answerText, 1) * 25,
    expression: 45 + a.lexicalVariety * 50 + seedFrom(input.answerText, 2) * 20,
    vocab: 40 + a.lexicalVariety * 55 + seedFrom(input.answerText, 3) * 20,
    sentence: 50 + Math.min(20, a.avgSentLen * 2.5) + seedFrom(input.answerText, 4) * 22,
    unity: 55 + seedFrom(input.answerText, 5) * 35,
    cohesion: 48 + Math.min(20, a.sentenceCount * 2) + seedFrom(input.answerText, 6) * 22,
    spelling: 62 + seedFrom(input.answerText, 7) * 33,
    structure: 45 + Math.min(25, a.sentenceCount * 3) + seedFrom(input.answerText, 8) * 20,
  };
  // 학년이 높을수록 기준이 엄격 → 소폭 하향 보정
  const gradePenalty = (gradeNum - 3) * 2.5;
  const scores: Record<string, number> = {};
  for (const m of METRICS) {
    scores[m.key] = clamp(base[m.key] - gradePenalty);
  }

  // ── 분석지 텍스트 생성 ──
  const tone = TONES.find((t) => t.key === input.tone) ?? TONES[1];
  const grade = GRADE_INTENSITY.find((g) => g.grade === input.gradeLevel) ?? GRADE_INTENSITY[3];
  const genre = GENRES.find((g) => g.key === input.genre) ?? GENRES[1];

  const focusMetrics = input.metrics
    .map((k) => METRICS.find((m) => m.key === k)?.label)
    .filter(Boolean)
    .slice(0, 4);

  // 톤별 표현 선택
  const praiseOpeners: Record<string, string> = {
    praise: "정말 잘 썼어요! 특히",
    balanced: "잘한 점부터 살펴볼게요.",
    correct: "먼저 잘된 부분을 짚어볼게요.",
    spicy: "칭찬은 짧게, 핵심만 봅니다.",
  };
  const correctOpeners: Record<string, string> = {
    praise: "여기만 조금 다듬으면 더 좋아요.",
    balanced: "다음 부분을 고치면 글이 한층 좋아집니다.",
    correct: "아래 항목을 정확히 교정해 봅시다.",
    spicy: "반드시 고쳐야 할 지점입니다.",
  };

  const strong = focusMetrics[0] ?? "표현력";
  const weakKey = Object.entries(scores).sort((x, y) => x[1] - y[1])[0]?.[0];
  const weakLabel = METRICS.find((m) => m.key === weakKey)?.label ?? "구성력";

  const lengthNote =
    gradeNum <= 2
      ? `글의 분량을 조금씩 늘려 문장을 더 이어 써 보면 좋겠어요.`
      : gradeNum >= 5
        ? `${genre.label}의 관점(${genre.lens})에서 논리와 근거를 더 촘촘히 다듬어 봅시다.`
        : `문단의 처음-가운데-끝 짜임을 더 분명히 하면 글이 탄탄해집니다.`;

  const result = [
    `【이든 서술형 분석지】 · ${input.gradeLevel} · ${genre.label} · ${tone.emoji} ${tone.label}`,
    ``,
    `① 잘한 점`,
    `${praiseOpeners[tone.key]} '${strong}' 면이 돋보입니다. 자기 생각을 글로 표현하려는 태도가 좋아요.`,
    ``,
    `② 고칠 점`,
    `${correctOpeners[tone.key]} 특히 '${weakLabel}'을(를) 보완할 필요가 있습니다. ${lengthNote}`,
    ``,
    `③ 다시 써보면 좋은 방향`,
    `${genre.label}은(는) ${genre.lens}이 중요합니다. 다음에 쓸 때는 이 점을 떠올리며, 문장의 이유와 근거를 한 문장씩 더 붙여 보세요.`,
    ``,
    `④ 한 줄 총평`,
    `자기 생각의 씨앗이 살아 있는 글입니다. '${weakLabel}'만 다듬으면 훨씬 좋은 글이 될 거예요. — 이든 국어 독서교육원`,
    input.custom ? `\n※ 강사 지시 반영: ${input.custom}` : ``,
  ].join("\n");

  const summary = `${strong}이(가) 강점, ${weakLabel} 보완 필요. ${genre.label} 기준 ${input.gradeLevel} 눈높이로 첨삭함.`;

  return { scores, resultText: result, summary };
}
