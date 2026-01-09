import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Modal,
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
import { Colors, Shadows } from '../constants/theme';
import AnimatedScreen from '../components/AnimatedScreen';

export function ExpenseScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const categories = [
    { key: 'import', label: 'Nhập hàng', icon: '📦' },
    { key: 'salary', label: 'Lương', icon: '💼' },
    { key: 'rent', label: 'Mặt bằng', icon: '🏠' },
    { key: 'electric', label: 'Điện', icon: '⚡' },
    { key: 'water', label: 'Nước', icon: '💧' },
    { key: 'internet', label: 'Internet', icon: '📶' },
    { key: 'other', label: 'Khác', icon: '📝' },
  ];

  // Load expenses từ Firebase
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const loadExpenses = async () => {
      if (isFirebaseConfigured) {
        try {
          const data = await getExpensesFromFirebase();
          setExpenses(data);
          // Subscribe to realtime updates
          unsubscribe = subscribeToExpenses((newExpenses) => {
            setExpenses(newExpenses);
          });
        } catch (error) {
          console.error('Error loading expenses:', error);
        }
      }
      setIsLoading(false);
    };
    loadExpenses();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  const handleAddExpense = async () => {
    if (!inputText.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập chi phí');
      return;
    }
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
        if (isFirebaseConfigured) {
          const id = await addExpenseToFirebase({
            name,
            amount,
            category: selectedCategory || 'other',
            createdAt: new Date(),
          });
          setExpenses([{ id, name, amount, category: selectedCategory || 'other', createdAt: new Date() }, ...expenses]);
        } else {
          const newExpense: Expense = {
            id: Date.now().toString(),
            name,
            amount,
            category: selectedCategory || 'other',
            createdAt: new Date(),
          };
          setExpenses([newExpense, ...expenses]);
        }
        setShowAddModal(false);
        setInputText('');
        setSelectedCategory('');
      } catch (error) {
        console.error('Error adding expense:', error);
        Alert.alert('Lỗi', 'Không thể lưu chi phí. Vui lòng thử lại.');
      }
      setIsSaving(false);
    } else {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền\nVD: "Mua cam 500k"');
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <AnimatedScreen>
    <View style={styles.container}>
      <LinearGradient colors={['#E8F4FE', '#EEF2FF', '#F8FAFC']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Chi phí</Text>
          <Text style={styles.subTitle}>Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              {/* Robot */}
              <Animated.View style={[styles.robotWrap, { transform: [{ translateY: floatAnim }] }]}>
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
                
                <Text style={styles.spark1}>✦</Text>
                <Text style={styles.spark2}>◇</Text>
                <Text style={styles.spark3}>✦</Text>
                
                <View style={styles.robot}>
                  <View style={styles.earL} />
                  <View style={styles.earR} />
                  <View style={styles.head}>
                    <View style={styles.eyes}>
                      <View style={styles.eye} />
                      <View style={styles.eye} />
                    </View>
                    <View style={styles.mouth} />
                  </View>
                </View>
                <View style={styles.shadow} />
              </Animated.View>

              {/* Features */}
              <View style={styles.features}>
                <View style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={styles.featureEmoji}>✨</Text>
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureBold}>5 giây thêm chi phí:</Text>
                    <Text style={styles.featureNormal}> Đọc, gõ là xong</Text>
                  </View>
                </View>

                <View style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={styles.featureEmoji}>📊</Text>
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureBold}>Xem nhanh top chi:</Text>
                    <Text style={styles.featureNormal}> AI tự tổng hợp cho bạn</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>💸 Tổng chi tháng này</Text>
                <Text style={styles.summaryValue}>{formatMoney(totalExpense)}đ</Text>
              </View>
              {expenses.map((expense) => (
                <View key={expense.id} style={styles.expenseItem}>
                  <View style={styles.expenseIcon}>
                    <View style={styles.expenseDot} />
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseName}>{expense.name}</Text>
                    <Text style={styles.expenseTime}>
                      {new Date(expense.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>-{formatMoney(expense.amount)}đ</Text>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 200 }} />
        </ScrollView>

        {/* FAB */}
        <Animated.View style={[styles.fabWrap, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)} activeOpacity={0.9}>
            <LinearGradient colors={['#818CF8', '#6366F1']} style={styles.fabCircle}>
              <Text style={styles.fabPlus}>+</Text>
            </LinearGradient>
            <Text style={styles.fabLabel}>Thêm chi phí</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      {/* Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <LinearGradient colors={['#EEF2FF', '#F8FAFC', '#FFF']} style={styles.modalGradient}>
              <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Thêm chi phí</Text>
                  <TouchableOpacity onPress={() => setShowAddModal(false)}>
                    <Text style={styles.modalClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                  <View style={styles.modalBody}>
                    <View style={styles.hintBox}>
                      <Text style={styles.hintIcon}>💡</Text>
                      <Text style={styles.hintText}>
                        Nhập tên + số tiền, ví dụ: <Text style={styles.hintBold}>Mua cam 500k</Text>
                      </Text>
                    </View>

                    <Text style={styles.catLabel}>Danh mục</Text>
                    <View style={styles.catsWrap}>
                      {categories.map((c) => (
                        <TouchableOpacity
                          key={c.key}
                          style={[styles.catChip, selectedCategory === c.key && styles.catChipActive]}
                          onPress={() => setSelectedCategory(selectedCategory === c.key ? '' : c.key)}
                        >
                          <Text style={styles.catIcon}>{c.icon}</Text>
                          <Text style={[styles.catText, selectedCategory === c.key && styles.catTextActive]}>{c.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputBar}>
                    <TextInput
                      style={styles.inputField}
                      placeholder="Nhập tên khoản chi + số tiền..."
                      placeholderTextColor="#94A3B8"
                      value={inputText}
                      onChangeText={setInputText}
                      onSubmitEditing={handleAddExpense}
                      autoFocus
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleAddExpense}>
                      <LinearGradient colors={['#818CF8', '#6366F1']} style={styles.sendBtnGradient}>
                        <Text style={styles.sendBtnText}>Thêm</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </KeyboardAvoidingView>
              </SafeAreaView>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
    </AnimatedScreen>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subTitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  content: { flex: 1, paddingHorizontal: 20 },

  emptyState: { alignItems: 'center', paddingTop: 30 },

  robotWrap: { width: 200, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 30, position: 'relative' },
  aiBadge: { position: 'absolute', top: 10, left: 30, backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, zIndex: 5 },
  aiBadgeText: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },
  spark1: { position: 'absolute', top: 20, right: 40, fontSize: 16, color: '#818CF8' },
  spark2: { position: 'absolute', top: 70, left: 20, fontSize: 12, color: '#A5B4FC' },
  spark3: { position: 'absolute', bottom: 50, right: 30, fontSize: 12, color: '#A5B4FC' },
  robot: { position: 'relative' },
  earL: { position: 'absolute', left: -15, top: 20, width: 18, height: 30, backgroundColor: '#94A3B8', borderRadius: 9 },
  earR: { position: 'absolute', right: -15, top: 20, width: 18, height: 30, backgroundColor: '#94A3B8', borderRadius: 9 },
  head: { width: 110, height: 80, backgroundColor: '#E2E8F0', borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  eyes: { flexDirection: 'row', gap: 20, marginBottom: 10 },
  eye: { width: 10, height: 10, backgroundColor: '#1E293B', borderRadius: 5 },
  mouth: { width: 35, height: 6, backgroundColor: '#1E293B', borderRadius: 3 },
  shadow: { width: 90, height: 15, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 45, marginTop: 10 },

  features: { width: '100%', paddingHorizontal: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  featureIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  featureEmoji: { fontSize: 20 },
  featureTextWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  featureBold: { fontSize: 15, fontWeight: '700', color: Colors.text },
  featureNormal: { fontSize: 15, color: Colors.textSecondary },

  summaryCard: { backgroundColor: Colors.red, borderRadius: 16, padding: 20, marginBottom: 16, ...Shadows.card },
  summaryLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 6 },
  summaryValue: { fontSize: 30, fontWeight: '800', color: '#FFF' },
  
  expenseItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.white, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 10, 
    ...Shadows.card,
  },
  expenseIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.redBg, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  expenseDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.red },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  expenseTime: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  expenseAmount: { fontSize: 16, fontWeight: '700', color: Colors.red },

  fabWrap: { position: 'absolute', bottom: 110, right: 20 },
  fab: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.white, 
    borderRadius: 28, 
    paddingRight: 18, 
    paddingLeft: 4, 
    paddingVertical: 4, 
    ...Shadows.purple,
  },
  fabCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  fabPlus: { fontSize: 28, color: '#FFF', fontWeight: '300', marginTop: -2 },
  fabLabel: { fontSize: 15, fontWeight: '600', color: Colors.text, marginLeft: 10 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBox: { flex: 1, marginTop: 80 },
  modalGradient: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  modalClose: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  modalBody: { flex: 1, paddingHorizontal: 20 },
  
  hintBox: { 
    flexDirection: 'row',
    alignItems: 'center', 
    backgroundColor: Colors.primaryBg, 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 24,
  },
  hintIcon: { fontSize: 20, marginRight: 12 },
  hintText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  hintBold: { color: Colors.text, fontWeight: '600' },
  
  catLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 12 },
  catsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 20, 
    backgroundColor: Colors.white, 
    borderWidth: 1, 
    borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  catIcon: { fontSize: 14, marginRight: 6 },
  catText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  catTextActive: { color: Colors.primary, fontWeight: '600' },
  
  inputBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    paddingBottom: 30, 
    backgroundColor: Colors.white, 
    borderTopWidth: 1, 
    borderTopColor: Colors.borderLight, 
    gap: 10,
  },
  inputField: { flex: 1, backgroundColor: Colors.inputBg, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 14, fontSize: 15, color: Colors.text },
  sendBtn: { borderRadius: 24, overflow: 'hidden' },
  sendBtnGradient: { paddingHorizontal: 20, paddingVertical: 14 },
  sendBtnText: { fontSize: 14, fontWeight: '600', color: Colors.white },
});
