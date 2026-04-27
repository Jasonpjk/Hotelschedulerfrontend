import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { useLang } from "../context/LangContext";
import { DT } from "../i18n";

/* ══════════════════════════════════════════════════════════
   COLOR TOKENS
══════════════════════════════════════════════════════════ */
const C = {
  navy:        "#0D1B2A",
  navyDeep:    "#091523",
  gold:        "#B99B5A",
  goldBg:      "rgba(185,155,90,0.08)",
  bg:          "#F2EFE9",
  white:       "#FFFFFF",
  border:      "#E4DED4",
  muted:       "#7B8390",
  charcoal:    "#2E3642",
  text:        "#1C2430",
  risk:        "#B83232",
  riskBg:      "rgba(184,50,50,0.06)",
  ok:          "#2E7D52",
  okBg:        "rgba(46,125,82,0.08)",
  warning:     "#B87C1A",
  warnBg:      "rgba(184,124,26,0.09)",
};

type ShiftCode =
  | "M07" | "A13" | "N22"
  | "C08" | "C09" | "C10" | "C11"
  | "REQ" | "OFF" | "HOL" | "VAC" | "SL" | "EDU" | "SICK";

const SHIFT: Record<ShiftCode, { bg: string; text: string; border: string; name: string }> = {
  M07: { bg: "#EAF2FB", text: "#1B5990", border: "#B5D0EE", name: "오전조" },
  A13: { bg: "#EAF4EE", text: "#1B6638", border: "#8FCAA8", name: "오후조" },
  N22: { bg: "#EEEAF5", text: "#4A3785", border: "#C0ACDF", name: "야간조" },
  C08: { bg: "#FBF2E6", text: "#7A5518", border: "#DEC07E", name: "중간조" },
  C09: { bg: "#FBF2E6", text: "#7A5518", border: "#DEC07E", name: "중간조" },
  C10: { bg: "#FBF4E8", text: "#7A5518", border: "#E0C48A", name: "중간조" },
  C11: { bg: "#FBF4E8", text: "#7A5518", border: "#E0C48A", name: "중간조" },
  REQ: { bg: "#FDE7F0", text: "#8B1A4A", border: "#EEA0BF", name: "신청 휴일" },
  OFF: { bg: "#F0F2F4", text: "#5E6673", border: "#CDD2D8", name: "일반 휴무" },
  HOL: { bg: "#FDF2DC", text: "#7A5800", border: "#E6C04A", name: "공휴일" },
  VAC: { bg: "#E6F4EF", text: "#18664A", border: "#88CCAE", name: "휴가" },
  SL:  { bg: "#F0E8F5", text: "#662288", border: "#C8A0E2", name: "여성보건휴가" },
  EDU: { bg: "#E8F3FA", text: "#1A5A8A", border: "#A8CEE8", name: "교육" },
  SICK:{ bg: "#FFF0E6", text: "#CC5500", border: "#FFB380", name: "병가" },
};

const WORK_CODES: ShiftCode[] = ["M07", "A13", "N22", "C08", "C09", "C10", "C11"];
const REST_CODES: ShiftCode[] = ["REQ", "OFF", "HOL", "VAC", "SL", "EDU", "SICK"];

const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];

/** 선택 가능한 칩 — 범례와 동일한 디자인 + 선택 상태 */
function SelectableChip({ 
  code, 
  isSelected, 
  onClick 
}: { 
  code: ShiftCode; 
  isSelected: boolean; 
  onClick: () => void 
}) {
  const s = SHIFT[code];
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        backgroundColor: isSelected ? s.bg : C.white,
        border: `${isSelected ? '2' : '1'}px solid ${isSelected ? s.border : C.border}`,
        borderRadius: 3,
        cursor: "pointer",
        transition: "all 0.12s",
        outline: "none",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = C.goldBg;
          e.currentTarget.style.borderColor = C.gold;
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = C.white;
          e.currentTarget.style.borderColor = C.border;
        }
      }}
    >
      {/* 선택 표시 */}
      {isSelected && (
        <span style={{ fontSize: 10, color: s.text, lineHeight: 1 }}>✓</span>
      )}
      
      {/* 코드 칩 — 범례와 동일 */}
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 18,
        flexShrink: 0,
        backgroundColor: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        borderRadius: 3,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: "0.02em",
        fontFamily: "'Inter', sans-serif",
      }}>
        {code}
      </span>
      
      {/* 이름 */}
      <span style={{
        fontSize: 10,
        color: isSelected ? s.text : C.charcoal,
        fontWeight: isSelected ? 600 : 400,
        whiteSpace: "nowrap",
        fontFamily: "'Inter', sans-serif",
      }}>
        {s.name}
      </span>
    </button>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  empName: string;
  day: number;
  currentCode: ShiftCode | null;
  onApply: (code: ShiftCode) => void;
}

