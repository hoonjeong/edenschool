import pool from '../db';
import type { TestInfo, TestPlan, AnswerInfo, StudentTestResult, TestAnalResult, TestAnalInfo, TestResultManager } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

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

// ROOT: selectAnswerInfoById
export async function selectAnswerInfoById(testInfoId: number): Promise<AnswerInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM answer_info WHERE test_info_id=?`,
    [testInfoId]
  );
  return rows as AnswerInfo[];
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

// ROOT: checkExistAnswer
export async function checkExistAnswer(testInfoId: number, studentId: number, num: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT count(0) as cnt FROM student_test_result WHERE test_info_id=? AND student_id=? AND num=?`,
    [testInfoId, studentId, num]
  );
  return rows[0].cnt > 0;
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

// ROOT: selectTestAnalResult
export async function selectTestAnalResult(studentId: number): Promise<TestAnalResult[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT type, count(0) as count, sum(str.answer=ai.answer) as correctCount, round(sum(str.answer=ai.answer)/count(0), 2)*100 as rate
     FROM student_test_result str, answer_info ai
     WHERE str.student_id=? AND ai.test_info_id=str.test_info_id AND ai.num=str.num
     GROUP BY type`,
    [studentId]
  );
  return rows as TestAnalResult[];
}

// Admin: selectTestInfoTen
export async function selectTestInfoTen(): Promise<TestInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM test_info ORDER BY id DESC LIMIT 10`
  );
  return rows as TestInfo[];
}

// Admin: selectTestInfoAll
export async function selectTestInfoAll(): Promise<TestInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM test_info ORDER BY id DESC`
  );
  return rows as TestInfo[];
}

// Admin: selectTestInfoById
export async function selectTestInfoById(id: number): Promise<TestInfo | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM test_info WHERE id=?`,
    [id]
  );
  return (rows[0] as TestInfo) || null;
}

// Admin: insertTestInfo
export async function insertTestInfo(name: string, description: string, count: number, fileId: number): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO test_info (name, description, count, file_id, insert_time) VALUES (?,?,?,?,now())`,
    [name, description, count, fileId]
  );
  return result.insertId;
}

// Admin: insertAnswerInfo
export async function insertAnswerInfo(testInfoId: number, num: number, answer: number, score: number, type: number): Promise<void> {
  await pool.query(
    `INSERT INTO answer_info (test_info_id, num, answer, score, type) VALUES (?,?,?,?,?)`,
    [testInfoId, num, answer, score, type]
  );
}

// Admin: insertTestPlan
export async function insertTestPlan(subject: string, description: string, testInfoId: number, classId: number, date: string): Promise<void> {
  await pool.query(
    `INSERT INTO test_plan (subject, description, test_info_id, class_id, date) VALUES (?,?,?,?,?)`,
    [subject, description, testInfoId, classId, date]
  );
}

// Admin: selectTestPlanListById
export async function selectTestPlanListById(id: number): Promise<TestPlan[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT tp.id, tp.date, tp.subject, tp.class_id as classId, ci.name as className FROM test_plan tp, class_info ci WHERE tp.test_info_id=? AND ci.id=tp.class_id`,
    [id]
  );
  return rows as TestPlan[];
}

// Admin: selectTestPlanListByTeacherName
export async function selectTestPlanListByTeacherName(name: string): Promise<TestPlan[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT tp.id, tp.date, tp.subject, tp.class_id as classId, ci.name as className FROM test_plan tp, class_info ci WHERE (ci.teacherOne=? OR ci.teacherTwo=?) AND tp.class_id=ci.id ORDER BY id DESC`,
    [name, name]
  );
  return rows as TestPlan[];
}

// Admin: selectTestPlanByIdAdmin
export async function selectTestPlanByIdAdmin(id: number): Promise<TestPlan | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT tp.id, tp.test_info_id as testInfoId, tp.subject, tp.date, ci.name as className FROM test_plan tp, class_info ci WHERE tp.id=? AND ci.id=tp.class_id`,
    [id]
  );
  return (rows[0] as TestPlan) || null;
}

