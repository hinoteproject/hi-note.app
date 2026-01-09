import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { Colors, Fonts, Radius, Spacing, Shadows } from '../constants/theme';
import { Order } from '../types';

export function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { orders, updateOrderPayment } = useStore();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedMode, setSelectedMode] = useState<'day'|'month'|'year'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const filters = [
    { key: 'all', label: 'Tất cả', count: orders.length },
    { key: 'paid', label: 'Đã TT', count: orders.filter(o => o.paymentStatus === 'paid').length },
    { key: 'pending', label: 'Chờ TT', count: orders.filter(o => o.paymentStatus === 'pending').length },
  ];

  const filteredOrders = orders.filter(o => {
    // filter by status
    if (activeFilter === 'paid' && o.paymentStatus !== 'paid') return false;
    if (activeFilter === 'pending' && o.paymentStatus !== 'pending') return false;

    // filter by search text
    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      if (!o.items.some(i => i.productName.toLowerCase().includes(lower)) && !(o.tableNumber || '').toLowerCase().includes(lower)) {
        return false;
      }
    }

    // filter by selected date/mode
    const od = new Date(o.createdAt);
    if (selectedMode === 'day') {
      const a = new Date(selectedDate); a.setHours(0,0,0,0);
      const b = new Date(od); b.setHours(0,0,0,0);
      return a.getTime() === b.getTime();
    } else if (selectedMode === 'month') {
      return od.getFullYear() === selectedDate.getFullYear() && od.getMonth() === selectedDate.getMonth();
    } else if (selectedMode === 'year') {
      return od.getFullYear() === selectedDate.getFullYear();
    }
    return true;
  });

  const formatMoney = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleMarkPaid = (orderId: string) => {
    Alert.alert('✓ Xác nhận thanh toán', 'Đánh dấu đơn này đã thanh toán?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xác nhận', onPress: () => updateOrderPayment(orderId, 'paid') },
    ]);
  };

  const renderOrder = ({ item, index }: { item: Order; index: number }) => {
    const isPaid = item.paymentStatus === 'paid';
    
    return (
      <TouchableOpacity style={styles.orderCard} activeOpacity={0.7} onPress={() => navigation.navigate('InvoiceDetail', { orderId: item.id })}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.orderNumber, isPaid ? styles.orderNumberPaid : styles.orderNumberPending]}>
              <Text style={[styles.orderNumberText, { color: isPaid ? Colors.green : Colors.orange }]}>
                #{orders.length - index}
              </Text>
            </View>
            <View>
              <Text style={styles.orderCustomer}>
                {item.tableNumber ? `🪑 Bàn ${item.tableNumber}` : '👤 Khách lẻ'}
              </Text>
              <Text style={styles.orderTime}>{formatTime(item.createdAt)}</Text>
            </View>
          </View>
          
          <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusPending]}>
            <Text style={styles.statusIcon}>{isPaid ? '✓' : '⏳'}</Text>
            <Text style={[styles.statusText, isPaid ? styles.statusTextPaid : styles.statusTextPending]}>
              {isPaid ? 'Đã TT' : 'Chờ TT'}
            </Text>
          </View>
        </View>

        <View style={styles.orderItems}>
          {item.items.slice(0, 3).map((orderItem, idx) => (
            <View key={idx} style={styles.orderItemRow}>
              <Text style={styles.orderItemName}>
                {orderItem.productName}
                <Text style={styles.orderItemQty}> ×{orderItem.quantity}</Text>
              </Text>
              <Text style={styles.orderItemPrice}>{formatMoney(orderItem.subtotal)}đ</Text>
            </View>
          ))}
          {item.items.length > 3 && (
            <Text style={styles.moreItems}>+{item.items.length - 3} sản phẩm khác...</Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <View>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={[styles.totalAmount, { color: isPaid ? Colors.green : Colors.text }]}>
              {formatMoney(item.totalAmount)}đ
            </Text>
          </View>
          
          {!isPaid && (
            <TouchableOpacity style={styles.markPaidBtn} onPress={() => handleMarkPaid(item.id)}>
              <LinearGradient colors={[Colors.greenLight, Colors.green]} style={styles.markPaidGradient}>
                <Text style={styles.markPaidText}>✓ Đã thanh toán</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <LinearGradient colors={[Colors.primaryBg, '#DBEAFE']} style={styles.emptyIconGradient}>
          <Text style={styles.emptyIcon}>📋</Text>
        </LinearGradient>
      </View>
      <Text style={styles.emptyTitle}>Chưa có hoá đơn</Text>
      <Text style={styles.emptyDesc}>Hoá đơn sẽ xuất hiện ở đây{'\n'}sau khi bạn tạo đơn hàng</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Bán hàng')}>
        <LinearGradient colors={[Colors.purpleLight, Colors.purple]} style={styles.emptyBtnGradient}>
          <Text style={styles.emptyBtnText}>🎤 Tạo đơn mới</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const paidRevenue = filteredOrders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#E8F4FE', '#E0EAFC', '#F8FAFC']} style={styles.gradient} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Hoá đơn</Text>
            <Text style={styles.subTitle}>{selectedMode === 'day' ? selectedDate.toLocaleDateString() : selectedMode === 'month' ? `${selectedDate.getMonth()+1}/${selectedDate.getFullYear()}` : selectedDate.getFullYear()}</Text>
          </View>
          <TouchableOpacity
            style={styles.calendarBtn}
            onPress={() => {
              setSelectedMode(m => m === 'day' ? 'month' : m === 'month' ? 'year' : 'day');
            }}
          >
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tổng doanh thu</Text>
            <Text style={styles.summaryValue}>{formatMoney(totalRevenue)}đ</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Đã thu</Text>
            <Text style={[styles.summaryValue, { color: Colors.green }]}>{formatMoney(paidRevenue)}đ</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm hoá đơn..."
              placeholderTextColor={Colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.filterTabs}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterTab, activeFilter === filter.key && styles.filterTabActive]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[styles.filterTabText, activeFilter === filter.key && styles.filterTabTextActive]}>
                {filter.label}
              </Text>
              <View style={[styles.filterCount, activeFilter === filter.key && styles.filterCountActive]}>
                <Text style={[styles.filterCountText, activeFilter === filter.key && styles.filterCountTextActive]}>
                  {filter.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {filteredOrders.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={filteredOrders}
            renderItem={renderOrder}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 300 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  calendarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calendarIcon: { fontSize: 20 },

  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0,
    ...Shadows.card,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: Colors.text },
  summaryDivider: { width: 1, backgroundColor: Colors.borderLight, marginHorizontal: 12 },

  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  clearSearch: { fontSize: 16, color: Colors.textMuted, padding: 4 },

  filterTabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterTabText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginRight: 6 },
  filterTabTextActive: { color: Colors.white, fontWeight: '600' },
  filterCount: { backgroundColor: Colors.inputBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  filterCountText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  filterCountTextActive: { color: Colors.white },

  listContent: { paddingHorizontal: 20, paddingBottom: 120 },

  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0,
    ...Shadows.card,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  orderNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderNumberPaid: { backgroundColor: Colors.greenBg },
  orderNumberPending: { backgroundColor: Colors.orangeBg },
  orderNumberText: { fontSize: 12, fontWeight: '700' },
  orderCustomer: { fontSize: 15, fontWeight: '600', color: Colors.text },
  orderTime: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPaid: { backgroundColor: Colors.greenBg },
  statusPending: { backgroundColor: Colors.orangeBg },
  statusIcon: { fontSize: 12, marginRight: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusTextPaid: { color: Colors.green },
  statusTextPending: { color: Colors.orange },

  orderItems: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  orderItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderItemName: { fontSize: 14, color: Colors.text },
  orderItemQty: { color: Colors.textMuted },
  orderItemPrice: { fontSize: 14, color: Colors.textSecondary },
  moreItems: { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },

  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  totalLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  totalAmount: { fontSize: 20, fontWeight: '700' },
  markPaidBtn: { borderRadius: 20, overflow: 'hidden' },
  markPaidGradient: { paddingHorizontal: 16, paddingVertical: 10 },
  markPaidText: { fontSize: 13, fontWeight: '600', color: Colors.white },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIconWrap: { marginBottom: 20 },
  emptyIconGradient: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyBtn: { borderRadius: 24, overflow: 'hidden' },
  emptyBtnGradient: { paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  subTitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
