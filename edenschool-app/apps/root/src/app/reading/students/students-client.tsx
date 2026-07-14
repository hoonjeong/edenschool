"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, UserPlus, Pencil, ChevronRight, Users,
  FileSpreadsheet, Upload, Download, Loader2, Check, AlertTriangle,
} from "lucide-react";
import { Card, PageIntro, Badge, Button, EmptyState } from "@/components/reading/ui";
import Modal, { inputCls, labelCls } from "@/components/reading/Modal";
import { STUDENT_STATUS } from "@/lib/reading/labels";
import { fmtDate } from "@/lib/reading/utils";
import { createStudent, updateStudent, removeStudent, type StudentInput } from "./actions";

interface Row {
  id: number;
  name: string;
  grade: string;
  phone: string;
  status: string;
  className: string | null;
  classId: number | null;
  classColor: string | null;
  attendanceRate: number | null;
  lastCounselAt: string | null;
  memo: string | null;
}
interface Cls {
  id: number;
  name: string;
  color: string;
}

const GRADES = ["초1", "초2", "초3", "초4", "초5", "초6"];

export default function StudentsClient({
  students,
  classes,
}: {
  students: Row[];
  classes: Cls[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [classId, setClassId] = useState("ALL");
  const [modal, setModal] = useState<null | { mode: "create" | "edit"; row?: Row }>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (status !== "ALL" && s.status !== status) return false;
      if (classId !== "ALL" && String(s.classId) !== classId) return false;
      if (q) {
        const t = q.toLowerCase();
        if (!s.name.toLowerCase().includes(t) && !s.phone.includes(q)) return false;
      }
      return true;
    });
  }, [students, q, status, classId]);

  const counts = {
    all: students.length,
    enrolled: students.filter((s) => s.status === "ENROLLED").length,
  };

  return (
    <div>
      <PageIntro
        title="학생 관리"
        desc={`재원 ${counts.enrolled}명 · 전체 ${counts.all}명 · 삭제는 '퇴원' 전환으로 이력을 보존합니다.`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet className="size-4" /> 엑셀 일괄 등록
            </Button>
            <Button onClick={() => setModal({ mode: "create" })}>
              <UserPlus className="size-4" /> 학생 추가
            </Button>
          </div>
        }
      />

      {/* 필터 바 */}
      <Card className="p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름 또는 연락처 검색"
            className="w-full h-10 rounded-lg border border-line bg-canvas pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm outline-none"
        >
          <option value="ALL">전체 상태</option>
          <option value="ENROLLED">재원</option>
          <option value="PAUSED">휴원</option>
          <option value="WITHDRAWN">퇴원</option>
        </select>
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="h-10 rounded-lg border border-line bg-canvas px-3 text-sm outline-none"
        >
          <option value="ALL">전체 반</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="null">미배정</option>
        </select>
      </Card>

      {/* 테이블 */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<Users className="size-6" />} title="조건에 맞는 학생이 없습니다" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[12px] font-semibold text-faint">
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">학년</th>
                  <th className="px-4 py-3">반</th>
                  <th className="px-4 py-3">연락처</th>
                  <th className="px-4 py-3">출석률</th>
                  <th className="px-4 py-3">최근 상담</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const st = STUDENT_STATUS[s.status];
                  return (
                    <tr
                      key={s.id}
                      onClick={() => router.push(`/reading/students/${s.id}`)}
                      className="border-b border-line/70 last:border-0 hover:bg-canvas/60 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold">{s.name}</td>
                      <td className="px-4 py-3 text-muted">{s.grade}</td>
                      <td className="px-4 py-3">
                        {s.className ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="size-2 rounded-full"
                              style={{ background: s.classColor ?? "#cbd5e1" }}
                            />
                            {s.className}
                          </span>
                        ) : (
                          <span className="text-faint">미배정</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted tabular-nums">{s.phone}</td>
                      <td className="px-4 py-3">
                        {s.attendanceRate == null ? (
                          <span className="text-faint">-</span>
                        ) : (
                          <span
                            className={`font-semibold tabular-nums ${
                              s.attendanceRate >= 90
                                ? "text-mint-600"
                                : s.attendanceRate >= 75
                                  ? "text-amber-600"
                                  : "text-rose-600"
                            }`}
                          >
                            {s.attendanceRate}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {s.lastCounselAt ? fmtDate(s.lastCounselAt) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModal({ mode: "edit", row: s });
                            }}
                            className="grid size-8 place-items-center rounded-lg text-faint hover:bg-canvas hover:text-ink"
                            title="편집"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <ChevronRight className="size-4 text-faint" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal && (
        <StudentModal
          mode={modal.mode}
          row={modal.row}
          classes={classes}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            router.refresh();
          }}
        />
      )}

      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onImported={() => router.refresh()}
        />
      )}
    </div>
  );
}

