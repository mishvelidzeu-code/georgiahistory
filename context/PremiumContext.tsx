import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

type PremiumContextType = {
  isPremium: boolean;
  premiumLoading: boolean;
  refreshPremium: () => Promise<void>;
};

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  premiumLoading: true,
  refreshPremium: async () => {},
});

export const PremiumProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [premiumLoading, setPremiumLoading] = useState(true);

  const fetchPremiumStatus = async (currentUser?: any) => {
    try {
      setPremiumLoading(true);

      let user = currentUser;

      if (!user) {
        const { data: sessionData } = await supabase.auth.getSession();
        user = sessionData?.session?.user;
      }

      if (!user) {
        setIsPremium(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("is_premium, premium_until")
        .eq("id", user.id)
        .single();

      if (error || !data) {
        setIsPremium(false);
        return;
      }

      if (!data.is_premium || !data.premium_until) {
        setIsPremium(false);
        return;
      }

      const now = new Date();
      const expire = new Date(data.premium_until);

      if (expire > now) {
        setIsPremium(true);
      } else {
        setIsPremium(false);

        await supabase
          .from("profiles")
          .update({ is_premium: false })
          .eq("id", user.id);
      }
    } catch (e) {
      console.log("Premium fetch error:", e);
      setIsPremium(false);
    } finally {
      setPremiumLoading(false);
    }
  };

  useEffect(() => {
    fetchPremiumStatus();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // ✅ DEADLOCK ფიქსი: 100ms დაყოვნება!
        setTimeout(() => {
          if (session?.user) {
            fetchPremiumStatus(session.user);
          } else {
            setIsPremium(false);
            setPremiumLoading(false); // ლოგაუთისას ჩატვირთვაც უნდა გავაჩეროთ
          }
        }, 100);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        premiumLoading,
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