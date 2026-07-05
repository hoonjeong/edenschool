'use client';

import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { StudentScore } from '@edenschool/common/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type Category = 'naesin' | 'mock';

interface Props {
  studentId: number;
  category: Category;
  title: string; // "내신 성적 관리" / "모의고사 성적 관리"
  nameLabel: string; // "내신시험명" / "모의고사명"
  initialScores: StudentScore[];
}

const MEMO_PREVIEW_LEN = 15;

interface FormState {
  testName: string;
  rawScore: string;
  gradeRank: string;
  memo: string;
}

const EMPTY_FORM: FormState = { testName: '', rawScore: '', gradeRank: '', memo: '' };

function todayStr() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default function StudentScoreSection({
  studentId,
  category,
  title,
  nameLabel,
  initialScores,
}: Props) {
  const [scores, setScores] = useState<StudentScore[]>(initialScores);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [showChart, setShowChart] = useState(false);
  const [saving, setSaving] = useState(false);

  const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

  const addScore = async () => {
    if (!form.testName.trim()) {
      alert(`${nameLabel}을(를) 입력하세요.`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/student/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          category,
          testName: form.testName.trim(),
          rawScore: form.rawScore,
          gradeRank: form.gradeRank,
          memo: form.memo,
        }),
      });
      if (!res.ok) {
        alert('성적 추가에 실패했습니다.');
        return;
      }
      const data = await res.json();
      setScores([
        ...scores,
        {
          id: data.id,
          studentId,
          category,
          testName: form.testName.trim(),
          rawScore: numOrNull(form.rawScore),
          gradeRank: numOrNull(form.gradeRank),
          memo: form.memo,
          date: todayStr(),
        },
      ]);
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (s: StudentScore) => {
    setEditingId(s.id);
    setEditForm({
      testName: s.testName,
      rawScore: s.rawScore == null ? '' : String(s.rawScore),
      gradeRank: s.gradeRank == null ? '' : String(s.gradeRank),
      memo: s.memo || '',
    });
  };

  const saveEdit = async (id: number) => {
    if (!editForm.testName.trim()) {
      alert(`${nameLabel}을(를) 입력하세요.`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/student/score', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          testName: editForm.testName.trim(),
          rawScore: editForm.rawScore,
          gradeRank: editForm.gradeRank,
          memo: editForm.memo,
        }),
      });
      if (!res.ok) {
        alert('수정에 실패했습니다.');
        return;
      }
      setScores(
        scores.map((s) =>
          s.id === id
            ? {
                ...s,
                testName: editForm.testName.trim(),
                rawScore: numOrNull(editForm.rawScore),
                gradeRank: numOrNull(editForm.gradeRank),
                memo: editForm.memo,
              }
            : s
        )
      );
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const removeScore = async (id: number) => {
    if (!confirm('이 성적을 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/admin/student/score?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('삭제에 실패했습니다.');
      return;
    }
    setScores(scores.filter((s) => s.id !== id));
    if (editingId === id) setEditingId(null);
  };

  // ── 통계 차트 데이터 (기록순) ──
  const labels = scores.map((s) => s.testName);
  const chartData = {
    labels,
    datasets: [
      {
        label: '원점수',
        data: scores.map((s) => s.rawScore),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        yAxisID: 'y',
        spanGaps: true,
      },
      {
        label: '등급',
        data: scores.map((s) => s.gradeRank),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y1',
        spanGaps: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    interaction: { mode: 'index' as const, intersect: false },
    stacked: false,
    plugins: {
      title: { display: true, text: `${title} - 성적 변화 추이` },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: '원점수' },
        min: 0,
        max: 100,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: '등급' },
        min: 1,
        max: 9,
        reverse: true, // 1등급이 위로
        grid: { drawOnChartArea: false },
        ticks: { stepSize: 1 },
      },
    },
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <strong>{title}</strong>
        <button
          className="btn btn-sm btn-outline-info"
          onClick={() => setShowChart((v) => !v)}
        >
          {showChart ? '통계 닫기' : '성적 통계보기'}
        </button>
      </div>
      <div className="card-body">
        {/* 성적 추가 폼 */}
        <div className="form-row align-items-end mb-3">
          <div className="col-md-3 mb-2">
            <label className="mb-1">{nameLabel}</label>
            <input
              type="text"
              className="form-control"
              value={form.testName}
              onChange={(e) => setForm({ ...form, testName: e.target.value })}
              placeholder={nameLabel}
            />
          </div>
          <div className="col-md-2 mb-2">
            <label className="mb-1">원점수</label>
            <input
              type="number"
              className="form-control"
              value={form.rawScore}
              onChange={(e) => setForm({ ...form, rawScore: e.target.value })}
              placeholder="0~100"
            />
          </div>
          <div className="col-md-2 mb-2">
            <label className="mb-1">등급</label>
            <select
              className="form-control"
              value={form.gradeRank}
              onChange={(e) => setForm({ ...form, gradeRank: e.target.value })}
            >
              <option value="">-</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                <option key={g} value={g}>{g}등급</option>
              ))}
            </select>
          </div>
          <div className="col-md-3 mb-2">
            <label className="mb-1">메모</label>
            <input
              type="text"
              className="form-control"
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="메모"
            />
          </div>
          <div className="col-md-2 mb-2">
            <button className="btn btn-primary btn-block" onClick={addScore} disabled={saving}>
              성적 추가
            </button>
          </div>
        </div>

        {/* 통계 차트 */}
        {showChart && (
          <div className="mb-3">
            {scores.length === 0 ? (
              <div className="alert alert-secondary mb-0">성적 데이터가 없습니다.</div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        )}

        {/* 성적 리스트 */}
        <table className="table table-bordered table-hover mb-0">
          <thead className="thead-light">
            <tr>
              <th>{nameLabel}</th>
              <th style={{ width: '90px' }}>원점수</th>
              <th style={{ width: '90px' }}>등급</th>
              <th>메모</th>
              <th style={{ width: '110px' }}>기록날짜</th>
              <th style={{ width: '130px' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {scores.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center">등록된 성적이 없습니다.</td>
              </tr>
            ) : (
              scores.map((s) =>
                editingId === s.id ? (
                  <tr key={s.id}>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editForm.testName}
                        onChange={(e) => setEditForm({ ...editForm, testName: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={editForm.rawScore}
                        onChange={(e) => setEditForm({ ...editForm, rawScore: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        className="form-control form-control-sm"
                        value={editForm.gradeRank}
                        onChange={(e) => setEditForm({ ...editForm, gradeRank: e.target.value })}
                      >
                        <option value="">-</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editForm.memo}
                        onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                      />
                    </td>
                    <td>{s.date}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-success mr-1"
                        onClick={() => saveEdit(s.id)}
                        disabled={saving}
                      >
                        저장
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setEditingId(null)}
                      >
                        취소
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={s.id}>
                    <td>{s.testName}</td>
                    <td>{s.rawScore == null ? '-' : s.rawScore}</td>
                    <td>{s.gradeRank == null ? '-' : `${s.gradeRank}등급`}</td>
                    <td title={s.memo || ''}>
                      {s.memo && s.memo.length > MEMO_PREVIEW_LEN
                        ? `${s.memo.slice(0, MEMO_PREVIEW_LEN)}...`
                        : s.memo || '-'}
                    </td>
                    <td>{s.date}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning mr-1"
                        onClick={() => startEdit(s)}
                      >
                        수정
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => removeScore(s.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
