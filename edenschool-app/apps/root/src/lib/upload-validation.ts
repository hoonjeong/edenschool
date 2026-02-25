import { NextResponse } from 'next/server';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_EXTENSIONS = [
  '.pdf', '.hwp', '.hwpx',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
  '.doc', '.docx', '.xls', '.xlsx',
];

/**
 * 업로드된 파일의 크기와 확장자를 검증합니다.
 * 문제가 있으면 에러 NextResponse를 반환하고, 통과하면 null을 반환합니다.
 */
export function validateUploadedFile(file: File): NextResponse | null {
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

  return null;
}
