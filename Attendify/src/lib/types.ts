/* =========================================================
   Attendify – shared domain types, constants and utilities
   ========================================================= */

export type Role = "ADMIN" | "TEACHER" | "STUDENT";
export type AttendanceStatus = "PRESENT" | "ABSENT";

export const MIN_ATTENDANCE = 75; // default minimum attendance threshold (%)
export const TOKEN_KEY = "attendify_token";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  personId: string | null; // linked teacher / student profile id
  createdAt: string;
}

export interface StoredUser extends User {
  passwordHash: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  phone: string;
  active: boolean;
}

export interface Student {
  id: string;
  enrollmentNo: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  semester: number;
  section: string;
  classId: string;
  active: boolean;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  semester: number;
  teacherId: string;
}

export interface CollegeClass {
  id: string;
  name: string;
  branch: string;
  semester: number;
  section: string;
  academicYear: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  classId: string;
  date: string; // yyyy-mm-dd
  status: AttendanceStatus;
  createdAt: string;
  updatedAt: string;
}

/* ---------- enriched view models ---------- */

export interface TeacherRow extends Teacher {
  subjectCount: number;
}
export interface SubjectRow extends Subject {
  teacherName: string;
}
export interface ClassRow extends CollegeClass {
  studentCount: number;
  subjectCount: number;
}
export interface StudentRow extends Student {
  className: string;
  percent: number | null;
}
export interface AttendanceRow extends AttendanceRecord {
  enrollmentNo: string;
  studentName: string;
  subjectName: string;
  subjectCode: string;
  className: string;
  teacherName: string;
}

export interface SubjectSummary {
  subjectId: string;
  name: string;
  code: string;
  teacherName: string;
  total: number;
  attended: number;
  percent: number | null;
}

export interface StudentSummary {
  studentId: string;
  enrollmentNo: string;
  name: string;
  className: string;
  total: number;
  attended: number;
  percent: number | null;
  needed: number; // classes needed to reach the threshold
}

export interface SessionInfo {
  date: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  present: number;
  total: number;
  percent: number | null;
}

export interface TrendPoint {
  date: string;
  percent: number;
}

/* ---------- dashboard stats ---------- */

export interface DayStat {
  date: string;
  present: number;
  total: number;
  percent: number | null;
  isToday: boolean;
}

export interface AdminStats {
  students: number;
  teachers: number;
  subjects: number;
  classes: number;
  today: DayStat;
  averagePercent: number | null;
  presentTotal: number;
  absentTotal: number;
  lowStudents: StudentSummary[];
  subjectwise: SubjectSummary[];
  trend: TrendPoint[];
  sessions: SessionInfo[];
}

export interface TeacherStats {
  subjects: SubjectSummary[];
  classIds: string[];
  totalStudents: number;
  today: DayStat;
  averagePercent: number | null;
  recentSessions: SessionInfo[];
}

export interface StudentStats {
  overall: { total: number; attended: number; missed: number; percent: number | null };
  subjects: SubjectSummary[];
  lowCount: number;
  trend: TrendPoint[];
  recent: AttendanceRow[];
}

/* ---------- reports ---------- */

export type ReportType = "daily" | "monthly" | "subject" | "student" | "low";

export interface ReportFilters {
  date?: string;
  month?: string; // yyyy-mm
  classId?: string;
  subjectId?: string;
  studentId?: string;
  from?: string;
  to?: string;
}

export interface ReportResult {
  type: ReportType;
  title: string;
  summary: { label: string; value: string }[];
  columns: string[];
  rows: (string | number)[][];
}

export interface AttendanceFilters extends ReportFilters {
  status?: AttendanceStatus | "";
  query?: string;
  page?: number;
  size?: number;
}

export interface Paged<T> {
  rows: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface LoginResult {
  token: string;
  user: User;
}

export interface SaveSessionPayload {
  classId: string;
  subjectId: string;
  date: string;
  records: { studentId: string; status: AttendanceStatus }[];
}

/* =========================================================
   Utilities
   ========================================================= */

let uidCounter = 0;
export const uid = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${(uidCounter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Demo-grade one-way hash. The real Spring Boot backend uses BCrypt. */
export function hashPassword(pw: string): string {
  let h1 = 0xdeadbeef ^ 7;
  let h2 = 0x41c6ce57 ^ 7;
  for (let i = 0; i < pw.length; i++) {
    const ch = pw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const toISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const fromISO = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const todayISO = (): string => toISO(new Date());

export const addDaysISO = (iso: string, n: number): string => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

export const fmtDate = (iso: string): string => {
  const d = fromISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const fmtDay = (iso: string): string => {
  const d = fromISO(iso);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const monthLabel = (ym: string): string => {
  const d = fromISO(`${ym}-01`);
  return `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
};

export const lastWeekdayISO = (): string => {
  const d = new Date();
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  return toISO(d);
};

export const pct = (attended: number, total: number): number | null =>
  total === 0 ? null : Math.round((attended / total) * 1000) / 10;

export const isLow = (p: number | null): boolean => p !== null && p < MIN_ATTENDANCE;

/** Extra classes a student must attend consecutively to reach the threshold. */
export const classesNeeded = (attended: number, total: number): number => {
  if (total === 0) return 0;
  const need = Math.ceil((MIN_ATTENDANCE * total - 100 * attended) / (100 - MIN_ATTENDANCE));
  return Math.max(0, need);
};

export const initials = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

export function downloadCSV(filename: string, columns: string[], rows: (string | number)[][]): void {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = [columns.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
