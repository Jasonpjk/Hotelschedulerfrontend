import { useState } from "react";
import type React from "react";
import AppLayout from "../components/layout/AppLayout";
import DemandForecastTable from "../components/DemandForecastTable";

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
  warning:     "#B87C1A",
  warnBg:      "rgba(184,124,26,0.08)",
  warnBorder:  "rgba(184,124,26,0.22)",
  satBg:       "#F4F7FD",
  sunBg:       "#FFF4F4",
  rowAlt:      "#FAFAF8",
};

/* ══════════════════════════════════════════════════════
   CALENDAR — 2026년 4월
══════════════════════════════════════════════════════════ */
const APRIL_DAYS = 30;
const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];
const APRIL_OFFSET = 3; // April 1 = Wednesday
const getDow  = (d: number) => (APRIL_OFFSET + d - 1) % 7;
const isSun   = (d: number) => getDow(d) === 0;
const isSat   = (d: number) => getDow(d) === 6;
const isWeekend = (d: number) => isSun(d) || isSat(d);

// 2026년 4월 공휴일
const HOLIDAYS: Record<number, string> = {
  5: "식목일",
  6: "대체공휴일",
  30: "부처님오신날",
};

const getHoliday = (d: number) => HOLIDAYS[d] || "";

/* ══════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════ */
interface DayData {
  day: number;
  dow: string;
  week: number;
  curBookCI: number;
  curBookCO: number;
  lyBookCI: number;
  lyBookCO: number;
  lyActualCI: number;
  lyActualCO: number;
  pickupCI: number;
  pickupCO: number;
  forecastCI: number;
  forecastCO: number;
  eventAdj: number;
  eventAdjCO: number;
  finalCI: number;
  finalCO: number;
  peakCI: boolean;
  peakCO: boolean;
  midShiftTimes: string[];
}

function buildData(): DayData[] {
  const rows: DayData[] = [];
  for (let d = 1; d <= APRIL_DAYS; d++) {
    const dow = DOW_KO[getDow(d)];
    const wknd = isWeekend(d);
    const week = Math.ceil((d + APRIL_OFFSET - 1) / 7);
    const cherryBoost = d >= 3 && d <= 16 ? 8 : 0;
    
    const base = wknd ? 52 : 28;
    const noise = Math.round(Math.sin(d * 1.7) * 5);
    const curBookCI = base + noise + cherryBoost + (d % 5 === 0 ? 4 : 0);
    const curBookCO = base - 3 + Math.round(Math.cos(d * 1.5) * 4) + cherryBoost;
    
    const lyBookCI = Math.round(curBookCI * 0.87);
    const lyBookCO = Math.round(curBookCO * 0.87);
    const pickupCI = (wknd ? 17 : 9) + Math.round(Math.abs(Math.sin(d * 1.3)) * 3);
    const pickupCO = (wknd ? 14 : 7) + Math.round(Math.abs(Math.cos(d * 1.3)) * 3);
    const lyActualCI = lyBookCI + pickupCI;
    const lyActualCO = lyBookCO + pickupCO;
    
    const forecastCI = curBookCI + pickupCI;
    const forecastCO = curBookCO + pickupCO;
    
    const eventDays: Record<number, { adjCI: number; adjCO: number }> = {
      12: { adjCI: 22, adjCO: 18 },
      13: { adjCI: 15, adjCO: 20 },
      19: { adjCI: 12, adjCO: 8 },
      25: { adjCI: 8, adjCO: 6 },
      26: { adjCI: 6, adjCO: 10 },
    };
    const adj = eventDays[d] ?? { adjCI: 0, adjCO: 0 };
    const finalCI = forecastCI + adj.adjCI;
    const finalCO = forecastCO + adj.adjCO;
    
    const peakCI = finalCI >= (wknd ? 74 : 46);
    const peakCO = finalCO >= (wknd ? 68 : 42);
    
    // 중간조 배치: 피크 정도에 따라 여러 명 배치 가능
    let midShiftTimes: string[] = [];
    if (peakCI && peakCO && finalCI >= 80) {
      // 매우 높은 피크: 3~4명 배치
      midShiftTimes.push("C08", "C09", "C10");
      if (finalCI >= 90) midShiftTimes.push("C11");
    } else if (peakCI && finalCI >= 70) {
      // 높은 피크: 2~3명 배치
      midShiftTimes.push("C08", "C09");
      if (finalCI >= 75) midShiftTimes.push("C10");
    } else if (peakCI && finalCI >= 60) {
      // 보통 피크: 1~2명 배치
      midShiftTimes.push("C09");
      if (finalCI >= 65) midShiftTimes.push("C10");
    } else if (peakCO && finalCO >= 65) {
      // CO 피크만 있는 경우
      midShiftTimes.push("C10");
    }

    rows.push({
      day: d, dow, week,
      curBookCI, curBookCO,
      lyBookCI, lyBookCO,
      lyActualCI, lyActualCO,
      pickupCI, pickupCO,
      forecastCI, forecastCO,
      eventAdj: adj.adjCI, eventAdjCO: adj.adjCO,
      finalCI, finalCO,
      peakCI, peakCO,
      midShiftTimes,
    });
  }
  return rows;
}

