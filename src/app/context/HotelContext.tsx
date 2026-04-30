import { createContext, useContext, useState, type ReactNode } from "react";

interface HotelContextType {
  hotel: string;
  setHotel: (hotel: string) => void;
}

const HotelContext = createContext<HotelContextType>({
  hotel: "롯데시티호텔 마포",
  setHotel: () => {},
});

export function HotelProvider({ children }: { children: ReactNode }) {
  const [hotel, setHotel] = useState("롯데시티호텔 마포");
  return (
    <HotelContext.Provider value={{ hotel, setHotel }}>
      {children}
    </HotelContext.Provider>
  );
}

export function useHotel() {
  return useContext(HotelContext);
}
