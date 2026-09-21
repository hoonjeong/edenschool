/**
 * 커리어넷 Open API(V4.1.2) 서버 전용 클라이언트.
 *
 * - API 키는 서버에서만 쓴다. 브라우저는 /career 페이지(서버 컴포넌트)나 /api/career 를 거친다.
 * - 학과·직업·학교·상담·자료는 자주 바뀌지 않아 Next.js fetch 캐시로 1주일 보관한다.
 *   심리검사 결과 요청만 실시간(no-store)이다.
 * - 응답 필드명은 매뉴얼과 실제 응답을 대조해 정리했다. 매뉴얼과 다른 점:
 *     · 직업 상세(job.json)의 seq 파라미터에는 목록의 `seq`가 아니라 `job_cd`를 넣어야 내용이 온다.
 *     · 상담사례 상세(COUNSEL_VIEW)는 con_cd 외에 gubun 도 함께 넘겨야 한다.
 */

const BASE = 'https://www.career.go.kr';
const WEEK = 7 * 24 * 60 * 60;
const DAY = 24 * 60 * 60;

export class CareernetError extends Error {}

function apiKey(): string {
  const key = process.env.CAREERNET_API_KEY;
  if (!key) throw new CareernetError('CAREERNET_API_KEY 가 설정되지 않았습니다.');
  return key;
}

async function getJson<T>(url: string, revalidate: number | false): Promise<T> {
  const res = await fetch(url, revalidate === false ? { cache: 'no-store' } : { next: { revalidate } });
  if (!res.ok) throw new CareernetError(`커리어넷 API 응답 오류 (${res.status})`);
  return (await res.json()) as T;
}

type Params = Record<string, string | number | undefined>;

function withParams(path: string, params: Params, keyName = 'apiKey'): string {
  const u = new URL(BASE + path);
  u.searchParams.set(keyName, apiKey());
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') u.searchParams.set(k, String(v));
  }
  return u.toString();
}

/* ───────────────── getOpenApi 공통 (학교·학과·상담·자료) ───────────────── */

interface OpenApiEnvelope<T> {
  dataSearch?: { content: T[] };
  result?: { content: { code: string; message: string }[] };
}

async function openApi<T>(svcCode: string, params: Params, revalidate: number | false = WEEK): Promise<T[]> {
  const url = withParams('/cnet/openapi/getOpenApi.json', { svcType: 'api', contentType: 'json', svcCode, ...params });
  const data = await getJson<OpenApiEnvelope<T>>(url, revalidate);
  if (data.result?.content?.[0]) {
    const err = data.result.content[0];
    throw new CareernetError(`커리어넷 API 오류 [${err.code}] ${err.message}`);
  }
  return data.dataSearch?.content ?? [];
}

/* ───────────────── 학과정보 ───────────────── */

export interface MajorListItem {
  majorSeq: string;
  lClass: string; // 계열
  mClass: string; // 학과명
  facilName: string; // 세부학과명(쉼표 구분)
  totalCount: string;
}

export interface SubjectGroup {
  subject_name: string; // "일반 선택" | "진로 선택" | "융합 선택" | "[출처 : ...]"
  subject_description: string | null;
}

export interface ChartItem {
  item: string;
  data: string;
  name: string;
}

export interface MajorDetail {
  major: string;
  salary?: string;
  employment?: string;
  department?: string;
  summary?: string;
  relate_subject?: SubjectGroup[];
  relate_subject_2022?: SubjectGroup[];
  career_act?: { act_name: string; act_description: string | null }[];
  job?: string;
  qualifications?: string;
  interest?: string;
  property?: string;
  enter_field?: { gradeuate: string; description: string }[];
  main_subject?: { SBJECT_NM: string; SBJECT_SUMRY: string }[];
  university?: { area: string; schoolURL: string; campus_nm: string; majorName: string; schoolName: string }[];
  chartData?: {
    gender?: ChartItem[];
    field?: ChartItem[];
    after_graduation?: ChartItem[];
    avg_salary?: ChartItem[];
    satisfaction?: ChartItem[];
    employment_rate?: ChartItem[];
    applicant?: ChartItem[];
  }[];
}

