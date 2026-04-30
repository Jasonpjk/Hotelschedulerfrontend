import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router";
import AppLayout from "../components/layout/AppLayout";
import ScheduleAdjustModal from "../components/ScheduleAdjustModal";
import NotificationSendModal from "../components/NotificationSendModal";
import NotificationHistoryModal from "../components/NotificationHistoryModal";
import IntensityRecoveryModal from "../components/IntensityRecoveryModal";
import { AnnualNightShiftPlanContent } from "./AnnualNightShiftPlanPage";
import { analyzeScheduleIntensity } from "../utils/scheduleIntensity";
import { useLang } from "../context/LangContext";
import { useToast } from "../context/ToastContext";
import { useAppContext } from "../context/AppContext";
import { MonthlyScheduleGrid } from "../components/MonthlyScheduleGrid";
import {
  EMPLOYEES, SCHEDULE_DATA, SHIFT, WORK_CODES, REST_CODES,
  GRADE_ORDER, SHIFT_ORDER, ROLE_BADGE, SHIFT_GROUP_COLORS,
  MAR_2026_CAL,
  type ShiftCode, type RoleKey, type GradeKey, type PrimaryShiftKey, type Emp,
} from "../data/scheduleData";

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
  okBorder:    "rgba(46,125,82,0.25)",
  warning:     "#B87C1A",
  warnBg:      "rgba(184,124,26,0.09)",
  sunBg:       "#FFF4F4",
  satBg:       "#F4F7FD",
  holBg:       "#FEF8ED",
  todayBg:     "#FFFCF2",
  rowAlt:      "#FAFAF8",
};

/* ══════════════════════════════════════════════════════════
   TYPE DEFINITIONS (page-local only)
══════════════════════════════════════════════════════════ */

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

/** 셀용 배 */
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

/* ── 공유 데이터 로컬 별칭 (ScheduleGrid 호환) ─ */
const MARCH_DAYS = MAR_2026_CAL.totalDays;
const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];
const getDow    = (d: number) => MAR_2026_CAL.getDow(d);
const isSun     = (d: number) => MAR_2026_CAL.getDow(d) === 0;
const isSat     = (d: number) => MAR_2026_CAL.getDow(d) === 6;
const isHoliday = (d: number) => MAR_2026_CAL.holidays.includes(d);
const isToday   = (d: number) => d === MAR_2026_CAL.todayDay;

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

function dailyCount(schedule: Record<string, ShiftCode[]>, day: number): number {
  return EMPLOYEES.filter(e => WORK_CODES.includes(schedule[e.id]?.[day - 1])).length;
}

function dailyCountByShift(schedule: Record<string, ShiftCode[]>, day: number, shiftType: 'morning' | 'afternoon' | 'night' | 'middle'): number {
  const shiftCodes: ShiftCode[] = ({
    morning:   ['M07'],
    afternoon: ['A13'],
    night:     ['N22'],
    middle:    ['C08', 'C09', 'C10', 'C11'],
  } as Record<string, ShiftCode[]>)[shiftType];
  return EMPLOYEES.filter(e => shiftCodes.includes(schedule[e.id]?.[day - 1])).length;
}

function getRequiredStaff(day: number): number {
  return (isHoliday(day) || isSun(day) || isSat(day)) ? 6 : 5;
}

const INITIAL_SCHEDULE = SCHEDULE_DATA;

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

