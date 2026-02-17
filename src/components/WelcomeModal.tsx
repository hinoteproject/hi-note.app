import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedButton from './AnimatedButton';
import { Colors, Gradients, Shadows } from '../constants/theme';

interface WelcomeModalProps {
  visible: boolean;
  userName: string;
  onClose: () => void;
}

export default function WelcomeModal({ visible, userName, onClose }: WelcomeModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(confettiAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(confettiAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
          ])
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          {/* Glass card with gradient border */}
          <View style={styles.card}>
            {/* Gradient accent */}
            <LinearGradient colors={Gradients.primary} style={styles.accentBar} />

            {/* Confetti */}
            <View style={styles.confettiContainer}>
              {['🎉', '✨', '🎊', '⭐', '💫'].map((emoji, i) => (
                <Animated.Text
                  key={i}
                  style={[
                    styles.confetti,
                    {
                      left: `${15 + i * 18}%`,
                      opacity: confettiAnim,
                      transform: [{
                        translateY: confettiAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -20],
                        }),
                      }],
                    },
                  ]}
                >
                  {emoji}
                </Animated.Text>
              ))}
            </View>

            {/* Logo */}
            <Image source={require('../../assets/hinote-logo.png')} style={styles.logo} resizeMode="contain" />

            {/* Content */}
            <Text style={styles.title}>Chào mừng bạn! 🎉</Text>
            <Text style={styles.name}>{userName}</Text>
            <Text style={styles.subtitle}>
              Tài khoản đã được tạo thành công.{'\n'}
              Bắt đầu quản lý bán hàng thông minh!
            </Text>

            {/* Features */}
            <View style={styles.features}>
              {[
                { icon: '🎤', text: 'Tạo đơn bằng giọng nói' },
                { icon: '📸', text: 'Chụp ảnh nhận đơn AI' },
                { icon: '📊', text: 'Thống kê doanh thu' },
              ].map((f, i) => (
                <View key={i} style={styles.featureItem}>
                  <LinearGradient colors={Gradients.primarySoft} style={styles.featureIconWrap}>
                    <Text style={styles.featureIcon}>{f.icon}</Text>
                  </LinearGradient>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>

            {/* Button */}
            <AnimatedButton
              title="Bắt đầu ngay! 🚀"
              onPress={onClose}
              variant="primary"
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
    ...Shadows.card,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  confettiContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 40,
  },
  confetti: {
    position: 'absolute',
    fontSize: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 16,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  features: {
    width: '100%',
    marginBottom: 24,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureIcon: {
    fontSize: 18,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
});
