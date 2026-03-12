import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

type HistoryContextType = {
  history: any | null;
  refreshHistory: () => Promise<void>;
};

const HistoryContext = createContext<HistoryContextType>({
  history: null,
  refreshHistory: async () => {},
});

const STORAGE_KEY = "daily_history_cache";

export const HistoryProvider = ({ children }: { children: React.ReactNode }) => {

  const [history, setHistory] = useState<any>(null);

  const getGeorgiaDateKey = () => {

    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const georgia = new Date(utc + 4 * 60 * 60 * 1000);

    const year = georgia.getFullYear();
    const month = String(georgia.getMonth() + 1).padStart(2, "0");
    const day = String(georgia.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

  };

  const fetchHistory = async () => {

    try {

      const key = getGeorgiaDateKey();

      const { data } = await supabase
        .from("daily_history")
        .select("*")
        .eq("date", key)
        .maybeSingle();

      if (data) {

        setHistory(data);

        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(data)
        );

      }

    } catch (e) {

      console.log("History fetch error:", e);

    }

  };

  const loadFromCache = async () => {

    try {

      const cached = await AsyncStorage.getItem(STORAGE_KEY);

      if (cached) {
        setHistory(JSON.parse(cached));
      }

    } catch (e) {

      console.log("History cache error:", e);

    }

  };

  useEffect(() => {

    const init = async () => {

      // 1️⃣ cache მყისიერად
      await loadFromCache();

      // 2️⃣ supabase ფონში
      fetchHistory();

    };

    init();

  }, []);

  return (
    <HistoryContext.Provider
      value={{
        history,
        refreshHistory: fetchHistory,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  return useContext(HistoryContext);
};