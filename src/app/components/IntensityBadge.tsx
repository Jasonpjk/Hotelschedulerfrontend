/* ══════════════════════════════════════════════════════════
   근무강도 배지 컴포넌트
   - 근무표 직원 이름 옆에 표시
   - 회복 등급별 색상 구분
   - 호버 시 상세 정보 툴팁
══════════════════════════════════════════════════════════ */

import { useState } from "react";
import type { IntensityAnalysis } from "../utils/scheduleIntensity";

const C = {
  navy:        "#0D1B2A",
  gold:        "#B99B5A",
  bg:          "#F2EFE9",
  white:       "#FFFFFF",
  border:      "#E4DED4",
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

interface IntensityBadgeProps {
  analysis: IntensityAnalysis;
}

export default function IntensityBadge({ analysis }: IntensityBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getGradeStyle = () => {
    if (analysis.recoveryGrade === "회복 필요") {
      return { bg: C.riskBg, border: C.riskBorder, text: C.risk };
    }
    if (analysis.recoveryGrade === "주의") {
      return { bg: C.warnBg, border: C.warnBorder, text: C.warning };
    }
    return { bg: C.okBg, border: C.okBorder, text: C.ok };
  };

  const style = getGradeStyle();

  // 일반 등급은 배지 표시 안 함
  if (analysis.recoveryGrade === "일반") {
    return null;
  }

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 6px",
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 3,
        fontSize: 9,
        fontWeight: 600,
        color: style.text,
        cursor: "pointer",
      }}>
        {analysis.recoveryGrade === "회복 필요" ? "회복" : "주의"}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: C.navy,
          color: "#EAE0CC",
          padding: "10px 12px",
          borderRadius: 4,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          fontSize: 10,
          lineHeight: 1.6,
          whiteSpace: "nowrap",
          zIndex: 10000,
          minWidth: 200,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 11 }}>
            전월 근무강도: {analysis.monthlyIntensityScore}점
          </div>
          <div style={{ fontSize: 9, color: "#B5BCC4" }}>
            • 5일 연속 근무: {analysis.consecutive5DayCount}회<br/>
            • 6일 이상 연속: {analysis.consecutive6PlusCount}회<br/>
            • A13→M07 전환: {analysis.lateToEarlyCount}회<br/>
            • 야간조 빠른 전환: {analysis.nightToGeneralFastTransition}회
          </div>
          {/* Arrow */}
          <div style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `6px solid ${C.navy}`,
          }}/>
        </div>
      )}
    </div>
  );
}
