import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import AnimatedScreen from '../components/AnimatedScreen';
import { Colors, Shadows } from '../constants/theme';
import { formatMoney } from '../utils/format';
import { printInvoice, shareInvoicePDF } from '../utils/printInvoice';

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
      Alert.alert('Lỗi', 'Không thể in hóa đơn');
    }
  };

  const handleSharePDF = async () => {
    if (!order) return;
    const result = await shareInvoicePDF(order, user?.business || 'Hi-Note');
    if (!result.success) {
      Alert.alert('Lỗi', 'Không thể chia sẻ PDF');
    }
  };
  
  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFoundWrap}>
          <Text style={styles.notFoundIcon}>📋</Text>
          <Text style={styles.notFoundText}>Hoá đơn không tồn tại</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isPaid = order.paymentStatus === 'paid';

  const handleEdit = () => {
    setCurrentOrder(order.items, order.tableNumber);
    const parentNav = navigation.getParent && navigation.getParent();
    if (parentNav && parentNav.navigate) {
      parentNav.navigate('Bán hàng');
    } else {
      navigation.navigate('Bán hàng');
    }
  };

  const handleDelete = () => {
    Alert.alert('Xác nhận', 'Xoá hoá đơn này?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: async () => {
        await deleteOrder(order.id);
        navigation.goBack();
      }}
    ]);
  };

  const handleMarkPaid = () => {
    Alert.alert('✓ Xác nhận thanh toán', 'Đánh dấu đơn này đã thanh toán?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xác nhận', onPress: () => updateOrderPayment(order.id, 'paid') },
    ]);
  };

  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <LinearGradient colors={['#E8F4FE', '#E0EAFC', '#F8FAFC']} style={styles.gradient} />
        
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.headerBackIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết hoá đơn</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Invoice Card */}
            <View style={styles.invoiceCard}>
              {/* Status Badge */}
              <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusPending]}>
                <Text style={styles.statusIcon}>{isPaid ? '✓' : '⏳'}</Text>
                <Text style={[styles.statusText, isPaid ? styles.statusTextPaid : styles.statusTextPending]}>
                  {isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                </Text>
              </View>

              {/* Order Info */}
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>Đơn #{order.id.slice(-6).toUpperCase()}</Text>
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
                    <Text style={styles.itemPrice}>{formatMoney(item.subtotal)}đ</Text>
                  </View>
                ))}
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Total */}
              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tổng tiền hàng</Text>
                  <Text style={styles.totalValue}>{formatMoney(order.totalAmount)}đ</Text>
                </View>
                <View style={styles.totalRowMain}>
                  <Text style={styles.totalLabelMain}>💰 Tổng cộng</Text>
                  <Text style={[styles.totalValueMain, { color: isPaid ? Colors.green : Colors.primary }]}>
                    {formatMoney(order.totalAmount)}đ
                  </Text>
                </View>
              </View>

              {/* Payment Info */}
              {order.paymentMethod && (
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentLabel}>Phương thức:</Text>
                  <Text style={styles.paymentValue}>
                    {order.paymentMethod === 'cash' ? '💵 Tiền mặt' : order.paymentMethod === 'transfer' ? '📱 Chuyển khoản' : '⏳ Chưa thanh toán'}
                  </Text>
                </View>
              )}
              {order.paidAt && (
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentLabel}>Thanh toán lúc:</Text>
                  <Text style={styles.paymentValue}>{formatDateTime(order.paidAt)}</Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {/* Print & Share */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtnPrint, { flex: 1 }]} onPress={handlePrint}>
                  <Text style={styles.actionBtnPrintText}>🖨️ In hóa đơn</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtnShare, { flex: 1 }]} onPress={handleSharePDF}>
                  <Text style={styles.actionBtnShareText}>📤 Chia sẻ PDF</Text>
                </TouchableOpacity>
              </View>

              {!isPaid && (
                <TouchableOpacity style={styles.actionBtn} onPress={handleMarkPaid}>
                  <LinearGradient colors={[Colors.greenLight, Colors.green]} style={styles.actionBtnGradient}>
                    <Text style={styles.actionBtnText}>✓ Đánh dấu đã thanh toán</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtnSecondary, { flex: 1 }]} onPress={handleEdit}>
                  <Text style={styles.actionBtnSecondaryText}>✏️ Chỉnh sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtnDanger, { flex: 1 }]} onPress={handleDelete}>
                  <Text style={styles.actionBtnDangerText}>🗑️ Xoá</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 300 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  headerBackIcon: { fontSize: 20, color: Colors.text },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },

  content: { flex: 1, paddingHorizontal: 20 },

  invoiceCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    ...Shadows.card,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusPaid: { backgroundColor: Colors.greenBg },
  statusPending: { backgroundColor: Colors.orangeBg },
  statusIcon: { fontSize: 14, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: '600' },
  statusTextPaid: { color: Colors.green },
  statusTextPending: { color: Colors.orange },

  orderInfo: { marginBottom: 16 },
  orderNumber: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  orderDate: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tableIcon: { fontSize: 14, marginRight: 6 },
  tableText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 16 },

  itemsSection: {},
  sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 12 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  itemMeta: { fontSize: 13, color: Colors.textMuted },
  itemPrice: { fontSize: 15, fontWeight: '700', color: Colors.text },

  totalSection: { marginTop: 8 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: { fontSize: 14, color: Colors.textSecondary },
  totalValue: { fontSize: 14, color: Colors.text },
  totalRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  totalLabelMain: { fontSize: 16, fontWeight: '700', color: Colors.text },
  totalValueMain: { fontSize: 24, fontWeight: '800' },

  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  paymentLabel: { fontSize: 13, color: Colors.textSecondary },
  paymentValue: { fontSize: 13, fontWeight: '600', color: Colors.text },

  actions: { marginTop: 20 },
  actionBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  actionBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtnSecondary: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnSecondaryText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  actionBtnDanger: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.redBg,
    alignItems: 'center',
  },
  actionBtnDangerText: { fontSize: 14, fontWeight: '600', color: Colors.red },
  actionBtnPrint: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
  },
  actionBtnPrintText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  actionBtnShare: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.greenBg,
    alignItems: 'center',
  },
  actionBtnShareText: { fontSize: 14, fontWeight: '600', color: Colors.green },

  notFoundWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  notFoundIcon: { fontSize: 64, marginBottom: 16 },
  notFoundText: { fontSize: 16, color: Colors.textSecondary, marginBottom: 20 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 12 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: Colors.white },
});
