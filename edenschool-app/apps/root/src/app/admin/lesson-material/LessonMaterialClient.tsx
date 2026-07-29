'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/* =========================================================
   타입
   ========================================================= */
interface TemplateItem {
  id: number;
  name: string;
  title: string;
  has_paper: number;
  byte_size: number;
  admin_name: string;
  created_at: string;
}

interface HistoryItem {
  id: number;
  title: string;
  status: 'done' | 'error';
  output_tokens: number;
  admin_name: string;
  created_at: string;
  template_name: string | null;
  source_count: number;
}

type StatusMode = '' | 'busy' | 'err';

/* =========================================================
   유틸
   ========================================================= */
const kb = (n: number) =>
  n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`;

const when = (s: string) => {
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
};

const TEXTY = /\.(txt|md|markdown|csv|json|html?|xml|srt|vtt|tex)$/i;

function kindOf(f: File): 'PDF' | 'IMG' | 'TXT' | null {
  if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) return 'PDF';
  if (/^image\/(png|jpeg|gif|webp)$/.test(f.type)) return 'IMG';
  if (TEXTY.test(f.name) || f.type.startsWith('text/')) return 'TXT';
  return null;
}

async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = (data && typeof data === 'object' && 'error' in data ? data.error : String(data)) as string;
    throw new Error(msg || `${res.status} ${res.statusText}`);
  }
  return data as T;
}

/* =========================================================
   드롭존
   ========================================================= */
function DropZone({
  title,
  hint,
  accept,
  onFiles,
}: {
  title: string;
  hint: string;
  accept: string;
  onFiles: (files: File[]) => void;
}) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div
        className={`lm-drop${over ? ' over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFiles([...e.dataTransfer.files]);
        }}
      >
        <b>{title}</b>
        {hint}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          onFiles([...(e.target.files || [])]);
          e.target.value = '';
        }}
      />
    </>
  );
}

/* =========================================================
   메인
   ========================================================= */
