import { NextResponse } from 'next/server';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_EXTENSIONS = [
  '.pdf', '.hwp', '.hwpx',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
  '.doc', '.docx', '.xls', '.xlsx',
];

// 확장자별 파일 시그니처(매직바이트). 확장자만 위조한 파일을 거른다.
// - OLE(CFB): hwp/doc/xls,  ZIP: hwpx/docx/xlsx
// - 정상 파일은 시그니처가 일치하므로 통과한다.
const SIGNATURES: Record<string, number[][]> = {
  '.pdf': [[0x25, 0x50, 0x44, 0x46]],                 // %PDF
  '.jpg': [[0xff, 0xd8, 0xff]],
  '.jpeg': [[0xff, 0xd8, 0xff]],
  '.png': [[0x89, 0x50, 0x4e, 0x47]],
  '.gif': [[0x47, 0x49, 0x46, 0x38]],                 // GIF8
  '.bmp': [[0x42, 0x4d]],                             // BM
  '.webp': [[0x52, 0x49, 0x46, 0x46]],               // RIFF (WEBP)
  '.hwp': [[0xd0, 0xcf, 0x11, 0xe0]],                // OLE/CFB
  '.doc': [[0xd0, 0xcf, 0x11, 0xe0]],
  '.xls': [[0xd0, 0xcf, 0x11, 0xe0]],
  '.hwpx': [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]], // ZIP
  '.docx': [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]],
  '.xlsx': [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]],
};

/**
 * 업로드 파일의 크기·확장자·실제 내용(매직바이트)을 검증한다.
 * 문제가 있으면 에러 NextResponse를 반환하고, 통과하면 null을 반환한다.
 */
export async function validateUploadedFile(file: File): Promise<NextResponse | null> {
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: '파일 크기는 10MB 이하여야 합니다.' },
      { status: 400 },
    );
  }

  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `허용되지 않는 파일 형식입니다. (${ALLOWED_EXTENSIONS.join(', ')})` },
      { status: 400 },
    );
  }

  // 매직바이트 검증: 확장자에 대응하는 시그니처가 있으면 실제 내용과 일치해야 한다.
  const expected = SIGNATURES[ext];
  if (expected) {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const ok = expected.some((sig) => sig.every((b, i) => header[i] === b));
    if (!ok) {
      return NextResponse.json(
        { error: '파일 내용이 확장자와 일치하지 않습니다.' },
        { status: 400 },
      );
    }
  }

  return null;
}