// Admin: selectTestResultManager
export async function selectTestResultManager(planId: number): Promise<TestResultManager[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT tb.id as testPlanId, tb.class_id as classId, tb.class_name as className, tb.student_id as studentId, tb.student_name as studentName, tb.test_info_id as testInfoId, tb.num, tb.answer as correctAnswer, str.answer as studentAnswer, str.insert_time as insertTime
     FROM (SELECT tp.id, cs.class_id, ci.name as class_name, cs.student_id, ai.test_info_id, ai.num, ai.answer, s.name as student_name FROM test_plan tp, answer_info ai, class_status cs, student s, class_info ci WHERE tp.id=? AND ai.test_info_id=tp.test_info_id AND cs.class_id=tp.class_id AND cs.status=1 AND s.id=cs.student_id AND ci.id=cs.class_id) as tb
     LEFT JOIN student_test_result str ON str.student_id=tb.student_id AND str.test_info_id=tb.test_info_id AND str.num=tb.num
     ORDER BY tb.student_id ASC, tb.num ASC`,
    [planId]
  );
  return rows as TestResultManager[];
}

// Admin: selectStudentTestResultGroupbyType
export async function selectStudentTestResultGroupbyType(id: number): Promise<TestAnalInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT type, count(0) as count, sum(if(correct_answer=student_answer, 1, 0)) as correctAnswer, round(sum(if(correct_answer=student_answer, 1, 0))/count(0)*100) as rate
     FROM (SELECT tb.id as test_plan_id, tb.class_id, tb.student_id, tb.student_name, tb.test_info_id, tb.type, tb.num, tb.answer as correct_answer, str.answer as student_answer, str.insert_time
       FROM (SELECT ai.type, tp.id, cs.class_id, cs.student_id, ai.test_info_id, ai.num, ai.answer, s.name as student_name FROM test_plan tp, answer_info ai, class_status cs, student s WHERE cs.student_id=? AND cs.status=1 AND tp.class_id=cs.class_id AND ai.test_info_id=tp.test_info_id AND s.id=cs.student_id) as tb
       LEFT JOIN student_test_result str ON str.student_id=tb.student_id AND str.test_info_id=tb.test_info_id AND str.num=tb.num
       ORDER BY tb.student_id ASC, tb.num ASC) as tb2
     GROUP BY type`,
    [id]
  );
  return rows as TestAnalInfo[];
}

// Admin: selectStudentTestPlanResult
export async function selectStudentTestPlanResult(id: number): Promise<TestAnalInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT cs.student_id as studentId, tp.id as testPlanId, tp.subject as testName, count(0) as count, sum(if(ai.answer=str.answer, 1, 0)) as correctAnswer, round(sum(if(ai.answer=str.answer, 1, 0))/count(0)*100) as rate
     FROM test_plan tp, class_status cs, student_test_result str, answer_info ai
     WHERE cs.student_id=? AND tp.class_id=cs.class_id AND str.student_id=cs.student_id AND str.test_info_id=tp.test_info_id AND cs.status=1 AND ai.test_info_id=tp.test_info_id AND ai.num=str.num
     GROUP BY tp.id`,
    [id]
  );
  return rows as TestAnalInfo[];
}

// Admin: selectTeacherTestResultManagerByPlanId
export async function selectTeacherTestResultManagerByPlanId(planId: number): Promise<TestAnalInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT student_name as studentName, count(0) as count, sum(correct_answer=student_answer) as correctAnswer, round(sum(correct_answer=student_answer)/count(0), 2)*100 as rate
     FROM (SELECT tb.id as test_plan_id, tb.class_id, tb.student_id, tb.student_name, tb.test_info_id, tb.num, tb.answer as correct_answer, str.answer as student_answer, str.insert_time
       FROM (SELECT tp.id, cs.class_id, cs.student_id, ai.test_info_id, ai.num, ai.answer, s.name as student_name FROM test_plan tp, answer_info ai, class_status cs, student s WHERE tp.id=? AND ai.test_info_id=tp.test_info_id AND cs.class_id=tp.class_id AND cs.status=1 AND s.id=cs.student_id) as tb
       LEFT JOIN student_test_result str ON str.student_id=tb.student_id AND str.test_info_id=tb.test_info_id AND str.num=tb.num
       ORDER BY tb.student_id ASC, tb.num ASC) tb2
     GROUP BY student_name`,
    [planId]
  );
  return rows as TestAnalInfo[];
}

// Admin: selectTeacherTestResultManagerByClassId
export async function selectTeacherTestResultManagerByClassId(id: number): Promise<TestAnalInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT student_id as studentId, student_name as studentName, count(0) as count, sum(correct_answer=student_answer) as correctAnswer, round(sum(correct_answer=student_answer)/count(0), 2)*100 as rate
     FROM (SELECT tb.id as test_plan_id, tb.class_id, tb.student_id, tb.student_name, tb.test_info_id, tb.num, tb.answer as correct_answer, str.answer as student_answer, str.insert_time
       FROM (SELECT tp.id, cs.class_id, cs.student_id, ai.test_info_id, ai.num, ai.answer, s.name as student_name FROM test_plan tp, answer_info ai, class_status cs, student s WHERE tp.class_id=? AND ai.test_info_id=tp.test_info_id AND cs.class_id=tp.class_id AND cs.status=1 AND s.id=cs.student_id) as tb
       LEFT JOIN student_test_result str ON str.student_id=tb.student_id AND str.test_info_id=tb.test_info_id AND str.num=tb.num
       ORDER BY tb.student_id ASC, tb.num ASC) tb2
     GROUP BY student_id`,
    [id]
  );
  return rows as TestAnalInfo[];
}
