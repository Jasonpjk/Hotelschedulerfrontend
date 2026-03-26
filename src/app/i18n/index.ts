export type Lang = "ko" | "en" | "ja" | "ru" | "vi";

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "ko", label: "Korean",     native: "한국어" },
  { code: "en", label: "English",    native: "English" },
  { code: "ja", label: "Japanese",   native: "日本語" },
  { code: "ru", label: "Russian",    native: "Русский" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt" },
];

export function getLang(): Lang {
  const stored = localStorage.getItem("lumiere_lang") as Lang | null;
  return stored && LANGS.some((l) => l.code === stored) ? stored : "ko";
}

export function setLang(lang: Lang) {
  localStorage.setItem("lumiere_lang", lang);
}

/* ─── Dashboard translations ─── */
export const DT: Record<Lang, {
  // Sidebar
  navDashboard: string;
  navSchedule: string;
  navEmployees: string;
  navLeave: string;
  navDemand: string;
  navSettings: string;
  // Header
  hotelLabel: string;
  // Page header
  pageEyebrow: string;
  greeting: string;
  greetingSub: string;
  // KPI
  kpiMonth: string;
  kpiMonthValue: string;
  kpiMonthSub: string;
  kpiUnconfirmed: string;
  kpiUnconfirmedSub: string;
  kpiLock: string;
  kpiLockSub: string;
  kpiStaff: string;
  kpiStaffSub: string;
  kpiRisk: string;
  kpiRiskSub: string;
  // Schedule card
  scheduleStatus: string;
  dateCurrentFull: string;
  dateNextFull: string;
  scheduleVersion: string;
  scheduleLastEdit: string;
  btnView: string;
  btnEdit: string;
  btnDownload: string;
  btnConfirm: string;
  btnCreate: string;
  // Progress labels
  progressShifts: string;
  progressConfirmed: string;
  progressCoverage: string;
  // Next month card
  nextMonth: string;
  nextMonthStatus: string;
  nextMonthDesc: string;
  checklistTitle: string;
  checkDemand: string;
  checkLeave: string;
  checkStaff: string;
  checkHoliday: string;
  lastCreated: string;
  btnStartCreate: string;
  // Fairness
  fairnessTitle: string;
  fairnessSub: string;
  fairnessNight: string;
  fairnessWeekend: string;
  fairnessAlert: string;
  overloadLabel: string;
  fairnessViewAll: string;
  // Change log
  changeLogTitle: string;
  changeViewAll: string;
  whoAI: string;
  whoSystem: string;
  tagManual: string;
  tagSwap: string;
  tagCreate: string;
  tagAuto: string;
  changeAction1: string;
  changeTime1: string;
  changeAction2: string;
  changeTime2: string;
  changeAction3: string;
  changeTime3: string;
  changeAction4: string;
  changeTime4: string;
  changeAction5: string;
  changeTime5: string;
  // AI
  aiTitle: string;
  aiViewAll: string;
  aiInputPlaceholder: string;
  aiInstruction1: string;
  aiResult1: string;
  aiTime1: string;
  aiInstruction2: string;
  aiResult2: string;
  aiTime2: string;
  aiInstruction3: string;
  aiResult3: string;
  aiTime3: string;
  // Alerts
  alertsTitle: string;
  alert1: string;
  alert2: string;
  alert3: string;
  alert4: string;
  // Quick actions
  quickTitle: string;
  quickAddStaff: string;
  quickAddStaffSub: string;
  quickLeave: string;
  quickLeaveSub: string;
  quickDemand: string;
  quickDemandSub: string;
  quickSchedule: string;
  quickScheduleSub: string;
  quickHotelSettings: string;
  quickHotelSettingsSub: string;
  // Badges
  badgeDraft: string;
  badgeConfirmed: string;
  badgeLocked: string;
  badgeRisk: string;
  badgeWarning: string;
  badgeNotStarted: string;
  badgeAction: string;
  badgeLockSoon: string;
  badgeReview: string;
  // System
  systemNormal: string;
  // User role
  roleAdmin: string;
  // Footer
  footerCopy: string;
  // Schedule adjustment modal
  schedAdjustTitle: string;
  schedAdjustEmployee: string;
  schedAdjustDate: string;
  schedAdjustCurrent: string;
  schedAdjustSelectNew: string;
  schedAdjustImpactTitle: string;
  schedAdjustCoverageChange: string;
  schedAdjustIntervalRisk: string;
  schedAdjustRolling14: string;
  schedAdjustNightRule: string;
  schedAdjustWeekendFairness: string;
  schedAdjustCancel: string;
  schedAdjustApply: string;
  schedAdjustWorkShifts: string;
  schedAdjustRestDays: string;
}> = {
  ko: {
    navDashboard: "대시보드",
    navSchedule: "근무표",
    navEmployees: "직원 관리",
    navLeave: "휴무 관리",
    navDemand: "수요 예측",
    navSettings: "호텔 설정",
    hotelLabel: "호텔 선택",
    pageEyebrow: "대시보드",
    greeting: "안녕하세요, 김재민 관리자님",
    greetingSub: "2026년 3월 8일 일요일 · 더 그랜드 — 서울",
    kpiMonth: "이번 달",
    kpiMonthValue: "3월",
    kpiMonthSub: "버전 3.1 · 초안",
    kpiUnconfirmed: "미확정",
    kpiUnconfirmedSub: "검토 필요 시프트",
    kpiLock: "락 예정",
    kpiLockSub: "3월 10일 마감",
    kpiStaff: "전체 직원",
    kpiStaffSub: "이번 주 휴가 2명",
    kpiRisk: "리스크 날짜",
    kpiRiskSub: "피크 수요 예상일",
    scheduleStatus: "이번 달 근무표",
    dateCurrentFull: "2026년 3월",
    dateNextFull: "2026년 4월",
    scheduleVersion: "버전 3.1",
    scheduleLastEdit: "최종 수정",
    btnView: "보기",
    btnEdit: "편집",
    btnDownload: "다운로드",
    btnConfirm: "확정",
    btnCreate: "새로 생성",
    progressShifts: "시프트 배정",
    progressConfirmed: "확정 완료",
    progressCoverage: "커버리지 충족",
    nextMonth: "4월 근무표",
    nextMonthStatus: "미시작",
    nextMonthDesc: "수요 데이터 수집 완료. 휴무 요청 검토 후 생성 가능합니다.",
    checklistTitle: "준비 상태",
    checkDemand: "수요 예측 완료",
    checkLeave: "휴무 요청 검토",
    checkStaff: "직원 명단 최신화",
    checkHoliday: "공휴일 설정",
    lastCreated: "최근 생성: 2026년 3월 · 3월 1일",
    btnStartCreate: "생성 시작",
    fairnessTitle: "공정성 요약",
    fairnessSub: "야간·주말 시프트 편차 — 3월",
    fairnessNight: "야간",
    fairnessWeekend: "주말",
    fairnessAlert: "2명이 공정성 기준을 초과했습니다.",
    overloadLabel: "과중",
    fairnessViewAll: "전체 보기",
    changeLogTitle: "최근 변경 이력",
    changeViewAll: "전체 보기",
    whoAI: "AI 엔진",
    whoSystem: "시스템",
    tagManual: "수동 편집",
    tagSwap: "교환",
    tagCreate: "생성",
    tagAuto: "자동",
    changeAction1: "3월 14~20일 시프트 블록 확정",
    changeTime1: "오늘 14:32",
    changeAction2: "3월 22일 피크 수요 시프트 6개 재배분",
    changeTime2: "오늘 11:08",
    changeAction3: "3월 18일 박씨와 시프트 교환 완료",
    changeTime3: "3월 7일 09:41",
    changeAction4: "AI 제안으로 버전 3.1 생성",
    changeTime4: "3월 6일 17:20",
    changeAction5: "1주차 블록 자동 락 처리",
    changeTime5: "3월 5일 00:01",
    aiTitle: "AI 조정 기록",
    aiViewAll: "전체 이력",
    aiInputPlaceholder: "새 AI 지시 입력...",
    aiInstruction1: "박씨·이씨 야간 연속 배정 금지",
    aiResult1: "충돌 5건 해소. 최씨·정씨 재배분 완료.",
    aiTime1: "오늘 11:08",
    aiInstruction2: "3월 22~23일 컨퍼런스 인력 보강",
    aiResult2: "추가 시프트 3개 배정. 연장 근무 2명 지정.",
    aiTime2: "3월 6일 17:20",
    aiInstruction3: "어린 자녀 직원 주말 근무 최소화",
    aiResult3: "4명 선호 플래그 적용. 시프트 7개 조정.",
    aiTime3: "3월 5일 10:44",
    alertsTitle: "운영 경고",
    alert1: "3월 22일(토) 최소 커버리지 기준 2명 미달. 컨퍼런스 피크 수요 예상.",
    alert2: "3월 14일 주간 시프트 3건 미확정. 확정 기한 3월 10일.",
    alert3: "1주차 블록 오늘 자정 자동 락 예정. 수정이 필요하다면 지금 확인하세요.",
    alert4: "정현우·윤경희 휴무 요청 2건 미검토.",
    quickTitle: "빠른 액션",
    quickAddStaff: "직원 추가",
    quickAddStaffSub: "신규 직원 등록",
    quickLeave: "휴무 등록",
    quickLeaveSub: "휴무 요청 접수",
    quickDemand: "수요 예측",
    quickDemandSub: "수요 예측 업데이트",
    quickSchedule: "근무표 열기",
    quickScheduleSub: "3월 근무표로 이동",
    quickHotelSettings: "호텔 설정",
    quickHotelSettingsSub: "속성 설정 관리",
    badgeDraft: "초안",
    badgeConfirmed: "확정",
    badgeLocked: "락",
    badgeRisk: "고위험",
    badgeWarning: "처리 필요",
    badgeNotStarted: "미시작",
    badgeAction: "처리 필요",
    badgeLockSoon: "락 예정",
    badgeReview: "Review",
    systemNormal: "System OK",
    roleAdmin: "Administrator",
    footerCopy: "© 2026 LOTTE HOTELS & RESORTS",
    // Schedule adjustment modal
    schedAdjustTitle: "수동 스케줄 조정",
    schedAdjustEmployee: "직원",
    schedAdjustDate: "날짜",
    schedAdjustCurrent: "현재 배정",
    schedAdjustSelectNew: "변경할 근무코드 선택",
    schedAdjustImpactTitle: "변경 영향 분석",
    schedAdjustCoverageChange: "이 변경으로 해당일 근무 인원이 영향받습니다",
    schedAdjustIntervalRisk: "A13→다음날 M07 위험 조합 발생 가능",
    schedAdjustRolling14: "롤링 14일 휴무 규칙 충족",
    schedAdjustNightRule: "야간조 후 2일 휴무 규칙 준수",
    schedAdjustWeekendFairness: "주말 휴무 공정성 영향 없음",
    schedAdjustCancel: "취소",
    schedAdjustApply: "적용하기",
    schedAdjustWorkShifts: "근무조",
    schedAdjustRestDays: "휴무",
  },
  en: {
    navDashboard: "Dashboard",
    navSchedule: "Schedule",
    navEmployees: "Employees",
    navLeave: "Leave",
    navDemand: "Demand Forecast",
    navSettings: "Settings",
    hotelLabel: "Hotel",
    pageEyebrow: "Dashboard",
    greeting: "Welcome, Admin Kim",
    greetingSub: "Sunday, March 8, 2026 · The Grand — Seoul",
    kpiMonth: "This Month",
    kpiMonthValue: "March",
    kpiMonthSub: "Ver. 3.1 · Draft",
    kpiUnconfirmed: "Unconfirmed",
    kpiUnconfirmedSub: "Shifts pending review",
    kpiLock: "Lock Due",
    kpiLockSub: "Deadline Mar 10",
    kpiStaff: "Total Staff",
    kpiStaffSub: "2 on leave this week",
    kpiRisk: "Risk Days",
    kpiRiskSub: "Peak demand forecast",
    scheduleStatus: "March Schedule",
    dateCurrentFull: "March 2026",
    dateNextFull: "April 2026",
    scheduleVersion: "Version 3.1",
    scheduleLastEdit: "Last edited",
    btnView: "View",
    btnEdit: "Edit",
    btnDownload: "Download",
    btnConfirm: "Confirm",
    btnCreate: "New Draft",
    progressShifts: "Shifts Assigned",
    progressConfirmed: "Confirmed",
    progressCoverage: "Coverage Met",
    nextMonth: "April Schedule",
    nextMonthStatus: "Not Started",
    nextMonthDesc: "Demand data collected. Review leave requests before generating.",
    checklistTitle: "Readiness",
    checkDemand: "Demand input complete",
    checkLeave: "Leave requests reviewed",
    checkStaff: "Staff roster up to date",
    checkHoliday: "Holiday calendar set",
    lastCreated: "Last created: March 2026 · Mar 1",
    btnStartCreate: "Start",
    fairnessTitle: "Fairness Summary",
    fairnessSub: "Night & weekend shift variance — March",
    fairnessNight: "Night",
    fairnessWeekend: "Wknd",
    fairnessAlert: "2 staff members exceed fairness threshold.",
    overloadLabel: "Over",
    fairnessViewAll: "View All",
    changeLogTitle: "Change Log",
    changeViewAll: "View All",
    whoAI: "AI Engine",
    whoSystem: "System",
    tagManual: "Manual",
    tagSwap: "Swap",
    tagCreate: "Created",
    tagAuto: "Auto",
    changeAction1: "Confirmed shift block Mar 14–20",
    changeTime1: "Today 14:32",
    changeAction2: "Redistributed 6 shifts for Mar 22 peak demand",
    changeTime2: "Today 11:08",
    changeAction3: "Shift swap with Park completed for Mar 18",
    changeTime3: "Mar 7, 09:41",
    changeAction4: "Generated version 3.1 via AI suggestion",
    changeTime4: "Mar 6, 17:20",
    changeAction5: "Week 1 block auto-locked",
    changeTime5: "Mar 5, 00:01",
    aiTitle: "AI Adjustments",
    aiViewAll: "Full History",
    aiInputPlaceholder: "Enter new AI instruction...",
    aiInstruction1: "Block consecutive night shifts for Park & Lee",
    aiResult1: "5 conflicts resolved. Choi & Jung reassigned.",
    aiTime1: "Today 11:08",
    aiInstruction2: "Reinforce staffing Mar 22–23 for conference",
    aiResult2: "3 extra shifts added. 2 staff on extended duty.",
    aiTime2: "Mar 6, 17:20",
    aiInstruction3: "Minimize weekend shifts for staff with young children",
    aiResult3: "Preference flags applied to 4 staff. 7 shifts adjusted.",
    aiTime3: "Mar 5, 10:44",
    alertsTitle: "Operational Alerts",
    alert1: "Mar 22 (Sat): 2 staff below minimum coverage. Conference peak expected.",
    alert2: "3 unconfirmed shifts on Mar 14. Deadline: Mar 10.",
    alert3: "Week 1 block auto-locks at midnight tonight.",
    alert4: "2 pending leave requests from Hyeonwoo J. & Kyeonghui Y.",
    quickTitle: "Quick Actions",
    quickAddStaff: "Add Staff",
    quickAddStaffSub: "Register new employee",
    quickLeave: "Register Leave",
    quickLeaveSub: "Accept leave request",
    quickDemand: "Input Demand",
    quickDemandSub: "Update forecast",
    quickSchedule: "Open Schedule",
    quickScheduleSub: "Go to March schedule",
    quickHotelSettings: "Hotel Settings",
    quickHotelSettingsSub: "Manage configuration",
    badgeDraft: "Draft",
    badgeConfirmed: "Confirmed",
    badgeLocked: "Locked",
    badgeRisk: "High Risk",
    badgeWarning: "Action Required",
    badgeNotStarted: "Not Started",
    badgeAction: "Action Required",
    badgeLockSoon: "Locking Soon",
    badgeReview: "Review",
    systemNormal: "System OK",
    roleAdmin: "Administrator",
    footerCopy: "© 2026 Lumière Hotel Group · Ops Suite v3.1",
    // Schedule adjustment modal
    schedAdjustTitle: "Manual Schedule Adjustment",
    schedAdjustEmployee: "Employee",
    schedAdjustDate: "Date",
    schedAdjustCurrent: "Current Assignment",
    schedAdjustSelectNew: "Select New Shift Code",
    schedAdjustImpactTitle: "Impact Analysis",
    schedAdjustCoverageChange: "This change will affect staffing coverage for the day",
    schedAdjustIntervalRisk: "A13→M07 next day risk combination may occur",
    schedAdjustRolling14: "Rolling 14-day rest rule satisfied",
    schedAdjustNightRule: "2-day rest after night shift rule complied",
    schedAdjustWeekendFairness: "No impact on weekend fairness",
    schedAdjustCancel: "Cancel",
    schedAdjustApply: "Apply",
    schedAdjustWorkShifts: "Work Shifts",
    schedAdjustRestDays: "Rest Days",
  },
  ja: {
    navDashboard: "ダッシュボード",
    navSchedule: "シフト表",
    navEmployees: "スタッフ管理",
    navLeave: "休暇管理",
    navDemand: "需要予測",
    navSettings: "ホテル設定",
    hotelLabel: "ホテル選択",
    pageEyebrow: "ダッシュボード",
    greeting: "おはようございます、金管理者様",
    greetingSub: "2026年3月8日 日曜日 · ザ・グランド — ソウル",
    kpiMonth: "今月",
    kpiMonthValue: "3月",
    kpiMonthSub: "Ver. 3.1 · 下書き",
    kpiUnconfirmed: "未確定",
    kpiUnconfirmedSub: "要確認シフト",
    kpiLock: "ロック予定",
    kpiLockSub: "3月10日締切",
    kpiStaff: "全スタッフ",
    kpiStaffSub: "今週休暇2名",
    kpiRisk: "リスク日",
    kpiRiskSub: "ピーク需要予測日",
    scheduleStatus: "3月シフト表",
    dateCurrentFull: "2026年3月",
    dateNextFull: "2026年4月",
    scheduleVersion: "バージョン 3.1",
    scheduleLastEdit: "最終編集",
    btnView: "表示",
    btnEdit: "編集",
    btnDownload: "DL",
    btnConfirm: "確定",
    btnCreate: "新規作成",
    progressShifts: "シフト配置",
    progressConfirmed: "確定済",
    progressCoverage: "カバレッジ",
    nextMonth: "4月シフト表",
    nextMonthStatus: "未着手",
    nextMonthDesc: "需要データ収集済み。休暇申請確認後に生成できます。",
    checklistTitle: "準備状況",
    checkDemand: "需要入力完了",
    checkLeave: "休暇申請確認",
    checkStaff: "スタッフ名簿更新",
    checkHoliday: "祝日設定",
    lastCreated: "前回作成: 2026年3月 · 3月1日",
    btnStartCreate: "作成開始",
    fairnessTitle: "公平性サマリー",
    fairnessSub: "夜間・週末シフトの偏り — 3月",
    fairnessNight: "夜間",
    fairnessWeekend: "週末",
    fairnessAlert: "2名が公平性基準を超えています。",
    overloadLabel: "過重",
    fairnessViewAll: "全件表示",
    changeLogTitle: "変更履歴",
    changeViewAll: "全件表示",
    whoAI: "AIエンジン",
    whoSystem: "システム",
    tagManual: "手動編集",
    tagSwap: "交換",
    tagCreate: "作成",
    tagAuto: "自動",
    changeAction1: "3月14〜20日シフトブロック確定",
    changeTime1: "本日 14:32",
    changeAction2: "3月22日ピーク需要シフト6件再配分",
    changeTime2: "本日 11:08",
    changeAction3: "3月18日パクさんとシフト交換完了",
    changeTime3: "3月7日 09:41",
    changeAction4: "AI提案でバージョン3.1作成",
    changeTime4: "3月6日 17:20",
    changeAction5: "第1週ブロック自動ロック処理",
    changeTime5: "3月5日 00:01",
    aiTitle: "AI調整記録",
    aiViewAll: "全履歴",
    aiInputPlaceholder: "AI指示を入力...",
    aiInstruction1: "パク・イ氏の夜間連続配置禁止",
    aiResult1: "競合5件解消。チェ・チョン氏に再配分。",
    aiTime1: "本日 11:08",
    aiInstruction2: "3月22〜23日カンファレンス人員強化",
    aiResult2: "追加シフト3件配置。延長勤務2名指定。",
    aiTime2: "3月6日 17:20",
    aiInstruction3: "小さな子供のいるスタッフの週末勤務最小化",
    aiResult3: "4名に優先フラグ適用。シフト7件調整。",
    aiTime3: "3月5日 10:44",
    alertsTitle: "運営アラート",
    alert1: "3月22日(土) カバレッジ不足2名。カンファレンスピーク需要予測。",
    alert2: "3月14日 未確定シフト3件。締切: 3月10日。",
    alert3: "第1週ブロックが今夜0時に自動ロック予定。",
    alert4: "鄭・尹の休暇申請2件が未確認です。",
    quickTitle: "クイックアクション",
    quickAddStaff: "スタッフ追加",
    quickAddStaffSub: "新規スタッフ登録",
    quickLeave: "休暇登録",
    quickLeaveSub: "休暇申請受付",
    quickDemand: "需要入力",
    quickDemandSub: "予測更新",
    quickSchedule: "シフト表を開く",
    quickScheduleSub: "3月シフト表へ",
    quickHotelSettings: "ホテル設定",
    quickHotelSettingsSub: "設定管理",
    badgeDraft: "下書き",
    badgeConfirmed: "確定",
    badgeLocked: "ロック",
    badgeRisk: "高リスク",
    badgeWarning: "要対応",
    badgeNotStarted: "未着手",
    badgeAction: "要対応",
    badgeLockSoon: "ロック予定",
    badgeReview: "Review",
    systemNormal: "System OK",
    roleAdmin: "Administrator",
    footerCopy: "© 2026 Lumière Hotel Group · Ops Suite v3.1",
    // Schedule adjustment modal
    schedAdjustTitle: "Manual Schedule Adjustment",
    schedAdjustEmployee: "Employee",
    schedAdjustDate: "Date",
    schedAdjustCurrent: "Current Assignment",
    schedAdjustSelectNew: "Select New Shift Code",
    schedAdjustImpactTitle: "Impact Analysis",
    schedAdjustCoverageChange: "This change will affect staffing coverage for the day",
    schedAdjustIntervalRisk: "A13→M07 next day risk combination may occur",
    schedAdjustRolling14: "Rolling 14-day rest rule satisfied",
    schedAdjustNightRule: "2-day rest after night shift rule complied",
    schedAdjustWeekendFairness: "No impact on weekend fairness",
    schedAdjustCancel: "Cancel",
    schedAdjustApply: "Apply",
    schedAdjustWorkShifts: "Work Shifts",
    schedAdjustRestDays: "Rest Days",
  },
  ru: {
    navDashboard: "Главная",
    navSchedule: "Расписание",
    navEmployees: "Сотрудники",
    navLeave: "Отпуска",
    navDemand: "Прогноз спроса",
    navSettings: "Настройки",
    hotelLabel: "Отель",
    pageEyebrow: "Главная",
    greeting: "Добрый день, Администратор Ким",
    greetingSub: "Воскресенье, 8 марта 2026 · The Grand — Сеул",
    kpiMonth: "Этот месяц",
    kpiMonthValue: "Март",
    kpiMonthSub: "Ver. 3.1 · Черновик",
    kpiUnconfirmed: "Не подтверждено",
    kpiUnconfirmedSub: "Смены на проверке",
    kpiLock: "Блокировка",
    kpiLockSub: "Срок: 10 марта",
    kpiStaff: "Всего сотрудников",
    kpiStaffSub: "2 в отпуске на неделе",
    kpiRisk: "Дни риска",
    kpiRiskSub: "Прогноз пикового спроса",
    scheduleStatus: "Расписание: март",
    dateCurrentFull: "Март 2026",
    dateNextFull: "Апрель 2026",
    scheduleVersion: "Версия 3.1",
    scheduleLastEdit: "Последнее изменение",
    btnView: "Просмотр",
    btnEdit: "Редактировать",
    btnDownload: "Скачать",
    btnConfirm: "Подтвердить",
    btnCreate: "Создать",
    progressShifts: "Назначено смен",
    progressConfirmed: "Подтверждено",
    progressCoverage: "Покрытие",
    nextMonth: "Расписание: апрель",
    nextMonthStatus: "Не начато",
    nextMonthDesc: "Данные о спросе собраны. Проверьте заявки на отпуск перед созданием.",
    checklistTitle: "Готовность",
    checkDemand: "Спрос введён",
    checkLeave: "Заявки проверены",
    checkStaff: "Список обновлён",
    checkHoliday: "Праздники настроены",
    lastCreated: "Последнее создание: март 2026 · 1 марта",
    btnStartCreate: "Начать",
    fairnessTitle: "Справедливость",
    fairnessSub: "Отклонение ночных/выходных смен — март",
    fairnessNight: "Ночь",
    fairnessWeekend: "Вых.",
    fairnessAlert: "2 сотрудника превышают порог справедливости.",
    overloadLabel: "Перегр.",
    fairnessViewAll: "Все",
    changeLogTitle: "История изменений",
    changeViewAll: "Все",
    whoAI: "ИИ-движок",
    whoSystem: "Система",
    tagManual: "Вручную",
    tagSwap: "Замена",
    tagCreate: "Создано",
    tagAuto: "Авто",
    changeAction1: "Подтверждён блок смен 14–20 марта",
    changeTime1: "Сегодня 14:32",
    changeAction2: "Перераспределено 6 смен пик 22 марта",
    changeTime2: "Сегодня 11:08",
    changeAction3: "Замена смены с Паком завершена 18 марта",
    changeTime3: "7 марта 09:41",
    changeAction4: "Создана версия 3.1 по предложению ИИ",
    changeTime4: "6 марта 17:20",
    changeAction5: "Блок 1-й недели автоматически заблокирован",
    changeTime5: "5 марта 00:01",
    aiTitle: "Корректировки ИИ",
    aiViewAll: "Вся история",
    aiInputPlaceholder: "Введите команду для ИИ...",
    aiInstruction1: "Запретить последовательные ночные смены для Пак и Ли",
    aiResult1: "5 конфликтов устранено. Чои и Чон перераспределены.",
    aiTime1: "Сегодня 11:08",
    aiInstruction2: "Усилить кадровый состав 22–23 марта для конференции",
    aiResult2: "Добавлено 3 смены. 2 сотрудника на расширенном дежурстве.",
    aiTime2: "6 марта 17:20",
    aiInstruction3: "Минимизировать выходные смены для сотрудников с детьми",
    aiResult3: "Флаги предпочтений для 4 сотрудников. Скорректировано 7 смен.",
    aiTime3: "5 марта 10:44",
    alertsTitle: "Предупреждения",
    alert1: "22 мар (сб): нехватка 2 сотрудников. Ожидается пик.",
    alert2: "3 неподтверждённые смены на 14 мар. Срок: 10 мар.",
    alert3: "Блок 1-й недели будет заблокирован в полночь.",
    alert4: "2 заявки на отпуск не проверены.",
    quickTitle: "Быстрые действия",
    quickAddStaff: "Добавить сотрудника",
    quickAddStaffSub: "Регистрация нового",
    quickLeave: "Отпуск",
    quickLeaveSub: "Принять заявку",
    quickDemand: "Спрос",
    quickDemandSub: "Обновить прогноз",
    quickSchedule: "Открыть расписание",
    quickScheduleSub: "Перейти к марту",
    quickHotelSettings: "Настройки",
    quickHotelSettingsSub: "Управление",
    badgeDraft: "Черновик",
    badgeConfirmed: "Подтверждено",
    badgeLocked: "Заблок.",
    badgeRisk: "Высокий риск",
    badgeWarning: "Требует действий",
    badgeNotStarted: "Не начато",
    badgeAction: "Требует действий",
    badgeLockSoon: "Скоро блок.",
    badgeReview: "Review",
    systemNormal: "System OK",
    roleAdmin: "Administrator",
    footerCopy: "© 2026 LOTTE HOTELS & RESORTS · Ops Suite v3.1",
    // Schedule adjustment modal
    schedAdjustTitle: "Manual Schedule Adjustment",
    schedAdjustEmployee: "Employee",
    schedAdjustDate: "Date",
    schedAdjustCurrent: "Current Assignment",
    schedAdjustSelectNew: "Select New Shift Code",
    schedAdjustImpactTitle: "Impact Analysis",
    schedAdjustCoverageChange: "This change will affect staffing coverage for the day",
    schedAdjustIntervalRisk: "A13→M07 next day risk combination may occur",
    schedAdjustRolling14: "Rolling 14-day rest rule satisfied",
    schedAdjustNightRule: "2-day rest after night shift rule complied",
    schedAdjustWeekendFairness: "No impact on weekend fairness",
    schedAdjustCancel: "Cancel",
    schedAdjustApply: "Apply",
    schedAdjustWorkShifts: "Work Shifts",
    schedAdjustRestDays: "Rest Days",
  },
  vi: {
    navDashboard: "Tổng quan",
    navSchedule: "Lịch làm việc",
    navEmployees: "Nhân viên",
    navLeave: "Nghỉ phép",
    navDemand: "Dự báo nhu cầu",
    navSettings: "Cài đặt",
    hotelLabel: "Chọn khách sạn",
    pageEyebrow: "Tổng quan",
    greeting: "Xin chào, Quản trị viên Kim",
    greetingSub: "Chủ nhật, 8 tháng 3 năm 2026 · The Grand — Seoul",
    kpiMonth: "Tháng này",
    kpiMonthValue: "Tháng 3",
    kpiMonthSub: "Ver. 3.1 · Nháp",
    kpiUnconfirmed: "Chưa xác nhận",
    kpiUnconfirmedSub: "Ca cần xem xét",
    kpiLock: "Sắp khóa",
    kpiLockSub: "Hạn: 10 tháng 3",
    kpiStaff: "Tổng nhân viên",
    kpiStaffSub: "2 nghỉ phép tuần này",
    kpiRisk: "Ngày rủi ro",
    kpiRiskSub: "Dự báo nhu cầu cao",
    scheduleStatus: "Lịch tháng 3",
    dateCurrentFull: "Tháng 3, 2026",
    dateNextFull: "Tháng 4, 2026",
    scheduleVersion: "Phiên bản 3.1",
    scheduleLastEdit: "Sửa lần cuối",
    btnView: "Xem",
    btnEdit: "Sửa",
    btnDownload: "Tải về",
    btnConfirm: "Xác nhận",
    btnCreate: "Tạo mới",
    progressShifts: "Ca đã phân công",
    progressConfirmed: "Đã xác nhận",
    progressCoverage: "Đủ nhân lực",
    nextMonth: "Lịch tháng 4",
    nextMonthStatus: "Chưa bắt đầu",
    nextMonthDesc: "Dữ liệu nhu cầu đã thu thập. Xem xét nghỉ phép trước khi tạo.",
    checklistTitle: "Trạng thái",
    checkDemand: "Nhập nhu cầu xong",
    checkLeave: "Xem xét đơn nghỉ",
    checkStaff: "Danh sách cập nhật",
    checkHoliday: "Cài lịch nghỉ lễ",
    lastCreated: "Tạo gần nhất: tháng 3/2026 · 1 tháng 3",
    btnStartCreate: "Bắt đầu",
    fairnessTitle: "Công bằng",
    fairnessSub: "Ca đêm & cuối tuần — tháng 3",
    fairnessNight: "Đêm",
    fairnessWeekend: "C.tuần",
    fairnessAlert: "2 nhân viên vượt ngưỡng công bằng.",
    overloadLabel: "Quá tải",
    fairnessViewAll: "Xem tất cả",
    changeLogTitle: "Lịch sử thay đổi",
    changeViewAll: "Xem tất cả",
    whoAI: "AI Engine",
    whoSystem: "Hệ thống",
    tagManual: "Thủ công",
    tagSwap: "Đổi ca",
    tagCreate: "Tạo mới",
    tagAuto: "Tự động",
    changeAction1: "Xác nhận khối ca 14–20/3",
    changeTime1: "Hôm nay 14:32",
    changeAction2: "Phân phối lại 6 ca nhu cầu cao ngày 22/3",
    changeTime2: "Hôm nay 11:08",
    changeAction3: "Đổi ca với Park ngày 18/3 hoàn tất",
    changeTime3: "7/3, 09:41",
    changeAction4: "Tạo phiên bản 3.1 theo đề xuất AI",
    changeTime4: "6/3, 17:20",
    changeAction5: "Khối tuần 1 tự động khóa",
    changeTime5: "5/3, 00:01",
    aiTitle: "Điều chỉnh AI",
    aiViewAll: "Toàn bộ lịch sử",
    aiInputPlaceholder: "Nhập lệnh AI mới...",
    aiInstruction1: "Cấm ca đêm liên tiếp cho Park & Lee",
    aiResult1: "5 xung đột đã giải quyết. Choi & Jung được phân công lại.",
    aiTime1: "Hôm nay 11:08",
    aiInstruction2: "Tăng cường nhân lực 22–23/3 cho hội nghị",
    aiResult2: "Thêm 3 ca. 2 nhân viên làm tăng ca.",
    aiTime2: "6/3, 17:20",
    aiInstruction3: "Giảm ca cuối tuần cho nhân viên có con nhỏ",
    aiResult3: "Áp dụng cờ ưu tiên cho 4 người. Điều chỉnh 7 ca.",
    aiTime3: "5/3, 10:44",
    alertsTitle: "Cảnh báo vận hành",
    alert1: "22/3 (T7): thiếu 2 nhân viên theo tiêu chuẩn. Dự báo nhu cầu cao.",
    alert2: "3 ca chưa xác nhận ngày 14/3. Hạn: 10/3.",
    alert3: "Khối tuần 1 sẽ tự khóa lúc nửa đêm nay.",
    alert4: "2 đơn nghỉ phép chưa xem xét.",
    quickTitle: "Thao tác nhanh",
    quickAddStaff: "Thêm nhân viên",
    quickAddStaffSub: "Đăng ký mới",
    quickLeave: "Đăng ký nghỉ",
    quickLeaveSub: "Tiếp nhận đơn",
    quickDemand: "Nhập nhu cầu",
    quickDemandSub: "Cập nhật dự báo",
    quickSchedule: "Mở lịch",
    quickScheduleSub: "Đến lịch tháng 3",
    quickHotelSettings: "Cài đặt",
    quickHotelSettingsSub: "Quản lý cấu hình",
    badgeDraft: "Nháp",
    badgeConfirmed: "Đã xác nhận",
    badgeLocked: "Đã khóa",
    badgeRisk: "Rủi ro cao",
    badgeWarning: "Cần xử lý",
    badgeNotStarted: "Chưa bắt đầu",
    badgeAction: "Cần xử lý",
    badgeLockSoon: "Sắp khóa",
    badgeReview: "Review",
    systemNormal: "System OK",
    roleAdmin: "Administrator",
    footerCopy: "© 2026 Lumière Hotel Group · Ops Suite v3.1",
    // Schedule adjustment modal
    schedAdjustTitle: "Manual Schedule Adjustment",
    schedAdjustEmployee: "Employee",
    schedAdjustDate: "Date",
    schedAdjustCurrent: "Current Assignment",
    schedAdjustSelectNew: "Select New Shift Code",
    schedAdjustImpactTitle: "Impact Analysis",
    schedAdjustCoverageChange: "This change will affect staffing coverage for the day",
    schedAdjustIntervalRisk: "A13→M07 next day risk combination may occur",
    schedAdjustRolling14: "Rolling 14-day rest rule satisfied",
    schedAdjustNightRule: "2-day rest after night shift rule complied",
    schedAdjustWeekendFairness: "No impact on weekend fairness",
    schedAdjustCancel: "Cancel",
    schedAdjustApply: "Apply",
    schedAdjustWorkShifts: "Work Shifts",
    schedAdjustRestDays: "Rest Days",
  },
};