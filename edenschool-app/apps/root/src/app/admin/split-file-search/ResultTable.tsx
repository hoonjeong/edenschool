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

interface Props {
  list: SplitFileRow[];
  keyword: string;
  /**
   * 관리 모드: 수정/삭제 열을 표시한다. 값은 수정 시 이동할 페이지 경로
   * (예: '/admin/split-file-add'). 관리 메뉴(원장 전용)에서만 넘긴다.
   */
  manageBasePath?: string;
}

export default function ResultTable({ list, keyword, manageBasePath }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();
  const manage = !!manageBasePath;

  // 수정: 상단 추가 폼을 수정 모드(metaId)로 전환하고 맨 위로 스크롤
  function handleEdit(id: number) {
    if (!manageBasePath) return;
    const sep = manageBasePath.includes('?') ? '&' : '?';
    router.push(`${manageBasePath}${sep}metaId=${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(item: SplitFileRow) {
    const label = item.fileName || item.searchKeyword || `ID ${item.id}`;
    if (!confirm(`다음 쪼개기 파일을 삭제하시겠습니까?\n\n${label}\n\n첨부 파일도 함께 삭제되며 되돌릴 수 없습니다.`)) return;
    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/admin/split-file?id=${item.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        alert(`삭제 실패: ${data.error || res.statusText}`);
        return;
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      router.refresh();
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  }

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
              {manage && <th style={{ width: '110px' }}>관리</th>}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={manage ? 9 : 8} className="text-center text-muted py-3">
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
                  {manage && (
                    <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm mr-1"
                        onClick={() => handleEdit(item.id)}
                        disabled={deletingId === item.id}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? '삭제 중' : '삭제'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
