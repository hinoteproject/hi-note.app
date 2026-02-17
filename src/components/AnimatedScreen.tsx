import React, { ReactNode, useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  type?: 'fadeSlide' | 'fadeScale' | 'fade';
}

export default function AnimatedScreen({ children, style, delay = 0, type = 'fadeSlide' }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(type === 'fadeSlide' ? 16 : 0)).current;
  const scale = useRef(new Animated.Value(type === 'fadeScale' ? 0.96 : 1)).current;

  useEffect(() => {
    const animations = [
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
    ];

    if (type === 'fadeSlide') {
      animations.push(
        Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true })
      );
    }
    if (type === 'fadeScale') {
      animations.push(
        Animated.spring(scale, { toValue: 1, delay, useNativeDriver: true, damping: 20, stiffness: 200 })
      );
    }

    Animated.parallel(animations).start();
  }, []);

  return (
    <Animated.View
      style={[
        { flex: 1, opacity, transform: [{ translateY }, { scale }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}
