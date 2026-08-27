import path from 'node:path';
import { defineConfig } from 'vitest/config';

// 순수 함수(입출력만으로 검증 가능한 것) 회귀 테스트용.
// DB·세션·네트워크를 타는 코드는 대상이 아니다 — 여기서는 리팩토링이 동작을 바꿨는지만 잡는다.
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      '../../packages/common/src/**/*.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@edenschool/common': path.resolve(import.meta.dirname, '../../packages/common/src'),
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
});
