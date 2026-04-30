import React, { useState, useEffect, useMemo } from "react";
import AppLayout from "../components/layout/AppLayout";
import { useAttendanceDeadline } from "../context/AttendanceDeadlineContext";
import { useToast } from "../context/ToastContext";
import { useAppContext } from "../context/AppContext";
import { X, Info, Shield, Plus, CheckCircle, XCircle, AlertTriangle, Loader } from "lucide-react";
import AttendanceRequestModal from "../components/AttendanceRequestModal";

/* ══════════════════════════════════════════════════════════
   COLOR TOKENS
══════════════════════════════════════════════════════════ */
const C = {
  navy:          "#0D1B2A",
  navyDeep:      "#091523",
  gold:          "#B99B5A",
  goldBg:        "rgba(185,155,90,0.08)",
  goldBorder:    "rgba(185,155,90,0.25)",
  bg:            "#F2EFE9",
  white:         "#FFFFFF",
  border:        "#E4DED4",
  borderLight:   "#EDE8E0",
  muted:         "#7B8390",
  charcoal:      "#2E3642",
  text:          "#1C2430",
  ok:            "#2E7D52",
  okBg:          "rgba(46,125,82,0.07)",
  okBorder:      "rgba(46,125,82,0.2)",
  warning:       "#B87C1A",
  warnBg:        "rgba(184,124,26,0.08)",
  warnBorder:    "rgba(184,124,26,0.22)",
  pending:       "#5E7FA3",
  pendingBg:     "rgba(94,127,163,0.08)",
  pendingBorder: "rgba(94,127,163,0.22)",
  risk:          "#B83232",
  riskBg:        "rgba(184,50,50,0.06)",
  riskBorder:    "rgba(184,50,50,0.22)",
  rowAlt:        "#FAFAF8",
};

/* ══════════════════════════════════════════════════════════
   TYPE DEFINITIONS
══════════════════════════════════════════════════════════ */
type RequestIntention =
  | "쉬는 날 희망" | "주말 근무 희망" | "공휴 근무 희망"
  | "신청 없음" | "휴가 신청" | "교육 신청" | "병가 신청";

type FinalType = "휴가" | "SL" | "연차" | "EDU" | "SICK" | "미반영";

type RequestStatus =
  | "신청 접수"
  | "자동 반영 가능"
  | "자동 반영 완료"
  | "관리자 조정 필요"    // 반영되었으나 관리자가 유형 변경 판단 필요 (예: SL → 연차)
  | "관리자 조정 완료"    // 관리자가 유형 변경 처리 완료 (예: SL → 연차 확정)
  | "미반영"              // 근무표에 아직 반영되지 않은 건
  | "승인 대기"           // 관리자 승인 전 접수 상태
  | "승인 완료"           // 관리자 승인 및 근무표 반영 완료
  | "반려"                // 관리자 반려
  | "신청 취소"           // 직원 취소
  | "검토 필요"           // legacy
  | "반영 불가";          // legacy

interface AttendanceDetail {
  id: number;
  date: string;
  intention: RequestIntention;
  finalType?: FinalType;
  reason: string;
  adjustmentReason?: string;
  isSystemAssigned: boolean;
  isManualAdjusted: boolean;
  status: RequestStatus;
  createdAt: string;
  educationCategory?: "사내" | "사외" | "법정" | "기타";
  educationTitle?: string;
  educationIsFullDay?: boolean;
  sickLeaveIsHalfDay?: boolean;
  attachmentCount?: number;
  approvedVersion?: string;    // 승인 완료 후 생성된 근무표 버전
  rejectReason?: string;       // 반려 사유
}

interface EmployeeSummary {
  employeeId: number;
  employeeName: string;
  gender: "남" | "여";
  totalRequests: number;
  dates: string[];
  intentions: RequestIntention[];
  autoCompleted: number;
  reviewNeeded: number;
  notReflected: number;
  vacationTotal: number;
  vacation: number;
  annualLeaveTotal: number;
  annualLeave: number;
  slUsedThisMonth: boolean;
  hoTotalDays: number;
  hoUsedDays: number;
  details: AttendanceDetail[];
}

// 시뮬레이션 결과 타입
type SimulationType = "edu" | "sick";
type SimulationOutcome = "loading" | "success" | "partial" | "fail";