export async function searchMajors(opts: { q?: string; subject?: string; page?: number; perPage?: number } = {}) {
  return openApi<MajorListItem>('MAJOR', {
    gubun: 'univ_list',
    searchTitle: opts.q?.trim(),
    subject: opts.subject,
    thisPage: opts.page ?? 1,
    perPage: opts.perPage ?? 30,
  });
}

export async function getMajor(majorSeq: string): Promise<MajorDetail | null> {
  const rows = await openApi<MajorDetail>('MAJOR_VIEW', { gubun: 'univ_list', majorSeq });
  return rows[0] ?? null;
}

/** 특성화고 학과 */
export interface HighMajorDetail {
  major: string;
  department?: string;
  summary?: string;
  purpose?: string;
  interest?: string;
  relatedjob?: string;
  setshl?: { area: string; schoolURL: string; majorName: string; schoolName: string }[];
}

export async function listHighMajors() {
  return openApi<MajorListItem>('MAJOR', { gubun: 'high_list', thisPage: 1, perPage: 200 });
}

export async function getHighMajor(majorSeq: string): Promise<HighMajorDetail | null> {
  const rows = await openApi<HighMajorDetail>('MAJOR_VIEW', { gubun: 'high_list', majorSeq });
  return rows[0] ?? null;
}

/* ───────────────── 학교정보 ───────────────── */

export interface SchoolItem {
  seq: string;
  schoolName: string;
  schoolGubun: string; // 일반고 | 특성화고 | 특수목적고 | 자율고 ...
  schoolType: string;
  estType: string; // 공립 | 사립
  adres: string;
  link: string;
  region: string;
}

/** 지역 코드: 경기도 100276, 서울 100260 */
export async function listHighSchools(region = '100276') {
  return openApi<SchoolItem>('SCHOOL', { gubun: 'high_list', region, thisPage: 1, perPage: 1000 });
}

/* ───────────────── 진로상담사례 ───────────────── */

export interface CounselItem {
  code: string; // 질문코드 (상세 con_cd)
  gubun: string; // 분류코드 (A01, B01, C0101.., D.., E..)
  memo: string; // 질문 요약
}

export interface CounselDetail {
  gubun: string;
  question: string;
  answer: string; // HTML(<BR>, &nbsp;) 포함
}

export async function listCounsels() {
  return openApi<CounselItem>('COUNSEL', {});
}

export async function getCounsel(code: string, gubun: string): Promise<CounselDetail | null> {
  const rows = await openApi<CounselDetail>('COUNSEL_VIEW', { con_cd: code, gubun });
  return rows[0] ?? null;
}

/* ───────────────── 진로교육자료 ───────────────── */

export interface CoseItem {
  seq: string;
  dataTitle: string;
  author: string;
  year: string;
  regDate: string;
  activityType: string;
  achieveType: string;
  targt: string; // M 중학교 | H/I 고등학교 | C 공통 ...
  selCount: string;
  attFile: string; // 다운로드 URL 쉼표 구분
  totalCount?: string;
}

export async function listCose(opts: { targt?: string; activityType?: string; page?: number; perPage?: number } = {}) {
  return openApi<CoseItem>('COSE', {
    Tagrt: opts.targt,
    activityType: opts.activityType,
    thisPage: opts.page ?? 1,
    perPage: opts.perPage ?? 20,
  });
}

/* ───────────────── 직업백과 ───────────────── */

export interface JobListItem {
  job_cd: number; // 상세 조회 키
  seq: number;
  job_nm: string;
  work: string;
  aptit_name: string; // 적성유형명
  top_nm: string; // 직업분류명
  rel_job_nm?: string;
  wage?: string;
  wlb?: string;
  social?: string;
  views?: number;
}

export interface JobsResponse {
  count: number;
  pageSize: number;
  pageIndex: number;
  jobs: JobListItem[];
}

export async function searchJobs(opts: { q?: string; theme?: string; aptd?: string; jobCd?: string; page?: number } = {}) {
  const url = withParams('/cnet/front/openapi/jobs.json', {
    searchJobNm: opts.q?.trim(),
    searchThemeCode: opts.theme,
    searchAptdCodes: opts.aptd,
    searchJobCd: opts.jobCd,
    pageIndex: opts.page ?? 1,
  });
  const data = await getJson<Partial<JobsResponse>>(url, WEEK);
  return { count: data.count ?? 0, pageSize: data.pageSize ?? 10, pageIndex: data.pageIndex ?? 1, jobs: data.jobs ?? [] };
}

