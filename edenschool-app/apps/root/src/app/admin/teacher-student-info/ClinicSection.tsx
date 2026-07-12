'use client';

import { useState } from 'react';
import type { StudentMemo } from '@edenschool/common/types';

interface Props {
  studentId: number;
  parentPhone: string;
  initialMemos: StudentMemo[];
}

// SmsComposer와 동일한 바이트 계산 (한글 2바이트). 90byte 이하 SMS, 초과 LMS.
function getByteLength(str: string): number {
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    bytes += encodeURIComponent(str.charAt(i)).length > 3 ? 2 : 1;
  }
  return bytes;
}

const PREVIEW_LEN = 40;

export default function ClinicSection({ studentId, parentPhone, initialMemos }: Props) {
  const [history, setHistory] = useState<StudentMemo[]>(initialMemos);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [sending, setSending] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const byteLength = getByteLength(message);
  const smsType = byteLength <= 90 ? 'SMS' : 'LMS';

  const addToHistory = (id: number, content: string) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setHistory([{ id, studentId, content, date }, ...history]);
  };

  // 상담 기록 저장 (왼쪽 textarea 내용)
  const save = async () => {
    const text = note.trim();
    if (!text) {
      alert('상담 내용을 입력하세요.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/student/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, content: text }),
      });
      if (!res.ok) {
        alert('저장에 실패했습니다.');
        return;
      }
      const data = await res.json();
      addToHistory(data.id, text);
      setNote('');
    } finally {
      setSaving(false);
    }
  };

  // AI 메시지 변환 (왼쪽 → 오른쪽)
  const convert = async () => {
    const text = note.trim();
    if (!text) {
      alert('변환할 상담 내용을 먼저 입력하세요.');
      return;
    }
    setConverting(true);
    try {
      const res = await fetch('/api/admin/student/clinic-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '메시지 변환에 실패했습니다.');
        return;
      }
      setMessage(data.message);
    } finally {
      setConverting(false);
    }
  };

  // 학부모에게 문자 전송 (오른쪽 textarea 내용)
  const send = async () => {
    const text = message.trim();
    if (!text) {
      alert('전송할 메시지가 없습니다. 먼저 메시지를 변환하거나 작성하세요.');
      return;
    }
    if (!parentPhone) {
      alert('학부모 연락처가 등록되어 있지 않습니다.');
      return;
    }
    if (!confirm(`학부모(${parentPhone})에게 아래 메시지를 전송할까요?\n\n${text}`)) return;

    setSending(true);
    try {
      const res = await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: [parentPhone], message: text, type: smsType }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        alert('학부모에게 전송되었습니다.');
      } else {
        alert(data.error || '전송에 실패했습니다.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card mb-4 border-primary">
      <div className="card-header bg-primary text-white">
        <strong>🩺 상담/클리닉 관리</strong>
      </div>
      <div className="card-body">
        <div className="form-row">
          {/* 왼쪽: 선생님 기록 */}
          <div className="col-md-6 mb-3">
            <label><strong>선생님 상담 기록</strong></label>
            <textarea
              className="form-control"
              rows={8}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="학생의 상황, 클리닉 내용을 기록하세요."
            />
            <div className="mt-2 d-flex gap-2">
              <button className="btn btn-secondary mr-2" onClick={save} disabled={saving}>
                {saving ? '저장 중...' : '저장하기'}
              </button>
              <button className="btn btn-info" onClick={convert} disabled={converting}>
                {converting ? '변환 중...' : '메세지변환'}
              </button>
            </div>
          </div>

          {/* 오른쪽: 학부모 전송 메시지 */}
          <div className="col-md-6 mb-3">
            <label><strong>학부모 전송 메시지</strong> (수정 가능)</label>
            <textarea
              className="form-control"
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="[메세지변환]을 누르면 학부모용 메시지가 여기에 표시됩니다. 직접 수정할 수 있습니다."
            />
            <div className="mt-2 d-flex justify-content-between align-items-center">
              <button className="btn btn-primary" onClick={send} disabled={sending}>
                {sending ? '전송 중...' : '학부모에게 전송하기'}
              </button>
              {message && (
                <small style={{ color: byteLength > 90 ? '#dc2626' : '#64748b' }}>
                  {byteLength} byte · {smsType}
                </small>
              )}
            </div>
          </div>
        </div>

        {/* 상담 히스토리 */}
        <h6 className="mt-3 mb-2">상담 히스토리</h6>
        <table className="table table-bordered table-hover mb-0">
          <thead className="thead-light">
            <tr>
              <th>내용</th>
              <th style={{ width: '150px' }}>날짜</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center">상담 기록이 없습니다.</td>
              </tr>
            ) : (
              history.map((m) => {
                const isLong = m.content.length > PREVIEW_LEN;
                const expanded = expandedId === m.id;
                return (
                  <tr key={m.id}>
                    <td
                      style={{ cursor: isLong ? 'pointer' : 'default', whiteSpace: 'pre-wrap' }}
                      onClick={() => isLong && setExpandedId(expanded ? null : m.id)}
                      title={isLong ? '클릭하면 전체 내용이 표시됩니다.' : ''}
                    >
                      {expanded || !isLong ? m.content : `${m.content.slice(0, PREVIEW_LEN)}...`}
                    </td>
                    <td>{m.date}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
