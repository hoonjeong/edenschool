import pool from '../db';
import type { TestPlan, StudentTestResult } from '../types';
import type { RowDataPacket } from 'mysql2';

// ROOT: selectTestPlanByStudentId
export async function selectTestPlanByStudentId(studentId: number): Promise<TestPlan[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT tp.id, tp.date, tp.subject, tp.test_info_id as testInfoId, tp.class_id as classId, ti.count,
       (SELECT sum(str.answer=ai.answer) FROM student_test_result str, answer_info ai WHERE str.student_id=? AND str.test_info_id=tp.test_info_id AND ai.test_info_id=str.test_info_id AND ai.num=str.num) as correctCount,
       (SELECT count(0) FROM student_test_result str WHERE str.student_id=? AND str.test_info_id=tp.test_info_id) as resultCount
     FROM test_plan tp, class_status cs, test_info ti
     WHERE cs.student_id=? AND (cs.end_time>tp.date OR cs.end_time IS NULL) AND tp.class_id=cs.class_id AND ti.id=tp.test_info_id
     ORDER BY tp.date DESC`,
    [studentId, studentId, studentId]
  );
  return rows as TestPlan[];
}

// ROOT: selectTestPlanById
export async function selectTestPlanById(id: number): Promise<TestPlan | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT tp.id, tp.test_info_id as testInfoId, tp.subject, tp.date, ti.file_id as fileId FROM test_plan tp, test_info ti WHERE tp.id=? AND ti.id=tp.test_info_id`,
    [id]
  );
  return (rows[0] as TestPlan) || null;
}

// ROOT: selectStudentTestResultById
export async function selectStudentTestResultById(studentId: number, testInfoId: number): Promise<StudentTestResult[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ai.test_info_id as testInfoId, ai.num, ai.answer, str.answer as resultAnswer
     FROM answer_info ai
     LEFT JOIN student_test_result str ON str.student_id=? AND str.test_info_id=ai.test_info_id AND str.num=ai.num
     WHERE ai.test_info_id=?
     ORDER BY num ASC`,
    [studentId, testInfoId]
  );
  return rows as StudentTestResult[];
}

// ROOT + Admin: insertTestResult
export async function insertTestResult(testInfoId: number, studentId: number, num: number, answer: number): Promise<void> {
  await pool.query(
    `INSERT INTO student_test_result (test_info_id, student_id, num, answer, insert_time)
     SELECT ?, ?, ?, ?, now() FROM dual
     WHERE NOT EXISTS (SELECT * FROM student_test_result WHERE test_info_id=? AND student_id=? AND num=? AND answer=?)`,
    [testInfoId, studentId, num, answer, testInfoId, studentId, num, answer]
  );
}

// ROOT: selectTestAver
export async function selectTestAver(testInfoId: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT round(avg(correct),2) as av FROM
     (SELECT tb.student_id, sum(correct) as correct FROM
       (SELECT str.student_id, ai.answer as correct_answer, str.answer as student_answer, str.answer=ai.answer as correct
        FROM student_test_result str, answer_info ai WHERE str.test_info_id=? AND ai.test_info_id=str.test_info_id AND ai.num=str.num) as tb
      GROUP BY tb.student_id) as tb2`,
    [testInfoId]
  );
  return rows[0]?.av || 0;
}

// ROOT: selectTestClassAver
export async function selectTestClassAver(testInfoId: number, classId: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT round(avg(correct),2) as av FROM
     (SELECT tb.student_id, sum(correct) as correct FROM
       (SELECT str.student_id, ai.answer as correct_answer, str.answer as student_answer, str.answer=ai.answer as correct
        FROM student_test_result str, answer_info ai, test_plan tp, class_status cs
        WHERE tp.test_info_id=? AND tp.class_id=? AND cs.class_id=tp.class_id AND str.student_id=cs.student_id AND str.test_info_id=tp.test_info_id AND ai.test_info_id=str.test_info_id AND ai.num=str.num AND (cs.end_time>tp.date OR cs.end_time IS NULL)) as tb
      GROUP BY tb.student_id) as tb2`,
    [testInfoId, classId]
  );
  return rows[0]?.av || 0;
}
