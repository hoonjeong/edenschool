// 클라이언트 컴포넌트에서도 쓰이는 모델 상수.
// claude.ts 는 "server-only" 라 화면에서 import 할 수 없어 여기로 분리했다.
// 모델을 바꿀 때는 두 값을 함께 수정한다.

// 이미지 분석·첨삭에 사용하는 모델 (최신 최상위 모델)
export const CLAUDE_MODEL = "claude-opus-5";

// 화면 표시용 모델명
export const CLAUDE_MODEL_LABEL = "Claude Opus 5";
