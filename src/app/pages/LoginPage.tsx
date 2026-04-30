import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import lotteLogo from "figma:asset/b5f675b5ca48c50750fc1b535604b775fca63344.png";
import hotelLobbyImage from "figma:asset/c0ca28a090159584b398e8d033c1e842d930a4fb.png";
import { loginApi, getMeApi } from "../utils/api";
import { useAuth } from "../context/AuthContext";

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const LOTTE_HOTELS = [
  "롯데호텔 서울",
  "롯데호텔 월드",
  "롯데호텔 부산",
  "롯데시티호텔 명동",
  "롯데시티호텔 마포",
  "롯데시티호텔 김포공항",
  "롯데리조트 속초",
  "롯데리조트 부여",
  "롯데리조트 제주",
  "롯데호텔 울산",
  "롯데호텔 제주",
  "롯데시티호텔 구로",
];

const GRADES = ["엘크루", "주니어", "L1-A", "L1-C", "L1-D", "L2-A", "L2-C", "L3", "L4"];

/* ══════════════════════════════════════════════��═══════════
   i18n DICTIONARY
══════════════════════════════════════════════════════════ */
type Lang = "ko" | "en" | "ja" | "ru" | "vi";

const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "ko", label: "Korean", native: "한국어" },
  { code: "en", label: "English", native: "English" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
];

const T: Record<
  Lang,
  {
    tagline: string;
    heroTitle: string;
    portal: string;
    formTitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    forgotPassword: string;
    loginBtn: string;
    loggingIn: string;
    securityNote: string;
    footerCopy: string;
    privacy: string;
    terms: string;
    support: string;
    signupBtn: string;
    // 비밀번호 찾기
    forgotPasswordTitle: string;
    forgotPasswordDesc: string;
    employeeIdLabel: string;
    employeeIdPlaceholder: string;
    hotelLabel: string;
    hotelPlaceholder: string;
    requestTempPassword: string;
    cancel: string;
    // 회원가입
    signupTitle: string;
    signupDesc: string;
    nameLabel: string;
    namePlaceholder: string;
    contactLabel: string;
    contactPlaceholder: string;
    departmentLabel: string;
    departmentPlaceholder: string;
    gradeLabel: string;
    passwordConfirmLabel: string;
    passwordConfirmPlaceholder: string;
    submitSignup: string;
    signupSuccessTitle: string;
    signupSuccessMessage: string;
    signupSuccessDetail: string;
    close: string;
    gradePlaceholder: string;
  }
