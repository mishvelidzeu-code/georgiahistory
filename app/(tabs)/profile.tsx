import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as AppleAuthentication from 'expo-apple-authentication'; // დამატებული
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useNavigation, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from "../../services/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(async () => {
        if (session?.user) {
          await checkUser(session.user);

          // ახლახან შევიდა — პროფილზე აღარ ვაჩერებთ, ისტორიას ვუხსნით.
          // INITIAL_SESSION (აპის გაშვებისას აღდგენილი სესია) აქ არ ხვდება.
          //
          // ტაბს პირდაპირ ნავიგაციით ვცვლით: router.replace("/(tabs)") ვერაფერს
          // აკეთებს, როცა აპი უკვე ამავე ჯგუფშია.
          if (event === "SIGNED_IN") {
            try {
              navigation.navigate("index");
            } catch {
              router.replace("/(tabs)");
            }
          }
        } else {
          setUser(null);
          setAvatarUrl(null);
          setIsAdmin(false);
        }
      }, 100);
    });
    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async (currentUser: any) => {
    if (!currentUser) return;
    setUser(currentUser);
    const { data: profile } = await supabase.from("profiles").select("avatar_url, role").eq("id", currentUser.id).single();
    setIsAdmin(profile?.role === "admin");
    if (profile?.avatar_url) {
      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(profile.avatar_url);
      setAvatarUrl(publicData.publicUrl + `?t=${Date.now()}`);
    }
  };

  const uploadAvatar = async () => {
    if (!user) return;
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) { Alert.alert("საჭიროა წვდომა გალერიაზე"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });
    if (result.canceled) return;
    const image = result.assets[0];
    if (!image.base64) return;

    const filePath = `${user.id}.jpg`;
    const { error } = await supabase.storage.from("avatars").upload(filePath, decode(image.base64), {
      contentType: "image/jpeg",
      upsert: true,
    });

    if (!error) {
      await supabase.from("profiles").update({ avatar_url: filePath }).eq("id", user.id);
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl + `?t=${Date.now()}`);
    }
  };

  const logout = async () => { setUser(null); setAvatarUrl(null); supabase.auth.signOut(); };

  const deleteAccount = async () => {
    Alert.alert(
      "ანგარიშის წაშლა",
      "ანგარიში და ყველა მონაცემი სამუდამოდ წაიშლება. ამის გაუქმება შეუძლებელია.",
      [
        { text: "გაუქმება", style: "cancel" },
        {
          text: "წაშლა",
          style: "destructive",
          onPress: async () => {
            try {
              // ანგარიშს სრულად (auth.users-იდანაც) edge function შლის.
              const { error } = await supabase.functions.invoke("delete-account");
              if (error) throw error;

              await supabase.auth.signOut();
              Alert.alert("ანგარიში წაიშალა");
            } catch (e) {
              console.log("Delete account error:", e);
              Alert.alert("შეცდომა", "ანგარიშის წაშლა ვერ მოხერხდა. სცადეთ მოგვიანებით.");
            }
          },
        },
      ]
    );
  };

  const handleEmailAuth = async () => {
    if (!email || !password) return Alert.alert("შეცდომა", "შეავსეთ ველები");
    setLoading(true);
    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // პროფილს `handle_new_user` ტრიგერი ქმნის — full_name მეტამონაცემებში გადადის.
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;

        // თუ ბაზაში ელფოსტის დადასტურება ჩართულია, სესია ჯერ არ არსებობს.
        if (data.session) {
          Alert.alert("წარმატება", "ანგარიში შეიქმნა!");
        } else {
          Alert.alert(
            "დაადასტურე ელფოსტა",
            "გამოგზავნილია დადასტურების ბმული. გახსენი ის და შემდეგ შედი აპლიკაციაში."
          );
        }
      }
    } catch { Alert.alert("შეცდომა", "ავტორიზაცია ვერ მოხერხდა"); }
    finally { setLoading(false); }
  };

  // --- Apple Sign In ლოგიკა ---
  const signInWithApple = async () => {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        if (error) throw error;
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert("შეცდომა", "Apple-ით ავტორიზაცია ვერ მოხერხდა");
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const redirectUrl = Linking.createURL("login-callback");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No OAuth url");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      // მომხმარებელმა თვითონ დახურა — შეცდომა არ არის
      if (result.type === "cancel" || result.type === "dismiss") return;

      if (result.type !== "success" || !result.url) {
        throw new Error("ბრაუზერი აპში არ დაბრუნდა");
      }

      // პასუხი შეიძლება მოვიდეს ან #-ის შემდეგ (implicit), ან ?-ის შემდეგ (PKCE)
      const params: Record<string, string> = {};
      for (const part of [
        result.url.split("#")[1],
        result.url.split("?")[1]?.split("#")[0],
      ]) {
        if (!part) continue;
        for (const pair of part.split("&")) {
          const [key, value] = pair.split("=");
          if (key) params[key] = decodeURIComponent((value ?? "").replace(/\+/g, " "));
        }
      }

      if (params.error || params.error_description) {
        throw new Error(params.error_description || params.error);
      }

      if (params.access_token && params.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (sessionError) throw sessionError;
      } else if (params.code) {
        const { error: codeError } = await supabase.auth.exchangeCodeForSession(
          params.code
        );
        if (codeError) throw codeError;
      } else {
        throw new Error(
          "ავტორიზაციის პასუხში ტოკენი არ იყო. შეამოწმე Supabase-ში Redirect URL."
        );
      }
    } catch (e: any) {
      console.log("Google sign in error:", e);
      Alert.alert(
        "Google-ით შესვლა ვერ მოხერხდა",
        e?.message ? String(e.message) : "უცნობი შეცდომა"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>პროფილი</Text>
      </View>

      <View style={styles.card}>
        {user ? (
          <View style={styles.profileInfo}>
            <TouchableOpacity style={styles.avatarContainer} onPress={uploadAvatar}>
              <View style={styles.avatarRing}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={50} color="rgba(212,175,55,0.3)" />
                  </View>
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={16} color="#000" />
                </View>
              </View>
              <Text style={styles.userName}>{fullName || user.email?.split('@')[0]}</Text>
              <View style={styles.statusBadge}>
                <Ionicons name="person-outline" size={14} color="#D4AF37" />
                <Text style={styles.statusText}>მომხმარებელი</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.menu}>
              {isAdmin && (
                <MenuButton
                  icon="shield-checkmark-outline"
                  label="ადმინ პანელი"
                  onPress={() => router.push("/admin" as any)}
                />
              )}
              <MenuButton icon="person-outline" label="პირადი მონაცემები" onPress={() => router.push("/profile-details")} />
              <MenuButton icon="settings-outline" label="პარამეტრები" onPress={() => router.push("/settings")} />

              <MenuButton icon="document-text-outline" label="Privacy Policy" onPress={() => Linking.openURL("https://sites.google.com/view/georgiahistory-privacy")} />
              
              <View style={styles.footerActions}>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                  <Ionicons name="log-out-outline" size={20} color="#E5E7EB" />
                  <Text style={styles.logoutText}>გამოსვლა</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn} onPress={deleteAccount}>
                  <Text style={styles.deleteText}>ანგარიშის წაშლა</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.authContainer}>
            <Text style={styles.authHeader}>{isLoginMode ? "მოგესალმებით" : "შემოგვიერთდით"}</Text>
            <Text style={styles.authSub}>{isLoginMode ? "გააგრძელეთ თქვენი ისტორიული მოგზაურობა" : "შექმენით პირადი მატიანე"}</Text>

            <View style={styles.form}>
              {!isLoginMode && (
                <View style={styles.inputBox}>
                  <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="სახელი და გვარი" placeholderTextColor="#6B7280" value={fullName} onChangeText={setFullName} />
                </View>
              )}
              
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="ელ.ფოსტა" placeholderTextColor="#6B7280" value={email} onChangeText={setEmail} autoCapitalize="none" />
              </View>

              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="პაროლი" placeholderTextColor="#6B7280" value={password} onChangeText={setPassword} secureTextEntry />
              </View>

              <TouchableOpacity style={styles.authMainBtn} onPress={handleEmailAuth} disabled={loading}>
                {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.authMainText}>{isLoginMode ? "შესვლა" : "რეგისტრაცია"}</Text>}
              </TouchableOpacity>

              <View style={styles.orRow}>
                <View style={styles.line} />
                <Text style={styles.orText}>ან</Text>
                <View style={styles.line} />
              </View>

              {/* Apple-ით შესვლა მხოლოდ iOS-ზე (App Store-ის მოთხოვნა) */}
              {Platform.OS === "ios" && (
                <TouchableOpacity style={styles.appleBtn} onPress={signInWithApple} disabled={loading}>
                  <Ionicons name="logo-apple" size={20} color="#FFF" />
                  <Text style={styles.appleBtnText}>Apple-ით შესვლა</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.googleBtn} onPress={signInWithGoogle} disabled={loading}>
                <Ionicons name="logo-google" size={20} color="#DB4437" style={styles.googleIcon} />
                <Text style={styles.googleBtnText}>Google-ით შესვლა</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)} style={styles.toggleBtn}>
                <Text style={styles.toggleText}>
                  {isLoginMode ? "არ გაქვთ ანგარიში? " : "უკვე გაქვთ ანგარიში? "}
                  <Text style={styles.toggleLink}>{isLoginMode ? "დარეგისტრირდით" : "შედით"}</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const MenuButton = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuLeft}>
      <Ionicons name={icon} size={22} color="#D4AF37" />
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#4B5563" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0D14" },
  scrollContent: { padding: 25, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: "900", color: "#D4AF37", textAlign: "center", letterSpacing: 1 },
  card: { backgroundColor: "#111827", borderRadius: 32, padding: 25, borderWidth: 1, borderColor: "rgba(212,175,55,0.15)" },
  
  profileInfo: { alignItems: "center" },
  avatarContainer: { alignItems: "center", marginBottom: 20 },
  avatarRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: "#D4AF37", padding: 5, justifyContent: "center", alignItems: "center" },
  avatar: { width: 104, height: 104, borderRadius: 52 },
  avatarPlaceholder: { backgroundColor: "#0F172A", justifyContent: "center", alignItems: "center" },
  editBadge: { position: "absolute", bottom: 5, right: 5, backgroundColor: "#D4AF37", width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#111827" },
  userName: { color: "#FFF", fontSize: 20, fontWeight: "800", marginTop: 15 },
  statusBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(212,175,55,0.1)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  statusText: { color: "#D4AF37", fontSize: 11, fontWeight: "700", marginLeft: 5, textTransform: "uppercase" },
  divider: { width: "100%", height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginVertical: 20 },
  menu: { width: "100%" },
  menuItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15 },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  menuLabel: { color: "#E5E7EB", fontSize: 16, marginLeft: 15, fontWeight: "500" },
  footerActions: { marginTop: 30, alignItems: "center" },
  logoutBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, width: "100%", justifyContent: "center" },
  logoutText: { color: "#E5E7EB", fontWeight: "700", marginLeft: 10 },
  deleteBtn: { marginTop: 20 },
  deleteText: { color: "rgba(239, 68, 68, 0.6)", fontSize: 13, fontWeight: "600" },

  authContainer: { alignItems: "center" },
  authHeader: { color: "#FFF", fontSize: 24, fontWeight: "900", marginBottom: 8 },
  authSub: { color: "#9CA3AF", fontSize: 14, textAlign: "center", marginBottom: 30 },
  form: { width: "100%" },
  inputBox: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, marginBottom: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 55, color: "#FFF", fontSize: 15 },
  authMainBtn: { backgroundColor: "#D4AF37", height: 55, borderRadius: 14, justifyContent: "center", alignItems: "center", marginTop: 10 },
  authMainText: { color: "#000", fontWeight: "900", fontSize: 16 },
  orRow: { flexDirection: "row", alignItems: "center", marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.05)" },
  orText: { color: "#4B5563", marginHorizontal: 15, fontSize: 13 },
  
  // Apple Button Style
  appleBtn: { flexDirection: "row", backgroundColor: "#000", height: 55, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  appleBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15, marginLeft: 10 },

  googleBtn: { flexDirection: "row", backgroundColor: "#FFF", height: 55, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  googleIcon: { marginRight: 12 },
  googleBtnText: { color: "#000", fontWeight: "700", fontSize: 15 },
  toggleBtn: { marginTop: 25, alignItems: "center" },
  toggleText: { color: "#9CA3AF", fontSize: 14 },
  toggleLink: { color: "#D4AF37", fontWeight: "700" }
});