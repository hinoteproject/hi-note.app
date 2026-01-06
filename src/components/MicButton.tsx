import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, Fonts, Radius } from '../constants/theme';

interface MicButtonProps {
  isListening: boolean;
  isProcessing?: boolean;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function MicButton({ 
  isListening, 
  isProcessing = false,
  onPress, 
  size = 'large' 
}: MicButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const sizes = {
    small: { button: 52, icon: 22 },
    medium: { button: 80, icon: 32 },
    large: { button: 120, icon: 48 },
  };

  const currentSize = sizes[size];

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <View style={styles.container}>
      {/* Pulse ring when listening */}
      {isListening && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: currentSize.button + 40,
              height: currentSize.button + 40,
              borderRadius: (currentSize.button + 40) / 2,
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.3],
                outputRange: [0.4, 0],
              }),
            },
          ]}
        />
      )}
      
      <TouchableOpacity
        onPress={handlePress}
        disabled={isProcessing}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={isListening ? ['#EF4444', '#DC2626'] : [Colors.purpleLight, Colors.purple]}
            style={[
              styles.button,
              {
                width: currentSize.button,
                height: currentSize.button,
                borderRadius: currentSize.button / 2,
              },
            ]}
          >
            <Text style={[styles.icon, { fontSize: currentSize.icon }]}>
              {isProcessing ? '⏳' : isListening ? '🔴' : '🎤'}
            </Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Status text */}
      {size === 'large' && (
        <Text style={styles.statusText}>
          {isProcessing ? 'Đang xử lý...' : isListening ? 'Đang nghe...' : 'Nhấn để nói'}
        </Text>
      )}

      {/* Listening badge for small size */}
      {size === 'small' && isListening && (
        <View style={styles.listeningBadge}>
          <Text style={styles.listeningText}>Đang nghe...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    backgroundColor: Colors.purple,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.purple,
  },
  icon: {
    color: Colors.white,
  },
  statusText: {
    marginTop: 12,
    fontSize: Fonts.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  listeningBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.red,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  listeningText: {
    fontSize: 8,
    color: Colors.white,
    fontWeight: '600',
  },
});
