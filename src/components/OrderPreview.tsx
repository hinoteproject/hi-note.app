import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, Fonts, Radius, Spacing } from '../constants/theme';
import { OrderItem } from '../types';
import { formatMoney } from '../utils/format';

interface OrderPreviewProps {
  items: OrderItem[];
  tableNumber?: string;
  onEditItem?: (index: number) => void;
  onRemoveItem: (index: number) => void;
  onQuantityChange: (index: number, delta: number) => void;
}

export function OrderPreview({
  items,
  tableNumber,
  onEditItem,
  onRemoveItem,
  onQuantityChange,
}: OrderPreviewProps) {
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  const renderItem = ({ item, index }: { item: OrderItem; index: number }) => (
    <View style={styles.itemRow}>
      <TouchableOpacity 
        style={styles.removeBtn}
        onPress={() => onRemoveItem(index)}
      >
        <Text style={styles.removeBtnText}>✕</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.itemInfo}
        onPress={() => onEditItem?.(index)}
        disabled={!onEditItem}
      >
        <Text style={styles.itemName}>{item.productName}</Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemPrice}>{formatMoney(item.unitPrice)}</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>🎤 AI</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.quantityControl}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => onQuantityChange(index, -1)}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity
          style={[styles.qtyBtn, styles.qtyBtnPlus]}
          onPress={() => onQuantityChange(index, 1)}
        >
          <Text style={[styles.qtyBtnText, styles.qtyBtnPlusText]}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtotal}>{formatMoney(item.subtotal)}</Text>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <LinearGradient
            colors={[Colors.purpleBg, '#E0E7FF']}
            style={styles.emptyIconGradient}
          >
            <Text style={styles.emptyIcon}>🛒</Text>
          </LinearGradient>
        </View>
        <Text style={styles.emptyTitle}>Đơn này bạn bán hàng gì?</Text>
        <Text style={styles.emptyHint}>
          Chat tên hàng hoặc đọc tên hàng{'\n'}để Hi-Note tính tiền nhanh
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {tableNumber && (
        <View style={styles.tableRow}>
          <View style={styles.tableBadge}>
            <Text style={styles.tableIcon}>🪑</Text>
            <Text style={styles.tableNumber}>Bàn {tableNumber}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        style={styles.list}
        scrollEnabled={false}
      />

      <View style={styles.totalSection}>
        <LinearGradient
          colors={['#F8FAFC', '#FFFFFF']}
          style={styles.totalGradient}
        >
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng tiền hàng</Text>
            <Text style={styles.totalValue}>{formatMoney(total)}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalRowMain}>
            <Text style={styles.totalLabelMain}>💰 Tổng cộng</Text>
            <Text style={styles.totalAmountMain}>{formatMoney(total)}</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  emptyContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing['2xl'],
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  emptyIconWrap: {
    marginBottom: Spacing.lg,
  },
  emptyIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: Fonts.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: Fonts.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  tableRow: {
    marginBottom: Spacing.md,
  },
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tableIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  tableNumber: {
    fontSize: Fonts.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  list: {
    maxHeight: 300,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.redBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  removeBtnText: {
    color: Colors.red,
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Fonts.md,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: Fonts.sm,
    color: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  aiBadge: {
    backgroundColor: Colors.purpleBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  aiBadgeText: {
    fontSize: Fonts.xs,
    color: Colors.purple,
    fontWeight: '500',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnPlus: {
    backgroundColor: Colors.primaryBg,
  },
  qtyBtnText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  qtyBtnPlusText: {
    color: Colors.primary,
  },
  quantity: {
    fontSize: Fonts.lg,
    fontWeight: '700',
    marginHorizontal: Spacing.md,
    minWidth: 24,
    textAlign: 'center',
    color: Colors.text,
  },
  subtotal: {
    fontSize: Fonts.md,
    fontWeight: '700',
    color: Colors.primaryLight,
    minWidth: 70,
    textAlign: 'right',
  },
  totalSection: {
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  totalGradient: {
    padding: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  totalLabel: {
    fontSize: Fonts.base,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: Fonts.base,
    color: Colors.text,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  totalRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabelMain: {
    fontSize: Fonts.md,
    fontWeight: '600',
    color: Colors.text,
  },
  totalAmountMain: {
    fontSize: Fonts['2xl'],
    fontWeight: '800',
    color: Colors.primaryLight,
  },
});
