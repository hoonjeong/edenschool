/** 사이트 절대 URL / 이름 (SEO·사이트맵·OG 태그용).
 *  운영 도메인은 SITE_URL 환경변수로 덮어쓸 수 있다. */
export const SITE_URL = (process.env.SITE_URL || 'https://edenschool.kr').replace(/\/+$/, '');
export const SITE_NAME = process.env.SITE_TITLE || '부천국어학원 이든배움국어학원';
