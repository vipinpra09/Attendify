import { fmtDay as fmtDayBase, type SubjectSummary, type TrendPoint } from "../lib/types";

export { fmtDayBase as fmtDay };
export type { SubjectSummary, TrendPoint };

export const toneForPctLabel = (p: number | null): string =>
  p === null ? "#94a3b8" : p >= 75 ? "var(--color-ok-500)" : p >= 60 ? "var(--color-warn-500)" : "var(--color-bad-500)";
