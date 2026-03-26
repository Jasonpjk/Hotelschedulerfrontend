import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import ScheduleAdjustModal from "../components/ScheduleAdjustModal";
import { useLang } from "../context/LangContext";
import { DT } from "../i18n";

/* ══════════════════════════════════════════════════════════
   COLOR TOKENS
══════════════════════════════════════════════════════════ */
const C = {
  navy:        "#0D1B2A",
  navyDeep:    "#091523",
  navyActive:  "#1E3550",
  gold:        "#B99B5A",
  goldDim:     "rgba(185,155,90,0.55)",
  goldBg:      "rgba(185,155,90,0.08)",
  bg:          "#F2EFE9",
  white:       "#FFFFFF",
  border:      "#E4DED4",
  borderLight: "#EDE8E0",
  muted:       "#7B8390",
  charcoal:    "#2E3642",
  text:        "#1C2430",
  risk:        "#B83232",
  riskBg:      "rgba(184,50,50,0.06)",
  riskBorder:  "rgba(184,50,50,0.25)",
  ok:          "#2E7D52",
  okBg:        "rgba(46,125,82,0.08)",
  warning:     "#B87C1A",
  warnBg:      "rgba(184,124,26,0.09)",
  sunBg:       "#FFF4F4",
  satBg:       "#F4F7FD",
  holBg:       "#FEF8ED",
  todayBg:     "#FFFCF2",
  rowAlt:      "#FAFAF8",
};

/* ═════════════════════════════════════════════════════════
   CALENDAR HELPERS
══════════════════════════════════════════════════════════ */
const MARCH_DAYS   = 31;
const TODAY_DAY    = 8;
const HOLIDAYS     = [1];   // 삼일절
const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];

const getDow    = (d: number) => (d - 1) % 7;
const isSun     = (d: number) => getDow(d) === 0;
const isSat     = (d: number) => getDow(d) === 6;
const isHoliday = (d: number) => HOLIDAYS.includes(d);
const isToday   = (d: number) => d === TODAY_DAY;

function dayTextColor(d: number): string {
  if (isHoliday(d) || isSun(d)) return C.risk;
  if (isSat(d)) return "#2B5EA0";
  return C.charcoal;
}

function colBg(d: number, rowAlt: boolean): string {
  if (isHoliday(d)) return C.holBg;
  if (isSun(d))     return C.sunBg;
  if (isSat(d))     return C.satBg;
  if (isToday(d))   return C.todayBg;
  return rowAlt ? C.rowAlt : C.white;
}

/* ══════════════════════════════════════════════════════════
   TYPE DEFINITIONS
══════════════════════════════════════════════════════════ */
type ShiftCode =
  | "M07" | "A13" | "N22"
  | "C08" | "C09" | "C10" | "C11"
  | "REQ" | "OFF" | "HOL" | "VAC" | "SL";

interface AiAdjustmentHistory {
  timestamp: string;
  command: string;
  status: "적용 완료" | "일부 반영" | "검토 필요";
}

interface Version {
  id: string;
  name: string;
  isFinalized: boolean;
}

interface MonthData {
  versions: Version[];
  history: AiAdjustmentHistory[];
}

const SHIFT: Record<ShiftCode, { bg: string; text: string; border: string; time: string; name: string }> = {
  M07: { bg: "#EAF2FB", text: "#1B5990", border: "#B5D0EE", time: "07:00", name: "오전조" },
  A13: { bg: "#EAF4EE", text: "#1B6638", border: "#8FCAA8", time: "13:00", name: "오후조" },
  N22: { bg: "#EEEAF5", text: "#4A3785", border: "#C0ACDF", time: "22:00", name: "야간조" },
  C08: { bg: "#FBF2E6", text: "#7A5518", border: "#DEC07E", time: "08:00", name: "중간조" },
  C09: { bg: "#FBF2E6", text: "#7A5518", border: "#DEC07E", time: "09:00", name: "중간조" },
  C10: { bg: "#FBF4E8", text: "#7A5518", border: "#E0C48A", time: "10:00", name: "중간조" },
  C11: { bg: "#FBF4E8", text: "#7A5518", border: "#E0C48A", time: "11:00", name: "중간조" },
  REQ: { bg: "#FDE7F0", text: "#8B1A4A", border: "#EEA0BF", time: "",      name: "신청 휴일" },
  OFF: { bg: "#F0F2F4", text: "#5E6673", border: "#CDD2D8", time: "",      name: "일반 휴무" },
  HOL: { bg: "#FDF2DC", text: "#7A5800", border: "#E6C04A", time: "",      name: "공휴일" },
  VAC: { bg: "#E6F4EF", text: "#18664A", border: "#88CCAE", time: "",      name: "휴가" },
  SL:  { bg: "#F0E8F5", text: "#662288", border: "#C8A0E2", time: "",      name: "여성보건휴가" },
};

