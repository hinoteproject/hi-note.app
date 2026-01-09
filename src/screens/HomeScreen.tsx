import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import AnimatedScreen from '../components/AnimatedScreen';
import DatePickerModal from '../components/DatePickerModal';
import RevenueChart from '../components/RevenueChart';
import { Colors, Shadows } from '../constants/theme';

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

  const getFilteredData = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const filtered = orders.filter(o => {
      if (o.paymentStatus !== 'paid') return false;
      const d = new Date(o.createdAt);
      switch (activeTab) {
        case 'today': return d >= today;
        case 'custom': {
          if (customMode === 'day') {
            const target = new Date(customDate);
            target.setHours(0,0,0,0);
            const od = new Date(d);
            od.setHours(0,0,0,0);
            return od.getTime() === target.getTime();
          } else if (customMode === 'month') {
            return d.getFullYear() === customDate.getFullYear() && d.getMonth() === customDate.getMonth();
          } else {
            return d.getFullYear() === customDate.getFullYear();
          }
        }
        case 'yesterday': return d >= yesterday && d < today;
        case '7days': return d >= weekAgo;
        case 'month': return d >= monthStart;
        case 'lastMonth': return d >= lastMonthStart && d <= lastMonthEnd;
        case 'quarter': return d >= quarterStart;
        case 'year': return d >= yearStart;
        default: return true;
      }
    });

    return {
      revenue: filtered.reduce((sum, o) => sum + o.totalAmount, 0),
      orderCount: filtered.length,
    };
  };

  const { revenue, orderCount } = getFilteredData();

  const formatMoney = (n: number) => {
    if (n === 0) return '0';
    return new Intl.NumberFormat('vi-VN').format(n);
  };

  const tabLabels: Record<TimeFilter, string> = {
    today: 'Hôm nay',
    yesterday: 'Hôm qua',
    '7days': '7 ngày qua',
    month: 'Tháng này',
    lastMonth: 'Tháng trước',
    quarter: 'Quý này',
    year: 'Năm nay',
    custom: 'Tuỳ chỉnh',
  };

  const mainTabs: TimeFilter[] = ['today', 'yesterday', 'month'];

  const goToSell = () => navigation.navigate('Bán hàng');
  const goToExpense = () => navigation.navigate('Chi phí');
  const goToProducts = () => navigation.navigate('Bán hàng');

  const getCustomLabel = () => {
    if (customMode === 'day') {
      return `${customDate.getDate()}/${customDate.getMonth() + 1}/${customDate.getFullYear()}`;
    } else if (customMode === 'month') {
      return `Tháng ${customDate.getMonth() + 1}/${customDate.getFullYear()}`;
    } else {
      return `Năm ${customDate.getFullYear()}`;
    }
  };

  const handleDateSelect = (date: Date, mode: 'day' | 'month' | 'year') => {
    setCustomDate(date);
    setCustomMode(mode);
    setActiveTab('custom');
  };

  return (
    <AnimatedScreen>
      <View style={styles.container}>
      <LinearGradient colors={['#E8F4FE', '#E0EAFC', '#F8FAFC']} style={styles.gradient} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>✏️</Text>
            </View>
            <Text style={styles.logoStar}>✨</Text>
            <Text style={styles.logoText}>Hi-Note</Text>
          </View>
          <TouchableOpacity style={styles.aiBtn} onPress={goToSell}>
            <Text style={styles.aiBtnIcon}>🤖</Text>
            <Text style={styles.aiBtnText}>Trợ lý AI</Text>
          </TouchableOpacity>
        </View>

        {/* Time Filter Tabs */}
        <View style={styles.tabsRow}>
          {mainTabs.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tabLabels[tab]}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.tab, activeTab === 'custom' && styles.tabActive]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.tabText, activeTab === 'custom' && styles.tabTextActive]}>
              {activeTab === 'custom' ? getCustomLabel() : '📅 Chọn ngày'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Onboarding Card */}
          {showOnboarding && (
            <View style={styles.onboardingCard}>
              <TouchableOpacity 
                style={styles.onboardingClose}
                onPress={() => setShowOnboarding(false)}
              >
                <Text style={styles.onboardingCloseIcon}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.onboardingTitle}>Bắt đầu bán cùng Hi-Note</Text>
              
              <View style={styles.onboardingItem}>
                <View style={styles.onboardingCheck}>
                  <Text style={styles.onboardingCheckIcon}>✓</Text>
                </View>
                <Text style={styles.onboardingText}>Tạo đơn bằng AI</Text>
                <TouchableOpacity onPress={goToSell}>
                  <Text style={styles.onboardingAction}>Thử ngay</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.onboardingItem}>
                <Text style={styles.onboardingIcon}>🔔</Text>
                <Text style={styles.onboardingText}>Báo Ting ting tiền về</Text>
                <TouchableOpacity>
                  <Text style={styles.onboardingAction}>Thiết lập</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.onboardingItem}>
                <Text style={styles.onboardingIcon}>📖</Text>
                <Text style={styles.onboardingText}>Xem hướng dẫn</Text>
                <TouchableOpacity>
                  <Text style={styles.onboardingAction}>Xem</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                {activeTab === 'custom'
                  ? `Doanh thu ${getCustomLabel()}`
                  : `Doanh thu ${tabLabels[activeTab].toLowerCase()}`}
              </Text>
              <Text style={styles.statValue}>{formatMoney(revenue)}đ</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Số đơn</Text>
              <Text style={styles.statValue}>{orderCount}</Text>
            </View>
          </View>

          {/* Revenue Chart */}
          <RevenueChart orders={orders} />

          {/* Quick Stats Row */}
          <View style={styles.quickStatsRow}>
            <TouchableOpacity style={styles.quickStatCard} onPress={goToExpense}>
              <View style={styles.quickStatHeader}>
                <Text style={styles.quickStatLabel}>Chi hôm nay</Text>
                <Text style={styles.quickStatArrow}>›</Text>
              </View>
              <Text style={styles.quickStatAction}>Thêm ngay</Text>
            </TouchableOpacity>
            
            <View style={styles.quickStatCard}>
              <View style={styles.quickStatHeader}>
                <Text style={styles.quickStatLabel}>Chênh lệch</Text>
                <Text style={styles.quickStatEye}>👁</Text>
              </View>
              <Text style={styles.quickStatValueGreen}>{formatMoney(revenue)}đ</Text>
            </View>
          </View>

          {/* 3-day Summary */}
          <View style={styles.threeDayCard}>
            <Text style={styles.threeDayTitle}>Thống kê 3 ngày gần nhất</Text>
            <View style={styles.threeDayList}>
              {(() => {
                const now = new Date();
                const days = [0,1,2].map(offset => {
                  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
                  const key = d.toDateString();
                  const dayRevenue = orders
                    .filter(o => {
                      if (o.paymentStatus !== 'paid') return false;
                      const od = new Date(o.createdAt);
                      od.setHours(0,0,0,0);
                      return od.toDateString() === key;
                    })
                    .reduce((s, o) => s + o.totalAmount, 0);
                  const dayOrders = orders.filter(o => {
                    const od = new Date(o.createdAt);
                    od.setHours(0,0,0,0);
                    return od.toDateString() === key;
                  }).length;
                  return { date: d, revenue: dayRevenue, orders: dayOrders };
                });

                return days.map((day) => (
                  <View key={day.date.toDateString()} style={styles.threeDayRow}>
                    <Text style={styles.threeDayDate}>
                      {day.date.getDate().toString().padStart(2,'0')}/{(day.date.getMonth()+1).toString().padStart(2,'0')}
                    </Text>
                    <Text style={styles.threeDayValue}>{formatMoney(day.revenue)}đ</Text>
                    <Text style={styles.threeDayCount}>{day.orders} đơn</Text>
                  </View>
                ));
              })()}
            </View>
          </View>

          {/* Best Sellers Section */}
          <View style={styles.bestSellersCard}>
            <Text style={styles.bestSellersTitle}>Hàng hóa bán chạy</Text>
            
            <View style={styles.emptyBestSellers}>
              <View style={styles.shopIllustration}>
                <Text style={styles.shopEmoji}>🏪</Text>
                <View style={styles.phoneSmall}>
                  <Text style={styles.phoneSmallEmoji}>📱</Text>
                </View>
              </View>
              <Text style={styles.emptyText}>
                Tự động tổng hợp doanh thu, không cần ghi sổ
              </Text>
              <TouchableOpacity style={styles.addProductBtn} onPress={goToProducts}>
                <Text style={styles.addProductText}>Thêm hàng hóa</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Date Picker Modal */}
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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoWrap: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: { fontSize: 16 },
  logoStar: { fontSize: 14, marginLeft: -4, marginTop: -12 },
  logoText: { fontSize: 22, fontWeight: '800', color: Colors.text, marginLeft: 4 },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  aiBtnIcon: { fontSize: 16, marginRight: 6 },
  aiBtnText: { fontSize: 13, fontWeight: '600', color: Colors.purple },

  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white, fontWeight: '600' },

  content: { flex: 1, paddingHorizontal: 16 },

  onboardingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  onboardingClose: { position: 'absolute', top: 12, right: 12, padding: 4 },
  onboardingCloseIcon: { fontSize: 16, color: Colors.textMuted },
  onboardingTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  onboardingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  onboardingCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  onboardingCheckIcon: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  onboardingIcon: { fontSize: 20, marginRight: 12 },
  onboardingText: { flex: 1, fontSize: 14, color: Colors.text },
  onboardingAction: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    ...Shadows.card,
  },
  statLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  statValue: { fontSize: 26, fontWeight: '700', color: Colors.primary },

  illustrationSection: { alignItems: 'center', paddingVertical: 24 },
  illustrationWrap: { position: 'relative', marginBottom: 16 },
  phoneIllustration: {
    width: 80,
    height: 100,
    backgroundColor: '#E0E7FF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneEmoji: { fontSize: 32 },
  handEmoji: { position: 'absolute', bottom: -10, right: -20 },
  handIcon: { fontSize: 28 },
  coinBadge: { position: 'absolute', top: -10, right: -10 },
  coinEmoji: { fontSize: 24 },
  illustrationText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },

  quickStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  quickStatCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickStatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  quickStatLabel: { fontSize: 13, color: Colors.textSecondary },
  quickStatArrow: { fontSize: 16, color: Colors.textMuted },
  quickStatEye: { fontSize: 14 },
  quickStatAction: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  quickStatValueGreen: { fontSize: 22, fontWeight: '700', color: Colors.green },

  threeDayCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  threeDayTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, color: Colors.text },
  threeDayList: {},
  threeDayRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 10, 
    borderTopWidth: 1, 
    borderTopColor: Colors.borderLight 
  },
  threeDayDate: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  threeDayValue: { fontSize: 13, fontWeight: '700', color: Colors.text, flex: 1, textAlign: 'center' },
  threeDayCount: { fontSize: 13, color: Colors.textSecondary, flex: 1, textAlign: 'right' },

  bestSellersCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bestSellersTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  emptyBestSellers: { alignItems: 'center', paddingVertical: 20 },
  shopIllustration: { position: 'relative', marginBottom: 16 },
  shopEmoji: { fontSize: 64 },
  phoneSmall: { position: 'absolute', bottom: -5, right: -15 },
  phoneSmallEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  addProductBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  addProductText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
