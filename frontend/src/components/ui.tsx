import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Search,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { isLow, type AttendanceStatus } from "../lib/types";

export const cn = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(" ");

/* ================= Logo ================= */
export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-600 shadow-[0_4px_14px_-2px_rgba(67,84,228,0.55)] relative overflow-hidden">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 13.2l4.6 4.6L19.5 7.4" />
        </svg>
        <span className="absolute -right-1 -top-1 w-3 h-3 rounded-full bg-brand-300/70" />
      </span>
      {!compact && (
        <span className={cn("font-display font-bold text-[1.18rem] leading-none tracking-tight", dark ? "text-white" : "text-night-900")}>
          Attend<span className="text-brand-500">ify</span>
        </span>
      )}
    </span>
  );
}

/* ================= Spinner / Button ================= */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("w-4 h-4 animate-spin", className)} />;
}

type BtnVariant = "primary" | "outline" | "ghost" | "danger" | "success" | "dark";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: LucideIcon;
}

const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-[0_2px_10px_-2px_rgba(67,84,228,0.5)]",
  outline: "bg-white text-slate-700 border border-slate-300 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50/60",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-bad-600 text-white hover:bg-bad-700 shadow-[0_2px_10px_-2px_rgba(194,43,60,0.5)]",
  success: "bg-ok-600 text-white hover:bg-ok-700 shadow-[0_2px_10px_-2px_rgba(15,138,88,0.5)]",
  dark: "bg-night-900 text-white hover:bg-night-800",
};

