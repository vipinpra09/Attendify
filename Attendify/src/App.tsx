import { useEffect, type ReactNode } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, homeFor, useAuth } from "./lib/auth";
import { ToastProvider } from "./components/ui";
import { FullScreenLoader } from "./components/layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import { ClassesPage, StudentsPage, SubjectsPage, TeachersPage } from "./pages/Manage";
import { MarkAttendance, TeacherDashboard } from "./pages/TeacherPages";
import StudentDashboard from "./pages/StudentDashboard";
import { HistoryPage, ProfilePage, ReportsPage } from "./pages/SharedPages";
import type { Role } from "./lib/types";

function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!ready) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            <Route path="/admin" element={<RequireRole role="ADMIN"><AdminDashboard /></RequireRole>} />
            <Route path="/admin/students" element={<RequireRole role="ADMIN"><StudentsPage /></RequireRole>} />
            <Route path="/admin/teachers" element={<RequireRole role="ADMIN"><TeachersPage /></RequireRole>} />
            <Route path="/admin/subjects" element={<RequireRole role="ADMIN"><SubjectsPage /></RequireRole>} />
            <Route path="/admin/classes" element={<RequireRole role="ADMIN"><ClassesPage /></RequireRole>} />
            <Route path="/admin/reports" element={<RequireRole role="ADMIN"><ReportsPage /></RequireRole>} />

            <Route path="/teacher" element={<RequireRole role="TEACHER"><TeacherDashboard /></RequireRole>} />
            <Route path="/teacher/attendance" element={<RequireRole role="TEACHER"><MarkAttendance /></RequireRole>} />
            <Route path="/teacher/history" element={<RequireRole role="TEACHER"><HistoryPage /></RequireRole>} />
            <Route path="/teacher/reports" element={<RequireRole role="TEACHER"><ReportsPage /></RequireRole>} />
            <Route path="/teacher/profile" element={<RequireRole role="TEACHER"><ProfilePage /></RequireRole>} />

            <Route path="/student" element={<RequireRole role="STUDENT"><StudentDashboard /></RequireRole>} />
            <Route path="/student/history" element={<RequireRole role="STUDENT"><HistoryPage /></RequireRole>} />
            <Route path="/student/profile" element={<RequireRole role="STUDENT"><ProfilePage /></RequireRole>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
