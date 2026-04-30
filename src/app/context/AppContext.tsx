import { createContext, useContext, useState, ReactNode } from "react";

/* ══════════════════════════════════════════════════════════
   TYPE DEFINITIONS
══════════════════════════════════════════════════════════ */

export type HotelName =
  | "롯데시티호텔 마포"
  | "롯데시티호텔 김포"
  | "롯데시티호텔 제주"
  | "롯데시티호텔 대전"
  | "롯데시티호텔 구로"
  | "롯데시티호텔 울산"
  | "롯데시티호텔 명동"
  | "L7 명동"
  | "L7 강남"
  | "L7 홍대"
  | "L7 해운대"
  | "L7 광명";

export type ScheduleStatus = "작업 중" | "확정";

/* ── 공유 데이터 타입 ───────────────────────────────────── */

export type WarningSeverity = "risk" | "review";

export interface ScheduleWarning {
  id: number;
  date: string;           // 예: "4월 12일"
  shift: string;          // 예: "오전조"
  description: string;    // 짧은 요약
  detail: string;         // 세부 설명
  severity: WarningSeverity;
}

export type LogType =
  | "AI 조정"
  | "근태 반영"
  | "직원 추가"
  | "직원 수정"
  | "정책 수정"
  | "회원 승인"
  | "근무표 생성";

export interface ChangeLog {
  type: LogType;
  typeBg: string;
  typeColor: string;
  target: string;
  actor: string;
  role: string;
  detail: string;
  time: string;
}

export type FairnessIssueCategory =
  | "근태 신청 미반영"
  | "주말/공휴 편중"
  | "고강도 근무"
  | "야간조 편중"
  | "회복 반영 예외"
  | "계획 대비 실제 편차";

export type FairnessSeverity = "위험" | "검토" | "양호";

export interface FairnessIssue {
  id: number;
  employeeName: string;
  grade: string;
  shift: string;
  issueType: string;
  category: FairnessIssueCategory;
  count: string;
  targetPeriod: string;
  description: string;
  recommendation: string;
  severity: FairnessSeverity;
  linkedDates: string[];
}

export interface AttendanceStats {
  reviewNeeded: number;     // 검토 필요 건수
  notReflected: number;     // 미반영 직원 수
  pendingApproval: number;  // 승인 대기 건수
  autoCompleted: number;    // 자동 반영 완료 건수
}

export interface DemandToday {
  checkin: number;
  checkout: number;
  peakCheckinDate: string;
  peakCheckoutDate: string;
  lastForecastDate: string;
}

export interface EmployeeCounts {
  total: number;
  incharge: number;
  aiAdjustments: number;
}

/* ══════════════════════════════════════════════════════════
   DEFAULT / INITIAL VALUES  (공통 mock 초기값)
══════════════════════════════════════════════════════════ */

const DEFAULT_WARNINGS: ScheduleWarning[] = [
  {
    id: 1,
    date: "4월 12일",
    shift: "오전조",
    description: "4월 12일 최소 조별 인원 2명 부족",
    detail: "오전조 · 인력 추가 배치 필요",
    severity: "risk",
  },
  {
    id: 2,
    date: "4월 14일",
    shift: "야간조",
    description: "4월 14일 인차지 배치 부족",
    detail: "야간조 · 인차지 1명 이상 필요",
    severity: "risk",
  },
  {
    id: 3,
    date: "4월 20일",
    shift: "주말",
    description: "4월 20일 공휴 운영 인원 부족 가능",
    detail: "주말 · 예비 인력 검토 필요",
    severity: "review",
  },
  {
    id: 4,
    date: "4월 2주차",
    shift: "전체",
    description: "4월 2주차 근태 신청 미반영 직원 3명",
    detail: "근태 관리 화면에서 확인 필요",
    severity: "review",
  },
];

