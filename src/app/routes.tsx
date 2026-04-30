import { createBrowserRouter, Navigate } from "react-router";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SchedulePage from "./pages/SchedulePage";
import DemandPage from "./pages/DemandPage";
import EmployeesPage from "./pages/EmployeesPage";
import RequestPage from "./pages/RequestPage";
import AttendancePage from "./pages/AttendancePage";
import RedeploymentPage from "./pages/RedeploymentPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import AnnualNightShiftPlanPage from "./pages/AnnualNightShiftPlanPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (token) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RedirectIfAuthed><LoginPage /></RedirectIfAuthed>,
  },
  {
    path: "/dashboard",
    element: <RequireAuth><DashboardPage /></RequireAuth>,
  },
  {
    path: "/schedule",
    element: <RequireAuth><SchedulePage /></RequireAuth>,
  },
  {
    path: "/demand",
    element: <RequireAuth><DemandPage /></RequireAuth>,
  },
  {
    path: "/employees",
    element: <RequireAuth><EmployeesPage /></RequireAuth>,
  },
  {
    path: "/request",
    element: <RequireAuth><RequestPage /></RequireAuth>,
  },
  {
    path: "/attendance",
    element: <RequireAuth><AttendancePage /></RequireAuth>,
  },
  {
    path: "/settings",
    element: <RequireAuth><SettingsPage /></RequireAuth>,
  },
  {
    path: "/redeployment",
    element: <RequireAuth><RedeploymentPage /></RequireAuth>,
  },
  {
    path: "/profile",
    element: <RequireAuth><ProfilePage /></RequireAuth>,
  },
  {
    path: "/annual-night-shift",
    element: <RequireAuth><AnnualNightShiftPlanPage /></RequireAuth>,
  },
]);
