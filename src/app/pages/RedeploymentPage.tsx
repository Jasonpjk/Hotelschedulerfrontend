import { useState, useRef, type ReactNode, type CSSProperties } from "react";
import AppLayout from "../components/layout/AppLayout";
import { useToast } from "../context/ToastContext";
import { useAppContext } from "../context/AppContext";
import { MonthlyScheduleGrid, type ProtCellState } from "../components/MonthlyScheduleGrid";
import {
  EMPLOYEES, SCHEDULE_DATA, NAME_TO_ID, MAY_2026_CAL,
} from "../data/scheduleData";
import {
  Upload, Lock, Shield, RefreshCw, CheckCircle,
  Loader, Moon, AlertTriangle, ChevronDown, ChevronUp, X,
  Calendar, LayoutGrid, Info, ChevronRight,
} from "lucide-react";

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
   TYPES
══════════════════════════════════════════════════════════ */
type RegenBasis = "forecast" | "other";
type NightShiftMode = "auto" | "manual";
type ProtLevel = "absolute" | "priority";
type ShiftCode =
  | "M07" | "A13" | "N22"
  | "C08" | "C09" | "C10" | "C11"
  | "REQ" | "OFF" | "HOL" | "VAC" | "SL" | "EDU" | "SICK";
type StepStatus = "pending" | "active" | "done";
type PageStatus = "설정 전" | "분석 완료" | "미리보기 완료" | "저장 완료";

interface SelectedProtCell {
  empId: string; empName: string;
  day: number;   code: ShiftCode;
  level: ProtLevel;
}
interface RegenResult {
  versionName: string;
  changeCount: number;
  changes: { employee: string; date: string; from: ShiftCode; to: ShiftCode }[];
  absoluteProtected: number;
  priorityProtected: number;
  priorityChanged: number;
  nightShiftChanged: boolean;
  nightShiftChanges: string[];
  warnings: string[];
}

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */
const SHIFT_META: Record<ShiftCode, { bg: string; text: string; border: string; name: string }> = {
  M07:  { bg: "#EAF2FB", text: "#1B5990", border: "#B5D0EE", name: "오전조" },
  A13:  { bg: "#EAF4EE", text: "#1B6638", border: "#8FCAA8", name: "오후조" },
  N22:  { bg: "#EEEAF5", text: "#4A3785", border: "#C0ACDF", name: "야간조" },
  C08:  { bg: "#FBF2E6", text: "#7A5518", border: "#DEC07E", name: "중간조" },
  C09:  { bg: "#FBF2E6", text: "#7A5518", border: "#DEC07E", name: "중간조" },
  C10:  { bg: "#FBF4E8", text: "#7A5518", border: "#E0C48A", name: "중간조" },
  C11:  { bg: "#FBF4E8", text: "#7A5518", border: "#E0C48A", name: "중간조" },
  REQ:  { bg: "#FDE7F0", text: "#8B1A4A", border: "#EEA0BF", name: "신청 휴일" },
  OFF:  { bg: "#F0F2F4", text: "#5E6673", border: "#CDD2D8", name: "일반 휴무" },
  HOL:  { bg: "#FDF2DC", text: "#7A5800", border: "#E6C04A", name: "공휴일" },
  VAC:  { bg: "#E6F4EF", text: "#18664A", border: "#88CCAE", name: "휴가" },
  SL:   { bg: "#F0E8F5", text: "#662288", border: "#C8A0E2", name: "여성보건휴가" },
  EDU:  { bg: "#E8F3FA", text: "#1A5A8A", border: "#A8CEE8", name: "교육" },
  SICK: { bg: "#FFF0E6", text: "#CC5500", border: "#FFB380", name: "병가" },
};

// MOCK_EMPLOYEES_GRID → 공유 EMPLOYEES (scheduleData.ts) 사용
// MOCK_GRID_SCHEDULE  → 공유 SCHEDULE_DATA (scheduleData.ts) 사용

// display: 목록 표시용 간략 사유 / detail: tooltip 전용 세부 내용
const AUTO_ABSOLUTE = [
  { empName: "최유진", date: "05-01 ~ 05-14", code: "OFF"  as ShiftCode, display: "신혼여행",                   detail: "인사팀 확인 완료" },
  { empName: "박지호",  date: "04-29 ~ 05-31", code: "SICK" as ShiftCode, display: "장기 병가",                   detail: "진단서 제출 완료" },
  { empName: "이수진",  date: "05-06",          code: "EDU"  as ShiftCode, display: "승인된 교육",               detail: "" },
  { empName: "정예은",  date: "05-09",          code: "REQ"  as ShiftCode, display: "승인 안내 발송된 휴일 신청", detail: "" },
];
const AUTO_PRIORITY = [
  { empName: "이수진", date: "05-03",          code: "SL"  as ShiftCode, display: "SL",  detail: "여성보건휴가" },
  { empName: "강미래", date: "05-14 ~ 05-15", code: "VAC" as ShiftCode, display: "연차", detail: "" },
  { empName: "박지현", date: "05-19 ~ 05-20", code: "VAC" as ShiftCode, display: "연차", detail: "" },
];

// 이름 → empId 매핑 → 공유 NAME_TO_ID (scheduleData.ts) 사용

// "05-06" → [6]  /  "05-14~05-15" → [14,15]  /  "04-29~05-31" → [1..31]
function parseDayRange(dateStr: string): number[] {
  if (!dateStr.includes("~")) {
    const parts = dateStr.split("-");
    return [parseInt(parts[parts.length - 1])];
  }
  const [s, e] = dateStr.split("~").map(t => t.trim());
  const sp = s.split("-"); const ep = e.split("-");
  const sm = parseInt(sp[sp.length - 2]); const sd = parseInt(sp[sp.length - 1]);
  const em = parseInt(ep[ep.length - 2]); const ed = parseInt(ep[ep.length - 1]);
  const days: number[] = [];
  if (sm === 5 && em === 5) { for (let d = sd; d <= ed; d++) days.push(d); }
  else if (sm < 5 && em === 5) { for (let d = 1; d <= ed; d++) days.push(d); }
  return days;
}

// buildAutoCellMap 함수 제거됨 — 통합 ProtCell 맵으로 대체

/* ══════════════════════════════════════════════════════════
   SMALL COMPONENTS
══════════════════════════════════════════════════════════ */
function Btn({
  onClick, children, variant = "primary", disabled = false,
}: {
  onClick?: () => void; children: ReactNode;
  variant?: "primary" | "outline" | "gold" | "risk" | "ok";
  disabled?: boolean;
}) {
  const vs: Record<string, CSSProperties> = {
    primary: { backgroundColor: C.navy,  color: "#EAE0CC", border: "none" },
    outline: { backgroundColor: "transparent", color: C.charcoal, border: `1px solid ${C.border}` },
    gold:    { backgroundColor: C.gold,  color: C.white,   border: "none" },
    risk:    { backgroundColor: C.risk,  color: C.white,   border: "none" },
    ok:      { backgroundColor: C.ok,    color: C.white,   border: "none" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...vs[variant],
        padding: "8px 18px", borderRadius: 5, fontSize: 12.5, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        display: "inline-flex", alignItems: "center", gap: 5, transition: "all 0.15s",
        fontFamily: "'Inter', sans-serif",
      }}
    >{children}</button>
  );
}

function ShiftChip({ code, small }: { code: ShiftCode; small?: boolean }) {
  const m = SHIFT_META[code];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: small ? "1px 5px" : "2px 8px",
      fontSize: small ? 9 : 10.5, fontWeight: 600,
      backgroundColor: m.bg, color: m.text, border: `1px solid ${m.border}`, borderRadius: 3,
      fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap",
    }}>{code}</span>
  );
}

function Tag({ children, color, bg, border }: { children: ReactNode; color: string; bg: string; border: string }) {
  return (
    <span style={{ padding: "2px 8px", borderRadius: 3, fontSize: 11, fontWeight: 600, color, backgroundColor: bg, border: `1px solid ${border}` }}>
      {children}
    </span>
  );
}

const inputSt: CSSProperties = {
  width: "100%", padding: "7px 11px",
  border: `1px solid ${C.border}`, borderRadius: 4,
  fontSize: 13, color: C.text, backgroundColor: C.white, outline: "none",
};

