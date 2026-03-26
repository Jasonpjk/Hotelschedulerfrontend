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
  risk:        "#B83232",
  riskBg:      "rgba(184,50,50,0.06)",
  riskBorder:  "rgba(184,50,50,0.22)",
  ok:          "#2E7D52",
  okBg:        "rgba(46,125,82,0.07)",
  okBorder:    "rgba(46,125,82,0.2)",
  warning:     "#B87C1A",
  warnBg:      "rgba(184,124,26,0.08)",
  warnBorder:  "rgba(184,124,26,0.22)",
  satBg:       "#F4F7FD",
  sunBg:       "#FFF4F4",
  rowAlt:      "#FAFAF8",
};

/* ═════════════��════════════════════════════════════════════
   TYPE DEFINITIONS
══════════════════════════════════════════════════════════ */
type ShiftType = "오전조" | "오후조" | "야간조" | "중간조";
type GradeType = "엘크루" | "주니어" | "L1-A" | "L1-C" | "L1-D" | "L2-A" | "L2-C" | "L3" | "L4";
type RoleType = "인차지" | "담당";

interface FrontHistory {
  startDate: string;
  endDate?: string; // 현재 근무 중이면 없음
}

interface Employee {
  id: number;
  name: string;
  grade: GradeType;
  role: RoleType;
  assignedShifts: ShiftType[];
  inchargeShifts: ShiftType[];
  isConfirmed: boolean;
  joinDate: string;
  frontHistories: FrontHistory[];
}

/* ══════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
══════════════════════════════════════════════════════════ */
function calculateTenure(startDate: string): string {
  const start = new Date(startDate);
  const today = new Date();
  
  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (years === 0) return `${months}개월`;
  if (months === 0) return `${years}년`;
  return `${years}년 ${months}개월`;
}

function calculateCurrentFrontTenure(histories: FrontHistory[]): string {
  if (histories.length === 0) return "-";
  
  // 가장 최근 이력 찾기
  const currentHistory = histories.find(h => !h.endDate) || histories[histories.length - 1];
  return calculateTenure(currentHistory.startDate);
}

function calculateTotalFrontExperience(histories: FrontHistory[]): string {
  if (histories.length === 0) return "-";
  
  let totalMonths = 0;
  const today = new Date();
  
  for (const history of histories) {
    const start = new Date(history.startDate);
    const end = history.endDate ? new Date(history.endDate) : today;
    
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months += end.getMonth() - start.getMonth();
    
    totalMonths += months;
  }
  
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  
  if (years === 0) return `${months}개월`;
  if (months === 0) return `${years}년`;
  return `${years}년 ${months}개월`;
}

function getMostRecentStartDate(histories: FrontHistory[]): string {
  if (histories.length === 0) return "-";
  const currentHistory = histories.find(h => !h.endDate) || histories[histories.length - 1];
  return currentHistory.startDate;
}

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */
const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: "김민준",
    grade: "L3",
    role: "인차지",
    assignedShifts: ["오전조", "오후조"],
    inchargeShifts: ["오전조", "오후조"],
    isConfirmed: true,
    joinDate: "2021-03-15",
    frontHistories: [{ startDate: "2021-03-15" }],
  },
  {
    id: 2,
    name: "이서연",
    grade: "L2-A",
    role: "인차지",
    assignedShifts: ["오후조", "야간조"],
    inchargeShifts: ["오후조"],
    isConfirmed: true,
    joinDate: "2020-06-20",
    frontHistories: [
      { startDate: "2020-06-20", endDate: "2022-08-31" },
      { startDate: "2023-02-01" }
    ],
  },
  {
    id: 3,
    name: "박지호",
    grade: "L2-C",
    role: "담당",
    assignedShifts: ["오전조", "야간조"],
    inchargeShifts: [],
    isConfirmed: true,
    joinDate: "2022-01-10",
    frontHistories: [{ startDate: "2022-01-10" }],
  },
  {
    id: 4,
    name: "최유진",
    grade: "L1-C",
    role: "담당",
    assignedShifts: [],
    inchargeShifts: [],
    isConfirmed: false,
    joinDate: "2023-09-01",
    frontHistories: [{ startDate: "2023-09-01" }],
  },
  {
    id: 5,
    name: "정현우",
    grade: "L1-D",
    role: "담당",
    assignedShifts: [],
    inchargeShifts: [],
    isConfirmed: false,
    joinDate: "2024-02-14",
    frontHistories: [{ startDate: "2024-02-14" }],
  },
];

