import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { getClaudeClient, PARENT_MESSAGE_SYSTEM_PROMPT, PARENT_MESSAGE_GREETING } from '@/lib/claude-client';

// 선생님 상담/클리닉 기록 → 학부모 전송용 메시지 변환 (AI)
// 비용 최소화를 위해 가장 저렴한 모델(Haiku 4.5) 사용. 짧은 비스트리밍 호출.
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireAdminApiSession();

  const body = await req.json();
  const note = (body.note as string || '').trim();

  if (!note) {
    return NextResponse.json({ error: '변환할 상담 기록을 입력하세요.' }, { status: 400 });
  }

  const client = getClaudeClient();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: PARENT_MESSAGE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `다음은 선생님이 남긴 상담/클리닉 기록입니다. 학부모님께 보낼 문자 메시지로 다듬어 주세요.\n\n${note}`,
      },
    ],
  });

  let body_text = '';
  for (const block of response.content) {
    if (block.type === 'text') body_text += block.text;
  }
  body_text = body_text.trim();

  if (!body_text) {
    return NextResponse.json({ error: '메시지 변환에 실패했습니다. 다시 시도해 주세요.' }, { status: 502 });
  }

  // 맨 앞에 고정 인사말을 항상 붙인다.
  const message = `${PARENT_MESSAGE_GREETING}\n\n${body_text}`;

  return NextResponse.json({ message });
});
