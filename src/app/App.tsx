import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AttendanceDeadlineProvider } from "./context/AttendanceDeadlineContext";
import { UserContext, type UserRole } from "./context/UserContext";
import { AppProvider } from "./context/AppContext";
import { ToastProvider } from "./context/ToastContext";

export default function App() {
  const userRole: UserRole = "admin";
  const userName = "김재민";

  return (
    <AppProvider>
      <UserContext.Provider value={{ role: userRole, isAdmin: userRole === "admin", userName }}>
        <AttendanceDeadlineProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </AttendanceDeadlineProvider>
      </UserContext.Provider>
    </AppProvider>
  );
}