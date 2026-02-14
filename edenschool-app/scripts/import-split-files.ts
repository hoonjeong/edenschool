import * as fs from 'fs';
import * as path from 'path';
import mysql from 'mysql2/promise';
import type { ResultSetHeader } from 'mysql2';

const BASE_DIR = path.resolve(process.env.IMPORT_SPLIT_FILES_DIR || process.argv[2] || './data/쪼개기 파일');

interface ParsedInfo {
  filePath: string;
  fileName: string;
  grade: string;
  subject: string;
  publisher: string;
  searchKeyword: string;
  schoolName: string;
  year: number;
  term: number;
  testType: number; // 1=중간, 2=기말
  fileType: string;
}

// ── 파일 수집 ──
function collectFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.hwp', '.hwpx', '.hwt'].includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

/**
 * 폴더 구조에서 grade, subject, publisher 추출
 *
 * 고1/{출판사 국어}/파일.hwp → grade="고1", folder에서 publisher+subject 추출
 * 고2/{과목}/{출판사}/파일.hwp → grade="고2", 중간폴더=subject, 리프폴더=publisher
 * 모의고사.../{과목}/파일.hwp → grade="기타", 직접 파일이면 subject 없음
 */
function getFolderInfo(filePath: string): {
  folderGrade: string;
  folderSubject: string;
  folderPublisher: string;
} {
  const relativePath = path.relative(BASE_DIR, filePath);
  const parts = relativePath.split(path.sep);

  let folderGrade = '';
  let folderSubject = '';
  let folderPublisher = '';

  if (parts.length < 2) {
    return { folderGrade: '기타', folderSubject: '', folderPublisher: '' };
  }

  const topDir = parts[0]; // 고1, 고2, 모의고사...

  if (topDir === '고1') {
    folderGrade = '고1';
    if (parts.length >= 2) {
      // 고1/{출판사 국어}/파일.hwp
      const folderName = parts[1]; // e.g. "미래엔 국어"
      const spaceIdx = folderName.lastIndexOf(' ');
      if (spaceIdx > 0) {
        folderPublisher = folderName.substring(0, spaceIdx).trim();
        folderSubject = folderName.substring(spaceIdx + 1).trim();
      } else {
        folderSubject = folderName;
      }
    }
  } else if (topDir === '고2') {
    folderGrade = '고2';
    if (parts.length >= 3) {
      // 고2/{과목}/{출판사}/파일.hwp
      folderSubject = parts[1];
      folderPublisher = parts[2];
    } else if (parts.length === 2) {
      // 고2/{과목}/파일.hwp (직접 파일)
      // parts[1]은 파일명이므로 subject 없음
    }
  } else {
    // 모의고사, 수특, 수완 지문, 교과서 외 지문
    folderGrade = '기타';
    // parts[1]이 파일이면 subject 없음, 디렉토리면 subject
    // 이미 collectFiles에서 파일만 수집하므로 parts[-1]이 파일
    // 중간 폴더들이 있으면 subject로 사용
    if (parts.length >= 3) {
      folderSubject = parts[1];
    }
  }

  return { folderGrade, folderSubject, folderPublisher };
}

/**
 * 파일명에서 메타 정보 파싱
 *
 * 핵심: `[` 앞 텍스트 → search_keyword
 *       `[...]` 안 → publisher + subject
 *       `]` 뒤 → school_name, year, term, test_type
 */
