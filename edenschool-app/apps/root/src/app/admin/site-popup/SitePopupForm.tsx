'use client';

import { useState, useEffect, useCallback } from 'react';

interface Popup {
  id: number;
  is_active: number;
  image_file_id: number | null;
  link_url: string;
  start_date: string | null;
  end_date: string | null;
}

const emptyForm = {
  imageFileId: null as number | null,
  linkUrl: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

export function SitePopupForm() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // 추가/수정 폼 상태 (editingId === null 이면 신규 추가)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/site/popup');
    const data = await res.json();
    setPopups(Array.isArray(data.popups) ? data.popups : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setMsg('');
  };

  const handleEdit = (p: Popup) => {
    setEditingId(p.id);
    setForm({
      imageFileId: p.image_file_id,
      linkUrl: p.link_url || '',
      startDate: p.start_date || '',
      endDate: p.end_date || '',
      isActive: !!p.is_active,
    });
    setMsg('');
    if (typeof window !== 'undefined') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/file/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.fileId) {
      setForm((f) => ({ ...f, imageFileId: data.fileId }));
      setMsg('이미지 업로드 완료');
    } else {
      setMsg('이미지 업로드 실패');
    }
  };

  const handleSave = async () => {
    if (!form.imageFileId) {
      setMsg('이미지를 업로드하세요.');
      return;
    }
    setSaving(true);
    setMsg('');
    const payload = {
      id: editingId ?? undefined,
      is_active: form.isActive,
      image_file_id: form.imageFileId,
      link_url: form.linkUrl,
      start_date: form.startDate || null,
      end_date: form.endDate || null,
    };
    const res = await fetch('/api/admin/site/popup', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      resetForm();
      await load();
    } else {
      setMsg(data.error || '저장에 실패했습니다.');
    }
  };

  // 활성/비활성 토글 (해당 행 전체 필드 + is_active 반전 전송)
  const handleToggle = async (p: Popup) => {
    await fetch('/api/admin/site/popup', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: p.id,
        is_active: p.is_active ? false : true,
        image_file_id: p.image_file_id,
        link_url: p.link_url,
        start_date: p.start_date,
        end_date: p.end_date,
      }),
    });
    await load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 팝업을 삭제하시겠습니까?')) return;
    await fetch(`/api/admin/site/popup?id=${id}`, { method: 'DELETE' });
    if (editingId === id) resetForm();
    await load();
  };

  if (loading) return <div className="admin-content"><p>로딩 중...</p></div>;

  return (
    <div className="admin-content">
      <h2 className="mb-4">팝업 관리</h2>

      {/* 팝업 목록 */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3">팝업 목록 ({popups.length})</h5>
          {popups.length === 0 ? (
            <p className="text-muted mb-0">등록된 팝업이 없습니다. 아래에서 추가하세요.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered align-middle" style={{ fontSize: 14 }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 90 }}>이미지</th>
                    <th>기간</th>
                    <th>링크</th>
                    <th style={{ width: 110 }}>상태</th>
                    <th style={{ width: 140 }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {popups.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.image_file_id ? (
                          <img src={`/api/file/image/${p.image_file_id}`} alt="" style={{ width: 70, height: 'auto', borderRadius: 4 }} />
                        ) : (
                          <span className="text-muted">없음</span>
                        )}
                      </td>
                      <td>
                        {(p.start_date || '∞')} ~ {(p.end_date || '∞')}
                      </td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.link_url || <span className="text-muted">-</span>}
                      </td>
                      <td>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={!!p.is_active}
                            onChange={() => handleToggle(p)}
                          />
                          <label className="form-check-label">{p.is_active ? '활성' : '비활성'}</label>
                        </div>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary me-1 mr-1" onClick={() => handleEdit(p)}>수정</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)}>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 추가 / 수정 폼 */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3">{editingId ? `팝업 수정 (#${editingId})` : '팝업 추가'}</h5>

          <div className="form-group mb-3">
            <label className="form-label d-block">활성 여부</label>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                id="popupActiveSwitch"
              />
              <label className="form-check-label" htmlFor="popupActiveSwitch">
                {form.isActive ? '활성' : '비활성'}
              </label>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">시작일</label>
              <input type="date" className="form-control" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label">종료일</label>
              <input type="date" className="form-control" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>

          <div className="form-group mb-3">
            <label className="form-label">팝업 이미지</label>
            <input type="file" className="form-control" accept="image/*" onChange={handleImageUpload} />
          </div>

          {form.imageFileId && (
            <div className="mb-3">
              <label className="form-label">미리보기</label>
              <div style={{ maxWidth: 400, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <img src={`/api/file/image/${form.imageFileId}`} alt="팝업 이미지" style={{ width: '100%', display: 'block' }} />
              </div>
            </div>
          )}

          <div className="form-group mb-3">
            <label className="form-label">클릭 시 이동 URL</label>
            <input type="text" className="form-control" placeholder="https://..." value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} />
          </div>

          {msg && <div className="alert alert-info">{msg}</div>}

          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : editingId ? '수정 저장' : '추가'}
          </button>
          {editingId && (
            <button className="btn btn-secondary ms-2 ml-2" onClick={resetForm} disabled={saving}>
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
