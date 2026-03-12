import { useHistory } from "@/context/HistoryContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const IMAGE = require("../../assets/gallery/1.webp");

export default function BirthsScreen() {

  const router = useRouter();
  const { history } = useHistory();

  if (!history) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const content = history?.births_content;

  return (

    <View style={{ flex: 1 }}>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={36} color="#D4AF37" />
      </TouchableOpacity>

      <ScrollView style={styles.container}>

        <Image source={IMAGE} style={styles.image} />

        <Text style={styles.title}>
          ვინ დაიბადნენ და ვინ გარდაიცვალნენ ამ დღეს
        </Text>

        <Text style={styles.text}>
          {content || "ამ დღის მონაცემები ჯერ არ არის ატვირთული."}
        </Text>

      </ScrollView>

    </View>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#0A0D14",
    padding: 20,
    paddingTop: 110,
  },

  backButton: {
    position: "absolute",
    top: 40,
    left: 15,
    zIndex: 10,
    padding: 12,
    borderRadius: 30,
  },

  image: {
    width: "100%",
    height: 200,
    borderRadius: 14,
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#D4AF37",
    marginBottom: 15,
  },

  text: {
    fontSize: 16,
    color: "#E5E7EB",
    lineHeight: 26,
  },

  center: {
    flex: 1,
    backgroundColor: "#0A0D14",
    justifyContent: "center",
    alignItems: "center",
  },

});