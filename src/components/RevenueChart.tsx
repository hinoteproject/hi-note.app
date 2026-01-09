import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Colors, Shadows } from '../constants/theme';

interface RevenueChartProps {
  orders: Array<{
    createdAt: Date;
    totalAmount: number;
    paymentStatus: string;
  }>;
}

type ChartMode = '7days' | '30days' | '12months';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 72; // padding + margins

export default function RevenueChart({ orders }: RevenueChartProps) {
  const [mode, setMode] = useState<ChartMode>('7days');

  const formatMoney = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
    return n.toString();
  };

  const getChartData = () => {
    const now = new Date();
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid');

    if (mode === '7days') {
      // 7 ngày gần nhất
      const data: { label: string; value: number; date: Date }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
        
        const revenue = paidOrders
          .filter(o => {
            const d = new Date(o.createdAt);
            return d >= dayStart && d <= dayEnd;
          })
          .reduce((sum, o) => sum + o.totalAmount, 0);

        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        data.push({
          label: i === 0 ? 'Nay' : i === 1 ? 'Qua' : dayNames[date.getDay()],
          value: revenue,
          date,
        });
      }
      return data;
    } else if (mode === '30days') {
      // 30 ngày, nhóm theo tuần
      const data: { label: string; value: number; date: Date }[] = [];
      for (let i = 4; i >= 0; i--) {
        const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7);
        const weekStart = new Date(weekEnd.getTime() - 6 * 86400000);
        
        const revenue = paidOrders
          .filter(o => {
            const d = new Date(o.createdAt);
            return d >= weekStart && d <= weekEnd;
          })
          .reduce((sum, o) => sum + o.totalAmount, 0);

        data.push({
          label: i === 0 ? 'Tuần này' : `T-${i}`,
          value: revenue,
          date: weekEnd,
        });
      }
      return data;
    } else {
      // 12 tháng
      const data: { label: string; value: number; date: Date }[] = [];
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const revenue = paidOrders
          .filter(o => {
            const d = new Date(o.createdAt);
            return d >= month && d <= monthEnd;
          })
          .reduce((sum, o) => sum + o.totalAmount, 0);

        data.push({
          label: `T${month.getMonth() + 1}`,
          value: revenue,
          date: month,
        });
      }
      return data;
    }
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.map(d => d.value), 1);
  const totalRevenue = chartData.reduce((sum, d) => sum + d.value, 0);
  const avgRevenue = totalRevenue / chartData.length;

  // Tính % thay đổi so với kỳ trước
  const currentPeriod = chartData.slice(-Math.ceil(chartData.length / 2));
  const previousPeriod = chartData.slice(0, Math.floor(chartData.length / 2));
  const currentTotal = currentPeriod.reduce((s, d) => s + d.value, 0);
  const previousTotal = previousPeriod.reduce((s, d) => s + d.value, 0);
  const changePercent = previousTotal > 0 
    ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1)
    : '0';
  const isPositive = currentTotal >= previousTotal;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Biểu đồ doanh thu</Text>
        <View style={styles.changeBadge}>
          <Text style={[styles.changeText, isPositive ? styles.positive : styles.negative]}>
            {isPositive ? '↑' : '↓'} {Math.abs(Number(changePercent))}%
          </Text>
        </View>
      </View>

      {/* Mode Tabs */}
      <View style={styles.modeTabs}>
        {([
          { key: '7days', label: '7 ngày' },
          { key: '30days', label: '30 ngày' },
          { key: '12months', label: '12 tháng' },
        ] as const).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.modeTab, mode === tab.key && styles.modeTabActive]}
            onPress={() => setMode(tab.key)}
          >
            <Text style={[styles.modeTabText, mode === tab.key && styles.modeTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Tổng</Text>
          <Text style={styles.summaryValue}>{formatMoney(totalRevenue)}đ</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Trung bình</Text>
          <Text style={styles.summaryValue}>{formatMoney(avgRevenue)}đ</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>{formatMoney(maxValue)}</Text>
          <Text style={styles.yLabel}>{formatMoney(maxValue / 2)}</Text>
          <Text style={styles.yLabel}>0</Text>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {/* Grid lines */}
          <View style={styles.gridLine} />
          <View style={[styles.gridLine, { top: '50%' }]} />
          <View style={[styles.gridLine, { top: '100%' }]} />

          {/* Bars */}
          <View style={styles.bars}>
            {chartData.map((item, index) => {
              const barHeight = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              const isLast = index === chartData.length - 1;
              
              return (
                <View key={index} style={styles.barWrapper}>
                  <View style={styles.barContainer}>
                    {item.value > 0 && (
                      <Text style={styles.barValue}>{formatMoney(item.value)}</Text>
                    )}
                    <View
                      style={[
                        styles.bar,
                        { height: `${Math.max(barHeight, 2)}%` },
                        isLast && styles.barActive,
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, isLast && styles.barLabelActive]}>
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Insight */}
      <View style={styles.insight}>
        <Text style={styles.insightIcon}>💡</Text>
        <Text style={styles.insightText}>
          {isPositive 
            ? `Doanh thu tăng ${changePercent}% so với kỳ trước. Tiếp tục phát huy!`
            : `Doanh thu giảm ${Math.abs(Number(changePercent))}%. Hãy tìm cách thu hút thêm khách hàng!`
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  changeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.greenBg,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  positive: {
    color: Colors.green,
  },
  negative: {
    color: Colors.red,
  },

  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  modeTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  summary: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.primary,
    opacity: 0.2,
    marginHorizontal: 12,
  },

  chartContainer: {
    flexDirection: 'row',
    height: 160,
    marginBottom: 16,
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingBottom: 20,
  },
  yLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },

  barsContainer: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.borderLight,
    top: 0,
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barValue: {
    fontSize: 9,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  bar: {
    width: '60%',
    maxWidth: 30,
    backgroundColor: Colors.primaryBg,
    borderRadius: 4,
    minHeight: 4,
  },
  barActive: {
    backgroundColor: Colors.primary,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 6,
  },
  barLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.greenBg,
    borderRadius: 12,
    padding: 12,
  },
  insightIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    color: Colors.green,
    lineHeight: 18,
  },
});
