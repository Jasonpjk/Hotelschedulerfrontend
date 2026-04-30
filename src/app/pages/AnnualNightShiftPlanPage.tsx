import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import MonthlyNightShiftPlanModal from "../components/MonthlyNightShiftPlanModal";
import AnnualPlanHistoryModal from "../components/AnnualPlanHistoryModal";
import AlertModal from "../components/AlertModal";
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
type PlanStatus = "작업 중" | "확정";

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  grade: string;
  role: string;
  primaryShift: string;
}

interface MonthlyPlan {
  month: number;
  requiredCount: number;
  priorityEmployees: string[];
  backupEmployees: string[];
  excludedEmployees: string[];
  conflictCount: number;
  newEntryCount: number;
  continuousFromPrevMonth: number;
}

interface AnnualPlan {
  year: number;
  status: PlanStatus;
  monthlyPlans: MonthlyPlan[];
}

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */
const MOCK_EMPLOYEES: Employee[] = [
  { id: "e1", name: "박지현", employeeId: "E001", grade: "L3", role: "인차지", primaryShift: "오전조" },
  { id: "e2", name: "김태훈", employeeId: "E002", grade: "L2-A", role: "담당", primaryShift: "오전조" },
  { id: "e3", name: "이수진", employeeId: "E003", grade: "L2-C", role: "담당", primaryShift: "오후조" },
  { id: "e4", name: "최민준", employeeId: "E004", grade: "L1-C", role: "담당", primaryShift: "오전조" },
  { id: "e5", name: "정예은", employeeId: "E005", grade: "L1-D", role: "담당", primaryShift: "오후조" },
  { id: "e6", name: "한도현", employeeId: "E006", grade: "L1-C", role: "담당", primaryShift: "오후조" },
  { id: "e7", name: "오세영", employeeId: "E007", grade: "엘크루", role: "담당", primaryShift: "오전조" },
  { id: "e8", name: "강미래", employeeId: "E008", grade: "L1-D", role: "담당", primaryShift: "오후조" },
  { id: "e9", name: "윤재호", employeeId: "E009", grade: "주니어", role: "담당", primaryShift: "오전조" },
  { id: "e10", name: "서하늘", employeeId: "E010", grade: "L2-C", role: "담당", primaryShift: "야간조" },
];

const INITIAL_MONTHLY_PLANS: MonthlyPlan[] = Array.from({ length: 12 }, (_, i) => ({
  month: i + 1,
  requiredCount: 3,
  priorityEmployees: [],
  backupEmployees: [],
  excludedEmployees: [],
  conflictCount: 0,
  newEntryCount: 0,
  continuousFromPrevMonth: 0,
}));

/* ══════════════════════════════════════════════════════════
   MONTH PLAN CARD COMPONENT
══════════════════════════════════════════════════════════ */
interface MonthPlanCardProps {
  plan: MonthlyPlan;
  onClick: () => void;
  employees: Employee[];
}

