import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://lgygwpvectxaxdiujjna.supabase.co";
const supabaseAnonKey = "sb_publishable_9CPfX18va_Mskb1mfv9vWw_X1y8YZzi";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    },
});