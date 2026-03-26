import { createContext, useContext } from "react";
import { type Lang } from "../i18n";

// 현재 시안: 한국어 고정.
// 향후 실제 다국어 전환 기능 구현 시 getLang()으로 교체 예정.
export const LangContext = createContext<Lang>("ko");

export function useLang(): Lang {
  return useContext(LangContext);
}
