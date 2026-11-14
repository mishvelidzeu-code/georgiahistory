import AuthGate from "@/components/auth-gate";
import { useAuth } from "@/context/AuthContext";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons"; // ექსპოზე მოყვება ავტომატურად
import { LinearGradient } from "expo-linear-gradient"; // npx expo install expo-linear-gradient
import * as Sharing from "expo-sharing";
import { useEffect, useRef, useState } from "react";
import { captureRef } from "react-native-view-shot";
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
import { getGeorgiaNow, getGeorgianDateLabel } from "../../services/date";
import { supabase } from "../../services/supabase";

const IMAGE_MAP: any = {
  "7.webp": require("../../assets/gallery/7.webp"),
};

/**
 * gvarigen.ge — სრული საგვარეულო ისტორიის, გერბისა და წიგნის ადგილი.
 * აპი მხოლოდ ნაწყვეტს აჩვენებს და აქ გადაამისამართებს.
 * დომენი 308-ით giftgrb.ge-ზე გადადის, მაგრამ აპში gvarigen.ge-ს ვიყენებთ.
 */
const SITE = "https://www.gvarigen.ge";
const UTM = "utm_source=app&utm_medium=surname_card&utm_campaign=dghis_istoria";

/** კონკრეტული გვარის გვერდი. კოდის გარეშე — გვარების სრული სია. */
const surnamePageUrl = (crestCode?: string | null) =>
  crestCode ? `${SITE}/gvari/${crestCode}?${UTM}` : `${SITE}/gvarebi?${UTM}`;

const GERBI_URL = `${SITE}/gerbi-gverdi?${UTM}`;

/**
 * გაზიარებისას აპის ბმული მიდის, და არა საიტის: გაზიარებას აპიდან აკეთებს
 * ადამიანი, რომელსაც აპი მოსწონს — მიმღების კითხვაა „სად ვიშოვო ეს?".
 * gvarigen.ge ისედაც ბარათზეა დატანილი, ანუ ბრენდი სურათთან ერთად მიდის.
 *
 * Google Play-ზე აპი ჯერ არ არის, ამიტომ ორივე პლატფორმაზე App Store-ის
 * ბმულს ვაგზავნით. Play-ზე გამოქვეყნების შემდეგ აქ Platform.select დაემატება.
 */
const APP_STORE_URL = "https://apps.apple.com/app/id6760388933";

/** მოკვლევის შეკვეთა — აკრეფილი გვარი ფორმაში გადადის. */
const orderResearchUrl = (surname: string) =>
  `${SITE}/gvari?surname=${encodeURIComponent(surname.trim())}&${UTM}`;

