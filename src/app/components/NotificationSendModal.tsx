import { useState, useEffect } from "react";

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
};

/* ══════════════════════════════════════════════════════════
   TYPE DEFINITIONS
══════════════════════════════════════════════════════════ */
interface Employee {
  id: string;
  name: string;
  employeeId?: string;
  hotel?: string;
  department?: string;
  phone?: string;
  email?: string;
  changedDates?: number[]; // 변경된 날짜들
}

type RecipientType = "all" | "changed" | "selected";
type Channel = "sms" | "email" | "both";

interface NotificationSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMonth: string;
  version: string;
  scheduleStatus: "작업 중" | "확정";
  hotel: string;
  department: string;
  allEmployees: Employee[];
  changedEmployees: Employee[];
  onSend: (data: {
    recipientType: RecipientType;
    selectedEmployees: string[];
    channels: Channel;
    customMessage: string;
  }) => void;
}

export default function NotificationSendModal({
  isOpen,
  onClose,
  targetMonth,
  version,
  scheduleStatus,
  hotel,
  department,
  allEmployees,
  changedEmployees,
  onSend,
}: NotificationSendModalProps) {
  const [step, setStep] = useState<"select" | "confirm" | "sending" | "result">("select");
  const [recipientType, setRecipientType] = useState<RecipientType>("changed");
  const [channels, setChannels] = useState<Channel>("both");
  const [customMessage, setCustomMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [sendResult, setSendResult] = useState<{
    total: number;
    success: number;
    failed: number;
    failures: Array<{ name: string; reason: string }>;
  } | null>(null);

  // 모달이 닫힐 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setStep("select");
      setRecipientType("changed");
      setChannels("both");
      setCustomMessage("");
      setSearchQuery("");
      setSelectedEmployeeIds([]);
      setSendResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetEmployees = recipientType === "all"
    ? allEmployees
    : recipientType === "changed"
    ? changedEmployees
    : allEmployees.filter(e => selectedEmployeeIds.includes(e.id));

  const filteredEmployees = allEmployees.filter(e => {
    const query = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(query) ||
      e.employeeId?.toLowerCase().includes(query) ||
      e.hotel?.toLowerCase().includes(query) ||
      e.department?.toLowerCase().includes(query)
    );
  });

  // 채널별 발송 가능 인원 계산
  const smsCount = targetEmployees.filter(e => e.phone).length;
  const emailCount = targetEmployees.filter(e => e.email).length;
  const missingContactCount = targetEmployees.filter(e => !e.phone && !e.email).length;

  const handleSend = () => {
    setStep("sending");

    // Mock sending process
    setTimeout(() => {
      const failures: Array<{ name: string; reason: string }> = [];

      targetEmployees.forEach(emp => {
        if (channels === "sms" || channels === "both") {
          if (!emp.phone) {
            failures.push({ name: emp.name, reason: "휴대폰 번호 없음" });
          }
        }
        if (channels === "email" || channels === "both") {
          if (!emp.email) {
            failures.push({ name: emp.name, reason: "이메일 없음" });
          }
        }
      });

      setSendResult({
        total: targetEmployees.length,
        success: targetEmployees.length - failures.length,
        failed: failures.length,
        failures: failures.slice(0, 5), // 최대 5개만 표시
      });

      setStep("result");
    }, 2000);
  };

  const handleConfirm = () => {
    onSend({
      recipientType,
      selectedEmployees: recipientType === "selected" ? selectedEmployeeIds : [],
      channels,
      customMessage,
    });
    onClose();
  };

  // 날짜 포맷팅
  const formatMonth = (month: string) => {
    const [year, m] = month.split("-");
    return `${year}년 ${parseInt(m)}월`;
  };

  const formatDate = (month: string) => {
    const [year, m] = month.split("-");
    return `${year}-${m}`;
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
        maxWidth: step === "select" ? 800 : 600,
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
            스케줄 알림 발송
          </div>
          <div style={{
            fontSize: 13,
            color: C.muted,
            marginTop: 6,
            fontFamily: "'Inter', sans-serif",
          }}>
            {hotel} · {department} · {formatMonth(targetMonth)} · {version} · {scheduleStatus}
          </div>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "24px 32px",
        }}>
          {/* Step 1: 발송 대상 및 채널 선택 */}
          {step === "select" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* 발송 대상 선택 */}
              <div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.charcoal,
                  marginBottom: 12,
                }}>
                  발송 대상
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { value: "all", label: "전체 직원", count: allEmployees.length },
                    { value: "changed", label: "근무가 변경된 직원", count: changedEmployees.length },
                    { value: "selected", label: "직접 선택", count: selectedEmployeeIds.length },
                  ].map(option => (
                    <label
                      key={option.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 12,
                        border: `1px solid ${recipientType === option.value ? C.goldBorder : C.border}`,
                        backgroundColor: recipientType === option.value ? C.goldBg : C.white,
                        borderRadius: 6,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="radio"
                        name="recipientType"
                        value={option.value}
                        checked={recipientType === option.value}
                        onChange={(e) => setRecipientType(e.target.value as RecipientType)}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{
                        flex: 1,
                        fontSize: 14,
                        color: C.text,
                      }}>
                        {option.label}
                      </span>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: recipientType === option.value ? C.gold : C.muted,
                      }}>
                        {option.count}명
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 직접 선택 시 직원 목록 */}
              {recipientType === "selected" && (
                <div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.charcoal,
                    marginBottom: 8,
                  }}>
                    직원 검색 및 선택
                  </div>
                  <input
                    type="text"
                    placeholder="이름, 사번, 호텔, 부서 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 4,
                      fontSize: 13,
                      marginBottom: 8,
                    }}
                  />
                  <div style={{
                    maxHeight: 200,
                    overflow: "auto",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                  }}>
                    {filteredEmployees.map(emp => (
                      <label
                        key={emp.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          borderBottom: `1px solid ${C.borderLight}`,
                          cursor: "pointer",
                          backgroundColor: selectedEmployeeIds.includes(emp.id) ? C.goldBg : C.white,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmployeeIds.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployeeIds([...selectedEmployeeIds, emp.id]);
                            } else {
                              setSelectedEmployeeIds(selectedEmployeeIds.filter(id => id !== emp.id));
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        />
                        <span style={{ fontSize: 13, color: C.text }}>
                          {emp.name} ({emp.employeeId})
                        </span>
                        <span style={{ fontSize: 12, color: C.muted, marginLeft: "auto" }}>
                          {emp.hotel}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 발송 채널 선택 */}
              <div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.charcoal,
                  marginBottom: 12,
                }}>
                  발송 채널
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { value: "sms", label: "휴대폰 알림" },
                    { value: "email", label: "이메일" },
                    { value: "both", label: "둘 다" },
                  ].map(option => (
                    <label
                      key={option.value}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: 12,
                        border: `1px solid ${channels === option.value ? C.goldBorder : C.border}`,
                        backgroundColor: channels === option.value ? C.goldBg : C.white,
                        borderRadius: 6,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <input
                        type="radio"
                        name="channels"
                        value={option.value}
                        checked={channels === option.value}
                        onChange={(e) => setChannels(e.target.value as Channel)}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{
                        fontSize: 14,
                        color: C.text,
                      }}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 추가 메시지 */}
              <div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.charcoal,
                  marginBottom: 8,
                }}>
                  추가 안내 메시지 (선택사항)
                </div>
                <textarea
                  placeholder="예: 야간조 일부 조정이 있으니 꼭 확인 부탁드립니다."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  maxLength={100}
                  style={{
                    width: "100%",
                    minHeight: 60,
                    padding: "8px 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    fontSize: 13,
                    fontFamily: "'Inter', sans-serif",
                    resize: "vertical",
                  }}
                />
                <div style={{
                  fontSize: 12,
                  color: C.muted,
                  marginTop: 4,
                  textAlign: "right",
                }}>
                  {customMessage.length}/100
                </div>
              </div>

              {/* 메시지 미리보기 */}
              <div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.charcoal,
                  marginBottom: 8,
                }}>
                  메시지 미리보기
                </div>
                <div style={{
                  padding: 16,
                  backgroundColor: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: C.text,
                  whiteSpace: "pre-line",
                }}>
                  {channels === "sms" || channels === "both" ? (
                    <>
                      <strong>[LOTTE HOTELS & RESORTS]</strong><br />
                      홍길동님, {formatMonth(targetMonth)} 근무표가 업데이트되었습니다.<br />
                      {customMessage && <>{customMessage}<br /></>}
                      변경된 일정을 확인해주세요.<br /><br />
                      호텔: {hotel}<br />
                      부서: {department}<br />
                      버전: {version}<br />
                      상태: {scheduleStatus}<br />
                      {recipientType === "changed" && "변경된 날짜: 4/3, 4/10, 4/18\n"}
                      확인 링크: [앱/웹 링크]
                    </>
                  ) : (
                    <>
                      <strong>제목:</strong> [LOTTE HOTELS & RESORTS] {formatMonth(targetMonth)} 근무표 업데이트 안내<br /><br />
                      안녕하세요. LOTTE HOTELS & RESORTS입니다.<br /><br />
                      {formatMonth(targetMonth)} 근무표가 업데이트되었습니다.<br />
                      {customMessage && <>{customMessage}<br /></>}
                      아래 내용을 확인해주세요.<br /><br />
                      - 호텔: {hotel}<br />
                      - 부서: {department}<br />
                      - 대상 월: {formatMonth(targetMonth)}<br />
                      - 버전: {version}<br />
                      - 상태: {scheduleStatus}<br />
                      {recipientType === "changed" && "- 변경된 날짜: 4/3, 4/10, 4/18\n"}
                      - 확인 링크: [웹 링크]<br /><br />
                      감사합니다.
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 발송 확인 */}
          {step === "confirm" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{
                fontSize: 15,
                fontWeight: 600,
                color: C.charcoal,
                textAlign: "center",
              }}>
                아래 내용으로 알림을 발송합니다.
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
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
                    총 발송 대상
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: C.gold }}>
                    {targetEmployees.length}명
                  </div>
                </div>

                {(channels === "sms" || channels === "both") && (
                  <div style={{
                    padding: 16,
                    backgroundColor: C.okBg,
                    border: `1px solid ${C.okBorder}`,
                    borderRadius: 6,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                      휴대폰 알림
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: C.ok }}>
                      {smsCount}명
                    </div>
                  </div>
                )}

                {(channels === "email" || channels === "both") && (
                  <div style={{
                    padding: 16,
                    backgroundColor: C.okBg,
                    border: `1px solid ${C.okBorder}`,
                    borderRadius: 6,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                      이메일
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: C.ok }}>
                      {emailCount}명
                    </div>
                  </div>
                )}

                {missingContactCount > 0 && (
                  <div style={{
                    padding: 16,
                    backgroundColor: C.riskBg,
                    border: `1px solid ${C.riskBorder}`,
                    borderRadius: 6,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                      연락처 누락
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: C.risk }}>
                      {missingContactCount}명
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                padding: 16,
                backgroundColor: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                fontSize: 13,
                color: C.muted,
                textAlign: "center",
              }}>
                발송 후 취소할 수 없습니다. 계속하시겠습니까?
              </div>
            </div>
          )}

          {/* Step 3: 발송 중 */}
          {step === "sending" && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: "40px 0",
            }}>
              <div style={{
                width: 48,
                height: 48,
                border: `4px solid ${C.borderLight}`,
                borderTop: `4px solid ${C.gold}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }} />
              <div style={{
                fontSize: 15,
                fontWeight: 600,
                color: C.charcoal,
              }}>
                알림 발송 중...
              </div>
              <style>
                {`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}
              </style>
            </div>
          )}

          {/* Step 4: 발송 결과 */}
          {step === "result" && sendResult && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{
                fontSize: 15,
                fontWeight: 600,
                color: C.charcoal,
                textAlign: "center",
              }}>
                알림 발송이 완료되었습니다
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
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
                    총 대상
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: C.gold }}>
                    {sendResult.total}명
                  </div>
                </div>

                <div style={{
                  padding: 16,
                  backgroundColor: C.okBg,
                  border: `1px solid ${C.okBorder}`,
                  borderRadius: 6,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                    성공
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: C.ok }}>
                    {sendResult.success}명
                  </div>
                </div>

                <div style={{
                  padding: 16,
                  backgroundColor: C.riskBg,
                  border: `1px solid ${C.riskBorder}`,
                  borderRadius: 6,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                    실패
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: C.risk }}>
                    {sendResult.failed}명
                  </div>
                </div>
              </div>

              {sendResult.failures.length > 0 && (
                <div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.charcoal,
                    marginBottom: 8,
                  }}>
                    실패 내역
                  </div>
                  <div style={{
                    maxHeight: 150,
                    overflow: "auto",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                  }}>
                    {sendResult.failures.map((f, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "8px 12px",
                          borderBottom: idx < sendResult.failures.length - 1 ? `1px solid ${C.borderLight}` : "none",
                          fontSize: 13,
                        }}
                      >
                        <span style={{ color: C.text, fontWeight: 500 }}>
                          {f.name}
                        </span>
                        {" · "}
                        <span style={{ color: C.risk }}>
                          {f.reason}
                        </span>
                      </div>
                    ))}
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
          justifyContent: "flex-end",
        }}>
          {step === "select" && (
            <>
              <button
                onClick={onClose}
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
                취소
              </button>
              <button
                onClick={() => setStep("confirm")}
                disabled={recipientType === "selected" && selectedEmployeeIds.length === 0}
                style={{
                  padding: "8px 20px",
                  border: "none",
                  backgroundColor: recipientType === "selected" && selectedEmployeeIds.length === 0 ? C.border : C.gold,
                  color: C.white,
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: recipientType === "selected" && selectedEmployeeIds.length === 0 ? "not-allowed" : "pointer",
                  opacity: recipientType === "selected" && selectedEmployeeIds.length === 0 ? 0.5 : 1,
                }}
              >
                다음
              </button>
            </>
          )}

          {step === "confirm" && (
            <>
              <button
                onClick={() => setStep("select")}
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
                이전
              </button>
              <button
                onClick={handleSend}
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
                발송
              </button>
            </>
          )}

          {step === "result" && (
            <button
              onClick={handleConfirm}
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
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
