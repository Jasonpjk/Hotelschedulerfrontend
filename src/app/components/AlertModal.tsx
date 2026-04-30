/* ══════════════════════════════════════════════════════════
   LOTTE HOTELS & RESORTS 알림 모달
   - 브라우저 기본 alert 대체
   - 절제된 럭셔리 디자인
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
};

interface AlertModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export default function AlertModal({ isOpen, message, onClose }: AlertModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(13, 27, 42, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: C.white,
          borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          width: "100%",
          maxWidth: 400,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${C.borderLight}`,
          backgroundColor: C.bg,
        }}>
          <div style={{
            fontSize: 16,
            fontWeight: 600,
            color: C.navy,
            fontFamily: "'Cormorant Garamond', serif",
          }}>
            알림
          </div>
        </div>

        {/* 본문 */}
        <div style={{
          padding: "24px",
        }}>
          <div style={{
            fontSize: 14,
            color: C.text,
            lineHeight: 1.6,
            whiteSpace: "pre-line",
          }}>
            {message}
          </div>
        </div>

        {/* 푸터 */}
        <div style={{
          padding: "16px 24px",
          borderTop: `1px solid ${C.borderLight}`,
          display: "flex",
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
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.02em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = C.navyDeep;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = C.navy;
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}