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
      .select("is_premium, premium_until")
      .eq("id", userData.user.id)
      .single();

    if (error || !data) {
      setIsPremium(false);
      return;
    }

    if (!data.is_premium) {
      setIsPremium(false);
      return;
    }

    if (!data.premium_until) {
      setIsPremium(false);
      return;
    }

    const now = new Date();
    const expire = new Date(data.premium_until);

    if (expire > now) {
      setIsPremium(true);
    } else {
      setIsPremium(false);

      // ავტომატურად გათიშვა თუ ვადა გასულია
      await supabase
        .from("profiles")
        .update({ is_premium: false })
        .eq("id", userData.user.id);
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