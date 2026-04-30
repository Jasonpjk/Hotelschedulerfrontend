/* ══════════════════════════════════════════════════════════
   전월 근무강도 계산 유틸리티
   - 직원별 근무 패턴 분석
   - 근무강도 점수 산정
   - 회복 등급 분류
══════════════════════════════════════════════════════════ */

type ShiftCode = "M07" | "A13" | "N22" | "C08" | "C09" | "C10" | "C11" | "REQ" | "OFF" | "HOL" | "VAC" | "SL" | "EDU" | "SICK";

const WORK_CODES: ShiftCode[] = ["M07", "A13", "N22", "C08", "C09", "C10", "C11"];
const REST_CODES: ShiftCode[] = ["REQ", "OFF", "HOL", "VAC", "SL", "EDU", "SICK"];

export interface IntensityAnalysis {
  employeeId: string;
  employeeName: string;
  maxConsecutiveDays: number;
  consecutive5DayCount: number;
  consecutive6PlusCount: number;
  lateToEarlyCount: number; // A13 다음날 M07
  nightToGeneralFastTransition: number;
  weekendHolidayHeavyScore: number;
  repeatedHighIntensityScore: number;
  monthlyIntensityScore: number;
  recoveryGrade: "일반" | "주의" | "회복 필요";
}

export interface IntensityConfig {
  consecutive5DayScore: number;
  consecutive6PlusScore: number;
  lateToEarlyScore: number;
  nightTransitionScore: number;
  weekendHeavyScore: number;
  repeatedPatternScore: number;
}

const DEFAULT_CONFIG: IntensityConfig = {
  consecutive5DayScore: 2,
  consecutive6PlusScore: 4,
  lateToEarlyScore: 3,
  nightTransitionScore: 3,
  weekendHeavyScore: 2,
  repeatedPatternScore: 2,
};

/**
 * 연속 근무일수 계산
 */
function calculateConsecutiveDays(schedule: ShiftCode[]): number[] {
  const consecutiveRuns: number[] = [];
  let currentRun = 0;

  for (const code of schedule) {
    if (WORK_CODES.includes(code)) {
      currentRun++;
    } else {
      if (currentRun > 0) {
        consecutiveRuns.push(currentRun);
        currentRun = 0;
      }
    }
  }

  if (currentRun > 0) {
    consecutiveRuns.push(currentRun);
  }

  return consecutiveRuns;
}

/**
 * A13 다음날 M07 패턴 카운트
 */
function countLateToEarlyPattern(schedule: ShiftCode[]): number {
  let count = 0;
  for (let i = 0; i < schedule.length - 1; i++) {
    if (schedule[i] === "A13" && schedule[i + 1] === "M07") {
      count++;
    }
  }
  return count;
}

/**
 * 야간조 종료 후 빠른 일반조 전환 카운트
 */
function countNightToGeneralFastTransition(schedule: ShiftCode[]): number {
  let count = 0;
  for (let i = 0; i < schedule.length - 2; i++) {
    // N22 다음날 또는 다다음날 바로 M07/A13
    if (schedule[i] === "N22") {
      if (schedule[i + 1] === "M07" || schedule[i + 1] === "A13") {
        count++;
      } else if (
        (schedule[i + 1] === "OFF" || REST_CODES.includes(schedule[i + 1])) &&
        (schedule[i + 2] === "M07" || schedule[i + 2] === "A13")
      ) {
        // 하루 쉬고 바로 일반조는 OK로 간주 (카운트 안 함)
      }
    }
  }
  return count;
}

/**
 * 주말/공휴일 근무 편중도 계산 (Mock - 실제로는 날짜 정보 필요)
 */
function calculateWeekendHolidayHeavy(schedule: ShiftCode[]): number {
  // Mock: 실제로는 달력 정보와 연동 필요
  // 현재는 전체 근무일 대비 휴일 없는 주의 비율로 간이 계산
  let weekendWorkCount = 0;

  // 7일 단위로 체크
  for (let i = 0; i < schedule.length; i += 7) {
    const week = schedule.slice(i, i + 7);
    const workDays = week.filter(code => WORK_CODES.includes(code)).length;
    if (workDays >= 6) {
      weekendWorkCount++;
    }
  }

  return weekendWorkCount;
}

