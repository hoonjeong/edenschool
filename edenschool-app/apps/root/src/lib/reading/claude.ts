import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// 모델 상수는 화면에서도 쓰이므로 claude-label.ts 에 두고 여기서 다시 내보낸다.
export { CLAUDE_MODEL, CLAUDE_MODEL_LABEL } from "./claude-label";

// edenschool 프로젝트와 동일한 방식으로 Claude 클라이언트 구성 (독립 구현·키 재사용)
let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export function hasClaudeKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
