import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { useToast } from "../context/ToastContext";

/* ── colour tokens ──────────────────────────────────────────── */
const C = {
  navyDeep: "#0F1B27",
  navy: "#0D1B2A",
  charcoal: "#2E3642",
  gold: "#B99B5A",
  goldBg: "rgba(185,155,90,0.06)",
  goldBorder: "rgba(185,155,90,0.25)",
  warmWhite: "#EAE0CC",
  bg: "#F2EFE9",
  white: "#FFFFFF",
  border: "#E4DED4",
  borderLight: "rgba(228,222,212,0.4)",
  muted: "#7B8390",
  text: "#2E3642",
  ok: "#2E7D54",
  okBg: "rgba(46,125,84,0.08)",
  warning: "#C87A3A",
  disabled: "#C4C4C4",
  disabledBg: "#F5F5F5",
};

export default function ProfilePage() {
  const { showToast } = useToast();
  // Mock 사용자 정보
  const [userInfo, setUserInfo] = useState({
    name: "김재민",
    employeeId: "H-2024-0042",
    hotel: "롯데시티호텔 마포",
    department: "프론트 데스크",
    position: "L2",
    role: "관리자",
    phone: "010-1234-5678",
    email: "jaemin.kim@lotte.net",
  });

  // 초기값 저장
  const [initialUserInfo, setInitialUserInfo] = useState(userInfo);

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [leaveInfo, setLeaveInfo] = useState({
    annualLeaveTotal: 15,
    vacationTotal: 10,
  });

  // 초기값 저장
  const [initialLeaveInfo, setInitialLeaveInfo] = useState(leaveInfo);

  // 변경 여부 감지 - 소속 호텔, 부서, 연락처, 이메일
  const isAccountInfoChanged = 
    userInfo.hotel !== initialUserInfo.hotel ||
    userInfo.department !== initialUserInfo.department ||
    userInfo.phone !== initialUserInfo.phone || 
    userInfo.email !== initialUserInfo.email;

  const isPasswordFilled = 
    password.current.length > 0 && 
    password.new.length > 0 && 
    password.confirm.length > 0;

  const isLeaveChanged = 
    leaveInfo.annualLeaveTotal !== initialLeaveInfo.annualLeaveTotal || 
    leaveInfo.vacationTotal !== initialLeaveInfo.vacationTotal;

  const handleSaveAccountInfo = () => {
    showToast({ type: "success", title: "저장 완료", message: "계정 정보가 저장되었습니다." });
    setInitialUserInfo(userInfo); // 초기값 업데이트
  };

  const handleChangePassword = () => {
    if (!password.current || !password.new || !password.confirm) {
      showToast({ type: "warning", title: "입력 오류", message: "모든 비밀번호 필드를 입력해주세요." });
      return;
    }
    if (password.new !== password.confirm) {
      showToast({ type: "error", title: "비밀번호 불일치", message: "새 비밀번호가 일치하지 않습니다." });
      return;
    }
    showToast({ type: "success", title: "변경 완료", message: "비밀번호가 변경되었습니다." });
    setPassword({ current: "", new: "", confirm: "" });
  };

  const handleSaveLeaveInfo = () => {
    showToast({ type: "success", title: "저장 완료", message: "근태 기준값이 저장되었습니다." });
    setInitialLeaveInfo(leaveInfo); // 초기값 업데이트
  };

  return (
    <AppLayout>
      <div style={{ flex: 1, overflow: "auto", padding: "32px 40px", fontFamily: "'Inter', sans-serif" }}>
        {/* 페이지 헤더 */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 600,
            color: C.navyDeep,
            fontFamily: "'Cormorant Garamond', serif",
            marginBottom: 8,
          }}>
            개인설정
          </h1>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            계정 정보와 보안 설정을 관리합니다.
          </p>
        </div>

        {/* 저장 완료 메시지 — 전역 ToastContainer에서 처리 */}

        {/* A. 내 계정 정보 */}
        <section style={{
          backgroundColor: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "28px 32px",
          marginBottom: 24,
        }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 600,
            color: C.navy,
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: `1px solid ${C.borderLight}`,
          }}>
            내 계정 정보
          </h2>

          {/* 안내 메시지 */}
          <div style={{
            padding: "12px 16px",
            backgroundColor: C.goldBg,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 6,
            marginBottom: 24,
            fontSize: 11,
            color: C.charcoal,
            lineHeight: 1.6,
          }}>
            • <strong>이름과 사번</strong>은 시스템 고정 정보입니다.<br />
            • <strong>소속 호텔, 부서, 연락처, 이메일</strong>은 직접 수정할 수 있습니다.<br />
            • <strong>직급과 권한</strong>은 관리자만 변경할 수 있습니다.
          </div>

          {/* 완전 고정값 섹션 */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              시스템 고정 정보
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>
              {/* 이름 - 완전 고정 */}
              <div>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.muted,
                  marginBottom: 8,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  이름
                </label>
                <div style={{
                  padding: "10px 14px",
                  backgroundColor: C.disabledBg,
                  border: `1px solid ${C.borderLight}`,
                  borderRadius: 4,
                  fontSize: 13,
                  color: C.charcoal,
                  fontWeight: 500,
                }}>
                  {userInfo.name}
                </div>
              </div>

              {/* 사번 - 완전 고정 */}
              <div>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.muted,
                  marginBottom: 8,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  사번
                </label>
                <div style={{
                  padding: "10px 14px",
                  backgroundColor: C.disabledBg,
                  border: `1px solid ${C.borderLight}`,
                  borderRadius: 4,
                  fontSize: 13,
                  color: C.charcoal,
                  fontWeight: 500,
                }}>
                  {userInfo.employeeId}
                </div>
              </div>
            </div>
          </div>

          {/* 본인 수정 가능 섹션 */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              본인 수정 가능
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>
              {/* 소속 호텔 */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 8 }}>
                  소속 호텔
                </label>
                <select
                  value={userInfo.hotel}
                  onChange={(e) => setUserInfo({ ...userInfo, hotel: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    fontSize: 13,
                    color: C.charcoal,
                    fontFamily: "'Inter', sans-serif",
                    outline: "none",
                    backgroundColor: C.white,
                    cursor: "pointer",
                  }}
                >
                  <option value="롯데호텔 월드">롯데호텔 월드</option>
                  <option value="롯데호텔 서울">롯데호텔 서울</option>
                  <option value="롯데시티호텔 마포">롯데시티호텔 마포</option>
                  <option value="롯데시티호텔 명동">롯데시티호텔 명동</option>
                  <option value="롯데시티호텔 김포공항">롯데시티호텔 김포공항</option>
                  <option value="롯데시티호텔 구로">롯데시티호텔 구로</option>
                  <option value="롯데리조트 부여">롯데리조트 부여</option>
                  <option value="롯데리조트 속초">롯데리조트 속초</option>
                  <option value="롯데리조트 제주 아트빌라스">롯데리조트 제주 아트빌라스</option>
                  <option value="롯데호텔 부산">롯데호텔 부산</option>
                  <option value="롯데호텔 제주">롯데호텔 제주</option>
                  <option value="롯데호텔 울산">롯데호텔 울산</option>
                </select>
              </div>

              {/* 부서 */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 8 }}>
                  부서
                </label>
                <input
                  type="text"
                  value={userInfo.department}
                  onChange={(e) => setUserInfo({ ...userInfo, department: e.target.value })}
                  placeholder="프론트 데스크"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    fontSize: 13,
                    color: C.charcoal,
                    fontFamily: "'Inter', sans-serif",
                    outline: "none",
                  }}
                />
              </div>

              {/* 연락처 */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 8 }}>
                  연락처
                </label>
                <input
                  type="text"
                  value={userInfo.phone}
                  onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    fontSize: 13,
                    color: C.charcoal,
                    fontFamily: "'Inter', sans-serif",
                    outline: "none",
                  }}
                />
              </div>

              {/* 이메일 */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 8 }}>
                  이메일
                </label>
                <input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    fontSize: 13,
                    color: C.charcoal,
                    fontFamily: "'Inter', sans-serif",
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {/* 관리자 수정 전용 섹션 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              관리자 수정 전용
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>
              {/* 직급 */}
              <div>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.muted,
                  marginBottom: 8,
                }}>
                  직급
                  <span style={{
                    fontSize: 9,
                    padding: "2px 6px",
                    backgroundColor: "rgba(123,131,144,0.1)",
                    color: C.muted,
                    borderRadius: 3,
                    fontWeight: 600,
                  }}>
                    관리자만 변경 가능
                  </span>
                </label>
                <div style={{
                  padding: "10px 14px",
                  backgroundColor: "#F9F6F1",
                  border: `1px solid ${C.borderLight}`,
                  borderRadius: 4,
                  fontSize: 13,
                  color: C.charcoal,
                }}>
                  {userInfo.position}
                </div>
              </div>

              {/* 권한 */}
              <div>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.muted,
                  marginBottom: 8,
                }}>
                  권한
                  <span style={{
                    fontSize: 9,
                    padding: "2px 6px",
                    backgroundColor: "rgba(123,131,144,0.1)",
                    color: C.muted,
                    borderRadius: 3,
                    fontWeight: 600,
                  }}>
                    관리자만 변경 가능
                  </span>
                </label>
                <div style={{
                  padding: "10px 14px",
                  backgroundColor: "#F9F6F1",
                  border: `1px solid ${C.borderLight}`,
                  borderRadius: 4,
                  fontSize: 13,
                  color: C.charcoal,
                }}>
                  {userInfo.role}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSaveAccountInfo}
              disabled={!isAccountInfoChanged}
              style={{
                padding: "10px 24px",
                backgroundColor: isAccountInfoChanged ? C.navy : C.disabledBg,
                color: isAccountInfoChanged ? C.warmWhite : C.disabled,
                border: "none",
                borderRadius: 5,
                fontSize: 13,
                fontWeight: 500,
                cursor: isAccountInfoChanged ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                opacity: isAccountInfoChanged ? 1 : 0.6,
              }}
              onMouseEnter={(e) => {
                if (isAccountInfoChanged) {
                  (e.currentTarget.style.backgroundColor = C.navyDeep);
                }
              }}
              onMouseLeave={(e) => {
                if (isAccountInfoChanged) {
                  (e.currentTarget.style.backgroundColor = C.navy);
                }
              }}
            >
              계정 정보 저장
            </button>
          </div>
        </section>

        {/* B. 보안 설정 */}
        <section style={{
          backgroundColor: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "28px 32px",
          marginBottom: 24,
        }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 600,
            color: C.navy,
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: `1px solid ${C.borderLight}`,
          }}>
            보안 설정
          </h2>

          <div style={{ maxWidth: 600 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 8 }}>
                현재 비밀번호
              </label>
              <input
                type="password"
                value={password.current}
                onChange={(e) => setPassword({ ...password, current: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  fontSize: 13,
                  color: C.charcoal,
                  fontFamily: "'Inter', sans-serif",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 8 }}>
                새 비밀번호
              </label>
              <input
                type="password"
                value={password.new}
                onChange={(e) => setPassword({ ...password, new: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  fontSize: 13,
                  color: C.charcoal,
                  fontFamily: "'Inter', sans-serif",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 8 }}>
                새 비밀번호 확인
              </label>
              <input
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  fontSize: 13,
                  color: C.charcoal,
                  fontFamily: "'Inter', sans-serif",
                  outline: "none",
                }}
              />
            </div>

            <div style={{
              padding: "12px 16px",
              backgroundColor: "#FAF8F4",
              border: `1px solid ${C.borderLight}`,
              borderRadius: 4,
              fontSize: 11.5,
              color: C.muted,
              lineHeight: 1.6,
              marginBottom: 20,
            }}>
              <strong>비밀번호 정책:</strong> 8자 이상, 영문/숫자/특수문자 조합
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleChangePassword}
                disabled={!isPasswordFilled}
                style={{
                  padding: "10px 24px",
                  backgroundColor: isPasswordFilled ? C.navy : C.disabledBg,
                  color: isPasswordFilled ? C.warmWhite : C.disabled,
                  border: "none",
                  borderRadius: 5,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: isPasswordFilled ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                  opacity: isPasswordFilled ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (isPasswordFilled) {
                    (e.currentTarget.style.backgroundColor = C.navyDeep);
                  }
                }}
                onMouseLeave={(e) => {
                  if (isPasswordFilled) {
                    (e.currentTarget.style.backgroundColor = C.navy);
                  }
                }}
              >
                비밀번호 변경
              </button>
            </div>
          </div>
        </section>

        {/* C. 근태 기준값 입력 */}
        <section style={{
          backgroundColor: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "28px 32px",
        }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 600,
            color: C.navy,
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: `1px solid ${C.borderLight}`,
          }}>
            근태 기준값
          </h2>

          <div style={{ maxWidth: 600 }}>
            <div style={{
              padding: "12px 16px",
              backgroundColor: "#FAF8F4",
              border: `1px solid ${C.borderLight}`,
              borderRadius: 4,
              fontSize: 12,
              color: C.muted,
              lineHeight: 1.6,
              marginBottom: 20,
            }}>
              연차와 휴가의 총일수를 입력하세요. 이 값은 근태 신청 및 관리 화면에서 참조됩니다.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 8 }}>
                  연차 총일수
                </label>
                <input
                  type="number"
                  value={leaveInfo.annualLeaveTotal}
                  onChange={(e) => setLeaveInfo({ ...leaveInfo, annualLeaveTotal: parseInt(e.target.value) || 0 })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    fontSize: 13,
                    color: C.charcoal,
                    fontFamily: "'Inter', sans-serif",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 8 }}>
                  휴가 총일수
                </label>
                <input
                  type="number"
                  value={leaveInfo.vacationTotal}
                  onChange={(e) => setLeaveInfo({ ...leaveInfo, vacationTotal: parseInt(e.target.value) || 0 })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    fontSize: 13,
                    color: C.charcoal,
                    fontFamily: "'Inter', sans-serif",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleSaveLeaveInfo}
                disabled={!isLeaveChanged}
                style={{
                  padding: "10px 24px",
                  backgroundColor: isLeaveChanged ? C.navy : C.disabledBg,
                  color: isLeaveChanged ? C.warmWhite : C.disabled,
                  border: "none",
                  borderRadius: 5,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: isLeaveChanged ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                  opacity: isLeaveChanged ? 1 : 0.6,
                }}
                onMouseEnter={(e) => {
                  if (isLeaveChanged) {
                    (e.currentTarget.style.backgroundColor = C.navyDeep);
                  }
                }}
                onMouseLeave={(e) => {
                  if (isLeaveChanged) {
                    (e.currentTarget.style.backgroundColor = C.navy);
                  }
                }}
              >
                기준값 저장
              </button>
            </div>
          </div>
        </section>

        {/* D. 받은 스케줄 알림 */}
        <section style={{
          backgroundColor: C.white,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          padding: 32,
        }}>
          <div style={{
            fontSize: 16,
            fontWeight: 600,
            color: C.navyDeep,
            marginBottom: 8,
            fontFamily: "'Cormorant Garamond', serif",
          }}>
            받은 스케줄 알림
          </div>
          <div style={{
            fontSize: 13,
            color: C.muted,
            marginBottom: 24,
            lineHeight: 1.6,
          }}>
            관리자로부터 받은 근무표 알림 내역을 확인할 수 있습니다.
          </div>

          {/* 알림 목록 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                id: "1",
                sentAt: "2026-04-10T14:30:00",
                targetMonth: "2026-04",
                version: "v4.0",
                status: "작업 중",
                channels: "휴대폰 + 이메일",
                message: "야간조 일부 조정이 있으니 꼭 확인 부탁드립니다.",
                isRead: false,
              },
              {
                id: "2",
                sentAt: "2026-04-05T09:15:00",
                targetMonth: "2026-04",
                version: "v3.2",
                status: "확정",
                channels: "이메일",
                message: null,
                isRead: true,
              },
              {
                id: "3",
                sentAt: "2026-03-28T16:45:00",
                targetMonth: "2026-04",
                version: "v3.0",
                status: "확정",
                channels: "휴대폰",
                message: null,
                isRead: true,
              },
            ].map((notification) => {
              const date = new Date(notification.sentAt);
              const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

              return (
                <div
                  key={notification.id}
                  style={{
                    padding: 16,
                    backgroundColor: notification.isRead ? C.white : C.goldBg,
                    border: `1px solid ${notification.isRead ? C.border : C.goldBorder}`,
                    borderRadius: 6,
                    position: "relative",
                  }}
                >
                  {/* 읽지 않음 뱃지 */}
                  {!notification.isRead && (
                    <div style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      padding: "3px 8px",
                      backgroundColor: C.gold,
                      color: C.white,
                      borderRadius: 3,
                      fontSize: 10,
                      fontWeight: 600,
                    }}>
                      NEW
                    </div>
                  )}

                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}>
                    <div>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: C.charcoal,
                        marginBottom: 4,
                      }}>
                        {notification.targetMonth.split("-")[0]}년 {parseInt(notification.targetMonth.split("-")[1])}월 근무표 업데이트
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: C.muted,
                      }}>
                        {formattedDate}
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 10px",
                      backgroundColor: notification.status === "확정" ? C.okBg : C.goldBg,
                      color: notification.status === "확정" ? C.ok : C.gold,
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {notification.status}
                    </div>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr",
                    gap: "8px 16px",
                    marginBottom: notification.message ? 12 : 0,
                    fontSize: 13,
                  }}>
                    <div style={{ color: C.muted }}>버전</div>
                    <div style={{ color: C.text, fontWeight: 500 }}>
                      {notification.version}
                    </div>

                    <div style={{ color: C.muted }}>발송 채널</div>
                    <div style={{ color: C.text, fontWeight: 500 }}>
                      {notification.channels}
                    </div>
                  </div>

                  {notification.message && (
                    <div style={{
                      padding: 12,
                      backgroundColor: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 4,
                      fontSize: 13,
                      color: C.text,
                      lineHeight: 1.6,
                      marginBottom: 12,
                    }}>
                      💬 {notification.message}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      // 근무표로 이동하는 로직
                      window.location.href = "/schedule";
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 16px",
                      backgroundColor: C.navy,
                      color: C.warmWhite,
                      border: "none",
                      borderRadius: 4,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = C.navyDeep;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = C.navy;
                    }}
                  >
                    근무표 보러가기
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* E. 연간 야간조 계획 반영 현황 */}
        <section style={{
          backgroundColor: C.white,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          padding: 32,
        }}>
          <div style={{
            fontSize: 16,
            fontWeight: 600,
            color: C.navyDeep,
            marginBottom: 8,
            fontFamily: "'Cormorant Garamond', serif",
          }}>
            연간 야간조 계획 반영 현황
          </div>
          <div style={{
            fontSize: 13,
            color: C.muted,
            marginBottom: 24,
            lineHeight: 1.6,
          }}>
            연간 야간조 대상자 계획에서의 지정 상태와 실제 근무표 반영 여부를 확인할 수 있습니다.
          </div>

          {/* 연도 선택 */}
          <div style={{ marginBottom: 20 }}>
            <select
              style={{
                padding: "8px 12px",
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                fontSize: 13,
                color: C.navy,
                fontWeight: 500,
                backgroundColor: C.white,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option>2026년</option>
              <option>2025년</option>
            </select>
          </div>

          {/* 월별 상태 테이블 */}
          <div style={{
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            overflow: "hidden",
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
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.muted,
                  }}>
                    월
                  </th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.muted,
                  }}>
                    계획 상태
                  </th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.muted,
                  }}>
                    실제 반영
                  </th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: C.muted,
                  }}>
                    비고
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { month: 1, plan: "미지정", applied: false, note: "-" },
                  { month: 2, plan: "예비 대상자", applied: false, note: "우선 대상자로 충분" },
                  { month: 3, plan: "우선 대상자", applied: true, note: "정상 반영" },
                  { month: 4, plan: "우선 대상자", applied: true, note: "정상 반영" },
                  { month: 5, plan: "우선 대상자", applied: false, note: "연차 승인과 충돌" },
                  { month: 6, plan: "예비 대상자", applied: true, note: "부족 인원 발생으로 반영" },
                  { month: 7, plan: "제외 대상자", applied: false, note: "제외 처리됨" },
                  { month: 8, plan: "미지정", applied: false, note: "-" },
                  { month: 9, plan: "우선 대상자", applied: true, note: "정상 반영" },
                  { month: 10, plan: "우선 대상자", applied: true, note: "정상 반영" },
                  { month: 11, plan: "예비 대상자", applied: false, note: "-" },
                  { month: 12, plan: "미지정", applied: false, note: "-" },
                ].map((item, idx) => {
                  let planBg = C.white;
                  let planColor = C.muted;
                  let planText = item.plan;

                  if (item.plan === "우선 대상자") {
                    planBg = C.goldBg;
                    planColor = C.gold;
                  } else if (item.plan === "예비 대상자") {
                    planBg = C.warnBg;
                    planColor = C.warning;
                  } else if (item.plan === "제외 대상자") {
                    planBg = C.bg;
                    planColor = C.muted;
                  }

                  return (
                    <tr
                      key={item.month}
                      style={{
                        borderBottom: idx < 11 ? `1px solid ${C.borderLight}` : "none",
                      }}
                    >
                      <td style={{
                        padding: "12px 16px",
                        fontSize: 13,
                        fontWeight: 500,
                        color: C.text,
                      }}>
                        {item.month}월
                      </td>
                      <td style={{
                        padding: "12px 16px",
                        textAlign: "center",
                      }}>
                        <span style={{
                          padding: "4px 10px",
                          backgroundColor: planBg,
                          color: planColor,
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}>
                          {planText}
                        </span>
                      </td>
                      <td style={{
                        padding: "12px 16px",
                        textAlign: "center",
                      }}>
                        {item.applied ? (
                          <span style={{
                            padding: "4px 10px",
                            backgroundColor: C.okBg,
                            color: C.ok,
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}>
                            ✓ 반영
                          </span>
                        ) : (
                          <span style={{
                            padding: "4px 10px",
                            backgroundColor: C.bg,
                            color: C.muted,
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}>
                            미반영
                          </span>
                        )}
                      </td>
                      <td style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        color: C.muted,
                      }}>
                        {item.note}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}