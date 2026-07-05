'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface Props {
  grades: string[];
  years: string[];
  months: string[];
}

export default function MockFullFilters({ grades, years, months }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sel = (key: string) => searchParams.get(key)?.split(',').filter(Boolean) || [];

  const updateUrl = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length > 0) params.set(key, values.join(','));
      else params.delete(key);
      params.delete('page');
      router.replace(`/admin/mock-full-search?${params.toString()}`);
    },
    [router, searchParams]
  );

  const toggle = (key: string, value: string) => {
    const cur = sel(key);
    updateUrl(key, cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]);
  };

  const Group = ({ label, name, options, fmt }: { label: string; name: string; options: string[]; fmt?: (v: string) => string }) => {
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
    <div className="card mb-3">
      <div className="card-body py-2">
        <Group label="학년" name="grade" options={grades} />
        <Group label="년도" name="year" options={years} fmt={(v) => `${v}년`} />
        <Group label="시행월" name="month" options={months} fmt={(v) => `${v}월`} />
      </div>
    </div>
  );
}
