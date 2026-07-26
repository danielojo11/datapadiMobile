import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface InputProps<TFieldValues extends FieldValues = any> extends TextInputProps {
  label: string;
  name: Path<TFieldValues> | string;
  control: Control<TFieldValues> | any;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export default function Input<TFieldValues extends FieldValues = any>({ label, name, control, icon, isPassword, ...props }: InputProps<TFieldValues>) {
  const [isSecure, setIsSecure] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Controller
      control={control}
      name={name as any}
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
