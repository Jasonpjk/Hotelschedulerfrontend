/* ══════════════════════════════════════════════════════════
   연간 야간조 계획 변경 이력 모달
   - 월별 근무표 변경 이력 UI와 동일한 디자인 패턴 적용
══════════════════════════════════════════════════════════ */
import { useState } from "react";

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
  rowAlt:      "#FAFAF8",
};

interface HistoryEntry {
  timestamp: string;
  editorName: string;
  editorRole: string;
  targetYear: number;
  targetMonth: number;
  changeSummary: string;
  beforeValue?: string;
  afterValue?: string;
  reason?: string;
  status: "적용 완료" | "검토 필요";
}

interface AnnualPlanHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  history: HistoryEntry[];
}

// Mock data
const MOCK_HISTORY: HistoryEntry[] = [
  {
    timestamp: "2026-04-10T14:23:15",
    editorName: "김매니저",
    editorRole: "프론트 매니저",
    targetYear: 2026,
    targetMonth: 5,
    changeSummary: "5월 야간조 우선 대상자 변경 (박지현 → 이수진)",
    beforeValue: "박지현",
    afterValue: "이수진",
    reason: "박지현 휴가 계획으로 인한 조정",
    status: "적용 완료",
  },
  {
    timestamp: "2026-04-08T09:41:02",
    editorName: "이팀장",
    editorRole: "프론트 팀장",
    targetYear: 2026,
    targetMonth: 6,
    changeSummary: "6월 야간조 필요 인원 조정 (2명 → 3명)",
    beforeValue: "2명",
    afterValue: "3명",
    reason: "하계 성수기 대비 인원 증원",
    status: "적용 완료",
  },
  {
    timestamp: "2026-03-28T16:55:30",
    editorName: "박과장",
    editorRole: "프론트 과장",
    targetYear: 2026,
    targetMonth: 4,
    changeSummary: "4월 야간조 백업 대상자 추가 (최민준)",
    beforeValue: "-",
    afterValue: "최민준",
    reason: "우선 대상자 충돌 대비",
    status: "적용 완료",
  },
];

export default function AnnualPlanHistoryModal({
  isOpen,
  onClose,
  year,
  history = MOCK_HISTORY,
}: AnnualPlanHistoryModalProps) {
  if (!isOpen) return null;

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
    }}>
      <div style={{
        backgroundColor: C.white,
        borderRadius: 4,
        border: `1px solid ${C.border}`,
        maxWidth: 800,
        width: "90%",
        maxHeight: "80vh",
      }}>
        {/* 헤더 */}
        <div style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: "#F9F7F4",
        }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: C.navy,
            fontFamily: "'Cormorant Garamond', serif",
          }}>
            연간 야간조 계획 변경 이력
          </h3>
          <p style={{
            fontSize: 11,
            color: C.muted,
            marginTop: 4,
          }}>
            {year}년 연간 야간조 계획의 변경 이력을 확인할 수 있습니다
          </p>
        </div>

        {/* 콘텐츠 */}
        <div style={{ padding: 24, overflow: "auto", maxHeight: "calc(80vh - 140px)" }}>
          {history.length > 0 ? (
            <div style={{
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              overflow: "hidden",
            }}>
              {history.map((entry, index) => {
                const statusColor = entry.status === "적용 완료" ? C.ok : C.warning;
                const statusBg = entry.status === "적용 완료" ? C.okBg : C.warnBg;

                return (
                  <div key={index} style={{
                    padding: "16px 20px",
                    borderBottom: index < history.length - 1 ? `1px solid ${C.border}` : "none",
                    backgroundColor: index % 2 === 1 ? C.rowAlt : C.white,
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                      marginBottom: 8,
                    }}>
                      <div style={{
                        fontSize: 10,
                        color: C.muted,
                        fontFamily: "'Inter', sans-serif",
                        minWidth: 140,
                        flexShrink: 0,
                      }}>
                        {new Date(entry.timestamp).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div style={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: statusColor,
                        backgroundColor: statusBg,
                        padding: "4px 10px",
                        borderRadius: 3,
                        border: `1px solid ${statusColor}30`,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}>
                        {entry.status}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 12,
                      color: C.charcoal,
                      lineHeight: 1.6,
                      paddingLeft: 156,
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {entry.changeSummary}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>
                        대상: {entry.targetYear}년 {entry.targetMonth}월 · 작업자: {entry.editorName} ({entry.editorRole})
                      </div>
                      {(entry.beforeValue || entry.afterValue) && (
                        <div style={{ fontSize: 11, color: C.charcoal, marginTop: 6 }}>
                          {entry.beforeValue && <span>{entry.beforeValue}</span>}
                          {entry.beforeValue && entry.afterValue && <span style={{ margin: "0 6px", color: C.gold }}>→</span>}
                          {entry.afterValue && <span style={{ fontWeight: 600 }}>{entry.afterValue}</span>}
                        </div>
                      )}
                      {entry.reason && (
                        <div style={{
                          fontSize: 11,
                          color: C.muted,
                          marginTop: 6,
                          fontStyle: "italic",
                        }}>
                          사유: {entry.reason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: "40px 20px",
              textAlign: "center",
              color: C.muted,
              fontSize: 12,
            }}>
              아직 변경 이력이 없습니다
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div style={{
          padding: "16px 24px",
          borderTop: `1px solid ${C.border}`,
          backgroundColor: "#F9F7F4",
          display: "flex",
          justifyContent: "flex-end",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              backgroundColor: C.navy,
              color: "#EAE0CC",
              border: "none",
              borderRadius: 3,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}