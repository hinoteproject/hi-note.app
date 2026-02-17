import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import AnimatedScreen from '../components/AnimatedScreen';
import GlassCard from '../components/GlassCard';
import { Colors, Shadows, Gradients } from '../constants/theme';
import { generateVietQRUrl, BANK_CODES } from '../utils/format';
import { sendPaymentNotification, sendNewOrderNotification } from '../services/notificationService';
import { Toast } from '../components/ToastNotification';

export function PaymentScreen() {
  const navigation = useNavigation<any>();
  const { currentOrder, currentTable, currentBillName, getDefaultBank, createOrder, clearCurrentOrder } = useStore();
  const [loading, setLoading] = useState<'cash' | 'transfer' | null>(null);

  const total = currentOrder.reduce((sum, item) => sum + item.subtotal, 0);
  const bank = getDefaultBank();

  const formatMoney = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const qrUrl = bank ? generateVietQRUrl(
    BANK_CODES[bank.bankName] || 'VCB',
    bank.accountNumber, bank.accountName, total,
    `HiNote ${currentTable ? `Ban${currentTable}` : ''}`
  ) : null;

  const handleCashPayment = async () => {
    setLoading('cash');
    try {
      const order = await createOrder('cash');
      const orderLabel = order.billName || (order.tableNumber ? `Bàn ${order.tableNumber}` : 'Khách lẻ');
      await sendPaymentNotification(order.totalAmount, orderLabel);
      Toast.show({
        type: 'success',
        title: '💰 Thanh toán thành công!',
        message: `${orderLabel} — ${formatMoney(order.totalAmount)}đ tiền mặt`,
      });
      navigation.navigate('Main');
    } catch (e) {
      Toast.show({ type: 'error', message: 'Không thể tạo đơn' });
    } finally {
      setLoading(null);
    }
  };

  const handleTransferConfirm = async () => {
    setLoading('transfer');
    try {
      const order = await createOrder('transfer');
      const orderLabel = order.billName || (order.tableNumber ? `Bàn ${order.tableNumber}` : 'Khách lẻ');
      await sendNewOrderNotification(orderLabel, order.items.length);
      Toast.show({
        type: 'info',
        title: '📱 Đơn đang chờ chuyển khoản',
        message: `${orderLabel} — ${formatMoney(order.totalAmount)}đ`,
        duration: 4000,
      });
      navigation.navigate('Main');
    } catch (e) {
      Toast.show({ type: 'error', message: 'Không thể tạo đơn' });
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = () => {
    clearCurrentOrder();
    navigation.goBack();
  };

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <LinearGradient colors={Gradients.header} locations={[0, 0.3, 1]} style={styles.gradientBg} />

        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnWrap} activeOpacity={0.7}>
              <View style={styles.backBtnCircle}>
                <Text style={styles.backIcon}>←</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Thanh toán</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Main')} activeOpacity={0.7}>
              <Text style={styles.homeLink}>🏠</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {/* Premium Invoice Card */}
            <GlassCard style={styles.invoiceCard} intensity="strong" noPadding>
              {/* Gradient top accent */}
              <LinearGradient colors={Gradients.primary} style={styles.invoiceAccent} />

              <View style={styles.invoiceHeader}>
                <Text style={styles.customerName}>
                  {currentBillName || (currentTable ? `Bàn ${currentTable}` : 'Khách lẻ')}
                </Text>
                <Text style={styles.invoiceDate}>{formatDate()}</Text>
              </View>

              {/* Items */}
              <View style={styles.itemsSection}>
                {currentOrder.map((item, index) => (
                  <View key={index} style={styles.invoiceItem}>
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      <Text style={styles.itemQtyInline}>{item.quantity} × {formatMoney(item.unitPrice)}đ</Text>
                    </View>
                    <Text style={styles.itemPrice}>{formatMoney(item.subtotal)}đ</Text>
                  </View>
                ))}
              </View>

              {/* Totals */}
              <View style={styles.totalsSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Số lượng</Text>
                  <Text style={styles.totalValue}>{currentOrder.reduce((s, i) => s + i.quantity, 0)} món</Text>
                </View>
                <View style={styles.totalRowMain}>
                  <Text style={styles.totalLabelMain}>Tổng cộng</Text>
                  <Text style={styles.totalValueMain}>{formatMoney(total)}đ</Text>
                </View>
              </View>
            </GlassCard>

            {/* QR Section — separate card for bank transfer */}
            {bank && qrUrl ? (
              <GlassCard style={styles.qrCard} intensity="medium">
                <Text style={styles.qrSectionTitle}>🔗 Quét mã thanh toán</Text>
                <View style={styles.qrRow}>
                  <View style={styles.qrInfo}>
                    <Text style={styles.qrBankName}>{bank.bankName}</Text>
                    <Text style={styles.qrAccountNum}>{bank.accountNumber}</Text>
                    <Text style={styles.qrAccountName}>{bank.accountName}</Text>
                  </View>
                  <View style={styles.qrFrame}>
                    <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
                  </View>
                </View>
              </GlassCard>
            ) : (
              <GlassCard style={styles.noBankCard} intensity="light">
                <Text style={styles.noBankIcon}>🏦</Text>
                <Text style={styles.noBankText}>Chưa thiết lập tài khoản ngân hàng</Text>
                <TouchableOpacity
                  style={styles.noBankBtn}
                  onPress={() => navigation.navigate('Main', { screen: 'Nhiều hơn' })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.noBankBtnText}>Thêm tài khoản →</Text>
                </TouchableOpacity>
              </GlassCard>
            )}

            {/* Premium Action Buttons */}
            <View style={styles.actionSection}>
              {/* Cash Button */}
              <TouchableOpacity activeOpacity={0.8} onPress={handleCashPayment} disabled={!!loading}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.primaryBtn}>
                  {loading === 'cash' ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnIcon}>💵</Text>
                      <View>
                        <Text style={styles.primaryBtnText}>Tiền mặt</Text>
                        <Text style={styles.primaryBtnSub}>{formatMoney(total)}đ</Text>
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Transfer Button */}
              <TouchableOpacity activeOpacity={0.8} onPress={handleTransferConfirm} disabled={!!loading}>
                <LinearGradient colors={Gradients.primary} style={styles.primaryBtn}>
                  {loading === 'transfer' ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnIcon}>📱</Text>
                      <View>
                        <Text style={styles.primaryBtnText}>Chuyển khoản</Text>
                        <Text style={styles.primaryBtnSub}>Tạo đơn chờ thanh toán</Text>
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
                <Text style={styles.cancelText}>✕ Huỷ đơn</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  gradientBg: { position: 'absolute', left: 0, right: 0, top: 0, height: 350 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  backBtnWrap: {},
  backBtnCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center',
    ...Shadows.sm,
  },
  backIcon: { fontSize: 18, color: '#334155', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  homeLink: { fontSize: 22 },

  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 40 },

  // Invoice Card
  invoiceCard: { marginBottom: 16, overflow: 'hidden' },
  invoiceAccent: { height: 4, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginBottom: 16 },

  invoiceHeader: {
    paddingHorizontal: 20, marginBottom: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  customerName: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4, letterSpacing: -0.3 },
  invoiceDate: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },

  itemsSection: { paddingHorizontal: 20, marginBottom: 16 },
  invoiceItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  itemLeft: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  itemQtyInline: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#334155' },

  totalsSection: {
    paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 20,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  totalLabel: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  totalValue: { fontSize: 14, color: '#334155', fontWeight: '600' },
  totalRowMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabelMain: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  totalValueMain: { fontSize: 24, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },

  // QR Card
  qrCard: { marginBottom: 16 },
  qrSectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 14 },
  qrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qrInfo: { flex: 1, marginRight: 16 },
  qrBankName: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  qrAccountNum: { fontSize: 14, color: '#64748B', fontWeight: '600', marginBottom: 2 },
  qrAccountName: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  qrFrame: {
    padding: 8, borderRadius: 16, backgroundColor: '#FFF',
    borderWidth: 2, borderColor: Colors.primary,
    ...Shadows.sm,
  },
  qrImage: { width: 100, height: 100, borderRadius: 8 },

  // No bank
  noBankCard: { marginBottom: 16, alignItems: 'center', paddingVertical: 24 },
  noBankIcon: { fontSize: 32, marginBottom: 8 },
  noBankText: { fontSize: 14, color: '#64748B', fontWeight: '500', marginBottom: 12 },
  noBankBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.primaryBg },
  noBankBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Action Buttons
  actionSection: { gap: 12, marginTop: 8 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 18, paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  primaryBtnIcon: { fontSize: 28, marginRight: 16 },
  primaryBtnText: { fontSize: 17, fontWeight: '800', color: '#FFF' },
  primaryBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginTop: 2 },

  cancelBtn: {
    alignItems: 'center', paddingVertical: 14,
    borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.04)',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
});
