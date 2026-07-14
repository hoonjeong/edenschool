import { cn } from "@/lib/reading/utils";

/* ── 카드 ─────────────────────────────────────────── */
export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  desc,
  action,
  icon,
}: {
  title: React.ReactNode;
  desc?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-5 pt-5 pb-3">
      {icon && (
        <div className="grid size-9 place-items-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold leading-tight">{title}</h3>
        {desc && <p className="text-[13px] text-muted mt-0.5">{desc}</p>}
      </div>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}

/* ── 통계 카드 ─────────────────────────────────────── */
export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "brand" | "mint" | "amber" | "rose" | "sky" | "slate";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600",
    mint: "bg-mint-50 text-mint-600",
    amber: "bg-amber-50 text-amber-500",
    rose: "bg-rose-50 text-rose-500",
    sky: "bg-sky-50 text-sky-500",
    slate: "bg-canvas text-muted",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        {icon && (
          <div className={cn("grid size-9 place-items-center rounded-lg", tones[tone])}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-2 text-[28px] font-extrabold tracking-tight tabular-nums">
        {value}
      </div>
      {sub && <div className="mt-1 text-[13px] text-faint">{sub}</div>}
    </Card>
  );
}

/* ── 뱃지 ─────────────────────────────────────────── */
export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: "brand" | "mint" | "amber" | "rose" | "sky" | "slate";
  className?: string;
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700",
    mint: "bg-mint-50 text-mint-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
    slate: "bg-canvas text-muted",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── 버튼 ─────────────────────────────────────────── */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};
export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: BtnProps) {
  const variants: Record<string, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
    secondary: "bg-surface border border-line text-ink hover:bg-canvas",
    ghost: "text-muted hover:bg-canvas hover:text-ink",
    danger: "bg-rose-500 text-white hover:brightness-95 shadow-sm",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
    md: "h-10 px-4 text-sm rounded-lg gap-2",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ── 빈 상태 ───────────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      {icon && (
        <div className="grid size-12 place-items-center rounded-2xl bg-canvas text-faint mb-3">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {desc && <p className="text-[13px] text-faint mt-1 max-w-xs">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── 페이지 헤더(설명) ─────────────────────────────── */
export function PageIntro({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 mb-5">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
        {desc && <p className="text-[13px] text-muted mt-1">{desc}</p>}
      </div>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

/* ── 상/중/하 레벨 뱃지 ─────────────────────────────── */
export function LevelChip({ level }: { level: "상" | "중" | "하" }) {
  const map = {
    상: "bg-mint-50 text-mint-600",
    중: "bg-amber-50 text-amber-600",
    하: "bg-rose-50 text-rose-600",
  } as const;
  return (
    <span className={cn("inline-grid size-6 place-items-center rounded-md text-[12px] font-bold", map[level])}>
      {level}
    </span>
  );
}
