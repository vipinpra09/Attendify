/* =========================================================
   Attendify – persistence layer (the "PostgreSQL" of the demo).
   In the full-stack build this maps 1:1 to Spring Data JPA
   repositories over PostgreSQL; here it is localStorage so the
   app runs end-to-end in the browser.
   ========================================================= */

import type {
  AttendanceRecord,
  CollegeClass,
  StoredUser,
  Student,
  Subject,
  Teacher,
} from "./types";
import { buildSeed, SEED_VERSION } from "./seed";

export interface DB {
  version: number;
  seededAt: string;
  users: StoredUser[];
  teachers: Teacher[];
  students: Student[];
  subjects: Subject[];
  classes: CollegeClass[];
  attendance: AttendanceRecord[];
}

const KEY = "attendify_db";
let cache: DB | null = null;

export function getDB(): DB {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed && parsed.version === SEED_VERSION) {
        cache = parsed;
        return cache;
      }
    }
  } catch {
    /* corrupted storage → reseed */
  }
  cache = buildSeed();
  persist();
  return cache;
}

export function persist(): void {
  if (!cache) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* storage full — demo keeps working in memory */
  }
}

export function resetDB(): void {
  cache = buildSeed();
  persist();
}
