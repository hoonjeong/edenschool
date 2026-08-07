import "server-only";
import { mkdir, readFile, writeFile, rm } from "fs/promises";
import path from "path";
import { getUploadDir } from "@/lib/legacy-upload";

// 첨삭 원본 답안 이미지는 업로드 폴더 아래에 첨삭 ID별로 저장한다.
//   <upload>/reading/corrections/<첨삭ID>/01.jpg
// DB(Correction.images)에는 업로드 폴더 기준 상대경로 배열만 저장한다.

export const MAX_CORRECTION_IMAGES = 20;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 장당 8MB (클라이언트에서 1600px JPEG로 압축해 올림)

const MEDIA_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const EXT_MEDIA: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function correctionsRoot(): string {
  return path.join(getUploadDir(), "reading", "corrections");
}

/** data URL → 바이트. 형식/용량이 맞지 않으면 null. */
function decodeDataUrl(dataUrl: string): { ext: string; buf: Buffer } | null {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const ext = MEDIA_EXT[m[1].toLowerCase()];
  if (!ext) return null;
  const buf = Buffer.from(m[2], "base64");
  if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES) return null;
  return { ext, buf };
}

/**
 * 원본 답안 이미지를 디스크에 저장하고, DB에 넣을 상대경로 배열을 돌려준다.
 * 저장에 실패한 이미지는 건너뛰지 않고 예외를 던진다(원본 누락을 조용히 넘기지 않기 위함).
 */
export async function saveCorrectionImages(
  correctionId: number,
  dataUrls: string[],
): Promise<string[]> {
  const list = (dataUrls ?? []).filter(Boolean).slice(0, MAX_CORRECTION_IMAGES);
  if (list.length === 0) return [];

  const dir = path.join(correctionsRoot(), String(correctionId));
  await mkdir(dir, { recursive: true });

  const saved: string[] = [];
  for (let i = 0; i < list.length; i++) {
    const decoded = decodeDataUrl(list[i]);
    if (!decoded) {
      throw new Error(`${i + 1}번째 이미지의 형식 또는 크기가 올바르지 않습니다.`);
    }
    const name = `${String(i + 1).padStart(2, "0")}${decoded.ext}`;
    await writeFile(path.join(dir, name), decoded.buf);
    saved.push(`reading/corrections/${correctionId}/${name}`);
  }
  return saved;
}

/** 첨삭 삭제 시 원본 이미지 폴더도 함께 정리. */
export async function deleteCorrectionImages(correctionId: number): Promise<void> {
  await rm(path.join(correctionsRoot(), String(correctionId)), {
    recursive: true,
    force: true,
  });
}

/**
 * 상대경로로 원본 이미지를 읽는다. 경로 순회(../)로 업로드 폴더 밖을 읽지 못하도록 막는다.
 */
export async function readCorrectionImage(
  relPath: string,
): Promise<{ buf: Buffer; contentType: string }> {
  const root = correctionsRoot();
  // "reading/corrections/" 접두사를 떼고 업로드 폴더 기준으로 해석
  const rel = relPath.replace(/^reading[/\\]corrections[/\\]/, "");
  const abs = path.resolve(root, rel);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (!abs.startsWith(rootWithSep)) {
    throw new Error("잘못된 이미지 경로입니다.");
  }
  const contentType = EXT_MEDIA[path.extname(abs).toLowerCase()];
  if (!contentType) throw new Error("지원하지 않는 이미지 형식입니다.");
  return { buf: await readFile(abs), contentType };
}

/** DB의 Json 컬럼 값을 안전하게 문자열 배열로 변환. */
export function toImagePaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.length > 0);
}
