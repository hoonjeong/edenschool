/**
 * 계열별 국어 과목 지도 데이터 수집 — 커리어넷 학과정보 전체 수집 후 통계 계산.
 *
 *   pnpm tsx scripts/careernet-subject-map.ts
 *
 * 7개 계열의 대학 학과 목록(약 300개)을 받아 각 학과 상세의 relate_subject_2022 에서
 * 국어 과목이 권장되는 비율을 계산해 apps/root/src/data/careernet-subject-map.json 에 쓴다.
 * 홈페이지(/career/subject-map)는 이 파일만 읽는다 — 실시간 호출이 아니라 주 1회 정도 갱신하면 된다.
 *
 * API 키는 CAREERNET_API_KEY 환경변수 또는 apps/root/.env 에서 읽는다.
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'apps/root/src/data/careernet-subject-map.json');

const SUBJECTS = [
  { code: '100391', name: '인문계열' },
  { code: '100392', name: '사회계열' },
  { code: '100393', name: '교육계열' },
  { code: '100394', name: '공학계열' },
  { code: '100395', name: '자연계열' },
  { code: '100396', name: '의약계열' },
  { code: '100397', name: '예체능계열' },
];

// apps/root/src/lib/careernet/content.ts 의 KOREAN_SUBJECTS 와 같은 목록
const KOREAN: { name: string; track: string }[] = [
  { name: '화법과 언어', track: '일반 선택' },
  { name: '독서와 작문', track: '일반 선택' },
  { name: '문학', track: '일반 선택' },
  { name: '주제 탐구 독서', track: '진로 선택' },
  { name: '문학과 영상', track: '진로 선택' },
  { name: '직무 의사소통', track: '진로 선택' },
  { name: '독서 토론과 글쓰기', track: '융합 선택' },
  { name: '매체 의사소통', track: '융합 선택' },
  { name: '언어생활 탐구', track: '융합 선택' },
];

function loadKey(): string {
  if (process.env.CAREERNET_API_KEY) return process.env.CAREERNET_API_KEY;
  const envPath = path.join(ROOT, 'apps/root/.env');
  if (fs.existsSync(envPath)) {
    const m = fs.readFileSync(envPath, 'utf8').match(/^\s*CAREERNET_API_KEY\s*=\s*(.+)$/m);
    if (m) return m[1].trim();
  }
  throw new Error('CAREERNET_API_KEY 가 없습니다.');
}

const KEY = loadKey();
const BASE = 'https://www.career.go.kr/cnet/openapi/getOpenApi.json?apiKey=' + KEY + '&svcType=api&contentType=json';

async function get<T>(url: string, retry = 2): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (e) {
    if (retry > 0) {
      await new Promise((r) => setTimeout(r, 1500));
      return get<T>(url, retry - 1);
    }
    throw e;
  }
}

interface ListRow {
  majorSeq: string;
  mClass: string;
  lClass: string;
}
interface Detail {
  major: string;
  relate_subject_2022?: { subject_name: string; subject_description: string | null }[];
}

function norm(s: string) {
  return s.replace(/\s/g, '');
}

function splitList(s: string | null): string[] {
  if (!s) return [];
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/\s*등\s*$/, '')
    .split(/[,，]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

async function main() {
  const out: {
    generatedAt: string;
    subjects: { name: string; track: string }[];
    classes: {
      code: string;
      name: string;
      majorCount: number;
      withData: number;
      /** 과목명 → 권장 학과 수 */
      counts: Record<string, number>;
      /** 과목명 → 권장하는 학과명 목록 */
      majors: Record<string, string[]>;
    }[];
  } = { generatedAt: new Date().toISOString(), subjects: KOREAN, classes: [] };

  for (const cls of SUBJECTS) {
    const list = await get<{ dataSearch?: { content: ListRow[] } }>(`${BASE}&svcCode=MAJOR&gubun=univ_list&subject=${cls.code}&thisPage=1&perPage=500`);
    const rows = list.dataSearch?.content ?? [];
    console.log(`${cls.name}: ${rows.length}개 학과`);

    const counts: Record<string, number> = {};
    const majors: Record<string, string[]> = {};
    for (const k of KOREAN) {
      counts[k.name] = 0;
      majors[k.name] = [];
    }
    let withData = 0;

    for (const row of rows) {
      const d = await get<{ dataSearch?: { content: Detail[] } }>(`${BASE}&svcCode=MAJOR_VIEW&gubun=univ_list&majorSeq=${row.majorSeq}`);
      const detail = d.dataSearch?.content?.[0];
      const groups = detail?.relate_subject_2022 ?? [];
      const all = groups.filter((g) => !/출처/.test(g.subject_name)).flatMap((g) => splitList(g.subject_description));
      if (all.length === 0) continue;
      withData++;
      const seen = new Set<string>();
      for (const s of all) {
        const k = KOREAN.find((x) => norm(x.name) === norm(s));
        if (k && !seen.has(k.name)) {
          seen.add(k.name);
          counts[k.name]++;
          majors[k.name].push(row.mClass);
        }
      }
      await new Promise((r) => setTimeout(r, 120)); // 서버 부담을 줄인다
    }

    out.classes.push({ code: cls.code, name: cls.name, majorCount: rows.length, withData, counts, majors });
    console.log(`  자료 있는 학과 ${withData}개`, counts);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
  console.log('저장:', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
