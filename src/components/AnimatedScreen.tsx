import React, { ReactNode, useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}

export default function AnimatedScreen({ children, style, delay = 0 }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 320, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);

  return (
    <Animated.View style={[{ flex: 1, opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}


