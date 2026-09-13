import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ClipboardCheck,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { ApiError } from "../lib/api";
import { homeFor, useAuth } from "../lib/auth";
import { Button, Field, Input, Logo, useToast, cn } from "../components/ui";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErr, setFieldErr] = useState<{ email?: string; password?: string }>({});
  const [formErr, setFormErr] = useState<string | null>(null);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    const errs: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    setFieldErr(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const u = await login(email, password);
      toast.push("success", `Welcome back, ${u.name.split(" ")[0]}! Signed in as ${u.role.toLowerCase()}.`);
      navigate(homeFor(u.role), { replace: true });
    } catch (err) {
      setFormErr(err instanceof ApiError ? err.message : "Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* left brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-night-900 night-grid p-10 relative overflow-hidden">
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-brand-600/15 blur-3xl" aria-hidden />
        <button onClick={() => navigate("/")} className="w-fit" aria-label="Back to home">
          <Logo dark />
        </button>
        <div className="relative">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand-300 mb-3">
            College Attendance Management System
          </p>
          <h1 className="font-display font-extrabold text-white text-[2.5rem] leading-[1.08] tracking-tight">
            Smart Attendance.<br />Better Tracking.
          </h1>
          <p className="mt-4 text-[14.5px] font-medium text-slate-300 max-w-md leading-relaxed">
            Administrators manage records, teachers mark classes in seconds, and students always know where they stand against the 75% rule.
          </p>
          <div className="mt-8 space-y-3 max-w-md">
            <div className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand-600/25 text-brand-300 shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </span>
              <div>
                <span className="text-[13.5px] font-bold text-white block">Role-Based Access</span>
                <span className="text-[11.5px] font-semibold text-slate-400">Dedicated dashboards for Admin, Teacher, and Student portals</span>
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="grid place-items-center w-9 h-9 rounded-lg bg-ok-500/20 text-ok-400 shrink-0">
                <ClipboardCheck className="w-4.5 h-4.5" />
              </span>
              <div>
                <span className="text-[13.5px] font-bold text-white block">Accurate Attendance</span>
                <span className="text-[11.5px] font-semibold text-slate-400">Real-time tracking per lecture session with duplicate prevention</span>
              </div>
            </div>
            <div className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="grid place-items-center w-9 h-9 rounded-lg bg-warn-500/20 text-warn-400 shrink-0">
                <CalendarDays className="w-4.5 h-4.5" />
              </span>
              <div>
                <span className="text-[13.5px] font-bold text-white block">Schedules & Broadcasts</span>
                <span className="text-[11.5px] font-semibold text-slate-400">Class timetable, faculty directory, and targeted notices</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[11.5px] font-semibold text-slate-500">
          College Attendance Management System · Author: Vipin Prajapati
        </p>
      </div>

      {/* right form */}
      <div className="flex flex-col bg-paper relative">
        <div className="lg:hidden flex items-center justify-between px-5 h-16 border-b border-slate-200 bg-white">
          <Logo />
          <button onClick={() => navigate("/")} className="text-[13px] font-bold text-slate-500 hover:text-brand-700">
            ← Home
          </button>
        </div>
        <div className="flex-1 grid place-items-center px-5 py-10">
          <div className="w-full max-w-[400px] anim-fade-up">
            <h2 className="font-display font-bold text-[1.7rem] text-night-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-1 text-[13.5px] font-medium text-slate-500">
              Sign in to your Attendify dashboard.
            </p>

            {formErr && (
              <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-bad-200 bg-bad-50 px-3.5 py-3 anim-scale-in">
                <Lock className="w-4 h-4 text-bad-600 shrink-0 mt-0.5" />
                <p className="text-[13px] font-bold text-bad-700">{formErr}</p>
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
              <Field label="Email" required error={fieldErr.email}>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@attendify.com"
                    className="pl-9"
                    value={email}
                    error={!!fieldErr.email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </Field>
              <Field label="Password" required error={fieldErr.password}>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={cn("pl-9 pr-11")}
                    value={password}
                    error={!!fieldErr.password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </Field>
              <Button type="submit" size="lg" className="w-full" loading={loading} icon={LogIn}>
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <p className="mt-6 text-center text-[12.5px] font-semibold text-slate-400">
              Protected with JWT sessions · passwords hashed with BCrypt
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
