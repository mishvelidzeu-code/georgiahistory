import { Ionicons } from "@expo/vector-icons"; // ექსპოზე მოყვება ავტომატურად
import { LinearGradient } from "expo-linear-gradient"; // npx expo install expo-linear-gradient
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../services/supabase";

const IMAGE_MAP: any = {
  "7.webp": require("../../assets/gallery/7.webp"),
};

export default function ExploreScreen() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dailySurname, setDailySurname] = useState<any>(null);

  // --- ლოგიკა (უცვლელი) ---
  const searchSurname = async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase
        .from("surnames")
        .select("*")
        .eq("surname", query.trim())
        .limit(1);
      if (!error && data && data.length > 0) {
        setResult(data[0]);
      } else {
        setResult(null);
      }
    } catch (e) {
      console.log("Search error:", e);
      setResult(null);
    }
    setSearched(true);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setQuery("");
    setResult(null);
    setSearched(false);
    await fetchDailySurname();
    setRefreshing(false);
  };

  const getPreviewText = (text: string) => {
    const words = text.split(" ");
    return words.slice(0, 15).join(" ") + "...";
  };

  const getDailyText = (text: string) => {
    const words = text.split(" ");
    if (words.length <= 20) return words.slice(0, 20).join(" ");
    return words.slice(0, 40).join(" ") + "...";
  };

  const fetchDailySurname = async () => {
    try {
      const today = new Date();
      const day = today.getDate();
      const { data, error } = await supabase
        .from("surnames")
        .select("*")
        .order("id")
        .limit(1)
        .range(day - 1, day - 1);
      if (!error && data && data.length > 0) {
        setDailySurname(data[0]);
      }
    } catch (e) {
      console.log("Daily surname error:", e);
    }
  };

  const shareSurname = async () => {
    if (!dailySurname) return;
    const message = `${dailySurname.surname}\n\n${getDailyText(dailySurname.full_history)}\n\nიხილე მეტი აპში`;
    try {
      await Share.share({ message });
    } catch (e) {
      console.log("Share error:", e);
    }
  };

  useEffect(() => {
    fetchDailySurname();
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          !result && !searched && styles.centered,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />
        }
      >
        <View style={styles.headerSection}>
          <Ionicons name="library-outline" size={32} color="#D4AF37" style={{ alignSelf: "center" }} />
          <Text style={styles.title}>გვარების მატიანე</Text>
          <Text style={styles.subtitle}>
            აღმოაჩინე შენი წინაპრების ნაკვალევი და საგვარეულო ისტორია
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <TextInput
            placeholder="მაგ: ბერიძე..."
            placeholderTextColor="#6B7280"
            value={query}
            onChangeText={setQuery}
            style={styles.input}
            returnKeyType="search"
            onSubmitEditing={searchSurname}
          />
          <TouchableOpacity style={styles.searchIconButton} onPress={searchSurname}>
            <Ionicons name="search" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {loading && (
          <ActivityIndicator size="large" color="#D4AF37" style={{ marginTop: 30 }} />
        )}

        {/* Search Result Card */}
        {searched && !loading && result && (
          <View style={styles.resultCard}>
            <LinearGradient
              colors={["rgba(212,175,55,0.15)", "transparent"]}
              style={styles.cardGradient}
            />
            {result.image && IMAGE_MAP[result.image] && (
              <Image source={IMAGE_MAP[result.image]} style={styles.resultImage} />
            )}
            <Text style={styles.resultSurname}>{result.surname}</Text>
            <Text style={styles.resultHistory}>{getPreviewText(result.full_history)}</Text>
            
            <TouchableOpacity 
              style={styles.goldButton} 
              onPress={() => Linking.openURL("https://www.giftgrb.ge/#registry")}
            >
              <Text style={styles.goldButtonText}>საგვარეულო კოდი</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Not Found Box */}
        {searched && !loading && !result && (
          <View style={styles.notFoundBox}>
            <Ionicons name="alert-circle-outline" size={40} color="#D4AF37" />
            <Text style={styles.notFoundText}>გვარი ბაზაში ჯერ არ მოიძებნა</Text>
            <TouchableOpacity 
              style={styles.outlineButton} 
              onPress={() => Linking.openURL("https://www.giftgrb.ge/gvari.html")}
            >
              <Text style={styles.outlineButtonText}>მოითხოვე მოკვლევა</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Daily Surname Card */}
        {!loading && dailySurname && !result && (
          <View style={styles.dailyWrapper}>
            <View style={styles.dailyHeader}>
              <View style={styles.line} />
              <Text style={styles.dailyBadge}>⭐ დღის გვარი</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.dailyCard}>
              <Text style={styles.dailySurnameText}>{dailySurname.surname}</Text>
              <Text style={styles.dailyHistoryText}>{getDailyText(dailySurname.full_history)}</Text>
              
              <TouchableOpacity style={styles.shareButton} onPress={shareSurname}>
                <Ionicons name="share-social" size={18} color="#000" style={{ marginRight: 8 }} />
                <Text style={styles.shareText}>გაუზიარე გვარისშვილებს</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0D14" },
  content: { padding: 25, flexGrow: 1, paddingBottom: 50 },
  centered: { justifyContent: "center" },
  
  headerSection: { marginBottom: 30, marginTop: 20 },
  title: {
    fontSize: 28,
    color: "#E2D9C5",
    fontWeight: "900",
    textAlign: "center",
    marginTop: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 10,
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.2)",
    paddingLeft: 15,
    height: 60,
  },
  input: {
    flex: 1,
    color: "#F3F4F6",
    fontSize: 16,
    fontWeight: "500",
  },
  searchIconButton: {
    backgroundColor: "#D4AF37",
    height: "100%",
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
  },

  resultCard: {
    marginTop: 30,
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.1)",
    overflow: "hidden",
  },
  cardGradient: { ...StyleSheet.absoluteFillObject },
  resultImage: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: "#0A0D14",
  },
  resultSurname: {
    fontSize: 26,
    fontWeight: "900",
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 2,
  },
  resultHistory: {
    fontSize: 15,
    color: "#D1D5DB",
    lineHeight: 24,
    textAlign: "center",
    fontStyle: "italic",
  },

  goldButton: {
    backgroundColor: "#D4AF37",
    marginTop: 25,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#D4AF37",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  goldButtonText: { color: "#000", fontWeight: "800", fontSize: 14, textTransform: "uppercase" },

  notFoundBox: { marginTop: 40, alignItems: "center", backgroundColor: "rgba(17,24,39,0.5)", padding: 30, borderRadius: 20 },
  notFoundText: { color: "#E5E7EB", fontSize: 16, marginTop: 10, marginBottom: 20, fontWeight: "600" },
  outlineButton: { borderWidth: 1, borderColor: "#D4AF37", paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
  outlineButtonText: { color: "#D4AF37", fontWeight: "700" },

  dailyWrapper: { marginTop: 50 },
  dailyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 15 },
  line: { flex: 1, height: 1, backgroundColor: "rgba(212,175,55,0.2)" },
  dailyBadge: { color: "#D4AF37", fontWeight: "800", marginHorizontal: 15, fontSize: 13, textTransform: "uppercase" },
  dailyCard: { backgroundColor: "#111827", padding: 25, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  dailySurnameText: { fontSize: 22, fontWeight: "900", color: "#E2D9C5", textAlign: "center", marginBottom: 10 },
  dailyHistoryText: { color: "#9CA3AF", textAlign: "center", lineHeight: 22, fontSize: 14 },
  shareButton: {
    flexDirection: "row",
    backgroundColor: "#D4AF37",
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  shareText: { color: "#000", fontWeight: "800", fontSize: 13 },
});