const DEFAULT_CHANGE_LOGS: ChangeLog[] = [
  { type: "AI 조정",    typeBg: "rgba(185,155,90,0.08)", typeColor: "#7A5518", target: "4월 12일 오전조 인력 배치",    actor: "시스템 (AI)",   role: "자동",       detail: "오전조 인원 1명 추가 배치",          time: "2026.03.26 14:32" },
  { type: "근태 반영",  typeBg: "rgba(46,125,82,0.07)",  typeColor: "#2E7D52", target: "박소연 연차 자동 반영",        actor: "시스템 (자동)", role: "자동",       detail: "4월 8일 연차 반영",                  time: "2026.03.26 11:20" },
  { type: "직원 추가",  typeBg: "rgba(94,127,163,0.08)", typeColor: "#5E7FA3", target: "이민준 (L2 · 오전조)",         actor: "김재민",        role: "최종 관리자", detail: "오전조 신규 배치",                  time: "2026.03.25 16:45" },
  { type: "정책 수정",  typeBg: "rgba(184,124,26,0.08)", typeColor: "#B87C1A", target: "최소 조별 인원 4명 → 5명",    actor: "김재민",        role: "최종 관리자", detail: "오전조 최소 인원 변경",              time: "2026.03.24 10:15" },
  { type: "회원 승인",  typeBg: "rgba(46,125,82,0.07)",  typeColor: "#2E7D52", target: "최유리 회원가입 승인",         actor: "김재민",        role: "최종 관리자", detail: "일반 직원 권한 부여",               time: "2026.03.23 14:20" },
  { type: "근무표 생성",typeBg: "rgba(94,127,163,0.08)", typeColor: "#5E7FA3", target: "v3.3 생성",                    actor: "박지현",        role: "운영 관리자", detail: "2026년 4월 v3.3 신규 생성",         time: "2026.03.22 09:30" },
  { type: "AI 조정",    typeBg: "rgba(185,155,90,0.08)", typeColor: "#7A5518", target: "4월 14일 야간조 인차지 배치",  actor: "시스템 (AI)",   role: "자동",       detail: "인차지 부족 자동 감지 후 조정",     time: "2026.03.21 17:05" },
  { type: "근태 반영",  typeBg: "rgba(46,125,82,0.07)",  typeColor: "#2E7D52", target: "정우진 병가 반영",             actor: "시스템 (자동)", role: "자동",       detail: "4월 5일~6일 병가 처리",             time: "2026.03.21 14:50" },
  { type: "정책 수정",  typeBg: "rgba(184,124,26,0.08)", typeColor: "#B87C1A", target: "14일 4휴무 규칙 설명 업데이트",actor: "김재민",        role: "최종 관리자", detail: "정책 설명 텍스트 수정",             time: "2026.03.20 11:00" },
  { type: "직원 수정",  typeBg: "rgba(184,124,26,0.08)", typeColor: "#B87C1A", target: "이서우 조 변경 (오전→오후)",   actor: "박지현",        role: "운영 관리자", detail: "오후조 전환 적용",                  time: "2026.03.19 13:22" },
  { type: "회원 승인",  typeBg: "rgba(46,125,82,0.07)",  typeColor: "#2E7D52", target: "김민준 회원가입 승인",         actor: "김재민",        role: "최종 관리자", detail: "일반 직원 권한 부여",               time: "2026.03.19 10:15" },
  { type: "근무표 생성",typeBg: "rgba(94,127,163,0.08)", typeColor: "#5E7FA3", target: "v3.2 생성",                    actor: "박지현",        role: "운영 관리자", detail: "2026년 4월 v3.2 신규 생성",         time: "2026.03.18 09:00" },
];

