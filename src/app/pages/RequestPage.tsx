import { useState, useEffect } from "react";
import type React from "react";
import AppLayout from "../components/layout/AppLayout";

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
type RequestType = "휴가" | "SL" | "연차";
type FinalType = "휴가" | "SL" | "연차" | "휴무" | "공휴";
type RequestStatus = "신청 접수" | "자동 반영 가능" | "자동 반영 완료" | "검토 필요" | "반영 불가";

interface MyRequest {
  id: number;
  dates: string[]; // 다중 날짜 지원
  type: RequestType; // 신청 유형
  finalType?: FinalType; // 최종 반영 유형
  reason: string;
  status: RequestStatus;
  createdAt: string;
  note?: string; // 시스템 메시지 (운영상 사유 등)
  adjustmentReason?: string; // 반영 조정 사유
}

interface EmployeeBalance {
  vacationTotal: number;    // 휴가 총
  vacation: number;         // 휴가 잔여
  annualLeaveTotal: number; // 연차 총
  annualLeave: number;      // 연차 잔여
}

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */
const INITIAL_BALANCE: EmployeeBalance = {
  vacationTotal: 15,
  vacation: 5,
  annualLeaveTotal: 15,
  annualLeave: 12,
};

const MOCK_REQUESTS: MyRequest[] = [
  {
    id: 1,
    dates: ["2026-04-15", "2026-04-16"],
    type: "연차",
    finalType: "휴무",
    reason: "개인 사유",
    status: "자동 반영 완료",
    createdAt: "2026-03-20",
    adjustmentReason: "14일 4휴무 규칙에 따라 휴무로 반영되었습니다.",
  },
  {
    id: 2,
    dates: ["2026-04-22"],
    type: "휴가",
    finalType: "휴가",
    reason: "",
    status: "검토 필요",
    createdAt: "2026-03-18",
    note: "해당 날짜는 최소 운영 인원 부족으로 관리자 검토가 필요합니다.",
  },
  {
    id: 3,
    dates: ["2026-04-10"],
    type: "SL",
    finalType: "SL",
    reason: "병원 진료",
    status: "자동 반영 완료",
    createdAt: "2026-04-09",
  },
];

/* ══════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
══════════════════════════════════════════════════════════ */
function getStatusBadge(status: RequestStatus) {
  const map: Record<RequestStatus, { bg: string; color: string; border: string; label: string }> = {
    "신청 접수": { bg: C.pendingBg, color: C.pending, border: C.pendingBorder, label: "신청 접수" },
    "자동 반영 가능": { bg: C.okBg, color: C.ok, border: C.okBorder, label: "자동 반영 가능" },
    "자동 반영 완료": { bg: C.okBg, color: C.ok, border: C.okBorder, label: "자동 반영 완료" },
    "검토 필요": { bg: C.warnBg, color: C.warning, border: C.warnBorder, label: "검토 필요" },
    "반영 불가": { bg: C.riskBg, color: C.risk, border: C.riskBorder, label: "반영 불가" },
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

function getTypeBadge(type: RequestType | FinalType, label?: string) {
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      fontSize: 10,
      fontWeight: 600,
      borderRadius: 3,
      backgroundColor: C.goldBg,
      color: "#7A5518",
      border: `1px solid ${C.goldBorder}`,
      whiteSpace: "nowrap",
    }}>
      {label || type}
    </span>
  );
}

function getFinalTypeBadge(finalType: FinalType, isChanged: boolean) {
  // 변경된 경우 회색 계열로 표시
  if (isChanged) {
    return (
      <span style={{
        display: "inline-block",
        padding: "3px 10px",
        fontSize: 10,
        fontWeight: 600,
        borderRadius: 3,
        backgroundColor: "rgba(123,131,144,0.1)",
        color: "#5A6574",
        border: `1px solid rgba(123,131,144,0.25)`,
        whiteSpace: "nowrap",
      }}>
        {finalType}
      </span>
    );
  }
  
  // 변경되지 않은 경우 골드 계열
  return getTypeBadge(finalType);
}

