# Attendify — College Attendance Management System

> **Smart Attendance. Better Tracking.**

**Live Demo:** https://attendifyweb.vercel.app/

Attendify is a modern **College Attendance Management System** designed to digitize attendance tracking for administrators, teachers, and students. It provides role-based dashboards, attendance management, automatic percentage calculation, low-attendance alerts, history, and reports through a clean web interface.

## Features

- Secure role-based authentication
- Admin, Teacher, and Student roles
- Student, teacher, subject, and class management
- Attendance marking and editing
- Duplicate-proof attendance sessions
- Automatic attendance percentage calculation
- 75% minimum attendance threshold
- Low-attendance alerts and recovery information
- Role-specific dashboards and statistics
- Attendance history with filters and pagination
- Daily, monthly, subject-wise, and student-wise reports
- Low-attendance reports
- CSV report export
- Responsive and modern UI
- Toast notifications and consistent error handling

## User Roles

| Role | Capabilities |
| --- | --- |
| **Admin** | Manage students, teachers, subjects, classes, attendance, and reports |
| **Teacher** | Mark and manage attendance for assigned subjects and view relevant reports |
| **Student** | View personal attendance, history, statistics, and reports |

## Demo Credentials

> Development/demo credentials only.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@attendify.com` | `admin123` |
| Teacher | `teacher@attendify.com` | `teacher123` |
| Student | `student@attendify.com` | `student123` |

## Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Framer Motion
- Recharts
- Lucide React

### Supporting Libraries

- Supabase JavaScript client
- dnd-kit
- date-fns
- UUID
- canvas-confetti

### Backend Architecture

The project is structured around a REST API architecture suitable for a Java backend:

- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- Hibernate
- Spring Security
- JWT Authentication
- Maven
- PostgreSQL

The current frontend demo includes an embedded API/data layer, making it possible to run the application locally without a separate backend service. The UI is designed so that the API layer can be replaced with a Spring Boot REST backend.

## Architecture

```text
React Frontend
      ↓
API Layer
      ↓
Service Layer
      ↓
Repository Layer
      ↓
PostgreSQL
```

For a production Spring Boot implementation:

```text
Controller → Service → Repository → PostgreSQL
```

## Attendance Calculation

Attendance percentage is calculated automatically:

```text
Attendance % = (Classes Attended / Total Classes) × 100
```

Example:

```text
34 / 40 × 100 = 85%   → Good
26 / 38 × 100 = 68%   → Low Attendance
```

The default minimum attendance threshold is **75%**.

## REST API Design

The application is designed around RESTful endpoints such as:

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated users |
| GET/POST | `/api/students` | Admin / Teacher (scoped) |
| GET/PUT/DELETE | `/api/students/{id}` | Admin / Self |
| GET/POST | `/api/teachers` | Admin |
| GET/PUT/DELETE | `/api/teachers/{id}` | Admin |
| GET | `/api/subjects` | Authenticated users |
| GET | `/api/classes` | Authenticated users |
| POST/PUT/DELETE | `/api/subjects` | Admin |
| POST/PUT/DELETE | `/api/classes` | Admin |
| GET | `/api/attendance` | Role-based |
| POST | `/api/attendance` | Teacher / Admin |
| PUT | `/api/attendance/{id}` | Teacher / Admin |
| GET | `/api/reports/attendance` | Admin / Teacher |
| GET | `/api/reports/student/{id}` | Admin / Teacher / Student (scoped) |
| GET | `/api/reports/low-attendance` | Admin / Teacher |

Authenticated API requests use:

```text
Authorization: Bearer <JWT>
```

## Standard API Response

```json
{
  "success": true,
  "message": "Attendance saved successfully",
  "data": {}
}
```

## Run Locally

```bash
git clone https://github.com/vipinpra09/Attendify.git
cd Attendify/Attendify
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Type checking:

```bash
npm run typecheck
```

The production build is generated in the `dist/` directory.

## Project Structure

```text
Attendify/
├── Attendify/
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.js
│   └── README.md
└── README.md
```

## Future Scope

- QR-code based attendance
- Biometric attendance integration
- Parent SMS/email notifications
- Student leave-request workflow
- Timetable-aware attendance scheduling
- Academic-year and semester archiving
- Mobile application
- Advanced attendance analytics

## Project Information

**Project:** Attendify  
**Type:** College Mini Project  
**Domain:** Education / Attendance Management  
**Developer:** Vipin Prajapati

## License

This project is developed for educational and academic purposes.
