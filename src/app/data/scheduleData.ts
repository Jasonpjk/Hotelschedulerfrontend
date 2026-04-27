/* ═══════════════════════════════════════════════════════════════════
   SHARED SCHEDULE DATA
   월별 근무표와 보호 일정 선택 모달이 공동 사용하는 단일 데이터 소스
════════════════════════════════════════════════════════════════════ */

// ── 타입 ────────────────────────────────────────────────────────────
export type ShiftCode =
  | "M07" | "A13" | "N22"
  | "C08" | "C09" | "C10" | "C11"
  | "REQ" | "OFF" | "HOL" | "VAC" | "SL"
  | "EDU" | "SICK";

export type RoleKey = "인차지" | "담당";
export type GradeKey = "L4" | "L3" | "L2-A" | "L2-C" | "L1-A" | "L1-C" | "L1-D" | "엘크루" | "주니어";
export type PrimaryShiftKey = "오전조" | "오후조" | "야간조";

export interface Emp {
  id: string;
  name: string;
  role: RoleKey;
  grade: GradeKey;
  primaryShift: PrimaryShiftKey;
  years: string;
  init: string;
}

// ── 근무 코드 메타 (색상·이름 — SchedulePage 기준으로 통일) ───────────
export const SHIFT: Record<ShiftCode, { bg: string; text: string; border: string; time: string; name: string }> = {
  M07:  { bg: "#EAF2FB", text: "#1B5990", border: "#B5D0EE", time: "07:00", name: "오전조" },
  A13:  { bg: "#EAF4EE", text: "#1B6638", border: "#8FCAA8", time: "13:00", name: "오후조" },
  N22:  { bg: "#EEEAF5", text: "#4A3785", border: "#C0ACDF", time: "22:00", name: "야간조" },
  C08:  { bg: "#FBF2E6", text: "#7A5518", border: "#DEC07E", time: "08:00", name: "중간조" },
  C09:  { bg: "#FBF2E6", text: "#7A5518", border: "#DEC07E", time: "09:00", name: "중간조" },
  C10:  { bg: "#FBF4E8", text: "#7A5518", border: "#E0C48A", time: "10:00", name: "중간조" },
  C11:  { bg: "#FBF4E8", text: "#7A5518", border: "#E0C48A", time: "11:00", name: "중간조" },
  REQ:  { bg: "#FDE7F0", text: "#8B1A4A", border: "#EEA0BF", time: "",      name: "신청 휴일" },
  OFF:  { bg: "#F0F2F4", text: "#5E6673", border: "#CDD2D8", time: "",      name: "일반 휴무" },
  HOL:  { bg: "#FDF2DC", text: "#7A5800", border: "#E6C04A", time: "",      name: "공휴일" },
  VAC:  { bg: "#E6F4EF", text: "#18664A", border: "#88CCAE", time: "",      name: "휴가" },
  SL:   { bg: "#F0E8F5", text: "#662288", border: "#C8A0E2", time: "",      name: "여성보건휴가" },
  EDU:  { bg: "#EBF3FA", text: "#1A5C8C", border: "#9EC8E8", time: "",      name: "교육" },
  SICK: { bg: "#FCEAEA", text: "#8B1A1A", border: "#E8ADAD", time: "",      name: "병가" },
};

export const WORK_CODES: ShiftCode[] = ["M07", "A13", "N22", "C08", "C09", "C10", "C11"];
export const REST_CODES: ShiftCode[] = ["REQ", "OFF", "HOL", "VAC", "SL", "EDU", "SICK"];

// ── 직급·조 우선순위 ───────────────────────────────────────────────
export const GRADE_ORDER: Record<GradeKey, number> = {
  "L4": 0, "L3": 1, "L2-A": 2, "L2-C": 3,
  "L1-A": 4, "L1-C": 5, "L1-D": 6, "엘크루": 7, "주니어": 8,
};

export const SHIFT_ORDER: Record<PrimaryShiftKey, number> = {
  "오전조": 0, "오후조": 1, "야간조": 2,
};

export const ROLE_BADGE: Record<RoleKey, { bg: string; text: string }> = {
  "인차지": { bg: "rgba(185,155,90,0.12)", text: "#7A5518" },
  "담당":   { bg: "#F0F2F4",               text: "#5E6673" },
};

export const SHIFT_GROUP_COLORS: Record<PrimaryShiftKey, { bg: string; text: string; border: string }> = {
  "오전조": { bg: "#EAF2FB", text: "#1B5990", border: "#B5D0EE" },
  "오후조": { bg: "#EAF4EE", text: "#1B6638", border: "#8FCAA8" },
  "야간조": { bg: "#EEEAF5", text: "#4A3785", border: "#C0ACDF" },
};

// ── 직원 목록 (10명, 조별→직급별 정렬) ─────────────────────────────
const EMPLOYEES_RAW: Emp[] = [
  { id: "e1",  name: "박지현", role: "인차지", grade: "L3",    primaryShift: "오전조", years: "7년",   init: "박" },
  { id: "e2",  name: "김태훈", role: "담당",   grade: "L2-A",  primaryShift: "오전조", years: "5년",   init: "김" },
  { id: "e3",  name: "이수진", role: "담당",   grade: "L2-C",  primaryShift: "오후조", years: "4년",   init: "이" },
  { id: "e4",  name: "최민준", role: "담당",   grade: "L1-C",  primaryShift: "오전조", years: "3년",   init: "최" },
  { id: "e5",  name: "정예은", role: "담당",   grade: "L1-D",  primaryShift: "오후조", years: "2년",   init: "정" },
  { id: "e6",  name: "한도현", role: "담당",   grade: "L1-C",  primaryShift: "오후조", years: "3년",   init: "한" },
  { id: "e7",  name: "오세영", role: "담당",   grade: "엘크루", primaryShift: "오전조", years: "1년",   init: "오" },
  { id: "e8",  name: "강미래", role: "담당",   grade: "L1-D",  primaryShift: "오후조", years: "1년",   init: "강" },
  { id: "e9",  name: "윤재호", role: "담당",   grade: "주니어", primaryShift: "오전조", years: "6개월", init: "윤" },
  { id: "e10", name: "서하늘", role: "담당",   grade: "L2-C",  primaryShift: "야간조", years: "2년",   init: "서" },
];

