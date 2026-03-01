import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedScreen from '../components/AnimatedScreen';
import { Colors, Shadows } from '../constants/theme';
import { useStore } from '../store/useStore';
import { getExpensesFromFirebase, Expense } from '../services/firebaseStore';
import { isFirebaseConfigured } from '../config/keys';

type Period = 'today' | 'week' | 'month' | 'year';

export function ReportsScreen() {
  const { orders, products, user } = useStore();
  const [period, setPeriod] = useState<Period>('month');
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Load expenses từ Firebase
  useEffect(() => {
    const loadExpenses = async () => {
      if (isFirebaseConfigured && user?.id) {
        try {
          const data = await getExpensesFromFirebase(user.id);
          setExpenses(data);
        } catch (error) {
          console.error('Error loading expenses:', error);
        }
      }
    };
    loadExpenses();
  }, [user?.id]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    let startDate: Date;
    switch (period) {
      case 'today': startDate = today; break;
      case 'week': startDate = weekAgo; break;
      case 'month': startDate = monthStart; break;
      case 'year': startDate = yearStart; break;
    }

    const filteredOrders = orders.filter(o => new Date(o.createdAt) >= startDate);
    const paidOrders = filteredOrders.filter(o => o.paymentStatus === 'paid');
    const filteredExpenses = expenses.filter(e => new Date(e.createdAt) >= startDate);

    const revenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Tính giá vốn
    let costOfGoods = 0;
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product?.costPrice) {
          costOfGoods += product.costPrice * item.quantity;
        }
      });
    });

    const grossProfit = revenue - costOfGoods;
    const netProfit = grossProfit - totalExpense;

    // Tổng tiền chờ thanh toán
    const pendingOrders = filteredOrders.filter(o => o.paymentStatus === 'pending');
    const pendingAmount = pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Top sản phẩm
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.subtotal;
      });
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
      totalOrders: filteredOrders.length,
      paidOrders: paidOrders.length,
      pendingOrders: filteredOrders.length - paidOrders.length,
      pendingAmount,
      revenue,
      costOfGoods,
      grossProfit,
      totalExpense,
      netProfit,
      topProducts,
      avgOrderValue: paidOrders.length > 0 ? revenue / paidOrders.length : 0,
    };
  }, [orders, products, expenses, period]);

  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  const periodLabels: Record<Period, string> = {
    today: 'Hôm nay',
    week: '7 ngày qua',
    month: 'Tháng này',
    year: 'Năm nay',
  };

  const handleShare = async () => {
    const report = `
📊 BÁO CÁO ${periodLabels[period].toUpperCase()} - HI-NOTE

💰 Doanh thu: ${formatMoney(stats.revenue)}đ
📦 Số đơn: ${stats.paidOrders} đơn (${stats.pendingOrders} chờ TT)
💵 TB/đơn: ${formatMoney(stats.avgOrderValue)}đ

📊 CHI TIẾT:
• Giá vốn: ${formatMoney(stats.costOfGoods)}đ
• Lãi gộp: ${formatMoney(stats.grossProfit)}đ
• Chi phí: ${formatMoney(stats.totalExpense)}đ
• Chờ TT: ${formatMoney(stats.pendingAmount)}đ

✨ LÃI RÒNG: ${stats.netProfit >= 0 ? '+' : ''}${formatMoney(stats.netProfit)}đ

🏆 Top sản phẩm:
${stats.topProducts.map((p, i) => `${i + 1}. ${p.name}: ${p.quantity} cái - ${formatMoney(p.revenue)}đ`).join('\n')}
    `.trim();

    await Share.share({ message: report });
  };

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <LinearGradient colors={['#E8F4FE', '#E0EAFC', '#F8FAFC']} style={styles.gradient} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>Báo cáo</Text>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>📤 Chia sẻ</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.periodTabs}>
            {(['today', 'week', 'month', 'year'] as Period[]).map(p => (
              <TouchableOpacity key={p} style={[styles.periodTab, period === p && styles.periodTabActive]} onPress={() => setPeriod(p)}>
                <Text style={[styles.periodTabText, period === p && styles.periodTabTextActive]}>{periodLabels[p]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Revenue Card */}
            <LinearGradient colors={[Colors.primary, '#2563EB']} style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Doanh thu {periodLabels[period].toLowerCase()}</Text>
              <Text style={styles.revenueValue}>{formatMoney(stats.revenue)}đ</Text>
              <View style={styles.revenueStats}>
                <View style={styles.revenueStat}>
                  <Text style={styles.revenueStatValue}>{stats.paidOrders}</Text>
                  <Text style={styles.revenueStatLabel}>Đơn đã TT</Text>
                </View>
                <View style={styles.revenueStat}>
                  <Text style={styles.revenueStatValue}>{stats.pendingOrders}</Text>
                  <Text style={styles.revenueStatLabel}>Chờ TT</Text>
                </View>
                <View style={styles.revenueStat}>
                  <Text style={styles.revenueStatValue}>{formatMoney(stats.avgOrderValue)}đ</Text>
                  <Text style={styles.revenueStatLabel}>TB/đơn</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Profit Cards */}
            <View style={styles.profitRow}>
              <View style={styles.profitCard}>
                <Text style={styles.profitIcon}>💵</Text>
                <Text style={styles.profitLabel}>Giá vốn</Text>
                <Text style={[styles.profitValue, { color: Colors.orange }]}>{formatMoney(stats.costOfGoods)}đ</Text>
              </View>
              <View style={styles.profitCard}>
                <Text style={styles.profitIcon}>📈</Text>
                <Text style={styles.profitLabel}>Lãi gộp</Text>
                <Text style={[styles.profitValue, { color: Colors.green }]}>{formatMoney(stats.grossProfit)}đ</Text>
              </View>
            </View>

            <View style={styles.profitRow}>
              <View style={styles.profitCard}>
                <Text style={styles.profitIcon}>📉</Text>
                <Text style={styles.profitLabel}>Chi phí</Text>
                <Text style={[styles.profitValue, { color: Colors.red }]}>{formatMoney(stats.totalExpense)}đ</Text>
              </View>
              <View style={styles.profitCard}>
                <Text style={styles.profitIcon}>💰</Text>
                <Text style={styles.profitLabel}>Chờ TT</Text>
                <Text style={[styles.profitValue, { color: Colors.orange }]}>{formatMoney(stats.pendingAmount)}đ</Text>
              </View>
            </View>

            <View style={styles.netProfitCard}>
              <View>
                <Text style={styles.netProfitLabel}>Lãi ròng</Text>
                <Text style={styles.netProfitDesc}>Doanh thu - Giá vốn - Chi phí</Text>
              </View>
              <Text style={[styles.netProfitValue, stats.netProfit < 0 && { color: Colors.red }]}>
                {stats.netProfit >= 0 ? '+' : ''}{formatMoney(stats.netProfit)}đ
              </Text>
            </View>

            {/* Top Products */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏆 Top sản phẩm bán chạy</Text>
              {stats.topProducts.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
              ) : (
                stats.topProducts.map((product, index) => (
                  <View key={index} style={styles.topProductItem}>
                    <View style={styles.topProductRank}>
                      <Text style={styles.topProductRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.topProductInfo}>
                      <Text style={styles.topProductName}>{product.name}</Text>
                      <Text style={styles.topProductQty}>{product.quantity} đã bán</Text>
                    </View>
                    <Text style={styles.topProductRevenue}>{formatMoney(product.revenue)}đ</Text>
                  </View>
                ))
              )}
            </View>

            <View style={{ height: 100 }} />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  shareBtn: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  shareBtnText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  periodTabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  periodTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border },
  periodTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodTabText: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  periodTabTextActive: { color: '#fff', fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 20 },
  revenueCard: { borderRadius: 20, padding: 24, marginBottom: 16 },
  revenueLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  revenueValue: { fontSize: 36, fontWeight: '800', color: '#fff', marginBottom: 16 },
  revenueStats: { flexDirection: 'row', justifyContent: 'space-between' },
  revenueStat: { alignItems: 'center' },
  revenueStatValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  revenueStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  profitRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  profitCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', ...Shadows.card },
  profitIcon: { fontSize: 24, marginBottom: 8 },
  profitLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  profitValue: { fontSize: 18, fontWeight: '700' },
  netProfitCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, ...Shadows.card },
  netProfitLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
  netProfitDesc: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  netProfitValue: { fontSize: 24, fontWeight: '800', color: Colors.green },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, ...Shadows.card },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  topProductItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  topProductRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryBg, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  topProductRankText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  topProductInfo: { flex: 1 },
  topProductName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  topProductQty: { fontSize: 12, color: Colors.textMuted },
  topProductRevenue: { fontSize: 14, fontWeight: '700', color: Colors.green },
});
