import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle, BookOpen, CalendarCheck2, ClipboardCheck, GraduationCap, Percent,
  RefreshCw, RotateCcw, Save, Users, Inbox, UsersRound,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Layout } from "../components/layout";
import { Badge, Button, Card, EmptyState, Field, Modal, Progress, Select, Spinner, StatCard, useToast } from "../components/ui";
import {
  classesNeeded, fmtDate, fmtDay, isLow, todayISO,
  type AttendanceStatus, type ClassRow, type SubjectRow, type TeacherStats,
} from "../lib/types";

/* =========================================================
   TEACHER DASHBOARD
   ========================================================= */
export function TeacherDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await api.stats.teacher(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todaySessions = stats ? stats.recentSessions.filter((s) => s.date === stats.today.date && stats.today.isToday).length : 0;

  return (
    <Layout title="Teacher Dashboard" sub="Your subjects, classes and attendance at a glance">
      <div className="anim-fade-up mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-night-900 night-grid px-6 py-5">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brand-300">{greeting},</p>
          <h1 className="font-display font-bold text-white text-[1.5rem] tracking-tight">{user?.name}</h1>
          <p className="text-[13px] font-semibold text-slate-400 mt-0.5">
            {stats ? `${stats.subjects.length} subject${stats.subjects.length === 1 ? "" : "s"} · ${stats.totalStudents} students across ${stats.classIds.length} class${stats.classIds.length === 1 ? "" : "es"}` : "Loading your classes…"}
          </p>
        </div>
        <Button icon={ClipboardCheck} onClick={() => navigate("/teacher/attendance")}>Mark Attendance</Button>
      </div>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[104px] rounded-xl" />)}
        </div>
      )}
      {error && !loading && (
        <Card><EmptyState icon={AlertTriangle} title="Could not load dashboard" hint={error} action={<Button onClick={() => void load()} icon={RefreshCw}>Retry</Button>} /></Card>
      )}

      {stats && !loading && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={BookOpen} label="My Subjects" value={stats.subjects.length} sub={stats.subjects.map((s) => s.code).join(", ") || "None assigned"} />
            <StatCard icon={CalendarCheck2} label="Today's Classes" value={stats.today.isToday ? todaySessions : 0} sub={stats.today.isToday ? `${stats.today.present}/${stats.today.total} present today` : `Last session: ${fmtDay(stats.today.date)}`} delay={60} />
            <StatCard icon={Users} label="Total Students" value={stats.totalStudents} sub="In your classes" delay={120} />
            <StatCard icon={Percent} label="Average Attendance" value={`${stats.averagePercent ?? "—"}%`} sub="Across your subjects" tone={stats.averagePercent !== null && isLow(stats.averagePercent) ? "bad" : "ok"} delay={180} />
          </div>

          <div className="grid lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-3 anim-fade-up overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-display font-bold text-[15px] text-night-900">My Subjects</h3>
                <Badge tone="brand">{stats.subjects.length}</Badge>
              </div>
              {stats.subjects.length === 0 ? (
                <EmptyState icon={BookOpen} title="No subjects assigned" hint="Ask the administrator to assign subjects to your account from the Subjects page." />
              ) : (
                <ul>
                  {stats.subjects.map((s, i) => (
                    <li key={s.subjectId} className="flex items-center gap-4 px-5 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors anim-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                      <span className="grid place-items-center w-10 h-10 rounded-lg bg-brand-50 text-brand-700 font-mono text-[10.5px] font-bold shrink-0">{s.code.slice(-3)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[13.5px] text-slate-700 truncate">{s.name}</p>
                        <div className="flex items-center gap-2.5 mt-1.5">
                          <Progress value={s.percent} className="w-full max-w-[220px]" />
                          <span className="tnum text-[12px] font-bold text-slate-500">{s.percent ?? "—"}% · {s.attended}/{s.total}</span>
                        </div>
                      </div>
                      {isLow(s.percent) ? <Badge tone="bad">LOW</Badge> : <Badge tone="ok">GOOD</Badge>}
                      <Button size="sm" variant="outline" onClick={() => navigate(`/teacher/attendance?subject=${s.subjectId}`)}>Mark</Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="lg:col-span-2 anim-fade-up overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-display font-bold text-[15px] text-night-900">Recent Sessions</h3>
              </div>
              {stats.recentSessions.length === 0 ? (
                <EmptyState icon={Inbox} title="No sessions yet" hint="Mark your first attendance to see it here." action={<Button size="sm" onClick={() => navigate("/teacher/attendance")}>Mark Attendance</Button>} />
              ) : (
                <ul>
                  {stats.recentSessions.map((s, i) => (
                    <li key={`${s.date}-${s.classId}-${s.subjectId}`} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-700 truncate">{s.subjectName}</p>
                        <p className="text-[11px] font-semibold text-slate-400">{fmtDay(s.date)} · {s.className}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="tnum text-[13.5px] font-bold" style={{ color: (s.percent ?? 100) >= 75 ? "var(--color-ok-600)" : "var(--color-bad-600)" }}>{s.percent}%</p>
                        <p className="text-[10.5px] font-semibold text-slate-400 tnum">{s.present}/{s.total} present</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </Layout>
  );
}

/* =========================================================
   MARK ATTENDANCE
   ========================================================= */
interface Row { studentId: string; enrollmentNo: string; name: string; status: AttendanceStatus }

export function MarkAttendance() {
  const { token, user } = useAuth();
  const toast = useToast();
  const [params] = useSearchParams();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState(params.get("subject") ?? "");
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    Promise.all([api.classes.list(token), api.subjects.list(token)])
      .then(([cs, ss]) => {
        if (c) return;
        setClasses(cs);
        setSubjects(ss.filter((s) => s.teacherId === user?.personId));
      })
      .catch((e) => toast.push("error", e instanceof Error ? e.message : "Failed to load."))
      .finally(() => { if (!c) setLoadingList(false); });
    return () => { c = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const selectedClass = classes.find((c) => c.id === classId);
  const eligibleSubjects = useMemo(
    () => subjects.filter((s) => !selectedClass || (s.department === selectedClass.branch && s.semester === selectedClass.semester)),
    [subjects, selectedClass],
  );

  /* auto-load students once all three are chosen */
  const loadSession = useCallback(async () => {
    if (!classId || !subjectId || !date) return;
    setLoadingRows(true);
    setRows(null);
    setSavedAt(null);
    try {
      const res = await api.attendance.getSession(token, classId, subjectId, date);
      setRows(res.students.map((s) => ({ studentId: s.id, enrollmentNo: s.enrollmentNo, name: s.name, status: res.existing[s.id]?.status ?? "PRESENT" })));
      setEditMode(Object.keys(res.existing).length > 0);
    } catch (e) {
      toast.push("error", e instanceof Error ? e.message : "Could not load students.");
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  }, [token, classId, subjectId, date, toast]);

  useEffect(() => { void loadSession(); }, [loadSession]);

  const setStatus = (id: string, status: AttendanceStatus) =>
    setRows((prev) => prev?.map((r) => (r.studentId === id ? { ...r, status } : r)) ?? prev);
  const setAll = (status: AttendanceStatus) => setRows((prev) => prev?.map((r) => ({ ...r, status })) ?? prev);

  const present = rows?.filter((r) => r.status === "PRESENT").length ?? 0;
  const absent = (rows?.length ?? 0) - present;
  const subject = subjects.find((s) => s.id === subjectId);

  const save = async () => {
    if (!rows) return;
    setSaving(true);
    try {
      const res = await api.attendance.saveSession(token, {
        classId, subjectId, date,
        records: rows.map((r) => ({ studentId: r.studentId, status: r.status })),
      });
      toast.push("success", `Attendance saved — ${res.saved} new, ${res.updated} updated.`);
      setSavedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      setEditMode(true);
      setConfirmOpen(false);
    } catch (e) {
      toast.push("error", e instanceof Error ? e.message : "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Mark Attendance" sub="Select a class, subject and date — then mark present or absent">
      <div className="grid lg:grid-cols-[340px_1fr] gap-5 items-start">
        {/* selector panel */}
        <Card className="p-5 anim-fade-up lg:sticky lg:top-[86px]">
          <h3 className="font-display font-bold text-[15px] text-night-900 mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-4.5 h-4.5 text-brand-600" /> Session
          </h3>
          <div className="space-y-4">
            <Field label="Class" required>
              <Select value={classId} onChange={(e) => { setClassId(e.target.value); setSubjectId(""); }}>
                <option value="">{loadingList ? "Loading…" : "Select class…"}</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.branch} Sem {c.semester}</option>)}
              </Select>
            </Field>
            <Field label="Subject" required hint={classId && eligibleSubjects.length === 0 ? "No subjects of yours match this class" : undefined}>
              <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!classId}>
                <option value="">{!classId ? "Select class first…" : eligibleSubjects.length === 0 ? "No eligible subjects" : "Select subject…"}</option>
                {eligibleSubjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
              </Select>
            </Field>
            <Field label="Date" required>
              <input
                type="date" value={date} max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
              />
            </Field>
            {editMode && rows && (
              <div className="flex items-start gap-2.5 rounded-lg border border-warn-200 bg-warn-50 px-3.5 py-3 anim-scale-in">
                <AlertTriangle className="w-4 h-4 text-warn-600 shrink-0 mt-0.5" />
                <p className="text-[12.5px] font-bold text-warn-700">Attendance already exists for this date — you are editing the saved session. Duplicate entries are impossible.</p>
              </div>
            )}
            {savedAt && (
              <div className="flex items-center gap-2 rounded-lg border border-ok-200 bg-ok-50 px-3.5 py-2.5 anim-scale-in">
                <CalendarCheck2 className="w-4 h-4 text-ok-600" />
                <p className="text-[12.5px] font-bold text-ok-700">Saved at {savedAt}</p>
              </div>
            )}
          </div>
        </Card>

        {/* roster */}
        <Card className="overflow-hidden anim-fade-up" >
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-[15px] text-night-900">
                {subject ? `${subject.code} · ${subject.name}` : "Student Roster"}
                {selectedClass && <span className="text-slate-400 font-sans font-semibold text-[12.5px] ml-2">{selectedClass.name} · {fmtDate(date)}</span>}
              </h3>
            </div>
            {rows && rows.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge tone="ok" className="tnum">{present} PRESENT</Badge>
                <Badge tone="bad" className="tnum">{absent} ABSENT</Badge>
                <Button variant="outline" size="sm" icon={UsersRound} onClick={() => setAll("PRESENT")}>All Present</Button>
                <Button variant="outline" size="sm" icon={GraduationCap} onClick={() => setAll("ABSENT")}>All Absent</Button>
                <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => void loadSession()}>Reset</Button>
              </div>
            )}
          </div>

          {!classId || !subjectId ? (
            <EmptyState icon={Users} title="Pick a class and subject" hint="Choose the class and subject on the left — the student list loads automatically." />
          ) : loadingRows ? (
            <div className="flex items-center justify-center gap-2.5 py-16 text-slate-400 font-bold text-[13.5px]"><Spinner className="w-5 h-5" /> Loading students…</div>
          ) : !rows || rows.length === 0 ? (
            <EmptyState icon={Inbox} title="No students in this class" hint="Ask the admin to assign students to this class before marking attendance." />
          ) : (
            <>
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="tbl">
                  <thead className="sticky top-0 z-10"><tr><th>#</th><th>Enrollment No</th><th>Student Name</th><th className="text-right">Present / Absent</th></tr></thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.studentId} className={r.status === "PRESENT" ? "" : "bg-bad-50/40"}>
                        <td className="text-slate-400 font-semibold tnum">{i + 1}</td>
                        <td className="font-mono font-bold text-[12.5px] text-brand-700">{r.enrollmentNo}</td>
                        <td className="font-bold text-slate-700">{r.name}</td>
                        <td>
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setStatus(r.studentId, "PRESENT")}
                              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold tracking-wide transition-all duration-150 active:scale-95 ${r.status === "PRESENT" ? "bg-ok-500 text-white shadow-[0_3px_10px_-2px_rgba(23,165,107,0.6)]" : "bg-slate-100 text-slate-500 hover:bg-ok-50 hover:text-ok-600"}`}
                            >P · Present</button>
                            <button
                              onClick={() => setStatus(r.studentId, "ABSENT")}
                              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold tracking-wide transition-all duration-150 active:scale-95 ${r.status === "ABSENT" ? "bg-bad-500 text-white shadow-[0_3px_10px_-2px_rgba(226,61,78,0.6)]" : "bg-slate-100 text-slate-500 hover:bg-bad-50 hover:text-bad-600"}`}
                            >A · Absent</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
                <p className="text-[12.5px] font-bold text-slate-500 tnum">
                  {rows.length} students · {present} present · {absent} absent
                </p>
                <Button icon={Save} size="lg" onClick={() => setConfirmOpen(true)}>Save Attendance</Button>
              </div>
            </>
          )}
        </Card>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm attendance"
        subtitle={subject && selectedClass ? `${selectedClass.name} · ${subject.code} ${subject.name} · ${fmtDate(date)}` : undefined}
        footer={<>
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>Review Again</Button>
          <Button variant="success" icon={Save} loading={saving} onClick={() => void save()}>Confirm & Save</Button>
        </>}>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-ok-50 border border-ok-100 py-4">
            <p className="font-display text-2xl font-bold text-ok-600 tnum">{present}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ok-700 mt-1">Present</p>
          </div>
          <div className="rounded-xl bg-bad-50 border border-bad-100 py-4">
            <p className="font-display text-2xl font-bold text-bad-600 tnum">{absent}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-bad-700 mt-1">Absent</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 py-4">
            <p className="font-display text-2xl font-bold text-night-900 tnum">{rows?.length ?? 0}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">Total</p>
          </div>
        </div>
        <p className="mt-4 text-[13px] font-semibold text-slate-500 leading-relaxed">
          {editMode
            ? "A session already exists for this class, subject and date — saving will update the existing records (no duplicates will be created)."
            : "Attendance will be recorded for every student listed. Percentages update instantly across all dashboards."}
        </p>
      </Modal>
    </Layout>
  );
}
