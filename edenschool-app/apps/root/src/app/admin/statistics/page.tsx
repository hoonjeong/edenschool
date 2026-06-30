import { requireAdminSession } from '@/lib/admin-session';
import { redirect } from 'next/navigation';
import { selectNewStudentList, selectReStudentList, selectExitStudentOneMonthList } from '@edenschool/common/queries/student';
import { newStudentChart, exitStudentChart, gradeYearPieChart, studentAnalysisPieChart } from '@edenschool/common/queries/admin-user';
import StatisticsClient from './StatisticsClient';

export default async function StatisticsPage() {
  const session = await requireAdminSession();

  // Admin only - redirect non-admin users
  if (session.user.code !== 'O') {
    redirect('/admin');
  }

  // New students (last month) - insert_date == modify_date means brand new
  const newStudents = await selectNewStudentList();

  // Re-enrolled students (last month) - insert_date != modify_date means re-enrolled
  const reStudents = await selectReStudentList();

  // Exit students (last month)
  const exitStudents = await selectExitStudentOneMonthList();

  // Chart data: monthly new+re student counts (last 14 months)
  const newChartData = await newStudentChart();

  // Chart data: monthly exit student counts (last 14 months)
  const exitChartData = await exitStudentChart();

  // Grade pie chart data - original filters by grade="고" only
  const gradeData = await gradeYearPieChart();

  // Student analysis pie chart (last month)
  const analysisData = await studentAnalysisPieChart();

  // Build chart arrays
  const months: string[] = [];
  const newResult: number[] = [];
  const exitResult: number[] = [];

  // Fill 12 months
  const baseNow = new Date();
  for (let i = 11; i >= 0; i--) {
    // 1일로 고정해 월을 계산한다(말일에 setMonth가 다음 달로 넘쳐 특정 월이
    // 빠지고 중복되는 버그 방지: 예) 6/30에서 2월로 가면 3/2로 넘침).
    const d = new Date(baseNow.getFullYear(), baseNow.getMonth() - i, 1);
    const m = d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0');
    months.push(m);
    const nr = (newChartData as any[]).find(r => r.gkey === m);
    newResult.push(nr ? nr.cnt : 0);
    const er = (exitChartData as any[]).find(r => r.gkey === m);
    exitResult.push(er ? er.cnt : 0);
  }

  const gradeKey = (gradeData as any[]).map(r => r.gkey);
  const gradeVal = (gradeData as any[]).map(r => r.cnt);
  const studentKey = (analysisData as any[]).map(r => r.gkey);
  const studentVal = (analysisData as any[]).map(r => r.cnt);

  return (
    <StatisticsClient
      newStudents={newStudents as any[]}
      reStudents={reStudents as any[]}
      exitStudents={exitStudents as any[]}
      months={months}
      newResult={newResult}
      exitResult={exitResult}
      gradeKey={gradeKey}
      gradeVal={gradeVal}
      studentKey={studentKey}
      studentVal={studentVal}
    />
  );
}
