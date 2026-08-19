import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, LogIn, Mail, UserRound, GraduationCap, ShieldCheck } from "lucide-react";
import { ApiError } from "../lib/api";
import { homeFor, useAuth } from "../lib/auth";
import { Badge, Button, Field, Input, Logo, inputCls, useToast, cn } from "../components/ui";
import type { Role } from "../lib/types";

const DEMO_ACCOUNTS: { role: Role; name: string; email: string; password: string; icon: typeof ShieldCheck; tone: "night" | "brand" | "ok" }[] = [
  { role: "ADMIN", name: "Vipin Prajapati", email: "admin@attendify.com", password: "admin123", icon: ShieldCheck, tone: "night" },
  { role: "TEACHER", name: "Anita Sharma", email: "teacher@attendify.com", password: "teacher123", icon: GraduationCap, tone: "brand" },
  { role: "STUDENT", name: "Aarav Kumar", email: "student@attendify.com", password: "student123", icon: UserRound, tone: "ok" },
];

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

  const fill = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setFieldErr({});
    setFormErr(null);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* left brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-night-900 night-grid p-10 relative overflow-hidden">
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-brand-600/15 blur-3xl" aria-hidden />
        <button onClick={() => navigate("/")} className="w-fit" aria-label="Back to home"><Logo dark /></button>
        <div className="relative">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-brand-300 mb-3">College Attendance Management System</p>
          <h1 className="font-display font-extrabold text-white text-[2.5rem] leading-[1.08] tracking-tight">
            Smart Attendance.<br />Better Tracking.
          </h1>
          <p className="mt-4 text-[14.5px] font-medium text-slate-300 max-w-md leading-relaxed">
            Administrators run the system, teachers mark classes in seconds, students always know where they stand against the 75% rule.
          </p>
          <div className="mt-8 space-y-2.5 max-w-md">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1">Demo credentials — click to fill</p>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                onClick={() => fill(acc)}
                className="w-full flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10 hover:border-brand-400/50 transition-all group"
              >
                <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand-600/25 text-brand-300 shrink-0">
                  <acc.icon className="w-4.5 h-4.5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-[13.5px] font-bold text-white">{acc.name}</span>
                    <Badge tone={acc.tone} className="capitalize">{acc.role.toLowerCase()}</Badge>
                  </span>
                  <span className="block text-[11.5px] font-semibold text-slate-400 font-mono truncate">{acc.email} · {acc.password}</span>
                </span>
                <span className="text-[11px] font-bold text-brand-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">USE →</span>
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11.5px] font-semibold text-slate-500">Development/demo credentials only · Author: Vipin Prajapati</p>
      </div>

      {/* right form */}
      <div className="flex flex-col bg-paper relative">
        <div className="lg:hidden flex items-center justify-between px-5 h-16 border-b border-slate-200 bg-white">
          <Logo />
          <button onClick={() => navigate("/")} className="text-[13px] font-bold text-slate-500 hover:text-brand-700">← Home</button>
        </div>
        <div className="flex-1 grid place-items-center px-5 py-10">
          <div className="w-full max-w-[400px] anim-fade-up">
            <div className="lg:hidden flex gap-1.5 mb-6 flex-wrap">
              {DEMO_ACCOUNTS.map((acc) => (
                <button key={acc.role} onClick={() => fill(acc)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-600 hover:border-brand-300 hover:text-brand-700 transition-colors capitalize">
                  {acc.role.toLowerCase()} demo
                </button>
              ))}
            </div>

            <h2 className="font-display font-bold text-[1.7rem] text-night-900 tracking-tight">Welcome back</h2>
            <p className="mt-1 text-[13.5px] font-medium text-slate-500">Sign in to your Attendify dashboard.</p>

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
