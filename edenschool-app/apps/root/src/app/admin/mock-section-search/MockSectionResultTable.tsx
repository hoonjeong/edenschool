'use client';

import { useState } from 'react';

interface Row {
  id: number;
  area: string;
  subArea: string;
  grade: string;
  year: number;
  month: number;
  searchKeyword: string;
  fileType?: string;
  fileName?: string;
  contentId?: number;
}

export default function MockSectionResultTable({ list, keyword }: { list: Row[]; keyword: string }) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const selectable = list.filter((i) => i.contentId);
  const allSelected = selectable.length > 0 && selectable.every((i) => selectedIds.has(i.id));

  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(selectable.map((i) => i.id)));
  const toggleOne = (id: number) => setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  async function bulkDownload() {
    if (selectedIds.size === 0) return;
    setDownloading(true);
    try {
      const res = await fetch('/api/admin/mock-section/download-bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) { alert('다운로드에 실패했습니다.'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = '영역별모의고사_일괄다운.zip';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { alert('다운로드 중 오류가 발생했습니다.'); }
    finally { setDownloading(false); }
  }

  return (
    <>
      {selectedIds.size > 0 && (
        <div className="mb-2">
          <button className="btn btn-success btn-sm" onClick={bulkDownload} disabled={downloading}>
            {downloading ? '다운로드 중...' : `선택한 ${selectedIds.size}개 파일 다운로드`}
          </button>
        </div>
      )}
      <div className="table-responsive">
        <table className="table table-bordered table-hover table-sm">
          <thead className="thead-dark">
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={selectable.length === 0} />
              </th>
              <th>검색키워드</th>
              <th style={{ width: 80 }}>영역</th>
              <th style={{ width: 80 }}>세부영역</th>
              <th style={{ width: 55 }}>학년</th>
              <th style={{ width: 60 }}>년도</th>
              <th style={{ width: 60 }}>시행월</th>
              <th>파일명</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-muted py-3">{keyword ? '검색 결과가 없습니다.' : '모의고사가 없습니다.'}</td></tr>
            ) : (
              list.map((item, idx) => (
                <tr key={`${item.id}-${idx}`}>
                  <td>{item.contentId ? <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleOne(item.id)} /> : null}</td>
                  <td>
                    {item.searchKeyword ? (
                      <span title={item.searchKeyword}>
                        {item.searchKeyword.length > 40 ? item.searchKeyword.substring(0, 40) + '...' : item.searchKeyword}
                      </span>
                    ) : <span className="text-muted">-</span>}
                  </td>
                  <td>{item.area || '-'}</td>
                  <td>{item.subArea || '-'}</td>
                  <td>{item.grade || '-'}</td>
                  <td>{item.year || '-'}</td>
                  <td>{item.month ? `${item.month}월` : '-'}</td>
                  <td>
                    {item.contentId ? (
                      <a href={`/api/admin/mock-section/download?id=${item.id}`}>{item.fileName}</a>
                    ) : <span className="text-muted">{item.fileName || '-'}</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
