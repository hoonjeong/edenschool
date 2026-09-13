'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PrevTestRow } from '@/lib/prev-test-search';

interface Props {
  testList: PrevTestRow[];
  /**
   * 관리 모드: 수정/삭제 열을 표시한다. 값은 수정 시 이동할 페이지 경로
   * (예: '/admin/prev-test-add?region=부천'). 관리 메뉴(원장 전용)에서만 넘긴다.
   */
  manageBasePath?: string;
}

export default function ResultTable({ testList, manageBasePath }: Props) {
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

  async function handleDelete(t: PrevTestRow) {
    const label = `${t.school_name} ${t.year}년 ${t.term}학기 ${t.test_type === 1 ? '중간' : '기말'}${t.file_name ? ` (${t.file_name})` : ''}`;
    if (!confirm(`다음 기출을 삭제하시겠습니까?\n\n${label}\n\n첨부 파일도 함께 삭제되며 되돌릴 수 없습니다.`)) return;
    setDeletingId(t.id);
    try {
      const res = await fetch(`/api/admin/prev-test?id=${t.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        alert(`삭제 실패: ${data.error || res.statusText}`);
        return;
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(t.id);
        return next;
      });
      router.refresh();
    } catch {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  }

  const selectableItems = testList.filter((t) => t.file_id);
  const allSelected = selectableItems.length > 0 && selectableItems.every((t) => selectedIds.has(t.id));

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableItems.map((t) => t.id)));
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
      const res = await fetch('/api/admin/prev-test/download-bulk', {
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
      a.download = '기출문제_일괄다운.zip';
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
              <th>파일명</th>
              <th>학교</th>
              <th style={{ width: '60px' }}>학기</th>
              <th style={{ width: '100px' }}>시험유형</th>
              <th style={{ width: '80px' }}>과목</th>
              <th style={{ width: '100px' }}>출판사</th>
              <th style={{ width: '60px' }}>연도</th>
              {manage && <th style={{ width: '110px' }}>관리</th>}
            </tr>
          </thead>
          <tbody>
            {testList.length === 0 ? (
              <tr>
                <td colSpan={manage ? 9 : 8} className="text-center text-muted py-3">
                  기출문제가 없습니다.
                </td>
              </tr>
            ) : (
              testList.map((t, idx) => (
                <tr key={`${t.id}-${idx}`}>
                  <td>
                    {t.file_id ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleOne(t.id)}
                      />
                    ) : null}
                  </td>
                  <td>
                    {t.file_id ? (
                      <a href={`/api/admin/prev-test/download?id=${t.id}`}>
                        {t.file_name}
                      </a>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>{t.school_name}</td>
                  <td>{t.term}학기</td>
                  <td>{t.test_type === 1 ? '중간고사' : '기말고사'}</td>
                  <td>{t.section || '-'}</td>
                  <td>{t.publisher || '-'}</td>
                  <td>{t.year}</td>
                  {manage && (
                    <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm mr-1"
                        onClick={() => handleEdit(t.id)}
                        disabled={deletingId === t.id}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDelete(t)}
                        disabled={deletingId === t.id}
                      >
                        {deletingId === t.id ? '삭제 중' : '삭제'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-muted">총 {testList.length}건</p>
    </>
  );
}
