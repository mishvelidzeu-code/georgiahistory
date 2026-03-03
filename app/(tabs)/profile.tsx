import { usePremium } from "@/context/PremiumContext";
import { useFocusEffect } from "@react-navigation/native";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen() {
  const { isPremium, refreshPremium } = usePremium();
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // ახალი state-ები ლოგინისა და რეგისტრაციისთვის
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
  };

  useFocusEffect(
    useCallback(() => {
      checkUser();
    }, [])
  );

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    refreshPremium();
  };

  // ✅ Email / Password ავტორიზაცია და რეგისტრაცია
  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert("შეცდომა", "გთხოვთ, შეავსოთ ყველა ველი");
      return;
    }

    setLoading(true);
    try {
      if (isLoginMode) {
        // ავტორიზაცია
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // რეგისტრაცია
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        Alert.alert(
          "წარმატება 🎉",
          "ანგარიში შეიქმნა! გთხოვთ შეამოწმოთ თქვენი ელ.ფოსტა ვერიფიკაციისთვის (თუ ჩართული გაქვთ)."
        );
      }
      // წარმატების შემდეგ ვაახლებთ მომხმარებლის სტატუსს
      await checkUser();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      Alert.alert("შეცდომა", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google Login ინტეგრირებული პროფილში
  const handleGoogleLogin = async () => {
    try {
      const redirectTo = AuthSession.makeRedirectUri({
        path: "callback",
      });

      console.log("დამაბრუნებელი ლინკი არის:", redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) return;

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const paramsString = url.hash ? url.hash.substring(1) : url.search.substring(1);
        const params = new URLSearchParams(paramsString);
        
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          await checkUser();
          refreshPremium();
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      Alert.alert("შეცდომა", errorMessage);
    }
  };

  const activatePremium = async () => {
    if (!user) {
      Alert.alert("ჯერ უნდა შეხვიდე სისტემაში");
      return;
    }

    await supabase
      .from("profiles")
      .update({ is_premium: true })
      .eq("id", user.id);

    refreshPremium();
    Alert.alert("PRIME გააქტიურდა 🎉");
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>პროფილი</Text>

        {user ? (
          /* =========================================
             ავტორიზებული მომხმარებლის ინტერფეისი
             ========================================= */
          <>
            <View style={styles.avatarWrapper}>
              <View style={[
                styles.avatarGlow,
                isPremium && styles.premiumGlow
              ]}>
                <View style={styles.avatar} />
              </View>
            </View>

            <Text style={styles.email}>
              {user.email}
            </Text>

            <View style={[
              styles.statusBadge,
              isPremium && styles.statusPremium
            ]}>
              <Text style={[
                styles.statusText,
                isPremium && styles.statusTextPremium
              ]}>
                {isPremium ? "⭐ PRIME წევრი" : "Free წევრი"}
              </Text>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>ჩემი პროფილი</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>პარამეტრები</Text>
            </TouchableOpacity>

            {!isPremium && (
              <TouchableOpacity
                style={styles.premiumButton}
                onPress={activatePremium}
              >
                <Text style={styles.premiumButtonText}>გახდი PRIME</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.logout} onPress={logout}>
              <Text style={styles.logoutText}>გამოსვლა</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* =========================================
             არაავტორიზებული მომხმარებლის (ლოგინ) ინტერფეისი
             ========================================= */
          <>
            <Text style={styles.authTitle}>
              {isLoginMode ? "ავტორიზაცია" : "რეგისტრაცია"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="ელ.ფოსტა"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="პაროლი"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity 
              style={styles.primaryAuthButton} 
              onPress={handleEmailAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.primaryAuthText}>
                  {isLoginMode ? "შესვლა" : "რეგისტრაცია"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)}>
              <Text style={styles.toggleText}>
                {isLoginMode 
                  ? "არ გაქვთ ანგარიში? დარეგისტრირდით" 
                  : "უკვე გაქვთ ანგარიში? შედით"}
              </Text>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>ან</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleGoogleLogin} 
            >
              <Text style={styles.loginText}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0D14",
    justifyContent: "center",
    padding: 25,
  },
  card: {
    borderRadius: 28,
    padding: 30,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 25,
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarGlow: {
    padding: 6,
    borderRadius: 60,
  },
  premiumGlow: {
    shadowColor: "#D4AF37",
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#0F172A",
    borderWidth: 3,
    borderColor: "#D4AF37",
  },
  email: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  statusBadge: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  statusPremium: {
    backgroundColor: "#D4AF37",
  },
  statusText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  statusTextPremium: {
    color: "#000",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 25,
  },
  menuItem: {
    paddingVertical: 14,
  },
  menuText: {
    color: "#E5E7EB",
    fontSize: 16,
  },
  premiumButton: {
    marginTop: 15,
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  premiumButtonText: {
    color: "#000",
    fontWeight: "800",
  },
  logout: {
    marginTop: 15,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  logoutText: {
    color: "#E5E7EB",
    fontWeight: "700",
  },
  
  /* ახალი სტილები ლოგინ/რეგისტრაციისთვის */
  authTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 15,
    color: "#FFF",
    marginBottom: 15,
    fontSize: 16,
  },
  primaryAuthButton: {
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 5,
  },
  primaryAuthText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 16,
  },
  toggleText: {
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 18,
    fontSize: 14,
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  orText: {
    color: "#9CA3AF",
    paddingHorizontal: 15,
    fontSize: 14,
  },
  loginButton: {
    padding: 15,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  loginText: {
    color: "#000",
    fontWeight: "800",
  },
});