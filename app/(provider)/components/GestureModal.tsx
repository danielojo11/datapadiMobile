import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Dimensions, Modal, StyleSheet, TouchableOpacity, View, KeyboardAvoidingView, Platform } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function GestureModal({
  visible,
  onClose,
  children,
}: Props) {
  const translateY = useSharedValue(SHEET_HEIGHT);
  const opacity = useSharedValue(0);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);

      translateY.value = SHEET_HEIGHT;
      opacity.value = 0;

      translateY.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(1, { duration: 250 });
    } else if (isMounted) {
      closeSheet();
    }
  }, [visible]);

  const closeSheet = () => {
    "worklet";

    translateY.value = withTiming(
      SHEET_HEIGHT,
      { duration: 250 },
      (finished) => {
        if (finished) {
          runOnJS(setIsMounted)(false);
        }
      }
    );

    opacity.value = withTiming(0, { duration: 250 });
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (
        event.translationY > SHEET_HEIGHT * 0.3 ||
        event.velocityY > 800
      ) {
        runOnJS(handleClose)();
      } else {
        translateY.value = withTiming(0);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isMounted) return null;

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView 
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        <View style={styles.bottomContainer}>
          <GestureDetector gesture={pan}>
            <Animated.View style={sheetStyle}>
              {children}
            </Animated.View>
          </GestureDetector>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17,24,39,0.6)",
  },

  bottomContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
});