const WORK_CODES: ShiftCode[] = ["M07", "A13", "N22", "C08", "C09", "C10", "C11"];
const REST_CODES: ShiftCode[] = ["REQ", "OFF", "HOL", "VAC", "SL"];

/** 범례용 칩 — 고정 너비로 통일 */
function LegendChip({ code }: { code: ShiftCode }) {
  const s = SHIFT[code];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 36, height: 18, flexShrink: 0,
      backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: 3, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.02em",
      fontFamily: "'Inter', sans-serif",
    }}>
      {code}
    </span>
  );
}

/** 셀용 배�� */
function ShiftBadge({ code, zoom = 1 }: { code: ShiftCode; zoom?: number }) {
  const s = SHIFT[code];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      height: 16 * zoom, minWidth: 34 * zoom, padding: `0 ${4 * zoom}px`,
      backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: 3, fontSize: 9.5 * zoom, fontWeight: 600, letterSpacing: "0.02em",
      fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap",
    }}>
      {code}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   EMPLOYEE & SCHEDULE DATA
══════════════════════════════════════════════════════════ */
type RoleKey = "인차지 매니저" | "선임" | "담당" | "인턴";
interface Emp { id: string; name: string; role: RoleKey; years: string; init: string; }

const EMPLOYEES: Emp[] = [
  { id: "e1",  name: "박지현", role: "인차지 매니저", years: "7년",   init: "박" },
  { id: "e2",  name: "김태훈", role: "선임",         years: "5년",   init: "김" },
  { id: "e3",  name: "이수진", role: "선임",         years: "4년",   init: "이" },
  { id: "e4",  name: "최민준", role: "담당",         years: "3년",   init: "최" },
  { id: "e5",  name: "정예은", role: "담당",         years: "2년",   init: "정" },
  { id: "e6",  name: "한도현", role: "담당",         years: "3년",   init: "한" },
  { id: "e7",  name: "오세영", role: "담당",         years: "1년",   init: "오" },
  { id: "e8",  name: "강미래", role: "담당",         years: "1년",   init: "강" },
  { id: "e9",  name: "윤재호", role: "인턴",         years: "6개월", init: "윤" },
  { id: "e10", name: "서하늘", role: "담당",         years: "2년",   init: "서" },
];

const ROLE_BADGE: Record<RoleKey, { bg: string; text: string }> = {
  "인차지 매니저": { bg: "rgba(185,155,90,0.12)", text: "#7A5518" },
  "선임":          { bg: "#E8EEF6",               text: "#2B5EA0" },
  "담당":          { bg: "#F0F2F4",               text: "#5E6673" },
  "인턴":          { bg: "#F0E8F5",               text: "#662288" },
};

const INITIAL_SCHEDULE: Record<string, ShiftCode[]> = {
  e1:  ["HOL","M07","M07","A13","M07","M07","OFF","OFF","M07","M07","A13","M07","M07","OFF","OFF","M07","M07","A13","M07","OFF","OFF","M07","M07","A13","M07","M07","OFF","OFF","M07","M07","A13"],
  e2:  ["HOL","A13","M07","M07","A13","OFF","A13","OFF","A13","M07","M07","A13","OFF","A13","OFF","A13","M07","C10","A13","A13","OFF","OFF","A13","M07","A13","OFF","A13","A13","OFF","A13","M07"],
  e3:  ["HOL","OFF","A13","N22","N22","A13","A13","OFF","N22","A13","A13","OFF","A13","N22","OFF","OFF","A13","N22","A13","A13","N22","OFF","OFF","A13","N22","A13","A13","OFF","N22","OFF","A13"],
  e4:  ["HOL","C09","M07","M07","C10","M07","OFF","C09","M07","C10","M07","M07","OFF","OFF","C09","M07","M07","C10","M07","OFF","OFF","C09","M07","M07","C10","OFF","M07","OFF","C09","M07","M07"],
  e5:  ["HOL","A13","A13","OFF","A13","A13","REQ","OFF","A13","A13","OFF","A13","A13","OFF","A13","A13","OFF","A13","OFF","A13","A13","OFF","A13","A13","OFF","A13","A13","OFF","OFF","A13","A13"],
  e6:  ["HOL","C08","C09","A13","OFF","A13","C10","OFF","C08","A13","A13","C10","OFF","A13","OFF","C08","A13","A13","C11","OFF","A13","OFF","C08","A13","OFF","A13","A13","C10","OFF","C08","A13"],
  e7:  ["HOL","M07","C09","M07","M07","OFF","OFF","M07","M07","C10","M07","OFF","M07","OFF","M07","M07","C09","M07","M07","OFF","OFF","M07","M07","C10","M07","OFF","M07","OFF","M07","M07","C09"],
  e8:  ["HOL","OFF","A13","A13","OFF","A13","A13","OFF","OFF","A13","A13","OFF","A13","A13","REQ","OFF","A13","A13","OFF","A13","OFF","A13","OFF","A13","A13","OFF","A13","A13","OFF","OFF","A13"],
  e9:  ["HOL","M07","M07","M07","OFF","M07","OFF","OFF","M07","M07","M07","OFF","M07","OFF","OFF","M07","M07","M07","OFF","M07","OFF","OFF","M07","M07","M07","OFF","M07","OFF","OFF","M07","M07"],
  e10: ["HOL","N22","OFF","N22","A13","OFF","N22","OFF","N22","OFF","N22","A13","OFF","N22","OFF","N22","OFF","N22","A13","OFF","N22","OFF","N22","OFF","N22","A13","VAC","N22","OFF","N22","OFF"],
};

