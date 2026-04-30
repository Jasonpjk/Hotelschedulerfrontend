import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";

/* ══════════════════════════════════════════════════════════
   TYPE DEFINITIONS
══════════════════════════════════════════════════════════ */
export type ToastType = "success" | "warning" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000
}

interface ToastContextValue {
  showToast: (opts: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

/* ══════════════════════════════════════════════════════════
   COLOR TOKENS (딥 네이비 기반)
══════════════════════════════════════════════════════════ */
const NAVY  = "#0D1B2A";
const WARM  = "#EAE0CC";
const MUTED = "rgba(234,224,204,0.65)";

const TYPE_ACCENT: Record<ToastType, string> = {
  success: "#2E7D52",
  warning: "#B99B5A",
  error:   "#B83232",
  info:    "#5B7FA6",
};

/* ══════════════════════════════════════════════════════════
   CONTEXT
══════════════════════════════════════════════════════════ */
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/* ══════════════════════════════════════════════════════════
   TOAST ITEM COMPONENT
══════════════════════════════════════════════════════════ */
function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const accent = TYPE_ACCENT[item.type];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);

  // mount animation
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // auto-dismiss
  useEffect(() => {
    const dur = item.duration ?? 4000;
    timerRef.current = setTimeout(() => onDismiss(item.id), dur);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, item.duration, onDismiss]);

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onDismiss(item.id);
  };

  return (
    <div
      style={{
        backgroundColor: NAVY,
        borderRadius: 4,
        boxShadow: "0 6px 24px rgba(0,0,0,0.28)",
        minWidth: 300,
        maxWidth: 400,
        display: "flex",
        alignItems: "stretch",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.22s ease, transform 0.22s ease",
        position: "relative",
      }}
    >
      {/* 좌측 액센트 라인 */}
      <div
        style={{
          width: 4,
          flexShrink: 0,
          backgroundColor: accent,
        }}
      />

      {/* 콘텐츠 */}
      <div style={{ flex: 1, padding: "14px 40px 14px 16px" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: WARM,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "0.01em",
            lineHeight: 1.4,
          }}
        >
          {item.title}
        </div>
        {item.message && (
          <div
            style={{
              fontSize: 12,
              color: MUTED,
              fontFamily: "'Inter', sans-serif",
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            {item.message}
          </div>
        )}
      </div>

      {/* 닫기 버튼 */}
      <button
        aria-label="알림 닫기"
        onClick={handleClose}
        style={{
          position: "absolute",
          top: 10,
          right: 12,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "2px 4px",
          color: MUTED,
          fontSize: 16,
          lineHeight: 1,
          borderRadius: 2,
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = WARM;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = MUTED;
        }}
      >
        ×
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TOAST CONTAINER (전역 fixed, 우측 하단)
══════════════════════════════════════════════════════════ */
function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "flex-end",
        pointerEvents: "none",
      }}
    >
      {toasts.map((item) => (
        <div key={item.id} style={{ pointerEvents: "auto" }}>
          <ToastCard item={item} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PROVIDER
══════════════════════════════════════════════════════════ */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((opts: Omit<ToastItem, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { ...opts, id }]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

/* ══════════════════════════════════════════════════════════
   HOOK
══════════════════════════════════════════════════════════ */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
