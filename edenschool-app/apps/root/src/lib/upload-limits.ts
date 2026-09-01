/**
 * 업로드 제한값. 서버 검증(upload-validation.ts)과 작성 화면(클라이언트)이 함께 쓴다.
 * upload-validation.ts 는 next/server 에 의존하므로 클라이언트 컴포넌트에서 불러올 수
 * 없다. 제한값만 이 파일로 떼어 두 곳이 같은 기준을 쓰게 한다.
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const MAX_FILE_SIZE_LABEL = '10MB';

export const ALLOWED_EXTENSIONS = [
  '.pdf', '.hwp', '.hwpx',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
  '.doc', '.docx', '.xls', '.xlsx',
];

/** 사람이 읽을 수 있는 파일 크기 (예: 12.4MB) */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${bytes}B`;
}
