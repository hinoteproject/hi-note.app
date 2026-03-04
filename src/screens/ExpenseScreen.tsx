import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  addExpenseToFirebase,
  getExpensesFromFirebase,
  subscribeToExpenses,
  Expense
} from '../services/firebaseStore';
import { isFirebaseConfigured } from '../config/keys';
import { Colors, Gradients, Shadows } from '../constants/theme';
import AnimatedScreen from '../components/AnimatedScreen';
import GlassCard from '../components/GlassCard';
import AnimatedNumber from '../components/AnimatedNumber';
import { startRecording, stopRecording, cancelRecording, isRecording as checkIsRecording, onInterimResult } from '../services/voiceRecorder';
import { useStore } from '../store/useStore';

export function ExpenseScreen() {
  const user = useStore(state => state.user);
  const userId = user?.id;
  const [showAddModal, setShowAddModal] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // FAB animation
  const fabScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      // Show real-time transcript in input field
      onInterimResult((text) => setInputText(text));
    } else {
      pulseAnim.setValue(1);
      onInterimResult(null);
    }
  }, [isRecording]);

  const categories = [
    { key: 'import', label: 'Nhập hàng', icon: '📦', gradient: ['#FEF3C7', '#FDE68A'] },
    { key: 'salary', label: 'Lương', icon: '💼', gradient: ['#EDE9FE', '#DDD6FE'] },
    { key: 'rent', label: 'Mặt bằng', icon: '🏠', gradient: ['#FCE7F3', '#FBCFE8'] },
    { key: 'electric', label: 'Điện', icon: '⚡', gradient: ['#FEF9C3', '#FEF08A'] },
    { key: 'water', label: 'Nước', icon: '💧', gradient: ['#E0F2FE', '#BAE6FD'] },
    { key: 'internet', label: 'Internet', icon: '📶', gradient: ['#D1FAE5', '#A7F3D0'] },
    { key: 'other', label: 'Khác', icon: '📝', gradient: ['#F1F5F9', '#E2E8F0'] },
  ];

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const loadExpenses = async () => {
      const mockData: Expense[] = [
        { id: '1', name: 'Nhập rau củ', amount: 500000, category: 'import', createdAt: new Date() },
        { id: '2', name: 'Tiền điện tháng 5', amount: 1200000, category: 'electric', createdAt: new Date(Date.now() - 86400000) },
      ];
      setExpenses(mockData);
      if (isFirebaseConfigured && userId) {
        try {
          const data = await getExpensesFromFirebase(userId);
          if (data.length > 0) setExpenses(data);
          unsubscribe = subscribeToExpenses(userId, (newExpenses: Expense[]) => { setExpenses(newExpenses); });
        } catch (error) { console.error('Error loading expenses:', error); }
      }
      setIsLoading(false);
    };
    loadExpenses();
    return () => {
      if (unsubscribe) unsubscribe();
      if (checkIsRecording()) cancelRecording();
    };
  }, [userId]);

  const handleMicPress = async () => {
    if (isRecording) {
      try {
        setIsProcessing(true);
        const transcribedText = await stopRecording();
        setIsRecording(false);
        if (transcribedText) {
          setInputText(transcribedText);
        }
      } catch (error: any) {
        Alert.alert('Lỗi', error.message || 'Không thể xử lý giọng nói');
        setIsRecording(false);
      }
      setIsProcessing(false);
    } else {
      try { await startRecording(); setIsRecording(true); }
      catch (error: any) { Alert.alert('Lỗi', error.message || 'Không thể bắt đầu ghi âm'); }
    }
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  const handleAddExpense = async () => {
    if (!inputText.trim()) { Alert.alert('Thông báo', 'Vui lòng nhập chi phí'); return; }
    const regex = /(\d+)\s*(?:k|nghìn|ngàn|tr|triệu)?/i;
    const match = inputText.match(regex);
    if (match) {
      let amount = parseInt(match[1]);
      if (/tr|triệu/i.test(inputText)) amount *= 1000000;
      else if (/k|nghìn|ngàn/i.test(inputText)) amount *= 1000;
      else if (amount < 1000) amount *= 1000;
      const name = inputText.replace(regex, '').trim() ||
        categories.find(c => c.key === selectedCategory)?.label || 'Chi phí khác';
      setIsSaving(true);
      try {
        if (isFirebaseConfigured && userId) {
          await addExpenseToFirebase(userId, { name, amount, category: selectedCategory || 'other', createdAt: new Date() });
        } else {
          const newExpense: Expense = { id: Date.now().toString(), name, amount, category: selectedCategory || 'other', createdAt: new Date() };
          setExpenses([newExpense, ...expenses]);
        }
        setShowAddModal(false); setInputText(''); setSelectedCategory('');
      } catch (error) { Alert.alert('Lỗi', 'Không thể lưu chi phí. Vui lòng thử lại.'); }
      setIsSaving(false);
    } else { Alert.alert('Lỗi', 'Vui lòng nhập số tiền\nVD: "Mua cam 500k"'); }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const renderExpenseItem = ({ item, index }: { item: Expense; index: number }) => {
    const cat = categories.find(c => c.key === item.category) || categories[categories.length - 1];
    return (
      <View style={styles.expenseItem}>
        <LinearGradient colors={cat.gradient as [string, string]} style={styles.expenseIconWrap}>
          <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
        </LinearGradient>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseName}>{item.name}</Text>
          <Text style={styles.expenseCategory}>{cat.label} • {new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
        </View>
        <Text style={styles.expenseAmount}>-{formatMoney(item.amount)}đ</Text>
      </View>
    );
  };

  const handleFabPress = () => {
    Animated.sequence([
      Animated.spring(fabScale, { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 300 }),
    ]).start();
    setShowAddModal(true);
  };

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <LinearGradient colors={Gradients.header} style={styles.gradient} />

        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Chi phí</Text>
              <Text style={styles.subtitle}>Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</Text>
            </View>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryContainer}>
            <GlassCard style={styles.summaryCard} intensity="strong">
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>💸 Tổng chi tiêu</Text>
                  <AnimatedNumber
                    value={totalExpense}
                    style={styles.summaryValue}
                    suffix="đ"
                  />
                </View>
                <View style={styles.summaryMeta}>
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryPillText}>{expenses.length} khoản</Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* List */}
          <FlatList
            data={expenses}
            keyExtractor={item => item.id}
            renderItem={renderExpenseItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={<Text style={styles.sectionTitle}>Danh sách chi tiêu</Text>}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                  <Text style={{ fontSize: 32 }}>💸</Text>
                </View>
                <Text style={styles.emptyTitle}>Chưa có chi phí nào</Text>
                <Text style={styles.emptyText}>Nhấn + để thêm chi phí đầu tiên</Text>
              </View>
            }
          />

          {/* Premium FAB */}
          <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
            <TouchableOpacity activeOpacity={0.9} onPress={handleFabPress}>
              <LinearGradient colors={Gradients.primary} style={styles.fabGradient}>
                <Text style={styles.fabIcon}>+</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>

        {/* Add Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Thêm chi phí</Text>

              <Text style={styles.inputLabel}>Nội dung chi</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.mainInput}
                  placeholder="VD: Tiền điện 1tr5..."
                  placeholderTextColor="#94A3B8"
                  value={inputText}
                  onChangeText={setInputText}
                  autoFocus
                />
                <TouchableOpacity style={styles.micBtn} onPress={handleMicPress}>
                  {isProcessing ? (
                    <ActivityIndicator color={Colors.primary} size="small" />
                  ) : (
                    <Animated.Text style={[styles.micIcon, isRecording && { color: Colors.error, transform: [{ scale: pulseAnim }] }]}>
                      {isRecording ? '⏹' : '🎤'}
                    </Animated.Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Danh mục</Text>
              <View style={styles.catsGrid}>
                {categories.map(c => (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.catItem, selectedCategory === c.key && styles.catItemActive]}
                    onPress={() => setSelectedCategory(c.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.catIcon}>{c.icon}</Text>
                    <Text style={[styles.catText, selectedCategory === c.key && styles.catTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddExpense} disabled={isSaving} activeOpacity={0.85}>
                <LinearGradient colors={Gradients.primary} style={styles.saveBtnGradient}>
                  {isSaving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Lưu chi phí</Text>}
                </LinearGradient>
              </TouchableOpacity>
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

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 2 },

  summaryContainer: { paddingHorizontal: 16, marginBottom: 8 },
  summaryCard: { marginBottom: 0 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 6 },
  summaryValue: { fontSize: 32, fontWeight: '900', color: '#EF4444', letterSpacing: -1 },
  summaryMeta: { alignItems: 'flex-end' },
  summaryPill: {
    backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14,
  },
  summaryPillText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },

  listContent: { paddingHorizontal: 16, paddingBottom: 180 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#334155', marginBottom: 12, marginLeft: 4 },

  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    ...Shadows.md,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  emptyText: { color: '#94A3B8', fontSize: 14 },

  expenseItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 18, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    ...Shadows.sm,
  },
  expenseIconWrap: {
    width: 46, height: 46, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  expenseCategory: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  expenseAmount: { fontSize: 15, fontWeight: '800', color: '#EF4444' },

  fab: {
    position: 'absolute', bottom: 110, right: 20,
    ...Shadows.primary,
  },
  fabGradient: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center' },
  fabIcon: { fontSize: 30, color: '#FFF', marginTop: -2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16,
    marginBottom: 20, borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  mainInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1E293B' },
  micBtn: { padding: 8 },
  micIcon: { fontSize: 20, color: Colors.primary },

  catsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  catItemActive: { backgroundColor: '#ECFDF5', borderColor: Colors.primary },
  catIcon: { marginRight: 6, fontSize: 14 },
  catText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  catTextActive: { color: Colors.primary, fontWeight: '700' },

  saveBtn: { borderRadius: 16, overflow: 'hidden' },
  saveBtnGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
