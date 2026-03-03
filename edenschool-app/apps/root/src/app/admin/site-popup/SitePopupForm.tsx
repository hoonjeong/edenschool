'use client';

import { useState, useEffect } from 'react';

export function SitePopupForm() {
  const [isActive, setIsActive] = useState(false);
  const [imageFileId, setImageFileId] = useState<number | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/site/popup')
      .then((r) => r.json())
      .then((data) => {
        if (data.popup) {
          setIsActive(!!data.popup.is_active);
          setImageFileId(data.popup.image_file_id);
          setLinkUrl(data.popup.link_url || '');
          setStartDate(data.popup.start_date || '');
          setEndDate(data.popup.end_date || '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/file/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.fileId) {
      setImageFileId(data.fileId);
      setMsg('이미지 업로드 완료');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    const res = await fetch('/api/admin/site/popup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_active: isActive,
        image_file_id: imageFileId,
        link_url: linkUrl,
        start_date: startDate || null,
        end_date: endDate || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    setMsg(data.success ? '저장되었습니다.' : '저장에 실패했습니다.');
  };

  if (loading) return <div className="admin-content"><p>로딩 중...</p></div>;

  return (
    <div className="admin-content">
      <h2 className="mb-4">팝업 관리</h2>

      <div className="card mb-4">
        <div className="card-body">
          {/* 활성/비활성 */}
          <div className="form-group mb-3">
            <label className="form-label d-block">팝업 상태</label>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                id="popupActiveSwitch"
              />
              <label className="form-check-label" htmlFor="popupActiveSwitch">
                {isActive ? '활성' : '비활성'}
              </label>
            </div>
          </div>

          {/* 기간 */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">시작일</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">종료일</label>
              <input
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* 이미지 업로드 */}
          <div className="form-group mb-3">
            <label className="form-label">팝업 이미지</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          {/* 미리보기 */}
          {imageFileId && (
            <div className="mb-3">
              <label className="form-label">미리보기</label>
              <div style={{ maxWidth: 400, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <img
                  src={`/api/file/image/${imageFileId}`}
                  alt="팝업 이미지"
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            </div>
          )}

          {/* 링크 URL */}
          <div className="form-group mb-3">
            <label className="form-label">클릭 시 이동 URL</label>
            <input
              type="text"
              className="form-control"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>

          {msg && <div className="alert alert-info">{msg}</div>}

          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
