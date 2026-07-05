'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface Props {
  areas: string[];
  subAreas: string[];
  grades: string[];
  years: string[];
  months: string[];
}

export default function MockSectionFilters({ areas, subAreas, grades, years, months }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sel = (key: string) => searchParams.get(key)?.split(',').filter(Boolean) || [];
  const keyword = searchParams.get('keyword') || '';

  const updateUrl = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length > 0) params.set(key, values.join(','));
      else params.delete(key);
      params.delete('page');
      router.replace(`/admin/mock-section-search?${params.toString()}`);
    },
    [router, searchParams]
  );

  const setKeyword = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('keyword', value); else params.delete('keyword');
    params.delete('page');
    router.replace(`/admin/mock-section-search?${params.toString()}`);
  };

  const toggle = (key: string, value: string) => {
    const cur = sel(key);
    updateUrl(key, cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]);
  };

  const Group = ({ label, name, options, fmt }: { label: string; name: string; options: string[]; fmt?: (v: string) => string }) => {
    if (options.length === 0) return null;
    const cur = sel(name);
    return (
      <div className="mb-2">
        <span className="mr-2 font-weight-bold">{label}:</span>
        <label className="d-inline-flex align-items-center mr-3" style={{ cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" className="mr-1" checked={cur.length === 0} onChange={() => updateUrl(name, [])} />
          전체
        </label>
        {options.map((o) => (
          <label key={o} className="d-inline-flex align-items-center mr-3" style={{ cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" className="mr-1" checked={cur.includes(o)} onChange={() => toggle(name, o)} />
            {fmt ? fmt(o) : o}
          </label>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="row mb-3">
        <div className="col-md-8">
          <div className="input-group">
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder="작품, 주제, 문법영역 등을 검색해보세요."
              defaultValue={keyword}
              onKeyDown={(e) => { if (e.key === 'Enter') setKeyword((e.target as HTMLInputElement).value); }}
            />
            <div className="input-group-append">
              <button className="btn btn-primary" type="button"
                onClick={(e) => {
                  const input = (e.target as HTMLElement).closest('.input-group')?.querySelector('input') as HTMLInputElement;
                  setKeyword(input?.value || '');
                }}>
                <i className="fas fa-search"></i> 검색
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body py-2">
          <Group label="영역" name="area" options={areas} />
          <Group label="세부영역" name="subArea" options={subAreas} />
          <Group label="학년" name="grade" options={grades} />
          <Group label="년도" name="year" options={years} fmt={(v) => `${v}년`} />
          <Group label="시행월" name="month" options={months} fmt={(v) => `${v}월`} />
        </div>
      </div>
    </div>
  );
}
