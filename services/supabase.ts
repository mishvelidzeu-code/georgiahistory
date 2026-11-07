import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

/**
 * ⚠️ ახალი Supabase პროექტის მონაცემები აქ ჩაისვამს.
 *
 * ძველი პროექტი (lgygwpvectxaxdiujjna) წაშლილია — მისი მისამართი აღარ იხსნება.
 * ახალი პროექტის შექმნის შემდეგ:
 *   Supabase Dashboard → Project Settings → API
 *   Project URL        → SUPABASE_URL
 *   publishable / anon key → SUPABASE_ANON_KEY
 *
 * სურვილის შემთხვევაში იგივე მნიშვნელობები `.env`-შიც შეიძლება ეწეროს
 * (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY) — მაშინ ქვემოთა
 * კონსტანტები უბრალოდ სათადარიგო მნიშვნელობებად რჩება.
 */
const SUPABASE_URL = "https://PASTE-YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "PASTE-YOUR-PUBLISHABLE-KEY";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? SUPABASE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
