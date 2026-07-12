import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { withErrorHandler } from '@/lib/api-handler';
import { getClaudeClient, PARENT_MESSAGE_SYSTEM_PROMPT } from '@/lib/claude-client';

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

  let message = '';
  for (const block of response.content) {
    if (block.type === 'text') message += block.text;
  }
  message = message.trim();

  if (!message) {
    return NextResponse.json({ error: '메시지 변환에 실패했습니다. 다시 시도해 주세요.' }, { status: 502 });
  }

  return NextResponse.json({ message });
});
