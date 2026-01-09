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
import { Customer } from '../types';

export function CustomersScreen() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, orders } = useStore();
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'debt'>('all');

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');

  const filteredCustomers = customers.filter(c => {
    if (activeFilter === 'debt' && c.debt <= 0) return false;
    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      return c.name.toLowerCase().includes(lower) || c.phone?.includes(searchText);
    }
    return true;
  });

  const totalDebt = customers.reduce((sum, c) => sum + c.debt, 0);

  const resetForm = () => {
    setName(''); setPhone(''); setEmail(''); setAddress(''); setNote('');
    setEditingCustomer(null);
  };

  const openAddModal = () => { resetForm(); setShowModal(true); };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone || '');
    setEmail(customer.email || '');
    setAddress(customer.address || '');
    setNote(customer.note || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên khách hàng');
      return;
    }

    const data = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      note: note.trim() || undefined,
      totalSpent: editingCustomer?.totalSpent || 0,
      totalOrders: editingCustomer?.totalOrders || 0,
      debt: editingCustomer?.debt || 0,
    };

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, data);
    } else {
      await addCustomer(data);
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (customer: Customer) => {
    Alert.alert('Xóa khách hàng', `Bạn có chắc muốn xóa "${customer.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteCustomer(customer.id) },
    ]);
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  const renderCustomer = ({ item }: { item: Customer }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)} activeOpacity={0.7}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          {item.phone && <Text style={styles.cardPhone}>📱 {item.phone}</Text>}
          <Text style={styles.cardStats}>{item.totalOrders} đơn • {formatMoney(item.totalSpent)}đ</Text>
        </View>
      </View>
      {item.debt > 0 && (
        <View style={styles.debtBadge}>
          <Text style={styles.debtText}>Nợ {formatMoney(item.debt)}đ</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <LinearGradient colors={['#E8F4FE', '#E0EAFC', '#F8FAFC']} style={styles.gradient} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>Khách hàng</Text>
            <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
              <Text style={styles.addBtnText}>+ Thêm</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Tổng khách</Text>
              <Text style={styles.statValue}>{customers.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Tổng công nợ</Text>
              <Text style={[styles.statValue, { color: Colors.red }]}>{formatMoney(totalDebt)}đ</Text>
            </View>
          </View>

          <View style={styles.searchWrap}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput style={styles.searchInput} placeholder="Tìm khách hàng..." placeholderTextColor={Colors.textMuted} value={searchText} onChangeText={setSearchText} />
            </View>
          </View>

          <View style={styles.filterTabs}>
            <TouchableOpacity style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]} onPress={() => setActiveFilter('all')}>
              <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>Tất cả</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterTab, activeFilter === 'debt' && styles.filterTabActive]} onPress={() => setActiveFilter('debt')}>
              <Text style={[styles.filterTabText, activeFilter === 'debt' && styles.filterTabTextActive]}>Có công nợ</Text>
            </TouchableOpacity>
          </View>

          {filteredCustomers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyTitle}>Chưa có khách hàng</Text>
              <AnimatedButton title="+ Thêm khách hàng" onPress={openAddModal} variant="primary" />
            </View>
          ) : (
            <FlatList data={filteredCustomers} renderItem={renderCustomer} keyExtractor={item => item.id} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} />
          )}
        </SafeAreaView>

        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
              </View>
              <TextInput style={styles.input} placeholder="Tên khách hàng *" value={name} onChangeText={setName} />
              <TextInput style={styles.input} placeholder="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <TextInput style={styles.input} placeholder="Địa chỉ" value={address} onChangeText={setAddress} />
              <TextInput style={[styles.input, { height: 80 }]} placeholder="Ghi chú" value={note} onChangeText={setNote} multiline />
              <View style={styles.modalActions}>
                {editingCustomer && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => { setShowModal(false); handleDelete(editingCustomer); }}>
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
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, ...Shadows.card },
  statLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.text },
  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  filterTabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterTabText: { fontSize: 13, color: Colors.textSecondary },
  filterTabTextActive: { color: '#fff', fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, ...Shadows.card },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryBg, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  cardPhone: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardStats: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  debtBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  debtText: { fontSize: 12, fontWeight: '600', color: Colors.red },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalClose: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  input: { backgroundColor: Colors.inputBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  deleteBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FEE2E2', borderRadius: 12 },
  deleteBtnText: { color: Colors.red, fontWeight: '600' },
});
