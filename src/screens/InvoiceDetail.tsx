import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import AnimatedScreen from '../components/AnimatedScreen';
import { Colors } from '../constants/theme';
import { formatMoney } from '../utils/format';
import { LinearGradient } from 'expo-linear-gradient';

export function InvoiceDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { orderId } = route.params || {};
  const { orders, deleteOrder, setCurrentOrder } = useStore();

  const order = orders.find((o) => o.id === orderId);
  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Hoá đơn không tồn tại</Text>
      </SafeAreaView>
    );
  }

  const handleEdit = () => {
    // populate current order and go to Sell screen (navigate via parent so tab exists)
    setCurrentOrder(order.items, order.tableNumber);
    // If this screen is inside a Stack, its parent navigator may be the Tab navigator
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
      } }
    ]);
  };

  return (
    <AnimatedScreen>
      <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Hoá đơn #{order.id}</Text>
          <Text style={styles.subTitle}>{new Date(order.createdAt).toLocaleString()}</Text>
        </View>

        {order.items.map((it, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemName}>{it.productName} ×{it.quantity}</Text>
            <Text style={styles.itemPrice}>{formatMoney(it.subtotal)}đ</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{formatMoney(order.totalAmount)}đ</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn]} onPress={handleEdit}>
            <LinearGradient colors={['#F3F4F6', '#F3F4F6']} style={[styles.editGradient]}>
              <Text style={[styles.btnText, { color: Colors.primary }]}>Chỉnh sửa</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn]} onPress={handleDelete}>
            <LinearGradient colors={[Colors.red, '#DC2626']} style={[styles.deleteGradient]}>
              <Text style={[styles.btnText, { color: Colors.white }]}>Xoá</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  subTitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 6 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  itemName: { fontSize: 15, color: Colors.text },
  itemPrice: { fontSize: 15, fontWeight: '700', color: Colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 },
  totalLabel: { fontSize: 16, color: Colors.textSecondary },
  totalValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  editGradient: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', paddingHorizontal: 8, borderWidth: 1, borderColor: Colors.border },
  deleteGradient: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', paddingHorizontal: 8 },
  btnText: { fontSize: 15, fontWeight: '700', color: Colors.text },
  notFound: { padding: 20, fontSize: 16, color: Colors.textSecondary },
});


