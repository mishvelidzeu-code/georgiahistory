import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

/**
 * Supabase პროექტი: „ყოველდღიური ისოტრია" (ref: cnfpgzhdqjntvakisgvn).
 * ძველი პროექტი (lgygwpvectxaxdiujjna) წაშლილია.
 *
 * ეს ორი მნიშვნელობა საჯაროა (აპლიკაციის ბილდშივე ხვდება) — დაცვას RLS უზრუნველყოფს.
 * Dashboard → Project Settings → API.
 *
 * სურვილის შემთხვევაში იგივე მნიშვნელობები `.env`-შიც შეიძლება ეწეროს
 * (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).
 */
const SUPABASE_URL = "https://cnfpgzhdqjntvakisgvn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_kx5ko14X36sCQzn1KZsSeg_bYW03c3N";

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
