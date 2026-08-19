/* =========================================================
   Attendify – deterministic demo dataset
   Generates users, teachers, students, subjects, classes and
   ~9 weeks of realistic attendance history.
   ========================================================= */

import {
  addDaysISO,
  fromISO,
  hashPassword,
  lastWeekdayISO,
  toISO,
  todayISO,
  type AttendanceRecord,
  type CollegeClass,
  type StoredUser,
  type Student,
  type Subject,
  type Teacher,
} from "./types";
import type { DB } from "./db";

export const SEED_VERSION = 3;

/* ---------- deterministic PRNG ---------- */
function strSeed(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ (c.codePointAt(0) ?? 0), 16777619);
  return h;
}
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- people ---------- */
const TEACHER_DEFS = [
  { id: "t1", name: "Anita Sharma", email: "teacher@attendify.com", department: "CSE", phone: "9825014701" },
  { id: "t2", name: "Meera Iyer", email: "meera.iyer@attendify.com", department: "CSE", phone: "9825014702" },
  { id: "t3", name: "Kavita Rao", email: "kavita.rao@attendify.com", department: "CSE", phone: "9825014703" },
  { id: "t4", name: "Rajesh Verma", email: "rajesh.verma@attendify.com", department: "ECE", phone: "9825014704" },
  { id: "t5", name: "Suresh Patil", email: "suresh.patil@attendify.com", department: "Mechanical", phone: "9825014705" },
];

const CLASSES: CollegeClass[] = [
  { id: "c1", name: "CSE-3-A", branch: "CSE", semester: 3, section: "A", academicYear: "2025-26" },
  { id: "c2", name: "CSE-3-B", branch: "CSE", semester: 3, section: "B", academicYear: "2025-26" },
  { id: "c3", name: "ECE-3-A", branch: "ECE", semester: 3, section: "A", academicYear: "2025-26" },
];

/** [subjectId → weekday schedule (0=Sun … 6=Sat)] */
const SUBJECT_DAYS: Record<string, number[]> = {
  sub1: [1, 3, 5],
  sub2: [1, 2, 4],
  sub3: [1, 2, 4],
  sub4: [2, 3, 5],
  sub5: [1, 4, 5],
};

const SUBJECT_DEFS: Omit<Subject, "department" | "semester">[] = [
  { id: "sub1", name: "Data Structures", code: "BCS301", teacherId: "t1" },
  { id: "sub2", name: "Java Programming", code: "BCS302", teacherId: "t1" },
  { id: "sub3", name: "Database Management Systems", code: "BCS303", teacherId: "t2" },
  { id: "sub4", name: "Operating Systems", code: "BCS304", teacherId: "t3" },
  { id: "sub5", name: "Engineering Mathematics III", code: "BCS305", teacherId: "t3" },
  { id: "sub6", name: "Digital Electronics", code: "BEC301", teacherId: "t4" },
  { id: "sub7", name: "Signals & Systems", code: "BEC302", teacherId: "t4" },
];

const CSE_A = [
  "Aarav Kumar", "Diya Patel", "Rohan Mehta", "Sneha Reddy", "Arjun Singh", "Priya Nair",
  "Kabir Joshi", "Ananya Das", "Vivaan Gupta", "Ishita Malhotra", "Aditya Kulkarni",
  "Zara Khan", "Ishaan Verma", "Myra Chopra", "Dhruv Bansal", "Kiara Saxena",
  "Aryan Pillai", "Anika Mishra",
];
const CSE_B = [
  "Reyansh Agarwal", "Sara Deshmukh", "Vihaan Thakur", "Navya Krishnan", "Ayaan Shaikh",
  "Riya Kapoor", "Krishna Menon", "Tara Bhatt", "Yuvraj Singhania", "Pooja Hegde",
];
const ECE_A = [
  "Atharv Joshi", "Nitya Sharma", "Advait Deshpande", "Aisha Qureshi", "Rudra Patel",
  "Divya Menon", "Shaurya Chauhan", "Elina D'Souza",
];

/** students who should end up with low attendance */
const LOW_ATTENDERS = new Set(["stu4", "stu9", "stu14", "stu21", "stu25"]);
const DEMO_STUDENT_ID = "stu0";
const DEMO_LOW_SUBJECT = "sub2"; // Java — mirrors the 68% example

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
}