> = {
  ko: {
    tagline: "",
    heroTitle: "호텔 프런트 운영 스케줄",
    portal: "LOTTE HOTELS & RESORTS",
    formTitle: "로그인",
    emailLabel: "이메일",
    emailPlaceholder: "admin@lotte-hotels.com",
    passwordLabel: "비밀번호",
    forgotPassword: "비밀번호를 잊으셨나요?",
    loginBtn: "로그인",
    loggingIn: "로그인 중...",
    securityNote: "권한이 부여된 담당자만 접근할 수 있습니다.",
    footerCopy: "© 2026 LOTTE HOTELS & RESORTS",
    privacy: "개인정보처리방침",
    terms: "이용약관",
    support: "고객지원",
    signupBtn: "회원가입 신청",
    forgotPasswordTitle: "비밀번호 찾기",
    forgotPasswordDesc: "등록된 이메일로 임시 비밀번호를 발급합니다.",
    employeeIdLabel: "사번",
    employeeIdPlaceholder: "202401234",
    hotelLabel: "호텔",
    hotelPlaceholder: "호텔을 선택하세요",
    requestTempPassword: "임시 비밀번호 발급 요청",
    cancel: "취소",
    signupTitle: "회원가입 신청",
    signupDesc: "관리자 승인 후 로그인할 수 있습니다.",
    nameLabel: "이름",
    namePlaceholder: "홍길동",
    contactLabel: "연락처",
    contactPlaceholder: "010-1234-5678",
    departmentLabel: "부서",
    departmentPlaceholder: "프런트 데스크",
    gradeLabel: "직급",
    gradePlaceholder: "직급을 선택하세요",
    passwordConfirmLabel: "비밀번호 확인",
    passwordConfirmPlaceholder: "••••••••••••",
    submitSignup: "회원가입 신청",
    signupSuccessTitle: "회원가입 신청이 접수되었습니다",
    signupSuccessMessage: "관리자 승인 후 로그인할 수 있습니다.",
    signupSuccessDetail: "승인 완료 시 등록하신 이메일로 안내 메일이 발송됩니다.",
    close: "닫기",
  },
  en: {
    tagline: "",
    heroTitle: "Hotel Operations & Scheduling",
    portal: "LOTTE HOTELS & RESORTS",
    formTitle: "Sign In",
    emailLabel: "Email",
    emailPlaceholder: "admin@lotte-hotels.com",
    passwordLabel: "Password",
    forgotPassword: "Forgot password?",
    loginBtn: "Sign In",
    loggingIn: "Signing in...",
    securityNote: "Restricted to authorized personnel only.",
    footerCopy: "© 2026 LOTTE HOTELS & RESORTS",
    privacy: "Privacy",
    terms: "Terms",
    support: "Support",
    signupBtn: "Sign Up Request",
    forgotPasswordTitle: "Password Recovery",
    forgotPasswordDesc: "A temporary password will be sent to your registered email.",
    employeeIdLabel: "Employee ID",
    employeeIdPlaceholder: "202401234",
    hotelLabel: "Hotel",
    hotelPlaceholder: "Select hotel",
    requestTempPassword: "Request Temporary Password",
    cancel: "Cancel",
    signupTitle: "Sign Up Request",
    signupDesc: "You can sign in after administrator approval.",
    nameLabel: "Name",
    namePlaceholder: "John Doe",
    contactLabel: "Contact",
    contactPlaceholder: "010-1234-5678",
    departmentLabel: "Department",
    departmentPlaceholder: "Front Desk",
    gradeLabel: "Grade",
    gradePlaceholder: "Select grade",
    passwordConfirmLabel: "Confirm Password",
    passwordConfirmPlaceholder: "••••••••••••",
    submitSignup: "Submit Request",
    signupSuccessTitle: "Sign up request submitted",
    signupSuccessMessage: "You can sign in after administrator approval.",
    signupSuccessDetail: "You will receive a notification email once approved.",
    close: "Close",
  },
  ja: {
    tagline: "",
    heroTitle: "ホテル運営スケジュール管理",
    portal: "LOTTE HOTELS & RESORTS",
    formTitle: "ログイン",
    emailLabel: "メールアドレス",
    emailPlaceholder: "admin@lotte-hotels.com",
    passwordLabel: "パスワード",
    forgotPassword: "パスワードをお忘れですか？",
    loginBtn: "ログイン",
    loggingIn: "ログイン中...",
    securityNote: "権限のある担当者のみアクセス可能です。",
    footerCopy: "© 2026 LOTTE HOTELS & RESORTS",
    privacy: "プライバシー",
    terms: "利用規約",
    support: "サポート",
    signupBtn: "会員登録申請",
    forgotPasswordTitle: "パスワード再発行",
    forgotPasswordDesc: "登録メールアドレスに仮パスワードを送信します。",
    employeeIdLabel: "社員番号",
    employeeIdPlaceholder: "202401234",
    hotelLabel: "ホテル",
    hotelPlaceholder: "ホテルを選択",
    requestTempPassword: "仮パスワード発行申請",
    cancel: "キャンセル",
    signupTitle: "会員登録申請",
    signupDesc: "管理者承認後にログイン可能です。",
    nameLabel: "氏名",
    namePlaceholder: "山田太郎",
    contactLabel: "連絡先",
    contactPlaceholder: "010-1234-5678",
    departmentLabel: "部署",
    departmentPlaceholder: "フロント",
    gradeLabel: "職級",
    gradePlaceholder: "職級を選択",
    passwordConfirmLabel: "パスワード確認",
    passwordConfirmPlaceholder: "••••••••••••",
    submitSignup: "申請する",
    signupSuccessTitle: "会員登録を受け付けました",
    signupSuccessMessage: "管理者承認後にログイン可能です。",
    signupSuccessDetail: "承認完了時にメールでお知らせします。",
    close: "閉じる",
  },
  ru: {
    tagline: "",
    heroTitle: "Управление расписанием отеля",
    portal: "LOTTE HOTELS & RESORTS",
    formTitle: "Вход",
    emailLabel: "Электронная почта",
    emailPlaceholder: "admin@lotte-hotels.com",
    passwordLabel: "Пароль",
    forgotPassword: "Забыли пароль?",
    loginBtn: "Войти",
    loggingIn: "Вход...",
    securityNote: "Доступ только для авторизованных сотрудников.",
    footerCopy: "© 2026 LOTTE HOTELS & RESORTS",
    privacy: "Конфиденциальность",
    terms: "Условия",
    support: "Поддержка",
    signupBtn: "Заявка на регистрацию",
    forgotPasswordTitle: "Восстановление пароля",
    forgotPasswordDesc: "Временный пароль будет отправлен на ваш email.",
    employeeIdLabel: "ID сотрудника",
    employeeIdPlaceholder: "202401234",
    hotelLabel: "Отель",
    hotelPlaceholder: "Выберите отель",
    requestTempPassword: "Запросить временный пароль",
    cancel: "Отмена",
    signupTitle: "Заявка на регистрацию",
    signupDesc: "Вход доступен после одобрения администратора.",
    nameLabel: "Имя",
    namePlaceholder: "Иван Иванов",
    contactLabel: "Контакт",
    contactPlaceholder: "010-1234-5678",
    departmentLabel: "Отдел",
    departmentPlaceholder: "Ресепшн",
    gradeLabel: "Должность",
    gradePlaceholder: "Выберите должность",
    passwordConfirmLabel: "Подтверждение пароля",
    passwordConfirmPlaceholder: "••••••••••••",
    submitSignup: "Отправить заявку",
    signupSuccessTitle: "Заявка отправлена",
    signupSuccessMessage: "Вход доступен после одобрения администратора.",
    signupSuccessDetail: "Вы получите уведомление по email после одобрения.",
    close: "Закрыть",
  },
  vi: {
    tagline: "",
    heroTitle: "Quản lý lịch vận hành khách sạn",
    portal: "LOTTE HOTELS & RESORTS",
    formTitle: "Đăng nhập",
    emailLabel: "Email",
    emailPlaceholder: "admin@lotte-hotels.com",
    passwordLabel: "Mật khẩu",
    forgotPassword: "Quên mật khẩu?",
    loginBtn: "Đăng nhập",
    loggingIn: "Đang đăng nhập...",
    securityNote: "Chỉ dành cho nhân viên được ủy quyền.",
    footerCopy: "© 2026 LOTTE HOTELS & RESORTS",
    privacy: "Quyền riêng tư",
    terms: "Điều khoản",
    support: "Hỗ trợ",
    signupBtn: "Đăng ký tài khoản",
    forgotPasswordTitle: "Quên mật khẩu",
    forgotPasswordDesc: "Mật khẩu tạm thời sẽ được gửi đến email của bạn.",
    employeeIdLabel: "Mã nhân viên",
    employeeIdPlaceholder: "202401234",
    hotelLabel: "Khách sạn",
    hotelPlaceholder: "Chọn khách sạn",
    requestTempPassword: "Yêu cầu mật khẩu tạm thời",
    cancel: "Hủy",
    signupTitle: "Đăng ký tài khoản",
    signupDesc: "Bạn có thể đăng nhập sau khi quản trị viên phê duyệt.",
    nameLabel: "Tên",
    namePlaceholder: "Nguyễn Văn A",
    contactLabel: "Liên hệ",
    contactPlaceholder: "010-1234-5678",
    departmentLabel: "Bộ phận",
    departmentPlaceholder: "Lễ tân",
    gradeLabel: "Cấp bậc",
    gradePlaceholder: "Chọn cấp bậc",
    passwordConfirmLabel: "Xác nhận mật khẩu",
    passwordConfirmPlaceholder: "••••••••••••",
    submitSignup: "Gửi yêu cầu",
    signupSuccessTitle: "Đã gửi yêu cầu đăng ký",
    signupSuccessMessage: "Bạn có thể đăng nhập sau khi quản trị viên phê duyệt.",
    signupSuccessDetail: "Bạn sẽ nhận được email thông báo khi được phê duyệt.",
    close: "Đóng",
  },
};