const DEFAULT_FAIRNESS_ISSUES: FairnessIssue[] = [
  {
    id: 1,
    employeeName: "김태훈",
    grade: "L2",
    shift: "오후조",
    issueType: "A13 다음날 M07 발생",
    category: "고강도 근무",
    count: "2회",
    targetPeriod: "4월 9일 ~ 4월 10일",
    description: "오후조(A13) 다음날 오전조(M07) 근무가 반복되었습니다.",
    recommendation: "다음 버전 생성 시 오전조 배정을 조정하세요.",
    severity: "위험",
    linkedDates: ["2026-04-09", "2026-04-10"],
  },
  {
    id: 2,
    employeeName: "박지현",
    grade: "L3",
    shift: "오전조",
    issueType: "주말 휴무 부족",
    category: "주말/공휴 편중",
    count: "3주 연속",
    targetPeriod: "4월 1주 ~ 3주",
    description: "주말 휴무가 다른 직원 대비 적습니다.",
    recommendation: "4주차 주말 휴무 배정을 검토하세요.",
    severity: "검토",
    linkedDates: ["2026-04-05", "2026-04-12", "2026-04-19"],
  },
  {
    id: 3,
    employeeName: "오세영",
    grade: "엘크루",
    shift: "중간조",
    issueType: "회복 반영 예외",
    category: "회복 반영 예외",
    count: "1건",
    targetPeriod: "4월 초반",
    description: "전월 고강도 근무 대상자였으나 최소 인원 유지로 일부 예외 배치되었습니다.",
    recommendation: "다음 버전에서 중간조 또는 OFF 조정을 검토하세요.",
    severity: "검토",
    linkedDates: ["2026-04-02", "2026-04-03"],
  },
  {
    id: 4,
    employeeName: "최민서",
    grade: "L1",
    shift: "야간조",
    issueType: "야간조 편중",
    category: "야간조 편중",
    count: "3회 연속",
    targetPeriod: "4월 전체",
    description: "특정 직원에게 야간조 배정이 반복되고 있습니다.",
    recommendation: "5월 연간 야간조 계획을 재검토하여 편중을 완화하세요.",
    severity: "위험",
    linkedDates: ["2026-04-07", "2026-04-14", "2026-04-21"],
  },
  {
    id: 5,
    employeeName: "이수진",
    grade: "L2",
    shift: "오전조",
    issueType: "근태 신청 미반영 반복",
    category: "근태 신청 미반영",
    count: "2회",
    targetPeriod: "4월 2주 ~ 3주",
    description: "신청한 쉬는 날 희망이 2회 연속 반영되지 않았습니다.",
    recommendation: "해당 주 인원 배치를 검토하고 다음 신청을 우선 반영하세요.",
    severity: "검토",
    linkedDates: ["2026-04-08", "2026-04-15"],
  },
  {
    id: 6,
    employeeName: "정우진",
    grade: "L3",
    shift: "오전조",
    issueType: "5일 이상 연속근무 반복",
    category: "고강도 근무",
    count: "2회",
    targetPeriod: "4월 2주, 4주",
    description: "6일 연속근무 패턴이 2회 발생했습니다.",
    recommendation: "연속근무 5일 초과 시 중간 휴무 배치 원칙을 적용하세요.",
    severity: "위험",
    linkedDates: ["2026-04-13", "2026-04-14", "2026-04-15"],
  },
  {
    id: 7,
    employeeName: "한지우",
    grade: "L2",
    shift: "오후조",
    issueType: "연간 야간조 계획 미반영",
    category: "계획 대비 실제 편차",
    count: "1건",
    targetPeriod: "4월",
    description: "연간 야간조 계획 우선 대상자였으나 실제 근무표에 반영되지 않았습니다.",
    recommendation: "연간 야간조 계획 탭에서 편차 사유를 등록하세요.",
    severity: "검토",
    linkedDates: ["2026-04-14"],
  },
  {
    id: 8,
    employeeName: "김소라",
    grade: "엘크루",
    shift: "오전조",
    issueType: "공휴일 휴무 부족",
    category: "주말/공휴 편중",
    count: "2회",
    targetPeriod: "4월 공휴일",
    description: "공휴일 휴무가 다른 직원 대비 적습니다.",
    recommendation: "5월 공휴일 휴무 우선 배정을 검토하세요.",
    severity: "검토",
    linkedDates: ["2026-04-05", "2026-04-30"],
  },
];

/* ══════════════════════════════════════════════════════════
   APP STATE INTERFACE
══════════════════════════════════════════════════════════ */

export interface AppState {
  /* ── 전역 기준값 ─────────────────────────────────── */
  selectedHotel: HotelName;
  setSelectedHotel: (hotel: HotelName) => void;

  targetMonth: string; // YYYY-MM
  setTargetMonth: (month: string) => void;

  scheduleVersion: string;
  setScheduleVersion: (version: string) => void;

  scheduleStatus: ScheduleStatus;
  setScheduleStatus: (status: ScheduleStatus) => void;

  /* ── 직원 기준 확정 ──────────────────────────────── */
  employeeConfirmed: boolean;
  employeeConfirmedAt: string | null;
  setEmployeeConfirmed: (confirmed: boolean, timestamp?: string) => void;

  /* ── 수요 예측 확정 ──────────────────────────────── */
  demandForecastConfirmed: boolean;
  demandForecastConfirmedAt: string | null;
  setDemandForecastConfirmed: (confirmed: boolean, timestamp?: string) => void;

