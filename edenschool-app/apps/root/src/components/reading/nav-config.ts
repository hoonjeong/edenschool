import {
  LayoutDashboard,
  CalendarCheck,
  CalendarPlus,
  Users,
  School,
  ClipboardList,
  MessageSquareText,
  TrendingUp,
  Sparkles,
  Megaphone,
  FileText,
  ClipboardCheck,
  CalendarClock,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: string[]; // 활성 판정용 추가 prefix
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    items: [{ href: "/reading", label: "대시보드", icon: LayoutDashboard }],
  },
  {
    title: "학생 · 수업",
    items: [
      { href: "/reading/attendance", label: "출결 관리", icon: CalendarCheck },
      { href: "/reading/makeup", label: "보강 수업", icon: CalendarPlus },
      { href: "/reading/students", label: "학생", icon: Users },
      { href: "/reading/classes", label: "반 관리", icon: School },
    ],
  },
  {
    title: "기록 · 성장",
    items: [
      { href: "/reading/observations", label: "관찰일지", icon: ClipboardList },
      { href: "/reading/counsels", label: "상담 기록", icon: MessageSquareText },
      { href: "/reading/reports", label: "성장 리포트", icon: TrendingUp },
    ],
  },
  {
    title: "입학 테스트",
    items: [
      { href: "/reading/exams", label: "시험지 관리", icon: FileText },
      { href: "/reading/exam-results", label: "시험 결과", icon: ClipboardCheck },
    ],
  },
  {
    title: "도구",
    items: [
      { href: "/reading/corrections", label: "AI 첨삭", icon: Sparkles },
      { href: "/reading/notices", label: "공지 · 문자", icon: Megaphone },
      { href: "/reading/clinic", label: "클리닉 시간표", icon: CalendarClock },
    ],
  },
  {
    title: "관리",
    items: [{ href: "/reading/settings", label: "설정", icon: Settings }],
  },
];

export const ALL_NAV_ITEMS = NAV.flatMap((g) => g.items);

export function pageTitle(pathname: string): string {
  // 가장 긴 매칭 우선
  const found = [...ALL_NAV_ITEMS]
    .filter((i) => (i.href === "/reading" ? pathname === "/reading" : pathname.startsWith(i.href)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return found?.label ?? "이든 클래스 매니저";
}
