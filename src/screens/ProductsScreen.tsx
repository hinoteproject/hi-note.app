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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AnimatedScreen from '../components/AnimatedScreen';
import AnimatedButton from '../components/AnimatedButton';
import { Colors, Shadows } from '../constants/theme';
import { useStore } from '../store/useStore';
import { Product } from '../types';

const CATEGORIES = ['Đồ uống', 'Đồ ăn', 'Tráng miệng', 'Khác'];

export function ProductsScreen() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [category, setCategory] = useState('Đồ uống');
  const [unit, setUnit] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState('');

  const filteredProducts = products.filter(p => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      return p.name.toLowerCase().includes(lower);
    }
    return true;
  });

  const resetForm = () => {
    setName('');
    setPrice('');
    setCostPrice('');
    setCategory('Đồ uống');
    setUnit('');
    setStock('');
    setImage('');
    setEditingProduct(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setCostPrice(product.costPrice?.toString() || '');
    setCategory(product.category || 'Đồ uống');
    setUnit(product.unit || '');
    setStock(product.stock?.toString() || '');
    setImage(product.image || '');
    setShowModal(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên và giá sản phẩm');
      return;
    }

    const productData = {
      name: name.trim(),
      price: parseInt(price) || 0,
      costPrice: parseInt(costPrice) || undefined,
      category,
      unit: unit.trim() || undefined,
      stock: parseInt(stock) || undefined,
      image: image || undefined,
      aliases: [],
      learnedFromVoice: false,
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await addProduct(productData);
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = (product: Product) => {
    Alert.alert('Xóa sản phẩm', `Bạn có chắc muốn xóa "${product.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteProduct(product.id) },
    ]);
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  const renderProduct = ({ item }: { item: Product }) => {
    const profit = item.costPrice ? item.price - item.costPrice : null;
    const lowStock = item.stock !== undefined && item.minStock !== undefined && item.stock <= item.minStock;

    return (
      <TouchableOpacity style={styles.productCard} onPress={() => openEditModal(item)} activeOpacity={0.7}>
        <View style={styles.productLeft}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.productImage} />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productImageEmoji}>📦</Text>
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productCategory}>{item.category || 'Chưa phân loại'}</Text>
            {item.stock !== undefined && (
              <Text style={[styles.productStock, lowStock && styles.productStockLow]}>
                Kho: {item.stock} {item.unit || 'cái'}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.productRight}>
          <Text style={styles.productPrice}>{formatMoney(item.price)}đ</Text>
          {profit !== null && (
            <Text style={styles.productProfit}>Lãi: {formatMoney(profit)}đ</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <LinearGradient colors={['#E8F4FE', '#E0EAFC', '#F8FAFC']} style={styles.gradient} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>Sản phẩm</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
              <Text style={styles.addBtnText}>+ Thêm</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm sản phẩm..."
                placeholderTextColor={Colors.textMuted}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          </View>

          <View style={styles.categoryTabs}>
            <TouchableOpacity
              style={[styles.categoryTab, activeCategory === 'all' && styles.categoryTabActive]}
              onPress={() => setActiveCategory('all')}
            >
              <Text style={[styles.categoryTabText, activeCategory === 'all' && styles.categoryTabTextActive]}>
                Tất cả ({products.length})
              </Text>
            </TouchableOpacity>
            {CATEGORIES.map(cat => {
              const count = products.filter(p => p.category === cat).length;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>
                    {cat} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>Chưa có sản phẩm</Text>
              <Text style={styles.emptyDesc}>Thêm sản phẩm để bắt đầu bán hàng</Text>
              <AnimatedButton title="+ Thêm sản phẩm" onPress={openAddModal} variant="primary" />
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>

        {/* Add/Edit Modal */}
        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imageIcon}>📷</Text>
                    <Text style={styles.imageText}>Thêm ảnh</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TextInput style={styles.input} placeholder="Tên sản phẩm *" value={name} onChangeText={setName} />
              
              <View style={styles.row}>
                <TextInput style={[styles.input, styles.inputHalf]} placeholder="Giá bán *" value={price} onChangeText={setPrice} keyboardType="numeric" />
                <TextInput style={[styles.input, styles.inputHalf]} placeholder="Giá vốn" value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" />
              </View>

              <View style={styles.row}>
                <TextInput style={[styles.input, styles.inputHalf]} placeholder="Đơn vị (ly, phần...)" value={unit} onChangeText={setUnit} />
                <TextInput style={[styles.input, styles.inputHalf]} placeholder="Tồn kho" value={stock} onChangeText={setStock} keyboardType="numeric" />
              </View>

              <Text style={styles.label}>Danh mục</Text>
              <View style={styles.categoryPicker}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryOption, category === cat && styles.categoryOptionActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryOptionText, category === cat && styles.categoryOptionTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                {editingProduct && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => { setShowModal(false); handleDelete(editingProduct); }}>
                    <Text style={styles.deleteBtnText}>🗑 Xóa</Text>
                  </TouchableOpacity>
                )}
                <AnimatedButton title="Lưu" onPress={handleSave} variant="primary" />
              </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  categoryTabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  categoryTab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border },
  categoryTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryTabText: { fontSize: 12, color: Colors.textSecondary },
  categoryTabTextActive: { color: '#fff', fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  productCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, ...Shadows.card },
  productLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  productImage: { width: 56, height: 56, borderRadius: 12, marginRight: 12 },
  productImagePlaceholder: { width: 56, height: 56, borderRadius: 12, backgroundColor: Colors.primaryBg, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  productImageEmoji: { fontSize: 24 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  productCategory: { fontSize: 12, color: Colors.textMuted },
  productStock: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  productStockLow: { color: Colors.red },
  productRight: { alignItems: 'flex-end' },
  productPrice: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  productProfit: { fontSize: 11, color: Colors.green, marginTop: 2 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalClose: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  imagePicker: { alignSelf: 'center', marginBottom: 20 },
  imagePreview: { width: 100, height: 100, borderRadius: 16 },
  imagePlaceholder: { width: 100, height: 100, borderRadius: 16, backgroundColor: Colors.inputBg, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
  imageIcon: { fontSize: 32, marginBottom: 4 },
  imageText: { fontSize: 12, color: Colors.textMuted },
  input: { backgroundColor: Colors.inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row', gap: 12 },
  inputHalf: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  categoryPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  categoryOption: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border },
  categoryOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryOptionText: { fontSize: 13, color: Colors.text },
  categoryOptionTextActive: { color: '#fff', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  deleteBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 12 },
  deleteBtnText: { color: Colors.red, fontWeight: '600' },
});