function makeStudents(names: string[], classId: string, idStart: number, enrollPrefix: string, enrollStart: number): Student[] {
  return names.map((name, i) => {
    const id = `stu${idStart + i}`;
    const email = id === DEMO_STUDENT_ID ? "student@attendify.com" : `${slug(name)}@attendify.com`;
    return {
      id,
      enrollmentNo: `${enrollPrefix}${String(enrollStart + i).padStart(3, "0")}`,
      name,
      email,
      phone: `98${String(11000000 + strSeed(id) % 89999999)}`,
      branch: classId === "c3" ? "ECE" : "CSE",
      semester: 3,
      section: classId === "c2" ? "B" : "A",
      classId,
      active: true,
    };
  });
}

/* ---------- attendance generation ---------- */
function sessionDates(): string[] {
  const end = lastWeekdayISO();
  const start = addDaysISO(end, -62);
  const holidays = new Set([addDaysISO(start, 16), addDaysISO(start, 31), addDaysISO(start, 45)]);
  const dates: string[] = [];
  for (let d = start; d <= end; d = addDaysISO(d, 1)) {
    const day = fromISO(d).getDay();
    if (day !== 0 && day !== 6 && !holidays.has(d)) dates.push(d);
  }
  return dates;
}

function buildAttendance(students: Student[], subjects: Subject[], dates: string[]): AttendanceRecord[] {
  const rand = mulberry32(strSeed("attendify-attendance"));
  const records: AttendanceRecord[] = [];
  const subjectFactor: Record<string, number> = { sub1: 1.0, sub2: 0.97, sub3: 0.95, sub4: 0.93, sub5: 0.9 };

  const cseStudents = students.filter((s) => s.classId === "c1" || s.classId === "c2");
  const cseSubjects = subjects.filter((s) => SUBJECT_DAYS[s.id]);

  for (const subject of cseSubjects) {
    const days = SUBJECT_DAYS[subject.id] ?? [];
    const sessions = dates.filter((d) => days.includes(fromISO(d).getDay()));
    const classStudents = cseStudents.filter((s) => s.classId === "c1" || s.classId === "c2");
    for (const student of classStudents) {
      let tendency = LOW_ATTENDERS.has(student.id) ? 0.55 + rand() * 0.13 : 0.78 + rand() * 0.2;
      if (student.id === DEMO_STUDENT_ID) tendency = 0.9 + rand() * 0.04;
      const prob = tendency * (subjectFactor[subject.id] ?? 1) *
        (student.id === DEMO_STUDENT_ID && subject.id === DEMO_LOW_SUBJECT ? 0.74 : 1);
      for (const date of sessions) {
        records.push({
          id: `ar_${subject.id}_${student.id}_${date}`,
          studentId: student.id,
          subjectId: subject.id,
          teacherId: subject.teacherId,
          classId: student.classId,
          date,
          status: rand() < prob ? "PRESENT" : "ABSENT",
          createdAt: `${date}T09:30:00`,
          updatedAt: `${date}T09:30:00`,
        });
      }
    }
  }
  return records;
}

/* ---------- full seed ---------- */
export function buildSeed(): DB {
  const now = new Date().toISOString();
  const teachers: Teacher[] = TEACHER_DEFS.map((t) => ({ ...t, active: true }));
  const subjects: Subject[] = SUBJECT_DEFS.map((s) =>
    s.id.startsWith("sub6") || s.id.startsWith("sub7")
      ? { ...s, department: "ECE", semester: 3 }
      : { ...s, department: "CSE", semester: 3 },
  );
  const students: Student[] = [
    ...makeStudents(CSE_A, "c1", 0, "CSE230", 1),
    ...makeStudents(CSE_B, "c2", 18, "CSE231", 1),
    ...makeStudents(ECE_A, "c3", 28, "ECE230", 1),
  ];

  const users: StoredUser[] = [
    {
      id: "u_admin",
      name: "Vipin Prajapati",
      email: "admin@attendify.com",
      passwordHash: hashPassword("admin123"),
      role: "ADMIN",
      personId: null,
      createdAt: now,
    },
    ...teachers.map<StoredUser>((t) => ({
      id: `u_${t.id}`,
      name: t.name,
      email: t.email,
      passwordHash: hashPassword(t.id === "t1" ? "teacher123" : "teacher123"),
      role: "TEACHER",
      personId: t.id,
      createdAt: now,
    })),
    ...students.map<StoredUser>((s) => ({
      id: `u_${s.id}`,
      name: s.name,
      email: s.email,
      passwordHash: hashPassword("student123"),
      role: "STUDENT",
      personId: s.id,
      createdAt: now,
    })),
  ];

  const attendance = buildAttendance(students, subjects, sessionDates());

  return {
    version: SEED_VERSION,
    seededAt: todayISO(),
    users,
    teachers,
    students,
    subjects,
    classes: CLASSES,
    attendance,
  };
}
