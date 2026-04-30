import type React from "react";

/* ══════════════════════════════════════════════════════════
   수요 예측 테이블 컴포넌트 - 완전히 새로 작성된 버전
══════════════════════════════════════════════════════════ */

const C = {
  navy:        "#0D1B2A",
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

interface DayData {
  day: number;
  dow: string;
  week: number;
  curBookCI: number;
  curBookCO: number;
  lyBookCI: number;
  lyBookCO: number;
  lyActualCI: number;
  lyActualCO: number;
  pickupCI: number;
  pickupCO: number;
  forecastCI: number;
  forecastCO: number;
  eventAdj: number;
  eventAdjCO: number;
  finalCI: number;
  finalCO: number;
  peakCI: boolean;
  peakCO: boolean;
  midShiftTimes: string[];
}

interface DemandForecastTableProps {
  data: DayData[];
  getHoliday: (day: number) => string;
  isSun: (day: number) => boolean;
  isSat: (day: number) => boolean;
}

function Badge({ label, variant }: { label: string; variant: "ok" | "warn" | "risk" | "gold" | "muted" }) {
  const map = {
    ok:    { bg: C.okBg,   color: C.ok,     border: C.okBorder },
    warn:  { bg: C.warnBg, color: C.warning, border: C.warnBorder },
    risk:  { bg: C.riskBg, color: C.risk,    border: C.riskBorder },
    gold:  { bg: C.goldBg, color: "#7A5518", border: C.goldBorder },
    muted: { bg: "#F0F2F4", color: C.muted,  border: "#CDD2D8" },
  };
  const s = map[variant];
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      fontSize: 9.5,
      fontWeight: 600,
      borderRadius: 3,
      backgroundColor: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {label}
    </span>
  );
}

