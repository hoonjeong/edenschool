'use client';

import { useState, useEffect } from 'react';

/* ── types ── */
interface ClassInfo {
  id: number;
  name: string;
  grade: string;
  year: number;
  day?: string;
  hour?: number;
  minute?: number;
  live_count?: number;
}

interface StudentPhone {
  className: string;
  studentName: string;
  sphone: string;
  pphone: string;
}

interface Template {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface SendLog {
  phone: string;
  message: string;
  type: string;
  result_message: string;
  send_time: string;
}

interface Props {
  mode: 'admin' | 'teacher';
}

/* ── helpers ── */
function getByteLength(str: string): number {
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    bytes += encodeURIComponent(str.charAt(i)).length > 3 ? 2 : 1;
  }
  return bytes;
}

export default function SmsComposer({ mode }: Props) {
  /* ─── Card 1: 반 선택 ─── */
  const [sendType, setSendType] = useState<'HIGH' | 'MIDDLE'>('HIGH');
  const [classList, setClassList] = useState<ClassInfo[]>([]);
  const [checkedClassIds, setCheckedClassIds] = useState<number[]>([]);
  const [fetchingClasses, setFetchingClasses] = useState(false);

  /* ─── Card 2: 인원 선택 ─── */
  const [studentList, setStudentList] = useState<StudentPhone[]>([]);
  const [checkedPhones, setCheckedPhones] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchingStudents, setFetchingStudents] = useState(false);

  /* ─── Card 3: 내용 작성 ─── */
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');

  /* ─── Card 4: 전송 ─── */
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [myHistory, setMyHistory] = useState<SendLog[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [numberHistory, setNumberHistory] = useState<SendLog[]>([]);

  const byteLength = getByteLength(message);
  const smsType = byteLength <= 90 ? 'SMS' : 'LMS';

  /* ─── 초기 데이터 로드 ─── */
  useEffect(() => {
    const url =
      mode === 'teacher'
        ? '/api/admin/sms/classes?teacherOnly=true'
        : '/api/admin/sms/classes';
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (mode === 'teacher' && data.classes) {
          setClassList(data.classes);
        } else if (Array.isArray(data)) {
          setClassList(data);
        }
      })
      .catch(() => alert('반 목록을 불러오지 못했습니다.'));
  }, [mode]);

  useEffect(() => {
    fetch('/api/admin/sms/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {});
  }, []);

  const fetchMyHistory = () => {
    fetch('/api/admin/sms?myHistory=true')
      .then((r) => r.json())
      .then((data) => setMyHistory(data.history || []))
      .catch(() => {});
  };

  // 특정 번호의 발송 이력 조회 (선택한 번호 기준)
  const fetchNumberHistory = (phone: string) => {
    if (!phone) return;
    setSelectedNumber(phone);
    fetch(`/api/admin/sms?phone=${encodeURIComponent(phone)}`)
      .then((r) => r.json())
      .then((data) => setNumberHistory(data.history || []))
      .catch(() => setNumberHistory([]));
  };

  useEffect(() => {
    fetchMyHistory();
  }, []);


  /* ─── Card 1 helpers ─── */
  const highClasses = classList.filter((c) => c.grade === '고');
  const middleClasses = classList.filter((c) => c.grade === '중');

  const groupByYear = (classes: ClassInfo[]) => {
    const groups: Record<number, ClassInfo[]> = {};
    classes.forEach((c) => {
      if (!groups[c.year]) groups[c.year] = [];
      groups[c.year].push(c);
    });
    return groups;
  };

  const currentGroups = mode === 'admin'
    ? (sendType === 'HIGH' ? groupByYear(highClasses) : groupByYear(middleClasses))
    : null;

  const handleTypeChange = (type: 'HIGH' | 'MIDDLE') => {
    setSendType(type);
    setCheckedClassIds([]);
    setStudentList([]);
    setCheckedPhones([]);
  };

  const handleClassToggle = (id: number) => {
    setCheckedClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleYearAllToggle = (classes: ClassInfo[], checked: boolean) => {
    const ids = classes.map((c) => c.id);
    if (checked) {
      setCheckedClassIds((prev) => [...new Set([...prev, ...ids])]);
    } else {
      setCheckedClassIds((prev) => prev.filter((id) => !ids.includes(id)));
    }
  };

  const isYearAllChecked = (classes: ClassInfo[]) =>
    classes.length > 0 && classes.every((c) => checkedClassIds.includes(c.id));

  const fetchStudents = async () => {
    if (checkedClassIds.length === 0) {
      alert('대상 반을 선택해주세요.');
      return;
    }
    setFetchingStudents(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/sms/phones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: checkedClassIds }),
      });
      const data: StudentPhone[] = await res.json();
      setStudentList(data);
      setCheckedPhones([]);
    } catch {
      alert('학생 정보 조회 중 오류가 발생했습니다.');
    } finally {
      setFetchingStudents(false);
    }
  };

  /* ─── Card 2 helpers ─── */
  const filteredStudents = searchQuery
    ? studentList.filter((s) =>
        s.studentName.includes(searchQuery) || s.className.includes(searchQuery)
      )
    : studentList;

  const handlePhoneToggle = (phone: string) => {
    if (!phone) return;
    const isAdding = !checkedPhones.includes(phone);
    setCheckedPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );
    if (isAdding) fetchNumberHistory(phone); // 최근 선택한 번호의 이력 표시
  };

  const handleAllStudentToggle = (checked: boolean) => {
    const phones = studentList.map((s) => s.sphone).filter(Boolean);

    if (checked) {
      setCheckedPhones((prev) => [...new Set([...prev, ...phones])]);
      if (phones.length) fetchNumberHistory(phones[phones.length - 1]);
    } else {
      const parentPhones = studentList.map((s) => s.pphone).filter(Boolean);
      setCheckedPhones((prev) => prev.filter((p) => parentPhones.includes(p)));
    }
  };

  const handleAllParentToggle = (checked: boolean) => {
    const phones = studentList.map((s) => s.pphone).filter(Boolean);

    if (checked) {
      setCheckedPhones((prev) => [...new Set([...prev, ...phones])]);
      if (phones.length) fetchNumberHistory(phones[phones.length - 1]);
    } else {
      const studentPhones = studentList.map((s) => s.sphone).filter(Boolean);
      setCheckedPhones((prev) => prev.filter((p) => studentPhones.includes(p)));
    }
  };

  const allStudentsChecked =
    studentList.length > 0 &&
    studentList.every((s) => !s.sphone || checkedPhones.includes(s.sphone));
  const allParentsChecked =
    studentList.length > 0 &&
    studentList.every((s) => !s.pphone || checkedPhones.includes(s.pphone));

  const removePhone = (phone: string) => {
    setCheckedPhones((prev) => prev.filter((p) => p !== phone));
  };

  // Build a map: phone → studentName for chip display
  const phoneNameMap: Record<string, string> = {};
  studentList.forEach((s) => {
    if (s.sphone) phoneNameMap[s.sphone] = s.studentName;
    if (s.pphone) phoneNameMap[s.pphone] = s.studentName + '(학부모)';
  });

  /* ─── Card 3 helpers ─── */
  const handleTemplateSelect = (tpl: Template) => {
    setMessage(tpl.content);
    setShowTemplateModal(false);
  };

  const handleSaveTemplate = async () => {
    const title = newTemplateTitle.trim();
    if (!title) { alert('템플릿 제목을 입력해주세요.'); return; }
    if (!message.trim()) { alert('메시지를 먼저 입력해주세요.'); return; }
    try {
      const res = await fetch('/api/admin/sms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: message }),
      });
      const data = await res.json();
      if (data.ok) {
        setTemplates((prev) => [{ id: data.id, title, content: message, created_at: '' }, ...prev]);
        setNewTemplateTitle('');
        alert('템플릿이 저장되었습니다.');
      }
    } catch {
      alert('템플릿 저장에 실패했습니다.');
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('이 템플릿을 삭제하시겠습니까?')) return;
    try {
      await fetch('/api/admin/sms/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  /* ─── Card 4 helpers ─── */
  const handleSend = async () => {
    if (checkedPhones.length === 0) {
      alert('발송 대상을 선택해주세요.');
      return;
    }
    if (!message.trim()) {
      alert('메세지를 입력해주세요.');
      return;
    }
    if (!confirm(`총 ${checkedPhones.length}건의 ${smsType}를 발송하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: checkedPhones, message, type: smsType }),
      });
      const data = await res.json();
      if (data.error) {
        setResult(`발송 실패: ${data.error}`);
      } else {
        setResult(`발송 완료: 총 ${data.count || checkedPhones.length}건`);
        fetchMyHistory();
        if (selectedNumber) fetchNumberHistory(selectedNumber);
      }
    } catch {
      setResult('발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCheckedClassIds([]);
    setStudentList([]);
    setCheckedPhones([]);
    setMessage('');
    setResult(null);
    setSearchQuery('');
    setSelectedNumber(null);
    setNumberHistory([]);
  };

  // 발송 이력 테이블 렌더 (개별/전체 공용)
  const renderHistory = (list: SendLog[], emptyText: string) =>
    list.length > 0 ? (
      <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
        <table className="table table-sm" style={{ marginBottom: 0, fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ padding: '6px 10px' }}>수신번호</th>
              <th style={{ padding: '6px 10px' }}>내용</th>
              <th style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>발송시간</th>
            </tr>
          </thead>
          <tbody>
            {list.map((h, i) => (
              <tr key={i}>
                <td style={{ padding: '4px 10px', whiteSpace: 'nowrap' }}>{h.phone}</td>
                <td style={{ padding: '4px 10px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.message}
                </td>
                <td style={{ padding: '4px 10px', whiteSpace: 'nowrap', color: '#64748b' }}>{h.send_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '16px 0' }}>
        {emptyText}
      </div>
    );

  /* ─── Render ─── */
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* ═══ Card 1: 반 선택 ═══ */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>1. 반 선택</span>
            {checkedClassIds.length > 0 && (
              <span className="badge badge-primary" style={{ fontSize: '12px' }}>
                {checkedClassIds.length}개 선택
              </span>
            )}
          </div>
          <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {mode === 'admin' && (
              <div style={{ marginBottom: '12px' }}>
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    className={`btn ${sendType === 'HIGH' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleTypeChange('HIGH')}
                  >
                    고등부
                  </button>
                  <button
                    className={`btn ${sendType === 'MIDDLE' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleTypeChange('MIDDLE')}
                  >
                    중등부
                  </button>
                </div>
              </div>
            )}

            {mode === 'admin' && currentGroups && (
              <div>
                {Object.entries(currentGroups)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([year, classes]) => (
                    <div key={year} style={{ marginBottom: '10px' }}>
                      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px' }}>
                        <label style={{ cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                          <input
                            type="checkbox"
                            checked={isYearAllChecked(classes)}
                            onChange={(e) => handleYearAllToggle(classes, e.target.checked)}
                            style={{ marginRight: '6px' }}
                          />
                          {year}학년 전체
                        </label>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', paddingLeft: '4px' }}>
                        {classes.map((cls) => (
                          <label key={cls.id} style={{ cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>
                            <input
                              type="checkbox"
                              checked={checkedClassIds.includes(cls.id)}
                              onChange={() => handleClassToggle(cls.id)}
                              style={{ marginRight: '4px' }}
                            />
                            {cls.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {mode === 'teacher' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {classList.map((cls) => (
                  <label key={cls.id} style={{ cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={checkedClassIds.includes(cls.id)}
                      onChange={() => handleClassToggle(cls.id)}
                      style={{ marginRight: '6px' }}
                    />
                    {cls.name}
                  </label>
                ))}
                {classList.length === 0 && (
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>담당 반이 없습니다.</span>
                )}
              </div>
            )}

            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: '12px' }}
              onClick={fetchStudents}
              disabled={fetchingStudents || checkedClassIds.length === 0}
            >
              {fetchingStudents ? '불러오는 중...' : '선택반 불러오기'}
            </button>
          </div>
        </div>

        {/* ═══ Card 2: 인원 선택 ═══ */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>2. 인원 선택</span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              선택: <strong style={{ color: '#3b82f6' }}>{checkedPhones.length}명</strong>
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {studentList.length > 0 ? (
              <>
                {/* Toggle buttons + search */}
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    className={`btn btn-sm ${allStudentsChecked ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleAllStudentToggle(!allStudentsChecked)}
                  >
                    학생 전체 ({studentList.filter((s) => s.sphone).length})
                  </button>
                  <button
                    className={`btn btn-sm ${allParentsChecked ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleAllParentToggle(!allParentsChecked)}
                  >
                    학부모 전체 ({studentList.filter((s) => s.pphone).length})
                  </button>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="이름 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '140px', marginLeft: 'auto' }}
                  />
                </div>

                {/* Student table */}
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  <table className="table table-sm" style={{ marginBottom: 0, fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 10px' }}>반 / 이름</th>
                        <th style={{ padding: '6px 10px', width: '80px', textAlign: 'center' }}>학생</th>
                        <th style={{ padding: '6px 10px', width: '80px', textAlign: 'center' }}>학부모</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((s, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '4px 10px' }}>{s.className} {s.studentName}</td>
                          <td style={{ padding: '4px 10px', textAlign: 'center' }}>
                            {s.sphone ? (
                              <input
                                type="checkbox"
                                checked={checkedPhones.includes(s.sphone)}
                                onChange={() => handlePhoneToggle(s.sphone)}
                              />
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>-</span>
                            )}
                          </td>
                          <td style={{ padding: '4px 10px', textAlign: 'center' }}>
                            {s.pphone ? (
                              <input
                                type="checkbox"
                                checked={checkedPhones.includes(s.pphone)}
                                onChange={() => handlePhoneToggle(s.pphone)}
                              />
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Selected chips */}
                {checkedPhones.length > 0 && (
                  <div style={{ padding: '8px 12px', borderTop: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '80px', overflowY: 'auto' }}>
                    {checkedPhones.map((phone) => {
                      const active = phone === selectedNumber;
                      return (
                        <span
                          key={phone}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            backgroundColor: active ? '#2563eb' : '#eff6ff',
                            border: `1px solid ${active ? '#2563eb' : '#bfdbfe'}`,
                            borderRadius: '12px',
                            fontSize: '11px',
                            color: active ? '#fff' : '#1e40af',
                          }}
                        >
                          <span
                            onClick={() => fetchNumberHistory(phone)}
                            style={{ cursor: 'pointer' }}
                            title="이 번호의 발송 이력 보기"
                          >
                            {phoneNameMap[phone] || phone}
                          </span>
                          <span
                            onClick={() => removePhone(phone)}
                            style={{ cursor: 'pointer', fontWeight: 'bold', marginLeft: '2px', color: active ? '#dbeafe' : '#6b7280' }}
                          >
                            ×
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                반을 선택하고 &quot;선택반 불러오기&quot;를 클릭해주세요.
              </div>
            )}
          </div>
        </div>

        {/* ═══ Card 3: 내용 작성 및 발송 ═══ */}
        <div className="card">
          <div className="card-header">3. 내용 작성 및 발송</div>
          <div className="card-body">
            {/* Template area */}
            <div style={{ marginBottom: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="form-control form-control-sm"
                style={{ width: 'auto', maxWidth: '200px' }}
                onChange={(e) => {
                  const tpl = templates.find((t) => t.id === Number(e.target.value));
                  if (tpl) setMessage(tpl.content);
                }}
                defaultValue=""
              >
                <option value="" disabled>템플릿 선택...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowTemplateModal(true)}
              >
                템플릿 관리
              </button>
            </div>

            {/* Save as template */}
            <div style={{ marginBottom: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="템플릿 제목"
                value={newTemplateTitle}
                onChange={(e) => setNewTemplateTitle(e.target.value)}
                style={{ width: '160px' }}
              />
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={handleSaveTemplate}
                disabled={!message.trim() || !newTemplateTitle.trim()}
              >
                현재 메시지 저장
              </button>
            </div>

            <textarea
              className="form-control"
              rows={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="메세지를 입력하세요..."
              style={{ resize: 'vertical' }}
            />

            {/* Type info */}
            <div style={{ marginTop: '8px', fontSize: '13px', color: byteLength > 90 ? '#dc2626' : '#64748b' }}>
              {byteLength} byte · {smsType} · 대상 {checkedPhones.length}명
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                className="btn btn-danger"
                onClick={handleSend}
                disabled={loading || checkedPhones.length === 0 || !message.trim()}
                style={{ flex: 1 }}
              >
                {loading ? '발송 중...' : '발송하기'}
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={handleReset}
                disabled={loading}
              >
                리셋
              </button>
            </div>

            {/* Result */}
            {result && (
              <div
                className={`alert ${result.includes('실패') || result.includes('오류') ? 'alert-danger' : 'alert-success'}`}
                style={{ marginTop: '12px', marginBottom: 0, fontSize: '13px' }}
              >
                {result}
              </div>
            )}
          </div>
        </div>

        {/* ═══ Card 4: 발송 이력 (개별 / 전체 구분) ═══ */}
        <div className="card">
          <div className="card-header">4. 발송 이력</div>
          <div className="card-body">
            {/* 개별 발송 이력 (선택한 번호) */}
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              <i className="fas fa-user" style={{ marginRight: 4, color: '#2563eb' }}></i>
              개별 발송 이력
              {selectedNumber && (
                <span style={{ color: '#2563eb', marginLeft: 6, fontWeight: 500 }}>
                  · {phoneNameMap[selectedNumber] || selectedNumber} ({selectedNumber})
                </span>
              )}
            </div>
            {selectedNumber
              ? renderHistory(numberHistory, '이 번호로 보낸 이력이 없습니다.')
              : (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '16px 0' }}>
                  수신번호를 선택(또는 아래 칩 클릭)하면 해당 번호의 발송 이력이 표시됩니다.
                </div>
              )}

            <hr style={{ margin: '14px 0' }} />

            {/* 전체 발송 이력 (본인 발송 전체) */}
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              <i className="fas fa-list" style={{ marginRight: 4, color: '#64748b' }}></i>
              전체 발송 이력 <span style={{ color: '#94a3b8', fontWeight: 400 }}>(내가 보낸 최근)</span>
            </div>
            {renderHistory(myHistory, '발송 이력이 없습니다.')}
          </div>
        </div>
      </div>

      {/* ═══ Template Management Modal ═══ */}
      {showTemplateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setShowTemplateModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              width: '500px',
              maxWidth: '90vw',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>템플릿 관리</span>
              <span onClick={() => setShowTemplateModal(false)} style={{ cursor: 'pointer', fontSize: '18px', color: '#6b7280' }}>×</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
              {templates.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>저장된 템플릿이 없습니다.</div>
              ) : (
                templates.map((tpl) => (
                  <div key={tpl.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{tpl.title}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', whiteSpace: 'pre-wrap', overflow: 'hidden', maxHeight: '40px' }}>
                        {tpl.content}
                      </div>
                      {tpl.created_at && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{tpl.created_at}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button className="btn btn-sm btn-outline-primary" onClick={() => handleTemplateSelect(tpl)}>
                        불러오기
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteTemplate(tpl.id)}>
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
