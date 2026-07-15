import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Control, Controller } from 'react-hook-form';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface InputProps extends TextInputProps {
  label: string;
  name: string;
  control: Control<any>;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export default function Input({ label, name, control, icon, isPassword, ...props }: InputProps) {
  const [isSecure, setIsSecure] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View className="mb-4">
          <Text className="text-textMuted font-bold mb-2 uppercase tracking-widest text-xs">{label}</Text>
          <View
            className={`flex-row items-center h-14 bg-card rounded-2xl px-4 border ${
              error ? 'border-error' : isFocused ? 'border-primary' : 'border-border'
            }`}
          >
            {icon && (
              <Ionicons
                name={icon}
                size={20}
                color={error ? '#ef4444' : isFocused ? '#2563eb' : '#94a3b8'}
                style={{ marginRight: 12 }}
              />
            )}
            <TextInput
              className="flex-1 text-text h-full text-base"
              placeholderTextColor="#64748b"
              secureTextEntry={isSecure}
              onChangeText={onChange}
              onBlur={() => {
                onBlur();
                setIsFocused(false);
              }}
              onFocus={() => setIsFocused(true)}
              value={value}
              {...props}
            />
            {isPassword && (
              <TouchableOpacity onPress={() => setIsSecure(!isSecure)} className="p-2">
                <Ionicons name={isSecure ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
          {error && (
            <Animated.Text entering={FadeIn} exiting={FadeOut} className="text-error text-xs mt-2 ml-1 font-semibold">
              {error.message}
            </Animated.Text>
          )}
        </View>
      )}
    />
  );
}