const DATA = buildData();

/* ══════════════════════════════════════════════════════════
   공통 컴포넌트
══════════════════════════════════════════════════════════ */

function Badge({ label, variant }: { label: string; variant: "ok" | "warn" | "risk" | "gold" | "muted" }) {
  const map = {
    ok:    { bg: C.okBg,   color: C.ok,     border: C.okBorder },
    warn:  { bg: C.warnBg, color: C.warning, border: C.warnBorder },
    risk:  { bg: C.riskBg, color: C.risk,    border: C.riskBorder },
    gold:  { bg: C.goldBg, color: "#7A5518", border: C.goldBorder },
    muted: { bg: "#F0F2F4", color: C.muted,  border: "#CDD2D8" },
  };
  const s = map[variant];
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      fontSize: 9.5,
      fontWeight: 600,
      borderRadius: 3,
      backgroundColor: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {label}
    </span>
  );
}

/* ═════════════════════════════════════════════════════════
   모달 컴포넌트
══════════════════════════════════════════════════════════ */
function Modal({ 
  open, 
  onClose, 
  title, 
  description,
  children 
}: { 
  open: boolean; 
  onClose: () => void; 
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

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
        border: `1px solid ${C.border}`,
        borderRadius: 4,
        maxWidth: 600,
        width: "90%",
        maxHeight: "90vh",
        overflow: "auto",
      }}>
        <div style={{
          padding: 20,
          borderBottom: `1px solid ${C.border}`,
          backgroundColor: "#FAFAF8",
        }}>
          <h3 style={{ 
            fontSize: 16, 
            fontWeight: 600, 
            color: C.navy,
            fontFamily: "'Cormorant Garamond', serif",
            marginBottom: description ? 6 : 0,
          }}>
            {title}
          </h3>
          {description && (
            <p style={{ 
              fontSize: 11, 
              color: C.muted,
              fontFamily: "'Inter', sans-serif",
            }}>
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   파일 업로드 모달
══════════════════════════════════════════════════════════ */
function FileUploadModal({ 
  open, 
  onClose, 
  title, 
  onUpload 
}: { 
  open: boolean; 
  onClose: () => void; 
  title: string;
  onUpload: (fileName: string) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = () => {
    const mockFileName = "april_2026_data.xlsx";
    setSelectedFile(mockFileName);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile);
      setSelectedFile("");
      onClose();
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title={title}
      description="엑셀 파일을 업로드하여 수요 예측 데이터를 입력합니다."
    >
      <div style={{ padding: 24 }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { 
            e.preventDefault(); 
            setIsDragging(false);
            handleFileSelect();
          }}
          style={{
            border: `2px dashed ${isDragging ? C.gold : C.border}`,
            borderRadius: 4,
            padding: "40px 24px",
            textAlign: "center",
            backgroundColor: isDragging ? C.goldBg : C.bg,
            transition: "all 0.2s",
            cursor: "pointer",
          }}
          onClick={handleFileSelect}
        >
          <div style={{ marginBottom: 12 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" style={{ margin: "0 auto" }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.charcoal, marginBottom: 6 }}>
            클릭하거나 파일을 드래그하여 업로드
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>
            Excel 파일 (.xlsx, .xls)
          </div>
        </div>

        {selectedFile && (
          <div style={{ 
            marginTop: 16, 
            padding: "12px 16px", 
            backgroundColor: C.okBg, 
            border: `1px solid ${C.okBorder}`, 
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ok} strokeWidth="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
            <span style={{ fontSize: 11, color: C.charcoal, flex: 1 }}>
              {selectedFile}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedFile(""); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: C.muted,
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div style={{ 
        padding: "16px 24px", 
        borderTop: `1px solid ${C.border}`, 
        display: "flex", 
        justifyContent: "flex-end", 
        gap: 10 
      }}>
        <button
          onClick={onClose}
          style={{
            border: `1px solid ${C.border}`,
            backgroundColor: C.white,
            color: C.charcoal,
            borderRadius: 3,
            padding: "8px 18px",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          취소
        </button>
        <button
          onClick={handleUpload}
          disabled={!selectedFile}
          style={{
            backgroundColor: selectedFile ? C.navy : C.border,
            color: selectedFile ? "#EAE0CC" : C.muted,
            border: "none",
            borderRadius: 3,
            padding: "8px 18px",
            fontSize: 12,
            fontWeight: 600,
            cursor: selectedFile ? "pointer" : "not-allowed",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          업로드
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 1: 예측 근거
══════════════════════════════════════════════════════════ */
function ForecastBasisTab({ onGenerateForecast }: { onGenerateForecast: () => void }) {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [currentUploadType, setCurrentUploadType] = useState<string>("");

  const handleOpenUpload = (type: string) => {
    setCurrentUploadType(type);
    setUploadModalOpen(true);
  };

  const handleFileUploaded = (fileName: string) => {
    setUploadedFiles({ ...uploadedFiles, [currentUploadType]: fileName });
  };

  const uploadBoxes = [
    {
      type: "current",
      title: "올해 현재 예약 데이터",
      description: "2026년 4월 현재까지 접수된 예약 데이터 (체크인/체크아웃 날짜별)",
      optional: false,
    },
    {
      type: "lastYear",
      title: "전년도 실적 데이터",
      description: "2025년 4월 실제 체크인/체크아웃 집계 데이터",
      optional: false,
    },
    {
      type: "events",
      title: "공휴일/이벤트 기준 데이터",
      description: "특수 이벤트, 연휴, 지역 행사 정보",
      optional: true,
    },
  ];

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ maxWidth: 1000 }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy, marginBottom: 8, fontFamily: "'Cormorant Garamond', serif" }}>
            예측 근거 데이터 입력
          </h2>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            수요 예측을 생성하기 위한 기초 데이터를 업로드하고 적용합니다.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {uploadBoxes.map((box) => (
            <UploadBox
              key={box.type}
              title={box.title}
              description={box.description}
              uploaded={!!uploadedFiles[box.type]}
              fileName={uploadedFiles[box.type]}
              onUpload={() => handleOpenUpload(box.type)}
              optional={box.optional}
            />
          ))}
        </div>

        <div style={{ marginTop: 32, padding: "20px 24px", backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.charcoal, marginBottom: 4 }}>
                데이터 적용 및 예측 생성
              </div>
              <div style={{ fontSize: 10.5, color: C.muted }}>
                {Object.keys(uploadedFiles).length >= 2 
                  ? "필수 데이터가 준비되었습니다. 예측을 생성하세요." 
                  : "필수 데이터를 먼저 업로드하세요."}
              </div>
            </div>
            <button
              disabled={Object.keys(uploadedFiles).length < 2}
              onClick={onGenerateForecast}
              style={{
                padding: "10px 24px",
                backgroundColor: Object.keys(uploadedFiles).length >= 2 ? C.navy : C.border,
                color: Object.keys(uploadedFiles).length >= 2 ? "#EAE0CC" : C.muted,
                border: "none",
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 600,
                cursor: Object.keys(uploadedFiles).length >= 2 ? "pointer" : "not-allowed",
                transition: "all 0.15s",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              예측 생성
            </button>
          </div>
        </div>

        {Object.keys(uploadedFiles).length > 0 && (
          <div style={{ marginTop: 24, padding: 16, backgroundColor: C.okBg, border: `1px solid ${C.okBorder}`, borderRadius: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.ok, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              업로드 완료
            </div>
            <div style={{ fontSize: 11, color: C.charcoal, lineHeight: 1.5 }}>
              {Object.keys(uploadedFiles).length}개 파일 업로드 완료 · 최종 반영 일시: 2026년 3월 8일 14:32
            </div>
          </div>
        )}
      </div>

      <FileUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title={uploadBoxes.find(b => b.type === currentUploadType)?.title ?? "파일 업로드"}
        onUpload={handleFileUploaded}
      />
    </div>
  );
}

function UploadBox({ 
  title, 
  description, 
  uploaded, 
  fileName,
  onUpload, 
  optional = false 
}: { 
  title: string; 
  description: string; 
  uploaded: boolean;
  fileName?: string;
  onUpload: () => void; 
  optional?: boolean;
}) {
  return (
    <div style={{
      padding: "20px 24px",
      backgroundColor: uploaded ? C.okBg : C.white,
      border: `1px solid ${uploaded ? C.okBorder : C.border}`,
      borderRadius: 4,
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.charcoal }}>
              {title}
            </span>
            {optional && (
              <span style={{ fontSize: 9, color: C.muted, fontWeight: 500 }}>
                (선택)
              </span>
            )}
          </div>
          <div style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.5 }}>
            {description}
          </div>
          {uploaded && fileName && (
            <div style={{ marginTop: 8, fontSize: 10, color: C.ok, fontWeight: 500 }}>
              ✓ 파일명: {fileName} · 업로드 완료
            </div>
          )}
        </div>
        <button
          onClick={onUpload}
          style={{
            padding: "7px 16px",
            backgroundColor: uploaded ? C.ok : C.white,
            color: uploaded ? C.white : C.charcoal,
            border: `1px solid ${uploaded ? C.ok : C.border}`,
            borderRadius: 3,
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s",
            whiteSpace: "nowrap",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {uploaded ? "재업로드" : "파일 선택"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   TAB 2: 예측 결과
══════════════════════════════════════════════════════════ */
function ForecastResultTab({ showCalendar }: { showCalendar: boolean }) {
  const [activeWeek, setActiveWeek] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const weeks = [1, 2, 3, 4, 5];
  const weekData = DATA.filter(d => d.week === activeWeek);

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ maxWidth: 1400 }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: C.navy, marginBottom: 8, fontFamily: "'Cormorant Garamond', serif" }}>
            예측 결과
          </h2>
          <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            예측 근거가 반영된 최종 수요 예측값입니다.
          </p>
        </div>

        {!showCalendar ? (
          <div style={{ 
            padding: "60px 40px", 
            textAlign: "center", 
            backgroundColor: C.white, 
            border: `1px solid ${C.border}`, 
            borderRadius: 4 
          }}>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>
              예측 근거 탭에서 데이터를 업로드하고<br />
              "예측 생성" 버튼을 눌러주세요.
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              예측 결과가 이곳에 표시됩니다.
            </div>
          </div>
        ) : (
          <>
            <div style={{ 
              marginBottom: 20, 
              display: "flex", 
              gap: 8, 
              borderBottom: `1px solid ${C.border}`,
              backgroundColor: C.white,
              padding: "0 20px",
              borderRadius: "4px 4px 0 0",
            }}>
              <button
                onClick={() => setActiveWeek(0)}
                style={{
                  padding: "12px 20px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: activeWeek === 0 ? `2px solid ${C.gold}` : "2px solid transparent",
                  fontSize: 12,
                  fontWeight: activeWeek === 0 ? 600 : 500,
                  color: activeWeek === 0 ? C.navy : C.muted,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                전체
              </button>
              {weeks.map(w => (
                <button
                  key={w}
                  onClick={() => setActiveWeek(w)}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: activeWeek === w ? `2px solid ${C.gold}` : "2px solid transparent",
                    fontSize: 12,
                    fontWeight: activeWeek === w ? 600 : 500,
                    color: activeWeek === w ? C.navy : C.muted,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {w}주차
                </button>
              ))}
            </div>

            <div style={{ 
              backgroundColor: C.white, 
              border: `1px solid ${C.border}`, 
              borderRadius: 4, 
              overflow: "auto", 
              maxHeight: 600 
            }}>
              <DemandForecastTable 
                data={activeWeek === 0 ? DATA : weekData}
                getHoliday={getHoliday}
                isSun={isSun}
                isSat={isSat}
              />
            </div>

            <div style={{ marginTop: 32, padding: 24, backgroundColor: "#F7F4EF", border: `1px solid ${C.border}`, borderRadius: 4 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 6 }}>
                  근무표 생성 반영
                </div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                  이 예측값을 4월 근무표 생성에 반영합니다. AI 권장안을 먼저 조정하거나 바로 확정할 수 있습니다.
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setModalOpen(true)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: C.white,
                    color: C.charcoal,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  AI 권장안 조정
                </button>
                <button style={{
                  padding: "10px 24px",
                  backgroundColor: C.navy,
                  color: "#EAE0CC",
                  border: "none",
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 0.15s",
                }}>
                  근무표 생성 반영 확정
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <AIAdjustModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   AI 권장안 조정 모달
══════════════════════════════════════════════════════════ */
function AIAdjustModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title="AI 권장안 조정"
      description="AI가 제안한 근무표 생성 권장안을 수정할 수 있습니다."
    >
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AdjustItem
            label="피크 체크인일 중간조 보강"
            value="5명"
            description="4월 12, 13, 19, 25일"
          />
          <AdjustItem
            label="피크 체크아웃일 오전조 보강"
            value="4명"
            description="4월 13, 20, 26일"
          />
          <AdjustItem
            label="저수요일 인력 축소"
            value="2명"
            description="4월 3, 7, 14일"
          />
        </div>
      </div>

      <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          onClick={onClose}
          style={{
            border: `1px solid ${C.border}`,
            backgroundColor: C.white,
            color: C.charcoal,
            borderRadius: 3,
            padding: "8px 18px",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          취소
        </button>
        <button
          onClick={onClose}
          style={{
            backgroundColor: C.navy,
            color: "#EAE0CC",
            border: "none",
            borderRadius: 3,
            padding: "8px 18px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          적용
        </button>
      </div>
    </Modal>
  );
}

function AdjustItem({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div style={{ padding: 16, backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.charcoal }}>
          {label}
        </span>
        <input
          type="text"
          defaultValue={value}
          style={{
            width: 60,
            padding: "4px 8px",
            border: `1px solid ${C.border}`,
            borderRadius: 3,
            fontSize: 11,
            textAlign: "center",
            fontFamily: "'Inter', sans-serif",
          }}
        />
      </div>
      <div style={{ fontSize: 10, color: C.muted }}>
        {description}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function DemandPage() {
  const [activeTab, setActiveTab] = useState<"basis" | "result">("basis");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleGenerateForecast = () => {
    setShowCalendar(true);
    setActiveTab("result");
  };

  // 우측 상단 버튼 활성화 여부
  const buttonsEnabled = activeTab === "result";

  return (
    <AppLayout>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: C.bg }}>
        {/* 헤더 */}
        <div style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.border}`,
          padding: "20px 40px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: C.navy, fontFamily: "'Cormorant Garamond', serif" }}>
                수요 예측
              </h1>
            </div>
          </div>

          {/* 기간 및 컨트롤 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            {/* 좌측: 년/월 선택 */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  padding: "7px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontSize: 11.5,
                  backgroundColor: C.white,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  color: C.charcoal,
                }}
              >
                <option value={2025}>2025년</option>
                <option value={2026}>2026년</option>
                <option value={2027}>2027년</option>
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{
                  padding: "7px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontSize: 11.5,
                  backgroundColor: C.white,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  color: C.charcoal,
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>

            {/* 우측: 다운로드 / 이력 보기 버튼 */}
            <div style={{ display: "flex", gap: 10 }}>
              <button 
                disabled={!buttonsEnabled}
                style={{
                  padding: "8px 16px",
                  backgroundColor: C.white,
                  color: buttonsEnabled ? C.charcoal : C.muted,
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: buttonsEnabled ? "pointer" : "not-allowed",
                  fontFamily: "'Inter', sans-serif",
                  opacity: buttonsEnabled ? 1 : 0.5,
                  transition: "all 0.15s",
                }}
              >
                다운로드
              </button>
              <button 
                disabled={!buttonsEnabled}
                style={{
                  padding: "8px 16px",
                  backgroundColor: C.white,
                  color: buttonsEnabled ? C.charcoal : C.muted,
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: buttonsEnabled ? "pointer" : "not-allowed",
                  fontFamily: "'Inter', sans-serif",
                  opacity: buttonsEnabled ? 1 : 0.5,
                  transition: "all 0.15s",
                }}
              >
                이력 보기
              </button>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: C.white,
          borderBottom: `1px solid ${C.border}`,
          padding: "0 40px",
          display: "flex",
          gap: 0,
          flexShrink: 0,
        }}>
          <TabButton
            label="예측 근거"
            active={activeTab === "basis"}
            onClick={() => setActiveTab("basis")}
          />
          <TabButton
            label="예측 결과"
            active={activeTab === "result"}
            onClick={() => setActiveTab("result")}
          />
        </div>

        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          {activeTab === "basis" && <ForecastBasisTab onGenerateForecast={handleGenerateForecast} />}
          {activeTab === "result" && <ForecastResultTab showCalendar={showCalendar} />}
        </div>
      </div>
    </AppLayout>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "14px 24px",
        backgroundColor: "transparent",
        border: "none",
        borderBottom: active ? `2px solid ${C.gold}` : "2px solid transparent",
        fontSize: 12,
        fontWeight: active ? 600 : 500,
        color: active ? C.navy : C.muted,
        cursor: "pointer",
        transition: "all 0.2s",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {label}
    </button>
  );
}