import { useState } from "react";

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
  ok:          "#2E7D52",
  okBg:        "rgba(46,125,82,0.07)",
};

/* ══════════════════════════════════════════════════════════
   TYPE DEFINITIONS
══════════════════════════════════════════════════════════ */
interface NotificationHistory {
  id: string;
  sentAt: string;
  senderName: string;
  senderRole: string;
  targetMonth: string;
  version: string;
  scheduleStatus: "작업 중" | "확정";
  recipientType: "전체 직원" | "변경된 직원" | "직접 선택";
  totalRecipients: number;
  channels: string;
  successCount: number;
  failureCount: number;
  customMessage?: string;
  recipients?: Array<{ name: string; employeeId: string; status: string }>;
}

interface NotificationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: NotificationHistory[];
}

export default function NotificationHistoryModal({
  isOpen,
  onClose,
  history,
}: NotificationHistoryModalProps) {
  const [selectedHistory, setSelectedHistory] = useState<NotificationHistory | null>(null);

  if (!isOpen) return null;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const formatMonth = (month: string) => {
    const [year, m] = month.split("-");
    return `${year}년 ${parseInt(m)}월`;
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
        maxWidth: selectedHistory ? 900 : 800,
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
            {selectedHistory ? "알림 발송 상세" : "알림 발송 이력"}
          </div>
          <div style={{
            fontSize: 13,
            color: C.muted,
            marginTop: 6,
            fontFamily: "'Inter', sans-serif",
          }}>
            {selectedHistory
              ? `${formatDateTime(selectedHistory.sentAt)} · ${selectedHistory.senderName}`
              : `총 ${history.length}건의 발송 이력`}
          </div>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "24px 32px",
        }}>
          {!selectedHistory ? (
            // 이력 목록
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {history.length === 0 ? (
                <div style={{
                  padding: "60px 20px",
                  textAlign: "center",
                  color: C.muted,
                  fontSize: 14,
                }}>
                  발송 이력이 없습니다
                </div>
              ) : (
                history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedHistory(item)}
                    style={{
                      padding: 20,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      backgroundColor: C.white,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = C.goldBorder;
                      e.currentTarget.style.backgroundColor = C.goldBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.backgroundColor = C.white;
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}>
                      <div>
                        <div style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: C.charcoal,
                          marginBottom: 4,
                        }}>
                          {formatMonth(item.targetMonth)} · {item.version}
                        </div>
                        <div style={{
                          fontSize: 13,
                          color: C.muted,
                        }}>
                          {formatDateTime(item.sentAt)} · {item.senderName} ({item.senderRole})
                        </div>
                      </div>
                      <div style={{
                        padding: "4px 10px",
                        backgroundColor: item.scheduleStatus === "확정" ? C.okBg : C.goldBg,
                        color: item.scheduleStatus === "확정" ? C.ok : C.gold,
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {item.scheduleStatus}
                      </div>
                    </div>

                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: 12,
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>
                          대상 유형
                        </div>
                        <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
                          {item.recipientType}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>
                          총 발송
                        </div>
                        <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>
                          {item.totalRecipients}명
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>
                          성공
                        </div>
                        <div style={{ fontSize: 13, color: C.ok, fontWeight: 600 }}>
                          {item.successCount}명
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>
                          실패
                        </div>
                        <div style={{ fontSize: 13, color: C.risk, fontWeight: 600 }}>
                          {item.failureCount}명
                        </div>
                      </div>
                    </div>

                    <div style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: `1px solid ${C.borderLight}`,
                      fontSize: 12,
                      color: C.muted,
                    }}>
                      {item.channels}
                      {item.customMessage && ` · "${item.customMessage}"`}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // 상세 보기
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* 요약 정보 */}
              <div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.charcoal,
                  marginBottom: 12,
                }}>
                  발송 요약
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                }}>
                  <div style={{
                    padding: 16,
                    backgroundColor: C.goldBg,
                    border: `1px solid ${C.goldBorder}`,
                    borderRadius: 6,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                      총 발송
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: C.gold }}>
                      {selectedHistory.totalRecipients}명
                    </div>
                  </div>
                  <div style={{
                    padding: 16,
                    backgroundColor: C.okBg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                      성공
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: C.ok }}>
                      {selectedHistory.successCount}명
                    </div>
                  </div>
                  <div style={{
                    padding: 16,
                    backgroundColor: C.riskBg,
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                      실패
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: C.risk }}>
                      {selectedHistory.failureCount}명
                    </div>
                  </div>
                </div>
              </div>

              {/* 발송 정보 */}
              <div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.charcoal,
                  marginBottom: 12,
                }}>
                  발송 정보
                </div>
                <div style={{
                  padding: 16,
                  backgroundColor: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  gap: "12px 20px",
                  fontSize: 13,
                }}>
                  <div style={{ color: C.muted }}>대상 월</div>
                  <div style={{ color: C.text, fontWeight: 500 }}>
                    {formatMonth(selectedHistory.targetMonth)}
                  </div>

                  <div style={{ color: C.muted }}>버전</div>
                  <div style={{ color: C.text, fontWeight: 500 }}>
                    {selectedHistory.version}
                  </div>

                  <div style={{ color: C.muted }}>상태</div>
                  <div style={{ color: C.text, fontWeight: 500 }}>
                    {selectedHistory.scheduleStatus}
                  </div>

                  <div style={{ color: C.muted }}>대상 유형</div>
                  <div style={{ color: C.text, fontWeight: 500 }}>
                    {selectedHistory.recipientType}
                  </div>

                  <div style={{ color: C.muted }}>발송 채널</div>
                  <div style={{ color: C.text, fontWeight: 500 }}>
                    {selectedHistory.channels}
                  </div>

                  {selectedHistory.customMessage && (
                    <>
                      <div style={{ color: C.muted }}>추가 메시지</div>
                      <div style={{ color: C.text, fontWeight: 500 }}>
                        "{selectedHistory.customMessage}"
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 대상자 목록 */}
              {selectedHistory.recipients && selectedHistory.recipients.length > 0 && (
                <div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.charcoal,
                    marginBottom: 12,
                  }}>
                    대상자 목록
                  </div>
                  <div style={{
                    maxHeight: 300,
                    overflow: "auto",
                    border: `1px solid ${C.border}`,
                    borderRadius: 6,
                  }}>
                    <table style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}>
                      <thead>
                        <tr style={{
                          backgroundColor: C.bg,
                          borderBottom: `1px solid ${C.border}`,
                        }}>
                          <th style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontSize: 12,
                            fontWeight: 600,
                            color: C.muted,
                          }}>
                            이름
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontSize: 12,
                            fontWeight: 600,
                            color: C.muted,
                          }}>
                            사번
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            textAlign: "center",
                            fontSize: 12,
                            fontWeight: 600,
                            color: C.muted,
                          }}>
                            상태
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHistory.recipients.map((recipient, idx) => (
                          <tr
                            key={idx}
                            style={{
                              borderBottom: idx < selectedHistory.recipients!.length - 1
                                ? `1px solid ${C.borderLight}`
                                : "none",
                            }}
                          >
                            <td style={{
                              padding: "10px 16px",
                              fontSize: 13,
                              color: C.text,
                            }}>
                              {recipient.name}
                            </td>
                            <td style={{
                              padding: "10px 16px",
                              fontSize: 13,
                              color: C.muted,
                            }}>
                              {recipient.employeeId}
                            </td>
                            <td style={{
                              padding: "10px 16px",
                              textAlign: "center",
                            }}>
                              <span style={{
                                padding: "4px 10px",
                                backgroundColor: recipient.status === "성공" ? C.okBg : C.riskBg,
                                color: recipient.status === "성공" ? C.ok : C.risk,
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 600,
                              }}>
                                {recipient.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 32px",
          borderTop: `1px solid ${C.borderLight}`,
          display: "flex",
          gap: 8,
          justifyContent: selectedHistory ? "space-between" : "flex-end",
        }}>
          {selectedHistory && (
            <button
              onClick={() => setSelectedHistory(null)}
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
              ← 목록으로
            </button>
          )}
          <button
            onClick={onClose}
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
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
