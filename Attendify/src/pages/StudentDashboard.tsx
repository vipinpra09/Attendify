import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BookOpen, CalendarCheck2, CalendarX2, Layers, RefreshCw, TrendingUp } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Layout } from "../components/layout";
import { Badge, Button, Card, EmptyState, Progress, PctBadge, Ring, StatCard, StatusBadge } from "../components/ui";
import { TrendArea } from "../components/charts";
import { classesNeeded, fmtDay, isLow, MIN_ATTENDANCE, type StudentStats } from "../lib/types";

export default function StudentDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await api.stats.student(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const lowSubjects = stats?.subjects.filter((s) => isLow(s.percent)) ?? [];

  return (
    <Layout title="My Dashboard" sub="Your personal attendance record — computed live, never typed in">
      {loading && (
        <div className="space-y-4">
          <div className="skeleton h-[150px] rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[104px] rounded-xl" />)}
          </div>
        </div>
      )}
      {error && !loading && (
        <Card><EmptyState icon={AlertTriangle} title="Could not load your attendance" hint={error} action={<Button onClick={() => void load()} icon={RefreshCw}>Retry</Button>} /></Card>
      )}

      {stats && !loading && (
        <div className="space-y-5">
          {/* overall ring header */}
          <Card className="anim-fade-up p-6 flex flex-col sm:flex-row items-center gap-6">
            <Ring value={stats.overall.percent} size={158}>
              <div className="text-center">
                <p className="font-display font-extrabold text-[1.9rem] leading-none text-night-900 tnum">{stats.overall.percent ?? "—"}%</p>
                <p className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400 mt-1">overall</p>
              </div>
            </Ring>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brand-600">Student Record</p>
              <h1 className="font-display font-bold text-[1.55rem] text-night-900 tracking-tight">{user?.name}</h1>
              <p className="text-[13.5px] font-semibold text-slate-500 mt-0.5">
                {stats.overall.percent !== null && !isLow(stats.overall.percent)
                  ? `You're above the ${MIN_ATTENDANCE}% requirement — keep it up!`
                  : `You need ${classesNeeded(stats.overall.attended, stats.overall.total)} consecutive classes to reach ${MIN_ATTENDANCE}%.`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge tone="ok" className="tnum">{stats.overall.attended} attended</Badge>
                <Badge tone="bad" className="tnum">{stats.overall.missed} missed</Badge>
                <Badge tone="slate" className="tnum">{stats.overall.total} total classes</Badge>
                <Badge tone={stats.lowCount > 0 ? "bad" : "ok"} className="tnum">{stats.lowCount} low subject{stats.lowCount === 1 ? "" : "s"}</Badge>
              </div>
            </div>
          </Card>

          {/* low attendance alerts */}
          {lowSubjects.length > 0 && (
            <div className="anim-fade-up rounded-xl border border-bad-200 bg-bad-50 p-5">
              <p className="flex items-center gap-2 font-display font-bold text-[15px] text-bad-700">
                <AlertTriangle className="w-4.5 h-4.5" /> Low Attendance — action needed
              </p>
              <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {lowSubjects.map((s) => (
                  <div key={s.subjectId} className="rounded-lg bg-white border border-bad-100 px-4 py-3">
                    <p className="font-bold text-[13.5px] text-slate-700 truncate">{s.name}</p>
                    <p className="text-[12px] font-semibold text-slate-500 tnum mt-0.5">
                      Attendance: <span className="text-bad-600 font-bold">{s.percent}%</span> · Required: {MIN_ATTENDANCE}%
                    </p>
                    <p className="text-[11.5px] font-bold text-bad-600 mt-0.5">Status: Low Attendance — attend next {classesNeeded(s.attended, s.total)} classes to recover</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={CalendarCheck2} label="Classes Attended" value={stats.overall.attended} sub="All subjects" tone="ok" />
            <StatCard icon={CalendarX2} label="Classes Missed" value={stats.overall.missed} sub="All subjects" tone="bad" delay={60} />
            <StatCard icon={Layers} label="Total Classes" value={stats.overall.total} sub="Sessions held" delay={120} />
            <StatCard icon={BookOpen} label="Low Subjects" value={stats.lowCount} sub={`Below ${MIN_ATTENDANCE}% threshold`} tone={stats.lowCount > 0 ? "warn" : "ok"} delay={180} />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 items-start">
            {/* subject table */}
            <Card className="lg:col-span-2 overflow-hidden anim-fade-up">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-display font-bold text-[15px] text-night-900">Subject-wise Attendance</h3>
              </div>
              {stats.subjects.length === 0 ? (
                <EmptyState icon={BookOpen} title="No subjects yet" hint="Subjects for your branch and semester will appear once the admin creates them." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="tbl">
                    <thead><tr><th>Subject</th><th>Total</th><th>Attended</th><th>Absent</th><th className="w-[22%]">Percentage</th><th>Status</th></tr></thead>
                    <tbody>
                      {stats.subjects.map((s, i) => (
                        <tr key={s.subjectId} className="anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                          <td>
                            <p className="font-bold text-slate-700">{s.name}</p>
                            <p className="font-mono text-[11px] text-slate-400">{s.code} · {s.teacherName}</p>
                          </td>
                          <td className="tnum font-semibold text-slate-600">{s.total}</td>
                          <td className="tnum font-semibold text-ok-600">{s.attended}</td>
                          <td className="tnum font-semibold text-bad-600">{s.total - s.attended}</td>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <Progress value={s.percent} className="flex-1" />
                              <span className="tnum text-[12.5px] font-bold text-slate-600 w-11 text-right">{s.percent === null ? "—" : `${s.percent}%`}</span>
                            </div>
                          </td>
                          <td><PctBadge percent={s.percent} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* trend + recent */}
            <div className="space-y-4">
              <Card className="p-5 anim-fade-up">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display font-bold text-[15px] text-night-900">My Trend</h3>
                  <Badge tone="brand"><TrendingUp className="w-3.5 h-3.5" /> daily %</Badge>
                </div>
                <TrendArea points={stats.trend} height={170} />
              </Card>
              <Card className="overflow-hidden anim-fade-up">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-display font-bold text-[15px] text-night-900">Recent Records</h3>
                </div>
                {stats.recent.length === 0 ? (
                  <EmptyState icon={CalendarCheck2} title="Nothing yet" hint="Your attendance will appear here as teachers mark classes." />
                ) : (
                  <ul>
                    {stats.recent.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors">
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-slate-700 truncate">{r.subjectName}</p>
                          <p className="text-[11px] font-semibold text-slate-400">{fmtDay(r.date)}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
