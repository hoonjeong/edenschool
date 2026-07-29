import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { lessonMaterialUploadDir } from './config';

/**
 * 첨부 자료를 업로드 폴더에 저장하고 저장 파일명을 돌려준다.
 * AIFT와 동일하게 "타임스탬프_랜덤.확장자" 형태로 저장한다(원본명은 DB에 따로 보관).
 */
export async function saveSourceFile(originalName: string, data: Buffer): Promise<string> {
  const dir = lessonMaterialUploadDir();
  await mkdir(dir, { recursive: true });

  const ext = path.extname(path.basename(originalName)).slice(0, 12);
  const stored = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
  await writeFile(path.join(dir, stored), data);
  return stored;
}

/** 저장 파일 삭제. 경로 순회 방지를 위해 basename만 사용하고, 실패는 무시한다. */
export async function removeSourceFile(storedName: string): Promise<void> {
  try {
    await unlink(path.join(lessonMaterialUploadDir(), path.basename(storedName)));
  } catch {
    // 이미 없거나 지울 수 없으면 무시 (이력 삭제 자체는 성공시킨다)
  }
}