interface SimulationResult {
  type: SimulationType;
  outcome: SimulationOutcome;
  employeeId: number;
  detailId: number;
  employeeName: string;
  date: string;
  originalCode: string;
  newCode: string;
  replacements: { name: string; from: string; to: string }[];
  warnings: string[];
  versionName: string;
  failReasons?: string[];
}

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */
const MOCK_DATA: EmployeeSummary[] = [
  {
    employeeId: 1,
    employeeName: "김민준",
    gender: "남",
    totalRequests: 4,
    dates: ["2026-04-05", "2026-04-12", "2026-04-18", "2026-04-25"],
    intentions: ["쉬는 날 희망", "쉬는 날 희망", "신청 없음", "휴가 신청"],
    autoCompleted: 3,
    reviewNeeded: 1,
    notReflected: 1,
    vacationTotal: 15, vacation: 5,
    annualLeaveTotal: 15, annualLeave: 12,
    slUsedThisMonth: false,
    hoTotalDays: 15, hoUsedDays: 4,
    details: [
      {
        id: 1, date: "2026-04-05", intention: "쉬는 날 희망", finalType: "연차",
        reason: "개인 사유", adjustmentReason: "SL은 여직원만 사용 가능하여 연차로 자동 배정했습니다.",
        isSystemAssigned: true, isManualAdjusted: false, status: "자동 반영 완료", createdAt: "2026-03-20",
      },
      {
        id: 2, date: "2026-04-12", intention: "쉬는 날 희망", finalType: "연차",
        reason: "개인 사유", adjustmentReason: "연차로 자동 반영되었습니다.",
        isSystemAssigned: true, isManualAdjusted: false, status: "자동 반영 완료", createdAt: "2026-03-22",
      },
      {
        id: 3, date: "2026-04-18", intention: "신청 없음", finalType: "연차",
        reason: "", adjustmentReason: "적정 인원 대비 근무 인원 과다로 연차를 배정했습니다. (남직원은 SL 사용 불가)",
        isSystemAssigned: true, isManualAdjusted: false, status: "자동 반영 완료", createdAt: "2026-04-10",
      },
      {
        id: 4, date: "2026-04-25", intention: "휴가 신청", finalType: "미반영",
        reason: "가족 행사", adjustmentReason: "최소 운영 인원 부족으로 근무표에 반영할 수 없습니다. 다른 날짜 검토가 필요합니다.",
        isSystemAssigned: false, isManualAdjusted: false, status: "미반영", createdAt: "2026-03-25",
      },
    ],
  },
  {
    employeeId: 2,
    employeeName: "이서연",
    gender: "여",
    totalRequests: 4,
    dates: ["2026-04-08", "2026-04-15", "2026-04-22", "2026-04-28"],
    intentions: ["쉬는 날 희망", "쉬는 날 희망", "휴가 신청", "교육 신청"],
    autoCompleted: 2,
    reviewNeeded: 2,
    notReflected: 0,
    vacationTotal: 15, vacation: 2,
    annualLeaveTotal: 15, annualLeave: 8,
    slUsedThisMonth: true,
    hoTotalDays: 15, hoUsedDays: 3,
    details: [
      {
        id: 5, date: "2026-04-08", intention: "쉬는 날 희망", finalType: "SL",
        reason: "병원 진료",
        adjustmentReason: "여직원 월 1회 SL 사용 가능 정책에 따라 SL(여성 보건휴가)로 자동 반영되었습니다. 관리자가 필요 시 연차로 변경할 수 있습니다.",
        isSystemAssigned: true, isManualAdjusted: false, status: "관리자 조정 필요", createdAt: "2026-03-28",
      },
      {
        id: 6, date: "2026-04-15", intention: "쉬는 날 희망", finalType: "연차",
        reason: "개인 사유", adjustmentReason: "해당 월 SL이 이미 소진되어 연차로 자동 반영되었습니다.",
        isSystemAssigned: true, isManualAdjusted: false, status: "자동 반영 완료", createdAt: "2026-04-01",
      },
      {
        id: 7, date: "2026-04-22", intention: "휴가 신청", finalType: "휴가",
        reason: "가족 행사", adjustmentReason: "직원이 직접 휴가를 신청하여 반영되었습니다.",
        isSystemAssigned: false, isManualAdjusted: false, status: "자동 반영 완료", createdAt: "2026-03-18",
      },
      {
        id: 11, date: "2026-04-28", intention: "교육 신청", finalType: "EDU",
        reason: "고객 응대 서비스 교육",
        educationCategory: "사내", educationTitle: "고급 CS 교육", educationIsFullDay: true,
        adjustmentReason: "교육(EDU) 코드로 접수되었습니다. 관리자 최종 승인 후 근무표에 반영됩니다.",
        isSystemAssigned: false, isManualAdjusted: false, status: "승인 대기", createdAt: "2026-04-10",
        attachmentCount: 0,
      },
    ],
  },
  {
    employeeId: 3,
    employeeName: "박지호",
    gender: "남",
    totalRequests: 4,
    dates: ["2026-04-10", "2026-04-20", "2026-04-24", "2026-04-29"],
    intentions: ["쉬는 날 희망", "신청 없음", "병가 신청", "병가 신청"],
    autoCompleted: 3,
    reviewNeeded: 1,
    notReflected: 0,
    vacationTotal: 15, vacation: 4,
    annualLeaveTotal: 15, annualLeave: 10,
    slUsedThisMonth: false,
    hoTotalDays: 15, hoUsedDays: 5,
    details: [
      {
        id: 8, date: "2026-04-10", intention: "쉬는 날 희망", finalType: "연차",
        reason: "개인 사유", adjustmentReason: "SL은 여직원만 사용 가능하여 연차로 자동 배정했습니다.",
        isSystemAssigned: true, isManualAdjusted: false, status: "자동 반영 완료", createdAt: "2026-04-05",
      },
      {
        id: 9, date: "2026-04-20", intention: "신청 없음", finalType: "연차",
        reason: "", adjustmentReason: "적정 인원 대비 근무 인원 과다로 연차를 배정했습니다. (남직원은 SL 사용 불가)",
        isSystemAssigned: true, isManualAdjusted: false, status: "자동 반영 완료", createdAt: "2026-04-12",
      },
      {
        id: 12, date: "2026-04-24", intention: "병가 신청", finalType: "SICK",
        reason: "감기 증상", sickLeaveIsHalfDay: false,
        adjustmentReason: "병가(SICK)로 자동 반영되었습니다.",
        isSystemAssigned: false, isManualAdjusted: false, status: "자동 반영 완료", createdAt: "2026-04-22",
        attachmentCount: 1,
      },
      {
        id: 14, date: "2026-04-29", intention: "병가 신청", finalType: "SICK",
        reason: "복통 및 고열", sickLeaveIsHalfDay: false,
        adjustmentReason: "병가 신청이 접수되었습니다. 관리자 승인 후 SICK 코드로 반영됩니다.",
        isSystemAssigned: false, isManualAdjusted: false, status: "승인 대기", createdAt: "2026-04-28",
        attachmentCount: 0,
      },
    ],
  },
  {
    employeeId: 4,
    employeeName: "최유진",
    gender: "여",
    totalRequests: 2,
    dates: ["2026-04-05", "2026-04-12"],
    intentions: ["쉬는 날 희망", "쉬는 날 희망"],
    autoCompleted: 0,
    reviewNeeded: 2,
    notReflected: 1,
    vacationTotal: 15, vacation: 6,
    annualLeaveTotal: 15, annualLeave: 15,
    slUsedThisMonth: true,
    hoTotalDays: 15, hoUsedDays: 2,
    details: [
      {
        id: 10, date: "2026-04-05", intention: "쉬는 날 희망", finalType: "SL",
        reason: "개인 사유",
        adjustmentReason: "여직원 월 1회 SL 사용 가능 정책에 따라 SL(여성 보건휴가)로 자동 반영되었습니다. 관리자가 필요 시 연차로 변경할 수 있습니다.",
        isSystemAssigned: true, isManualAdjusted: false, status: "관리자 조정 필요", createdAt: "2026-03-25",
      },
      {
        id: 13, date: "2026-04-12", intention: "쉬는 날 희망", finalType: "미반영",
        reason: "여행",
        adjustmentReason: "최소 운영 인원 부족으로 근무표에 반영할 수 없습니다. 수동 반영 또는 다른 날짜 검토가 필요합니다.",
        isSystemAssigned: false, isManualAdjusted: false, status: "미반영", createdAt: "2026-03-28",
      },
    ],
  },
];

/* ══════════════════════════════════════════════════════════
   동적 통계 헬퍼
══════════════════════════════════════════════════════════ */
const REVIEW_STATUSES: RequestStatus[] = ["관리자 조정 필요", "미반영", "승인 대기", "검토 필요", "반영 불가"];
const AUTO_STATUSES: RequestStatus[] = ["자동 반영 완료", "관리자 조정 완료", "승인 완료"];

