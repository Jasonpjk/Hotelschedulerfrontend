/* ══════════════════════════════════════════════════════════
   전월 근무강도 회복 반영 결과 모달
   - 자동 생성 직후 표시
   - 회복 필요 직원 목록과 반영 결과
   - 회복 등급별 색상 구분
══════════════════════════════════════════════════════════ */

import type { IntensityAnalysis } from "../utils/scheduleIntensity";

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

interface ReflectionResult {
  employeeId: string;
  employeeName: string;
  recoveryGrade: "일반" | "주의" | "회복 필요";
  monthlyIntensityScore: number;
  addedOffDays: number; // 추가 배정된 휴무일
  reflection: "완전 반영" | "일부 반영" | "미반영";
  reason?: string; // 미반영/일부반영 사유
}

interface IntensityRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  analyses: IntensityAnalysis[];
  reflectionResults: ReflectionResult[];
}

export default function IntensityRecoveryModal({
  isOpen,
  onClose,
  year,
  month,
  analyses,
  reflectionResults,
}: IntensityRecoveryModalProps) {
  if (!isOpen) return null;

  const recoveryNeededCount = analyses.filter(a => a.recoveryGrade === "회복 필요").length;
  const cautionCount = analyses.filter(a => a.recoveryGrade === "주의").length;
  const fullyReflectedCount = reflectionResults.filter(r => r.reflection === "완전 반영").length;

  const getGradeColor = (grade: "일반" | "주의" | "회복 필요") => {
    if (grade === "회복 필요") return { bg: C.riskBg, border: C.riskBorder, text: C.risk };
    if (grade === "주의") return { bg: C.warnBg, border: C.warnBorder, text: C.warning };
    return { bg: C.okBg, border: C.okBorder, text: C.ok };
  };

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
        maxWidth: 900,
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 32px",
          borderBottom: `1px solid ${C.borderLight}`,
          backgroundColor: C.bg,
        }}>
          <div style={{
            fontSize: 18,
            fontWeight: 600,
            color: C.navy,
            fontFamily: "'Cormorant Garamond', serif",
          }}>
            {year}년 {month}월 전월 근무강도 회복 반영 결과
          </div>
          <div style={{
            fontSize: 13,
            color: C.muted,
            marginTop: 6,
          }}>
            전월({month - 1}월) 근무 패턴을 분석하여 회복이 필요한 직원에게 휴무를 우선 배정하였습니다.
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{
          padding: "24px 32px",
          borderBottom: `1px solid ${C.borderLight}`,
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}>
            <div style={{
              padding: 16,
              backgroundColor: C.riskBg,
              border: `1px solid ${C.riskBorder}`,
              borderRadius: 6,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
                회복 필요
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: C.risk }}>
                {recoveryNeededCount}명
              </div>
            </div>
            <div style={{
              padding: 16,
              backgroundColor: C.warnBg,
              border: `1px solid ${C.warnBorder}`,
              borderRadius: 6,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
                주의
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: C.warning }}>
                {cautionCount}명
              </div>
            </div>
            <div style={{
              padding: 16,
              backgroundColor: C.okBg,
              border: `1px solid ${C.okBorder}`,
              borderRadius: 6,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>
                완전 반영
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: C.ok }}>
                {fullyReflectedCount}명
              </div>
            </div>
          </div>
        </div>

        {/* Body - Reflection Results */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "24px 32px",
        }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: C.charcoal,
            marginBottom: 16,
          }}>
            직원별 반영 내역
          </div>

          <div style={{
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            overflow: "hidden",
          }}>
            {reflectionResults
              .sort((a, b) => b.monthlyIntensityScore - a.monthlyIntensityScore)
              .map((result, idx) => {
                const gradeStyle = getGradeColor(result.recoveryGrade);
                return (
                  <div
                    key={result.employeeId}
                    style={{
                      padding: "16px 20px",
                      borderBottom: idx < reflectionResults.length - 1 ? `1px solid ${C.borderLight}` : "none",
                      backgroundColor: idx % 2 === 0 ? C.white : C.bg,
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    {/* Employee Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: C.text,
                        marginBottom: 4,
                      }}>
                        {result.employeeName}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted }}>
                        전월 근무강도 점수: {result.monthlyIntensityScore}점
                      </div>
                    </div>

                    {/* Recovery Grade Badge */}
                    <div style={{
                      padding: "6px 12px",
                      backgroundColor: gradeStyle.bg,
                      border: `1px solid ${gradeStyle.border}`,
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: gradeStyle.text,
                    }}>
                      {result.recoveryGrade}
                    </div>

                    {/* Added OFF Days */}
                    <div style={{
                      padding: "6px 12px",
                      backgroundColor: C.goldBg,
                      border: `1px solid ${C.goldBorder}`,
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.gold,
                      minWidth: 80,
                      textAlign: "center",
                    }}>
                      +{result.addedOffDays}일 휴무
                    </div>

                    {/* Reflection Status */}
                    <div style={{ minWidth: 100 }}>
                      {result.reflection === "완전 반영" ? (
                        <div style={{
                          padding: "6px 12px",
                          backgroundColor: C.okBg,
                          border: `1px solid ${C.okBorder}`,
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          color: C.ok,
                          textAlign: "center",
                        }}>
                          완전 반영
                        </div>
                      ) : (
                        <div>
                          <div style={{
                            padding: "6px 12px",
                            backgroundColor: C.warnBg,
                            border: `1px solid ${C.warnBorder}`,
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: C.warning,
                            textAlign: "center",
                            marginBottom: 4,
                          }}>
                            {result.reflection}
                          </div>
                          {result.reason && (
                            <div style={{
                              fontSize: 10,
                              color: C.muted,
                              fontStyle: "italic",
                            }}>
                              {result.reason}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
          backgroundColor: C.bg,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 24px",
              backgroundColor: C.navy,
              color: "#EAE0CC",
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
