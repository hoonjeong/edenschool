import { NextResponse } from 'next/server';
import JSZip from 'jszip';

/** 파일명 확장자로 Content-Type 결정 */
function contentTypeFor(fileName: string): string {
  if (fileName.endsWith('.pdf')) return 'application/pdf';
  if (fileName.endsWith('.hwp') || fileName.endsWith('.hwt')) return 'application/x-hwp';
  return 'application/octet-stream';
}

/** 단일 파일(BLOB) 다운로드 응답 (attachment) */
export function fileDownloadResponse(fileName: string, content: Buffer): NextResponse {
  return new NextResponse(new Uint8Array(content), {
    headers: {
      'Content-Type': contentTypeFor(fileName),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Content-Length': String(content.length),
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/** 여러 파일을 zip으로 묶어 다운로드. 파일명 중복 시 base(1).ext 로 회피 */
export async function buildZipResponse(
  files: { content?: Buffer | null; fileName?: string | null }[],
  zipName: string
): Promise<NextResponse> {
  const zip = new JSZip();
  const usedNames = new Set<string>();
  for (const file of files) {
    if (!file.content || !file.fileName) continue;
    let name = file.fileName;
    if (usedNames.has(name)) {
      const dot = name.lastIndexOf('.');
      const base = dot > 0 ? name.substring(0, dot) : name;
      const extStr = dot > 0 ? name.substring(dot) : '';
      let counter = 1;
      while (usedNames.has(name)) { name = `${base}(${counter})${extStr}`; counter++; }
    }
    usedNames.add(name);
    zip.file(name, file.content);
  }
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(zipName)}`,
      'Content-Length': String(zipBuffer.length),
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
