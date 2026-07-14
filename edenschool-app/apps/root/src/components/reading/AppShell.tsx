"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, pageTitle } from "./nav-config";
import { ROLE_LABEL } from "@/lib/reading/labels";
import { BookOpenText, PanelLeftClose, PanelLeft, ScanLine, LogOut } from "lucide-react";

export default function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; role: string } | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // 태블릿 체크인 화면은 전체 화면(셸 없음)
  if (pathname.startsWith("/reading/checkin")) {
    return <>{children}</>;
  }

  async function logout() {
    // edenschool admin 세션 로그아웃(POST)으로 위임
    await fetch("/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  const isActive = (href: string) =>
    href === "/reading" ? pathname === "/reading" : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen">
      {/* ── 사이드바 ─────────────────────────────── */}
      <aside
        className={`${
          collapsed ? "w-[76px]" : "w-[248px]"
        } shrink-0 border-r border-line bg-surface flex flex-col sticky top-0 h-screen transition-[width] duration-200`}
      >
        <div className="h-16 flex items-center gap-2.5 px-4 border-b border-line">
          <div className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm shrink-0">
            <BookOpenText className="size-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[15px] font-bold leading-tight truncate">
                이든 클래스 매니저
              </div>
              <div className="text-[11px] text-faint leading-tight">
                독서교육원 통합 관리
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV.map((group, gi) => (
            <div key={gi}>
              {group.title && !collapsed && (
                <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
                  {group.title}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-brand-50 text-brand-700"
                          : "text-muted hover:bg-canvas hover:text-ink"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      <item.icon
                        className={`size-[18px] shrink-0 ${
                          active ? "text-brand-600" : "text-faint group-hover:text-muted"
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div
            className={`flex items-center gap-2.5 rounded-lg px-2 py-2 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="grid size-9 place-items-center rounded-full bg-brand-100 text-brand-700 font-bold text-[13px] shrink-0">
              {user ? user.name.slice(0, 2) : "?"}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{user?.name ?? "게스트"}</div>
                  <div className="text-[11px] text-faint truncate">
                    {user ? ROLE_LABEL[user.role] : "미로그인"}
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="로그아웃"
                  className="grid size-8 place-items-center rounded-lg text-faint hover:bg-canvas hover:text-rose-500 transition-colors"
                >
                  <LogOut className="size-[18px]" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── 메인 ────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-surface/85 backdrop-blur px-5">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-canvas hover:text-ink transition-colors"
            title={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
          >
            {collapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
          </button>
          <h1 className="text-[17px] font-bold">{pageTitle(pathname)}</h1>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden md:inline text-sm text-faint tabular-nums">
              {new Intl.DateTimeFormat("ko-KR", {
                month: "long",
                day: "numeric",
                weekday: "short",
              }).format(new Date())}
            </span>
            <Link
              href="/reading/checkin"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
            >
              <ScanLine className="size-4" />
              등원 체크인
            </Link>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-7 max-w-[1400px] w-full mx-auto animate-fadeUp">
          {children}
        </main>
      </div>
    </div>
  );
}
