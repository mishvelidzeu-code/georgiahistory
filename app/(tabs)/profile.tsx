import { usePremium } from "@/context/PremiumContext";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabase";

export default function ProfileScreen() {
  const { isPremium, refreshPremium } = usePremium();
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

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

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <View style={[
            styles.avatarGlow,
            isPremium && styles.premiumGlow
          ]}>
            <View style={styles.avatar} />
          </View>
        </View>

        {/* Email */}
        <Text style={styles.email}>
          {user ? user.email : "სტუმარი"}
        </Text>

        {/* Status Badge */}
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

        {user ? (
          <>
            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>ჩემი პროფილი</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>შეტყობინებები</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Text style={styles.menuText}>პარამეტრები</Text>
            </TouchableOpacity>

            {!isPremium && (
              <TouchableOpacity
                style={styles.premiumButton}
                onPress={activatePremium}
              >
                <Text style={styles.premiumButtonText}>
                  გახდი PRIME
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.logout} onPress={logout}>
              <Text style={styles.logoutText}>გამოსვლა</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/auth")}
          >
            <Text style={styles.loginText}>
              შესვლა / რეგისტრაცია
            </Text>
          </TouchableOpacity>
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

  loginButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 14,
    backgroundColor: "#D4AF37",
    alignItems: "center",
  },

  loginText: {
    color: "#000",
    fontWeight: "800",
  },
});