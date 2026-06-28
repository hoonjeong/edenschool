import { mkdir, readFile, writeFile, access } from 'fs/promises';
import { statSync } from 'fs';
import path from 'path';

// 레거시 저장 구조:
//   upload/         → 게시물 첨부파일 (pdf, hwp, doc 등)
//   upload/image/   → 본문 이미지 (jpg, png 등)
// DB(file_info)에는 "파일명만" 저장하고, 실제 바이트는 위 디스크 경로에 둔다.
// 파일 종류(확장자)로 하위 폴더가 갈린다.

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']);

// 업로드 루트 폴더. PM2/dev 모두 cwd=apps/root 이므로 기본값은 ../../upload (= edenschool-app/upload).
// LEGACY_UPLOAD_DIR 환경변수로 명시 지정 가능(운영에서는 지정 권장).
export function getUploadDir(): string {
  if (process.env.LEGACY_UPLOAD_DIR) return path.resolve(process.env.LEGACY_UPLOAD_DIR);
  const candidates = [
    path.resolve(process.cwd(), 'upload'),
    path.resolve(process.cwd(), '../../upload'),
  ];
  return (
    candidates.find((dir) => {
      try {
        statSync(dir);
        return true;
      } catch {
        return false;
      }
    }) || candidates[1]
  );
}

// 파일 종류에 따른 실제 저장 디렉토리: 이미지는 upload/image/, 나머지는 upload/
function dirForFile(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const root = getUploadDir();
  return IMAGE_EXTS.has(ext) ? path.join(root, 'image') : root;
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// 디스크에서 업로드 파일 읽기. 경로 순회 방지를 위해 basename만 사용.
export async function readUploadFile(filename: string): Promise<Buffer> {
  const safe = path.basename(filename);
  return readFile(path.join(dirForFile(safe), safe));
}

// 업로드 파일 저장. 원본 파일명을 유지하되 같은 이름이 있으면 " (n)" 접미사로 중복을 피한다.
// 실제로 저장된 최종 파일명(폴더 제외)을 반환한다(DB의 file_info.filename에 이 값을 저장).
export async function saveUploadFile(originalName: string, data: Buffer): Promise<string> {
  const safeBase = path.basename(originalName);
  const dir = dirForFile(safeBase);
  await mkdir(dir, { recursive: true });

  const ext = path.extname(safeBase);
  const stem = safeBase.slice(0, safeBase.length - ext.length);

  let candidate = safeBase;
  let n = 1;
  while (await fileExists(path.join(dir, candidate))) {
    candidate = `${stem} (${n})${ext}`;
    n += 1;
  }

  await writeFile(path.join(dir, candidate), data);
  return candidate;
}