function dailyCount(schedule: Record<string, ShiftCode[]>, day: number) {
  return EMPLOYEES.filter(e => WORK_CODES.includes(schedule[e.id][day - 1])).length;
}

/* ── 공정성 계산 헬퍼 ─────────────────────────── */
function calcIntervalWarn(codes: ShiftCode[]): number {
  let count = 0;
  for (let i = 0; i < codes.length - 1; i++) {
    if (codes[i] === "A13" && codes[i + 1] === "M07") count++;
  }
  return count;
}

function calcRolling14Rest(codes: ShiftCode[]): number {
  return codes.slice(0, 14).filter(c => REST_CODES.includes(c)).length;
}

/* ══════════════════════════════════════════════════════════
   SCHEDULE GRID — 줌 지원
══════════════════════════════════════════════════════════ */
function ScheduleGrid({ 
  schedule, 
  onCellClick, 
  zoom,
  isVersionLocked
}: { 
  schedule: Record<string, ShiftCode[]>; 
  onCellClick: (empId: string, day: number) => void; 
  zoom: number;
  isVersionLocked: boolean;
}) {
  const EMP_W    = 196 * zoom;
  const CELL_W   = 46 * zoom;
  const ROW_H    = 42 * zoom;
  const HEADER_H = 56 * zoom;

  return (
    <div style={{ flex: 1, overflow: "auto", minWidth: 0, minHeight: 0 }}>
      <table style={{
        borderCollapse: "collapse",
        tableLayout: "fixed",
        minWidth: EMP_W + MARCH_DAYS * CELL_W,
      }}>
        <colgroup>
          <col style={{ width: EMP_W }} />
          {Array.from({ length: MARCH_DAYS }, (_, i) => <col key={i} style={{ width: CELL_W }} />)}
        </colgroup>

        <thead>
          <tr>
            {/* 직원 정보 헤더 */}
            <th style={{
              position: "sticky", left: 0, top: 0, zIndex: 4,
              height: HEADER_H,
              backgroundColor: C.white,
              borderBottom: `2px solid ${C.border}`,
              borderRight: `1px solid ${C.border}`,
              padding: `0 ${14 * zoom}px`, textAlign: "left", verticalAlign: "middle",
            }}>
              <div style={{ fontSize: 9 * zoom, fontWeight: 600, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>직원 정보</div>
              <div style={{ fontSize: 8.5 * zoom, color: C.goldDim, marginTop: 2 * zoom }}>2026년 3월 · v3.1</div>
            </th>

            {/* 날짜 헤더 — 모두 동일 높이 */}
            {Array.from({ length: MARCH_DAYS }, (_, i) => {
              const day    = i + 1;
              const today  = isToday(day);
              const hol    = isHoliday(day);
              const sun    = isSun(day);
              const sat    = isSat(day);

              let thBg = C.white;
              if (hol) thBg = C.holBg;
              else if (sun) thBg = C.sunBg;
              else if (sat) thBg = C.satBg;
              else if (today) thBg = C.todayBg;

              return (
                <th key={day} style={{
                  position: "sticky", top: 0, zIndex: 2,
                  height: HEADER_H,
                  backgroundColor: thBg,
                  borderBottom: today ? `2px solid ${C.gold}` : `2px solid ${C.border}`,
                  borderRight: `1px solid ${C.borderLight}`,
                  textAlign: "center", verticalAlign: "middle",
                  padding: 0,
                }}>
                  {/* 날짜 숫자 */}
                  <div style={{
                    fontSize: 13 * zoom, fontWeight: today ? 700 : 500,
                    color: today ? C.gold : dayTextColor(day),
                    lineHeight: 1,
                  }}>
                    {day}
                  </div>
                  {/* 요일 */}
                  <div style={{
                    fontSize: 9 * zoom, marginTop: 3 * zoom,
                    color: dayTextColor(day), opacity: 0.75,
                    lineHeight: 1,
                  }}>
                    {DOW_KO[getDow(day)]}
                  </div>
                  {/* 부가 정보 — 높이 고정 영역 */}
                  <div style={{ height: 12 * zoom, marginTop: 2 * zoom, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {hol && (
                      <span style={{ fontSize: 6.5 * zoom, color: "#7A5800", fontWeight: 600, letterSpacing: "-0.01em" }}>삼일절</span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {EMPLOYEES.map((emp, ri) => {
            const alt = ri % 2 === 1;
            const rb  = ROLE_BADGE[emp.role];
            return (
              <tr key={emp.id} style={{ height: ROW_H }}>
                <td style={{
                  position: "sticky", left: 0, zIndex: 1,
                  backgroundColor: alt ? C.rowAlt : C.white,
                  borderBottom: `1px solid ${C.borderLight}`,
                  borderRight: `1px solid ${C.border}`,
                  padding: `0 ${12 * zoom}px`, verticalAlign: "middle",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 * zoom }}>
                    <div style={{
                      width: 26 * zoom, height: 26 * zoom, borderRadius: "50%", flexShrink: 0,
                      backgroundColor: C.navyDeep,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 10 * zoom, color: C.gold, fontWeight: 600 }}>{emp.init}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12 * zoom, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>{emp.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 * zoom, marginTop: 2 * zoom }}>
                        <span style={{
                          fontSize: 9 * zoom, fontWeight: 600,
                          backgroundColor: rb.bg, color: rb.text,
                          borderRadius: 2, padding: `${1 * zoom}px ${5 * zoom}px`, whiteSpace: "nowrap",
                        }}>{emp.role}</span>
                        <span style={{ fontSize: 9.5 * zoom, color: C.muted, whiteSpace: "nowrap" }}>{emp.years}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {schedule[emp.id].map((code, ci) => {
                  const day    = ci + 1;
                  const cellLocked = isVersionLocked;
                  const bg     = colBg(day, alt);
                  return (
                    <td
                      key={day}
                      onClick={() => !cellLocked && onCellClick(emp.id, day)}
                      title={cellLocked ? "확정된 버전은 수정할 수 없습니다" : `${emp.name} · 3월 ${day}일 · ${SHIFT[code].name} (${code})`}
                      style={{
                        backgroundColor: bg,
                        borderBottom: `1px solid ${C.borderLight}`,
                        borderRight: `1px solid ${C.borderLight}`,
                        borderLeft: isToday(day) ? `1.5px solid ${C.gold}` : undefined,
                        textAlign: "center", verticalAlign: "middle",
                        cursor: cellLocked ? "default" : "pointer",
                        padding: 3 * zoom, opacity: cellLocked ? 0.7 : 1,
                        position: "relative", transition: "background-color 0.1s",
                      }}
                      onMouseEnter={(e) => { if (!cellLocked) (e.currentTarget as HTMLElement).style.backgroundColor = C.goldBg; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = bg; }}
                    >
                      <ShiftBadge code={code} zoom={zoom} />
                    </td>
                  );
                })}
              </tr>
            );
          })}

          {/* 일일 근무 인원 집계 */}
          <tr style={{ height: 30 * zoom }}>
            <td style={{
              position: "sticky", left: 0, zIndex: 1,
              backgroundColor: "#F4F1EB",
              borderTop: `2px solid ${C.border}`,
              borderRight: `1px solid ${C.border}`,
              padding: `0 ${12 * zoom}px`, verticalAlign: "middle",
            }}>
              <span style={{ fontSize: 9.5 * zoom, fontWeight: 600, color: C.muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                일일 근무 인원
              </span>
            </td>
            {Array.from({ length: MARCH_DAYS }, (_, i) => {
              const day   = i + 1;
              const count = dailyCount(schedule, day);
              const low   = count <= 3;
              let bg = "#F4F1EB";
              if (isHoliday(day)) bg = "#FAF2DC";
              else if (isSun(day)) bg = "#F9EEEE";
              else if (isSat(day)) bg = "#EDF0F8";
              return (
                <td key={day} style={{
                  backgroundColor: bg,
                  borderTop: `2px solid ${C.border}`,
                  borderRight: `1px solid ${C.borderLight}`,
                  textAlign: "center", verticalAlign: "middle",
                }}>
                  <span style={{
                    fontSize: 11 * zoom, fontWeight: 700,
                    color: low ? C.risk : C.charcoal,
                    fontFamily: "'Inter', sans-serif",
                  }}>{count}</span>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function SchedulePage() {
  const t = DT[useLang()];
  
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [aiInput, setAiInput] = useState("");
  const [zoom, setZoom] = useState(1.0);
  
  // 월별 데이터 구조
  const [monthDataMap, setMonthDataMap] = useState<Record<string, MonthData>>({
    "2026-03": {
      versions: [
        { id: "v3.0", name: "v3.0", isFinalized: true },
        { id: "v3.1", name: "v3.1", isFinalized: false },
      ],
      history: [
        {
          timestamp: "2026-03-08T10:30:00",
          command: "박지현 3월 15일 OFF로 변경",
          status: "적용 완료",
        },
        {
          timestamp: "2026-03-07T14:22:00",
          command: "이수진 야간조 연속 배정 금지",
          status: "일부 반영",
        },
        {
          timestamp: "2026-03-06T16:45:00",
          command: "3월 주말 최소 인원 5명 유지",
          status: "적용 완료",
        },
      ],
    },
    "2026-04": {
      versions: [
        { id: "v4.0", name: "v4.0", isFinalized: false },
      ],
      history: [
        {
          timestamp: "2026-03-25T11:15:00",
          command: "4월 첫 주 오전조 인원 강화",
          status: "적용 완료",
        },
        {
          timestamp: "2026-03-20T09:30:00",
          command: "공휴일 최소 인원 6명 확보",
          status: "검토 필요",
        },
      ],
    },
  });
  
  // 현재 선택 월
  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const currentMonthData = monthDataMap[selectedMonth];
  
  // 현재 월의 버전 목록
  const versions = currentMonthData.versions;
  const [currentVersionId, setCurrentVersionId] = useState(versions[versions.length - 1].id);
  const currentVersion = versions.find(v => v.id === currentVersionId);
  
  // 현재 월의 변경 이력
  const aiHistory = currentMonthData.history;
  
  // 월 변경 핸들러
  function handleMonthChange(newMonth: string) {
    setSelectedMonth(newMonth);
    // 새로운 월의 마지막 버전으로 자동 전환
    const newMonthVersions = monthDataMap[newMonth].versions;
    setCurrentVersionId(newMonthVersions[newMonthVersions.length - 1].id);
  }
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedCode, setSelectedCode] = useState<ShiftCode | null>(null);
  
  // 다운로드 모달
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  
  // 변경 이력 모달
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  
  // 범례/경고 접기/펼치기
  const [legendExpanded, setLegendExpanded] = useState(false);

  function handleCellClick(empId: string, day: number) {
    // 확정된 버전은 편집 불가
    if (currentVersion?.isFinalized) {
      return;
    }
    
    setSelectedEmpId(empId);
    setSelectedDay(day);
    setSelectedCode(schedule[empId][day - 1]);
    setModalOpen(true);
  }

  function handleApplyChange(newCode: ShiftCode) {
    if (selectedEmpId && selectedDay) {
      setSchedule(prev => {
        const updated = { ...prev };
        updated[selectedEmpId] = [...updated[selectedEmpId]];
        updated[selectedEmpId][selectedDay - 1] = newCode;
        return updated;
      });
      setModalOpen(false);
    }
  }
  
  // 확정 처리
  function handleFinalize() {
    // 실제로는 monthDataMap 업데이트 필요
    alert("버전이 확정되었습니다.");
  }
  
  // 편집 재개 (확정 해제)
  function handleResumeEditing() {
    // 실제로는 monthDataMap 업데이트 필요
    alert("편집이 재개되었습니다.");
  }
  
  // 새 버전 생성
  function handleCreateNewVersion() {
    // 월 번호 추출 (예: "2026-03" → 3)
    const monthNum = parseInt(selectedMonth.split("-")[1]);
    const nextVersionNum = versions.length;
    const newVersionId = `v${monthNum}.${nextVersionNum}`;
    
    alert(`새 버전 ${newVersionId}이(가) 생성되었습니다.`);
    
    // 실제로는 monthDataMap 업데이트 필요
  }
  
  // AI 자연어 조정 적용
  function handleApplyAiAdjustment() {
    if (!aiInput.trim()) return;
    
    // 새로운 이력 추가
    const newHistory: AiAdjustmentHistory = {
      timestamp: new Date().toLocaleString('ko-KR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      command: aiInput,
      status: "적용 완료", // 실제로는 AI 응답 결과에 따라 동적으로 설정
    };
    
    // monthDataMap 업데이트
    setMonthDataMap(prev => ({
      ...prev,
      [selectedMonth]: {
        ...prev[selectedMonth],
        history: [...prev[selectedMonth].history, newHistory],
      },
    }));
    
    // 피드백 표시
    alert(`AI 조정이 적용되었습니다: ${aiInput}`);
    setAiInput("");
  }

  const intervalTotal = EMPLOYEES.reduce((a, e) => a + calcIntervalWarn(schedule[e.id]), 0);
  const rolling14Issue = EMPLOYEES.filter(e => calcRolling14Rest(schedule[e.id]) < 4).length;

  const selectedEmp = selectedEmpId ? EMPLOYEES.find(e => e.id === selectedEmpId) : null;
  
  // 월 표시명 (예: "2026년 3월")
  const monthLabel = selectedMonth === "2026-03" ? "2026년 3월" : "2026년 4월";

  return (
    <AppLayout>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: C.bg }}>

        {/* ── 상단 액션 바 ───────────────────────────────────── */}
        <div style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.border}`,
          padding: "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* 월 선택 */}
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              style={{
                border: `1px solid ${C.border}`, borderRadius: 3,
                padding: "7px 12px", fontSize: 12, color: C.navy, fontWeight: 500,
                backgroundColor: C.white, cursor: "pointer", outline: "none",
              }}
            >
              <option value="2026-03">2026년 3월</option>
              <option value="2026-04">2026년 4월</option>
            </select>

            {/* 버전 선택 */}
            <select 
              value={currentVersionId}
              onChange={(e) => setCurrentVersionId(e.target.value)}
              style={{
                border: `1px solid ${C.border}`, borderRadius: 3,
                padding: "7px 12px", fontSize: 12, color: C.charcoal,
                backgroundColor: C.white, cursor: "pointer", outline: "none",
              }}
            >
              {versions.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>

            {/* 상태 배지 */}
            {currentVersion && (
              <span style={{
                backgroundColor: currentVersion.isFinalized ? C.okBg : C.warnBg,
                color: currentVersion.isFinalized ? C.ok : C.warning,
                border: `1px solid ${currentVersion.isFinalized ? C.okBorder : "rgba(184,124,26,0.25)"}`,
                borderRadius: 3, padding: "4px 10px", fontSize: 10, fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                {currentVersion.isFinalized ? "확정" : "작업 중"}
              </span>
            )}
            
            {/* 확정된 버전 안내 */}
            {currentVersion?.isFinalized && (
              <span style={{
                fontSize: 10,
                color: C.muted,
                marginLeft: 8,
              }}>
                이 버전은 확정되어 수정할 수 없습니다
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* 확대/축소 버튼 */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 6 }}>
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.05))}
                style={{
                  border: `1px solid ${C.border}`,
                  backgroundColor: C.white,
                  color: C.charcoal,
                  borderRadius: 3, padding: "6px 11px", fontSize: 11, fontWeight: 500,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                축소
              </button>
              <button
                onClick={() => setZoom(Math.min(2.0, zoom + 0.05))}
                style={{
                  border: `1px solid ${C.border}`,
                  backgroundColor: C.white,
                  color: C.charcoal,
                  borderRadius: 3, padding: "6px 11px", fontSize: 11, fontWeight: 500,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                확대
              </button>
              <button
                onClick={() => setZoom(1.0)}
                style={{
                  border: `1px solid ${C.border}`,
                  backgroundColor: C.white,
                  color: C.charcoal,
                  borderRadius: 3, padding: "6px 11px", fontSize: 11, fontWeight: 500,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                초기화
              </button>
            </div>

            <div style={{ width: 1, height: 20, backgroundColor: C.border }} />

            {/* 액션 버튼 */}
            <button 
              onClick={() => setHistoryModalOpen(true)}
              style={{
                border: `1px solid ${C.border}`, borderRadius: 3,
                padding: "7px 14px", fontSize: 12, fontWeight: 500, color: C.charcoal,
                backgroundColor: C.white, cursor: "pointer",
                position: "relative",
              }}
            >
              변경 이력
              {aiHistory.length > 0 && (
                <span style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  backgroundColor: C.navy,
                  color: C.white,
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 700,
                }}>{aiHistory.length}</span>
              )}
            </button>
            <button 
              onClick={handleCreateNewVersion}
              style={{
                border: `1px solid ${C.border}`, borderRadius: 3,
                padding: "7px 14px", fontSize: 12, fontWeight: 500, color: C.charcoal,
                backgroundColor: C.white, cursor: "pointer",
              }}
            >
              새 버전 생성
            </button>
            <button 
              onClick={() => setDownloadModalOpen(true)}
              style={{
                border: `1px solid ${C.border}`, borderRadius: 3,
                padding: "7px 14px", fontSize: 12, fontWeight: 500, color: C.charcoal,
                backgroundColor: C.white, cursor: "pointer",
              }}
            >
              다운로드
            </button>
            
            {/* 확정 버튼 - 작업 중일 때만 활성화 */}
            {!currentVersion?.isFinalized && (
              <button 
                onClick={handleFinalize}
                style={{
                  border: "none", borderRadius: 3,
                  padding: "8px 18px", fontSize: 12, fontWeight: 600, color: "#EAE0CC",
                  backgroundColor: C.navy, cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                확정
              </button>
            )}
            
            {/* 편집 재개 버튼 - 확정된 버전일 때만 활성화 */}
            {currentVersion?.isFinalized && (
              <button 
                onClick={handleResumeEditing}
                style={{
                  border: "none", borderRadius: 3,
                  padding: "8px 18px", fontSize: 12, fontWeight: 600, color: "#EAE0CC",
                  backgroundColor: C.navy, cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                편집 재개
              </button>
            )}
          </div>
        </div>

        {/* ── 범례 + 운영 경고 (접기/펼치기 가능) ──────────── */}
        <div style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          {/* 토글 버튼 */}
          <button
            onClick={() => setLegendExpanded(!legendExpanded)}
            style={{
              width: "100%",
              padding: "8px 24px",
              backgroundColor: C.bg,
              border: "none",
              borderBottom: legendExpanded ? `1px solid ${C.border}` : "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 600, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {legendExpanded ? "범례 및 경고 ▲" : `범례 및 경고 ▼ · 경고 ${intervalTotal + rolling14Issue + 1}건`}
            </span>
          </button>

          {/* 펼쳐진 내용 */}
          {legendExpanded && (
            <div style={{
              padding: "12px 24px",
              display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start",
            }}>
              {/* 근무코드 범례 */}
              <div style={{ flex: 1, minWidth: 400 }}>
                <div style={{ fontSize: 8.5, fontWeight: 600, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                  근무코드 범례
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {/* 근무조 */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {WORK_CODES.map((code) => (
                      <div key={code} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <LegendChip code={code} />
                        <span style={{ fontSize: 10, color: C.charcoal }}>{SHIFT[code].name}</span>
                      </div>
                    ))}
                  </div>
                  {/* 구분선 */}
                  <div style={{ width: 1, backgroundColor: C.border, alignSelf: "stretch" }} />
                  {/* 휴무 */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {REST_CODES.map((code) => (
                      <div key={code} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <LegendChip code={code} />
                        <span style={{ fontSize: 10, color: C.charcoal }}>{SHIFT[code].name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 운영 경고 요약 */}
              <div style={{ flex: "0 0 auto", minWidth: 320 }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                  운영 경고 요약
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 10.5, color: C.risk, backgroundColor: C.riskBg,
                    border: `1px solid ${C.riskBorder}`, borderRadius: 3,
                    padding: "4px 10px", whiteSpace: "nowrap",
                  }}>
                    3월 22일 최소 커버리지 2명 부족
                  </span>
                  <span style={{
                    fontSize: 10.5, color: C.warning, backgroundColor: C.warnBg,
                    border: `1px solid rgba(184,124,26,0.25)`, borderRadius: 3,
                    padding: "4px 10px", whiteSpace: "nowrap",
                  }}>
                    A13→다음날 M07 위험 조합 {intervalTotal}건
                  </span>
                  <span style={{
                    fontSize: 10.5, color: C.warning, backgroundColor: C.warnBg,
                    border: `1px solid rgba(184,124,26,0.25)`, borderRadius: 3,
                    padding: "4px 10px", whiteSpace: "nowrap",
                  }}>
                    롤링 14일 휴무 규칙 주의 {rolling14Issue}명
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 근무표 메인 그리드 ────────────────────────────── */}
        <ScheduleGrid schedule={schedule} onCellClick={handleCellClick} zoom={zoom} isVersionLocked={currentVersion?.isFinalized || false} />

        {/* ── AI 자연어 조정 (컴팩트 하단 바) ────────────── */}
        <div style={{
          backgroundColor: C.white,
          borderTop: `1px solid ${C.border}`,
          padding: "10px 24px",
          flexShrink: 0,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>
            AI 조정
          </span>
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="자연어로 조정 지시 (예: 박씨·이씨 야간 연속 배정 금지)"
            style={{
              flex: 1,
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              padding: "7px 12px",
              fontSize: 11,
              fontFamily: "'Inter', sans-serif",
              color: C.text,
              backgroundColor: C.bg,
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = C.gold)}
            onBlur={(e) => (e.target.style.borderColor = C.border)}
          />
          <button
            disabled={!aiInput.trim()}
            onClick={handleApplyAiAdjustment}
            style={{
              padding: "7px 16px",
              backgroundColor: !aiInput.trim() ? C.border : C.navy,
              color: !aiInput.trim() ? C.muted : "#EAE0CC",
              border: "none",
              borderRadius: 3,
              cursor: !aiInput.trim() ? "default" : "pointer",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            적용
          </button>
        </div>

        {/* ── 셀 변경 모달 ──────────────────────────────────── */}
        <ScheduleAdjustModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          empName={selectedEmp?.name || ""}
          day={selectedDay || 1}
          currentCode={selectedCode}
          onApply={handleApplyChange}
        />

        {/* ── 변경 이력 모달 ────────────────────────────────── */}
        {historyModalOpen && (
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: C.white,
              borderRadius: 4,
              border: `1px solid ${C.border}`,
              maxWidth: 800,
              width: "90%",
              maxHeight: "80vh",
            }}>
              {/* 헤더 */}
              <div style={{
                padding: "20px 24px",
                borderBottom: `1px solid ${C.border}`,
                backgroundColor: "#F9F7F4",
              }}>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: C.navy,
                  fontFamily: "'Cormorant Garamond', serif",
                }}>
                  AI 조정 변경 이력
                </h3>
                <p style={{
                  fontSize: 11,
                  color: C.muted,
                  marginTop: 4,
                }}>
                  {monthLabel}의 AI 자연어 조정 이력을 확인할 수 있습니다
                </p>
              </div>

              {/* 콘텐츠 */}
              <div style={{ padding: 24, overflow: "auto", maxHeight: "calc(80vh - 140px)" }}>
                {aiHistory.length > 0 ? (
                  <div style={{
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}>
                    {aiHistory.map((history, index) => {
                      const statusColor = history.status === "적용 완료" ? C.ok : history.status === "일부 반영" ? C.warning : C.muted;
                      const statusBg = history.status === "적용 완료" ? C.okBg : history.status === "일부 반영" ? C.warnBg : C.bg;
                      
                      return (
                        <div key={index} style={{
                          padding: "16px 20px",
                          borderBottom: index < aiHistory.length - 1 ? `1px solid ${C.border}` : "none",
                          backgroundColor: index % 2 === 1 ? C.rowAlt : C.white,
                        }}>
                          <div style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 16,
                            marginBottom: 8,
                          }}>
                            <div style={{
                              fontSize: 10,
                              color: C.muted,
                              fontFamily: "'Inter', sans-serif",
                              minWidth: 140,
                              flexShrink: 0,
                            }}>
                              {new Date(history.timestamp).toLocaleString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div style={{
                              fontSize: 9,
                              fontWeight: 600,
                              color: statusColor,
                              backgroundColor: statusBg,
                              padding: "4px 10px",
                              borderRadius: 3,
                              border: `1px solid ${statusColor}30`,
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}>
                              {history.status}
                            </div>
                          </div>
                          <div style={{
                            fontSize: 12,
                            color: C.charcoal,
                            lineHeight: 1.6,
                            paddingLeft: 156,
                          }}>
                            {history.command}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: C.muted,
                    fontSize: 12,
                  }}>
                    아직 AI 조정 이력이 없습니다
                  </div>
                )}
              </div>

              {/* 푸터 */}
              <div style={{
                padding: "16px 24px",
                borderTop: `1px solid ${C.border}`,
                display: "flex",
                justifyContent: "flex-end",
                backgroundColor: "#F9F7F4",
              }}>
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  style={{
                    padding: "8px 18px",
                    backgroundColor: C.navy,
                    color: "#EAE0CC",
                    border: "none",
                    borderRadius: 3,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}