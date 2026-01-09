import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import AnimatedScreen from '../components/AnimatedScreen';
import { parseVoiceToOrder } from '../services/orderParser';
import { startRecording, stopRecording, cancelRecording, isRecording as checkIsRecording } from '../services/voiceRecorder';
import { Colors } from '../constants/theme';
import { OrderItem } from '../types';

export function SellScreen() {
  const navigation = useNavigation<any>();
  const [inputText, setInputText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingAnim = useRef(new Animated.Value(1)).current;

  const {
    products,
    currentOrder,
    currentTable,
    addToCurrentOrder,
    updateCurrentOrderItem,
    removeFromCurrentOrder,
    clearCurrentOrder,
    setCurrentTable,
    findProductByName,
    addProduct,
  } = useStore();

  const total = currentOrder.reduce((sum, item) => sum + item.subtotal, 0);

  const formatMoney = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);

  // Recording animation
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(recordingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      recordingAnim.setValue(1);
    }
  }, [isRecording]);

  const processInput = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    
    try {
      const result = await parseVoiceToOrder(text, products);
      
      if (result.table) {
        setCurrentTable(result.table);
      }

      for (const item of result.items) {
        let product = findProductByName(item.name);
        
        if (!product && item.price) {
          Alert.alert(
            '🆕 Sản phẩm mới',
            `"${item.name}" - ${formatMoney(item.price)}đ\nLưu vào danh sách?`,
            [
              { text: 'Không', style: 'cancel' },
              {
                text: 'Lưu',
                onPress: () => {
                  addProduct({
                    name: item.name,
                    price: item.price!,
                    aliases: [],
                    learnedFromVoice: true,
                  });
                },
              },
            ]
          );
        }

        const orderItem: OrderItem = {
          productId: product?.id || `new-${Date.now()}-${Math.random()}`,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: product?.price || item.price || 0,
          subtotal: (product?.price || item.price || 0) * item.quantity,
        };
        
        if (orderItem.unitPrice > 0) {
          addToCurrentOrder(orderItem);
        }
      }

      if (result.newProducts.length > 0) {
        const unknownItems = result.newProducts.filter(name => {
          const item = result.items.find(i => i.name === name);
          return !item?.price;
        });
        
        if (unknownItems.length > 0) {
          Alert.alert(
            '⚠️ Chưa có giá',
            `Các sản phẩm sau chưa có giá:\n${unknownItems.join(', ')}\n\nHãy nói kèm giá hoặc thêm vào danh sách sản phẩm.`
          );
        }
      }
    } catch (error) {
      console.error('Process error:', error);
      Alert.alert('Lỗi', 'Không thể xử lý. Vui lòng thử lại.');
    }
    
    setIsProcessing(false);
    setInputText('');
  };

  const handleSubmitInput = () => {
    if (inputText.trim()) {
      processInput(inputText);
    }
  };

  const handleMicPress = async () => {
    if (isRecording) {
      // Stop recording
      try {
        setIsProcessing(true);
        const transcribedText = await stopRecording();
        setIsRecording(false);
        
        if (transcribedText) {
          setInputText(transcribedText);
          // Auto process
          await processInput(transcribedText);
        }
      } catch (error: any) {
        console.error('Stop recording error:', error);
        Alert.alert('Lỗi', error.message || 'Không thể xử lý giọng nói');
        setIsRecording(false);
      }
      setIsProcessing(false);
    } else {
      // Start recording
      try {
        await startRecording();
        setIsRecording(true);
      } catch (error: any) {
        console.error('Start recording error:', error);
        Alert.alert('Lỗi', error.message || 'Không thể bắt đầu ghi âm');
      }
    }
  };

  const handleQuantityChange = (index: number, delta: number) => {
    const item = currentOrder[index];
    const newQty = item.quantity + delta;
    
    if (newQty <= 0) {
      removeFromCurrentOrder(index);
    } else {
      updateCurrentOrderItem(index, {
        quantity: newQty,
        subtotal: newQty * item.unitPrice,
      });
    }
  };

  const handleDone = () => {
    if (currentOrder.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng thêm sản phẩm vào đơn');
      return;
    }
    navigation.navigate('Payment');
  };

  const handleClear = () => {
    if (currentOrder.length === 0) return;
    Alert.alert('Xác nhận', 'Xóa toàn bộ đơn hàng?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: clearCurrentOrder },
    ]);
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Cleanup recording on unmount
    return () => {
      if (checkIsRecording()) {
        cancelRecording();
      }
    };
  }, []);

  return (
    <AnimatedScreen>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#E8F4FE', '#E0EAFC', '#F8FAFC']} style={styles.gradient} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Bán hàng</Text>
          
          <TouchableOpacity 
            style={[styles.doneBtn, currentOrder.length === 0 && styles.doneBtnDisabled]}
            onPress={handleDone}
            disabled={currentOrder.length === 0}
          >
            <Text style={[styles.doneBtnText, currentOrder.length === 0 && styles.doneBtnTextDisabled]}>
              Xong
            </Text>
          </TouchableOpacity>
        </View>

        {/* Customer Input */}
        <View style={styles.customerWrap}>
          <TextInput
            style={styles.customerInput}
            placeholder="Khách hàng, phòng bàn..."
            placeholderTextColor={Colors.textMuted}
            value={customerName}
            onChangeText={setCustomerName}
          />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {currentOrder.length === 0 ? (
            <View style={styles.emptyState}>
              <Animated.View style={[styles.emptyIconWrap, { transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient colors={['#A78BFA', '#8B5CF6']} style={styles.emptyIconGradient}>
                  <Text style={styles.emptyIcon}>🛒</Text>
                </LinearGradient>
              </Animated.View>
              <Text style={styles.emptyTitle}>Đơn này bạn bán hàng gì?</Text>
              <Text style={styles.emptyDesc}>
                Nhấn nút 🎤 để nói hoặc gõ tên hàng + giá để Hi-Note tính tiền nhanh.
              </Text>
              <View style={styles.exampleBox}>
                <Text style={styles.exampleLabel}>💡 Ví dụ:</Text>
                <Text style={styles.exampleText}>"2 phở bò 35k, 1 cà phê 25k, bàn 3"</Text>
              </View>
            </View>
          ) : (
            <View style={styles.orderList}>
              {currentTable && (
                <View style={styles.tableBadge}>
                  <Text style={styles.tableBadgeIcon}>🪑</Text>
                  <Text style={styles.tableBadgeText}>Bàn {currentTable}</Text>
                </View>
              )}

              {currentOrder.map((item, index) => (
                <View key={index} style={styles.orderItem}>
                  <View style={styles.orderItemMain}>
                    <Text style={styles.orderItemName}>{item.productName}</Text>
                    <View style={styles.orderItemMeta}>
                      <Text style={styles.orderItemPrice}>{formatMoney(item.unitPrice)}đ</Text>
                      <View style={styles.inputBadge}>
                        <Text style={styles.inputBadgeText}>🤖 AI</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.orderItemRight}>
                    <View style={styles.qtyControl}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => handleQuantityChange(index, -1)}>
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{item.quantity}</Text>
                      <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnPlus]} onPress={() => handleQuantityChange(index, 1)}>
                        <Text style={[styles.qtyBtnText, styles.qtyBtnPlusText]}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.orderItemSubtotal}>{formatMoney(item.subtotal)}đ</Text>
                  </View>
                </View>
              ))}

              <View style={styles.totalCard}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tổng tiền hàng</Text>
                  <Text style={styles.totalValue}>{formatMoney(total)}đ</Text>
                </View>
                <View style={styles.totalDivider} />
                <View style={styles.totalRowMain}>
                  <Text style={styles.totalLabelMain}>💰 Tổng cộng</Text>
                  <Text style={styles.totalValueMain}>{formatMoney(total)}đ</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                <Text style={styles.clearBtnText}>🗑️ Xóa đơn hàng</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Help Button */}
        <TouchableOpacity style={styles.helpBtn}>
          <Text style={styles.helpIcon}>?</Text>
        </TouchableOpacity>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.gridBtn}>
            <Text style={styles.gridIcon}>⊞</Text>
          </TouchableOpacity>
          
          <View style={styles.textInputWrap}>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập tên hàng + giá"
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSubmitInput}
              returnKeyType="send"
              editable={!isProcessing && !isRecording}
            />
            {isProcessing && (
              <View style={styles.processingBadge}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.micBtn} onPress={handleMicPress} disabled={isProcessing}>
            <Animated.View style={{ transform: [{ scale: isRecording ? recordingAnim : 1 }] }}>
              <LinearGradient 
                colors={isRecording ? ['#EF4444', '#DC2626'] : ['#A78BFA', '#8B5CF6']} 
                style={styles.micBtnGradient}
              >
                <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Đang nghe... Nhấn để dừng</Text>
          </View>
        )}
      </SafeAreaView>
      </KeyboardAvoidingView>
    </AnimatedScreen>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: '#64748B',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
  },
  doneBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  doneBtnTextDisabled: {
    color: '#94A3B8',
  },
  customerWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  customerInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIconWrap: {
    marginBottom: 24,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  exampleBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  exampleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 14,
    color: '#166534',
    fontStyle: 'italic',
  },
  orderList: {
    paddingTop: 8,
  },
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  tableBadgeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  tableBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderItemMain: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  orderItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
  },
  inputBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  inputBadgeText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
  orderItemRight: {
    alignItems: 'flex-end',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginBottom: 8,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnPlus: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  qtyBtnText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
  },
  qtyBtnPlusText: {
    color: '#FFFFFF',
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    minWidth: 32,
    textAlign: 'center',
  },
  orderItemSubtotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  totalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  totalValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  totalRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabelMain: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  totalValueMain: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3B82F6',
  },
  clearBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  clearBtnText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  helpBtn: {
    position: 'absolute',
    right: 16,
    bottom: 180,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  helpIcon: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  gridBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gridIcon: {
    fontSize: 20,
    color: '#64748B',
  },
  textInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    paddingVertical: 12,
  },
  processingBadge: {
    marginLeft: 8,
  },
  micBtn: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    fontSize: 24,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
});