function formatDateRange(dates: string[]): string {
  if (dates.length === 0) return "";
  if (dates.length === 1) return dates[0];
  const sorted = [...dates].sort();
  return `${sorted[0]} 외 ${dates.length - 1}일`;
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
}: {
  selectedDates: string[];
  onDateToggle: (date: string) => void;
  year: number;
  month: number;
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
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   신청 생성 모달
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
  onCreate: (request: Partial<MyRequest>) => void;
  balance: EmployeeBalance;
  year: number;
  month: number;
}) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [type, setType] = useState<RequestType>("휴가");
  const [reason, setReason] = useState("");
  const [weekendPref, setWeekendPref] = useState<"휴무 희망" | "근무 희망" | "상관없음">("상관없음");
  const [holidayPref, setHolidayPref] = useState<"휴무 희망" | "근무 희망" | "상관없음">("상관없음");

  const handleDateToggle = (date: string) => {
    // SL 연속 사용 방지
    if (type === "SL") {
      const sorted = [...selectedDates, date].sort();
      // 연속 날짜 체크
      for (let i = 0; i < sorted.length - 1; i++) {
        const d1 = new Date(sorted[i]);
        const d2 = new Date(sorted[i + 1]);
        const diff = Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          alert("SL은 연속 날짜로 신청할 수 없습니다.");
          return;
        }
      }
    }

    setSelectedDates(prev =>
      prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date].sort()
    );
  };

  const handleCreate = () => {
    if (selectedDates.length > 0) {
      onCreate({
        dates: selectedDates,
        type,
        reason,
        status: "신청 접수",
        createdAt: new Date().toISOString().split("T")[0],
      });
      // Reset
      setSelectedDates([]);
      setType("휴가");
      setReason("");
      setWeekendPref("상관없음");
      setHolidayPref("상관없음");
      onClose();
    }
  };

  const canCreate = selectedDates.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="근태 신청"
      description="쉬고 싶은 날짜를 달력에서 선택해주세요. 여러 날짜를 동시에 선택할 수 있습니다."
      width={720}
    >
      <div style={{ padding: 24 }}>
        {/* 잔여 수량 (직원 입력 기준) */}
        <div style={{
          padding: 16,
          backgroundColor: C.bg,
          borderRadius: 4,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 12 }}>
            내 잔여 수량 <span style={{ fontSize: 10, fontWeight: 400, color: C.muted }}>(직원 입력 기준)</span>
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
          {type === "SL" && (
            <div style={{
              marginTop: 8,
              padding: 8,
              backgroundColor: C.warnBg,
              border: `1px solid ${C.warnBorder}`,
              borderRadius: 3,
              fontSize: 10,
              color: C.warning,
            }}>
              SL은 연속 날짜로 신청할 수 없습니다.
            </div>
          )}
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

        <div style={{ display: "grid", gap: 16 }}>
          {/* 신청 유형 */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
              신청 유형 *
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["휴가", "SL", "연차"] as RequestType[]).map(t => (
                <label
                  key={t}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "10px 14px",
                    border: `2px solid ${type === t ? C.navy : C.border}`,
                    borderRadius: 4,
                    cursor: "pointer",
                    backgroundColor: type === t ? "rgba(13,27,42,0.04)" : C.white,
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={type === t}
                    onChange={(e) => setType(e.target.value as RequestType)}
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: type === t ? C.navy : C.charcoal }}>
                    {t}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 사유 (선택) */}
          <div>
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
        </div>

        <div style={{
          padding: 12,
          backgroundColor: C.pendingBg,
          border: `1px solid ${C.pendingBorder}`,
          borderRadius: 4,
          marginTop: 16,
        }}>
          <div style={{ fontSize: 10, color: C.pending, lineHeight: 1.6 }}>
            신청 후 시스템이 자동으로 운영 조건을 확인하여 반영 여부를 판단합니다.<br />
            14일 4휴무 규칙 우선 반영으로 신청 유형과 실제 반영 유형이 다를 수 있습니다.
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
          일괄 신청하기
        </button>
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
  // 기존 신청 날짜를 초기값으로 설정
  const [selectedDates, setSelectedDates] = useState<string[]>(request?.dates || []);
  const [type, setType] = useState<RequestType>(request?.type || "휴가");
  const [reason, setReason] = useState(request?.reason || "");
  
  // request가 변경될 때마다 초기화
  useEffect(() => {
    if (open && request) {
      setSelectedDates(request.dates);
      setType(request.type);
      setReason(request.reason);
    }
  }, [open, request]);
  
  if (!request) return null;

  const handleDateToggle = (date: string) => {
    // SL 연속 사용 방지
    if (type === "SL") {
      const sorted = [...selectedDates, date].sort();
      for (let i = 0; i < sorted.length - 1; i++) {
        const d1 = new Date(sorted[i]);
        const d2 = new Date(sorted[i + 1]);
        const diff = Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          alert("SL은 연속 날짜로 신청할 수 없습니다.");
          return;
        }
      }
    }

    setSelectedDates(prev =>
      prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date].sort()
    );
  };

  const handleUpdate = () => {
    if (selectedDates.length > 0) {
      const updatedRequest: MyRequest = {
        ...request,
        dates: selectedDates,
        type,
        reason,
      };
      onUpdate(updatedRequest);
      onClose();
    }
  };

  const canUpdate = selectedDates.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="근태 신청 수정"
      description="기존 신청 내역을 수정합니다. 날짜와 유형, 사유를 변경할 수 있습니다."
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
            ⚠️ 일괄 신청 수정 안내
          </div>
          <div style={{ fontSize: 10, color: C.charcoal, marginBottom: 10, lineHeight: 1.6 }}>
            이 신청은 <strong style={{ color: C.navy }}>{request.dates.length}개 날짜</strong>를 일괄 신청한 건입니다. 
            수정 시 <strong style={{ color: C.navy }}>모든 날짜가 함께 변경</strong>됩니다.
          </div>
          <div style={{ fontSize: 10, color: C.charcoal, lineHeight: 1.6 }}>
            • 기존 신청 날짜: <strong style={{ color: C.navy }}>{request.dates.join(", ")}</strong><br />
            • 신청 유형: <strong style={{ color: C.navy }}>{request.type}</strong><br />
            • 현재 상태: <strong style={{ color: C.navy }}>{request.status}</strong>
          </div>
          <div style={{ 
            marginTop: 10,
            paddingTop: 10,
            borderTop: `1px solid ${C.warnBorder}`,
            fontSize: 10, 
            color: C.muted,
            lineHeight: 1.6
          }}>
            💡 <strong>개별 날짜만 수정하고 싶으신가요?</strong><br />
            현재 신청을 삭제한 후, 원하는 날짜만 별도로 신청해주세요.
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
            내 잔여 수량 <span style={{ fontSize: 10, fontWeight: 400, color: C.charcoal }}>(직원 입력 기준)</span>
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
            selectedDates={selectedDates}
            onDateToggle={handleDateToggle}
            year={year}
            month={month}
          />
          {type === "SL" && (
            <div style={{
              marginTop: 8,
              padding: 8,
              backgroundColor: C.warnBg,
              border: `1px solid ${C.warnBorder}`,
              borderRadius: 3,
              fontSize: 10,
              color: C.warning,
            }}>
              SL은 연속 날짜로 신청할 수 없습니다.
            </div>
          )}
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

        <div style={{ display: "grid", gap: 16 }}>
          {/* 신청 유형 */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
              신청 유형 *
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["휴가", "SL", "연차"] as RequestType[]).map(t => (
                <label
                  key={t}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "10px 14px",
                    border: `2px solid ${type === t ? C.navy : C.border}`,
                    borderRadius: 4,
                    cursor: "pointer",
                    backgroundColor: type === t ? "rgba(13,27,42,0.04)" : C.white,
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={type === t}
                    onChange={(e) => setType(e.target.value as RequestType)}
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: type === t ? C.navy : C.charcoal }}>
                    {t}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 사유 */}
          <div>
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
        </div>

        <div style={{
          padding: 12,
          backgroundColor: C.pendingBg,
          border: `1px solid ${C.pendingBorder}`,
          borderRadius: 4,
          marginTop: 16,
        }}>
          <div style={{ fontSize: 10, color: C.pending, lineHeight: 1.6 }}>
            수정 저장 시 기존 신청이 업데이트됩니다. 새로운 신청이 추가되지 않습니다.
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
          수정 저장
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   신청 상세 모달
══════════════════════════════════════════════════════════ */
function RequestDetailModal({
  open,
  onClose,
  request,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  request?: MyRequest;
  onEdit: (request: MyRequest) => void;
  onDelete: (id: number) => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!request) return null;

  const handleDelete = () => {
    onDelete(request.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const isDifferent = request.finalType && request.type !== request.finalType;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="신청 상세"
      description="내가 신청한 근태 내역입니다."
      width={650}
    >
      <div style={{ padding: 24 }}>
        <div style={{
          padding: 16,
          backgroundColor: C.bg,
          borderRadius: 4,
          marginBottom: 20,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>신청 날짜</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoal }}>
                {request.dates.length}일: {request.dates.join(", ")}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>신청일</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoal }}>{request.createdAt}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>신청 유형</div>
              <div>{getTypeBadge(request.type)}</div>
            </div>
            {request.finalType && (
              <div>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>최종 반영</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {getFinalTypeBadge(request.finalType, isDifferent)}
                  {isDifferent && (
                    <span style={{ fontSize: 9, color: C.warning }}>변경됨</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {request.reason && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>사유</div>
              <div style={{ fontSize: 12, color: C.charcoal }}>{request.reason}</div>
            </div>
          )}
        </div>

        {/* 반영 결과 */}
        {request.adjustmentReason && (
          <div style={{
            padding: 16,
            backgroundColor: C.warnBg,
            border: `1px solid ${C.warnBorder}`,
            borderRadius: 4,
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.warning, marginBottom: 8 }}>
              반영 조정 안내
            </div>
            <div style={{ fontSize: 11, color: C.charcoal, lineHeight: 1.6 }}>
              {request.adjustmentReason}
            </div>
          </div>
        )}

        {/* 상태 */}
        <div style={{
          padding: 16,
          backgroundColor: "#FAFAF8",
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>현재 상태</div>
          <div style={{ marginBottom: 12 }}>{getStatusBadge(request.status)}</div>
          {request.note && (
            <div style={{ fontSize: 11, color: C.charcoal, lineHeight: 1.6, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.borderLight}` }}>
              {request.note}
            </div>
          )}
        </div>

        {/* 삭제 확인 */}
        {showDeleteConfirm && (
          <div style={{
            padding: 16,
            backgroundColor: C.riskBg,
            border: `1px solid ${C.riskBorder}`,
            borderRadius: 4,
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.risk, marginBottom: 8 }}>
              정말 삭제하시겠습니까?
            </div>
            <div style={{ fontSize: 10, color: C.charcoal, marginBottom: 12 }}>
              이 작업은 되돌릴 수 없습니다.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: "7px 16px",
                  backgroundColor: C.white,
                  color: C.charcoal,
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: "7px 16px",
                  backgroundColor: C.risk,
                  color: C.white,
                  border: "none",
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                삭제 확정
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{
        padding: "16px 24px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "space-between",
        backgroundColor: "#FAFAF8",
      }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onEdit(request)}
            style={{
              padding: "9px 16px",
              backgroundColor: C.white,
              color: C.navy,
              border: `1px solid ${C.navy}`,
              borderRadius: 3,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            수정
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: "9px 16px",
              backgroundColor: C.white,
              color: C.risk,
              border: `1px solid ${C.riskBorder}`,
              borderRadius: 3,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            삭제
          </button>
        </div>

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
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function RequestPage() {
  const [requests, setRequests] = useState<MyRequest[]>(MOCK_REQUESTS);
  const [balance, setBalance] = useState<EmployeeBalance>(INITIAL_BALANCE);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MyRequest | null>(null);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // 최종 신청 상태
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const [finalSubmittedAt, setFinalSubmittedAt] = useState<string | null>(null);
  const [finalSubmitModalOpen, setFinalSubmitModalOpen] = useState(false);

  const handleCreate = (newRequest: Partial<MyRequest>) => {
    const request: MyRequest = {
      id: Date.now(),
      ...newRequest as MyRequest,
    };
    setRequests(prev => [request, ...prev]);
  };

  const handleEdit = (request: MyRequest) => {
    // 상세 모달 닫고 수정 모달 열기
    setSelectedRequest(request);
    setDetailModalOpen(false);
    setEditModalOpen(true);
  };
  
  const handleUpdate = (updatedRequest: MyRequest) => {
    // 기존 건 업데이트 (신규 추가 X)
    setRequests(prev =>
      prev.map(req =>
        req.id === updatedRequest.id ? updatedRequest : req
      )
    );
    
    // 성공 피드백 표시
    setUpdateSuccess(true);
    setTimeout(() => setUpdateSuccess(false), 3000);
  };

  const handleDelete = (id: number) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleRowClick = (req: MyRequest) => {
    setSelectedRequest(req);
    setDetailModalOpen(true);
  };

  const completedCount = requests.filter(r => r.status === "자동 반영 완료").length;
  const pendingCount = requests.filter(r => r.status === "검토 필요").length;

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
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                근태 신청
              </h1>
            </div>
            <button
              onClick={() => setCreateModalOpen(true)}
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
              + 신청하기
            </button>
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
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>

              <div style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>
                자동 반영 완료 {completedCount}건 · 검토 필요 {pendingCount}건
              </div>
            </div>

            {/* 잔여 수량 */}
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: C.muted }}>휴가 잔여</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>
                  {balance.vacationTotal}일 중 {balance.vacation}일
                </span>
              </div>
              <div style={{ width: 1, height: 16, backgroundColor: C.border }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: C.muted }}>연차 잔여</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>
                  {balance.annualLeaveTotal}일 중 {balance.annualLeave}일
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 40px" }}>
          <div style={{
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            overflow: "auto",
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${C.border}`,
              backgroundColor: "#F7F4EF",
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Inter', sans-serif" }}>
                내 신청 내역
              </h3>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>날짜</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>신청 유형</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>최종 반영</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>사유</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>상태</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>신청일</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {requests.flatMap((req) => {
                  // 각 날짜마다 별도의 행으로 표시
                  return req.dates.map((date, dateIdx) => {
                    const rowIndex = requests.slice(0, requests.indexOf(req)).reduce((acc, r) => acc + r.dates.length, 0) + dateIdx;
                    const rowBg = rowIndex % 2 === 1 ? C.rowAlt : C.white;
                    const isDifferent = req.finalType && req.type !== req.finalType;

                    return (
                      <tr
                        key={`${req.id}-${date}`}
                        onClick={() => handleRowClick(req)}
                        style={{ cursor: "pointer" }}
                      >
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11, fontWeight: 600, color: C.navy, backgroundColor: rowBg, fontFamily: "'Inter', sans-serif" }}>
                          {date}
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                          {getTypeBadge(req.type)}
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                          {req.finalType ? (
                            getFinalTypeBadge(req.finalType, isDifferent)
                          ) : (
                            <span style={{ fontSize: 11, color: C.muted }}>대기중</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11, color: C.charcoal, backgroundColor: rowBg }}>
                          {req.reason || "-"}
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                          {getStatusBadge(req.status)}
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 11, color: C.charcoal, backgroundColor: rowBg, fontFamily: "'Inter', sans-serif" }}>
                          {req.createdAt}
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(req);
                            }}
                            style={{
                              padding: "5px 12px",
                              backgroundColor: "transparent",
                              color: C.muted,
                              border: `1px solid ${C.border}`,
                              borderRadius: 3,
                              fontSize: 10,
                              fontWeight: 600,
                              cursor: "pointer",
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            상세
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>

            {requests.length === 0 && (
              <div style={{
                padding: "60px 20px",
                textAlign: "center",
                color: C.muted,
                fontSize: 13,
              }}>
                아직 신청한 내역이 없습니다.
              </div>
            )}
          </div>

          {/* 안내 */}
          <div style={{
            marginTop: 24,
            padding: 16,
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.navy, marginBottom: 10 }}>
              근태 신청 안내
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: C.charcoal, lineHeight: 1.8 }}>
              <li>신청 가능 유형: 휴가, SL, 연차</li>
              <li>여러 날짜를 동시에 선택하여 일괄 신청할 수 있습니다.</li>
              <li>공휴일은 별도 신청 없이 시스템에서 자동으로 운영 조건에 따라 배정됩니다.</li>
              <li>14일 4휴무 규칙 우선 반영으로 신청 유형과 실제 반영 유형이 다를 수 있습니다.</li>
              <li>자동 반영 완료된 신청도 수정 및 삭제가 가능합니다.</li>
              <li>휴가 및 연차는 자동 반영 완료 시 잔여 수량이 차감됩니다.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 모달 */}
      <CreateRequestModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
        balance={balance}
        year={selectedYear}
        month={selectedMonth}
      />

      <EditRequestModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        request={selectedRequest}
        onUpdate={handleUpdate}
        balance={balance}
        year={selectedYear}
        month={selectedMonth}
      />

      <RequestDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        request={selectedRequest}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      
      {/* 성공 피드백 */}
      {updateSuccess && (
        <div style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "12px 20px",
          backgroundColor: C.ok,
          color: C.white,
          borderRadius: 3,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "'Inter', sans-serif",
          zIndex: 1001,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          ✓ 수정이 성공적으로 저장되었습니다.
        </div>
      )}
    </AppLayout>
  );
}