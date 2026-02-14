'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface Props {
  grades: string[];
}

export default function SearchFilters({ grades }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedGrades = searchParams.get('grade')?.split(',').filter(Boolean) || [];
  const search = searchParams.get('keyword') || '';

  const updateUrl = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length > 0) {
        params.set(key, values.join(','));
      } else {
        params.delete(key);
      }
      params.delete('page');
      const qs = params.toString();
      router.replace(`/admin/split-file-search?${qs}`);
    },
    [router, searchParams]
  );

  const toggleCheckbox = (key: string, value: string, current: string[]) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateUrl(key, next);
  };

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    const qs = params.toString();
    router.replace(`/admin/split-file-search?${qs}`);
  };

  return (
    <div>
      {/* 검색창 */}
      <div className="row mb-3">
        <div className="col-md-8">
          <div className="input-group">
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder="작품이나 문법영역, 독서 주제를 검색해보세요."
              defaultValue={search}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setParam('keyword', (e.target as HTMLInputElement).value);
                }
              }}
            />
            <div className="input-group-append">
              <button
                className="btn btn-primary"
                type="button"
                onClick={(e) => {
                  const input = (e.target as HTMLElement)
                    .closest('.input-group')
                    ?.querySelector('input') as HTMLInputElement;
                  setParam('keyword', input?.value || '');
                }}
              >
                <i className="fas fa-search"></i> 검색
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 학년 체크박스 */}
      <div className="mb-3">
        <span className="mr-2 font-weight-bold">학년:</span>
        <label
          className="d-inline-flex align-items-center mr-3"
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <input
            type="checkbox"
            className="mr-1"
            checked={selectedGrades.length === 0}
            onChange={() => updateUrl('grade', [])}
          />
          전체
        </label>
        {grades.map((g) => {
          const checked = selectedGrades.includes(g);
          return (
            <label
              key={g}
              className="d-inline-flex align-items-center mr-3"
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <input
                type="checkbox"
                className="mr-1"
                checked={checked}
                onChange={() => toggleCheckbox('grade', g, selectedGrades)}
              />
              {g}
            </label>
          );
        })}
      </div>
    </div>
  );
}
