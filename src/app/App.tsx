import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { AppProvider } from "./context/AppContext";
import { AttendanceDeadlineProvider } from "./context/AttendanceDeadlineContext";
import { UserContext, type UserRole } from "./context/UserContext";
import { HotelProvider } from "./context/HotelContext";

export default function App() {
  const userRole: UserRole = "admin";
  const userName = "김재민";

  return (
    <AuthProvider>
      <HotelProvider>
        <AppProvider>
          <UserContext.Provider value={{ role: userRole, isAdmin: userRole === "admin", userName }}>
            <AttendanceDeadlineProvider>
              <ToastProvider>
                <RouterProvider router={router} />
              </ToastProvider>
            </AttendanceDeadlineProvider>
          </UserContext.Provider>
        </AppProvider>
      </HotelProvider>
    </AuthProvider>
  );
}
