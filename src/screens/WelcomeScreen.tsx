import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius, Spacing } from '../constants/theme';

interface WelcomeScreenProps {
  userName: string;
  onViewInvoice: () => void;
}

export function WelcomeScreen({ userName, onViewInvoice }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8F4FE', '#E0EAFC', '#F8FAFC']}
        style={styles.gradient}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentInner}
        >
          {/* AI Icon */}
          <View style={styles.iconSection}>
            <LinearGradient
              colors={['#C4B5FD', '#A78BFA', '#8B5CF6']}
              style={styles.aiCircle}
            >
              <Text style={styles.aiStar}>✨</Text>
            </LinearGradient>
            <View style={styles.sparkles}>
              <Text style={styles.sparkle}>✦</Text>
              <Text style={[styles.sparkle, styles.sparkle2]}>✦</Text>
              <Text style={[styles.sparkle, styles.sparkle3]}>✦</Text>
            </View>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeRow}>
              <Text style={styles.welcomeTitle}>Chào {userName},</Text>
              <Text style={styles.waveEmoji}>👋</Text>
            </View>
            <Text style={styles.welcomeSubtitle}>
              Hi-Note là ứng dụng bán hàng được AI hỗ trợ
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Mình sẽ giúp bạn:</Text>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🚀</Text>
              <Text style={styles.featureText}>Lên đơn nhanh chóng</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>Tính tiền chính xác từng đồng</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>🔔</Text>
              </View>
              <Text style={styles.featureText}>
                Gửi hóa đơn cho khách và nghe báo ting ting khi tiền về.{' '}
                <Text style={styles.featureLink}>Nghe thử</Text>
              </Text>
            </View>
          </View>

          {/* Notice */}
          <View style={styles.noticeCard}>
            <View style={styles.noticeIcon}>
              <Text style={styles.noticeEmoji}>💬</Text>
            </View>
            <Text style={styles.noticeText}>
              Cuộc gọi sẽ tiếp tục nhưng không bật camera
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onViewInvoice}>
            <Text style={styles.primaryBtnText}>Xem mẫu hóa đơn</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  aiCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiStar: {
    fontSize: 44,
  },
  sparkles: {
    position: 'absolute',
    width: 140,
    height: 140,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 16,
    color: '#A78BFA',
    top: 10,
    right: 20,
  },
  sparkle2: {
    top: 60,
    right: 0,
    fontSize: 12,
  },
  sparkle3: {
    top: 30,
    left: 10,
    fontSize: 14,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  waveEmoji: {
    fontSize: 28,
    marginLeft: 8,
  },
  welcomeSubtitle: {
    fontSize: Fonts.md,
    color: Colors.primary,
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: Fonts.md,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIconWrap: {},
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: Fonts.md,
    color: Colors.text,
    lineHeight: 24,
  },
  featureLink: {
    color: Colors.primary,
    fontWeight: '500',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 16,
  },
  noticeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  noticeEmoji: {
    fontSize: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: Fonts.sm,
    color: Colors.textSecondary,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: Fonts.md,
    fontWeight: '600',
  },
});
