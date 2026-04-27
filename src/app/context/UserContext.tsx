import { createContext, useContext } from "react";

/* ══════════════════════════════════════════════════════════
   USER ROLE CONTEXT
   관리자 권한 체크를 위한 사용자 역할 컨텍스트
══════════════════════════════════════════════════════════ */

export type UserRole = "admin" | "staff";

interface UserContextType {
  role: UserRole;
  isAdmin: boolean;
  userName: string;
}

const UserContext = createContext<UserContextType>({
  role: "staff",
  isAdmin: false,
  userName: "사용자",
});

export function useUser() {
  return useContext(UserContext);
}

export { UserContext };
