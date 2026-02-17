import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import AnimatedScreen from '../components/AnimatedScreen';
import GlassCard from '../components/GlassCard';
import { Colors, Shadows, Gradients } from '../constants/theme';
import { formatMoney } from '../utils/format';
import { printInvoice, shareInvoicePDF } from '../utils/printInvoice';
import { Toast } from '../components/ToastNotification';

export function InvoiceDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { orderId } = route.params || {};
  const { orders, deleteOrder, setCurrentOrder, updateOrderPayment, user } = useStore();

  const order = orders.find((o) => o.id === orderId);

  const handlePrint = async () => {
    if (!order) return;
    const result = await printInvoice(order, user?.business || 'Hi-Note');
    if (!result.success) {
      Toast.show({ type: 'error', message: 'Không thể in hóa đơn' });
    }
  };

  const handleSharePDF = async () => {
    if (!order) return;
    const result = await shareInvoicePDF(order, user?.business || 'Hi-Note');
    if (!result.success) {
      Toast.show({ type: 'error', message: 'Không thể chia sẻ PDF' });
    }
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFoundIcon}>📋</Text>
          <Text style={styles.notFoundText}>Hoá đơn không tồn tại</Text>
          <TouchableOpacity style={styles.notFoundBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.notFoundBtnText}>← Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isPaid = order.paymentStatus === 'paid';

  const handleEdit = () => {
    setCurrentOrder(order.items, order.tableNumber);
    navigation.navigate('Sell');
  };

  const handleDelete = () => {
    Alert.alert('Xác nhận', 'Xoá hoá đơn này?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá', style: 'destructive', onPress: async () => {
          await deleteOrder(order.id);
          Toast.show({ type: 'success', message: 'Đã xoá hoá đơn' });
          navigation.goBack();
        }
      }
    ]);
  };

  const handleMarkPaid = () => {
    Alert.alert('✓ Xác nhận thanh toán', 'Đánh dấu đơn này đã thanh toán?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận', onPress: () => {
          updateOrderPayment(order.id, 'paid');
          Toast.show({ type: 'success', title: '💰 Đã thanh toán!', message: `${formatMoney(order.totalAmount)}` });
        }
      },
    ]);
  };

  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('vi-VN', {
      weekday: 'long',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <LinearGradient colors={Gradients.header} locations={[0, 0.3, 1]} style={styles.gradient} />

        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={styles.headerBackIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết hoá đơn</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Invoice Card */}
            <GlassCard style={styles.invoiceCard} intensity="strong" noPadding>
              {/* Accent */}
              <LinearGradient
                colors={isPaid ? ['#10B981', '#059669'] : Gradients.primary}
                style={styles.accent}
              />

              {/* Status Badge */}
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusPending]}>
                  <Text style={styles.statusIcon}>{isPaid ? '✓' : '⏳'}</Text>
                  <Text style={[styles.statusText, isPaid ? styles.statusTextPaid : styles.statusTextPending]}>
                    {isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                  </Text>
                </View>
              </View>

              {/* Order Info */}
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>{order.billName || `Đơn #${order.id.slice(-6).toUpperCase()}`}</Text>
                <Text style={styles.orderDate}>{formatDateTime(order.createdAt)}</Text>
                {order.tableNumber && (
                  <View style={styles.tableBadge}>
                    <Text style={styles.tableIcon}>🪑</Text>
                    <Text style={styles.tableText}>Bàn {order.tableNumber}</Text>
                  </View>
                )}
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Items */}
              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>Chi tiết đơn hàng</Text>
                {order.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      <Text style={styles.itemMeta}>{item.quantity} × {formatMoney(item.unitPrice)}</Text>
                    </View>
                    <Text style={styles.itemPrice}>{formatMoney(item.subtotal)}</Text>
                  </View>
                ))}
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Total */}
              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tổng tiền hàng</Text>
                  <Text style={styles.totalValue}>{formatMoney(order.totalAmount)}</Text>
                </View>
                <View style={styles.totalRowMain}>
                  <Text style={styles.totalLabelMain}>💰 Tổng cộng</Text>
                  <Text style={[styles.totalValueMain, { color: isPaid ? '#10B981' : Colors.primary }]}>
                    {formatMoney(order.totalAmount)}
                  </Text>
                </View>
              </View>

              {/* Payment Info */}
              {order.paymentMethod && (
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentLabel}>Phương thức</Text>
                  <View style={styles.paymentBadge}>
                    <Text style={styles.paymentBadgeText}>
                      {order.paymentMethod === 'cash' ? '💵 Tiền mặt' : order.paymentMethod === 'transfer' ? '📱 Chuyển khoản' : '⏳ Chưa TT'}
                    </Text>
                  </View>
                </View>
              )}
              {order.paidAt && (
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentLabel}>Thanh toán lúc</Text>
                  <Text style={styles.paymentValue}>{formatDateTime(order.paidAt)}</Text>
                </View>
              )}
              <View style={{ height: 8 }} />
            </GlassCard>

            {/* Actions */}
            <View style={styles.actions}>
              {/* Print & Share */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtnIcon, { backgroundColor: '#EFF6FF' }]} onPress={handlePrint} activeOpacity={0.7}>
                  <Text style={styles.actionEmoji}>🖨️</Text>
                  <Text style={[styles.actionBtnLabel, { color: '#3B82F6' }]}>In</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtnIcon, { backgroundColor: '#ECFDF5' }]} onPress={handleSharePDF} activeOpacity={0.7}>
                  <Text style={styles.actionEmoji}>📤</Text>
                  <Text style={[styles.actionBtnLabel, { color: '#10B981' }]}>Chia sẻ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtnIcon, { backgroundColor: '#FFF7ED' }]} onPress={handleEdit} activeOpacity={0.7}>
                  <Text style={styles.actionEmoji}>✏️</Text>
                  <Text style={[styles.actionBtnLabel, { color: '#F59E0B' }]}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtnIcon, { backgroundColor: '#FEF2F2' }]} onPress={handleDelete} activeOpacity={0.7}>
                  <Text style={styles.actionEmoji}>🗑️</Text>
                  <Text style={[styles.actionBtnLabel, { color: '#EF4444' }]}>Xoá</Text>
                </TouchableOpacity>
              </View>

              {!isPaid && (
                <TouchableOpacity style={styles.markPaidBtn} onPress={handleMarkPaid} activeOpacity={0.8}>
                  <LinearGradient colors={['#10B981', '#059669']} style={styles.markPaidGradient}>
                    <Text style={styles.markPaidIcon}>✓</Text>
                    <Text style={styles.markPaidText}>Đánh dấu đã thanh toán</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 300 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerBackBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center', alignItems: 'center',
    ...Shadows.sm,
  },
  headerBackIcon: { fontSize: 20, color: '#334155' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },

  content: { flex: 1, paddingHorizontal: 16 },

  invoiceCard: { marginTop: 8, overflow: 'hidden' },
  accent: { height: 4, borderTopLeftRadius: 22, borderTopRightRadius: 22, marginBottom: 16 },

  statusRow: { paddingHorizontal: 20, marginBottom: 12 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  statusPaid: { backgroundColor: '#ECFDF5' },
  statusPending: { backgroundColor: '#FFFBEB' },
  statusIcon: { fontSize: 14, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: '700' },
  statusTextPaid: { color: '#10B981' },
  statusTextPending: { color: '#F59E0B' },

  orderInfo: { paddingHorizontal: 20, marginBottom: 16 },
  orderNumber: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4, letterSpacing: -0.3 },
  orderDate: { fontSize: 13, color: '#94A3B8', marginBottom: 8 },
  tableBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  tableIcon: { fontSize: 14, marginRight: 6 },
  tableText: { fontSize: 13, fontWeight: '600', color: '#3B82F6' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 20 },

  itemsSection: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  itemMeta: { fontSize: 13, color: '#94A3B8' },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#334155' },

  totalSection: { paddingHorizontal: 20, paddingVertical: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontSize: 14, color: '#94A3B8' },
  totalValue: { fontSize: 14, color: '#334155', fontWeight: '600' },
  totalRowMain: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  totalLabelMain: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  totalValueMain: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },

  paymentInfo: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#F8FAFC',
  },
  paymentLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  paymentValue: { fontSize: 13, fontWeight: '600', color: '#334155' },
  paymentBadge: {
    backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
  },
  paymentBadgeText: { fontSize: 13, fontWeight: '600', color: '#334155' },

  // Actions
  actions: { marginTop: 20, gap: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtnIcon: {
    flex: 1, alignItems: 'center', paddingVertical: 16,
    borderRadius: 16, ...Shadows.sm,
  },
  actionEmoji: { fontSize: 22, marginBottom: 6 },
  actionBtnLabel: { fontSize: 12, fontWeight: '700' },

  markPaidBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 4 },
  markPaidGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18,
  },
  markPaidIcon: { fontSize: 18, color: '#FFF', fontWeight: '800', marginRight: 10 },
  markPaidText: { fontSize: 16, fontWeight: '800', color: '#FFF' },

  // Not found
  notFoundWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  notFoundIcon: { fontSize: 64, marginBottom: 16 },
  notFoundText: { fontSize: 16, color: '#64748B', marginBottom: 20 },
  notFoundBtn: { paddingHorizontal: 24, paddingVertical: 14, backgroundColor: Colors.primary, borderRadius: 16 },
  notFoundBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
