import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../services/supabase";

export default function ProfileDetails() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    setUser(data.user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", data.user.id)
      .single();

    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  };

  const updateName = async () => {
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);

    Alert.alert("წარმატება", "სახელი განახლდა");
  };

  const updatePassword = async () => {
    if (!newPassword) return;

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      Alert.alert("შეცდომა", error.message);
    } else {
      Alert.alert("წარმატება", "პაროლი შეიცვალა");
      setNewPassword("");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* 🔥 Custom Header */}
        <View style={styles.customHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="arrow-back" size={24} color="#D4AF37" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>ჩემი პროფილი</Text>

          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Text style={styles.label}>ელ.ფოსტა</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <Text style={styles.label}>სახელი</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />

          <TouchableOpacity style={styles.button} onPress={updateName}>
            <Text style={styles.buttonText}>სახელის შენახვა</Text>
          </TouchableOpacity>

          <Text style={styles.label}>ახალი პაროლი</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <TouchableOpacity style={styles.button} onPress={updatePassword}>
            <Text style={styles.buttonText}>პაროლის შეცვლა</Text>
          </TouchableOpacity>
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0D14",
  },

  container: {
    flex: 1,
    paddingHorizontal: 25,
  },

  /* 🔥 Header */
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },

  backButton: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#D4AF37",
  },

  label: {
    color: "#9CA3AF",
    marginBottom: 6,
    marginTop: 20,
  },

  email: {
    color: "#FFF",
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 14,
    color: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  button: {
    backgroundColor: "#D4AF37",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },

  buttonText: {
    color: "#000",
    fontWeight: "700",
  },
});