/* ══════════════════════════════════════════════════════════
   BADGE COMPONENT
══════════════════════════════════════════════════════════ */
function Badge({ label, variant }: { label: string; variant: "gold" | "navy" | "muted" | "ok" | "warn" | "shift" }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    gold: { bg: C.goldBg, text: C.gold, border: C.goldBorder },
    navy: { bg: "rgba(13,27,42,0.08)", text: C.navy, border: "rgba(13,27,42,0.15)" },
    muted: { bg: "rgba(123,131,144,0.08)", text: C.muted, border: "rgba(123,131,144,0.15)" },
    ok: { bg: C.okBg, text: C.ok, border: C.okBorder },
    warn: { bg: C.warnBg, text: C.warning, border: C.warnBorder },
    shift: { bg: "rgba(185,155,90,0.06)", text: C.charcoal, border: "rgba(46,54,66,0.12)" },
  };
  const c = colors[variant];
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 9px",
      fontSize: 10,
      fontWeight: 600,
      backgroundColor: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: 3,
      letterSpacing: "0.02em",
      fontFamily: "'Inter', sans-serif",
    }}>
      {label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   SHIFT GROUP BADGE COMPONENT
══════════════════════════════════════════════════════════ */
function ShiftBadge({ shift }: { shift: ShiftType }) {
  const shiftColors: Record<ShiftType, { bg: string; text: string; border: string }> = {
    "오전조": { bg: "#EAF2FB", text: "#1B5990", border: "#B5D0EE" },
    "오후조": { bg: "#EAF4EE", text: "#1B6638", border: "#8FCAA8" },
    "야간조": { bg: "#EEEAF5", text: "#4A3785", border: "#C0ACDF" },
    "중간조": { bg: "#FBF2E6", text: "#7A5518", border: "#DEC07E" },
  };
  const c = shiftColors[shift];
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 9px",
      fontSize: 10,
      fontWeight: 600,
      backgroundColor: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      borderRadius: 3,
      letterSpacing: "0.02em",
      fontFamily: "'Inter', sans-serif",
      marginRight: 4,
      marginBottom: 2,
    }}>
      {shift}
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
  width = 700,
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
   직원 관리/추가 모달
