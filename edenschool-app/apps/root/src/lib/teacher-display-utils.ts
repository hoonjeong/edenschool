/* ===== 수업안내 공유 타입/유틸리티 ===== */

export interface ScheduleItem {
  grade: string;
  time: string;
}

export interface SchoolSchedule {
  name: string;
  schedule: ScheduleItem[];
}

export const SECTIONS = [
  { key: 'HIGH_SCHOOL', label: '고등부' },
  { key: 'MIDDLE_SCHOOL', label: '중등부' },
  { key: 'SUNEUNG', label: '수능올인반' },
  { key: 'ELEMENTARY', label: '초등부' },
  { key: 'STAFF', label: '운영진' },
  { key: 'CONTENT_PLAN', label: '컨텐츠 기획' },
] as const;

export const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  SECTIONS.map((s) => [s.key, s.label]),
);

export function parseScheduleData(raw: string | null): {
  schedule: ScheduleItem[];
  schools: SchoolSchedule[];
} {
  if (!raw) return { schedule: [], schools: [] };
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { schedule: parsed, schools: [] };
    if (parsed.schools) return { schedule: [], schools: parsed.schools };
    return { schedule: [], schools: [] };
  } catch {
    return { schedule: [], schools: [] };
  }
}

export function serializeScheduleData(
  schedule: ScheduleItem[],
  schools: SchoolSchedule[],
): string | null {
  if (schools.length > 0) return JSON.stringify({ schools });
  if (schedule.length > 0) return JSON.stringify(schedule);
  return null;
}

export function getPhotoSrc(item: {
  photo_file_id: number | null;
  photo_url: string | null;
}): string {
  if (item.photo_file_id) return `/api/file/image/${item.photo_file_id}`;
  return item.photo_url || '';
}
