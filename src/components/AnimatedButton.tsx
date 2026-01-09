import React, { ReactNode, useRef } from 'react';
import { TouchableOpacity, Animated, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius, Spacing } from '../constants/theme';

interface Props {
  children?: ReactNode;
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'ghost';
}

export default function AnimatedButton({ children, title, onPress, disabled, style, variant = 'primary' }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  };

  const content = (
    <Animated.View style={[{ transform: [{ scale }] }, styles.inner, style]}>
      {variant === 'primary' ? (
        <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.gradient}>
          <Text style={styles.primaryText}>{title}</Text>
        </LinearGradient>
      ) : (
        <Animated.View style={styles.ghost}>
          <Text style={[styles.primaryText, styles.ghostText]}>{title}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      onPressIn={pressIn}
      onPressOut={pressOut}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  inner: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  primaryText: {
    color: Colors.white,
    fontSize: Fonts.md,
    fontWeight: '700',
  },
  ghost: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  ghostText: {
    color: Colors.primary,
  },
});