/**
 * 근무강도 점수 계산
 */
export function calculateIntensityScore(
  employeeId: string,
  employeeName: string,
  schedule: ShiftCode[],
  config: IntensityConfig = DEFAULT_CONFIG
): IntensityAnalysis {
  // 1. 연속 근무일수 분석
  const consecutiveRuns = calculateConsecutiveDays(schedule);
  const maxConsecutiveDays = consecutiveRuns.length > 0 ? Math.max(...consecutiveRuns) : 0;
  const consecutive5DayCount = consecutiveRuns.filter(run => run === 5).length;
  const consecutive6PlusCount = consecutiveRuns.filter(run => run >= 6).length;

  // 2. 위험 조합 패턴
  const lateToEarlyCount = countLateToEarlyPattern(schedule);
  const nightToGeneralFastTransition = countNightToGeneralFastTransition(schedule);

  // 3. 주말/공휴일 편중
  const weekendHolidayHeavyScore = calculateWeekendHolidayHeavy(schedule);

  // 4. 반복 패턴 가산점
  let repeatedHighIntensityScore = 0;
  if (consecutive5DayCount >= 2) repeatedHighIntensityScore += 1;
  if (consecutive6PlusCount >= 2) repeatedHighIntensityScore += 2;
  if (lateToEarlyCount >= 2) repeatedHighIntensityScore += 1;

  // 5. 총 점수 계산
  let monthlyIntensityScore = 0;
  monthlyIntensityScore += consecutive5DayCount * config.consecutive5DayScore;
  monthlyIntensityScore += consecutive6PlusCount * config.consecutive6PlusScore;
  monthlyIntensityScore += lateToEarlyCount * config.lateToEarlyScore;
  monthlyIntensityScore += nightToGeneralFastTransition * config.nightTransitionScore;
  monthlyIntensityScore += weekendHolidayHeavyScore * config.weekendHeavyScore;
  monthlyIntensityScore += repeatedHighIntensityScore * config.repeatedPatternScore;

  // 6. 회복 등급 분류
  let recoveryGrade: "일반" | "주의" | "회복 필요" = "일반";
  if (monthlyIntensityScore >= 6) {
    recoveryGrade = "회복 필요";
  } else if (monthlyIntensityScore >= 3) {
    recoveryGrade = "주의";
  }

  return {
    employeeId,
    employeeName,
    maxConsecutiveDays,
    consecutive5DayCount,
    consecutive6PlusCount,
    lateToEarlyCount,
    nightToGeneralFastTransition,
    weekendHolidayHeavyScore,
    repeatedHighIntensityScore,
    monthlyIntensityScore,
    recoveryGrade,
  };
}

/**
 * 전체 스케줄에서 모든 직원의 근무강도 분석
 */
export function analyzeScheduleIntensity(
  schedule: Record<string, ShiftCode[]>,
  employeeNames: Record<string, string>,
  config?: IntensityConfig
): IntensityAnalysis[] {
  const results: IntensityAnalysis[] = [];

  for (const [employeeId, shifts] of Object.entries(schedule)) {
    const employeeName = employeeNames[employeeId] || employeeId;
    const analysis = calculateIntensityScore(employeeId, employeeName, shifts, config);
    results.push(analysis);
  }

  // 점수 높은 순으로 정렬
  return results.sort((a, b) => b.monthlyIntensityScore - a.monthlyIntensityScore);
}

/**
 * 회복 필요 직원 필터
 */
export function getRecoveryNeededEmployees(analyses: IntensityAnalysis[]): IntensityAnalysis[] {
  return analyses.filter(a => a.recoveryGrade === "회복 필요");
}

/**
 * 주의 직원 필터
 */
export function getCautionEmployees(analyses: IntensityAnalysis[]): IntensityAnalysis[] {
  return analyses.filter(a => a.recoveryGrade === "주의");
}