export const EMPLOYEES: Emp[] = [...EMPLOYEES_RAW].sort((a, b) => {
  if (SHIFT_ORDER[a.primaryShift] !== SHIFT_ORDER[b.primaryShift])
    return SHIFT_ORDER[a.primaryShift] - SHIFT_ORDER[b.primaryShift];
  return GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade];
});

// 이름 → empId 매핑 (전 직원 포함)
export const NAME_TO_ID: Record<string, string> = {};
EMPLOYEES.forEach(e => { NAME_TO_ID[e.name] = e.id; });

// ── 31일 스케줄 데이터 (월별 근무표 기준) ──────────────────────────
export const SCHEDULE_DATA: Record<string, ShiftCode[]> = {
  e1:  ["M07","M07","M07","A13","M07","M07","OFF","OFF","M07","M07","A13","M07","M07","OFF","OFF","M07","M07","A13","M07","OFF","OFF","M07","M07","A13","M07","M07","OFF","OFF","M07","M07","A13"],
  e2:  ["A13","A13","M07","M07","A13","OFF","A13","OFF","A13","M07","M07","A13","OFF","A13","OFF","A13","M07","C10","A13","A13","OFF","OFF","A13","M07","A13","OFF","A13","A13","OFF","A13","M07"],
  e3:  ["A13","OFF","A13","N22","N22","A13","A13","OFF","N22","A13","A13","OFF","A13","N22","OFF","OFF","A13","N22","A13","A13","N22","OFF","OFF","A13","N22","A13","A13","OFF","N22","OFF","A13"],
  e4:  ["M07","C09","M07","M07","C10","M07","OFF","C09","M07","C10","M07","M07","OFF","OFF","C09","M07","M07","C10","M07","OFF","OFF","C09","M07","M07","C10","OFF","M07","OFF","C09","M07","M07"],
  e5:  ["OFF","A13","A13","OFF","A13","A13","REQ","OFF","A13","A13","OFF","A13","A13","OFF","A13","A13","OFF","A13","OFF","A13","A13","OFF","A13","A13","OFF","A13","A13","OFF","OFF","A13","A13"],
  e6:  ["C08","C08","C09","A13","OFF","A13","C10","OFF","C08","A13","A13","C10","OFF","A13","OFF","C08","A13","A13","C11","OFF","A13","OFF","C08","A13","OFF","A13","A13","C10","OFF","C08","A13"],
  e7:  ["OFF","M07","C09","M07","M07","OFF","OFF","M07","M07","C10","M07","OFF","M07","OFF","M07","M07","C09","M07","M07","OFF","OFF","M07","M07","C10","M07","OFF","M07","OFF","M07","M07","C09"],
  e8:  ["A13","OFF","A13","A13","OFF","A13","A13","OFF","OFF","A13","A13","OFF","A13","A13","REQ","OFF","A13","A13","OFF","A13","OFF","A13","OFF","A13","A13","OFF","A13","A13","OFF","OFF","A13"],
  e9:  ["OFF","M07","M07","M07","OFF","M07","OFF","OFF","M07","M07","M07","OFF","M07","OFF","OFF","M07","M07","M07","OFF","M07","OFF","OFF","M07","M07","M07","OFF","M07","OFF","OFF","M07","M07"],
  e10: ["N22","N22","OFF","N22","A13","OFF","N22","OFF","N22","OFF","N22","A13","OFF","N22","OFF","N22","OFF","N22","A13","OFF","N22","OFF","N22","OFF","N22","A13","VAC","N22","OFF","N22","OFF"],
};

// ── 달력 설정 (월별 파라미터화) ────────────────────────────────────
export interface CalConfig {
  totalDays: number;
  /** 1-based day → DOW index (0=일,1=월,...,6=토) */
  getDow: (day: number) => number;
  holidays: number[];
  holidayNames: Record<number, string>;
  todayDay: number;      // 0 = 해당 없음
  monthLabel: string;    // 예: "2026년 3월"
  versionLabel: string;  // 예: "v3.1"
}

/** 2026년 3월 달력 설정 — 3월 1일(일) */
export const MAR_2026_CAL: CalConfig = {
  totalDays: 31,
  getDow: (d) => (d - 1) % 7,
  holidays: [1],
  holidayNames: { 1: "삼일절" },
  todayDay: 8,
  monthLabel: "2026년 3월",
  versionLabel: "v3.1",
};

/** 2026년 5월 달력 설정 — 5월 1일(금) */
export const MAY_2026_CAL: CalConfig = {
  totalDays: 31,
  getDow: (d) => (d - 1 + 5) % 7,
  holidays: [1, 5],
  holidayNames: { 1: "근로자의날", 5: "어린이날" },
  todayDay: 0,
  monthLabel: "2026년 5월",
  versionLabel: "v5.1",
};
