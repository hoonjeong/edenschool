'use client';

import { useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import FileDropZone from '@/components/FileDropZone';

const AREAS = ['화법', '작문', '화법작문통합', '문법', '문학', '독서', '매체'];
const MONTHS = [3, 4, 6, 7, 9, 10, 11];
const GRADES = ['고1', '고2', '고3'];

/** 영역별 파일명 파싱: {키워드}[YYYY년M월(고N)/고N형]검토자 */
function parseSectionName(name: string) {
  const base = name.replace(/\.\w+$/, '');
  const res: { keyword?: string; year?: string; month?: string; grade?: string } = {};
  const bIdx = base.indexOf('[');
  if (bIdx > 0) res.keyword = base.substring(0, bIdx).trim();

  const bracket = base.match(/\[([^\]]*)\]/);
  if (bracket) {
    const inner = bracket[1];
    const y = inner.match(/(\d{4})\s*년/);
    if (y) res.year = y[1];
    const m = inner.match(/(\d{1,2})\s*월/);
    if (m) res.month = m[1];
    const g = inner.match(/고\s*([123])/);
    if (g) res.grade = `고${g[1]}`;
  }
  return res;
}

function MockSectionAddContent() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2005 + 1 }, (_, i) => currentYear - i);

  const [form, setForm] = useState({
    area: '문학', subArea: '', grade: '고3', year: String(currentYear), month: '3', searchKeyword: '',
  });

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    const p = parseSectionName(f.name);
    setForm((prev) => ({
      ...prev,
      ...(p.keyword !== undefined && { searchKeyword: p.keyword }),
      ...(p.year && { year: p.year }),
      ...(p.month && { month: p.month }),
      ...(p.grade && { grade: p.grade }),
    }));
  }, []);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!file) { alert('파일을 선택해주세요.'); return; }
    if (!form.area) { alert('영역을 선택하세요.'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('area', form.area);
      fd.append('sub_area', form.subArea);
      fd.append('grade', form.grade);
      fd.append('year', form.year);
      fd.append('month', form.month);
      fd.append('search_keyword', form.searchKeyword);
      fd.append('fileType', file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'HWP');
      fd.append('formFile', file);
      const res = await fetch('/api/admin/mock-section', { method: 'POST', body: fd });
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
      <h4 className="mb-3">영역별 모의고사 추가</h4>

      <FileDropZone file={file} onSelect={handleFileSelect} onRemove={() => setFile(null)} />

      <div className="card mb-3">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 form-group">
              <label className="font-weight-bold">영역(대)</label>
              <select className="form-control" name="area" value={form.area} onChange={change}>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="col-md-6 form-group">
              <label className="font-weight-bold">세부영역</label>
              <input type="text" className="form-control" name="subArea" value={form.subArea} onChange={change}
                placeholder="예: 현대시, 고전소설 (문학인 경우)" list="subarea-list" />
              <datalist id="subarea-list">
                <option value="현대시" /><option value="고전시가" /><option value="현대소설" />
                <option value="고전소설" /><option value="극 문학(희곡, 수필)" />
              </datalist>
            </div>
          </div>
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
          <div className="form-group mb-0">
            <label className="font-weight-bold">검색키워드 (작품/주제)</label>
            <input type="text" className="form-control" name="searchKeyword" value={form.searchKeyword} onChange={change}
              placeholder="예: 문학 현대시(간(윤동주),...)" />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <button type="button" className="btn btn-primary btn-lg mr-2" onClick={handleSubmit} disabled={loading}>
          {loading ? '저장 중...' : '추가'}
        </button>
        <button type="button" className="btn btn-secondary btn-lg" onClick={() => router.push('/admin/mock-section-search')}>
          목록으로
        </button>
      </div>
    </div>
  );
}

export function MockSectionAddForm() {
  return <Suspense fallback={<div>로딩중...</div>}><MockSectionAddContent /></Suspense>;
}
