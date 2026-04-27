import { createContext, useContext, useState, type ReactNode } from "react";

interface AttendanceDeadlineContextValue {
  isDeadlineClosed: boolean;
  closeDeadline: () => void;
  reopenDeadline: () => void;
  deadlineClosedAt?: string;
  deadlineClosedBy?: string;
}

const AttendanceDeadlineContext = createContext<AttendanceDeadlineContextValue | undefined>(undefined);

export function AttendanceDeadlineProvider({ children }: { children: ReactNode }) {
  const [isDeadlineClosed, setIsDeadlineClosed] = useState(false);
  const [deadlineClosedAt, setDeadlineClosedAt] = useState<string>();
  const [deadlineClosedBy, setDeadlineClosedBy] = useState<string>();

  const closeDeadline = () => {
    setIsDeadlineClosed(true);
    setDeadlineClosedAt(new Date().toISOString());
    setDeadlineClosedBy("관리자"); // 실제로는 현재 로그인 관리자 정보
  };

  const reopenDeadline = () => {
    setIsDeadlineClosed(false);
    setDeadlineClosedAt(undefined);
    setDeadlineClosedBy(undefined);
  };

  return (
    <AttendanceDeadlineContext.Provider
      value={{
        isDeadlineClosed,
        closeDeadline,
        reopenDeadline,
        deadlineClosedAt,
        deadlineClosedBy,
      }}
    >
      {children}
    </AttendanceDeadlineContext.Provider>
  );
}

export function useAttendanceDeadline() {
  const context = useContext(AttendanceDeadlineContext);
  if (!context) {
    throw new Error("useAttendanceDeadline must be used within AttendanceDeadlineProvider");
  }
  return context;
}