══════════════════════════════════════════════════════════ */
function EmployeeFormModal({
  open,
  onClose,
  employee,
  onSave,
  onDelete,
  isAddMode = false,
}: {
  open: boolean;
  onClose: () => void;
  employee?: Employee;
  onSave: (employeeData: Partial<Employee>) => void;
  onDelete?: (employeeId: number) => void;
  isAddMode?: boolean;
}) {
  const [name, setName] = useState(employee?.name || "");
  const [grade, setGrade] = useState<GradeType>(employee?.grade || "L1-D");
  const [role, setRole] = useState<RoleType>(employee?.role || "담당");
  const [assignedShifts, setAssignedShifts] = useState<ShiftType[]>(employee?.assignedShifts || []);
  const [joinDate, setJoinDate] = useState(employee?.joinDate || "");
  const [frontHistories, setFrontHistories] = useState<FrontHistory[]>(
    employee?.frontHistories || [{ startDate: "" }]
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 모달이 열릴 때 employee 데이터로 state 초기화
  useEffect(() => {
    if (open) {
      setShowDeleteConfirm(false);
      if (isAddMode) {
        setName("");
        setGrade("L1-D");
        setRole("담당");
        setAssignedShifts([]);
        setJoinDate("");
        setFrontHistories([{ startDate: "" }]);
      } else if (employee) {
        setName(employee.name);
        setGrade(employee.grade);
        setRole(employee.role);
        setAssignedShifts(employee.assignedShifts);
        setJoinDate(employee.joinDate);
        setFrontHistories(employee.frontHistories.length > 0 ? employee.frontHistories : [{ startDate: "" }]);
      }
    }
  }, [open, employee, isAddMode]);

  const allShifts: ShiftType[] = ["오전조", "오후조", "야간조", "중간조"];
  const allGrades: GradeType[] = ["엘크루", "주니어", "L1-A", "L1-C", "L1-D", "L2-A", "L2-C", "L3", "L4"];

  const toggleAssignedShift = (shift: ShiftType) => {
    setAssignedShifts(prev =>
      prev.includes(shift)
        ? prev.filter(s => s !== shift)
        : [...prev, shift]
    );
  };

  const addFrontHistory = () => {
    setFrontHistories([...frontHistories, { startDate: "" }]);
  };

  const removeFrontHistory = (index: number) => {
    if (frontHistories.length > 1) {
      setFrontHistories(frontHistories.filter((_, i) => i !== index));
    }
  };

  const updateFrontHistory = (index: number, field: "startDate" | "endDate", value: string) => {
    const updated = [...frontHistories];
    if (field === "endDate") {
      updated[index] = { ...updated[index], endDate: value || undefined };
    } else {
      updated[index] = { ...updated[index], startDate: value };
    }
    setFrontHistories(updated);
  };

  const handleConfirm = () => {
    const employeeData: Partial<Employee> = {
      name,
      grade,
      role,
      assignedShifts,
      joinDate,
      frontHistories: frontHistories.filter(h => h.startDate),
    };

    if (isAddMode) {
      onSave({ ...employeeData, id: Date.now(), isConfirmed: assignedShifts.length > 0, inchargeShifts: [] });
    } else {
      onSave({ ...employeeData, id: employee?.id });
    }
    
    onClose();
  };

  // 자동 계산
  const totalTenure = joinDate ? calculateTenure(joinDate) : "-";
  const currentFrontTenure = calculateCurrentFrontTenure(frontHistories);
  const totalFrontExp = calculateTotalFrontExperience(frontHistories);

  const canSave = name && grade && joinDate && assignedShifts.length > 0 && frontHistories.some(h => h.startDate);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isAddMode ? "직원 추가" : "직원 관리"}
      description={isAddMode ? "신규 직원 정보를 입력합니다." : `${employee?.name} 직원의 역할 및 배치 그룹을 설정합니다.`}
      width={750}
    >
      <div style={{ padding: 24, maxHeight: "calc(90vh - 150px)", overflow: "auto" }}>
        {/* 기본 정보 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            기본 정보
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isAddMode ? "1fr 1fr" : "1fr 1fr", gap: 12 }}>
            {isAddMode && (
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
                  이름 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
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
            )}
            
            {!isAddMode && (
              <div style={{ padding: 12, backgroundColor: C.bg, borderRadius: 4 }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>이름</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{employee?.name}</div>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
                직급 *
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as GradeType)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontSize: 12,
                  fontFamily: "'Inter', sans-serif",
                  backgroundColor: C.white,
                }}
              >
                {allGrades.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 역할 선택 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            역할 선택 *
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <label
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 16px",
                border: `2px solid ${role === "인차지" ? C.gold : C.border}`,
                borderRadius: 4,
                cursor: "pointer",
                backgroundColor: role === "인차지" ? C.goldBg : C.white,
              }}
            >
              <input
                type="radio"
                name="role"
                value="인차지"
                checked={role === "인차지"}
                onChange={(e) => setRole(e.target.value as RoleType)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: role === "인차지" ? "#7A5518" : C.charcoal }}>
                인차지
              </span>
            </label>
            <label
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 16px",
                border: `2px solid ${role === "당" ? C.navy : C.border}`,
                borderRadius: 4,
                cursor: "pointer",
                backgroundColor: role === "담당" ? "rgba(13,27,42,0.04)" : C.white,
              }}
            >
              <input
                type="radio"
                name="role"
                value="담당"
                checked={role === "담당"}
                onChange={(e) => setRole(e.target.value as RoleType)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: role === "담당" ? C.navy : C.charcoal }}>
                담당
              </span>
            </label>
          </div>
        </div>

        {/* 입사일 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            입사 정보
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
                입사일 *
              </label>
              <input
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
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
            <div style={{ padding: 12, backgroundColor: C.bg, borderRadius: 4 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>전체 근속</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoal }}>{totalTenure}</div>
            </div>
          </div>
        </div>

        {/* 프런트 이력 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              프런트 근무 이력 *
            </div>
            <button
              onClick={addFrontHistory}
              style={{
                padding: "5px 12px",
                border: `1px solid ${C.border}`,
                backgroundColor: C.white,
                color: C.charcoal,
                borderRadius: 3,
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              + 추가
            </button>
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 12 }}>
            프런트 근무 기간을 입력합니다. 현재 근무 중이면 종료일을 비워두세요.
          </div>
          
          {frontHistories.map((history, index) => (
            <div key={index} style={{ 
              display: "flex", 
              gap: 10, 
              marginBottom: 10,
              padding: 12,
              backgroundColor: C.bg,
              borderRadius: 4,
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
                  시작일
                </label>
                <input
                  type="date"
                  value={history.startDate}
                  onChange={(e) => updateFrontHistory(index, "startDate", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    fontSize: 11,
                    fontFamily: "'Inter', sans-serif",
                    backgroundColor: C.white,
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 500, color: C.charcoal, marginBottom: 6 }}>
                  종료일 (선택)
                </label>
                <input
                  type="date"
                  value={history.endDate || ""}
                  onChange={(e) => updateFrontHistory(index, "endDate", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    fontSize: 11,
                    fontFamily: "'Inter', sans-serif",
                    backgroundColor: C.white,
                  }}
                />
              </div>
              {frontHistories.length > 1 && (
                <button
                  onClick={() => removeFrontHistory(index)}
                  style={{
                    alignSelf: "flex-end",
                    padding: "7px 10px",
                    border: `1px solid ${C.riskBorder}`,
                    backgroundColor: C.white,
                    color: C.risk,
                    borderRadius: 3,
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* 자동 계산 결과 */}
          <div style={{ 
            marginTop: 16,
            padding: 14, 
            backgroundColor: C.okBg, 
            border: `1px solid ${C.okBorder}`, 
            borderRadius: 4,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.ok, marginBottom: 4 }}>현재 프런트 근속</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{currentFrontTenure}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.ok, marginBottom: 4 }}>누적 프런트 경력</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{totalFrontExp}</div>
            </div>
          </div>
        </div>

        {/* 배치 그룹 설정 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            배치 그룹 선택 *
          </div>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 12 }}>
            실제 근무표에 반영할 배치 그룹을 선택해주세요.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {allShifts.map(shift => {
              const isAssigned = assignedShifts.includes(shift);
              
              return (
                <label
                  key={shift}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 16px",
                    border: `1px solid ${isAssigned ? C.navy : C.border}`,
                    borderRadius: 3,
                    cursor: "pointer",
                    backgroundColor: isAssigned ? "rgba(13,27,42,0.06)" : C.white,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    onChange={() => toggleAssignedShift(shift)}
                    style={{ cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.charcoal }}>
                    {shift}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {assignedShifts.length > 0 && (
          <div style={{
            padding: 14,
            backgroundColor: C.okBg,
            border: `1px solid ${C.okBorder}`,
            borderRadius: 4,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.ok, marginBottom: 6 }}>
              선택된 배치 그룹
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {assignedShifts.map(shift => (
                <ShiftBadge key={shift} shift={shift} />
              ))}
            </div>
          </div>
        )}
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
            border: `1px solid ${C.border}`,
            backgroundColor: C.white,
            color: C.charcoal,
            borderRadius: 3,
            padding: "9px 20px",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          취소
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canSave}
          style={{
            backgroundColor: canSave ? C.navy : C.border,
            color: canSave ? "#EAE0CC" : C.muted,
            border: "none",
            borderRadius: 3,
            padding: "9px 24px",
            fontSize: 12,
            fontWeight: 600,
            cursor: canSave ? "pointer" : "not-allowed",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {isAddMode ? "추가" : "저장"}
        </button>
        {!isAddMode && onDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              backgroundColor: C.risk,
              color: C.white,
              border: "none",
              borderRadius: 3,
              padding: "9px 24px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            삭제
          </button>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <Modal
          open={true}
          onClose={() => setShowDeleteConfirm(false)}
          title="삭제 확인"
          description="해당 직원을 삭제하시겠습니까?"
          width={400}
        >
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
              삭제 후에는 복구할 수 없습니다. 삭제하시겠습니까?
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
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                border: `1px solid ${C.border}`,
                backgroundColor: C.white,
                color: C.charcoal,
                borderRadius: 3,
                padding: "9px 20px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              취소
            </button>
            <button
              onClick={() => onDelete(employee?.id || 0)}
              style={{
                backgroundColor: C.risk,
                color: C.white,
                border: "none",
                borderRadius: 3,
                padding: "9px 24px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              삭제
            </button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   전체 확정 확인 모달
══════════════════════════════════════════════════════════ */
function ConfirmAllModal({
  open,
  onClose,
  onConfirm,
  employeeCount,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employeeCount: number;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="전체 확정"
      description="직원 관리 설정을 근무표 생성 기준으로 반영합니다."
      width={520}
    >
      <div style={{ padding: 24 }}>
        <div style={{
          padding: 16,
          backgroundColor: C.goldBg,
          border: `1px solid ${C.goldBorder}`,
          borderRadius: 4,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#7A5518", marginBottom: 8 }}>
            확정 내용
          </div>
          <div style={{ fontSize: 11, color: C.charcoal, lineHeight: 1.6 }}>
            • 현재 설정된 역할 및 배치 그룹을 근무표 생성 기준으로 반영합니다.<br />
            • 확정 후에는 다음 근무표 생성 시 이 기준이 우선 적용됩니다.<br />
            • 총 {employeeCount}명의 직원 정보가 확정됩니다.
          </div>
        </div>

        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
          확정 후에도 개별 직원 정보는 수정할 수 있으며, 변경사항은 저장 시 즉시 반영됩니다.
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
            border: `1px solid ${C.border}`,
            backgroundColor: C.white,
            color: C.charcoal,
            borderRadius: 3,
            padding: "9px 20px",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          취소
        </button>
        <button
          onClick={onConfirm}
          style={{
            backgroundColor: C.navy,
            color: "#EAE0CC",
            border: "none",
            borderRadius: 3,
            padding: "9px 24px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          전체 확정
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);
  const [isAddMode, setIsAddMode] = useState(false);
  const [allConfirmed, setAllConfirmed] = useState(false);
  const [allConfirmedAt, setAllConfirmedAt] = useState<string | null>(null);
  
  // 필터 상태
  const [filterGrade, setFilterGrade] = useState<GradeType | "전체">("전체");
  const [filterRole, setFilterRole] = useState<RoleType | "전체">("전체");
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddEmployee = () => {
    setIsAddMode(true);
    setEditingEmployee(undefined);
    setFormModalOpen(true);
  };

  const handleManageEmployee = (emp: Employee) => {
    setIsAddMode(false);
    setEditingEmployee(emp);
    setFormModalOpen(true);
  };

  const handleSaveEmployee = (employeeData: Partial<Employee>) => {
    if (isAddMode) {
      setEmployees(prev => [...prev, employeeData as Employee]);
    } else {
      setEmployees(prev =>
        prev.map(emp =>
          emp.id === employeeData.id
            ? { 
                ...emp, 
                ...employeeData, 
                isConfirmed: employeeData.assignedShifts ? employeeData.assignedShifts.length > 0 : emp.isConfirmed 
              }
            : emp
        )
      );
    }
    // 직원 데이터 변경 시 전체 확정 상태 해제
    setAllConfirmed(false);
  };

  const handleDeleteEmployee = (employeeId: number) => {
    setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    setFormModalOpen(false);
    // 직원 삭제 시 전체 확정 상태 해제
    setAllConfirmed(false);
  };

  const handleConfirmAll = () => {
    setAllConfirmed(true);
    setAllConfirmedAt(new Date().toISOString());
    setConfirmModalOpen(false);
  };

  // ��터링
  const filteredEmployees = employees.filter(emp => {
    if (searchTerm && !emp.name.includes(searchTerm)) return false;
    if (filterGrade !== "전체" && emp.grade !== filterGrade) return false;
    if (filterRole !== "전체" && emp.role !== filterRole) return false;
    return true;
  });

  const confirmedCount = filteredEmployees.filter(e => e.isConfirmed).length;
  const hasUnconfirmed = filteredEmployees.some(e => !e.isConfirmed);

  return (
    <AppLayout>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: C.bg }}>
        {/* 상태 배너 */}
        {!allConfirmed && hasUnconfirmed && (
          <div style={{
            backgroundColor: C.warnBg,
            borderBottom: `1px solid ${C.warnBorder}`,
            padding: "12px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: C.warning, fontWeight: 600 }}>⚠</span>
              <span style={{ fontSize: 11.5, color: "#7A5518", fontWeight: 500 }}>
                일부 직원의 배치 그룹이 미설정되어 있습니다. 근무표 생성을 위해 배치 그룹을 설정해주세요.
              </span>
            </div>
          </div>
        )}

        {allConfirmed && (
          <div style={{
            backgroundColor: C.okBg,
            borderBottom: `1px solid ${C.okBorder}`,
            padding: "12px 40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: C.ok, fontWeight: 600 }}>✓</span>
              <span style={{ fontSize: 11.5, color: C.ok, fontWeight: 500 }}>
                근무표 생성 반영 완료 · 모든 직원의 역할 및 배치 그룹이 확정되었습니다.
              </span>
            </div>
            {allConfirmedAt && (
              <span style={{ fontSize: 10, color: C.ok, opacity: 0.7, fontFamily: "'Inter', sans-serif" }}>
                {new Date(allConfirmedAt).toLocaleString('ko-KR', { 
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} 반영
              </span>
            )}
          </div>
        )}

        {/* 헤더 */}
        <div style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.border}`,
          padding: "20px 40px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                프런트 직원 관리
              </h1>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button 
                onClick={handleAddEmployee}
                style={{
                  padding: "9px 20px",
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
                + 직원 추가
              </button>
              <button 
                onClick={() => setConfirmModalOpen(true)}
                disabled={allConfirmed || hasUnconfirmed}
                style={{
                  padding: "9px 24px",
                  backgroundColor: (allConfirmed || hasUnconfirmed) ? C.border : C.navy,
                  color: (allConfirmed || hasUnconfirmed) ? C.muted : "#EAE0CC",
                  border: "none",
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: (allConfirmed || hasUnconfirmed) ? "not-allowed" : "pointer",
                  fontFamily: "'Inter', sans-serif",
                  opacity: (allConfirmed || hasUnconfirmed) ? 0.5 : 1,
                }}
              >
                전체 확정
              </button>
            </div>
          </div>
        </div>

        {/* 필터 영역 */}
        <div style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.border}`,
          padding: "16px 40px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="직원명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "7px 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                fontSize: 11.5,
                width: 200,
                fontFamily: "'Inter', sans-serif",
              }}
            />
            
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value as GradeType | "전체")}
              style={{
                padding: "7px 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                fontSize: 11.5,
                backgroundColor: C.white,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <option value="전체">전체 직급</option>
              <option value="엘크루">엘크루</option>
              <option value="주니어">주니어</option>
              <option value="L1-A">L1-A</option>
              <option value="L1-C">L1-C</option>
              <option value="L1-D">L1-D</option>
              <option value="L2-A">L2-A</option>
              <option value="L2-C">L2-C</option>
              <option value="L3">L3</option>
              <option value="L4">L4</option>
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as RoleType | "전체")}
              style={{
                padding: "7px 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                fontSize: 11.5,
                backgroundColor: C.white,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <option value="전체">전체 역할</option>
              <option value="인차지">인차지</option>
              <option value="담당">담당</option>
            </select>

            <div style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>
              총 {filteredEmployees.length}명 · 확정 {confirmedCount}명
            </div>
          </div>
        </div>

        {/* 직원 목록 테이블 */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 40px" }}>
          <div style={{ 
            backgroundColor: C.white, 
            border: `1px solid ${C.border}`, 
            borderRadius: 4,
            position: "relative",
            overflow: "auto",
            maxHeight: "calc(100vh - 320px)",
          }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1200 }}>
              <thead>
                <tr>
                  <th style={{ 
                    position: "sticky", 
                    left: 0, 
                    top: 0, 
                    zIndex: 100, 
                    padding: "10px 16px", 
                    textAlign: "left", 
                    fontSize: 9.5, 
                    fontWeight: 600, 
                    color: C.muted, 
                    letterSpacing: "0.06em", 
                    textTransform: "uppercase", 
                    borderBottom: `1px solid ${C.border}`, 
                    borderRight: `1px solid ${C.border}`,
                    backgroundColor: "#F7F4EF",
                    boxShadow: "2px 0 4px rgba(0,0,0,0.05)",
                  }}>
                    이름
                  </th>
                  <th style={{ position: "sticky", top: 0, zIndex: 50, padding: "10px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>직급</th>
                  <th style={{ position: "sticky", top: 0, zIndex: 50, padding: "10px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>역할</th>
                  <th style={{ position: "sticky", top: 0, zIndex: 50, padding: "10px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>조 배치</th>
                  <th style={{ position: "sticky", top: 0, zIndex: 50, padding: "10px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>전체 근속</th>
                  <th style={{ position: "sticky", top: 0, zIndex: 50, padding: "10px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>프런트 시작일</th>
                  <th style={{ position: "sticky", top: 0, zIndex: 50, padding: "10px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>현재 프런트 근속</th>
                  <th style={{ position: "sticky", top: 0, zIndex: 50, padding: "10px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>누적 프런트 경력</th>
                  <th style={{ position: "sticky", top: 0, zIndex: 50, padding: "10px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>상태</th>
                  <th style={{ position: "sticky", top: 0, zIndex: 50, padding: "10px 16px", textAlign: "center", fontSize: 9.5, fontWeight: 600, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, backgroundColor: "#F7F4EF" }}>설정</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, i) => {
                  const rowBg = i % 2 === 1 ? C.rowAlt : C.white;
                  const totalTenure = calculateTenure(emp.joinDate);
                  const currentFrontTenure = calculateCurrentFrontTenure(emp.frontHistories);
                  const totalFrontExp = calculateTotalFrontExperience(emp.frontHistories);
                  const recentStartDate = getMostRecentStartDate(emp.frontHistories);
                  
                  return (
                    <tr key={emp.id}>
                      <td style={{ 
                        position: "sticky", 
                        left: 0, 
                        zIndex: 10, 
                        padding: "11px 16px", 
                        borderBottom: `1px solid ${C.borderLight}`, 
                        borderRight: `1px solid ${C.border}`,
                        fontSize: 12, 
                        fontWeight: 600, 
                        color: C.navy,
                        backgroundColor: rowBg,
                        boxShadow: "2px 0 4px rgba(0,0,0,0.05)",
                      }}>
                        {emp.name}
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                        <Badge label={emp.grade} variant="muted" />
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                        <Badge label={emp.role} variant={emp.role === "인차지" ? "gold" : "navy"} />
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                        {emp.assignedShifts.map(shift => (
                          <ShiftBadge key={shift} shift={shift} />
                        ))}
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11.5, textAlign: "center", color: C.charcoal, fontWeight: 600, backgroundColor: rowBg }}>
                        {totalTenure}
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11, textAlign: "center", color: C.muted, fontFamily: "'Inter', sans-serif", backgroundColor: rowBg }}>
                        {recentStartDate}
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 11.5, textAlign: "center", color: C.charcoal, fontWeight: 600, backgroundColor: rowBg }}>
                        {currentFrontTenure}
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: `1px solid ${C.borderLight}`, fontSize: 12, textAlign: "center", color: C.navy, fontWeight: 600, backgroundColor: rowBg }}>
                        {totalFrontExp}
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                        {emp.isConfirmed ? (
                          <Badge label="확정" variant="ok" />
                        ) : (
                          <Badge label="미설정" variant="warn" />
                        )}
                      </td>
                      <td style={{ padding: "11px 16px", borderBottom: `1px solid ${C.borderLight}`, textAlign: "center", backgroundColor: rowBg }}>
                        <button
                          onClick={() => handleManageEmployee(emp)}
                          style={{
                            padding: "6px 16px",
                            border: "none",
                            backgroundColor: C.navy,
                            color: "#EAE0CC",
                            borderRadius: 3,
                            cursor: "pointer",
                            fontSize: 10.5,
                            fontWeight: 600,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          설정
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredEmployees.length === 0 && (
              <div style={{
                padding: "60px 20px",
                textAlign: "center",
                color: C.muted,
                fontSize: 13,
              }}>
                해당하는 직원이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      <EmployeeFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        employee={editingEmployee}
        onSave={handleSaveEmployee}
        onDelete={handleDeleteEmployee}
        isAddMode={isAddMode}
      />

      <ConfirmAllModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmAll}
        employeeCount={filteredEmployees.length}
      />
    </AppLayout>
  );
}