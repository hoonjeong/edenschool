/**
 * 검색엔진 크롤러 판별 (조회수 집계 제외용).
 * 완벽한 봇 차단이 목적이 아니라, 주요 크롤러가 게시글 조회수를 부풀리지 않게 하는 정도의 휴리스틱이다.
 */
const CRAWLER_UA =
  /(googlebot|bingbot|yeti|naverbot|daumoa|duckduckbot|baiduspider|yandex|applebot|slurp|petalbot|ahrefsbot|semrushbot|mj12bot|dotbot|facebookexternalhit|twitterbot|slackbot|telegrambot|discordbot|whatsapp|kakaotalk-scrap|gptbot|oai-searchbot|chatgpt-user|claudebot|perplexitybot|bytespider|amazonbot|headlesschrome|python-requests|curl|wget|axios|node-fetch|\bbot\b|crawler|spider)/i;

export function isCrawler(userAgent?: string | null): boolean {
  if (!userAgent) return true; // UA 없는 요청은 사람이 아닐 가능성이 높다
  return CRAWLER_UA.test(userAgent);
}
