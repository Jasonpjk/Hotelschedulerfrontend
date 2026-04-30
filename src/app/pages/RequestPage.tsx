import { useState, useEffect } from "react";
import type React from "react";
import AppLayout from "../components/layout/AppLayout";
import { useAttendanceDeadline } from "../context/AttendanceDeadlineContext";
import { Info } from "lucide-react";
import { useToast } from "../context/ToastContext";

/* ══════════════════════════════════════════════════════════
   COLOR TOKENS
══════════════════════════════════════════════════════════ */
const C = {
  navy:        "#0D1B2A",
  navyDeep:    "#091523",
  gold:        "#B99B5A",
  goldBg:      "rgba(185,155,90,0.08)",
  goldBorder:  "rgba(185,155,90,0.25)",
  bg:          "#F2EFE9",
  white:       "#FFFFFF",
  border:      "#E4DED4",
  borderLight: "#EDE8E0",
  muted:       "#7B8390",
  charcoal:    "#2E3642",
  text:        "#1C2430",
  ok:          "#2E7D52",
  okBg:        "rgba(46,125,82,0.07)",
  okBorder:    "rgba(46,125,82,0.2)",
  warning:     "#B87C1A",
  warnBg:      "rgba(184,124,26,0.08)",
  warnBorder:  "rgba(184,124,26,0.22)",
  pending:     "#5E7FA3",
  pendingBg:   "rgba(94,127,163,0.08)",
  pendingBorder: "rgba(94,127,163,0.22)",
  risk:        "#B83232",
  riskBg:      "rgba(184,50,50,0.06)",
  riskBorder:  "rgba(184,50,50,0.22)",
  rowAlt:      "#FAFAF8",
};

/* ══════════════════════════════════════════════════════════
   TYPE DEFINITIONS
══════════════════════════════════════════════════════════ */
type RequestIntention = "쉬는 날 희망" | "주말 근무 희망" | "공휴 근무 희망" | "신청 없음" | "휴가 신청" | "교육 신청" | "병가 신청"; // 신청 의사
type FinalType = "휴가" | "SL" | "연차" | "EDU" | "SICK" | "미반영"; // 최종 반영 결과
type RequestStatus = "신청 접수" | "승인 대기" | "승인 완료" | "자동 반영 가능" | "자동 반영 완료" | "검토 필요" | "반영 불가" | "반려" | "신청 취소";

interface MyRequest {
  id: number;
  date: string; // 단일 날짜 또는 기간
  intention?: RequestIntention; // 신청 의사 ("신청 없음"의 경우 시스템 자동 배정)
  finalType?: FinalType; // 최종 반영 유형
  reason: string;
  status: RequestStatus;
  createdAt: string;
  note?: string; // 시스템 메시지 (운영상 사유 등)
  adjustmentReason?: string; // 반영 조정 사유
  isSystemAssigned?: boolean; // 시스템 자동 배정 여부 (직원이 신청하지 않았는데 배정된 경우)
  // 교육 신청 관련
  educationCategory?: "사내" | "사외" | "법정" | "기타";
  educationTitle?: string;
  educationIsFullDay?: boolean;
  educationStartTime?: string;
  educationEndTime?: string;
  // 병가 신청 관련
  sickLeaveIsHalfDay?: boolean;
  attachmentCount?: number;
}

interface EmployeeBalance {
  vacationTotal: number;    // 휴가 총
  vacation: number;         // 휴가 잔여
  annualLeaveTotal: number; // 연차 총
  annualLeave: number;      // 연차 잔여
  hoTotalDays: number;      // 올해 전체 공휴일 수
  hoUsedDays: number;       // 실제 HO로 쉰 일수
}

interface VacationPlan {
  id: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  vacationDays: number;
  annualLeaveDays: number;
  offDays: number;
  reason: string;
  status: RequestStatus;
  createdAt: string;
}

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */
// 현재 로그인한 사용자 정보 (임시)
const CURRENT_USER = {
  name: "이서연",
  gender: "여" as "남" | "여", // 여직원
};

const INITIAL_BALANCE: EmployeeBalance = {
  vacationTotal: 15,
  vacation: 5,
  annualLeaveTotal: 15,
  annualLeave: 12,
  hoTotalDays: 15,  // 올해 전체 공휴일 수
  hoUsedDays: 4,    // 실제 HO로 쉰 일수
};

const MOCK_REQUESTS: MyRequest[] = [
  // 여직원이 신청한 쉬는 날 희망 → 시스템이 SL로 자동 반영
  {
    id: 1,
    date: "2026-04-15",
    intention: "쉬는 날 희망",
    finalType: "SL",
    reason: "개인 사유",
    status: "자동 반영 완료",
    createdAt: "2026-03-20",
    adjustmentReason: "여직원의 월 1회 SL 사용 가능 정책에 따라 SL(여성 보건휴가)로 자동 반영되었습니다.",
  },
  // 여직원이 신청한 쉬는 날 희망 → 이미 SL 사용했으므로 연차로 자동 반영
  {
    id: 2,
    date: "2026-04-16",
    intention: "쉬는 날 희망",
    finalType: "연차",
    reason: "개인 사유",
    status: "자동 반영 완료",
    createdAt: "2026-03-20",
    adjustmentReason: "이번 달 SL은 이미 사용되어 연차로 자동 반영되었습니다.",
  },
  // 여직원이 신청했지만 인원 부족으로 미반영
  {
    id: 3,
    date: "2026-04-22",
    intention: "쉬는 날 희망",
    finalType: "미반영",
    reason: "",
    status: "검토 필요",
    createdAt: "2026-03-18",
    note: "해당 날짜는 최소 운영 인원 부족으로 관리자 검토가 필요합니다.",
    adjustmentReason: "신청 인원 초과로 자동 반영이 불가했습니다.",
  },
  // 여직원이 신청한 쉬는 날 희망 → 연차로 자동 반영
  {
    id: 4,
    date: "2026-04-10",
    intention: "쉬는 날 희망",
    finalType: "연차",
    reason: "개인 일정",
    status: "자동 반영 완료",
    createdAt: "2026-04-09",
    adjustmentReason: "연차로 자동 반영되었습니다.",
  },
  // 주말 근무 희망 신청
  {
    id: 5,
    date: "2026-04",
    intention: "주말 근무 희망",
    reason: "",
    status: "신청 접수",
    createdAt: "2026-03-25",
  },
  // 여직원이 신청하지 않았는데 시스템이 자동으로 SL 배정 (인원 과다 + 월 1회 SL 가능)
  {
    id: 6,
    date: "2026-04-05",
    intention: "신청 없음",
    finalType: "SL",
    reason: "",
    status: "자동 반영 완료",
    createdAt: "2026-03-01",
    isSystemAssigned: true,
    adjustmentReason: "적정 인원 대비 근무 인원 과다로 SL을 배정했습니다. (여직원 월 1회 SL 사용 가능 정책 적용)",
  },
  // 여직원이 신청하지 않았는데 시스템이 자동으로 연차 배정 (인원 과다, SL 이미 사용)
  {
    id: 7,
    date: "2026-04-12",
    intention: "신청 없음",
    finalType: "연차",
    reason: "",
    status: "자동 반영 완료",
    createdAt: "2026-03-01",
    isSystemAssigned: true,
    adjustmentReason: "적정 인원 대비 근무 인원 과다로 연차를 배정했습니다. (이번 달 SL 이미 사용)",
  },
  // 여직원이 신청하지 않았는데 시스템이 자동으로 SL 배정
  {
    id: 8,
    date: "2026-04-19",
    intention: "신청 없음",
    finalType: "SL",
    reason: "",
    status: "자동 반영 완료",
    createdAt: "2026-03-01",
    isSystemAssigned: true,
    adjustmentReason: "적정 인원 대비 근무 인원 과다로 SL을 배정했습니다.",
  },
  // 교육 신청 예시
  {
    id: 9,
    date: "2026-04-20",
    intention: "교육 신청",
    finalType: "EDU",
    reason: "고객 서비스 향상 교육 참석",
    status: "승인 완료",
    createdAt: "2026-04-08",
    educationCategory: "사내",
    educationTitle: "고객 응대 및 서비스 마인드 향상 교육",
    educationIsFullDay: true,
    attachmentCount: 1,
  },
  // 병가 신청 예시
  {
    id: 10,
    date: "2026-04-23",
    intention: "병가 신청",
    finalType: "SICK",
    reason: "건강검진",
    status: "승인 대기",
    createdAt: "2026-04-09",
    sickLeaveIsHalfDay: true,
    attachmentCount: 1,
  },
];

const MOCK_VACATION_PLANS: VacationPlan[] = [
  {
    id: 1,
    startDate: "2026-08-10",
    endDate: "2026-08-16",
    totalDays: 7,
    vacationDays: 3,
    annualLeaveDays: 2,
    offDays: 2,
    reason: "여름 휴가",
    status: "자동 반영 완료",
    createdAt: "2026-03-15",
  },
];

