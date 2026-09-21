import { cleanText, splitList, type SubjectGroup } from './client';
import { normalizeTrack, type KoreanTrack } from './content';

export const TRACKS: KoreanTrack[] = ['일반 선택', '진로 선택', '융합 선택'];

/** relate_subject_2022 를 트랙별 과목 배열 + 출처 문구로 정리 */
export function parseSubjects2022(groups: SubjectGroup[] | undefined) {
  const byTrack: Record<KoreanTrack, string[]> = { '일반 선택': [], '진로 선택': [], '융합 선택': [] };
  let source = '';
  for (const g of groups ?? []) {
    const track = normalizeTrack(g.subject_name);
    if (track) byTrack[track] = splitList(g.subject_description);
    else if (/출처/.test(g.subject_name)) source = cleanText(g.subject_name).replace(/^\[|\]$/g, '');
  }
  return { byTrack, source };
}
