import { NextRequest, NextResponse } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { requireAdminApiSession } from '@/lib/admin-session';
import { getClaudeClient } from '@/lib/claude-client';
import { lessonMaterialConfig } from '@/lib/lesson-material/config';
import { assemble, cleanFragment } from '@/lib/lesson-material/template';
import { buildSystemPrompt, buildUserContent } from '@/lib/lesson-material/prompt';
import type { PromptSource, SourceKind } from '@/lib/lesson-material/prompt';
import { saveSourceFile } from '@/lib/lesson-material/storage';
import {
  getTemplate,
  createGeneration,
  addGenerationSource,
  finishGeneration,
  failGeneration,
} from '@/lib/lesson-material/queries';

// 생성은 수 분이 걸릴 수 있으므로 Node 런타임 + 동적 처리로 고정.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 800;

const TEXTY = /\.(txt|md|markdown|csv|json|html?|xml|srt|vtt|tex)$/i;

function classify(mime: string, filename: string): SourceKind | null {
  if (mime === 'application/pdf' || /\.pdf$/i.test(filename)) return 'pdf';
  if (/^image\/(png|jpeg|gif|webp)$/.test(mime)) return 'image';
  if (TEXTY.test(filename) || mime.startsWith('text/')) return 'text';
  return null;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireAdminApiSession();
  } catch {
    return jsonError('Unauthorized', 401);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonError('요청을 읽지 못했습니다. 첨부 파일 크기를 확인해 주세요.');
  }

  const templateId = Number(formData.get('templateId'));
  const extraPrompt = String(formData.get('extra') || '').trim() || null;
  const files = formData.getAll('files').filter((f): f is File => f instanceof File);

  const tpl = await getTemplate(templateId);
  if (!tpl) return jsonError('템플릿을 선택하세요.');
  if (!files.length) return jsonError('분석할 자료를 첨부하세요.');
  if (files.length > lessonMaterialConfig.maxFiles) {
    return jsonError(`첨부는 최대 ${lessonMaterialConfig.maxFiles}개까지 가능합니다.`);
  }

  // 업로드된 파일을 프롬프트용 소스로 변환하며 디스크에 보관
  const sources: (PromptSource & { size: number; storedName: string })[] = [];
  const rejected: string[] = [];
  const maxMb = Math.round(lessonMaterialConfig.maxUploadBytes / 1024 / 1024);

  for (const f of files) {
    if (f.size > lessonMaterialConfig.maxUploadBytes) {
      rejected.push(`${f.name} (최대 ${maxMb}MB)`);
      continue;
    }
    const kind = classify(f.type, f.name);
    if (!kind) {
      rejected.push(f.name);
      continue;
    }
    const buffer = Buffer.from(await f.arrayBuffer());
    const storedName = await saveSourceFile(f.name, buffer);
    sources.push({
      filename: f.name,
      kind,
      mime: f.type,
      size: f.size,
      storedName,
      ...(kind === 'text' ? { text: buffer.toString('utf8') } : { base64: buffer.toString('base64') }),
    });
  }

  if (!sources.length) {
    return jsonError(
      `지원하지 않는 형식입니다: ${rejected.join(', ')}\nPDF · 텍스트 · 이미지만 첨부할 수 있습니다.`
    );
  }

  // 이력 레코드 선생성
  const genId = await createGeneration({
    templateId,
    extraPrompt,
    adminId: session.user.id,
    adminName: session.user.name,
  });
  for (const s of sources) {
    await addGenerationSource({
      generationId: genId,
      filename: s.filename,
      storedName: s.storedName,
      mime: s.mime || '',
      kind: s.kind,
      byteSize: s.size,
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (type: string, data: Record<string, unknown>) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
      };
      // 프록시가 유휴 연결을 끊지 않도록 15초마다 하트비트
      const heartbeat = setInterval(() => {
        if (!closed) controller.enqueue(encoder.encode(': ping\n\n'));
      }, 15000);

      // 클라이언트가 창을 닫으면 스트림 중단
      let aborted = false;
      req.signal.addEventListener('abort', () => {
        aborted = true;
      });

      send('start', { generationId: genId, rejected });

      let body = '';
      try {
        const claude = getClaudeClient();
        const anthropicStream = claude.messages.stream({
          model: lessonMaterialConfig.model,
          max_tokens: lessonMaterialConfig.maxTokens,
          // effort는 API가 xhigh까지 지원하나 설치된 SDK 타입에는 아직 없어 캐스팅한다.
          output_config: { effort: lessonMaterialConfig.effort as Anthropic.OutputConfig['effort'] },
          system: buildSystemPrompt({ css: tpl.css, skeleton: tpl.skeleton, guide: tpl.guide }),
          messages: [{ role: 'user', content: buildUserContent(sources, extraPrompt) }],
        });

        for await (const ev of anthropicStream) {
          if (aborted) {
            anthropicStream.abort();
            break;
          }
          if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
            body += ev.delta.text;
            send('delta', { text: ev.delta.text });
          }
        }
        if (aborted) throw new Error('클라이언트가 연결을 종료했습니다.');

        const message = await anthropicStream.finalMessage();

        // 안전장치: 정책 거절 응답 처리.
        // stop_details는 API가 내려주지만 설치된 SDK 0.74 타입에는 아직 없어 좁혀서 읽는다.
        if (message.stop_reason === 'refusal') {
          const details = (message as { stop_details?: { category?: string } }).stop_details;
          throw new Error(`모델이 요청을 거절했습니다 (${details?.category || '사유 미상'}).`);
        }
        if (!body.trim()) throw new Error('모델이 빈 응답을 반환했습니다. 다시 시도해 주세요.');

        const fragment = cleanFragment(body);
        const { html, title } = assemble(tpl.html, fragment);

        await finishGeneration({
          id: genId,
          title: title || tpl.title,
          bodyHtml: fragment,
          fullHtml: html,
          stopReason: message.stop_reason || null,
          inputTokens: message.usage?.input_tokens || 0,
          outputTokens: message.usage?.output_tokens || 0,
        });

        send('done', {
          generationId: genId,
          title: title || tpl.title,
          stopReason: message.stop_reason,
          usage: message.usage,
          truncated: message.stop_reason === 'max_tokens',
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : '생성 중 오류가 발생했습니다.';
        await failGeneration(genId, msg).catch(() => {});
        if (!aborted) send('error', { message: msg });
        console.error('[lesson-material/generate]', e);
      } finally {
        clearInterval(heartbeat);
        closed = true;
        try {
          controller.close();
        } catch {
          // 이미 닫혔으면 무시
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