export interface ImportanceItem {
  importance: number;
  inform: string;
  source?: string;
}

export interface JobDetail {
  baseInfo: {
    job_cd: number;
    job_nm: string;
    aptit_name?: string;
    rel_job_nm?: string;
    wage?: string;
    wage_source?: string;
    satisfication?: number;
    satisfi_source?: string;
    wlb?: string;
    social?: string;
    tag?: string;
    views?: number;
  } | null;
  workList: { work: string }[];
  interestList: { interest: string }[];
  researchList: { research: string }[];
  forecastList: { forecast: string }[];
  performList: {
    perform: (ImportanceItem & { perform: string })[];
    knowledge: (ImportanceItem & { knowledge: string })[];
    environment: (ImportanceItem & { environment: string })[];
  };
  abilityList: { ability_name: string }[];
  aptitudeList: { aptitude: string }[];
  departList: { depart_id: number; depart_name: string }[];
  tagList: string[];
  certiList: { certi: string }[];
  relVideoList: { video_name: string; OUTPATH3: string; video_id: number }[];
  jobReadyList: {
    recruit: { recruit: string }[];
    certificate: { certificate: string }[];
    training: { training: string }[];
    curriculum: { curriculum: string }[];
  };
  jobRelOrgList: { rel_org: string; rel_org_url: string }[];
  indicatorChart: { indicator: string; indicator_data: string }[];
  majorChart: { major: string; major_data: string; source: string }[];
}

export async function getJob(jobCd: string | number): Promise<JobDetail | null> {
  const url = withParams('/cnet/front/openapi/job.json', { seq: jobCd });
  const data = await getJson<Partial<JobDetail>>(url, WEEK);
  // 없는 코드는 200 응답에 baseInfo:null 로 온다.
  if (!data.baseInfo) return null;
  return {
    baseInfo: data.baseInfo,
    workList: data.workList ?? [],
    interestList: data.interestList ?? [],
    researchList: data.researchList ?? [],
    forecastList: data.forecastList ?? [],
    performList: {
      perform: data.performList?.perform ?? [],
      knowledge: data.performList?.knowledge ?? [],
      environment: data.performList?.environment ?? [],
    },
    abilityList: data.abilityList ?? [],
    aptitudeList: data.aptitudeList ?? [],
    departList: data.departList ?? [],
    tagList: (data.tagList ?? []).map((t) => t.trim()).filter(Boolean),
    certiList: data.certiList ?? [],
    relVideoList: data.relVideoList ?? [],
    jobReadyList: {
      recruit: data.jobReadyList?.recruit ?? [],
      certificate: data.jobReadyList?.certificate ?? [],
      training: data.jobReadyList?.training ?? [],
      curriculum: data.jobReadyList?.curriculum ?? [],
    },
    jobRelOrgList: data.jobRelOrgList ?? [],
    indicatorChart: data.indicatorChart ?? [],
    majorChart: data.majorChart ?? [],
  };
}

/* ───────────────── 진로심리검사 ───────────────── */

/** v1 문항 (직업가치관·적성·성숙도·개발역량) */
export interface V1Question {
  qitemNo: number;
  question: string;
  answer01: string | null;
  answer02: string | null;
  answer03: string | null;
  answer04: string | null;
  answer05: string | null;
  answer06: string | null;
  answer07: string | null;
  answer08: string | null;
  answer09: string | null;
  answer10: string | null;
  answerScore01: string | null;
  answerScore02: string | null;
  answerScore03: string | null;
  answerScore04: string | null;
  answerScore05: string | null;
  answerScore06: string | null;
  answerScore07: string | null;
  answerScore08: string | null;
  answerScore09: string | null;
  answerScore10: string | null;
  tip1Score: string | null;
  tip2Score: string | null;
  tip3Score: string | null;
  tip1Desc: string | null;
  tip2Desc: string | null;
  tip3Desc: string | null;
}

interface V1Envelope<T> {
  SUCC_YN: 'Y' | 'N';
  ERROR_REASON: string;
  RESULT: T;
}

