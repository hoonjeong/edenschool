import { getTestQuestionsV1, getTestQuestionsV2, cleanText, type V1Question } from './client';
import { VALUE_TEST_RANK_ITEM, VALUE_TEST_VALUES, MATURITY_TEST_RANK_ITEM, type TestCatalogItem } from './content';
import type { RunnerQuestion } from '@/components/career/TestRunner';

/**
 * v1/v2 문항을 TestRunner 가 쓰는 공통 형태로 정규화한다.
 *
 * v1 전송 키는 qitemNo 가 아니라 배열 순번이다. (매뉴얼 p.8: "답변 항목 구성은 JSON 순서 기준",
 * qitemNo 는 분야별 시퀀스라 문항 번호와 다를 수 있음)
 */
export async function loadRunnerQuestions(test: TestCatalogItem): Promise<RunnerQuestion[]> {
  if (test.version === 'v2') {
    const data = await getTestQuestionsV2(test.qno);
    return data.questions.map((q) => ({
      key: q.no,
      text: cleanText(q.text),
      title: q.title ? cleanText(q.title) : undefined,
      limit: Math.max(1, parseInt(q.limit, 10) || 1),
      choices: q.choices.map((c) => ({ val: c.val, text: cleanText(c.text), input: c.type === 'I' || undefined })),
    }));
  }

  const rows = await getTestQuestionsV1(test.qno);
  const isValueTest = test.qno === '24' || test.qno === '25';
  const isMaturityTest = test.qno === '35' || test.qno === '36';

  return rows.map((row, i) => {
    const key = String(i + 1);
    const text = cleanText(row.question);

    // 직업가치관검사 49번: 8개 가치 중 3개를 순위대로 (보기는 API 가 주지 않아 우리 표를 쓴다)
    if (isValueTest && row.qitemNo === VALUE_TEST_RANK_ITEM) {
      return { key, text, limit: 3, choices: VALUE_TEST_VALUES };
    }

    const choices = v1Choices(row);
    // 진로성숙도검사 13번: 1·2순위 두 개, '기타'는 주관식 입력
    if (isMaturityTest && row.qitemNo === MATURITY_TEST_RANK_ITEM) {
      return {
        key,
        text,
        limit: 2,
        choices: choices.map((c) => (c.text.startsWith('기타') ? { ...c, input: true } : c)),
      };
    }

    return { key, text, limit: 1, choices, tips: v1Tips(row, choices) };
  });
}

function v1Choices(row: V1Question): { val: string; text: string }[] {
  const out: { val: string; text: string }[] = [];
  for (let n = 1; n <= 10; n++) {
    const nn = String(n).padStart(2, '0');
    const text = row[`answer${nn}` as keyof V1Question] as string | null;
    const val = row[`answerScore${nn}` as keyof V1Question] as string | null;
    if (text && val) out.push({ val, text: cleanText(text) });
  }
  return out;
}

/** 적성검사의 보기 설명(tip): "보기 점수 → 설명" 을 사람이 읽을 문장으로 */
function v1Tips(row: V1Question, choices: { val: string; text: string }[]): string[] | undefined {
  const tips: string[] = [];
  for (const n of [1, 2, 3]) {
    const score = row[`tip${n}Score` as keyof V1Question] as string | null;
    const desc = row[`tip${n}Desc` as keyof V1Question] as string | null;
    if (score && desc) {
      const label = choices.find((c) => c.val === score)?.text ?? `보기 ${score}`;
      tips.push(`'${label}' 기준: ${cleanText(desc)}`);
    }
  }
  return tips.length > 0 ? tips : undefined;
}