/* ══════════════════════════════════════════════════════════
   WIZARD STEP CARD
══════════════════════════════════════════════════════════ */
function WizardStep({
  num, title, status, summary, isOpen, onToggle, children,
}: {
  num: number; title: string; status: StepStatus;
  summary?: string; isOpen: boolean; onToggle: () => void;
  children: ReactNode;
}) {
  const dotColor =
    status === "done"   ? C.ok :
    status === "active" ? C.gold : C.muted;
  const dotBg =
    status === "done"   ? C.ok :
    status === "active" ? C.gold : "#CDD2D8";

  const borderColor =
    status === "active" ? C.gold :
    status === "done"   ? C.okBorder : C.border;

  return (
    <div style={{
      backgroundColor: C.white,
      border: `1.5px solid ${borderColor}`,
      borderRadius: 8, overflow: "hidden",
      transition: "border-color 0.2s",
      boxShadow: status === "active" ? "0 2px 12px rgba(185,155,90,0.10)" : "none",
    }}>
      {/* 헤더 */}
      <button
        onClick={status === "pending" ? undefined : onToggle}
        style={{
          width: "100%", padding: "14px 20px",
          display: "flex", alignItems: "center", gap: 12,
          background: status === "active" ? C.goldBg : status === "done" ? C.okBg : C.rowAlt,
          border: "none", cursor: status === "pending" ? "default" : "pointer",
          borderBottom: isOpen ? `1px solid ${C.borderLight}` : "none",
          transition: "background 0.2s",
        }}
      >
        {/* 번호 or 완료 아이콘 */}
        <div style={{
          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
          backgroundColor: dotBg,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {status === "done"
            ? <CheckCircle size={14} color={C.white} />
            : <span style={{ fontSize: 12, fontWeight: 700, color: status === "active" ? C.navyDeep : C.white }}>{num}</span>
          }
        </div>

        {/* 제목 + 요약 */}
        <div style={{ flex: 1, textAlign: "left" }}>
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: status === "pending" ? C.muted : status === "active" ? "#7A5518" : C.charcoal,
          }}>{title}</span>
          {!isOpen && summary && (
            <span style={{ marginLeft: 10, fontSize: 11.5, color: status === "done" ? C.ok : C.muted }}>
              {status === "done" && "✓ "}{summary}
            </span>
          )}
          {status === "pending" && (
            <span style={{ marginLeft: 10, fontSize: 11, color: C.muted }}>이전 단계 완료 후 활성화</span>
          )}
        </div>

        {/* 열기/닫기 */}
        {status !== "pending" && (
          isOpen
            ? <ChevronUp size={15} color={C.muted} />
            : <ChevronDown size={15} color={C.muted} />
        )}
      </button>

      {/* 내용 */}
      {isOpen && (
        <div style={{ padding: "20px 24px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   SCHEDULE SELECTION MODAL  (통합 보호 상태 관리)
══════════════════════════════════════════════════════════ */

// 모달 내부 통합 셀 타입
interface ProtCell {
  empId: string; empName: string; day: number; code: ShiftCode;
  level: ProtLevel;
  source: "auto-absolute" | "auto-priority" | "manual";
  status: "active" | "pending-remove";
  display: string; detail: string;
  sidebarKey: string; // "abs_N" | "pri_N" | "manual"
}

type ModalConfirm =
  | { type: "deselect-cell";    cellKey: string; isStrong: boolean }
  | { type: "deselect-sidebar"; sidebarKey: string; isStrong: boolean; cellKeys: string[] }
  | { type: "level_change";     cellKey: string; fromLevel: ProtLevel; toLevel: ProtLevel };

function ScheduleSelectModal({
  onClose, onSave, baselineDate, existingManualCells,
}: {
  onClose: () => void;
  onSave: (activeCells: SelectedProtCell[], removedSidebarKeys: string[]) => void;
  baselineDate: string;
  existingManualCells: SelectedProtCell[];
}) {
  const DOW = ["일","월","화","수","목","금","토"];
  const getDow = (day: number) => DOW[(day + 4) % 7];
  const baseDay = parseInt(baselineDate.split("-")[2] || "1");
  const cKey = (empId: string, day: number) => `${empId}_${day}`;

  // ── 통합 셀 맵 초기화 (자동 절대 + 자동 우선 + 기존 수동) ─────────────────
  const initCells = (): Map<string, ProtCell> => {
    const m = new Map<string, ProtCell>();
    AUTO_ABSOLUTE.forEach((item, idx) => {
      const empId = NAME_TO_ID[item.empName]; if (!empId) return;
      parseDayRange(item.date).forEach(day => {
        if (day < 1 || day > 31) return;
        const k = cKey(empId, day);
        m.set(k, { empId, empName: item.empName, day, code: SCHEDULE_DATA[empId]?.[day-1] ?? item.code,
          level: "absolute", source: "auto-absolute", status: "active",
          display: item.display, detail: item.detail, sidebarKey: `abs_${idx}` });
      });
    });
    AUTO_PRIORITY.forEach((item, idx) => {
      const empId = NAME_TO_ID[item.empName]; if (!empId) return;
      parseDayRange(item.date).forEach(day => {
        if (day < 1 || day > 31) return;
        const k = cKey(empId, day);
        if (!m.has(k)) m.set(k, { empId, empName: item.empName, day, code: SCHEDULE_DATA[empId]?.[day-1] ?? item.code,
          level: "priority", source: "auto-priority", status: "active",
          display: item.display, detail: item.detail, sidebarKey: `pri_${idx}` });
      });
    });
    existingManualCells.forEach(c => {
      const k = cKey(c.empId, c.day);
      if (!m.has(k)) m.set(k, { empId: c.empId, empName: c.empName, day: c.day, code: c.code,
        level: c.level, source: "manual", status: "active", display: "", detail: "", sidebarKey: "manual" });
    });
    return m;
  };

  const [cells, setCells] = useState<Map<string, ProtCell>>(initCells);
  const [pendingLevel, setPendingLevel] = useState<ProtLevel>("priority");
  const [confirm, setConfirm] = useState<ModalConfirm | null>(null);
  // 그리드에 없는 사이드바 전용 항목 해제 추적
  const [removedSidebarOnly, setRemovedSidebarOnly] = useState<Set<string>>(new Set());

  const allCells = Array.from(cells.values());
  const activeAbs = allCells.filter(c => c.status === "active" && c.level === "absolute").length;
  const activePri = allCells.filter(c => c.status === "active" && c.level === "priority").length;
  const pendingRemoveCount = allCells.filter(c => c.status === "pending-remove").length + removedSidebarOnly.size;

  const cellKeysForSidebar = (sk: string) =>
    Array.from(cells.entries()).filter(([, v]) => v.sidebarKey === sk).map(([k]) => k);

  const sidebarItemStatus = (sk: string): "active" | "pending-remove" => {
    if (removedSidebarOnly.has(sk)) return "pending-remove";
    const keys = cellKeysForSidebar(sk);
    if (keys.length === 0) return "active";
    return keys.every(k => cells.get(k)?.status === "pending-remove") ? "pending-remove" : "active";
  };

  const reactivateCell = (k: string) => {
    setCells(prev => { const n = new Map(prev); const c = n.get(k); if (c) n.set(k, { ...c, status: "active" }); return n; });
  };

  // 그리드 셀 클릭: 기존 보호 셀도 해제/변경 가능
  const handleCellClick = (empId: string, empName: string, day: number, code: ShiftCode, isDisabled: boolean) => {
    if (isDisabled) return;
    const k = cKey(empId, day);
    const cell = cells.get(k);
    if (cell) {
      if (cell.status === "pending-remove") {
        // 해제 예정 → 재활성화 (확인 없이)
        reactivateCell(k);
        if (cell.sidebarKey !== "manual") setRemovedSidebarOnly(prev => { const n = new Set(prev); n.delete(cell.sidebarKey); return n; });
        return;
      }
      if (cell.source === "auto-absolute") {
        setConfirm({ type: "deselect-cell", cellKey: k, isStrong: true });
      } else if (cell.level === pendingLevel) {
        setConfirm({ type: "deselect-cell", cellKey: k, isStrong: false });
      } else {
        setConfirm({ type: "level_change", cellKey: k, fromLevel: cell.level, toLevel: pendingLevel });
      }
    } else {
      setCells(prev => { const n = new Map(prev);
        n.set(k, { empId, empName, day, code, level: pendingLevel, source: "manual", status: "active", display: "", detail: "", sidebarKey: "manual" });
        return n; });
    }
  };

  const handleSidebarRelease = (sidebarKey: string, isAutoAbsolute: boolean) => {
    setConfirm({ type: "deselect-sidebar", sidebarKey, isStrong: isAutoAbsolute, cellKeys: cellKeysForSidebar(sidebarKey) });
  };

  const applyConfirm = () => {
    if (!confirm) return;
    if (confirm.type === "deselect-cell") {
      setCells(prev => { const n = new Map(prev); const c = n.get(confirm.cellKey);
        if (c) n.set(confirm.cellKey, { ...c, status: "pending-remove" }); return n; });
    } else if (confirm.type === "deselect-sidebar") {
      if (confirm.cellKeys.length > 0) {
        setCells(prev => { const n = new Map(prev);
          confirm.cellKeys.forEach(k => { const c = n.get(k); if (c) n.set(k, { ...c, status: "pending-remove" }); });
          return n; });
      } else {
        setRemovedSidebarOnly(prev => new Set([...prev, confirm.sidebarKey]));
      }
    } else if (confirm.type === "level_change") {
      setCells(prev => { const n = new Map(prev); const c = n.get(confirm.cellKey);
        if (c) n.set(confirm.cellKey, { ...c, level: confirm.toLevel }); return n; });
    }
    setConfirm(null);
  };

  const confirmText = (() => {
    if (!confirm) return null;
    if (confirm.type === "deselect-cell" || confirm.type === "deselect-sidebar") {
      if (confirm.isStrong) return {
        title: "자동 보호 일정 해제",
        body: "이 일정은 승인 또는 안내가 완료되어 자동 절대 보호로 설정된 일정입니다.\n보호를 해제하면 직원에게 이미 안내된 일정이 변경될 수 있습니다.\n정말 보호를 해제하시겠습니까?",
        confirmLabel: "강제로 보호 해제", cancelLabel: "유지", confirmVariant: "risk" as const,
      };
      return {
        title: "보호 일정 해제",
        body: "이 일정은 현재 보호 일정으로 등록되어 있습니다.\n보호를 해제하면 스케줄 재생성 시 변경 대상이 될 수 있습니다.\n보호 설정을 해제하시겠습니까?",
        confirmLabel: "보호 해제", cancelLabel: "유지", confirmVariant: "risk" as const,
      };
    }
    if (confirm.fromLevel === "absolute" && confirm.toLevel === "priority") return {
      title: "보호 수준 변경",
      body: "이 일정은 현재 절대 보호로 설정되어 있습니다.\n우선 보호로 변경하면 스케줄 재생성 시 관리자 확인 후 변경될 수 있습니다.\n보호 수준을 우선 보호로 변경하시겠습니까?",
      confirmLabel: "우선 보호로 변경", cancelLabel: "절대 보호 유지", confirmVariant: "gold" as const,
    };
    return {
      title: "보호 수준 변경",
      body: "이 일정은 현재 우선 보호로 설정되어 있습니다.\n절대 보호로 변경하면 스케줄 재생성 시 자동 변경 대상에서 제외됩니다.\n절대 보호로 변경하시겠습니까?",
      confirmLabel: "절대 보호로 변경", cancelLabel: "우선 보호 유지", confirmVariant: "risk" as const,
    };
  })();

  const handleSave = () => {
    const activeCells: SelectedProtCell[] = allCells
      .filter(c => c.status === "active" && c.source === "manual")
      .map(c => ({ empId: c.empId, empName: c.empName, day: c.day, code: c.code, level: c.level }));
    const removedSidebarKeys: string[] = [
      ...allCells.filter(c => c.status === "pending-remove").map(c => c.sidebarKey),
      ...Array.from(removedSidebarOnly),
    ].filter((v, i, a) => v !== "manual" && a.indexOf(v) === i);
    onSave(activeCells, removedSidebarKeys);
  };

  // 사이드바 섹션
  function SideSection({ title, activeCount, color, bg, children }: { title: string; activeCount: number; color: string; bg: string; children: ReactNode; }) {
    const [open, setOpen] = useState(true);
    return (
      <div style={{ borderBottom: `1px solid ${C.borderLight}` }}>
        <button onClick={() => setOpen(v => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: bg, border: "none", cursor: "pointer" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.03em" }}>{title} <span style={{ fontWeight: 400, opacity: 0.8 }}>({Math.max(0, activeCount)}건)</span></span>
          {open ? <ChevronUp size={12} color={color} /> : <ChevronDown size={12} color={color} />}
        </button>
        {open && <div style={{ padding: "4px 0" }}>{children}</div>}
      </div>
    );
  }

  // 사이드바 항목
  function SideItem({ item, sidebarKey, isAutoAbsolute, idx, total }: {
    item: { empName: string; date: string; code: ShiftCode; display: string; detail: string };
    sidebarKey: string; isAutoAbsolute: boolean; idx: number; total: number;
  }) {
    const isRemoved = sidebarItemStatus(sidebarKey) === "pending-remove";
    const reactivateSidebar = () => {
      const gridKeys = cellKeysForSidebar(sidebarKey);
      if (gridKeys.length > 0) gridKeys.forEach(reactivateCell);
      else setRemovedSidebarOnly(prev => { const n = new Set(prev); n.delete(sidebarKey); return n; });
    };
    return (
      <div style={{
        padding: "8px 10px 8px 14px",
        display: "flex", alignItems: "flex-start", gap: 7,
        borderBottom: idx < total - 1 ? `1px solid ${C.borderLight}` : "none",
        backgroundColor: isRemoved ? "rgba(184,50,50,0.08)" : "transparent",
        borderLeft: isRemoved ? "3px solid rgba(184,50,50,0.55)" : "3px solid transparent",
        transition: "background 0.15s",
      }}>
        <div style={{ flexShrink: 0, marginTop: 1 }}><ShiftChip code={item.code} small /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: isRemoved ? C.risk : C.charcoal }}>{item.empName}</span>
            {isRemoved && (
              <span style={{
                fontSize: 9.5, fontWeight: 700, letterSpacing: "0.04em",
                color: C.risk, backgroundColor: "rgba(184,50,50,0.12)",
                border: "1px solid rgba(184,50,50,0.3)", borderRadius: 3,
                padding: "1px 5px",
              }}>해제 예정</span>
            )}
          </div>
          <div style={{ fontSize: 10.5, color: C.muted }}>{item.date}</div>
          <div style={{ fontSize: 10.5, color: isAutoAbsolute ? C.risk : "#7A5518" }}>
            <span title={item.detail || undefined}>{item.display}{item.detail ? " ℹ" : ""}</span>
          </div>
        </div>
        <button
          onClick={() => isRemoved ? reactivateSidebar() : handleSidebarRelease(sidebarKey, isAutoAbsolute)}
          title={isRemoved ? "해제 취소 — 기존 보호 상태로 복구" : "보호 해제"}
          style={{
            flexShrink: 0, cursor: "pointer", padding: "3px 7px",
            display: "flex", alignItems: "center", gap: 4,
            background: isRemoved ? "rgba(46,125,82,0.09)" : "none",
            border: isRemoved ? "1px solid rgba(46,125,82,0.3)" : "none",
            borderRadius: 3, color: isRemoved ? C.ok : C.muted, marginTop: 2,
            fontSize: 10, fontWeight: 600, fontFamily: "'Inter', sans-serif",
            transition: "all 0.12s",
          }}
        >
          {isRemoved ? <><CheckCircle size={10} />&nbsp;해제 취소</> : <X size={11} />}
        </button>
      </div>
    );
  }

  const manualCells = allCells.filter(c => c.source === "manual");
  const autoAbsActiveCount = AUTO_ABSOLUTE.length
    - Array.from(removedSidebarOnly).filter(k => k.startsWith("abs_")).length
    - allCells.filter(c => c.source === "auto-absolute" && c.status === "pending-remove").length;
  const autoPriActiveCount = AUTO_PRIORITY.length
    - Array.from(removedSidebarOnly).filter(k => k.startsWith("pri_")).length
    - allCells.filter(c => c.source === "auto-priority" && c.status === "pending-remove").length;

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
      <div style={{ backgroundColor: C.white, borderRadius: 10, width: "96vw", maxWidth: 1400, maxHeight: "93vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>

        {/* 헤더 */}
        <div style={{ padding: "14px 22px", borderBottom: `1px solid ${C.border}`, backgroundColor: C.rowAlt, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 600, color: C.navy }}>근무표에서 보호 일정 선택</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              2026년 5월 (1~31일) · 변경 기준일 <strong>{baselineDate}</strong> 이전 셀 잠금 · 모든 보호 셀 클릭하여 해제/변경 가능
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}><X size={20} /></button>
        </div>

        {/* 툴바 */}
        <div style={{ padding: "8px 22px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", gap: 10, backgroundColor: "#FAFAF8", flexShrink: 0, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: C.charcoal }}>추가 선택 시 보호 수준:</span>
          {([
            { level: "absolute" as ProtLevel, label: "🔒 절대 보호", color: C.risk,    bg: C.riskBg,  bd: C.riskBorder },
            { level: "priority" as ProtLevel, label: "🛡 우선 보호",  color: "#7A5518", bg: C.goldBg,  bd: C.goldBorder },
          ]).map(o => (
            <button key={o.level} onClick={() => setPendingLevel(o.level)} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 13px", borderRadius: 4, fontSize: 11.5, fontWeight: pendingLevel === o.level ? 700 : 500, cursor: "pointer", backgroundColor: pendingLevel === o.level ? o.bg : "transparent", border: `${pendingLevel === o.level ? 2 : 1}px solid ${pendingLevel === o.level ? o.bd : C.border}`, color: pendingLevel === o.level ? o.color : C.muted, transition: "all 0.12s" }}>
              {o.label}
              {pendingLevel === o.level && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 2, backgroundColor: o.color, color: "#fff", marginLeft: 2 }}>선택 중</span>}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            {activeAbs > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: C.risk, backgroundColor: C.riskBg, border: `1px solid ${C.riskBorder}`, padding: "2px 8px", borderRadius: 3 }}>🔒 절대 {activeAbs}건</span>}
            {activePri > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: "#7A5518", backgroundColor: C.goldBg, border: `1px solid ${C.goldBorder}`, padding: "2px 8px", borderRadius: 3 }}>🛡 우선 {activePri}건</span>}
            {pendingRemoveCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: C.risk, backgroundColor: "rgba(184,50,50,0.10)", border: "1.5px dashed rgba(184,50,50,0.45)", padding: "2px 9px", borderRadius: 3 }}>
                ✕ 해제 예정 {pendingRemoveCount}건
              </span>
            )}
          </div>
        </div>

        {/* 본문 */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
          {/* 좌측 사이드바 */}
          <div style={{ width: 264, flexShrink: 0, borderRight: `1px solid ${C.border}`, overflowY: "auto", backgroundColor: "#FAFAF8" }}>
            <SideSection title="자동 절대 보호" activeCount={autoAbsActiveCount} color={C.risk} bg={C.riskBg}>
              {AUTO_ABSOLUTE.map((item, i) => <SideItem key={i} item={item} sidebarKey={`abs_${i}`} isAutoAbsolute={true} idx={i} total={AUTO_ABSOLUTE.length} />)}
            </SideSection>
            <SideSection title="자동 우선 보호" activeCount={autoPriActiveCount} color="#7A5518" bg={C.goldBg}>
              {AUTO_PRIORITY.map((item, i) => <SideItem key={i} item={item} sidebarKey={`pri_${i}`} isAutoAbsolute={false} idx={i} total={AUTO_PRIORITY.length} />)}
            </SideSection>
            <SideSection title="수동 선택 보호" activeCount={manualCells.filter(c => c.status === "active").length} color={C.charcoal} bg={C.rowAlt}>
              {manualCells.length === 0
                ? <div style={{ padding: "10px 14px", fontSize: 11, color: C.muted, fontStyle: "italic" }}>근무표에서 셀을 클릭하여 추가하세요</div>
                : manualCells.map((cell, i) => {
                    const isRemoved = cell.status === "pending-remove";
                    const k = cKey(cell.empId, cell.day);
                    return (
                      <div key={i} style={{
                        padding: "7px 10px 7px 14px",
                        display: "flex", alignItems: "center", gap: 6,
                        borderBottom: i < manualCells.length - 1 ? `1px solid ${C.borderLight}` : "none",
                        backgroundColor: isRemoved ? "rgba(184,50,50,0.08)" : cell.level === "absolute" ? "rgba(184,50,50,0.04)" : "rgba(185,155,90,0.05)",
                        borderLeft: isRemoved ? "3px solid rgba(184,50,50,0.55)" : "3px solid transparent",
                        transition: "background 0.15s",
                      }}>
                        <div style={{ flexShrink: 0 }}><ShiftChip code={cell.code} small /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: isRemoved ? C.risk : C.charcoal }}>{cell.empName}</span>
                            {isRemoved && (
                              <span style={{
                                fontSize: 9.5, fontWeight: 700, letterSpacing: "0.04em",
                                color: C.risk, backgroundColor: "rgba(184,50,50,0.12)",
                                border: "1px solid rgba(184,50,50,0.3)", borderRadius: 3,
                                padding: "1px 5px",
                              }}>해제 예정</span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: C.muted }}>05-{String(cell.day).padStart(2,"0")} · {cell.level === "absolute" ? "절대 보호" : "우선 보호"}</div>
                        </div>
                        <button
                          onClick={() => isRemoved ? reactivateCell(k) : setConfirm({ type: "deselect-cell", cellKey: k, isStrong: false })}
                          title={isRemoved ? "해제 취소 — 기존 보호 상태로 복구" : "보호 해제"}
                          style={{
                            flexShrink: 0, cursor: "pointer", padding: "3px 7px",
                            display: "flex", alignItems: "center", gap: 4,
                            background: isRemoved ? "rgba(46,125,82,0.09)" : "none",
                            border: isRemoved ? "1px solid rgba(46,125,82,0.3)" : "none",
                            borderRadius: 3, color: isRemoved ? C.ok : C.muted,
                            fontSize: 10, fontWeight: 600, fontFamily: "'Inter', sans-serif",
                            transition: "all 0.12s",
                          }}
                        >
                          {isRemoved ? <><CheckCircle size={10} />&nbsp;해제 취소</> : <X size={11} />}
                        </button>
                      </div>
                    );
                  })
              }
            </SideSection>
          </div>

          {/* 우측 그리드 — MonthlyScheduleGrid 공유 컴포넌트 */}
          <div style={{ flex: 1, overflow: "auto", minWidth: 0 }}>
            <MonthlyScheduleGrid
              schedule={SCHEDULE_DATA}
              employees={EMPLOYEES}
              calConfig={MAY_2026_CAL}
              zoom={0.88}
              mode="protect-selection"
              protCells={cells as Map<string, ProtCellState>}
              baseDay={baseDay}
              onProtectCellClick={(empId, empName, day, code, isDisabled) =>
                handleCellClick(empId, empName, day, code as ShiftCode, isDisabled)
              }
              showCountRows={false}
            />
          </div>
        </div>

        {/* 푸터 */}
        <div style={{ padding: "11px 22px", borderTop: `1px solid ${C.border}`, backgroundColor: C.rowAlt, flexShrink: 0 }}>
          {/* 해제 예정 경고 */}
          {pendingRemoveCount > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 12px", borderRadius: 5, marginBottom: 10,
              backgroundColor: "rgba(184,50,50,0.07)",
              border: "1px solid rgba(184,50,50,0.25)",
            }}>
              <AlertTriangle size={13} color={C.risk} />
              <span style={{ fontSize: 11.5, color: C.risk, fontWeight: 500 }}>
                해제 예정 일정은 저장 후 재생성 대상에 포함될 수 있습니다.
              </span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11.5, color: C.muted, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <span>절대 보호 <strong style={{ color: C.risk }}>{activeAbs}건</strong></span>
              <span>우선 보호 <strong style={{ color: C.gold }}>{activePri}건</strong></span>
              {pendingRemoveCount > 0 && (
                <span style={{ color: C.risk, fontWeight: 600 }}>
                  해제 예정 <strong>{pendingRemoveCount}건</strong>
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="outline" onClick={onClose}>취소</Btn>
              <Btn variant="primary" onClick={handleSave}>
                <Shield size={12} />
                보호 일정으로 저장{(activeAbs + activePri + pendingRemoveCount > 0) && ` (절대 ${activeAbs}건 / 우선 ${activePri}건${pendingRemoveCount > 0 ? ` / 해제 ${pendingRemoveCount}건` : ""})`}
              </Btn>
            </div>
          </div>
        </div>
      </div>

      {/* 확인 모달 */}
      {confirm && confirmText && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001 }}>
          <div style={{ backgroundColor: C.white, borderRadius: 8, padding: "26px 30px", maxWidth: 440, width: "90%", boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 10, fontFamily: "'Cormorant Garamond', serif" }}>{confirmText.title}</div>
            <div style={{ fontSize: 13, color: C.charcoal, lineHeight: 1.75, marginBottom: 22, whiteSpace: "pre-line" }}>{confirmText.body}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Btn variant="outline" onClick={() => setConfirm(null)}>취소</Btn>
              <Btn variant="outline" onClick={() => setConfirm(null)}>{confirmText.cancelLabel}</Btn>
              <Btn variant={confirmText.confirmVariant} onClick={applyConfirm}>{confirmText.confirmLabel}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function RedeploymentPage() {
  const { showToast } = useToast();
  const {
    addChangeLog, setScheduleVersion, setScheduleStatus,
    setLastUpdatedAt, scheduleVersion, selectedHotel, targetMonth,
  } = useAppContext();

  const resultRef = useRef<HTMLDivElement>(null);

  /* ─── 마법사 단계 관리 ─────────────────────── */
  const [openStep, setOpenStep] = useState<number>(1);      // 현재 열린 단계
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set()); // 완료 단계

  const getStepStatus = (n: number): StepStatus => {
    if (doneSteps.has(n)) return "done";
    if (openStep === n)   return "active";
    return "pending";
  };
  const toggleStep = (n: number) => {
    setOpenStep(prev => prev === n ? 0 : n);
  };
  const completeStep = (n: number, next: number) => {
    setDoneSteps(prev => new Set([...prev, n]));
    setOpenStep(next);
    // 스크롤을 다음 단계로
    setTimeout(() => {
      document.getElementById(`step-${next}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  /* ─── 상태 변수 ───────────────────────────── */
  const [basis,             setBasis]             = useState<RegenBasis>("other");
  const [forecastFile,      setForecastFile]      = useState<string | null>(null);
  const [forecastUploaded,  setForecastUploaded]  = useState(false);
  const [forecastUploading, setForecastUploading] = useState(false);
  const [isDragging,        setIsDragging]        = useState(false);
  const [otherReason,       setOtherReason]       = useState("");
  const [baselineDate,      setBaselineDate]      = useState("2026-05-01");
  const [impactStart,       setImpactStart]       = useState("2026-05-01");
  const [impactEnd,         setImpactEnd]         = useState("2026-05-31");
  const [showSelectModal,   setShowSelectModal]   = useState(false);
  const [manualProtCells,   setManualProtCells]   = useState<SelectedProtCell[]>([]);
  const [removedAutoKeys,   setRemovedAutoKeys]   = useState<Set<string>>(new Set());
  const [nightShiftToggle,  setNightShiftToggle]  = useState(false);
  const [nightShiftMode,    setNightShiftMode]    = useState<NightShiftMode>("auto");
  const [nightPriority,     setNightPriority]     = useState<string[]>([]);  // empId[]
  const [nightExclude,      setNightExclude]      = useState<string[]>([]);  // empId[]
  const [nightPriSearch,    setNightPriSearch]    = useState("");
  const [nightExcSearch,    setNightExcSearch]    = useState("");
  const [nightConflict,     setNightConflict]     = useState<{
    empId: string; empName: string;
    currentList: "priority" | "exclude"; targetList: "priority" | "exclude";
  } | null>(null);
  const [generating,        setGenerating]        = useState(false);
  const [result,            setResult]            = useState<RegenResult | null>(null);
  const [saving,            setSaving]            = useState(false);
  const [saved,             setSaved]             = useState(false);

  /* ─── 유효성 ──────────────────────────────── */
  const step1Valid = basis === "forecast" ? forecastUploaded : otherReason.trim().length > 0;
  const step2Valid = !!baselineDate;
  const step3Valid = !!impactStart && !!impactEnd;
  // 야간조 직접 선택 시 우선/제외 중 1명 이상 필수
  const canNightShift = !nightShiftToggle || nightShiftMode === "auto"
    || (nightPriority.length > 0 || nightExclude.length > 0);
  const canGenerate = step1Valid && step2Valid && step3Valid && canNightShift;

  /* ─── 페이지 상태 레이블 ──────────────────── */
  const pageStatus: PageStatus =
    saved           ? "저장 완료" :
    result          ? "미리보기 완료" :
    doneSteps.size > 0 ? "분석 완료" : "설정 전";

  const pageStatusColor =
    saved   ? C.ok :
    result  ? C.pending :
    doneSteps.size > 0 ? C.gold : C.muted;

  /* ─── 수요예측 업로드 ─────────────────────── */
  const handleForecastUpload = () => {
    setForecastUploading(true);
    setTimeout(() => {
      setForecastUploaded(true);
      setForecastUploading(false);
      setForecastFile(null);
      setImpactStart("2026-05-02");
      setImpactEnd("2026-05-04");
      showToast({ type: "success", title: "수요예측 업로드 완료", message: "Forecast v1.1 생성 · 영향 기간 자동 분석됨" });
    }, 1500);
  };

  /* ─── 스케줄 재생성 ───────────────────────── */
  const handleGenerate = () => {
    if (!canGenerate) return;
    setGenerating(true);
    setResult(null);
    setSaved(false);
    setTimeout(() => {
      const vNum = parseFloat(scheduleVersion.replace("v", "")) + 0.1;
      const vName = `v${vNum.toFixed(1)} 스케줄 재생성`;
      setResult({
        versionName: vName,
        changeCount: 14,
        changes: [
          { employee: "박지현", date: "05-12", from: "M07", to: "C10" },
          { employee: "김태훈", date: "05-12", from: "A13", to: "C11" },
          { employee: "오세영", date: "05-13", from: "M07", to: "C09" },
          { employee: "강미래", date: "05-13", from: "A13", to: "C08" },
          { employee: "최민준", date: "05-14", from: "C09", to: "M07" },
          { employee: "박지현", date: "05-14", from: "OFF", to: "M07" },
          { employee: "한도현", date: "05-15", from: "N22", to: "N22" },
          { employee: "오세영", date: "05-16", from: "M07", to: "A13" },
        ],
        absoluteProtected: AUTO_ABSOLUTE.length,
        priorityProtected: AUTO_PRIORITY.length + manualProtCells.filter(c => c.level === "priority").length,
        priorityChanged: 0,
        nightShiftChanged: nightShiftToggle,
        nightShiftChanges: nightShiftToggle
          ? nightShiftMode === "auto"
            ? ["박지호 → 제외 대상자 (장기 병가, 자동 감지)", "이서연 → 우선 대상자 추가 (자동 재설정)"]
            : [
                ...nightPriority.map(id => {
                  const emp = EMPLOYEES.find(e => e.id === id);
                  return emp ? `${emp.name} → 우선 대상자 추가` : id;
                }),
                ...nightExclude.map(id => {
                  const emp = EMPLOYEES.find(e => e.id === id);
                  return emp ? `${emp.name} → 제외 대상자 추가` : id;
                }),
              ]
          : [],
        warnings: ["05-20 오전조 최소 인원 1명 부족 (검토 필요)"],
      });
      setGenerating(false);
      setDoneSteps(prev => new Set([...prev, 6]));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, 2000);
  };

  /* ─── 새 버전 저장 ────────────────────────── */
  const handleSave = () => {
    if (!result) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setScheduleVersion(result.versionName.split(" ")[0]);
      setScheduleStatus("작업 중");
      const now = new Date().toLocaleString("ko-KR", { hour12: false });
      setLastUpdatedAt(now);
      addChangeLog({
        type: "근무표 생성",
        typeBg: "rgba(94,127,163,0.08)",
        typeColor: "#5E7FA3",
        target: `${result.versionName} 생성`,
        actor: "관리자",
        role: "운영 관리자",
        detail: `스케줄 재생성 — ${basis === "forecast" ? "수요예측 변경" : otherReason} · 변경 ${result.changeCount}건${nightShiftToggle ? ` · 야간조 조정 (${nightShiftMode === "auto" ? "자동" : `직접 선택 우선 ${nightPriority.length}명/제외 ${nightExclude.length}명`})` : ""}`,
        time: now,
      });
      showToast({ type: "success", title: "새 버전 저장 완료", message: `${result.versionName}이 저장되었습니다.` });
    }, 1400);
  };

  const autoAbsRemoved = Array.from(removedAutoKeys).filter(k => k.startsWith("abs_")).length;
  const autoPriRemoved = Array.from(removedAutoKeys).filter(k => k.startsWith("pri_")).length;
  const totalAbsolute = (AUTO_ABSOLUTE.length - autoAbsRemoved) + manualProtCells.filter(c => c.level === "absolute").length;
  const totalPriority = (AUTO_PRIORITY.length - autoPriRemoved) + manualProtCells.filter(c => c.level === "priority").length;

  return (
    <AppLayout>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: C.bg }}>

        {/* ── 페이지 헤더 ── */}
        <div style={{ backgroundColor: C.white, borderBottom: `1px solid ${C.border}`, padding: "18px 40px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600, color: C.navy, marginBottom: 4 }}>
                스케줄 재생성
              </h1>
              <p style={{ fontSize: 12, color: C.muted }}>
                수요예측 변경이나 운영 사유 발생 시, 변경 기준일 이후의 일정만 다시 생성하고 새 버전으로 저장합니다.
              </p>
            </div>
            {/* 재생성 상태 뱃지 */}
            <span style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
              color: pageStatusColor, backgroundColor: C.rowAlt,
              border: `1px solid ${pageStatusColor}`, whiteSpace: "nowrap", marginTop: 4,
            }}>● {pageStatus}</span>
          </div>

          {/* 컨텍스트 바 */}
          <div style={{ marginTop: 14, display: "flex", gap: 20, paddingTop: 14, borderTop: `1px solid ${C.borderLight}` }}>
            {[
              { label: "호텔",         value: selectedHotel },
              { label: "대상 월",      value: targetMonth },
              { label: "현재 버전",    value: scheduleVersion },
              { label: "수요예측",     value: forecastUploaded ? "Forecast v1.1" : "Forecast v1.0" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{item.label}</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.charcoal }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 본문 ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 40px 100px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ════ STEP 1: 재생성 기준 ════ */}
          <div id="step-1">
            <WizardStep
              num={1} title="재생성 기준"
              status={getStepStatus(1)}
              summary={step1Valid
                ? basis === "forecast"
                  ? "수요예측 변경 선택됨 (Forecast v1.1 업로드 완료)"
                  : `기타 사유: ${otherReason}`
                : "재생성 기준을 선택하세요"}
              isOpen={openStep === 1}
              onToggle={() => toggleStep(1)}
            >
              {/* 선택 버튼 2개 */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                {([
                  { val: "forecast" as RegenBasis, label: "수요예측 변경", desc: "새 수요예측을 업로드하고 영향 날짜를 자동 분석합니다" },
                  { val: "other"    as RegenBasis, label: "기타 사유",     desc: "시설 점검, 행사, 장기 부재, 퇴사 등 운영상 사유" },
                ] as const).map(o => (
                  <button key={o.val} onClick={() => { setBasis(o.val); setDoneSteps(prev => { const n = new Set(prev); n.delete(1); return n; }); }} style={{
                    flex: 1, padding: "14px 18px", borderRadius: 6, cursor: "pointer", textAlign: "left",
                    border: `2px solid ${basis === o.val ? C.gold : C.border}`,
                    backgroundColor: basis === o.val ? C.goldBg : C.white, transition: "all 0.15s",
                  }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: basis === o.val ? "#7A5518" : C.charcoal, marginBottom: 3 }}>
                      {basis === o.val ? "◉ " : "○ "}{o.label}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>{o.desc}</div>
                  </button>
                ))}
              </div>

              {/* 수요예측 변경 */}
              {basis === "forecast" && (
                <div style={{ marginBottom: 16 }}>
                  {!forecastUploaded ? (
                    <>
                      <div style={{
                        border: `2px dashed ${isDragging ? C.gold : C.border}`, borderRadius: 6,
                        padding: "24px 20px", textAlign: "center", cursor: "pointer",
                        backgroundColor: isDragging ? C.goldBg : C.rowAlt, transition: "all 0.2s",
                      }}
                        onClick={() => setForecastFile("forecast_may2026_v11.xlsx")}
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={e => { e.preventDefault(); setIsDragging(false); setForecastFile("forecast_may2026_v11.xlsx"); }}>
                        <Upload size={26} color={isDragging ? C.gold : C.muted} style={{ margin: "0 auto 8px" }} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, marginBottom: 3 }}>최신 수요예측 업로드</div>
                        <div style={{ fontSize: 11, color: C.muted }}>Excel (.xlsx) · 기존 버전은 삭제되지 않습니다</div>
                      </div>
                      {forecastFile && (
                        <div style={{ marginTop: 10, padding: "10px 14px", backgroundColor: C.okBg, border: `1px solid ${C.okBorder}`, borderRadius: 5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12.5, color: C.charcoal, fontWeight: 500 }}>📄 {forecastFile}</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Btn variant="outline" onClick={() => setForecastFile(null)}>취소</Btn>
                            <Btn variant="gold" onClick={handleForecastUpload} disabled={forecastUploading}>
                              {forecastUploading ? <><Loader size={11} className="spin" /> 분석 중...</> : <><Upload size={11} /> 업로드</>}
                            </Btn>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ padding: "14px 16px", backgroundColor: C.okBg, border: `1px solid ${C.okBorder}`, borderRadius: 6 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ok, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
                        <CheckCircle size={13} /> Forecast v1.1 업로드 완료 — 영향 날짜 자동 분석됨
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                        {[
                          { label: "체크인 변화", value: "+42건", color: C.risk, sub: "05-02 ~ 05-04" },
                          { label: "체크아웃 변화", value: "+18건", color: C.warning, sub: "05-02 ~ 05-03" },
                          { label: "영향 날짜", value: "3일", color: C.pending, sub: "05-02, 03, 04" },
                          { label: "중간조 추가", value: "필요", color: C.risk, sub: "C08~C11 검토" },
                        ].map(s => (
                          <div key={s.label} style={{ padding: "10px 12px", backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 5, textAlign: "center" }}>
                            <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: 17, fontWeight: 700, color: s.color, fontFamily: "'Cormorant Garamond', serif" }}>{s.value}</div>
                            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{s.sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 기타 사유 */}
              {basis === "other" && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6 }}>사유 입력</div>
                  <textarea value={otherReason} onChange={e => setOtherReason(e.target.value)}
                    placeholder="예: 5월 12일 시설 점검으로 오후 피크 시간대 인력 조정 필요"
                    rows={2} style={{ ...inputSt, resize: "vertical" }} />
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {["시설 점검","단체 행사","VIP 행사","객실 판매 증가","장기 부재","퇴사","교육/병가 반영","기타 운영 이슈"].map(r => (
                      <button key={r} onClick={() => setOtherReason(r)} style={{
                        padding: "3px 9px", borderRadius: 3, fontSize: 11, cursor: "pointer",
                        border: `1px solid ${otherReason === r ? C.goldBorder : C.border}`,
                        backgroundColor: otherReason === r ? C.goldBg : "transparent",
                        color: otherReason === r ? "#7A5518" : C.muted,
                      }}>{r}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* 다음 버튼 */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn variant="primary" disabled={!step1Valid} onClick={() => completeStep(1, 2)}>
                  다음 <ChevronRight size={13} />
                </Btn>
              </div>
            </WizardStep>
          </div>

          {/* ════ STEP 2: 변경 기준일 ════ */}
          <div id="step-2">
            <WizardStep
              num={2} title="변경 기준일"
              status={getStepStatus(2)}
              summary={baselineDate ? `${baselineDate}부터 재생성` : "날짜를 선택하세요"}
              isOpen={openStep === 2}
              onToggle={() => toggleStep(2)}
            >
              <div style={{ padding: "2px 0 16px" }}>
                <div style={{ padding: "9px 13px", backgroundColor: C.pendingBg, border: `1px solid ${C.pendingBorder}`, borderRadius: 5, fontSize: 12, color: C.pending, display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                  <Info size={12} /> 변경 기준일 이전 일정은 유지하고, 이후 일정만 다시 생성합니다.
                </div>
                <div style={{ maxWidth: 240 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>변경 기준일</div>
                  <input type="date" value={baselineDate} min="2026-04-20"
                    onChange={e => { setBaselineDate(e.target.value); setDoneSteps(prev => { const n = new Set(prev); n.delete(2); return n; }); }}
                    style={inputSt} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn variant="primary" disabled={!step2Valid} onClick={() => completeStep(2, 3)}>
                  다음 <ChevronRight size={13} />
                </Btn>
              </div>
            </WizardStep>
          </div>

          {/* ════ STEP 3: 영향 기간 ════ */}
          <div id="step-3">
            <WizardStep
              num={3} title="영향 기간"
              status={getStepStatus(3)}
              summary={impactStart && impactEnd ? `${impactStart} ~ ${impactEnd}` : "기간을 입력하세요"}
              isOpen={openStep === 3}
              onToggle={() => toggleStep(3)}
            >
              <div style={{ paddingBottom: 16 }}>
                {basis === "forecast" && forecastUploaded && (
                  <div style={{ fontSize: 12, color: C.ok, fontWeight: 500, display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
                    <CheckCircle size={12} /> 수요예측 분석 결과로 자동 제안됨 · 필요 시 수정 가능
                  </div>
                )}
                <div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>영향 시작일</div>
                    <input type="date" value={impactStart} min={baselineDate}
                      onChange={e => { setImpactStart(e.target.value); setDoneSteps(prev => { const n = new Set(prev); n.delete(3); return n; }); }}
                      style={inputSt} />
                  </div>
                  <span style={{ fontSize: 13, color: C.muted, paddingBottom: 7 }}>~</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 5 }}>영향 종료일</div>
                    <input type="date" value={impactEnd} min={impactStart}
                      onChange={e => { setImpactEnd(e.target.value); setDoneSteps(prev => { const n = new Set(prev); n.delete(3); return n; }); }}
                      style={inputSt} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn variant="primary" disabled={!step3Valid} onClick={() => completeStep(3, 4)}>
                  다음 <ChevronRight size={13} />
                </Btn>
              </div>
            </WizardStep>
          </div>

          {/* ════ STEP 4: 보호 일정 ════ */}
          <div id="step-4">
            <WizardStep
              num={4} title="보호 일정"
              status={getStepStatus(4)}
              summary={`절대 보호 ${totalAbsolute}건 / 우선 보호 ${totalPriority}건`}
              isOpen={openStep === 4}
              onToggle={() => toggleStep(4)}
            >
              <div style={{ paddingBottom: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                {/* 요약 칩 */}
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, padding: "12px 14px", backgroundColor: C.riskBg, border: `1px solid ${C.riskBorder}`, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, marginBottom: 4 }}>절대 보호</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.risk, fontFamily: "'Cormorant Garamond', serif" }}>{totalAbsolute}건</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>재생성 시 변경 불가</div>
                  </div>
                  <div style={{ flex: 1, padding: "12px 14px", backgroundColor: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, marginBottom: 4 }}>우선 보호</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: C.gold, fontFamily: "'Cormorant Garamond', serif" }}>{totalPriority}건</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>가능하면 유지</div>
                  </div>
                </div>

                {/* 자동 절대 보호 목록 */}
                <div style={{ border: `1px solid ${C.riskBorder}`, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ padding: "8px 14px", backgroundColor: C.riskBg, fontSize: 11, fontWeight: 600, color: C.risk, display: "flex", alignItems: "center", gap: 5 }}>
                    <Lock size={11} /> 자동 절대 보호 ({AUTO_ABSOLUTE.length}건) — 재생성 시 변경 금지
                  </div>
                  {AUTO_ABSOLUTE.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", fontSize: 12, color: C.charcoal, borderTop: i > 0 ? `1px solid ${C.borderLight}` : "none", backgroundColor: i % 2 === 0 ? C.white : C.rowAlt }}>
                      <ShiftChip code={item.code} small />
                      <strong style={{ minWidth: 55 }}>{item.empName}</strong>
                      <span style={{ color: C.muted, minWidth: 110 }}>{item.date}</span>
                      <span style={{ flex: 1 }} title={item.detail || undefined}>{item.display}{item.detail ? " ℹ" : ""}</span>
                    </div>
                  ))}
                </div>

                {/* 자동 우선 보호 목록 */}
                <div style={{ border: `1px solid ${C.goldBorder}`, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ padding: "8px 14px", backgroundColor: C.goldBg, fontSize: 11, fontWeight: 600, color: "#7A5518", display: "flex", alignItems: "center", gap: 5 }}>
                    <Shield size={11} /> 자동 우선 보호 ({AUTO_PRIORITY.length}건) — 가능하면 유지
                  </div>
                  {AUTO_PRIORITY.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", fontSize: 12, color: C.charcoal, borderTop: i > 0 ? `1px solid ${C.borderLight}` : "none", backgroundColor: i % 2 === 0 ? C.white : C.rowAlt }}>
                      <ShiftChip code={item.code} small />
                      <strong style={{ minWidth: 55 }}>{item.empName}</strong>
                      <span style={{ color: C.muted, minWidth: 110 }}>{item.date}</span>
                      <span style={{ flex: 1 }} title={item.detail || undefined}>{item.display}{item.detail ? " ℹ" : ""}</span>
                    </div>
                  ))}
                </div>

                {/* 직접 선택된 보호 */}
                {manualProtCells.length > 0 && (
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ padding: "8px 14px", backgroundColor: C.rowAlt, fontSize: 11, fontWeight: 600, color: C.charcoal }}>
                      직접 선택 보호 ({manualProtCells.length}건)
                    </div>
                    {manualProtCells.map((cell, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", fontSize: 12, color: C.charcoal, borderTop: i > 0 ? `1px solid ${C.borderLight}` : "none", backgroundColor: cell.level === "absolute" ? C.riskBg : C.goldBg }}>
                        {cell.level === "absolute" ? <Lock size={10} color={C.risk} /> : <Shield size={10} color={C.gold} />}
                        <ShiftChip code={cell.code} small />
                        <strong style={{ minWidth: 55 }}>{cell.empName}</strong>
                        <span style={{ color: C.muted }}>05-{String(cell.day).padStart(2, "0")}</span>
                        <span style={{ flex: 1, fontSize: 11, color: cell.level === "absolute" ? C.risk : "#7A5518" }}>
                          {cell.level === "absolute" ? "절대 보호" : "우선 보호"} (직접 선택)
                        </span>
                        <button onClick={() => setManualProtCells(prev => prev.filter((_, j) => j !== i))}
                          style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, flexShrink: 0 }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 근무표에서 선택 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Btn variant="outline" onClick={() => setShowSelectModal(true)}>
                    <Calendar size={12} /> 근무표에서 보호 일정 선택
                  </Btn>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn variant="primary" onClick={() => completeStep(4, 5)}>
                  다음 <ChevronRight size={13} />
                </Btn>
              </div>
            </WizardStep>
          </div>

          {/* ════ STEP 5: 야간조 조정 ════ */}
          <div id="step-5">
            <WizardStep
              num={5} title="야간조 조정"
              status={getStepStatus(5)}
              summary={nightShiftToggle
                ? nightShiftMode === "auto"
                  ? "야간조 계획 함께 조정 (자동 재설정)"
                  : `직접 선택 — 우선 ${nightPriority.length}명 / 제외 ${nightExclude.length}명`
                : "야간조 계획 함께 조정 안 함"}
              isOpen={openStep === 5}
              onToggle={() => toggleStep(5)}
            >
              <div style={{ paddingBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 10 }}>
                  <input type="checkbox" checked={nightShiftToggle}
                    onChange={e => setNightShiftToggle(e.target.checked)}
                    style={{ width: 15, height: 15, cursor: "pointer" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.charcoal }}>야간조 계획도 함께 조정</span>
                  <span style={{ fontSize: 11, color: C.muted }}>체크 시 해당 월 연간 야간조 계획도 반영</span>
                </label>

                {!nightShiftToggle && (
                  <div style={{ padding: "9px 13px", backgroundColor: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, color: C.muted }}>
                    월별 근무표만 재생성 · 연간 야간조 계획은 변경하지 않습니다.
                  </div>
                )}

                {nightShiftToggle && (() => {
                  // ── 보호 경고 맵 (AUTO_ABSOLUTE/PRIORITY 기준)
                  const PROT_WARN: Record<string, string> = {
                    "e3": "승인된 교육 일정 있음 (05-06 EDU)",
                    "e5": "승인 안내 발송된 휴일 신청 있음 (05-09 REQ)",
                  };
                  // N22 count per employee this month
                  const n22Count = (empId: string) =>
                    (SCHEDULE_DATA[empId] ?? []).filter(c => c === "N22").length;

                  // 우선/제외 토글 함수
                  const togglePri = (empId: string, empName: string) => {
                    if (nightExclude.includes(empId)) {
                      setNightConflict({ empId, empName, currentList: "exclude", targetList: "priority" });
                      return;
                    }
                    setNightPriority(prev =>
                      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
                    );
                  };
                  const toggleExc = (empId: string, empName: string) => {
                    if (nightPriority.includes(empId)) {
                      setNightConflict({ empId, empName, currentList: "priority", targetList: "exclude" });
                      return;
                    }
                    setNightExclude(prev =>
                      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
                    );
                  };

                  // 직원 행 컴포넌트
                  const EmpRow = ({ emp, mode: panelMode }: { emp: typeof EMPLOYEES[0]; mode: "pri" | "exc" }) => {
                    const isSelected = panelMode === "pri"
                      ? nightPriority.includes(emp.id)
                      : nightExclude.includes(emp.id);
                    const inOther = panelMode === "pri"
                      ? nightExclude.includes(emp.id)
                      : nightPriority.includes(emp.id);
                    const warn = PROT_WARN[emp.id];
                    const n22 = n22Count(emp.id);
                    const isNightEmp = emp.primaryShift === "야간조";
                    const accentColor = panelMode === "pri" ? "#4A3785" : C.risk;
                    const accentBg   = panelMode === "pri" ? "rgba(74,55,133,0.08)" : C.riskBg;

                    return (
                      <div
                        onClick={() => panelMode === "pri"
                          ? togglePri(emp.id, emp.name)
                          : toggleExc(emp.id, emp.name)
                        }
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "7px 10px", cursor: "pointer", borderRadius: 4,
                          backgroundColor: isSelected ? accentBg
                            : inOther ? "rgba(200,200,200,0.1)" : "transparent",
                          border: isSelected ? `1.5px solid ${accentColor}40` : "1.5px solid transparent",
                          transition: "all 0.12s",
                          opacity: inOther ? 0.5 : 1,
                        }}
                      >
                        {/* 체크박스 */}
                        <div style={{
                          width: 15, height: 15, borderRadius: 3, flexShrink: 0,
                          border: `2px solid ${isSelected ? accentColor : C.border}`,
                          backgroundColor: isSelected ? accentColor : C.white,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {isSelected && <span style={{ color: "#fff", fontSize: 9, fontWeight: 800 }}>✓</span>}
                        </div>
                        {/* 직원 정보 */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.charcoal }}>{emp.name}</span>
                            <span style={{ fontSize: 9.5, backgroundColor: "#E8EEF6", color: "#2B5EA0", borderRadius: 2, padding: "1px 4px" }}>{emp.grade}</span>
                            <span style={{ fontSize: 9.5, color: C.muted }}>{emp.role}</span>
                            {isNightEmp && <span style={{ fontSize: 9.5, backgroundColor: "rgba(74,55,133,0.12)", color: "#4A3785", borderRadius: 2, padding: "1px 4px" }}>야간조</span>}
                            {n22 > 0 && <span style={{ fontSize: 9.5, color: "#4A3785" }}>N22 {n22}일</span>}
                          </div>
                          {warn && (
                            <div style={{ fontSize: 10, color: C.warning, display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
                              <AlertTriangle size={9} /> {warn}
                            </div>
                          )}
                          {inOther && (
                            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>
                              {panelMode === "pri" ? "제외 대상자로 선택됨" : "우선 대상자로 선택됨"}
                            </div>
                          )}
                        </div>
                        {/* 현재 조 */}
                        <span style={{ fontSize: 10, color: C.muted, flexShrink: 0 }}>{emp.primaryShift}</span>
                      </div>
                    );
                  };

                  return (
                    <div style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                      {/* 조정 방식 라디오 */}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 6 }}>야간조 조정 방식</div>
                        <div style={{ display: "flex", gap: 10 }}>
                          {([
                            { val: "auto"   as NightShiftMode, label: "자동 재설정",  desc: "운영정책 기준으로 시스템이 자동으로 재배치" },
                            { val: "manual" as NightShiftMode, label: "직접 선택",    desc: "우선 대상자·제외 대상자를 직접 지정" },
                          ]).map(o => (
                            <label key={o.val} style={{
                              display: "flex", alignItems: "flex-start", gap: 7, cursor: "pointer",
                              flex: 1, padding: "9px 12px", borderRadius: 5,
                              border: `${nightShiftMode === o.val ? 2 : 1}px solid ${nightShiftMode === o.val ? C.gold : C.border}`,
                              backgroundColor: nightShiftMode === o.val ? C.goldBg : C.white,
                              transition: "all 0.12s",
                            }}>
                              <input type="radio" name="nightMode" checked={nightShiftMode === o.val}
                                onChange={() => {
                                  setNightShiftMode(o.val);
                                  if (o.val === "auto") {
                                    setNightPriority([]);
                                    setNightExclude([]);
                                  }
                                }}
                                style={{ marginTop: 2, cursor: "pointer" }} />
                              <div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.charcoal }}>{o.label}</div>
                                <div style={{ fontSize: 10.5, color: C.muted }}>{o.desc}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 직접 선택 패널 */}
                      {nightShiftMode === "manual" && (
                        <div style={{ display: "flex", gap: 10 }}>
                          {/* 우선 대상자 패널 */}
                          {([
                            { panelMode: "pri" as const, title: "우선 대상자 선택", accentColor: "#4A3785", accentBg: "rgba(74,55,133,0.07)", selectedList: nightPriority, search: nightPriSearch, setSearch: setNightPriSearch },
                            { panelMode: "exc" as const, title: "제외 대상자 선택", accentColor: C.risk,    accentBg: C.riskBg,                selectedList: nightExclude, search: nightExcSearch, setSearch: setNightExcSearch },
                          ]).map(panel => {
                            const filteredEmps = EMPLOYEES.filter(emp =>
                              panel.search === "" || emp.name.includes(panel.search) ||
                              emp.grade.includes(panel.search) || emp.primaryShift.includes(panel.search)
                            );
                            return (
                              <div key={panel.panelMode} style={{
                                flex: 1, border: `1px solid ${C.border}`, borderRadius: 6,
                                overflow: "hidden", backgroundColor: C.white,
                              }}>
                                {/* 패널 헤더 */}
                                <div style={{
                                  padding: "8px 12px", backgroundColor: panel.accentBg,
                                  borderBottom: `1px solid ${C.borderLight}`,
                                  display: "flex", alignItems: "center", justifyContent: "space-between",
                                }}>
                                  <span style={{ fontSize: 11.5, fontWeight: 700, color: panel.accentColor }}>{panel.title}</span>
                                  <span style={{
                                    fontSize: 10.5, fontWeight: 700,
                                    color: panel.selectedList.length > 0 ? panel.accentColor : C.muted,
                                    backgroundColor: panel.selectedList.length > 0 ? `${panel.accentColor}20` : "transparent",
                                    padding: "2px 7px", borderRadius: 10,
                                  }}>{panel.selectedList.length}명 선택</span>
                                </div>
                                {/* 검색 */}
                                <div style={{ padding: "7px 10px", borderBottom: `1px solid ${C.borderLight}` }}>
                                  <input
                                    type="text" placeholder="직원명 / 직급 / 조 검색..."
                                    value={panel.search}
                                    onChange={e => panel.setSearch(e.target.value)}
                                    style={{ ...inputSt, padding: "5px 9px", fontSize: 11.5 }}
                                  />
                                </div>
                                {/* 직원 목록 */}
                                <div style={{ maxHeight: 220, overflowY: "auto", padding: "4px 6px" }}>
                                  {filteredEmps.length === 0
                                    ? <div style={{ padding: "14px", fontSize: 11, color: C.muted, textAlign: "center" }}>검색 결과 없음</div>
                                    : filteredEmps.map(emp => (
                                        <EmpRow key={emp.id} emp={emp} mode={panel.panelMode} />
                                      ))
                                  }
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 직접 선택 유효성 경고 */}
                      {nightShiftMode === "manual" && nightPriority.length === 0 && nightExclude.length === 0 && (
                        <div style={{ padding: "8px 12px", backgroundColor: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 5, fontSize: 11.5, color: C.warning, display: "flex", alignItems: "center", gap: 5 }}>
                          <AlertTriangle size={12} />
                          우선 대상자 또는 제외 대상자를 1명 이상 선택해야 스케줄 재생성이 가능합니다.
                        </div>
                      )}

                      {/* 야간조 운영 원칙 */}
                      <div style={{ padding: "9px 13px", backgroundColor: C.pendingBg, border: `1px solid ${C.pendingBorder}`, borderRadius: 5 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.pending, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <Moon size={11} /> 야간조 운영 원칙
                        </div>
                        {[
                          "야간조 대상자 → N22 중심 배치 / M07·A13·C08~C11 배정 금지",
                          "변경 기준일 이후 구간만 조정 · 절대 보호 일정은 변경 불가",
                          "우선 보호 일정은 가능하면 유지",
                        ].map((t, i) => <div key={i} style={{ fontSize: 11, color: C.charcoal }}>{t}</div>)}
                      </div>

                      {/* 충돌 확인 인라인 모달 */}
                      {nightConflict && (
                        <div style={{ padding: "14px 16px", backgroundColor: C.white, border: `2px solid ${C.riskBorder}`, borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 8, fontFamily: "'Cormorant Garamond', serif" }}>
                            {nightConflict.targetList === "priority" ? "우선 대상자로 변경" : "제외 대상자로 변경"}
                          </div>
                          <div style={{ fontSize: 12, color: C.charcoal, lineHeight: 1.7, marginBottom: 12 }}>
                            <strong>{nightConflict.empName}</strong>은 현재{" "}
                            {nightConflict.currentList === "priority" ? "우선 대상자" : "제외 대상자"}로 선택되어 있습니다.{"\n"}
                            {nightConflict.targetList === "priority" ? "우선 대상자" : "제외 대상자"}로 변경하시겠습니까?
                          </div>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <Btn variant="outline" onClick={() => setNightConflict(null)}>취소</Btn>
                            <Btn variant="risk" onClick={() => {
                              const { empId, currentList, targetList } = nightConflict;
                              if (currentList === "priority") {
                                setNightPriority(prev => prev.filter(id => id !== empId));
                                setNightExclude(prev => [...prev, empId]);
                              } else {
                                setNightExclude(prev => prev.filter(id => id !== empId));
                                setNightPriority(prev => [...prev, empId]);
                              }
                              setNightConflict(null);
                            }}>
                              {nightConflict.targetList === "priority" ? "우선 대상자로 변경" : "제외 대상자로 변경"}
                            </Btn>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn
                  variant="primary"
                  onClick={() => {
                    if (nightShiftToggle && nightShiftMode === "manual"
                      && nightPriority.length === 0 && nightExclude.length === 0) {
                      showToast({
                        type: "warning",
                        title: "직원 선택 필요",
                        message: "직접 선택 방식을 사용하려면 우선 대상자 또는 제외 대상자를 1명 이상 선택해주세요.",
                      });
                      return;
                    }
                    completeStep(5, 6);
                  }}
                >
                  다음 <ChevronRight size={13} />
                </Btn>
              </div>
            </WizardStep>
          </div>

          {/* ════ STEP 6: 스케줄 재생성 실행 ════ */}
          <div id="step-6">
            <WizardStep
              num={6} title="스케줄 재생성 실행"
              status={getStepStatus(6)}
              summary={result ? `결과 미리보기 완료 — 변경 ${result.changeCount}건 / ${result.versionName}` : "설정을 확인하고 재생성을 실행하세요"}
              isOpen={openStep === 6}
              onToggle={() => toggleStep(6)}
            >
              {/* 설정 요약 */}
              <div style={{ marginBottom: 16, padding: "14px 16px", backgroundColor: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 4, letterSpacing: "0.04em" }}>재생성 설정 요약</div>
                {[
                  { label: "재생성 기준", value: basis === "forecast" ? "수요예측 변경" : `기타 사유 — ${otherReason}` },
                  { label: "변경 기준일", value: baselineDate },
                  { label: "영향 기간",   value: `${impactStart} ~ ${impactEnd}` },
                  { label: "보호 일정",   value: `절대 ${totalAbsolute}건 / 우선 ${totalPriority}건` },
                  { label: "야간조 조정", value: nightShiftToggle ? `함께 조정 (${nightShiftMode === "auto" ? "자동" : "직접 선택"})` : "조정 안 함" },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", gap: 10, fontSize: 12 }}>
                    <span style={{ color: C.muted, minWidth: 80 }}>{r.label}</span>
                    <span style={{ color: C.charcoal, fontWeight: 500 }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {!canGenerate && (
                <div style={{ marginBottom: 12, padding: "9px 13px", backgroundColor: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 5, fontSize: 12, color: C.warning, display: "flex", alignItems: "center", gap: 5 }}>
                  <AlertTriangle size={12} /> 필수 항목을 먼저 완료하세요 (1~3단계).
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: generating || result ? 20 : 0 }}>
                <Btn variant="gold" disabled={!canGenerate || generating} onClick={handleGenerate}>
                  {generating
                    ? <><Loader size={13} className="spin" /> 재생성 중...</>
                    : <><RefreshCw size={13} /> 스케줄 재생성</>}
                </Btn>
                {generating && <span style={{ fontSize: 12, color: C.muted }}>운영정책 확인 · 보호 일정 반영 · 영향 구간 재생성 중...</span>}
              </div>

              {/* ─ 결과 미리보기 ─ */}
              {result && (
                <div ref={resultRef}>
                  <div style={{ height: 1, backgroundColor: C.border, margin: "16px 0" }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, marginBottom: 12 }}>결과 미리보기</div>

                  {/* 요약 숫자 */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
                    {[
                      { label: "근무표 변경",    value: `${result.changeCount}건`,        color: C.navy },
                      { label: "절대 보호 유지",  value: `${result.absoluteProtected}건`,  color: C.risk },
                      { label: "우선 보호 유지",  value: `${result.priorityProtected}건`,  color: "#7A5518" },
                      { label: "야간조 변경",     value: result.nightShiftChanged ? "있음" : "없음", color: result.nightShiftChanged ? C.pending : C.muted },
                    ].map(s => (
                      <div key={s.label} style={{ padding: "12px 14px", backgroundColor: C.rowAlt, border: `1px solid ${C.border}`, borderRadius: 6, textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: "0.04em", marginBottom: 5 }}>{s.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'Cormorant Garamond', serif" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* 변경 목록 */}
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "130px 80px 80px 20px 80px", padding: "8px 14px", backgroundColor: C.navyDeep, fontSize: 10, fontWeight: 600, color: C.white, letterSpacing: "0.04em" }}>
                      <div>직원</div><div>날짜</div><div>기존</div><div></div><div>변경</div>
                    </div>
                    {result.changes.map((c, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "130px 80px 80px 20px 80px", padding: "8px 14px", fontSize: 12, borderTop: `1px solid ${C.borderLight}`, backgroundColor: i % 2 === 0 ? C.white : C.rowAlt, alignItems: "center" }}>
                        <div style={{ fontWeight: 600, color: C.charcoal }}>{c.employee}</div>
                        <div style={{ color: C.muted }}>{c.date}</div>
                        <div><ShiftChip code={c.from} small /></div>
                        <div style={{ color: C.muted, textAlign: "center", fontSize: 10 }}>→</div>
                        <div><ShiftChip code={c.to} small /></div>
                      </div>
                    ))}
                  </div>

                  {/* 야간조 변경 */}
                  {result.nightShiftChanged && result.nightShiftChanges.length > 0 && (
                    <div style={{ padding: "10px 14px", backgroundColor: C.pendingBg, border: `1px solid ${C.pendingBorder}`, borderRadius: 6, marginBottom: 10 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: C.pending, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        <Moon size={11} /> 연간 야간조 계획 변경 내역
                      </div>
                      {result.nightShiftChanges.map((c, i) => <div key={i} style={{ fontSize: 12, color: C.charcoal }}>{c}</div>)}
                    </div>
                  )}

                  {/* 경고 */}
                  {result.warnings.length > 0 && (
                    <div style={{ padding: "10px 14px", backgroundColor: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 6, marginBottom: 10 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: C.warning, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <AlertTriangle size={11} /> 운영 경고 ({result.warnings.length}건)
                      </div>
                      {result.warnings.map((w, i) => <div key={i} style={{ fontSize: 12, color: C.charcoal }}>{w}</div>)}
                    </div>
                  )}

                  {/* 새 버전명 */}
                  <div style={{ padding: "10px 14px", backgroundColor: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 6, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                    <LayoutGrid size={12} color={C.gold} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.charcoal }}>생성될 버전: </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{result.versionName}</span>
                    <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>기존 버전을 덮어쓰지 않고 새 버전으로 저장됩니다.</span>
                  </div>

                  {/* 저장 버튼 */}
                  {!saved ? (
                    <div style={{ display: "flex", gap: 10 }}>
                      <Btn variant="ok" disabled={saving} onClick={handleSave}>
                        {saving ? <><Loader size={12} className="spin" /> 저장 중...</> : <><CheckCircle size={12} /> 새 버전으로 저장</>}
                      </Btn>
                      <Btn variant="outline" onClick={() => { setResult(null); setDoneSteps(prev => { const n = new Set(prev); n.delete(6); return n; }); }}>
                        다시 조정
                      </Btn>
                    </div>
                  ) : (
                    <div style={{ padding: "16px 20px", backgroundColor: C.okBg, border: `1px solid ${C.okBorder}`, borderRadius: 8, display: "flex", alignItems: "center", gap: 14 }}>
                      <CheckCircle size={28} color={C.ok} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.ok }}>저장 완료</div>
                        <div style={{ fontSize: 12, color: C.muted }}>{result.versionName}이 저장되었습니다. 월별 근무표와 변경 이력에 반영됩니다.</div>
                      </div>
                      <div style={{ marginLeft: "auto" }}>
                        <Btn variant="outline" onClick={() => {
                          setResult(null); setSaved(false); setForecastUploaded(false);
                          setOtherReason(""); setBasis("other"); setDoneSteps(new Set()); setOpenStep(1);
                        }}>새 재생성 시작</Btn>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </WizardStep>
          </div>

        </div>
        {/* /본문 */}

        {/* ── Sticky 하단 액션바 ── */}
        <div style={{
          position: "sticky", bottom: 0,
          backgroundColor: C.white, borderTop: `1px solid ${C.border}`,
          padding: "12px 40px", display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 -2px 12px rgba(0,0,0,0.06)", zIndex: 10,
        }}>
          {/* 단계 인디케이터 */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
            {[1,2,3,4,5,6].map(n => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <button
                  onClick={() => { if (doneSteps.has(n) || n <= openStep) toggleStep(n); }}
                  style={{
                    width: 24, height: 24, borderRadius: "50%", border: "none",
                    backgroundColor:
                      doneSteps.has(n) ? C.ok :
                      openStep === n   ? C.gold : "#CDD2D8",
                    cursor: doneSteps.has(n) || n <= openStep ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                  {doneSteps.has(n)
                    ? <CheckCircle size={13} color={C.white} />
                    : <span style={{ fontSize: 11, fontWeight: 700, color: openStep === n ? C.navyDeep : C.white }}>{n}</span>}
                </button>
                {n < 6 && <div style={{ width: 16, height: 1, backgroundColor: doneSteps.has(n) ? C.ok : C.border }} />}
              </div>
            ))}
            <span style={{ marginLeft: 10, fontSize: 11.5, color: C.muted }}>
              {openStep > 0 && openStep < 7 ? `${openStep}단계 진행 중` : "완료"}
            </span>
          </div>

          {/* CTA 버튼 */}
          {!result && (
            <Btn variant="gold" disabled={!canGenerate || generating} onClick={handleGenerate}>
              {generating ? <><Loader size={12} className="spin" /> 재생성 중...</> : <><RefreshCw size={12} /> 스케줄 재생성</>}
            </Btn>
          )}
          {result && !saved && (
            <Btn variant="ok" disabled={saving} onClick={handleSave}>
              {saving ? <><Loader size={12} className="spin" /> 저장 중...</> : <><CheckCircle size={12} /> 새 버전으로 저장</>}
            </Btn>
          )}
        </div>

      </div>

      {/* 보호 일정 선택 모달 */}
      {showSelectModal && (
        <ScheduleSelectModal
          baselineDate={baselineDate}
          existingManualCells={manualProtCells}
          onClose={() => setShowSelectModal(false)}
          onSave={(activeCells, removedSidebarKeysList) => {
            setManualProtCells(activeCells);
            setRemovedAutoKeys(new Set(removedSidebarKeysList));
            setShowSelectModal(false);
            const absN = activeCells.filter(c => c.level === "absolute").length
              + (AUTO_ABSOLUTE.length - removedSidebarKeysList.filter(k => k.startsWith("abs_")).length);
            const priN = activeCells.filter(c => c.level === "priority").length
              + (AUTO_PRIORITY.length - removedSidebarKeysList.filter(k => k.startsWith("pri_")).length);
            const relN = removedSidebarKeysList.length;
            showToast({ type: "success", title: "보호 일정 저장 완료",
              message: `절대 보호 ${absN}건, 우선 보호 ${priN}건이 저장되었습니다.${relN > 0 ? ` 해제 ${relN}건이 반영되었습니다.` : ""}` });
          }}
        />
      )}
    </AppLayout>
  );
}