/* ══════════════════════════════════════════════════════════
   MODAL COMPONENT
══════════════════════════════════════════════════════════ */
function Modal({ open, onClose, children, width = 500 }: { open: boolean; onClose: () => void; children: React.ReactNode; width?: number }) {
  if (!open) return null;
  
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(12, 21, 32, 0.85)",
        backdropFilter: "blur(6px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          backgroundColor: "#13212F",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 3,
          width: "100%",
          maxWidth: width,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* 상단 골드 라인 */}
        <div style={{ position: "absolute", top: 0, left: 40, right: 40, height: 1, background: "linear-gradient(to right, transparent, rgba(185,155,90,0.38), transparent)" }} />
        
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FORGOT PASSWORD MODAL
══════════════════════════════════════════════════════════ */
function ForgotPasswordModal({ open, onClose, lang }: { open: boolean; onClose: () => void; lang: Lang }) {
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [hotel, setHotel] = useState("");
  const [loading, setLoading] = useState(false);
  
  const t = T[lang];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("임시 비밀번호가 발급되었습니다. 이메일을 확인해주세요.");
      onClose();
      setEmployeeId("");
      setEmail("");
      setHotel("");
    }, 1200);
  };
  
  return (
    <Modal open={open} onClose={onClose} width={460}>
      <form onSubmit={handleSubmit} style={{ padding: "44px 40px 40px" }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 400, color: "#EAE0CC", letterSpacing: "0.01em", lineHeight: 1.3, margin: 0, marginBottom: 12 }}>
            {t.forgotPasswordTitle}
          </h2>
          <p style={{ fontSize: 12, color: "rgba(200,195,185,0.5)", lineHeight: 1.6, margin: 0 }}>
            {t.forgotPasswordDesc}
          </p>
        </div>
        
        {/* 폼 필드 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* 사번 */}
          <div>
            <label style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(200,195,185,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
              {t.employeeIdLabel}
            </label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder={t.employeeIdPlaceholder}
              required
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, padding: "12px 16px", color: "#EAE0CC", fontSize: 13.5, fontWeight: 400, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          
          {/* 이메일 */}
          <div>
            <label style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(200,195,185,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
              {t.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              required
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, padding: "12px 16px", color: "#EAE0CC", fontSize: 13.5, fontWeight: 400, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          
          {/* 호텔 */}
          <div>
            <label style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(200,195,185,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
              {t.hotelLabel}
            </label>
            <select
              value={hotel}
              onChange={(e) => setHotel(e.target.value)}
              required
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, padding: "12px 16px", color: hotel ? "#EAE0CC" : "rgba(200,195,185,0.4)", fontSize: 13.5, fontWeight: 400, outline: "none", boxSizing: "border-box", cursor: "pointer" }}
            >
              <option value="" style={{ backgroundColor: "#13212F", color: "rgba(200,195,185,0.4)" }}>{t.hotelPlaceholder}</option>
              {LOTTE_HOTELS.map((h) => (
                <option key={h} value={h} style={{ backgroundColor: "#13212F", color: "#EAE0CC" }}>{h}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 버튼 */}
        <div style={{ marginTop: 32, display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: "12px 24px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, color: "rgba(200,195,185,0.7)", fontSize: 11.5, fontWeight: 500, letterSpacing: "0.08em", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ flex: 2, padding: "12px 24px", backgroundColor: loading ? "rgba(185,155,90,0.5)" : "#B99B5A", border: "none", borderRadius: 2, color: "#0F1B27", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif" }}
          >
            {loading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><SpinnerIcon />처리 중...</span> : t.requestTempPassword}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   SIGNUP MODAL
══════════════════════════════════════════════════════════ */
function SignupModal({ open, onClose, lang }: { open: boolean; onClose: () => void; lang: Lang }) {
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [hotel, setHotel] = useState("");
  const [department, setDepartment] = useState("");
  const [grade, setGrade] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const t = T[lang];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
    }, 1200);
  };
  
  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
    // 폼 초기화
    setName("");
    setEmployeeId("");
    setEmail("");
    setContact("");
    setHotel("");
    setDepartment("");
    setGrade("");
    setPassword("");
    setPasswordConfirm("");
  };
  
  if (showSuccess) {
    return (
      <Modal open={open} onClose={handleSuccessClose} width={460}>
        <div style={{ padding: "44px 40px 40px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, margin: "0 auto 24px", backgroundColor: "rgba(185,155,90,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckIcon />
          </div>
          
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 400, color: "#EAE0CC", letterSpacing: "0.01em", lineHeight: 1.3, margin: 0, marginBottom: 12 }}>
            {t.signupSuccessTitle}
          </h2>
          
          <p style={{ fontSize: 13, color: "rgba(200,195,185,0.6)", lineHeight: 1.6, marginBottom: 6 }}>
            {t.signupSuccessMessage}
          </p>
          
          <p style={{ fontSize: 12, color: "rgba(200,195,185,0.4)", lineHeight: 1.6 }}>
            {t.signupSuccessDetail}
          </p>
          
          <button
            onClick={handleSuccessClose}
            style={{ marginTop: 32, width: "100%", padding: "12px 24px", backgroundColor: "#B99B5A", border: "none", borderRadius: 2, color: "#0F1B27", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
          >
            {t.close}
          </button>
        </div>
      </Modal>
    );
  }
  
  return (
    <Modal open={open} onClose={onClose} width={540}>
      <form onSubmit={handleSubmit} style={{ padding: "44px 40px 40px" }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 400, color: "#EAE0CC", letterSpacing: "0.01em", lineHeight: 1.3, margin: 0, marginBottom: 12 }}>
            {t.signupTitle}
          </h2>
          <p style={{ fontSize: 12, color: "rgba(200,195,185,0.5)", lineHeight: 1.6, margin: 0 }}>
            {t.signupDesc}
          </p>
        </div>
        
        {/* 폼 필드 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* 이름 & 사번 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(200,195,185,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
                {t.nameLabel}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                required
                style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, padding: "11px 14px", color: "#EAE0CC", fontSize: 13, fontWeight: 400, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(200,195,185,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
                {t.employeeIdLabel}
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder={t.employeeIdPlaceholder}
                required
                style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, padding: "11px 14px", color: "#EAE0CC", fontSize: 13, fontWeight: 400, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>
          
          {/* 이메일 */}
          <div>
            <label style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(200,195,185,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
              {t.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              required
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, padding: "11px 14px", color: "#EAE0CC", fontSize: 13, fontWeight: 400, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          
          {/* 연락처 */}
          <div>
            <label style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(200,195,185,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
              {t.contactLabel}
            </label>
            <input
              type="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t.contactPlaceholder}
              required
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, padding: "11px 14px", color: "#EAE0CC", fontSize: 13, fontWeight: 400, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          
          {/* 호텔 & 부서 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(200,195,185,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
                {t.hotelLabel}
              </label>
              <select
                value={hotel}
                onChange={(e) => setHotel(e.target.value)}
                required
                style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, padding: "11px 14px", color: hotel ? "#EAE0CC" : "rgba(200,195,185,0.4)", fontSize: 13, fontWeight: 400, outline: "none", boxSizing: "border-box", cursor: "pointer" }}
              >
                <option value="" style={{ backgroundColor: "#13212F", color: "rgba(200,195,185,0.4)" }}>{t.hotelPlaceholder}</option>
                {LOTTE_HOTELS.map((h) => (
                  <option key={h} value={h} style={{ backgroundColor: "#13212F", color: "#EAE0CC" }}>{h}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(200,195,185,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
                {t.departmentLabel}
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder={t.departmentPlaceholder}
                required
                style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, padding: "11px 14px", color: "#EAE0CC", fontSize: 13, fontWeight: 400, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>
          
          {/* 직급 */}
          <div>
            <label style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(200,195,185,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
              {t.gradeLabel}
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              required
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, padding: "11px 14px", color: grade ? "#EAE0CC" : "rgba(200,195,185,0.4)", fontSize: 13, fontWeight: 400, outline: "none", boxSizing: "border-box", cursor: "pointer" }}
            >
              <option value="" style={{ backgroundColor: "#13212F", color: "rgba(200,195,185,0.4)" }}>{t.gradePlaceholder}</option>
              {GRADES.map((g) => (
                <option key={g} value={g} style={{ backgroundColor: "#13212F", color: "#EAE0CC" }}>{g}</option>
              ))}
            </select>
          </div>
          
          {/* 비밀번호 */}
          <div>
            <label style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(200,195,185,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
              {t.passwordLabel}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={8}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, padding: "11px 14px", color: "#EAE0CC", fontSize: 13, fontWeight: 400, letterSpacing: "0.1em", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          
          {/* 비밀번호 확인 */}
          <div>
            <label style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(200,195,185,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
              {t.passwordConfirmLabel}
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder={t.passwordConfirmPlaceholder}
              required
              minLength={8}
              style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, padding: "11px 14px", color: "#EAE0CC", fontSize: 13, fontWeight: 400, letterSpacing: "0.1em", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>
        
        {/* 버튼 */}
        <div style={{ marginTop: 32, display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: "12px 24px", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 2, color: "rgba(200,195,185,0.7)", fontSize: 11.5, fontWeight: 500, letterSpacing: "0.08em", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ flex: 2, padding: "12px 24px", backgroundColor: loading ? "rgba(185,155,90,0.5)" : "#B99B5A", border: "none", borderRadius: 2, color: "#0F1B27", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Inter', sans-serif" }}
          >
            {loading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><SpinnerIcon />처리 중...</span> : t.submitSignup}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   LANG SWITCHER
══════════════════════════════════════════════════════════ */
function LangSwitcher({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === lang)!;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 2,
          padding: "6px 11px",
          color: "rgba(200,195,185,0.7)",
          cursor: "pointer",
          fontSize: 11.5,
          letterSpacing: "0.04em",
          fontFamily: "'Inter', sans-serif",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(185,155,90,0.4)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
      >
        <GlobeIcon />
        <span style={{ fontWeight: 500, color: "rgba(234,224,204,0.85)" }}>{current.native}</span>
        <ChevronDownIcon open={open} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            backgroundColor: "#152030",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 3,
            overflow: "hidden",
            zIndex: 100,
            boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
            minWidth: 152,
          }}
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                onChange(l.code);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                width: "100%",
                padding: "9px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                borderLeft: l.code === lang ? "2px solid #B99B5A" : "2px solid transparent",
                backgroundColor: l.code === lang ? "rgba(185,155,90,0.07)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (l.code !== lang) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                if (l.code !== lang) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              }}
            >
              <span style={{ fontSize: 13, color: l.code === lang ? "#EAE0CC" : "rgba(200,195,185,0.65)", fontWeight: l.code === lang ? 500 : 400 }}>
                {l.native}
              </span>
              <span style={{ fontSize: 10.5, color: "rgba(185,155,90,0.5)", letterSpacing: "0.06em" }}>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN LOGIN PAGE
══════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [lang, setLang] = useState<Lang>("ko");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // 모달 상태
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  const t = T[lang];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError("");
    try {
      const tokenData = await loginApi(email, password);
      localStorage.setItem("hotel_token", tokenData.access_token);
      const me = await getMeApi();
      setAuth(tokenData.access_token, {
        id: me.id,
        email: me.email,
        full_name: me.full_name,
        role: me.role,
        hotel_id: me.hotel_id,
      });
      localStorage.setItem("lumiere_lang", lang);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      localStorage.removeItem("hotel_token");
      setLoginError(lang === "ko" ? "이메일 또는 비밀번호가 올바르지 않습니다." : "Invalid email or password.");
      console.error("Login failed:", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", fontFamily: "'Inter', sans-serif", backgroundColor: "#0C1520" }}>
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[60%] relative flex-col overflow-hidden">
        <img
          src={hotelLobbyImage}
          alt="LOTTE HOTELS & RESORTS 로비"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.55) saturate(1.1)" }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(12,21,32,0.65) 0%, rgba(12,21,32,0.15) 55%, rgba(12,21,32,0.45) 100%)" }} />
        {/* Gold divider line */}
        <div className="absolute top-0 right-0 w-px h-full" style={{ background: "linear-gradient(to bottom, transparent, rgba(185,155,90,0.2) 25%, rgba(185,155,90,0.2) 75%, transparent)" }} />

        <div className="relative z-10 flex flex-col h-full" style={{ padding: "36px 52px 52px" }}>
          {/* Brand mark - LOTTE Logo */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src={lotteLogo} alt="LOTTE HOTELS & RESORTS" style={{ height: 64, width: "auto", display: "block" }} />
          </div>

          {/* Hero copy */}
          <div style={{ margin: "auto 0", paddingBottom: 48, paddingTop: 32 }}>
            <div style={{ width: 28, height: 1, backgroundColor: "rgba(185,155,90,0.5)", marginBottom: 28 }} />
            {t.tagline && (
              <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(185,155,90,0.6)", textTransform: "uppercase", fontWeight: 500, marginBottom: 18 }}>
                {t.tagline}
              </div>
            )}
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(30px, 3.2vw, 44px)", color: "#EAE0CC", fontWeight: 300, lineHeight: 1.35, letterSpacing: "0.015em", margin: 0 }}>
              {t.heroTitle}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#0F1B27" }}>
        {/* Top bar: lang switcher */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "20px 28px 0" }}>
          <LangSwitcher lang={lang} onChange={setLang} />
        </div>

        {/* Centered login form */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 24px 40px" }}>
          <div style={{ width: "100%", maxWidth: 400 }}>
            {/* Mobile brand */}
            <div className="flex lg:hidden" style={{ marginBottom: 40, justifyContent: "center" }}>
              <img src={lotteLogo} alt="LOTTE HOTELS & RESORTS" style={{ height: 28, width: "auto", display: "block" }} />
            </div>

            {/* Card */}
            <div style={{ position: "relative", backgroundColor: "#13212F", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2, padding: "44px 40px 40px", boxShadow: "0 28px 72px rgba(0,0,0,0.5), 0 0 0 1px rgba(185,155,90,0.05)" }}>
              {/* Top gold shimmer */}
              <div style={{ position: "absolute", top: 0, left: 40, right: 40, height: 1, background: "linear-gradient(to right, transparent, rgba(185,155,90,0.38), transparent)" }} />

              {/* Header */}
              <div style={{ marginBottom: 36 }}>
                <div style={{ fontSize: 9.5, letterSpacing: "0.22em", color: "rgba(185,155,90,0.55)", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>{t.portal}</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 400, color: "#EAE0CC", letterSpacing: "0.01em", lineHeight: 1.2, margin: 0 }}>
                  {t.formTitle}
                </h2>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Email */}
                <div>
                  <label htmlFor="email" style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(200,195,185,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
                    {t.emailLabel}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      required
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      placeholder={t.emailPlaceholder}
                      style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: emailFocused ? "1px solid rgba(185,155,90,0.5)" : "1px solid rgba(255,255,255,0.09)", borderRadius: 2, padding: "12px 16px", color: "#EAE0CC", fontSize: 13.5, fontWeight: 400, letterSpacing: "0.02em", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                    />
                    {emailFocused && <div style={{ position: "absolute", bottom: -1, left: "10%", right: "10%", height: 1, background: "linear-gradient(to right, transparent, rgba(185,155,90,0.38), transparent)" }} />}
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", color: "rgba(200,195,185,0.5)", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>
                    {t.passwordLabel}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      required
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      placeholder="••••••••••••"
                      style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.04)", border: passwordFocused ? "1px solid rgba(185,155,90,0.5)" : "1px solid rgba(255,255,255,0.09)", borderRadius: 2, padding: "12px 44px 12px 16px", color: "#EAE0CC", fontSize: 13.5, fontWeight: 400, letterSpacing: showPassword ? "0.02em" : "0.1em", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(185,155,90,0.45)", display: "flex", alignItems: "center" }}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    {passwordFocused && <div style={{ position: "absolute", bottom: -1, left: "10%", right: "10%", height: 1, background: "linear-gradient(to right, transparent, rgba(185,155,90,0.38), transparent)" }} />}
                  </div>
                </div>

                {/* Forgot password */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8 }}>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(true)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(185,155,90,0.55)", letterSpacing: "0.03em", fontWeight: 400, padding: 0, transition: "color 0.2s", fontFamily: "'Inter', sans-serif" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(185,155,90,1)")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(185,155,90,0.55)")}
                  >
                    {t.forgotPassword}
                  </button>
                </div>

                {/* Login error */}
                {loginError && (
                  <div style={{ padding: "10px 14px", backgroundColor: "rgba(220,50,50,0.12)", border: "1px solid rgba(220,50,50,0.3)", borderRadius: 2, color: "#f87171", fontSize: 12.5, letterSpacing: "0.02em" }}>
                    {loginError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{ marginTop: 6, width: "100%", backgroundColor: loading ? "rgba(185,155,90,0.5)" : "#B99B5A", border: "none", borderRadius: 2, padding: "13px 24px", color: "#0F1B27", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", transition: "background-color 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "'Inter', sans-serif" }}
                  onMouseEnter={(e) => {
                    if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#CEAF6A";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#B99B5A";
                  }}
                >
                  {loading ? (
                    <>
                      <SpinnerIcon />
                      {t.loggingIn}
                    </>
                  ) : (
                    t.loginBtn
                  )}
                </button>
              </form>

              {/* Signup button */}
              <div style={{ marginTop: 20, textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => setSignupOpen(true)}
                  style={{ 
                    background: "transparent", 
                    border: "1.5px solid #B99B5A", 
                    cursor: "pointer", 
                    fontSize: 13, 
                    color: "#B99B5A", 
                    letterSpacing: "0.04em", 
                    fontWeight: 500, 
                    padding: "10px 24px", 
                    transition: "all 0.3s ease", 
                    fontFamily: "'Inter', sans-serif",
                    borderRadius: 3,
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = "rgba(185, 155, 90, 0.1)";
                    (e.target as HTMLElement).style.borderColor = "#D4B574";
                    (e.target as HTMLElement).style.color = "#D4B574";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = "transparent";
                    (e.target as HTMLElement).style.borderColor = "#B99B5A";
                    (e.target as HTMLElement).style.color = "#B99B5A";
                  }}
                >
                  {t.signupBtn}
                </button>
              </div>

              {/* Divider + security note */}
              <div style={{ margin: "28px 0 20px", height: 1, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ flexShrink: 0 }}>
                  <ShieldIcon />
                </div>
                <p style={{ fontSize: 11.5, color: "rgba(200,195,185,0.3)", lineHeight: 1.6, letterSpacing: "0.02em", fontWeight: 300, margin: 0 }}>
                  {t.securityNote}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 22, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <p style={{ fontSize: 11, color: "rgba(200,195,185,0.2)", letterSpacing: "0.05em", margin: 0 }}>{t.footerCopy}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {([t.privacy, t.terms, t.support] as string[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "rgba(200,195,185,0.2)", letterSpacing: "0.05em", padding: 0, fontFamily: "'Inter', sans-serif", transition: "color 0.2s" }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(200,195,185,0.45)")}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(200,195,185,0.2)")}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ForgotPasswordModal open={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)} lang={lang} />
      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} lang={lang} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════════════════ */
function GlobeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(185,155,90,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: "spin 0.9s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B99B5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}