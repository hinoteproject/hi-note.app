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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store/useStore';
import AnimatedScreen from '../components/AnimatedScreen';
import { Colors, Fonts, Radius, Spacing } from '../constants/theme';
import { BANK_CODES } from '../utils/format';

export function SettingsScreen() {
  const { bankAccounts, addBankAccount, setDefaultBank, user, logout } = useStore();
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

  return (
    <AnimatedScreen>
      <View style={styles.container}>
      <LinearGradient colors={['#E8F4FE', '#E0EAFC', '#F8FAFC']} style={styles.gradient} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
            </View>
            <Text style={styles.userName}>{user?.name || 'Chủ quán'}</Text>
            <Text style={styles.userPhone}>{user?.phone || ''}</Text>
          </View>

          {/* Account Card */}
          <View style={styles.menuCard}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={styles.menuEmoji}>👤</Text>
                </View>
                <Text style={styles.menuLabel}>Chủ quán Nguyễn Thanh Liêm</Text>
              </View>
              <View style={styles.checkBadge}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
            </View>

            <View style={[styles.menuItem, styles.menuItemBorder]}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#F5F3FF' }]}>
                  <Text style={styles.menuEmoji}>🔄</Text>
                </View>
                <Text style={styles.menuLinkText}>Quét QR để vào quán khác</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]} onPress={() => logout()}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={styles.menuEmoji}>🔓</Text>
                </View>
                <Text style={[styles.menuLabel, { color: Colors.red }]}>Đăng xuất</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Plan Card */}
          <TouchableOpacity style={styles.planCard} activeOpacity={0.8}>
            <View style={styles.planLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#DCFCE7' }]}>
                <Text style={styles.menuEmoji}>🎁</Text>
              </View>
              <View>
                <Text style={styles.planTitle}>Gói cơ bản</Text>
                <Text style={styles.planDesc}>Còn 300 lượt tạ...</Text>
              </View>
            </View>
            <Text style={styles.planArrow}>›</Text>
          </TouchableOpacity>

          {/* Settings Card */}
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={styles.menuEmoji}>📱</Text>
                </View>
                <Text style={styles.menuLinkText}>Thêm QR để bật loa báo ting ting</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#F5F3FF' }]}>
                  <Text style={styles.menuEmoji}>👥</Text>
                </View>
                <Text style={styles.menuLabel}>Thêm nhân viên</Text>
                <View style={styles.proBadge}>
                  <Text style={styles.proText}>Pro</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={styles.menuEmoji}>💾</Text>
                </View>
                <Text style={styles.menuLabel}>Quản lý dữ liệu</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Hotline */}
          <View style={styles.hotlineCard}>
            <Text style={styles.hotlineIcon}>📞</Text>
            <Text style={styles.hotlineLabel}>Gọi tổng đài:</Text>
            <Text style={styles.hotlineNumber}>1900 4512</Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Add Bank Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm tài khoản ngân hàng</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Chọn ngân hàng</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankPicker}>
              {Object.keys(BANK_CODES).map((name) => (
                <TouchableOpacity
                  key={name}
                  style={[styles.bankOption, bankName === name && styles.bankOptionActive]}
                  onPress={() => setBankName(name)}
                >
                  <Text style={[styles.bankOptionText, bankName === name && styles.bankOptionTextActive]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Số tài khoản</Text>
            <TextInput
              style={styles.modalInput}
              value={accountNumber}
              onChangeText={setAccountNumber}
              placeholder="VD: 1234567890"
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.inputLabel}>Tên chủ tài khoản</Text>
            <TextInput
              style={styles.modalInput}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="VD: NGUYEN VAN A"
              autoCapitalize="characters"
              placeholderTextColor={Colors.textMuted}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddBank}>
                <LinearGradient colors={[Colors.primaryLight, Colors.primary]} style={styles.saveBtnGradient}>
                  <Text style={styles.saveBtnText}>Thêm tài khoản</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 400 },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },

  profileSection: { alignItems: 'center', paddingVertical: 32 },
  avatarWrap: { marginBottom: 16 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: { fontSize: 40 },
  userName: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  userPhone: { fontSize: 15, color: Colors.textSecondary },

  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: Colors.borderLight },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuEmoji: { fontSize: 18 },
  menuLabel: { fontSize: 15, color: Colors.text, fontWeight: '500' },
  menuLinkText: { fontSize: 15, color: Colors.primary, fontWeight: '500' },
  menuArrow: { fontSize: 20, color: Colors.textMuted },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  proBadge: {
    backgroundColor: Colors.text,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  proText: { color: Colors.white, fontSize: 10, fontWeight: '700' },

  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  planLeft: { flexDirection: 'row', alignItems: 'center' },
  planTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  planDesc: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  planArrow: { fontSize: 24, color: Colors.textMuted },

  hotlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hotlineIcon: { fontSize: 20, marginRight: 12 },
  hotlineLabel: { fontSize: 15, color: Colors.textSecondary, marginRight: 8 },
  hotlineNumber: { fontSize: 18, fontWeight: '700', color: Colors.primary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalCloseText: { fontSize: 20, color: Colors.textMuted },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  bankPicker: { marginBottom: 16 },
  bankOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
    marginRight: 8,
  },
  bankOptionActive: { backgroundColor: Colors.primary },
  bankOptionText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  bankOptionTextActive: { color: Colors.white, fontWeight: '600' },
  modalInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  saveBtnGradient: { paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: Colors.white },
});