export default function ScheduleAdjustModal({ open, onClose, empName, day, currentCode, onApply }: Props) {
  const lang = useLang();
  const t = DT[lang];
  
  const dow = DOW_KO[(day - 1) % 7];
  const isWeekend = ((day - 1) % 7 === 0) || ((day - 1) % 7 === 6);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        style={{
          maxWidth: 520,
          maxHeight: "calc(100vh - 48px)",
          padding: 0,
          backgroundColor: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          boxShadow: "0 8px 24px rgba(13, 27, 42, 0.12)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <DialogHeader
          style={{
            padding: "14px 20px",
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: "#FAFAF8",
            flexShrink: 0,
          }}
        >
          <DialogTitle
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: C.navy,
              fontFamily: "'Cormorant Garamond', serif",
              letterSpacing: "0.01em",
            }}
          >
            {t.schedAdjustTitle}
          </DialogTitle>
          <DialogDescription style={{ fontSize: 11, color: C.muted, marginTop: 4, fontFamily: "'Inter', sans-serif" }}>
            {empName} · 3월 {day}일 ({dow}){isWeekend && " · 주말"}
          </DialogDescription>
        </DialogHeader>

        {/* Body — scrollable */}
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
          {/* Current Assignment */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              {t.schedAdjustCurrent}
            </div>
            {currentCode && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", backgroundColor: SHIFT[currentCode].bg, border: `1px solid ${SHIFT[currentCode].border}`, borderRadius: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: SHIFT[currentCode].text, fontFamily: "'Inter', sans-serif" }}>
                  {currentCode}
                </span>
                <span style={{ fontSize: 11, color: SHIFT[currentCode].text, opacity: 0.8 }}>
                  {SHIFT[currentCode].name}
                </span>
              </div>
            )}
          </div>

          {/* Select New Code */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
              {t.schedAdjustSelectNew}
            </div>

            {/* Work Shifts */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: C.charcoal, marginBottom: 6 }}>
                {t.schedAdjustWorkShifts}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {WORK_CODES.map((code) => (
                  <SelectableChip
                    key={code}
                    code={code}
                    isSelected={code === currentCode}
                    onClick={() => onApply(code)}
                  />
                ))}
              </div>
            </div>

            {/* Rest Days */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, color: C.charcoal, marginBottom: 6 }}>
                {t.schedAdjustRestDays}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {REST_CODES.map((code) => (
                  <SelectableChip
                    key={code}
                    code={code}
                    isSelected={code === currentCode}
                    onClick={() => onApply(code)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Impact Analysis — compact */}
          <div style={{ padding: "12px 14px", backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
              {t.schedAdjustImpactTitle}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                t.schedAdjustCoverageChange,
                t.schedAdjustRolling14,
                t.schedAdjustNightRule,
                t.schedAdjustWeekendFairness,
              ].map((text, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <span style={{ fontSize: 12, color: C.ok, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 10.5, color: C.charcoal, lineHeight: 1.4, fontFamily: "'Inter', sans-serif" }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0, backgroundColor: "#FAFAF8" }}>
          <button
            onClick={onClose}
            style={{
              border: `1px solid ${C.border}`,
              backgroundColor: C.white,
              color: C.charcoal,
              borderRadius: 3,
              padding: "7px 16px",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {t.schedAdjustCancel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}