function parseFile(filePath: string): ParsedInfo {
  const fileName = path.basename(filePath);
  const { folderGrade, folderSubject, folderPublisher } = getFolderInfo(filePath);

  const ext = path.extname(fileName).toLowerCase();
  const fileType = ext === '.pdf' ? 'PDF' : 'HWP';
  const baseName = fileName.replace(/\.\w+$/, '');

  let grade = folderGrade;
  let subject = folderSubject;
  let publisher = folderPublisher;
  let searchKeyword = '';
  let schoolName = '';
  let year = 0;
  let term = 0;
  let testType = 0;

  // ── `[` 앞 텍스트 → search_keyword (가장 중요) ──
  const bracketIdx = baseName.indexOf('[');
  if (bracketIdx > 0) {
    searchKeyword = baseName.substring(0, bracketIdx).trim();
  } else if (bracketIdx === -1) {
    // 대괄호가 없는 경우: 파일명 전체에서 학교/년도 등 제거 후 사용
    searchKeyword = baseName;
  }

  // ── `[...]` 안 → publisher + subject (파일명 우선, 폴더 fallback) ──
  const bracketMatch = baseName.match(/\[([^\]]+)\]/);
  if (bracketMatch) {
    const bracketContent = bracketMatch[1].trim();
    const spaceIdx = bracketContent.indexOf(' ');
    if (spaceIdx > 0) {
      const part1 = bracketContent.substring(0, spaceIdx).trim();
      const part2 = bracketContent.substring(spaceIdx + 1).trim();
      // part1 = publisher, part2 = subject (일반적)
      publisher = part1;
      subject = part2;
    } else {
      // 공백 없으면 전체가 publisher or subject
      // 폴더에서 이미 subject가 있으면 publisher로 간주
      if (folderSubject) {
        publisher = bracketContent;
      } else {
        subject = bracketContent;
      }
    }
  }

  // ── `]` 뒤 → school_name, year, term, test_type ──
  const afterBracketIdx = baseName.indexOf(']');
  const afterBracket = afterBracketIdx >= 0 ? baseName.substring(afterBracketIdx + 1).trim() : baseName;

  // 패턴: 학교명NN년N학기중간/기말(N)(출제자)
  const mainMatch = afterBracket.match(
    /^(.+?)(\d{2,4})\s*년\s*(\d)\s*학기\s*(중간|기말)/
  );
  if (mainMatch) {
    let parsedSchool = mainMatch[1].trim();
    // 학교명 끝에 붙은 학년 숫자 분리
    const gradeInName = parsedSchool.match(/^(.*[가-힣])(\d)$/);
    if (gradeInName) {
      parsedSchool = gradeInName[1].trim();
    }
    if (parsedSchool) schoolName = parsedSchool;

    let y = parseInt(mainMatch[2]);
    if (y < 100) y += 2000;
    year = y;
    term = parseInt(mainMatch[3]);
    testType = mainMatch[4] === '중간' ? 1 : 2;
  }

  // 대괄호가 없는 파일의 추가 파싱 시도
  if (!mainMatch && bracketIdx === -1) {
    // 패턴: YYYY학년도 학교N N학기 N차 지필평가
    const p2 = baseName.match(
      /(\d{4})학년도\s+([가-힣]+)(\d)?\s+(\d)학기\s+(\d)차\s+지필평가/
    );
    if (p2) {
      year = parseInt(p2[1]);
      schoolName = p2[2];
      term = parseInt(p2[4]);
      testType = p2[5] === '1' ? 1 : 2;
      searchKeyword = baseName;
    }
  }

  return {
    filePath,
    fileName,
    grade,
    subject,
    publisher,
    searchKeyword,
    schoolName,
    year,
    term,
    testType,
    fileType,
  };
}

