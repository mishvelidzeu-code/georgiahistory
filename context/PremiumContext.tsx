import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

type PremiumContextType = {
  isPremium: boolean;
  refreshPremium: () => Promise<void>;
};

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  refreshPremium: async () => {},
});

export const PremiumProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPremium, setIsPremium] = useState(false);

  const fetchPremiumStatus = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      setIsPremium(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", userData.user.id)
      .single();

    if (!error && data) {
      setIsPremium(data.is_premium);
    } else {
      setIsPremium(false);
    }
  };

  useEffect(() => {
    fetchPremiumStatus();
  }, []);

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        refreshPremium: fetchPremiumStatus,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  return useContext(PremiumContext);
};