import { useState } from "react";
import AlertModal from "./AlertModal";

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
  risk:        "#B83232",
  riskBg:      "rgba(184,50,50,0.06)",
  riskBorder:  "rgba(184,50,50,0.22)",
  ok:          "#2E7D52",
  okBg:        "rgba(46,125,82,0.07)",
  okBorder:    "rgba(46,125,82,0.2)",
  warning:     "#B87C1A",
  warnBg:      "rgba(184,124,26,0.08)",
  warnBorder:  "rgba(184,124,26,0.22)",
};

/* ══════════════════════════════════════════════════════════
   TYPE DEFINITIONS
══════════════════════════════════════════════════════════ */
type AssignmentType = "priority" | "backup" | "excluded" | "unassigned";

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  grade: string;
  role: string;
  primaryShift: string;
  hasVacation?: boolean;
  hasAnnualLeave?: boolean;
  hasSL?: boolean;
}

interface MonthlyPlan {
  month: number;
  requiredCount: number;
  priorityEmployees: string[];
  backupEmployees: string[];
  excludedEmployees: string[];
  conflictCount: number;
}

interface MonthlyNightShiftPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  plan: MonthlyPlan;
  employees: Employee[];
  onSave: (updatedPlan: MonthlyPlan) => void;
}

export default function MonthlyNightShiftPlanModal({
  isOpen,
  onClose,
  year,
  plan,
  employees,
  onSave,
}: MonthlyNightShiftPlanModalProps) {
  const [requiredCount, setRequiredCount] = useState(plan.requiredCount);
  const [priorityEmployees, setPriorityEmployees] = useState<string[]>(plan.priorityEmployees);
  const [backupEmployees, setBackupEmployees] = useState<string[]>(plan.backupEmployees);
  const [excludedEmployees, setExcludedEmployees] = useState<string[]>(plan.excludedEmployees);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"priority" | "excluded">("priority");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertOpen(true);
  };

  if (!isOpen) return null;

  const getEmployeeAssignment = (employeeId: string): AssignmentType => {
    if (priorityEmployees.includes(employeeId)) return "priority";
    if (backupEmployees.includes(employeeId)) return "backup";
    if (excludedEmployees.includes(employeeId)) return "excluded";
    return "unassigned";
  };

  const toggleEmployeeAssignment = (employeeId: string, type: AssignmentType) => {
    // 먼저 모든 목록에서 제거
    setPriorityEmployees(prev => prev.filter(id => id !== employeeId));
    setBackupEmployees(prev => prev.filter(id => id !== employeeId));
    setExcludedEmployees(prev => prev.filter(id => id !== employeeId));

    // 현재 타입이 아니면 추가
    if (getEmployeeAssignment(employeeId) !== type) {
      if (type === "priority") {
        setPriorityEmployees(prev => [...prev, employeeId]);
      } else if (type === "excluded") {
        setExcludedEmployees(prev => [...prev, employeeId]);
      }
    }
  };

  const handleAutoRecommend = () => {
    // Mock 자동 추천 로직
    const availableEmployees = employees.filter(emp =>
      !emp.hasVacation && !emp.hasAnnualLeave && !emp.hasSL
    );
    const recommended = availableEmployees.slice(0, requiredCount).map(emp => emp.id);
    setPriorityEmployees(recommended);
    showAlert(`${recommended.length}명의 우선 대상자가 자동 추천되었습니다.`);
  };

  const handleConflictCheck = () => {
    const conflicts = priorityEmployees.filter(empId => {
      const emp = employees.find(e => e.id === empId);
      return emp?.hasVacation || emp?.hasAnnualLeave || emp?.hasSL;
    });
    if (conflicts.length > 0) {
      showAlert(`${conflicts.length}명의 우선 대상자에게 휴가/연차 충돌이 있습니다.`);
    } else {
      showAlert("충돌이 발견되지 않았습니다.");
    }
  };

  const handleSave = () => {
    onSave({
      ...plan,
      requiredCount,
      priorityEmployees,
      backupEmployees,
      excludedEmployees,
      conflictCount: priorityEmployees.filter(empId => {
        const emp = employees.find(e => e.id === empId);
        return emp?.hasVacation || emp?.hasAnnualLeave || emp?.hasSL;
      }).length,
    });
    onClose();
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.grade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentTabEmployees = filteredEmployees.filter(emp => {
    const assignment = getEmployeeAssignment(emp.id);
    if (selectedTab === "priority") return assignment === "priority" || assignment === "unassigned";
    if (selectedTab === "excluded") return assignment === "excluded" || assignment === "unassigned";
    return false;
  });

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(13, 27, 42, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: 24,
    }}>
      <div style={{
        backgroundColor: C.white,
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        width: "100%",
        maxWidth: 1000,
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 32px",
          borderBottom: `1px solid ${C.borderLight}`,
        }}>
          <div style={{
            fontSize: 18,
            fontWeight: 600,
            color: C.navy,
            fontFamily: "'Cormorant Garamond', serif",
          }}>
            {year}년 {plan.month}월 야간조 계획
          </div>
          <div style={{
            fontSize: 13,
            color: C.muted,
            marginTop: 6,
          }}>
            우선 대상자와 제외 대상자를 지정하고, 휴가 충돌을 확인하세요.
          </div>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "24px 32px",
        }}>
          {/* 목표 인원 설정 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: C.charcoal,
              marginBottom: 12,
            }}>
              야간조 필요 목표 인원
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                type="number"
                min="1"
                max="10"
                value={requiredCount}
                onChange={(e) => setRequiredCount(Number(e.target.value))}
                style={{
                  width: 100,
                  padding: "8px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.navy,
                }}
              />
              <span style={{ fontSize: 14, color: C.muted }}>명</span>
              <div style={{
                marginLeft: "auto",
                display: "flex",
                gap: 8,
              }}>
                <button
                  onClick={handleAutoRecommend}
                  style={{
                    padding: "7px 14px",
                    border: `1px solid ${C.goldBorder}`,
                    backgroundColor: C.goldBg,
                    color: C.gold,
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  자동 추천
                </button>
                <button
                  onClick={handleConflictCheck}
                  style={{
                    padding: "7px 14px",
                    border: `1px solid ${C.border}`,
                    backgroundColor: C.white,
                    color: C.charcoal,
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  충돌 검사
                </button>
              </div>
            </div>
          </div>

          {/* 요약 카드 */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 24,
          }}>
            <div style={{
              padding: 16,
              backgroundColor: C.goldBg,
              border: `1px solid ${C.goldBorder}`,
              borderRadius: 6,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                우선 대상자
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: C.gold }}>
                {priorityEmployees.length}명
              </div>
            </div>
            <div style={{
              padding: 16,
              backgroundColor: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                제외 대상자
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: C.muted }}>
                {excludedEmployees.length}명
              </div>
            </div>
          </div>

          {/* 탭 */}
          <div style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            borderBottom: `1px solid ${C.border}`,
          }}>
            {[
              { key: "priority", label: "우선 대상자" },
              { key: "excluded", label: "제외 대상자" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as typeof selectedTab)}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderBottom: selectedTab === tab.key ? `2px solid ${C.gold}` : "2px solid transparent",
                  backgroundColor: "transparent",
                  color: selectedTab === tab.key ? C.navy : C.muted,
                  fontSize: 13,
                  fontWeight: selectedTab === tab.key ? 600 : 500,
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 검색 */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="직원명, 직급 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                fontSize: 13,
              }}
            />
          </div>

          {/* 직원 목록 */}
          <div style={{
            maxHeight: 300,
            overflow: "auto",
            border: `1px solid ${C.border}`,
            borderRadius: 4,
          }}>
            {currentTabEmployees.map((emp, idx) => {
              const assignment = getEmployeeAssignment(emp.id);
              const hasConflict = emp.hasVacation || emp.hasAnnualLeave || emp.hasSL;

              return (
                <div
                  key={emp.id}
                  style={{
                    padding: "12px 16px",
                    borderBottom: idx < currentTabEmployees.length - 1 ? `1px solid ${C.borderLight}` : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: assignment === selectedTab ? C.goldBg : C.white,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={assignment === selectedTab}
                    onChange={() => toggleEmployeeAssignment(emp.id, selectedTab)}
                    style={{ cursor: "pointer" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: C.text,
                      marginBottom: 2,
                    }}>
                      {emp.name}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {emp.grade}
                    </div>
                  </div>
                  {hasConflict && assignment === "priority" && (
                    <div style={{
                      padding: "4px 8px",
                      backgroundColor: C.riskBg,
                      border: `1px solid ${C.riskBorder}`,
                      borderRadius: 3,
                      fontSize: 10,
                      fontWeight: 600,
                      color: C.risk,
                    }}>
                      충돌
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 32px",
          borderTop: `1px solid ${C.borderLight}`,
          display: "flex",
          gap: 8,
          justifyContent: "flex-end",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              border: `1px solid ${C.border}`,
              backgroundColor: C.white,
              color: C.charcoal,
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "8px 20px",
              border: "none",
              backgroundColor: C.gold,
              color: C.white,
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            저장
          </button>
        </div>
      </div>

      {/* 알림 모달 */}
      <AlertModal
        isOpen={alertOpen}
        message={alertMessage}
        onClose={() => setAlertOpen(false)}
      />
    </div>
  );
}