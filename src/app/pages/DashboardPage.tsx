import { useState } from "react";
import { useNavigate } from "react-router";
import AppLayout from "../components/layout/AppLayout";
import { useAppContext, selectFairnessSummary, selectRiskWarningCount } from "../context/AppContext";
import type { FairnessIssueCategory } from "../context/AppContext";

/* ══════════════════════════════════════════════════════════
   COLOR TOKENS
══════════════════════════════════════════════════════════ */
const C = {
  navy:         "#0D1B2A",
  navyDeep:     "#091523",
  gold:         "#B99B5A",
  goldBg:       "rgba(185,155,90,0.08)",
  goldBorder:   "rgba(185,155,90,0.25)",
  bg:           "#F2EFE9",
  white:        "#FFFFFF",
  border:       "#E4DED4",
  borderLight:  "#EDE8E0",
  muted:        "#7B8390",
  charcoal:     "#2E3642",
  text:         "#1C2430",
  ok:           "#2E7D52",
  okBg:         "rgba(46,125,82,0.07)",
  okBorder:     "rgba(46,125,82,0.2)",
  warning:      "#B87C1A",
  warnBg:       "rgba(184,124,26,0.08)",
  warnBorder:   "rgba(184,124,26,0.22)",
  pending:      "#5E7FA3",
  pendingBg:    "rgba(94,127,163,0.08)",
  pendingBorder:"rgba(94,127,163,0.22)",
  risk:         "#B83232",
  riskBg:       "rgba(184,50,50,0.06)",
  riskBorder:   "rgba(184,50,50,0.22)",
};

