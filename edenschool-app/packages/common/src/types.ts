// Student.java
export interface Student {
  id: number;
  name: string;
  school: string;
  grade: string;
  year: number;
  sphone: string;
  pphone: string;
  address: string;
  specialty: string;
  memo: string;
  status?: number;
  insertDate?: string;
  modifyDate?: string;
  date?: string;
  classStatusId?: number;
}

// UserInfo.java
export interface UserInfo {
  id: number;
  studentId: number;
  email: string;
  pw?: string;
  code: string;
  sphone: string;
  pphone: string;
  insertTime?: string;
  name: string;
  phone?: string;
}

// AdminUserInfo.java
export interface AdminUserInfo {
  id: number;
  name: string;
  email: string;
  pw?: string;
  code: string;
  phone: string;
}

// ClassInfo.java
export interface ClassInfo {
  id: number;
  name: string;
  subject: string;
  teacherOne: string;
  teacherTwo: string;
  grade: string;
  year: string;
  day: string;
  hour: number;
  minute: number;
  price: number;
  limitCount: number;
  liveStatus: number;
  liveCount?: number;
  testCount?: number;
  code?: string;
}

// Lecture.java
export interface Lecture {
  id: number;
  subject: string;
  description: string;
  url: string;
  teacher: string;
  code: string;
  strTime?: string;
  className?: string;
  classId: number;
  insertTime?: string;
  lectureDate: string;
}

// TestInfo.java
export interface TestInfo {
  id: number;
  name: string;
  description: string;
  count: number;
  fileId: number;
  insertTime?: string;
}

// TestPlan.java
export interface TestPlan {
  id: number;
  testInfoId: number;
  classId: number;
  subject: string;
  description?: string;
  date: string;
  className?: string;
  count?: number;
  resultCount?: number;
  correctCount?: number;
  fileId?: number;
}

// AnswerInfo.java
export interface AnswerInfo {
  testInfoId: number;
  num: number;
  answer: number;
  score: number;
  type: number;
}

// StudentTestResult.java
export interface StudentTestResult {
  id?: number;
  testInfoId: number;
  studentId: number;
  num: number;
  answer: number;
  resultAnswer?: number;
  insertTime?: string;
}

// TestAnalResult.java (ROOT)
export interface TestAnalResult {
  type: number;
  count: number;
  correctCount: number;
  rate: number;
}

// TestAnalInfo.java (Admin)
export interface TestAnalInfo {
  studentId?: number;
  studentName?: string;
  testPlanId?: number;
  testName?: string;
  type?: number;
  count: number;
  correctAnswer: number;
  rate: number;
}

// TestResultManager.java (Admin)
export interface TestResultManager {
  testPlanId: number;
  classId: number;
  className?: string;
  studentId: number;
  studentName: string;
  testInfoId: number;
  num: number;
  correctAnswer: number;
  studentAnswer: number;
  insertTime?: string;
}

// PostInfo.java
export interface PostInfo {
  id: number;
  subject: string;
  contents: string;
  userId: number;
  metaKeyword?: string;
  metaDescription?: string;
  code: string;
  category?: string;
  readCount: number;
  writer?: string;
  date?: string;
  insertTime?: string;
  summary?: string;
  commentCount?: number;
}

// Comment.java
export interface Comment {
  id: number;
  text: string;
  userId: number;
  postId: number;
  insertTime?: string;
  date?: string;
  writer?: string;
}

// Question.java
export interface Question {
  id: number;
  text: string;
  userId: number;
  lectureId: number;
  insertTime?: string;
  date?: string;
  writer?: string;
  answer?: string | null;
  answerBy?: string | null;
  answerDate?: string | null;
}

// FileInfo.java
export interface FileInfo {
  id: number;
  filedata: Buffer | null;
  filename: string;
  filesize: number | null;
}

// MyDream.java
export interface MyDream {
  id: number;
  userId: number;
  name: string;
  id1: string;
  id2: string;
  type: string;
  insertTime?: string;
}

// ClassStatus.java (Admin)
export interface ClassStatus {
  id: number;
  classId: number;
  studentId: number;
  className?: string;
  status: number;
  startTime?: string;
  endTime?: string;
}

// PrevTestMetaInfo.java (Admin)
export interface PrevTestMetaInfo {
  id: number;
  region?: string;
  schoolType?: string;
  schoolName?: string;
  year?: string;
  grade?: string;
  term?: string;
  testType?: string;
  section?: string;
  publisher?: string;
  fileType?: string;
  insertTime?: string;
}

// PrevTestFileInfo.java (Admin)
export interface PrevTestFileInfo {
  id: number;
  infoId: number;
  content?: Buffer | null;
  fileName?: string;
  insertTime?: string;
}

// SplitFileMetaInfo (쪼개기 파일)
export interface SplitFileMetaInfo {
  id: number;
  grade?: string;
  subject?: string;
  publisher?: string;
  searchKeyword?: string;
  schoolName?: string;
  year?: number;
  term?: number;
  testType?: number;
  fileType?: string;
  insertTime?: string;
}

// SplitFileContent (쪼개기 파일 바이너리)
export interface SplitFileContent {
  id: number;
  metaId: number;
  fileName?: string;
  content?: Buffer | null;
  insertTime?: string;
}

// LectureProgress (수강 진도)
export interface LectureProgress {
  id: number;
  userId: number;
  lectureId: number;
  watchedSeconds: number;
  duration: number;
  percent: number;
  completed: number;
  createdAt?: string;
  updatedAt?: string;
}

// LectureProgressWithStudent (관리자용)
export interface LectureProgressWithStudent {
  id: number;
  userId: number;
  lectureId: number;
  watchedSeconds: number;
  duration: number;
  percent: number;
  completed: number;
  updatedAt?: string;
  studentName?: string;
  school?: string;
  grade?: string;
}

// LectureViewLog (영상 시청 기록)
export interface LectureViewLog {
  id: number;
  userId: number;
  lectureId: number;
  ip: string;
  deviceType: string;
  userAgent: string;
  startTime?: string;
  endTime?: string;
  startSeconds: number;
  endSeconds?: number;
  duration?: number;
}

// QnaPost (질문 게시글)
export interface QnaPost {
  id: number;
  subject: string;
  contents: string;
  userId: number;
  metaDescription?: string;
  readCount: number;
  date?: string;
  insertTime?: string;
  updateTime?: string;
  writer?: string;
  commentCount?: number;
}

// QnaComment (질문 댓글)
export interface QnaComment {
  id: number;
  text: string;
  userId: number;
  qnaPostId: number;
  insertTime?: string;
  date?: string;
  writer?: string;
}

// StudentMemo (학생 메모)
export interface StudentMemo {
  id: number;
  studentId: number;
  content: string;
  insertTime?: string;
  date?: string;
}

// StudentScore (학생 성적 - 내신/모의고사 공용)
export interface StudentScore {
  id: number;
  studentId: number;
  category: 'naesin' | 'mock';
  testName: string;
  rawScore: number | null;
  gradeRank: number | null;
  memo: string | null;
  insertTime?: string;
  date?: string;
}

// LectureViewLogWithStudent (관리자용)
export interface LectureViewLogWithStudent {
  id: number;
  userId: number;
  lectureId: number;
  ip: string;
  deviceType: string;
  startTime?: string;
  endTime?: string;
  startSeconds: number;
  endSeconds?: number;
  duration?: number;
  studentName?: string;
  school?: string;
  grade?: string;
  lectureSubject?: string;
}
