import { usePremium } from "@/context/PremiumContext";
import { useFocusEffect } from "@react-navigation/native";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", data.user.id)
        .single();

      if (profile?.avatar_url) {
        const { data: publicData } = supabase.storage
          .from("avatars")
          .getPublicUrl(profile.avatar_url);

        setAvatarUrl(publicData.publicUrl + `?t=${Date.now()}`);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkUser();
    }, [])
  );

  // 🔥 გასწორებული uploadAvatar (სხვას არაფერს შევხებივარ)
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
      .upload(
        filePath,
        decode(image.base64), // ✅ აქ არის სწორი გზა
        {
          contentType: "image/jpeg",
          upsert: true,
        }
      );

    if (error) {
      Alert.alert("Upload error", error.message);
      return;
    }

    await supabase
      .from("profiles")
      .update({ avatar_url: filePath })
      .eq("id", user.id);

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    setAvatarUrl(data.publicUrl + `?t=${Date.now()}`);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    refreshPremium();
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

      await checkUser();
      refreshPremium();
    } catch (err) {
      Alert.alert("შეცდომა", "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const activatePremium = async () => {
    if (!user) return;

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

            <TouchableOpacity style={styles.logout} onPress={logout}>
              <Text style={styles.logoutText}>გამოსვლა</Text>
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
  toggleText: {
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 18,
  },
});