"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Plus, Send, Eye, Pencil, Trash2, FileText, Info, Check, MessageSquare } from "lucide-react";
import { Card, PageIntro, Badge, Button, EmptyState } from "@/components/reading/ui";
import Modal, { inputCls, labelCls } from "@/components/reading/Modal";
import { fmtDateShort, fmtTime } from "@/lib/reading/utils";
import { createTemplate, updateTemplate, deleteTemplate, previewNotices, sendNotices } from "./actions";

const VAR_HELP = ["이름", "반", "점수", "특이점", "다음수업"];

export default function NoticesClient({ templates, students, recentLogs, smsConfigured }: any) {
  const router = useRouter();
  const [tab, setTab] = useState<"send" | "templates">("send");

  return (
    <div>
      <PageIntro title="공지 · 문자" desc="템플릿의 이름·점수·특이점만 자동 치환해 개인화 공지를 대량 발송합니다." />

      {!smsConfigured && (
        <div className="mb-4 rounded-xl bg-amber-50 text-amber-700 text-[13px] px-4 py-3 inline-flex items-start gap-2">
          <Info className="size-4 mt-0.5 shrink-0" />
          <span>알리고 문자 자격증명이 설정되지 않아 <b>드라이런(모의 발송)</b>으로 동작합니다. 실제 발송은 <code>.env</code>의 SMS 값 설정 후 가능합니다. (발송 로그는 정상 기록됩니다)</span>
        </div>
      )}

      <div className="flex gap-1 mb-4 border-b border-line">
        {[
          { k: "send", label: "공지 생성·발송" },
          { k: "templates", label: "템플릿 관리" },
        ].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k as any)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px ${tab === t.k ? "border-brand-600 text-brand-700" : "border-transparent text-muted hover:text-ink"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "send" ? (
        <SendView templates={templates} students={students} recentLogs={recentLogs} />
      ) : (
        <TemplatesView templates={templates} onChange={() => router.refresh()} />
      )}
    </div>
  );
}

