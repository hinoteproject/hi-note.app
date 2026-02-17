import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import AnimatedScreen from '../components/AnimatedScreen';
import GlassCard from '../components/GlassCard';
import { Colors, Gradients, Shadows } from '../constants/theme';

export function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { bankAccounts, addBankAccount, setDefaultBank, user, logout, useMenuMatching, setUseMenuMatching } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const handleAddBank = () => {
    if (!bankName || !accountNumber || !accountName) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    addBankAccount({
      bankName,
      accountNumber,
      accountName,
      isDefault: bankAccounts.length === 0,
    });
    setModalVisible(false);
    setBankName('');
    setAccountNumber('');
    setAccountName('');
    Alert.alert('✓ Thành công', 'Đã thêm tài khoản ngân hàng');
  };

  const menuItems = [
    { title: 'Quản lý thực đơn', icon: '🍲', route: 'Products', gradient: ['#FDF2F8', '#FCE7F3'] },
    { title: 'Khách hàng', icon: '👥', route: 'Customers', gradient: ['#EFF6FF', '#DBEAFE'] },
    { title: 'Kho hàng', icon: '📦', route: 'Stock', gradient: ['#F0FDF4', '#DCFCE7'] },
    { title: 'Báo cáo', icon: '📊', route: 'Reports', gradient: ['#F5F3FF', '#EDE9FE'] },
  ];

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <LinearGradient colors={Gradients.header} style={styles.gradient} />

        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

            {/* ─── Profile Card ─── */}
            <GlassCard style={styles.profileCard} intensity="strong">
              {/* Avatar with Gradient Ring */}
              <View style={styles.avatarOuter}>
                <LinearGradient
                  colors={Gradients.primary}
                  style={styles.avatarRing}
                >
                  <View style={styles.avatarInner}>
                    <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
                  </View>
                </LinearGradient>
                <View style={styles.verifyBadge}>
                  <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.verifyGradient}>
                    <Text style={styles.verifyIcon}>✓</Text>
                  </LinearGradient>
                </View>
              </View>

              <Text style={styles.userName}>{user?.name || 'Chủ quán'}</Text>
              <Text style={styles.userRole}>{user?.business || 'Chủ quán'}{user?.city ? ` • ${user.city}` : ''}</Text>

              <TouchableOpacity style={styles.editProfileBtn} activeOpacity={0.8}>
                <LinearGradient
                  colors={['rgba(16,185,129,0.1)', 'rgba(16,185,129,0.05)']}
                  style={styles.editProfileGradient}
                >
                  <Text style={styles.editProfileText}>✏️ Chỉnh sửa hồ sơ</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>

            {/* ─── AI Settings ─── */}
            <Text style={styles.sectionTitle}>🧠 Cấu hình AI</Text>
            <GlassCard style={styles.settingsCard} intensity="strong">
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <LinearGradient colors={Gradients.purpleSoft} style={styles.settingIcon}>
                    <Text style={{ fontSize: 18 }}>✨</Text>
                  </LinearGradient>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Tự động khớp menu</Text>
                    <Text style={styles.settingDesc}>AI tự chọn món gần đúng nhất</Text>
                  </View>
                </View>
                <Switch
                  trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                  thumbColor={'#FFFFFF'}
                  onValueChange={setUseMenuMatching}
                  value={useMenuMatching}
                />
              </View>
            </GlassCard>

            {/* ─── Store Management Grid ─── */}
            <Text style={styles.sectionTitle}>🏪 Quản lý cửa hàng</Text>
            <View style={styles.menuGrid}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => navigation.navigate(item.route)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={item.gradient as [string, string]}
                    style={styles.menuIconBox}
                  >
                    <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                  </LinearGradient>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ─── Bank Accounts ─── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏦 Tài khoản nhận tiền</Text>
              <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.7}>
                <LinearGradient colors={Gradients.primary} style={styles.addBankBtn}>
                  <Text style={styles.addBankText}>+ Thêm</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <GlassCard style={styles.bankCard} intensity="strong" noPadding>
              {bankAccounts.length === 0 ? (
                <View style={styles.emptyBank}>
                  <Text style={styles.emptyBankEmoji}>🏦</Text>
                  <Text style={styles.emptyBankText}>Chưa có tài khoản ngân hàng</Text>
                  <Text style={styles.emptyBankSub}>Thêm tài khoản để nhận thanh toán QR</Text>
                </View>
              ) : (
                bankAccounts.map((bank, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.bankRow, index > 0 && styles.rowBorder]}
                    onPress={() => setDefaultBank(bank.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.bankLogoWrap}>
                      <Image
                        source={{ uri: `https://img.vietqr.io/image/${bank.bankName}-logo.png` }}
                        style={styles.bankLogo}
                      />
                    </View>
                    <View style={styles.bankInfo}>
                      <Text style={styles.bankName}>{bank.bankName}</Text>
                      <Text style={styles.bankNumber}>{bank.accountNumber}</Text>
                      <Text style={styles.bankOwner}>{bank.accountName}</Text>
                    </View>
                    {bank.isDefault && (
                      <LinearGradient colors={Gradients.primarySoft} style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>✓ Mặc định</Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </GlassCard>

            {/* ─── Logout ─── */}
            <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>

            <View style={{ height: 120 }} />
          </ScrollView>
        </SafeAreaView>

        {/* ─── Add Bank Modal ─── */}
        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Thêm tài khoản ngân hàng</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ngân hàng</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: MB, VCB, ACB..."
                  placeholderTextColor="#94A3B8"
                  value={bankName}
                  onChangeText={setBankName}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số tài khoản</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số tài khoản"
                  placeholderTextColor="#94A3B8"
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Chủ tài khoản</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tên chủ tài khoản"
                  placeholderTextColor="#94A3B8"
                  value={accountName}
                  onChangeText={setAccountName}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} activeOpacity={0.8}>
                  <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtnWrap} onPress={handleAddBank} activeOpacity={0.85}>
                  <LinearGradient colors={Gradients.primary} style={styles.saveBtn}>
                    <Text style={styles.saveText}>Lưu tài khoản</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 350 },
  safeArea: { flex: 1 },
  content: { padding: 16 },

  // Profile Card
  profileCard: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  avatarOuter: { marginBottom: 14, position: 'relative' },
  avatarRing: {
    width: 84, height: 84, borderRadius: 42,
    justifyContent: 'center', alignItems: 'center',
    padding: 3,
  },
  avatarInner: {
    width: '100%', height: '100%', borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: Colors.primary },
  verifyBadge: {
    position: 'absolute', bottom: 0, right: -2,
    width: 26, height: 26, borderRadius: 13,
    overflow: 'hidden',
    borderWidth: 2.5, borderColor: '#FFF',
  },
  verifyGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  verifyIcon: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  userName: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4, letterSpacing: -0.3 },
  userRole: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 12 },
  editProfileBtn: { borderRadius: 20, overflow: 'hidden' },
  editProfileGradient: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20 },
  editProfileText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#334155', marginBottom: 12, marginLeft: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  // AI Settings Card
  settingsCard: { marginBottom: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  settingDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  // Menu Grid
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  menuItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    padding: 18,
    borderRadius: 22,
    alignItems: 'center',
    ...Shadows.card,
  },
  menuIconBox: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  menuTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },

  // Bank Section
  addBankBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14 },
  addBankText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  bankCard: { marginBottom: 20 },
  bankRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  bankLogoWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center',
    marginRight: 12, overflow: 'hidden',
  },
  bankLogo: { width: 36, height: 36, borderRadius: 8 },
  bankInfo: { flex: 1 },
  bankName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  bankNumber: { fontSize: 13, color: '#334155', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  bankOwner: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  defaultBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  defaultText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  emptyBank: { alignItems: 'center', padding: 24 },
  emptyBankEmoji: { fontSize: 32, marginBottom: 8 },
  emptyBankText: { fontSize: 15, fontWeight: '600', color: '#334155', marginBottom: 4 },
  emptyBankSub: { fontSize: 12, color: '#94A3B8' },

  // Logout
  logoutBtn: {
    backgroundColor: '#FEF2F2', paddingVertical: 16, borderRadius: 18, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.1)',
  },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingTop: 16,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, color: '#0F172A', textAlign: 'center' },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6, marginLeft: 4 },
  input: {
    backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, borderWidth: 1.5, borderColor: '#E2E8F0', color: '#1E293B',
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, padding: 15, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center',
  },
  cancelText: { fontWeight: '600', color: '#64748B', fontSize: 15 },
  saveBtnWrap: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  saveBtn: { padding: 15, alignItems: 'center', borderRadius: 16 },
  saveText: { fontWeight: '700', color: '#FFF', fontSize: 15 },
});
