import { usePremium } from "@/context/PremiumContext";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
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

  const { isPremium } = usePremium();

  const searchSurname = async () => {
    if (!query.trim()) return;

    Keyboard.dismiss();

    setLoading(true);
    setResult(null);

    const { data, error } = await supabase
      .from("surnames")
      .select("*")
      .ilike("surname", query.trim());

    if (!error && data && data.length > 0) {
      setResult(data[0]);
    } else {
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
    setRefreshing(false);
  };

  const getPreviewText = (text: string) => {
    const words = text.split(" ");
    return words.slice(0, 15).join(" ") + "...";
  };

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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4AF37"
          />
        }
      >
        <Text style={styles.title}>მოიძიე შენი გვარის ისტორია</Text>
        
        <Text style={styles.subtitle}>
  შენი გვარი მხოლოდ სიტყვა არ არის — ეს არის შენი ფესვები,
  წარმოშობა და იდენტობა. გაიგე ვინ იყვნენ შენი წინაპრები
  და რა მემკვიდრეობა მოგყვება უკან.
</Text>

        <TextInput
          placeholder="შეიყვანე გვარი..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={searchSurname}
        />

        <TouchableOpacity style={styles.button} onPress={searchSurname}>
          <Text style={styles.buttonText}>ძებნა</Text>
        </TouchableOpacity>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#D4AF37"
            style={{ marginTop: 30 }}
          />
        )}

        {searched && !loading && result && (
          <View style={styles.card}>
            {result.image && IMAGE_MAP[result.image] && (
              <Image source={IMAGE_MAP[result.image]} style={styles.image} />
            )}

            <Text style={styles.surname}>{result.surname}</Text>

            {!isPremium ? (
              <>
                <Text style={styles.history}>
                  {getPreviewText(result.full_history)}
                </Text>

                <View style={styles.premiumCard}>
                  <Text style={styles.premiumTitle}>⭐ PRIME კონტენტი</Text>
                  <Text style={styles.premiumText}>
                    გვარის სრული ისტორიის სანახავად გახდით PRIME წევრი
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.history}>
                {result.full_history}
              </Text>
            )}
          </View>
        )}

        {searched && !loading && !result && (
          <View style={styles.notFoundBox}>
            <Text style={styles.notFoundText}>
              ასეთი გვარი ბაზაში არ მოიძებნა.
            </Text>

            <TouchableOpacity style={styles.orderButton}>
              <Text style={styles.orderText}>შეუკვეთე კვლევა</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0D14",
  },
  content: {
    padding: 25,
    flexGrow: 1,
  },
  centered: {
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    color: "#E2D9C5",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: "#F3F4F6",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
  },
  button: {
    backgroundColor: "#D4AF37",
    padding: 14,
    borderRadius: 14,
    marginTop: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
  card: {
    marginTop: 30,
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 18,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    marginBottom: 15,
    resizeMode: "contain",
  },
  surname: {
    fontSize: 22,
    fontWeight: "800",
    color: "#D4AF37",
    textAlign: "center",
    marginBottom: 15,
  },
  history: {
    fontSize: 16,
    color: "#E5E7EB",
    lineHeight: 26,
    textAlign: "justify",
  },
  premiumCard: {
    marginTop: 15,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.4)",
    alignItems: "center",
  },
  premiumTitle: {
    color: "#D4AF37",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 5,
  },
  premiumText: {
    color: "#E2D9C5",
    fontSize: 14,
    textAlign: "center",
  },
  notFoundBox: {
    marginTop: 40,
    alignItems: "center",
  },
  notFoundText: {
    color: "#E5E7EB",
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
  },
  orderButton: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  orderText: {
    color: "#000",
    fontWeight: "700",
  },
  subtitle: {
  fontSize: 15,
  color: "#9CA3AF",
  textAlign: "center",
  marginBottom: 25,
  lineHeight: 22,
},
});