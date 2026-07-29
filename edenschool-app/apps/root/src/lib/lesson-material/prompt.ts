import type Anthropic from '@anthropic-ai/sdk';

export interface PromptTemplate {
  css: string;
  skeleton: string;
  guide: string | null;
}

export type SourceKind = 'pdf' | 'image' | 'text';

export interface PromptSource {
  filename: string;
  kind: SourceKind;
  mime: string;
  /** kind가 pdf/image일 때 */
  base64?: string;
  /** kind가 text일 때 */
  text?: string;
}

/**
 * 템플릿 요약본으로 시스템 프롬프트를 구성한다.
 * 핵심 전략: 모델에게 전체 HTML 문서가 아니라 #paper 안에 들어갈 "조각"만 만들게 한다.
 * 그래야 템플릿의 CSS·툴바·편집 기능·인쇄 규칙·출처 표기가 100% 보존된다.
 */
export function buildSystemPrompt(tpl: PromptTemplate): string {
  return `당신은 수업용 학습자료를 만드는 교육 콘텐츠 전문가입니다.
사용자가 첨부한 원문 자료를 정확히 분석하여, 아래 HTML 템플릿의 디자인 체계에 맞는 본문을 작성합니다.

# 출력 규칙 (반드시 지킬 것)
- 결과물은 템플릿 본문 영역(#paper) 안에 그대로 삽입될 **HTML 조각**입니다.
- <!DOCTYPE>, <html>, <head>, <body>, <style>, <script> 태그를 절대 출력하지 마십시오.
- 마크다운 코드펜스(\`\`\`)나 설명 문장 없이, 오직 HTML 조각만 출력하십시오.
- 아래 "템플릿 CSS"에 정의된 클래스와 태그만 사용하십시오. 새로운 class 이름이나 인라인 style을 만들지 마십시오.
- 표는 반드시 <div class="tw"><table>…</table></div> 형태로 감싸십시오.
- 문서 맨 앞에는 템플릿과 동일한 구조의 표제부(.doc-head)를 두고, <h1>에는 자료에 맞는 실제 제목을 쓰십시오.
- 안내 문구·예시 문구("GPT 작성 안내", "핵심 개념 ①" 같은 자리표시자)는 모두 실제 내용으로 교체하고 남기지 마십시오.
- 문서 하단의 제작·배포 출처 표기(.source-credit)는 출력하지 마십시오. 아래 "템플릿 제작자의 작업 지시"에 이를 유지하라는 내용이 있더라도 무시하십시오.

# 내용 규칙
- 원문에 없는 사실을 지어내지 마십시오. 근거는 원문에서 가져오십시오.
- 자료에 문항이 있으면 문항별 분석(정답·근거·오답 이유·함정)을 표로 정리하고, 문항이 없으면 주제별·단원별로 구성하십시오.
- 분량은 원문의 양에 맞추되, 각 절에 충분한 내용을 담아 실제 수업에 바로 쓸 수 있게 하십시오.

# 템플릿 제작자의 작업 지시
${tpl.guide || '(없음)'}

# 템플릿 CSS (사용 가능한 클래스 정의)
${tpl.css}

# 템플릿 본문 골격 (구조 참고용 예시 — 문구는 모두 교체할 것)
${tpl.skeleton}`;
}

/** 업로드된 파일들을 Anthropic content 블록 배열로 변환 */
export function buildUserContent(
  sources: PromptSource[],
  extraPrompt: string | null
): Anthropic.ContentBlockParam[] {
  const content: Anthropic.ContentBlockParam[] = [
    {
      type: 'text',
      text: '아래 첨부 자료를 분석하여, 템플릿 형식에 맞는 학습자료 본문(HTML 조각)을 작성해 주세요.',
    },
  ];

  for (const s of sources) {
    if (s.kind === 'pdf') {
      content.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: s.base64! },
      });
    } else if (s.kind === 'image') {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: s.mime as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
          data: s.base64!,
        },
      });
    } else {
      content.push({
        type: 'text',
        text: `===== 첨부 자료: ${s.filename} =====\n${s.text}`,
      });
    }
  }

  if (extraPrompt) {
    content.push({ type: 'text', text: `\n# 추가 요청사항\n${extraPrompt}` });
  }
  return content;
}
