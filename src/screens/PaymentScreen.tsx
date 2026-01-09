import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import AnimatedScreen from '../components/AnimatedScreen';
import { Colors, Shadows, Fonts, Radius } from '../constants/theme';
import { generateVietQRUrl, BANK_CODES } from '../utils/format';

export function PaymentScreen() {
  const navigation = useNavigation<any>();
  const { currentOrder, currentTable, getDefaultBank, createOrder, clearCurrentOrder } = useStore();

  const total = currentOrder.reduce((sum, item) => sum + item.subtotal, 0);
  const bank = getDefaultBank();

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const qrUrl = bank ? generateVietQRUrl(
    BANK_CODES[bank.bankName] || 'VCB',
    bank.accountNumber,
    bank.accountName,
    total,
    `HiNote ${currentTable ? `Ban${currentTable}` : ''}`
  ) : null;

  const handleCashPayment = () => {
    createOrder('cash');
    Alert.alert('✓ Thành công', 'Đã tạo đơn hàng!', [
      { text: 'OK', onPress: () => navigation.navigate('Main') }
    ]);
  };

  const handleTransferConfirm = () => {
    createOrder('transfer');
    Alert.alert('✓ Thành công', 'Đã xác nhận thanh toán!', [
      { text: 'OK', onPress: () => navigation.navigate('Main') }
    ]);
  };

  return (
    <AnimatedScreen>
      <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, '#FFFFFF']}
        locations={[0, 0.3, 1]}
        style={styles.gradientBg}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Quay lại</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Main')}>
            <Text style={styles.backLink}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>Mẫu hoá đơn của bạn</Text>
          <Text style={styles.subtitle}>
            Khi hoàn thành 1 đơn, bạn sẽ thấy hoá đơn như sau
          </Text>

          {/* Invoice Card */}
          <View style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}>
              <Text style={styles.customerName}>
                {currentTable ? `Bàn ${currentTable}` : 'Khách lẻ'}
              </Text>
              <Text style={styles.invoiceDate}>{formatDate()}</Text>
            </View>

            {/* Items */}
            <View style={styles.itemsSection}>
              {currentOrder.map((item, index) => (
                <View key={index} style={styles.invoiceItem}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <View style={styles.itemBadge}>
                      <Text style={styles.itemBadgeText}>💬 Chat</Text>
                    </View>
                  </View>
                  <Text style={styles.itemPrice}>{formatMoney(item.subtotal)}</Text>
                </View>
              ))}
              {currentOrder.map((item, index) => (
                <Text key={`qty-${index}`} style={styles.itemQty}>
                  {item.quantity} x {formatMoney(item.unitPrice)}
                </Text>
              ))}
            </View>

            {/* Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tổng tiền hàng</Text>
                <Text style={styles.totalValue}>{formatMoney(total)}</Text>
              </View>
              <View style={styles.totalRowMain}>
                <Text style={styles.totalLabelMain}>Tổng cộng</Text>
                <Text style={styles.totalValueMain}>{formatMoney(total)}</Text>
              </View>
            </View>

            {/* QR Section */}
            {bank && qrUrl && (
              <View style={styles.qrSection}>
                <View style={styles.qrLeft}>
                  <Text style={styles.qrTitle}>Quét mã thanh toán</Text>
                  <Text style={styles.qrSubtitle}>
                    {bank.bankName} - ***{bank.accountNumber.slice(-3)}
                  </Text>
                </View>
                <View style={styles.qrRight}>
                  <Image 
                    source={{ uri: qrUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                  <View style={styles.qrStatus}>
                    <Text style={styles.qrStatusIcon}>✓</Text>
                    <Text style={styles.qrStatusText}>Đã nhận</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleTransferConfirm}>
            <Text style={styles.primaryBtnText}>Tạo thử đơn</Text>
          </TouchableOpacity>

          <View style={styles.secondaryBtns}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleCashPayment}>
              <Text style={styles.secondaryBtnText}>💵 Tiền mặt</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryBtn} 
              onPress={() => {
                clearCurrentOrder();
                navigation.goBack();
              }}
            >
              <Text style={styles.secondaryBtnText}>Huỷ đơn</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    fontSize: Fonts.base,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  backLink: {
    fontSize: Fonts.base,
    color: Colors.primaryLight,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: Fonts['2xl'],
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Fonts.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  invoiceCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  invoiceHeader: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  customerName: {
    fontSize: Fonts.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: Fonts.sm,
    color: Colors.textMuted,
  },
  itemsSection: {
    marginBottom: 16,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    fontSize: Fonts.md,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  itemBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  itemBadgeText: {
    fontSize: Fonts.xs,
    color: Colors.primaryLight,
  },
  itemPrice: {
    fontSize: Fonts.md,
    color: Colors.text,
  },
  itemQty: {
    fontSize: Fonts.sm,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  totalsSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: Fonts.base,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: Fonts.base,
    color: Colors.text,
  },
  totalRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabelMain: {
    fontSize: Fonts.md,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValueMain: {
    fontSize: Fonts['2xl'],
    fontWeight: '700',
    color: Colors.text,
  },
  qrSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  qrLeft: {},
  qrTitle: {
    fontSize: Fonts.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: Fonts.sm,
    color: Colors.textMuted,
  },
  qrRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrImage: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    marginRight: 12,
  },
  qrStatus: {
    alignItems: 'center',
  },
  qrStatusIcon: {
    fontSize: 20,
    color: Colors.green,
  },
  qrStatusText: {
    fontSize: Fonts.xs,
    color: Colors.green,
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 18,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: Fonts.md,
    fontWeight: '600',
  },
  secondaryBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    color: Colors.textSecondary,
    fontSize: Fonts.base,
    fontWeight: '500',
  },
});
