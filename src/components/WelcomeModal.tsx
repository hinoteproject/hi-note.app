import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedButton from './AnimatedButton';
import { Colors } from '../constants/theme';

const { width } = Dimensions.get('window');

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
          <LinearGradient colors={['#fff', '#f0f9ff']} style={styles.card}>
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

            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <LinearGradient colors={[Colors.primary, '#2563EB']} style={styles.avatar}>
                <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
              <View style={styles.checkBadge}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
            </View>

            {/* Content */}
            <Text style={styles.title}>Chào mừng bạn! 🎉</Text>
            <Text style={styles.name}>{userName}</Text>
            <Text style={styles.subtitle}>
              Tài khoản của bạn đã được tạo thành công.{'\n'}
              Bắt đầu quản lý bán hàng thông minh với Hi-Note!
            </Text>

            {/* Features */}
            <View style={styles.features}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🎤</Text>
                <Text style={styles.featureText}>Tạo đơn bằng giọng nói</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureText}>Thống kê doanh thu</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💰</Text>
                <Text style={styles.featureText}>Quản lý thanh toán</Text>
              </View>
            </View>

            {/* Button */}
            <AnimatedButton
              title="Bắt đầu ngay! 🚀"
              onPress={onClose}
              variant="primary"
            />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  avatarWrap: {
    position: 'relative',
    marginBottom: 20,
    marginTop: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  checkIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
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
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  features: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
});