/* ══════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
══════════════════════════════════════════════════════════ */
function getStatusBadge(status: RequestStatus) {
  const map: Record<RequestStatus, { bg: string; color: string; border: string; label: string }> = {
    "신청 접수": { bg: C.pendingBg, color: C.pending, border: C.pendingBorder, label: "신청 접수" },
    "승인 대기": { bg: C.pendingBg, color: C.pending, border: C.pendingBorder, label: "승인 대기" },
    "승인 완료": { bg: C.okBg, color: C.ok, border: C.okBorder, label: "승인 완료" },
    "자동 반영 가능": { bg: C.okBg, color: C.ok, border: C.okBorder, label: "자동 반영 가능" },
    "자동 반영 완료": { bg: C.okBg, color: C.ok, border: C.okBorder, label: "자동 반영 완료" },
    "검토 필요": { bg: C.warnBg, color: C.warning, border: C.warnBorder, label: "검토 필요" },
    "반영 불가": { bg: C.riskBg, color: C.risk, border: C.riskBorder, label: "반영 불가" },
    "반려": { bg: C.riskBg, color: C.risk, border: C.riskBorder, label: "반려" },
    "신청 취소": { bg: "rgba(123,131,144,0.1)", color: "#5A6574", border: "rgba(123,131,144,0.25)", label: "신청 취소" },
  };
  const s = map[status];
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      fontSize: 10,
      fontWeight: 600,
      borderRadius: 3,
      backgroundColor: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

function getIntentionBadge(intention?: RequestIntention) {
  if (!intention) return <span style={{ fontSize: 10, color: C.muted }}>—</span>;

  const map: Record<RequestIntention, { bg: string; color: string; border: string }> = {
    "쉬는 날 희망": { bg: C.pendingBg, color: C.pending, border: C.pendingBorder },
    "주말 근무 희망": { bg: C.okBg, color: C.ok, border: C.okBorder },
    "공휴 근무 희망": { bg: C.okBg, color: C.ok, border: C.okBorder },
    "신청 없음": { bg: "rgba(123,131,144,0.1)", color: "#5A6574", border: "rgba(123,131,144,0.25)" },
    "휴가 신청": { bg: C.goldBg, color: C.gold, border: C.goldBorder },
    "교육 신청": { bg: "#E8F3FA", color: "#1A5A8A", border: "#A8CEE8" },
    "병가 신청": { bg: "#FFF0E6", color: "#CC5500", border: "#FFB380" },
  };
  const s = map[intention];
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      fontSize: 10,
      fontWeight: 600,
      borderRadius: 3,
      backgroundColor: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      {intention}
    </span>
  );
}

