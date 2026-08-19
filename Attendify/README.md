# ATTENDIFY — College Attendance Management System

**Smart Attendance. Better Tracking.**

Attendify digitizes college attendance management and replaces manual registers with a
centralized platform for **administrators**, **teachers** and **students**.

> **About this build** — the live demo runs the complete product in the browser: the same
> REST contract, JWT bearer auth, role-based authorization, validation rules and response
> envelopes described below are implemented by an embedded API layer (`src/lib/api.ts`)
> backed by a seeded, persisted database (`src/lib/db.ts`). Swap that module for `fetch`
> calls against the Spring Boot service and nothing else in the UI changes.

---

## Features

- User authentication with JWT bearer tokens + one-way password hashing
- Role-based access: `ROLE_ADMIN`, `ROLE_TEACHER`, `ROLE_STUDENT`
- Student / Teacher / Subject / Class management (CRUD + unique constraints)
- Attendance marking workflow: Class → Subject → Date → Load → Mark P/A → Save
- Attendance editing, duplicate-proof sessions (unique per student + subject + date)
- Automatic attendance percentage — never typed manually
- Default minimum threshold **75%** with "Low Attendance" alerts and recovery counts
- Dashboards with statistics and charts for all three roles
- Attendance history with filters (subject, class, date range, status) + pagination
- Reports: daily, monthly, subject-wise, student-wise, low-attendance — with CSV export
- Consistent JSON responses, global error handling, toast notifications

## Demo credentials (development only)

| Role    | Email                   | Password   |
| ------- | ----------------------- | ---------- |
| Admin   | `admin@attendify.com`   | `admin123` |
| Teacher | `teacher@attendify.com` | `teacher123` |
| Student | `student@attendify.com` | `student123` |

## Technology stack

- **Frontend:** React 18, TypeScript, Tailwind CSS v4, React Router (hash), Fetch-style async API layer
- **Reference backend architecture:** Java · Spring Boot · Spring Web · Spring Data JPA · Hibernate · Spring Security · JWT · Maven
- **Database:** PostgreSQL (mapped 1:1 by the embedded demo store)

## Architecture

```
Controller  →  Service  →  Repository  →  PostgreSQL
```

Business logic lives in the service layer; controllers only translate HTTP.
`@RestControllerAdvice` produces the standard error envelope.

### REST API

| Method | Endpoint | Access |
| ------ | -------- | ------ |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | any role |
| GET/POST | `/api/students` | ADMIN (list also TEACHER) |
| GET/PUT/DELETE | `/api/students/{id}` | ADMIN (GET also self) |
| GET/POST | `/api/teachers` | ADMIN |
| GET/PUT/DELETE | `/api/teachers/{id}` | ADMIN |
| GET | `/api/subjects`, `/api/classes` | any role |
| POST/PUT/DELETE | `/api/subjects…`, `/api/classes…` | ADMIN |
| GET | `/api/attendance` (filters) | scoped by role |
| POST | `/api/attendance` (session) | TEACHER (own subjects) / ADMIN |
| PUT | `/api/attendance/{id}` | marking teacher / ADMIN |
| GET | `/api/reports/attendance` · `/api/reports/student/{id}` · `/api/reports/low-attendance` | ADMIN / TEACHER (scoped) |
| GET | `/api/stats/...` | dashboard statistics |

Every request after login carries `Authorization: Bearer <JWT>`.

### Response envelope

```json
{ "success": true,  "message": "Attendance saved successfully", "data": {} }
{ "success": false, "message": "Student not found", "errors": [] }
```

Status codes: `400` validation · `401` unauthenticated · `403` forbidden · `404` not found · `409` conflict.

### Authorization rules

- **Admin** manages the entire system.
- **Teacher** marks/edits attendance only for assigned subjects; cannot delete teachers with assigned subjects.
- **Student** reads only their own attendance; cannot modify anything; cannot access another student's data.
- Passwords are never returned by the API.

## Running locally

```bash
npm install
npm run dev      # develop
npm run build    # production build → dist/
```

For the full Java + PostgreSQL setup, use environment configuration such as:

```
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
jwt.secret=${JWT_SECRET}
```

CORS is configured for the local frontend (e.g. `http://localhost:5500`) against the backend at `http://localhost:8080`.

## Attendance calculation

```
Attendance % = (Classes Attended / Total Classes) × 100
```

Example: `34 / 40 = 85% → Good` · `26 / 38 = 68% → Low Attendance (needs 4 classes)`.

## Future scope

- Biometric / QR-based check-in · SMS/email alerts to parents · Leave requests workflow
- Timetable-aware scheduling · Academic-year archiving · Mobile app

## Author

**Vipin Prajapati** — B.Tech Mini Project
*Attendify – College Attendance Management System*
