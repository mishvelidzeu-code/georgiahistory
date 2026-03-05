import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View
} from "react-native";

const { height } = Dimensions.get("window");
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
  const bgScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {

    Animated.timing(bgScale, {
      toValue: 1.15,
      duration: 4000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      animateWord(w1Y, w1Scale, w1Opacity),
      animateWord(w2Y, w2Scale, w2Opacity),
      animateWord(w3Y, w3Scale, w3Opacity),

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
    <View style={styles.container}>
      
      <Animated.Image
        source={FLAG}
        style={[
          styles.background,
          {
            transform: [{ scale: bgScale }],
          },
        ]}
        resizeMode="cover"
      />

      <View style={styles.overlay} />
      <View style={styles.vignette} />

      <View style={styles.centerContent}>
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
          ზოგადი
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
          განათლების
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
          სივრცე
        </Animated.Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    fontSize: 36, // 🔥 კიდევ შემცირდა
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: 2,
    marginVertical: 12,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 20,
  },
});