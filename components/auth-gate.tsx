import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  title?: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

/**
 * ავტორიზაციის ბარიერი — ჩანს მაშინ, როცა მომხმარებელი არ არის შესული.
 * ღილაკზე (ან ბარათზე) დაჭერით გადადის პროფილის ტაბზე, სადაც შესვლის ფორმაა.
 */
export default function AuthGate({
  title = "ისტორია ჩაკეტილია",
  message = "ამ დღის ისტორიის წასაკითხად გაიარე ავტორიზაცია — უფასოა და ერთ წუთში სრულდება.",
  icon = "lock-closed-outline",
}: Props) {
  const router = useRouter();

  const goToLogin = () => router.push("/(tabs)/profile");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={goToLogin}
        style={styles.content}
      >
        <View style={styles.iconRing}>
          <Ionicons name={icon} size={46} color="#D4AF37" />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.button}>
          <LinearGradient
            colors={["#D4AF37", "#AA8E56"]}
            style={styles.buttonGradient}
          >
            <Ionicons name="log-in-outline" size={20} color="#000" />
            <Text style={styles.buttonText}>შესვლა / რეგისტრაცია</Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0D14" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 35,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  title: {
    color: "#E2D9C5",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  message: {
    color: "#9CA3AF",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 35,
  },
  button: { width: "100%", height: 58, borderRadius: 16, overflow: "hidden" },
  buttonGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
    marginLeft: 10,
  },
});
