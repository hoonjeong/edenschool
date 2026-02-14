'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SplitFileRow {
  id: number;
  grade?: string;
  subject?: string;
  publisher?: string;
  searchKeyword?: string;
  schoolName?: string;
  year?: number;
  term?: number;
  testType?: number;
  fileType?: string;
  fileName?: string;
  contentId?: number;
}

export default function ResultTable({
  list,
  keyword,
}: {
  list: SplitFileRow[];
  keyword: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const router = useRouter();

  const selectableItems = list.filter((item) => item.contentId);
  const allSelected =
    selectableItems.length > 0 && selectableItems.every((item) => selectedIds.has(item.id));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableItems.map((item) => item.id)));
    }
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleBulkDownload() {
    if (selectedIds.size === 0) return;
    setDownloading(true);
    try {
      const res = await fetch('/api/admin/split-file/download-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        alert('다운로드에 실패했습니다.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '쪼개기파일_일괄다운.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('다운로드 중 오류가 발생했습니다.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      {selectedIds.size > 0 && (
        <div className="mb-2">
          <button
            className="btn btn-success btn-sm"
            onClick={handleBulkDownload}
            disabled={downloading}
          >
            {downloading
              ? '다운로드 중...'
              : `선택한 ${selectedIds.size}개 파일 다운로드`}
          </button>
          <button
            className="btn btn-info btn-sm ml-2"
            onClick={() => {
              const idStr = Array.from(selectedIds).join(',');
              router.push(`/admin/variant-question?ids=${idStr}&source=split-file`);
            }}
          >
            변형문제 생성
          </button>
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-bordered table-hover table-sm">
          <thead className="thead-dark">
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={selectableItems.length === 0}
                />
              </th>
              <th>검색키워드</th>
              <th>파일명</th>
              <th style={{ width: '80px' }}>학교</th>
              <th style={{ width: '50px' }}>연도</th>
              <th style={{ width: '50px' }}>학기</th>
              <th style={{ width: '80px' }}>시험유형</th>
              <th style={{ width: '50px' }}>학년</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted py-3">
                  {keyword ? '검색 결과가 없습니다.' : '쪼개기 파일이 없습니다.'}
                </td>
              </tr>
            ) : (
              list.map((item, idx) => (
                <tr key={`${item.id}-${idx}`}>
                  <td>
                    {item.contentId ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleOne(item.id)}
                      />
                    ) : null}
                  </td>
                  <td>
                    {item.searchKeyword ? (
                      <span title={item.searchKeyword}>
                        {item.searchKeyword.length > 40
                          ? item.searchKeyword.substring(0, 40) + '...'
                          : item.searchKeyword}
                      </span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    {item.contentId ? (
                      <a href={`/api/admin/split-file/download?id=${item.id}`}>
                        {item.fileName}
                      </a>
                    ) : (
                      <span className="text-muted">{item.fileName || '-'}</span>
                    )}
                  </td>
                  <td>{item.schoolName || '-'}</td>
                  <td>{item.year || '-'}</td>
                  <td>{item.term ? `${item.term}학기` : '-'}</td>
                  <td>
                    {item.testType === 1
                      ? '중간고사'
                      : item.testType === 2
                        ? '기말고사'
                        : '-'}
                  </td>
                  <td>{item.grade || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
