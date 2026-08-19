import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BarChart3, CalendarDays, Download, FileText, Filter, History as HistoryIcon,
  KeyRound, PencilLine, SearchX, UserRound, Users, AlertTriangle,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Layout } from "../components/layout";
import {
  Badge, Button, Card, EmptyState, Field, Input, PageHead, Pagination, SearchInput,
  Select, Spinner, StatusBadge, TableSkeleton, useToast, cn,
} from "../components/ui";
import {
  downloadCSV, fmtDate, todayISO,
  type AttendanceFilters, type AttendanceRow, type AttendanceStatus, type ClassRow,
  type Paged, type ReportResult, type ReportType, type StudentRow, type SubjectRow,
} from "../lib/types";

/* ---------- generic cell renderer ---------- */
function Cell({ value }: { value: string | number }) {
  if (value === "PRESENT" || value === "ABSENT") return <StatusBadge status={value as AttendanceStatus} />;
  if (value === "LOW") return <Badge tone="bad">LOW</Badge>;
  if (value === "GOOD") return <Badge tone="ok">GOOD</Badge>;
  return <span className={typeof value === "number" ? "tnum font-semibold text-slate-600" : "font-semibold text-slate-600"}>{value}</span>;
}

/* =========================================================
   ATTENDANCE HISTORY
   ========================================================= */
