import { useState } from "react";
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
type FinalType = "휴가" | "SL" | "연차" | "휴무" | "공휴" | "미반영";
type RequestStatus = "신청 접수" | "자동 반영 완료" | "검토 필요" | "반영 불가";

interface AttendanceRequest {
  id: number;
  employeeName: string;
  employeeId: number;
  date: string;
  type: RequestType; // 신청 유형
  finalType?: FinalType; // 최종 반영
  reason: string;
  status: RequestStatus;
  createdAt: string;
  autoNote?: string; // 자동 반영 사유
  conflictNote?: string; // 운영 충돌 사유
}

interface EmployeeBalance {
  employeeId: number;
  employeeName: string;
  vacationTotal: number;    // 휴가 총
  vacation: number;         // 휴가 잔여
  annualLeaveTotal: number; // 연차 총
  annualLeave: number;      // 연차 잔여
}

interface EmployeeSummary {
  employeeId: number;
  employeeName: string;
  totalRequests: number;
  dates: string[];
  types: { [key in RequestType]?: number };
  autoCompleted: number;
  reviewNeeded: number;
  cannotReflect: number;
  notReflected: number; // 미반영 건수 (검토 필요 + 반영 불가)
  vacationTotal: number;
  vacation: number;
  annualLeaveTotal: number;
  annualLeave: number;
  requests: AttendanceRequest[];
}

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */
const MOCK_REQUESTS: AttendanceRequest[] = [
  {
    id: 1,
    employeeName: "김민준",
    employeeId: 1,
    date: "2026-04-15",
    type: "연차",
    finalType: "휴무",
    reason: "개인 사유",
    status: "자동 반영 완료",
    createdAt: "2026-03-20",
    autoNote: "14일 4휴무 규칙 우선 반영으로 휴무 처리되었습니다.",
  },
  {
    id: 2,
    employeeName: "이서연",
    employeeId: 2,
    date: "2026-04-22",
    type: "휴가",
    finalType: "휴가",
    reason: "가족 행사",
    status: "자동 반영 완료",
    createdAt: "2026-03-18",
    autoNote: "자동 반영 완료되었습니다.",
  },
  {
    id: 3,
    employeeName: "박지호",
    employeeId: 3,
    date: "2026-04-10",
    type: "SL",
    finalType: "SL",
    reason: "병원 진료",
    status: "자동 반영 완료",
    createdAt: "2026-04-09",
    autoNote: "자동 반영 완료되었습니다.",
  },
  {
    id: 4,
    employeeName: "최유진",
    employeeId: 4,
    date: "2026-04-05",
    type: "연차",
    finalType: "미반영",
    reason: "여행",
    status: "검토 필요",
    createdAt: "2026-03-25",
    conflictNote: "최소 운영 인원 부족으로 검토가 필요합니다.",
  },
  {
    id: 5,
    employeeName: "정현우",
    employeeId: 5,
    date: "2026-04-18",
    type: "휴가",
    finalType: "미반영",
    reason: "개인 사유",
    status: "반영 불가",
    createdAt: "2026-03-15",
    conflictNote: "수요 예측 최소 인원 충족 불가로 반영할 수 없습니다.",
  },
  {
    id: 6,
    employeeName: "김민준",
    employeeId: 1,
    date: "2026-04-20",
    type: "연차",
    finalType: "휴무",
    reason: "",
    status: "자동 반영 완료",
    createdAt: "2026-04-01",
    autoNote: "14일 4휴무 규칙 우선 반영으로 휴무 처리되었습니다.",
  },
  {
    id: 7,
    employeeName: "김민준",
    employeeId: 1,
    date: "2026-04-23",
    type: "SL",
    finalType: "SL",
    reason: "병원 진료",
    status: "자동 반영 완료",
    createdAt: "2026-04-10",
    autoNote: "자동 반영 완료되었습니다.",
  },
  {
    id: 8,
    employeeName: "최유진",
    employeeId: 4,
    date: "2026-04-12",
    type: "휴가",
    finalType: "미반영",
    reason: "가족 행사",
    status: "반영 불가",
    createdAt: "2026-03-28",
    conflictNote: "수요 예측 최소 인원 충족 불가로 반영할 수 없습니다.",
  },
];