interface ImportReport {
  classesCreated: string[];
  classesReused: string[];
  studentsCreated: number;
  studentsSkipped: { row: number; name: string; reason: string }[];
  classRowCount: number;
  studentRowCount: number;
}

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<ImportReport | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function runImport() {
    if (!file) return setError("엑셀 파일을 첨부하세요.");
    setError("");
    setLoading(true);
    setReport(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/reading/api/students/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "임포트에 실패했습니다.");
        return;
      }
      setReport(data as ImportReport);
      onImported();
    } catch {
      setError("업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="학생 · 반 엑셀 일괄 등록"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {report ? "닫기" : "취소"}
          </Button>
          {!report && (
            <Button onClick={runImport} disabled={loading || !file}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              업로드 · 임포트
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* 1. 양식 다운로드 */}
        <div className="rounded-xl border border-line p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="grid size-6 place-items-center rounded-full bg-brand-600 text-white text-[12px] font-bold">1</span>
            <span className="font-semibold text-sm">샘플 양식 다운로드</span>
          </div>
          <p className="text-[13px] text-muted ml-8 mb-2">
            ‘반’ 시트에 반 정보를, ‘학생’ 시트에 학생 정보를 입력하세요. 예시(예)) 행은 자동 제외됩니다.
          </p>
          <a
            href="/reading/api/students/template"
            className="ml-8 inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[13px] font-semibold text-brand-700 hover:bg-brand-50"
          >
            <Download className="size-4" /> 샘플 엑셀 다운로드 (.xlsx)
          </a>
        </div>

        {/* 2. 파일 첨부 */}
        <div className="rounded-xl border border-line p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="grid size-6 place-items-center rounded-full bg-brand-600 text-white text-[12px] font-bold">2</span>
            <span className="font-semibold text-sm">작성한 파일 첨부</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setReport(null);
              setError("");
            }}
          />
          <div className="ml-8 flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={loading}>
              <FileSpreadsheet className="size-4" /> 파일 선택
            </Button>
            <span className="text-[13px] text-muted truncate">
              {file ? file.name : "선택된 파일이 없습니다."}
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 text-rose-600 text-[13px] px-3 py-2.5 flex items-start gap-2">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {/* 3. 결과 */}
        {report && (
          <div className="rounded-xl border border-line p-4 space-y-3">
            <div className="flex items-center gap-2 text-mint-600 font-semibold text-sm">
              <Check className="size-4" /> 임포트 완료
            </div>
            <div className="grid grid-cols-2 gap-2 text-[13px]">
              <div className="rounded-lg bg-canvas px-3 py-2">
                학생 등록 <b className="text-brand-700">{report.studentsCreated}</b>명
                {report.studentsSkipped.length > 0 && (
                  <span className="text-rose-500"> · 건너뜀 {report.studentsSkipped.length}</span>
                )}
              </div>
              <div className="rounded-lg bg-canvas px-3 py-2">
                반 신규 <b className="text-brand-700">{report.classesCreated.length}</b>개
                {report.classesReused.length > 0 && (
                  <span className="text-faint"> · 기존 {report.classesReused.length}</span>
                )}
              </div>
            </div>
            {report.classesCreated.length > 0 && (
              <div className="text-[12.5px] text-muted">
                신규 반: {report.classesCreated.join(", ")}
              </div>
            )}
            {report.studentsSkipped.length > 0 && (
              <div>
                <div className="text-[13px] font-semibold text-rose-600 mb-1">건너뛴 행 ({report.studentsSkipped.length})</div>
                <div className="max-h-40 overflow-y-auto rounded-lg bg-rose-50/60 divide-y divide-rose-100">
                  {report.studentsSkipped.map((s, i) => (
                    <div key={i} className="px-3 py-1.5 text-[12.5px] text-rose-700">
                      <b>{s.row}행 · {s.name}</b> — {s.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function StudentModal({
  mode,
  row,
  classes,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  row?: Row;
  classes: Cls[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<StudentInput>({
    name: row?.name ?? "",
    grade: row?.grade ?? "초3",
    phone: row?.phone ?? "",
    status: (row?.status as StudentInput["status"]) ?? "ENROLLED",
    classId: row?.classId ?? null,
    memo: row?.memo ?? "",
  });
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");

  function save() {
    if (!form.name.trim()) return setErr("이름을 입력하세요.");
    if (form.phone.replace(/\D/g, "").length < 4) return setErr("연락처를 정확히 입력하세요.");
    setErr("");
    start(async () => {
      if (mode === "create") await createStudent(form);
      else if (row) await updateStudent(row.id, form);
      onSaved();
    });
  }

  function del() {
    if (!row) return;
    if (!confirm(`${row.name} 학생을 '퇴원' 처리할까요? (이력은 보존됩니다)`)) return;
    start(async () => {
      await removeStudent(row.id, false);
      onSaved();
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === "create" ? "학생 추가" : "학생 정보 수정"}
      footer={
        <>
          {mode === "edit" && (
            <Button variant="ghost" onClick={del} disabled={pending} className="mr-auto text-rose-500">
              퇴원 처리
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            취소
          </Button>
          <Button onClick={save} disabled={pending}>
            저장
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>이름</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="홍길동"
            />
          </div>
          <div>
            <label className={labelCls}>학년</label>
            <select
              className={inputCls}
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
            >
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>연락처 (핸드폰)</label>
          <input
            className={inputCls}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="010-1234-5678"
          />
          <p className="text-[12px] text-faint mt-1">뒷자리 4자리가 등원 체크인에 사용됩니다.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>반</label>
            <select
              className={inputCls}
              value={form.classId ?? ""}
              onChange={(e) =>
                setForm({ ...form, classId: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="">미배정</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>상태</label>
            <select
              className={inputCls}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as StudentInput["status"] })}
            >
              <option value="ENROLLED">재원</option>
              <option value="PAUSED">휴원</option>
              <option value="WITHDRAWN">퇴원</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>메모</label>
          <textarea
            className={inputCls + " h-20 py-2 resize-none"}
            value={form.memo ?? ""}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            placeholder="특이사항, 학부모 요청 등"
          />
        </div>
        {err && <p className="text-[13px] text-rose-500">{err}</p>}
      </div>
    </Modal>
  );
}
