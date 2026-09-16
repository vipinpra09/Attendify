# 🎓 Attendify — College Attendance Management System

<p align="center">
  <strong>Smart Attendance. Better Tracking.</strong>
</p>

<p align="center">
  A full-stack, role-based college attendance management system for administrators, teachers, and students.
</p>

<p align="center">
  <a href="https://attendify-ndnk3ngqi-vipinpra09s-projects.vercel.app/">🌐 Live Demo</a> ·
  <a href="https://github.com/vipinpra09/Attendify">📂 Repository</a>
</p>

---

## 📌 Overview

**Attendify** is a full-stack College Attendance Management System built to digitize attendance workflows and provide a centralized platform for managing students, teachers, subjects, classes, attendance records, and reports.

The application provides separate experiences for **Admin, Teacher, and Student** roles, with role-based access to attendance operations, dashboards, statistics, history, and reporting.

---

## ✨ Features

### 🔐 Authentication & Security

- JWT-based authentication
- Role-based authorization
- Protected application routes
- Spring Security integration
- Validation for API requests

### 👨‍💼 Admin

- Manage students and teachers
- Manage subjects and classes
- Monitor attendance records
- View dashboard statistics
- Generate attendance reports
- View low-attendance students
- Export reports as CSV

### 👩‍🏫 Teacher

- View assigned subjects/classes
- Mark attendance
- Prevent duplicate attendance sessions
- Manage attendance records
- View attendance history
- Monitor attendance percentages
- Generate attendance reports

### 👨‍🎓 Student

- View personal attendance
- View attendance percentage
- Check attendance history
- Filter attendance records
- View attendance statistics
- Monitor low-attendance status

### 📊 Reporting & Attendance

- Automatic attendance percentage calculation
- 75% minimum attendance threshold
- Daily, monthly, and subject-wise reports
- Low-attendance reports
- CSV export
- Responsive dashboard UI
- Toast notifications and error handling

---

## 👥 User Roles

| Role | Main Capabilities |
|---|---|
| 👨‍💼 **Admin** | Users, subjects, classes, attendance, statistics and reports |
| 👩‍🏫 **Teacher** | Attendance marking, assigned classes/subjects and reports |
| 👨‍🎓 **Student** | Personal attendance, history, statistics and reports |

---

## 📊 Attendance Calculation

Attendify calculates attendance automatically using:

```text
Attendance % = (Classes Attended / Total Classes) × 100
```

The configured minimum attendance requirement is **75%**.

Example:

```text
34 / 40 × 100 = 85%  → Good Attendance
26 / 38 × 100 = 68%  → Low Attendance
```

---

## 🏗️ Architecture

```text
┌────────────────────────────┐
│ React + TypeScript         │
│ Frontend                   │
└─────────────┬──────────────┘
              │ REST API
              ▼
┌────────────────────────────┐
│ Spring Boot                │
│ Controllers                │
└─────────────┬──────────────┘
              ▼
┌────────────────────────────┐
│ Service Layer              │
└─────────────┬──────────────┘
              ▼
┌────────────────────────────┐
│ Repository / JPA           │
└─────────────┬──────────────┘
              ▼
┌────────────────────────────┐
│ PostgreSQL                 │
└────────────────────────────┘
```

### Backend flow

```text
Controller → Service → Repository → PostgreSQL
```

The frontend communicates with the Spring Boot backend through REST APIs. JWT tokens are used for authenticated requests.

---

## 🛠️ Tech Stack

### Frontend

- ⚛️ React 18
- 🟦 TypeScript
- ⚡ Vite
- 🎨 Tailwind CSS
- 🧭 React Router
- 🎞️ Framer Motion
- 📈 Recharts
- 🎯 Lucide React

### Backend

- ☕ Java 17
- 🌱 Spring Boot 3.2.5
- Spring Web
- Spring Data JPA
- Hibernate
- Spring Security
- Bean Validation
- JWT (JJWT)
- Maven