export default function DemandForecastTable({ 
  data, 
  getHoliday, 
  isSun, 
  isSat 
}: DemandForecastTableProps) {
  // 컬럼 너비 정의
  const colWidth = {
    date: 130,
    booking: 58,    // 현재/전년 예약, 전년 실제
    small: 50,      // 픽업, 예측, 보정
    final: 54,      // 최종
    peak: 110,
    midShift: 150,
  };

  // 공통 스타일
  const headerGroupStyle: React.CSSProperties = {
    padding: "4px 8px 0",
    textAlign: "center",
    fontSize: 9.5,
    fontWeight: 600,
    color: C.muted,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    borderBottom: "none",
  };

  const headerDetailStyle: React.CSSProperties = {
    padding: "8px 8px",
    textAlign: "center",
    fontSize: 8.5,
    fontWeight: 600,
    color: C.muted,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    borderBottom: `2px solid ${C.border}`,
    borderRight: `1px solid ${C.borderLight}`,
  };

  const cellStyle: React.CSSProperties = {
    padding: "10px 8px",
    fontSize: 11.5,
    textAlign: "center",
    verticalAlign: "middle",
    borderBottom: `1px solid ${C.borderLight}`,
    borderRight: `1px solid ${C.borderLight}`,
  };

  return (
    <table style={{ 
      width: "100%", 
      borderCollapse: "collapse",
      minWidth: 1400,
    }}>
      <thead>
        {/* 1행: 그룹 헤더 */}
        <tr>
          {/* 날짜 (2행 병합) */}
          <th 
            rowSpan={2}
            style={{
              position: "sticky",
              left: 0,
              top: 0,
              zIndex: 100,
              width: colWidth.date,
              padding: "12px 12px",
              textAlign: "center",
              fontSize: 9.5,
              fontWeight: 600,
              color: C.muted,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              borderBottom: `2px solid ${C.border}`,
              borderRight: `1px solid ${C.border}`,
              backgroundColor: "#F7F4EF",
              boxShadow: "2px 0 4px rgba(0,0,0,0.05)",
            }}
          >
            날짜
          </th>

          {/* 체크인 (CI) 그룹 */}
          <th 
            colSpan={7}
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              ...headerGroupStyle,
              backgroundColor: "#F9F7F3",
              borderRight: `2px solid ${C.charcoal}`,
            }}
          >
            체크인 (CI)
          </th>

          {/* 체크아웃 (CO) 그룹 */}
          <th 
            colSpan={7}
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              ...headerGroupStyle,
              backgroundColor: "#F7F4EF",
              borderRight: `1px solid ${C.border}`,
            }}
          >
            체크아웃 (CO)
          </th>

          {/* 피크 (2행 병합) */}
          <th 
            rowSpan={2}
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              width: colWidth.peak,
              padding: "12px 12px",
              textAlign: "center",
              fontSize: 9.5,
              fontWeight: 600,
              color: C.muted,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              borderBottom: `2px solid ${C.border}`,
              borderRight: `1px solid ${C.border}`,
              backgroundColor: "#F7F4EF",
            }}
          >
            피크
          </th>

          {/* 중간조 배치 (2행 병합) */}
          <th 
            rowSpan={2}
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              width: colWidth.midShift,
              padding: "12px 12px",
              textAlign: "center",
              fontSize: 9.5,
              fontWeight: 600,
              color: C.muted,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              borderBottom: `2px solid ${C.border}`,
              backgroundColor: "#F7F4EF",
            }}
          >
            중간조 배치
          </th>
        </tr>

        {/* 2행: 세부 헤더 */}
        <tr>
          {/* 체크인 (CI) 세부 */}
          <th style={{ position: "sticky", top: 18, zIndex: 50, width: colWidth.booking, ...headerDetailStyle, backgroundColor: "#F9F7F3" }}>현재 예약</th>
          <th style={{ position: "sticky", top: 18, zIndex: 50, width: colWidth.booking, ...headerDetailStyle, backgroundColor: "#F9F7F3" }}>전년 예약</th>
          <th style={{ position: "sticky", top: 18, zIndex: 50, width: colWidth.booking, ...headerDetailStyle, backgroundColor: "#F9F7F3" }}>전년 실제</th>
          <th style={{ position: "sticky", top: 18, zIndex: 50, width: colWidth.small, ...headerDetailStyle, backgroundColor: "#F9F7F3" }}>픽업</th>
          <th style={{ position: "sticky", top: 18, zIndex: 50, width: colWidth.small, ...headerDetailStyle, backgroundColor: "#F9F7F3" }}>예측</th>
          <th style={{ position: "sticky", top: 18, zIndex: 50, width: colWidth.small, ...headerDetailStyle, backgroundColor: "#F9F7F3" }}>보정</th>
          <th style={{ position: "sticky", top: 18, zIndex: 50, width: colWidth.final, ...headerDetailStyle, backgroundColor: "#F9F7F3", borderRight: `2px solid ${C.charcoal}` }}>최종</th>

          {/* 체크아웃 (CO) 세부 */}
          <th style={{ position: "sticky", top: 18, zIndex: 50, width: colWidth.booking, ...headerDetailStyle, backgroundColor: "#F7F4EF" }}>현재 예약</th>
          <th style={{ position: "sticky", top: 18, zIndex: 50, width: colWidth.booking, ...headerDetailStyle, backgroundColor: "#F7F4EF" }}>전년 예약</th>
          <th style={{ position: "sticky", top: 18, zIndex: 50, width: colWidth.booking, ...headerDetailStyle, backgroundColor: "#F7F4EF" }}>전년 실제</th>
          <th style={{ position: "sticky", top: 18, zIndex: 50, width: colWidth.small, ...headerDetailStyle, backgroundColor: "#F7F4EF" }}>픽업</th>
          <th style={{ position: "sticky", top: 18, zIndex: 50, width: colWidth.small, ...headerDetailStyle, backgroundColor: "#F7F4EF" }}>예측</th>
          <th style={{ position: "sticky", top: 18, zIndex: 50, width: colWidth.small, ...headerDetailStyle, backgroundColor: "#F7F4EF" }}>보정</th>
          <th style={{ position: "sticky", top: 18, zIndex: 50, width: colWidth.final, ...headerDetailStyle, backgroundColor: "#F7F4EF", borderRight: `1px solid ${C.border}` }}>최종</th>
        </tr>
      </thead>

      <tbody>
        {data.map((row, i) => {
          const rowBg = i % 2 === 1 ? C.rowAlt : C.white;
          const dayBg = isSun(row.day) ? C.sunBg : isSat(row.day) ? C.satBg : rowBg;
          const holiday = getHoliday(row.day);

          return (
            <tr key={row.day} style={{ backgroundColor: dayBg }}>
              {/* 날짜 */}
              <td style={{
                position: "sticky",
                left: 0,
                zIndex: 10,
                width: colWidth.date,
                padding: "10px 12px",
                textAlign: "center",
                fontSize: 11.5,
                fontWeight: 600,
                color: C.charcoal,
                backgroundColor: dayBg,
                borderBottom: `1px solid ${C.borderLight}`,
                borderRight: `1px solid ${C.border}`,
                boxShadow: "2px 0 4px rgba(0,0,0,0.05)",
              }}>
                <div>4월 {row.day}일 ({row.dow})</div>
                {holiday && (
                  <div style={{ fontSize: 9, color: C.risk, fontWeight: 500, marginTop: 2 }}>
                    {holiday}
                  </div>
                )}
              </td>

              {/* 체크인 (CI) 데이터 */}
              <td style={{ width: colWidth.booking, ...cellStyle, color: C.charcoal }}>{row.curBookCI}</td>
              <td style={{ width: colWidth.booking, ...cellStyle, color: C.muted }}>{row.lyBookCI}</td>
              <td style={{ width: colWidth.booking, ...cellStyle, color: C.muted }}>{row.lyActualCI}</td>
              <td style={{ width: colWidth.small, ...cellStyle, fontWeight: 600, color: C.ok }}>+{row.pickupCI}</td>
              <td style={{ width: colWidth.small, ...cellStyle, fontWeight: 600, color: C.navy }}>{row.forecastCI}</td>
              <td style={{ width: colWidth.small, ...cellStyle }}>
                {row.eventAdj > 0 ? <Badge label={`+${row.eventAdj}`} variant="gold" /> : <span style={{ color: C.muted, fontSize: 10 }}>—</span>}
              </td>
              <td style={{ width: colWidth.final, ...cellStyle, fontSize: 12.5, fontWeight: 600, color: C.navy, borderRight: `2px solid ${C.charcoal}` }}>{row.finalCI}</td>

              {/* 체크아웃 (CO) 데이터 */}
              <td style={{ width: colWidth.booking, ...cellStyle, color: C.charcoal }}>{row.curBookCO}</td>
              <td style={{ width: colWidth.booking, ...cellStyle, color: C.muted }}>{row.lyBookCO}</td>
              <td style={{ width: colWidth.booking, ...cellStyle, color: C.muted }}>{row.lyActualCO}</td>
              <td style={{ width: colWidth.small, ...cellStyle, fontWeight: 600, color: C.ok }}>+{row.pickupCO}</td>
              <td style={{ width: colWidth.small, ...cellStyle, fontWeight: 600, color: C.navy }}>{row.forecastCO}</td>
              <td style={{ width: colWidth.small, ...cellStyle }}>
                {row.eventAdjCO > 0 ? <Badge label={`+${row.eventAdjCO}`} variant="gold" /> : <span style={{ color: C.muted, fontSize: 10 }}>—</span>}
              </td>
              <td style={{ width: colWidth.final, ...cellStyle, fontSize: 12.5, fontWeight: 600, color: C.navy, borderRight: `1px solid ${C.border}` }}>{row.finalCO}</td>

              {/* 피크 */}
              <td style={{ width: colWidth.peak, ...cellStyle, borderRight: `1px solid ${C.border}` }}>
                {row.peakCI && row.peakCO ? <Badge label="CI·CO 피크" variant="risk" /> : row.peakCI ? <Badge label="CI 피크" variant="risk" /> : row.peakCO ? <Badge label="CO 피크" variant="warn" /> : <span style={{ color: C.muted, fontSize: 10 }}>—</span>}
              </td>

              {/* 중간조 배치 */}
              <td style={{ width: colWidth.midShift, padding: "10px 12px", textAlign: "center", fontSize: 11, fontWeight: 600, color: row.midShiftTimes.length > 0 ? C.ok : C.muted, borderBottom: `1px solid ${C.borderLight}` }}>
                {row.midShiftTimes.length > 0 ? (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
                    {row.midShiftTimes.map((time, idx) => (
                      <span key={idx} style={{ 
                        fontSize: 10, 
                        fontWeight: 600,
                        backgroundColor: C.okBg,
                        color: C.ok,
                        padding: "2px 6px",
                        borderRadius: 2,
                        border: `1px solid ${C.okBorder}`,
                        whiteSpace: "nowrap"
                      }}>
                        {time}
                      </span>
                    ))}
                  </div>
                ) : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}