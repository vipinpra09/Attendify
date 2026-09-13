# 🎓 Attendify — College Attendance Management System

<p align="center">
  <b>Smart Attendance. Better Tracking.</b>
</p>

<p align="center">
  A modern web-based attendance management system designed to simplify attendance tracking for colleges, teachers, administrators, and students.
</p>

<p align="center">
  <a href="https://attendifyweb.vercel.app/">🌐 Live Demo</a> ·
  <a href="https://github.com/vipinpra09/Attendify">📂 Repository</a>
</p>

---

## 📌 About the Project

**Attendify** is a College Attendance Management System developed as an academic mini project. It digitizes the traditional attendance process and provides a centralized platform for managing students, teachers, subjects, classes, and attendance records.

The system provides dedicated functionality for **Administrators, Teachers, and Students**, making attendance tracking more organized, accurate, and accessible.

---

## ✨ Key Features

- 🔐 Secure role-based authentication
- 👨‍💼 Admin, Teacher, and Student dashboards
- 👨‍🎓 Student management
- 👩‍🏫 Teacher management
- 📚 Subject and class management
- ✅ Mark and manage attendance
- 🚫 Duplicate attendance session prevention
- 📊 Automatic attendance percentage calculation
- ⚠️ Low-attendance alerts
- 🎯 75% minimum attendance threshold
- 📈 Role-specific statistics and dashboards
- 🗓️ Attendance history with filters
- 📄 Daily, monthly, and subject-wise reports
- 📉 Low-attendance reports
- 📥 CSV report export
- 📱 Responsive modern user interface
- 🔔 Toast notifications and error handling

---

## 👥 User Roles

| Role | Access |
|---|---|
| 👨‍💼 **Admin** | Manage students, teachers, subjects, classes, attendance, and reports |
| 👩‍🏫 **Teacher** | Mark attendance, manage assigned subjects, and view reports |
| 👨‍🎓 **Student** | View personal attendance, history, statistics, and reports |

---

## 🔑 Demo Credentials

> ⚠️ These credentials are intended for development and demonstration purposes.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@attendify.com` | `admin123` |
| Teacher | `teacher@attendify.com` | `teacher123` |
| Student | `student@attendify.com` | `student123` |

---

## 🛠️ Technology Stack

### 🎨 Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Framer Motion
- Recharts
- Lucide React

### 📦 Supporting Libraries

- Supabase JavaScript Client
- dnd-kit
- date-fns
- UUID
- canvas-confetti

### ⚙️ Backend Architecture

The project is designed around a REST API architecture compatible with:

- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- Hibernate
- Spring Security
- JWT Authentication
- Maven
- PostgreSQL

The React frontend talks to a Spring Boot 3 backend over REST. JWT tokens are issued at login and sent as `Authorization: Bearer <token>`. Persistence is PostgreSQL via Spring Data JPA.

---

## 🏗️ System Architecture

```
React Frontend
       │
       ▼
   API Layer
       │
       ▼
 Service Layer
       │
       ▼
Repository Layer
       │
       ▼
 PostgreSQL
```

### Spring Boot Backend Architecture

```
Controller
    ↓
Service
    ↓
Repository
    ↓
PostgreSQL
```

---

## 📊 Attendance Calculation

Attendance percentage is calculated automatically:

```
Attendance % = (Classes Attended / Total Classes) × 100
```

### Example

```
34 / 40 × 100 = 85%  → Good Attendance

26 / 38 × 100 = 68%  → Low Attendance
```

The default minimum attendance requirement is **75%**.

---

## 🔌 REST API Design

The application is structured around RESTful APIs such as:

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated User |
| GET/POST | `/api/students` | Admin / Teacher |
| GET/PUT/DELETE | `/api/students/{id}` | Admin / Authorized User |
| GET/POST | `/api/teachers` | Admin |
| GET/PUT/DELETE | `/api/teachers/{id}` | Admin |
| GET | `/api/subjects` | Authenticated User |
| GET | `/api/classes` | Authenticated User |
| GET | `/api/attendance` | Role-Based |
| POST | `/api/attendance` | Teacher / Admin |
| PUT | `/api/attendance/{id}` | Teacher / Admin |
| GET | `/api/reports/attendance` | Admin / Teacher |
| GET | `/api/reports/low-attendance` | Admin / Teacher |

### Authentication

Authenticated requests use JWT tokens:

```
Authorization: Bearer <JWT>
```

---

## Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/vipinpra09/Attendify.git
cd Attendify
```

### 2. Start PostgreSQL

```bash
sudo service postgresql start

sudo -u postgres psql -c "CREATE USER attendify WITH PASSWORD 'attendify' LOGIN;"
sudo -u postgres psql -c "CREATE DATABASE attendify OWNER attendify;"
sudo -u postgres psql -d attendify -c "GRANT ALL ON SCHEMA public TO attendify;"
```

Skip the `CREATE` statements if the user and database already exist.

### 3. Start the Spring Boot backend

```bash
cd backend
mvn spring-boot:run
```

The API starts on `http://localhost:8080`. Demo data is seeded on first run.

### 4. Start the React frontend

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:8080`. The UI is at `http://localhost:3000`.

---

## 📦 Production Build

Create an optimized production build:

```bash
cd frontend
npm run build
```

The production files will be generated inside:

```
dist/
```

### Type Checking

```bash
cd frontend
npm run typecheck
```

---

## 📁 Project Structure

```
Attendify/
│
├── frontend/                   React + TypeScript frontend
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.js
│
├── backend/                    Spring Boot 3 + PostgreSQL API
│   ├── pom.xml
│   └── src/main/java/com/attendify/
│
└── README.md
```

---

## 🎯 Project Objectives

The main objectives of Attendify are:

- Reduce manual attendance work
- Improve accuracy in attendance records
- Provide real-time attendance statistics
- Help students monitor attendance percentage
- Identify low-attendance students quickly
- Provide an organized reporting system
- Create a scalable foundation for a complete college management system

---

## 🔮 Future Enhancements

- 📱 Mobile application
- 📷 QR-code based attendance
- 🔐 Biometric attendance integration
- 📧 Email notifications
- 📩 Parent notifications
- 📝 Student leave request system
- 🗓️ Timetable-aware attendance scheduling
- 🎓 Semester and academic-year management
- 📊 Advanced analytics and insights
- 🤖 AI-based attendance prediction

---

## 👨‍💻 Developer

**Vipin Prajapati**

- GitHub: https://github.com/vipinpra09
- Project Repository: https://github.com/vipinpra09/Attendify

---

## 📚 Project Information

| | |
|---|---|
| **Project Name** | Attendify |
| **Project Type** | College Mini Project |
| **Domain** | Education Technology |
| **Category** | Attendance Management System |

---

## 📄 License

This project is developed for **educational and academic purposes**.

---

<p align="center">
  ⭐ If you find this project useful, consider giving it a star!
</p>

<p align="center">
  Made with ❤️ for better attendance management.
</p>