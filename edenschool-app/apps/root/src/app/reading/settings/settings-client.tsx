"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Sparkles, ClipboardList, Plus, Save, Check, KeyRound } from "lucide-react";
import { Card, PageIntro, Badge, Button, LevelChip } from "@/components/reading/ui";
import Modal, { inputCls, labelCls } from "@/components/reading/Modal";
import { ROLE_LABEL } from "@/lib/reading/labels";
import { RUBRIC } from "@/lib/reading/rubric";
import { GRADE_INTENSITY, TONES, METRICS, GENRES } from "@/lib/reading/correction-config";
import { saveEdenPhilosophy, createUser, updateUserRole, toggleUserActive, resetUserPassword } from "./actions";

export default function SettingsClient({ users, philosophy }: any) {
  const [section, setSection] = useState("accounts");
  const SECTIONS = [
    { k: "accounts", label: "계정 · 권한", icon: Users },
    { k: "correction", label: "첨삭 기본값", icon: Sparkles },
    { k: "rubric", label: "관찰 루브릭", icon: ClipboardList },
  ];
  return (
    <div>
      <PageIntro title="설정" desc="계정 권한, 첨삭 기본 방향성, 관찰 루브릭을 관리합니다." />
      <div className="grid lg:grid-cols-5 gap-5">
        <Card className="p-2 h-fit lg:col-span-1">
          {SECTIONS.map((s) => (
            <button key={s.k} onClick={() => setSection(s.k)}
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${section === s.k ? "bg-brand-50 text-brand-700" : "text-muted hover:bg-canvas"}`}>
              <s.icon className="size-4" />{s.label}
            </button>
          ))}
        </Card>
        <div className="lg:col-span-4">
          {section === "accounts" && <Accounts users={users} />}
          {section === "correction" && <CorrectionDefaults philosophy={philosophy} />}
          {section === "rubric" && <RubricViewer />}
        </div>
      </div>
    </div>
  );
}

function Accounts({ users }: any) {
  const router = useRouter();
  const [add, setAdd] = useState(false);
  const [pending, start] = useTransition();

  function role(id: number, r: string) { start(async () => { await updateUserRole(id, r); router.refresh(); }); }
  function toggle(id: number, active: boolean) { start(async () => { await toggleUserActive(id, active); router.refresh(); }); }
  function reset(id: number) {
    const pw = prompt("새 비밀번호를 입력하세요 (기본값: eden1234)", "eden1234");
    if (pw == null) return;
    start(async () => { await resetUserPassword(id, pw); alert("비밀번호가 변경되었습니다."); });
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <h3 className="font-bold text-[15px]">계정 · 권한</h3>
        <Button size="sm" onClick={() => setAdd(true)}><Plus className="size-4" /> 계정 추가</Button>
      </div>
      <div className="divide-y divide-line/70">
        {users.map((u: any) => (
          <div key={u.id} className="flex items-center gap-3 px-5 py-3">
            <div className="grid size-9 place-items-center rounded-full bg-brand-100 text-brand-700 font-bold text-[13px]">{u.name.slice(0, 2)}</div>
            <div className="min-w-0">
              <div className="font-semibold flex items-center gap-2">{u.name}{!u.active && <Badge tone="slate">비활성</Badge>}</div>
              <div className="text-[12px] text-faint">{u.email}</div>
            </div>
            <select value={u.role} onChange={(e) => role(u.id, e.target.value)} disabled={pending}
              className="ml-auto h-9 rounded-lg border border-line bg-canvas px-2 text-[13px]">
              {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button onClick={() => reset(u.id)} className="grid size-8 place-items-center rounded-lg text-faint hover:bg-canvas hover:text-ink" title="비밀번호 재설정"><KeyRound className="size-4" /></button>
            <button onClick={() => toggle(u.id, !u.active)} disabled={pending}
              className={`text-[12px] font-semibold px-2 py-1 rounded-lg ${u.active ? "text-rose-500 hover:bg-rose-50" : "text-mint-600 hover:bg-mint-50"}`}>
              {u.active ? "비활성화" : "활성화"}
            </button>
          </div>
        ))}
      </div>
      {add && <AddUserModal onClose={() => setAdd(false)} onSaved={() => { setAdd(false); router.refresh(); }} />}
    </Card>
  );
}

function AddUserModal({ onClose, onSaved }: any) {
  const [form, setForm] = useState({ name: "", email: "", role: "TEACHER", password: "eden1234" });
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  function save() {
    if (!form.name.trim() || !form.email.trim()) return setErr("이름과 이메일을 입력하세요.");
    start(async () => {
      const r = await createUser(form);
      if (!r.ok) return setErr(r.error || "실패");
      onSaved();
    });
  }
  return (
    <Modal open onClose={onClose} title="계정 추가"
      footer={<><Button variant="secondary" onClick={onClose}>취소</Button><Button onClick={save} disabled={pending}>추가</Button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>이름</label><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className={labelCls}>권한</label>
            <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div><label className={labelCls}>이메일</label><input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="teacher@edenbooks.kr" /></div>
        <div><label className={labelCls}>초기 비밀번호</label><input className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        {err && <p className="text-[13px] text-rose-500">{err}</p>}
      </div>
    </Modal>
  );
}

function CorrectionDefaults({ philosophy }: any) {
  const router = useRouter();
  const [text, setText] = useState(philosophy);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  function save() {
    start(async () => { await saveEdenPhilosophy(text); setSaved(true); setTimeout(() => setSaved(false), 2000); router.refresh(); });
  }
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="font-bold text-[15px] mb-1">이든 독서교육원 추구 방향성</h3>
        <p className="text-[13px] text-muted mb-3">모든 AI 첨삭에 공통 반영되는 교육 철학입니다. 첨삭은 이 방향성 위에서 개인화됩니다.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9}
          className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-[13.5px] leading-relaxed outline-none focus:border-brand-500 resize-none" />
        <div className="flex items-center gap-2 mt-3">
          {saved && <span className="text-[13px] text-mint-600 inline-flex items-center gap-1"><Check className="size-4" /> 저장됨</span>}
          <Button className="ml-auto" onClick={save} disabled={pending}><Save className="size-4" /> 방향성 저장</Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-[15px] mb-3">첨삭 옵션 구성</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-[13px]">
          <div>
            <div className="font-semibold text-muted mb-1.5">학년별 강도</div>
            <div className="space-y-1">
              {GRADE_INTENSITY.map((g) => (
                <div key={g.grade} className="flex gap-2"><Badge tone="brand">{g.grade}</Badge><span className="text-faint">{g.focus}</span></div>
              ))}
            </div>
          </div>
          <div>
            <div className="font-semibold text-muted mb-1.5">글의 종류 ({GENRES.length})</div>
            <div className="flex flex-wrap gap-1">{GENRES.map((g) => <Badge key={g.key} tone="slate">{g.label}</Badge>)}</div>
            <div className="font-semibold text-muted mb-1.5 mt-3">방향성(톤)</div>
            <div className="flex flex-wrap gap-1">{TONES.map((t) => <Badge key={t.key} tone="slate">{t.emoji} {t.label}</Badge>)}</div>
            <div className="font-semibold text-muted mb-1.5 mt-3">중점 척도</div>
            <div className="flex flex-wrap gap-1">{METRICS.map((m) => <Badge key={m.key} tone="slate">{m.label}</Badge>)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function RubricViewer() {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h3 className="font-bold text-[15px]">관찰 루브릭 (PDF 기반)</h3>
        <p className="text-[13px] text-muted mt-1">5개 영역 · 24개 관찰 항목. 상/중/하 선택 시 아래 문장이 관찰일지에 자동 입력됩니다.</p>
      </Card>
      {RUBRIC.map((a) => (
        <Card key={a.area} className="overflow-hidden">
          <div className="px-5 py-3 border-b border-line font-bold flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ background: a.color }} />{a.area}
            <span className="text-[12px] text-faint font-normal">{a.items.length}항목</span>
          </div>
          <div className="divide-y divide-line/60">
            {a.items.map((it) => (
              <div key={it.key} className="px-5 py-3">
                <div className="font-semibold text-[14px]">{it.item}</div>
                <div className="text-[12px] text-faint mb-2">{it.question}</div>
                <div className="grid sm:grid-cols-3 gap-2">
                  {(["상", "중", "하"] as const).map((lv) => (
                    <div key={lv} className="flex items-start gap-1.5 text-[12.5px]">
                      <LevelChip level={lv} />
                      <span className="text-muted">{it.levels[lv]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