  /* ── 마지막 반영 시각 ─────────────────────────────── */
  lastUpdatedAt: string;
  setLastUpdatedAt: (ts: string) => void;

  /* ── 근태 요약 통계 ──────────────────────────────── */
  attendanceStats: AttendanceStats;
  setAttendanceStats: (stats: AttendanceStats) => void;

  /* ── 오늘 체크인/아웃 수요 예측 ──────────────────── */
  demandToday: DemandToday;
  setDemandToday: (data: DemandToday) => void;

  /* ── 리스크 일수 ─────────────────────────────────── */
  riskDaysCount: number;
  setRiskDaysCount: (count: number) => void;

  /* ── 직원 현황 ───────────────────────────────────── */
  employeeCounts: EmployeeCounts;
  setEmployeeCounts: (counts: EmployeeCounts) => void;

  /* ── 운영 경고 목록 ──────────────────────────────── */
  scheduleWarnings: ScheduleWarning[];
  setScheduleWarnings: (warnings: ScheduleWarning[]) => void;
  addScheduleWarning: (warning: ScheduleWarning) => void;

  /* ── 변경 이력 ───────────────────────────────────── */
  changeLogs: ChangeLog[];
  addChangeLog: (log: ChangeLog) => void;
  setChangeLogs: (logs: ChangeLog[]) => void;

  /* ── 공정성 이슈 ─────────────────────────────────── */
  fairnessIssues: FairnessIssue[];
  setFairnessIssues: (issues: FairnessIssue[]) => void;
}

/* ══════════════════════════════════════════════════════════
   CONTEXT
══════════════════════════════════════════════════════════ */

const AppContext = createContext<AppState | undefined>(undefined);

/* ══════════════════════════════════════════════════════════
   PROVIDER
══════════════════════════════════════════════════════════ */

export function AppProvider({ children }: { children: ReactNode }) {
  /* 전역 기준값 */
  const [selectedHotel, setSelectedHotel] = useState<HotelName>("롯데시티호텔 마포");
  const [targetMonth, setTargetMonth] = useState<string>("2026-04");
  const [scheduleVersion, setScheduleVersion] = useState<string>("v4.0");
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus>("작업 중");

  /* 직원 기준 확정 */
  const [employeeConfirmed, setEmployeeConfirmedState] = useState<boolean>(true);
  const [employeeConfirmedAt, setEmployeeConfirmedAt] = useState<string | null>("2026-03-25T16:45:00");

  const setEmployeeConfirmed = (confirmed: boolean, timestamp?: string) => {
    setEmployeeConfirmedState(confirmed);
    setEmployeeConfirmedAt(timestamp || (confirmed ? new Date().toISOString() : null));
    setLastUpdatedAt(new Date().toLocaleString("ko-KR", { hour12: false }));
  };

  /* 수요 예측 확정 */
  const [demandForecastConfirmed, setDemandForecastConfirmedState] = useState<boolean>(true);
  const [demandForecastConfirmedAt, setDemandForecastConfirmedAt] = useState<string | null>("2026-03-20T10:00:00");

  const setDemandForecastConfirmed = (confirmed: boolean, timestamp?: string) => {
    setDemandForecastConfirmedState(confirmed);
    setDemandForecastConfirmedAt(timestamp || (confirmed ? new Date().toISOString() : null));
    setLastUpdatedAt(new Date().toLocaleString("ko-KR", { hour12: false }));
  };

  /* 마지막 반영 시각 */
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("2026.03.26 14:32");

  /* 근태 요약 */
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    reviewNeeded: 3,
    notReflected: 2,
    pendingApproval: 5,
    autoCompleted: 12,
  });

  /* 수요 예측 오늘 데이터 */
  const [demandToday, setDemandToday] = useState<DemandToday>({
    checkin: 186,
    checkout: 142,
    peakCheckinDate: "4월 12일",
    peakCheckoutDate: "4월 14일",
    lastForecastDate: "2026.03.20",
  });

  /* 리스크 일수 */
  const [riskDaysCount, setRiskDaysCount] = useState<number>(4);

  /* 직원 현황 */
  const [employeeCounts, setEmployeeCounts] = useState<EmployeeCounts>({
    total: 48,
    incharge: 12,
    aiAdjustments: 12,
  });

  /* 운영 경고 */
  const [scheduleWarnings, setScheduleWarnings] = useState<ScheduleWarning[]>(DEFAULT_WARNINGS);

  const addScheduleWarning = (warning: ScheduleWarning) => {
    setScheduleWarnings((prev) => [warning, ...prev]);
  };

  /* 변경 이력 */
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>(DEFAULT_CHANGE_LOGS);

  const addChangeLog = (log: ChangeLog) => {
    setChangeLogs((prev) => [log, ...prev]);
    setLastUpdatedAt(log.time || new Date().toLocaleString("ko-KR", { hour12: false }));
  };

  /* 공정성 이슈 */
  const [fairnessIssues, setFairnessIssues] = useState<FairnessIssue[]>(DEFAULT_FAIRNESS_ISSUES);

  /* scheduleStatus 변경 시 lastUpdatedAt 갱신 */
  const handleSetScheduleStatus = (status: ScheduleStatus) => {
    setScheduleStatus(status);
    setLastUpdatedAt(new Date().toLocaleString("ko-KR", { hour12: false }));
  };

  const value: AppState = {
    selectedHotel,
    setSelectedHotel,
    targetMonth,
    setTargetMonth,
    scheduleVersion,
    setScheduleVersion,
    scheduleStatus,
    setScheduleStatus: handleSetScheduleStatus,
    employeeConfirmed,
    employeeConfirmedAt,
    setEmployeeConfirmed,
    demandForecastConfirmed,
    demandForecastConfirmedAt,
    setDemandForecastConfirmed,
    lastUpdatedAt,
    setLastUpdatedAt,
    attendanceStats,
    setAttendanceStats,
    demandToday,
    setDemandToday,
    riskDaysCount,
    setRiskDaysCount,
    employeeCounts,
    setEmployeeCounts,
    scheduleWarnings,
    setScheduleWarnings,
    addScheduleWarning,
    changeLogs,
    addChangeLog,
    setChangeLogs,
    fairnessIssues,
    setFairnessIssues,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/* ══════════════════════════════════════════════════════════
   HOOK
══════════════════════════════════════════════════════════ */

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}

