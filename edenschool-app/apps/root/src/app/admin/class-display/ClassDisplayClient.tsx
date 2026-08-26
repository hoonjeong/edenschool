'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  type ScheduleItem,
  type SchoolSchedule,
  SECTIONS,
  SECTION_LABELS,
  parseScheduleData,
  serializeScheduleData,
  getPhotoSrc,
} from '@/lib/teacher-display-utils';

/* ===== 타입 ===== */
interface TeacherItem {
  id?: number;
  section: string;
  branch: string;
  school: string;
  name: string;
  role: string;
  photo_url: string;
  photo_file_id: number | null;
  schedule_data: string | null;
  sort_order: number;
  is_active: number;
}

function emptyItem(section: string): TeacherItem {
  return {
    section,
    branch: '',
    school: '',
    name: '',
    role: '',
    photo_url: '',
    photo_file_id: null,
    schedule_data: null,
    sort_order: 0,
    is_active: 1,
  };
}

/* ===== 스케줄 편집 컴포넌트 ===== */
function ScheduleEditor({
  schedule,
  schools,
  isMultiSchool,
  onChangeSchedule,
  onChangeSchools,
  onToggleMulti,
}: {
  schedule: ScheduleItem[];
  schools: SchoolSchedule[];
  isMultiSchool: boolean;
  onChangeSchedule: (s: ScheduleItem[]) => void;
  onChangeSchools: (s: SchoolSchedule[]) => void;
  onToggleMulti: (v: boolean) => void;
}) {
  return (
    <div>
      <div className="form-check form-switch mb-2">
        <input
          className="form-check-input"
          type="checkbox"
          checked={isMultiSchool}
          onChange={(e) => onToggleMulti(e.target.checked)}
        />
        <label className="form-check-label">다중 학교</label>
      </div>

      {!isMultiSchool ? (
        <div>
          {schedule.map((item, i) => (
            <div key={i} className="d-flex gap-2 mb-2 align-items-center">
              <input
                className="form-control"
                style={{ width: 100 }}
                placeholder="학년"
                value={item.grade}
                onChange={(e) => {
                  const next = [...schedule];
                  next[i] = { ...next[i], grade: e.target.value };
                  onChangeSchedule(next);
                }}
              />
              <input
                className="form-control"
                placeholder="시간 (예: 토 19:00~22:00)"
                value={item.time}
                onChange={(e) => {
                  const next = [...schedule];
                  next[i] = { ...next[i], time: e.target.value };
                  onChangeSchedule(next);
                }}
              />
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => onChangeSchedule(schedule.filter((_, j) => j !== i))}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => onChangeSchedule([...schedule, { grade: '', time: '' }])}
          >
            <i className="fas fa-plus"></i> 시간 추가
          </button>
        </div>
      ) : (
        <div>
          {schools.map((school, si) => (
            <div key={si} className="border rounded p-2 mb-2">
              <div className="d-flex gap-2 mb-2 align-items-center">
                <input
                  className="form-control"
                  style={{ width: 200 }}
                  placeholder="학교명"
                  value={school.name}
                  onChange={(e) => {
                    const next = [...schools];
                    next[si] = { ...next[si], name: e.target.value };
                    onChangeSchools(next);
                  }}
                />
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onChangeSchools(schools.filter((_, j) => j !== si))}
                >
                  학교 삭제
                </button>
              </div>
              {school.schedule.map((item, i) => (
                <div key={i} className="d-flex gap-2 mb-1 align-items-center ms-3">
                  <input
                    className="form-control"
                    style={{ width: 100 }}
                    placeholder="학년"
                    value={item.grade}
                    onChange={(e) => {
                      const next = [...schools];
                      const sched = [...next[si].schedule];
                      sched[i] = { ...sched[i], grade: e.target.value };
                      next[si] = { ...next[si], schedule: sched };
                      onChangeSchools(next);
                    }}
                  />
                  <input
                    className="form-control"
                    placeholder="시간"
                    value={item.time}
                    onChange={(e) => {
                      const next = [...schools];
                      const sched = [...next[si].schedule];
                      sched[i] = { ...sched[i], time: e.target.value };
                      next[si] = { ...next[si], schedule: sched };
                      onChangeSchools(next);
                    }}
                  />
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => {
                      const next = [...schools];
                      next[si] = { ...next[si], schedule: next[si].schedule.filter((_, j) => j !== i) };
                      onChangeSchools(next);
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
              <button
                className="btn btn-sm btn-outline-secondary ms-3 mt-1"
                onClick={() => {
                  const next = [...schools];
                  next[si] = { ...next[si], schedule: [...next[si].schedule, { grade: '', time: '' }] };
                  onChangeSchools(next);
                }}
              >
                <i className="fas fa-plus"></i> 시간 추가
              </button>
            </div>
          ))}
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => onChangeSchools([...schools, { name: '', schedule: [{ grade: '', time: '' }] }])}
          >
            <i className="fas fa-plus"></i> 학교 추가
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== 편집 폼 ===== */
function EditForm({
  item,
  onSave,
  onCancel,
}: {
  item: TeacherItem;
  onSave: (item: TeacherItem) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<TeacherItem>({ ...item });
  const parsed = parseScheduleData(form.schedule_data);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(parsed.schedule);
  const [schools, setSchools] = useState<SchoolSchedule[]>(parsed.schools);
  const [isMultiSchool, setIsMultiSchool] = useState(parsed.schools.length > 0);
  const [uploading, setUploading] = useState(false);

  const showBranch = form.section === 'HIGH_SCHOOL' || form.section === 'MIDDLE_SCHOOL';
  const showSchool = form.section === 'HIGH_SCHOOL' || form.section === 'MIDDLE_SCHOOL';
  const showRole = form.section === 'STAFF' || form.section === 'CONTENT_PLAN';
  const showSchedule =
    form.section !== 'ELEMENTARY' && form.section !== 'STAFF' && form.section !== 'CONTENT_PLAN';

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/file/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.fileId) {
        setForm({ ...form, photo_file_id: data.fileId, photo_url: '' });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    const scheduleData = showSchedule ? serializeScheduleData(
      isMultiSchool ? [] : schedule,
      isMultiSchool ? schools : []
    ) : null;
    onSave({ ...form, schedule_data: scheduleData });
  };

  const photoSrc = getPhotoSrc(form) || null;

  return (
    <div className="card mb-3">
      <div className="card-header">
        {form.id ? '수정' : '새로 추가'} — {SECTION_LABELS[form.section]}
      </div>
      <div className="card-body">
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">이름 *</label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="예: 김보름 선생님"
            />
          </div>
          {showRole && (
            <div className="col-md-6">
              <label className="form-label">역할</label>
              <input
                className="form-control"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="예: 대표원장"
              />
            </div>
          )}
        </div>

        {showBranch && (
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">관</label>
              <input
                className="form-control"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                placeholder="예: 이든배움국어상동2관"
              />
            </div>
            {showSchool && (
              <div className="col-md-6">
                <label className="form-label">학교</label>
                <input
                  className="form-control"
                  value={form.school}
                  onChange={(e) => setForm({ ...form, school: e.target.value })}
                  placeholder="예: 상원고"
                />
              </div>
            )}
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">사진</label>
          <input type="file" className="form-control" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          {uploading && <small className="text-muted">업로드 중...</small>}
          {photoSrc && (
            <div className="mt-2">
              <img src={photoSrc} alt={form.name} style={{ maxWidth: 120, borderRadius: 8 }} />
            </div>
          )}
          {!form.photo_file_id && form.photo_url && (
            <small className="text-muted d-block mt-1">현재: {form.photo_url}</small>
          )}
        </div>

        {showSchedule && (
          <div className="mb-3">
            <label className="form-label">시간표</label>
            <ScheduleEditor
              schedule={schedule}
              schools={schools}
              isMultiSchool={isMultiSchool}
              onChangeSchedule={setSchedule}
              onChangeSchools={setSchools}
              onToggleMulti={setIsMultiSchool}
            />
          </div>
        )}

        <div className="row mb-3">
          <div className="col-md-4">
            <label className="form-label">표시 순서</label>
            <input
              type="number"
              className="form-control"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label d-block">상태</label>
            <div className="form-check form-switch mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                checked={!!form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })}
              />
              <label className="form-check-label">{form.is_active ? '활성' : '비활성'}</label>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={handleSave}>저장</button>
          <button className="btn btn-secondary" onClick={onCancel}>취소</button>
        </div>
      </div>
    </div>
  );
}

/* ===== 선생님 카드 ===== */
function TeacherCard({
  item,
  onEdit,
  onDelete,
}: {
  item: TeacherItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const parsed = parseScheduleData(item.schedule_data);
  const photoSrc = getPhotoSrc(item) || null;

  return (
    <div className="card mb-2" style={{ opacity: item.is_active ? 1 : 0.5 }}>
      <div className="card-body p-3">
        <div className="d-flex gap-3 align-items-start">
          {photoSrc && (
            <img
              src={photoSrc}
              alt={item.name}
              style={{ width: 60, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong style={{ fontSize: 16 }}>{item.name}</strong>
                {!item.is_active && <span className="badge bg-secondary ms-2">비활성</span>}
              </div>
              <div className="d-flex gap-1">
                <button className="btn btn-sm btn-outline-primary" onClick={onEdit}>수정</button>
                <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>삭제</button>
              </div>
            </div>
            {item.branch && <div className="text-muted" style={{ fontSize: 13 }}>{item.branch}</div>}
            {item.school && <div style={{ fontSize: 14 }}>{item.school} 전임</div>}
            {item.role && <div style={{ fontSize: 14, color: '#64748b' }}>{item.role}</div>}
            {parsed.schedule.length > 0 && (
              <div className="mt-1" style={{ fontSize: 13, color: '#555' }}>
                {parsed.schedule.map((s, i) => (
                  <div key={i}>{s.grade ? `${s.grade}: ` : ''}{s.time}</div>
                ))}
              </div>
            )}
            {parsed.schools.length > 0 && (
              <div className="mt-1" style={{ fontSize: 13, color: '#555' }}>
                {parsed.schools.map((s, i) => (
                  <div key={i}>
                    <strong>{s.name}</strong>:{' '}
                    {s.schedule.map((sc) => `${sc.grade} ${sc.time}`).join(', ')}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== 메인 컴포넌트 ===== */
export default function ClassDisplayClient() {
  const [items, setItems] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [editItem, setEditItem] = useState<TeacherItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/site/teacher-display');
      if (!res.ok) {
        const text = await res.text();
        setMsg(`API 오류 (${res.status}): ${text.substring(0, 200)}`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setItems(data.list || []);
    } catch (err) {
      setMsg(`데이터 로딩 실패: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (item: TeacherItem) => {
    setMsg('');
    const isNew = !item.id;
    const method = isNew ? 'POST' : 'PUT';
    try {
      const res = await fetch('/api/admin/site/teacher-display', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (data.success) {
        setEditItem(null);
        setMsg('저장되었습니다.');
        fetchData();
      } else {
        setMsg('저장에 실패했습니다.');
      }
    } catch {
      setMsg('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/admin/site/teacher-display?id=${id}`, { method: 'DELETE' });
      setMsg('삭제되었습니다.');
      fetchData();
    } catch {
      setMsg('삭제에 실패했습니다.');
    }
  };

  if (loading) return <div className="admin-content"><p>로딩 중...</p></div>;

  const grouped = SECTIONS.map((sec) => ({
    ...sec,
    items: items.filter((item) => item.section === sec.key),
  }));

  return (
    <div className="admin-content">
      <h2 className="mb-4">수업안내 수정</h2>
      {msg && <div className="alert alert-info alert-dismissible">{msg}<button type="button" className="btn-close" onClick={() => setMsg('')}></button></div>}

      {editItem && (
        <EditForm
          item={editItem}
          onSave={handleSave}
          onCancel={() => setEditItem(null)}
        />
      )}

      {grouped.map((group) => (
        <div key={group.key} className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">
              {group.label} <span className="badge bg-primary">{group.items.length}명</span>
            </h5>
            {!editItem && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  const maxSort = group.items.reduce((max, it) => Math.max(max, it.sort_order), 0);
                  setEditItem({ ...emptyItem(group.key), sort_order: maxSort + 1 });
                }}
              >
                <i className="fas fa-plus"></i> 추가
              </button>
            )}
          </div>
          {group.items.length === 0 ? (
            <p className="text-muted ms-2" style={{ fontSize: 14 }}>등록된 선생님이 없습니다.</p>
          ) : (
            group.items.map((item) => (
              <TeacherCard
                key={item.id}
                item={item}
                onEdit={() => { setEditItem({ ...item }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onDelete={() => item.id && handleDelete(item.id)}
              />
            ))
          )}
        </div>
      ))}
    </div>
  );
}