function getFinalTypeBadge(finalType?: FinalType) {
  if (!finalType) return <span style={{ fontSize: 10, color: C.muted }}>—</span>;

  const colorMap: Record<FinalType, { bg: string; color: string; border: string }> = {
    "연차": { bg: C.okBg, color: C.ok, border: C.okBorder },
    "휴가": { bg: C.goldBg, color: "#7A5518", border: C.goldBorder },
    "SL": { bg: C.warnBg, color: C.warning, border: C.warnBorder },
    "EDU": { bg: "#E8F3FA", color: "#1A5A8A", border: "#A8CEE8" },
    "SICK": { bg: "#FFF0E6", color: "#CC5500", border: "#FFB380" },
    "미반영": { bg: "rgba(123,131,144,0.1)", color: "#5A6574", border: "rgba(123,131,144,0.25)" },
  };
  const s = colorMap[finalType];
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      fontSize: 10,
      fontWeight: 600,
      borderRadius: 3,
      backgroundColor: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      {finalType}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL COMPONENT
══════════════════════════════════════════════════════════ */
function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = 600,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: number;
}) {
  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      overflow: "auto",
      padding: "40px 20px",
    }}>
      <div style={{
        backgroundColor: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 4,
        maxWidth: width,
        width: "100%",
        maxHeight: "90vh",
        overflow: "auto",
        margin: "auto",
      }}>
        <div style={{
          padding: 20,
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: "#FAFAF8",
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: C.navy,
            fontFamily: "'Cormorant Garamond', serif",
            marginBottom: description ? 6 : 0,
          }}>
            {title}
          </h3>
          {description && (
            <p style={{
              fontSize: 11,
              color: C.muted,
              fontFamily: "'Inter', sans-serif",
            }}>
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   달력 컴포넌트 (다중 날짜 선택)
══════════════════════════════════════════════════════════ */
function Calendar({
  selectedDates,
  onDateToggle,
  year,
  month,
  warningDates = [],
}: {
  selectedDates: string[];
  onDateToggle: (date: string) => void;
  year: number;
  month: number;
  warningDates?: string[];
}) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      borderRadius: 4,
      overflow: "hidden",
    }}>
      {/* 요일 헤더 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        backgroundColor: "#F7F4EF",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
          <div
            key={i}
            style={{
              padding: "8px",
              textAlign: "center",
              fontSize: 10,
              fontWeight: 600,
              color: i === 0 ? C.risk : i === 6 ? C.pending : C.muted,
              letterSpacing: "0.02em",
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      {weeks.map((week, weekIdx) => (
        <div
          key={weekIdx}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            borderBottom: weekIdx < weeks.length - 1 ? `1px solid ${C.borderLight}` : "none",
          }}
        >
          {week.map((day, dayIdx) => {
            if (!day) {
              return (
                <div
                  key={dayIdx}
                  style={{
                    padding: "12px",
                    backgroundColor: C.bg,
                  }}
                />
              );
            }

            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isSelected = selectedDates.includes(dateStr);
            const hasWarning = warningDates.includes(dateStr);
            const isSunday = dayIdx === 0;
            const isSaturday = dayIdx === 6;

            return (
              <button
                key={dayIdx}
                onClick={() => onDateToggle(dateStr)}
                style={{
                  padding: "12px",
                  border: "none",
                  backgroundColor: isSelected ? C.navy : C.white,
                  cursor: "pointer",
                  borderRight: dayIdx < 6 ? `1px solid ${C.borderLight}` : "none",
                  transition: "all 0.15s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = C.bg;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = C.white;
                  }
                }}
              >
                <div style={{
                  fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? "#EAE0CC" : isSunday ? C.risk : isSaturday ? C.pending : C.charcoal,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  {day}
                </div>
                {isSelected && (
                  <div style={{
                    position: "absolute",
                    bottom: 4,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    backgroundColor: C.gold,
                  }} />
                )}
                {hasWarning && !isSelected && (
                  <div style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: C.warning,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   일반 근태 신청 모달 (쉬는 날 희망 제출)
══════════════════════════════════════════════════════════ */
function CreateRequestModal({
  open,
  onClose,
  onCreate,
  balance,
  year,
  month,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (dates: string[], reason: string) => void;
  balance: EmployeeBalance;
  year: number;
  month: number;
}) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [reason, setReason] = useState("");

  // 최대 인원 초과 날짜 (예시: 4월 22일)
  const warningDates = ["2026-04-22"];

  const handleDateToggle = (date: string) => {
    setSelectedDates(prev =>
      prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date].sort()
    );
  };

  const handleCreate = () => {
    if (selectedDates.length > 0) {
      onCreate(selectedDates, reason);
      // Reset
      setSelectedDates([]);
      setReason("");
      onClose();
    }
  };

  const canCreate = selectedDates.length > 0;
  const hasWarningDate = selectedDates.some(d => warningDates.includes(d));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="쉬는 날 희망 신청"
      description="쉬고 싶은 날짜를 달력에서 선택해주세요. 여러 날짜를 동시에 선택할 수 있습니다."
      width={720}
    >
      <div style={{ padding: 24 }}>
        {/* 잔여 수량 (참고) */}
        <div style={{
          padding: 16,
          backgroundColor: C.bg,
          borderRadius: 4,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 12 }}>
            내 잔여 수량 <span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>(참고)</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>휴가 잔여</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
                {balance.vacationTotal}일 중 {balance.vacation}일
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>연차 잔여</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
                {balance.annualLeaveTotal}일 중 {balance.annualLeave}일
              </div>
            </div>
          </div>
        </div>

        {/* 달력 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 8 }}>
            날짜 선택 *
          </label>
          <Calendar
            selectedDates={selectedDates}
            onDateToggle={handleDateToggle}
            year={year}
            month={month}
            warningDates={warningDates}
          />
        </div>

        {/* 선택된 날짜 목록 */}
        {selectedDates.length > 0 && (
          <div style={{
            padding: 12,
            backgroundColor: C.goldBg,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 4,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#7A5518", marginBottom: 6 }}>
              선택된 날짜 ({selectedDates.length}일)
            </div>
            <div style={{ fontSize: 11, color: C.charcoal, lineHeight: 1.6 }}>
              {selectedDates.join(", ")}
            </div>
          </div>
        )}

        {/* 최대 인원 초과 경고 */}
        {hasWarningDate && (
          <div style={{
            padding: 12,
            backgroundColor: C.warnBg,
            border: `1px solid ${C.warnBorder}`,
            borderRadius: 4,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, color: C.warning, lineHeight: 1.6 }}>
              ⚠️ 선택한 날짜 중 일부는 이미 휴무 가능 인원이 가득 차 있어 반영이 어려울 수 있습니다. 관리자에게 문의해주세요.
            </div>
          </div>
        )}

        {/* 사유 (선택) */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
            사유 <span style={{ color: C.muted, fontWeight: 400 }}>(선택)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="사유를 입력해주세요 (선택)"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              fontSize: 11,
              fontFamily: "'Inter', sans-serif",
              resize: "vertical",
              minHeight: 60,
            }}
          />
        </div>

        <div style={{
          padding: 12,
          backgroundColor: C.pendingBg,
          border: `1px solid ${C.pendingBorder}`,
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 10, color: C.pending, lineHeight: 1.6 }}>
            신청 후 시스템이 자동으로 운영 조건을 확인하여 반영 여부를 판단합니다.<br />
            실제 반영 결과는 신청 내역에서 확인할 수 있습니다.
          </div>
        </div>
      </div>

      <div style={{
        padding: "16px 24px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        backgroundColor: "#FAFAF8",
      }}>
        <button
          onClick={onClose}
          style={{
            padding: "9px 20px",
            backgroundColor: C.white,
            color: C.charcoal,
            border: `1px solid ${C.border}`,
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          취소
        </button>
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          style={{
            padding: "9px 24px",
            backgroundColor: canCreate ? C.navy : C.border,
            color: canCreate ? "#EAE0CC" : C.muted,
            border: "none",
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 600,
            cursor: canCreate ? "pointer" : "not-allowed",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          신청하기
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   교육 신청 모달
   - 쉬는 날 희망 신청 모달과 동일한 디자인 패턴 적용
══════════════════════════════════════════════════════════ */
function EducationModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    date: string;
    isFullDay: boolean;
    startTime?: string;
    endTime?: string;
    category: "사내" | "사외" | "법정" | "기타";
    title: string;
    reason: string;
    attachmentCount?: number;
  }) => void;
}) {
  const [date, setDate] = useState("");
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [category, setCategory] = useState<"사내" | "사외" | "법정" | "기타">("사내");
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!date || !title) return;
    onCreate({
      date,
      isFullDay,
      startTime: isFullDay ? undefined : startTime,
      endTime: isFullDay ? undefined : endTime,
      category,
      title,
      reason,
      attachmentCount: 0,
    });
    // Reset
    setDate("");
    setIsFullDay(true);
    setStartTime("09:00");
    setEndTime("18:00");
    setCategory("사내");
    setTitle("");
    setReason("");
    onClose();
  };

  const canSubmit = date && title;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="교육 신청"
      description="사내/사외 교육 일정을 신청해주세요."
      width={720}
    >
      <div style={{ padding: 24 }}>
        {/* 적용 기간 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
            적용 기간 <span style={{ color: C.risk }}>*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              fontSize: 11,
              fontFamily: "'Inter', sans-serif",
            }}
          />
        </div>

        {/* 종일 여부 / 시간 입력 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
            시간
          </label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button
              onClick={() => setIsFullDay(true)}
              style={{
                flex: 1,
                padding: "8px 12px",
                backgroundColor: isFullDay ? C.goldBg : C.white,
                border: `1px solid ${isFullDay ? C.goldBorder : C.border}`,
                borderRadius: 3,
                fontSize: 11,
                fontWeight: 500,
                color: isFullDay ? "#7A5518" : C.charcoal,
                cursor: "pointer",
              }}
            >
              종일
            </button>
            <button
              onClick={() => setIsFullDay(false)}
              style={{
                flex: 1,
                padding: "8px 12px",
                backgroundColor: !isFullDay ? C.goldBg : C.white,
                border: `1px solid ${!isFullDay ? C.goldBorder : C.border}`,
                borderRadius: 3,
                fontSize: 11,
                fontWeight: 500,
                color: !isFullDay ? "#7A5518" : C.charcoal,
                cursor: "pointer",
              }}
            >
              시간 지정
            </button>
          </div>
          {!isFullDay && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  fontSize: 11,
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <span style={{ fontSize: 11, color: C.muted }}>~</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  fontSize: 11,
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>
          )}
        </div>

        {/* 교육 구분 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
            교육 구분
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {(["사내", "사외", "법정", "기타"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: "8px 12px",
                  backgroundColor: category === cat ? C.goldBg : C.white,
                  border: `1px solid ${category === cat ? C.goldBorder : C.border}`,
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 500,
                  color: category === cat ? "#7A5518" : C.charcoal,
                  cursor: "pointer",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 교육명 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
            교육명 <span style={{ color: C.risk }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="교육명을 입력하세요"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 11,
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              fontFamily: "'Inter', sans-serif",
            }}
          />
        </div>

        {/* 신청 사유 또는 메모 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
            사유 <span style={{ color: C.muted, fontWeight: 400 }}>(선택)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="사유를 입력해주세요 (선택)"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              fontSize: 11,
              fontFamily: "'Inter', sans-serif",
              resize: "vertical",
              minHeight: 60,
            }}
          />
        </div>

        {/* 첨부파일 영역 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
            첨부파일 <span style={{ color: C.muted, fontWeight: 400 }}>(선택)</span>
          </label>
          <div style={{
            padding: "16px",
            backgroundColor: C.bg,
            border: `1px dashed ${C.border}`,
            borderRadius: 4,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 10, color: C.muted }}>
              파일을 선택하거나 드래그하여 업로드 (추후 구현 예정)
            </div>
          </div>
        </div>

        <div style={{
          padding: 12,
          backgroundColor: C.pendingBg,
          border: `1px solid ${C.pendingBorder}`,
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 10, color: C.pending, lineHeight: 1.6 }}>
            교육 신청 후 관리자 승인이 완료되면 자동으로 근무표에 반영됩니다.
          </div>
        </div>
      </div>

      <div style={{
        padding: "16px 24px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        backgroundColor: "#FAFAF8",
      }}>
        <button
          onClick={onClose}
          style={{
            padding: "9px 20px",
            backgroundColor: C.white,
            color: C.charcoal,
            border: `1px solid ${C.border}`,
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            padding: "9px 24px",
            backgroundColor: canSubmit ? C.navy : C.border,
            color: canSubmit ? "#EAE0CC" : C.muted,
            border: "none",
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 600,
            cursor: canSubmit ? "pointer" : "not-allowed",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          신청하기
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   병가 신청 모달
   - 쉬는 날 희망 신청 모달과 동일한 디자인 패턴 적용
══════════════════════════════════════════════════════════ */
function SickLeaveModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    date: string;
    isHalfDay: boolean;
    reason: string;
    attachmentCount?: number;
  }) => void;
}) {
  const [date, setDate] = useState("");
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!date) return;
    onCreate({
      date,
      isHalfDay,
      reason,
      attachmentCount: 0,
    });
    // Reset
    setDate("");
    setIsHalfDay(false);
    setReason("");
    onClose();
  };

  const canSubmit = date;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="병가 신청"
      description="병가 일정을 신청해주세요."
      width={720}
    >
      <div style={{ padding: 24 }}>
        {/* 적용 기간 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
            적용 기간 <span style={{ color: C.risk }}>*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              fontSize: 11,
              fontFamily: "'Inter', sans-serif",
            }}
          />
        </div>

        {/* 종일 / 반일 선택 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
            시간
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setIsHalfDay(false)}
              style={{
                flex: 1,
                padding: "8px 12px",
                backgroundColor: !isHalfDay ? C.goldBg : C.white,
                border: `1px solid ${!isHalfDay ? C.goldBorder : C.border}`,
                borderRadius: 3,
                fontSize: 11,
                fontWeight: 500,
                color: !isHalfDay ? "#7A5518" : C.charcoal,
                cursor: "pointer",
              }}
            >
              종일
            </button>
            <button
              onClick={() => setIsHalfDay(true)}
              style={{
                flex: 1,
                padding: "8px 12px",
                backgroundColor: isHalfDay ? C.goldBg : C.white,
                border: `1px solid ${isHalfDay ? C.goldBorder : C.border}`,
                borderRadius: 3,
                fontSize: 11,
                fontWeight: 500,
                color: isHalfDay ? "#7A5518" : C.charcoal,
                cursor: "pointer",
              }}
            >
              반일
            </button>
          </div>
        </div>

        {/* 신청 사유 또는 메모 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
            사유 <span style={{ color: C.muted, fontWeight: 400 }}>(선택)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="사유를 입력해주세요 (선택)"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              fontSize: 11,
              fontFamily: "'Inter', sans-serif",
              resize: "vertical",
              minHeight: 60,
            }}
          />
        </div>

        {/* 증빙 첨부 영역 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
            증빙 첨부 <span style={{ color: C.muted, fontWeight: 400 }}>(선택)</span>
          </label>
          <div style={{
            padding: "16px",
            backgroundColor: C.bg,
            border: `1px dashed ${C.border}`,
            borderRadius: 4,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 10, color: C.muted }}>
              진단서 등 증빙 파일을 선택하거나 드래그하여 업로드 (추후 구현 예정)
            </div>
          </div>
        </div>

        <div style={{
          padding: 12,
          backgroundColor: C.pendingBg,
          border: `1px solid ${C.pendingBorder}`,
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 10, color: C.pending, lineHeight: 1.6 }}>
            병가 신청 후 관리자 승인이 완료되면 자동으로 근무표에 반영됩니다.
          </div>
        </div>
      </div>

      <div style={{
        padding: "16px 24px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        backgroundColor: "#FAFAF8",
      }}>
        <button
          onClick={onClose}
          style={{
            padding: "9px 20px",
            backgroundColor: C.white,
            color: C.charcoal,
            border: `1px solid ${C.border}`,
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            padding: "9px 24px",
            backgroundColor: canSubmit ? C.navy : C.border,
            color: canSubmit ? "#EAE0CC" : C.muted,
            border: "none",
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 600,
            cursor: canSubmit ? "pointer" : "not-allowed",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          신청하기
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   주말/공휴 근무 희망 신청 모달
══════════════════════════════════════════════════════════ */
function WeekendHolidayWorkModal({
  open,
  onClose,
  onCreate,
  onCancel,
  year,
  month,
  existingRequests,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (type: "주말 근무 희망" | "공휴 근무 희망") => void;
  onCancel: (type: "주말 근무 희망" | "공휴 근무 희망") => boolean;
  year: number;
  month: number;
  existingRequests: MyRequest[];
}) {
  const targetMonth = `${year}-${String(month).padStart(2, "0")}`;

  // 해당 월에 이미 신청된 항목 확인 (신청 접수 또는 승인 대기 상태만 취소 가능)
  const weekendRequest = existingRequests.find(
    req => req.intention === "주말 근무 희망" && req.date === targetMonth && req.status === "신청 접수"
  );
  const holidayRequest = existingRequests.find(
    req => req.intention === "공휴 근무 희망" && req.date === targetMonth && req.status === "신청 접수"
  );

  const [weekendWork, setWeekendWork] = useState(!!weekendRequest);
  const [holidayWork, setHolidayWork] = useState(!!holidayRequest);

  const handleWeekendToggle = (checked: boolean) => {
    if (!checked && weekendRequest) {
      // 취소
      const success = onCancel("주말 근무 희망");
      if (success) {
        setWeekendWork(false);
      }
    } else {
      setWeekendWork(checked);
    }
  };

  const handleHolidayToggle = (checked: boolean) => {
    if (!checked && holidayRequest) {
      // 취소
      const success = onCancel("공휴 근무 희망");
      if (success) {
        setHolidayWork(false);
      }
    } else {
      setHolidayWork(checked);
    }
  };

  const handleSubmit = () => {
    // 새로 신청할 항목만 처리
    if (weekendWork && !weekendRequest) {
      onCreate("주말 근무 희망");
    }
    if (holidayWork && !holidayRequest) {
      onCreate("공휴 근무 희망");
    }
    onClose();
  };

  const hasChanges = (!weekendRequest && weekendWork) || (!holidayRequest && holidayWork);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="주말/공휴 근무 희망 신청"
      description="주말 또는 공휴일에 근무를 희망하는 경우 선택해주세요."
      width={560}
    >
      <div style={{ padding: 24 }}>
        {/* 적용 기간 */}
        <div style={{
          padding: 16,
          backgroundColor: C.bg,
          borderRadius: 4,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>
            적용 기간
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
            {year}년 {month}월
          </div>
        </div>

        {/* 선택 항목 */}
        <div style={{
          padding: 16,
          backgroundColor: "#F7F4EF",
          borderRadius: 4,
          border: `1px solid ${C.borderLight}`,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 12 }}>
            근무 희망 선택 *
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 12,
              border: `2px solid ${weekendWork ? C.navy : C.border}`,
              borderRadius: 4,
              cursor: "pointer",
              backgroundColor: weekendWork ? "rgba(13,27,42,0.04)" : C.white,
              transition: "all 0.15s",
            }}>
              <input
                type="checkbox"
                checked={weekendWork}
                onChange={(e) => handleWeekendToggle(e.target.checked)}
                style={{ cursor: "pointer", width: 16, height: 16 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: weekendWork ? C.navy : C.charcoal }}>
                  주말 근무 희망
                  {weekendRequest && (
                    <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 500, color: C.ok, backgroundColor: C.okBg, padding: "2px 6px", borderRadius: 3 }}>
                      신청됨
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                  토요일 및 일요일 근무를 희망합니다. {weekendRequest && "(체크 해제 시 취소됩니다)"}
                </div>
              </div>
            </label>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 12,
              border: `2px solid ${holidayWork ? C.navy : C.border}`,
              borderRadius: 4,
              cursor: "pointer",
              backgroundColor: holidayWork ? "rgba(13,27,42,0.04)" : C.white,
              transition: "all 0.15s",
            }}>
              <input
                type="checkbox"
                checked={holidayWork}
                onChange={(e) => handleHolidayToggle(e.target.checked)}
                style={{ cursor: "pointer", width: 16, height: 16 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: holidayWork ? C.navy : C.charcoal }}>
                  공휴일 근무 희망
                  {holidayRequest && (
                    <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 500, color: C.ok, backgroundColor: C.okBg, padding: "2px 6px", borderRadius: 3 }}>
                      신청됨
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                  공휴일 근무를 희망합니다. {holidayRequest && "(체크 해제 시 취소됩니다)"}
                </div>
              </div>
            </label>
          </div>
        </div>

        <div style={{
          padding: 12,
          backgroundColor: C.pendingBg,
          border: `1px solid ${C.pendingBorder}`,
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 10, color: C.pending, lineHeight: 1.6 }}>
            이 신청 내역은 자동 스케줄 생성 및 공정성 계산에 반영됩니다.
          </div>
        </div>
      </div>

      <div style={{
        padding: "16px 24px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        backgroundColor: "#FAFAF8",
      }}>
        <button
          onClick={onClose}
          style={{
            padding: "9px 20px",
            backgroundColor: C.white,
            color: C.charcoal,
            border: `1px solid ${C.border}`,
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={!hasChanges}
          style={{
            padding: "9px 24px",
            backgroundColor: hasChanges ? C.navy : C.border,
            color: hasChanges ? "#EAE0CC" : C.muted,
            border: "none",
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 600,
            cursor: hasChanges ? "pointer" : "not-allowed",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          신청하기
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   연중 휴가 계획 신청 모달
══════════════════════════════════════════════════════════ */
function VacationPlanModal({
  open,
  onClose,
  onCreate,
  balance,
  year,
  month,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (plan: Partial<VacationPlan>) => void;
  balance: EmployeeBalance;
  year: number;
  month: number;
}) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [vacationDays, setVacationDays] = useState(0);
  const [annualLeaveDays, setAnnualLeaveDays] = useState(0);
  const [offDays, setOffDays] = useState(0);
  const [reason, setReason] = useState("");

  const totalDays = selectedDates.length;
  const allocatedDays = vacationDays + annualLeaveDays + offDays;

  const handleDateToggle = (date: string) => {
    setSelectedDates(prev =>
      prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date].sort()
    );
  };

  const handleCreate = () => {
    if (selectedDates.length > 0 && allocatedDays === totalDays) {
      const sorted = [...selectedDates].sort();
      onCreate({
        startDate: sorted[0],
        endDate: sorted[sorted.length - 1],
        totalDays,
        vacationDays,
        annualLeaveDays,
        offDays,
        reason,
        status: "신청 접수",
        createdAt: new Date().toISOString().split("T")[0],
      });
      // Reset
      setSelectedDates([]);
      setVacationDays(0);
      setAnnualLeaveDays(0);
      setOffDays(0);
      setReason("");
      onClose();
    }
  };

  const canCreate = selectedDates.length > 0 && allocatedDays === totalDays;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="연중 휴가 계획 신청"
      description="장기 휴가 계획을 신청합니다. 여러 날짜를 선택하고 휴가/연차/휴무를 나눠서 입력하세요."
      width={720}
    >
      <div style={{ padding: 24 }}>
        {/* 잔여 수량 */}
        <div style={{
          padding: 16,
          backgroundColor: C.bg,
          borderRadius: 4,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 12 }}>
            내 잔여 수량
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>휴가 잔여</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
                {balance.vacationTotal}일 중 {balance.vacation}일
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>연차 잔여</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
                {balance.annualLeaveTotal}일 중 {balance.annualLeave}일
              </div>
            </div>
          </div>
        </div>

        {/* 달력 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 8 }}>
            날짜 선택 *
          </label>
          <Calendar
            selectedDates={selectedDates}
            onDateToggle={handleDateToggle}
            year={year}
            month={month}
          />
        </div>

        {/* 선택된 날짜 목록 */}
        {selectedDates.length > 0 && (
          <div style={{
            padding: 12,
            backgroundColor: C.goldBg,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 4,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#7A5518", marginBottom: 6 }}>
              선택된 날짜 ({selectedDates.length}일)
            </div>
            <div style={{ fontSize: 11, color: C.charcoal, lineHeight: 1.6 }}>
              {selectedDates.join(", ")}
            </div>
          </div>
        )}

        {/* 일수 배분 */}
        {totalDays > 0 && (
          <div style={{
            padding: 16,
            backgroundColor: "#F7F4EF",
            borderRadius: 4,
            border: `1px solid ${C.border}`,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 12 }}>
              총 {totalDays}일 일수 배분 *
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.muted, marginBottom: 4 }}>
                  휴가
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalDays}
                  value={vacationDays}
                  onChange={(e) => setVacationDays(Math.max(0, Math.min(totalDays, Number(e.target.value))))}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    fontSize: 11,
                    textAlign: "center",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.muted, marginBottom: 4 }}>
                  연차
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalDays}
                  value={annualLeaveDays}
                  onChange={(e) => setAnnualLeaveDays(Math.max(0, Math.min(totalDays, Number(e.target.value))))}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    fontSize: 11,
                    textAlign: "center",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, color: C.muted, marginBottom: 4 }}>
                  휴무
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalDays}
                  value={offDays}
                  onChange={(e) => setOffDays(Math.max(0, Math.min(totalDays, Number(e.target.value))))}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    fontSize: 11,
                    textAlign: "center",
                  }}
                />
              </div>
            </div>
            <div style={{
              marginTop: 10,
              padding: 8,
              backgroundColor: allocatedDays === totalDays ? C.okBg : C.warnBg,
              border: `1px solid ${allocatedDays === totalDays ? C.okBorder : C.warnBorder}`,
              borderRadius: 3,
              fontSize: 10,
              color: allocatedDays === totalDays ? C.ok : C.warning,
              textAlign: "center",
            }}>
              {allocatedDays === totalDays
                ? `✓ 총 ${totalDays}일 배분 완료`
                : `⚠️ 배분 필요: ${allocatedDays}일 / ${totalDays}일 (${totalDays - allocatedDays}일 남음)`
              }
            </div>
          </div>
        )}

        {/* 사유 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
            사유 <span style={{ color: C.muted, fontWeight: 400 }}>(선택)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="사유를 입력해주세요 (예: 여름 휴가)"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              fontSize: 11,
              fontFamily: "'Inter', sans-serif",
              resize: "vertical",
              minHeight: 60,
            }}
          />
        </div>

        <div style={{
          padding: 12,
          backgroundColor: C.pendingBg,
          border: `1px solid ${C.pendingBorder}`,
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 10, color: C.pending, lineHeight: 1.6 }}>
            연중 휴가 계획은 장기적인 휴가 일정을 미리 등록하는 기능입니다.<br />
            신청 후 시스템이 자동으로 검토하여 반영 여부를 판단합니다.
          </div>
        </div>
      </div>

      <div style={{
        padding: "16px 24px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        backgroundColor: "#FAFAF8",
      }}>
        <button
          onClick={onClose}
          style={{
            padding: "9px 20px",
            backgroundColor: C.white,
            color: C.charcoal,
            border: `1px solid ${C.border}`,
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          취소
        </button>
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          style={{
            padding: "9px 24px",
            backgroundColor: canCreate ? C.navy : C.border,
            color: canCreate ? "#EAE0CC" : C.muted,
            border: "none",
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 600,
            cursor: canCreate ? "pointer" : "not-allowed",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          신청하기
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   신청 상세 보기 모달
══════════════════════════════════════════════════════════ */
function RequestDetailModal({
  open,
  onClose,
  request,
  onEdit,
  onDelete,
  isDeadlineClosed = false,
}: {
  open: boolean;
  onClose: () => void;
  request: MyRequest | null;
  onEdit: () => void;
  onDelete: () => void;
  isDeadlineClosed?: boolean;
}) {
  if (!request) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="신청 상세 보기"
      description="신청 내용과 반영 결과를 확인할 수 있습니다."
      width={600}
    >
      <div style={{ padding: 24 }}>
        <div style={{ display: "grid", gap: 20 }}>
          {/* 날짜 */}
          <div>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>신청 날짜</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
              {request.date}
            </div>
          </div>

          {/* 신청 의사 & 최종 반영 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>신청 의사</div>
              <div>{getIntentionBadge(request.intention)}</div>
            </div>
            {request.finalType && (
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>최종 반영</div>
                <div>{getFinalTypeBadge(request.finalType)}</div>
              </div>
            )}
          </div>

          {/* 상태 */}
          <div>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>현재 상태</div>
            <div>{getStatusBadge(request.status)}</div>
          </div>

          {/* 사유 */}
          {request.reason && (
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>사유</div>
              <div style={{
                padding: 12,
                backgroundColor: C.bg,
                borderRadius: 4,
                fontSize: 11,
                color: C.charcoal,
                lineHeight: 1.6,
              }}>
                {request.reason}
              </div>
            </div>
          )}

          {/* 반영 조정 사유 */}
          {request.adjustmentReason && (
            <div style={{
              padding: 12,
              backgroundColor: C.goldBg,
              border: `1px solid ${C.goldBorder}`,
              borderRadius: 4,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#7A5518", marginBottom: 4 }}>
                반영 조정 사유
              </div>
              <div style={{ fontSize: 10, color: C.charcoal, lineHeight: 1.5 }}>
                {request.adjustmentReason}
              </div>
            </div>
          )}

          {/* 시스템 메시지 */}
          {request.note && (
            <div style={{
              padding: 12,
              backgroundColor: C.warnBg,
              border: `1px solid ${C.warnBorder}`,
              borderRadius: 4,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.warning, marginBottom: 4 }}>
                시스템 메시지
              </div>
              <div style={{ fontSize: 10, color: C.charcoal, lineHeight: 1.5 }}>
                {request.note}
              </div>
            </div>
          )}

          {/* 신청 일시 */}
          <div>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>신청 일시</div>
            <div style={{ fontSize: 11, color: C.charcoal }}>{request.createdAt}</div>
          </div>
        </div>
      </div>

      <div style={{
        padding: "16px 24px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "space-between",
        backgroundColor: "#FAFAF8",
      }}>
        {!request.isSystemAssigned && !isDeadlineClosed && (
          <button
            onClick={onDelete}
            style={{
              padding: "9px 20px",
              backgroundColor: C.white,
              color: C.risk,
              border: `1px solid ${C.riskBorder}`,
              borderRadius: 3,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            삭제
          </button>
        )}
        <div style={{ display: "flex", gap: 10, marginLeft: (request.isSystemAssigned || isDeadlineClosed) ? "auto" : 0 }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px",
              backgroundColor: C.white,
              color: C.charcoal,
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            닫기
          </button>
          {request.intention === "쉬는 날 희망" && !request.isSystemAssigned && !isDeadlineClosed && (
            <button
              onClick={onEdit}
              style={{
                padding: "9px 24px",
                backgroundColor: C.navy,
                color: "#EAE0CC",
                border: "none",
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              수정
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   신청 수정 모달
══════════════════════════════════════════════════════════ */
function EditRequestModal({
  open,
  onClose,
  request,
  onUpdate,
  balance,
  year,
  month,
}: {
  open: boolean;
  onClose: () => void;
  request: MyRequest | null;
  onUpdate: (updatedRequest: MyRequest) => void;
  balance: EmployeeBalance;
  year: number;
  month: number;
}) {
  const [selectedDate, setSelectedDate] = useState<string>(request?.date || "");
  const [reason, setReason] = useState(request?.reason || "");
  
  useEffect(() => {
    if (open && request) {
      setSelectedDate(request.date);
      setReason(request.reason);
    }
  }, [open, request]);
  
  if (!request) return null;

  const handleDateToggle = (date: string) => {
    setSelectedDate(date);
  };

  const handleUpdate = () => {
    if (selectedDate) {
      const updatedRequest: MyRequest = {
        ...request,
        date: selectedDate,
        reason,
      };
      onUpdate(updatedRequest);
      onClose();
    }
  };

  const canUpdate = selectedDate !== "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="신청 수정"
      description="신청 내용을 수정합니다. 날짜와 사유를 변경할 수 있습니다."
      width={720}
    >
      <div style={{ padding: 24 }}>
        {/* 기존 신청 정보 표시 */}
        <div style={{
          padding: 14,
          backgroundColor: C.warnBg,
          borderRadius: 4,
          border: `1px solid ${C.warnBorder}`,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.warning, marginBottom: 8 }}>
            ⚠️ 신청 수정 안내
          </div>
          <div style={{ fontSize: 10, color: C.charcoal, lineHeight: 1.6 }}>
            • 기존 신청 날짜: <strong style={{ color: C.navy }}>{request.date}</strong><br />
            • 현재 상태: <strong style={{ color: C.navy }}>{request.status}</strong>
          </div>
        </div>

        {/* 잔여 수량 */}
        <div style={{
          padding: 16,
          backgroundColor: C.okBg,
          border: `1px solid ${C.okBorder}`,
          borderRadius: 4,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.ok, marginBottom: 12 }}>
            내 잔여 수량 <span style={{ fontSize: 10, fontWeight: 400, color: C.charcoal }}>(참고)</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.charcoal, marginBottom: 4 }}>휴가 잔여</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
                {balance.vacationTotal}일 중 {balance.vacation}일
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.charcoal, marginBottom: 4 }}>연차 잔여</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
                {balance.annualLeaveTotal}일 중 {balance.annualLeave}일
              </div>
            </div>
          </div>
        </div>

        {/* 달력 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 8 }}>
            날짜 선택 *
          </label>
          <Calendar
            selectedDates={selectedDate ? [selectedDate] : []}
            onDateToggle={handleDateToggle}
            year={year}
            month={month}
          />
        </div>

        {/* 선택된 날짜 */}
        {selectedDate && (
          <div style={{
            padding: 12,
            backgroundColor: C.goldBg,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 4,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#7A5518", marginBottom: 6 }}>
              선택된 날짜
            </div>
            <div style={{ fontSize: 11, color: C.charcoal, lineHeight: 1.6 }}>
              {selectedDate}
            </div>
          </div>
        )}

        {/* 사유 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
            사유 <span style={{ color: C.muted, fontWeight: 400 }}>(선택)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="사유를 입력해주세요 (선택)"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              fontSize: 11,
              fontFamily: "'Inter', sans-serif",
              resize: "vertical",
              minHeight: 60,
            }}
          />
        </div>

        <div style={{
          padding: 12,
          backgroundColor: C.pendingBg,
          border: `1px solid ${C.pendingBorder}`,
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 10, color: C.pending, lineHeight: 1.6 }}>
            수정 후 시스템이 다시 검토하여 반영 여부를 판단합니다.
          </div>
        </div>
      </div>

      <div style={{
        padding: "16px 24px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "flex-end",
        gap: 10,
        backgroundColor: "#FAFAF8",
      }}>
        <button
          onClick={onClose}
          style={{
            padding: "9px 20px",
            backgroundColor: C.white,
            color: C.charcoal,
            border: `1px solid ${C.border}`,
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          취소
        </button>
        <button
          onClick={handleUpdate}
          disabled={!canUpdate}
          style={{
            padding: "9px 24px",
            backgroundColor: canUpdate ? C.navy : C.border,
            color: canUpdate ? "#EAE0CC" : C.muted,
            border: "none",
            borderRadius: 3,
            fontSize: 12,
            fontWeight: 600,
            cursor: canUpdate ? "pointer" : "not-allowed",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          수정하기
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function RequestPage() {
  const [requests, setRequests] = useState<MyRequest[]>(MOCK_REQUESTS);
  const [vacationPlans, setVacationPlans] = useState<VacationPlan[]>(MOCK_VACATION_PLANS);
  const [balance, setBalance] = useState<EmployeeBalance>(INITIAL_BALANCE);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [weekendHolidayModalOpen, setWeekendHolidayModalOpen] = useState(false);
  const [educationModalOpen, setEducationModalOpen] = useState(false);
  const [sickLeaveModalOpen, setSickLeaveModalOpen] = useState(false);
  const [vacationPlanModalOpen, setVacationPlanModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MyRequest | null>(null);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Toast 알림 (전역 ToastContext 사용)
  const { showToast: _showToast } = useToast();

  // 탭 상태
  const [activeTab, setActiveTab] = useState<"regular" | "vacation">("regular");
  
  // 필터 상태
  const [requestFilter, setRequestFilter] = useState<"all" | "myRequest" | "systemAssigned">("all");

  // 마감 상태
  const { isDeadlineClosed, deadlineClosedAt } = useAttendanceDeadline();

  // 성공 메시지 자동 숨김
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => setUpdateSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [updateSuccess]);

  // 필터링된 신청 내역
  const filteredRequests = requests.filter(req => {
    if (requestFilter === "all") return true;
    if (requestFilter === "myRequest") return !req.isSystemAssigned;
    if (requestFilter === "systemAssigned") return req.isSystemAssigned;
    return true;
  });

  const handleCreateRequest = (dates: string[], reason: string) => {
    // 여러 날짜를 개별 신청 건으로 분리
    const newRequests = dates.map((date, idx) => ({
      id: requests.length + idx + 1,
      date,
      intention: "쉬는 날 희망" as RequestIntention,
      reason,
      status: "신청 접수" as RequestStatus,
      createdAt: new Date().toISOString().split("T")[0],
    }));
    setRequests([...newRequests, ...requests]);
    showToastNotification("신청 완료", "쉬는 날 희망 신청이 접수되었습니다.");
  };

  const handleCreateWeekendHoliday = (type: "주말 근무 희망" | "공휴 근무 희망") => {
    const newRequest: MyRequest = {
      id: requests.length + 1,
      date: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`,
      intention: type,
      reason: "",
      status: "신청 접수",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setRequests([newRequest, ...requests]);
    const label = type === "주말 근무 희망" ? "주말 근무 희망 신청" : "공휴일 근무 희망 신청";
    showToastNotification("신청 완료", `${label}이 접수되었습니다.`);
  };

  const handleCreateVacationPlan = (newPlan: Partial<VacationPlan>) => {
    const plan: VacationPlan = {
      id: vacationPlans.length + 1,
      startDate: newPlan.startDate || "",
      endDate: newPlan.endDate || "",
      totalDays: newPlan.totalDays || 0,
      vacationDays: newPlan.vacationDays || 0,
      annualLeaveDays: newPlan.annualLeaveDays || 0,
      offDays: newPlan.offDays || 0,
      reason: newPlan.reason || "",
      status: newPlan.status || "신청 접수",
      createdAt: newPlan.createdAt || new Date().toISOString().split("T")[0],
    };
    setVacationPlans([plan, ...vacationPlans]);
    setUpdateSuccess(true);
  };

  const handleUpdateRequest = (updatedRequest: MyRequest) => {
    setRequests(requests.map(r => r.id === updatedRequest.id ? updatedRequest : r));
    setUpdateSuccess(true);
  };

  const handleDeleteRequest = () => {
    if (selectedRequest) {
      setRequests(requests.filter(r => r.id !== selectedRequest.id));
      setDetailModalOpen(false);
      setUpdateSuccess(true);
    }
  };

  const handleOpenDetail = (request: MyRequest) => {
    setSelectedRequest(request);
    setDetailModalOpen(true);
  };

  // Toast 표시 헬퍼
  const showToastNotification = (title: string, message: string) => {
    _showToast({ type: "success", title, message });
  };

  // 교육 신청 처리
  const handleCreateEducation = (data: {
    date: string;
    isFullDay: boolean;
    startTime?: string;
    endTime?: string;
    category: "사내" | "사외" | "법정" | "기타";
    title: string;
    reason: string;
    attachmentCount?: number;
  }) => {
    const newRequest: MyRequest = {
      id: requests.length + 1,
      date: data.date,
      intention: "교육 신청",
      finalType: "EDU",
      reason: data.reason,
      status: "승인 대기",
      createdAt: new Date().toISOString().split("T")[0],
      educationCategory: data.category,
      educationTitle: data.title,
      educationIsFullDay: data.isFullDay,
      educationStartTime: data.startTime,
      educationEndTime: data.endTime,
      attachmentCount: data.attachmentCount || 0,
    };
    setRequests([newRequest, ...requests]);
    showToastNotification("신청 완료", "교육 신청이 접수되었습니다.");
  };

  // 병가 신청 처리
  const handleCreateSickLeave = (data: {
    date: string;
    isHalfDay: boolean;
    reason: string;
    attachmentCount?: number;
  }) => {
    const newRequest: MyRequest = {
      id: requests.length + 1,
      date: data.date,
      intention: "병가 신청",
      finalType: "SICK",
      reason: data.reason,
      status: "승인 대기",
      createdAt: new Date().toISOString().split("T")[0],
      sickLeaveIsHalfDay: data.isHalfDay,
      attachmentCount: data.attachmentCount || 0,
    };
    setRequests([newRequest, ...requests]);
    showToastNotification("신청 완료", "병가 신청이 접수되었습니다.");
  };

  // 주말/공휴 근무 희망 취소 처리
  const handleCancelWeekendHoliday = (type: "주말 근무 희망" | "공휴 근무 희망") => {
    const targetRequest = requests.find(r => r.intention === type && r.status === "신청 접수");
    if (targetRequest) {
      setRequests(requests.map(r =>
        r.id === targetRequest.id
          ? { ...r, status: "신청 취소" as RequestStatus }
          : r
      ));
      const label = type === "주말 근무 희망" ? "주말 근무 희망 신청" : "공휴일 근무 희망 신청";
      showToastNotification("신청 취소 완료", `${label}이 취소되었습니다.`);
      return true;
    }
    return false;
  };

  const handleOpenEdit = () => {
    setDetailModalOpen(false);
    setEditModalOpen(true);
  };

  return (
    <AppLayout>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: C.bg }}>
        {/* 헤더 */}
        <div style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.border}`,
          padding: "20px 40px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                근태 신청
              </h1>
            </div>
            {isDeadlineClosed && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: C.riskBg,
                border: `1px solid ${C.riskBorder}`,
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 500,
                color: C.risk,
              }}>
                <Info size={14} />
                <span>근태신청 마감됨</span>
                {deadlineClosedAt && (
                  <span style={{ color: C.muted, fontSize: "11px", marginLeft: "4px" }}>
                    ({new Date(deadlineClosedAt).toLocaleDateString()})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 기간 및 요약 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  padding: "7px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontSize: 11.5,
                  backgroundColor: C.white,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  color: C.charcoal,
                }}
              >
                <option value={2025}>2025년</option>
                <option value={2026}>2026년</option>
                <option value={2027}>2027년</option>
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{
                  padding: "7px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontSize: 11.5,
                  backgroundColor: C.white,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  color: C.charcoal,
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>

            {/* 잔여 수량 및 HO 사용 현황 요약 */}
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ 
                textAlign: "right",
                padding: "8px 12px",
                backgroundColor: C.white,
                border: `1px solid ${C.borderLight}`,
                borderRadius: 4,
              }}>
                <div style={{ fontSize: 9.5, color: C.muted, marginBottom: 3 }}>휴가 잔여</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.navy }}>
                  {balance.vacation} / {balance.vacationTotal}일
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginTop: 2 }}>
                  ({Math.round((balance.vacation / balance.vacationTotal) * 100)}%)
                </div>
              </div>
              <div style={{ 
                textAlign: "right",
                padding: "8px 12px",
                backgroundColor: C.white,
                border: `1px solid ${C.borderLight}`,
                borderRadius: 4,
              }}>
                <div style={{ fontSize: 9.5, color: C.muted, marginBottom: 3 }}>연차 잔여</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.navy }}>
                  {balance.annualLeave} / {balance.annualLeaveTotal}일
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginTop: 2 }}>
                  ({Math.round((balance.annualLeave / balance.annualLeaveTotal) * 100)}%)
                </div>
              </div>
              <div style={{ 
                textAlign: "right",
                padding: "8px 12px",
                backgroundColor: C.white,
                border: `1px solid ${C.borderLight}`,
                borderRadius: 4,
              }}>
                <div style={{ fontSize: 9.5, color: C.muted, marginBottom: 3 }}>HO 사용</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.navy }}>
                  {balance.hoUsedDays} / {balance.hoTotalDays}일
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginTop: 2 }}>
                  ({Math.round((balance.hoUsedDays / balance.hoTotalDays) * 100)}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 성공 메시지 */}
        {updateSuccess && (
          <div style={{
            padding: "12px 40px",
            backgroundColor: C.okBg,
            borderBottom: `1px solid ${C.okBorder}`,
          }}>
            <div style={{ fontSize: 11, color: C.ok, fontWeight: 500 }}>
              ✓ 변경사항이 저장되었습니다.
            </div>
          </div>
        )}

        {/* 탭 */}
        <div style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.border}`,
          padding: "0 40px",
          display: "flex",
          gap: 0,
          flexShrink: 0,
        }}>
          <button
            onClick={() => setActiveTab("regular")}
            style={{
              padding: "14px 24px",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: activeTab === "regular" ? `2px solid ${C.gold}` : "2px solid transparent",
              fontSize: 12,
              fontWeight: activeTab === "regular" ? 600 : 500,
              color: activeTab === "regular" ? C.navy : C.muted,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            일반 근태 신청
          </button>
          <button
            onClick={() => setActiveTab("vacation")}
            style={{
              padding: "14px 24px",
              backgroundColor: "transparent",
              border: "none",
              borderBottom: activeTab === "vacation" ? `2px solid ${C.gold}` : "2px solid transparent",
              fontSize: 12,
              fontWeight: activeTab === "vacation" ? 600 : 500,
              color: activeTab === "vacation" ? C.navy : C.muted,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            연중 휴가 계획
          </button>
        </div>

        {/* 메인 컨텐츠 */}
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          {activeTab === "regular" ? (
            <div style={{ padding: "32px 40px" }}>
              <div style={{ maxWidth: 1400 }}>
                {/* 신청 버튼 */}
                <div style={{ display: "flex", gap: 12, marginBottom: 24, justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* 1열: 쉬는 날 희망 / 주말·공휴 근무 희망 */}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => !isDeadlineClosed && setCreateModalOpen(true)}
                        disabled={isDeadlineClosed}
                        style={{
                          padding: "10px 22px",
                          backgroundColor: isDeadlineClosed ? C.border : C.navy,
                          color: isDeadlineClosed ? C.muted : "#EAE0CC",
                          border: "none",
                          borderRadius: 3,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isDeadlineClosed ? "not-allowed" : "pointer",
                          fontFamily: "'Inter', sans-serif",
                          transition: "all 0.15s",
                        }}
                      >
                        + 쉬는 날 희망 신청
                      </button>
                      <button
                        onClick={() => !isDeadlineClosed && setWeekendHolidayModalOpen(true)}
                        disabled={isDeadlineClosed}
                        style={{
                          padding: "10px 22px",
                          backgroundColor: C.white,
                          color: isDeadlineClosed ? C.muted : C.navy,
                          border: `1px solid ${isDeadlineClosed ? C.border : C.navy}`,
                          borderRadius: 3,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isDeadlineClosed ? "not-allowed" : "pointer",
                          fontFamily: "'Inter', sans-serif",
                          transition: "all 0.15s",
                        }}
                      >
                        + 주말·공휴 근무 희망 신청
                      </button>
                    </div>
                    {/* 2열: 교육 / 병가 */}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => !isDeadlineClosed && setEducationModalOpen(true)}
                        disabled={isDeadlineClosed}
                        style={{
                          padding: "10px 22px",
                          backgroundColor: C.white,
                          color: isDeadlineClosed ? C.muted : "#1A5A8A",
                          border: `1px solid ${isDeadlineClosed ? C.border : "#A8CEE8"}`,
                          borderRadius: 3,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isDeadlineClosed ? "not-allowed" : "pointer",
                          fontFamily: "'Inter', sans-serif",
                          transition: "all 0.15s",
                        }}
                      >
                        + 교육 신청
                      </button>
                      <button
                        onClick={() => !isDeadlineClosed && setSickLeaveModalOpen(true)}
                        disabled={isDeadlineClosed}
                        style={{
                          padding: "10px 22px",
                          backgroundColor: C.white,
                          color: isDeadlineClosed ? C.muted : "#CC5500",
                          border: `1px solid ${isDeadlineClosed ? C.border : "#FFB380"}`,
                          borderRadius: 3,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isDeadlineClosed ? "not-allowed" : "pointer",
                          fontFamily: "'Inter', sans-serif",
                          transition: "all 0.15s",
                        }}
                      >
                        + 병가 신청
                      </button>
                    </div>
                  </div>

                  {/* 필터 버튼 */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: C.muted, marginRight: 4 }}>필터:</span>
                    <button
                      onClick={() => setRequestFilter("all")}
                      style={{
                        padding: "6px 14px",
                        backgroundColor: requestFilter === "all" ? C.navy : C.white,
                        color: requestFilter === "all" ? "#EAE0CC" : C.charcoal,
                        border: `1px solid ${requestFilter === "all" ? C.navy : C.border}`,
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                        transition: "all 0.15s",
                      }}
                    >
                      전체
                    </button>
                    <button
                      onClick={() => setRequestFilter("myRequest")}
                      style={{
                        padding: "6px 14px",
                        backgroundColor: requestFilter === "myRequest" ? C.navy : C.white,
                        color: requestFilter === "myRequest" ? "#EAE0CC" : C.charcoal,
                        border: `1px solid ${requestFilter === "myRequest" ? C.navy : C.border}`,
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                        transition: "all 0.15s",
                      }}
                    >
                      내 신청
                    </button>
                    <button
                      onClick={() => setRequestFilter("systemAssigned")}
                      style={{
                        padding: "6px 14px",
                        backgroundColor: requestFilter === "systemAssigned" ? C.navy : C.white,
                        color: requestFilter === "systemAssigned" ? "#EAE0CC" : C.charcoal,
                        border: `1px solid ${requestFilter === "systemAssigned" ? C.navy : C.border}`,
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                        transition: "all 0.15s",
                      }}
                    >
                      시스템 배정
                    </button>
                  </div>
                </div>

                {/* 마감 안내 */}
                {isDeadlineClosed && (
                  <div style={{
                    padding: 16,
                    backgroundColor: C.riskBg,
                    borderRadius: 4,
                    border: `1px solid ${C.riskBorder}`,
                    marginBottom: 24,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Info size={14} color={C.risk} />
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.risk }}>
                        근태 신청이 마감되었습니다
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: C.charcoal, lineHeight: 1.6 }}>
                      현재 기간의 근태 신청은 마감되어 더 이상 수정하거나 삭제할 수 없습니다.
                      {deadlineClosedAt && (
                        <span style={{ display: "block", marginTop: 4, color: C.muted, fontSize: 10 }}>
                          마감 일시: {new Date(deadlineClosedAt).toLocaleDateString()} {new Date(deadlineClosedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 안내 */}
                {/* 신청 내역 테이블 */}
                <div style={{
                  backgroundColor: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  overflow: "hidden",
                }}>
                  <div style={{
                    padding: "16px 20px",
                    borderBottom: `1px solid ${C.border}`,
                    backgroundColor: "#FAFAF8",
                  }}>
                    <h3 style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.navy,
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      나의 신청 내역 ({filteredRequests.length}건)
                    </h3>
                  </div>

                  {filteredRequests.length === 0 ? (
                    <div style={{ padding: "60px 20px", textAlign: "center" }}>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
                        신청 내역이 없습니다.
                      </div>
                      <div style={{ fontSize: 11, color: C.muted }}>
                        신청 버튼을 눌러 신청해주세요.
                      </div>
                    </div>
                  ) : (
                    <div style={{ overflow: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>날짜</th>
                            <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>신청 의사</th>
                            <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>최종 반영</th>
                            <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>신청 사유</th>
                            <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>반영 조정 사유</th>
                            <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>상태</th>
                            <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>신청일</th>
                            <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>작업</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.map((req, i) => (
                            <tr
                              key={req.id}
                              style={{
                                backgroundColor: i % 2 === 0 ? C.white : C.rowAlt,
                                cursor: "pointer",
                              }}
                              onClick={() => handleOpenDetail(req)}
                            >
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11.5, fontWeight: 500, color: C.navy }}>
                                {req.date}
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center" }}>
                                {getIntentionBadge(req.intention)}
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center" }}>
                                {req.finalType ? getFinalTypeBadge(req.finalType) : <span style={{ fontSize: 10, color: C.muted }}>—</span>}
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11, color: req.reason ? C.charcoal : C.muted }}>
                                {req.reason || "—"}
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 10, color: req.adjustmentReason ? C.charcoal : C.muted, maxWidth: 250 }}>
                                {req.adjustmentReason || "—"}
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center" }}>
                                {getStatusBadge(req.status)}
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11, color: C.muted, textAlign: "center" }}>
                                {req.createdAt}
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center" }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenDetail(req); }}
                                  style={{
                                    padding: "5px 12px",
                                    backgroundColor: C.white,
                                    color: C.charcoal,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 3,
                                    fontSize: 10,
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    fontFamily: "'Inter', sans-serif",
                                  }}
                                >
                                  상세
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "32px 40px" }}>
              <div style={{ maxWidth: 1400 }}>
                {/* 신청 버튼 */}
                <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                  <button
                    onClick={() => !isDeadlineClosed && setVacationPlanModalOpen(true)}
                    disabled={isDeadlineClosed}
                    style={{
                      padding: "10px 24px",
                      backgroundColor: isDeadlineClosed ? C.border : C.navy,
                      color: isDeadlineClosed ? C.muted : "#EAE0CC",
                      border: "none",
                      borderRadius: 3,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: isDeadlineClosed ? "not-allowed" : "pointer",
                      fontFamily: "'Inter', sans-serif",
                      transition: "all 0.15s",
                    }}
                  >
                    + 연중 휴가 계획 신청
                  </button>
                </div>

                {/* 안내 */}
                <div style={{
                  padding: 16,
                  backgroundColor: "#F7F4EF",
                  borderRadius: 4,
                  border: `1px solid ${C.borderLight}`,
                  marginBottom: 24,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>
                    연중 휴가 계획 안내
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 10, color: C.muted, lineHeight: 1.8 }}>
                    <li>장기적인 휴가 일정을 미리 등록하는 기능입니다.</li>
                    <li>여러 날짜를 선택하고 휴가/연차/휴무를 나눠서 입력합니다.</li>
                    <li>시스템이 자동으로 검토하여 반영 여부를 판단합니다.</li>
                  </ul>
                </div>

                {/* 휴가 계획 내역 */}
                <div style={{
                  backgroundColor: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  overflow: "hidden",
                }}>
                  <div style={{
                    padding: "16px 20px",
                    borderBottom: `1px solid ${C.border}`,
                    backgroundColor: "#FAFAF8",
                  }}>
                    <h3 style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.navy,
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      나의 휴가 계획 ({vacationPlans.length}건)
                    </h3>
                  </div>

                  {vacationPlans.length === 0 ? (
                    <div style={{ padding: "60px 20px", textAlign: "center" }}>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
                        휴가 계획이 없습니다.
                      </div>
                      <div style={{ fontSize: 11, color: C.muted }}>
                        연중 휴가 계획 신청 버튼을 눌러 신청해주세요.
                      </div>
                    </div>
                  ) : (
                    <div style={{ overflow: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>기간</th>
                            <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>총일수</th>
                            <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>휴가</th>
                            <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>연차</th>
                            <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>휴무</th>
                            <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>사유</th>
                            <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>상태</th>
                            <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>신청일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vacationPlans.map((plan, i) => (
                            <tr
                              key={plan.id}
                              style={{
                                backgroundColor: i % 2 === 0 ? C.white : C.rowAlt,
                              }}
                            >
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11.5, color: C.charcoal }}>
                                {plan.startDate} ~ {plan.endDate}
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 11.5, fontWeight: 600, color: C.navy }}>
                                {plan.totalDays}일
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 11.5, color: C.charcoal }}>
                                {plan.vacationDays}일
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 11.5, color: C.charcoal }}>
                                {plan.annualLeaveDays}일
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 11.5, color: C.charcoal }}>
                                {plan.offDays}일
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11, color: plan.reason ? C.charcoal : C.muted }}>
                                {plan.reason || "—"}
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center" }}>
                                {getStatusBadge(plan.status)}
                              </td>
                              <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11, color: C.muted, textAlign: "center" }}>
                                {plan.createdAt}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 모달들 */}
      <CreateRequestModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateRequest}
        balance={balance}
        year={selectedYear}
        month={selectedMonth}
      />

      <WeekendHolidayWorkModal
        open={weekendHolidayModalOpen}
        onClose={() => setWeekendHolidayModalOpen(false)}
        onCreate={handleCreateWeekendHoliday}
        onCancel={handleCancelWeekendHoliday}
        year={selectedYear}
        month={selectedMonth}
        existingRequests={requests}
      />

      <EducationModal
        open={educationModalOpen}
        onClose={() => setEducationModalOpen(false)}
        onCreate={handleCreateEducation}
      />

      <SickLeaveModal
        open={sickLeaveModalOpen}
        onClose={() => setSickLeaveModalOpen(false)}
        onCreate={handleCreateSickLeave}
      />

      <VacationPlanModal
        open={vacationPlanModalOpen}
        onClose={() => setVacationPlanModalOpen(false)}
        onCreate={handleCreateVacationPlan}
        balance={balance}
        year={selectedYear}
        month={selectedMonth}
      />

      <RequestDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        request={selectedRequest}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteRequest}
        isDeadlineClosed={isDeadlineClosed}
      />

      <EditRequestModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        request={selectedRequest}
        onUpdate={handleUpdateRequest}
        balance={balance}
        year={selectedYear}
        month={selectedMonth}
      />

      {/* Toast 알림 — 전역 ToastContainer에서 처리 */}
    </AppLayout>
  );
}
