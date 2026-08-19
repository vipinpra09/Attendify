/* =========================================================
   Attendify – API layer
   Mirrors the documented Spring Boot REST contract:
   every call is async, returns unwrapped data, and throws
   ApiError({ status, message, errors }) with proper codes:
   400 validation · 401 unauthenticated · 403 forbidden
   404 not found · 409 conflict
   ========================================================= */

import { getDB, persist, resetDB } from "./db";
import {
  addDaysISO,
  classesNeeded,
  fmtDate,
  fromISO,
  hashPassword,
  isLow,
  monthLabel,
  pct,
  todayISO,
  uid,
  type AttendanceFilters,
  type AttendanceRecord,
  type AttendanceRow,
  type AttendanceStatus,
  type ClassRow,
  type CollegeClass,
  type DayStat,
  type LoginResult,
  type Paged,
  type ReportFilters,
  type ReportResult,
  type ReportType,
  type Role,
  type SaveSessionPayload,
  type SessionInfo,
  type StoredUser,
  type Student,
  type StudentRow,
  type StudentStats,
  type StudentSummary,
  type Subject,
  type SubjectRow,
  type SubjectSummary,
  type Teacher,
  type TeacherRow,
  type TeacherStats,
  type TrendPoint,
  type User,
  type AdminStats,
} from "./types";

