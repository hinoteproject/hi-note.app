import React, { useRef } from 'react';
import { TouchableOpacity, Animated, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius, Spacing, Shadows } from '../constants/theme';

interface Props {
  title?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'ghost' | 'danger' | 'success';
  icon?: string;
}

export default function AnimatedButton({ 
  title, 
  onPress, 
  disabled, 
  style, 
  variant = 'primary',
  icon,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
  };

  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'danger':
        return [Colors.red, '#DC2626'];
      case 'success':
        return [Colors.greenLight, Colors.green];
      case 'ghost':
        return [Colors.white, Colors.white];
      default:
        return [Colors.primaryLight, Colors.primary];
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.textMuted;
    if (variant === 'ghost') return Colors.primary;
    return Colors.white;
  };

  const content = (
    <Animated.View style={[{ transform: [{ scale }] }, styles.inner, style]}>
      {variant === 'ghost' ? (
        <Animated.View style={[styles.ghost, disabled && styles.ghostDisabled]}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
        </Animated.View>
      ) : (
        <LinearGradient 
          colors={disabled ? [Colors.border, Colors.border] : getGradientColors()} 
          style={styles.gradient}
        >
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
        </LinearGradient>
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  text: {
    fontSize: Fonts.md,
    fontWeight: '700',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  ghost: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
  },
  ghostDisabled: {
    backgroundColor: Colors.inputBg,
    borderColor: Colors.borderLight,
  },
});

