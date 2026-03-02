import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    ImageBackground,
    StyleSheet,
    View
} from "react-native";

const { height } = Dimensions.get("window");

// 📌 შენი ჩაგდებული დროშა
const FLAG = require("../assets/gallery/6.webp");

export default function SplashIntro() {
  const router = useRouter();

  const w1Y = useRef(new Animated.Value(height)).current;
  const w2Y = useRef(new Animated.Value(height)).current;
  const w3Y = useRef(new Animated.Value(height)).current;

  const w1Scale = useRef(new Animated.Value(2)).current;
  const w2Scale = useRef(new Animated.Value(2)).current;
  const w3Scale = useRef(new Animated.Value(2)).current;

  const w1Opacity = useRef(new Animated.Value(0)).current;
  const w2Opacity = useRef(new Animated.Value(0)).current;
  const w3Opacity = useRef(new Animated.Value(0)).current;

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      animateWord(w1Y, w1Scale, w1Opacity),
      animateWord(w2Y, w2Scale, w2Opacity),
      animateWord(w3Y, w3Scale, w3Opacity),

      // Subtle premium pulse
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.03,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 600);
    });
  }, []);

  function animateWord(y: any, scale: any, opacity: any) {
    return Animated.parallel([
      Animated.timing(y, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]);
  }

  return (
    <ImageBackground source={FLAG} style={styles.background} resizeMode="cover">
      
      {/* Dark cinematic overlay */}
      <View style={styles.overlay} />

      {/* Vignette edge darkening */}
      <View style={styles.vignette} />

      <Animated.Text
        style={[
          styles.text,
          {
            opacity: w1Opacity,
            transform: [
              { translateY: w1Y },
              { scale: Animated.multiply(w1Scale, pulse) },
            ],
          },
        ]}
      >
        გახსოვდეს
      </Animated.Text>

      <Animated.Text
        style={[
          styles.text,
          {
            opacity: w2Opacity,
            transform: [
              { translateY: w2Y },
              { scale: Animated.multiply(w2Scale, pulse) },
            ],
          },
        ]}
      >
        საქართველოს
      </Animated.Text>

      <Animated.Text
        style={[
          styles.text,
          {
            opacity: w3Opacity,
            transform: [
              { translateY: w3Y },
              { scale: Animated.multiply(w3Scale, pulse) },
            ],
          },
        ]}
      >
        ისტორია
      </Animated.Text>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)", // ჩაბნელება
  },

  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  text: {
    fontSize: 46,
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: 2,
    marginVertical: 14,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 20,
  },
});