import path from 'node:path';
import { getUploadDir } from '@/lib/legacy-upload';

// AIFT 프로젝트의 effort 값(low~max)을 그대로 받는다.
// 설치된 @anthropic-ai/sdk 0.74 의 타입에는 'xhigh'가 아직 없지만 API는 지원하므로
// 호출부에서 SDK 타입으로 캐스팅해 전달한다.
export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

const EFFORTS: Effort[] = ['low', 'medium', 'high', 'xhigh', 'max'];

function readEffort(): Effort {
  const v = process.env.LESSON_MATERIAL_EFFORT;
  return EFFORTS.includes(v as Effort) ? (v as Effort) : 'high';
}

export const lessonMaterialConfig = {
  // Claude Opus 5는 사고(thinking)가 기본 활성이라 max_tokens는 사고+본문 합산을 커버해야 한다.
  model: process.env.LESSON_MATERIAL_MODEL || 'claude-opus-5',
  maxTokens: Number(process.env.LESSON_MATERIAL_MAX_TOKENS || 32000),
  effort: readEffort(),
  maxUploadBytes: Number(process.env.LESSON_MATERIAL_MAX_UPLOAD_MB || 25) * 1024 * 1024,
  maxFiles: 20,
};

/** 첨부 자료 저장 폴더. 기존 업로드 루트 아래 lesson-material/ 하위에 둔다. */
export function lessonMaterialUploadDir(): string {
  if (process.env.LESSON_MATERIAL_UPLOAD_DIR) {
    return path.resolve(process.env.LESSON_MATERIAL_UPLOAD_DIR);
  }
  return path.join(getUploadDir(), 'lesson-material');
}