const INITIAL_BALANCES: EmployeeBalance[] = [
  { employeeId: 1, employeeName: "김민준", vacationTotal: 15, vacation: 5, annualLeaveTotal: 15, annualLeave: 12 },
  { employeeId: 2, employeeName: "이서연", vacationTotal: 15, vacation: 2, annualLeaveTotal: 15, annualLeave: 8 },
  { employeeId: 3, employeeName: "박지호", vacationTotal: 15, vacation: 4, annualLeaveTotal: 15, annualLeave: 10 },
  { employeeId: 4, employeeName: "최유진", vacationTotal: 15, vacation: 6, annualLeaveTotal: 15, annualLeave: 15 },
  { employeeId: 5, employeeName: "정현우", vacationTotal: 15, vacation: 3, annualLeaveTotal: 15, annualLeave: 9 },
];

/* ══════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
══════════════════════════════════════════════════════════ */
function groupByEmployee(requests: AttendanceRequest[], balances: EmployeeBalance[]): EmployeeSummary[] {
  const grouped = new Map<number, EmployeeSummary>();

  requests.forEach(req => {
    if (!grouped.has(req.employeeId)) {
      const balance = balances.find(b => b.employeeId === req.employeeId);
      grouped.set(req.employeeId, {
        employeeId: req.employeeId,
        employeeName: req.employeeName,
        totalRequests: 0,
        dates: [],
        types: {},
        autoCompleted: 0,
        reviewNeeded: 0,
        cannotReflect: 0,
        notReflected: 0,
        vacationTotal: balance?.vacationTotal || 15,
        vacation: balance?.vacation || 0,
        annualLeaveTotal: balance?.annualLeaveTotal || 15,
        annualLeave: balance?.annualLeave || 0,
        requests: [],
      });
    }

    const summary = grouped.get(req.employeeId)!;
    summary.totalRequests++;
    summary.dates.push(req.date);
    summary.types[req.type] = (summary.types[req.type] || 0) + 1;
    summary.requests.push(req);

    if (req.status === "자동 반영 완료") summary.autoCompleted++;
    if (req.status === "검토 필요") {
      summary.reviewNeeded++;
      summary.notReflected++;
    }
    if (req.status === "반영 불가") {
      summary.cannotReflect++;
      summary.notReflected++;
    }
  });

  return Array.from(grouped.values()).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}

function formatDatesSummary(dates: string[]): string {
  if (dates.length === 0) return "-";
  if (dates.length === 1) return dates[0];
  const sorted = [...dates].sort();
  if (dates.length <= 3) {
    return sorted.join(", ");
  }
  return `${sorted[0]} 외 ${dates.length - 1}건`;
}

