import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../../services/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const signUp = async () => {
    if (!email || !password) {
      Alert.alert("შეცდომა", "შეავსე ყველა ველი");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert("შეცდომა", error.message);
      return;
    }

    Alert.alert("წარმატება 🎉", "ანგარიში შექმნილია, ახლა შეგიძლია შეხვიდე");
  };

  const signIn = async () => {
    if (!email || !password) {
      Alert.alert("შეცდომა", "შეავსე ყველა ველი");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("შეცდომა", error.message);
      return;
    }

    // ✅ დახურე modal
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>შესვლა / რეგისტრაცია</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={signIn}>
          <Text style={styles.buttonText}>შესვლა</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#555" }]}
          onPress={signUp}
        >
          <Text style={styles.buttonText}>რეგისტრაცია</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0D14",
    justifyContent: "center",
    padding: 30,
  },
  title: {
    fontSize: 24,
    color: "#D4AF37",
    fontWeight: "800",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    color: "#fff",
  },
  button: {
    backgroundColor: "#D4AF37",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#000",
    fontWeight: "700",
  },
});