export class ApiError extends Error {
  status: number;
  errors?: string[];
  constructor(status: number, message: string, errors?: string[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

const delay = (ms?: number) =>
  new Promise<void>((r) => setTimeout(r, ms ?? 140 + Math.random() * 220));

function fail(status: number, message: string, errors?: string[]): never {
  throw new ApiError(status, message, errors);
}

/* ---------- tokens (JWT-style; the real backend uses jjwt) ---------- */
const SECRET = "attendify-demo-secret";
const TOKEN_TTL = 12 * 60 * 60 * 1000;

function signToken(user: StoredUser): string {
  const payload = { sub: user.id, role: user.role, exp: Date.now() + TOKEN_TTL };
  const body = btoa(JSON.stringify(payload));
  return `${body}.${hashPassword(body + SECRET)}`;
}

function verifyToken(token: string | null): { sub: string; role: Role } | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig || hashPassword(body + SECRET) !== sig) return null;
  try {
    const payload = JSON.parse(atob(body)) as { sub: string; role: Role; exp: number };
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function requireAuth(token: string | null, ...roles: Role[]): StoredUser {
  const payload = verifyToken(token);
  if (!payload) fail(401, "Your session has expired. Please log in again.");
  const user = getDB().users.find((u) => u.id === payload!.sub);
  if (!user) fail(401, "Account no longer exists.");
  if (roles.length > 0 && !roles.includes(user!.role)) {
    fail(403, "You don't have permission to perform this action.");
  }
  return user!;
}

const toUser = (u: StoredUser): User => ({
  id: u.id, name: u.name, email: u.email, role: u.role, personId: u.personId, createdAt: u.createdAt,
});

/* ---------- validation helpers ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields: [string, string | null][]) {
  const errors = fields.filter(([, err]) => err).map(([f, err]) => `${f}: ${err}`);
  if (errors.length) fail(400, "Please fix the highlighted fields.", errors);
}

/* ---------- enrichment ---------- */
function enrich(rec: AttendanceRecord): AttendanceRow {
  const db = getDB();
  const student = db.students.find((s) => s.id === rec.studentId);
  const subject = db.subjects.find((s) => s.id === rec.subjectId);
  const cls = db.classes.find((c) => c.id === rec.classId);
  const teacher = db.teachers.find((t) => t.id === rec.teacherId);
  return {
    ...rec,
    enrollmentNo: student?.enrollmentNo ?? "—",
    studentName: student?.name ?? "Removed student",
    subjectName: subject?.name ?? "Removed subject",
    subjectCode: subject?.code ?? "—",
    className: cls?.name ?? "—",
    teacherName: teacher?.name ?? "—",
  };
}

function mySubjectIds(user: StoredUser): string[] {
  return getDB().subjects.filter((s) => s.teacherId === user.personId).map((s) => s.id);
}

/* ---------- aggregations ---------- */
function subjectSummaries(records: AttendanceRecord[], allSubjects?: Subject[]): SubjectSummary[] {
  const db = getDB();
  const subjects = allSubjects ?? [...new Set(records.map((r) => r.subjectId))]
    .map((id) => db.subjects.find((s) => s.id === id))
    .filter((s): s is Subject => !!s);
  return subjects.map((subject) => {
    const recs = records.filter((r) => r.subjectId === subject.id);
    const attended = recs.filter((r) => r.status === "PRESENT").length;
    const teacher = db.teachers.find((t) => t.id === subject.teacherId);
    return {
      subjectId: subject.id, name: subject.name, code: subject.code,
      teacherName: teacher?.name ?? "Unassigned",
      total: recs.length, attended, percent: pct(attended, recs.length),
    };
  }).sort((a, b) => a.code.localeCompare(b.code));
}

function studentSummaries(records: AttendanceRecord[]): StudentSummary[] {
  const db = getDB();
  const ids = [...new Set(records.map((r) => r.studentId))];
  return ids.map((id) => {
    const student = db.students.find((s) => s.id === id);
    const recs = records.filter((r) => r.studentId === id);
    const attended = recs.filter((r) => r.status === "PRESENT").length;
    const cls = db.classes.find((c) => c.id === student?.classId);
    return {
      studentId: id,
      enrollmentNo: student?.enrollmentNo ?? "—",
      name: student?.name ?? "Removed student",
      className: cls?.name ?? "—",
      total: recs.length, attended,
      percent: pct(attended, recs.length),
      needed: classesNeeded(attended, recs.length),
    };
  }).sort((a, b) => (a.percent ?? 0) - (b.percent ?? 0));
}

function trendPoints(records: AttendanceRecord[], limit = 14): TrendPoint[] {
  const dates = [...new Set(records.map((r) => r.date))].sort();
  return dates.slice(-limit).map((date) => {
    const recs = records.filter((r) => r.date === date);
    return { date, percent: pct(recs.filter((r) => r.status === "PRESENT").length, recs.length) ?? 0 };
  });
}

function sessionInfos(records: AttendanceRecord[], limit = 10): SessionInfo[] {
  const db = getDB();
  const keys = [...new Set(records.map((r) => `${r.date}|${r.classId}|${r.subjectId}`))];
  const sessions = keys.map((key) => {
    const [date, classId, subjectId] = key.split("|");
    const recs = records.filter((r) => `${r.date}|${r.classId}|${r.subjectId}` === key);
    const present = recs.filter((r) => r.status === "PRESENT").length;
    const cls = db.classes.find((c) => c.id === classId);
    const subject = db.subjects.find((s) => s.id === subjectId);
    const teacher = db.teachers.find((t) => t.id === subject?.teacherId);
    return {
      date, classId, className: cls?.name ?? "—",
      subjectId, subjectName: subject?.name ?? "—", subjectCode: subject?.code ?? "—",
      teacherName: teacher?.name ?? "—",
      present, total: recs.length, percent: pct(present, recs.length),
    };
  });
  return sessions.sort((a, b) => b.date.localeCompare(a.date) || a.className.localeCompare(b.className)).slice(0, limit);
}

function dayStat(records: AttendanceRecord[]): DayStat {
  const today = todayISO();
  let date = today;
  let recs = records.filter((r) => r.date === today);
  if (recs.length === 0) {
    const dates = [...new Set(records.map((r) => r.date))].sort();
    date = dates[dates.length - 1] ?? today;
    recs = records.filter((r) => r.date === date);
  }
  const present = recs.filter((r) => r.status === "PRESENT").length;
  return { date, present, total: recs.length, percent: pct(present, recs.length), isToday: date === today };
}

/* =========================================================
   API
   ========================================================= */
export const api = {
  /* ---------- auth ---------- */
  auth: {
    async login(email: string, password: string): Promise<LoginResult> {
      await delay(420);
      const user = getDB().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!user || user.passwordHash !== hashPassword(password)) {
        fail(401, "Invalid email or password.");
      }
      return { token: signToken(user!), user: toUser(user!) };
    },
    async me(token: string | null): Promise<User> {
      await delay(80);
      return toUser(requireAuth(token));
    },
    async changePassword(token: string | null, current: string, next: string): Promise<User> {
      await delay();
      const user = requireAuth(token);
      if (user.passwordHash !== hashPassword(current)) fail(400, "Current password is incorrect.");
      if (next.length < 6) fail(400, "New password must be at least 6 characters.");
      user.passwordHash = hashPassword(next);
      persist();
      return toUser(user);
    },
  },

  /* ---------- students (ADMIN) ---------- */
  students: {
    async list(token: string | null): Promise<StudentRow[]> {
      await delay();
      requireAuth(token, "ADMIN", "TEACHER");
      const db = getDB();
      return db.students.map((s) => {
        const recs = db.attendance.filter((r) => r.studentId === s.id);
        const attended = recs.filter((r) => r.status === "PRESENT").length;
        return {
          ...s,
          className: db.classes.find((c) => c.id === s.classId)?.name ?? "Unassigned",
          percent: pct(attended, recs.length),
        };
      });
    },
    async get(token: string | null, id: string): Promise<Student> {
      await delay(120);
      const user = requireAuth(token, "ADMIN", "TEACHER", "STUDENT");
      if (user.role === "STUDENT" && user.personId !== id)
        fail(403, "You can only view your own profile.");
      const s = getDB().students.find((s) => s.id === id);
      if (!s) fail(404, "Student not found.");
      return s!;
    },
    async create(token: string | null, payload: Partial<Student> & { password: string }): Promise<Student> {
      await delay();
      requireAuth(token, "ADMIN");
      const db = getDB();
      const errs: [string, string | null][] = [
        ["Full name", !payload.name || payload.name.trim().length < 3 ? "Minimum 3 characters" : null],
        ["Enrollment no", !payload.enrollmentNo || !/^[A-Za-z0-9-]{4,}$/.test(payload.enrollmentNo) ? "Minimum 4 letters/digits" : null],
        ["Email", !payload.email || !EMAIL_RE.test(payload.email) ? "Enter a valid email" : null],
        ["Password", !payload.password || payload.password.length < 6 ? "Minimum 6 characters" : null],
        ["Phone", !payload.phone || payload.phone.replace(/\D/g, "").length < 10 ? "Enter a 10-digit phone" : null],
        ["Branch", !payload.branch ? "Required" : null],
        ["Semester", !payload.semester || payload.semester < 1 || payload.semester > 8 ? "1–8" : null],
        ["Section", !payload.section ? "Required" : null],
        ["Class", !payload.classId ? "Required" : null],
      ];
      if (payload.email && db.students.some((s) => s.email.toLowerCase() === payload.email!.toLowerCase()))
        errs.push(["Email", "Already registered to another student"]);
      if (payload.email && db.users.some((u) => u.email.toLowerCase() === payload.email!.toLowerCase()))
        errs.push(["Email", "An account with this email already exists"]);
      if (payload.enrollmentNo && db.students.some((s) => s.enrollmentNo.toLowerCase() === payload.enrollmentNo!.toLowerCase()))
        errs.push(["Enrollment no", "Already in use"]);
      validate(errs);

      const student: Student = {
        id: uid("stu"),
        enrollmentNo: payload.enrollmentNo!.trim().toUpperCase(),
        name: payload.name!.trim(),
        email: payload.email!.trim().toLowerCase(),
        phone: payload.phone!.trim(),
        branch: payload.branch!,
        semester: payload.semester!,
        section: payload.section!.toUpperCase(),
        classId: payload.classId!,
        active: true,
      };
      db.students.push(student);
      db.users.push({
        id: uid("u"), name: student.name, email: student.email,
        passwordHash: hashPassword(payload.password), role: "STUDENT",
        personId: student.id, createdAt: new Date().toISOString(),
      });
      persist();
      return student;
    },
    async update(token: string | null, id: string, payload: Partial<Student> & { password?: string }): Promise<Student> {
      await delay();
      requireAuth(token, "ADMIN");
      const db = getDB();
      const student = db.students.find((s) => s.id === id);
      if (!student) fail(404, "Student not found.");
      const errs: [string, string | null][] = [
        ["Full name", !payload.name || payload.name.trim().length < 3 ? "Minimum 3 characters" : null],
        ["Enrollment no", !payload.enrollmentNo || !/^[A-Za-z0-9-]{4,}$/.test(payload.enrollmentNo) ? "Minimum 4 letters/digits" : null],
        ["Email", !payload.email || !EMAIL_RE.test(payload.email) ? "Enter a valid email" : null],
        ["Phone", !payload.phone || payload.phone.replace(/\D/g, "").length < 10 ? "Enter a 10-digit phone" : null],
        ["Password", payload.password ? (payload.password.length < 6 ? "Minimum 6 characters" : null) : null],
      ];
      if (payload.email && db.students.some((s) => s.id !== id && s.email.toLowerCase() === payload.email!.toLowerCase()))
        errs.push(["Email", "Already registered to another student"]);
      if (payload.enrollmentNo && db.students.some((s) => s.id !== id && s.enrollmentNo.toLowerCase() === payload.enrollmentNo!.toLowerCase()))
        errs.push(["Enrollment no", "Already in use"]);
      validate(errs);

      Object.assign(student, {
        name: payload.name!.trim(),
        enrollmentNo: payload.enrollmentNo!.trim().toUpperCase(),
        email: payload.email!.trim().toLowerCase(),
        phone: payload.phone!.trim(),
        branch: payload.branch ?? student.branch,
        semester: payload.semester ?? student.semester,
        section: (payload.section ?? student.section).toUpperCase(),
        classId: payload.classId ?? student.classId,
        active: payload.active ?? student.active,
      });
      const user = db.users.find((u) => u.personId === id && u.role === "STUDENT");
      if (user) {
        user.name = student.name;
        user.email = student.email;
        if (payload.password) user.passwordHash = hashPassword(payload.password);
      }
      persist();
      return student;
    },
    async remove(token: string | null, id: string): Promise<void> {
      await delay();
      requireAuth(token, "ADMIN");
      const db = getDB();
      const idx = db.students.findIndex((s) => s.id === id);
      if (idx === -1) fail(404, "Student not found.");
      db.students.splice(idx, 1);
      db.attendance = db.attendance.filter((r) => r.studentId !== id);
      db.users = db.users.filter((u) => !(u.personId === id && u.role === "STUDENT"));
      persist();
    },
  },

  /* ---------- teachers (ADMIN) ---------- */
  teachers: {
    async get(token: string | null, id: string): Promise<Teacher> {
      await delay(120);
      const user = requireAuth(token, "ADMIN", "TEACHER");
      if (user.role === "TEACHER" && user.personId !== id)
        fail(403, "You can only view your own profile.");
      const t = getDB().teachers.find((t) => t.id === id);
      if (!t) fail(404, "Teacher not found.");
      return t!;
    },
    async list(token: string | null): Promise<TeacherRow[]> {
      await delay();
      requireAuth(token, "ADMIN");
      const db = getDB();
      return db.teachers.map((t) => ({
        ...t,
        subjectCount: db.subjects.filter((s) => s.teacherId === t.id).length,
      }));
    },
    async create(token: string | null, payload: Partial<Teacher> & { password: string }): Promise<Teacher> {
      await delay();
      requireAuth(token, "ADMIN");
      const db = getDB();
      const errs: [string, string | null][] = [
        ["Name", !payload.name || payload.name.trim().length < 3 ? "Minimum 3 characters" : null],
        ["Email", !payload.email || !EMAIL_RE.test(payload.email) ? "Enter a valid email" : null],
        ["Password", !payload.password || payload.password.length < 6 ? "Minimum 6 characters" : null],
        ["Department", !payload.department ? "Required" : null],
        ["Phone", !payload.phone || payload.phone.replace(/\D/g, "").length < 10 ? "Enter a 10-digit phone" : null],
      ];
      if (payload.email && db.users.some((u) => u.email.toLowerCase() === payload.email!.toLowerCase()))
        errs.push(["Email", "An account with this email already exists"]);
      validate(errs);

      const teacher: Teacher = {
        id: uid("t"),
        name: payload.name!.trim(),
        email: payload.email!.trim().toLowerCase(),
        department: payload.department!,
        phone: payload.phone!.trim(),
        active: true,
      };
      db.teachers.push(teacher);
      db.users.push({
        id: uid("u"), name: teacher.name, email: teacher.email,
        passwordHash: hashPassword(payload.password), role: "TEACHER",
        personId: teacher.id, createdAt: new Date().toISOString(),
      });
      persist();
      return teacher;
    },
    async update(token: string | null, id: string, payload: Partial<Teacher> & { password?: string }): Promise<Teacher> {
      await delay();
      requireAuth(token, "ADMIN");
      const db = getDB();
      const teacher = db.teachers.find((t) => t.id === id);
      if (!teacher) fail(404, "Teacher not found.");
      const errs: [string, string | null][] = [
        ["Name", !payload.name || payload.name.trim().length < 3 ? "Minimum 3 characters" : null],
        ["Email", !payload.email || !EMAIL_RE.test(payload.email) ? "Enter a valid email" : null],
        ["Department", !payload.department ? "Required" : null],
        ["Phone", !payload.phone || payload.phone.replace(/\D/g, "").length < 10 ? "Enter a 10-digit phone" : null],
        ["Password", payload.password ? (payload.password.length < 6 ? "Minimum 6 characters" : null) : null],
      ];
      if (payload.email && db.users.some((u) => u.personId !== id && u.email.toLowerCase() === payload.email!.toLowerCase()))
        errs.push(["Email", "Already in use"]);
      validate(errs);

      Object.assign(teacher, {
        name: payload.name!.trim(),
        email: payload.email!.trim().toLowerCase(),
        department: payload.department!,
        phone: payload.phone!.trim(),
        active: payload.active ?? teacher.active,
      });
      const user = db.users.find((u) => u.personId === id && u.role === "TEACHER");
      if (user) {
        user.name = teacher.name;
        user.email = teacher.email;
        if (payload.password) user.passwordHash = hashPassword(payload.password);
      }
      persist();
      return teacher;
    },
    async remove(token: string | null, id: string): Promise<void> {
      await delay();
      requireAuth(token, "ADMIN");
      const db = getDB();
      const assigned = db.subjects.filter((s) => s.teacherId === id).length;
      if (assigned > 0) fail(409, `Cannot delete — ${assigned} subject${assigned > 1 ? "s are" : " is"} assigned to this teacher. Reassign them first.`);
      db.teachers = db.teachers.filter((t) => t.id !== id);
      db.users = db.users.filter((u) => !(u.personId === id && u.role === "TEACHER"));
      persist();
    },
  },

  /* ---------- subjects ---------- */
  subjects: {
    async list(token: string | null): Promise<SubjectRow[]> {
      await delay();
      requireAuth(token);
      const db = getDB();
      return db.subjects.map((s) => ({
        ...s,
        teacherName: db.teachers.find((t) => t.id === s.teacherId)?.name ?? "Unassigned",
      }));
    },
    async create(token: string | null, payload: Partial<Subject>): Promise<Subject> {
      await delay();
      requireAuth(token, "ADMIN");
      const db = getDB();
      const errs: [string, string | null][] = [
        ["Subject name", !payload.name || payload.name.trim().length < 3 ? "Minimum 3 characters" : null],
        ["Subject code", !payload.code || !/^[A-Za-z]{2,4}\d{3}$/.test(payload.code) ? "Format like BCS301" : null],
        ["Department", !payload.department ? "Required" : null],
        ["Semester", !payload.semester || payload.semester < 1 || payload.semester > 8 ? "1–8" : null],
        ["Teacher", !payload.teacherId ? "Assign a teacher" : null],
      ];
      if (payload.code && db.subjects.some((s) => s.code.toLowerCase() === payload.code!.toLowerCase()))
        errs.push(["Subject code", "Already in use"]);
      validate(errs);
      const subject: Subject = {
        id: uid("sub"),
        name: payload.name!.trim(),
        code: payload.code!.trim().toUpperCase(),
        department: payload.department!,
        semester: payload.semester!,
        teacherId: payload.teacherId!,
      };
      db.subjects.push(subject);
      persist();
      return subject;
    },
    async update(token: string | null, id: string, payload: Partial<Subject>): Promise<Subject> {
      await delay();
      requireAuth(token, "ADMIN");
      const db = getDB();
      const subject = db.subjects.find((s) => s.id === id);
      if (!subject) fail(404, "Subject not found.");
      const errs: [string, string | null][] = [
        ["Subject name", !payload.name || payload.name.trim().length < 3 ? "Minimum 3 characters" : null],
        ["Subject code", !payload.code || !/^[A-Za-z]{2,4}\d{3}$/.test(payload.code) ? "Format like BCS301" : null],
        ["Teacher", !payload.teacherId ? "Assign a teacher" : null],
      ];
      if (payload.code && db.subjects.some((s) => s.id !== id && s.code.toLowerCase() === payload.code!.toLowerCase()))
        errs.push(["Subject code", "Already in use"]);
      validate(errs);
      Object.assign(subject, {
        name: payload.name!.trim(),
        code: payload.code!.trim().toUpperCase(),
        department: payload.department ?? subject.department,
        semester: payload.semester ?? subject.semester,
        teacherId: payload.teacherId!,
      });
      persist();
      return subject;
    },
    async remove(token: string | null, id: string): Promise<void> {
      await delay();
      requireAuth(token, "ADMIN");
      const db = getDB();
      if (!db.subjects.some((s) => s.id === id)) fail(404, "Subject not found.");
      db.subjects = db.subjects.filter((s) => s.id !== id);
      db.attendance = db.attendance.filter((r) => r.subjectId !== id);
      persist();
    },
  },

  /* ---------- classes ---------- */
  classes: {
    async list(token: string | null): Promise<ClassRow[]> {
      await delay();
      requireAuth(token);
      const db = getDB();
      return db.classes.map((c) => ({
        ...c,
        studentCount: db.students.filter((s) => s.classId === c.id).length,
        subjectCount: db.subjects.filter((s) => s.department === c.branch && s.semester === c.semester).length,
      }));
    },
    async create(token: string | null, payload: Partial<CollegeClass>): Promise<CollegeClass> {
      await delay();
      requireAuth(token, "ADMIN");
      const db = getDB();
      const errs: [string, string | null][] = [
        ["Class name", !payload.name || payload.name.trim().length < 2 ? "Minimum 2 characters" : null],
        ["Branch", !payload.branch ? "Required" : null],
        ["Semester", !payload.semester || payload.semester < 1 || payload.semester > 8 ? "1–8" : null],
        ["Section", !payload.section ? "Required" : null],
        ["Academic year", !payload.academicYear || !/^\d{4}-\d{2}$/.test(payload.academicYear) ? "Format 2025-26" : null],
      ];
      if (payload.name && db.classes.some((c) => c.name.toLowerCase() === payload.name!.toLowerCase()))
        errs.push(["Class name", "Already exists"]);
      validate(errs);
      const cls: CollegeClass = {
        id: uid("c"),
        name: payload.name!.trim().toUpperCase(),
        branch: payload.branch!,
        semester: payload.semester!,
        section: payload.section!.toUpperCase(),
        academicYear: payload.academicYear!,
      };
      db.classes.push(cls);
      persist();
      return cls;
    },
    async update(token: string | null, id: string, payload: Partial<CollegeClass>): Promise<CollegeClass> {
      await delay();
      requireAuth(token, "ADMIN");
      const db = getDB();
      const cls = db.classes.find((c) => c.id === id);
      if (!cls) fail(404, "Class not found.");
      const errs: [string, string | null][] = [
        ["Class name", !payload.name || payload.name.trim().length < 2 ? "Minimum 2 characters" : null],
        ["Academic year", !payload.academicYear || !/^\d{4}-\d{2}$/.test(payload.academicYear) ? "Format 2025-26" : null],
      ];
      if (payload.name && db.classes.some((c) => c.id !== id && c.name.toLowerCase() === payload.name!.toLowerCase()))
        errs.push(["Class name", "Already exists"]);
      validate(errs);
      Object.assign(cls, {
        name: payload.name!.trim().toUpperCase(),
        branch: payload.branch ?? cls.branch,
        semester: payload.semester ?? cls.semester,
        section: (payload.section ?? cls.section).toUpperCase(),
        academicYear: payload.academicYear!,
      });
      persist();
      return cls;
    },
    async remove(token: string | null, id: string): Promise<void> {
      await delay();
      requireAuth(token, "ADMIN");
      const db = getDB();
      if (!db.classes.some((c) => c.id === id)) fail(404, "Class not found.");
      db.classes = db.classes.filter((c) => c.id !== id);
      db.students.forEach((s) => { if (s.classId === id) s.classId = ""; });
      persist();
    },
  },

  /* ---------- attendance ---------- */
  attendance: {
    async getSession(token: string | null, classId: string, subjectId: string, date: string) {
      await delay();
      const user = requireAuth(token, "ADMIN", "TEACHER");
      const db = getDB();
      const subject = db.subjects.find((s) => s.id === subjectId);
      if (!subject) fail(404, "Subject not found.");
      if (user.role === "TEACHER" && subject.teacherId !== user.personId)
        fail(403, "You can only mark attendance for your own subjects.");
      const students = db.students
        .filter((s) => s.classId === classId && s.active)
        .sort((a, b) => a.enrollmentNo.localeCompare(b.enrollmentNo));
      const existing: Record<string, { status: AttendanceStatus; recordId: string }> = {};
      db.attendance
        .filter((r) => r.subjectId === subjectId && r.date === date && r.classId === classId)
        .forEach((r) => { existing[r.studentId] = { status: r.status, recordId: r.id }; });
      return {
        students: students.map((s) => ({ id: s.id, enrollmentNo: s.enrollmentNo, name: s.name })),
        existing,
        editable: true,
      };
    },

    async saveSession(token: string | null, payload: SaveSessionPayload): Promise<{ saved: number; updated: number }> {
      await delay(420);
      const user = requireAuth(token, "ADMIN", "TEACHER");
      const db = getDB();
      const subject = db.subjects.find((s) => s.id === payload.subjectId);
      if (!subject) fail(404, "Subject not found.");
      if (user.role === "TEACHER" && subject.teacherId !== user.personId)
        fail(403, "You can only save attendance for your own subjects.");
      if (!payload.date || payload.date > todayISO()) fail(400, "Attendance cannot be marked for a future date.");
      const classStudents = new Set(db.students.filter((s) => s.classId === payload.classId).map((s) => s.id));
      const seen = new Set<string>();
      for (const rec of payload.records) {
        if (!classStudents.has(rec.studentId)) fail(400, "A selected student does not belong to this class.");
        if (seen.has(rec.studentId)) fail(400, "Duplicate entry for the same student.");
        seen.add(rec.studentId);
      }
      let updated = 0, saved = 0;
      const now = new Date().toISOString();
      for (const rec of payload.records) {
        const existing = db.attendance.find(
          (r) => r.studentId === rec.studentId && r.subjectId === payload.subjectId && r.date === payload.date,
        );
        if (existing) {
          existing.status = rec.status;
          existing.teacherId = subject.teacherId;
          existing.classId = payload.classId;
          existing.updatedAt = now;
          updated++;
        } else {
          db.attendance.push({
            id: uid("ar"),
            studentId: rec.studentId,
            subjectId: payload.subjectId,
            teacherId: subject.teacherId,
            classId: payload.classId,
            date: payload.date,
            status: rec.status,
            createdAt: now,
            updatedAt: now,
          });
          saved++;
        }
      }
      persist();
      return { saved, updated };
    },

    async updateRecord(token: string | null, id: string, status: AttendanceStatus): Promise<AttendanceRow> {
      await delay();
      const user = requireAuth(token, "ADMIN", "TEACHER");
      const db = getDB();
      const rec = db.attendance.find((r) => r.id === id);
      if (!rec) fail(404, "Attendance record not found.");
      if (user.role === "TEACHER" && rec.teacherId !== user.personId)
        fail(403, "You can only edit attendance you marked.");
      rec.status = status;
      rec.updatedAt = new Date().toISOString();
      persist();
      return enrich(rec);
    },

    async query(token: string | null, filters: AttendanceFilters): Promise<Paged<AttendanceRow>> {
      await delay();
      const user = requireAuth(token);
      const db = getDB();
      let recs = db.attendance.slice();

      if (user.role === "STUDENT") {
        if (filters.studentId && filters.studentId !== user.personId)
          fail(403, "You can only view your own attendance.");
        recs = recs.filter((r) => r.studentId === user.personId);
      } else if (user.role === "TEACHER") {
        const mine = new Set(mySubjectIds(user));
        if (filters.subjectId && !mine.has(filters.subjectId))
          fail(403, "You can only view attendance for your subjects.");
        recs = recs.filter((r) => mine.has(r.subjectId));
      }

      if (filters.classId) recs = recs.filter((r) => r.classId === filters.classId);
      if (filters.subjectId) recs = recs.filter((r) => r.subjectId === filters.subjectId);
      if (filters.studentId) recs = recs.filter((r) => r.studentId === filters.studentId);
      if (filters.status) recs = recs.filter((r) => r.status === filters.status);
      if (filters.from) recs = recs.filter((r) => r.date >= filters.from!);
      if (filters.to) recs = recs.filter((r) => r.date <= filters.to!);
      if (filters.query) {
        const q = filters.query.toLowerCase();
        recs = recs.filter((r) => {
          const row = enrich(r);
          return row.studentName.toLowerCase().includes(q) || row.enrollmentNo.toLowerCase().includes(q);
        });
      }

      recs.sort((a, b) => b.date.localeCompare(a.date) || a.studentId.localeCompare(b.studentId));
      const page = Math.max(1, filters.page ?? 1);
      const size = filters.size ?? 12;
      const start = (page - 1) * size;
      return {
        rows: recs.slice(start, start + size).map(enrich),
        total: recs.length,
        page,
        size,
        pages: Math.max(1, Math.ceil(recs.length / size)),
      };
    },
  },

  /* ---------- reports ---------- */
  reports: {
    async generate(token: string | null, type: ReportType, filters: ReportFilters): Promise<ReportResult> {
      await delay(380);
      const user = requireAuth(token, "ADMIN", "TEACHER");
      const db = getDB();
      let recs = db.attendance.slice();

      if (user.role === "TEACHER") {
        const mine = new Set(mySubjectIds(user));
        recs = recs.filter((r) => mine.has(r.subjectId));
        if (filters.subjectId && !mine.has(filters.subjectId))
          fail(403, "You can only report on your subjects.");
      }

      const clsName = (id: string) => db.classes.find((c) => c.id === id)?.name ?? "—";

      if (type === "daily") {
        const date = filters.date ?? todayISO();
        recs = recs.filter((r) => r.date === date);
        if (filters.classId) recs = recs.filter((r) => r.classId === filters.classId);
        if (filters.subjectId) recs = recs.filter((r) => r.subjectId === filters.subjectId);
        recs.sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.studentId.localeCompare(b.studentId));
        const present = recs.filter((r) => r.status === "PRESENT").length;
        const sessions = new Set(recs.map((r) => `${r.classId}|${r.subjectId}`)).size;
        return {
          type, title: `Daily Attendance — ${fmtDate(date)}`,
          summary: [
            { label: "Sessions", value: String(sessions) },
            { label: "Present", value: String(present) },
            { label: "Absent", value: String(recs.length - present) },
            { label: "Attendance", value: `${pct(present, recs.length) ?? "—"}%` },
          ],
          columns: ["Enrollment", "Student", "Class", "Subject", "Status", "Marked By"],
          rows: recs.map((r) => {
            const row = enrich(r);
            return [row.enrollmentNo, row.studentName, row.className, `${row.subjectCode} · ${row.subjectName}`, r.status, row.teacherName];
          }),
        };
      }

      if (type === "monthly") {
        const month = filters.month ?? todayISO().slice(0, 7);
        recs = recs.filter((r) => r.date.startsWith(month));
        if (filters.classId) recs = recs.filter((r) => r.classId === filters.classId);
        if (filters.subjectId) recs = recs.filter((r) => r.subjectId === filters.subjectId);
        const summaries = subjectSummaries(recs);
        const present = recs.filter((r) => r.status === "PRESENT").length;
        return {
          type, title: `Monthly Attendance — ${monthLabel(month)}`,
          summary: [
            { label: "Total Records", value: String(recs.length) },
            { label: "Present", value: String(present) },
            { label: "Absent", value: String(recs.length - present) },
            { label: "Attendance", value: `${pct(present, recs.length) ?? "—"}%` },
          ],
          columns: ["Code", "Subject", "Sessions", "Present", "Absent", "Attendance %"],
          rows: summaries.map((s) => [s.code, s.name, new Set(recs.filter((r) => r.subjectId === s.subjectId).map((r) => r.date)).size, s.attended, s.total - s.attended, s.percent ?? "—"]),
        };
      }

      if (type === "subject") {
        if (!filters.subjectId) fail(400, "Choose a subject to generate this report.");
        recs = recs.filter((r) => r.subjectId === filters.subjectId);
        if (filters.classId) recs = recs.filter((r) => r.classId === filters.classId);
        if (filters.from) recs = recs.filter((r) => r.date >= filters.from!);
        if (filters.to) recs = recs.filter((r) => r.date <= filters.to!);
        const sums = studentSummaries(recs);
        const withPct = sums.filter((s) => s.percent !== null);
        const avg = withPct.length ? Math.round(withPct.reduce((a, s) => a + (s.percent ?? 0), 0) / withPct.length) : null;
        const subject = db.subjects.find((s) => s.id === filters.subjectId);
        return {
          type, title: `Subject Report — ${subject ? `${subject.code} · ${subject.name}` : ""}`,
          summary: [
            { label: "Students", value: String(sums.length) },
            { label: "Class Average", value: `${avg ?? "—"}%` },
            { label: "Below 75%", value: String(sums.filter((s) => isLow(s.percent)).length) },
            { label: "Sessions", value: String(new Set(recs.map((r) => r.date)).size) },
          ],
          columns: ["Enrollment", "Student", "Class", "Total", "Attended", "Absent", "%", "Status"],
          rows: sums.map((s) => [s.enrollmentNo, s.name, s.className, s.total, s.attended, s.total - s.attended, `${s.percent ?? "—"}%`, isLow(s.percent) ? "LOW" : "GOOD"]),
        };
      }

      if (type === "student") {
        if (!filters.studentId) fail(400, "Choose a student to generate this report.");
        if (user.role === "TEACHER") {
          const classes = new Set(recs.map((r) => r.classId));
          if (!classes.has(db.students.find((s) => s.id === filters.studentId)?.classId ?? ""))
            fail(403, "This student is not in any of your classes.");
        }
        recs = recs.filter((r) => r.studentId === filters.studentId);
        if (filters.from) recs = recs.filter((r) => r.date >= filters.from!);
        if (filters.to) recs = recs.filter((r) => r.date <= filters.to!);
        const sums = subjectSummaries(recs);
        const attended = recs.filter((r) => r.status === "PRESENT").length;
        const student = db.students.find((s) => s.id === filters.studentId);
        return {
          type, title: `Student Report — ${student?.name ?? ""} (${student?.enrollmentNo ?? ""})`,
          summary: [
            { label: "Overall", value: `${pct(attended, recs.length) ?? "—"}%` },
            { label: "Attended", value: String(attended) },
            { label: "Missed", value: String(recs.length - attended) },
            { label: "Low Subjects", value: String(sums.filter((s) => isLow(s.percent)).length) },
          ],
          columns: ["Code", "Subject", "Total", "Attended", "Absent", "%", "Status"],
          rows: sums.map((s) => [s.code, s.name, s.total, s.attended, s.total - s.attended, `${s.percent ?? "—"}%`, isLow(s.percent) ? "LOW" : "GOOD"]),
        };
      }

      /* low attendance */
      if (filters.classId) recs = recs.filter((r) => r.classId === filters.classId);
      const sums = studentSummaries(recs).filter((s) => s.total > 0 && isLow(s.percent));
      return {
        type, title: "Low Attendance Report (below 75%)",
        summary: [
          { label: "Students Below 75%", value: String(sums.length) },
          { label: "Threshold", value: "75%" },
          { label: "Most Critical", value: sums[0]?.name ?? "—" },
          { label: "Avg. Deficit", value: sums.length ? `${Math.round(sums.reduce((a, s) => a + (75 - (s.percent ?? 0)), 0) / sums.length)}%` : "—" },
        ],
        columns: ["Enrollment", "Student", "Class", "Total", "Attended", "%", "Classes Needed"],
        rows: sums.map((s) => [s.enrollmentNo, s.name, s.className, s.total, s.attended, `${s.percent}%`, s.needed]),
      };
    },
  },

  /* ---------- dashboard stats ---------- */
  stats: {
    async admin(token: string | null): Promise<AdminStats> {
      await delay();
      requireAuth(token, "ADMIN");
      const db = getDB();
      const recs = db.attendance;
      const present = recs.filter((r) => r.status === "PRESENT").length;
      const lows = studentSummaries(recs).filter((s) => s.total > 0 && isLow(s.percent));
      return {
        students: db.students.length,
        teachers: db.teachers.length,
        subjects: db.subjects.length,
        classes: db.classes.length,
        today: dayStat(recs),
        averagePercent: pct(present, recs.length),
        presentTotal: present,
        absentTotal: recs.length - present,
        lowStudents: lows.slice(0, 8),
        subjectwise: subjectSummaries(recs, db.subjects),
        trend: trendPoints(recs),
        sessions: sessionInfos(recs),
      };
    },
    async teacher(token: string | null): Promise<TeacherStats> {
      await delay();
      const user = requireAuth(token, "TEACHER");
      const db = getDB();
      const mine = new Set(mySubjectIds(user));
      const recs = db.attendance.filter((r) => mine.has(r.subjectId));
      const mySubjects = db.subjects.filter((s) => mine.has(s.id));
      const classIds = [...new Set(db.classes
        .filter((c) => mySubjects.some((s) => s.department === c.branch && s.semester === c.semester))
        .map((c) => c.id))];
      const students = db.students.filter((s) => classIds.includes(s.classId));
      const present = recs.filter((r) => r.status === "PRESENT").length;
      return {
        subjects: subjectSummaries(recs, mySubjects),
        classIds,
        totalStudents: students.length,
        today: dayStat(recs),
        averagePercent: pct(present, recs.length),
        recentSessions: sessionInfos(recs, 8),
      };
    },
    async student(token: string | null): Promise<StudentStats> {
      await delay();
      const user = requireAuth(token, "STUDENT");
      const db = getDB();
      const recs = db.attendance.filter((r) => r.studentId === user.personId);
      const attended = recs.filter((r) => r.status === "PRESENT").length;
      const student = db.students.find((s) => s.id === user.personId);
      const mySubjects = db.subjects.filter((s) => student && s.department === student.branch && s.semester === student.semester);
      const subjects = subjectSummaries(recs, mySubjects);
      return {
        overall: { total: recs.length, attended, missed: recs.length - attended, percent: pct(attended, recs.length) },
        subjects,
        lowCount: subjects.filter((s) => isLow(s.percent)).length,
        trend: trendPoints(recs),
        recent: recs
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date) || a.subjectId.localeCompare(b.subjectId))
          .slice(0, 10)
          .map(enrich),
      };
    },
  },

  /* ---------- demo helpers ---------- */
  system: {
    async resetDemo(token: string | null): Promise<void> {
      await delay(300);
      requireAuth(token, "ADMIN");
      resetDB();
    },
    async exportAll(token: string | null): Promise<{ date: string; count: number }> {
      await delay(120);
      requireAuth(token);
      return { date: todayISO(), count: getDB().attendance.length };
    },
  },
};

/** convenience used by pages that show relative ranges */
export const lastNDays = (n: number): { from: string; to: string } => ({
  from: addDaysISO(todayISO(), -(n - 1)),
  to: todayISO(),
});

export { fromISO };
