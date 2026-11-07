import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getGeorgiaDayKey } from "../services/date";
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

  const fetchHistory = useCallback(async () => {
    try {
      // `daily_history.date` ინახება `MM-DD` ფორმატში — ზუსტად ისე,
      // როგორც weekly-history-update edge function წერს.
      const key = getGeorgiaDayKey();

      const { data } = await supabase
        .from("daily_history")
        .select("*")
        .eq("date", key)
        .maybeSingle();

      if (data) {
        setHistory(data);

        // ქეშს თარიღთან ერთად ვინახავთ, რომ ძველი დღე არ გამოჩნდეს.
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ key, data })
        );
      }
    } catch (e) {
      console.log("History fetch error:", e);
    }
  }, []);

  const loadFromCache = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (!cached) return;

      const parsed = JSON.parse(cached);

      // მხოლოდ დღევანდელი ქეში გამოდგება.
      if (parsed?.key === getGeorgiaDayKey() && parsed?.data) {
        setHistory(parsed.data);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.log("History cache error:", e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      // 1️⃣ ქეში მყისიერად
      await loadFromCache();

      // 2️⃣ supabase ფონში
      fetchHistory();
    };

    init();
  }, [loadFromCache, fetchHistory]);

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
