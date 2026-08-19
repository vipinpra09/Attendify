import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Eye, GraduationCap, Pencil, Plus, School, SearchX, Trash2, Users, BookOpen, Layers } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Layout } from "../components/layout";
import {
  Badge, Button, Card, Confirm, EmptyState, Field, Input, Modal, PageHead, Pagination,
  PctBadge, Progress, SearchInput, Select, Spinner, StatCard, TableSkeleton, useToast,
} from "../components/ui";
import type { ClassRow, StudentRow, SubjectRow, TeacherRow } from "../lib/types";

/* ---------- shared bits ---------- */
function useLoad<T>(fn: () => Promise<T>) {
  const toast = useToast();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fn()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) toast.push("error", e instanceof Error ? e.message : "Request failed."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  return { data, loading, reload: () => setTick((t) => t + 1) };
}

function mapErrors(errors: string[] | undefined, labelMap: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  (errors ?? []).forEach((e) => {
    const i = e.indexOf(":");
    if (i === -1) return;
    const key = labelMap[e.slice(0, i).trim()];
    if (key) out[key] = e.slice(i + 1).trim();
  });
  return out;
}

function IconBtn({ title, onClick, tone = "slate", children }: { title: string; onClick: () => void; tone?: "slate" | "bad" | "brand"; children: ReactNode }) {
  const cls = tone === "bad" ? "hover:bg-bad-50 hover:text-bad-600" : tone === "brand" ? "hover:bg-brand-50 hover:text-brand-700" : "hover:bg-slate-100 hover:text-slate-700";
  return (
    <button onClick={onClick} title={title} aria-label={title} className={`p-2 rounded-lg text-slate-400 transition-colors ${cls}`}>
      {children}
    </button>
  );
}

const BRANCHES = ["CSE", "IT", "ECE", "EE", "Mechanical", "Civil"];
const DEPARTMENTS = ["CSE", "IT", "ECE", "EE", "Mechanical", "Civil", "Mathematics", "Physics"];
const PAGE_SIZE = 10;

/* =========================================================
   STUDENTS
   ========================================================= */
const STUDENT_LABELS: Record<string, string> = {
  "Full name": "name", "Enrollment no": "enrollmentNo", Email: "email", Password: "password",
  Phone: "phone", Branch: "branch", Semester: "semester", Section: "section", Class: "classId",
};