/* _DEAD_START_ — 절대 호출되지 않는 사용 중단 함수 */
function _dead_rm() {
  if (typeof window !== "undefined" && false) { return (<div>
      <table>
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
              padding: `0 ${10 * zoom}px`, textAlign: "left", verticalAlign: "middle", // 14 → 10으로 압축
            }}>
              <div style={{ fontSize: 8.5 * zoom, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>직원 정보</div>
              <div style={{ fontSize: 8 * zoom, color: C.goldDim, marginTop: 2 * zoom }}>2026년 3월 · v3.1</div>
            </th>

            {/* 날짜 헤더 — 모�� 동일 높이 */}
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
          {/* 그룹별로 직원을 분류하고 각 그룹 시작에 헤더 행 삽입 */}
          {(() => {
            // 그룹별로 직원 분류
            const groups: Record<PrimaryShiftKey, Emp[]> = {
              "오전조": EMPLOYEES.filter(e => e.primaryShift === "오전조"),
              "오후조": EMPLOYEES.filter(e => e.primaryShift === "오후조"),
              "야간조": EMPLOYEES.filter(e => e.primaryShift === "야간조"),
            };

            let globalIndex = 0;
            const allRows: JSX.Element[] = [];

            (["오전조", "오후조", "야간조"] as PrimaryShiftKey[]).forEach((shiftName, groupIdx) => {
              const groupEmps = groups[shiftName];
              if (groupEmps.length === 0) return;
              
              const shiftColor = SHIFT_GROUP_COLORS[shiftName];

              // 그룹 헤더 행 삽입
              allRows.push(
                <tr key={`group-header-${shiftName}`} style={{ height: 32 * zoom }}>
                  <td
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                      backgroundColor: shiftColor.bg,
                      borderTop: groupIdx > 0 ? `3px solid ${C.charcoal}` : `1px solid ${C.border}`,
                      borderBottom: `1px solid ${shiftColor.border}`,
                      borderRight: `1px solid ${C.border}`,
                      padding: `${6 * zoom}px ${12 * zoom}px`,
                      verticalAlign: "middle",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 * zoom }}>
                      <div
                        style={{
                          width: 8 * zoom,
                          height: 8 * zoom,
                          borderRadius: "50%",
                          backgroundColor: shiftColor.text,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 11 * zoom,
                          fontWeight: 600,
                          color: shiftColor.text,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {shiftName}
                      </span>
                    </div>
                  </td>
                  {Array.from({ length: MARCH_DAYS }, (_, i) => {
                    const day = i + 1;
                    const colBase = colBg(day, false);
                    return (
                      <td
                        key={day}
                        style={{
                          backgroundColor: colBase,
                          borderTop: groupIdx > 0 ? `3px solid ${C.charcoal}` : `1px solid ${C.border}`,
                          borderBottom: `1px solid ${shiftColor.border}`,
                          borderRight: `1px solid ${C.borderLight}`,
                          borderLeft: isToday(day) ? `1.5px solid ${C.gold}` : undefined,
                        }}
                      />
                    );
                  })}
                </tr>
              );

              // 해당 그룹의 직원 행들
              groupEmps.forEach((emp) => {
                const alt = globalIndex % 2 === 1;
                const rb = ROLE_BADGE[emp.role];
                globalIndex++;

                allRows.push(
                  <tr key={emp.id} style={{ height: ROW_H }}>
                    <td
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        backgroundColor: alt ? C.rowAlt : C.white,
                        borderBottom: `1px solid ${C.borderLight}`,
                        borderRight: `1px solid ${C.border}`,
                        padding: `0 ${8 * zoom}px`,
                        verticalAlign: "middle",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 * zoom }}>
                        <div
                          style={{
                            width: 6 * zoom,
                            height: 6 * zoom,
                            borderRadius: "50%",
                            flexShrink: 0,
                            backgroundColor: shiftColor.text,
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 11.5 * zoom, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>
                            {emp.name}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 * zoom, marginTop: 2 * zoom }}>
                            <span
                              style={{
                                fontSize: 8 * zoom,
                                fontWeight: 600,
                                backgroundColor: "#E8EEF6",
                                color: "#2B5EA0",
                                borderRadius: 2,
                                padding: `${1 * zoom}px ${3 * zoom}px`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {emp.grade}
                            </span>
                            <span
                              style={{
                                fontSize: 8.5 * zoom,
                                fontWeight: 600,
                                backgroundColor: rb.bg,
                                color: rb.text,
                                borderRadius: 2,
                                padding: `${1 * zoom}px ${4 * zoom}px`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {emp.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {schedule[emp.id].map((code, ci) => {
                      const day = ci + 1;
                      const cellLocked = isVersionLocked;
                      const bg = colBg(day, alt);
                      const highlightIndex = highlightedCells.findIndex(
                        (cell) => cell.empId === emp.id && cell.day === day
                      );
                      const isHighlighted = highlightIndex !== -1;
                      const isFirstHighlight = highlightIndex === 0;

                      return (
                        <td
                          key={day}
                          onClick={() => !cellLocked && onCellClick(emp.id, day)}
                          title={
                            cellLocked
                              ? "확정된 버전은 수정할 수 없습니다"
                              : `${emp.name} · 3월 ${day}일 · ${SHIFT[code].name} (${code})`
                          }
                          style={{
                            backgroundColor: isHighlighted ? "#FFF9E6" : bg,
                            borderBottom: `1px solid ${C.borderLight}`,
                            borderRight: `1px solid ${C.borderLight}`,
                            borderLeft: isToday(day) ? `1.5px solid ${C.gold}` : undefined,
                            textAlign: "center",
                            verticalAlign: "middle",
                            cursor: cellLocked ? "default" : "pointer",
                            padding: 3 * zoom,
                            opacity: cellLocked ? 0.7 : 1,
                            position: "relative",
                            transition: "all 0.2s",
                            boxShadow: isHighlighted
                              ? isFirstHighlight
                                ? `inset 0 0 0 2.5px ${C.warning}`
                                : `inset 0 0 0 2.5px ${C.gold}`
                              : undefined,
                          }}
                          onMouseEnter={(e) => {
                            if (!cellLocked && !isHighlighted)
                              (e.currentTarget as HTMLElement).style.backgroundColor = C.goldBg;
                          }}
                          onMouseLeave={(e) => {
                            if (!isHighlighted) (e.currentTarget as HTMLElement).style.backgroundColor = bg;
                          }}
                        >
                          <ShiftBadge code={code} zoom={zoom} />
                        </td>
                      );
                    })}
                  </tr>
                );
              });
            });

            return allRows;
          })()}

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

          {/* 오전조 인원 */}
          <tr style={{ height: 26 * zoom }}>
            <td style={{
              position: "sticky", left: 0, zIndex: 1,
              backgroundColor: "#F8FAFC",
              borderRight: `1px solid ${C.border}`,
              padding: `0 ${12 * zoom}px`, verticalAlign: "middle",
            }}>
              <span style={{ fontSize: 8.5 * zoom, fontWeight: 500, color: "#1B5990", letterSpacing: "0.03em" }}>
                오전조 (M07)
              </span>
            </td>
            {Array.from({ length: MARCH_DAYS }, (_, i) => {
              const day = i + 1;
              const count = dailyCountByShift(schedule, day, 'morning');
              let bg = "#F8FAFC";
              if (isHoliday(day)) bg = "#FDFAF2";
              else if (isSun(day)) bg = "#FDF9F9";
              else if (isSat(day)) bg = "#F7F9FC";
              return (
                <td key={day} style={{
                  backgroundColor: bg,
                  borderRight: `1px solid ${C.borderLight}`,
                  textAlign: "center", verticalAlign: "middle",
                }}>
                  <span style={{
                    fontSize: 10 * zoom, fontWeight: 600,
                    color: "#1B5990",
                    fontFamily: "'Inter', sans-serif",
                  }}>{count}</span>
                </td>
              );
            })}
          </tr>

          {/* 중간조 인원 */}
          <tr style={{ height: 26 * zoom }}>
            <td style={{
              position: "sticky", left: 0, zIndex: 1,
              backgroundColor: "#FDFBF7",
              borderRight: `1px solid ${C.border}`,
              padding: `0 ${12 * zoom}px`, verticalAlign: "middle",
            }}>
              <span style={{ fontSize: 8.5 * zoom, fontWeight: 500, color: "#7A5518", letterSpacing: "0.03em" }}>
                중간조 (C08~C11)
              </span>
            </td>
            {Array.from({ length: MARCH_DAYS }, (_, i) => {
              const day = i + 1;
              const count = dailyCountByShift(schedule, day, 'middle');
              let bg = "#FDFBF7";
              if (isHoliday(day)) bg = "#FEF9EF";
              else if (isSun(day)) bg = "#FEF7F5";
              else if (isSat(day)) bg = "#FCFAF8";
              return (
                <td key={day} style={{
                  backgroundColor: bg,
                  borderRight: `1px solid ${C.borderLight}`,
                  textAlign: "center", verticalAlign: "middle",
                }}>
                  <span style={{
                    fontSize: 10 * zoom, fontWeight: 600,
                    color: "#7A5518",
                    fontFamily: "'Inter', sans-serif",
                  }}>{count}</span>
                </td>
              );
            })}
          </tr>

          {/* 오후조 인원 */}
          <tr style={{ height: 26 * zoom }}>
            <td style={{
              position: "sticky", left: 0, zIndex: 1,
              backgroundColor: "#F7FBF9",
              borderRight: `1px solid ${C.border}`,
              padding: `0 ${12 * zoom}px`, verticalAlign: "middle",
            }}>
              <span style={{ fontSize: 8.5 * zoom, fontWeight: 500, color: "#1B6638", letterSpacing: "0.03em" }}>
                오후조 (A13)
              </span>
            </td>
            {Array.from({ length: MARCH_DAYS }, (_, i) => {
              const day = i + 1;
              const count = dailyCountByShift(schedule, day, 'afternoon');
              let bg = "#F7FBF9";
              if (isHoliday(day)) bg = "#FCF9F3";
              else if (isSun(day)) bg = "#FBF8F8";
              else if (isSat(day)) bg = "#F6FAF9";
              return (
                <td key={day} style={{
                  backgroundColor: bg,
                  borderRight: `1px solid ${C.borderLight}`,
                  textAlign: "center", verticalAlign: "middle",
                }}>
                  <span style={{
                    fontSize: 10 * zoom, fontWeight: 600,
                    color: "#1B6638",
                    fontFamily: "'Inter', sans-serif",
                  }}>{count}</span>
                </td>
              );
            })}
          </tr>

          {/* 야간조 인원 */}
          <tr style={{ height: 26 * zoom }}>
            <td style={{
              position: "sticky", left: 0, zIndex: 1,
              backgroundColor: "#FAFAFC",
              borderRight: `1px solid ${C.border}`,
              padding: `0 ${12 * zoom}px`, verticalAlign: "middle",
            }}>
              <span style={{ fontSize: 8.5 * zoom, fontWeight: 500, color: "#4A3785", letterSpacing: "0.03em" }}>
                야간조 (N22)
              </span>
            </td>
            {Array.from({ length: MARCH_DAYS }, (_, i) => {
              const day = i + 1;
              const count = dailyCountByShift(schedule, day, 'night');
              let bg = "#FAFAFC";
              if (isHoliday(day)) bg = "#FCF9F4";
              else if (isSun(day)) bg = "#FCF8F9";
              else if (isSat(day)) bg = "#F9F9FC";
              return (
                <td key={day} style={{
                  backgroundColor: bg,
                  borderRight: `1px solid ${C.borderLight}`,
                  textAlign: "center", verticalAlign: "middle",
                }}>
                  <span style={{
                    fontSize: 10 * zoom, fontWeight: 600,
                    color: "#4A3785",
                    fontFamily: "'Inter', sans-serif",
                  }}>{count}</span>
                </td>
              );
            })}
          </tr>

          {/* 적정 인원 대비 */}
          <tr style={{ height: 30 * zoom }}>
            <td style={{
              position: "sticky", left: 0, zIndex: 1,
              backgroundColor: "#EEF0F2",
              borderTop: `1px solid ${C.border}`,
              borderRight: `1px solid ${C.border}`,
              padding: `0 ${12 * zoom}px`, verticalAlign: "middle",
            }}>
              <span style={{ fontSize: 9.5 * zoom, fontWeight: 600, color: C.muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                적정 인원 대비
              </span>
            </td>
            {Array.from({ length: MARCH_DAYS }, (_, i) => {
              const day = i + 1;
              const count = dailyCount(schedule, day);
              const required = getRequiredStaff(day);
              const diff = count - required;
              const isOk = diff >= 0;
              let bg = "#EEF0F2";
              if (isHoliday(day)) bg = "#F7F3E8";
              else if (isSun(day)) bg = "#F9ECEC";
              else if (isSat(day)) bg = "#E9EEF5";
              return (
                <td key={day} style={{
                  backgroundColor: bg,
                  borderTop: `1px solid ${C.border}`,
                  borderRight: `1px solid ${C.borderLight}`,
                  textAlign: "center", verticalAlign: "middle",
                }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 * zoom }}>
                    <span style={{
                      fontSize: 10 * zoom, fontWeight: 700,
                      color: isOk ? C.ok : C.risk,
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      {diff >= 0 ? `+${diff}` : diff}
                    </span>
                    <span style={{
                      fontSize: 7.5 * zoom,
                      color: C.muted,
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      ({count}/{required})
                    </span>
                  </div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  ) as unknown as null; } }
/* _DEAD_END_ */

// 임의 연월에 대한 CalConfig 동적 생성
function buildCalConfig(yearMonth: string, versionLabel: string): CalConfig {
  const [year, month] = yearMonth.split("-").map(Number);
  const startDow = new Date(year, month - 1, 1).getDay();
  const totalDays = new Date(year, month, 0).getDate();
  return {
    totalDays,
    getDow: (d) => (d - 1 + startDow) % 7,
    holidays: [],
    holidayNames: {},
    todayDay: 0,
    monthLabel: `${year}년 ${month}월`,
    versionLabel,
  };
}

// 선택 가능 월 목록 (2025-01 ~ 2027-12)
const ALL_MONTHS: string[] = [];
for (let y = 2025; y <= 2027; y++) {
  for (let m = 1; m <= 12; m++) {
    ALL_MONTHS.push(`${y}-${String(m).padStart(2, "0")}`);
  }
}

function makeDefaultMonthData(yearMonth: string): MonthData {
  const m = parseInt(yearMonth.split("-")[1]);
  const vId = `v${m}.0`;
  return { versions: [{ id: vId, name: vId, isFinalized: false }], history: [] };
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function SchedulePage() {
  useLang(); // 향후 다국어 확장용 훅 유지
  const { showToast } = useToast();
  const {
    setScheduleStatus,
    setScheduleVersion,
    addChangeLog,
    setLastUpdatedAt,
  } = useAppContext();
  
  const [schedule, setSchedule] = useState(INITIAL_SCHEDULE);
  const [aiInput, setAiInput] = useState("");
  const [zoom, setZoom] = useState(1.0);
  
  // 월별 데이터 구조 — 선택 가능 전 월을 미리 초기화
  const [monthDataMap, setMonthDataMap] = useState<Record<string, MonthData>>(() => {
    const map: Record<string, MonthData> = {};
    for (const ym of ALL_MONTHS) {
      map[ym] = makeDefaultMonthData(ym);
    }
    // 기존 목업 데이터 덮어쓰기
    map["2026-03"] = {
      versions: [
        { id: "v3.0", name: "v3.0", isFinalized: true },
        { id: "v3.1", name: "v3.1", isFinalized: false },
      ],
      history: [
        { timestamp: "2026-03-08T10:30:00", command: "박지현 3월 15일 OFF로 변경", status: "적용 완료" },
        { timestamp: "2026-03-07T14:22:00", command: "이수진 야간조 연속 배정 금지", status: "일부 반영" },
        { timestamp: "2026-03-06T16:45:00", command: "3월 주말 최소 인원 5명 유지", status: "적용 완료" },
      ],
    };
    map["2026-04"] = {
      versions: [{ id: "v4.0", name: "v4.0", isFinalized: false }],
      history: [
        { timestamp: "2026-03-25T11:15:00", command: "4월 첫 주 오전조 인원 강화", status: "적용 완료" },
        { timestamp: "2026-03-20T09:30:00", command: "공휴일 최소 인원 6명 확보", status: "검토 필요" },
      ],
    };
    return map;
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
  
  // 현재 월 CalConfig (동적 생성)
  const currentCalConfig = buildCalConfig(selectedMonth, currentVersionId);

  // 월 변경 핸들러
  function handleMonthChange(newMonth: string) {
    setSelectedMonth(newMonth);
    const newMonthVersions = monthDataMap[newMonth].versions;
    setCurrentVersionId(newMonthVersions[newMonthVersions.length - 1].id);
  }
  
  // 탭 & 전체화면 상태
  const [activeTab, setActiveTab] = useState<"monthly" | "annual">("monthly");
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedCode, setSelectedCode] = useState<ShiftCode | null>(null);
  
  // 다운로드 모달
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  
  // 변경 이력 모달
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // 알림 발송 / 발송 이력 모달
  const [notifSendOpen, setNotifSendOpen] = useState(false);
  const [notifHistoryOpen, setNotifHistoryOpen] = useState(false);

  // 전월 근무강도 회복 반영 결과 모달
  const [intensityRecoveryOpen, setIntensityRecoveryOpen] = useState(false);
  
  // 경고 패널
  const [warningPanelOpen, setWarningPanelOpen] = useState(false);
  const [warningActiveTab, setWarningActiveTab] = useState<"critical" | "advisory" | "fairness">("critical");
  const [highlightedCells, setHighlightedCells] = useState<Array<{ empId: string; day: number }>>([]);
  const warningRef = useRef<HTMLDivElement>(null);

  // 공정성 아코디언 — 현재 펼쳐진 직원 이름 (부모 controlled, 사용자가 자유롭게 접고 펼침)
  const [fairnessExpandedEmployee, setFairnessExpandedEmployee] = useState<string | null>(null);
  // 대시보드에서 이동한 직원 강조 배지 (펼침 상태와 분리)
  const [fairnessDashboardHighlight, setFairnessDashboardHighlight] = useState<string | null>(null);
  // 대시보드 포커스가 이미 소비된 navigation key 추적 (중복 실행 방지)
  const dashboardFocusConsumedKey = useRef<string | null>(null);
  // 공정성 카드별 ref (직원 이름 → ref)
  const fairnessCardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // 근무표 그리드 스크롤 ref
  const scheduleGridRef = useRef<HTMLDivElement>(null);
  
  // 표에서 보기 함수 (실제 스크롤 + 강조)
  const scrollToCell = (empId: string, day: number, additionalCells?: Array<{ empId: string; day: number }>) => {
    // 강조 표시
    setHighlightedCells([{ empId, day }, ...(additionalCells || [])]);
    
    // 실제 스크롤 이동
    if (scheduleGridRef.current) {
      const empIndex = EMPLOYEES.findIndex(e => e.id === empId);
      if (empIndex === -1) return;
      
      const currentZoom = zoom; // 현재 zoom 값
      const EMP_W = 160 * currentZoom; // 압축된 직원 정보 영역 폭
      const CELL_W = 46 * currentZoom;
      const ROW_H = 42 * currentZoom;
      const HEADER_H = 56 * currentZoom;
      
      // 경고 패널 너비 (열려있을 때)
      const PANEL_WIDTH = warningPanelOpen ? 420 : 0;
      
      // 타겟 위치 계산
      const targetLeft = EMP_W + (day - 1) * CELL_W;
      const targetTop = HEADER_H + empIndex * ROW_H;
      
      // 가시 영역의 중앙에 오도록 보정
      const container = scheduleGridRef.current;
      const viewportWidth = container.clientWidth;
      const viewportHeight = container.clientHeight;
      
      // 추가 셀도 함께 보이도록 범위 확장 (위험 조합의 경우 2개 셀)
      const cellsToShow = 1 + (additionalCells?.length || 0);
      const totalWidth = cellsToShow * CELL_W;
      
      // 스크롤 위치 계산 (중앙 정렬)
      // 패널이 열린 상태에서는 실제 보이는 영역이 줄어든 것을 고려
      const scrollLeft = targetLeft - (viewportWidth / 2) + (totalWidth / 2);
      const scrollTop = targetTop - (viewportHeight / 2) + (ROW_H / 2);
      
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
      });
    }
    
    // 3초 후 강조 해제
    setTimeout(() => setHighlightedCells([]), 3000);
  };

  // ── 대시보드 공정성 리포트 연결 (최초 1회만 소비) ─────────
  const location = useLocation();
  useEffect(() => {
    const nav = (location.state as { fairnessNavigation?: { employeeName: string; issueType?: string; issueId?: number; severity?: string } } | null)
      ?.fairnessNavigation;
    if (!nav) return;

    // 이미 처리한 navigation이면 무시 (같은 employeeName+issueType 조합으로 판별)
    const consumeKey = `${nav.employeeName}::${nav.issueType ?? ""}`;
    if (dashboardFocusConsumedKey.current === consumeKey) return;
    dashboardFocusConsumedKey.current = consumeKey;

    // 1) 경고 패널 열기 + 공정성/편중 탭 선택
    setWarningPanelOpen(true);
    setWarningActiveTab("fairness");

    // 2) 아코디언 펼치기 (부모 controlled — 사용자가 이후 자유롭게 접고 펼 수 있음)
    setFairnessExpandedEmployee(nav.employeeName);

    // 3) 강조 배지 표시 (펼침 상태와 분리)
    setFairnessDashboardHighlight(nav.employeeName);

    // 4) 패널 렌더링 후 카드로 스크롤
    setTimeout(() => {
      const cardEl = fairnessCardRefs.current.get(nav.employeeName);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        showToast({
          type: "warning",
          title: "항목을 찾을 수 없음",
          message: "해당 직원의 공정성 이슈를 현재 근무표에서 찾을 수 없습니다.",
        });
      }
    }, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

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
    setMonthDataMap(prev => ({
      ...prev,
      [selectedMonth]: {
        ...prev[selectedMonth],
        versions: prev[selectedMonth].versions.map(v =>
          v.id === currentVersionId ? { ...v, isFinalized: true } : v
        ),
      },
    }));
    // 대시보드 전역 상태 동기화
    setScheduleStatus("확정");
    const now = new Date().toLocaleString("ko-KR", { hour12: false });
    setLastUpdatedAt(now);
    addChangeLog({
      type: "근무표 생성",
      typeBg: "rgba(46,125,82,0.07)",
      typeColor: "#2E7D52",
      target: `${currentVersionId} 확정`,
      actor: "관리자",
      role: "운영 관리자",
      detail: `${selectedMonth} ${currentVersionId} 근무표 확정`,
      time: now,
    });
    showToast({ type: "success", title: "확정 완료", message: "근무표가 확정되었습니다." });
  }

  // 편집 재개 (확정 해제)
  function handleResumeEditing() {
    setMonthDataMap(prev => ({
      ...prev,
      [selectedMonth]: {
        ...prev[selectedMonth],
        versions: prev[selectedMonth].versions.map(v =>
          v.id === currentVersionId ? { ...v, isFinalized: false } : v
        ),
      },
    }));
    // 대시보드 전역 상태 동기화
    setScheduleStatus("작업 중");
    showToast({ type: "info", title: "편집 모드 전환", message: "편집 모드로 전환되었습니다." });
  }
  
  // 운영정책 기반 스케줄 자동 생성 함수
  function generateScheduleWithPolicy(): Record<string, ShiftCode[]> {
    // 호텔 설정의 운영정책을 반영한 스케줄 생성
    // 실제 시스템에서는 호텔 설정 DB에서 정책을 가져와 적용
    
    // ★ 우선 선점 단계: 교차월 OFF를 먼저 배정
    // 1. 전월 야간조 종료자의 익월 전환 OFF (예: 익월 첫 2일)
    // 2. 다음 달 야간조 신규 진입자의 말일/익월 첫날 OFF
    //    - 신규 진입자가 여러 명일 경우 자동 분산 배치
    //    - 확정된 전월은 자동 수정하지 않고 경고 표시
    
    const newSchedule: Record<string, ShiftCode[]> = {};
    
    EMPLOYEES.forEach(emp => {
      const codes: ShiftCode[] = [];
      
      for (let day = 1; day <= MARCH_DAYS; day++) {
        // 기존 근태 신청 유지 (REQ, VAC 등)
        const existingCode = schedule[emp.id]?.[day - 1];
        if (existingCode === "REQ" || existingCode === "VAC") {
          codes.push(existingCode);
          continue;
        }
        
        // 운영정책 기반 배정 로직
        // 1. 교차월 야간 전환 OFF 선점 (우선순위 1)
        // 2. 최소 조별 인원 배치
        // 3. 각 조별 인차지 1명 이상 포함
        // 4. 14일 4휴무 규칙
        // 5. 야간조는 월 전체 고정
        // 6. SL은 여직원만 월 1회 (남직원은 연차만)
        
        const isHolidayOrWeekend = isHoliday(day) || isSun(day) || isSat(day);
        
        // 간단한 순환 배정 로직 (실제로는 복잡한 알고리즘)
        if (emp.role === "인차지 매니저") {
          codes.push(day % 7 === 0 ? "OFF" : "M07");
        } else if (emp.role === "선임") {
          if (emp.id === "e3" || emp.id === "e10") {
            // 야간조 선임 (월 전체 N22)
            codes.push(day % 4 === 0 ? "OFF" : "N22");
          } else {
            codes.push(day % 6 === 0 ? "OFF" : day % 2 === 0 ? "A13" : "M07");
          }
        } else {
          // 담당/인턴: 오전/오후/중간조 순환 배정
          const pattern = ["M07", "A13", "C08", "OFF"];
          codes.push(pattern[(day + parseInt(emp.id.slice(1))) % 4] as ShiftCode);
        }
      }
      
      newSchedule[emp.id] = codes;
    });
    
    return newSchedule;
  }
  
  // 새 버전 생성 (운영정책 반영)
  function handleCreateNewVersion() {
    // 월 번호 추출 (예: "2026-03" → 3)
    const monthNum = parseInt(selectedMonth.split("-")[1]);
    const nextVersionNum = versions.length;
    const newVersionId = `v${monthNum}.${nextVersionNum}`;
    const newVersionName = `v${monthNum}.${nextVersionNum}`;
    
    // 운영정책 기반 스케줄 생성
    const policyBasedSchedule = generateScheduleWithPolicy();
    setSchedule(policyBasedSchedule);
    
    // 새 버전 추���
    setMonthDataMap(prev => ({
      ...prev,
      [selectedMonth]: {
        ...prev[selectedMonth],
        versions: [
          ...prev[selectedMonth].versions,
          { id: newVersionId, name: newVersionName, isFinalized: false }
        ],
        history: [
          ...prev[selectedMonth].history,
          {
            timestamp: new Date().toISOString(),
            command: "운영정책 반영: 교차월 야간 전환 OFF 선점 → 최소 조별 인원 배치 → 14일 4휴무 반영 → 근태 신청 반영",
            status: "적용 완료" as AiAdjustmentHistory["status"]
          }
        ]
      },
    }));
    
    // 새 버전으로 자동 전환
    setCurrentVersionId(newVersionId);

    // 대시보드 전역 상태 동기화
    setScheduleVersion(newVersionId);
    setScheduleStatus("작업 중");
    const now = new Date().toLocaleString("ko-KR", { hour12: false });
    addChangeLog({
      type: "근무표 생성",
      typeBg: "rgba(94,127,163,0.08)",
      typeColor: "#5E7FA3",
      target: `${newVersionId} 생성`,
      actor: "관리자",
      role: "운영 관리자",
      detail: `${selectedMonth} ${newVersionId} 신규 생성`,
      time: now,
    });
    setLastUpdatedAt(now);

    // 피드백 표시
    showToast({
      type: "success",
      title: "새 버전 생성 완료",
      message: "운영정책이 반영된 새 버전이 생성되었습니다.",
    });
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
    showToast({ type: "success", title: "AI 조정 적용", message: `조정이 반영되었습니다: ${aiInput}` });
    setAiInput("");
  }

  const intervalTotal = EMPLOYEES.reduce((a, e) => a + calcIntervalWarn(schedule[e.id]), 0);
  const rolling14Issue = EMPLOYEES.filter(e => calcRolling14Rest(schedule[e.id]) < 4).length;

  const selectedEmp = selectedEmpId ? EMPLOYEES.find(e => e.id === selectedEmpId) : null;
  
  // 월 표시명 (예: "2026년 3월")
  const monthLabel = selectedMonth === "2026-03" ? "2026년 3월" : "2026년 4월";

  // 근무강도 분석 (전월 회복 반영 모달용)
  const employeeNameMap: Record<string, string> = Object.fromEntries(
    EMPLOYEES.map(e => [e.id, e.name])
  );
  const intensityAnalyses = analyzeScheduleIntensity(schedule, employeeNameMap);
  const intensityReflectionResults = intensityAnalyses.map(a => ({
    employeeId: a.employeeId,
    employeeName: a.employeeName,
    recoveryGrade: a.recoveryGrade,
    monthlyIntensityScore: a.monthlyIntensityScore,
    addedOffDays: a.recoveryGrade === "회복 필요" ? 2 : a.recoveryGrade === "주의" ? 1 : 0,
    reflection: (a.recoveryGrade === "회복 필요" ? "완전 반영" : a.recoveryGrade === "주의" ? "일부 반영" : "미반영") as "완전 반영" | "일부 반영" | "미반영",
  }));

  // 알림 발송용 직원 목록
  const allEmployeesForNotif = EMPLOYEES.map(e => ({
    id: e.id,
    name: e.name,
    employeeId: e.id,
  }));

  // 발송 이력 샘플 데이터
  const notificationHistory = [
    {
      id: "nh1",
      sentAt: "2026-03-05T10:30:00",
      senderName: "김재민",
      senderRole: "관리자",
      targetMonth: "2026-03",
      version: "v3.1",
      scheduleStatus: "확정" as const,
      recipientType: "전체 직원" as const,
      totalRecipients: 10,
      channels: "SMS + 이메일",
      successCount: 10,
      failureCount: 0,
      customMessage: "안녕하세요. 3월 근무표가 확정되었습니다. 확인 부탁드립니다.",
      recipients: EMPLOYEES.map(e => ({ name: e.name, employeeId: e.id, status: "성공" })),
    },
    {
      id: "nh2",
      sentAt: "2026-02-28T14:15:00",
      senderName: "김재민",
      senderRole: "관리자",
      targetMonth: "2026-02",
      version: "v2.1",
      scheduleStatus: "확정" as const,
      recipientType: "변경된 직원" as const,
      totalRecipients: 4,
      channels: "SMS",
      successCount: 3,
      failureCount: 1,
      recipients: EMPLOYEES.slice(0, 4).map((e, i) => ({ name: e.name, employeeId: e.id, status: i === 3 ? "실패" : "성공" })),
    },
  ];

  // 메인 콘텐츠 (일반 보기 / 전체화면 보기 공용)
  const mainContent = (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: C.bg }}>

      {/* ── 탭 바 ──────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C.white,
        borderBottom: `2px solid ${C.border}`,
        padding: "0 24px",
        display: "flex",
        alignItems: "flex-end",
        gap: 0,
        flexShrink: 0,
      }}>
        {([
          { key: "monthly" as const, label: "월별 근무표" },
          { key: "annual" as const, label: "연간 야간조 계획" },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "12px 20px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.key ? `2px solid ${C.gold}` : "2px solid transparent",
              marginBottom: -2,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? C.navy : C.muted,
              fontFamily: "'Cormorant Garamond', serif",
              letterSpacing: "0.02em",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 월별 근무표 탭 콘텐츠 ──────────────────────────── */}
      {activeTab === "monthly" && (
        <>

        {/* ── 상단 액션 바 ───────────────────────────────────── */}
        <div style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.border}`,
          padding: "10px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
          gap: 8,
          flexWrap: "wrap",
        }}>
          {/* ── 좌: 조회 그룹 ─────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* 월 선택 */}
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              style={{
                border: `1px solid ${C.border}`, borderRadius: 3,
                padding: "0 10px", height: 32,
                fontSize: 12, color: C.navy, fontWeight: 500,
                backgroundColor: C.white, cursor: "pointer", outline: "none",
                whiteSpace: "nowrap", minWidth: 130,
              }}
            >
              {ALL_MONTHS.map(ym => {
                const [y, m] = ym.split("-").map(Number);
                return <option key={ym} value={ym}>{y}년 {m}월</option>;
              })}
            </select>

            {/* 버전 선택 */}
            <select 
              value={currentVersionId}
              onChange={(e) => setCurrentVersionId(e.target.value)}
              style={{
                border: `1px solid ${C.border}`, borderRadius: 3,
                padding: "0 10px", height: 32,
                fontSize: 12, color: C.charcoal,
                backgroundColor: C.white, cursor: "pointer", outline: "none",
                whiteSpace: "nowrap",
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
                whiteSpace: "nowrap", flexShrink: 0,
              }}>
                {currentVersion.isFinalized ? "확정" : "작업 중"}
              </span>
            )}
            
            {/* 확정된 버전 안내 */}
            {currentVersion?.isFinalized && (
              <span style={{
                fontSize: 10,
                color: C.muted,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}>
                이 버전은 확정되어 수정할 수 없습니다
              </span>
            )}
          </div>

          {/* ── 우: 액션 그룹 ─────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>

            {/* [화면 조정] 축소·확대·초기화 */}
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {([
                { label: "축소", action: () => setZoom(Math.max(0.5, zoom - 0.05)) },
                { label: "확대", action: () => setZoom(Math.min(2.0, zoom + 0.05)) },
                { label: "초기화", action: () => setZoom(1.0) },
              ] as { label: string; action: () => void }[]).map(btn => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  style={{
                    border: `1px solid ${C.border}`,
                    backgroundColor: C.white, color: C.charcoal,
                    borderRadius: 3, padding: "0 10px", height: 32,
                    fontSize: 11, fontWeight: 500,
                    cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.gold; (e.currentTarget as HTMLElement).style.backgroundColor = "#FEFDFB"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.backgroundColor = C.white; }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div style={{ width: 1, height: 20, backgroundColor: C.border, flexShrink: 0 }} />

            {/* [검토] 경고·변경 이력·근무강도 */}
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {/* 경고 */}
              <button 
                data-warning-button
                onClick={() => setWarningPanelOpen(!warningPanelOpen)}
                style={{
                  border: `1px solid ${C.border}`, borderRadius: 3,
                  padding: "0 11px", height: 32,
                  fontSize: 12, fontWeight: 500, color: C.charcoal,
                  backgroundColor: C.white, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                  whiteSpace: "nowrap", flexShrink: 0,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.gold; (e.currentTarget as HTMLElement).style.backgroundColor = "#FEFDFB"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.backgroundColor = C.white; }}
              >
                경고
                <span style={{ backgroundColor: C.riskBg, color: C.risk, borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
                  {intervalTotal + rolling14Issue + 1}
                </span>
              </button>

              {/* 변경 이력 */}
              <button 
                onClick={() => setHistoryModalOpen(true)}
                title="AI 조정 변경 이력 보기"
                style={{
                  border: `1px solid ${C.border}`, borderRadius: 3,
                  padding: "0 11px", height: 32,
                  fontSize: 12, fontWeight: 500, color: C.charcoal,
                  backgroundColor: C.white, cursor: "pointer",
                  whiteSpace: "nowrap", flexShrink: 0,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.gold; (e.currentTarget as HTMLElement).style.backgroundColor = "#FEFDFB"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.backgroundColor = C.white; }}
              >
                변경 이력
              </button>

              {/* 근무강도 */}
              <button
                onClick={() => setIntensityRecoveryOpen(true)}
                title="전월 근무강도 회복 결과 보기"
                style={{
                  border: `1px solid ${C.border}`, borderRadius: 3,
                  padding: "0 11px", height: 32,
                  fontSize: 12, fontWeight: 500, color: C.charcoal,
                  backgroundColor: C.white, cursor: "pointer",
                  whiteSpace: "nowrap", flexShrink: 0,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.gold; (e.currentTarget as HTMLElement).style.backgroundColor = "#FEFDFB"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.backgroundColor = C.white; }}
              >
                근무강도
              </button>
            </div>

            <div style={{ width: 1, height: 20, backgroundColor: C.border, flexShrink: 0 }} />

            {/* [알림] 알림 발송·발송 이력 */}
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <button
                onClick={() => setNotifSendOpen(true)}
                title="확정된 스케줄을 직원에게 발송"
                style={{
                  border: `1px solid ${C.border}`, borderRadius: 3,
                  padding: "0 11px", height: 32,
                  fontSize: 12, fontWeight: 500, color: C.charcoal,
                  backgroundColor: C.white, cursor: "pointer",
                  whiteSpace: "nowrap", flexShrink: 0,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.gold; (e.currentTarget as HTMLElement).style.backgroundColor = "#FEFDFB"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.backgroundColor = C.white; }}
              >
                알림 발송
              </button>
              <button
                onClick={() => setNotifHistoryOpen(true)}
                style={{
                  border: `1px solid ${C.border}`, borderRadius: 3,
                  padding: "0 11px", height: 32,
                  fontSize: 12, fontWeight: 500, color: C.charcoal,
                  backgroundColor: C.white, cursor: "pointer",
                  whiteSpace: "nowrap", flexShrink: 0,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.gold; (e.currentTarget as HTMLElement).style.backgroundColor = "#FEFDFB"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.backgroundColor = C.white; }}
              >
                발송 이력
              </button>
            </div>

            <div style={{ width: 1, height: 20, backgroundColor: C.border, flexShrink: 0 }} />

            {/* [작업] 새 버전·다운로드·저장·확정/편집재개 */}
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <button 
                onClick={handleCreateNewVersion}
                title="운영정책을 반영해 새 근무표 버전 생성"
                style={{
                  border: `1px solid ${C.border}`, borderRadius: 3,
                  padding: "0 11px", height: 32,
                  fontSize: 12, fontWeight: 500, color: C.charcoal,
                  backgroundColor: C.white, cursor: "pointer",
                  whiteSpace: "nowrap", flexShrink: 0,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.gold; (e.currentTarget as HTMLElement).style.backgroundColor = "#FEFDFB"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.backgroundColor = C.white; }}
              >
                새 버전
              </button>
              <button 
                onClick={() => setDownloadModalOpen(true)}
                style={{
                  border: `1px solid ${C.border}`, borderRadius: 3,
                  padding: "0 11px", height: 32,
                  fontSize: 12, fontWeight: 500, color: C.charcoal,
                  backgroundColor: C.white, cursor: "pointer",
                  whiteSpace: "nowrap", flexShrink: 0,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.gold; (e.currentTarget as HTMLElement).style.backgroundColor = "#FEFDFB"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.backgroundColor = C.white; }}
              >
                다운로드
              </button>

              {/* 저장 */}
              {!currentVersion?.isFinalized && (
                <button
                  onClick={() => {
                    showToast({ type: "success", title: "저장 완료", message: "근무표가 저장되었습니다." });
                  }}
                  style={{
                    border: `1px solid ${C.ok}`, borderRadius: 3,
                    padding: "0 13px", height: 32,
                    fontSize: 12, fontWeight: 600, color: C.ok,
                    backgroundColor: C.okBg, cursor: "pointer",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap", flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  저장
                </button>
              )}
              
              {/* 확정 */}
              {!currentVersion?.isFinalized && (
                <button 
                  onClick={handleFinalize}
                  style={{
                    border: "none", borderRadius: 3,
                    padding: "0 14px", height: 32,
                    fontSize: 12, fontWeight: 600, color: "#EAE0CC",
                    backgroundColor: C.navy, cursor: "pointer",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap", flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  확정
                </button>
              )}
              
              {/* 편집 재개 */}
              {currentVersion?.isFinalized && (
                <button 
                  onClick={handleResumeEditing}
                  style={{
                    border: "none", borderRadius: 3,
                    padding: "0 14px", height: 32,
                    fontSize: 12, fontWeight: 600, color: "#EAE0CC",
                    backgroundColor: C.navy, cursor: "pointer",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap", flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  편집 재개
                </button>
              )}
            </div>

            <div style={{ width: 1, height: 20, backgroundColor: C.border, flexShrink: 0 }} />

            {/* 전체화면 */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "전체화면 닫기" : "전체화면 보기 열기"}
              style={{
                border: `1px solid ${C.goldBorder}`, borderRadius: 3,
                padding: "0 11px", height: 32,
                fontSize: 11, fontWeight: 500,
                color: C.gold, backgroundColor: C.goldBg, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
                whiteSpace: "nowrap", flexShrink: 0,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(185,155,90,0.15)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = C.goldBg; }}
            >
              {isFullScreen ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              )}
              {isFullScreen ? "축소" : "전체화면"}
            </button>
          </div>
        </div>

        {/* ── 범례 (항상 노출) ──────────────────────────────── */}
        <div style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.border}`,
          padding: "10px 24px 11px",
          flexShrink: 0,
        }}>
          {/* 범례 영역 - 컴팩트하게 정리 */}
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            {/* 근무코드 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginRight: 4 }}>
                근무
              </span>
              {WORK_CODES.map((code) => (
                <div key={code} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <LegendChip code={code} />
                  <span style={{ fontSize: 9.5, color: C.charcoal, marginRight: 4 }}>{SHIFT[code].name}</span>
                </div>
              ))}
            </div>
            
            {/* 구분선 */}
            <div style={{ width: 1, height: 16, backgroundColor: C.border }} />
            
            {/* 휴무코드 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginRight: 4 }}>
                휴무
              </span>
              {REST_CODES.map((code) => (
                <div key={code} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <LegendChip code={code} />
                  <span style={{ fontSize: 9.5, color: C.charcoal, marginRight: 4 }}>{SHIFT[code].name}</span>
                </div>
              ))}
            </div>
            
            {/* 구분선 */}
            <div style={{ width: 1, height: 16, backgroundColor: C.border }} />
            
            {/* 조 그룹 */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginRight: 4 }}>
                조 그룹
              </span>
              {(["오전조", "오후조", "야간조"] as PrimaryShiftKey[]).map((shift) => {
                const color = SHIFT_GROUP_COLORS[shift];
                return (
                  <div key={shift} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      padding: "2px 8px", height: 18, flexShrink: 0,
                      backgroundColor: color.bg, color: color.text, border: `1px solid ${color.border}`,
                      borderRadius: 3, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.02em",
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      {shift}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 근무표 메인 그리드 ────────────────────────────── */}
        {/* ── 메인 그리드 영역 ─────────────────────────────── */}
        <div style={{
          flex: 1,
          overflow: "auto", // hidden → auto로 변경하여 세로/가로 스크롤 모두 가능하게
          marginRight: warningPanelOpen ? 420 : 0, // 패널 열림 시 오른쪽 여백 확보
          transition: "margin-right 0.3s ease",
          minHeight: 0, // flex 자식 요소가 제대로 스크롤되도록 minHeight 추가
        }}>
          <MonthlyScheduleGrid
            schedule={schedule}
            calConfig={currentCalConfig}
            zoom={zoom}
            isVersionLocked={currentVersion?.isFinalized || false}
            onCellClick={handleCellClick}
            highlightedCells={highlightedCells}
            gridRef={scheduleGridRef}
            showCountRows={true}
          />
        </div>

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
            placeholder="자연어로 조정 지시 (예: 박씨·이��� 야간 연속 배정 금지)"
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
          
          {/* 피드백 메시지는 전역 ToastContainer에서 처리 */}
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

        {/* ── 다운로드 모달 ────────────────────────────────── */}
        {downloadModalOpen && (
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
              maxWidth: 520,
              width: "90%",
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
                  근무표 다운로드
                </h3>
                <p style={{
                  fontSize: 11,
                  color: C.muted,
                  marginTop: 4,
                }}>
                  {monthLabel} · {currentVersion?.name}
                </p>
              </div>

              {/* 콘텐츠 */}
              <div style={{ padding: "24px" }}>
                {/* 현재 버전 정보 */}
                <div style={{
                  padding: "14px 16px",
                  backgroundColor: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  marginBottom: 20,
                }}>
                  <div style={{
                    fontSize: 10,
                    color: C.muted,
                    marginBottom: 6,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}>
                    다운로드 대상
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 12,
                    color: C.charcoal,
                  }}>
                    <span style={{ fontWeight: 600 }}>{currentVersion?.name}</span>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 2,
                      backgroundColor: currentVersion?.isFinalized ? C.okBg : C.warnBg,
                      color: currentVersion?.isFinalized ? C.ok : C.warning,
                    }}>
                      {currentVersion?.isFinalized ? "확정" : "작업 중"}
                    </span>
                  </div>
                </div>

                {/* 파일 형식 선택 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: C.muted,
                    marginBottom: 10,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}>
                    파일 형식 선택
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { format: "Excel (.xlsx)", desc: "Microsoft Excel 형식 · 편집 가능" },
                      { format: "PDF (.pdf)", desc: "인쇄용 PDF · 읽기 전용" },
                      { format: "CSV (.csv)", desc: "데이터 형식 · 시스템 연동" },
                    ].map((option) => (
                      <button
                        key={option.format}
                        onClick={() => {
                          alert(`${option.format} 다운로드가 시작됩니다.`);
                          setDownloadModalOpen(false);
                        }}
                        style={{
                          padding: "12px 16px",
                          backgroundColor: C.white,
                          border: `1px solid ${C.border}`,
                          borderRadius: 3,
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = C.goldBg;
                          e.currentTarget.style.borderColor = C.gold;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = C.white;
                          e.currentTarget.style.borderColor = C.border;
                        }}
                      >
                        <div style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.navy,
                          marginBottom: 4,
                        }}>
                          {option.format}
                        </div>
                        <div style={{
                          fontSize: 10,
                          color: C.muted,
                        }}>
                          {option.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 안내 메시지 */}
                <div style={{
                  padding: "12px 14px",
                  backgroundColor: C.goldBg,
                  border: `1px solid ${C.gold}40`,
                  borderRadius: 3,
                  fontSize: 10,
                  color: C.charcoal,
                  lineHeight: 1.6,
                }}>
                  <strong style={{ color: C.gold }}>💡 안내</strong><br/>
                  다운로드된 파일은 현재 버전의 스냅샷입니다. 이후 변경 사항은 반영되지 않습니다.
                </div>
              </div>

              {/* 푸터 */}
              <div style={{
                padding: "16px 24px",
                borderTop: `1px solid ${C.border}`,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                backgroundColor: "#F9F7F4",
              }}>
                <button
                  onClick={() => setDownloadModalOpen(false)}
                  style={{
                    padding: "8px 18px",
                    backgroundColor: C.white,
                    color: C.charcoal,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 운영 경고 패널 (오른쪽 슬라이드) */}
        {warningPanelOpen && (
          <div 
            ref={warningRef}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: 420, // 480 → 420으로 슬림화
              height: "100vh",
              backgroundColor: C.white,
              borderLeft: `1px solid ${C.border}`,
              boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* 패널 헤더 */}
            <div style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${C.border}`,
              backgroundColor: "#FAFAF8",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: C.navy,
                  fontFamily: "'Cormorant Garamond', serif",
                }}>
                  운영 경고
                </h3>
                <button
                  onClick={() => { setWarningPanelOpen(false); setFairnessDashboardHighlight(null); }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 24,
                    color: C.muted,
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
              
              {/* 요약 카드 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                <div style={{
                  padding: "8px 10px",
                  backgroundColor: C.riskBg,
                  border: `1px solid ${C.riskBorder}`,
                  borderRadius: 3,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.risk, marginBottom: 2 }}>
                    4
                  </div>
                  <div style={{ fontSize: 9, color: C.risk, fontWeight: 500, letterSpacing: "0.02em" }}>
                    즉시 수정 필요
                  </div>
                </div>
                <div style={{
                  padding: "8px 10px",
                  backgroundColor: C.warnBg,
                  border: `1px solid rgba(184,124,26,0.25)`,
                  borderRadius: 3,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.warning, marginBottom: 2 }}>
                    {intervalTotal + 1}
                  </div>
                  <div style={{ fontSize: 9, color: C.warning, fontWeight: 500, letterSpacing: "0.02em" }}>
                    권고 / 주의
                  </div>
                </div>
                <div style={{
                  padding: "8px 10px",
                  backgroundColor: C.goldBg,
                  border: `1px solid ${C.goldBorder}`,
                  borderRadius: 3,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.gold, marginBottom: 2 }}>
                    8
                  </div>
                  <div style={{ fontSize: 9, color: C.gold, fontWeight: 500, letterSpacing: "0.02em" }}>
                    공정성 / 편중
                  </div>
                </div>
              </div>
            </div>

            {/* 탭 */}
            <div style={{
              display: "flex",
              borderBottom: `1px solid ${C.border}`,
              backgroundColor: C.white,
            }}>
              {[
                { key: "critical" as const, label: "즉시 수정 필요" },
                { key: "advisory" as const, label: "권고 / 주의" },
                { key: "fairness" as const, label: "공정성 / 편중" },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setWarningActiveTab(tab.key)}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: "none",
                    border: "none",
                    borderBottom: warningActiveTab === tab.key ? `2px solid ${C.gold}` : "2px solid transparent",
                    cursor: "pointer",
                    fontSize: 11.5,
                    fontWeight: warningActiveTab === tab.key ? 600 : 400,
                    color: warningActiveTab === tab.key ? C.navy : C.muted,
                    transition: "all 0.15s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 탭 내용 */}
            <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
              {warningActiveTab === "critical" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* 최소 커버리지 부족 */}
                  <WarningCard
                    type="critical"
                    title="최소 커버리지 부족"
                    date="3월 22일"
                    shift="오전조"
                    description="최소 커버리지 2명 부족"
                    action="OFF 또는 C조 조정 권장"
                    onViewInTable={() => scrollToCell("e1", 22)}
                  />
                  
                  {/* 인차지 미배치 */}
                  <WarningCard
                    type="critical"
                    title="인차지 미배치"
                    date="3월 14일"
                    shift="야간조"
                    description="인차지 없음"
                    action="인차지 1명 이상 재배치 필요"
                    onViewInTable={() => scrollToCell("e1", 14)}
                  />
                  
                  {/* 남직원 SL 배정 */}
                  <WarningCard
                    type="critical"
                    title="남직원 SL 배정"
                    employee="김태훈"
                    date="3월 18일"
                    description="남직원에게 SL 배정됨"
                    action="연차로 변경 필요"
                    onViewInTable={() => scrollToCell("e2", 18)}
                  />
                  
                  {/* 야간조 월내 전환 위반 */}
                  <WarningCard
                    type="critical"
                    title="야간조 월내 타 조 전환 위반"
                    employee="이수진"
                    date="3월 12일"
                    shift="야간조 → 오전조"
                    description="야간조 담당자가 월 중 오전조로 배치됨"
                    action="월 전체 야간조 유지 권장"
                    onViewInTable={() => scrollToCell("e3", 12)}
                  />
                  
                  {/* 전월 야간조 종료자 익월 OFF 미충족 */}
                  <WarningCard
                    type="critical"
                    title="전월 야간조 종료자 익월 OFF 미충족"
                    employee="최민지"
                    date="4월 1일~2일"
                    description="전월 야간조 담당자가 익월 첫 2일 OFF를 받지 않음"
                    action="익월 첫 2일 OFF 강제 배정 필요"
                    onViewInTable={() => scrollToCell("e4", 1)}
                  />
                  
                  {/* 교차월 야간 최소 인원 부족 위험 */}
                  <WarningCard
                    type="critical"
                    title="교차월 야간 최소 인원 부족 위험"
                    date="2월 28일 ~ 3월 1일"
                    description="신규 야간조 진입자 2명의 OFF가 같은 날 배정되어 최소 야간 인원 미달"
                    action="전월 말일과 익월 첫날로 분산 배치 필요"
                    onViewInTable={() => scrollToCell("e10", 1)}
                  />
                  
                  {/* 확정된 전월 스케줄 영향 발생 */}
                  <WarningCard
                    type="critical"
                    title="확정된 전월 스케줄 영향 발생"
                    date="2월 28일"
                    description="신규 야간조 진입자 휴식을 위해 이미 확정된 전월 스케줄 수정 필요"
                    action="관리자 선택: 전월 새 버전 생성 또는 익월 첫날 대체 반영"
                    onViewInTable={() => scrollToCell("e10", 1)}
                  />
                </div>
              )}

              {warningActiveTab === "advisory" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* A13 → M07 위험 조합 개별 건 (실제 스케줄 기반) */}
                  {[
                    { emp: "박지현", empId: "e1", day1: 4, day2: 5 },
                    { emp: "김태훈", empId: "e2", day1: 9, day2: 10 },
                    { emp: "박지현", empId: "e1", day1: 11, day2: 12 },
                    { emp: "김태훈", empId: "e2", day1: 16, day2: 17 },
                    { emp: "박지현", empId: "e1", day1: 18, day2: 19 },
                    { emp: "김태훈", empId: "e2", day1: 23, day2: 24 },
                    { emp: "박지현", empId: "e1", day1: 24, day2: 25 },
                    { emp: "김태훈", empId: "e2", day1: 30, day2: 31 },
                  ].map((item, idx) => (
                    <WarningCard
                      key={idx}
                      type="advisory"
                      title="위험 조합 발생"
                      employee={item.emp}
                      date={`3월 ${item.day1}일 A13 → 3월 ${item.day2}일 M07`}
                      description="휴식 간격 부족 위험"
                      action="다음날 오전조 제외 권장"
                      onViewInTable={() => scrollToCell(item.empId, item.day1, [{ empId: item.empId, day: item.day2 }])}
                    />
                  ))}
                  
                  {/* 14일 4휴무 부족 */}
                  <WarningCard
                    type="advisory"
                    title="14일 4휴무 부족"
                    employee="김태훈"
                    date="3월 10일 ~ 3월 23일"
                    description="휴무 3회 (기준 대비 1회 부족)"
                    action="OFF 1회 추가 권장"
                    onViewInTable={() => scrollToCell("e2", 10)}
                  />
                  
                  {/* 6일 이상 연속근무 */}
                  <WarningCard
                    type="advisory"
                    title="6일 이상 연속근무"
                    employee="박지현"
                    date="3월 3일 ~ 3월 9일 (7일 연속)"
                    description="연속근무 기간 과다"
                    action="중간 휴무 추가 권장"
                    onViewInTable={() => scrollToCell("e1", 3)}
                  />
                  
                  {/* 신규 야간조 진입자 전환 휴식 부족 */}
                  <WarningCard
                    type="advisory"
                    title="신규 야간조 진입자 전환 휴식 부족"
                    employee="정우진"
                    date="2월 28일 또는 3월 1일"
                    description="다음 달 야간조 신규 진입자가 전환 전 휴식을 받지 않음"
                    action="전월 말일 또는 익월 첫날 OFF 권장"
                    onViewInTable={() => scrollToCell("e5", 1)}
                  />
                </div>
              )}

              {warningActiveTab === "fairness" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* 고강도 근무 — 김태훈 */}
                  <FairnessIssueCard
                    cardRef={(el) => { if (el) fairnessCardRefs.current.set("김태훈", el); else fairnessCardRefs.current.delete("김태훈"); }}
                    isOpen={fairnessExpandedEmployee === "김태훈"}
                    onToggle={() => setFairnessExpandedEmployee(prev => prev === "김태훈" ? null : "김태훈")}
                    isFromDashboard={fairnessDashboardHighlight === "김태훈"}
                    employee="김태훈"
                    issueType="A13 다음날 M07 발생"
                    totalCount={2}
                    riskLevel="높음"
                    lastOccurrence="4월 10일"
                    incidents={[
                      {
                        date: "4월 9일",
                        type: "A13 (오후조)",
                        status: "발생",
                        reason: "오후조 다음날 오전조 배정",
                        cellRef: { empId: "e2", day: 9 },
                      },
                      {
                        date: "4월 10일",
                        type: "M07 (오전조)",
                        status: "발생",
                        reason: "A13 다음날 오전조 연속",
                        cellRef: { empId: "e2", day: 10 },
                      },
                    ]}
                    onViewInTable={scrollToCell}
                  />

                  {/* 주말 휴무 편중 — 박지현 */}
                  <FairnessIssueCard
                    cardRef={(el) => { if (el) fairnessCardRefs.current.set("박지현", el); else fairnessCardRefs.current.delete("박지현"); }}
                    isOpen={fairnessExpandedEmployee === "박지현"}
                    onToggle={() => setFairnessExpandedEmployee(prev => prev === "박지현" ? null : "박지현")}
                    isFromDashboard={fairnessDashboardHighlight === "박지현"}
                    employee="박지현"
                    issueType="주말 휴무 부족"
                    totalCount={3}
                    riskLevel="중간"
                    lastOccurrence="4월 19일"
                    incidents={[
                      {
                        date: "4월 5일(토)",
                        type: "주말 근무",
                        status: "배정됨",
                        reason: "주말 휴무 편중",
                        cellRef: { empId: "e1", day: 5 },
                      },
                      {
                        date: "4월 12일(토)",
                        type: "주말 근무",
                        status: "배정됨",
                        reason: "주말 휴무 편중",
                        cellRef: { empId: "e1", day: 12 },
                      },
                      {
                        date: "4월 19일(토)",
                        type: "주말 근무",
                        status: "배정됨",
                        reason: "주말 휴무 편중",
                        cellRef: { empId: "e1", day: 19 },
                      },
                    ]}
                    onViewInTable={scrollToCell}
                  />

                  {/* 회복 반영 예외 — 오세영 */}
                  <FairnessIssueCard
                    cardRef={(el) => { if (el) fairnessCardRefs.current.set("오세영", el); else fairnessCardRefs.current.delete("오세영"); }}
                    isOpen={fairnessExpandedEmployee === "오세영"}
                    onToggle={() => setFairnessExpandedEmployee(prev => prev === "오세영" ? null : "오세영")}
                    isFromDashboard={fairnessDashboardHighlight === "오세영"}
                    employee="오세영"
                    issueType="회복 반영 예외"
                    totalCount={1}
                    riskLevel="중간"
                    lastOccurrence="4월 3일"
                    incidents={[
                      {
                        date: "4월 2일~3일",
                        type: "예외 배치",
                        status: "발생",
                        reason: "최소 인원 유지로 회복 완화 미적용",
                        cellRef: { empId: "e7", day: 2 },
                      },
                    ]}
                    onViewInTable={scrollToCell}
                  />

                  {/* 근태 신청 미반영 — 이수진 */}
                  <FairnessIssueCard
                    cardRef={(el) => { if (el) fairnessCardRefs.current.set("이수진", el); else fairnessCardRefs.current.delete("이수진"); }}
                    isOpen={fairnessExpandedEmployee === "이수진"}
                    onToggle={() => setFairnessExpandedEmployee(prev => prev === "이수진" ? null : "이수진")}
                    isFromDashboard={fairnessDashboardHighlight === "이수진"}
                    employee="이수진"
                    issueType="근태 신청 미반영 반복"
                    totalCount={2}
                    riskLevel="중간"
                    lastOccurrence="4월 15일"
                    incidents={[
                      {
                        date: "4월 8일",
                        type: "쉬는 날 희망",
                        status: "미반영",
                        reason: "최소 인원 부족",
                        cellRef: { empId: "e3", day: 8 },
                      },
                      {
                        date: "4월 15일",
                        type: "쉬는 날 희망",
                        status: "미반영",
                        reason: "운영 커버리지 부족",
                        cellRef: { empId: "e3", day: 15 },
                      },
                    ]}
                    onViewInTable={scrollToCell}
                  />

                  {/* 야간조 편중 — 최민서 */}
                  <FairnessIssueCard
                    cardRef={(el) => { if (el) fairnessCardRefs.current.set("최민서", el); else fairnessCardRefs.current.delete("최민서"); }}
                    isOpen={fairnessExpandedEmployee === "최민서"}
                    onToggle={() => setFairnessExpandedEmployee(prev => prev === "최민서" ? null : "최민서")}
                    isFromDashboard={fairnessDashboardHighlight === "최민서"}
                    employee="최민서"
                    issueType="야간조 편중"
                    totalCount={3}
                    riskLevel="높음"
                    lastOccurrence="4월 21일"
                    incidents={[
                      {
                        date: "4월 7일",
                        type: "N22 (야간조)",
                        status: "발생",
                        reason: "야간조 반복 배정",
                        cellRef: { empId: "e10", day: 7 },
                      },
                      {
                        date: "4월 14일",
                        type: "N22 (야간조)",
                        status: "발생",
                        reason: "야간조 반복 배정",
                        cellRef: { empId: "e10", day: 14 },
                      },
                      {
                        date: "4월 21일",
                        type: "N22 (야간조)",
                        status: "발생",
                        reason: "야간조 반복 배정",
                        cellRef: { empId: "e10", day: 21 },
                      },
                    ]}
                    onViewInTable={scrollToCell}
                  />

                  {/* 연속근무 — 정우진 */}
                  <FairnessIssueCard
                    cardRef={(el) => { if (el) fairnessCardRefs.current.set("정우진", el); else fairnessCardRefs.current.delete("정우진"); }}
                    isOpen={fairnessExpandedEmployee === "정우진"}
                    onToggle={() => setFairnessExpandedEmployee(prev => prev === "정우진" ? null : "정우진")}
                    isFromDashboard={fairnessDashboardHighlight === "정우진"}
                    employee="정우진"
                    issueType="5일 이상 연속근무 반복"
                    totalCount={2}
                    riskLevel="높음"
                    lastOccurrence="4월 18일"
                    incidents={[
                      {
                        date: "4월 13일~18일",
                        type: "연속근무 6일",
                        status: "발생",
                        reason: "6일 이상 연속근무",
                        cellRef: { empId: "e4", day: 13 },
                      },
                    ]}
                    onViewInTable={scrollToCell}
                  />

                  {/* 연간 야간조 계획 미반영 — 한지우 */}
                  <FairnessIssueCard
                    cardRef={(el) => { if (el) fairnessCardRefs.current.set("한지우", el); else fairnessCardRefs.current.delete("한지우"); }}
                    isOpen={fairnessExpandedEmployee === "한지우"}
                    onToggle={() => setFairnessExpandedEmployee(prev => prev === "한지우" ? null : "한지우")}
                    isFromDashboard={fairnessDashboardHighlight === "한지우"}
                    employee="한지우"
                    issueType="연간 야간조 계획 미반영"
                    totalCount={1}
                    riskLevel="중간"
                    lastOccurrence="4월 14일"
                    incidents={[
                      {
                        date: "4월 14일",
                        type: "연간 계획 우선 대상",
                        status: "미반영",
                        reason: "실제 근무표에 반영되지 않음",
                        cellRef: { empId: "e6", day: 14 },
                      },
                    ]}
                    onViewInTable={scrollToCell}
                  />

                  {/* 공휴일 휴무 부족 — 김소라 */}
                  <FairnessIssueCard
                    cardRef={(el) => { if (el) fairnessCardRefs.current.set("김소라", el); else fairnessCardRefs.current.delete("김소라"); }}
                    isOpen={fairnessExpandedEmployee === "김소라"}
                    onToggle={() => setFairnessExpandedEmployee(prev => prev === "김소라" ? null : "김소라")}
                    isFromDashboard={fairnessDashboardHighlight === "김소라"}
                    employee="김소라"
                    issueType="공휴일 휴무 부족"
                    totalCount={2}
                    riskLevel="중간"
                    lastOccurrence="4월 30일"
                    incidents={[
                      {
                        date: "4월 5일(공휴)",
                        type: "공휴 근무",
                        status: "배정됨",
                        reason: "공휴일 휴무 편중",
                        cellRef: { empId: "e5", day: 5 },
                      },
                      {
                        date: "4월 30일(공휴)",
                        type: "공휴 근무",
                        status: "배정됨",
                        reason: "공휴일 휴무 편중",
                        cellRef: { empId: "e5", day: 30 },
                      },
                    ]}
                    onViewInTable={scrollToCell}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 새 모달: 알림 발송 ───────────────────────────── */}
        <NotificationSendModal
          isOpen={notifSendOpen}
          onClose={() => setNotifSendOpen(false)}
          targetMonth={selectedMonth}
          version={currentVersionId}
          scheduleStatus={currentVersion?.isFinalized ? "확정" : "작업 중"}
          hotel="롯데시티호텔 마포"
          department="프런트 오피스"
          allEmployees={allEmployeesForNotif}
          changedEmployees={allEmployeesForNotif.slice(0, 3)}
          onSend={() => {
            setNotifSendOpen(false);
            showToast({ type: "success", title: "알림 발송 완료", message: "선택한 직원에게 알림을 발송했습니다." });
          }}
        />

        {/* ── 새 모달: 발송 이력 ───────────────────────────── */}
        <NotificationHistoryModal
          isOpen={notifHistoryOpen}
          onClose={() => setNotifHistoryOpen(false)}
          history={notificationHistory}
        />

        {/* ── 새 모달: 전월 근무강도 회복 반영 결과 ────────── */}
        <IntensityRecoveryModal
          isOpen={intensityRecoveryOpen}
          onClose={() => setIntensityRecoveryOpen(false)}
          year={parseInt(selectedMonth.split("-")[0])}
          month={parseInt(selectedMonth.split("-")[1])}
          analyses={intensityAnalyses}
          reflectionResults={intensityReflectionResults}
        />

      {/* ── 월별 근무표 탭 종료 ─────────────────────────────── */}
      </>)}

      {/* ── 연간 야간조 계획 탭 ─────────────────────────────── */}
      {activeTab === "annual" && (
        <AnnualNightShiftPlanContent />
      )}

    </div>
  );

  // ── 실제 return ───────────────────────────────────────────
  return (
    <>
      {/* 전체화면이 아닐 때: AppLayout 안에서 렌더 */}
      {!isFullScreen && (
        <AppLayout>
          {mainContent}
        </AppLayout>
      )}

      {/* 전체화면일 때: fixed overlay에서 렌더 */}
      {isFullScreen && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          backgroundColor: C.bg,
        }}>
          {mainContent}
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   공정성 이슈 카드 컴포넌트 (요약 + 펼침형)
══════════════════════════════════════════════════════════ */
interface FairnessIncident {
  date: string;
  type: string;
  status: string;
  reason: string;
  cellRef: { empId: string; day: number };
}

interface FairnessIssueCardProps {
  employee: string;
  issueType: string;
  totalCount: number;
  riskLevel: "높음" | "중간" | "낮음";
  lastOccurrence: string;
  excludedFromFairness?: boolean;
  exclusionReason?: string;
  incidents: FairnessIncident[];
  onViewInTable: (empId: string, day: number) => void;
  /** 부모가 제어하는 펼침 상태 */
  isOpen: boolean;
  /** 사용자 클릭 시 토글 콜백 */
  onToggle: () => void;
  /** 대시보드에서 이동 시 강조 표시 (펼침 상태와 독립) */
  isFromDashboard?: boolean;
  /** 패널 내 스크롤 대상 ref */
  cardRef?: (el: HTMLDivElement | null) => void;
}

function FairnessIssueCard({
  employee,
  issueType,
  totalCount,
  riskLevel,
  lastOccurrence,
  excludedFromFairness,
  exclusionReason,
  incidents,
  onViewInTable,
  isOpen,
  onToggle,
  isFromDashboard = false,
  cardRef,
}: FairnessIssueCardProps) {
  const isExpanded = isOpen;

  const riskStyles = {
    "높음": { color: C.risk, bg: "rgba(184,50,50,0.08)" },
    "중간": { color: C.warning, bg: "rgba(184,124,26,0.08)" },
    "낮음": { color: C.ok, bg: "rgba(46,125,82,0.08)" },
  };

  const riskStyle = riskStyles[riskLevel];

  return (
    <div
      ref={cardRef}
      style={{
        backgroundColor: C.white,
        border: isFromDashboard ? `2px solid ${C.gold}` : `1px solid ${C.goldBorder}`,
        borderRadius: 6,
        overflow: "hidden",
        boxShadow: isFromDashboard ? `0 0 0 3px rgba(185,155,90,0.12)` : undefined,
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* 대시보드에서 이동 배지 */}
      {isFromDashboard && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 16px",
          backgroundColor: "rgba(185,155,90,0.10)",
          borderBottom: `1px solid rgba(185,155,90,0.2)`,
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 600, color: C.gold, letterSpacing: "0.04em" }}>
            대시보드에서 이동
          </span>
        </div>
      )}
      {/* 요약 카드 헤더 */}
      <div
        onClick={onToggle}
        style={{
          padding: "14px 16px",
          backgroundColor: C.goldBg,
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(185,155,90,0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = C.goldBg;
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>
              {employee}
            </span>
            <span style={{
              fontSize: 9,
              padding: "3px 8px",
              backgroundColor: riskStyle.bg,
              color: riskStyle.color,
              borderRadius: 3,
              fontWeight: 600,
            }}>
              {riskLevel}
            </span>
            {excludedFromFairness && (
              <span style={{
                fontSize: 9,
                padding: "3px 8px",
                backgroundColor: C.okBg,
                color: C.ok,
                borderRadius: 3,
                fontWeight: 600,
              }}>
                공정성 계산 제외
              </span>
            )}
          </div>
          
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={C.gold}
            strokeWidth="2"
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        <div style={{ fontSize: 11, color: C.gold, fontWeight: 600, marginBottom: 6 }}>
          {issueType}
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 10, color: C.charcoal }}>
          <div>
            <span style={{ fontWeight: 500, color: C.muted }}>총 발생:</span> {totalCount}회
          </div>
          <div>
            <span style={{ fontWeight: 500, color: C.muted }}>최근:</span> {lastOccurrence}
          </div>
        </div>

        {excludedFromFairness && exclusionReason && (
          <div style={{
            marginTop: 8,
            fontSize: 9,
            color: C.ok,
            padding: "6px 10px",
            backgroundColor: "rgba(46,125,82,0.06)",
            borderRadius: 3,
          }}>
            {exclusionReason}
          </div>
        )}
      </div>

      {/* 개별 발생건 상세 리스트 */}
      {isExpanded && (
        <div style={{
          padding: "12px 16px",
          backgroundColor: C.white,
          borderTop: `1px solid ${C.borderLight}`,
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 600,
            color: C.muted,
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            개별 발생건 ({totalCount}건)
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {incidents.map((incident, idx) => (
              <div
                key={idx}
                style={{
                  padding: "10px 12px",
                  backgroundColor: "#FAFAF8",
                  border: `1px solid ${C.borderLight}`,
                  borderRadius: 4,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.navy, marginBottom: 4 }}>
                      {incident.date}
                    </div>
                    <div style={{ fontSize: 10, color: C.charcoal, marginBottom: 2 }}>
                      <span style={{ fontWeight: 500, color: C.muted }}>유형:</span> {incident.type}
                    </div>
                    <div style={{ fontSize: 10, color: C.charcoal, marginBottom: 2 }}>
                      <span style={{ fontWeight: 500, color: C.muted }}>상태:</span> {incident.status}
                    </div>
                    <div style={{ fontSize: 10, color: C.charcoal }}>
                      <span style={{ fontWeight: 500, color: C.muted }}>사유:</span> {incident.reason}
                    </div>
                  </div>

                  <button
                    onClick={() => onViewInTable(incident.cellRef.empId, incident.cellRef.day)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: C.white,
                      color: C.navy,
                      border: `1px solid ${C.border}`,
                      borderRadius: 3,
                      fontSize: 10,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      whiteSpace: "nowrap",
                      marginLeft: 12,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = C.gold;
                      e.currentTarget.style.backgroundColor = "#FEFDFB";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.backgroundColor = C.white;
                    }}
                  >
                    표에서 보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   경고 카드 컴포넌트
══════════════════════════════════════════════════════════ */
interface WarningCardProps {
  type: "critical" | "advisory" | "fairness";
  title: string;
  employee?: string;
  date?: string;
  shift?: string;
  description: string;
  action: string;
  onViewInTable: () => void;
}

function WarningCard({ type, title, employee, date, shift, description, action, onViewInTable }: WarningCardProps) {
  const typeStyles = {
    critical: { bg: C.riskBg, border: C.riskBorder, color: C.risk },
    advisory: { bg: C.warnBg, border: "rgba(184,124,26,0.25)", color: C.warning },
    fairness: { bg: C.goldBg, border: "rgba(185,155,90,0.25)", color: C.gold },
  };
  const style = typeStyles[type];

  return (
    <div style={{
      padding: "14px 16px",
      backgroundColor: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 4,
    }}>
      <div style={{ fontSize: 11.5, color: style.color, fontWeight: 600, marginBottom: 8 }}>
        {title}
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
        {employee && (
          <div style={{ fontSize: 10, color: C.charcoal }}>
            <span style={{ fontWeight: 500, color: C.muted }}>직원:</span> {employee}
          </div>
        )}
        {date && (
          <div style={{ fontSize: 10, color: C.charcoal }}>
            <span style={{ fontWeight: 500, color: C.muted }}>날짜:</span> {date}
          </div>
        )}
        {shift && (
          <div style={{ fontSize: 10, color: C.charcoal }}>
            <span style={{ fontWeight: 500, color: C.muted }}>조:</span> {shift}
          </div>
        )}
        <div style={{ fontSize: 10, color: C.charcoal }}>
          <span style={{ fontWeight: 500, color: C.muted }}>상세:</span> {description}
        </div>
        <div style={{ fontSize: 10, color: C.charcoal }}>
          <span style={{ fontWeight: 500, color: C.muted }}>권장 조치:</span> {action}
        </div>
      </div>
      
      <button
        onClick={onViewInTable}
        style={{
          width: "100%",
          padding: "7px 12px",
          backgroundColor: C.white,
          color: C.navy,
          border: `1px solid ${C.border}`,
          borderRadius: 3,
          fontSize: 11,
          fontWeight: 500,
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = C.gold;
          (e.currentTarget as HTMLElement).style.backgroundColor = "#FEFDFB";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = C.border;
          (e.currentTarget as HTMLElement).style.backgroundColor = C.white;
        }}
      >
        표에서 보기
      </button>
    </div>
  );
}