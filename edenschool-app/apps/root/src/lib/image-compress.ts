/**
 * 브라우저(Canvas) 기반 이미지 압축 유틸 — MMS 첨부용 모바일 최적화
 *
 * - 긴 변 기준 maxSize(px)로 축소 (모바일 화면에 충분한 해상도)
 * - JPEG로 변환하며 품질을 단계적으로 낮춰 targetBytes 이하로 맞춤
 * - 품질을 최저까지 낮춰도 크면 해상도를 더 줄여 재시도
 * - PNG 투명 영역은 흰색으로 채움 (JPEG는 투명도 미지원)
 */

export interface CompressOptions {
  /** 긴 변 최대 픽셀 (기본 1024) */
  maxSize?: number;
  /** 목표 최대 용량 byte (기본 250KB) */
  targetBytes?: number;
  /** 시작 JPEG 품질 (기본 0.85) */
  initialQuality?: number;
  /** 최저 JPEG 품질 (기본 0.5) */
  minQuality?: number;
}

export interface CompressResult {
  blob: Blob;
  file: File;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  quality: number;
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap은 EXIF 회전 정보를 반영해 준다
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // 지원하지 않는 형식이면 <img>로 폴백
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 읽을 수 없습니다.')); };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('이미지 변환에 실패했습니다.'))),
      'image/jpeg',
      quality
    );
  });
}

function drawScaled(src: ImageBitmap | HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas를 사용할 수 없습니다.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, width, height);
  return canvas;
}

export async function compressImageForMms(file: File, options: CompressOptions = {}): Promise<CompressResult> {
  const {
    maxSize = 1024,
    targetBytes = 250 * 1024,
    initialQuality = 0.85,
    minQuality = 0.5,
  } = options;

  const src = await loadImage(file);
  const srcW = src.width;
  const srcH = src.height;

  let scale = Math.min(1, maxSize / Math.max(srcW, srcH));
  let best: { blob: Blob; w: number; h: number; q: number } | null = null;

  // 해상도 단계 → 품질 단계 순으로 목표 용량을 만족할 때까지 시도
  for (let pass = 0; pass < 6; pass++) {
    const w = Math.max(1, Math.round(srcW * scale));
    const h = Math.max(1, Math.round(srcH * scale));
    const canvas = drawScaled(src, w, h);

    for (let q = initialQuality; q >= minQuality - 1e-6; q -= 0.1) {
      const blob = await canvasToBlob(canvas, q);
      best = { blob, w, h, q };
      if (blob.size <= targetBytes) break;
    }
    if (best && best.blob.size <= targetBytes) break;
    scale *= 0.8; // 품질을 다 낮춰도 크면 해상도를 20% 더 줄인다
  }

  if ('close' in src && typeof src.close === 'function') src.close();
  if (!best) throw new Error('이미지 압축에 실패했습니다.');

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  const outFile = new File([best.blob], `${baseName}.jpg`, { type: 'image/jpeg' });

  return {
    blob: best.blob,
    file: outFile,
    width: best.w,
    height: best.h,
    originalSize: file.size,
    compressedSize: best.blob.size,
    quality: Math.round(best.q * 100) / 100,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}
