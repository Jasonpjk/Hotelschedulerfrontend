import { useRef } from "react";
import { Lock, Shield, X } from "lucide-react";
import {
  SHIFT, WORK_CODES, EMPLOYEES,
  SHIFT_GROUP_COLORS, ROLE_BADGE,
  type ShiftCode, type Emp, type PrimaryShiftKey, type CalConfig,
} from "../data/scheduleData";

/* ═══════════════════════════════════════════════════════════════════
   MONTHLY SCHEDULE GRID
   월별 근무표 & 보호 일정 선택 모달 공용 컴포넌트
   mode = "view"             → 기본 근무표 (SchedulePage)
   mode = "protect-selection" → 보호 선택 오버레이 포함 (RedeploymentPage 모달)
════════════════════════════════════════════════════════════════════ */

// ── 컬러 토큰 (SchedulePage 기준 동일 값) ──────────────────────────
const C = {
  navy:        "#0D1B2A",
  gold:        "#B99B5A",
  goldDim:     "rgba(185,155,90,0.55)",
  goldBg:      "rgba(185,155,90,0.08)",
  goldBorder:  "rgba(185,155,90,0.25)",
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
  sunBg:       "#FFF4F4",
  satBg:       "#F4F7FD",
  holBg:       "#FEF8ED",
  todayBg:     "#FFFCF2",
  rowAlt:      "#FAFAF8",
};

// ── 달력 헬퍼 ─────────────────────────────────────────────────────
function isSun(cal: CalConfig, d: number) { return cal.getDow(d) === 0; }
function isSat(cal: CalConfig, d: number) { return cal.getDow(d) === 6; }
function isHol(cal: CalConfig, d: number) { return cal.holidays.includes(d); }
function isTdy(cal: CalConfig, d: number) { return cal.todayDay > 0 && d === cal.todayDay; }

const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];

function dayTextColor(cal: CalConfig, d: number): string {
  if (isHol(cal, d) || isSun(cal, d)) return C.risk;
  if (isSat(cal, d)) return "#2B5EA0";
  return C.charcoal;
}

function colBg(cal: CalConfig, d: number, alt: boolean): string {
  if (isHol(cal, d)) return C.holBg;
  if (isSun(cal, d)) return C.sunBg;
  if (isSat(cal, d)) return C.satBg;
  if (isTdy(cal, d)) return C.todayBg;
  return alt ? C.rowAlt : C.white;
}

// ── 일일 인원 계산 ─────────────────────────────────────────────────
function dailyCount(schedule: Record<string, ShiftCode[]>, day: number): number {
  return EMPLOYEES.filter(e => WORK_CODES.includes(schedule[e.id]?.[day - 1])).length;
}

function dailyCountByShift(
  schedule: Record<string, ShiftCode[]>,
  day: number,
  type: "morning" | "afternoon" | "night" | "middle",
): number {
  const codes: ShiftCode[] = {
    morning:   ["M07"],
    afternoon: ["A13"],
    night:     ["N22"],
    middle:    ["C08", "C09", "C10", "C11"],
  }[type];
  return EMPLOYEES.filter(e => codes.includes(schedule[e.id]?.[day - 1])).length;
}

function getRequiredStaff(cal: CalConfig, day: number): number {
  return (isHol(cal, day) || isSun(cal, day) || isSat(cal, day)) ? 6 : 5;
}

// ── 내부 배지 ─────────────────────────────────────────────────────
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

// ── 보호 셀 인터페이스 (protect-selection 모드) ─────────────────────
export interface ProtCellState {
  status: "active" | "pending-remove";
  level: "absolute" | "priority";
  source: "auto-absolute" | "auto-priority" | "manual";
}

// ── Props 정의 ─────────────────────────────────────────────────────
interface MonthlyScheduleGridProps {
  schedule: Record<string, ShiftCode[]>;
  employees?: Emp[];             // 기본값: EMPLOYEES (공유 데이터)
  calConfig: CalConfig;
  zoom?: number;
  isVersionLocked?: boolean;
  onCellClick?: (empId: string, day: number) => void;
  highlightedCells?: Array<{ empId: string; day: number }>;
  gridRef?: { current: HTMLDivElement | null };
  warningPanelOpen?: boolean;
  showCountRows?: boolean;

  /* protect-selection 전용 */
  mode?: "view" | "protect-selection";
  protCells?: Map<string, ProtCellState>;
  baseDay?: number;
  onProtectCellClick?: (
    empId: string,
    empName: string,
    day: number,
    code: ShiftCode,
    isDisabled: boolean,
  ) => void;
}