function computeEmpStats(emp: EmployeeSummary) {
  const autoCompleted = emp.details.filter(d => AUTO_STATUSES.includes(d.status)).length;
  const notReflected  = emp.details.filter(d => d.status === "미반영").length;
  const reviewNeeded  = emp.details.filter(d => REVIEW_STATUSES.includes(d.status)).length;
  return { autoCompleted, notReflected, reviewNeeded };
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function AttendancePage() {
  const [data, setData] = useState<EmployeeSummary[]>(MOCK_DATA);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null);

  // 시뮬레이션 관련 상태
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [showSimModal, setShowSimModal] = useState(false);
  const [simLoading, setSimLoading] = useState(false);

  const { isDeadlineClosed, closeDeadline, deadlineClosedAt } = useAttendanceDeadline();
  const { showToast } = useToast();
  const { setAttendanceStats } = useAppContext();

  // 동적 통계 계산
  const computedData = useMemo(() => data.map(emp => {
    const s = computeEmpStats(emp);
    return { ...emp, ...s };
  }), [data]);

  const totalEmployees     = computedData.length;
  const totalRequests      = computedData.reduce((sum, e) => sum + e.totalRequests, 0);
  const totalAutoCompleted = computedData.reduce((sum, e) => sum + e.autoCompleted, 0);
  const totalReviewNeeded  = computedData.reduce((sum, e) => sum + e.reviewNeeded, 0);
  const totalNotReflected  = computedData.reduce((sum, e) => sum + e.notReflected, 0);

  // 대시보드 근태 통계 동기화
  useEffect(() => {
    setAttendanceStats({
      reviewNeeded:    totalReviewNeeded,
      notReflected:    totalNotReflected,
      pendingApproval: computedData.reduce((s, e) =>
        s + e.details.filter(d => d.status === "승인 대기").length, 0),
      autoCompleted:   totalAutoCompleted,
    });
  }, [data, totalReviewNeeded, totalNotReflected, totalAutoCompleted, setAttendanceStats, computedData]);

  /* ── 상세 검토 열기 ─────────────────────────────────── */
  const openDetailModal = (employeeId: number) => {
    const emp = computedData.find(e => e.employeeId === employeeId);
    if (emp) { setSelectedEmployee(emp); setShowDetailModal(true); }
  };

  /* ── 근태신청 마감 ─────────────────────────────────── */
  const handleCloseDeadline = () => { closeDeadline(); setShowDeadlineModal(false); };

  /* ── 교육/병가 신청 접수 ─────────────────────────────── */
  const handleSubmitRequest = (requestData: any) => {
    showToast({ type: "success", title: "신청 접수", message: `${requestData.type} 신청이 접수되었습니다.` });
  };

  /* ── SL → 연차 수동 조정 ────────────────────────────── */
  const handleConvertToAnnualLeave = (employeeId: number, detailId: number) => {
    setData(prev => prev.map(emp => {
      if (emp.employeeId !== employeeId) return emp;
      const updatedDetails = emp.details.map(d => {
        if (d.id === detailId && d.finalType === "SL") {
          return {
            ...d,
            finalType: "연차" as FinalType,
            adjustmentReason: "관리자가 SL을 연차로 수정했습니다.",
            isManualAdjusted: true,
            status: "관리자 조정 완료" as RequestStatus,
          };
        }
        return d;
      });
      const hasAnySL = updatedDetails.some(d => d.finalType === "SL" && !d.isManualAdjusted);
      return {
        ...emp,
        details: updatedDetails,
        slUsedThisMonth: hasAnySL,
        // 연차 1일 차감
        annualLeave: Math.max(0, emp.annualLeave - 1),
      };
    }));
    // 모달 내 selectedEmployee도 즉시 갱신
    setSelectedEmployee(prev => {
      if (!prev || prev.employeeId !== employeeId) return prev;
      const updatedDetails = prev.details.map(d => {
        if (d.id === detailId && d.finalType === "SL") {
          return {
            ...d, finalType: "연차" as FinalType,
            adjustmentReason: "관리자가 SL을 연차로 수정했습니다.",
            isManualAdjusted: true,
            status: "관리자 조정 완료" as RequestStatus,
          };
        }
        return d;
      });
      const hasAnySL = updatedDetails.some(d => d.finalType === "SL" && !d.isManualAdjusted);
      return {
        ...prev,
        details: updatedDetails,
        slUsedThisMonth: hasAnySL,
        annualLeave: Math.max(0, prev.annualLeave - 1),
      };
    });
    showToast({ type: "success", title: "연차 전환 완료", message: "SL이 연차로 변경되었습니다. 연차 잔여가 재계산되었습니다." });
  };

  /* ── 교육 시뮬레이션 실행 ────────────────────────────── */
  const handleApproveEDU = (employeeId: number, detailId: number) => {
    const emp = data.find(e => e.employeeId === employeeId);
    const detail = emp?.details.find(d => d.id === detailId);
    if (!emp || !detail) return;
    setSimLoading(true);
    setShowSimModal(true);
    // 2초 시뮬레이션 딜레이 (mock)
    setTimeout(() => {
      // 시뮬레이션 결과: 박지호를 대체로 사용
      const result: SimulationResult = {
        type: "edu",
        outcome: "success",
        employeeId,
        detailId,
        employeeName: emp.employeeName,
        date: detail.date.substring(5),
        originalCode: "M07",
        newCode: "EDU",
        replacements: [
          { name: "박지호", from: "OFF", to: "M07" },
        ],
        warnings: [],
        versionName: `v4.1 교육 반영 자동재배치`,
      };
      setSimulationResult(result);
      setSimLoading(false);
    }, 1800);
  };

  /* ── 병가 시뮬레이션 실행 ────────────────────────────── */
  const handleApproveSICK = (employeeId: number, detailId: number) => {
    const emp = data.find(e => e.employeeId === employeeId);
    const detail = emp?.details.find(d => d.id === detailId);
    if (!emp || !detail) return;
    setSimLoading(true);
    setShowSimModal(true);
    setTimeout(() => {
      // 시뮬레이션 결과: 일부 경고 포함
      const result: SimulationResult = {
        type: "sick",
        outcome: "partial",
        employeeId,
        detailId,
        employeeName: emp.employeeName,
        date: detail.date.substring(5),
        originalCode: "A13",
        newCode: "SICK",
        replacements: [
          { name: "이서연", from: "OFF", to: "A13" },
        ],
        warnings: ["오전조 최소 인원 1명 부족 — 추가 수동 배치 필요"],
        versionName: `v4.2 병가 반영 긴급재배치`,
      };
      setSimulationResult(result);
      setSimLoading(false);
    }, 1800);
  };

  /* ── 시뮬레이션 결과 저장 확정 ────────────────────────── */
  const handleConfirmSave = () => {
    if (!simulationResult) return;
    const { employeeId, detailId, type, outcome, versionName } = simulationResult;
    const newCode = type === "edu" ? "EDU" : "SICK";
    const newStatus: RequestStatus = "승인 완료";

    setData(prev => prev.map(emp => {
      if (emp.employeeId !== employeeId) return emp;
      const updatedDetails = emp.details.map(d => {
        if (d.id === detailId) {
          return {
            ...d,
            finalType: newCode as FinalType,
            adjustmentReason: type === "edu"
              ? `교육 신청 승인 및 자동 재배치 완료. 생성 버전: ${versionName}`
              : `병가 신청 승인 및 긴급 재배치 완료. 생성 버전: ${versionName}${outcome === "partial" ? " (일부 운영 경고 포함)" : ""}`,
            isManualAdjusted: true,
            status: newStatus,
            approvedVersion: versionName,
          };
        }
        return d;
      });
      return { ...emp, details: updatedDetails };
    }));
    setSelectedEmployee(prev => {
      if (!prev || prev.employeeId !== employeeId) return prev;
      return {
        ...prev,
        details: prev.details.map(d => {
          if (d.id !== detailId) return d;
          return {
            ...d,
            finalType: newCode as FinalType,
            adjustmentReason: type === "edu"
              ? `교육 신청 승인 및 자동 재배치 완료. 생성 버전: ${versionName}`
              : `병가 신청 승인 및 긴급 재배치 완료. 생성 버전: ${versionName}${outcome === "partial" ? " (일부 운영 경고 포함)" : ""}`,
            isManualAdjusted: true,
            status: newStatus,
            approvedVersion: versionName,
          };
        }),
      };
    });
    setShowSimModal(false);
    setSimulationResult(null);
    showToast({
      type: "success",
      title: type === "edu" ? "교육 승인 완료" : "병가 승인 완료",
      message: `${versionName} 버전이 생성되었습니다.`,
    });
  };

  /* ── 반려 처리 ───────────────────────────────────────── */
  const handleReject = (employeeId: number, detailId: number, reason: string) => {
    setData(prev => prev.map(emp => {
      if (emp.employeeId !== employeeId) return emp;
      return {
        ...emp,
        details: emp.details.map(d => {
          if (d.id !== detailId) return d;
          return {
            ...d,
            finalType: "미반영" as FinalType,
            adjustmentReason: reason,
            status: "반려" as RequestStatus,
            rejectReason: reason,
          };
        }),
      };
    }));
    setSelectedEmployee(prev => {
      if (!prev || prev.employeeId !== employeeId) return prev;
      return {
        ...prev,
        details: prev.details.map(d => {
          if (d.id !== detailId) return d;
          return {
            ...d,
            finalType: "미반영" as FinalType,
            adjustmentReason: reason,
            status: "반려" as RequestStatus,
            rejectReason: reason,
          };
        }),
      };
    });
    setShowSimModal(false);
    setSimulationResult(null);
    showToast({ type: "warning", title: "신청 반려", message: "신청이 반려 처리되었습니다." });
  };

  /* ══════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════ */
  return (
    <AppLayout>
      <div style={{ backgroundColor: C.bg, padding: "40px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "34px", fontWeight: 600, color: C.navy, letterSpacing: "-0.01em" }}>
              근태 관리
            </h1>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {!isDeadlineClosed && (
                <button
                  onClick={() => setShowRequestModal(true)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: C.gold, color: C.white, border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#A5874D"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = C.gold}
                >
                  <Plus size={16} /> 교육/병가 신청
                </button>
              )}
              {isDeadlineClosed && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: C.riskBg, border: `1px solid ${C.riskBorder}`, borderRadius: "6px", fontSize: "13px", color: C.risk }}>
                  <Info size={14} />
                  <span>근태신청 마감됨</span>
                  {deadlineClosedAt && (
                    <span style={{ color: C.muted, fontSize: "12px" }}>
                      ({new Date(deadlineClosedAt).toLocaleDateString()} {new Date(deadlineClosedAt).toLocaleTimeString()})
                    </span>
                  )}
                </div>
              )}
              {!isDeadlineClosed && (
                <button
                  onClick={() => setShowDeadlineModal(true)}
                  style={{ padding: "10px 24px", backgroundColor: C.risk, color: C.white, border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "#A02828"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = C.risk}
                >
                  근태신청 마감
                </button>
              )}
            </div>
          </div>
          <p style={{ fontSize: "14px", color: C.muted, lineHeight: 1.6 }}>
            직원들이 제출한 쉬는 날 희망과 휴가 계획을 기준으로 시스템이 자동 반영한 결과를 검토하고, 필요한 경우 예외를 조정합니다.
          </p>
        </div>

        {/* ─── 상단 요약 카드 ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "32px" }}>
          <StatCard label="전체 직원" value={totalEmployees} color={C.charcoal} />
          <StatCard label="전체 신청" value={totalRequests} color={C.pending} />
          <StatCard
            label="자동 반영 완료" value={totalAutoCompleted} color={C.ok}
            tooltip="시스템이 정책에 따라 근무표에 자동 반영 완료한 건수"
          />
          <StatCard
            label="검토 필요" value={totalReviewNeeded} color={C.warning}
            tooltip="관리자가 확인해야 하는 건. 관리자 조정 필요·미반영·승인 대기 건이 포함됩니다."
          />
          <StatCard
            label="미반영 건수" value={totalNotReflected} color={C.risk}
            tooltip="신청은 접수되었으나 아직 근무표에 반영되지 않은 건. (최소 인원 부족·충돌 등)"
          />
        </div>

        {/* ─── 직원별 목록 테이블 ─── */}
        {/* 컬럼: 직원명 | 성별 | 신청 건수 | 자동 반영 | 미반영 | 검토 필요 | 휴가 잔여 | 연차 잔여 | HO 사용 | 관리 */}
        <div style={{ backgroundColor: C.white, borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "auto" }}>
          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "120px 50px 80px 80px 80px 80px 110px 110px 110px 130px",
            backgroundColor: C.navyDeep,
            padding: "16px 24px",
            fontSize: "12px",
            fontWeight: 600,
            color: C.white,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            minWidth: "960px",
          }}>
            <div>직원명</div>
            <div>성별</div>
            <div style={{ textAlign: "center" }}>신청 건수</div>
            <div style={{ textAlign: "center" }}>자동 반영</div>
            <div style={{ textAlign: "center" }}>미반영</div>
            <div style={{ textAlign: "center" }}>검토 필요</div>
            <div>휴가 잔여</div>
            <div>연차 잔여</div>
            <div>HO 사용</div>
            <div style={{ textAlign: "center" }}>관리</div>
          </div>

          {/* Table Body */}
          {computedData.map((emp, idx) => (
            <div
              key={emp.employeeId}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 50px 80px 80px 80px 80px 110px 110px 110px 130px",
                padding: "20px 24px",
                fontSize: "14px",
                color: C.text,
                backgroundColor: idx % 2 === 0 ? C.white : C.rowAlt,
                borderBottom: `1px solid ${C.borderLight}`,
                alignItems: "center",
                minWidth: "960px",
              }}
            >
              <div style={{ fontWeight: 600 }}>{emp.employeeName}</div>
              <div style={{ fontSize: "12px", color: emp.gender === "여" ? C.gold : C.charcoal, fontWeight: 600 }}>{emp.gender}</div>
              <div style={{ textAlign: "center" }}>{emp.totalRequests}건</div>
              <div style={{ textAlign: "center", fontWeight: 600, color: C.ok }}>{emp.autoCompleted}</div>
              <div style={{ textAlign: "center", fontWeight: 600, color: emp.notReflected > 0 ? C.risk : C.muted }}>{emp.notReflected}</div>
              <div style={{ textAlign: "center", fontWeight: 600, color: emp.reviewNeeded > 0 ? C.warning : C.muted }}>{emp.reviewNeeded}</div>
              <div style={{ fontSize: "12.5px" }}>
                <span style={{ fontWeight: 600 }}>{emp.vacation}</span>
                <span style={{ color: C.muted }}> / {emp.vacationTotal}일</span>
                <div style={{ fontSize: "11px", color: C.muted }}>({Math.round((emp.vacation / emp.vacationTotal) * 100)}%)</div>
              </div>
              <div style={{ fontSize: "12.5px" }}>
                <span style={{ fontWeight: 600 }}>{emp.annualLeave}</span>
                <span style={{ color: C.muted }}> / {emp.annualLeaveTotal}일</span>
                <div style={{ fontSize: "11px", color: C.muted }}>({Math.round((emp.annualLeave / emp.annualLeaveTotal) * 100)}%)</div>
              </div>
              <div style={{ fontSize: "12.5px" }}>
                <span style={{ fontWeight: 600 }}>{emp.hoUsedDays}</span>
                <span style={{ color: C.muted }}> / {emp.hoTotalDays}일</span>
                <div style={{ fontSize: "11px", color: C.muted }}>({Math.round((emp.hoUsedDays / emp.hoTotalDays) * 100)}%)</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={() => openDetailModal(emp.employeeId)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", backgroundColor: "transparent", border: `1px solid ${C.border}`, borderRadius: "5px", fontSize: "13px", fontWeight: 500, color: C.charcoal, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.goldBg; e.currentTarget.style.borderColor = C.goldBorder; e.currentTarget.style.color = C.gold; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.charcoal; }}
                >
                  상세 검토
                </button>
                {emp.details.some(d => d.finalType === "SL" && !d.isManualAdjusted) && (
                  <div style={{ fontSize: "10px", color: C.warning, marginTop: "4px", fontWeight: 500 }}>
                    ● SL {emp.details.filter(d => d.finalType === "SL" && !d.isManualAdjusted).length}건
                  </div>
                )}
                {emp.details.some(d => d.status === "승인 대기") && (
                  <div style={{ fontSize: "10px", color: C.pending, marginTop: "2px", fontWeight: 500 }}>
                    ● 승인대기 {emp.details.filter(d => d.status === "승인 대기").length}건
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          근태신청 마감 확인 모달
      ═══════════════════════════════════════════════════ */}
      {showDeadlineModal && (
        <ModalOverlay onClose={() => setShowDeadlineModal(false)}>
          <div style={{ backgroundColor: C.white, borderRadius: "8px", width: "480px", maxWidth: "90%", padding: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontWeight: 600, color: C.navy }}>근태신청 마감 확인</h3>
              <ModalCloseBtn onClick={() => setShowDeadlineModal(false)} />
            </div>
            <div style={{ padding: "20px", backgroundColor: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: "6px", marginBottom: "24px" }}>
              <p style={{ fontSize: "14px", color: C.charcoal, lineHeight: 1.7, marginBottom: "12px" }}>이 기간의 근태 신청을 마감하시겠습니까?</p>
              <p style={{ fontSize: "13px", color: C.muted, lineHeight: 1.6 }}>마감 후 직원은 신청 내역을 수정하거나 삭제할 수 없습니다.</p>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <OutlineBtn onClick={() => setShowDeadlineModal(false)}>취소</OutlineBtn>
              <button
                onClick={handleCloseDeadline}
                style={{ padding: "10px 24px", backgroundColor: C.risk, border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 500, color: C.white, cursor: "pointer" }}
              >마감</button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ═══════════════════════════════════════════════════
          상세 검토 모달
      ═══════════════════════════════════════════════════ */}
      {showDetailModal && selectedEmployee && (
        <ModalOverlay onClose={() => setShowDetailModal(false)} padding="40px">
          <div style={{ backgroundColor: C.white, borderRadius: "8px", width: "1060px", maxWidth: "100%", maxHeight: "90vh", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column" }}>
            {/* 모달 헤더 */}
            <div style={{ padding: "32px 32px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 600, color: C.navy, marginBottom: "10px" }}>
                  {selectedEmployee.employeeName}의 상세 내역
                </h3>
                {/* 동적 집계 요약 */}
                {(() => {
                  const s = computeEmpStats(selectedEmployee);
                  return (
                    <div style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
                      <span style={{ color: C.muted }}>전체 신청: <strong style={{ color: C.text }}>{selectedEmployee.totalRequests}건</strong></span>
                      <span style={{ color: C.muted }}>자동 반영: <strong style={{ color: C.ok }}>{s.autoCompleted}건</strong></span>
                      <span style={{ color: C.muted }}>검토 필요: <strong style={{ color: C.warning }}>{s.reviewNeeded}건</strong></span>
                      <span style={{ color: C.muted }}>미반영: <strong style={{ color: C.risk }}>{s.notReflected}건</strong></span>
                    </div>
                  );
                })()}
              </div>
              <ModalCloseBtn onClick={() => setShowDetailModal(false)} size={24} />
            </div>

            {/* 모달 컨텐츠 */}
            <div style={{ flex: 1, overflow: "auto", padding: "32px" }}>
              {/* 상세 테이블 */}
              <div style={{ backgroundColor: C.white, borderRadius: "6px", border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: "24px" }}>
                {/* 테이블 헤더 */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "100px 130px 100px 210px 100px 220px",
                  padding: "14px 20px",
                  backgroundColor: C.navyDeep,
                  fontSize: "12px", fontWeight: 600, color: C.white,
                  letterSpacing: "0.02em", textTransform: "uppercase",
                }}>
                  <div>날짜</div>
                  <div>신청 의사</div>
                  <div>최종 반영</div>
                  <div>반영 조정 사유</div>
                  <div>상태</div>
                  <div style={{ textAlign: "center" }}>조정 액션</div>
                </div>

                {/* 테이블 행 */}
                {selectedEmployee.details.map((detail, idx) => (
                  <div
                    key={detail.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "100px 130px 100px 210px 100px 220px",
                      padding: "18px 20px",
                      fontSize: "13px",
                      backgroundColor: idx % 2 === 0 ? C.white : C.rowAlt,
                      borderTop: idx > 0 ? `1px solid ${C.borderLight}` : "none",
                      alignItems: "start",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: C.charcoal, paddingTop: "2px" }}>{detail.date.substring(5)}</div>
                    <div style={{ paddingTop: "2px" }}><IntentionBadge intention={detail.intention} /></div>
                    <div style={{ paddingTop: "2px" }}><FinalTypeBadge finalType={detail.finalType} /></div>
                    <div>
                      <div style={{ fontSize: "12px", color: C.muted, lineHeight: 1.5 }}>
                        {detail.adjustmentReason || detail.reason || "-"}
                      </div>
                      {detail.approvedVersion && (
                        <div style={{ fontSize: "10px", color: C.ok, marginTop: 4, fontWeight: 600 }}>
                          생성 버전: {detail.approvedVersion}
                        </div>
                      )}
                      {detail.intention === "교육 신청" && (
                        <div style={{ marginTop: 6, padding: "5px 8px", backgroundColor: "#E8F3FA", borderRadius: 3, fontSize: 10, color: "#1A5A8A" }}>
                          <div><strong>교육명:</strong> {detail.educationTitle}</div>
                          <div><strong>구분:</strong> {detail.educationCategory} | {detail.educationIsFullDay ? "종일" : "반일"}</div>
                        </div>
                      )}
                      {detail.intention === "병가 신청" && (
                        <div style={{ marginTop: 6, padding: "5px 8px", backgroundColor: "#FFF0E6", borderRadius: 3, fontSize: 10, color: "#CC5500" }}>
                          <div>{detail.sickLeaveIsHalfDay ? "반일" : "종일"} 병가</div>
                          {detail.attachmentCount !== undefined && detail.attachmentCount > 0 && (
                            <div><strong>첨부:</strong> {detail.attachmentCount}개 파일</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ paddingTop: "2px" }}><StatusBadge status={detail.status} /></div>

                    {/* 조정 액션 열 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                      {/* SL → 연차 변경 */}
                      {detail.finalType === "SL" && !detail.isManualAdjusted && (
                        <button
                          onClick={() => handleConvertToAnnualLeave(selectedEmployee.employeeId, detail.id)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", backgroundColor: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: "4px", fontSize: "12px", fontWeight: 500, color: C.gold, cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(185,155,90,0.15)"}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = C.goldBg}
                          title="관리자 전용 기능"
                        >
                          <Shield size={12} /> 연차로 변경
                        </button>
                      )}

                      {/* 교육 신청 승인 대기 */}
                      {detail.status === "승인 대기" && detail.intention === "교육 신청" && (
                        <>
                          <button
                            onClick={() => handleApproveEDU(selectedEmployee.employeeId, detail.id)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", backgroundColor: C.okBg, border: `1px solid ${C.okBorder}`, borderRadius: "4px", fontSize: "12px", fontWeight: 600, color: C.ok, cursor: "pointer", whiteSpace: "nowrap" }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(46,125,82,0.14)"}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.okBg}
                          >
                            <CheckCircle size={12} /> 승인 및 자동 재배치
                          </button>
                          <button
                            onClick={() => handleReject(
                              selectedEmployee.employeeId, detail.id,
                              "관리자 판단에 의해 교육 신청이 반려되었습니다."
                            )}
                            style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", backgroundColor: C.riskBg, border: `1px solid ${C.riskBorder}`, borderRadius: "4px", fontSize: "12px", fontWeight: 500, color: C.risk, cursor: "pointer" }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(184,50,50,0.12)"}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.riskBg}
                          >
                            <XCircle size={12} /> 반려
                          </button>
                        </>
                      )}

                      {/* 병가 신청 승인 대기 */}
                      {detail.status === "승인 대기" && detail.intention === "병가 신청" && (
                        <>
                          <button
                            onClick={() => handleApproveSICK(selectedEmployee.employeeId, detail.id)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", backgroundColor: C.okBg, border: `1px solid ${C.okBorder}`, borderRadius: "4px", fontSize: "12px", fontWeight: 600, color: C.ok, cursor: "pointer", whiteSpace: "nowrap" }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(46,125,82,0.14)"}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.okBg}
                          >
                            <CheckCircle size={12} /> 승인 및 긴급 재배치
                          </button>
                          <button
                            onClick={() => handleReject(
                              selectedEmployee.employeeId, detail.id,
                              "증빙 미제출 또는 병가 요건 불충족으로 반려되었습니다."
                            )}
                            style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "6px 12px", backgroundColor: C.riskBg, border: `1px solid ${C.riskBorder}`, borderRadius: "4px", fontSize: "12px", fontWeight: 500, color: C.risk, cursor: "pointer" }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(184,50,50,0.12)"}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.riskBg}
                          >
                            <XCircle size={12} /> 반려
                          </button>
                        </>
                      )}

                      {/* 수동 조정 완료 표시 */}
                      {detail.isManualAdjusted && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Shield size={12} color={C.muted} />
                          <span style={{ fontSize: "12px", color: C.muted, fontStyle: "italic" }}>조정 완료</span>
                        </div>
                      )}

                      {/* 반려 사유 */}
                      {detail.status === "반려" && detail.rejectReason && (
                        <div style={{ fontSize: "11px", color: C.risk, lineHeight: 1.4, textAlign: "center", maxWidth: "200px" }}>
                          {detail.rejectReason}
                        </div>
                      )}

                      {/* 액션 없는 경우 */}
                      {detail.finalType !== "SL"
                        && detail.status !== "승인 대기"
                        && !detail.isManualAdjusted
                        && detail.status !== "반려"
                        && <span style={{ fontSize: "13px", color: C.muted }}>-</span>
                      }
                    </div>
                  </div>
                ))}
              </div>

              {/* 하단 잔여 정보 */}
              <div style={{ padding: "20px 24px", backgroundColor: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: "6px", fontSize: "13px", color: C.charcoal }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>이번 달 SL 사용</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: selectedEmployee.slUsedThisMonth ? C.ok : C.muted }}>
                      {selectedEmployee.slUsedThisMonth ? "사용함" : "사용 안 함"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>휴가 잔여</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: C.navy }}>{selectedEmployee.vacation} / {selectedEmployee.vacationTotal}일</div>
                    <div style={{ fontSize: "12px", color: C.muted }}>({Math.round((selectedEmployee.vacation / selectedEmployee.vacationTotal) * 100)}%)</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>연차 잔여</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: C.navy }}>{selectedEmployee.annualLeave} / {selectedEmployee.annualLeaveTotal}일</div>
                    <div style={{ fontSize: "12px", color: C.muted }}>({Math.round((selectedEmployee.annualLeave / selectedEmployee.annualLeaveTotal) * 100)}%)</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "4px" }}>HO 사용</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: C.navy }}>{selectedEmployee.hoUsedDays} / {selectedEmployee.hoTotalDays}일</div>
                    <div style={{ fontSize: "12px", color: C.muted }}>({Math.round((selectedEmployee.hoUsedDays / selectedEmployee.hoTotalDays) * 100)}%)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ═══════════════════════════════════════════════════
          시뮬레이션 결과 모달
      ═══════════════════════════════════════════════════ */}
      {showSimModal && (
        <ModalOverlay onClose={() => { if (!simLoading) { setShowSimModal(false); setSimulationResult(null); } }}>
          <div style={{ backgroundColor: C.white, borderRadius: "10px", width: "580px", maxWidth: "95%", padding: "36px", boxShadow: "0 24px 64px rgba(0,0,0,0.35)" }}>
            {simLoading ? (
              /* 로딩 */
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <Loader size={36} color={C.gold} style={{ animation: "spin 1s linear infinite" }} />
                <p style={{ marginTop: "16px", fontSize: "15px", color: C.charcoal, fontWeight: 600 }}>
                  {simulationResult?.type === "sick" ? "긴급 재배치 시뮬레이션 실행 중..." : "자동 재배치 시뮬레이션 실행 중..."}
                </p>
                <p style={{ fontSize: "13px", color: C.muted, marginTop: "6px" }}>운영 정책 및 인원 충족 여부를 검토합니다.</p>
              </div>
            ) : simulationResult && (
              <>
                {/* 결과 헤더 */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                  {simulationResult.outcome === "success" && <CheckCircle size={28} color={C.ok} />}
                  {simulationResult.outcome === "partial" && <AlertTriangle size={28} color={C.warning} />}
                  {simulationResult.outcome === "fail" && <XCircle size={28} color={C.risk} />}
                  <div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 600, color: C.navy }}>
                      {simulationResult.type === "edu"
                        ? (simulationResult.outcome === "fail" ? "교육 반영 불가" : "교육 반영 가능")
                        : (simulationResult.outcome === "fail" ? "병가 반영 불가" : "병가 반영 가능")}
                    </h3>
                    <p style={{ fontSize: "13px", color: C.muted }}>
                      {simulationResult.employeeName} · {simulationResult.date}
                    </p>
                  </div>
                </div>

                {/* 변경 내용 */}
                <div style={{ backgroundColor: C.bg, borderRadius: "6px", padding: "16px 20px", marginBottom: "16px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: C.muted, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "10px" }}>변경 셀 목록</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontSize: "13px", display: "flex", gap: "12px", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: C.charcoal }}>{simulationResult.employeeName}</span>
                      <span style={{ color: C.muted }}>{simulationResult.date}</span>
                      <span style={{ color: C.risk, fontWeight: 600 }}>{simulationResult.originalCode}</span>
                      <span style={{ color: C.muted }}>→</span>
                      <span style={{ color: C.ok, fontWeight: 600 }}>{simulationResult.newCode}</span>
                    </div>
                    {simulationResult.replacements.map((r, i) => (
                      <div key={i} style={{ fontSize: "13px", display: "flex", gap: "12px", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, color: C.charcoal }}>대체: {r.name}</span>
                        <span style={{ color: C.risk, fontWeight: 600 }}>{r.from}</span>
                        <span style={{ color: C.muted }}>→</span>
                        <span style={{ color: C.ok, fontWeight: 600 }}>{r.to}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 운영 경고 */}
                {simulationResult.warnings.length > 0 && (
                  <div style={{ backgroundColor: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: "6px", padding: "14px 18px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: C.warning, marginBottom: "8px" }}>⚠ 운영 경고</div>
                    {simulationResult.warnings.map((w, i) => (
                      <div key={i} style={{ fontSize: "13px", color: C.charcoal }}>{w}</div>
                    ))}
                  </div>
                )}

                {/* 새 버전명 */}
                {(simulationResult.outcome === "success" || simulationResult.outcome === "partial") && (
                  <div style={{ backgroundColor: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: "6px", padding: "12px 18px", marginBottom: "20px", fontSize: "13px" }}>
                    <span style={{ fontWeight: 600, color: C.charcoal }}>생성 버전명: </span>
                    <span style={{ color: C.gold, fontWeight: 700 }}>{simulationResult.versionName}</span>
                  </div>
                )}

                {/* 실패 사유 */}
                {simulationResult.outcome === "fail" && simulationResult.failReasons && (
                  <div style={{ backgroundColor: C.riskBg, border: `1px solid ${C.riskBorder}`, borderRadius: "6px", padding: "14px 18px", marginBottom: "20px" }}>
                    {simulationResult.failReasons.map((r, i) => (
                      <div key={i} style={{ fontSize: "13px", color: C.risk }}>{r}</div>
                    ))}
                  </div>
                )}

                {/* 액션 버튼 */}
                {(simulationResult.outcome === "success" || simulationResult.outcome === "partial") && (
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <OutlineBtn onClick={() => { setShowSimModal(false); setSimulationResult(null); }}>취소</OutlineBtn>
                    <button
                      onClick={handleConfirmSave}
                      style={{ padding: "10px 22px", backgroundColor: C.ok, border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 600, color: C.white, cursor: "pointer" }}
                    >
                      {simulationResult.outcome === "partial"
                        ? "경고 포함 새 버전 저장"
                        : "새 버전으로 저장하고 승인 완료"}
                    </button>
                  </div>
                )}
                {simulationResult.outcome === "fail" && (
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <OutlineBtn onClick={() => { setShowSimModal(false); setSimulationResult(null); }}>취소</OutlineBtn>
                    <OutlineBtn onClick={() => {
                      if (!simulationResult) return;
                      handleReject(simulationResult.employeeId, simulationResult.detailId,
                        "자동 재배치 시뮬레이션 결과 반영 불가 — 최소 인원 및 인차지 조건 충족 불가");
                    }}>반려 처리</OutlineBtn>
                    <button
                      onClick={() => { setShowSimModal(false); setSimulationResult(null); }}
                      style={{ padding: "10px 22px", backgroundColor: C.warning, border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 600, color: C.white, cursor: "pointer" }}
                    >관리자 수동 조정</button>
                  </div>
                )}
              </>
            )}
          </div>
        </ModalOverlay>
      )}

      {/* 교육/병가 신청 모달 */}
      <AttendanceRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSubmit={handleSubmitRequest}
      />

      {/* 스피너 애니메이션 CSS */}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </AppLayout>
  );
}

/* ══════════════════════════════════════════════════════════
   공통 소형 컴포넌트
══════════════════════════════════════════════════════════ */
function ModalOverlay({ children, onClose, padding = "0" }: { children: React.ReactNode; onClose: () => void; padding?: string }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function ModalCloseBtn({ onClick, size = 20 }: { onClick: () => void; size?: number }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: C.muted }}>
      <X size={size} />
    </button>
  );
}

function OutlineBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: "10px 22px", backgroundColor: "transparent", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "14px", fontWeight: 500, color: C.charcoal, cursor: "pointer" }}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, color, tooltip }: { label: string; value: number; color: string; tooltip?: string }) {
  return (
    <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "20px" }}>
      <div style={{ fontSize: "12px", fontWeight: 600, color: C.muted, letterSpacing: "0.03em", textTransform: "uppercase", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: 700, color, fontFamily: "'Cormorant Garamond', serif" }}>{value}</div>
      {tooltip && <div style={{ fontSize: "11px", color: C.muted, marginTop: "6px", lineHeight: 1.4 }}>{tooltip}</div>}
    </div>
  );
}

