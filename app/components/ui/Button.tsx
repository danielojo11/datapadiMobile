import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'outline';
}

export default function Button({ label, loading, icon, variant = 'primary', onPress, style, ...props }: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) onPress(e);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'outline':
        return 'border border-primary bg-transparent';
      case 'secondary':
        return 'bg-card border border-border';
      case 'primary':
      default:
        return 'bg-primary shadow-lg shadow-primary/30';
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return 'text-primary';
    if (variant === 'secondary') return 'text-text';
    return 'text-white';
  };

  return (
    <AnimatedTouchableOpacity
      activeOpacity={0.8}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={loading || props.disabled}
      className={`h-14 rounded-2xl flex-row items-center justify-center px-4 ${getVariantStyles()}`}
      style={[animatedStyle, style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#2563eb' : '#fff'} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={variant === 'outline' ? '#2563eb' : variant === 'secondary' ? '#f8fafc' : '#fff'}
              style={{ marginRight: 8 }}
            />
          )}
          <Text className={`font-bold text-lg ${getTextColor()}`}>{label}</Text>
        </>
      )}
    </AnimatedTouchableOpacity>
  );
}