function SendView({ templates, students, recentLogs }: any) {
  const [templateId, setTemplateId] = useState<number | null>(templates[0]?.id ?? null);
  const [classFilter, setClassFilter] = useState("ALL");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [previews, setPreviews] = useState<any[] | null>(null);
  const [result, setResult] = useState<any>(null);
  const [pending, start] = useTransition();

  const template = templates.find((t: any) => t.id === templateId);
  const classes = useMemo(() => {
    const m = new Map<number, string>();
    for (const s of students) if (s.classId) m.set(s.classId, s.className);
    return [...m.entries()];
  }, [students]);

  const filtered = students.filter((s: any) => classFilter === "ALL" || String(s.classId) === classFilter);

  function toggle(id: number) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    setPreviews(null); setResult(null);
  }
  function selectAll() {
    setSelected(new Set(filtered.map((s: any) => s.id)));
    setPreviews(null); setResult(null);
  }

  function preview() {
    if (!template || selected.size === 0) return;
    start(async () => {
      const p = await previewNotices(template.body, [...selected]);
      setPreviews(p);
      setResult(null);
    });
  }
  function send() {
    if (!template || selected.size === 0) return;
    if (!confirm(`${selected.size}명에게 문자를 발송할까요?`)) return;
    start(async () => {
      const r = await sendNotices(template.body, [...selected], template.id);
      setResult(r);
    });
  }

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      {/* 좌: 템플릿 + 대상 */}
      <div className="lg:col-span-2 space-y-5">
        <Card className="p-5">
          <label className={labelCls}>템플릿 선택</label>
          <select value={templateId ?? ""} onChange={(e) => { setTemplateId(Number(e.target.value)); setPreviews(null); setResult(null); }} className={inputCls}>
            {templates.map((t: any) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          {template && (
            <div className="mt-3 rounded-lg bg-canvas px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line">
              {highlightVars(template.body)}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <label className={labelCls + " mb-0"}>발송 대상</label>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="ml-auto h-8 rounded-lg border border-line bg-canvas px-2 text-[13px]">
              <option value="ALL">전체 반</option>
              {classes.map(([id, name]: any) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <button onClick={selectAll} className="text-[12px] font-semibold text-brand-600 hover:underline">전체 선택</button>
            <button onClick={() => setSelected(new Set())} className="text-[12px] text-faint hover:underline">해제</button>
            <span className="ml-auto text-[12px] text-muted">{selected.size}명 선택</span>
          </div>
          <div className="max-h-72 overflow-y-auto flex flex-wrap gap-1.5">
            {filtered.map((s: any) => {
              const on = selected.has(s.id);
              return (
                <button key={s.id} onClick={() => toggle(s.id)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium border transition ${on ? "bg-brand-600 text-white border-brand-600" : "border-line text-muted hover:bg-canvas"}`}>
                  {on && <Check className="size-3.5" />}{s.name}<span className={on ? "opacity-70" : "text-faint"}>{s.grade}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 우: 미리보기 + 발송 */}
      <div className="lg:col-span-3 space-y-5">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-bold text-[15px]">개인별 미리보기</h3>
            <div className="ml-auto flex gap-2">
              <Button variant="secondary" size="sm" onClick={preview} disabled={pending || selected.size === 0}><Eye className="size-4" /> 미리보기</Button>
              <Button size="sm" onClick={send} disabled={pending || selected.size === 0}><Send className="size-4" /> 발송</Button>
            </div>
          </div>

          {result && (
            <div className={`mb-3 rounded-lg px-4 py-3 text-[13px] font-medium ${result.success === result.total ? "bg-mint-50 text-mint-700" : "bg-amber-50 text-amber-700"}`}>
              ✅ {result.total}건 중 {result.success}건 발송 성공 {result.dryRun && "(드라이런 · 실제 전송 안 됨)"}
            </div>
          )}

          {!previews ? (
            <EmptyState icon={<MessageSquare className="size-6" />} title="미리보기를 실행하세요" desc="대상을 선택하고 미리보기를 누르면 개인별 치환 결과가 표시됩니다." />
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto">
              {previews.map((p: any) => (
                <div key={p.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-[13px]">{p.name}</span>
                    <span className="text-[12px] text-faint tabular-nums">{p.phone}</span>
                  </div>
                  <div className="rounded-lg bg-canvas px-3 py-2 text-[13px] leading-relaxed whitespace-pre-line">{p.message}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {recentLogs.length > 0 && (
          <Card className="p-5">
            <h3 className="font-bold text-[15px] mb-2">최근 발송 로그</h3>
            <div className="divide-y divide-line/60">
              {recentLogs.map((l: any) => (
                <div key={l.id} className="flex items-center gap-2 py-2 text-[13px]">
                  <Badge tone={l.success ? "mint" : "rose"}>{l.success ? "성공" : "실패"}</Badge>
                  <span className="tabular-nums text-muted">{l.phone}</span>
                  <span className="text-faint">{l.type}</span>
                  <span className="ml-auto text-faint tabular-nums">{fmtDateShort(l.sentAt)} {fmtTime(l.sentAt)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function TemplatesView({ templates, onChange }: any) {
  const [modal, setModal] = useState<null | { mode: "create" | "edit"; row?: any }>(null);
  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={() => setModal({ mode: "create" })}><Plus className="size-4" /> 템플릿 추가</Button>
      </div>
      {templates.length === 0 ? (
        <Card><EmptyState icon={<FileText className="size-6" />} title="템플릿이 없습니다" /></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((t: any) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="size-4 text-brand-600" />
                <h3 className="font-bold">{t.title}</h3>
                <button onClick={() => setModal({ mode: "edit", row: t })} className="ml-auto grid size-8 place-items-center rounded-lg text-faint hover:bg-canvas hover:text-ink"><Pencil className="size-4" /></button>
              </div>
              <div className="rounded-lg bg-canvas px-4 py-3 text-[13px] leading-relaxed whitespace-pre-line">{highlightVars(t.body)}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(t.variables as string[]).map((v) => <Badge key={v} tone="brand">{`{${v}}`}</Badge>)}
              </div>
            </Card>
          ))}
        </div>
      )}
      {modal && <TemplateModal mode={modal.mode} row={modal.row} onClose={() => setModal(null)} onSaved={() => { setModal(null); onChange(); }} />}
    </div>
  );
}

function TemplateModal({ mode, row, onClose, onSaved }: any) {
  const [title, setTitle] = useState(row?.title ?? "");
  const [body, setBody] = useState(row?.body ?? "");
  const [pending, start] = useTransition();

  function insertVar(v: string) { setBody((b: string) => b + `{${v}}`); }
  function save() {
    if (!title.trim() || !body.trim()) return;
    start(async () => {
      if (mode === "create") await createTemplate({ title, body });
      else await updateTemplate(row.id, { title, body });
      onSaved();
    });
  }
  function del() {
    if (!confirm("이 템플릿을 삭제할까요?")) return;
    start(async () => { await deleteTemplate(row.id); onSaved(); });
  }

  return (
    <Modal open onClose={onClose} title={mode === "create" ? "템플릿 추가" : "템플릿 수정"} size="lg"
      footer={<>
        {mode === "edit" && <Button variant="ghost" className="mr-auto text-rose-500" onClick={del} disabled={pending}>삭제</Button>}
        <Button variant="secondary" onClick={onClose} disabled={pending}>취소</Button>
        <Button onClick={save} disabled={pending}>저장</Button>
      </>}>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>제목</label>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="주간 학습 안내" />
        </div>
        <div>
          <label className={labelCls}>본문</label>
          <textarea className={inputCls + " h-32 py-2 resize-none"} value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="{이름} 학부모님, ..." />
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] text-faint">변수 삽입:</span>
            {VAR_HELP.map((v) => (
              <button key={v} onClick={() => insertVar(v)} className="rounded-md bg-brand-50 text-brand-700 px-2 py-1 text-[12px] font-semibold hover:bg-brand-100">{`{${v}}`}</button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function highlightVars(body: string) {
  const parts = body.split(/(\{[^}]+\})/g);
  return parts.map((p, i) =>
    /^\{[^}]+\}$/.test(p) ? <span key={i} className="rounded bg-brand-100 text-brand-700 px-1 font-semibold">{p}</span> : <span key={i}>{p}</span>,
  );
}
