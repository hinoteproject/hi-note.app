import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedScreen from '../components/AnimatedScreen';
import AnimatedButton from '../components/AnimatedButton';
import { Colors, Shadows } from '../constants/theme';
import { useStore } from '../store/useStore';
import { Product } from '../types';

export function StockScreen() {
  const { products, updateProduct, stockImports, addStockImport } = useStore();
  const [activeTab, setActiveTab] = useState<'stock' | 'import'>('stock');
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [importQty, setImportQty] = useState('');
  const [importCost, setImportCost] = useState('');
  const [supplier, setSupplier] = useState('');

  const lowStockProducts = products.filter(p => 
    p.stock !== undefined && p.minStock !== undefined && p.stock <= p.minStock
  );

  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  const openImportModal = (product: Product) => {
    setSelectedProduct(product);
    setImportQty('');
    setImportCost(product.costPrice?.toString() || '');
    setSupplier('');
    setShowImportModal(true);
  };

  const handleImport = async () => {
    if (!selectedProduct || !importQty) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số lượng');
      return;
    }

    const qty = parseInt(importQty);
    const cost = parseInt(importCost) || 0;

    // Add stock import record
    await addStockImport({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: qty,
      costPrice: cost,
      totalCost: qty * cost,
      supplier: supplier.trim() || undefined,
    });

    // Update product stock
    const newStock = (selectedProduct.stock || 0) + qty;
    await updateProduct(selectedProduct.id, { 
      stock: newStock,
      costPrice: cost || selectedProduct.costPrice,
    });

    setShowImportModal(false);
    Alert.alert('✅ Thành công', `Đã nhập ${qty} ${selectedProduct.unit || 'cái'} ${selectedProduct.name}`);
  };

  const renderStockItem = ({ item }: { item: Product }) => {
    const isLow = item.stock !== undefined && item.minStock !== undefined && item.stock <= item.minStock;
    
    return (
      <View style={styles.stockCard}>
        <View style={styles.stockLeft}>
          <View style={[styles.stockIcon, isLow && styles.stockIconLow]}>
            <Text style={styles.stockEmoji}>{isLow ? '⚠️' : '📦'}</Text>
          </View>
          <View style={styles.stockInfo}>
            <Text style={styles.stockName}>{item.name}</Text>
            <Text style={styles.stockCategory}>{item.category || 'Chưa phân loại'}</Text>
          </View>
        </View>
        <View style={styles.stockRight}>
          <Text style={[styles.stockQty, isLow && styles.stockQtyLow]}>
            {item.stock ?? 0} {item.unit || 'cái'}
          </Text>
          <TouchableOpacity style={styles.importBtn} onPress={() => openImportModal(item)}>
            <Text style={styles.importBtnText}>+ Nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderImportItem = ({ item }: { item: any }) => (
    <View style={styles.importCard}>
      <View style={styles.importLeft}>
        <Text style={styles.importName}>{item.productName}</Text>
        <Text style={styles.importDate}>
          {new Date(item.createdAt).toLocaleDateString('vi-VN')} • {item.supplier || 'Không rõ NCC'}
        </Text>
      </View>
      <View style={styles.importRight}>
        <Text style={styles.importQty}>+{item.quantity}</Text>
        <Text style={styles.importCost}>{formatMoney(item.totalCost)}đ</Text>
      </View>
    </View>
  );

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <LinearGradient colors={['#E8F4FE', '#E0EAFC', '#F8FAFC']} style={styles.gradient} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>Kho hàng</Text>
          </View>

          {lowStockProducts.length > 0 && (
            <View style={styles.alertCard}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{lowStockProducts.length} sản phẩm sắp hết</Text>
                <Text style={styles.alertDesc}>{lowStockProducts.map(p => p.name).join(', ')}</Text>
              </View>
            </View>
          )}

          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, activeTab === 'stock' && styles.tabActive]} onPress={() => setActiveTab('stock')}>
              <Text style={[styles.tabText, activeTab === 'stock' && styles.tabTextActive]}>Tồn kho</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'import' && styles.tabActive]} onPress={() => setActiveTab('import')}>
              <Text style={[styles.tabText, activeTab === 'import' && styles.tabTextActive]}>Lịch sử nhập</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'stock' ? (
            <FlatList
              data={products.filter(p => p.stock !== undefined)}
              renderItem={renderStockItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📦</Text>
                  <Text style={styles.emptyTitle}>Chưa có sản phẩm trong kho</Text>
                  <Text style={styles.emptyDesc}>Thêm tồn kho cho sản phẩm trong mục Sản phẩm</Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={stockImports}
              renderItem={renderImportItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyTitle}>Chưa có lịch sử nhập hàng</Text>
                </View>
              }
            />
          )}
        </SafeAreaView>

        <Modal visible={showImportModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nhập hàng</Text>
                <TouchableOpacity onPress={() => setShowImportModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedProduct && (
                <View style={styles.selectedProduct}>
                  <Text style={styles.selectedProductName}>{selectedProduct.name}</Text>
                  <Text style={styles.selectedProductStock}>Tồn hiện tại: {selectedProduct.stock || 0} {selectedProduct.unit || 'cái'}</Text>
                </View>
              )}

              <TextInput style={styles.input} placeholder="Số lượng nhập *" value={importQty} onChangeText={setImportQty} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Giá nhập/cái" value={importCost} onChangeText={setImportCost} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Nhà cung cấp" value={supplier} onChangeText={setSupplier} />

              <AnimatedButton title="Nhập hàng" onPress={handleImport} variant="primary" />
            </View>
          </View>
        </Modal>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 300 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', marginHorizontal: 20, borderRadius: 12, padding: 14, marginBottom: 16 },
  alertIcon: { fontSize: 24, marginRight: 12 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  alertDesc: { fontSize: 12, color: '#B45309', marginTop: 2 },
  tabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  stockCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, ...Shadows.card },
  stockLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stockIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryBg, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stockIconLow: { backgroundColor: '#FEE2E2' },
  stockEmoji: { fontSize: 20 },
  stockInfo: { flex: 1 },
  stockName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  stockCategory: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  stockRight: { alignItems: 'flex-end' },
  stockQty: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  stockQtyLow: { color: Colors.red },
  importBtn: { backgroundColor: Colors.greenBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  importBtnText: { fontSize: 12, fontWeight: '600', color: Colors.green },
  importCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  importLeft: { flex: 1 },
  importName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  importDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  importRight: { alignItems: 'flex-end' },
  importQty: { fontSize: 16, fontWeight: '700', color: Colors.green },
  importCost: { fontSize: 12, color: Colors.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalClose: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  selectedProduct: { backgroundColor: Colors.primaryBg, borderRadius: 12, padding: 14, marginBottom: 16 },
  selectedProductName: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  selectedProductStock: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  input: { backgroundColor: Colors.inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
});
