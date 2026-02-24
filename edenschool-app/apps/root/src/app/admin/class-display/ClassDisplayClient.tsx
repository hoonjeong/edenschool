'use client';

import { useState, useEffect } from 'react';

interface ClassInfo {
  id: number;
  name: string;
  day: string;
  hour: string;
  minute: string;
}

interface ClassDisplayItem {
  id: number;
  class_id: number;
  teacher_image_file_id: number | null;
  description: string;
  progress_info: string;
  clinic_info: string;
  introduction: string;
  sort_order: number;
  is_active: number;
  class_name?: string;
  class_day?: string;
  class_hour?: string;
  class_minute?: string;
}

const emptyItem = (): Omit<ClassDisplayItem, 'id' | 'class_name' | 'class_day' | 'class_hour' | 'class_minute'> => ({
  class_id: 0,
  teacher_image_file_id: null,
  description: '',
  progress_info: '',
  clinic_info: '',
  introduction: '',
  sort_order: 0,
  is_active: 1,
});

export default function ClassDisplayClient() {
  const [items, setItems] = useState<ClassDisplayItem[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [editItem, setEditItem] = useState<(Partial<ClassDisplayItem> & ReturnType<typeof emptyItem>) | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchData = async () => {
    const [displayRes, classRes] = await Promise.all([
      fetch('/api/admin/site/class-display'),
      fetch('/api/admin/class'),
    ]);
    const displayData = await displayRes.json();
    setItems(displayData.list || []);
    // Try to parse class list from different endpoints
    try {
      const classData = await classRes.json();
      setClasses(classData.list || classData || []);
    } catch {
      setClasses([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editItem) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/file/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.fileId) {
      setEditItem({ ...editItem, teacher_image_file_id: data.fileId });
    }
  };

  const handleSave = async () => {
    if (!editItem) return;
    if (!editItem.class_id) {
      setMsg('수강반을 선택해주세요.');
      return;
    }
    setMsg('');
    const isNew = !editItem.id;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch('/api/admin/site/class-display', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editItem),
    });
    const data = await res.json();
    if (data.success) {
      setEditItem(null);
      setMsg('저장되었습니다.');
      fetchData();
    } else {
      setMsg('저장에 실패했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/admin/site/class-display?id=${id}`, { method: 'DELETE' });
    setMsg('삭제되었습니다.');
    fetchData();
  };

  if (loading) return <div className="admin-content"><p>로딩 중...</p></div>;

  return (
    <div className="admin-content">
      <h2 className="mb-4">수강반 표시 관리</h2>

      {msg && <div className="alert alert-info">{msg}</div>}

      {!editItem && (
        <button className="btn btn-primary mb-3" onClick={() => setEditItem(emptyItem())}>
          <i className="fas fa-plus"></i> 새 수강반 표시 추가
        </button>
      )}

      {/* 편집 폼 */}
      {editItem && (
        <div className="card mb-4">
          <div className="card-header">{editItem.id ? '수강반 표시 수정' : '새 수강반 표시 추가'}</div>
          <div className="card-body">
            <div className="form-group mb-3">
              <label className="form-label">수강반 선택</label>
              <select
                className="form-control"
                value={editItem.class_id}
                onChange={(e) => setEditItem({ ...editItem, class_id: Number(e.target.value) })}
              >
                <option value={0}>-- 선택 --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.day} {c.hour}:{c.minute === '0' ? '00' : c.minute})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mb-3">
              <label className="form-label">선생님 이미지</label>
              <input type="file" className="form-control" accept="image/*" onChange={handleImageUpload} />
              {editItem.teacher_image_file_id && (
                <div className="mt-2">
                  <img
                    src={`/api/file/image/${editItem.teacher_image_file_id}`}
                    alt="선생님"
                    style={{ maxWidth: 150, borderRadius: 8 }}
                  />
                </div>
              )}
            </div>

            <div className="form-group mb-3">
              <label className="form-label">수강반 정보</label>
              <textarea
                className="form-control"
                rows={3}
                value={editItem.description}
                onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                placeholder="수강반에 대한 설명을 입력하세요"
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">수업 진도 현황</label>
              <textarea
                className="form-control"
                rows={3}
                value={editItem.progress_info}
                onChange={(e) => setEditItem({ ...editItem, progress_info: e.target.value })}
                placeholder="수업 진도 현황을 입력하세요"
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">클리닉 수업 진도 현황</label>
              <textarea
                className="form-control"
                rows={3}
                value={editItem.clinic_info}
                onChange={(e) => setEditItem({ ...editItem, clinic_info: e.target.value })}
                placeholder="클리닉 수업 진도 현황을 입력하세요"
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">반 소개</label>
              <textarea
                className="form-control"
                rows={3}
                value={editItem.introduction}
                onChange={(e) => setEditItem({ ...editItem, introduction: e.target.value })}
                placeholder="반 소개를 입력하세요"
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">표시 순서</label>
                <input
                  type="number"
                  className="form-control"
                  value={editItem.sort_order}
                  onChange={(e) => setEditItem({ ...editItem, sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label d-block">상태</label>
                <div className="form-check form-switch mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={!!editItem.is_active}
                    onChange={(e) => setEditItem({ ...editItem, is_active: e.target.checked ? 1 : 0 })}
                  />
                  <label className="form-check-label">
                    {editItem.is_active ? '활성' : '비활성'}
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={handleSave}>저장</button>
              <button className="btn btn-secondary" onClick={() => setEditItem(null)}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 목록 */}
      {items.length === 0 ? (
        <p className="text-muted">등록된 수강반 표시가 없습니다.</p>
      ) : (
        <div className="row">
          {items.map((item) => (
            <div key={item.id} className="col-md-6 col-lg-4 mb-3">
              <div className="card h-100" style={{ opacity: item.is_active ? 1 : 0.6 }}>
                <div className="card-header d-flex justify-content-between align-items-center">
                  <strong>{item.class_name || `수강반 #${item.class_id}`}</strong>
                  <span className={`badge ${item.is_active ? 'bg-success' : 'bg-secondary'}`}>
                    {item.is_active ? '활성' : '비활성'}
                  </span>
                </div>
                <div className="card-body">
                  {item.class_day && (
                    <p className="text-muted mb-2" style={{ fontSize: 13 }}>
                      {item.class_day} {item.class_hour}:{item.class_minute === '0' ? '00' : item.class_minute}
                    </p>
                  )}
                  {item.teacher_image_file_id && (
                    <img
                      src={`/api/file/image/${item.teacher_image_file_id}`}
                      alt="선생님"
                      style={{ maxWidth: 100, borderRadius: 8, marginBottom: 8 }}
                    />
                  )}
                  {item.description && (
                    <div className="mb-2">
                      <small className="text-muted">수강반 정보</small>
                      <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{item.description.substring(0, 100)}{item.description.length > 100 ? '...' : ''}</div>
                    </div>
                  )}
                  <div className="text-muted" style={{ fontSize: 12 }}>순서: {item.sort_order}</div>
                </div>
                <div className="card-footer" style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setEditItem({ ...item })}
                  >
                    수정
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(item.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
