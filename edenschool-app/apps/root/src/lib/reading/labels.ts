export const STUDENT_STATUS: Record<
  string,
  { label: string; tone: "mint" | "amber" | "slate" }
> = {
  ENROLLED: { label: "재원", tone: "mint" },
  PAUSED: { label: "휴원", tone: "amber" },
  WITHDRAWN: { label: "퇴원", tone: "slate" },
};

export const ATTENDANCE_STATUS: Record<
  string,
  { label: string; tone: "mint" | "amber" | "rose" | "sky" }
> = {
  PRESENT: { label: "출석", tone: "mint" },
  LATE: { label: "지각", tone: "amber" },
  ABSENT: { label: "결석", tone: "rose" },
  MAKEUP: { label: "보강", tone: "sky" },
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "원장(관리자)",
  TEACHER: "담당 선생님",
  CLINIC: "클리닉 선생님",
};

export const CORRECTION_STATUS: Record<
  string,
  { label: string; tone: "slate" | "sky" | "mint" }
> = {
  UPLOADED: { label: "업로드", tone: "slate" },
  RECOGNIZED: { label: "인식완료", tone: "sky" },
  DONE: { label: "첨삭완료", tone: "mint" },
};