function IntentionBadge({ intention }: { intention: RequestIntention }) {
  const s: Record<RequestIntention, { bg: string; border: string; text: string }> = {
    "쉬는 날 희망": { bg: C.pendingBg, border: C.pendingBorder, text: C.pending },
    "주말 근무 희망": { bg: C.okBg, border: C.okBorder, text: C.ok },
    "공휴 근무 희망": { bg: C.okBg, border: C.okBorder, text: C.ok },
    "신청 없음": { bg: "rgba(123,131,144,0.08)", border: "rgba(123,131,144,0.2)", text: C.muted },
    "휴가 신청": { bg: C.goldBg, border: C.goldBorder, text: C.gold },
    "교육 신청": { bg: "#E8F3FA", border: "#A8CEE8", text: "#1A5A8A" },
    "병가 신청": { bg: "#FFF0E6", border: "#FFB380", text: "#CC5500" },
  };
  const style = s[intention];
  return (
    <span style={{ display: "inline-block", padding: "4px 10px", fontSize: "11px", fontWeight: 600, backgroundColor: style.bg, border: `1px solid ${style.border}`, borderRadius: "4px", color: style.text }}>
      {intention}
    </span>
  );
}

function FinalTypeBadge({ finalType }: { finalType?: FinalType }) {
  if (!finalType) return <span style={{ fontSize: "12px", color: C.muted }}>-</span>;
  const s: Record<FinalType, { bg: string; border: string; text: string }> = {
    "휴가":  { bg: C.goldBg,    border: C.goldBorder,    text: C.gold },
    "SL":   { bg: C.okBg,      border: C.okBorder,      text: C.ok },
    "연차":  { bg: C.pendingBg, border: C.pendingBorder, text: C.pending },
    "EDU":  { bg: "#E8F3FA",   border: "#A8CEE8",       text: "#1A5A8A" },
    "SICK": { bg: "#FFF0E6",   border: "#FFB380",       text: "#CC5500" },
    "미반영": { bg: C.riskBg,  border: C.riskBorder,    text: C.risk },
  };
  const style = s[finalType];
  return (
    <span style={{ display: "inline-block", padding: "4px 10px", fontSize: "11px", fontWeight: 600, backgroundColor: style.bg, border: `1px solid ${style.border}`, borderRadius: "4px", color: style.text }}>
      {finalType}
    </span>
  );
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const s: Partial<Record<RequestStatus, { bg: string; border: string; text: string }>> = {
    "신청 접수":      { bg: C.pendingBg, border: C.pendingBorder, text: C.pending },
    "자동 반영 가능": { bg: C.okBg,      border: C.okBorder,      text: C.ok },
    "자동 반영 완료": { bg: C.okBg,      border: C.okBorder,      text: C.ok },
    "관리자 조정 필요": { bg: C.warnBg,  border: C.warnBorder,    text: C.warning },
    "관리자 조정 완료": { bg: C.okBg,    border: C.okBorder,      text: C.ok },
    "미반영":         { bg: C.riskBg,   border: C.riskBorder,    text: C.risk },
    "승인 대기":      { bg: C.warnBg,   border: C.warnBorder,    text: C.warning },
    "승인 완료":      { bg: C.okBg,     border: C.okBorder,      text: C.ok },
    "반려":           { bg: C.riskBg,   border: C.riskBorder,    text: C.risk },
    "신청 취소":      { bg: C.riskBg,   border: C.riskBorder,    text: C.risk },
    "검토 필요":      { bg: C.warnBg,   border: C.warnBorder,    text: C.warning },
    "반영 불가":      { bg: C.riskBg,   border: C.riskBorder,    text: C.risk },
  };
  const style = s[status] ?? { bg: C.pendingBg, border: C.pendingBorder, text: C.pending };
  return (
    <span style={{ display: "inline-block", padding: "4px 8px", fontSize: "10px", fontWeight: 600, backgroundColor: style.bg, border: `1px solid ${style.border}`, borderRadius: "3px", color: style.text }}>
      {status}
    </span>
  );
}
