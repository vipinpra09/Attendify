import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, BarChart3, BellRing, CheckCircle2, ClipboardCheck,
  KeyRound, Layers, ShieldCheck, Users,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Logo, cn } from "../components/ui";
import { useAuth } from "../lib/auth";
import { homeFor, } from "../lib/auth";
import { fmtDate, todayISO } from "../lib/types";

/* ---------- live attendance register widget ---------- */
const DEMO_ROWS = [
  { name: "Aarav Kumar", roll: "CSE23001" },
  { name: "Diya Patel", roll: "CSE23002" },
  { name: "Rohan Mehta", roll: "CSE23003" },
  { name: "Sneha Reddy", roll: "CSE23004" },
  { name: "Arjun Singh", roll: "CSE23005" },
];

function LiveRegister() {
  const [statuses, setStatuses] = useState<boolean[]>([true, true, false, true, true]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setStatuses((prev) => {
        const i = Math.floor(Math.random() * prev.length);
        const next = [...prev];
        next[i] = !next[i];
        return next;
      });
      setTick((x) => x + 1);
    }, 1600);
    return () => clearInterval(t);
  }, []);

  const present = statuses.filter(Boolean).length;
  const pctVal = Math.round((present / statuses.length) * 100);
  const r = 30;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative">
      <div className="absolute -inset-5 rounded-3xl bg-brand-600/12 blur-2xl" aria-hidden />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-[0_24px_70px_-20px_rgba(26,30,75,0.35)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-night-900">
          <div>
            <p className="text-[13px] font-bold text-white">CSE-3-A · Data Structures</p>
            <p className="text-[11px] font-semibold text-slate-400">{fmtDate(todayISO())} · Period 3</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest text-ok-200">
            <span className="w-1.5 h-1.5 rounded-full bg-ok-500 live-dot" /> Live
          </span>
        </div>
        <div className="p-5">
          <ul className="space-y-2">
            {DEMO_ROWS.map((s, i) => (
              <li key={s.roll} className={cn("flex items-center justify-between rounded-lg border px-3 py-2 transition-colors duration-300", statuses[i] ? "border-ok-100 bg-ok-50/50" : "border-bad-100 bg-bad-50/50")}>
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 transition-colors", statuses[i] ? "bg-ok-500" : "bg-bad-500")} />
                  <span className="text-[13px] font-bold text-slate-700 truncate">{s.name}</span>
                  <span className="font-mono text-[10.5px] text-slate-400 hidden sm:inline">{s.roll}</span>
                </span>
                <span key={`${i}-${tick}-${statuses[i]}`} className={cn("anim-scale-in text-[10.5px] font-bold tracking-wide px-2 py-0.5 rounded-md", statuses[i] ? "bg-ok-100 text-ok-700" : "bg-bad-100 text-bad-700")}>
                  {statuses[i] ? "PRESENT" : "ABSENT"}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <svg width="72" height="72" className="-rotate-90 shrink-0">
              <circle cx="36" cy="36" r={r} fill="none" stroke="#e8ecf5" strokeWidth="8" />
              <circle cx="36" cy="36" r={r} fill="none" stroke="var(--color-ok-500)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={c - (c * pctVal) / 100}
                style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
            </svg>
            <div>
              <p className="font-display text-xl font-bold text-night-900 tnum">{pctVal}% <span className="text-[12px] font-sans font-semibold text-slate-400">present</span></p>
              <p className="text-[12px] font-semibold text-slate-500 tnum">{present} of {DEMO_ROWS.length} marked · auto-saved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- features ---------- */
interface Feature { icon: LucideIcon; title: string; desc: string; span: string; extra?: "toggles" | "bars" | "alert" | "roles" | "jwt" | "rolls" }

const FEATURES: Feature[] = [
  { icon: ClipboardCheck, title: "Digital Attendance", span: "md:col-span-3", extra: "toggles", desc: "Teachers mark a full class in seconds — one-tap present/absent, bulk actions, duplicate-proof saving and instant re-opening of any session." },
  { icon: BarChart3, title: "Attendance Reports", span: "md:col-span-3", extra: "bars", desc: "Daily, monthly, subject-wise and student-wise reports with automatic percentages and one-click CSV export for office records." },
  { icon: Users, title: "Student Management", span: "md:col-span-2", extra: "rolls", desc: "Enrollment numbers, branches, semesters and sections — unique, validated records instead of messy registers." },
  { icon: BellRing, title: "Low Attendance Alerts", span: "md:col-span-2", extra: "alert", desc: "Anyone below the 75% threshold is flagged automatically, with the exact number of classes needed to recover." },
  { icon: ShieldCheck, title: "Role-Based Access", span: "md:col-span-2", extra: "roles", desc: "Admins manage the system, teachers mark their subjects, students see only their own record." },
  { icon: KeyRound, title: "Secure Authentication", span: "md:col-span-6", extra: "jwt", desc: "JWT bearer sessions with BCrypt-hashed passwords and protected REST APIs — every request is authorised on the server, not just the UI." },
];

function FeatureExtra({ kind }: { kind: Feature["extra"] }) {
  if (kind === "toggles")
    return (
      <div className="flex gap-1.5 mt-3">
        {["P", "P", "A", "P"].map((x, i) => (
          <span key={i} className={cn("w-8 h-8 grid place-items-center rounded-lg text-[11px] font-bold", x === "P" ? "bg-ok-100 text-ok-700" : "bg-bad-100 text-bad-700")}>{x}</span>
        ))}
        <span className="ml-1 self-center text-[11px] font-bold text-slate-400">75% saved ✓</span>
      </div>
    );
  if (kind === "bars")
    return (
      <div className="flex items-end gap-1.5 h-10 mt-3">
        {[82, 68, 91, 75, 88].map((h, i) => (
          <span key={i} className="w-5 rounded-t-md anim-bar" style={{ height: `${h}%`, background: h < 75 ? "var(--color-warn-500)" : "var(--color-brand-500)", animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    );
  if (kind === "alert")
    return (
      <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-bad-50 border border-bad-100 px-2.5 py-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-bad-500" />
        <span className="text-[11.5px] font-bold text-bad-700 tnum">Java · 68% · needs 4 classes</span>
      </div>
    );
  if (kind === "roles")
    return (
      <div className="flex flex-wrap gap-1.5 mt-3">
        {[["Admin", "bg-night-900 text-white"], ["Teacher", "bg-brand-100 text-brand-700"], ["Student", "bg-ok-100 text-ok-700"]].map(([label, cls]) => (
          <span key={label} className={cn("px-2.5 py-1 rounded-md text-[11px] font-bold", cls)}>{label}</span>
        ))}
      </div>
    );
  if (kind === "jwt")
    return (
      <div className="mt-3 font-mono text-[11px] text-slate-500 bg-night-900 rounded-lg px-3 py-2 inline-block max-w-full truncate">
        Authorization: Bearer <span className="text-brand-300">eyJhbGciOiJIUzI1NiJ9</span>.<span className="text-ok-200">eyJyb2xlIjoiVEVBQ0hFUiJ9</span>.<span className="text-warn-200">sig</span>
      </div>
    );
  if (kind === "rolls")
    return (
      <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[11px] font-semibold text-slate-500">
        {["CSE23001", "CSE23002", "ECE23001"].map((r) => (
          <span key={r} className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200">{r}</span>
        ))}
      </div>
    );
  return null;
}

const ARCH = [
  { label: "React + Tailwind UI", sub: "Dashboards · Fetch API" },
  { label: "REST API · JWT", sub: "Bearer token on every request" },
  { label: "Spring Boot", sub: "Controllers → Services · Spring Security" },
  { label: "JPA / Hibernate", sub: "Entities · validation · transactions" },
  { label: "PostgreSQL", sub: "Users · classes · attendance" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const year = useMemo(() => new Date().getFullYear(), []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-paper text-slate-800">
      {/* navbar */}
      <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Attendify home">
            <Logo />
          </button>
          <nav className="hidden sm:flex items-center gap-1">
            {[["Home", () => window.scrollTo({ top: 0, behavior: "smooth" })], ["Features", () => scrollTo("features")], ["About", () => scrollTo("about")]].map(([label, fn]) => (
              <button key={label as string} onClick={fn as () => void} className="px-3.5 py-2 rounded-lg text-[13.5px] font-bold text-slate-600 hover:text-brand-700 hover:bg-brand-50 transition-colors">
                {label as string}
              </button>
            ))}
          </nav>
          <Button onClick={() => navigate(user ? homeFor(user.role) : "/login")}>
            {user ? "Open Dashboard" : "Login"} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* hero — opens with a live attendance register, not a banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_35%,black,transparent)]" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-5 pt-14 pb-20 lg:pt-20 lg:pb-24 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-10 items-center">
          <div>
            <Badge tone="brand" className="anim-fade-up mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> College Attendance Management System
            </Badge>
            <h1 className="anim-fade-up font-display font-extrabold text-night-900 leading-[1.04] text-[2.6rem] sm:text-[3.3rem] lg:text-[3.7rem] tracking-tight" style={{ animationDelay: "60ms" }}>
              Smart Attendance.
              <br />
              <span className="relative inline-block">
                Better Tracking.
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" aria-hidden>
                  <path d="M3 9c60-6 180-6 294-3" stroke="var(--color-brand-400)" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="anim-fade-up mt-6 text-[16px] leading-relaxed text-slate-600 max-w-xl font-medium" style={{ animationDelay: "120ms" }}>
              Attendify simplifies college attendance management by providing a centralized platform for administrators, teachers, and students — replacing manual registers with live, percentage-aware tracking.
            </p>
            <div className="anim-fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "180ms" }}>
              <Button size="lg" onClick={() => navigate(user ? homeFor(user.role) : "/login")}>
                Login <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollTo("features")}>
                Explore Features
              </Button>
            </div>
            <div className="anim-fade-up mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] font-bold text-slate-500" style={{ animationDelay: "240ms" }}>
              {["3 roles", "Auto percentages", "75% threshold alerts", "CSV reports"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-ok-500" /> {t}
                </span>
              ))}
            </div>
          </div>
          <div className="anim-fade-up" style={{ animationDelay: "200ms" }}>
            <LiveRegister />
          </div>
        </div>
      </section>

      {/* features — bento, not a row of equal cards */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-16 lg:py-20">
        <div className="max-w-2xl mb-10">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-brand-600 mb-2">Everything the register never did</p>
          <h2 className="font-display font-bold text-[1.9rem] lg:text-[2.2rem] text-night-900 tracking-tight leading-tight">
            One system for the whole attendance lifecycle
          </h2>
        </div>
        <div className="grid md:grid-cols-6 gap-4">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={cn(
              "anim-fade-up group bg-white rounded-xl border border-slate-200/90 p-6 hover:border-brand-300 hover:shadow-[0_14px_36px_-14px_rgba(67,84,228,0.3)] hover:-translate-y-1 transition-all duration-200",
              f.span,
            )} style={{ animationDelay: `${i * 60}ms` }}>
              <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-200">
                <f.icon className="w-5.5 h-5.5" />
              </span>
              <h3 className="mt-4 font-display font-bold text-[16.5px] text-night-900">{f.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500 font-medium">{f.desc}</p>
              <FeatureExtra kind={f.extra} />
            </div>
          ))}
        </div>
      </section>

      {/* about / architecture */}
      <section id="about" className="bg-night-900 night-grid relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-brand-300 mb-2">About the project</p>
            <h2 className="font-display font-bold text-[1.9rem] lg:text-[2.3rem] text-white tracking-tight leading-tight">
              Built like a real full-stack system
            </h2>
            <p className="mt-4 text-[14.5px] leading-relaxed text-slate-300 font-medium">
              Attendify follows a classic B.Tech mini-project architecture: a REST API secured with JWT,
              role-based authorization, validated DTOs, JPA entities and a normalised PostgreSQL schema —
              presented through fast, role-specific dashboards.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Percentages are always computed — never typed in by hand",
                "Duplicate attendance per student + subject + date is impossible",
                "Students can read only their own record; teachers only their subjects",
                "Every operation answers with a consistent success/error payload",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[13.5px] font-semibold text-slate-200">
                  <CheckCircle2 className="w-4.5 h-4.5 text-ok-500 shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2.5">
            {ARCH.map((step, i) => (
              <div key={step.label}>
                <div className="flex items-center gap-4 rounded-xl bg-white/6 border border-white/10 px-5 py-3.5 hover:bg-white/10 hover:border-brand-400/40 transition-colors">
                  <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand-600/25 text-brand-300 font-mono text-[12px] font-bold shrink-0">{i + 1}</span>
                  <div>
                    <p className="text-[14px] font-bold text-white">{step.label}</p>
                    <p className="text-[12px] font-semibold text-slate-400">{step.sub}</p>
                  </div>
                  <Layers className="w-4 h-4 text-slate-500 ml-auto shrink-0" />
                </div>
                {i < ARCH.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <svg width="14" height="16" viewBox="0 0 14 16" className="text-brand-400/70"><path d="M7 1v11M2.5 8.5L7 13l4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 py-16 lg:py-20">
        <div className="relative overflow-hidden rounded-2xl bg-brand-600 px-7 py-10 lg:px-12 lg:py-14 flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
          <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-white/10" aria-hidden />
          <div className="absolute right-24 -bottom-20 w-40 h-40 rounded-full bg-brand-700/60" aria-hidden />
          <div className="relative">
            <h2 className="font-display font-bold text-white text-[1.6rem] lg:text-[1.9rem] tracking-tight">Ready to retire the paper register?</h2>
            <p className="mt-1.5 text-[14px] font-semibold text-brand-100">Sign in with a demo account — admin, teacher or student — and take the tour.</p>
          </div>
          <div className="relative flex gap-3">
            <Button size="lg" variant="dark" className="bg-night-900 hover:bg-night-800" onClick={() => navigate("/login")}>
              Go to Login <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-10 grid sm:grid-cols-3 gap-8">
          <div>
            <Logo />
            <p className="mt-3 text-[13px] font-medium text-slate-500 leading-relaxed">
              Attendify – College Attendance Management System.<br />Smart Attendance. Better Tracking.
            </p>
          </div>
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Explore</p>
            <div className="flex flex-col items-start gap-1.5">
              {[["Features", () => scrollTo("features")], ["About", () => scrollTo("about")], ["Login", () => navigate("/login")]].map(([label, fn]) => (
                <button key={label as string} onClick={fn as () => void} className="text-[13.5px] font-bold text-slate-600 hover:text-brand-700 transition-colors">
                  {label as string}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">Project</p>
            <p className="text-[13px] font-semibold text-slate-600">B.Tech Mini Project · {year}</p>
            <p className="text-[13px] font-semibold text-slate-600 mt-1">Author — Vipin Prajapati</p>
            <p className="text-[12px] font-medium text-slate-400 mt-2">React · Spring Boot · JPA · PostgreSQL</p>
          </div>
        </div>
        <div className="border-t border-slate-100 py-4 text-center text-[12px] font-semibold text-slate-400">
          © {year} Attendify · College Attendance Management System
        </div>
      </footer>
    </div>
  );
}