// ── 메인 ──
async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(`\n=== 쪼개기 파일 일괄 등록 스크립트 ===`);
  console.log(`대상 폴더: ${BASE_DIR}`);
  console.log(`모드: ${isDryRun ? 'DRY RUN (미리보기)' : '실제 DB 등록'}\n`);

  const files = collectFiles(BASE_DIR);
  console.log(`총 파일 수: ${files.length}개\n`);

  const parsed = files.map(parseFile);

  // ── 통계 ──
  const withKeyword = parsed.filter((p) => p.searchKeyword);
  const withYear = parsed.filter((p) => p.year > 0);
  const withPublisher = parsed.filter((p) => p.publisher);
  const withSubject = parsed.filter((p) => p.subject);

  console.log(`[파싱 통계]`);
  console.log(`  검색키워드 파싱 성공: ${withKeyword.length}개`);
  console.log(`  년도 파싱 성공: ${withYear.length}개`);
  console.log(`  출판사 파싱 성공: ${withPublisher.length}개`);
  console.log(`  과목 파싱 성공: ${withSubject.length}개\n`);

  // ── 학년별 통계 ──
  const gradeStats: Record<string, number> = {};
  for (const p of parsed) {
    gradeStats[p.grade || '미분류'] = (gradeStats[p.grade || '미분류'] || 0) + 1;
  }
  console.log(`[학년별 통계]`);
  for (const [g, c] of Object.entries(gradeStats)) {
    console.log(`  ${g}: ${c}개`);
  }
  console.log('');

  // ── 전체 파싱 결과 출력 (일부) ──
  console.log(`[파싱 결과 샘플 (처음 30개)]`);
  console.log(
    '학년'.padEnd(6) + ' | ' +
    '과목'.padEnd(8) + ' | ' +
    '출판사'.padEnd(10) + ' | ' +
    '검색키워드'.padEnd(30) + ' | ' +
    '학교'.padEnd(8) + ' | ' +
    '년도'.padEnd(6) + ' | ' +
    '학기' + ' | ' +
    '시험' + ' | ' +
    '파일명'
  );
  console.log('-'.repeat(140));

  const sampleSize = isDryRun ? parsed.length : Math.min(30, parsed.length);
  for (let i = 0; i < sampleSize; i++) {
    const p = parsed[i];
    const testLabel = p.testType === 1 ? '중간' : p.testType === 2 ? '기말' : '??';
    console.log(
      (p.grade || '??').padEnd(6) + ' | ' +
      (p.subject || '-').padEnd(8) + ' | ' +
      (p.publisher || '-').padEnd(10) + ' | ' +
      (p.searchKeyword || '-').substring(0, 28).padEnd(30) + ' | ' +
      (p.schoolName || '-').padEnd(8) + ' | ' +
      (p.year ? String(p.year) : '-').padEnd(6) + ' | ' +
      (p.term ? `${p.term}학기` : '??  ').padEnd(4) + ' | ' +
      testLabel.padEnd(4) + ' | ' +
      p.fileName
    );
  }

  if (isDryRun) {
    console.log(`\n[DRY RUN 완료] 실제 등록: npx tsx --env-file=apps/root/.env scripts/import-split-files.ts`);
    process.exit(0);
  }

  // ── 실제 DB 등록 ──
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'edenschool',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    charset: 'utf8',
    waitForConnections: true,
    connectionLimit: 5,
  });

  // 기존 데이터 수 확인
  const [countRows] = await pool.query<mysql.RowDataPacket[]>(
    'SELECT COUNT(*) as cnt FROM split_file_meta_info'
  );
  console.log(`\n기존 DB 레코드: ${countRows[0].cnt}개`);
  console.log(`등록 시작...\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    try {
      const [metaResult] = await pool.query<ResultSetHeader>(
        `INSERT INTO split_file_meta_info
          (grade, subject, publisher, search_keyword, school_name, year, term, test_type, file_type, insert_time)
         VALUES (?,?,?,?,?,?,?,?,?,now())`,
        [p.grade, p.subject, p.publisher, p.searchKeyword, p.schoolName, p.year, p.term, p.testType, p.fileType]
      );
      const metaId = metaResult.insertId;

      const content = fs.readFileSync(p.filePath);
      await pool.query<ResultSetHeader>(
        `INSERT INTO split_file_content (meta_id, content, file_name, insert_time) VALUES (?,?,?,now())`,
        [metaId, content, p.fileName]
      );

      success++;
      if ((i + 1) % 100 === 0 || i === parsed.length - 1) {
        console.log(`진행: ${i + 1}/${parsed.length} (성공: ${success}, 실패: ${failed})`);
      }
    } catch (err: any) {
      failed++;
      console.error(`[실패] ${p.fileName}: ${err.message}`);
    }
  }

  console.log(`\n=== 완료 ===`);
  console.log(`성공: ${success}개, 실패: ${failed}개`);

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('스크립트 오류:', err);
  process.exit(1);
});
