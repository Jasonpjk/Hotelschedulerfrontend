import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AppLayout from "../components/layout/AppLayout";
import { useHotel } from "../context/HotelContext";
import { useAuth } from "../context/AuthContext";
import { getHotelApi, getScheduleVersionsApi, generateScheduleApi, getTaskApi } from "../utils/api";

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
  ok:          "#2E7D52",
  okBg:        "rgba(46,125,82,0.07)",
  okBorder:    "rgba(46,125,82,0.2)",
  warning:     "#B87C1A",
  warnBg:      "rgba(184,124,26,0.08)",
  warnBorder:  "rgba(184,124,26,0.22)",
  pending:     "#5E7FA3",
  pendingBg:   "rgba(94,127,163,0.08)",
  pendingBorder: "rgba(94,127,163,0.22)",
  risk:        "#B83232",
  riskBg:      "rgba(184,50,50,0.06)",
  riskBorder:  "rgba(184,50,50,0.22)",
};

/* ══════════════════════════════════════════════════════════
   UTILITY COMPONENTS
══════════════════════════════════════════════════════════ */
function Badge({ label, variant }: { label: string; variant: "complete" | "progress" | "review" | "notstarted" | "risk" }) {
  const map = {
    complete:   { bg: C.okBg, color: C.ok, border: C.okBorder },
    progress:   { bg: C.pendingBg, color: C.pending, border: C.pendingBorder },
    review:     { bg: C.warnBg, color: C.warning, border: C.warnBorder },
    notstarted: { bg: C.bg, color: C.muted, border: C.border },
    risk:       { bg: C.riskBg, color: C.risk, border: C.riskBorder },
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
   전체 변경 이력 데이터
══════════════════════════════════════════════════════════ */
const ALL_LOGS = [
  { type: "AI 조정", typeBg: "rgba(185,155,90,0.08)", typeColor: "#7A5518", target: "4월 12일 오전조 인력 배치", actor: "시스템 (AI)", role: "자동", detail: "오전조 인원 1명 추가 배치", time: "2026.03.26 14:32" },
  { type: "근태 반영", typeBg: "rgba(46,125,82,0.07)", typeColor: "#2E7D52", target: "박소연 연차 자동 반영", actor: "시스템 (자동)", role: "자동", detail: "4월 8일 연차 반영", time: "2026.03.26 11:20" },
  { type: "직원 추가", typeBg: "rgba(94,127,163,0.08)", typeColor: "#5E7FA3", target: "이민준 (L2 · 오전조)", actor: "김재민", role: "최종 관리자", detail: "오전조 신규 배치", time: "2026.03.25 16:45" },
  { type: "정책 수정", typeBg: "rgba(184,124,26,0.08)", typeColor: "#B87C1A", target: "최소 조별 인원 4명 → 5명", actor: "김재민", role: "최종 관리자", detail: "오전조 최소 인원 변경", time: "2026.03.24 10:15" },
  { type: "회원 승인", typeBg: "rgba(46,125,82,0.07)", typeColor: "#2E7D52", target: "최유리 회원가입 승인", actor: "김재민", role: "최종 관리자", detail: "일반 직원 권한 부여", time: "2026.03.23 14:20" },
  { type: "근무표 생성", typeBg: "rgba(94,127,163,0.08)", typeColor: "#5E7FA3", target: "v3.3 생성", actor: "박지현", role: "운영 관리자", detail: "2026년 4월 v3.3 신규 생성", time: "2026.03.22 09:30" },
  { type: "AI 조정", typeBg: "rgba(185,155,90,0.08)", typeColor: "#7A5518", target: "4월 14일 야간조 인차지 배치", actor: "시스템 (AI)", role: "자동", detail: "인차지 부족 자동 감지 후 조정", time: "2026.03.21 17:05" },
  { type: "근태 반영", typeBg: "rgba(46,125,82,0.07)", typeColor: "#2E7D52", target: "정우진 병가 반영", actor: "시스템 (자동)", role: "자동", detail: "4월 5일~6일 병가 처리", time: "2026.03.21 14:50" },
  { type: "정책 수정", typeBg: "rgba(184,124,26,0.08)", typeColor: "#B87C1A", target: "14일 4휴무 규칙 설명 업데이트", actor: "김재민", role: "최종 관리자", detail: "정책 설명 텍스트 수정", time: "2026.03.20 11:00" },
  { type: "직원 수정", typeBg: "rgba(184,124,26,0.08)", typeColor: "#B87C1A", target: "이서우 조 변경 (오전→오후)", actor: "박지현", role: "운영 관리자", detail: "오후조 전환 적용", time: "2026.03.19 13:22" },
  { type: "회원 승인", typeBg: "rgba(46,125,82,0.07)", typeColor: "#2E7D52", target: "김민준 회원가입 승인", actor: "김재민", role: "최종 관리자", detail: "일반 직원 권한 부여", time: "2026.03.19 10:15" },
  { type: "근무표 생성", typeBg: "rgba(94,127,163,0.08)", typeColor: "#5E7FA3", target: "v3.2 생성", actor: "박지현", role: "운영 관리자", detail: "2026년 4월 v3.2 신규 생성", time: "2026.03.18 09:00" },
];

/* ══════════════════════════════════════════════════════════
   DASHBOARD PAGE
══════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { hotel } = useHotel();
  const { user } = useAuth();

  // 모달 상태
  const [newVersionModal, setNewVersionModal] = useState(false);
  const [newVersionStep, setNewVersionStep] = useState<"confirm" | "generating" | "done">("confirm");
  const [downloadModal, setDownloadModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);

  // 실제 데이터 상태
  const [hotelData, setHotelData] = useState<any>(null);
  const [latestVersion, setLatestVersion] = useState<any>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  useEffect(() => {
    if (!user?.hotel_id) return;
    getHotelApi(user.hotel_id).then(setHotelData).catch(() => {});
    getScheduleVersionsApi(user.hotel_id, currentYear, currentMonth)
      .then((versions) => { if (versions.length) setLatestVersion(versions[versions.length - 1]); })
      .catch(() => {});
  }, [user?.hotel_id]);

  // 새 버전 생성 핸들러 (실제 API)
  const handleNewVersionConfirm = async () => {
    if (!user?.hotel_id) return;
    setNewVersionStep("generating");
    try {
      const { task_id } = await generateScheduleApi({ hotel_id: user.hotel_id, year: currentYear, month: currentMonth });
      // 태스크 완료까지 폴링
      const poll = setInterval(async () => {
        const task = await getTaskApi(task_id);
        if (task.state === "SUCCESS") {
          clearInterval(poll);
          // 새 버전 목록 갱신
          const versions = await getScheduleVersionsApi(user.hotel_id!, currentYear, currentMonth);
          if (versions.length) setLatestVersion(versions[versions.length - 1]);
          setNewVersionStep("done");
        } else if (task.state === "FAILURE") {
          clearInterval(poll);
          setNewVersionStep("confirm");
          alert("근무표 생성에 실패했습니다.");
        }
      }, 2000);
    } catch {
      setNewVersionStep("confirm");
      alert("근무표 생성 요청에 실패했습니다.");
    }
  };

  const handleNewVersionClose = () => {
    setNewVersionModal(false);
    setNewVersionStep("confirm");
  };

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
           상단 상태 바
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
              <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{hotel}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>대상 월</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{currentYear}년 {currentMonth}월</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>근무표 버전</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{latestVersion ? `v${latestVersion.version_number}` : "—"}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>근무표 상태</div>
              {latestVersion
                ? <Badge label={latestVersion.status === "final" ? "확정" : latestVersion.status === "locked" ? "검토 중" : "작업 중"} variant={latestVersion.status === "final" ? "complete" : latestVersion.status === "locked" ? "review" : "progress"} />
                : <Badge label="미생성" variant="notstarted" />}
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>수요 예측</div>
              <Badge label="최신" variant="complete" />
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>직원 기준</div>
              <Badge label="확정" variant="complete" />
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>마지막 반영</div>
              <div style={{ fontSize: 11, color: C.charcoal }}>
                {latestVersion?.updated_at
                  ? new Date(latestVersion.updated_at).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
           메인 콘텐츠 영역
        ══════════════════════════════════════════════════ */}
        <div style={{ flex: 1, overflow: "auto", padding: "32px 40px" }}>
          
          {/* KPI 카드 영역 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16, marginBottom: 28 }}>
            {/* 오늘 체크인 */}
            <div style={{
              backgroundColor: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: "20px 18px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = C.gold}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 9, letterSpacing: "0.08em", color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>오늘 체크인</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.navy, lineHeight: 1, marginBottom: 6 }}>186</div>
              <div style={{ fontSize: 10, color: C.muted }}>예상 객실</div>
            </div>

            {/* 오늘 체크아웃 */}
            <div style={{
              backgroundColor: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: "20px 18px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = C.gold}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 9, letterSpacing: "0.08em", color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>오늘 체크아웃</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.navy, lineHeight: 1, marginBottom: 6 }}>142</div>
              <div style={{ fontSize: 10, color: C.muted }}>예상 객실</div>
            </div>

            {/* 이번 주 리스크 */}
            <div style={{
              backgroundColor: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: "20px 18px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = C.risk}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 9, letterSpacing: "0.08em", color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>리스크 일수</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.risk, lineHeight: 1, marginBottom: 6 }}>4</div>
              <div style={{ fontSize: 10, color: C.risk }}>이번 주</div>
            </div>

            {/* 근태 검토 필요 */}
            <div style={{
              backgroundColor: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: "20px 18px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onClick={() => navigate("/request")}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = C.warning}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 9, letterSpacing: "0.08em", color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>근태 검토</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.warning, lineHeight: 1, marginBottom: 6 }}>3</div>
              <div style={{ fontSize: 10, color: C.warning }}>검토 필요 건</div>
            </div>

            {/* 미반영 직원 */}
            <div style={{
              backgroundColor: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: "20px 18px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onClick={() => navigate("/employees")}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = C.warning}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 9, letterSpacing: "0.08em", color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>미반영 직원</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.warning, lineHeight: 1, marginBottom: 6 }}>2</div>
              <div style={{ fontSize: 10, color: C.warning }}>근무표 미반영</div>
            </div>

            {/* 승인 대기 */}
            <div style={{
              backgroundColor: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: "20px 18px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onClick={() => navigate("/settings")}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = C.pending}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}>
              <div style={{ fontSize: 9, letterSpacing: "0.08em", color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase" }}>승인 대기</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.pending, lineHeight: 1, marginBottom: 6 }}>5</div>
              <div style={{ fontSize: 10, color: C.pending }}>회원가입 대기</div>
            </div>
          </div>

          {/* 중간 2열 주요 블록 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            
            {/* 운영 진행 단계 */}
            <div style={{
              backgroundColor: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: "24px 26px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 18, fontFamily: "'Cormorant Garamond', serif" }}>
                운영 진행 단계
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* 1단계 */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  backgroundColor: C.okBg,
                  border: `1px solid ${C.okBorder}`,
                  borderRadius: 3,
                  cursor: "pointer",
                }}
                onClick={() => navigate("/employees")}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: C.ok,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <CheckIcon />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.ok, marginBottom: 2 }}>1. 직원 관리 기준 확정</div>
                    <div style={{ fontSize: 10, color: C.muted }}>48명 · 조 배치 완료</div>
                  </div>
                  <Badge label="완료" variant="complete" />
                </div>

                {/* 2단계 */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  backgroundColor: C.okBg,
                  border: `1px solid ${C.okBorder}`,
                  borderRadius: 3,
                  cursor: "pointer",
                }}
                onClick={() => navigate("/demand")}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: C.ok,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <CheckIcon />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.ok, marginBottom: 2 }}>2. 수요 예측 결과 확정</div>
                    <div style={{ fontSize: 10, color: C.muted }}>2026년 4월 · 최신 상태</div>
                  </div>
                  <Badge label="완료" variant="complete" />
                </div>

                {/* 3단계 */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  backgroundColor: C.warnBg,
                  border: `1px solid ${C.warnBorder}`,
                  borderRadius: 3,
                  cursor: "pointer",
                }}
                onClick={() => navigate("/attendance")}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: C.warning,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>!</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.warning, marginBottom: 2 }}>3. 근태 신청 자동 반영 검토</div>
                    <div style={{ fontSize: 10, color: C.charcoal }}>검토 필요 3건 · 미반영 직원 2명</div>
                  </div>
                  <Badge label="검토 필요" variant="review" />
                </div>

                {/* 4단계 */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  backgroundColor: C.pendingBg,
                  border: `1px solid ${C.pendingBorder}`,
                  borderRadius: 3,
                  cursor: "pointer",
                }}
                onClick={() => navigate("/schedule")}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: C.pending,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>4</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.pending, marginBottom: 2 }}>4. 근무표 최종 확정</div>
                    <div style={{ fontSize: 10, color: C.charcoal }}>v3.3 작업 중 · 확정 필요</div>
                  </div>
                  <Badge label="진행 중" variant="progress" />
                </div>
              </div>
            </div>

            {/* 운영 경고 요약 */}
            <div style={{
              backgroundColor: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: "24px 26px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                  운영 경고 요약
                </div>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: C.riskBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.risk,
                }}>4</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "12px 0",
                  borderBottom: `1px solid ${C.borderLight}`,
                }}>
                  <WarnIcon />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5, color: C.charcoal, marginBottom: 3 }}>4월 12일 최소 조별 인원 2명 부족</div>
                    <div style={{ fontSize: 10, color: C.muted }}>오전조 · 인력 추가 배치 필요</div>
                  </div>
                  <Badge label="위험" variant="risk" />
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "12px 0",
                  borderBottom: `1px solid ${C.borderLight}`,
                }}>
                  <WarnIcon />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5, color: C.charcoal, marginBottom: 3 }}>4월 14일 인차지 배치 부족</div>
                    <div style={{ fontSize: 10, color: C.muted }}>야간조 · 인차지 1명 이상 필요</div>
                  </div>
                  <Badge label="위험" variant="risk" />
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "12px 0",
                  borderBottom: `1px solid ${C.borderLight}`,
                }}>
                  <AlertIcon />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5, color: C.charcoal, marginBottom: 3 }}>4월 20일 공휴 운영 인원 부족 가능</div>
                    <div style={{ fontSize: 10, color: C.muted }}>주말 · 예비 인력 검토 필요</div>
                  </div>
                  <Badge label="검토" variant="review" />
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "12px 0",
                }}>
                  <AlertIcon />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5, color: C.charcoal, marginBottom: 3 }}>4월 2주차 근태 신청 미반영 직원 3명</div>
                    <div style={{ fontSize: 10, color: C.muted }}>근태 관리 화면에서 확인 필요</div>
                  </div>
                  <Badge label="검토" variant="review" />
                </div>
              </div>
            </div>
          </div>

          {/* 중간 3열 주요 블록 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            
            {/* 근무표 상태 카드 */}
            <div style={{
              backgroundColor: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: "22px 24px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 16, fontFamily: "'Cormorant Garamond', serif" }}>
                근무표 상태
              </div>

              <div style={{
                padding: "14px 16px",
                backgroundColor: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 3,
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>현재 버전</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>v3.3</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>상태</span>
                  <Badge label="작업 중" variant="progress" />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>AI 조정 이력</span>
                  <span style={{ fontSize: 11, color: C.charcoal }}>12회</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, color: C.muted }}>최근 수정</span>
                  <span style={{ fontSize: 10, color: C.charcoal }}>2026.03.26 14:32</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => navigate("/schedule")}
                  style={{
                    padding: "9px 16px",
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
                  보기
                </button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {/* 새 버전 버튼 */}
                  <button
                    onClick={() => { setNewVersionStep("confirm"); setNewVersionModal(true); }}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: C.white,
                      color: C.charcoal,
                      border: `1px solid ${C.border}`,
                      borderRadius: 3,
                      fontSize: 10,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = C.navy;
                      (e.currentTarget as HTMLButtonElement).style.color = C.navy;
                      (e.currentTarget as HTMLButtonElement).style.fontWeight = "600";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
                      (e.currentTarget as HTMLButtonElement).style.color = C.charcoal;
                      (e.currentTarget as HTMLButtonElement).style.fontWeight = "500";
                    }}
                  >
                    새 버전
                  </button>
                  {/* 다운로드 버튼 */}
                  <button
                    onClick={() => setDownloadModal(true)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: C.white,
                      color: C.charcoal,
                      border: `1px solid ${C.border}`,
                      borderRadius: 3,
                      fontSize: 10,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = C.gold;
                      (e.currentTarget as HTMLButtonElement).style.color = "#7A5518";
                      (e.currentTarget as HTMLButtonElement).style.fontWeight = "600";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
                      (e.currentTarget as HTMLButtonElement).style.color = C.charcoal;
                      (e.currentTarget as HTMLButtonElement).style.fontWeight = "500";
                    }}
                  >
                    다운로드
                  </button>
                </div>
              </div>
            </div>

            {/* 근태 신청/반영 요약 */}
            <div style={{
              backgroundColor: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: "22px 24px",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                  근태 신청/반영
                </div>
                <button
                  onClick={() => navigate("/request")}
                  style={{
                    fontSize: 10,
                    color: C.gold,
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  상세 →
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: C.muted }}>자동 반영 완료</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.ok }}>12건</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: C.muted }}>검토 필요</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.warning }}>3건</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: C.muted }}>반영 불가</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.risk }}>1건</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: C.muted }}>반영 안 된 직원</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.charcoal }}>2명</span>
                </div>
              </div>

              <div style={{
                padding: "10px 12px",
                backgroundColor: C.warnBg,
                border: `1px solid ${C.warnBorder}`,
                borderRadius: 3,
              }}>
                <div style={{ fontSize: 10, color: C.warning, lineHeight: 1.6 }}>
                  검토 필요 3건을 확인하여 근무표에 반영하세요.
                </div>
              </div>
            </div>

            {/* 수요 예측 & 직원 관리 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              {/* 수요 예측 요약 */}
              <div style={{
                backgroundColor: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                padding: "18px 20px",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                    수요 예측
                  </div>
                  <button
                    onClick={() => navigate("/demand")}
                    style={{
                      fontSize: 10,
                      color: C.gold,
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    상세 →
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: C.muted }}>피크 체크인일</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.navy }}>4월 12일</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: C.muted }}>피크 체크아웃일</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.navy }}>4월 14일</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: C.muted }}>최근 예측 갱신</span>
                    <span style={{ fontSize: 10, color: C.charcoal }}>2026.03.20</span>
                  </div>
                </div>
              </div>

              {/* 직원 관리 상태 */}
              <div style={{
                backgroundColor: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                padding: "18px 20px",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                    직원 관리
                  </div>
                  <button
                    onClick={() => navigate("/employees")}
                    style={{
                      fontSize: 10,
                      color: C.gold,
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    상세 →
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: C.muted }}>총 직원 수</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>48명</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: C.muted }}>인차지</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>12명</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: C.muted }}>기준 상태</span>
                    <Badge label="확정" variant="complete" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 최근 변경 이력 */}
          <div style={{
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            padding: "22px 26px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                최근 변경 이력
              </div>
              {/* 전체보기 버튼 */}
              <button
                onClick={() => setHistoryModal(true)}
                style={{
                  fontSize: 10,
                  color: C.gold,
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                  padding: "4px 8px",
                  borderRadius: 3,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "#7A5518";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.goldBg;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = C.gold;
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
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
                <tr style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.charcoal }}>
                    <span style={{ display: "inline-flex", padding: "2px 8px", backgroundColor: C.goldBg, color: "#7A5518", borderRadius: 2, fontSize: 9, fontWeight: 600 }}>AI 조정</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.charcoal }}>4월 12일 오전조 인력 배치</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.muted }}>시스템 (AI)</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.muted, textAlign: "right" }}>2026.03.26 14:32</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.charcoal }}>
                    <span style={{ display: "inline-flex", padding: "2px 8px", backgroundColor: C.okBg, color: C.ok, borderRadius: 2, fontSize: 9, fontWeight: 600 }}>근태 반영</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.charcoal }}>박소연 연차 자동 반영</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.muted }}>시스템 (자동)</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.muted, textAlign: "right" }}>2026.03.26 11:20</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.charcoal }}>
                    <span style={{ display: "inline-flex", padding: "2px 8px", backgroundColor: C.pendingBg, color: C.pending, borderRadius: 2, fontSize: 9, fontWeight: 600 }}>직원 추가</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.charcoal }}>이민준 (L2 · 오전조)</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.muted }}>김재민</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.muted, textAlign: "right" }}>2026.03.25 16:45</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.charcoal }}>
                    <span style={{ display: "inline-flex", padding: "2px 8px", backgroundColor: C.warnBg, color: C.warning, borderRadius: 2, fontSize: 9, fontWeight: 600 }}>정책 수정</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.charcoal }}>최소 조별 인원 4명 → 5명</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.muted }}>김재민</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.muted, textAlign: "right" }}>2026.03.24 10:15</td>
                </tr>
                <tr>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.charcoal }}>
                    <span style={{ display: "inline-flex", padding: "2px 8px", backgroundColor: C.okBg, color: C.ok, borderRadius: 2, fontSize: 9, fontWeight: 600 }}>회원 승인</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.charcoal }}>최유리 회원가입 승인</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.muted }}>김재민</td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: C.muted, textAlign: "right" }}>2026.03.23 14:20</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════
         새 버전 생성 모달
      ══════════════════════════════════════════════════ */}
      {newVersionModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            width: 480,
            overflow: "hidden",
          }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAF8" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif", marginBottom: 4 }}>
                근무표 새 버전 생성
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>2026년 4월 · {hotel}</div>
            </div>

            <div style={{ padding: "24px" }}>
              {newVersionStep === "confirm" && (
                <>
                  <div style={{ padding: "16px", backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 3, marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: C.muted }}>현재 버전</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>v3.3</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: C.muted }}>생성될 버전</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.pending }}>v3.4</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: C.muted }}>대상 월</span>
                      <span style={{ fontSize: 11, color: C.charcoal }}>2026년 4월</span>
                    </div>
                  </div>
                  <div style={{ padding: "12px", backgroundColor: C.pendingBg, border: `1px solid ${C.pendingBorder}`, borderRadius: 3, marginBottom: 24, fontSize: 10, color: C.pending, lineHeight: 1.7 }}>
                    v3.3 기준 데이터를 복사하여 새 버전(v3.4)을 생성합니다.<br />
                    기존 v3.3은 유지되며, 새 버전에서 수정 작업을 이어갈 수 있습니다.
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      onClick={handleNewVersionClose}
                      style={{ padding: "8px 18px", backgroundColor: C.white, color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 12, cursor: "pointer" }}
                    >
                      취소
                    </button>
                    <button
                      onClick={handleNewVersionConfirm}
                      style={{ padding: "8px 20px", backgroundColor: C.navy, color: "#EAE0CC", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      새 버전 생성
                    </button>
                  </div>
                </>
              )}

              {newVersionStep === "generating" && (
                <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                  <div style={{ fontSize: 13, color: C.navy, fontWeight: 600, marginBottom: 10 }}>v3.4 생성 중...</div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 28 }}>v3.3 데이터를 기반으로 새 버전을 준비하고 있습니다.</div>
                  <div style={{ width: "100%", height: 4, backgroundColor: C.bg, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: "65%", height: "100%", backgroundColor: C.pending, borderRadius: 2 }} />
                  </div>
                </div>
              )}

              {newVersionStep === "done" && (
                <>
                  <div style={{ textAlign: "center", paddingBottom: 24 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%",
                      backgroundColor: C.okBg, border: `1px solid ${C.okBorder}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 16px",
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.ok} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 8 }}>v3.4가 생성되었습니다</div>
                    <div style={{ fontSize: 11, color: C.muted }}>2026년 4월 근무표 새 버전이 준비되었습니다.</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      onClick={handleNewVersionClose}
                      style={{ padding: "8px 18px", backgroundColor: C.white, color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 12, cursor: "pointer" }}
                    >
                      닫기
                    </button>
                    <button
                      onClick={() => { handleNewVersionClose(); navigate("/schedule"); }}
                      style={{ padding: "8px 20px", backgroundColor: C.navy, color: "#EAE0CC", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      근무표로 이동 →
                    </button>
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
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 4, width: 460, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, backgroundColor: "#FAFAF8" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif", marginBottom: 4 }}>
                근무표 다운로드
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>2026년 4월 · {hotel}</div>
            </div>

            <div style={{ padding: "24px" }}>
              {/* 현재 버전 정보 */}
              <div style={{ padding: "14px 16px", backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 3, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>대상 월</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>2026년 4월</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>현재 버전</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.navy }}>v3.3</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, color: C.muted }}>근무표 상태</span>
                  <Badge label="작업 중" variant="progress" />
                </div>
              </div>

              {/* 다운로드 형식 선택 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.charcoal, marginBottom: 10 }}>다운로드 형식</div>
                <div style={{
                  padding: "14px 16px",
                  backgroundColor: C.goldBg,
                  border: `1.5px solid ${C.goldBorder}`,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  cursor: "default",
                }}>
                  <div style={{
                    width: 36, height: 36,
                    backgroundColor: "#1D6F42",
                    borderRadius: 3,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em" }}>XLS</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.navy, marginBottom: 3 }}>Excel (.xlsx)</div>
                    <div style={{ fontSize: 10, color: C.muted }}>근무표 전체 · 조별 시트 포함</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ok} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  onClick={() => setDownloadModal(false)}
                  style={{ padding: "8px 18px", backgroundColor: C.white, color: C.charcoal, border: `1px solid ${C.border}`, borderRadius: 3, fontSize: 12, cursor: "pointer" }}
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    alert("2026년 4월 v3.3 근무표.xlsx 다운로드가 시작됩니다.");
                    setDownloadModal(false);
                  }}
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
         전체 변경 이력 모달
      ══════════════════════════════════════════════════ */}
      {historyModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
          padding: "40px 20px",
        }}>
          <div style={{
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            width: "100%",
            maxWidth: 860,
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* 헤더 */}
            <div style={{
              padding: "20px 28px",
              borderBottom: `1px solid ${C.border}`,
              backgroundColor: "#FAFAF8",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif", marginBottom: 4 }}>
                  전체 변경 이력
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>{hotel} · 전체 작업 로그</div>
              </div>
              <button
                onClick={() => setHistoryModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 3 }}
                onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.bg}
                onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 테이블 */}
            <div style={{ overflow: "auto", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                  <tr style={{ backgroundColor: "#F7F4EF" }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>작업 유형</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>대상</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>변경 내용</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>작업자</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>권한</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 9, color: C.muted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>일시</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_LOGS.map((log, i) => (
                    <tr key={i} style={{
                      borderBottom: `1px solid ${C.borderLight}`,
                      backgroundColor: i % 2 === 1 ? "#FAFAF8" : C.white,
                    }}>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{
                          display: "inline-flex",
                          padding: "2px 9px",
                          backgroundColor: log.typeBg,
                          color: log.typeColor,
                          borderRadius: 2,
                          fontSize: 9,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}>
                          {log.type}
                        </span>
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

            {/* 푸터 */}
            <div style={{
              padding: "14px 28px",
              borderTop: `1px solid ${C.border}`,
              backgroundColor: "#FAFAF8",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 10, color: C.muted }}>전체 {ALL_LOGS.length}건 표시</div>
              <button
                onClick={() => setHistoryModal(false)}
                style={{ padding: "8px 24px", backgroundColor: C.navy, color: "#EAE0CC", border: "none", borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

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
