'use client';

import { useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import FileDropZone from '@/components/FileDropZone';

const GRADES = ['고1', '고2', '고3'];
const MONTHS = [3, 4, 6, 7, 9, 10, 11];

/** 풀세트 파일/폴더명에서 학년/년도/월 추정 (가능한 경우만) */
function guessFromName(name: string) {
  const res: { grade?: string; year?: string; month?: string } = {};
  const g = name.match(/고\s*([123])/);
  if (g) res.grade = `고${g[1]}`;
  const y = name.match(/(20\d{2}|\b\d{2})\s*년/);
  if (y) {
    let yr = parseInt(y[1]);
    if (yr < 100) yr += 2000;
    res.year = String(yr);
  }
  const m = name.match(/(\d{1,2})\s*월/);
  if (m) res.month = m[1];
  return res;
}

function MockFullAddContent() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2005 + 1 }, (_, i) => currentYear - i);

  const [form, setForm] = useState({ grade: '고1', year: String(currentYear), month: '3' });

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    const g = guessFromName(f.name);
    setForm((prev) => ({
      ...prev,
      ...(g.grade && { grade: g.grade }),
      ...(g.year && { year: g.year }),
      ...(g.month && { month: g.month }),
    }));
  }, []);

  const change = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!file) { alert('파일을 선택해주세요.'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('grade', form.grade);
      fd.append('year', form.year);
      fd.append('month', form.month);
      fd.append('fileType', file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'HWP');
      fd.append('formFile', file);
      const res = await fetch('/api/admin/mock-full', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) { alert(`저장 실패: ${data.error}`); }
      else {
        alert('저장되었습니다.');
        setFile(null);
      }
    } catch { alert('저장 중 오류가 발생했습니다.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h4 className="mb-3">풀세트 모의고사 추가</h4>

      <FileDropZone file={file} onSelect={handleFileSelect} onRemove={() => setFile(null)} />

      <div className="card mb-3">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 form-group">
              <label className="font-weight-bold">학년</label>
              <select className="form-control" name="grade" value={form.grade} onChange={change}>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="col-md-4 form-group">
              <label className="font-weight-bold">년도</label>
              <select className="form-control" name="year" value={form.year} onChange={change}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="col-md-4 form-group">
              <label className="font-weight-bold">시행월</label>
              <select className="form-control" name="month" value={form.month} onChange={change}>
                {MONTHS.map((m) => <option key={m} value={m}>{m}월</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <button type="button" className="btn btn-primary btn-lg mr-2" onClick={handleSubmit} disabled={loading}>
          {loading ? '저장 중...' : '추가'}
        </button>
        <button type="button" className="btn btn-secondary btn-lg" onClick={() => router.push('/admin/mock-full-search')}>
          목록으로
        </button>
      </div>
    </div>
  );
}

export function MockFullAddForm() {
  return <Suspense fallback={<div>로딩중...</div>}><MockFullAddContent /></Suspense>;
}