function getStatusBadge(status: RequestStatus) {
  const map: Record<RequestStatus, { bg: string; color: string; border: string; label: string }> = {
    "신청 접수": { bg: C.pendingBg, color: C.pending, border: C.pendingBorder, label: "신청 접수" },
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

function getFinalTypeBadge(finalType: FinalType, requestType: RequestType) {
  const isDifferent = finalType !== requestType && finalType !== "미반영";
  
  // 미반영인 경우
  if (finalType === "미반영") {
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
  
  // 변경된 경우 회색 계열로 표시
  if (isDifferent) {
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
   근태 신청 수정 모달
══════════════════════════════════════════════════════════ */
function RequestEditModal({
  open,
  onClose,
  request,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  request: AttendanceRequest | null;
  onSave: (updatedRequest: AttendanceRequest) => void;
}) {
  const [date, setDate] = useState(request?.date || "");
  const [type, setType] = useState<RequestType>(request?.type || "휴가");
  const [reason, setReason] = useState(request?.reason || "");

  // 모달이 열릴 때 request 데이터로 초기화
  useState(() => {
    if (open && request) {
      setDate(request.date);
      setType(request.type);
      setReason(request.reason);
    }
  });
  
  if (!request) return null;

  const handleSave = () => {
    const updatedRequest: AttendanceRequest = {
      ...request,
      date,
      type,
      reason,
    };
    onSave(updatedRequest);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="근태 신청 수정"
      description={`${request.employeeName} 직원의 근태 신청 내역을 수정합니다.`}
      width={600}
    >
      <div style={{ padding: 24 }}>
        {/* 날짜 선택 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>
            신청 날짜
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
              fontSize: 12,
              fontFamily: "'Inter', sans-serif",
            }}
          />
        </div>

        {/* 유형 선택 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>
            신청 유형
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            {(["휴가", "SL", "연차"] as RequestType[]).map(t => (
              <label
                key={t}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 14px",
                  border: `2px solid ${type === t ? C.gold : C.border}`,
                  borderRadius: 4,
                  cursor: "pointer",
                  backgroundColor: type === t ? C.goldBg : C.white,
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
                <span style={{ fontSize: 12, fontWeight: 600, color: type === t ? "#7A5518" : C.charcoal }}>
                  {t}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 사유 입력 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>
            사유
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="신청 사유를 입력해주세요 (선택사항)"
            rows={3}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              fontSize: 12,
              fontFamily: "'Inter', sans-serif",
              resize: "vertical",
            }}
          />
        </div>

        {/* 기존 정보 표시 */}
        <div style={{
          padding: 14,
          backgroundColor: C.bg,
          borderRadius: 4,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, marginBottom: 8 }}>
            기존 신청 정보
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 10, color: C.charcoal }}>
            <div>
              <div style={{ color: C.muted, marginBottom: 4 }}>날짜</div>
              <div style={{ fontWeight: 600, color: C.navy }}>{request.date}</div>
            </div>
            <div>
              <div style={{ color: C.muted, marginBottom: 4 }}>유형</div>
              <div style={{ fontWeight: 600, color: C.navy }}>{request.type}</div>
            </div>
            <div>
              <div style={{ color: C.muted, marginBottom: 4 }}>상태</div>
              <div style={{ fontWeight: 600, color: C.navy }}>{request.status}</div>
            </div>
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
          onClick={handleSave}
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
          저장
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   직원별 신청 상세 검토 모달
══════════════════════════════════════════════════════════ */
function EmployeeDetailModal({
  open,
  onClose,
  summary,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  summary?: EmployeeSummary;
  onEdit: (request: AttendanceRequest) => void;
}) {
  if (!summary) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${summary.employeeName} 직원 근태 신청 상세`}
      description={`총 ${summary.totalRequests}건의 신청 내역 및 자동 반영 결과입니다.`}
      width={900}
    >
      <div style={{ padding: 24 }}>
        {/* 직원 정보 요약 */}
        <div style={{
          padding: 16,
          backgroundColor: C.bg,
          borderRadius: 4,
          marginBottom: 20,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>직원명</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{summary.employeeName}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>총 신청 건수</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>{summary.totalRequests}건</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>미반영 건수</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: summary.notReflected > 0 ? C.risk : C.ok }}>
                {summary.notReflected}건
              </div>
            </div>
          </div>
        </div>

        {/* 직원 휴가/연차 잔여 */}
        <div style={{
          padding: 16,
          backgroundColor: C.okBg,
          border: `1px solid ${C.okBorder}`,
          borderRadius: 4,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.ok, marginBottom: 12 }}>
            직원 잔여 수량 <span style={{ fontSize: 10, fontWeight: 400, color: C.charcoal }}>(직원 입력 기준)</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: C.charcoal, marginBottom: 4 }}>휴가 잔여</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
                {summary.vacationTotal}일 중 {summary.vacation}일
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.charcoal, marginBottom: 4 }}>연차 잔여</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
                {summary.annualLeaveTotal}일 중 {summary.annualLeave}일
              </div>
            </div>
          </div>
        </div>

        {/* 날짜별 신청 내역 테이블 */}
        <div style={{
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          overflow: "hidden",
        }}>
          <div style={{
            padding: "12px 16px",
            backgroundColor: "#F7F4EF",
            borderBottom: `1px solid ${C.border}`,
          }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: "'Inter', sans-serif" }}>
              날짜별 신청 상세
            </h4>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 9, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAF8" }}>날짜</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 9, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAF8" }}>신청 유형</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 9, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAF8" }}>최종 반영</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 9, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAF8" }}>사유</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 9, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAF8" }}>상태</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 9, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAF8" }}>반영 사유</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 9, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAF8" }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {summary.requests.map((req, i) => {
                const rowBg = i % 2 === 1 ? C.rowAlt : C.white;
                return (
                  <tr key={req.id}>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11, fontWeight: 600, color: C.navy, backgroundColor: rowBg, fontFamily: "'Inter', sans-serif" }}>
                      {req.date}
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                      {getTypeBadge(req.type)}
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                      {req.finalType ? getFinalTypeBadge(req.finalType, req.type) : <span style={{ fontSize: 10, color: C.muted }}>대기중</span>}
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 10, color: C.charcoal, backgroundColor: rowBg }}>
                      {req.reason || "-"}
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                      {getStatusBadge(req.status)}
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 10, color: C.charcoal, backgroundColor: rowBg, lineHeight: 1.5 }}>
                      {req.autoNote || req.conflictNote || "-"}
                    </td>
                    <td style={{ padding: "10px 14px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                      <button
                        onClick={() => onEdit(req)}
                        style={{
                          padding: "4px 10px",
                          backgroundColor: "transparent",
                          color: C.navy,
                          border: `1px solid ${C.navy}`,
                          borderRadius: 3,
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        padding: "16px 24px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "flex-end",
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
          닫기
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function AttendancePage() {
  const [requests, setRequests] = useState<AttendanceRequest[]>(MOCK_REQUESTS);
  const [balances] = useState<EmployeeBalance[]>(INITIAL_BALANCES);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [selectedSummary, setSelectedSummary] = useState<EmployeeSummary | undefined>();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<AttendanceRequest | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // 필터
  const [filterStatus, setFilterStatus] = useState<"전체" | "미반영" | "완료">("전체");

  const handleRowClick = (summary: EmployeeSummary) => {
    setSelectedSummary(summary);
    setDetailModalOpen(true);
  };
  
  const handleEditRequest = (request: AttendanceRequest) => {
    setEditingRequest(request);
    setEditModalOpen(true);
  };
  
  const handleSaveRequest = (updatedRequest: AttendanceRequest) => {
    // 기존 건 업데이트 (신규 추가 X)
    setRequests(prev => 
      prev.map(req => 
        req.id === updatedRequest.id ? updatedRequest : req
      )
    );
    
    // 성공 피드백 표시
    setUpdateSuccess(true);
    setTimeout(() => setUpdateSuccess(false), 3000);
    
    // 상세 모달의 summary도 업데이트
    if (selectedSummary) {
      const updatedSummary = {
        ...selectedSummary,
        requests: selectedSummary.requests.map(req =>
          req.id === updatedRequest.id ? updatedRequest : req
        ),
      };
      setSelectedSummary(updatedSummary);
    }
  };

  // 직원별 그룹화
  const employeeSummaries = groupByEmployee(requests, balances);

  // 필터링
  const filteredSummaries = employeeSummaries.filter(summary => {
    if (filterStatus === "미반영" && summary.notReflected === 0) return false;
    if (filterStatus === "완료" && summary.notReflected > 0) return false;
    return true;
  });

  // 전체 통계
  const totalAutoCompleted = requests.filter(r => r.status === "자동 반영 완료").length;
  const totalReviewNeeded = requests.filter(r => r.status === "검토 필요").length;
  const totalCannotReflect = requests.filter(r => r.status === "반영 불가").length;
  const totalConflict = requests.filter(r => r.conflictNote).length;
  const employeesWithNotReflected = employeeSummaries.filter(s => s.notReflected > 0).length;

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
                근태 관리
              </h1>
            </div>
          </div>

          {/* 기간 및 요약 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
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
            </div>

            {/* 운영 결과 요약 */}
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: C.muted }}>자동 반영 완료</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.ok }}>{totalAutoCompleted}건</span>
              </div>
              <div style={{ width: 1, height: 16, backgroundColor: C.border }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: C.muted }}>검토 필요</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.warning }}>{totalReviewNeeded}건</span>
              </div>
              <div style={{ width: 1, height: 16, backgroundColor: C.border }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: C.muted }}>반영 불가</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.risk }}>{totalCannotReflect}건</span>
              </div>
              <div style={{ width: 1, height: 16, backgroundColor: C.border }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: C.muted }}>운영 충돌</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.charcoal }}>{totalConflict}건</span>
              </div>
              <div style={{ width: 1, height: 16, backgroundColor: C.border }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: C.muted }}>미반영 직원</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.risk }}>{employeesWithNotReflected}명</span>
              </div>
            </div>
          </div>

          {/* 필터 탭 */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            {(["전체", "미반영", "완료"] as const).map(status => {
              const isActive = filterStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: "7px 16px",
                    backgroundColor: isActive ? C.navy : C.white,
                    color: isActive ? "#EAE0CC" : C.charcoal,
                    border: `1px solid ${isActive ? C.navy : C.border}`,
                    borderRadius: 3,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {status}
                </button>
              );
            })}
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
                직원별 근태 신청 요약
              </h3>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>직원명</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>신청 건수</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>신청 날짜</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>신청 유형</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>반영 현황</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>휴가 잔여</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>연차 잔여</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredSummaries.map((summary, i) => {
                  const rowBg = i % 2 === 1 ? C.rowAlt : C.white;
                  const typesStr = Object.entries(summary.types)
                    .map(([type, count]) => `${type} ${count}건`)
                    .join(", ");

                  return (
                    <tr key={summary.employeeId}>
                      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 12, fontWeight: 600, color: C.navy, backgroundColor: rowBg, fontFamily: "'Inter', sans-serif" }}>
                        {summary.employeeName}
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 11, fontWeight: 600, color: C.charcoal, backgroundColor: rowBg, fontFamily: "'Inter', sans-serif" }}>
                        총 {summary.totalRequests}건
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 10, color: C.charcoal, backgroundColor: rowBg, fontFamily: "'Inter', sans-serif" }}>
                        {formatDatesSummary(summary.dates)}
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 10, color: C.charcoal, backgroundColor: rowBg }}>
                        {typesStr}
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 10, color: C.charcoal, backgroundColor: rowBg, fontFamily: "'Inter', sans-serif" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                            {summary.autoCompleted > 0 && (
                              <span style={{ color: C.ok, fontWeight: 600 }}>완료 {summary.autoCompleted}</span>
                            )}
                            {summary.reviewNeeded > 0 && (
                              <span style={{ color: C.warning, fontWeight: 600 }}>검토 {summary.reviewNeeded}</span>
                            )}
                            {summary.cannotReflect > 0 && (
                              <span style={{ color: C.risk, fontWeight: 600 }}>불가 {summary.cannotReflect}</span>
                            )}
                          </div>
                          {summary.notReflected > 0 && (
                            <div style={{
                              padding: "2px 8px",
                              backgroundColor: C.riskBg,
                              border: `1px solid ${C.riskBorder}`,
                              borderRadius: 2,
                              fontSize: 9,
                              fontWeight: 600,
                              color: C.risk,
                            }}>
                              미반영 {summary.notReflected}건
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 10, color: C.charcoal, backgroundColor: rowBg, fontFamily: "'Inter', sans-serif" }}>
                        {summary.vacationTotal}일 중 {summary.vacation}일
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 10, color: C.charcoal, backgroundColor: rowBg, fontFamily: "'Inter', sans-serif" }}>
                        {summary.annualLeaveTotal}일 중 {summary.annualLeave}일
                      </td>
                      <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                        <button
                          onClick={() => handleRowClick(summary)}
                          style={{
                            padding: "5px 12px",
                            backgroundColor: "transparent",
                            color: C.navy,
                            border: `1px solid ${C.navy}`,
                            borderRadius: 3,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          상세 검토
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredSummaries.length === 0 && (
              <div style={{
                padding: "60px 20px",
                textAlign: "center",
                color: C.muted,
                fontSize: 13,
              }}>
                해당 조건의 직원이 없습니다.
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
              근태 관리 안내
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: C.charcoal, lineHeight: 1.8 }}>
              <li>직원별로 여러 날짜 신청을 묶어서 관리할 수 있습니다.</li>
              <li>직원 신청은 자동으로 운영 조건을 검토하여 반영 여부가 결정됩니다.</li>
              <li>14일 4휴무 규칙 우선 반영으로 신청 유형과 실제 반영 유형이 다를 수 있습니다.</li>
              <li>미반영 건수는 검토 필요 + 반영 불가 건수의 합계입니다.</li>
              <li>상세 검토 버튼을 누르면 해당 직원의 날짜별 신청 상세를 확인할 수 있습니다.</li>
              <li>직원별 휴가/연차 잔여는 테이블에서 바로 확인 가능하며, 상세 검토에서 더 자세히 확인할 수 있습니다.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 직원별 상세 검토 모달 */}
      <EmployeeDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        summary={selectedSummary}
        onEdit={handleEditRequest}
      />
      
      {/* 근태 신청 수정 모달 */}
      <RequestEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        request={editingRequest}
        onSave={handleSaveRequest}
      />
      
      {/* 성공 피드백 */}
      {updateSuccess && (
        <div style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 20px",
          backgroundColor: C.okBg,
          color: C.ok,
          border: `1px solid ${C.okBorder}`,
          borderRadius: 3,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'Inter', sans-serif",
          zIndex: 1001,
        }}>
          수정이 성공적으로 저장되었습니다.
        </div>
      )}
    </AppLayout>
  );
}