/* ══════════════════════════════════════════════════════════
   UTILITY COMPONENTS
══════════════════════════════════════════════════════════ */
function Badge({ label, variant }: { label: string; variant: "complete" | "progress" | "review" | "notstarted" | "risk" }) {
  const map = {
    complete:   { bg: C.okBg,      color: C.ok,      border: C.okBorder },
    progress:   { bg: C.pendingBg, color: C.pending,  border: C.pendingBorder },
    review:     { bg: C.warnBg,    color: C.warning,  border: C.warnBorder },
    notstarted: { bg: C.bg,        color: C.muted,    border: C.border },
    risk:       { bg: C.riskBg,    color: C.risk,     border: C.riskBorder },
  };
  const s = map[variant];
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: 3,
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      backgroundColor: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const navigate = useNavigate();

  /* ── context에서 모든 운영 데이터 읽기 ─────────────── */
  const {
    selectedHotel,
    targetMonth,
    scheduleVersion,
    scheduleStatus,
    employeeConfirmed,
    demandForecastConfirmed,
    lastUpdatedAt,
    attendanceStats,
    demandToday,
    riskDaysCount,
    employeeCounts,
    scheduleWarnings,
    changeLogs,
    fairnessIssues,
  } = useAppContext();

  /* ── 파생값 계산 (selector) ─────────────────────────── */
  const fairnessSummary = selectFairnessSummary(fairnessIssues);
  const riskWarningCount = selectRiskWarningCount(scheduleWarnings);

  /* ── 로컬 UI 상태 ─────────────────────────────────── */
  const [newVersionModal, setNewVersionModal]   = useState(false);
  const [newVersionStep,  setNewVersionStep]    = useState<"confirm" | "generating" | "done">("confirm");
  const [downloadModal,   setDownloadModal]     = useState(false);
  const [historyModal,    setHistoryModal]      = useState(false);
  const [fairnessModal,   setFairnessModal]     = useState(false);
  const [fairnessFilter,  setFairnessFilter]    = useState<"전체" | FairnessIssueCategory>("전체");

  /* ── 날짜 포맷 ───────────────────────────────────── */
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    return `${year}년 ${parseInt(month)}월`;
  };

  /* ── 새 버전 생성 핸들러 ──────────────────────────── */
  const handleNewVersionConfirm = () => {
    setNewVersionStep("generating");
    setTimeout(() => setNewVersionStep("done"), 1800);
  };

  const handleNewVersionClose = () => {
    setNewVersionModal(false);
    setNewVersionStep("confirm");
  };

  /* ── 운영 진행 단계 상태 계산 ────────────────────── */
  const step3Status: "complete" | "review" | "progress" =
    attendanceStats.reviewNeeded === 0 && attendanceStats.notReflected === 0
      ? "complete"
      : attendanceStats.reviewNeeded > 0 || attendanceStats.notReflected > 0
        ? "review"
        : "progress";

  const step4Status: "complete" | "progress" =
    scheduleStatus === "확정" ? "complete" : "progress";

  /* ── 버전 넘버 증분 (새 버전 모달용) ──────────────── */
  const nextVersion = (() => {
    const match = scheduleVersion.match(/v(\d+)\.(\d+)/);
    if (!match) return scheduleVersion + ".1";
    return `v${match[1]}.${parseInt(match[2]) + 1}`;
  })();

  return (
    <AppLayout>
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: C.bg,
      }}>

        {/* ══════════════════════════════════════════════════
           상단 상태 바  ← AppContext 전역값 직접 표시
        ══════════════════════════════════════════════════ */}
        <div style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.border}`,
          padding: "16px 40px",
          flexShrink: 0,
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 24,
            fontSize: 11,
          }}>
            <div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>선택 호텔</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{selectedHotel}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>대상 월</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{formatMonth(targetMonth)}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>근무표 버전</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{scheduleVersion}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>근무표 상태</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: scheduleStatus === "확정" ? C.ok : C.warning }}>{scheduleStatus}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>직원 기준</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: employeeConfirmed ? C.ok : C.muted }}>
                {employeeConfirmed ? "확정 완료" : "확정 필요"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>수요 예측</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: demandForecastConfirmed ? C.ok : C.muted }}>
                {demandForecastConfirmed ? "반영 완료" : "검토 필요"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>마지막 반영</div>
              <div style={{ fontSize: 11, color: C.charcoal }}>{lastUpdatedAt}</div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
           메인 콘텐츠
        ══════════════════════════════════════════════════ */}
        <div style={{ flex: 1, overflow: "auto", padding: "32px 40px" }}>

          {/* KPI 요약 카드 6개  ← context 값 사용 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16, marginBottom: 28 }}>

            {/* 오늘 체크인 ← demandToday.checkin */}
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 18px", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = C.gold}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 9, letterSpacing: "0.08em", color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>오늘 체크인</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.navy, lineHeight: 1, marginBottom: 6 }}>{demandToday.checkin}</div>
              <div style={{ fontSize: 10, color: C.muted }}>예상 객실</div>
            </div>

            {/* 오늘 체크아웃 ← demandToday.checkout */}
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 18px", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = C.gold}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 9, letterSpacing: "0.08em", color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>오늘 체크아웃</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.navy, lineHeight: 1, marginBottom: 6 }}>{demandToday.checkout}</div>
              <div style={{ fontSize: 10, color: C.muted }}>예상 객실</div>
            </div>

            {/* 리스크 일수 ← riskDaysCount (운영 경고 위험 건 기반) */}
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 18px", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = C.risk}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 9, letterSpacing: "0.08em", color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>리스크 일수</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.risk, lineHeight: 1, marginBottom: 6 }}>{riskDaysCount}</div>
              <div style={{ fontSize: 10, color: C.risk }}>이번 주</div>
            </div>

            {/* 근태 검토 ← attendanceStats.reviewNeeded */}
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 18px", cursor: "pointer", transition: "all 0.15s" }}
              onClick={() => navigate("/attendance")}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = C.warning}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 9, letterSpacing: "0.08em", color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>근태 검토</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.warning, lineHeight: 1, marginBottom: 6 }}>{attendanceStats.reviewNeeded}</div>
              <div style={{ fontSize: 10, color: C.warning }}>검토 필요 건</div>
            </div>

            {/* 미반영 직원 ← attendanceStats.notReflected */}
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 18px", cursor: "pointer", transition: "all 0.15s" }}
              onClick={() => navigate("/employees")}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = C.warning}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 9, letterSpacing: "0.08em", color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>미반영 직원</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.warning, lineHeight: 1, marginBottom: 6 }}>{attendanceStats.notReflected}</div>
              <div style={{ fontSize: 10, color: C.warning }}>근무표 미반영</div>
            </div>

            {/* 승인 대기 ← attendanceStats.pendingApproval */}
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 18px", cursor: "pointer", transition: "all 0.15s" }}
              onClick={() => navigate("/settings")}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = C.pending}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 9, letterSpacing: "0.08em", color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>승인 대기</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.pending, lineHeight: 1, marginBottom: 6 }}>{attendanceStats.pendingApproval}</div>
              <div style={{ fontSize: 10, color: C.pending }}>회원가입 대기</div>
            </div>
          </div>

          {/* 운영 진행 단계 + 운영 경고 요약 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

            {/* 운영 진행 단계  ← context 상태 기반 */}
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px 26px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 18, fontFamily: "'Cormorant Garamond', serif" }}>
                운영 진행 단계
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* 1단계 — 직원 기준 확정 ← employeeConfirmed */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                  backgroundColor: employeeConfirmed ? C.okBg : C.warnBg,
                  border: `1px solid ${employeeConfirmed ? C.okBorder : C.warnBorder}`,
                  borderRadius: 3, cursor: "pointer",
                }} onClick={() => navigate("/employees")}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    backgroundColor: employeeConfirmed ? C.ok : C.warning,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {employeeConfirmed ? <CheckIcon /> : <span style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>!</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: employeeConfirmed ? C.ok : C.warning, marginBottom: 2 }}>1. 직원 관리 기준 확정</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{employeeCounts.total}명 · {employeeConfirmed ? "조 배치 완료" : "확정 필요"}</div>
                  </div>
                  <Badge label={employeeConfirmed ? "완료" : "검토 필요"} variant={employeeConfirmed ? "complete" : "review"} />
                </div>

                {/* 2단계 — 수요 예측 확정 ← demandForecastConfirmed */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                  backgroundColor: demandForecastConfirmed ? C.okBg : C.warnBg,
                  border: `1px solid ${demandForecastConfirmed ? C.okBorder : C.warnBorder}`,
                  borderRadius: 3, cursor: "pointer",
                }} onClick={() => navigate("/demand")}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    backgroundColor: demandForecastConfirmed ? C.ok : C.warning,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {demandForecastConfirmed ? <CheckIcon /> : <span style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>!</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: demandForecastConfirmed ? C.ok : C.warning, marginBottom: 2 }}>2. 수요 예측 결과 확정</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{formatMonth(targetMonth)} · {demandForecastConfirmed ? "최신 상태" : "검토 필요"}</div>
                  </div>
                  <Badge label={demandForecastConfirmed ? "완료" : "검토 필요"} variant={demandForecastConfirmed ? "complete" : "review"} />
                </div>

                {/* 3단계 — 근태 반영 검토 ← attendanceStats */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                  backgroundColor: step3Status === "complete" ? C.okBg : C.warnBg,
                  border: `1px solid ${step3Status === "complete" ? C.okBorder : C.warnBorder}`,
                  borderRadius: 3, cursor: "pointer",
                }} onClick={() => navigate("/attendance")}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    backgroundColor: step3Status === "complete" ? C.ok : C.warning,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {step3Status === "complete" ? <CheckIcon /> : <span style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>!</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: step3Status === "complete" ? C.ok : C.warning, marginBottom: 2 }}>3. 근태 신청 자동 반영 검토</div>
                    <div style={{ fontSize: 10, color: C.charcoal }}>
                      {attendanceStats.reviewNeeded > 0 || attendanceStats.notReflected > 0
                        ? `검토 필요 ${attendanceStats.reviewNeeded}건 · 미반영 직원 ${attendanceStats.notReflected}명`
                        : "모든 신청 반영 완료"}
                    </div>
                  </div>
                  <Badge label={step3Status === "complete" ? "완료" : "검토 필요"} variant={step3Status === "complete" ? "complete" : "review"} />
                </div>

                {/* 4단계 — 근무표 최종 확정 ← scheduleStatus */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                  backgroundColor: step4Status === "complete" ? C.okBg : C.pendingBg,
                  border: `1px solid ${step4Status === "complete" ? C.okBorder : C.pendingBorder}`,
                  borderRadius: 3, cursor: "pointer",
                }} onClick={() => navigate("/schedule")}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    backgroundColor: step4Status === "complete" ? C.ok : C.pending,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {step4Status === "complete"
                      ? <CheckIcon />
                      : <span style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>4</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: step4Status === "complete" ? C.ok : C.pending, marginBottom: 2 }}>4. 근무표 최종 확정</div>
                    <div style={{ fontSize: 10, color: C.charcoal }}>{scheduleVersion} {step4Status === "complete" ? "확정 완료" : "작업 중 · 확정 필요"}</div>
                  </div>
                  <Badge label={step4Status === "complete" ? "완료" : "진행 중"} variant={step4Status === "complete" ? "complete" : "progress"} />
                </div>
              </div>
            </div>

            {/* 운영 경고 요약  ← scheduleWarnings (context) */}
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: "24px 26px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                  운영 경고 요약
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  backgroundColor: C.riskBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: C.risk,
                }}>{riskWarningCount}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {scheduleWarnings.slice(0, 4).map((w, idx) => (
                  <div key={w.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "12px 0",
                    borderBottom: idx < Math.min(scheduleWarnings.length, 4) - 1 ? `1px solid ${C.borderLight}` : "none",
                  }}>
                    {w.severity === "risk" ? <WarnIcon /> : <AlertIcon />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11.5, color: C.charcoal, marginBottom: 3 }}>{w.description}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{w.detail}</div>
                    </div>
                    <Badge label={w.severity === "risk" ? "위험" : "검토"} variant={w.severity === "risk" ? "risk" : "review"} />
                  </div>
                ))}
                {scheduleWarnings.length === 0 && (
                  <div style={{ padding: "24px 0", textAlign: "center" as const, fontSize: 12, color: C.muted }}>
                    운영 경고 없음
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              공정성 리포트  ← fairnessIssues (context)
          ══════════════════════════════════════════ */}
          <div style={{
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            padding: "24px 26px",
            marginBottom: 16,
          }}>
            {/* 헤더 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                  공정성 리포트
                </div>
                {fairnessIssues.filter((i) => i.severity === "위험").length > 0 && (
                  <span style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const,
                    padding: "2px 8px", backgroundColor: C.riskBg, color: C.risk,
                    border: `1px solid ${C.riskBorder}`, borderRadius: 3,
                  }}>
                    {fairnessIssues.filter((i) => i.severity === "위험").length}건 위험
                  </span>
                )}
                <span style={{ fontSize: 10, color: C.muted }}>
                  {formatMonth(targetMonth)} · {selectedHotel}
                </span>
              </div>
              <button
                onClick={() => { setFairnessFilter("전체"); setFairnessModal(true); }}
                style={{ fontSize: 10, color: C.gold, backgroundColor: "transparent", border: "none", cursor: "pointer", fontWeight: 500, padding: "4px 8px", borderRadius: 3, transition: "all 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A5518"; (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.goldBg; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.gold; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              >
                전체보기 →
              </button>
            </div>

            {/* 요약 카드 6개 ← selectFairnessSummary(fairnessIssues) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 22 }}>
              {fairnessSummary.map((item) => {
                const sev = item.severity;
                const sevColor  = sev === "위험" ? C.risk    : sev === "검토" ? C.warning : C.ok;
                const sevBg     = sev === "위험" ? C.riskBg  : sev === "검토" ? C.warnBg  : C.okBg;
                const sevBorder = sev === "위험" ? C.riskBorder : sev === "검토" ? C.warnBorder : C.okBorder;
                return (
                  <div
                    key={item.label}
                    onClick={() => { setFairnessFilter(item.category); setFairnessModal(true); }}
                    style={{ padding: "14px 12px", backgroundColor: sevBg, border: `1px solid ${sevBorder}`, borderRadius: 3, cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLDivElement).style.opacity = "0.8"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLDivElement).style.opacity = "1"}
                  >
                    <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.05em", color: sevColor, marginBottom: 8, lineHeight: 1.4 }}>
                      {item.label.toUpperCase()}
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: sevColor, lineHeight: 1, marginBottom: 4 }}>
                      {item.value}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 2 }}>{item.unit}</span>
                    </div>
                    <div style={{ fontSize: 9, color: sevColor, lineHeight: 1.4, opacity: 0.8 }}>
                      {item.description}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 구분선 */}
            <div style={{ borderTop: `1px solid ${C.borderLight}`, marginBottom: 16 }} />

            {/* 상세 리스트 상위 5건 */}
            {fairnessIssues.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center" as const }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 6 }}>공정성 이슈 없음</div>
                <div style={{ fontSize: 11, color: C.muted }}>현재 근무표에서 주요 공정성 편중이 발견되지 않았습니다.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {fairnessIssues.slice(0, 5).map((issue, idx) => {
                  const sev = issue.severity;
                  const sevColor  = sev === "위험" ? C.risk    : sev === "검토" ? C.warning : C.ok;
                  const sevBg     = sev === "위험" ? C.riskBg  : sev === "검토" ? C.warnBg  : C.okBg;
                  const sevBorder = sev === "위험" ? C.riskBorder : sev === "검토" ? C.warnBorder : C.okBorder;
                  return (
                    <div key={issue.id} style={{
                      display: "grid",
                      gridTemplateColumns: "130px 120px 1fr 160px 120px",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 0",
                      borderBottom: idx < fairnessIssues.slice(0, 5).length - 1 ? `1px solid ${C.borderLight}` : "none",
                    }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{issue.employeeName}</div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{issue.grade} · {issue.shift}</div>
                      </div>
                      <div>
                        <span style={{ display: "inline-block", padding: "3px 8px", fontSize: 9, fontWeight: 600, letterSpacing: "0.04em", backgroundColor: sevBg, color: sevColor, border: `1px solid ${sevBorder}`, borderRadius: 3, whiteSpace: "nowrap" as const }}>
                          {issue.issueType}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: C.charcoal, marginBottom: 2 }}>{issue.description}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{issue.targetPeriod} · {issue.count}</div>
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>{issue.recommendation}</div>
                      <div style={{ textAlign: "right" as const }}>
                        <button
                          title="근무표의 공정성/편중 패널에서 해당 직원 이슈를 확인합니다."
                          onClick={() => navigate("/schedule", {
                            state: {
                              fairnessNavigation: {
                                employeeName: issue.employeeName,
                                issueType: issue.issueType,
                                issueId: issue.id,
                                severity: issue.severity,
                                source: "dashboardFairnessReport",
                              },
                            },
                          })}
                          style={{ padding: "6px 12px", fontSize: 10, fontWeight: 600, backgroundColor: "transparent", border: `1px solid ${C.border}`, borderRadius: 3, color: C.charcoal, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" as const }}
                          onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = C.navy; el.style.color = C.navy; el.style.backgroundColor = C.bg; }}
                          onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = C.border; el.style.color = C.charcoal; el.style.backgroundColor = "transparent"; }}
                        >
                          근무표에서 보기 →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {fairnessIssues.length > 5 && (
              <div style={{ marginTop: 14, textAlign: "center" as const }}>
                <button
                  onClick={() => { setFairnessFilter("전체"); setFairnessModal(true); }}
                  style={{ fontSize: 10, color: C.muted, backgroundColor: "transparent", border: `1px solid ${C.border}`, borderRadius: 3, padding: "7px 20px", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.color = C.navy; el.style.borderColor = C.navy; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.color = C.muted; el.style.borderColor = C.border; }}
                >
                  나머지 {fairnessIssues.length - 5}건 더보기 →
                </button>
              </div>
            )}
          </div>

          {/* 중간 3열 주요 블록 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>

            {/* 근무표 상태 카드  ← scheduleVersion, scheduleStatus, employeeCounts */}
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: "22px 24px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 16, fontFamily: "'Cormorant Garamond', serif" }}>
                근무표 상태
              </div>
              <div style={{ padding: "14px 16px", backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 3, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>현재 버전</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{scheduleVersion}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>상태</span>
                  <Badge label={scheduleStatus === "확정" ? "확정" : "작업 중"} variant={scheduleStatus === "확정" ? "complete" : "progress"} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>AI 조정 이력</span>
                  <span style={{ fontSize: 11, color: C.charcoal }}>{employeeCounts.aiAdjustments}회</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, color: C.muted }}>최근 수정</span>
                  <span style={{ fontSize: 10, color: C.charcoal }}>{lastUpdatedAt}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => navigate("/schedule")}
                  style={{ padding: "9px 16px", backgroundColor: C.navy, color: "#EAE0CC", border: "none", borderRadius: 3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
                >
                  보기
                </button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    onClick={() => { setNewVersionStep("confirm"); setNewVersionModal(true); }}
                    style={{ padding: "8px 12px", backgroundColor: C.white, color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 10, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.navy; (e.currentTarget as HTMLButtonElement).style.color = C.navy; (e.currentTarget as HTMLButtonElement).style.fontWeight = "600"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = C.charcoal; (e.currentTarget as HTMLButtonElement).style.fontWeight = "500"; }}
                  >
                    새 버전
                  </button>
                  <button
                    onClick={() => setDownloadModal(true)}
                    style={{ padding: "8px 12px", backgroundColor: C.white, color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 10, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.gold; (e.currentTarget as HTMLButtonElement).style.color = "#7A5518"; (e.currentTarget as HTMLButtonElement).style.fontWeight = "600"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.color = C.charcoal; (e.currentTarget as HTMLButtonElement).style.fontWeight = "500"; }}
                  >
                    다운로드
                  </button>
                </div>
              </div>
            </div>

            {/* 근태 신청/반영 요약  ← attendanceStats */}
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                  근태 신청/반영
                </div>
                <button
                  onClick={() => navigate("/attendance")}
                  style={{ fontSize: 10, color: C.gold, backgroundColor: "transparent", border: "none", cursor: "pointer", fontWeight: 500 }}
                >
                  상세 →
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: C.muted }}>자동 반영 완료</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.ok }}>{attendanceStats.autoCompleted}건</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: C.muted }}>검토 필요</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.warning }}>{attendanceStats.reviewNeeded}건</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: C.muted }}>반영 안 된 직원</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.charcoal }}>{attendanceStats.notReflected}명</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: C.muted }}>승인 대기</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.pending }}>{attendanceStats.pendingApproval}건</span>
                </div>
              </div>
              {attendanceStats.reviewNeeded > 0 && (
                <div style={{ padding: "10px 12px", backgroundColor: C.warnBg, border: `1px solid ${C.warnBorder}`, borderRadius: 3 }}>
                  <div style={{ fontSize: 10, color: C.warning, lineHeight: 1.6 }}>
                    검토 필요 {attendanceStats.reviewNeeded}건을 확인하여 근무표에 반영하세요.
                  </div>
                </div>
              )}
            </div>

            {/* 수요 예측 & 직원 관리  ← demandToday, employeeCounts */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>수요 예측</div>
                  <button
                    onClick={() => navigate("/demand")}
                    style={{ fontSize: 10, color: C.gold, backgroundColor: "transparent", border: "none", cursor: "pointer", fontWeight: 500 }}
                  >
                    상세 →
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: C.muted }}>피크 체크인일</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.navy }}>{demandToday.peakCheckinDate}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: C.muted }}>피크 체크아웃일</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.navy }}>{demandToday.peakCheckoutDate}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: C.muted }}>최근 예측 갱신</span>
                    <span style={{ fontSize: 10, color: C.charcoal }}>{demandToday.lastForecastDate}</span>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>직원 관리</div>
                  <button
                    onClick={() => navigate("/employees")}
                    style={{ fontSize: 10, color: C.gold, backgroundColor: "transparent", border: "none", cursor: "pointer", fontWeight: 500 }}
                  >
                    상세 →
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: C.muted }}>총 직원 수</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>{employeeCounts.total}명</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: C.muted }}>인차지</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>{employeeCounts.incharge}명</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: C.muted }}>기준 상태</span>
                    <Badge label={employeeConfirmed ? "확정" : "미확정"} variant={employeeConfirmed ? "complete" : "review"} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 최근 변경 이력  ← changeLogs (context) */}
          <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, padding: "22px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                최근 변경 이력
              </div>
              <button
                onClick={() => setHistoryModal(true)}
                style={{ fontSize: 10, color: C.gold, backgroundColor: "transparent", border: "none", cursor: "pointer", fontWeight: 500, padding: "4px 8px", borderRadius: 3, transition: "all 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#7A5518"; (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.goldBg; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.gold; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              >
                전체보기 →
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>작업 유형</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>대상</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>작업자</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>시각</th>
                </tr>
              </thead>
              <tbody>
                {changeLogs.slice(0, 5).map((log, i) => (
                  <tr key={i} style={{ borderBottom: i < 4 ? `1px solid ${C.borderLight}` : "none" }}>
                    <td style={{ padding: "10px 12px", fontSize: 11, color: C.charcoal }}>
                      <span style={{ display: "inline-flex", padding: "2px 8px", backgroundColor: log.typeBg, color: log.typeColor, borderRadius: 2, fontSize: 9, fontWeight: 600 }}>{log.type}</span>
                    </td>
                    <td style={{ padding: "10px 12px", fontSize: 11, color: C.charcoal }}>{log.target}</td>
                    <td style={{ padding: "10px 12px", fontSize: 11, color: C.muted }}>{log.actor}</td>
                    <td style={{ padding: "10px 12px", fontSize: 11, color: C.muted, textAlign: "right" }}>{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
         새 버전 생성 모달
      ══════════════════════════════════════════════════ */}
      {newVersionModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, width: 480, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAF8" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif", marginBottom: 4 }}>근무표 새 버전 생성</div>
              <div style={{ fontSize: 11, color: C.muted }}>{formatMonth(targetMonth)} · {selectedHotel}</div>
            </div>
            <div style={{ padding: "24px" }}>
              {newVersionStep === "confirm" && (
                <>
                  <div style={{ padding: "16px", backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 3, marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: C.muted }}>현재 버전</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>{scheduleVersion}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: C.muted }}>생성될 버전</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.pending }}>{nextVersion}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: C.muted }}>대상 월</span>
                      <span style={{ fontSize: 11, color: C.charcoal }}>{formatMonth(targetMonth)}</span>
                    </div>
                  </div>
                  <div style={{ padding: "12px", backgroundColor: C.pendingBg, border: `1px solid ${C.pendingBorder}`, borderRadius: 3, marginBottom: 24, fontSize: 10, color: C.pending, lineHeight: 1.7 }}>
                    {scheduleVersion} 기준 데이터를 복사하여 새 버전({nextVersion})을 생성합니다.<br />
                    기존 {scheduleVersion}은 유지되며, 새 버전에서 수정 작업을 이어갈 수 있습니다.
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button onClick={handleNewVersionClose} style={{ padding: "8px 18px", backgroundColor: C.white, color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 12, cursor: "pointer" }}>취소</button>
                    <button onClick={handleNewVersionConfirm} style={{ padding: "8px 20px", backgroundColor: C.navy, color: "#EAE0CC", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>새 버전 생성</button>
                  </div>
                </>
              )}
              {newVersionStep === "generating" && (
                <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                  <div style={{ fontSize: 13, color: C.navy, fontWeight: 600, marginBottom: 10 }}>{nextVersion} 생성 중...</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 28 }}>{scheduleVersion} 데이터를 기반으로 새 버전을 준비하고 있습니다.</div>
                  <div style={{ width: "100%", height: 4, backgroundColor: C.bg, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: "65%", height: "100%", backgroundColor: C.pending, borderRadius: 2 }} />
                  </div>
                </div>
              )}
              {newVersionStep === "done" && (
                <>
                  <div style={{ textAlign: "center", paddingBottom: 24 }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: C.okBg, border: `1px solid ${C.okBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.ok} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>{nextVersion}가 생성되었습니다</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{formatMonth(targetMonth)} 근무표 새 버전이 준비되었습니다.</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button onClick={handleNewVersionClose} style={{ padding: "8px 18px", backgroundColor: C.white, color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 12, cursor: "pointer" }}>닫기</button>
                    <button onClick={() => { handleNewVersionClose(); navigate("/schedule"); }} style={{ padding: "8px 20px", backgroundColor: C.navy, color: "#EAE0CC", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>근무표로 이동 →</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
         다운로드 모달
      ══════════════════════════════════════════════════ */}
      {downloadModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, width: 460, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAF8" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif", marginBottom: 4 }}>근무표 다운로드</div>
              <div style={{ fontSize: 11, color: C.muted }}>{formatMonth(targetMonth)} · {selectedHotel}</div>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ padding: "14px 16px", backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 3, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>대상 월</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>{formatMonth(targetMonth)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>현재 버전</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>{scheduleVersion}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, color: C.muted }}>근무표 상태</span>
                  <Badge label={scheduleStatus === "확정" ? "확정" : "작업 중"} variant={scheduleStatus === "확정" ? "complete" : "progress"} />
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 10 }}>다운로드 형식</div>
                <div style={{ padding: "14px 16px", backgroundColor: C.goldBg, border: `1.5px solid ${C.goldBorder}`, borderRadius: 3, display: "flex", alignItems: "center", gap: 14, cursor: "default" }}>
                  <div style={{ width: 36, height: 36, backgroundColor: "#1D6F42", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em" }}>XLS</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 3 }}>Excel (.xlsx)</div>
                    <div style={{ fontSize: 10, color: C.muted }}>근무표 전체 · 조별 시트 포함</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ok} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setDownloadModal(false)} style={{ padding: "8px 18px", backgroundColor: C.white, color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 12, cursor: "pointer" }}>취소</button>
                <button
                  onClick={() => setDownloadModal(false)}
                  style={{ padding: "8px 24px", backgroundColor: C.navy, color: "#EAE0CC", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  다운로드
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
         전체 변경 이력 모달  ← changeLogs (context)
      ══════════════════════════════════════════════════ */}
      {historyModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "40px 20px" }}>
          <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, width: "100%", maxWidth: 860, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif", marginBottom: 4 }}>전체 변경 이력</div>
                <div style={{ fontSize: 11, color: C.muted }}>{selectedHotel} · 전체 작업 로그</div>
              </div>
              <button onClick={() => setHistoryModal(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 3 }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.bg}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div style={{ overflow: "auto", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr style={{ backgroundColor: "#F7F4EF" }}>
                    {["작업 유형", "대상", "변경 내용", "작업자", "권한", "일시"].map((h, i) => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: i === 5 ? "right" : "left", fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {changeLogs.map((log, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.borderLight}`, backgroundColor: i % 2 === 1 ? "#FAFAF8" : C.white }}>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ display: "inline-flex", padding: "2px 9px", backgroundColor: log.typeBg, color: log.typeColor, borderRadius: 2, fontSize: 9, fontWeight: 600, whiteSpace: "nowrap" }}>{log.type}</span>
                      </td>
                      <td style={{ padding: "11px 16px", fontSize: 11, color: C.charcoal }}>{log.target}</td>
                      <td style={{ padding: "11px 16px", fontSize: 10, color: C.muted }}>{log.detail}</td>
                      <td style={{ padding: "11px 16px", fontSize: 11, color: C.charcoal }}>{log.actor}</td>
                      <td style={{ padding: "11px 16px", fontSize: 10, color: C.muted }}>{log.role}</td>
                      <td style={{ padding: "11px 16px", fontSize: 10, color: C.muted, textAlign: "right", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap" }}>{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "14px 28px", borderTop: `1px solid ${C.border}`, backgroundColor: "#FAFAF8", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: C.muted }}>전체 {changeLogs.length}건 표시</div>
              <button onClick={() => setHistoryModal(false)} style={{ padding: "8px 24px", backgroundColor: C.navy, color: "#EAE0CC", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
         공정성 리포트 전체보기 모달  ← fairnessIssues (context)
      ══════════════════════════════════════════════════ */}
      {fairnessModal && (() => {
        const FILTER_TABS: Array<"전체" | FairnessIssueCategory> = [
          "전체", "근태 신청 미반영", "주말/공휴 편중", "고강도 근무", "야간조 편중", "회복 반영 예외", "계획 대비 실제 편차",
        ];
        const filtered = fairnessFilter === "전체"
          ? fairnessIssues
          : fairnessIssues.filter((i) => i.category === fairnessFilter);

        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.52)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "40px 20px" }}>
            <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, width: "100%", maxWidth: 1020, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* 헤더 */}
              <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif", marginBottom: 4 }}>공정성 리포트 — 전체</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{formatMonth(targetMonth)} · {selectedHotel} · {scheduleVersion}</div>
                </div>
                <button onClick={() => setFairnessModal(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 3 }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.bg}
                  onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              {/* 요약 카드 */}
              <div style={{ padding: "16px 28px", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAF8", flexShrink: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                  {fairnessSummary.map((item) => {
                    const sev = item.severity;
                    const sevColor  = sev === "위험" ? C.risk    : sev === "검토" ? C.warning : C.ok;
                    const sevBg     = sev === "위험" ? C.riskBg  : sev === "검토" ? C.warnBg  : C.okBg;
                    const sevBorder = sev === "위험" ? C.riskBorder : sev === "검토" ? C.warnBorder : C.okBorder;
                    const isActive  = fairnessFilter === item.category;
                    return (
                      <button key={item.label} onClick={() => setFairnessFilter(item.category)}
                        style={{ padding: "10px", backgroundColor: isActive ? sevBg : C.white, border: `1.5px solid ${isActive ? sevColor : C.border}`, borderRadius: 3, cursor: "pointer", textAlign: "left" as const, transition: "all 0.15s" }}>
                        <div style={{ fontSize: 18, fontWeight: 300, color: sevColor, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>
                          {item.value}<span style={{ fontSize: 10, marginLeft: 2 }}>{item.unit}</span>
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: isActive ? sevColor : C.muted, marginTop: 4, lineHeight: 1.3 }}>{item.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 필터 탭 */}
              <div style={{ padding: "0 28px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 0, flexShrink: 0, backgroundColor: C.white }}>
                {FILTER_TABS.map((tab) => {
                  const isActive = fairnessFilter === tab;
                  const count = tab === "전체" ? fairnessIssues.length : fairnessIssues.filter((i) => i.category === tab).length;
                  return (
                    <button key={tab} onClick={() => setFairnessFilter(tab)}
                      style={{ padding: "12px 14px", fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? C.navy : C.muted, backgroundColor: "transparent", border: "none", borderBottom: isActive ? `2px solid ${C.navy}` : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap" as const, transition: "all 0.15s" }}>
                      {tab}
                      <span style={{ marginLeft: 4, fontSize: 9, color: isActive ? C.navy : C.muted }}>({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* 리스트 */}
              <div style={{ flex: 1, overflow: "auto" }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: "48px 28px", textAlign: "center" as const }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>공정성 이슈 없음</div>
                    <div style={{ fontSize: 12, color: C.muted }}>현재 근무표에서 주요 공정성 편중이 발견되지 않았습니다.</div>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                      <tr style={{ backgroundColor: "#F7F4EF" }}>
                        {["직원명 / 직급", "조", "문제 유형", "발생 횟수", "대상 기간", "설명", "권장 조치", ""].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left" as const, fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" as const }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((issue, i) => {
                        const sev = issue.severity;
                        const sevColor  = sev === "위험" ? C.risk    : sev === "검토" ? C.warning : C.ok;
                        const sevBg     = sev === "위험" ? C.riskBg  : sev === "검토" ? C.warnBg  : C.okBg;
                        const sevBorder = sev === "위험" ? C.riskBorder : sev === "검토" ? C.warnBorder : C.okBorder;
                        return (
                          <tr key={issue.id} style={{ borderBottom: `1px solid ${C.borderLight}`, backgroundColor: i % 2 === 1 ? "#FAFAF8" : C.white }}>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{issue.employeeName}</div>
                              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{issue.grade}</div>
                            </td>
                            <td style={{ padding: "12px 14px", fontSize: 10, color: C.muted }}>{issue.shift}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ display: "inline-block", padding: "3px 8px", fontSize: 9, fontWeight: 600, backgroundColor: sevBg, color: sevColor, border: `1px solid ${sevBorder}`, borderRadius: 3, whiteSpace: "nowrap" as const }}>{issue.issueType}</span>
                            </td>
                            <td style={{ padding: "12px 14px", fontSize: 11, color: C.charcoal }}>{issue.count}</td>
                            <td style={{ padding: "12px 14px", fontSize: 10, color: C.muted, whiteSpace: "nowrap" as const }}>{issue.targetPeriod}</td>
                            <td style={{ padding: "12px 14px", fontSize: 11, color: C.charcoal, maxWidth: 220 }}>{issue.description}</td>
                            <td style={{ padding: "12px 14px", fontSize: 10, color: C.muted, maxWidth: 180, lineHeight: 1.5 }}>{issue.recommendation}</td>
                            <td style={{ padding: "12px 14px", textAlign: "right" as const }}>
                              <button
                                title="근무표의 공정성/편중 패널에서 해당 직원 이슈를 확인합니다."
                                onClick={() => {
                                  setFairnessModal(false);
                                  navigate("/schedule", {
                                    state: {
                                      fairnessNavigation: {
                                        employeeName: issue.employeeName,
                                        issueType: issue.issueType,
                                        issueId: issue.id,
                                        severity: issue.severity,
                                        source: "dashboardFairnessReport",
                                      },
                                    },
                                  });
                                }}
                                style={{ padding: "6px 12px", fontSize: 10, fontWeight: 600, backgroundColor: C.navy, border: "none", borderRadius: 3, color: "#EAE0CC", cursor: "pointer", whiteSpace: "nowrap" as const, transition: "opacity 0.15s" }}
                                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"}
                                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
                              >
                                근무표에서 보기 →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 푸터 */}
              <div style={{ padding: "14px 28px", borderTop: `1px solid ${C.border}`, backgroundColor: "#FAFAF8", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: C.muted }}>
                  {filtered.length}건 표시 · 위험 {filtered.filter((i) => i.severity === "위험").length}건 · 검토 {filtered.filter((i) => i.severity === "검토").length}건
                </div>
                <button onClick={() => setFairnessModal(false)} style={{ padding: "8px 24px", backgroundColor: C.navy, color: "#EAE0CC", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>닫기</button>
              </div>
            </div>
          </div>
        );
      })()}

    </AppLayout>
  );
}

/* ══════════════════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════════════════ */
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.risk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
