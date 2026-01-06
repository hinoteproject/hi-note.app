import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, Fonts, Radius, Spacing } from '../constants/theme';

interface VoiceTextProps {
  text: string;
  isListening: boolean;
  isProcessing?: boolean;
}

export function VoiceText({ text, isListening, isProcessing = false }: VoiceTextProps) {
  const cursorAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      // Cursor blink animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
          Animated.timing(cursorAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();

      // Wave animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(waveAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    } else {
      cursorAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [isListening]);

  if (!text && !isListening && !isProcessing) return null;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.labelIcon}>
          {isProcessing ? '⏳' : isListening ? '🎤' : '💬'}
        </Text>
        <Text style={styles.label}>
          {isProcessing ? 'Đang xử lý...' : isListening ? 'Đang nghe...' : 'Đã nhận:'}
        </Text>
        
        {isListening && (
          <View style={styles.waveContainer}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveDot,
                  {
                    transform: [{
                      scaleY: waveAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1 + (i % 2) * 0.5],
                      }),
                    }],
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
      
      <View style={[styles.textBox, isListening && styles.textBoxActive]}>
        <Text style={styles.text}>
          {text || 'Hãy nói gì đó...'}
          {isListening && (
            <Animated.Text style={[styles.cursor, { opacity: cursorAnim }]}>|</Animated.Text>
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  labelIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  label: {
    fontSize: Fonts.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
    gap: 3,
  },
  waveDot: {
    width: 3,
    height: 12,
    backgroundColor: Colors.purple,
    borderRadius: 2,
  },
  textBox: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    minHeight: 60,
    ...Shadows.sm,
  },
  textBoxActive: {
    borderColor: Colors.purple,
    backgroundColor: Colors.purpleBg,
  },
  text: {
    fontSize: Fonts.lg,
    color: Colors.text,
    lineHeight: 28,
  },
  cursor: {
    color: Colors.purple,
    fontWeight: '300',
  },
});
