import React, { useRef } from 'react';
import { TouchableOpacity, Animated, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius, Spacing, Gradients } from '../constants/theme';

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
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 200 }).start();
  };

  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'danger':
        return ['#EF4444', '#DC2626'];
      case 'success':
        return ['#10B981', '#059669'];
      case 'ghost':
        return ['#FFFFFF', '#FFFFFF'];
      default:
        return [Gradients.primary[0] as string, Gradients.primary[1] as string];
    }
  };

  const getTextColor = () => {
    if (disabled) return '#94A3B8';
    if (variant === 'ghost') return Colors.primary;
    return '#FFF';
  };

  const getShadow = () => {
    if (disabled || variant === 'ghost') return {};
    const shadowColors: Record<string, string> = {
      primary: Colors.primary,
      danger: '#EF4444',
      success: '#10B981',
    };
    return {
      shadowColor: shadowColors[variant] || Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    };
  };

  const content = (
    <Animated.View style={[{ transform: [{ scale }] }, styles.inner, getShadow(), style]}>
      {variant === 'ghost' ? (
        <Animated.View style={[styles.ghost, disabled && styles.ghostDisabled]}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
        </Animated.View>
      ) : (
        <LinearGradient
          colors={disabled ? ['#E2E8F0', '#E2E8F0'] : getGradientColors()}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  ghost: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
  },
  ghostDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
});
