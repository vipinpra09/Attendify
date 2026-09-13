import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, BookOpen, CalendarCheck2, GraduationCap, Percent, RefreshCw,
  School, TrendingUp, Users, Inbox,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Layout } from "../components/layout";
import { Badge, Button, Card, Confirm, EmptyState, PctBadge, StatCard, TableSkeleton, useToast, cn } from "../components/ui";
import { Donut, SubjectBars, TrendArea } from "../components/charts";
import { fmtDay, type AdminStats } from "../lib/types";

export default function AdminDashboard() {
  const { token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await api.stats.admin(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load statistics.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const doReset = async () => {
    setResetting(true);
    try {
      await api.system.resetDemo(token);
      toast.push("success", "Demo data has been regenerated.");
      setResetOpen(false);
      await load();
    } catch (e) {
      toast.push("error", e instanceof Error ? e.message : "Reset failed.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <Layout title="Admin Dashboard" sub="System-wide attendance overview">
      <div className="flex justify-end mb-4 -mt-1">
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => setResetOpen(true)}>Reset demo data</Button>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[104px] rounded-xl" />)}
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="skeleton h-[280px] rounded-xl" />
            <div className="skeleton h-[280px] rounded-xl lg:col-span-2" />
          </div>
        </div>
      )}

      {error && !loading && (
        <Card><EmptyState icon={AlertTriangle} title="Could not load dashboard" hint={error}
          action={<Button onClick={() => void load()} icon={RefreshCw}>Retry</Button>} /></Card>
      )}

      {stats && !loading && (
        <div className="space-y-5">
          {/* headline stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Students" value={stats.students} sub="Across all classes" delay={0} />
            <StatCard icon={GraduationCap} label="Total Teachers" value={stats.teachers} sub="Active faculty" delay={60} />
            <StatCard icon={BookOpen} label="Total Subjects" value={stats.subjects} sub={`${stats.subjectwise.filter((s) => s.total > 0).length} with attendance`} delay={120} />
            <StatCard icon={School} label="Total Classes" value={stats.classes} sub="Active sections" delay={180} />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="p-4.5 anim-fade-up" >
              <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.08em] text-slate-500">
                <CalendarCheck2 className="w-4 h-4 text-brand-600" /> {stats.today.isToday ? "Today's Attendance" : "Last Session"}
              </div>
              <p className="mt-2 font-display text-[1.75rem] font-bold text-night-900 tnum leading-none">
                {stats.today.percent === null ? "—" : `${stats.today.percent}%`}
              </p>
              <p className="mt-1.5 text-[12px] font-semibold text-slate-500 tnum">
                {stats.today.present}/{stats.today.total} present · {fmtDay(stats.today.date)}
              </p>
            </Card>
            <Card className="p-4.5 anim-fade-up" >
              <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.08em] text-slate-500" style={{ animationDelay: "60ms" }}>
                <Percent className="w-4 h-4 text-ok-600" /> Average Attendance
              </div>
              <p className="mt-2 font-display text-[1.75rem] font-bold text-night-900 tnum leading-none">{stats.averagePercent ?? "—"}%</p>
              <p className="mt-1.5 text-[12px] font-semibold text-slate-500 tnum">{stats.presentTotal + stats.absentTotal} records · all time</p>
            </Card>
            <button onClick={() => navigate("/admin/reports?tab=low")} className="text-left">
              <Card className="p-4.5 anim-fade-up hover:border-bad-300 hover:shadow-[0_10px_28px_-10px_rgba(226,61,78,0.35)] transition-all duration-200 cursor-pointer h-full">
                <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  <AlertTriangle className="w-4 h-4 text-bad-500" /> Low Attendance
                </div>
                <p className={cn("mt-2 font-display text-[1.75rem] font-bold tnum leading-none", stats.lowStudents.length ? "text-bad-600" : "text-night-900")}>{stats.lowStudents.length}</p>
                <p className="mt-1.5 text-[12px] font-semibold text-slate-500">students below 75% · view report →</p>
              </Card>
            </button>
          </div>

          {/* charts row */}
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="p-5 anim-fade-up">
              <h3 className="font-display font-bold text-[15px] text-night-900 mb-1">Present vs Absent</h3>
              <p className="text-[12px] font-semibold text-slate-400 mb-4 tnum">{stats.presentTotal} present · {stats.absentTotal} absent</p>
              <div className="flex justify-center py-2">
                <Donut present={stats.presentTotal} absent={stats.absentTotal} />
              </div>
              <div className="flex justify-center gap-5 mt-3">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-600"><span className="w-2.5 h-2.5 rounded-sm bg-ok-500" />Present</span>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-600"><span className="w-2.5 h-2.5 rounded-sm bg-bad-100" />Absent</span>
              </div>
            </Card>
            <Card className="p-5 lg:col-span-2 anim-fade-up">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-bold text-[15px] text-night-900">Attendance Trend</h3>
                <Badge tone="brand"><TrendingUp className="w-3.5 h-3.5" /> last {stats.trend.length} sessions</Badge>
              </div>
              <p className="text-[12px] font-semibold text-slate-400 mb-2">Institute-wide daily attendance percentage</p>
              <TrendArea points={stats.trend} />
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="p-5 lg:col-span-2 anim-fade-up">
              <h3 className="font-display font-bold text-[15px] text-night-900 mb-1">Subject-wise Attendance</h3>
              <p className="text-[12px] font-semibold text-slate-400 mb-5">Vertical mark shows the 75% minimum</p>
              <SubjectBars items={stats.subjectwise} />
            </Card>

            <Card className="anim-fade-up overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-display font-bold text-[15px] text-night-900">At-Risk Students</h3>
                <Badge tone="bad">{stats.lowStudents.length}</Badge>
              </div>
              {stats.lowStudents.length === 0 ? (
                <EmptyState icon={Inbox} title="No low attendance" hint="Every student is above the 75% threshold." />
              ) : (
                <ul>
                  {stats.lowStudents.slice(0, 6).map((s) => (
                    <li key={s.studentId} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors">
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-bold text-slate-700 truncate">{s.name}</p>
                        <p className="text-[11px] font-semibold text-slate-400">{s.enrollmentNo} · {s.className}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[14px] font-bold text-bad-600 tnum">{s.percent}%</p>
                        <p className="text-[10.5px] font-semibold text-slate-400 tnum">needs {s.needed} classes</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* recent sessions */}
          <Card className="anim-fade-up overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-[15px] text-night-900">Latest Sessions</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/reports")}>Open reports →</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr><th>Date</th><th>Class</th><th>Subject</th><th>Teacher</th><th>Present</th><th>%</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {stats.sessions.map((s, i) => (
                    <tr key={`${s.date}-${s.classId}-${s.subjectId}`} className="anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <td className="font-semibold text-slate-600 whitespace-nowrap">{fmtDay(s.date)}</td>
                      <td><Badge tone="brand">{s.className}</Badge></td>
                      <td className="font-bold text-slate-700"><span className="font-mono text-[11.5px] text-brand-600 mr-1.5">{s.subjectCode}</span>{s.subjectName}</td>
                      <td className="text-slate-500 font-semibold">{s.teacherName}</td>
                      <td className="tnum font-semibold text-slate-600">{s.present}/{s.total}</td>
                      <td className="tnum font-bold" style={{ color: (s.percent ?? 100) >= 75 ? "var(--color-ok-600)" : "var(--color-bad-600)" }}>{s.percent}%</td>
                      <td><PctBadge percent={s.percent} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {stats.sessions.length === 0 && <TableSkeleton rows={0} />}
            </div>
          </Card>
        </div>
      )}

      <Confirm
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => void doReset()}
        title="Reset demo data?"
        confirmLabel="Reset Data"
        loading={resetting}
        message="All students, teachers, subjects, classes and attendance records will be regenerated from the original seed. Any changes you made will be lost."
      />
    </Layout>
  );
}