function MonthPlanCard({ plan, onClick, employees }: MonthPlanCardProps) {
  const plannedCount = plan.priorityEmployees.length;
  const hasConflict = plan.conflictCount > 0;
  const isInsufficient = plannedCount < plan.requiredCount;

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: C.white,
        border: `1px solid ${hasConflict ? C.riskBorder : C.border}`,
        borderRadius: 6,
        padding: 16,
        cursor: "pointer",
        transition: "all 0.15s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.goldBorder;
        e.currentTarget.style.backgroundColor = C.goldBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = hasConflict ? C.riskBorder : C.border;
        e.currentTarget.style.backgroundColor = C.white;
      }}
    >
      {/* 월 표시 */}
      <div style={{
        fontSize: 16,
        fontWeight: 600,
        color: C.navy,
        marginBottom: 12,
        fontFamily: "'Cormorant Garamond', serif",
      }}>
        {plan.month}월
      </div>

      {/* 요약 정보 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        marginBottom: 12,
      }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>
            목표 인원
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
            {plan.requiredCount}명
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>
            계획 인원
          </div>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: isInsufficient ? C.warning : C.ok,
          }}>
            {plannedCount}명
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      <div style={{
        padding: 10,
        backgroundColor: C.bg,
        borderRadius: 4,
        fontSize: 11,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: C.muted }}>우선 대상자</span>
          <span style={{ fontWeight: 600, color: C.navy }}>
            {plan.priorityEmployees.length}명
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: C.muted }}>제외 대상자</span>
          <span style={{ fontWeight: 600, color: C.muted }}>
            {plan.excludedEmployees.length}명
          </span>
        </div>
      </div>

      {/* 경고 배지 */}
      {hasConflict && (
        <div style={{
          position: "absolute",
          top: 12,
          right: 12,
          padding: "4px 8px",
          backgroundColor: C.riskBg,
          border: `1px solid ${C.riskBorder}`,
          borderRadius: 3,
          fontSize: 10,
          fontWeight: 600,
          color: C.risk,
        }}>
          충돌 {plan.conflictCount}건
        </div>
      )}

      {isInsufficient && !hasConflict && (
        <div style={{
          position: "absolute",
          top: 12,
          right: 12,
          padding: "4px 8px",
          backgroundColor: C.warnBg,
          border: `1px solid ${C.warnBorder}`,
          borderRadius: 3,
          fontSize: 10,
          fontWeight: 600,
          color: C.warning,
        }}>
          부족
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function AnnualNightShiftPlanPage() {
  const { showToast } = useToast();
  const [selectedYear, setSelectedYear] = useState(2026);
  const [planStatus, setPlanStatus] = useState<PlanStatus>("작업 중");
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlan[]>(INITIAL_MONTHLY_PLANS);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);

  // 변경 이력 모달
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const handleMonthClick = (month: number) => {
    setSelectedMonth(month);
    setDetailPanelOpen(true);
  };

  const handleSaveMonthlyPlan = (updatedPlan: MonthlyPlan) => {
    setMonthlyPlans(prev =>
      prev.map(p => p.month === updatedPlan.month ? updatedPlan : p)
    );
  };

  const handleFinalize = () => {
    setPlanStatus("확정");
    showToast({ type: "success", title: "확정 완료", message: "연간 야간조 계획이 확정되었습니다." });
  };

  const handleResumeEditing = () => {
    setPlanStatus("작업 중");
    showToast({ type: "info", title: "편집 모드 전환", message: "편집 모드로 전환되었습니다." });
  };

  const handleSave = () => {
    showToast({ type: "success", title: "저장 완료", message: "연간 야간조 계획이 저장되었습니다." });
  };

  const content = (
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: C.bg,
      }}>
        {/* 상단 액션 바 */}
        <div style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.border}`,
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* 연도 선택 */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                padding: "7px 12px",
                fontSize: 12,
                color: C.navy,
                fontWeight: 500,
                backgroundColor: C.white,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value={2025}>2025년</option>
              <option value={2026}>2026년</option>
              <option value={2027}>2027년</option>
            </select>

            {/* 호텔 선택 */}
            <select
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                padding: "7px 12px",
                fontSize: 12,
                color: C.navy,
                fontWeight: 500,
                backgroundColor: C.white,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option>롯데시티호텔 마포</option>
            </select>

            {/* 상태 배지 */}
            <span style={{
              backgroundColor: planStatus === "확정" ? C.okBg : C.warnBg,
              color: planStatus === "확정" ? C.ok : C.warning,
              border: `1px solid ${planStatus === "확정" ? C.okBorder : C.warnBorder}`,
              borderRadius: 3,
              padding: "4px 10px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              {planStatus}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* 액션 버튼 */}
            <button
              onClick={() => setHistoryModalOpen(true)}
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 500,
                color: C.charcoal,
                backgroundColor: C.white,
                cursor: "pointer",
              }}
            >
              변경 이력
            </button>

            {planStatus === "작업 중" && (
              <button
                onClick={handleSave}
                style={{
                  border: `1px solid ${C.ok}`,
                  borderRadius: 3,
                  padding: "7px 18px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.ok,
                  backgroundColor: C.okBg,
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                저장
              </button>
            )}

            {planStatus === "작업 중" ? (
              <button
                onClick={handleFinalize}
                style={{
                  border: "none",
                  borderRadius: 3,
                  padding: "8px 18px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#EAE0CC",
                  backgroundColor: C.navy,
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                확정
              </button>
            ) : (
              <button
                onClick={handleResumeEditing}
                style={{
                  border: "none",
                  borderRadius: 3,
                  padding: "8px 18px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#EAE0CC",
                  backgroundColor: C.navy,
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                편집 재개
              </button>
            )}
          </div>
        </div>

        {/* 본문 */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: 24,
        }}>
          <div style={{
            maxWidth: 1400,
            margin: "0 auto",
          }}>
            {/* 페이지 제목 */}
            <div style={{ marginBottom: 24 }}>
              <h1 style={{
                fontSize: 24,
                fontWeight: 600,
                color: C.navy,
                marginBottom: 8,
                fontFamily: "'Cormorant Garamond', serif",
              }}>
                연간 야간조 대상자 사전 계획
              </h1>
              <p style={{
                fontSize: 14,
                color: C.muted,
                lineHeight: 1.6,
              }}>
                {selectedYear}년도 야간조 대상자를 월별로 사전 계획하고, 휴가·연차와의 충돌을 미리 검토할 수 있습니다.
                <br />
                이 계획은 월별 근무표 자동생성 시 우선적으로 참고되는 기준 데이터입니다.
              </p>
            </div>

            {/* 월별 계획 카드 그리드 */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 16,
            }}>
              {monthlyPlans.map((plan) => (
                <MonthPlanCard
                  key={plan.month}
                  plan={plan}
                  onClick={() => handleMonthClick(plan.month)}
                  employees={MOCK_EMPLOYEES}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 상세 편집 모달 */}
        {selectedMonth && (
          <MonthlyNightShiftPlanModal
            isOpen={detailPanelOpen}
            onClose={() => setDetailPanelOpen(false)}
            year={selectedYear}
            plan={monthlyPlans.find(p => p.month === selectedMonth)!}
            employees={MOCK_EMPLOYEES}
            onSave={handleSaveMonthlyPlan}
          />
        )}

        {/* 알림 모달 */}
        <AlertModal
          isOpen={alertOpen}
          message={alertMessage}
          onClose={() => setAlertOpen(false)}
        />

        {/* 변경 이력 모달 */}
        <AnnualPlanHistoryModal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          year={selectedYear}
          history={[]}
        />
      </div>
  );

  return (
    <AppLayout>
      {content}
    </AppLayout>
  );
}

// Export content for use in SchedulePage tabs
export function AnnualNightShiftPlanContent() {
  const { showToast } = useToast();
  const [selectedYear, setSelectedYear] = useState(2026);
  const [planStatus, setPlanStatus] = useState<PlanStatus>("작업 중");
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlan[]>(INITIAL_MONTHLY_PLANS);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const showAlert = (message: string) => {
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const handleMonthClick = (month: number) => {
    setSelectedMonth(month);
    setDetailPanelOpen(true);
  };

  const handleSaveMonthlyPlan = (updatedPlan: MonthlyPlan) => {
    setMonthlyPlans(prev =>
      prev.map(p => p.month === updatedPlan.month ? updatedPlan : p)
    );
  };

  const handleFinalize = () => {
    setPlanStatus("확정");
    showToast({ type: "success", title: "확정 완료", message: "연간 야간조 계획이 확정되었습니다." });
  };

  const handleResumeEditing = () => {
    setPlanStatus("작업 중");
    showToast({ type: "info", title: "편집 모드 전환", message: "편집 모드로 전환되었습니다." });
  };

  const handleSave = () => {
    showToast({ type: "success", title: "저장 완료", message: "연간 야간조 계획이 저장되었습니다." });
  };

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      backgroundColor: C.bg,
    }}>
      {/* 상단 액션 바 */}
      <div style={{
        backgroundColor: C.white,
        borderBottom: `1px solid ${C.border}`,
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* 연도 선택 */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              padding: "7px 12px",
              fontSize: 12,
              color: C.navy,
              fontWeight: 500,
              backgroundColor: C.white,
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value={2025}>2025년</option>
            <option value={2026}>2026년</option>
            <option value={2027}>2027년</option>
          </select>

          {/* 상태 배지 */}
          <span style={{
            backgroundColor: planStatus === "확정" ? C.okBg : C.warnBg,
            color: planStatus === "확정" ? C.ok : C.warning,
            border: `1px solid ${planStatus === "확정" ? C.okBorder : C.warnBorder}`,
            borderRadius: 3,
            padding: "4px 10px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            {planStatus}
          </span>

          {planStatus === "확정" && (
            <span style={{
              fontSize: 10,
              color: C.muted,
              marginLeft: 8,
            }}>
              이 계획은 확정되어 수정할 수 없습니다
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* 액션 버튼 */}
          <button
            onClick={() => setHistoryModalOpen(true)}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 500,
              color: C.charcoal,
              backgroundColor: C.white,
              cursor: "pointer",
            }}
          >
            변경 이력
          </button>
          <button
            onClick={handleSave}
            disabled={planStatus === "확정"}
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 500,
              color: planStatus === "확정" ? C.muted : C.charcoal,
              backgroundColor: planStatus === "확정" ? C.bg : C.white,
              cursor: planStatus === "확정" ? "not-allowed" : "pointer",
              opacity: planStatus === "확정" ? 0.6 : 1,
            }}
          >
            저장
          </button>

          {planStatus !== "확정" ? (
            <button
              onClick={handleFinalize}
              style={{
                border: "none",
                borderRadius: 3,
                padding: "8px 18px",
                fontSize: 12,
                fontWeight: 600,
                color: "#EAE0CC",
                backgroundColor: C.navy,
                cursor: "pointer",
                letterSpacing: "0.04em",
              }}
            >
              확정
            </button>
          ) : (
            <button
              onClick={handleResumeEditing}
              style={{
                border: "none",
                borderRadius: 3,
                padding: "8px 18px",
                fontSize: 12,
                fontWeight: 600,
                color: "#EAE0CC",
                backgroundColor: C.navy,
                cursor: "pointer",
                letterSpacing: "0.04em",
              }}
            >
              편집 재개
            </button>
          )}
        </div>
      </div>

      {/* 월별 계획 카드 그리드 */}
      <div style={{
        flex: 1,
        overflow: "auto",
        padding: "24px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "16px",
        }}>
          {monthlyPlans.map(plan => (
            <MonthPlanCard
              key={plan.month}
              plan={plan}
              onClick={() => handleMonthClick(plan.month)}
              employees={MOCK_EMPLOYEES}
            />
          ))}
        </div>
      </div>

      {/* 월별 계획 상세 모달 */}
      {selectedMonth !== null && (
        <MonthlyNightShiftPlanModal
          isOpen={detailPanelOpen}
          onClose={() => setDetailPanelOpen(false)}
          month={selectedMonth}
          year={selectedYear}
          plan={monthlyPlans.find(p => p.month === selectedMonth)!}
          employees={MOCK_EMPLOYEES}
          onSave={handleSaveMonthlyPlan}
          isReadOnly={planStatus === "확정"}
        />
      )}

      {/* 변경 이력 모달 */}
      <AnnualPlanHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />

      {/* Alert 모달 */}
      <AlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
      />
    </div>
  );
}