export default function ExploreScreen() {
  const { user, authLoading } = useAuth();
  const [fontsLoaded] = useFonts({
    GreatVibes: require("../../assets/fonts/GreatVibes-Regular.ttf"),
  });
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dailySurname, setDailySurname] = useState<any>(null);
  const [sharing, setSharing] = useState(false);

  // გასაზიარებელი ბარათი ეკრანს მიღმა იხატება და იქიდან გადაიღება
  const cardRef = useRef<View>(null);

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

  /**
   * ბაზაში ახლა `preview` ზის (ისტორიის პირველი ~42 სიტყვა).
   * `full_history` ძველი ჩანაწერების გამო რჩება fallback-ად.
   */
  const historyText = (row: any): string => row?.preview || row?.full_history || "";

  const getPreviewText = (text: string) => {
    const words = text.split(" ");
    if (words.length <= 15) return words.join(" ");
    return words.slice(0, 15).join(" ") + "...";
  };

  const getDailyText = (text: string) => {
    const words = text.split(" ");
    if (words.length <= 20) return words.slice(0, 20).join(" ");
    return words.slice(0, 40).join(" ") + "...";
  };

  /**
   * დღის გვარი: წლის დღე (საქართველოს დროით) მთელ ბაზაზე ბრუნავს.
   * ადრე `new Date().getDate()` იყო — ტელეფონის დრო, და `range(day-1, day-1)`
   * მხოლოდ პირველ 31 ჩანაწერს წვდებოდა, დანარჩენი 378 გვარი არასდროს ჩანდა.
   */
  const fetchDailySurname = async () => {
    try {
      const { count, error: countError } = await supabase
        .from("surnames")
        .select("surname", { count: "exact", head: true });
      if (countError || !count) return;

      const georgia = getGeorgiaNow();
      const dayOfYear = Math.round(
        (Date.UTC(georgia.getFullYear(), georgia.getMonth(), georgia.getDate()) -
          Date.UTC(georgia.getFullYear(), 0, 1)) /
          86400000
      );

      const { data, error } = await supabase
        .from("surnames")
        .select("*")
        .order("surname")
        .range(dayOfYear % count, dayOfYear % count);
      if (!error && data && data.length > 0) {
        setDailySurname(data[0]);
      }
    } catch (e) {
      console.log("Daily surname error:", e);
    }
  };

  /** ბარათზე უფრო მოკლე ტექსტი ჯდება, ვიდრე ეკრანზე. */
  const getCardText = (text: string) => {
    const words = text.split(" ");
    if (words.length <= 32) return words.join(" ");
    return words.slice(0, 32).join(" ") + "...";
  };

  /**
   * გაზიარება: ჯერ ვცდილობთ ბარათის სურათად გადაღებას (PNG), და მხოლოდ
   * წარუმატებლობისას ვბრუნდებით უბრალო ტექსტზე. ასე გაზიარებული რამ
   * ყოველთვის ატარებს gvarigen.ge-ს ბრენდს, თუნდაც ტექსტი დაიკარგოს.
   */
  const shareSurname = async () => {
    if (!dailySurname || sharing) return;

    // ისტორია ბარათზევე წერია — ტექსტში მხოლოდ გვარი და ბმული მიდის.
    // გვარი განზრახ რჩება: ჩატის ისტორიაში ტექსტით ძებნა მუშაობს, სურათით — არა.
    const message = `${dailySurname.surname}\n\n${APP_STORE_URL}`;

    setSharing(true);
    try {
      let uri: string | null = null;
      try {
        uri = await captureRef(cardRef, {
          format: "png",
          quality: 1,
          result: "tmpfile",
        });
      } catch (captureError) {
        console.log("Card capture failed:", captureError);
      }

      if (uri) {
        if (Platform.OS === "ios") {
          // iOS-ზე ერთ გაზიარებაში სურათიც ეტევა და ტექსტიც
          await Share.share({ message, url: uri });
        } else if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "გაუზიარე გვარისშვილებს",
          });
        } else {
          await Share.share({ message });
        }
      } else {
        await Share.share({ message });
      }
    } catch (e) {
      console.log("Share error:", e);
    } finally {
      setSharing(false);
    }
  };

  useEffect(() => {
    if (user) fetchDailySurname();
  }, [user]);

  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  // შესვლის გარეშე გვარების მატიანე არ იხსნება
  if (!user) {
    return (
      <AuthGate
        title="გვარების მატიანე ჩაკეტილია"
        message="საგვარეულო ისტორიების მოსაძებნად გაიარე ავტორიზაცია — უფასოა."
        icon="library-outline"
      />
    );
  }

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

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Linking.openURL("https://www.gvarigen.ge/")}
          >
            <Text style={[styles.siteLink, fontsLoaded && styles.siteLinkCursive]}>
              gvarigen.ge
            </Text>
          </TouchableOpacity>

          <Text style={styles.title}>გვარების მატიანე</Text>
          <Text style={styles.subtitle}>
            აღმოაჩინე შენი წინაპრების ნაკვალევი და საგვარეულო ისტორია
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <TextInput
            placeholder="მაგ: მიშველიძე..."
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
            <Text style={styles.resultHistory}>{getPreviewText(historyText(result))}</Text>

            <TouchableOpacity
              style={styles.goldButton}
              onPress={() => Linking.openURL(surnamePageUrl(result.crest_code))}
            >
              <Text style={styles.goldButtonText}>ნახე საიტზე</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => Linking.openURL(GERBI_URL)}
            >
              <Text style={styles.secondaryButtonText}>შეუკვეთე გერბი / წიგნი</Text>
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
              onPress={() => Linking.openURL(orderResearchUrl(query))}
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
              <Text style={styles.dailyHistoryText}>{getDailyText(historyText(dailySurname))}</Text>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => Linking.openURL(surnamePageUrl(dailySurname.crest_code))}
              >
                <Text style={styles.secondaryButtonText}>ნახე საიტზე</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={shareSurname}
                disabled={sharing}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color="#000" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="share-social" size={18} color="#000" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.shareText}>
                  {sharing ? "მზადდება..." : "გაუზიარე გვარისშვილებს"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/*
        გასაზიარებელი ბარათი — ეკრანს მიღმა იხატება (top: -10000) და იქიდან
        გადაიღება PNG-ად. `collapsable={false}` აუცილებელია: მის გარეშე
        Android-ი ამ View-ს ოპტიმიზაციისას შლის და გადაღება ცარიელს აბრუნებს.
      */}
      {dailySurname && (
        <View style={styles.cardStage} pointerEvents="none">
          <View ref={cardRef} collapsable={false} style={styles.shareCard}>
            <LinearGradient
              colors={["rgba(212,175,55,0.18)", "transparent"]}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.cardBadge}>დღის გვარი</Text>
            <Text style={styles.cardSurname}>{dailySurname.surname}</Text>
            <View style={styles.cardDivider} />
            <Text style={styles.cardText}>{getCardText(historyText(dailySurname))}</Text>

            <View style={styles.cardFooter}>
              <Text style={[styles.cardBrand, fontsLoaded && styles.cardBrandCursive]}>
                gvarigen.ge
              </Text>
              <Text style={styles.cardDate}>{getGeorgianDateLabel()}</Text>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0D14" },
  content: { padding: 25, flexGrow: 1, paddingBottom: 50 },
  centered: { justifyContent: "center" },
  
  headerSection: { marginBottom: 30, marginTop: 20 },
  // სათადარიგო სტილი, სანამ შრიფტი ჩაიტვირთება
  siteLink: {
    color: "#D4AF37",
    fontSize: 30,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 14,
    letterSpacing: 1,
  },
  // გაკრული ხელწერა
  siteLinkCursive: {
    fontFamily: "GreatVibes",
    fontSize: 48,
    fontStyle: "normal",
    lineHeight: 64,
    letterSpacing: 2,
    marginTop: 6,
  },
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

  // მეორეული ქმედება — გერბი/წიგნი და საიტზე გასვლა დღის ბარათიდან
  secondaryButton: {
    marginTop: 12,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.45)",
    backgroundColor: "rgba(212,175,55,0.08)",
    alignItems: "center",
  },
  secondaryButtonText: { color: "#D4AF37", fontWeight: "700", fontSize: 14 },

  // --- გასაზიარებელი ბარათი (ეკრანს მიღმა, PNG-ად გადასაღებად) ---
  cardStage: { position: "absolute", top: -10000, left: 0 },
  shareCard: {
    width: 360,
    backgroundColor: "#0A0D14",
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.5)",
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 28,
    overflow: "hidden",
    alignItems: "center",
  },
  cardBadge: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  cardSurname: {
    color: "#D4AF37",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  cardDivider: {
    width: 60,
    height: 2,
    backgroundColor: "rgba(212,175,55,0.45)",
    marginVertical: 18,
  },
  cardText: { color: "#D1D5DB", fontSize: 15, lineHeight: 26, textAlign: "center" },
  cardFooter: { marginTop: 28, alignItems: "center" },
  // GreatVibes მხოლოდ ლათინურ „gvarigen.ge"-ზე — ქართულს მკხედრული არ აქვს
  cardBrand: { color: "#D4AF37", fontSize: 24, fontStyle: "italic", letterSpacing: 1 },
  cardBrandCursive: {
    fontFamily: "GreatVibes",
    fontSize: 38,
    fontStyle: "normal",
    lineHeight: 50,
  },
  cardDate: { color: "#9CA3AF", fontSize: 12, marginTop: 4, letterSpacing: 1 },

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