/* ══════════════════════════════════════════════════════════
   SELECTOR HELPERS  (대시보드에서 사용하는 파생값 계산)
══════════════════════════════════════════════════════════ */

/** 공정성 요약 6개 카드 데이터 계산 */
export function selectFairnessSummary(issues: FairnessIssue[]) {
  const categories: Array<{
    label: string;
    category: FairnessIssueCategory;
    description: string;
    unit: string;
  }> = [
    { label: "근태 신청 미반영 편중", category: "근태 신청 미반영",  description: "특정 직원에게 신청 미반영이 반복되고 있습니다.",                   unit: "명" },
    { label: "주말/공휴 휴무 편중",   category: "주말/공휴 편중",    description: "주말/공휴일 휴무 배정이 일부 직원에게 치우쳐 있습니다.",            unit: "명" },
    { label: "고강도 근무 편중",      category: "고강도 근무",       description: "5일 이상 연속근무 또는 A13→M07 패턴이 반복되었습니다.",             unit: "명" },
    { label: "야간조 편중",           category: "야간조 편중",       description: "특정 직원에게 야간조 배정이 반복되고 있습니다.",                   unit: "명" },
    { label: "회복 반영 예외",        category: "회복 반영 예외",    description: "전월 근무강도 회복 대상자가 충분히 완화되지 않았습니다.",           unit: "명" },
    { label: "계획 대비 실제 편차",   category: "계획 대비 실제 편차",description: "연간 야간조 계획과 실제 월별 근무표 사이에 차이가 있습니다.",        unit: "건" },
  ];

  return categories.map((cat) => {
    const catIssues = issues.filter((i) => i.category === cat.category);
    const hasCritical = catIssues.some((i) => i.severity === "위험");
    const severity: FairnessSeverity =
      catIssues.length === 0 ? "양호" : hasCritical ? "위험" : "검토";
    return {
      ...cat,
      value: catIssues.length,
      severity,
    };
  });
}

/** 운영 경고 위험 건수 계산 */
export function selectRiskWarningCount(warnings: ScheduleWarning[]): number {
  return warnings.filter((w) => w.severity === "risk").length;
}
