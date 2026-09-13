/* =========================================================
   Attendify – API layer
   Talks to the Spring Boot backend over REST.
   Throws ApiError({ status, message, errors }) with:
   400 validation · 401 unauthenticated · 403 forbidden
   404 not found · 409 conflict
   ========================================================= */

import {
  addDaysISO,
  fromISO,
  todayISO,
  type AttendanceFilters,
  type AttendanceRow,
  type AttendanceStatus,
  type ClassRow,
  type CollegeClass,
  type LoginResult,
  type Paged,
  type ReportFilters,
  type ReportResult,
  type ReportType,
  type SaveSessionPayload,
  type Student,
  type StudentRow,
  type StudentStats,
  type Subject,
  type SubjectRow,
  type Teacher,
  type TeacherRow,
  type TeacherStats,
  type User,
  type AdminStats,
  type Notice,
  type NoticePayload,
  type TimeTableResponse,
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
  new Promise<void>((r) => setTimeout(r, ms ?? 80 + Math.random() * 120));

function fail(status: number, message: string, errors?: string[]): never {
  throw new ApiError(status, message, errors);
}

const BASE = "/api";

function authHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  token: string | null,
  body?: unknown,
  query?: Record<string, string | number | undefined | null>,
): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...authHeader(token),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    fail(0, "Unable to reach the server. Please try again.");
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const payload = (data ?? {}) as { status?: number; message?: string; errors?: string[] };
    fail(payload.status ?? res.status, payload.message ?? (res.statusText || "Request failed."), payload.errors);
  }
  return data as T;
}

const get = <T>(path: string, token: string | null, query?: Record<string, string | number | undefined | null>) =>
  request<T>("GET", path, token, undefined, query);
const post = <T>(path: string, token: string | null, body?: unknown) => request<T>("POST", path, token, body ?? {});
const put = <T>(path: string, token: string | null, body?: unknown) => request<T>("PUT", path, token, body ?? {});
const del = (path: string, token: string | null) => request<void>("DELETE", path, token);

