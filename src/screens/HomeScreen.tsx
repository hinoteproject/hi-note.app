import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import AnimatedScreen from '../components/AnimatedScreen';
import GlassCard from '../components/GlassCard';
import AnimatedNumber from '../components/AnimatedNumber';
import DatePickerModal from '../components/DatePickerModal';
import RevenueChart from '../components/RevenueChart';
import { Colors, Gradients, Shadows } from '../constants/theme';

// ── QuickCard: spring bounce khi nhấn ────────────────────────────────────────
function QuickCard({ icon, label, gradient, onPress }: {
  icon: string; label: string;
  gradient: [string, string] | readonly [string, string, ...string[]];
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.90, useNativeDriver: true, speed: 50, bounciness: 2 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 12 }).start()}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles2.quickCard, { transform: [{ scale }] }]}>
        <LinearGradient colors={gradient as [string, string]} style={styles2.quickIconWrap}>
          <Text style={styles2.quickIcon}>{icon}</Text>
        </LinearGradient>
        <Text style={styles2.quickLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ── Được dùng bởi QuickCard (styles2) ─────────────────────────────────────────
const styles2 = StyleSheet.create({
  quickCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 22,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  quickIconWrap: {
    width: 48, height: 48, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  quickIcon: { fontSize: 22 },
  quickLabel: { fontSize: 12, fontWeight: '800', color: '#334155', letterSpacing: -0.2, textAlign: 'center' },
});


type TimeFilter = 'today' | 'yesterday' | '7days' | 'month' | 'lastMonth' | 'quarter' | 'year' | 'custom';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TimeFilter>('month');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const orders = useStore(state => state.orders);
  const user = useStore(state => state.user);
  const [customDate, setCustomDate] = useState<Date>(new Date());
  const [customMode, setCustomMode] = useState<'day' | 'month' | 'year'>('day');

  // Staggered animation for cards
  const cardAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const anims = cardAnims.map((anim, i) =>
      Animated.timing(anim, { toValue: 1, duration: 400, delay: 100 + i * 80, useNativeDriver: true })
    );
    Animated.stagger(80, anims).start();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Chào buổi sáng', emoji: '☀️' };
    if (h < 18) return { text: 'Chào buổi chiều', emoji: '🌤️' };
    return { text: 'Chào buổi tối', emoji: '🌙' };
  };
  const greeting = getGreeting();

  const getFilteredData = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');
    const filterByRange = (start: Date, end?: Date) =>
      paidOrders.filter(o => {
        const d = new Date(o.createdAt);
        return end ? (d >= start && d < end) : (d >= start);
      });

    let currentFiltered: typeof paidOrders = [];
    let prevFiltered: typeof paidOrders = [];

    switch (activeTab) {
      case 'today':
        currentFiltered = filterByRange(today);
        prevFiltered = filterByRange(yesterday, today);
        break;
      case 'yesterday':
        currentFiltered = filterByRange(yesterday, today);
        prevFiltered = filterByRange(new Date(yesterday.getTime() - 86400000), yesterday);
        break;
      case '7days':
        currentFiltered = filterByRange(weekAgo);
        prevFiltered = filterByRange(twoWeeksAgo, weekAgo);
        break;
      case 'month':
        currentFiltered = filterByRange(monthStart);
        prevFiltered = filterByRange(lastMonthStart, monthStart);
        break;
      case 'lastMonth':
        currentFiltered = filterByRange(lastMonthStart, new Date(lastMonthEnd.getTime() + 86400000));
        prevFiltered = filterByRange(twoMonthsAgoStart, lastMonthStart);
        break;
      case 'quarter': currentFiltered = filterByRange(quarterStart); break;
      case 'year': currentFiltered = filterByRange(yearStart); break;
      case 'custom':
        currentFiltered = paidOrders.filter(o => {
          const d = new Date(o.createdAt);
          if (customMode === 'day') {
            const t = new Date(customDate); t.setHours(0, 0, 0, 0);
            const od = new Date(d); od.setHours(0, 0, 0, 0);
            return od.getTime() === t.getTime();
          } else if (customMode === 'month') {
            return d.getFullYear() === customDate.getFullYear() && d.getMonth() === customDate.getMonth();
          }
          return d.getFullYear() === customDate.getFullYear();
        });
        break;
      default: currentFiltered = paidOrders;
    }

    const revenue = currentFiltered.reduce((sum, o) => sum + o.totalAmount, 0);
    const prevRevenue = prevFiltered.reduce((sum, o) => sum + o.totalAmount, 0);
    let trendPercent = 0;
    if (prevRevenue > 0) trendPercent = Math.round(((revenue - prevRevenue) / prevRevenue) * 100);
    else if (revenue > 0) trendPercent = 100;

    return { revenue, orderCount: currentFiltered.length, trendPercent };
  };

  const { revenue, orderCount, trendPercent } = getFilteredData();

  const formatMoney = (n: number) => {
    if (n === 0) return '0';
    return new Intl.NumberFormat('vi-VN').format(n);
  };

  const tabLabels: Record<TimeFilter, string> = {
    today: 'Hôm nay', yesterday: 'Hôm qua', '7days': '7 ngày',
    month: 'Tháng này', lastMonth: 'Tháng trước',
    quarter: 'Quý này', year: 'Năm nay', custom: 'Tuỳ chỉnh',
  };
  const mainTabs: TimeFilter[] = ['today', 'yesterday', 'month'];

  const goToSell = () => navigation.navigate('Sell');
  const goToExpense = () => navigation.navigate('Chi phí');
  const goToProducts = () => navigation.navigate('Products');

  const getCustomLabel = () => {
    if (customMode === 'day') return `${customDate.getDate()}/${customDate.getMonth() + 1}/${customDate.getFullYear()}`;
    if (customMode === 'month') return `T${customDate.getMonth() + 1}/${customDate.getFullYear()}`;
    return `${customDate.getFullYear()}`;
  };

  const handleDateSelect = (date: Date, mode: 'day' | 'month' | 'year') => {
    setCustomDate(date);
    setCustomMode(mode);
    setActiveTab('custom');
  };

  const renderAnimatedCard = (index: number, children: React.ReactNode) => (
    <Animated.View style={{
      opacity: cardAnims[index],
      transform: [{ translateY: cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    }}>
      {children}
    </Animated.View>
  );

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <LinearGradient
          colors={Gradients.header}
          style={styles.gradient}
        />

        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* ─── Premium Header ─── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greetingSmall}>{greeting.emoji} {greeting.text}</Text>
              <Text style={styles.greetingName}>{user?.name || 'Chủ quán'}</Text>
            </View>
            <TouchableOpacity style={styles.aiBtn} onPress={goToSell} activeOpacity={0.85}>
              <LinearGradient
                colors={Gradients.purple}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.aiBtnGradient}
              >
                <Text style={styles.aiBtnIcon}>✨</Text>
                <Text style={styles.aiBtnText}>Trợ lý AI</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ─── Time Filter Tabs ─── */}
          <View style={styles.tabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsRow}
            >
              {mainTabs.map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tabLabels[tab]}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.tab, activeTab === 'custom' && styles.tabActive]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === 'custom' && styles.tabTextActive]}>
                  {activeTab === 'custom' ? getCustomLabel() : '📅 Khác'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* ─── Revenue Card ─── */}
            {renderAnimatedCard(0,
              <GlassCard style={styles.revenueCard} intensity="strong">
                <View style={styles.revenueHeader}>
                  <View>
                    <Text style={styles.revenueLabel}>Doanh thu</Text>
                    <View style={styles.revenueRow}>
                      <AnimatedNumber
                        value={revenue}
                        style={styles.revenueMoney}
                        suffix="đ"
                      />
                    </View>
                  </View>
                  <View style={[styles.trendBadge, trendPercent < 0 && styles.trendDown]}>
                    <Text style={[styles.trendText, trendPercent < 0 && styles.trendTextDown]}>
                      {trendPercent >= 0 ? '↗' : '↘'} {trendPercent >= 0 ? '+' : ''}{trendPercent}%
                    </Text>
                  </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <LinearGradient colors={['#EDE9FE', '#DDD6FE']} style={styles.statIcon}>
                      <Text style={styles.statEmoji}>📦</Text>
                    </LinearGradient>
                    <View>
                      <Text style={styles.statValue}>{orderCount}</Text>
                      <Text style={styles.statLabel}>đơn hàng</Text>
                    </View>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <LinearGradient colors={['#D1FAE5', '#A7F3D0']} style={styles.statIcon}>
                      <Text style={styles.statEmoji}>💰</Text>
                    </LinearGradient>
                    <View>
                      <Text style={styles.statValue}>{orderCount > 0 ? formatMoney(Math.round(revenue / orderCount)) : '0'}đ</Text>
                      <Text style={styles.statLabel}>TB/đơn</Text>
                    </View>
                  </View>
                </View>

                {/* Chart */}
                <View style={styles.chartWrap}>
                  <RevenueChart orders={orders} />
                </View>
              </GlassCard>
            )}

            {/* ─── Onboarding Card ─── */}
            {showOnboarding && renderAnimatedCard(1,
              <LinearGradient
                colors={Gradients.warm}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.onboardingCard}
              >
                <TouchableOpacity style={styles.onboardingClose} onPress={() => setShowOnboarding(false)}>
                  <View style={styles.closeCircle}><Text style={styles.closeIcon}>✕</Text></View>
                </TouchableOpacity>

                <Text style={styles.onboardingTitle}>🚀 Bắt đầu nhanh</Text>
                <Text style={styles.onboardingSub}>3 bước để bán hàng cùng Hi-Note</Text>

                <View style={styles.stepsContainer}>
                  {[
                    { icon: '✨', text: 'Tạo đơn bằng AI', action: goToSell, link: 'Thử ngay' },
                    { icon: '🔊', text: 'Bật thông báo tiền về', action: () => navigation.navigate('Notifications'), link: 'Thiết lập' },
                    { icon: '📦', text: 'Thêm sản phẩm', action: goToProducts, link: 'Thêm' },
                  ].map((step, i) => (
                    <TouchableOpacity key={i} style={styles.stepItem} onPress={step.action} activeOpacity={0.7}>
                      <View style={styles.stepLeft}>
                        <View style={styles.stepIconWrap}>
                          <Text style={styles.stepIcon}>{step.icon}</Text>
                        </View>
                        <Text style={styles.stepText}>{step.text}</Text>
                      </View>
                      <Text style={styles.stepLink}>{step.link} →</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </LinearGradient>
            )}

            {/* ─── Quick Actions ─── */}
            {renderAnimatedCard(2,
              <View style={styles.quickGrid}>
                {[
                  { icon: '🛍️', label: 'Bán hàng', gradient: Gradients.primary, onPress: goToSell },
                  { icon: '💸', label: 'Chi phí', gradient: ['#F59E0B', '#D97706'] as [string, string], onPress: goToExpense },
                  { icon: '📦', label: 'Hàng hóa', gradient: ['#3B82F6', '#2563EB'] as [string, string], onPress: goToProducts },
                  { icon: '📈', label: 'Báo cáo', gradient: Gradients.purple, onPress: () => navigation.navigate('Reports') },
                ].map((item, i) => (
                  <QuickCard key={i} {...item} />
                ))}
              </View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
        </SafeAreaView>

        <DatePickerModal
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelect={handleDateSelect}
          initialDate={customDate}
          minDate={user?.createdAt ? new Date(user.createdAt) : undefined}
        />
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 400 },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  greetingSmall: { fontSize: 14, color: '#64748B', fontWeight: '500', marginBottom: 2 },
  greetingName: { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },

  aiBtn: {
    borderRadius: 22,
    ...Shadows.purple,
  },
  aiBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 6,
  },
  aiBtnIcon: { fontSize: 14, color: '#fff' },
  aiBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Tabs
  tabsContainer: { marginBottom: 4 },
  tabsRow: { paddingHorizontal: 20, paddingVertical: 8, gap: 8 },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.primary,
  },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#FFF', fontWeight: '700' },

  content: { flex: 1, paddingHorizontal: 16 },

  // Revenue Card
  revenueCard: { marginBottom: 16, marginTop: 4 },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  revenueLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 6 },
  revenueRow: { flexDirection: 'row', alignItems: 'baseline' },
  revenueMoney: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },

  trendBadge: {
    flexDirection: 'row',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    alignItems: 'center',
  },
  trendDown: { backgroundColor: '#FEE2E2' },
  trendText: { fontSize: 12, fontWeight: '800', color: '#16A34A' },
  trendTextDown: { color: '#EF4444' },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statEmoji: { fontSize: 18 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  statDivider: { width: 1, height: 32, backgroundColor: '#E2E8F0', marginHorizontal: 8 },

  chartWrap: { marginTop: 4 },

  // Onboarding
  onboardingCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    ...Shadows.md,
  },
  onboardingClose: { position: 'absolute', top: 14, right: 14, zIndex: 10 },
  closeCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
  closeIcon: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold' },
  onboardingTitle: { fontSize: 18, fontWeight: '800', color: '#831843', marginBottom: 4 },
  onboardingSub: { fontSize: 13, color: '#BE185D', fontWeight: '500', marginBottom: 16 },
  stepsContainer: { gap: 8 },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 12,
    borderRadius: 16,
  },
  stepLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
  stepIcon: { fontSize: 16 },
  stepText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  stepLink: { fontSize: 13, fontWeight: '700', color: '#7C3AED' },

  // Quick Actions
  quickGrid: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 22,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickIcon: { fontSize: 22 },
  quickLabel: { fontSize: 12, fontWeight: '800', color: '#334155', letterSpacing: -0.2 },
});