### Database

- 🐘 PostgreSQL

### Additional Libraries

- Supabase JavaScript Client
- dnd-kit
- date-fns
- UUID
- canvas-confetti

---

## 🔌 REST API

The backend exposes REST endpoints for authentication, users, attendance, and reporting.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Current authenticated user |
| GET/POST | `/api/students` | Manage students |
| GET/PUT/DELETE | `/api/students/{id}` | Student operations |
| GET/POST | `/api/teachers` | Manage teachers |
| GET/PUT/DELETE | `/api/teachers/{id}` | Teacher operations |
| GET | `/api/subjects` | List subjects |
| GET | `/api/classes` | List classes |
| GET | `/api/attendance` | Attendance records |
| POST | `/api/attendance` | Mark attendance |
| PUT | `/api/attendance/{id}` | Update attendance |
| GET | `/api/reports/attendance` | Attendance report |
| GET | `/api/reports/low-attendance` | Low-attendance report |

Authenticated requests use:

```http
Authorization: Bearer <JWT>
```

---
## 🚀 Run Locally

### Prerequisites

- Node.js 18+
- npm
- Java 17+
- Maven
- PostgreSQL

### 1. Clone the repository

```bash
git clone https://github.com/vipinpra09/Attendify.git
cd Attendify
```

### 2. Configure PostgreSQL

Create a PostgreSQL database and user, then provide these environment variables to the backend:

```text
DB_URL=jdbc:postgresql://localhost:5432/attendify
DB_USERNAME=attendify
DB_PASSWORD=your_password
JWT_SECRET=your_secret
JWT_EXPIRATION_MS=43200000
CORS_ORIGINS=http://localhost:5173
```

The backend reads database and JWT configuration from environment variables rather than storing credentials in source code.

### 3. Start the backend

```bash
cd backend
mvn spring-boot:run
```

The backend port is configurable with the `PORT` environment variable.

### 4. Start the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

---

## 📦 Production Build

From the `frontend` directory:

```bash
npm run build
```

The production build is generated in:

```text
dist/
```

Run TypeScript checks with:

```bash
npm run typecheck
```

---

## 📁 Project Structure

```text
Attendify/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/main/java/com/attendify/
│   ├── src/main/resources/
│   └── pom.xml
│
└── README.md
```

---

## 🎯 Project Objectives

- Reduce manual attendance work
- Improve accuracy of attendance records
- Give students visibility into their attendance
- Help teachers manage attendance efficiently
- Identify low-attendance students quickly
- Centralize attendance reporting
- Provide a scalable full-stack foundation for college management

---

## 🔮 Future Enhancements

- 📱 Mobile application
- 📷 QR-code attendance
- 🔐 Biometric attendance
- 📧 Email notifications
- 📩 Parent notifications
- 📝 Student leave-request workflow
- 🗓️ Timetable integration
- 🎓 Semester and academic-year management
- 📊 Advanced analytics


---

## 👨‍💻 Developer

**Vipin Prajapati**

- GitHub: [@vipinpra09](https://github.com/vipinpra09)
- Repository: [Attendify](https://github.com/vipinpra09/Attendify)

---

## 📚 Project Information

| | |
|---|---|
| **Project Name** | Attendify |
| **Project Type** | College Mini Project |
| **Domain** | Education Technology |
| **Category** | Attendance Management System |
| **Architecture** | Full Stack / REST API |

---

## 📄 License

This project is developed for **educational and academic purposes**.

---

<p align="center">
  ⭐ If you find Attendify useful, consider giving the repository a star!
</p>

<p align="center">
  Made with ❤️ by <strong>Vipin Prajapati</strong> <br>
  Made with ❤️ by <strong>Vishal Kumar Yadav</strong> <br>
  Made with ❤️ by <strong>Yogesh Yadav</strong> <br>
  Made with ❤️ by <strong>VishvNath Singh</strong> <br>
</p>