export const api = {
  auth: {
    async login(email: string, password: string): Promise<LoginResult> {
      await delay(180);
      return post<LoginResult>(`${BASE}/auth/login`, null, { email, password });
    },
    async me(token: string | null): Promise<User> {
      return get<User>(`${BASE}/auth/me`, token);
    },
    async changePassword(token: string | null, current: string, next: string): Promise<User> {
      await delay();
      return post<User>(`${BASE}/auth/change-password`, token, { current, next });
    },
  },

  students: {
    async list(token: string | null): Promise<StudentRow[]> {
      await delay();
      return get<StudentRow[]>(`${BASE}/students`, token);
    },
    async get(token: string | null, id: string): Promise<Student> {
      return get<Student>(`${BASE}/students/${id}`, token);
    },
    async create(token: string | null, payload: Partial<Student> & { password: string }): Promise<Student> {
      await delay();
      return post<Student>(`${BASE}/students`, token, payload);
    },
    async update(token: string | null, id: string, payload: Partial<Student> & { password?: string }): Promise<Student> {
      await delay();
      return put<Student>(`${BASE}/students/${id}`, token, payload);
    },
    async remove(token: string | null, id: string): Promise<void> {
      await delay();
      await del(`${BASE}/students/${id}`, token);
    },
  },

  teachers: {
    async get(token: string | null, id: string): Promise<Teacher> {
      return get<Teacher>(`${BASE}/teachers/${id}`, token);
    },
    async list(token: string | null): Promise<TeacherRow[]> {
      await delay();
      return get<TeacherRow[]>(`${BASE}/teachers`, token);
    },
    async create(token: string | null, payload: Partial<Teacher> & { password: string }): Promise<Teacher> {
      await delay();
      return post<Teacher>(`${BASE}/teachers`, token, payload);
    },
    async update(token: string | null, id: string, payload: Partial<Teacher> & { password?: string }): Promise<Teacher> {
      await delay();
      return put<Teacher>(`${BASE}/teachers/${id}`, token, payload);
    },
    async remove(token: string | null, id: string): Promise<void> {
      await delay();
      await del(`${BASE}/teachers/${id}`, token);
    },
  },

  subjects: {
    async list(token: string | null): Promise<SubjectRow[]> {
      await delay();
      return get<SubjectRow[]>(`${BASE}/subjects`, token);
    },
    async create(token: string | null, payload: Partial<Subject>): Promise<Subject> {
      await delay();
      return post<Subject>(`${BASE}/subjects`, token, payload);
    },
    async update(token: string | null, id: string, payload: Partial<Subject>): Promise<Subject> {
      await delay();
      return put<Subject>(`${BASE}/subjects/${id}`, token, payload);
    },
    async remove(token: string | null, id: string): Promise<void> {
      await delay();
      await del(`${BASE}/subjects/${id}`, token);
    },
  },

  classes: {
    async list(token: string | null): Promise<ClassRow[]> {
      await delay();
      return get<ClassRow[]>(`${BASE}/classes`, token);
    },
    async create(token: string | null, payload: Partial<CollegeClass>): Promise<CollegeClass> {
      await delay();
      return post<CollegeClass>(`${BASE}/classes`, token, payload);
    },
    async update(token: string | null, id: string, payload: Partial<CollegeClass>): Promise<CollegeClass> {
      await delay();
      return put<CollegeClass>(`${BASE}/classes/${id}`, token, payload);
    },
    async remove(token: string | null, id: string): Promise<void> {
      await delay();
      await del(`${BASE}/classes/${id}`, token);
    },
  },

  attendance: {
    async getSession(token: string | null, classId: string, subjectId: string, date: string) {
      await delay();
      return get<{
        students: { id: string; enrollmentNo: string; name: string }[];
        existing: Record<string, { status: AttendanceStatus; recordId: string }>;
        editable: boolean;
      }>(`${BASE}/attendance/session`, token, { classId, subjectId, date });
    },

    async saveSession(token: string | null, payload: SaveSessionPayload): Promise<{ saved: number; updated: number }> {
      await delay(220);
      return post<{ saved: number; updated: number }>(`${BASE}/attendance`, token, payload);
    },

    async updateRecord(token: string | null, id: string, status: AttendanceStatus): Promise<AttendanceRow> {
      await delay();
      return put<AttendanceRow>(`${BASE}/attendance/${id}`, token, { status });
    },

    async query(token: string | null, filters: AttendanceFilters): Promise<Paged<AttendanceRow>> {
      await delay();
      return get<Paged<AttendanceRow>>(`${BASE}/attendance`, token, {
        classId: filters.classId,
        subjectId: filters.subjectId,
        studentId: filters.studentId,
        status: filters.status || undefined,
        from: filters.from,
        to: filters.to,
        query: filters.query,
        page: filters.page,
        size: filters.size,
      });
    },
  },

  reports: {
    async generate(token: string | null, type: ReportType, filters: ReportFilters): Promise<ReportResult> {
      await delay(200);
      const path = type === "low" ? `${BASE}/reports/low-attendance` : `${BASE}/reports/attendance`;
      return get<ReportResult>(path, token, {
        type,
        date: filters.date,
        month: filters.month,
        classId: filters.classId,
        subjectId: filters.subjectId,
        studentId: filters.studentId,
        from: filters.from,
        to: filters.to,
      });
    },
  },

  stats: {
    async admin(token: string | null): Promise<AdminStats> {
      await delay();
      return get<AdminStats>(`${BASE}/stats/admin`, token);
    },
    async teacher(token: string | null): Promise<TeacherStats> {
      await delay();
      return get<TeacherStats>(`${BASE}/stats/teacher`, token);
    },
    async student(token: string | null): Promise<StudentStats> {
      await delay();
      return get<StudentStats>(`${BASE}/stats/student`, token);
    },
  },

  system: {
    async resetDemo(token: string | null): Promise<void> {
      await delay(300);
      await post<void>(`${BASE}/system/reset-demo`, token);
    },
    async exportAll(token: string | null): Promise<{ date: string; count: number }> {
      return post<{ date: string; count: number }>(`${BASE}/system/export`, token);
    },
  },

  notices: {
    async list(token: string | null): Promise<Notice[]> {
      return get<Notice[]>(`${BASE}/notices`, token);
    },
    async create(token: string | null, payload: NoticePayload): Promise<Notice> {
      await delay();
      return post<Notice>(`${BASE}/notices`, token, payload);
    },
    async remove(token: string | null, id: string): Promise<void> {
      await delay();
      await del(`${BASE}/notices/${id}`, token);
    },
  },

  timetable: {
    async get(token: string | null, classId?: string): Promise<TimeTableResponse> {
      return get<TimeTableResponse>(`${BASE}/timetable`, token, classId ? { classId } : undefined);
    },
  },
};

export const lastNDays = (n: number): { from: string; to: string } => ({
  from: addDaysISO(todayISO(), -(n - 1)),
  to: todayISO(),
});

export { fromISO };
