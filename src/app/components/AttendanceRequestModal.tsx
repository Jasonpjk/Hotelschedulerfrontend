/* ══════════════════════════════════════════════════════════
   근태 신청 모달 - 교육/병가 신청
══════════════════════════════════════════════════════════ */

import { useState } from "react";
import { X, Upload } from "lucide-react";

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
};

type RequestType = "교육" | "병가";

interface AttendanceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function AttendanceRequestModal({
  isOpen,
  onClose,
  onSubmit,
}: AttendanceRequestModalProps) {
  const [requestType, setRequestType] = useState<RequestType>("교육");

  // 교육 신청 필드
  const [educationDate, setEducationDate] = useState("");
  const [educationCategory, setEducationCategory] = useState<"사내" | "사외" | "법정" | "기타">("사내");
  const [educationTitle, setEducationTitle] = useState("");
  const [educationIsFullDay, setEducationIsFullDay] = useState(true);
  const [educationReason, setEducationReason] = useState("");

  // 병가 신청 필드
  const [sickLeaveDate, setSickLeaveDate] = useState("");
  const [sickLeaveIsHalfDay, setSickLeaveIsHalfDay] = useState(false);
  const [sickLeaveReason, setSickLeaveReason] = useState("");
  const [attachmentCount, setAttachmentCount] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const data = requestType === "교육"
      ? {
          type: "교육",
          date: educationDate,
          educationCategory,
          educationTitle,
          educationIsFullDay,
          reason: educationReason,
        }
      : {
          type: "병가",
          date: sickLeaveDate,
          sickLeaveIsHalfDay,
          reason: sickLeaveReason,
          attachmentCount,
        };

    onSubmit(data);
    onClose();
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
        maxWidth: 600,
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 32px",
          borderBottom: `1px solid ${C.borderLight}`,
          backgroundColor: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{
              fontSize: 18,
              fontWeight: 600,
              color: C.navy,
              fontFamily: "'Cormorant Garamond', serif",
            }}>
              근태 신청
            </div>
            <div style={{
              fontSize: 13,
              color: C.muted,
              marginTop: 4,
            }}>
              교육 또는 병가를 신청하세요
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.muted,
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "24px 32px",
        }}>
          {/* 신청 유형 선택 */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.text,
              display: "block",
              marginBottom: 8,
            }}>
              신청 유형 *
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              {(["교육", "병가"] as RequestType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setRequestType(type)}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    backgroundColor: requestType === type ? C.goldBg : C.white,
                    border: `2px solid ${requestType === type ? C.gold : C.border}`,
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    color: requestType === type ? C.gold : C.charcoal,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 교육 신청 폼 */}
          {requestType === "교육" && (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                  display: "block",
                  marginBottom: 8,
                }}>
                  교육 날짜 *
                </label>
                <input
                  type="date"
                  value={educationDate}
                  onChange={(e) => setEducationDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    fontSize: 14,
                    color: C.text,
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                  display: "block",
                  marginBottom: 8,
                }}>
                  교육 구분 *
                </label>
                <select
                  value={educationCategory}
                  onChange={(e) => setEducationCategory(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    fontSize: 14,
                    color: C.text,
                    backgroundColor: C.white,
                  }}
                >
                  <option value="사내">사내</option>
                  <option value="사외">사외</option>
                  <option value="법정">법정</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                  display: "block",
                  marginBottom: 8,
                }}>
                  교육명 *
                </label>
                <input
                  type="text"
                  value={educationTitle}
                  onChange={(e) => setEducationTitle(e.target.value)}
                  placeholder="예: 고급 CS 교육"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    fontSize: 14,
                    color: C.text,
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                  display: "block",
                  marginBottom: 8,
                }}>
                  교육 시간 *
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  <label style={{
                    flex: 1,
                    padding: "10px 12px",
                    backgroundColor: educationIsFullDay ? C.okBg : C.white,
                    border: `1px solid ${educationIsFullDay ? C.okBorder : C.border}`,
                    borderRadius: 4,
                    fontSize: 13,
                    color: educationIsFullDay ? C.ok : C.text,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <input
                      type="radio"
                      checked={educationIsFullDay}
                      onChange={() => setEducationIsFullDay(true)}
                    />
                    종일
                  </label>
                  <label style={{
                    flex: 1,
                    padding: "10px 12px",
                    backgroundColor: !educationIsFullDay ? C.okBg : C.white,
                    border: `1px solid ${!educationIsFullDay ? C.okBorder : C.border}`,
                    borderRadius: 4,
                    fontSize: 13,
                    color: !educationIsFullDay ? C.ok : C.text,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <input
                      type="radio"
                      checked={!educationIsFullDay}
                      onChange={() => setEducationIsFullDay(false)}
                    />
                    반일
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                  display: "block",
                  marginBottom: 8,
                }}>
                  사유 (선택)
                </label>
                <textarea
                  value={educationReason}
                  onChange={(e) => setEducationReason(e.target.value)}
                  placeholder="교육 신청 사유를 입력하세요"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    fontSize: 14,
                    color: C.text,
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </>
          )}

          {/* 병가 신청 폼 */}
          {requestType === "병가" && (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                  display: "block",
                  marginBottom: 8,
                }}>
                  병가 날짜 *
                </label>
                <input
                  type="date"
                  value={sickLeaveDate}
                  onChange={(e) => setSickLeaveDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    fontSize: 14,
                    color: C.text,
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                  display: "block",
                  marginBottom: 8,
                }}>
                  신청 형태 *
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  <label style={{
                    flex: 1,
                    padding: "10px 12px",
                    backgroundColor: !sickLeaveIsHalfDay ? C.okBg : C.white,
                    border: `1px solid ${!sickLeaveIsHalfDay ? C.okBorder : C.border}`,
                    borderRadius: 4,
                    fontSize: 13,
                    color: !sickLeaveIsHalfDay ? C.ok : C.text,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <input
                      type="radio"
                      checked={!sickLeaveIsHalfDay}
                      onChange={() => setSickLeaveIsHalfDay(false)}
                    />
                    종일
                  </label>
                  <label style={{
                    flex: 1,
                    padding: "10px 12px",
                    backgroundColor: sickLeaveIsHalfDay ? C.okBg : C.white,
                    border: `1px solid ${sickLeaveIsHalfDay ? C.okBorder : C.border}`,
                    borderRadius: 4,
                    fontSize: 13,
                    color: sickLeaveIsHalfDay ? C.ok : C.text,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    <input
                      type="radio"
                      checked={sickLeaveIsHalfDay}
                      onChange={() => setSickLeaveIsHalfDay(true)}
                    />
                    반일
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                  display: "block",
                  marginBottom: 8,
                }}>
                  사유 (선택)
                </label>
                <textarea
                  value={sickLeaveReason}
                  onChange={(e) => setSickLeaveReason(e.target.value)}
                  placeholder="병가 사유를 입력하세요"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    fontSize: 14,
                    color: C.text,
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.text,
                  display: "block",
                  marginBottom: 8,
                }}>
                  증빙서류 (선택)
                </label>
                <div style={{
                  padding: "16px",
                  border: `2px dashed ${C.border}`,
                  borderRadius: 6,
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: C.bg,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.gold;
                  e.currentTarget.style.backgroundColor = C.goldBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.backgroundColor = C.bg;
                }}
                onClick={() => setAttachmentCount(attachmentCount + 1)}
                >
                  <Upload size={24} color={C.muted} style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 13, color: C.muted }}>
                    파일을 클릭하여 업로드하세요
                  </div>
                  {attachmentCount > 0 && (
                    <div style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: C.ok,
                      fontWeight: 600,
                    }}>
                      {attachmentCount}개 파일 선택됨
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 32px",
          borderTop: `1px solid ${C.borderLight}`,
          display: "flex",
          gap: 12,
          justifyContent: "flex-end",
          backgroundColor: C.bg,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 24px",
              backgroundColor: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              color: C.charcoal,
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "10px 24px",
              backgroundColor: C.navy,
              border: "none",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              color: "#EAE0CC",
              cursor: "pointer",
            }}
          >
            신청하기
          </button>
        </div>
      </div>
    </div>
  );
}