export function MonthlyScheduleGrid({
  schedule,
  employees = EMPLOYEES,
  calConfig,
  zoom = 1,
  isVersionLocked = false,
  onCellClick,
  highlightedCells = [],
  gridRef,
  showCountRows = true,
  mode = "view",
  protCells,
  baseDay = 1,
  onProtectCellClick,
}: MonthlyScheduleGridProps) {
  const isProtectMode = mode === "protect-selection";
  const totalDays     = calConfig.totalDays;

  const EMP_W    = 160 * zoom;
  const CELL_W   = 46 * zoom;
  const ROW_H    = 42 * zoom;
  const HEADER_H = 56 * zoom;

  // 그룹별 직원 분류
  const groups: Record<PrimaryShiftKey, Emp[]> = {
    "오전조": employees.filter(e => e.primaryShift === "오전조"),
    "오후조": employees.filter(e => e.primaryShift === "오후조"),
    "야간조": employees.filter(e => e.primaryShift === "야간조"),
  };

  return (
    <div
      ref={gridRef}
      style={{ width: "100%", height: "100%", overflow: "auto", minWidth: 0, minHeight: 0 }}
    >
      <table style={{
        borderCollapse: "collapse",
        tableLayout: "fixed",
        minWidth: EMP_W + totalDays * CELL_W,
      }}>
        <colgroup>
          <col style={{ width: EMP_W }} />
          {Array.from({ length: totalDays }, (_, i) => <col key={i} style={{ width: CELL_W }} />)}
        </colgroup>

        {/* ── 날짜 헤더 ───────────────────────────────────────────── */}
        <thead>
          <tr>
            <th style={{
              position: "sticky", left: 0, top: 0, zIndex: 4,
              height: HEADER_H,
              backgroundColor: C.white,
              borderBottom: `2px solid ${C.border}`,
              borderRight: `1px solid ${C.border}`,
              padding: `0 ${10 * zoom}px`,
              textAlign: "left", verticalAlign: "middle",
            }}>
              <div style={{ fontSize: 8.5 * zoom, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                직원 정보
              </div>
              <div style={{ fontSize: 8 * zoom, color: C.goldDim, marginTop: 2 * zoom }}>
                {calConfig.monthLabel} · {calConfig.versionLabel}
              </div>
            </th>

            {Array.from({ length: totalDays }, (_, i) => {
              const day  = i + 1;
              const hol  = isHol(calConfig, day);
              const sun  = isSun(calConfig, day);
              const sat  = isSat(calConfig, day);
              const tdy  = isTdy(calConfig, day);
              const locked = isProtectMode && day < baseDay;

              let thBg = C.white;
              if (hol)     thBg = C.holBg;
              else if (sun) thBg = C.sunBg;
              else if (sat) thBg = C.satBg;
              else if (tdy) thBg = C.todayBg;

              if (locked) thBg = "rgba(230,230,238,0.6)";

              return (
                <th key={day} style={{
                  position: "sticky", top: 0, zIndex: 2,
                  height: HEADER_H,
                  backgroundColor: thBg,
                  borderBottom: tdy ? `2px solid ${C.gold}` : `2px solid ${C.border}`,
                  borderRight: `1px solid ${C.borderLight}`,
                  textAlign: "center", verticalAlign: "middle",
                  padding: 0,
                  opacity: locked ? 0.45 : 1,
                }}>
                  <div style={{
                    fontSize: 13 * zoom, fontWeight: tdy ? 700 : 500,
                    color: tdy ? C.gold : dayTextColor(calConfig, day),
                    lineHeight: 1,
                  }}>{day}</div>
                  <div style={{
                    fontSize: 9 * zoom, marginTop: 3 * zoom,
                    color: dayTextColor(calConfig, day), opacity: 0.75,
                    lineHeight: 1,
                  }}>
                    {DOW_KO[calConfig.getDow(day)]}
                  </div>
                  <div style={{ height: 12 * zoom, marginTop: 2 * zoom, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {hol && calConfig.holidayNames[day] && (
                      <span style={{ fontSize: 6.5 * zoom, color: "#7A5800", fontWeight: 600, letterSpacing: "-0.01em" }}>
                        {calConfig.holidayNames[day]}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* ── 직원 행 ─────────────────────────────────────────────── */}
        <tbody>
          {(() => {
            let globalIndex = 0;
            const rows: JSX.Element[] = [];

            (["오전조", "오후조", "야간조"] as PrimaryShiftKey[]).forEach((shiftName, groupIdx) => {
              const groupEmps = groups[shiftName];
              if (groupEmps.length === 0) return;

              const shiftColor = SHIFT_GROUP_COLORS[shiftName];

              // 그룹 헤더 행
              rows.push(
                <tr key={`gh-${shiftName}`} style={{ height: 32 * zoom }}>
                  <td style={{
                    position: "sticky", left: 0, zIndex: 2,
                    backgroundColor: shiftColor.bg,
                    borderTop: groupIdx > 0 ? `3px solid ${C.charcoal}` : `1px solid ${C.border}`,
                    borderBottom: `1px solid ${shiftColor.border}`,
                    borderRight: `1px solid ${C.border}`,
                    padding: `${6 * zoom}px ${12 * zoom}px`,
                    verticalAlign: "middle",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 * zoom }}>
                      <div style={{ width: 8 * zoom, height: 8 * zoom, borderRadius: "50%", backgroundColor: shiftColor.text, flexShrink: 0 }} />
                      <span style={{ fontSize: 11 * zoom, fontWeight: 600, color: shiftColor.text, letterSpacing: "0.04em" }}>
                        {shiftName}
                      </span>
                    </div>
                  </td>
                  {Array.from({ length: totalDays }, (_, i) => {
                    const day = i + 1;
                    return (
                      <td key={day} style={{
                        backgroundColor: colBg(calConfig, day, false),
                        borderTop: groupIdx > 0 ? `3px solid ${C.charcoal}` : `1px solid ${C.border}`,
                        borderBottom: `1px solid ${shiftColor.border}`,
                        borderRight: `1px solid ${C.borderLight}`,
                        borderLeft: isTdy(calConfig, day) ? `1.5px solid ${C.gold}` : undefined,
                      }} />
                    );
                  })}
                </tr>
              );

              // 직원 행
              groupEmps.forEach((emp) => {
                const alt = globalIndex % 2 === 1;
                const rb  = ROLE_BADGE[emp.role];
                globalIndex++;

                rows.push(
                  <tr key={emp.id} style={{ height: ROW_H }}>
                    {/* 직원 정보 셀 */}
                    <td style={{
                      position: "sticky", left: 0, zIndex: 1,
                      backgroundColor: alt ? C.rowAlt : C.white,
                      borderBottom: `1px solid ${C.borderLight}`,
                      borderRight: `1px solid ${C.border}`,
                      padding: `0 ${8 * zoom}px`,
                      verticalAlign: "middle",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 * zoom }}>
                        <div style={{ width: 6 * zoom, height: 6 * zoom, borderRadius: "50%", flexShrink: 0, backgroundColor: shiftColor.text }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 11.5 * zoom, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>
                            {emp.name}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 * zoom, marginTop: 2 * zoom }}>
                            <span style={{ fontSize: 8 * zoom, fontWeight: 600, backgroundColor: "#E8EEF6", color: "#2B5EA0", borderRadius: 2, padding: `${1 * zoom}px ${3 * zoom}px`, whiteSpace: "nowrap" }}>
                              {emp.grade}
                            </span>
                            <span style={{ fontSize: 8.5 * zoom, fontWeight: 600, backgroundColor: rb.bg, color: rb.text, borderRadius: 2, padding: `${1 * zoom}px ${4 * zoom}px`, whiteSpace: "nowrap" }}>
                              {emp.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 날짜 셀 */}
                    {Array.from({ length: totalDays }, (_, ci) => {
                      const day  = ci + 1;
                      const code = (schedule[emp.id]?.[ci] ?? "OFF") as ShiftCode;
                      const bg   = colBg(calConfig, day, alt);

                      if (isProtectMode) {
                        // ── protect-selection 모드 ─────────────────
                        const k           = `${emp.id}_${day}`;
                        const protState   = protCells?.get(k);
                        const isLocked    = day < baseDay;
                        const isPendRem   = protState?.status === "pending-remove";
                        const isActive    = protState?.status === "active";
                        const level       = isActive ? protState!.level : null;
                        const isAuto      = protState?.source === "auto-absolute" || protState?.source === "auto-priority";

                        const cellBg = isLocked
                          ? "rgba(220,220,228,0.25)"
                          : isPendRem
                            ? "rgba(184,50,50,0.07)"
                            : level === "absolute"
                              ? "rgba(184,50,50,0.08)"
                              : level === "priority"
                                ? "rgba(185,155,90,0.10)"
                                : bg;

                        return (
                          <td
                            key={day}
                            onClick={() => onProtectCellClick?.(emp.id, emp.name, day, code, isLocked)}
                            title={
                              isLocked
                                ? "변경 기준일 이전 (선택 불가)"
                                : isPendRem
                                  ? `해제 예정\n이 일정은 보호 해제 예정입니다.\n저장하면 스케줄 재생성 시 변경 대상에 포함될 수 있습니다.\n다시 클릭하면 해제 취소`
                                  : isActive
                                    ? `[${level === "absolute" ? "절대" : "우선"} 보호] ${isAuto ? "자동" : "수동"} · 클릭하여 해제/변경`
                                    : `${emp.name} · ${calConfig.monthLabel.replace("년 ", "-").replace("월", "")}${String(day).padStart(2, "0")} · ${SHIFT[code].name} (${code}) · 클릭하여 보호 선택`
                            }
                            style={{
                              padding: 2,
                              textAlign: "center",
                              verticalAlign: "middle",
                              borderBottom: `1px solid ${C.borderLight}`,
                              borderRight: `1px solid ${C.borderLight}`,
                              borderLeft: isTdy(calConfig, day) ? `1.5px solid ${C.gold}` : undefined,
                              cursor: isLocked ? "not-allowed" : "pointer",
                              backgroundColor: cellBg,
                              outline: isPendRem
                                ? "1.5px dashed #B83232"
                                : isActive
                                  ? `${isAuto ? "1.5px dashed" : "2px solid"} ${level === "absolute" ? C.risk : C.gold}`
                                  : "none",
                              outlineOffset: -2,
                              position: "relative",
                              transition: "background 0.1s",
                            }}
                          >
                            {/* 근무 코드 배지 — 항상 선명하게 */}
                            <ShiftBadge code={code} zoom={zoom} />

                            {/* 절대/우선 보호 아이콘 */}
                            {isActive && level && (
                              <div style={{ position: "absolute", top: 1, right: 1, lineHeight: 1 }}>
                                {level === "absolute"
                                  ? <Lock   size={8} color={isAuto ? "rgba(184,50,50,0.5)"  : C.risk} />
                                  : <Shield size={8} color={isAuto ? "rgba(185,155,90,0.55)" : C.gold} />
                                }
                              </div>
                            )}

                            {/* 해제 예정 — 우상단 X 배지 (배지 가리지 않음) */}
                            {isPendRem && (
                              <div style={{
                                position: "absolute",
                                top: 1,
                                right: 1,
                                width: 11,
                                height: 11,
                                borderRadius: "50%",
                                backgroundColor: "#B83232",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 2,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                              }}>
                                <X size={6} color="#fff" strokeWidth={3} />
                              </div>
                            )}

                            {/* 잠금 오버레이 (기준일 이전) */}
                            {isLocked && (
                              <div style={{
                                position: "absolute", inset: 0,
                                backgroundColor: "rgba(235,235,245,0.55)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                zIndex: 1,
                              }}>
                                <Lock size={7} color="#BBBBCC" />
                              </div>
                            )}
                          </td>
                        );
                      } else {
                        // ── 일반 view 모드 ────────────────────────
                        const cellLocked = isVersionLocked;
                        const hiIdx = highlightedCells.findIndex(
                          hc => hc.empId === emp.id && hc.day === day,
                        );
                        const isHi      = hiIdx !== -1;
                        const isFirstHi = hiIdx === 0;

                        return (
                          <td
                            key={day}
                            onClick={() => !cellLocked && onCellClick?.(emp.id, day)}
                            title={
                              cellLocked
                                ? "확정된 버전은 수정할 수 없습니다"
                                : `${emp.name} · ${String(day)}일 · ${SHIFT[code].name} (${code})`
                            }
                            style={{
                              backgroundColor: isHi ? "#FFF9E6" : bg,
                              borderBottom: `1px solid ${C.borderLight}`,
                              borderRight: `1px solid ${C.borderLight}`,
                              borderLeft: isTdy(calConfig, day) ? `1.5px solid ${C.gold}` : undefined,
                              textAlign: "center", verticalAlign: "middle",
                              cursor: cellLocked ? "default" : "pointer",
                              padding: 3 * zoom,
                              opacity: cellLocked ? 0.7 : 1,
                              position: "relative",
                              transition: "all 0.2s",
                              boxShadow: isHi
                                ? isFirstHi
                                  ? `inset 0 0 0 2.5px ${C.warning}`
                                  : `inset 0 0 0 2.5px ${C.gold}`
                                : undefined,
                            }}
                            onMouseEnter={e => {
                              if (!cellLocked && !isHi)
                                (e.currentTarget as HTMLElement).style.backgroundColor = C.goldBg;
                            }}
                            onMouseLeave={e => {
                              if (!isHi)
                                (e.currentTarget as HTMLElement).style.backgroundColor = bg;
                            }}
                          >
                            <ShiftBadge code={code} zoom={zoom} />
                          </td>
                        );
                      }
                    })}
                  </tr>
                );
              });
            });

            // ── 집계 행 (view 모드 전용) ──────────────────────────
            if (showCountRows && !isProtectMode) {
              // 일일 근무 인원
              rows.push(
                <tr key="count-total" style={{ height: 30 * zoom }}>
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
                  {Array.from({ length: totalDays }, (_, i) => {
                    const day   = i + 1;
                    const count = dailyCount(schedule, day);
                    const low   = count <= 3;
                    let bg = "#F4F1EB";
                    if (isHol(calConfig, day)) bg = "#FAF2DC";
                    else if (isSun(calConfig, day)) bg = "#F9EEEE";
                    else if (isSat(calConfig, day)) bg = "#EDF0F8";
                    return (
                      <td key={day} style={{
                        backgroundColor: bg,
                        borderTop: `2px solid ${C.border}`,
                        borderRight: `1px solid ${C.borderLight}`,
                        textAlign: "center", verticalAlign: "middle",
                      }}>
                        <span style={{ fontSize: 11 * zoom, fontWeight: 700, color: low ? C.risk : C.charcoal, fontFamily: "'Inter', sans-serif" }}>
                          {count}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );

              // 오전조 인원
              rows.push(
                <tr key="count-morning" style={{ height: 26 * zoom }}>
                  <td style={{ position: "sticky", left: 0, zIndex: 1, backgroundColor: "#F8FAFC", borderRight: `1px solid ${C.border}`, padding: `0 ${12 * zoom}px`, verticalAlign: "middle" }}>
                    <span style={{ fontSize: 8.5 * zoom, fontWeight: 500, color: "#1B5990", letterSpacing: "0.03em" }}>오전조 (M07)</span>
                  </td>
                  {Array.from({ length: totalDays }, (_, i) => {
                    const day = i + 1;
                    const count = dailyCountByShift(schedule, day, "morning");
                    let bg = "#F8FAFC";
                    if (isHol(calConfig, day)) bg = "#FDFAF2";
                    else if (isSun(calConfig, day)) bg = "#FDF9F9";
                    else if (isSat(calConfig, day)) bg = "#F7F9FC";
                    return (
                      <td key={day} style={{ backgroundColor: bg, borderRight: `1px solid ${C.borderLight}`, textAlign: "center", verticalAlign: "middle" }}>
                        <span style={{ fontSize: 10 * zoom, fontWeight: 600, color: "#1B5990", fontFamily: "'Inter', sans-serif" }}>{count}</span>
                      </td>
                    );
                  })}
                </tr>
              );

              // 중간조 인원
              rows.push(
                <tr key="count-middle" style={{ height: 26 * zoom }}>
                  <td style={{ position: "sticky", left: 0, zIndex: 1, backgroundColor: "#FDFBF7", borderRight: `1px solid ${C.border}`, padding: `0 ${12 * zoom}px`, verticalAlign: "middle" }}>
                    <span style={{ fontSize: 8.5 * zoom, fontWeight: 500, color: "#7A5518", letterSpacing: "0.03em" }}>중간조 (C08~C11)</span>
                  </td>
                  {Array.from({ length: totalDays }, (_, i) => {
                    const day = i + 1;
                    const count = dailyCountByShift(schedule, day, "middle");
                    let bg = "#FDFBF7";
                    if (isHol(calConfig, day)) bg = "#FEF9EF";
                    else if (isSun(calConfig, day)) bg = "#FEF7F5";
                    else if (isSat(calConfig, day)) bg = "#FCFAF8";
                    return (
                      <td key={day} style={{ backgroundColor: bg, borderRight: `1px solid ${C.borderLight}`, textAlign: "center", verticalAlign: "middle" }}>
                        <span style={{ fontSize: 10 * zoom, fontWeight: 600, color: "#7A5518", fontFamily: "'Inter', sans-serif" }}>{count}</span>
                      </td>
                    );
                  })}
                </tr>
              );

              // 오후조 인원
              rows.push(
                <tr key="count-afternoon" style={{ height: 26 * zoom }}>
                  <td style={{ position: "sticky", left: 0, zIndex: 1, backgroundColor: "#F7FBF9", borderRight: `1px solid ${C.border}`, padding: `0 ${12 * zoom}px`, verticalAlign: "middle" }}>
                    <span style={{ fontSize: 8.5 * zoom, fontWeight: 500, color: "#1B6638", letterSpacing: "0.03em" }}>오후조 (A13)</span>
                  </td>
                  {Array.from({ length: totalDays }, (_, i) => {
                    const day = i + 1;
                    const count = dailyCountByShift(schedule, day, "afternoon");
                    let bg = "#F7FBF9";
                    if (isHol(calConfig, day)) bg = "#FCF9F3";
                    else if (isSun(calConfig, day)) bg = "#FBF8F8";
                    else if (isSat(calConfig, day)) bg = "#F6FAF9";
                    return (
                      <td key={day} style={{ backgroundColor: bg, borderRight: `1px solid ${C.borderLight}`, textAlign: "center", verticalAlign: "middle" }}>
                        <span style={{ fontSize: 10 * zoom, fontWeight: 600, color: "#1B6638", fontFamily: "'Inter', sans-serif" }}>{count}</span>
                      </td>
                    );
                  })}
                </tr>
              );

              // 야간조 인원
              rows.push(
                <tr key="count-night" style={{ height: 26 * zoom }}>
                  <td style={{ position: "sticky", left: 0, zIndex: 1, backgroundColor: "#FAFAFC", borderRight: `1px solid ${C.border}`, padding: `0 ${12 * zoom}px`, verticalAlign: "middle" }}>
                    <span style={{ fontSize: 8.5 * zoom, fontWeight: 500, color: "#4A3785", letterSpacing: "0.03em" }}>야간조 (N22)</span>
                  </td>
                  {Array.from({ length: totalDays }, (_, i) => {
                    const day = i + 1;
                    const count = dailyCountByShift(schedule, day, "night");
                    let bg = "#FAFAFC";
                    if (isHol(calConfig, day)) bg = "#FCF9F4";
                    else if (isSun(calConfig, day)) bg = "#FCF8F9";
                    else if (isSat(calConfig, day)) bg = "#F9F9FC";
                    return (
                      <td key={day} style={{ backgroundColor: bg, borderRight: `1px solid ${C.borderLight}`, textAlign: "center", verticalAlign: "middle" }}>
                        <span style={{ fontSize: 10 * zoom, fontWeight: 600, color: "#4A3785", fontFamily: "'Inter', sans-serif" }}>{count}</span>
                      </td>
                    );
                  })}
                </tr>
              );

              // 적정 인원 대비
              rows.push(
                <tr key="count-required" style={{ height: 30 * zoom }}>
                  <td style={{ position: "sticky", left: 0, zIndex: 1, backgroundColor: "#EEF0F2", borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, padding: `0 ${12 * zoom}px`, verticalAlign: "middle" }}>
                    <span style={{ fontSize: 9.5 * zoom, fontWeight: 600, color: C.muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>적정 인원 대비</span>
                  </td>
                  {Array.from({ length: totalDays }, (_, i) => {
                    const day      = i + 1;
                    const count    = dailyCount(schedule, day);
                    const required = getRequiredStaff(calConfig, day);
                    const diff     = count - required;
                    const isOk     = diff >= 0;
                    let bg = "#EEF0F2";
                    if (isHol(calConfig, day)) bg = "#F7F3E8";
                    else if (isSun(calConfig, day)) bg = "#F9ECEC";
                    else if (isSat(calConfig, day)) bg = "#E9EEF5";
                    return (
                      <td key={day} style={{ backgroundColor: bg, borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.borderLight}`, textAlign: "center", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 * zoom }}>
                          <span style={{ fontSize: 10 * zoom, fontWeight: 700, color: isOk ? C.ok : C.risk, fontFamily: "'Inter', sans-serif" }}>
                            {diff >= 0 ? `+${diff}` : diff}
                          </span>
                          <span style={{ fontSize: 7.5 * zoom, color: C.muted, fontFamily: "'Inter', sans-serif" }}>
                            ({count}/{required})
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            }

            return rows;
          })()}
        </tbody>
      </table>
    </div>
  );
}

export default MonthlyScheduleGrid;