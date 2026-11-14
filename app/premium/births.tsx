import AuthGate from "@/components/auth-gate";
import { getGeorgianDateLabel } from "@/services/date";
import { useAuth } from "@/context/AuthContext";
import { useHistory } from "@/context/HistoryContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // npx expo install expo-linear-gradient
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const IMAGE = require("../../assets/gallery/1.webp");

export default function BirthsScreen() {
  const router = useRouter();
  const { user, authLoading } = useAuth();
  const { history } = useHistory();

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!user) {
    return (
      <AuthGate
        title="ბიოგრაფიები ჩაკეტილია"
        message="ამ დღეს დაბადებული და გარდაცვლილი პიროვნებების სანახავად გაიარე ავტორიზაცია."
        icon="ribbon-outline"
      />
    );
  }

  const content = history?.births_content;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />

      {/* Floating Back Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.4)"]}
          style={styles.backGradient}
        >
          <Ionicons name="chevron-back" size={28} color="#D4AF37" />
        </LinearGradient>
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.imageContainer}>
          <Image source={IMAGE} style={styles.image} />
          <LinearGradient
            colors={["transparent", "rgba(10, 13, 20, 1)"]}
            style={styles.overlay}
          />
          <View style={styles.imageLabel}>
            <Ionicons name="ribbon-outline" size={24} color="#D4AF37" />
            <Text style={styles.imageLabelText}>ბიოგრაფიული ცნობები</Text>
            <Text style={styles.heroDate}>{getGeorgianDateLabel()}</Text>
          </View>
        </View>

        {/* Content Card */}
        <View style={styles.card}>
          {/* Decorative Corners */}
          <View style={[styles.corner, { top: 20, left: 20, borderTopWidth: 1, borderLeftWidth: 1 }]} />
          <View style={[styles.corner, { top: 20, right: 20, borderTopWidth: 1, borderRightWidth: 1 }]} />

          <Text style={styles.title}>
            ვინ <Text style={styles.titleAccent}>დაიბადნენ</Text> და{" "}
            <Text style={styles.titleAccent}>გარდაიცვალნენ</Text> ამ დღეს
          </Text>

          <View style={styles.decorativeDivider}>
            <View style={styles.line} />
            <View style={styles.dot} />
            <View style={styles.line} />
          </View>

          {content ? (
            content.split("\n\n").map((para: string, i: number) => {
              const line = para.trim();
              // „დაიბადნენ:" / „გარდაიცვალნენ:" — მოკლე სტრიქონი ორწინწილით
              const isHeading = line.endsWith(":") && line.length <= 40;

              return (
                <Text
                  key={i}
                  style={[styles.text, isHeading ? styles.sectionHeading : styles.paragraph]}
                >
                  {line}
                </Text>
              );
            })
          ) : (
            <Text style={styles.text}>ამ დღის მონაცემები ჯერ არ არის ატვირთული.</Text>
          )}

          {/* Bottom Badge */}
          <View style={styles.footerMotif}>
            <Text style={styles.footerText}>ისტორია მეხსიერებაა</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#0A0D14",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: "#0A0D14",
    justifyContent: "center",
    alignItems: "center",
  },

  // Hero Section
  imageContainer: {
    width: "100%",
    height: 350,
    justifyContent: 'flex-end',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroDate: {
    color: "#D4AF37",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  imageLabel: {
    alignItems: 'center',
    marginBottom: 60,
    opacity: 0.9,
  },
  imageLabelText: {
    color: "#D4AF37",
    fontSize: 12,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 8,
    fontWeight: '700'
  },

  // Back Button
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 100,
    overflow: 'hidden',
    borderRadius: 15,
  },
  backGradient: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content Card
  card: {
    marginHorizontal: 20,
    marginTop: -30,
    backgroundColor: "#111827",
    borderRadius: 30,
    padding: 30,
    paddingTop: 45,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  corner: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#E2D9C5",
    textAlign: "center",
    lineHeight: 32,
  },
  decorativeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 25,
  },
  line: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D4AF37',
    marginHorizontal: 10,
  },
  titleAccent: {
    color: "#D4AF37",
    fontWeight: "900",
  },
  text: {
    fontSize: 17,
    color: "#D1D5DB",
    lineHeight: 30,
    textAlign: "left",
  },
  paragraph: { marginBottom: 14 },
  sectionHeading: {
    color: "#D4AF37",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 12,
  },

  // Footer
  footerMotif: {
    marginTop: 40,
    alignItems: 'center',
    opacity: 0.3,
  },
  footerText: {
    color: "#D4AF37",
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '700',
  }
});