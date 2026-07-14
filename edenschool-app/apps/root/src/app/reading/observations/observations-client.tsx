"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Plus, Search, ChevronRight } from "lucide-react";
import { Card, PageIntro, Badge, Button, EmptyState, LevelChip } from "@/components/reading/ui";
import Modal from "@/components/reading/Modal";
import { fmtDate } from "@/lib/reading/utils";

interface Obs {
  id: number;
  studentId: number;
  studentName: string;
  grade: string;
  round: number;
  date: string;
  itemCount: number;
  items: any;
  memo: string | null;
}
interface Stu { id: number; name: string; grade: string; className: string | null; }

export default function ObservationsClient({ observations, students }: { observations: Obs[]; students: Stu[]; }) {
  const router = useRouter();
  const [pick, setPick] = useState(false);
  const [q, setQ] = useState("");

  const filteredStudents = students.filter((s) => !q || s.name.includes(q));

  return (
    <div>
      <PageIntro
        title="관찰일지"
        desc="PDF 루브릭 기반 · 상/중/하를 탭하면 관찰 문장이 자동으로 채워집니다."
        action={<Button onClick={() => setPick(true)}><Plus className="size-4" /> 새 관찰일지</Button>}
      />

      {observations.length === 0 ? (
        <Card><EmptyState icon={<ClipboardList className="size-6" />} title="작성된 관찰일지가 없습니다" desc="학생을 선택해 첫 관찰일지를 작성해 보세요." action={<Button onClick={() => setPick(true)}><Plus className="size-4" /> 새 관찰일지</Button>} /></Card>
      ) : (
        <div className="space-y-3">
          {observations.map((o) => (
            <Card key={o.id} className="p-4">
              <div className="flex items-center gap-3 mb-2.5">
                <Link href={`/reading/students/${o.studentId}`} className="font-bold hover:text-brand-700">
                  {o.studentName}
                </Link>
                <span className="text-[12px] text-faint">{o.grade}</span>
                <Badge tone="brand">{o.round}회차</Badge>
                <span className="text-[13px] text-muted">{fmtDate(o.date)}</span>
                <span className="text-[12px] text-faint">관찰 {o.itemCount}항목</span>
                <Link href={`/reading/students/${o.studentId}`} className="ml-auto text-faint hover:text-ink">
                  <ChevronRight className="size-4" />
                </Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(o.items as any[]).slice(0, 10).map((it: any, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-md bg-canvas px-2 py-1 text-[12px]">
                    <LevelChip level={it.level} />{it.item}
                  </span>
                ))}
                {o.itemCount > 10 && <span className="text-[12px] text-faint self-center">+{o.itemCount - 10}</span>}
              </div>
              {o.memo && <p className="mt-2 text-[13px] text-muted">{o.memo}</p>}
            </Card>
          ))}
        </div>
      )}

      <Modal open={pick} onClose={() => setPick(false)} title="관찰일지 작성 · 학생 선택">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-faint" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="학생 이름 검색"
            className="w-full h-10 rounded-lg border border-line bg-canvas pl-9 pr-3 text-sm outline-none focus:border-brand-500" />
        </div>
        <div className="max-h-80 overflow-y-auto -mx-1 px-1 space-y-1">
          {filteredStudents.map((s) => (
            <button key={s.id} onClick={() => router.push(`/reading/observations/new?studentId=${s.id}`)}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-left hover:bg-brand-50">
              <span className="font-semibold">{s.name}</span>
              <span className="text-[12px] text-faint">{s.grade}</span>
              {s.className && <span className="text-[12px] text-faint">· {s.className}</span>}
              <ChevronRight className="size-4 text-faint ml-auto" />
            </button>
          ))}
          {filteredStudents.length === 0 && <p className="text-center text-sm text-faint py-6">검색 결과가 없습니다.</p>}
        </div>
      </Modal>
    </div>
  );
}