export function Button({ variant = "primary", size = "md", loading, icon: Icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-all duration-150 whitespace-nowrap",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
        "disabled:opacity-55 disabled:cursor-not-allowed active:scale-[0.98]",
        size === "sm" ? "text-[12.5px] px-2.5 py-1.5" : size === "lg" ? "text-[15px] px-5 py-2.5" : "text-[13.5px] px-3.5 py-2",
        btnVariants[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}

/* ================= Form primitives ================= */
export function Field({ label, error, hint, required, children }: { label: string; error?: string | null; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block text-left">
      <span className="block text-[12px] font-bold text-slate-600 mb-1.5 uppercase tracking-[0.06em]">
        {label} {required && <span className="text-bad-500">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 flex items-center gap-1 text-[12px] font-medium text-bad-600">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-[12px] text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

export const inputCls = (error?: boolean) =>
  cn(
    "w-full rounded-lg border bg-white px-3 py-2 text-[14px] text-slate-800 placeholder:text-slate-400 transition-colors",
    "focus:outline-none focus:ring-2",
    error
      ? "border-bad-400 focus:ring-bad-100 focus:border-bad-500"
      : "border-slate-300 focus:ring-brand-100 focus:border-brand-500",
  );

export function Input({ error, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return <input className={cn(inputCls(error), className)} {...rest} />;
}

export function Select({ error, className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select className={cn(inputCls(error), "appearance-none bg-no-repeat pr-8 bg-[right_0.6rem_center] bg-[length:14px]", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...rest}
    >
      {children}
    </select>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className={cn(inputCls(), "pl-9")}
      />
    </div>
  );
}

/* ================= Badges ================= */
type Tone = "brand" | "ok" | "warn" | "bad" | "slate" | "night";
const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  ok: "bg-ok-50 text-ok-700 border-ok-200",
  warn: "bg-warn-50 text-warn-700 border-warn-200",
  bad: "bg-bad-50 text-bad-700 border-bad-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
  night: "bg-night-800 text-white border-night-700",
};

export function Badge({ tone = "slate", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11.5px] font-bold tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: AttendanceStatus }) {
  return status === "PRESENT" ? (
    <Badge tone="ok"><span className="w-1.5 h-1.5 rounded-full bg-ok-500" />PRESENT</Badge>
  ) : (
    <Badge tone="bad"><span className="w-1.5 h-1.5 rounded-full bg-bad-500" />ABSENT</Badge>
  );
}

export function PctBadge({ percent }: { percent: number | null }) {
  if (percent === null) return <Badge tone="slate">NO DATA</Badge>;
  return isLow(percent) ? <Badge tone="bad">LOW</Badge> : <Badge tone="ok">GOOD</Badge>;
}

/* ================= Cards / stats ================= */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(16,24,40,0.05)]", className)}>{children}</div>;
}

export function StatCard({ icon: Icon, label, value, sub, tone = "brand", delay = 0 }: { icon: LucideIcon; label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; delay?: number }) {
  const iconTones: Record<Tone, string> = {
    brand: "bg-brand-50 text-brand-600",
    ok: "bg-ok-50 text-ok-600",
    warn: "bg-warn-50 text-warn-600",
    bad: "bg-bad-50 text-bad-600",
    slate: "bg-slate-100 text-slate-600",
    night: "bg-night-800 text-white",
  };
  return (
    <Card className="p-4.5 anim-fade-up hover:shadow-[0_8px_24px_-8px_rgba(16,24,40,0.15)] hover:-translate-y-0.5 transition-all duration-200" >
      <div className="anim-fade-up" style={{ animationDelay: `${delay}ms` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
            <p className="mt-1.5 font-display text-[1.75rem] leading-none font-bold text-night-900 tnum">{value}</p>
            {sub && <p className="mt-1.5 text-[12px] font-medium text-slate-500 truncate">{sub}</p>}
          </div>
          <span className={cn("shrink-0 grid place-items-center w-10 h-10 rounded-lg", iconTones[tone])}>
            <Icon className="w-5 h-5" />
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ================= Progress + Ring ================= */
export const toneForPct = (p: number | null): string =>
  p === null ? "#cbd5e1" : p >= 75 ? "var(--color-ok-500)" : p >= 60 ? "var(--color-warn-500)" : "var(--color-bad-500)";

export function Progress({ value, className }: { value: number | null; className?: string }) {
  return (
    <div className={cn("h-2 rounded-full bg-slate-100 overflow-hidden min-w-[70px]", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${Math.min(100, value ?? 0)}%`, background: toneForPct(value) }}
      />
    </div>
  );
}

export function Ring({ value, size = 148, stroke = 12, children }: { value: number | null; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [offset, setOffset] = useState(c);
  useEffect(() => {
    const t = setTimeout(() => setOffset(c - (c * Math.min(100, value ?? 0)) / 100), 80);
    return () => clearTimeout(t);
  }, [value, c]);
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8ecf5" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={toneForPct(value)} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/* ================= Modal / Confirm ================= */
export function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string;
  children: ReactNode; footer?: ReactNode; size?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center p-4 overflow-y-auto bg-night-950/55 backdrop-blur-[2px] anim-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn(
        "w-full bg-white rounded-2xl shadow-2xl anim-scale-in my-8",
        size === "md" ? "max-w-lg" : size === "lg" ? "max-w-2xl" : "max-w-4xl",
      )}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-display font-bold text-lg text-night-900">{title}</h3>
            {subtitle && <p className="text-[13px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2.5 px-6 py-4 bg-slate-50/70 rounded-b-2xl border-t border-slate-100">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ open, onClose, onConfirm, title, message, confirmLabel = "Delete", loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: ReactNode; confirmLabel?: string; loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex gap-3.5">
        <span className="shrink-0 grid place-items-center w-10 h-10 rounded-full bg-bad-50 text-bad-600">
          <AlertTriangle className="w-5 h-5" />
        </span>
        <p className="text-[14px] text-slate-600 leading-relaxed">{message}</p>
      </div>
      <div className="flex justify-end gap-2.5 mt-6">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

/* ================= Empty / skeleton ================= */
export function EmptyState({ icon: Icon, title, hint, action }: { icon: LucideIcon; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 anim-fade-in">
      <span className="grid place-items-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mb-4">
        <Icon className="w-7 h-7" />
      </span>
      <p className="font-display font-bold text-[15px] text-slate-700">{title}</p>
      {hint && <p className="mt-1 text-[13px] text-slate-500 max-w-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="px-4 py-3 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-9 rounded-lg" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

/* ================= Pagination / page head ================= */
export function Pagination({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  if (pages <= 1) return <p className="text-[12.5px] text-slate-400 font-medium px-1 py-2">{total} record{total === 1 ? "" : "s"}</p>;
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap px-1 py-2">
      <p className="text-[12.5px] text-slate-500 font-medium">
        Page <span className="font-bold text-slate-700 tnum">{page}</span> of <span className="tnum">{pages}</span> · {total} records
      </p>
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} icon={ChevronLeft}>Prev</Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5 anim-fade-up">
      <div>
        <h1 className="font-display text-[1.55rem] font-bold text-night-900 leading-tight">{title}</h1>
        {sub && <p className="text-[13.5px] text-slate-500 mt-1 font-medium">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2.5 flex-wrap">{children}</div>}
    </div>
  );
}

/* ================= Toasts ================= */
type ToastKind = "success" | "error" | "info" | "warning";
interface Toast { id: number; kind: ToastKind; message: string }

const ToastContext = createContext<{ push: (kind: ToastKind, message: string) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const toastMeta: Record<ToastKind, { icon: LucideIcon; cls: string }> = {
  success: { icon: CheckCircle2, cls: "border-ok-200 text-ok-600 bg-ok-50" },
  error: { icon: XCircle, cls: "border-bad-200 text-bad-600 bg-bad-50" },
  info: { icon: Info, cls: "border-brand-200 text-brand-600 bg-brand-50" },
  warning: { icon: AlertTriangle, cls: "border-warn-200 text-warn-600 bg-warn-50" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-4), { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2.5 w-[min(92vw,360px)]">
        {toasts.map((t) => {
          const meta = toastMeta[t.kind];
          const Icon = meta.icon;
          return (
            <div key={t.id} className={cn("anim-toast flex items-start gap-3 rounded-xl border bg-white shadow-[0_10px_30px_-8px_rgba(16,24,40,0.25)] px-4 py-3", meta.cls)}>
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-[13.5px] font-semibold text-slate-700 leading-snug flex-1">{t.message}</p>
              <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
