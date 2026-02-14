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

// TestAverInfo.java (ROOT)
export interface TestAverInfo {
  planId: number;
  subject: string;
  date: string;
  count: number;
  resultCount: number;
  correctCount: number;
  classAver: number;
  studentAver: number;
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

// SmsSendResult.java
export interface SmsSendResult {
  id: number;
  phone: string;
  message: string;
  type: string;
  resultCode?: string;
  resultMessage?: string;
  cmid?: string;
  sendTime?: string;
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

// ClassStudentJoinInfo.java (Admin)
export interface ClassStudentJoinInfo {
  studentId: number;
  studentName: string;
  defaultClassId?: number;
  defaultClassName?: string;
  schoolClassId?: number;
  schoolClassName?: string;
  school?: string;
  year?: number;
  className?: string;
  startTime?: string;
}

// Attendance.java (Admin)
export interface Attendance {
  id?: number;
  studentId: number;
  classId: number;
  date: string;
  day?: string;
  result?: string;
  memo?: string;
  checkTime?: string;
}

// BillInfo.java (Admin)
export interface BillInfo {
  billMonth: string;
  csid?: number;
  studentName?: string;
  className?: string;
  studentId?: number;
  bill: number;
  pay: number;
  payDate?: string;
  payType?: string;
}

// Major.java
export interface Major {
  majorCd: string;
  majorNm: string;
  majorGb: string;
  knowDtlSchDptNm?: string;
  knowSchDptNm?: string;
  empCurtState1Id?: string;
  empCurtState2Id?: string;
  knowDptId?: string;
  knowDptNm?: string;
  knowSchDptId?: string;
  schDptIntroSum?: string;
  aptdIntrstCont?: string;
  relSchDptList?: string[];
  mainSubjectList?: string;
  schDptList?: Univ[];
  relAdvanJobsList?: WorknetCarrer[];
  advncFieldCont?: string;
}

// Univ.java
export interface Univ {
  univNm: string;
  schDptNm: string;
  univUrl: string;
}

// WorknetCarrer.java
export interface WorknetCarrer {
  jobGb: number;
  jobClcd: string;
  jobClcdNM: string;
  jobCd: string;
  jobNm: string;
  jobLrclNm?: string;
  jobMdclNm?: string;
  jobSmclNm?: string;
  jobSum?: string;
  jobVideo?: string;
  way?: string;
  relJobList?: WorknetCarrer[];
  majorList?: Major[];
}

// PostFileStatus.java
export interface PostFileStatus {
  fileId: number;
  postId: number;
  insertTime?: string;
}

// FileStatus.java (Admin)
export interface FileStatus {
  fileId: number;
  lectureId: number;
  insertTime?: string;
}

// SmsMemo.java (Admin)
export interface SmsMemo {
  teacherId: number;
  memo: string;
}

// StudentAnalysis.java (Admin)
export interface StudentAnalysis {
  id?: number;
  studentId: number;
  code: string;
  insertTime?: string;
}

// Teacher.java (Admin)
export interface Teacher {
  name: string;
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

// PdfToHwp.java (Admin)
export interface PdfToHwp {
  id?: number;
  fileId: number;
  userId: number;
  work?: number;
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
