import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getGeorgiaDayKey } from "../services/date";
import { supabase } from "../services/supabase";
import { useAuth } from "./AuthContext";

type HistoryContextType = {
  history: any | null;
  historyLoading: boolean;
  refreshHistory: () => Promise<void>;
};

const HistoryContext = createContext<HistoryContextType>({
  history: null,
  historyLoading: false,
  refreshHistory: async () => {},
});

const STORAGE_KEY = "daily_history_cache";

export const HistoryProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [history, setHistory] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    // `daily_history`-ის RLS მხოლოდ `authenticated`-ს კითხულობს — შესვლამდე
    // მოთხოვნა ცარიელს აბრუნებს, ამიტომ უბრალოდ არ ვუშვებთ.
    if (!userId) return;

    setHistoryLoading(true);
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
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

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
    // სესიის აღდგენას ველოდებით — თორემ ავტორიზაციამდე გაშვებული მოთხოვნა
    // RLS-ზე ცარიელი ბრუნდება და ეკრანი „ინფორმაცია არ არის"-ზე რჩება.
    if (authLoading) return;

    if (!userId) {
      setHistory(null);
      setHistoryLoading(false);
      return;
    }

    let active = true;

    const init = async () => {
      // 1️⃣ ქეში მყისიერად
      setHistoryLoading(true);
      await loadFromCache();
      if (!active) return;

      // 2️⃣ supabase ფონში
      await fetchHistory();
    };

    init();

    return () => {
      active = false;
    };
    // `userId`-ზეა დამოკიდებული და არა `user` ობიექტზე, რომ ტოკენის
    // განახლება ზედმეტ მოთხოვნას არ გამოიწვევს.
  }, [authLoading, userId, loadFromCache, fetchHistory]);

  return (
    <HistoryContext.Provider
      value={{
        history,
        historyLoading,
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
