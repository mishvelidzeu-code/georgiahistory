import { usePremium } from "@/context/PremiumContext";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { supabase } from "../../services/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen() {
  const { isPremium, refreshPremium } = usePremium();
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setTimeout(async () => {
          if (session?.user) {
            await checkUser(session.user);
          } else {
            setUser(null);
            setAvatarUrl(null);
          }
        }, 100);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async (currentUser: any) => {
    if (!currentUser) return;

    setUser(currentUser);

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", currentUser.id)
      .single();

    if (profile?.avatar_url) {
      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(profile.avatar_url);

      setAvatarUrl(publicData.publicUrl + `?t=${Date.now()}`);
    }
  };

  const uploadAvatar = async () => {
    if (!user) return;

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("საჭიროა წვდომა გალერიაზე");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled) return;

    const image = result.assets[0];

    if (!image.base64) {
      Alert.alert("Upload error", "Base64 ვერ მივიღეთ");
      return;
    }

    const filePath = `${user.id}.jpg`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, decode(image.base64), {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      Alert.alert("Upload error", error.message);
      return;
    }

    await supabase
      .from("profiles")
      .update({ avatar_url: filePath })
      .eq("id", user.id);

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    setAvatarUrl(data.publicUrl + `?t=${Date.now()}`);
  };

  const logout = async () => {
    setUser(null);
    setAvatarUrl(null);
    supabase.auth.signOut(); 
  };

  const deleteAccount = async () => {
    if (!user) return;

    Alert.alert(
      "ანგარიშის წაშლა",
      "ნამდვილად გსურთ ანგარიშის სრულად წაშლა?",
      [
        { text: "გაუქმება", style: "cancel" },
        {
          text: "წაშლა",
          style: "destructive",
          onPress: async () => {
            await supabase.from("profiles").delete().eq("id", user.id);
            await supabase.auth.signOut();
            setUser(null);
            setAvatarUrl(null);
          },
        },
      ]
    );
  };

  const openPrivacy = () => {
    Linking.openURL(
      "https://sites.google.com/view/georgiahistory-privacy"
    );
  };

  const signInWithGoogle = async () => {
    const redirectUrl = "georgiahistoryapp://login-callback";

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      Alert.alert("Google Login Error", error.message);
      return;
    }

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );

      if (result.type === "success") {
        const url = result.url;

        const queryString = url.includes("#") ? url.split("#")[1] : url.split("?")[1];
        if (!queryString) return;

        const params = queryString.split("&").reduce((acc: any, current) => {
          const [key, value] = current.split("=");
          acc[key] = value;
          return acc;
        }, {});

        if (params.access_token && params.refresh_token) {
          supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
        }
      }
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert("შეცდომა", "გთხოვთ, შეავსოთ ყველა ველი");
      return;
    }

    if (!isLoginMode && !fullName) {
      Alert.alert("შეცდომა", "გთხოვთ მიუთითოთ სახელი");
      return;
    }

    setLoading(true);

    try {
      if (isLoginMode) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          await supabase.from("profiles").insert({
            id: data.user.id,
            full_name: fullName,
            is_premium: false,
          });
        }

        Alert.alert("წარმატება 🎉", "ანგარიში შეიქმნა!");
      }
    } catch {
      Alert.alert("შეცდომა", "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>პროფილი</Text>

        {user ? (
          <>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={uploadAvatar}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar} />
              )}
              <Text style={styles.changePhoto}>ფოტოს შეცვლა</Text>
            </TouchableOpacity>

            <Text style={styles.email}>{user.email}</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/profile-details")}
            >
              <Text style={styles.menuText}>ჩემი პროფილი</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/settings")}
            >
              <Text style={styles.menuText}>პარამეტრები</Text>
            </TouchableOpacity>

            {!isPremium && (
              <TouchableOpacity
                style={styles.premiumButton}
                onPress={() => router.push("/subscription")}
              >
                <Text style={styles.premiumButtonText}>გახდი PRIME</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.menuItem} onPress={openPrivacy}>
              <Text style={styles.menuText}>Privacy Policy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logout} onPress={logout}>
              <Text style={styles.logoutText}>გამოსვლა</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.delete} onPress={deleteAccount}>
              <Text style={styles.deleteText}>ანგარიშის წაშლა</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.authTitle}>
              {isLoginMode ? "ავტორიზაცია" : "რეგისტრაცია"}
            </Text>

            {!isLoginMode && (
              <TextInput
                style={styles.input}
                placeholder="სახელი და გვარი"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="ელ.ფოსტა"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
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

            <View style={styles.divider}>
              <Text style={styles.dividerText}>ან</Text>
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={signInWithGoogle}
            >
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)}>
              <Text style={styles.toggleText}>
                {isLoginMode
                  ? "არ გაქვთ ანგარიში? დარეგისტრირდით"
                  : "უკვე გაქვთ ანგარიში? შედით"}
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
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#0F172A",
    borderWidth: 3,
    borderColor: "#D4AF37",
  },
  changePhoto: {
    color: "#9CA3AF",
    marginTop: 8,
  },
  email: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
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
  delete: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,0,0,0.15)",
    alignItems: "center",
  },
  deleteText: {
    color: "#FF6B6B",
    fontWeight: "700",
  },
  authTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 15,
    color: "#FFF",
    marginBottom: 15,
  },
  primaryAuthButton: {
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryAuthText: {
    color: "#000",
    fontWeight: "800",
  },
  divider: {
    alignItems: "center",
    marginVertical: 12,
  },
  dividerText: {
    color: "#9CA3AF",
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  googleText: {
    color: "#000",
    fontWeight: "700",
  },
  toggleText: {
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 18,
  },
});