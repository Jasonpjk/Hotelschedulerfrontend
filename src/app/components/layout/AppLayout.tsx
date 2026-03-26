import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { type Lang, LANGS, DT } from "../../i18n";
import { LangContext } from "../../context/LangContext";
import { HotelContext } from "../../context/HotelContext";
import lotteLogo from "figma:asset/b5f675b5ca48c50750fc1b535604b775fca63344.png";
import lotteBreadcrumbLogo from "figma:asset/5400b4c48b63489e4c64ed0d14cc058b70dca12a.png";

/* ── colour tokens ─────────────────────────────────────── */
const C = {
  navy:       "#0D1B2A",
  navyDeep:   "#091523",
  navyHover:  "#182D42",
  navyActive: "#1E3550",
  gold:       "#B99B5A",
  goldDim:    "rgba(185,155,90,0.55)",
  bg:         "#F2EFE9",
  white:      "#FFFFFF",
  border:     "#E4DED4",
  muted:      "#7B8390",
  charcoal:   "#2E3642",
};

/* ══════════════════════════════════════════════════════════
   언어 선택 드롭다운 (구조 유지 / 향후 다국어 전환 구현 예정)
══════════════════════════════════════════════════════════ */
function LangSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // 현재 시안은 한국어 고정. 향후 실제 전환 기능 연결 예정.
  const CURRENT: Lang = "ko";
  const current = LANGS.find((l) => l.code === CURRENT)!;

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "transparent", border: `1px solid ${C.border}`,
          borderRadius: 2, padding: "5px 10px", cursor: "pointer",
          fontSize: 11.5, letterSpacing: "0.04em",
          fontFamily: "'Inter', sans-serif", transition: "border-color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.gold)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
      >
        <GlobeIcon color={C.muted} />
        <span style={{ fontWeight: 500, color: C.charcoal }}>{current.native}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round"
          style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)", color: C.muted }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          backgroundColor: C.white, border: `1px solid ${C.border}`,
          borderRadius: 3, overflow: "hidden", zIndex: 200,
          boxShadow: "0 10px 28px rgba(0,0,0,0.10)", minWidth: 174,
        }}>
          {/* 안내 배너 */}
          <div style={{
            padding: "8px 14px 7px", borderBottom: `1px solid ${C.border}`,
            backgroundColor: "#FAF8F4",
          }}>
            <span style={{ fontSize: 10.5, color: C.muted, letterSpacing: "0.02em", lineHeight: 1.5 }}>
              다국어 전환 기능 개발 예정
            </span>
          </div>

          {LANGS.map((l) => {
            const isActive = l.code === CURRENT;
            return (
              <div
                key={l.code}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 8, padding: "9px 14px",
                  borderLeft: isActive ? `2px solid ${C.gold}` : "2px solid transparent",
                  backgroundColor: isActive ? "rgba(185,155,90,0.06)" : "transparent",
                  cursor: isActive ? "default" : "not-allowed",
                  opacity: isActive ? 1 : 0.45,
                }}
              >
                <span style={{
                  fontSize: 13,
                  color: isActive ? C.navy : C.muted,
                  fontWeight: isActive ? 500 : 400,
                }}>
                  {l.native}
                </span>
                <span style={{ fontSize: 10, color: C.goldDim, letterSpacing: "0.06em" }}>
                  {l.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── 사이드바 메뉴 항목 ──────────────────────────────────── */
function navItems(t: typeof DT["ko"]) {
  return [
    { key: "dashboard", label: t.navDashboard, path: "/dashboard", icon: <DashIcon /> },
    { key: "schedule",  label: t.navSchedule,  path: "/schedule",  icon: <CalIcon /> },
    { key: "employees", label: t.navEmployees, path: "/employees", icon: <PeopleIcon /> },
    { key: "request",   label: "근태 신청",     path: "/request",   icon: <RequestIcon /> },
    { key: "attendance", label: "근태 관리",    path: "/attendance", icon: <LeaveIcon /> },
    { key: "demand",    label: t.navDemand,    path: "/demand",    icon: <BarIcon /> },
    { key: "settings",  label: t.navSettings,  path: "/settings",  icon: <GearIcon /> },
  ];
}

const HOTELS = [
  "롯데시티호텔 마포",
  "롯데시티호텔 김포",
  "롯데시티호텔 제주",
  "롯데시티호텔 대전",
  "롯데시티호텔 구로",
  "롯데시티호텔 울산",
  "롯데시티호텔 명동",
  "L7 명동",
  "L7 강남",
  "L7 홍대",
  "L7 해운대",
  "L7 광명",
];

/* ════════════════════════════════════════════════════════
   AppLayout
════════════════════════════════════════════════════════ */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 시안: 한국어 고정. 향후 getLang()으로 교체하여 다국어 전환 연결 예정.
  const lang: Lang = "ko";
  const t = DT[lang];
  const nav = navItems(t);

  const [hotel, setHotel] = useState(HOTELS[0]);
  const [hotelOpen, setHotelOpen] = useState(false);
  const hotelRef = useRef<HTMLDivElement>(null);
  const activePath = location.pathname;

  useEffect(() => {
    function h(e: MouseEvent) {
      if (hotelRef.current && !hotelRef.current.contains(e.target as Node)) setHotelOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <LangContext.Provider value={lang}>
      <HotelContext.Provider value={hotel}>
        <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', sans-serif", backgroundColor: C.bg, overflow: "hidden" }}>

          {/* ── 사이드바 ───────────────────────────────────── */}
          <aside style={{
            width: 216, minWidth: 216, backgroundColor: C.navy,
            display: "flex", flexDirection: "column",
            borderRight: "1px solid rgba(255,255,255,0.04)", flexShrink: 0,
          }}>

            {/* 브랜드 */}
            <div style={{ padding: "20px 16px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "center" }}>
              <img 
                src={lotteLogo} 
                alt="LOTTE HOTELS & RESORTS"
                style={{ 
                  width: "auto", 
                  height: 80,
                  display: "block",
                }} 
              />
            </div>

            {/* 메뉴 */}
            <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
              <div style={{ padding: "0 8px", marginBottom: 8 }}>
                <span style={{ fontSize: 9, letterSpacing: "0.18em", color: "rgba(255,255,255,0.18)", fontWeight: 600, textTransform: "uppercase" }}>
                  메뉴
                </span>
              </div>
              {nav.map((item) => {
                const active = activePath === item.path;
                return (
                  <button
                    key={item.key}
                    onClick={() => navigate(item.path)}
                    style={{
                      display: "flex", alignItems: "center", gap: 9,
                      width: "100%", padding: "9px 10px", margin: "1px 0",
                      background: "none", border: "none", cursor: "pointer",
                      borderRadius: 3, textAlign: "left",
                      backgroundColor: active ? C.navyActive : "transparent",
                      borderLeft: active ? `2px solid ${C.gold}` : "2px solid transparent",
                      transition: "all 0.15s", outline: "none",
                    }}
                    onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = C.navyHover; }}
                    onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                  >
                    <span style={{ color: active ? C.gold : "rgba(255,255,255,0.32)", display: "flex", flexShrink: 0 }}>{item.icon}</span>
                    <span style={{
                      fontSize: 12.5,
                      color: active ? "#EAE0CC" : "rgba(255,255,255,0.45)",
                      fontWeight: active ? 500 : 400,
                      letterSpacing: "0.01em",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* 사용자 */}
            <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <button
                onClick={() => navigate("/")}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  width: "100%", padding: "8px 10px",
                  background: "none", border: "none", cursor: "pointer",
                  borderRadius: 3, textAlign: "left", outline: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = C.navyHover}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  backgroundColor: C.navyActive, border: `1px solid ${C.goldDim}`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: 10.5, color: C.gold, fontWeight: 500 }}>김</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "rgba(234,224,204,0.85)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    김재민
                  </div>
                  <div style={{ fontSize: 10, color: C.goldDim, letterSpacing: "0.04em" }}>
                    {t.roleAdmin}
                  </div>
                </div>
              </button>
            </div>
          </aside>

          {/* ── 본문 영역 ──────────────────────────────────── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

            {/* 헤더 */}
            <header style={{
              height: 52, backgroundColor: C.white,
              borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 24px", flexShrink: 0, zIndex: 10,
            }}>
              {/* 좌: 브레드크럼 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img 
                  src={lotteBreadcrumbLogo} 
                  alt="LOTTE HOTELS & RESORTS"
                  style={{ 
                    height: 16, 
                    width: "auto",
                    display: "block",
                    opacity: 0.85,
                  }} 
                />
                <span style={{ fontSize: 11, color: C.border }}>›</span>
                <span style={{ fontSize: 12.5, color: C.charcoal, fontWeight: 500, letterSpacing: "0.01em" }}>
                  {nav.find((n) => n.path === activePath)?.label ?? t.navDashboard}
                </span>
              </div>

              {/* 우: 언어 선택 / 호텔 선택 / 알림 / 사용자 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

                {/* 언어 선택 드롭다운 (향후 다국어 전환 연결 예정) */}
                <LangSwitcher />

                {/* 구분선 */}
                <div style={{ width: 1, height: 18, backgroundColor: C.border }} />

                {/* 호텔 선택 */}
                <div ref={hotelRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setHotelOpen(!hotelOpen)}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "5px 11px", border: `1px solid ${C.border}`,
                      borderRadius: 2, background: "none", cursor: "pointer",
                      fontSize: 12, color: C.charcoal, fontWeight: 500,
                      letterSpacing: "0.01em", transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.gold)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
                  >
                    <HotelIcon />
                    {hotel}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round"
                      style={{ transition: "transform 0.2s", transform: hotelOpen ? "rotate(180deg)" : "rotate(0)" }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {hotelOpen && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 6px)", right: 0,
                      backgroundColor: C.white, border: `1px solid ${C.border}`,
                      borderRadius: 3, boxShadow: "0 8px 24px rgba(0,0,0,0.09)",
                      minWidth: 210, zIndex: 100,
                    }}>
                      {HOTELS.map((h) => (
                        <button
                          key={h}
                          onClick={() => { setHotel(h); setHotelOpen(false); }}
                          style={{
                            display: "block", width: "100%", padding: "9px 14px",
                            background: "none", border: "none", textAlign: "left",
                            fontSize: 12.5, cursor: "pointer",
                            borderLeft: h === hotel ? `2px solid ${C.gold}` : "2px solid transparent",
                            color: h === hotel ? C.navy : C.charcoal,
                            fontWeight: h === hotel ? 500 : 400,
                            backgroundColor: h === hotel ? "rgba(185,155,90,0.05)" : "transparent",
                          }}
                          onMouseEnter={(e) => { if (h !== hotel) (e.currentTarget as HTMLElement).style.backgroundColor = "#F9F6F1"; }}
                          onMouseLeave={(e) => { if (h !== hotel) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 구분선 */}
                <div style={{ width: 1, height: 18, backgroundColor: C.border }} />

                {/* 알림 */}
                <button style={{
                  position: "relative", background: "none", border: "none",
                  cursor: "pointer", padding: 6, borderRadius: 3, color: C.muted, display: "flex",
                }}>
                  <BellIcon />
                  <span style={{
                    position: "absolute", top: 5, right: 5,
                    width: 6, height: 6, borderRadius: "50%",
                    backgroundColor: "#C8543A", border: `1.5px solid ${C.white}`,
                  }} />
                </button>

                {/* 사용자 */}
                <button
                  onClick={() => navigate("/")}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    background: "none", border: "none", cursor: "pointer",
                    padding: "4px 8px", borderRadius: 3,
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    backgroundColor: C.navy,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 10, color: C.gold, fontWeight: 500 }}>김</span>
                  </div>
                  <span style={{ fontSize: 12, color: C.charcoal, fontWeight: 500 }}>김재민</span>
                </button>
              </div>
            </header>

            {/* 콘텐츠 */}
            <main style={{ flex: 1, overflow: "hidden", backgroundColor: C.bg, display: "flex", flexDirection: "column" }}>
              {children}
            </main>

            {/* 하단 바 */}
            <div style={{
              height: 32, backgroundColor: C.white, borderTop: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 24px", flexShrink: 0,
            }}>
              <span style={{ fontSize: 10.5, color: C.muted, letterSpacing: "0.04em" }}>{t.footerCopy}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#3A7D5B" }} />
                <span style={{ fontSize: 10.5, color: C.muted }}>{t.systemNormal}</span>
              </div>
            </div>
          </div>
        </div>
      </HotelContext.Provider>
    </LangContext.Provider>
  );
}

/* ── 아이콘 ──────────────────────────────────────────────── */
function DashIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>; }
function CalIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function PeopleIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function RequestIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="15" x2="15" y2="15" /></svg>; }
function LeaveIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>; }
function BarIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>; }
function GearIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>; }
function HotelIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>; }
function BellIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>; }
function GlobeIcon({ color = "currentColor" }: { color?: string }) { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>; }