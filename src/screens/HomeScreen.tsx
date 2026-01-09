import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
// fallback simple date selector used when native datetimepicker is not installed
import { Colors, Fonts, Radius, Spacing, Shadows } from '../constants/theme';

type TimeFilter = 'today' | 'yesterday' | '7days' | 'month' | 'lastMonth' | 'quarter' | 'year' | 'custom';

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<TimeFilter>('month');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const orders = useStore(state => state.orders);
  const user = useStore(state => state.user);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [activeCustomDate, setActiveCustomDate] = useState<Date>(new Date());

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
          const target = new Date(activeCustomDate);
          target.setHours(0,0,0,0);
          const od = new Date(d);
          od.setHours(0,0,0,0);
          return od.getTime() === target.getTime();
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

  return (
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
            style={[styles.tab, !mainTabs.includes(activeTab) && styles.tabActive]}
            onPress={() => setShowTimeModal(true)}
          >
            <Text style={[styles.tabText, !mainTabs.includes(activeTab) && styles.tabTextActive]}>
              {!mainTabs.includes(activeTab) ? tabLabels[activeTab] : 'Khác'}
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
                  ? `Doanh thu ngày ${activeCustomDate.getDate().toString().padStart(2,'0')}/${(activeCustomDate.getMonth()+1).toString().padStart(2,'0')}/${activeCustomDate.getFullYear()}`
                  : `Doanh thu ${tabLabels[activeTab].toLowerCase()}`}
              </Text>
              <Text style={styles.statValue}>{formatMoney(revenue)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Số đơn</Text>
              <Text style={styles.statValue}>{orderCount}</Text>
            </View>
          </View>

          {/* Illustration Section */}
          <View style={styles.illustrationSection}>
            <View style={styles.illustrationWrap}>
              <View style={styles.phoneIllustration}>
                <Text style={styles.phoneEmoji}>📱</Text>
                <View style={styles.handEmoji}>
                  <Text style={styles.handIcon}>👆</Text>
                </View>
              </View>
              <View style={styles.coinBadge}>
                <Text style={styles.coinEmoji}>💰</Text>
              </View>
            </View>
            <Text style={styles.illustrationText}>
              Tự động tổng hợp doanh thu, không cần ghi sổ
            </Text>
          </View>

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
                <Text style={styles.quickStatLabel}>Chênh lệch t...</Text>
                <Text style={styles.quickStatEye}>👁</Text>
              </View>
              <Text style={styles.quickStatValueGreen}>{formatMoney(revenue)}</Text>
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

      {/* Time Filter Modal */}
      <Modal visible={showTimeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thời gian</Text>
              <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {Object.entries(tabLabels).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={styles.timeOption}
                onPress={() => {
                  if (key === 'custom') {
                    // open custom date picker
                    setShowCustomPicker(true);
                  } else {
                    setActiveTab(key as TimeFilter);
                  }
                  setShowTimeModal(false);
                }}
              >
                <Text style={[styles.timeOptionText, activeTab === key && styles.timeOptionActive]}>
                  {label}
                </Text>
                {activeTab === key && <Text style={styles.timeCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
      {/* Custom date picker modal (fallback simple selector) */}
      <Modal visible={showCustomPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn ngày</Text>
              <TouchableOpacity onPress={() => setShowCustomPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <View style={styles.simpleDateRow}>
                <TouchableOpacity
                  style={styles.dateAdjustBtn}
                  onPress={() => {
                    const d = new Date(activeCustomDate);
                    d.setDate(d.getDate() - 1);
                    // prevent choosing before account creation
                    const min = user?.createdAt ? new Date(user.createdAt) : new Date(2000,0,1);
                    min.setHours(0,0,0,0);
                    if (d < min) return;
                    setActiveCustomDate(d);
                  }}
                >
                  <Text style={styles.adjustText}>‹</Text>
                </TouchableOpacity>

                <View style={styles.dateDisplay}>
                  <Text style={styles.dateDisplayText}>
                    {activeCustomDate.toLocaleDateString()}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.dateAdjustBtn}
                  onPress={() => {
                    const d = new Date(activeCustomDate);
                    d.setDate(d.getDate() + 1);
                    setActiveCustomDate(d);
                  }}
                >
                  <Text style={styles.adjustText}>›</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 16, flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={[styles.btn, styles.confirmBtn]}
                  onPress={() => {
                    setActiveTab('custom');
                    setShowCustomPicker(false);
                    setShowTimeModal(false);
                  }}
                >
                  <Text style={styles.btnText}>Chọn</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => setShowCustomPicker(false)}
                >
                  <Text style={styles.btnText}>Huỷ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
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
    borderWidth: 0,
    ...Shadows.card,
  },
  statLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: '700', color: Colors.primary },

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
  quickStatValueGreen: { fontSize: 24, fontWeight: '700', color: Colors.green },

  bestSellersCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  threeDayCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    marginHorizontal: 2,
  },
  threeDayTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, color: Colors.text },
  threeDayList: { },
  threeDayRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  threeDayDate: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  threeDayValue: { fontSize: 13, fontWeight: '700', color: Colors.text, flex: 1, textAlign: 'center' },
  threeDayCount: { fontSize: 13, color: Colors.textSecondary, flex: 1, textAlign: 'right' },
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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  modalClose: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  timeOptionText: { fontSize: 16, color: Colors.text },
  timeOptionActive: { color: Colors.primary, fontWeight: '600' },
  timeCheck: { fontSize: 18, color: Colors.primary },
  /* simple date picker styles */
  simpleDateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateAdjustBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustText: { fontSize: 24, color: Colors.text },
  dateDisplay: { paddingHorizontal: 16 },
  dateDisplayText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtn: { backgroundColor: Colors.primary },
  cancelBtn: { backgroundColor: Colors.border },
  btnText: { color: Colors.white, fontWeight: '700' },
});
