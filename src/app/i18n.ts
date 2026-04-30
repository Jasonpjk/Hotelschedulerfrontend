export type Lang = "ko" | "en" | "ja" | "ru" | "vi";

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "ko", label: "Korean",     native: "한국어"    },
  { code: "en", label: "English",    native: "English"   },
  { code: "ja", label: "Japanese",   native: "日本語"    },
  { code: "ru", label: "Russian",    native: "Русский"   },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt"},
];

// AppLayout에서 사용하는 번역 키
export const DT: Record<Lang, {
  navDashboard: string;
  navSchedule: string;
  navEmployees: string;
  navDemand: string;
  navSettings: string;
  roleAdmin: string;
  footerCopy: string;
  systemNormal: string;
}> = {
  ko: { navDashboard: "대시보드", navSchedule: "근무표", navEmployees: "직원 관리", navDemand: "수요 예측", navSettings: "호텔 설정", roleAdmin: "최종 관리자", footerCopy: "© 2026 LOTTE HOTELS & RESORTS", systemNormal: "시스템 정상" },
  en: { navDashboard: "Dashboard", navSchedule: "Schedule", navEmployees: "Employees", navDemand: "Demand Forecast", navSettings: "Settings", roleAdmin: "Admin", footerCopy: "© 2026 LOTTE HOTELS & RESORTS", systemNormal: "System OK" },
  ja: { navDashboard: "ダッシュボード", navSchedule: "勤務表", navEmployees: "従業員管理", navDemand: "需要予測", navSettings: "設定", roleAdmin: "管理者", footerCopy: "© 2026 LOTTE HOTELS & RESORTS", systemNormal: "システム正常" },
  ru: { navDashboard: "Главная", navSchedule: "Расписание", navEmployees: "Сотрудники", navDemand: "Прогноз спроса", navSettings: "Настройки", roleAdmin: "Администратор", footerCopy: "© 2026 LOTTE HOTELS & RESORTS", systemNormal: "Система в норме" },
  vi: { navDashboard: "Tổng quan", navSchedule: "Lịch làm việc", navEmployees: "Nhân viên", navDemand: "Dự báo nhu cầu", navSettings: "Cài đặt", roleAdmin: "Quản trị viên", footerCopy: "© 2026 LOTTE HOTELS & RESORTS", systemNormal: "Hệ thống bình thường" },
};
