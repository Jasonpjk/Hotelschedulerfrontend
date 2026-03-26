import { createContext, useContext } from "react";

export const HotelContext = createContext<string>("롯데시티호텔 마포");

export function useHotel(): string {
  return useContext(HotelContext);
}
