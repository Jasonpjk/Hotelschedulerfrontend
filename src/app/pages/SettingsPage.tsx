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
interface PendingAccount {
  id: number;
  name: string;
  email: string;
  employeeId: string;
  requestedAt: string;
  status: "대기중" | "승인됨" | "거절됨";
}

interface ActiveAccount {
  id: number;
  name: string;
  employeeId: string;
  email: string;
  hotel: string;
  department: string;
  grade: string;
  role: "일반 직원" | "운영 관리자" | "최종 관리자";
  status: "활성" | "비활성";
}

interface Policy {
  id: number;
  title: string;
  description: string;
  type: "필수" | "권장";
  enabled: boolean;
}

interface ShiftMinimum {
  shift: string;
  minimum: number;
}

interface ActivityLog {
  id: number;
  admin: string;
  role: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */
const MOCK_PENDING_ACCOUNTS: PendingAccount[] = [
  { id: 1, name: "강지민", email: "jimin.kang@lotte.net", employeeId: "E2024101", requestedAt: "2026-03-24", status: "대기중" },
  { id: 2, name: "윤서준", email: "seojun.yoon@lotte.net", employeeId: "E2024102", requestedAt: "2026-03-25", status: "대기중" },
];

const MOCK_ACTIVE_ACCOUNTS: ActiveAccount[] = [
  { id: 1, name: "김재민", employeeId: "E2024001", email: "jaemin.kim@lotte.net", hotel: "롯데호텔 서울", department: "프런트 데스크", grade: "L2-C", role: "최종 관리자", status: "활성" },
  { id: 2, name: "박지현", employeeId: "E2024012", email: "jihyun.park@lotte.net", hotel: "롯데호텔 서울", department: "프런트 데스크", grade: "L1-C", role: "운영 관리자", status: "활성" },
  { id: 3, name: "이서우", employeeId: "E2024023", email: "seowoo.lee@lotte.net", hotel: "롯데호텔 서울", department: "프런트 데스크", grade: "엘크루", role: "일반 직원", status: "활성" },
  { id: 4, name: "최민지", employeeId: "E2024034", email: "minji.choi@lotte.net", hotel: "롯데호텔 서울", department: "프런트 데스크", grade: "주니어", role: "일반 직원", status: "활성" },
  { id: 5, name: "정우진", employeeId: "E2024045", email: "woojin.jung@lotte.net", hotel: "롯데호텔 서울", department: "프런트 데스크", grade: "L1-A", role: "일반 직원", status: "활성" },
  { id: 6, name: "한승민", employeeId: "E2023089", email: "seungmin.han@lotte.net", hotel: "롯데호텔 서울", department: "프런트 데스크", grade: "L1-B", role: "일반 직원", status: "비활성" },
];

const INITIAL_POLICIES: Policy[] = [
  {
    id: 1,
    title: "월요일 기준 14일 동안 휴무 4회 필수",
    description: "롤링 14일이 아닌 월요일 시작 14일 블록 기준으로 휴무 4회 반드시 보장",
    type: "필수",
    enabled: true,
  },
  {
    id: 2,
    title: "최소 조별 인원 반드시 충족",
    description: "각 조에 설정된 최소 인원은 스케줄 생성 시 반드시 충족되어야 함",
    type: "필수",
    enabled: true,
  },
  {
    id: 3,
    title: "각 조별 인차지 1명 이상 필수",
    description: "오전조/오후조/야간조/중간조마다 최소 1명 이상의 인차지 배치 필수",
    type: "필수",
    enabled: true,
  },
  {
    id: 4,
    title: "해당 월 야간조 담당자는 월 내 타 조 전환 불가",
    description: "해당 월에 야간조로 운영되는 직원은 그 월 안에서는 다른 조로 전환하지 않음",
    type: "필수",
    enabled: true,
  },
  {
    id: 5,
    title: "전월 야간조 담당자 익월 전환 시 첫 2일 OFF 강제 배정",
    description: "전월 야간조 직원이 익월에 타 조로 전환될 경우 익월 첫 2일은 OFF 강제 배정 후 투입",
    type: "필수",
    enabled: true,
  },
  {
    id: 6,
    title: "야간조가 아닌 일반 조 전환에는 최소 휴무 규칙 없음",
    description: "오전조 ↔ 오후조 ↔ 중간조 전환 시 별도 최소 휴무일 강제 규칙 적용하지 않음",
    type: "필수",
    enabled: true,
  },
  {
    id: 7,
    title: "SL 연속 사용 불가",
    description: "SL(여성 보건휴가)은 연속 날짜로 신청할 수 없도록 차단",
    type: "필수",
    enabled: true,
  },
  {
    id: 8,
    title: "오후조 출근 후 다음날 오전조 투입 지양",
    description: "강제 차단이 아닌 권장 규칙, 위반 시 경고 표시",
    type: "권장",
    enabled: true,
  },
  {
    id: 9,
    title: "최대 연속 근무 6일 초과 시 경고",
    description: "6일 초과를 절대 금지하지는 않으나 경고 문구 표시 및 검토 필요",
    type: "권장",
    enabled: true,
  },
];

const INITIAL_SHIFT_MINIMUMS: ShiftMinimum[] = [
  { shift: "오전조", minimum: 3 },
  { shift: "오후조", minimum: 3 },
  { shift: "야간조", minimum: 2 },
  { shift: "중간조", minimum: 2 },
];

const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  { id: 1, admin: "관리자", role: "최종 관리자", action: "최소 조별 인원 변경", target: "오전조", details: "오전조 3명 → 4명", timestamp: "2026-03-20 14:30" },
  { id: 2, admin: "관리자", role: "운영 관리자", action: "회원가입 승인", target: "김민준", details: "E2024098", timestamp: "2026-03-19 10:15" },
  { id: 3, admin: "관리자", role: "최종 관리자", action: "필수 정책 수정", target: "14일 4휴무 규칙", details: "설명 업데이트", timestamp: "2026-03-18 16:45" },
];

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
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
      style={{
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
          <h3 id="modal-title" style={{
            fontSize: 16,
            fontWeight: 600,
            color: C.navy,
            fontFamily: "'Cormorant Garamond', serif",
            marginBottom: description ? 6 : 0,
          }}>
            {title}
          </h3>
          {description && (
            <p id="modal-description" style={{
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
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>(MOCK_PENDING_ACCOUNTS);
  const [activeAccounts, setActiveAccounts] = useState<ActiveAccount[]>(MOCK_ACTIVE_ACCOUNTS);
  const [policies, setPolicies] = useState<Policy[]>(INITIAL_POLICIES);
  const [shiftMinimums, setShiftMinimums] = useState<ShiftMinimum[]>(INITIAL_SHIFT_MINIMUMS);
  const [activityLogs] = useState<ActivityLog[]>(MOCK_ACTIVITY_LOGS);
  const [activeTab, setActiveTab] = useState<"accounts" | "policies" | "shifts" | "logs">("accounts");
  
  // 정책 편집 모달
  const [editPolicyModal, setEditPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", type: "필수" as "필수" | "권장" });
  
  // 정책 삭제 확인 모달
  const [deletePolicyModal, setDeletePolicyModal] = useState(false);
  const [deletingPolicyId, setDeletingPolicyId] = useState<number | null>(null);
  
  // 정책 추가 모달
  const [addPolicyModal, setAddPolicyModal] = useState(false);
  const [addPolicyType, setAddPolicyType] = useState<"필수" | "권장">("필수");
  
  // 최소 조별 인원 확정 상태
  const [shiftMinimumsFinalized, setShiftMinimumsFinalized] = useState(false);
  const [shiftMinimumsSavedAt, setShiftMinimumsSavedAt] = useState<string | null>(null);
  
  // 비밀번호 초기화 모달
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [resetPasswordAccount, setResetPasswordAccount] = useState<PendingAccount | null>(null);
  const [passwordResetComplete, setPasswordResetComplete] = useState(false);
  
  // 활성 계정 관리 모달
  const [changeRoleModal, setChangeRoleModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ActiveAccount | null>(null);
  const [newRole, setNewRole] = useState<"일반 직원" | "운영 관리자" | "최종 관리자">("일반 직원");
  const [deactivateAccountModal, setDeactivateAccountModal] = useState(false);
  const [activateAccountModal, setActivateAccountModal] = useState(false);
  const [resetPasswordActiveModal, setResetPasswordActiveModal] = useState(false);
  
  // 회원가입 승인/거절 모달
  const [approveAccountModal, setApproveAccountModal] = useState(false);
  const [rejectAccountModal, setRejectAccountModal] = useState(false);
  const [selectedPendingAccount, setSelectedPendingAccount] = useState<PendingAccount | null>(null);
  const [manageAccountModal, setManageAccountModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 회원가입 승인/거절
  const handleApprove = (id: number) => {
    const account = pendingAccounts.find(acc => acc.id === id);
    if (account) {
      // 승인된 계정을 활성 계정 목록에 추가
      const newActiveAccount: ActiveAccount = {
        id: activeAccounts.length + 1, // 새로운 ID 부여
        name: account.name,
        employeeId: account.employeeId,
        email: account.email,
        hotel: "롯데호텔 서울", // 기본값 (실제로는 회원가입 시 선택한 호텔)
        department: "프런트 데스크", // 기본값
        grade: "엘크루", // 기본값 (신입)
        role: "일반 직원", // 기본 권한
        status: "활성",
      };
      
      setActiveAccounts(prev => [...prev, newActiveAccount]);
      
      // 대기 목록에서 제거
      setPendingAccounts(prev => prev.filter(acc => acc.id !== id));
      
      // 성공 메시지 표시
      setSuccessMessage(`${account.name}님의 회원가입이 승인되었습니다. 활성 계정에 추가되었습니다.`);
      
      // 모달 닫기
      setManageAccountModal(false);
      setSelectedPendingAccount(null);
      
      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    }
  };

  const handleReject = (id: number) => {
    const account = pendingAccounts.find(acc => acc.id === id);
    
    // 대기 목록에서 제거
    setPendingAccounts(prev => prev.filter(acc => acc.id !== id));
    
    // 성공 메시지 표시
    if (account) {
      setSuccessMessage(`${account.name}님의 회원가입 신청이 거절되었습니다.`);
    }
    
    // 모달 닫기
    setManageAccountModal(false);
    setSelectedPendingAccount(null);
    
    // 3초 후 성공 메시지 제거
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // 정책 토글
  const handleTogglePolicy = (id: number) => {
    setPolicies(prev =>
      prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
    );
  };
  
  // 정책 수정 열기
  const handleEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy);
    setEditForm({
      title: policy.title,
      description: policy.description,
      type: policy.type,
    });
    setEditPolicyModal(true);
  };
  
  // 정책 수정 저장
  const handleSaveEdit = () => {
    if (editingPolicy) {
      setPolicies(prev =>
        prev.map(p => p.id === editingPolicy.id ? { ...p, ...editForm } : p)
      );
      setEditPolicyModal(false);
      setEditingPolicy(null);
    }
  };
  
  // 정책 삭제 확인 열기
  const handleDeletePolicy = (id: number) => {
    setDeletingPolicyId(id);
    setDeletePolicyModal(true);
  };
  
  // 정책 삭제 실행
  const handleConfirmDelete = () => {
    if (deletingPolicyId !== null) {
      setPolicies(prev => prev.filter(p => p.id !== deletingPolicyId));
      setDeletePolicyModal(false);
      setDeletingPolicyId(null);
    }
  };
  
  // 정책 추가
  const handleAddPolicy = () => {
    const newPolicy: Policy = {
      id: Date.now(),
      title: editForm.title,
      description: editForm.description,
      type: addPolicyType,
      enabled: true,
    };
    setPolicies(prev => [...prev, newPolicy]);
    setAddPolicyModal(false);
    setEditForm({ title: "", description: "", type: "필수" });
  };

  // 최소 인원 변경
  const handleUpdateMinimum = (shift: string, value: number) => {
    setShiftMinimums(prev =>
      prev.map(s => s.shift === shift ? { ...s, minimum: value } : s)
    );
    // 값이 변경되면 확정 상태 해제
    setShiftMinimumsFinalized(false);
  };

  // 최소 인원 확정
  const handleFinalizeShiftMinimums = () => {
    setShiftMinimumsFinalized(true);
    setShiftMinimumsSavedAt(new Date().toLocaleString());
  };

  // 비밀번호 초기화 모달 열기
  const handleOpenResetPasswordModal = (account: PendingAccount) => {
    setResetPasswordAccount(account);
    setResetPasswordModal(true);
  };

  // 비밀번호 초기화 실행
  const handleResetPassword = () => {
    if (resetPasswordAccount) {
      // 실제 비밀번호 초기화 로직 구현
      setPasswordResetComplete(true);
    }
  };

  const pendingCount = pendingAccounts.filter(acc => acc.status === "대기중").length;
  const deletingPolicy = policies.find(p => p.id === deletingPolicyId);

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
                호텔 설정
              </h1>
            </div>
          </div>

          <p style={{ fontSize: 11, color: C.charcoal, lineHeight: 1.6, marginBottom: 16 }}>
            스케줄 생성 엔진의 기준과 사용자 접근 권한을 관리하는 관리자 페이지입니다.
          </p>

          {/* 탭 */}
          <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            {[
              { key: "accounts" as const, label: "계정 및 접근 관리", badge: pendingCount > 0 ? pendingCount : undefined },
              { key: "policies" as const, label: "운영 정책" },
              { key: "shifts" as const, label: "최소 조별 인원" },
              { key: "logs" as const, label: "수정 이력" },
            ].map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
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
                    position: "relative",
                  }}
                >
                  {tab.label}
                  {tab.badge && (
                    <span style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      backgroundColor: C.risk,
                      color: C.white,
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 700,
                    }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 40px" }}>
          {/* 계정 및 접근 관리 */}
          {activeTab === "accounts" && (
            <div>
              <div style={{
                backgroundColor: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                overflow: "hidden",
                marginBottom: 20,
              }}>
                <div style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${C.border}`,
                  backgroundColor: "#F7F4EF",
                }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Inter', sans-serif" }}>
                    회원가입 승인 대기 ({pendingCount}명)
                  </h3>
                </div>

                {pendingAccounts.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>이름</th>
                        <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>이메일</th>
                        <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>직원 ID</th>
                        <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>신청일</th>
                        <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>상태</th>
                        <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingAccounts.map((acc, i) => {
                        const rowBg = i % 2 === 1 ? C.rowAlt : C.white;
                        return (
                          <tr key={acc.id}>
                            <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11, fontWeight: 600, color: C.navy, backgroundColor: rowBg }}>{acc.name}</td>
                            <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 10, color: C.charcoal, backgroundColor: rowBg }}>{acc.email}</td>
                            <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 10, fontWeight: 600, color: C.charcoal, backgroundColor: rowBg, fontFamily: "'Inter', sans-serif" }}>{acc.employeeId}</td>
                            <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 10, color: C.charcoal, backgroundColor: rowBg }}>{acc.requestedAt}</td>
                            <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                              {acc.status === "대기중" && (
                                <span style={{
                                  display: "inline-block",
                                  padding: "3px 10px",
                                  fontSize: 10,
                                  fontWeight: 600,
                                  borderRadius: 3,
                                  backgroundColor: C.pendingBg,
                                  color: C.pending,
                                  border: `1px solid ${C.pendingBorder}`,
                                }}>대기중</span>
                              )}
                              {acc.status === "승인됨" && (
                                <span style={{
                                  display: "inline-block",
                                  padding: "3px 10px",
                                  fontSize: 10,
                                  fontWeight: 600,
                                  borderRadius: 3,
                                  backgroundColor: C.okBg,
                                  color: C.ok,
                                  border: `1px solid ${C.okBorder}`,
                                }}>승인됨</span>
                              )}
                              {acc.status === "거절됨" && (
                                <span style={{
                                  display: "inline-block",
                                  padding: "3px 10px",
                                  fontSize: 10,
                                  fontWeight: 600,
                                  borderRadius: 3,
                                  backgroundColor: C.riskBg,
                                  color: C.risk,
                                  border: `1px solid ${C.riskBorder}`,
                                }}>거절됨</span>
                              )}
                            </td>
                            <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                              {acc.status === "대기중" && (
                                <button
                                  onClick={() => {
                                    setSelectedPendingAccount(acc);
                                    setManageAccountModal(true);
                                  }}
                                  style={{
                                    padding: "5px 16px",
                                    backgroundColor: C.navy,
                                    color: "#EAE0CC",
                                    border: "none",
                                    borderRadius: 3,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  관리
                                </button>
                              )}
                              {acc.status !== "대기중" && (
                                <span style={{ fontSize: 10, color: C.muted }}>-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: C.muted, fontSize: 12 }}>
                    승인 대기 중인 계정이 없습니다.
                  </div>
                )}
              </div>

              {/* 활성 계정 관리 */}
              <div style={{
                backgroundColor: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                overflow: "hidden",
                marginBottom: 20,
              }}>
                <div style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${C.border}`,
                  backgroundColor: "#F7F4EF",
                }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Inter', sans-serif" }}>
                    활성 계정 관리 (전체 {activeAccounts.length}명 · 활성 {activeAccounts.filter(a => a.status === "활성").length}명 · 비활성 {activeAccounts.filter(a => a.status === "비활성").length}명)
                  </h3>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F7F4EF" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>이름</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>사번</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>이메일</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>직급</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>권한</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>상태</th>
                      <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAccounts.map((acc, i) => {
                      const rowBg = i % 2 === 1 ? C.rowAlt : C.white;
                      return (
                        <tr key={acc.id}>
                          <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11, fontWeight: 600, color: C.navy, backgroundColor: rowBg }}>{acc.name}</td>
                          <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 10, fontWeight: 600, color: C.charcoal, backgroundColor: rowBg, fontFamily: "'Inter', sans-serif" }}>{acc.employeeId}</td>
                          <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 10, color: C.charcoal, backgroundColor: rowBg }}>{acc.email}</td>
                          <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 10, fontWeight: 600, color: C.charcoal, backgroundColor: rowBg }}>{acc.grade}</td>
                          <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                            <span style={{
                              display: "inline-block",
                              padding: "3px 10px",
                              fontSize: 10,
                              fontWeight: 600,
                              borderRadius: 3,
                              backgroundColor: acc.role === "최종 관리자" ? C.goldBg : acc.role === "운영 관리자" ? C.pendingBg : C.border,
                              color: acc.role === "최종 관리자" ? C.gold : acc.role === "운영 관리자" ? C.pending : C.charcoal,
                              border: `1px solid ${acc.role === "최종 관리자" ? C.goldBorder : acc.role === "운영 관리자" ? C.pendingBorder : C.border}`,
                            }}>
                              {acc.role}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                            <span style={{
                              display: "inline-block",
                              padding: "3px 10px",
                              fontSize: 10,
                              fontWeight: 600,
                              borderRadius: 3,
                              backgroundColor: acc.status === "활성" ? C.okBg : "#F0F0F0",
                              color: acc.status === "활성" ? C.ok : C.muted,
                              border: `1px solid ${acc.status === "활성" ? C.okBorder : "#D0D0D0"}`,
                            }}>
                              {acc.status}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                              {acc.status === "활성" ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedAccount(acc);
                                      setResetPasswordActiveModal(true);
                                    }}
                                    style={{
                                      padding: "5px 10px",
                                      backgroundColor: "transparent",
                                      color: C.warning,
                                      border: `1px solid ${C.warnBorder}`,
                                      borderRadius: 3,
                                      fontSize: 9,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    PW 초기화
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedAccount(acc);
                                      setNewRole(acc.role);
                                      setChangeRoleModal(true);
                                    }}
                                    style={{
                                      padding: "5px 10px",
                                      backgroundColor: "transparent",
                                      color: C.charcoal,
                                      border: `1px solid ${C.border}`,
                                      borderRadius: 3,
                                      fontSize: 9,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    권한 변경
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedAccount(acc);
                                      setDeactivateAccountModal(true);
                                    }}
                                    style={{
                                      padding: "5px 10px",
                                      backgroundColor: "transparent",
                                      color: C.risk,
                                      border: `1px solid ${C.riskBorder}`,
                                      borderRadius: 3,
                                      fontSize: 9,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    비활성화
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedAccount(acc);
                                      setActivateAccountModal(true);
                                    }}
                                    style={{
                                      padding: "5px 10px",
                                      backgroundColor: "transparent",
                                      color: C.ok,
                                      border: `1px solid ${C.okBorder}`,
                                      borderRadius: 3,
                                      fontSize: 9,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    활성화
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedAccount(acc);
                                      setNewRole(acc.role);
                                      setChangeRoleModal(true);
                                    }}
                                    style={{
                                      padding: "5px 10px",
                                      backgroundColor: "transparent",
                                      color: C.charcoal,
                                      border: `1px solid ${C.border}`,
                                      borderRadius: 3,
                                      fontSize: 9,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    권한 변경
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 비밀번호 초기화 */}
              <div style={{
                backgroundColor: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                padding: 20,
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>
                  비밀번호 초기화
                </h3>
                <p style={{ fontSize: 11, color: C.charcoal, lineHeight: 1.6, marginBottom: 16 }}>
                  직원이 비밀번호를 분실한 경우 관리자가 초기화할 수 있습니다. 위 활성 계정 관리 테이블에서 개별 직원의 비밀번호를 초기화할 수 있습니다.
                </p>
                <div style={{
                  padding: 12,
                  backgroundColor: C.pendingBg,
                  border: `1px solid ${C.pendingBorder}`,
                  borderRadius: 4,
                }}>
                  <div style={{ fontSize: 10, color: C.pending, lineHeight: 1.6 }}>
                    보안을 위해 비밀번호 초기화는 활성 계정 관리 테이블에서 개별적으로 실행할 수 있습니다.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 운영 정책 */}
          {activeTab === "policies" && (
            <div>
              {/* 필수 운영정책 */}
              <div style={{
                backgroundColor: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                overflow: "hidden",
                marginBottom: 20,
              }}>
                <div style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${C.border}`,
                  backgroundColor: C.okBg,
                  borderLeft: `4px solid ${C.ok}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: C.ok, fontFamily: "'Inter', sans-serif" }}>
                      필수 운영정책
                    </h3>
                    <p style={{ fontSize: 10, color: C.charcoal, marginTop: 4 }}>
                      반드시 반영되는 규칙입니다.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAddPolicyType("필수");
                      setEditForm({ title: "", description: "", type: "필수" });
                      setAddPolicyModal(true);
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: C.white,
                      color: C.ok,
                      border: `1px solid ${C.okBorder}`,
                      borderRadius: 3,
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    + 정책 추가
                  </button>
                </div>

                <div style={{ padding: 20 }}>
                  {policies.filter(p => p.type === "필수").map((policy, i) => (
                    <div
                      key={policy.id}
                      style={{
                        padding: 16,
                        backgroundColor: i % 2 === 0 ? C.white : C.rowAlt,
                        borderBottom: i < policies.filter(p => p.type === "필수").length - 1 ? `1px solid ${C.borderLight}` : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
                            {policy.title}
                          </div>
                          <div style={{ fontSize: 10, color: C.charcoal, lineHeight: 1.6 }}>
                            {policy.description}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={policy.enabled}
                              onChange={() => handleTogglePolicy(policy.id)}
                              style={{ cursor: "pointer" }}
                            />
                            <span style={{ fontSize: 10, fontWeight: 600, color: policy.enabled ? C.ok : C.muted, whiteSpace: "nowrap" }}>
                              {policy.enabled ? "활성화" : "비활성화"}
                            </span>
                          </label>
                          <button
                            onClick={() => handleEditPolicy(policy)}
                            style={{
                              padding: "5px 10px",
                              backgroundColor: "transparent",
                              color: C.charcoal,
                              border: `1px solid ${C.border}`,
                              borderRadius: 3,
                              fontSize: 10,
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeletePolicy(policy.id)}
                            style={{
                              padding: "5px 10px",
                              backgroundColor: "transparent",
                              color: C.risk,
                              border: `1px solid ${C.riskBorder}`,
                              borderRadius: 3,
                              fontSize: 10,
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 권장 운영정책 */}
              <div style={{
                backgroundColor: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${C.border}`,
                  backgroundColor: C.warnBg,
                  borderLeft: `4px solid ${C.warning}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: C.warning, fontFamily: "'Inter', sans-serif" }}>
                      권장 운영정책
                    </h3>
                    <p style={{ fontSize: 10, color: C.charcoal, marginTop: 4 }}>
                      강제 차단이 아닌 경고 또는 지양 규칙입니다.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAddPolicyType("권장");
                      setEditForm({ title: "", description: "", type: "권장" });
                      setAddPolicyModal(true);
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: C.white,
                      color: C.warning,
                      border: `1px solid ${C.warnBorder}`,
                      borderRadius: 3,
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    + 정책 추가
                  </button>
                </div>

                <div style={{ padding: 20 }}>
                  {policies.filter(p => p.type === "권장").map((policy, i) => (
                    <div
                      key={policy.id}
                      style={{
                        padding: 16,
                        backgroundColor: i % 2 === 0 ? C.white : C.rowAlt,
                        borderBottom: i < policies.filter(p => p.type === "권장").length - 1 ? `1px solid ${C.borderLight}` : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
                            {policy.title}
                          </div>
                          <div style={{ fontSize: 10, color: C.charcoal, lineHeight: 1.6 }}>
                            {policy.description}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={policy.enabled}
                              onChange={() => handleTogglePolicy(policy.id)}
                              style={{ cursor: "pointer" }}
                            />
                            <span style={{ fontSize: 10, fontWeight: 600, color: policy.enabled ? C.warning : C.muted, whiteSpace: "nowrap" }}>
                              {policy.enabled ? "활성화" : "비활성화"}
                            </span>
                          </label>
                          <button
                            onClick={() => handleEditPolicy(policy)}
                            style={{
                              padding: "5px 10px",
                              backgroundColor: "transparent",
                              color: C.charcoal,
                              border: `1px solid ${C.border}`,
                              borderRadius: 3,
                              fontSize: 10,
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeletePolicy(policy.id)}
                            style={{
                              padding: "5px 10px",
                              backgroundColor: "transparent",
                              color: C.risk,
                              border: `1px solid ${C.riskBorder}`,
                              borderRadius: 3,
                              fontSize: 10,
                              fontWeight: 500,
                              cursor: "pointer",
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 공휴일 처리 원칙 */}
              <div style={{
                marginTop: 20,
                padding: 16,
                backgroundColor: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.navy, marginBottom: 10 }}>
                  공휴일 처리 원칙
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: C.charcoal, lineHeight: 1.8 }}>
                  <li>공휴일이라도 호텔 운영이 우선됩니다.</li>
                  <li>수요 예측과 최소 운영 인원 기준을 먼저 판단합니다.</li>
                  <li>최소 인원만 출근해도 되는 상황이면 일부 직원은 공휴로 쉬도록 자동 반영합니다.</li>
                  <li>최소 인원 충족이 어려우면 공휴일에도 근무 배치가 가능합니다.</li>
                  <li>공휴일은 절대 우선 보장값이 아니라 운영 조건을 먼저 충족한 후 가능할 때 적용되는 자동 반영값입니다.</li>
                </ul>
              </div>
            </div>
          )}

          {/* 최소 조별 인원 */}
          {activeTab === "shifts" && (
            <div style={{
              backgroundColor: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              overflow: "hidden",
            }}>
              <div style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${C.border}`,
                backgroundColor: "#F7F4EF",
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Inter', sans-serif" }}>
                  최소 조별 인원 설정
                </h3>
                <p style={{ fontSize: 10, color: C.charcoal, marginTop: 4 }}>
                  각 조에 반드시 배치되어야 하는 최소 인원을 설정합니다.
                </p>
              </div>

              <div style={{ padding: 20 }}>
                {shiftMinimums.map((shift, i) => (
                  <div
                    key={shift.shift}
                    style={{
                      padding: 16,
                      backgroundColor: i % 2 === 0 ? C.white : C.rowAlt,
                      borderBottom: i < shiftMinimums.length - 1 ? `1px solid ${C.borderLight}` : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 4 }}>
                        {shift.shift}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted }}>
                        최소 인원 설정
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={shift.minimum}
                        onChange={(e) => handleUpdateMinimum(shift.shift, Number(e.target.value))}
                        style={{
                          width: 80,
                          padding: "8px 12px",
                          border: `1px solid ${C.border}`,
                          borderRadius: 3,
                          fontSize: 12,
                          fontWeight: 600,
                          textAlign: "center",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      />
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.charcoal }}>명</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                padding: 16,
                backgroundColor: C.pendingBg,
                border: `1px solid ${C.pendingBorder}`,
                borderTop: "none",
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4,
              }}>
                <div style={{ fontSize: 10, color: C.pending, lineHeight: 1.6 }}>
                  최소 조별 인원은 스케줄 생성 시 반드시 충족되어야 하는 필수 운영정책입니다.
                </div>
              </div>

              {/* 최소 인원 확정 버튼 - 항상 표시 */}
              <div style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {shiftMinimumsFinalized && shiftMinimumsSavedAt && (
                  <div style={{ fontSize: 10, color: C.ok, lineHeight: 1.6 }}>
                    ✓ 최소 인원이 {shiftMinimumsSavedAt}에 확정되었습니다
                  </div>
                )}
                {!shiftMinimumsFinalized && (
                  <div style={{ fontSize: 10, color: C.warning, lineHeight: 1.6 }}>
                    ⚠ 변경 사항이 있습니다. 확정 버튼을 눌러주세요
                  </div>
                )}
                <button
                  onClick={handleFinalizeShiftMinimums}
                  disabled={shiftMinimumsFinalized}
                  style={{
                    padding: "8px 18px",
                    backgroundColor: shiftMinimumsFinalized ? C.border : C.navy,
                    color: shiftMinimumsFinalized ? C.muted : "#EAE0CC",
                    border: "none",
                    borderRadius: 3,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: shiftMinimumsFinalized ? "not-allowed" : "pointer",
                    opacity: shiftMinimumsFinalized ? 0.6 : 1,
                  }}
                >
                  {shiftMinimumsFinalized ? "확정 완료" : "최소 인원 확정"}
                </button>
              </div>
            </div>
          )}

          {/* 수정 이력 */}
          {activeTab === "logs" && (
            <div style={{
              backgroundColor: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              overflow: "hidden",
            }}>
              <div style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${C.border}`,
                backgroundColor: "#F7F4EF",
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Inter', sans-serif" }}>
                  최근 수정 이력
                </h3>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>관리자</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>권한</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>작업</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>대상</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>상세</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>일시</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log, i) => {
                    const rowBg = i % 2 === 1 ? C.rowAlt : C.white;
                    return (
                      <tr key={log.id}>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11, fontWeight: 600, color: C.navy, backgroundColor: rowBg }}>{log.admin}</td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                          <span style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            fontSize: 9,
                            fontWeight: 600,
                            borderRadius: 3,
                            backgroundColor: log.role === "최종 관리자" ? C.goldBg : log.role === "운영 관리자" ? C.pendingBg : C.border,
                            color: log.role === "최종 관리자" ? C.gold : log.role === "운영 관리자" ? C.pending : C.charcoal,
                            border: `1px solid ${log.role === "최종 관리자" ? C.goldBorder : log.role === "운영 관리자" ? C.pendingBorder : C.border}`,
                          }}>
                            {log.role}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 10, fontWeight: 600, color: C.charcoal, backgroundColor: rowBg }}>{log.action}</td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 10, color: C.charcoal, backgroundColor: rowBg }}>{log.target}</td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 10, color: C.muted, backgroundColor: rowBg }}>{log.details}</td>
                        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", fontSize: 10, color: C.charcoal, backgroundColor: rowBg, fontFamily: "'Inter', sans-serif" }}>{log.timestamp}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* 정책 수정 모달 */}
        <Modal
          open={editPolicyModal}
          onClose={() => setEditPolicyModal(false)}
          title="운영 정책 수정"
          description="정책 세부 사항을 수정합니다"
        >
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>
                정책 유형
              </label>
              <select
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value as "필수" | "권장" })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontSize: 12,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <option value="필수">필수</option>
                <option value="권장">권장</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>
                정책명
              </label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontSize: 12,
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>
                정책 설명
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontSize: 12,
                  fontFamily: "'Inter', sans-serif",
                  resize: "vertical",
                }}
              />
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setEditPolicyModal(false)}
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
              <button
                onClick={handleSaveEdit}
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
                저장
              </button>
            </div>
          </div>
        </Modal>
        
        {/* 정책 삭제 확인 모달 */}
        <Modal
          open={deletePolicyModal}
          onClose={() => setDeletePolicyModal(false)}
          title="운영 정책 삭제"
          description="정책을 삭제하시겠습니까?"
          width={500}
        >
          <div style={{ padding: 24 }}>
            {deletingPolicy && (
              <div>
                <div style={{
                  padding: 16,
                  backgroundColor: deletingPolicy.type === "필수" ? C.riskBg : C.warnBg,
                  border: `1px solid ${deletingPolicy.type === "필수" ? C.riskBorder : C.warnBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
                    {deletingPolicy.title}
                  </div>
                  <div style={{ fontSize: 10, color: C.charcoal }}>
                    {deletingPolicy.description}
                  </div>
                </div>
                
                <div style={{
                  padding: 12,
                  backgroundColor: deletingPolicy.type === "필수" ? C.riskBg : C.warnBg,
                  border: `1px solid ${deletingPolicy.type === "필수" ? C.riskBorder : C.warnBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 10, color: deletingPolicy.type === "필수" ? C.risk : C.warning, lineHeight: 1.6 }}>
                    {deletingPolicy.type === "필수" 
                      ? "필수 운영정책을 삭제하면 스케줄 생성 기준에 영향을 줄 수 있습니다."
                      : "이 정책을 삭제하면 스케줄 생성 시 경고 기준에서 제외됩니다."
                    }
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setDeletePolicyModal(false)}
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
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: "8px 18px",
                  backgroundColor: C.risk,
                  color: C.white,
                  border: "none",
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </Modal>
        
        {/* 정책 추가 모달 */}
        <Modal
          open={addPolicyModal}
          onClose={() => setAddPolicyModal(false)}
          title={`${addPolicyType} 운영정책 추가`}
          description="새로운 정책을 추가합니다"
        >
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>
                정책명
              </label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="정책명을 입력하세요"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontSize: 12,
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>
                정책 설명
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="정책 설명을 입력하세요"
                rows={4}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontSize: 12,
                  fontFamily: "'Inter', sans-serif",
                  resize: "vertical",
                }}
              />
            </div>
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setAddPolicyModal(false)}
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
              <button
                onClick={handleAddPolicy}
                disabled={!editForm.title || !editForm.description}
                style={{
                  padding: "8px 18px",
                  backgroundColor: (!editForm.title || !editForm.description) ? C.border : C.navy,
                  color: (!editForm.title || !editForm.description) ? C.muted : "#EAE0CC",
                  border: "none",
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: (!editForm.title || !editForm.description) ? "not-allowed" : "pointer",
                }}
              >
                추가
              </button>
            </div>
          </div>
        </Modal>
        
        {/* 비밀번호 초기화 모달 */}
        <Modal
          open={resetPasswordModal}
          onClose={() => setResetPasswordModal(false)}
          title="비밀번호 초기화"
          description="선택한 계정의 비밀번호를 초기화합니다"
          width={500}
        >
          <div style={{ padding: 24 }}>
            {resetPasswordAccount && (
              <div>
                <div style={{
                  padding: 16,
                  backgroundColor: C.warnBg,
                  border: `1px solid ${C.warnBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
                    {resetPasswordAccount.name}
                  </div>
                  <div style={{ fontSize: 10, color: C.charcoal }}>
                    {resetPasswordAccount.email}
                  </div>
                </div>
                
                <div style={{
                  padding: 12,
                  backgroundColor: C.warnBg,
                  border: `1px solid ${C.warnBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 10, color: C.warning, lineHeight: 1.6 }}>
                    이 계정의 비밀번호를 초기화하면 새로운 비밀번호가 생성됩니다.
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setResetPasswordModal(false)}
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
              <button
                onClick={handleResetPassword}
                style={{
                  padding: "8px 18px",
                  backgroundColor: C.warning,
                  color: C.white,
                  border: "none",
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                초기화
              </button>
            </div>
            
            {passwordResetComplete && (
              <div style={{ marginTop: 20, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.ok, lineHeight: 1.6 }}>
                  비밀번호가 성공적으로 초기화되었습니다.
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* 권한 변경 모달 */}
        <Modal
          open={changeRoleModal}
          onClose={() => setChangeRoleModal(false)}
          title="계정 권한 변경"
          description="선택한 계정의 권한을 변경합니다"
          width={500}
        >
          <div style={{ padding: 24 }}>
            {selectedAccount && (
              <div>
                <div style={{
                  padding: 16,
                  backgroundColor: C.goldBg,
                  border: `1px solid ${C.goldBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
                    {selectedAccount.name} ({selectedAccount.employeeId})
                  </div>
                  <div style={{ fontSize: 10, color: C.charcoal }}>
                    현재 권한: {selectedAccount.role}
                  </div>
                </div>
                
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 8 }}>
                    새로운 권한 선택
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as "일반 직원" | "운영 관리자" | "최종 관리자")}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 3,
                      fontSize: 12,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <option value="일반 직원">일반 직원</option>
                    <option value="운영 관리자">운영 관리자</option>
                    <option value="최종 관리자">최종 관리자</option>
                  </select>
                </div>

                <div style={{
                  padding: 12,
                  backgroundColor: C.pendingBg,
                  border: `1px solid ${C.pendingBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 10, color: C.pending, lineHeight: 1.6 }}>
                    <strong>권한 안내:</strong><br/>
                    • 일반 직원: 본인 스케줄 조회 및 휴가 신청<br/>
                    • 운영 관리자: 스케줄 생성 및 수정, 직원 관리<br/>
                    • 최종 관리자: 모든 권한 + 호텔 설정 관리
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setChangeRoleModal(false)}
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
              <button
                onClick={() => {
                  if (selectedAccount) {
                    setActiveAccounts(prev =>
                      prev.map(acc => acc.id === selectedAccount.id ? { ...acc, role: newRole } : acc)
                    );
                    setChangeRoleModal(false);
                  }
                }}
                style={{
                  padding: "8px 18px",
                  backgroundColor: C.gold,
                  color: C.white,
                  border: "none",
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                권한 변경
              </button>
            </div>
          </div>
        </Modal>

        {/* 계정 비활성화 모달 */}
        <Modal
          open={deactivateAccountModal}
          onClose={() => setDeactivateAccountModal(false)}
          title="계정 비활성화"
          description="선택한 계정을 비활성화합니다"
          width={500}
        >
          <div style={{ padding: 24 }}>
            {selectedAccount && (
              <div>
                <div style={{
                  padding: 16,
                  backgroundColor: C.riskBg,
                  border: `1px solid ${C.riskBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
                    {selectedAccount.name} ({selectedAccount.employeeId})
                  </div>
                  <div style={{ fontSize: 10, color: C.charcoal }}>
                    {selectedAccount.email}
                  </div>
                </div>
                
                <div style={{
                  padding: 12,
                  backgroundColor: C.riskBg,
                  border: `1px solid ${C.riskBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 10, color: C.risk, lineHeight: 1.6 }}>
                    이 계정을 비활성화하면 더 이상 시스템에 로그인할 수 없습니다. 비활성화된 계정은 나중에 다시 활성화할 수 있습니다.
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setDeactivateAccountModal(false)}
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
              <button
                onClick={() => {
                  if (selectedAccount) {
                    setActiveAccounts(prev =>
                      prev.map(acc => acc.id === selectedAccount.id ? { ...acc, status: "비활성" as const } : acc)
                    );
                    setDeactivateAccountModal(false);
                  }
                }}
                style={{
                  padding: "8px 18px",
                  backgroundColor: C.risk,
                  color: C.white,
                  border: "none",
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                비활성화
              </button>
            </div>
          </div>
        </Modal>

        {/* 계정 활성화 모달 */}
        <Modal
          open={activateAccountModal}
          onClose={() => setActivateAccountModal(false)}
          title="계정 활성화"
          description="선택한 계정을 활성화합니다"
          width={500}
        >
          <div style={{ padding: 24 }}>
            {selectedAccount && (
              <div>
                <div style={{
                  padding: 16,
                  backgroundColor: C.okBg,
                  border: `1px solid ${C.okBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
                    {selectedAccount.name} ({selectedAccount.employeeId})
                  </div>
                  <div style={{ fontSize: 10, color: C.charcoal }}>
                    {selectedAccount.email}
                  </div>
                </div>
                
                <div style={{
                  padding: 12,
                  backgroundColor: C.okBg,
                  border: `1px solid ${C.okBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 10, color: C.ok, lineHeight: 1.6 }}>
                    이 계정을 활성화하면 다시 시스템에 로그인할 수 있게 됩니다. 활성화 후 필요시 비밀번호를 초기화할 수 있습니다.
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setActivateAccountModal(false)}
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
              <button
                onClick={() => {
                  if (selectedAccount) {
                    setActiveAccounts(prev =>
                      prev.map(acc => acc.id === selectedAccount.id ? { ...acc, status: "활성" as const } : acc)
                    );
                    setActivateAccountModal(false);
                  }
                }}
                style={{
                  padding: "8px 18px",
                  backgroundColor: C.ok,
                  color: C.white,
                  border: "none",
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                활성화
              </button>
            </div>
          </div>
        </Modal>

        {/* 활성 계정 비밀번호 초기화 모달 */}
        <Modal
          open={resetPasswordActiveModal}
          onClose={() => setResetPasswordActiveModal(false)}
          title="비밀번호 초기화"
          description="선택한 계정의 비밀번호를 초기화합니다"
          width={500}
        >
          <div style={{ padding: 24 }}>
            {selectedAccount && (
              <div>
                <div style={{
                  padding: 16,
                  backgroundColor: C.warnBg,
                  border: `1px solid ${C.warnBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
                    {selectedAccount.name} ({selectedAccount.employeeId})
                  </div>
                  <div style={{ fontSize: 10, color: C.charcoal }}>
                    {selectedAccount.email}
                  </div>
                </div>
                
                <div style={{
                  padding: 12,
                  backgroundColor: C.warnBg,
                  border: `1px solid ${C.warnBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 10, color: C.warning, lineHeight: 1.6 }}>
                    이 계정의 비밀번호를 초기화하면 임시 비밀번호가 생성되어 등록된 이메일로 전송됩니다.
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setResetPasswordActiveModal(false)}
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
              <button
                onClick={() => {
                  // 비밀번호 초기화 로직
                  alert(`${selectedAccount?.name}님의 비밀번호가 초기화되었습니다.`);
                  setResetPasswordActiveModal(false);
                }}
                style={{
                  padding: "8px 18px",
                  backgroundColor: C.warning,
                  color: C.white,
                  border: "none",
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                초기화
              </button>
            </div>
          </div>
        </Modal>

        {/* 회원가입 승인 확인 모달 */}
        <Modal
          open={approveAccountModal}
          onClose={() => setApproveAccountModal(false)}
          title="회원가입 승인"
          description="선택한 계정을 승인하고 활성화합니다"
          width={500}
        >
          <div style={{ padding: 24 }}>
            {selectedPendingAccount && (
              <div>
                <div style={{
                  padding: 16,
                  backgroundColor: C.okBg,
                  border: `1px solid ${C.okBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
                    {selectedPendingAccount.name}
                  </div>
                  <div style={{ fontSize: 10, color: C.charcoal, marginBottom: 4 }}>
                    {selectedPendingAccount.email}
                  </div>
                  <div style={{ fontSize: 10, color: C.charcoal, fontFamily: "'Inter', sans-serif" }}>
                    사번: {selectedPendingAccount.employeeId}
                  </div>
                </div>
                
                <div style={{
                  padding: 12,
                  backgroundColor: C.okBg,
                  border: `1px solid ${C.okBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 10, color: C.ok, lineHeight: 1.6 }}>
                    이 계정을 승인하면 다음과 같이 설정됩니다:<br/>
                    • 호텔: 롯데호텔 서울<br/>
                    • 부서: 프런트 데스크<br/>
                    • 직급: 엘크루 (신입)<br/>
                    • 권한: 일반 직원<br/>
                    • 상태: 활성<br/><br/>
                    승인 후 활성 계정 관리에서 권한과 정보를 수정할 수 있습니다.
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setApproveAccountModal(false)}
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
              <button
                onClick={() => {
                  if (selectedPendingAccount) {
                    handleApprove(selectedPendingAccount.id);
                    setApproveAccountModal(false);
                  }
                }}
                style={{
                  padding: "8px 18px",
                  backgroundColor: C.ok,
                  color: C.white,
                  border: "none",
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                승인
              </button>
            </div>
          </div>
        </Modal>

        {/* 회원가입 거절 확인 모달 */}
        <Modal
          open={rejectAccountModal}
          onClose={() => setRejectAccountModal(false)}
          title="회원가입 거절"
          description="선택한 계정의 가입 신청을 거절합니다"
          width={500}
        >
          <div style={{ padding: 24 }}>
            {selectedPendingAccount && (
              <div>
                <div style={{
                  padding: 16,
                  backgroundColor: C.riskBg,
                  border: `1px solid ${C.riskBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
                    {selectedPendingAccount.name}
                  </div>
                  <div style={{ fontSize: 10, color: C.charcoal, marginBottom: 4 }}>
                    {selectedPendingAccount.email}
                  </div>
                  <div style={{ fontSize: 10, color: C.charcoal, fontFamily: "'Inter', sans-serif" }}>
                    사번: {selectedPendingAccount.employeeId}
                  </div>
                </div>
                
                <div style={{
                  padding: 12,
                  backgroundColor: C.riskBg,
                  border: `1px solid ${C.riskBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 10, color: C.risk, lineHeight: 1.6 }}>
                    이 계정의 가입 신청을 거절하면 해당 사용자는 시스템에 접근할 수 없습니다. 필요시 나중에 다시 승인할 수 있습니다.
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setRejectAccountModal(false)}
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
              <button
                onClick={() => {
                  if (selectedPendingAccount) {
                    handleReject(selectedPendingAccount.id);
                    setRejectAccountModal(false);
                  }
                }}
                style={{
                  padding: "8px 18px",
                  backgroundColor: C.risk,
                  color: C.white,
                  border: "none",
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                거절
              </button>
            </div>
          </div>
        </Modal>

        {/* 회원가입 신청 관리 모달 (통합) */}
        <Modal
          open={manageAccountModal}
          onClose={() => {
            setManageAccountModal(false);
            setSelectedPendingAccount(null);
          }}
          title="회원가입 신청 관리"
          description="신청자 정보를 확인하고 승인 또는 거절하세요"
          width={600}
        >
          <div style={{ padding: 24 }}>
            {selectedPendingAccount && (
              <div>
                {/* 신청자 정보 */}
                <div style={{
                  padding: 18,
                  backgroundColor: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    신청자 정보
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>이름</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{selectedPendingAccount.name}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>사번</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: "'Inter', sans-serif" }}>{selectedPendingAccount.employeeId}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>이메일</div>
                      <div style={{ fontSize: 11, color: C.charcoal }}>{selectedPendingAccount.email}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>신청일</div>
                      <div style={{ fontSize: 11, color: C.charcoal }}>{selectedPendingAccount.requestedAt}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>호텔</div>
                      <div style={{ fontSize: 11, color: C.charcoal }}>롯데호텔 서울</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>부서</div>
                      <div style={{ fontSize: 11, color: C.charcoal }}>프런트 데스크</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>직급</div>
                      <div style={{ fontSize: 11, color: C.charcoal }}>엘크루 (신입)</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>현재 상태</div>
                      <span style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        fontSize: 10,
                        fontWeight: 600,
                        borderRadius: 3,
                        backgroundColor: C.pendingBg,
                        color: C.pending,
                        border: `1px solid ${C.pendingBorder}`,
                      }}>승인 대기</span>
                    </div>
                  </div>
                </div>

                {/* 승인 후 계정 설정 안내 */}
                <div style={{
                  padding: 16,
                  backgroundColor: C.okBg,
                  border: `1px solid ${C.okBorder}`,
                  borderRadius: 4,
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.ok, marginBottom: 8 }}>
                    ✓ 승인 시 자동 설정되는 정보
                  </div>
                  <div style={{ fontSize: 10, color: C.charcoal, lineHeight: 1.8 }}>
                    • 호텔: 롯데호텔 서울<br/>
                    • 부서: 프런트 데스크<br/>
                    • 직급: 엘크루 (신입)<br/>
                    • 권한: 일반 직원<br/>
                    • 계정 상태: 활성<br/><br/>
                    <span style={{ color: C.muted }}>승인 후 활성 계정 관리에서 권한과 정보를 수정할 수 있습니다.</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 액션 버튼 */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => {
                  setManageAccountModal(false);
                  setSelectedPendingAccount(null);
                }}
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
              <button
                onClick={() => {
                  if (selectedPendingAccount) {
                    handleReject(selectedPendingAccount.id);
                  }
                }}
                style={{
                  padding: "8px 18px",
                  backgroundColor: "transparent",
                  color: C.risk,
                  border: `1px solid ${C.riskBorder}`,
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                거절
              </button>
              <button
                onClick={() => {
                  if (selectedPendingAccount) {
                    handleApprove(selectedPendingAccount.id);
                  }
                }}
                style={{
                  padding: "8px 18px",
                  backgroundColor: C.ok,
                  color: C.white,
                  border: "none",
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                승인
              </button>
            </div>
          </div>
        </Modal>

        {/* 성공 메시지 토스트 */}
        {successMessage && (
          <div style={{
            position: "fixed",
            top: 80,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2000,
            padding: "14px 24px",
            backgroundColor: C.ok,
            color: C.white,
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            animation: "slideDown 0.3s ease-out",
          }}>
            ✓ {successMessage}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