export async function getTestQuestionsV1(q: string): Promise<V1Question[]> {
  const url = withParams('/inspct/openapi/test/questions', { q }, 'apikey');
  const data = await getJson<V1Envelope<V1Question[]>>(url, DAY);
  if (data.SUCC_YN !== 'Y') throw new CareernetError(data.ERROR_REASON || '문항을 불러오지 못했습니다.');
  return data.RESULT;
}

export interface V1ReportRequest {
  qestrnSeq: string;
  trgetSe: string;
  gender: string;
  grade: string;
  startDtm: number;
  answers: string; // "1=5 2=4 ..."
}

export async function submitReportV1(req: V1ReportRequest): Promise<{ inspctSeq: number; url: string }> {
  const res = await fetch(BASE + '/inspct/openapi/test/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apikey: apiKey(), name: '', school: '', email: '', ...req }),
    cache: 'no-store',
  });
  if (!res.ok) throw new CareernetError(`커리어넷 API 응답 오류 (${res.status})`);
  const data = (await res.json()) as V1Envelope<{ inspctSeq: number; url: string }>;
  if (data.SUCC_YN !== 'Y') throw new CareernetError(data.ERROR_REASON || '결과를 받지 못했습니다.');
  return data.RESULT;
}

/** v2 (직업흥미검사 H) */
export interface V2TestInfo {
  qno: number;
  name: string;
  description: string;
  summary: string;
  maker: string;
  exectime: number;
  qcount: number;
}

export interface V2Question {
  no: string;
  limit: string; // 답변 수
  text: string;
  title?: string; // 상위 지시문
  choices: { val: string; text: string; type: 'M' | 'I' }[];
}

interface V2Envelope<T> {
  result: T;
  success: 'Y' | 'N';
  message: string;
}

export async function listTestsV2(): Promise<V2TestInfo[]> {
  const url = withParams('/inspct/openapi/v2/tests', {}, 'apikey');
  const data = await getJson<V2Envelope<V2TestInfo[]>>(url, DAY);
  if (data.success !== 'Y') throw new CareernetError(data.message || '검사 목록을 불러오지 못했습니다.');
  return data.result;
}

export async function getTestQuestionsV2(q: string): Promise<{ qnm: string; summary: string; etime: string; questions: V2Question[] }> {
  const url = withParams('/inspct/openapi/v2/test', { q }, 'apikey');
  const data = await getJson<V2Envelope<{ qnm: string; summary: string; etime: string; questions: V2Question[] }>>(url, DAY);
  if (data.success !== 'Y') throw new CareernetError(data.message || '문항을 불러오지 못했습니다.');
  return data.result;
}

export interface V2ReportRequest {
  qno: number;
  trgetse: string;
  gender: string;
  grade: string;
  startdtm: number;
  answers: { no: string; val: string }[];
}

export async function submitReportV2(req: V2ReportRequest): Promise<{ url: string; inspctseq?: number }> {
  const res = await fetch(BASE + '/inspct/openapi/v2/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apikey: apiKey(), name: '', school: '', email: '', ...req }),
    cache: 'no-store',
  });
  if (!res.ok) throw new CareernetError(`커리어넷 API 응답 오류 (${res.status})`);
  const data = (await res.json()) as V2Envelope<{ inspct?: { reporturl?: string; inspctseq?: number }; url?: string; reporturl?: string }>;
  if (data.success !== 'Y') throw new CareernetError(data.message || '결과를 받지 못했습니다.');
  const r = data.result ?? {};
  const url = r.url || r.reporturl || r.inspct?.reporturl;
  if (!url) throw new CareernetError('결과 페이지 주소가 응답에 없습니다.');
  return { url, inspctseq: r.inspct?.inspctseq };
}

/* ───────────────── 유틸 ───────────────── */

/** 커리어넷 텍스트에 섞여 오는 <br>, &nbsp; 등을 정리 */
export function cleanText(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r/g, '')
    .trim();
}

/** "a, b, c 등" 형태의 과목 문자열을 배열로 */
export function splitList(s: string | null | undefined): string[] {
  if (!s) return [];
  return cleanText(s)
    .replace(/\s*등\s*$/, '')
    .split(/[,，]/)
    .map((x) => x.trim())
    .filter(Boolean);
}
