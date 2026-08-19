import { useEffect, useRef, useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3, BookOpen, ClipboardCheck, GraduationCap, History, Layers,
  LayoutDashboard, LogOut, Menu, School, UserRound, Users, X, Bell, AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { homeFor, useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Badge, Button, Logo, cn, useToast } from "./ui";
import { initials, type Role, type User } from "../lib/types";

interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean }

const NAV: Record<Role, NavItem[]> = {
  ADMIN: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/students", label: "Students", icon: Users },
    { to: "/admin/teachers", label: "Teachers", icon: GraduationCap },
    { to: "/admin/subjects", label: "Subjects", icon: BookOpen },
    { to: "/admin/classes", label: "Classes", icon: School },
    { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  ],
  TEACHER: [
    { to: "/teacher", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/teacher/attendance", label: "Mark Attendance", icon: ClipboardCheck },
    { to: "/teacher/history", label: "Attendance History", icon: History },
    { to: "/teacher/reports", label: "Reports", icon: BarChart3 },
    { to: "/teacher/profile", label: "Profile", icon: UserRound },
  ],
  STUDENT: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/student/history", label: "My History", icon: History },
    { to: "/student/profile", label: "Profile", icon: UserRound },
  ],
};

const roleTone: Record<Role, "night" | "brand" | "ok"> = { ADMIN: "night", TEACHER: "brand", STUDENT: "ok" };

function SidebarContent({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const items = NAV[user.role];

  return (
    <div className="flex flex-col h-full bg-night-900 night-grid">
      <div className="px-5 pt-6 pb-5 border-b border-white/8">
        <Logo dark />
        <p className="mt-3 text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
          College Attendance System
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-500">Menu</p>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold transition-all duration-150",
                isActive
                  ? "bg-brand-600 text-white shadow-[0_4px_14px_-4px_rgba(67,84,228,0.6)]"
                  : "text-slate-300 hover:bg-white/6 hover:text-white",
              )
            }
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-white/8">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand-600 text-white text-[13px] font-bold shrink-0">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-white truncate">{user.name}</p>
            <p className="text-[11px] font-semibold text-slate-400 capitalize">{user.role.toLowerCase()}</p>
          </div>
          <button
            onClick={() => {
              logout();
              toast.push("info", "You have been logged out.");
              navigate("/login");
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- low attendance alert bell ---------- */
interface LowEntry { enrollmentNo: string; name: string; className: string; percent: number | null; needed: number }

function AlertBell({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<LowEntry[] | null>(null);
  const navigate = useNavigate();
  const { token } = useAuth();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (user.role === "ADMIN") {
          const stats = await api.stats.admin(token);
          if (!cancelled) setEntries(stats.lowStudents.map((s) => ({ enrollmentNo: s.enrollmentNo, name: s.name, className: s.className, percent: s.percent, needed: s.needed })));
        } else {
          const rep = await api.reports.generate(token, "low", {});
          if (!cancelled) setEntries(rep.rows.map((r) => ({ enrollmentNo: String(r[0]), name: String(r[1]), className: String(r[2]), percent: typeof r[5] === "number" ? r[5] : parseFloat(String(r[5])), needed: Number(r[6]) })));
        }
      } catch {
        if (!cancelled) setEntries([]);
      }
    })();
    return () => { cancelled = true; };
  }, [token, user.role]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const count = entries?.length ?? 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-bad-600 hover:border-bad-200 hover:bg-bad-50 transition-colors"
        aria-label="Low attendance alerts"
      >
        <Bell className="w-[18px] h-[18px]" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-bad-500 text-white text-[10px] font-bold tnum">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[320px] max-w-[85vw] bg-white rounded-xl border border-slate-200 shadow-[0_18px_50px_-12px_rgba(16,24,40,0.3)] anim-scale-in z-50 overflow-hidden">
          <div className="px-4 py-3 bg-bad-50 border-b border-bad-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-bad-600" />
            <p className="text-[13px] font-bold text-bad-700">Low attendance (&lt; 75%)</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {entries === null ? (
              <p className="px-4 py-6 text-[13px] text-slate-400 text-center font-medium">Loading alerts…</p>
            ) : entries.length === 0 ? (
              <p className="px-4 py-6 text-[13px] text-slate-500 text-center font-medium">Everyone is above 75% 🎉</p>
            ) : (
              entries.slice(0, 8).map((e) => (
                <div key={e.enrollmentNo} className="px-4 py-2.5 border-b border-slate-50 last:border-0 flex items-center justify-between gap-3 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-700 truncate">{e.name}</p>
                    <p className="text-[11px] font-semibold text-slate-400">{e.enrollmentNo} · {e.className}</p>
                  </div>
                  <Badge tone="bad" className="tnum shrink-0">{e.percent}%</Badge>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              navigate(`/${user.role.toLowerCase()}/reports?tab=low`);
            }}
            className="w-full px-4 py-2.5 text-[12.5px] font-bold text-brand-700 bg-brand-50/60 hover:bg-brand-50 transition-colors text-center"
          >
            View full report →
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- shell ---------- */
export function Layout({ title, sub, children, actions }: { title: string; sub?: string; children: ReactNode; actions?: ReactNode }) {
  const { user } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const today = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-paper">
      {/* desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[248px] z-40">
        <SidebarContent user={user} />
      </aside>

      {/* mobile drawer */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-night-950/60 anim-fade-in" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-[268px] anim-drawer shadow-2xl">
            <SidebarContent user={user} onNavigate={() => setDrawer(false)} />
            <button onClick={() => setDrawer(false)} className="absolute top-5 -right-12 p-2.5 rounded-lg bg-night-800 text-white" aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-[248px] flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md border-b border-slate-200/80">
          <div className="flex items-center gap-3 px-4 sm:px-7 h-[62px]">
            <button onClick={() => setDrawer(true)} className="lg:hidden p-2 -ml-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 transition-colors" aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-[16px] text-night-900 leading-tight truncate">{title}</h2>
              {sub && <p className="hidden sm:block text-[11.5px] font-semibold text-slate-400">{sub}</p>}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="hidden md:inline-flex items-center gap-2 text-[12.5px] font-bold text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ok-500 live-dot" />
                {today}
              </span>
              {(user.role === "ADMIN" || user.role === "TEACHER") && <AlertBell user={user} />}
              <span className="grid place-items-center w-9 h-9 rounded-lg bg-night-900 text-white text-[12.5px] font-bold" title={`${user.name} — ${user.role}`}>
                {initials(user.name)}
              </span>
              <Badge tone={roleTone[user.role]} className="hidden sm:inline-flex capitalize">{user.role.toLowerCase()}</Badge>
              {actions}
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-7 py-6 max-w-[1240px] w-full mx-auto">{children}</main>
        <footer className="px-7 py-4 text-[11.5px] font-semibold text-slate-400 border-t border-slate-200/70">
          Attendify · Smart Attendance. Better Tracking.
        </footer>
      </div>
    </div>
  );
}

export function FullScreenLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-paper">
      <div className="flex flex-col items-center gap-4 anim-fade-in">
        <Logo />
        <span className="w-40 h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <span className="block h-full w-1/2 rounded-full bg-brand-600 animate-[shimmer_1.2s_linear_infinite]" style={{ backgroundSize: "200% 100%" }} />
        </span>
        <p className="text-[12.5px] font-bold text-slate-400 uppercase tracking-widest">Loading Attendify…</p>
      </div>
    </div>
  );
}

export { Layers, ClipboardCheck };
