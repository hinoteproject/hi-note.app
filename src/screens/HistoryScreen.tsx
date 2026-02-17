import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import AnimatedScreen from '../components/AnimatedScreen';
import { Colors, Gradients, Shadows } from '../constants/theme';
import { Order } from '../types';

export function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { orders, updateOrderPayment } = useStore();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = useMemo(() => [
    { key: 'all', label: 'Tất cả', count: orders.length, emoji: '📋' },
    { key: 'paid', label: 'Đã TT', count: orders.filter(o => o.paymentStatus === 'paid').length, emoji: '✅' },
    { key: 'pending', label: 'Chờ TT', count: orders.filter(o => o.paymentStatus === 'pending').length, emoji: '⏳' },
  ], [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (activeFilter === 'paid' && o.paymentStatus !== 'paid') return false;
      if (activeFilter === 'pending' && o.paymentStatus !== 'pending') return false;
      if (searchText.trim()) {
        const lower = searchText.toLowerCase();
        const nameMatch = o.items.some(i => i.productName.toLowerCase().includes(lower));
        const billNameMatch = (o.billName || '').toLowerCase().includes(lower);
        const tableMatch = (o.tableNumber || '').toLowerCase().includes(lower);
        if (!nameMatch && !billNameMatch && !tableMatch) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, activeFilter, searchText]);

  const formatMoney = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const renderOrder = ({ item, index }: { item: Order; index: number }) => {
    const isPaid = item.paymentStatus === 'paid';
    const totalItems = item.items.reduce((sum, i) => sum + i.quantity, 0);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('InvoiceDetail', { orderId: item.id })}
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: isPaid ? '#10B981' : '#F59E0B' }]} />

        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.billName} numberOfLines={1}>{item.billName || 'Khách lẻ'}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.orderTime}>{formatTime(item.createdAt)}</Text>
                {item.tableNumber && (
                  <View style={styles.tableBadge}>
                    <Text style={styles.tableBadgeText}>🪑 Bàn {item.tableNumber}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusPending]}>
              <Text style={[styles.statusText, isPaid ? styles.statusTextPaid : styles.statusTextPending]}>
                {isPaid ? '✓ Đã TT' : '⏳ Chờ'}
              </Text>
            </View>
          </View>

          {/* Items */}
          <View style={styles.itemsSection}>
            {item.items.slice(0, 2).map((orderItem, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemQty}>{orderItem.quantity}×</Text>
                <Text style={styles.itemName} numberOfLines={1}>{orderItem.productName}</Text>
                <Text style={styles.itemPrice}>{formatMoney(orderItem.subtotal)}đ</Text>
              </View>
            ))}
            {item.items.length > 2 && (
              <Text style={styles.moreItems}>+{item.items.length - 2} món khác</Text>
            )}
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <Text style={styles.totalLabel}>{totalItems} món</Text>
            <Text style={[styles.totalAmount, { color: isPaid ? Colors.primary : Colors.orange }]}>
              {formatMoney(item.totalAmount)}đ
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <LinearGradient colors={Gradients.header} style={styles.gradient} />

        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Hoá đơn</Text>
            <Text style={styles.subtitle}>{orders.length} đơn hàng</Text>
          </View>

          {/* Glass Search Bar */}
          <View style={styles.filterSection}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm tên món, bàn, khách..."
                placeholderTextColor="#94A3B8"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {filters.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                  onPress={() => setActiveFilter(f.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                  <View style={[styles.badge, activeFilter === f.key && styles.badgeActive]}>
                    <Text style={[styles.badgeText, activeFilter === f.key && styles.badgeTextActive]}>
                      {f.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Order List */}
          <FlatList
            data={filteredOrders}
            keyExtractor={item => item.id}
            renderItem={renderOrder}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Text style={styles.emptyIcon}>📝</Text>
                </View>
                <Text style={styles.emptyTitle}>Chưa có hoá đơn nào</Text>
                <Text style={styles.emptySub}>
                  {searchText ? `Không tìm thấy "${searchText}"` : 'Các đơn hàng sẽ xuất hiện tại đây'}
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 350 },
  safeArea: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 2 },

  filterSection: { paddingHorizontal: 16, marginBottom: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...Shadows.md,
  },
  searchIcon: { fontSize: 15, marginRight: 8, opacity: 0.6 },
  searchInput: { flex: 1, fontSize: 15, color: '#1E293B', height: '100%' },
  clearIcon: { fontSize: 14, color: '#94A3B8', padding: 4 },

  filterRow: { gap: 8, paddingBottom: 4 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadows.primary,
  },
  filterText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#FFF' },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  badgeTextActive: { color: '#FFF' },

  listContent: { padding: 16, paddingBottom: 110 },

  // Order Card — Premium
  orderCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...Shadows.card,
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  cardContent: { flex: 1, padding: 16 },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardHeaderLeft: { flex: 1, marginRight: 8 },
  billName: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderTime: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  tableBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tableBadgeText: { fontSize: 11, fontWeight: '700', color: '#0369A1' },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPaid: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 11, fontWeight: '800' },
  statusTextPaid: { color: '#16A34A' },
  statusTextPending: { color: '#D97706' },

  itemsSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    gap: 4,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemQty: { fontSize: 12, fontWeight: '700', color: Colors.primary, minWidth: 22 },
  itemName: { flex: 1, fontSize: 13, color: '#334155', fontWeight: '500' },
  itemPrice: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  moreItems: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginTop: 2 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 13, fontWeight: '500', color: '#94A3B8' },
  totalAmount: { fontSize: 20, fontWeight: '800' },

  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    ...Shadows.md,
  },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
});