export default function LessonMaterialClient() {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [sources, setSources] = useState<File[]>([]);
  const [extra, setExtra] = useState('');

  const [generationId, setGenerationId] = useState<number | null>(null);
  const [statusText, setStatusText] = useState('대기 중');
  const [statusMode, setStatusMode] = useState<StatusMode>('');
  const [health, setHealth] = useState<{ ok: boolean; text: string }>({ ok: false, text: '연결 확인 중…' });

  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [view, setView] = useState<'placeholder' | 'stream' | 'preview'>('placeholder');
  const [previewSrc, setPreviewSrc] = useState('');

  const [history, setHistory] = useState<HistoryItem[] | null>(null);

  const streamRef = useRef<HTMLPreElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  const setStatus = (text: string, mode: StatusMode = '') => {
    setStatusText(text);
    setStatusMode(mode);
  };

  /* ── 템플릿 ─────────────────────────────── */
  const loadTemplates = useCallback(async () => {
    try {
      const rows = await api<TemplateItem[]>('/api/admin/lesson-material/templates');
      setTemplates(rows);
      setSelected((prev) => (rows.some((t) => t.id === prev) ? prev : rows[0]?.id ?? null));
      return rows;
    } catch (e) {
      setTemplates([]);
      setStatus(`템플릿 목록을 불러오지 못했습니다 — ${(e as Error).message}`, 'err');
      return [];
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const h = await api<{ model: string; effort: string; hasApiKey: boolean }>(
          '/api/admin/lesson-material/health'
        );
        setHealth({
          ok: h.hasApiKey,
          text: h.hasApiKey ? `DB 연결됨 · ${h.model} (${h.effort})` : 'ANTHROPIC_API_KEY 미설정',
        });
      } catch (e) {
        setHealth({ ok: false, text: '서버 오류' });
        setStatus(`서버에 연결할 수 없습니다 — ${(e as Error).message}`, 'err');
      }
      await loadTemplates();
    })();
  }, [loadTemplates]);

  async function uploadTemplates(files: File[]) {
    const htmls = files.filter((f) => /\.html?$/i.test(f.name));
    if (!htmls.length) {
      alert('HTML 파일만 등록할 수 있습니다.');
      return;
    }

    const fd = new FormData();
    htmls.forEach((f) => fd.append('files', f));

    setStatus('템플릿 등록 중…', 'busy');
    try {
      const r = await api<{
        created: { id: number; name: string; hasPaper: boolean }[];
        skipped: { name: string; reason: string }[];
      }>('/api/admin/lesson-material/templates', { method: 'POST', body: fd });

      await loadTemplates();
      if (r.created.length) setSelected(r.created[0].id);

      const noPaper = r.created.filter((c) => !c.hasPaper).map((c) => c.name);
      let msg = `${r.created.length}개 등록 완료`;
      if (noPaper.length) {
        msg += ` · ${noPaper.join(', ')}: id="paper" 없음 (body 전체를 본문으로 사용)`;
      }
      setStatus(msg);
      if (r.skipped.length) {
        alert('등록 실패:\n' + r.skipped.map((s) => `· ${s.name} — ${s.reason}`).join('\n'));
      }
    } catch (e) {
      setStatus(`템플릿 등록 실패 — ${(e as Error).message}`, 'err');
    }
  }

  async function removeTemplate(t: TemplateItem) {
    if (!confirm(`"${t.name}" 템플릿을 삭제할까요?\n(이 템플릿으로 만든 생성 이력은 남습니다)`)) return;
    try {
      await api(`/api/admin/lesson-material/templates/${t.id}`, { method: 'DELETE' });
      await loadTemplates();
    } catch (e) {
      alert('삭제 실패: ' + (e as Error).message);
    }
  }

  /* ── 첨부 자료 (업로드는 생성 시점에) ────── */
  function addSources(files: File[]) {
    const bad: string[] = [];
    const ok: File[] = [];
    for (const f of files) {
      if (!kindOf(f)) bad.push(f.name);
      else ok.push(f);
    }
    if (ok.length) setSources((prev) => [...prev, ...ok]);
    if (bad.length) {
      alert(
        `지원하지 않는 형식입니다:\n${bad.join('\n')}\n\n` +
          'PDF · 텍스트(txt/md/csv/json/html) · 이미지(png/jpg/gif/webp)만 첨부할 수 있습니다.\n' +
          '한글(.hwp)·워드(.docx)는 PDF로 내보낸 뒤 첨부하세요.'
      );
    }
  }

  /* ── 생성 (POST + SSE 스트리밍 수신) ────── */
  async function generate() {
    if (!selected) {
      alert('템플릿을 선택하세요.');
      return;
    }
    if (!sources.length) {
      alert('분석할 자료를 첨부하세요.');
      return;
    }

    const fd = new FormData();
    fd.append('templateId', String(selected));
    fd.append('extra', extra.trim());
    sources.forEach((f) => fd.append('files', f));

    setGenerating(true);
    setGenerationId(null);
    setStreamText('');
    setView('stream');
    setStatus('자료를 업로드하고 분석을 시작합니다…', 'busy');

    let gotId: number | null = null;
    let chars = 0;

    try {
      const res = await fetch('/api/admin/lesson-material/generate', { method: 'POST', body: fd });

      // 스트리밍 시작 전 오류는 JSON 으로 온다
      const ct = res.headers.get('content-type') || '';
      if (!res.ok || !ct.includes('text/event-stream')) {
        const data = ct.includes('json') ? await res.json() : await res.text();
        throw new Error((data && data.error) || String(data));
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let i: number;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const chunk = buf.slice(0, i);
          buf = buf.slice(i + 2);

          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data:')) continue; // ': ping' 하트비트는 무시
            let ev: Record<string, never>;
            try {
              ev = JSON.parse(line.slice(5).trim());
            } catch {
              continue;
            }

            if (ev.type === 'start') {
              gotId = Number(ev.generationId);
              setGenerationId(gotId);
              const rejected = (ev.rejected as unknown as string[]) || [];
              if (rejected.length) {
                alert('지원하지 않는 형식이라 제외했습니다:\n' + rejected.join('\n'));
              }
              setStatus('AI가 자료를 분석하는 중…', 'busy');
            } else if (ev.type === 'delta') {
              const text = String(ev.text);
              chars += text.length;
              setStreamText((prev) => prev + text);
              setStatus(`작성 중… ${chars.toLocaleString()}자`, 'busy');
            } else if (ev.type === 'done') {
              const id = Number(ev.generationId);
              setGenerationId(id);
              setPreviewSrc(`/api/admin/lesson-material/generate/${id}/html?t=${Date.now()}`);
              setView('preview');

              const usage = ev.usage as unknown as { output_tokens: number } | undefined;
              const tok = usage ? ` · 출력 ${usage.output_tokens.toLocaleString()}토큰` : '';
              const warn = ev.truncated ? ' (길이 제한으로 잘렸을 수 있습니다)' : '';
              setStatus(`완료 · ${chars.toLocaleString()}자${tok}${warn}`);
            } else if (ev.type === 'error') {
              throw new Error(String(ev.message));
            }
          }
        }
      }
      if (!gotId) throw new Error('서버 응답이 중단되었습니다.');
    } catch (e) {
      setView(previewSrc ? 'preview' : 'placeholder');
      setStatus(`실패 — ${(e as Error).message}`, 'err');
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  // 스트리밍 중 자동 스크롤 (사용자가 위로 올려둔 경우엔 유지)
  useEffect(() => {
    const el = streamRef.current;
    if (!el || view !== 'stream') return;
    const stick = el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
    if (stick) el.scrollTop = el.scrollHeight;
  }, [streamText, view]);

  /* ── 내보내기 ───────────────────────────── */
  function saveHtml() {
    if (!generationId) return;
    location.href = `/api/admin/lesson-material/generate/${generationId}/download`;
  }

  /* 템플릿의 @media print 규칙을 그대로 살려 인쇄 (대화상자에서 PDF 저장도 가능) */
  function printDoc() {
    if (!generationId) return;
    const f = printFrameRef.current;
    if (!f) return;
    f.onload = () => {
      setTimeout(() => {
        try {
          f.contentWindow?.focus();
          f.contentWindow?.print();
          setStatus('인쇄 창이 열렸습니다. 대상에서 프린터 또는 "PDF로 저장"을 고르세요.');
        } catch {
          alert('인쇄 창을 열지 못했습니다. HTML로 저장한 뒤 브라우저에서 인쇄해 주세요.');
        }
      }, 500);
    };
    f.src = `/api/admin/lesson-material/generate/${generationId}/html?print=1&t=${Date.now()}`;
  }

  /* ── 생성 이력 ──────────────────────────── */
  async function openHistory() {
    try {
      setHistory(await api<HistoryItem[]>('/api/admin/lesson-material/generate/history'));
    } catch (e) {
      alert('이력을 불러오지 못했습니다: ' + (e as Error).message);
    }
  }

  function loadFromHistory(r: HistoryItem) {
    if (r.status !== 'done') {
      alert('실패한 생성은 불러올 수 없습니다.');
      return;
    }
    setGenerationId(r.id);
    setPreviewSrc(`/api/admin/lesson-material/generate/${r.id}/html?t=${Date.now()}`);
    setView('preview');
    setHistory(null);
    setStatus(`이력 불러옴 · ${r.title || ''} (${when(r.created_at)})`);
  }

  async function removeHistory(r: HistoryItem) {
    if (!confirm(`${when(r.created_at)} "${r.title || '(제목 없음)'}" 이력을 삭제할까요?`)) return;
    try {
      await api(`/api/admin/lesson-material/generate/${r.id}`, { method: 'DELETE' });
      setHistory((prev) => prev?.filter((x) => x.id !== r.id) ?? null);
      if (generationId === r.id) {
        setGenerationId(null);
        setPreviewSrc('');
        setView('placeholder');
      }
    } catch (e) {
      alert('삭제 실패: ' + (e as Error).message);
    }
  }

  /* ── 렌더 ───────────────────────────────── */
  const totalSize = sources.reduce((n, f) => n + f.size, 0);
  const canExport = Boolean(generationId) && Boolean(previewSrc);

  return (
    <div className="lm-root">
      <header className="lm-header">
        <div className="lm-title">
          수업자료 템플릿 생성기
          <small>템플릿 등록 → 자료 첨부 → AI 생성 → PDF</small>
        </div>
        <span className="lm-pill">
          <span className={`lm-dot${health.ok ? ' ok' : ' bad'}`} />
          {health.text}
        </span>
        <button type="button" onClick={openHistory}>
          생성 이력
        </button>
      </header>

      <div className="lm-main">
        {/* ================= 왼쪽 : 조작 ================= */}
        <div className="lm-left">
          <section>
            <p className="lm-step">
              <i>1</i>템플릿 등록 · 선택
              <span className="lm-cnt">{templates.length ? `${templates.length}개` : ''}</span>
            </p>
            <DropZone
              title="+ 템플릿 HTML 등록"
              hint="클릭하거나 .html 파일을 끌어다 놓으세요"
              accept=".html,.htm,text/html"
              onFiles={uploadTemplates}
            />
            <ul className="lm-list">
              {!templates.length && (
                <li className="static">
                  <span className="lm-empty">등록된 템플릿이 없습니다</span>
                </li>
              )}
              {templates.map((t) => (
                <li
                  key={t.id}
                  className={t.id === selected ? 'sel' : ''}
                  onClick={() => setSelected(t.id)}
                >
                  <span className={`lm-kind${t.has_paper ? '' : ' err'}`}>HTML</span>
                  <span className="lm-info">
                    <span className="lm-name">{t.name}</span>
                    <span className="lm-meta">
                      {t.title || '제목 없음'} · {kb(t.byte_size)}
                      {t.has_paper ? '' : ' · #paper 없음'}
                      {t.admin_name ? ` · ${t.admin_name}` : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="lm-mini"
                    title="템플릿 미리보기"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/api/admin/lesson-material/templates/${t.id}/html`, '_blank');
                    }}
                  >
                    보기
                  </button>
                  <button
                    type="button"
                    className="lm-mini danger"
                    title="삭제"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTemplate(t);
                    }}
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="lm-step">
              <i>2</i>자료 첨부
              <span className="lm-cnt">
                {sources.length ? `${sources.length}개 · ${kb(totalSize)}` : ''}
              </span>
            </p>
            <DropZone
              title="+ 분석할 자료 첨부"
              hint="PDF · 텍스트 · 이미지 · HTML (여러 개 가능)"
              accept=".pdf,.txt,.md,.csv,.json,.html,.htm,.xml,image/*"
              onFiles={addSources}
            />
            <ul className="lm-list">
              {!sources.length && (
                <li className="static">
                  <span className="lm-empty">첨부된 자료가 없습니다</span>
                </li>
              )}
              {sources.map((f, i) => (
                <li key={`${f.name}-${i}`} className="static">
                  <span className="lm-kind">{kindOf(f)}</span>
                  <span className="lm-info">
                    <span className="lm-name">{f.name}</span>
                    <span className="lm-meta">{kb(f.size)}</span>
                  </span>
                  <button
                    type="button"
                    className="lm-mini danger"
                    title="제거"
                    onClick={() => setSources((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    제거
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <p className="lm-step">
              <i>3</i>추가 지시<span className="lm-cnt">선택</span>
            </p>
            <textarea
              className="lm-textarea"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="예) 고1 대상, 문항별 분석 위주로. 오답 이유를 자세히 써 주세요."
            />
          </section>

          <button type="button" className="lm-btn primary big" disabled={generating} onClick={generate}>
            {generating ? '생성 중…' : '자료 생성하기'}
          </button>

          <div className="lm-note">
            <b>참고</b> — API 키와 DB 접속 정보는 서버 환경변수에만 있고 브라우저로 내려오지 않습니다.
            생성된 자료는 DB에 저장되어 &ldquo;생성 이력&rdquo;에서 다시 볼 수 있습니다.
          </div>
        </div>

        {/* ================= 오른쪽 : 결과 ================= */}
        <div className="lm-right">
          <div className="lm-bar">
            <span className={`lm-status ${statusMode}`}>
              {statusMode === 'busy' && <span className="lm-spin" />}
              {statusText}
            </span>
            <button
              type="button"
              className="lm-btn"
              disabled={!streamText}
              onClick={() => setView(view === 'stream' ? 'preview' : 'stream')}
            >
              {view === 'stream' ? '미리보기' : '생성 로그'}
            </button>
            <button type="button" className="lm-btn" disabled={!canExport} onClick={saveHtml}>
              HTML 저장
            </button>
            <button type="button" className="lm-btn primary" disabled={!canExport} onClick={printDoc}>
              인쇄
            </button>
          </div>

          <div className="lm-stage">
            {previewSrc && (
              <iframe
                className="lm-preview"
                title="결과 미리보기"
                src={previewSrc}
                style={{ display: view === 'preview' ? 'block' : 'none' }}
              />
            )}
            <pre
              ref={streamRef}
              className="lm-stream"
              style={{ display: view === 'stream' ? 'block' : 'none' }}
            >
              {streamText}
            </pre>
            {view === 'placeholder' && (
              <div className="lm-placeholder">
                <b>결과가 여기에 표시됩니다</b>
                <span>템플릿을 고르고 자료를 첨부한 뒤 &ldquo;자료 생성하기&rdquo;를 누르세요.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 인쇄용 숨김 iframe */}
      <iframe ref={printFrameRef} className="lm-print-frame" title="인쇄" />

      {/* 생성 이력 모달 */}
      {history && (
        <div className="lm-modal-backdrop" onClick={() => setHistory(null)}>
          <div className="lm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lm-modal-head">
              <b>생성 이력 (최근 {history.length}건)</b>
              <button type="button" className="lm-mini" onClick={() => setHistory(null)}>
                닫기
              </button>
            </div>
            <div className="lm-modal-body">
              {!history.length && <p className="lm-empty">생성 이력이 없습니다.</p>}
              {history.map((r) => (
                <div key={r.id} className="lm-hist">
                  <span className={`lm-badge${r.status === 'done' ? '' : ' err'}`}>
                    {r.status === 'done' ? '완료' : '실패'}
                  </span>
                  <span className="lm-info">
                    <span className="lm-name">{r.title || '(제목 없음)'}</span>
                    <span className="lm-meta">
                      {when(r.created_at)} · {r.template_name || '템플릿 삭제됨'} · 자료 {r.source_count}개
                      {r.admin_name ? ` · ${r.admin_name}` : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="lm-mini"
                    disabled={r.status !== 'done'}
                    onClick={() => loadFromHistory(r)}
                  >
                    불러오기
                  </button>
                  <button type="button" className="lm-mini danger" onClick={() => removeHistory(r)}>
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