function StudentForm({ initial, isEdit, onClose, onSaved }: {
  initial: StudentRow | null; isEdit: boolean; onClose: () => void; onSaved: (msg: string) => void;
}) {
  const { token } = useAuth();
  const toast = useToast();
  const { data: classes } = useLoad(() => api.classes.list(token));
  const [f, setF] = useState({
    name: initial?.name ?? "", enrollmentNo: initial?.enrollmentNo ?? "", email: initial?.email ?? "",
    password: "", phone: initial?.phone ?? "", branch: initial?.branch ?? "CSE",
    semester: initial?.semester ?? 3, section: initial?.section ?? "A", classId: initial?.classId ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setSaving(true);
    setErrors({});
    try {
      if (isEdit && initial) {
        await api.students.update(token, initial.id, { ...f, password: f.password || undefined });
        onSaved(`${f.name} updated successfully.`);
      } else {
        await api.students.create(token, f);
        onSaved(`${f.name} added — login account created.`);
      }
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        setErrors(mapErrors(e.errors, STUDENT_LABELS));
        toast.push("error", e.message);
      } else toast.push("error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Student" : "Add Student"} size="lg"
      subtitle={isEdit ? `Update details for ${initial?.enrollmentNo}` : "Creates the student record and a login account"}
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={saving} onClick={() => void submit()}>{isEdit ? "Save Changes" : "Add Student"}</Button>
      </>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full Name" required error={errors.name}><Input value={f.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Aarav Kumar" /></Field>
        <Field label="Enrollment Number" required error={errors.enrollmentNo}><Input value={f.enrollmentNo} error={!!errors.enrollmentNo} onChange={(e) => set("enrollmentNo", e.target.value)} placeholder="CSE23019" className="font-mono" /></Field>
        <Field label="Email" required error={errors.email}><Input type="email" value={f.email} error={!!errors.email} onChange={(e) => set("email", e.target.value)} placeholder="name@attendify.com" /></Field>
        <Field label={isEdit ? "New Password" : "Password"} required={!isEdit} error={errors.password} hint={isEdit ? "Leave blank to keep current password" : "Minimum 6 characters"}>
          <Input type="password" value={f.password} error={!!errors.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label="Phone" required error={errors.phone}><Input value={f.phone} error={!!errors.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98XXXXXXXX" /></Field>
        <Field label="Branch" required error={errors.branch}>
          <Select value={f.branch} onChange={(e) => set("branch", e.target.value)}>{BRANCHES.map((b) => <option key={b}>{b}</option>)}</Select>
        </Field>
        <Field label="Semester" required error={errors.semester}>
          <Select value={f.semester} onChange={(e) => set("semester", Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}</Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Section" required error={errors.section}>
            <Select value={f.section} onChange={(e) => set("section", e.target.value)}>{["A", "B", "C"].map((s) => <option key={s}>{s}</option>)}</Select>
          </Field>
          <Field label="Class" required error={errors.classId}>
            <Select value={f.classId} error={!!errors.classId} onChange={(e) => set("classId", e.target.value)}>
              <option value="">Select…</option>
              {(classes ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

function ViewStudent({ student, onClose }: { student: StudentRow; onClose: () => void }) {
  const { token } = useAuth();
  const [report, setReport] = useState<{ columns: string[]; rows: (string | number)[][]; summary: { label: string; value: string }[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let c = false;
    api.reports.generate(token, "student", { studentId: student.id })
      .then((r) => { if (!c) setReport(r); })
      .catch((e) => { if (!c) setErr(e instanceof Error ? e.message : "Failed"); });
    return () => { c = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  return (
    <Modal open onClose={onClose} title={student.name} subtitle={`${student.enrollmentNo} · ${student.className}`} size="lg">
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[13.5px]">
        {[["Email", student.email], ["Phone", student.phone], ["Branch", student.branch], ["Semester", `Sem ${student.semester} · Section ${student.section}`], ["Class", student.className], ["Status", student.active ? "Active" : "Inactive"]].map(([k, v]) => (
          <div key={k}><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{k}</p><p className="font-semibold text-slate-700 mt-0.5">{v}</p></div>
        ))}
      </div>
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="font-display font-bold text-[14.5px] text-night-900 mb-3">Attendance Summary</p>
        {err ? (
          <p className="text-[13px] font-semibold text-bad-600">{err}</p>
        ) : !report ? (
          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-400 py-4"><Spinner /> Loading summary…</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-3">
              {report.summary.map((s) => <Badge key={s.label} tone="slate">{s.label}: <span className="tnum">{s.value}</span></Badge>)}
            </div>
            <table className="tbl">
              <thead><tr>{report.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {report.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((cell, j) => (
                      <td key={j} className={j === r.length - 1 ? "" : "tnum font-semibold text-slate-600"}>
                        {j === r.length - 1 ? (cell === "LOW" ? <Badge tone="bad">LOW</Badge> : <Badge tone="ok">GOOD</Badge>) : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {report.rows.length === 0 && <p className="text-[13px] font-semibold text-slate-400 py-3 text-center">No attendance recorded yet.</p>}
          </>
        )}
      </div>
    </Modal>
  );
}

export function StudentsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const { data: students, loading, reload } = useLoad(() => api.students.list(token));
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{ isEdit: boolean; row: StudentRow | null } | null>(null);
  const [viewing, setViewing] = useState<StudentRow | null>(null);
  const [deleting, setDeleting] = useState<StudentRow | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (students ?? []).filter((s) =>
      (!classFilter || s.classId === classFilter) &&
      (!q || s.name.toLowerCase().includes(q) || s.enrollmentNo.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)),
    );
  }, [students, search, classFilter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const classes = useMemo(() => [...new Map((students ?? []).map((s) => [s.classId, s.className])).entries()].filter(([id]) => id), [students]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.students.remove(token, deleting.id);
      toast.push("success", `${deleting.name} deleted along with their attendance records.`);
      setDeleting(null);
      reload();
    } catch (e) {
      toast.push("error", e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title="Students" sub="Manage student records and login accounts">
      <PageHead title="Student Management" sub={`${filtered.length} student${filtered.length === 1 ? "" : "s"} · unique enrollment & email enforced`}>
        <Button icon={Plus} onClick={() => setEditor({ isEdit: false, row: null })}>Add Student</Button>
      </PageHead>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <div className="flex-1 min-w-[220px]"><SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, enrollment, email…" /></div>
          <Select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }} className="w-auto min-w-[150px]">
            <option value="">All classes</option>
            {classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </Select>
        </div>

        {loading ? <TableSkeleton rows={8} /> : paged.length === 0 ? (
          <EmptyState icon={search || classFilter ? SearchX : Users} title={search || classFilter ? "No matching students" : "No students yet"}
            hint={search || classFilter ? "Try a different search term or clear the class filter." : "Add your first student to get started."}
            action={!search && !classFilter ? <Button icon={Plus} onClick={() => setEditor({ isEdit: false, row: null })}>Add Student</Button> : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>ID</th><th>Enrollment No</th><th>Name</th><th>Branch · Sem</th><th>Class</th><th>Attendance</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {paged.map((s, i) => (
                  <tr key={s.id} className="anim-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                    <td className="font-mono text-[11.5px] text-slate-400">#{s.id.slice(-5)}</td>
                    <td className="font-mono font-bold text-[12.5px] text-brand-700">{s.enrollmentNo}</td>
                    <td><p className="font-bold text-slate-700">{s.name}</p><p className="text-[11.5px] font-semibold text-slate-400">{s.email}</p></td>
                    <td className="font-semibold text-slate-600">{s.branch} · {s.semester}</td>
                    <td><Badge tone="brand">{s.className}</Badge></td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Progress value={s.percent} className="w-[84px]" />
                        <span className="tnum text-[12.5px] font-bold text-slate-600">{s.percent === null ? "—" : `${s.percent}%`}</span>
                      </div>
                    </td>
                    <td>{s.active ? <Badge tone="ok">ACTIVE</Badge> : <Badge tone="slate">INACTIVE</Badge>}</td>
                    <td>
                      <div className="flex justify-end gap-0.5">
                        <IconBtn title="View" tone="brand" onClick={() => setViewing(s)}><Eye className="w-4 h-4" /></IconBtn>
                        <IconBtn title="Edit" onClick={() => setEditor({ isEdit: true, row: s })}><Pencil className="w-4 h-4" /></IconBtn>
                        <IconBtn title="Delete" tone="bad" onClick={() => setDeleting(s)}><Trash2 className="w-4 h-4" /></IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <div className="border-t border-slate-100 px-4"><Pagination page={page} pages={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))} total={filtered.length} onPage={setPage} /></div>}
      </Card>

      {editor && <StudentForm initial={editor.row} isEdit={editor.isEdit} onClose={() => setEditor(null)} onSaved={(m) => { toast.push("success", m); reload(); }} />}
      {viewing && <ViewStudent student={viewing} onClose={() => setViewing(null)} />}
      <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => void confirmDelete()} loading={busy}
        title="Delete student?" confirmLabel="Delete Student"
        message={<>This permanently removes <strong>{deleting?.name}</strong> ({deleting?.enrollmentNo}), their login account and <strong>all attendance history</strong>. This cannot be undone.</>} />
    </Layout>
  );
}

/* =========================================================
   TEACHERS
   ========================================================= */
const TEACHER_LABELS: Record<string, string> = { Name: "name", Email: "email", Password: "password", Department: "department", Phone: "phone" };

function TeacherForm({ initial, isEdit, onClose, onSaved }: { initial: TeacherRow | null; isEdit: boolean; onClose: () => void; onSaved: (msg: string) => void }) {
  const { token } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({
    name: initial?.name ?? "", email: initial?.email ?? "", password: "",
    department: initial?.department ?? "CSE", phone: initial?.phone ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setSaving(true);
    setErrors({});
    try {
      if (isEdit && initial) {
        await api.teachers.update(token, initial.id, { ...f, password: f.password || undefined });
        onSaved(`${f.name} updated successfully.`);
      } else {
        await api.teachers.create(token, f);
        onSaved(`${f.name} added — login account created.`);
      }
      onClose();
    } catch (e) {
      if (e instanceof ApiError) { setErrors(mapErrors(e.errors, TEACHER_LABELS)); toast.push("error", e.message); }
      else toast.push("error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Teacher" : "Add Teacher"}
      subtitle={isEdit ? undefined : "Creates the faculty record and a login account"}
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={saving} onClick={() => void submit()}>{isEdit ? "Save Changes" : "Add Teacher"}</Button>
      </>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full Name" required error={errors.name}><Input value={f.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Anita Sharma" /></Field>
        <Field label="Email" required error={errors.email}><Input type="email" value={f.email} error={!!errors.email} onChange={(e) => set("email", e.target.value)} placeholder="name@attendify.com" /></Field>
        <Field label={isEdit ? "New Password" : "Password"} required={!isEdit} error={errors.password} hint={isEdit ? "Leave blank to keep current" : "Minimum 6 characters"}>
          <Input type="password" value={f.password} error={!!errors.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label="Department" required error={errors.department}>
          <Select value={f.department} onChange={(e) => set("department", e.target.value)}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select>
        </Field>
        <Field label="Phone" required error={errors.phone}><Input value={f.phone} error={!!errors.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98XXXXXXXX" /></Field>
      </div>
    </Modal>
  );
}

export function TeachersPage() {
  const { token } = useAuth();
  const toast = useToast();
  const { data: teachers, loading, reload } = useLoad(() => api.teachers.list(token));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{ isEdit: boolean; row: TeacherRow | null } | null>(null);
  const [deleting, setDeleting] = useState<TeacherRow | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (teachers ?? []).filter((t) => !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.department.toLowerCase().includes(q));
  }, [teachers, search]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.teachers.remove(token, deleting.id);
      toast.push("success", `${deleting.name} deleted.`);
      setDeleting(null);
      reload();
    } catch (e) {
      toast.push("error", e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title="Teachers" sub="Manage faculty records and subject assignments">
      <PageHead title="Teacher Management" sub={`${filtered.length} faculty member${filtered.length === 1 ? "" : "s"} · unique email enforced`}>
        <Button icon={Plus} onClick={() => setEditor({ isEdit: false, row: null })}>Add Teacher</Button>
      </PageHead>
      <Card className="overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100"><SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, email, department…" /></div>
        {loading ? <TableSkeleton rows={6} /> : paged.length === 0 ? (
          <EmptyState icon={search ? SearchX : GraduationCap} title={search ? "No matching teachers" : "No teachers yet"}
            hint={search ? "Try a different search term." : "Add your first teacher to get started."}
            action={!search ? <Button icon={Plus} onClick={() => setEditor({ isEdit: false, row: null })}>Add Teacher</Button> : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Phone</th><th>Subjects</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {paged.map((t, i) => (
                  <tr key={t.id} className="anim-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                    <td className="font-mono text-[11.5px] text-slate-400">#{t.id.slice(-5)}</td>
                    <td><p className="font-bold text-slate-700">{t.name}</p><p className="text-[11.5px] font-semibold text-slate-400">{t.email}</p></td>
                    <td><Badge tone="slate">{t.department}</Badge></td>
                    <td className="tnum font-semibold text-slate-600">{t.phone}</td>
                    <td>{t.subjectCount > 0 ? <Badge tone="brand" className="tnum">{t.subjectCount} assigned</Badge> : <Badge tone="warn">unassigned</Badge>}</td>
                    <td>{t.active ? <Badge tone="ok">ACTIVE</Badge> : <Badge tone="slate">INACTIVE</Badge>}</td>
                    <td>
                      <div className="flex justify-end gap-0.5">
                        <IconBtn title="Edit" onClick={() => setEditor({ isEdit: true, row: t })}><Pencil className="w-4 h-4" /></IconBtn>
                        <IconBtn title="Delete" tone="bad" onClick={() => setDeleting(t)}><Trash2 className="w-4 h-4" /></IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <div className="border-t border-slate-100 px-4"><Pagination page={page} pages={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))} total={filtered.length} onPage={setPage} /></div>}
      </Card>
      {editor && <TeacherForm initial={editor.row} isEdit={editor.isEdit} onClose={() => setEditor(null)} onSaved={(m) => { toast.push("success", m); reload(); }} />}
      <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => void confirmDelete()} loading={busy}
        title="Delete teacher?" confirmLabel="Delete Teacher"
        message={<>This removes <strong>{deleting?.name}</strong> and their login account. Teachers with assigned subjects cannot be deleted — reassign their subjects first.</>} />
    </Layout>
  );
}

/* =========================================================
   SUBJECTS
   ========================================================= */
const SUBJECT_LABELS: Record<string, string> = { "Subject name": "name", "Subject code": "code", Department: "department", Semester: "semester", Teacher: "teacherId" };

function SubjectForm({ initial, isEdit, onClose, onSaved }: { initial: SubjectRow | null; isEdit: boolean; onClose: () => void; onSaved: (msg: string) => void }) {
  const { token } = useAuth();
  const toast = useToast();
  const { data: teachers } = useLoad(() => api.teachers.list(token));
  const [f, setF] = useState({
    name: initial?.name ?? "", code: initial?.code ?? "", department: initial?.department ?? "CSE",
    semester: initial?.semester ?? 3, teacherId: initial?.teacherId ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setSaving(true);
    setErrors({});
    try {
      if (isEdit && initial) {
        await api.subjects.update(token, initial.id, f);
        onSaved(`${f.name} updated successfully.`);
      } else {
        await api.subjects.create(token, f);
        onSaved(`${f.name} (${f.code.toUpperCase()}) created.`);
      }
      onClose();
    } catch (e) {
      if (e instanceof ApiError) { setErrors(mapErrors(e.errors, SUBJECT_LABELS)); toast.push("error", e.message); }
      else toast.push("error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Subject" : "Add Subject"} subtitle="Assign the teacher who will take this subject"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={saving} onClick={() => void submit()}>{isEdit ? "Save Changes" : "Add Subject"}</Button>
      </>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><Field label="Subject Name" required error={errors.name}><Input value={f.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Data Structures" /></Field></div>
        <Field label="Subject Code" required error={errors.code} hint="Format: BCS301"><Input value={f.code} error={!!errors.code} onChange={(e) => set("code", e.target.value)} placeholder="BCS301" className="font-mono" /></Field>
        <Field label="Teacher" required error={errors.teacherId}>
          <Select value={f.teacherId} error={!!errors.teacherId} onChange={(e) => set("teacherId", e.target.value)}>
            <option value="">Select teacher…</option>
            {(teachers ?? []).map((t) => <option key={t.id} value={t.id}>{t.name} — {t.department}</option>)}
          </Select>
        </Field>
        <Field label="Department" required error={errors.department}>
          <Select value={f.department} onChange={(e) => set("department", e.target.value)}>{DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</Select>
        </Field>
        <Field label="Semester" required error={errors.semester}>
          <Select value={f.semester} onChange={(e) => set("semester", Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}</Select>
        </Field>
      </div>
    </Modal>
  );
}

export function SubjectsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const { data: subjects, loading, reload } = useLoad(() => api.subjects.list(token));
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{ isEdit: boolean; row: SubjectRow | null } | null>(null);
  const [deleting, setDeleting] = useState<SubjectRow | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (subjects ?? []).filter((s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.teacherName.toLowerCase().includes(q));
  }, [subjects, search]);

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.subjects.remove(token, deleting.id);
      toast.push("success", `${deleting.name} deleted along with its attendance records.`);
      setDeleting(null);
      reload();
    } catch (e) {
      toast.push("error", e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title="Subjects" sub="Create subjects and assign teachers">
      <PageHead title="Subject Management" sub={`${filtered.length} subjects · unique codes enforced`}>
        <Button icon={Plus} onClick={() => setEditor({ isEdit: false, row: null })}>Add Subject</Button>
      </PageHead>
      <Card className="overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100"><SearchInput value={search} onChange={setSearch} placeholder="Search subject, code or teacher…" /></div>
        {loading ? <TableSkeleton rows={6} /> : filtered.length === 0 ? (
          <EmptyState icon={search ? SearchX : BookOpen} title={search ? "No matching subjects" : "No subjects yet"}
            hint={search ? "Try a different search term." : "Add subjects like Data Structures (BCS301) and assign a teacher."}
            action={!search ? <Button icon={Plus} onClick={() => setEditor({ isEdit: false, row: null })}>Add Subject</Button> : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Code</th><th>Subject Name</th><th>Department</th><th>Semester</th><th>Teacher</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className="anim-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                    <td className="font-mono font-bold text-[12.5px] text-brand-700">{s.code}</td>
                    <td className="font-bold text-slate-700">{s.name}</td>
                    <td><Badge tone="slate">{s.department}</Badge></td>
                    <td className="font-semibold text-slate-600 tnum">Sem {s.semester}</td>
                    <td><span className="inline-flex items-center gap-2 font-semibold text-slate-600"><span className="grid place-items-center w-6.5 h-6.5 rounded-md bg-brand-50 text-brand-700 text-[10.5px] font-bold">{s.teacherName.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>{s.teacherName}</span></td>
                    <td>
                      <div className="flex justify-end gap-0.5">
                        <IconBtn title="Edit" onClick={() => setEditor({ isEdit: true, row: s })}><Pencil className="w-4 h-4" /></IconBtn>
                        <IconBtn title="Delete" tone="bad" onClick={() => setDeleting(s)}><Trash2 className="w-4 h-4" /></IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {editor && <SubjectForm initial={editor.row} isEdit={editor.isEdit} onClose={() => setEditor(null)} onSaved={(m) => { toast.push("success", m); reload(); }} />}
      <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => void confirmDelete()} loading={busy}
        title="Delete subject?" confirmLabel="Delete Subject"
        message={<>Deleting <strong>{deleting?.name}</strong> ({deleting?.code}) will also remove <strong>all of its attendance records</strong>. This cannot be undone.</>} />
    </Layout>
  );
}

/* =========================================================
   CLASSES
   ========================================================= */
const CLASS_LABELS: Record<string, string> = { "Class name": "name", Branch: "branch", Semester: "semester", Section: "section", "Academic year": "academicYear" };

function ClassForm({ initial, isEdit, onClose, onSaved }: { initial: ClassRow | null; isEdit: boolean; onClose: () => void; onSaved: (msg: string) => void }) {
  const { token } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({
    name: initial?.name ?? "", branch: initial?.branch ?? "CSE", semester: initial?.semester ?? 3,
    section: initial?.section ?? "A", academicYear: initial?.academicYear ?? "2025-26",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setSaving(true);
    setErrors({});
    try {
      if (isEdit && initial) {
        await api.classes.update(token, initial.id, f);
        onSaved(`${f.name} updated successfully.`);
      } else {
        await api.classes.create(token, f);
        onSaved(`Class ${f.name.toUpperCase()} created.`);
      }
      onClose();
    } catch (e) {
      if (e instanceof ApiError) { setErrors(mapErrors(e.errors, CLASS_LABELS)); toast.push("error", e.message); }
      else toast.push("error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Class" : "Add Class"} subtitle="e.g. CSE-A · CSE · Semester 3 · Section A · 2025-26"
      footer={<>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button loading={saving} onClick={() => void submit()}>{isEdit ? "Save Changes" : "Create Class"}</Button>
      </>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><Field label="Class Name" required error={errors.name}><Input value={f.name} error={!!errors.name} onChange={(e) => set("name", e.target.value)} placeholder="CSE-A" /></Field></div>
        <Field label="Branch" required error={errors.branch}>
          <Select value={f.branch} onChange={(e) => set("branch", e.target.value)}>{BRANCHES.map((b) => <option key={b}>{b}</option>)}</Select>
        </Field>
        <Field label="Semester" required error={errors.semester}>
          <Select value={f.semester} onChange={(e) => set("semester", Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}</Select>
        </Field>
        <Field label="Section" required error={errors.section}>
          <Select value={f.section} onChange={(e) => set("section", e.target.value)}>{["A", "B", "C"].map((s) => <option key={s}>{s}</option>)}</Select>
        </Field>
        <Field label="Academic Year" required error={errors.academicYear} hint="Format: 2025-26">
          <Input value={f.academicYear} error={!!errors.academicYear} onChange={(e) => set("academicYear", e.target.value)} placeholder="2025-26" className="font-mono" />
        </Field>
      </div>
    </Modal>
  );
}

export function ClassesPage() {
  const { token } = useAuth();
  const toast = useToast();
  const { data: classes, loading, reload } = useLoad(() => api.classes.list(token));
  const [editor, setEditor] = useState<{ isEdit: boolean; row: ClassRow | null } | null>(null);
  const [deleting, setDeleting] = useState<ClassRow | null>(null);
  const [busy, setBusy] = useState(false);

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.classes.remove(token, deleting.id);
      toast.push("success", `${deleting.name} deleted. Its students are now unassigned.`);
      setDeleting(null);
      reload();
    } catch (e) {
      toast.push("error", e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout title="Classes" sub="Sections, branches and academic years">
      <PageHead title="Class Management" sub={`${(classes ?? []).length} classes · students & subjects link through branch + semester`}>
        <Button icon={Plus} onClick={() => setEditor({ isEdit: false, row: null })}>Add Class</Button>
      </PageHead>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard icon={School} label="Total Classes" value={(classes ?? []).length} sub="Active sections" />
        <StatCard icon={Users} label="Students Assigned" value={(classes ?? []).reduce((a, c) => a + c.studentCount, 0)} sub="Across classes" delay={60} />
        <StatCard icon={BookOpen} label="Subject Links" value={(classes ?? []).reduce((a, c) => a + c.subjectCount, 0)} sub="Via branch + semester" delay={120} />
        <StatCard icon={Layers} label="Academic Year" value={(classes ?? [])[0]?.academicYear ?? "—"} sub="Current session" delay={180} />
      </div>

      <Card className="overflow-hidden">
        {loading ? <TableSkeleton rows={4} /> : (classes ?? []).length === 0 ? (
          <EmptyState icon={School} title="No classes yet" hint="Create a class like CSE-A to group students."
            action={<Button icon={Plus} onClick={() => setEditor({ isEdit: false, row: null })}>Add Class</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Class</th><th>Branch</th><th>Semester</th><th>Section</th><th>Academic Year</th><th>Students</th><th>Subjects</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {(classes ?? []).map((c, i) => (
                  <tr key={c.id} className="anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <td className="font-display font-bold text-[15px] text-night-900">{c.name}</td>
                    <td><Badge tone="slate">{c.branch}</Badge></td>
                    <td className="font-semibold text-slate-600 tnum">Sem {c.semester}</td>
                    <td className="font-semibold text-slate-600">{c.section}</td>
                    <td className="font-mono text-[12.5px] font-semibold text-slate-500">{c.academicYear}</td>
                    <td><Badge tone="brand" className="tnum">{c.studentCount} students</Badge></td>
                    <td><Badge tone="ok" className="tnum">{c.subjectCount} subjects</Badge></td>
                    <td>
                      <div className="flex justify-end gap-0.5">
                        <IconBtn title="Edit" onClick={() => setEditor({ isEdit: true, row: c })}><Pencil className="w-4 h-4" /></IconBtn>
                        <IconBtn title="Delete" tone="bad" onClick={() => setDeleting(c)}><Trash2 className="w-4 h-4" /></IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {editor && <ClassForm initial={editor.row} isEdit={editor.isEdit} onClose={() => setEditor(null)} onSaved={(m) => { toast.push("success", m); reload(); }} />}
      <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={() => void confirmDelete()} loading={busy}
        title="Delete class?" confirmLabel="Delete Class"
        message={<>Deleting <strong>{deleting?.name}</strong> will unassign <strong>{deleting?.studentCount} student(s)</strong> from this class. Attendance history is preserved.</>} />
    </Layout>
  );
}
