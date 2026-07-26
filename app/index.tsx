import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    image: require("../assets/images/onboard_1.jpg"),
    title: "Track Your Spending",
    subtitle: "See exactly where your money is going with our intuitive dashboard.",
  },
  {
    id: "2",
    image: require("../assets/images/onboard_2.jpg"),
    title: "Pay Bills Easily",
    subtitle: "Airtime, data, and electricity top-ups at your fingertips.",
  },
  {
    id: "3",
    image: require("../assets/images/onboard_3.jpg"),
    title: "Fast & Secure Transfers",
    subtitle: "Send money instantly with bank-grade security keeping you safe.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem("has_launched_before");
        if (hasLaunched === "true") {
          router.replace("/login");
          setIsChecking(false);
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        setIsChecking(false);
      }
    };

    checkFirstLaunch();
  }, []);

  useEffect(() => {
    if (isChecking) return;

    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= slides.length) {
        nextIndex = 0;
      }
      slidesRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 3500);

    return () => clearInterval(interval);
  }, [currentIndex, isChecking]);

  const handleContinue = async (route: "/login" | "/signup") => {
    try {
      await AsyncStorage.setItem("has_launched_before", "true");
    } catch (error) {
      console.log("Error setting launch flag:", error);
    }
    router.push(route);
  };

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  if (isChecking) {
    return null;
  }

  const renderItem = ({ item }: { item: typeof slides[0] }) => {
    return (
      <View style={styles.slideContainer}>
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.image} resizeMode="contain" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>{item.title}</Text>
          <Text style={styles.subtitleText}>{item.subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.carouselContainer}>
        <FlatList
          data={slides}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />

        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {slides.map((_, index) => {
            const opacity = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });
            const scale = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [0.8, 1.2, 0.8],
              extrapolate: "clamp",
            });
            const dotWidth = scrollX.interpolate({
              inputRange: [(index - 1) * width, index * width, (index + 1) * width],
              outputRange: [8, 20, 8],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={index.toString()}
                style={[
                  styles.dot,
                  { opacity, transform: [{ scale }], width: dotWidth },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={() => handleContinue("/signup")}
          activeOpacity={0.8}
        >
          <Text style={styles.signUpText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => handleContinue("/login")}
          activeOpacity={0.8}
        >
          <Text style={styles.loginText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  carouselContainer: {
    flex: 1,
  },
  slideContainer: {
    width,
    alignItems: "center",
    paddingTop: 20,
  },
  imageContainer: {
    width: "100%",
    height: height * 0.45,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    paddingHorizontal: 32,
    alignItems: "center",
    marginTop: 20,
  },
  titleText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2B60E6",
    marginHorizontal: 4,
  },
  bottomContainer: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 30,
    gap: 16,
  },
  signUpButton: {
    backgroundColor: "#2B60E6",
    width: "100%",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2B60E6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  signUpText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  loginButton: {
    backgroundColor: "#F1F5F9",
    width: "100%",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
});
