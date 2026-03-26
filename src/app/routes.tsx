import { createBrowserRouter } from "react-router";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import SchedulePage from "./pages/SchedulePage";
import DemandPage from "./pages/DemandPage";
import EmployeesPage from "./pages/EmployeesPage";
import RequestPage from "./pages/RequestPage";
import AttendancePage from "./pages/AttendancePage";
import SettingsPage from "./pages/SettingsPage";

export const router = createBrowserRouter([
  { path: "/",          Component: LoginPage },
  { path: "/dashboard", Component: DashboardPage },
  { path: "/schedule",  Component: SchedulePage },
  { path: "/demand",    Component: DemandPage },
  { path: "/employees", Component: EmployeesPage },
  { path: "/request",   Component: RequestPage },
  { path: "/attendance", Component: AttendancePage },
  { path: "/settings",  Component: SettingsPage },
]);