export function HistoryPage() {
  const { token, user } = useAuth();
  const toast = useToast();
  const isStudent = user?.role === "STUDENT";

  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [filters, setFilters] = useState<AttendanceFilters>({ subjectId: "", classId: "", from: "", to: "", status: "", query: "", page: 1, size: 12 });
  const [result, setResult] = useState<Paged<AttendanceRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [flipping, setFlipping] = useState<string | null>(null);

  useEffect(() => {
    api.subjects.list(token).then(setSubjects).catch(() => undefined);
    if (!isStudent) api.classes.list(token).then(setClasses).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const load = useMemo(
    () => async (page: number) => {
      setLoading(true);
      try {
        const res = await api.attendance.query(token, { ...filters, page });
        setResult(res);
      } catch (e) {
        toast.push("error", e instanceof Error ? e.message : "Failed to load history.");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, filters],
  );

  useEffect(() => { void load(1); }, [load]);

  const flip = async (row: AttendanceRow) => {
    const next: AttendanceStatus = row.status === "PRESENT" ? "ABSENT" : "PRESENT";
    setFlipping(row.id);
    try {
      await api.attendance.updateRecord(token, row.id, next);
      toast.push("success", `${row.studentName}: ${row.status} → ${next} on ${fmtDate(row.date)}.`);
      await load(result?.page ?? 1);
    } catch (e) {
      toast.push("error", e instanceof Error ? e.message : "Update failed.");
    } finally {
      setFlipping(null);
    }
  };

  const exportCSV = () => {
    if (!result || result.rows.length === 0) return toast.push("warning", "Nothing to export on this page.");
    downloadCSV(
      `attendify-history-${todayISO()}.csv`,
      ["Date", "Enrollment", "Student", "Subject", "Class", "Status", "Teacher"],
      result.rows.map((r) => [fmtDate(r.date), r.enrollmentNo, r.studentName, `${r.subjectCode} ${r.subjectName}`, r.className, r.status, r.teacherName]),
    );
    toast.push("success", "CSV exported.");
  };

  const setF = (k: keyof AttendanceFilters, v: string) => setFilters((p) => ({ ...p, [k]: v, page: 1 }));

  return (
    <Layout title={isStudent ? "My History" : "Attendance History"} sub={isStudent ? "Every class record, filterable by subject, date and status" : "Browse and edit attendance records with filters"}>
      <PageHead title="Attendance History" sub="Filtered from the same records that power the dashboards">
        <Button variant="outline" icon={Download} onClick={exportCSV}>Export CSV</Button>
      </PageHead>

      <Card className="overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100 flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-[190px]">
            <Field label="Subject">
              <Select value={filters.subjectId ?? ""} onChange={(e) => setF("subjectId", e.target.value)}>
                <option value="">All subjects</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
              </Select>
            </Field>
          </div>
          {!isStudent && (
            <div className="w-[150px]">
              <Field label="Class">
                <Select value={filters.classId ?? ""} onChange={(e) => setF("classId", e.target.value)}>
                  <option value="">All classes</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
            </div>
          )}
          <div className="w-[150px]">
            <Field label="From"><Input type="date" value={filters.from ?? ""} max={todayISO()} onChange={(e) => setF("from", e.target.value)} /></Field>
          </div>
          <div className="w-[150px]">
            <Field label="To"><Input type="date" value={filters.to ?? ""} max={todayISO()} onChange={(e) => setF("to", e.target.value)} /></Field>
          </div>
          <div className="w-[140px]">
            <Field label="Status">
              <Select value={filters.status ?? ""} onChange={(e) => setF("status", e.target.value)}>
                <option value="">All</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
              </Select>
            </Field>
          </div>
          {!isStudent && (
            <div className="flex-1 min-w-[180px]">
              <Field label="Search Student"><SearchInput value={filters.query ?? ""} onChange={(v) => setF("query", v)} placeholder="Name or enrollment…" /></Field>
            </div>
          )}
        </div>

        {loading ? <TableSkeleton rows={9} /> : !result || result.rows.length === 0 ? (
          <EmptyState icon={SearchX} title="No records match these filters" hint="Try widening the date range or clearing filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  {!isStudent && <th>Student</th>}
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Teacher</th>
                  {!isStudent && <th className="text-right">Edit</th>}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r, i) => (
                  <tr key={r.id} className="anim-fade-up" style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}>
                    <td className="font-semibold text-slate-600 whitespace-nowrap">{fmtDate(r.date)}</td>
                    {!isStudent && (
                      <td><p className="font-bold text-slate-700">{r.studentName}</p><p className="font-mono text-[10.5px] text-slate-400">{r.enrollmentNo}</p></td>
                    )}
                    <td><p className="font-bold text-slate-700">{r.subjectName}</p><p className="font-mono text-[10.5px] text-slate-400">{r.subjectCode}</p></td>
                    <td><Badge tone="brand">{r.className}</Badge></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="font-semibold text-slate-500">{r.teacherName}</td>
                    {!isStudent && (
                      <td className="text-right">
                        <button
                          onClick={() => void flip(r)}
                          disabled={flipping === r.id}
                          title={`Mark ${r.status === "PRESENT" ? "absent" : "present"}`}
                          className="p-2 rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-700 transition-colors disabled:opacity-40"
                        >
                          {flipping === r.id ? <Spinner /> : <PencilLine className="w-4 h-4" />}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && result && (
          <div className="border-t border-slate-100 px-4">
            <Pagination page={result.page} pages={result.pages} total={result.total} onPage={(p) => void load(p)} />
          </div>
        )}
      </Card>
    </Layout>
  );
}

/* =========================================================
   REPORTS
   ========================================================= */
const TABS: { id: ReportType; label: string; desc: string }[] = [
  { id: "daily", label: "Daily", desc: "One date, every session" },
  { id: "monthly", label: "Monthly", desc: "Subject totals for a month" },
  { id: "subject", label: "Subject-wise", desc: "Every student in a subject" },
  { id: "student", label: "Student-wise", desc: "One student, all subjects" },
  { id: "low", label: "Low Attendance", desc: "Everyone below 75%" },
];

export function ReportsPage() {
  const { token, user } = useAuth();
  const toast = useToast();
  const [params] = useSearchParams();
  const initialTab = (params.get("tab") as ReportType) || "daily";

  const [tab, setTab] = useState<ReportType>(TABS.some((t) => t.id === initialTab) ? initialTab : "daily");
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [date, setDate] = useState(todayISO());
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.classes.list(token).then(setClasses).catch(() => undefined);
    api.subjects.list(token).then(setSubjects).catch(() => undefined);
    api.students.list(token).then(setStudents).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const filters = { date, month, classId: classId || undefined, subjectId: subjectId || undefined, studentId: studentId || undefined, from: from || undefined, to: to || undefined };
      const res = await api.reports.generate(token, tab, filters);
      setReport(res);
      toast.push("success", `${res.title} — ${res.rows.length} rows generated.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!report) return;
    downloadCSV(`attendify-${report.type}-${todayISO()}.csv`, report.columns, report.rows);
    toast.push("success", "Report exported as CSV.");
  };

  const selectCls = "min-w-[160px] w-full sm:w-auto";

  return (
    <Layout title="Reports" sub={user?.role === "TEACHER" ? "Reports are scoped to the subjects you teach" : "Generate and export attendance reports"}>
      <PageHead title="Attendance Reports" sub="Filter, generate, then export as CSV for the office">
        <Button icon={FileText} loading={loading} onClick={() => void generate()}>Generate Report</Button>
        {report && <Button variant="outline" icon={Download} onClick={exportCSV}>Export CSV</Button>}
      </PageHead>

      {/* report type tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setReport(null); setError(null); }}
            className={cn(
              "text-left rounded-xl border px-4 py-3.5 transition-all duration-150 anim-fade-up",
              tab === t.id
                ? "bg-night-900 border-night-900 text-white shadow-[0_10px_24px_-10px_rgba(15,20,46,0.5)]"
                : "bg-white border-slate-200 hover:border-brand-300 hover:-translate-y-0.5",
            )}
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <p className={cn("text-[13.5px] font-bold", tab === t.id ? "text-white" : "text-night-900")}>{t.label}</p>
            <p className={cn("text-[11px] font-semibold mt-0.5", tab === t.id ? "text-slate-400" : "text-slate-400")}>{t.desc}</p>
          </button>
        ))}
      </div>

      {/* filters */}
      <Card className="p-4.5 mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-slate-400 pb-2.5"><Filter className="w-3.5 h-3.5" /> Filters</span>
          {tab === "daily" && (
            <div className="w-[170px]"><Field label="Date"><Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} /></Field></div>
          )}
          {tab === "monthly" && (
            <div className="w-[170px]"><Field label="Month"><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></Field></div>
          )}
          {(tab === "subject" || tab === "student") && (
            <>
              <div className="w-[150px]"><Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field></div>
              <div className="w-[150px]"><Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field></div>
            </>
          )}
          {tab === "subject" && (
            <div><Field label="Subject" required>
              <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={selectCls}>
                <option value="">Select subject…</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
              </Select>
            </Field></div>
          )}
          {tab === "student" && (
            <div><Field label="Student" required>
              <Select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={cn(selectCls, "max-w-[260px]")}>
                <option value="">Select student…</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.enrollmentNo} — {s.name}</option>)}
              </Select>
            </Field></div>
          )}
          {tab !== "student" && (
            <div><Field label="Class">
              <Select value={classId} onChange={(e) => setClassId(e.target.value)} className={selectCls}>
                <option value="">All classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field></div>
          )}
          {(tab === "monthly" || tab === "low") && (
            <div><Field label="Subject">
              <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={selectCls}>
                <option value="">All subjects</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
              </Select>
            </Field></div>
          )}
          <Button className="mb-0.5" icon={FileText} loading={loading} onClick={() => void generate()}>Generate</Button>
        </div>
      </Card>

      {/* result */}
      {error && (
        <Card className="p-5 anim-scale-in">
          <p className="flex items-center gap-2.5 text-[13.5px] font-bold text-bad-600"><AlertTriangle className="w-4.5 h-4.5" /> {error}</p>
        </Card>
      )}
      {!error && !report && !loading && (
        <Card>
          <EmptyState icon={BarChart3} title="No report generated yet" hint="Pick a report type, set the filters and press Generate Report." />
        </Card>
      )}
      {loading && <Card><TableSkeleton rows={7} /></Card>}

      {report && !loading && (
        <Card className="overflow-hidden anim-fade-up">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-[15.5px] text-night-900">{report.title}</h3>
              <p className="text-[12px] font-semibold text-slate-400 mt-0.5">{report.rows.length} rows · generated {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {report.summary.map((s) => (
                <span key={s.label} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-600">
                  {s.label}: <span className="text-night-900 tnum">{s.value}</span>
                </span>
              ))}
            </div>
          </div>
          {report.rows.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No data for these filters" hint="Try another date range or clear the class/subject filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr>{report.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>
                  {report.rows.map((row, i) => (
                    <tr key={i} className="anim-fade-up" style={{ animationDelay: `${Math.min(i, 12) * 20}ms` }}>
                      {row.map((cell, j) => <td key={j}><Cell value={cell} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </Layout>
  );
}

/* =========================================================
   PROFILE
   ========================================================= */
export function ProfilePage() {
  const { token, user } = useAuth();
  const toast = useToast();
  const [details, setDetails] = useState<Record<string, string> | null>(null);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.personId) {
      setDetails({});
      return;
    }
    const loader = user.role === "STUDENT"
      ? api.students.get(token, user.personId).then((s) => ({
          "Enrollment No": s.enrollmentNo, Branch: s.branch, Semester: `Sem ${s.semester}`, Section: s.section,
          Phone: s.phone, Class: s.classId ? "Assigned" : "Unassigned",
        }))
      : api.teachers.get(token, user.personId).then((t) => ({
          Department: t.department, Phone: t.phone, Status: t.active ? "Active" : "Inactive",
        }));
    loader.then(setDetails).catch(() => setDetails({}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.personId, user?.role]);

  const changePw = async () => {
    setPwErr(null);
    if (pw.next.length < 6) return setPwErr("New password must be at least 6 characters.");
    if (pw.next !== pw.confirm) return setPwErr("New passwords do not match.");
    setSaving(true);
    try {
      await api.auth.changePassword(token, pw.current, pw.next);
      toast.push("success", "Password changed successfully.");
      setPw({ current: "", next: "", confirm: "" });
    } catch (e) {
      setPwErr(e instanceof Error ? e.message : "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Layout title="Profile" sub="Your account details and security">
      <PageHead title="My Profile" sub="Signed in with a JWT bearer session" />
      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <Card className="p-6 anim-fade-up">
          <div className="flex items-center gap-4">
            <span className="grid place-items-center w-16 h-16 rounded-2xl bg-night-900 text-white font-display font-bold text-xl">
              {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <div>
              <h3 className="font-display font-bold text-[1.25rem] text-night-900">{user.name}</h3>
              <p className="text-[13px] font-semibold text-slate-500">{user.email}</p>
              <Badge tone={user.role === "ADMIN" ? "night" : user.role === "TEACHER" ? "brand" : "ok"} className="mt-2 capitalize">{user.role.toLowerCase()}</Badge>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-5 grid sm:grid-cols-2 gap-x-6 gap-y-4">
            {[["Role", user.role], ["Account ID", user.id], ["Member Since", new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })]].map(([k, v]) => (
              <div key={k}><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k}</p><p className="font-semibold text-slate-700 text-[13.5px] mt-0.5">{v}</p></div>
            ))}
            {details === null ? (
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-400 sm:col-span-2"><Spinner /> Loading details…</div>
            ) : (
              Object.entries(details).map(([k, v]) => (
                <div key={k}><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k}</p><p className="font-semibold text-slate-700 text-[13.5px] mt-0.5">{v}</p></div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6 anim-fade-up">
          <h3 className="font-display font-bold text-[15.5px] text-night-900 flex items-center gap-2">
            <KeyRound className="w-4.5 h-4.5 text-brand-600" /> Change Password
          </h3>
          <p className="text-[12.5px] font-semibold text-slate-400 mt-1 mb-5">Stored as a one-way hash — never in plain text.</p>
          {pwErr && <p className="mb-4 flex items-center gap-2 rounded-lg border border-bad-200 bg-bad-50 px-3.5 py-2.5 text-[12.5px] font-bold text-bad-700 anim-scale-in"><AlertTriangle className="w-4 h-4 shrink-0" />{pwErr}</p>}
          <div className="space-y-4">
            <Field label="Current Password" required><Input type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} placeholder="••••••••" /></Field>
            <Field label="New Password" required hint="Minimum 6 characters"><Input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="••••••••" /></Field>
            <Field label="Confirm New Password" required><Input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" /></Field>
            <Button loading={saving} onClick={() => void changePw()} icon={KeyRound}>Update Password</Button>
          </div>
        </Card>
      </div>
      <div className="mt-5 grid sm:grid-cols-3 gap-3">
        {[
          { icon: UserRound, title: "Role-scoped data", desc: "You only ever see what your role is allowed to." },
          { icon: HistoryIcon, title: "Every action tracked", desc: "Records carry created/updated timestamps." },
          { icon: Users, title: "Demo credentials", desc: "admin@ / teacher@ / student@attendify.com" },
        ].map((c) => (
          <Card key={c.title} className="p-4 anim-fade-up">
            <c.icon className="w-4.5 h-4.5 text-brand-600" />
            <p className="font-bold text-[13.5px] text-night-900 mt-2.5">{c.title}</p>
            <p className="text-[12.5px] font-semibold text-slate-500 mt-1">{c.desc}</p>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
