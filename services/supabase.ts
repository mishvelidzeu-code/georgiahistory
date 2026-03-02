import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lgygwpvectxaxdiujjna.supabase.co";
const supabaseAnonKey = "sb_publishable_9CPfX18va_Mskb1mfv9vWw_X1y8YZzi";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);