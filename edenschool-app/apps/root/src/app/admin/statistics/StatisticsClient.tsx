'use client';

import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import Link from 'next/link';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Student {
  id: number;
  name: string;
  school: string;
  grade: string;
  year: string;
  date: string;
}

interface StatisticsClientProps {
  newStudents: Student[];
  reStudents: Student[];
  exitStudents: Student[];
  months: string[];
  newResult: number[];
  exitResult: number[];
  gradeKey: string[];
  gradeVal: number[];
  studentKey: string[];
  studentVal: number[];
}

const PIE_COLORS = [
  'rgba(255, 99, 132, 0.7)',
  'rgba(54, 162, 235, 0.7)',
  'rgba(255, 206, 86, 0.7)',
  'rgba(75, 192, 192, 0.7)',
  'rgba(153, 102, 255, 0.7)',
  'rgba(255, 159, 64, 0.7)',
  'rgba(199, 199, 199, 0.7)',
  'rgba(83, 102, 255, 0.7)',
  'rgba(255, 99, 255, 0.7)',
  'rgba(99, 255, 132, 0.7)',
  'rgba(235, 162, 54, 0.7)',
  'rgba(86, 206, 255, 0.7)',
];

const PIE_BORDER_COLORS = [
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
  'rgba(199, 199, 199, 1)',
  'rgba(83, 102, 255, 1)',
  'rgba(255, 99, 255, 1)',
  'rgba(99, 255, 132, 1)',
  'rgba(235, 162, 54, 1)',
  'rgba(86, 206, 255, 1)',
];

function StudentTable({ students }: { students: Student[] }) {
  if (students.length === 0) {
    return <p className="text-muted text-center py-3">데이터가 없습니다.</p>;
  }

  return (
    <table className="table table-sm table-hover mb-0">
      <thead>
        <tr>
          <th>이름</th>
          <th>학교/학년</th>
          <th>날짜</th>
        </tr>
      </thead>
      <tbody>
        {students.map((s, i) => (
          <tr key={`${s.id}-${i}`}>
            <td>
              <Link href={`/admin/student-info?id=${s.id}`}>{s.name}</Link>
            </td>
            <td>
              {s.school} {s.grade}
              {s.year}
            </td>
            <td>{s.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function StatisticsClient({
  newStudents,
  reStudents,
  exitStudents,
  months,
  newResult,
  exitResult,
  gradeKey,
  gradeVal,
  studentKey,
  studentVal,
}: StatisticsClientProps) {
  const [openNew, setOpenNew] = useState(true);
  const [openRe, setOpenRe] = useState(false);
  const [openExit, setOpenExit] = useState(false);

  return (
    <div>
      {/* Charts Section */}
      <div className="row mb-4">
        {/* Line Chart - Monthly Trend */}
        <div className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-header">
              <h6 className="card-title mb-0">월별 신규+재원 / 퇴원 추이</h6>
            </div>
            <div className="card-body">
              <Line
                data={{
                  labels: months,
                  datasets: [
                    {
                      label: '월별 신규+재원',
                      data: newResult,
                      borderColor: 'rgba(54, 162, 235, 1)',
                      backgroundColor: 'rgba(54, 162, 235, 1)',
                      fill: false,
                      borderWidth: 2,
                    },
                    {
                      label: '월별 퇴원',
                      data: exitResult,
                      borderColor: 'rgba(255, 99, 132, 1)',
                      backgroundColor: 'rgba(255, 99, 132, 1)',
                      fill: false,
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    tooltip: { mode: 'index', intersect: false },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Bar Chart - Monthly Comparison */}
        <div className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-header">
              <h6 className="card-title mb-0">월별 신규+재원 / 퇴원 비교</h6>
            </div>
            <div className="card-body">
              <Bar
                data={{
                  labels: months,
                  datasets: [
                    {
                      label: '신규+재원',
                      data: newResult,
                      backgroundColor: 'rgba(54, 162, 235, 0.7)',
                      borderColor: 'rgba(54, 162, 235, 1)',
                      borderWidth: 1,
                    },
                    {
                      label: '퇴원',
                      data: exitResult,
                      backgroundColor: 'rgba(255, 99, 132, 0.7)',
                      borderColor: 'rgba(255, 99, 132, 1)',
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    tooltip: { mode: 'index', intersect: false },
                  },
                  scales: {
                    y: { beginAtZero: true },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Pie Chart - Grade Distribution */}
        <div className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-header">
              <h6 className="card-title mb-0">학년별 재원생 분포</h6>
            </div>
            <div className="card-body d-flex justify-content-center">
              <div style={{ maxWidth: 400 }}>
                <Pie
                  data={{
                    labels: gradeKey,
                    datasets: [
                      {
                        data: gradeVal,
                        backgroundColor: PIE_COLORS.slice(0, gradeKey.length),
                        borderColor: PIE_BORDER_COLORS.slice(0, gradeKey.length),
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'right' },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart - Student Analysis */}
        <div className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-header">
              <h6 className="card-title mb-0">최근 1개월 학생 분석</h6>
            </div>
            <div className="card-body d-flex justify-content-center">
              <div style={{ maxWidth: 400 }}>
                <Pie
                  data={{
                    labels: studentKey,
                    datasets: [
                      {
                        data: studentVal,
                        backgroundColor: PIE_COLORS.slice(0, studentKey.length),
                        borderColor: PIE_BORDER_COLORS.slice(0, studentKey.length),
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'right' },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Lists Section */}
      <div className="row">
        <div className="col-12">
          {/* New Students */}
          <div className="card mb-3">
            <div
              className="card-header d-flex justify-content-between align-items-center"
              style={{ cursor: 'pointer' }}
              onClick={() => setOpenNew(!openNew)}
            >
              <h6 className="mb-0">
                신규 학생 <span className="badge bg-primary">{newStudents.length}</span>
              </h6>
              <i className={`bi ${openNew ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </div>
            {openNew && (
              <div className="card-body p-0">
                <StudentTable students={newStudents} />
              </div>
            )}
          </div>

          {/* Re-enrolled Students */}
          <div className="card mb-3">
            <div
              className="card-header d-flex justify-content-between align-items-center"
              style={{ cursor: 'pointer' }}
              onClick={() => setOpenRe(!openRe)}
            >
              <h6 className="mb-0">
                재원 학생 <span className="badge bg-success">{reStudents.length}</span>
              </h6>
              <i className={`bi ${openRe ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </div>
            {openRe && (
              <div className="card-body p-0">
                <StudentTable students={reStudents} />
              </div>
            )}
          </div>

          {/* Exit Students */}
          <div className="card mb-3">
            <div
              className="card-header d-flex justify-content-between align-items-center"
              style={{ cursor: 'pointer' }}
              onClick={() => setOpenExit(!openExit)}
            >
              <h6 className="mb-0">
                퇴원 학생 <span className="badge bg-danger">{exitStudents.length}</span>
              </h6>
              <i className={`bi ${openExit ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </div>
            {openExit && (
              <div className="card-body p-0">
                <StudentTable students={exitStudents} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
