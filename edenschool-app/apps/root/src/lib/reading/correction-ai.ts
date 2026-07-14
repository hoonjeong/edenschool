import "server-only";
import { getClaudeClient, CLAUDE_MODEL } from "./claude";
import {
  GRADE_INTENSITY,
  GENRES,
  TONES,
  METRICS,
} from "./correction-config";
import type { GenInput, GenOutput } from "./correction-engine";

// ── ② 이미지 → 문제·답안 인식 (Claude 비전 OCR) ──────────
export interface OcrResult {
  problem: string;
  answer: string;
}

function parseDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return null;
  return { mediaType: m[1], data: m[2] };
}

const OCR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    problem: { type: "string" },
    answer: { type: "string" },
  },
  required: ["problem", "answer"],
} as const;

export async function recognizeImageWithClaude(dataUrl: string): Promise<OcrResult> {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) throw new Error("이미지 형식을 인식할 수 없습니다.");

  const client = getClaudeClient();
  const res = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    system:
      "너는 초등학생 손글씨 답안지를 정확히 전사하는 OCR 도우미다. 이미지에서 '문제(지시문)'와 '학생 답안'을 구분해 그대로 옮겨 적는다. 맞춤법을 임의로 고치지 말고 학생이 쓴 그대로 전사한다. 글자 판독 신뢰도가 낮아 확신이 없는 낱말은 그 낱말을 [[ ]]로 감싼다. 문제가 이미지에 없으면 problem은 빈 문자열로 둔다.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: parsed.mediaType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
              data: parsed.data,
            },
          },
          {
            type: "text",
            text: "이 답안지를 전사해 주세요. 문제와 학생 답안을 분리해 JSON으로 반환합니다.",
          },
        ],
      },
    ],
    output_config: { format: { type: "json_schema", schema: OCR_SCHEMA } },
  } as never);

  const text = extractJsonText(res);
  const obj = JSON.parse(text) as OcrResult;
  return { problem: obj.problem ?? "", answer: obj.answer ?? "" };
}

// ── ⑤ 첨삭 실행 (Claude 구조화 출력) ─────────────────────
const CORRECTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    scores: {
      type: "object",
      additionalProperties: false,
      properties: Object.fromEntries(
        METRICS.map((m) => [m.key, { type: "integer" }]),
      ),
      required: METRICS.map((m) => m.key),
    },
    resultText: { type: "string" },
    summary: { type: "string" },
  },
  required: ["scores", "resultText", "summary"],
} as const;

export async function analyzeAnswerWithClaude(input: GenInput): Promise<GenOutput> {
  const client = getClaudeClient();

  const grade = GRADE_INTENSITY.find((g) => g.grade === input.gradeLevel) ?? GRADE_INTENSITY[3];
  const genre = GENRES.find((g) => g.key === input.genre) ?? GENRES[1];
  const tone = TONES.find((t) => t.key === input.tone) ?? TONES[1];
  const focus = input.metrics
    .map((k) => METRICS.find((m) => m.key === k)?.label)
    .filter(Boolean)
    .join(", ");

  const system = `너는 '이든 국어 독서교육원'의 서술형 글쓰기 첨삭 선생님이다.
아래 이든의 교육 방향성을 모든 첨삭에 공통으로 반영한다.

[이든 방향성]
${input.edenDirection}

[이번 첨삭 기준]
- 대상 학년: ${input.gradeLevel} — ${grade.focus}
  (지도 방향: ${grade.guide})
- 글의 종류: ${genre.label} — 분석 관점: ${genre.lens}
- 첨삭 방향성(톤): ${tone.label} — ${tone.guide}
- 지도 강사 중점 척도: ${focus || "전반"}
${input.custom ? `- 강사 직접 지시: ${input.custom}` : ""}

[작성 규칙]
1. 초등학생과 학부모가 읽을 글이므로 따뜻하고 존중하는 말투로 쓴다.
2. resultText는 다음 4부분 구성을 지킨다: ① 잘한 점 ② 고칠 점(문장 단위로 구체적으로) ③ 다시 써보면 좋은 방향(예시 문장 포함) ④ 한 줄 총평.
3. 없는 내용을 지어내 칭찬하거나 과장하지 않는다. 답안에 실제로 드러난 근거로만 평가한다.
4. scores는 각 척도를 0~100 정수로 평가한다(학년 기준에 맞춰 엄정하게).
5. summary는 강점과 보완점을 한 문장으로 요약한다.`;

  const user = `아래는 ${input.gradeLevel} 학생의 ${genre.label} 답안이다.

[문제]
${input.problemText || "(문제 정보 없음)"}

[학생 답안]
${input.answerText}

위 기준에 따라 첨삭 분석지(resultText), 척도별 점수(scores), 한 줄 요약(summary)을 JSON으로 작성하라.`;

  const res = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 6000,
    thinking: { type: "adaptive" },
    system,
    messages: [{ role: "user", content: user }],
    output_config: { format: { type: "json_schema", schema: CORRECTION_SCHEMA } },
  } as never);

  const text = extractJsonText(res);
  const obj = JSON.parse(text) as GenOutput;
  // 점수 방어적 정규화
  const scores: Record<string, number> = {};
  for (const m of METRICS) {
    const v = Number((obj.scores as Record<string, number>)?.[m.key]);
    scores[m.key] = Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : 50;
  }
  return { scores, resultText: obj.resultText ?? "", summary: obj.summary ?? "" };
}

// 응답에서 최종 JSON 텍스트 블록 추출 (thinking 블록 등 제외)
function extractJsonText(res: { content: Array<{ type: string; text?: string }> }): string {
  const textBlocks = res.content.filter((b) => b.type === "text" && b.text);
  const joined = textBlocks.map((b) => b.text).join("").trim();
  if (!joined) throw new Error("Claude 응답에서 결과 텍스트를 찾지 못했습니다.");
  return joined;
}
