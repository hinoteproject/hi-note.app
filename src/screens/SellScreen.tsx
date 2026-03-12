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
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../store/useStore';
import AnimatedScreen from '../components/AnimatedScreen';
import { parseVoiceToOrder } from '../services/orderParser';
import { startRecording, stopRecording, cancelRecording, isRecording as checkIsRecording, onInterimResult, onVolumeChange } from '../services/voiceRecorder';
import { extractOrderFromImage } from '../services/imageOcr';
import { Colors, Gradients, Shadows } from '../constants/theme';
import { OrderItem } from '../types';

export function SellScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingAnim = useRef(new Animated.Value(1)).current;
  const voiceSheetAnim = useRef(new Animated.Value(300)).current; // starts off-screen below

  // Waveform bars
  const waveAnims = useRef([...Array(5)].map(() => new Animated.Value(1))).current;

  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQty, setEditQty] = useState('');

  // Confirmation modal for voice results
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingItems, setPendingItems] = useState<OrderItem[]>([]);
  const [pendingTable, setPendingTable] = useState<string>('');

  // Real-time transcript from native STT
  const [liveTranscript, setLiveTranscript] = useState('');

  // Product Grid modal
  const [productGridVisible, setProductGridVisible] = useState(false);

  // Product Edit modal (trong thư viện sản phẩm)
  const [productEditVisible, setProductEditVisible] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProductName, setEditingProductName] = useState('');
  const [editingProductPrice, setEditingProductPrice] = useState('');

  const {
    products,
    currentOrder,
    currentTable,
    currentBillName,
    useMenuMatching,
    addToCurrentOrder,
    updateCurrentOrderItem,
    removeFromCurrentOrder,
    clearCurrentOrder,
    setCurrentTable,
    setCurrentBillName,
    findProductByName,
    addProduct,
    updateProduct,
  } = useStore();

  const total = currentOrder.reduce((sum, item) => sum + item.subtotal, 0);

  const formatMoney = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount);

  // Recording animation + voice sheet slide
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(recordingAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
      // Slide voice sheet up (like keyboard)
      Animated.spring(voiceSheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
      // Register real-time transcript callback — fills input directly
      onInterimResult((text) => {
        setInputText(text);
        setLiveTranscript(text);
        // Register real-time volume callback for dynamic waveform
        onVolumeChange((vol) => {
          // Volume ranges roughly from -2 to 10
          const normalized = Math.max(0, Math.min(1, (vol + 2) / 12));

          // Target scale based on volume (base 1 + up to 2.5 extra)
          const targetScale = 1 + (normalized * 2.5);

          // Animate each bar to the new scale with slight random variations for organic look
          waveAnims.forEach((anim) => {
            const randomTarget = targetScale * (0.8 + Math.random() * 0.4);
            Animated.spring(anim, {
              toValue: Math.max(1, randomTarget),
              useNativeDriver: true,
              damping: 10,
              stiffness: 100,
            }).start();
          });
        });
      });
    } else {
      recordingAnim.setValue(1);
      waveAnims.forEach(anim => anim.setValue(1));

      // Slide voice sheet down
      Animated.timing(voiceSheetAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();

      onInterimResult(null);
      onVolumeChange(null);
      setLiveTranscript('');
    }
  }, [isRecording]);

  const processInput = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);

    try {
      const result = await parseVoiceToOrder(text, products, { useMenuMatching });

      // Nếu không nhận diện được sản phẩm nào
      if (result.items.length === 0) {
        Alert.alert(
          '💡 Gợi ý',
          `Không nhận diện được đơn hàng từ: "${text}"\n\nHãy nói theo format:\n"2 phở bò 35k, 1 cà phê 25k, bàn 3"`
        );
        setIsProcessing(false);
        setInputText('');
        return;
      }

      // Prepare items for confirmation
      const itemsToConfirm: OrderItem[] = [];

      for (const item of result.items) {
        let product = findProductByName(item.name);

        const orderItem: OrderItem = {
          productId: product?.id || `new-${Date.now()}-${Math.random()}`,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: product?.price || item.price || 0,
          subtotal: (product?.price || item.price || 0) * item.quantity,
        };

        itemsToConfirm.push(orderItem);
      }

      // Show confirmation modal
      setPendingItems(itemsToConfirm);
      setPendingTable(result.table || '');
      setConfirmModalVisible(true);

    } catch (error) {
      console.error('Process error:', error);
      Alert.alert('Lỗi', 'Không thể xử lý. Vui lòng thử lại.');
    }

    setIsProcessing(false);
    setInputText('');
  };

  // Confirm and add items to order
  const handleConfirmItems = () => {
    if (pendingTable) {
      setCurrentTable(pendingTable);
    }

    pendingItems.forEach(item => {
      addToCurrentOrder(item);
    });

    setConfirmModalVisible(false);
    setPendingItems([]);
    setPendingTable('');
  };

  // Edit pending item
  const handleEditPendingItem = (index: number, updates: Partial<OrderItem>) => {
    const updated = [...pendingItems];
    updated[index] = { ...updated[index], ...updates };
    if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
      updated[index].subtotal = updated[index].quantity * updated[index].unitPrice;
    }
    setPendingItems(updated);
  };

  // Remove pending item
  const handleRemovePendingItem = (index: number) => {
    setPendingItems(pendingItems.filter((_, i) => i !== index));
  };

  const handleSubmitInput = () => {
    if (inputText.trim()) {
      processInput(inputText);
    }
  };

  const handleMicPress = async () => {
    if (isRecording) {
      // Stop recording — final text already in inputText via onInterimResult
      try {
        const transcribedText = await stopRecording();
        setIsRecording(false);
        if (transcribedText) {
          setInputText(transcribedText);
        }
      } catch (error: any) {
        console.error('Stop recording error:', error);
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        setInputText('');
        await startRecording();
        setIsRecording(true);
      } catch (error: any) {
        console.error('Start recording error:', error);
        Alert.alert('Lỗi', error.message || 'Không thể bắt đầu ghi âm');
      }
    }
  };

  // Submit from voice bottom sheet
  const handleVoiceSend = async () => {
    // Stop recognition if still running
    if (isRecording) {
      try {
        const text = await stopRecording();
        setIsRecording(false);
        if (text) setInputText(text);
        // Small delay so inputText state updates
        setTimeout(() => {
          const finalText = text || inputText;
          if (finalText.trim()) processInput(finalText.trim());
        }, 100);
      } catch {
        setIsRecording(false);
        if (inputText.trim()) processInput(inputText.trim());
      }
    } else {
      if (inputText.trim()) processInput(inputText.trim());
    }
  };

  const handleCameraPress = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền camera', 'Vui lòng cấp quyền camera để chụp ảnh hóa đơn');
        return;
      }

      // Show options: Camera or Gallery
      Alert.alert(
        '📸 Chụp ảnh hóa đơn',
        'Chọn nguồn ảnh',
        [
          {
            text: 'Chụp ảnh',
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled) {
                await processImageOrder(result.assets[0].uri);
              }
            },
          },
          {
            text: 'Chọn từ thư viện',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled) {
                await processImageOrder(result.assets[0].uri);
              }
            },
          },
          { text: 'Hủy', style: 'cancel' },
        ]
      );
    } catch (error: any) {
      console.error('Camera error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể mở camera');
    }
  };

  const processImageOrder = async (imageUri: string) => {
    setIsProcessing(true);
    try {
      console.log('📸 Processing image:', imageUri);
      const result = await extractOrderFromImage(imageUri, products);

      if (result.items.length === 0) {
        Alert.alert(
          '💡 Không tìm thấy đơn hàng',
          'Không thể đọc được thông tin từ ảnh. Vui lòng thử lại với ảnh rõ hơn.'
        );
        setIsProcessing(false);
        return;
      }

      // Prepare items for confirmation
      const itemsToConfirm: OrderItem[] = [];

      for (const item of result.items) {
        let product = findProductByName(item.name);

        const orderItem: OrderItem = {
          productId: product?.id || `new-${Date.now()}-${Math.random()}`,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: product?.price || item.price || 0,
          subtotal: (product?.price || item.price || 0) * item.quantity,
        };

        itemsToConfirm.push(orderItem);
      }

      // Show confirmation modal
      setPendingItems(itemsToConfirm);
      setPendingTable(result.table || '');
      setConfirmModalVisible(true);

    } catch (error: any) {
      console.error('Process image error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể xử lý ảnh. Vui lòng thử lại.');
    }
    setIsProcessing(false);
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

  // Xóa riêng lẻ sản phẩm
  const handleDeleteItem = (index: number) => {
    const item = currentOrder[index];
    Alert.alert('Xác nhận', `Xóa "${item.productName}" khỏi đơn?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => removeFromCurrentOrder(index) },
    ]);
  };

  // Mở modal chỉnh sửa
  const openEditModal = (index: number) => {
    const item = currentOrder[index];
    setEditingIndex(index);
    setEditName(item.productName);
    setEditPrice(item.unitPrice.toString());
    setEditQty(item.quantity.toString());
    setEditModalVisible(true);
  };

  // Lưu chỉnh sửa
  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    const newPrice = parseInt(editPrice) || 0;
    const newQty = parseInt(editQty) || 1;

    if (newPrice <= 0) {
      Alert.alert('Lỗi', 'Giá phải lớn hơn 0');
      return;
    }

    updateCurrentOrderItem(editingIndex, {
      productName: editName.trim() || currentOrder[editingIndex].productName,
      unitPrice: newPrice,
      quantity: newQty,
      subtotal: newPrice * newQty,
    });

    setEditModalVisible(false);
    setEditingIndex(null);
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
          style={styles.gradient}
        />

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
            <View style={styles.customerInputInner}>
              <TextInput
                style={styles.customerInput}
                placeholder="Khách hàng, phòng bàn..."
                placeholderTextColor={Colors.textMuted}
                value={currentBillName}
                onChangeText={setCurrentBillName}
              />
            </View>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={[styles.contentInner, { paddingBottom: 180 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {currentOrder.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Đơn này bạn bán hàng gì?</Text>
                <Text style={styles.emptyDesc}>
                  Chat tên hàng hoặc đọc tên hàng{'\n'}để Hi-Note tính tiền nhanh.
                </Text>
              </View>
            ) : (
              <View style={styles.orderList}>
                {currentTable && (
                  <View style={styles.tableBadge}>
                    <Text style={styles.tableBadgeIcon}>🪑</Text>
                    <Text style={styles.tableBadgeText}>Bàn {currentTable}</Text>
                  </View>
                )}
                <View>
                  {currentOrder.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.orderItem}
                      onPress={() => openEditModal(index)}
                    >
                      <View style={styles.orderItemMain}>
                        <View style={styles.orderItemNameRow}>
                          <Text style={styles.orderItemName}>{item.productName}</Text>
                          <TouchableOpacity
                            style={styles.deleteQuickBtn}
                            onPress={() => handleDeleteItem(index)}
                          >
                            <Text style={styles.deleteQuickIcon}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.orderItemMeta}>
                          <Text style={styles.orderItemPrice}>{formatMoney(item.unitPrice)}</Text>
                          <Text style={styles.orderItemSubtotalLabel}> = {formatMoney(item.subtotal)}đ</Text>
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
                      </View>
                    </TouchableOpacity>
                  ))}

                  <View style={[styles.totalCard, { marginTop: 24 }]}>
                    <View style={styles.totalRowMain}>
                      <Text style={styles.totalLabelMain}>Tổng tiền ({currentOrder.length} món)</Text>
                      <Text style={styles.totalValueMain}>{formatMoney(total)}đ</Text>
                    </View>
                    <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                      <Text style={styles.clearBtnText}>Xóa đơn hàng</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Floating Tooltip - Only show when empty */}
          {currentOrder.length === 0 && !isRecording && (
            <View style={styles.tooltipWrap}>
              <View style={styles.tooltipContent}>
                <Text style={styles.tooltipTitle}>Cách lên đơn từ ảnh</Text>
                <Text style={styles.tooltipText}>Chụp hoặc chọn ảnh hóa đơn, tin nhắn chốt đơn cũ...</Text>
                <View style={styles.tooltipArrow} />
              </View>
            </View>
          )}

          {/* ─── Bottom Bar: Normal / Voice Mode ─────────────────────── */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            style={[styles.bottomBarWrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}
          >
            {/* Normal Bottom Bar — hidden when recording */}
            {!isRecording && (
              <View style={styles.bottomBar}>
                {/* Grid Button */}
                <TouchableOpacity style={styles.bottomBtn} onPress={() => setProductGridVisible(true)}>
                  <View style={styles.gridIconWrap}>
                    <View style={styles.gridRow}>
                      <View style={styles.gridDot} />
                      <View style={styles.gridDot} />
                    </View>
                    <View style={styles.gridRow}>
                      <View style={styles.gridDot} />
                      <View style={styles.gridDot} />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Input Pill */}
                <View style={styles.inputPill}>
                  <TextInput
                    style={styles.pillInput}
                    placeholder="Nhập tên hàng + giá"
                    placeholderTextColor="#94A3B8"
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleSubmitInput}
                    returnKeyType="send"
                    editable={!isProcessing}
                  />
                  {inputText.length > 0 && (
                    <TouchableOpacity onPress={handleSubmitInput} style={styles.pillSendBtn}>
                      <Text style={styles.pillSendIcon}>➤</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Mic Button */}
                <TouchableOpacity style={styles.micBtn} onPress={handleMicPress} disabled={isProcessing}>
                  <LinearGradient
                    colors={[Colors.primary, '#3B82F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.micGradient}
                  >
                    <Text style={styles.micIcon}>🎙️</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Camera Button */}
                <TouchableOpacity
                  style={styles.bottomBtn}
                  onPress={handleCameraPress}
                  disabled={isProcessing}
                >
                  <Text style={styles.cameraIcon}>📷</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Voice Sheet — slides up like keyboard */}
            <Animated.View
              style={[
                styles.voiceSheet,
                { ...styles.voiceSheet, borderRadius: 32 },
                {
                  transform: [{ translateY: voiceSheetAnim }],
                },
                !isRecording && { position: 'absolute', opacity: 0, pointerEvents: 'none' as any },
              ]}
            >
              {/* Editable input with live transcript */}
              <View style={{ ...styles.voiceInputRow, paddingHorizontal: 20 }}>
                <TextInput
                  style={styles.voiceInput}
                  placeholder='Nhập tên hàng + giá'
                  placeholderTextColor="#94A3B8"
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleVoiceSend}
                  returnKeyType="send"
                  multiline={true}
                />
              </View>

              {/* Waveform Visualization */}
              <View style={styles.waveformWrap}>
                <View style={styles.waveformBars}>
                  {waveAnims.map((anim, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.waveBar,
                        { transform: [{ scaleY: anim }] }
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.recordingHint}>Đọc tên hàng + giá</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.recordingActions}>
                <TouchableOpacity
                  style={styles.recordActionBtn}
                  onPress={() => {
                    cancelRecording();
                    setIsRecording(false);
                    setInputText('');
                  }}
                >
                  <View style={styles.recordActionIconWrap}>
                    <Text style={styles.recordActionIcon}>🗑️</Text>
                  </View>
                  <Text style={styles.recordActionLabel}>Xóa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.recordActionBtn, styles.stopActionBtn]}
                  onPress={handleVoiceSend}
                >
                  <LinearGradient
                    colors={[Colors.primary, '#2563EB']}
                    style={styles.stopBtnGradient}
                  >
                    <Text style={styles.stopBtnIcon}>➤</Text>
                  </LinearGradient>
                  <Text style={styles.recordActionLabel}>Gửi</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>

        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Confirmation Modal for Voice Results */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <View style={styles.confirmHeader}>
              <Text style={styles.confirmTitle}>🎤 Xác nhận đơn hàng</Text>
              <TouchableOpacity
                style={styles.confirmCloseBtn}
                onPress={() => {
                  setConfirmModalVisible(false);
                  setPendingItems([]);
                }}
              >
                <Text style={styles.confirmCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {pendingTable && (
              <View style={styles.confirmTableBadge}>
                <Text style={styles.confirmTableIcon}>🪑</Text>
                <Text style={styles.confirmTableText}>Bàn {pendingTable}</Text>
              </View>
            )}

            <ScrollView style={styles.confirmList} showsVerticalScrollIndicator={false}>
              {pendingItems.map((item, index) => (
                <View key={index} style={styles.confirmItem}>
                  <View style={styles.confirmItemLeft}>
                    <Text style={styles.confirmItemName}>{item.productName}</Text>
                    <View style={styles.confirmItemMeta}>
                      <Text style={styles.confirmItemPrice}>{formatMoney(item.unitPrice)}đ</Text>
                      <Text style={styles.confirmItemQty}> × {item.quantity}</Text>
                      <Text style={styles.confirmItemTotal}> = {formatMoney(item.subtotal)}đ</Text>
                    </View>
                  </View>
                  <View style={styles.confirmItemRight}>
                    <TouchableOpacity
                      style={styles.confirmEditBtn}
                      onPress={() => {
                        // Quick edit quantity
                        const newQty = item.quantity + 1;
                        handleEditPendingItem(index, {
                          quantity: newQty,
                          subtotal: newQty * item.unitPrice,
                        });
                      }}
                    >
                      <Text style={styles.confirmEditIcon}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmEditBtn}
                      onPress={() => {
                        if (item.quantity > 1) {
                          const newQty = item.quantity - 1;
                          handleEditPendingItem(index, {
                            quantity: newQty,
                            subtotal: newQty * item.unitPrice,
                          });
                        } else {
                          handleRemovePendingItem(index);
                        }
                      }}
                    >
                      <Text style={styles.confirmEditIcon}>−</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.confirmFooter}>
              <View style={styles.confirmTotalRow}>
                <Text style={styles.confirmTotalLabel}>Tổng cộng</Text>
                <Text style={styles.confirmTotalValue}>
                  {formatMoney(pendingItems.reduce((sum, item) => sum + item.subtotal, 0))}đ
                </Text>
              </View>
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={() => {
                    setConfirmModalVisible(false);
                    setPendingItems([]);
                  }}
                >
                  <Text style={styles.confirmCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmSaveBtn}
                  onPress={handleConfirmItems}
                >
                  <LinearGradient
                    colors={[Colors.primary, '#2563EB']}
                    style={styles.confirmSaveGradient}
                  >
                    <Text style={styles.confirmSaveText}>✓ Thêm vào đơn</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Chỉnh sửa sản phẩm</Text>

            <Text style={styles.modalLabel}>Tên sản phẩm</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Nhập tên sản phẩm"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.modalLabel}>Giá (VNĐ)</Text>
            <TextInput
              style={styles.modalInput}
              value={editPrice}
              onChangeText={setEditPrice}
              placeholder="Nhập giá"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>Số lượng</Text>
            <TextInput
              style={styles.modalInput}
              value={editQty}
              onChangeText={setEditQty}
              placeholder="Nhập số lượng"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalSaveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Voice Text Edit Modal removed — user edits directly in bottom sheet input */}

      {/* ─── Product Quick-Pick Grid ──────────────────────────────────────────  */}
      <Modal
        visible={productGridVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProductGridVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.productGridSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.productGridHeader}>
              <Text style={styles.productGridTitle}>📦 Thư viện sản phẩm</Text>
              <TouchableOpacity onPress={() => setProductGridVisible(false)} style={styles.confirmCloseBtn}>
                <Text style={styles.confirmCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {products.length === 0 ? (
              <View style={styles.productGridEmpty}>
                <Text style={styles.productGridEmptyIcon}>📭</Text>
                <Text style={styles.productGridEmptyText}>Chưa có sản phẩm nào</Text>
                <Text style={styles.productGridEmptySub}>Thêm sản phẩm qua mục "Sản phẩm" trong tab Nhiều hơn</Text>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={styles.productGridList}
                showsVerticalScrollIndicator={false}
              >
                {products.map((product) => (
                  <View key={product.id} style={styles.productGridItem}>
                    {/* Phần tap để thêm vào đơn */}
                    <TouchableOpacity
                      style={styles.productGridTapArea}
                      activeOpacity={0.7}
                      onPress={() => {
                        const newItem: OrderItem = {
                          productId: product.id,
                          productName: product.name,
                          quantity: 1,
                          unitPrice: product.price,
                          subtotal: product.price,
                        };
                        addToCurrentOrder(newItem);
                        setProductGridVisible(false);
                      }}
                    >
                      <View style={styles.productGridItemInner}>
                        <Text style={styles.productGridItemName} numberOfLines={2}>{product.name}</Text>
                        <Text style={styles.productGridItemPrice}>{formatMoney(product.price)}đ</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Nút Edit */}
                    <TouchableOpacity
                      style={styles.productGridEditBtn}
                      onPress={() => {
                        setEditingProductId(product.id);
                        setEditingProductName(product.name);
                        setEditingProductPrice(String(product.price));
                        setProductEditVisible(true);
                      }}
                    >
                      <Text style={styles.productGridEditIcon}>✏️</Text>
                    </TouchableOpacity>

                    {/* Nút + thêm */}
                    <TouchableOpacity
                      style={styles.productGridAddBtn}
                      onPress={() => {
                        const newItem: OrderItem = {
                          productId: product.id,
                          productName: product.name,
                          quantity: 1,
                          unitPrice: product.price,
                          subtotal: product.price,
                        };
                        addToCurrentOrder(newItem);
                        setProductGridVisible(false);
                      }}
                    >
                      <Text style={styles.productGridAddIcon}>+</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── Product Edit Modal ───────────────────────────────────────────── */}
      <Modal
        visible={productEditVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProductEditVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>✏️ Sửa sản phẩm</Text>

              <Text style={styles.modalLabel}>Tên sản phẩm</Text>
              <TextInput
                style={styles.modalInput}
                value={editingProductName}
                onChangeText={setEditingProductName}
                placeholder="Tên sản phẩm"
                placeholderTextColor="#94A3B8"
                autoFocus
              />

              <Text style={styles.modalLabel}>Giá (VNĐ)</Text>
              <TextInput
                style={styles.modalInput}
                value={editingProductPrice}
                onChangeText={setEditingProductPrice}
                placeholder="VD: 25000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setProductEditVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Huỷ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={async () => {
                    if (!editingProductId || !editingProductName.trim()) return;
                    const newPrice = parseInt(editingProductPrice) || 0;
                    try {
                      await updateProduct(editingProductId, {
                        name: editingProductName.trim(),
                        price: newPrice,
                      });
                      setProductEditVisible(false);
                    } catch (e) {
                      Alert.alert('Lỗi', 'Không thể cập nhật sản phẩm.');
                    }
                  }}
                >
                  <Text style={styles.modalSaveText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AnimatedScreen >
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
    height: 350,
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
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...Shadows.sm,
  },
  closeIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  doneBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  doneBtnDisabled: {
    opacity: 0.5,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6', // Blue link color
  },
  doneBtnTextDisabled: {
    color: '#94A3B8',
  },
  customerWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  customerInputInner: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...Shadows.md,
  },
  customerInput: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    height: 44,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120, // Space for bottom bar
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  orderList: {
    paddingTop: 0,
  },
  tableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE', // Light Blue
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  tableBadgeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  tableBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0369A1', // Dark Blue
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...Shadows.card,
    alignItems: 'center',
  },
  orderItemMain: {
    flex: 1,
    marginRight: 12,
  },
  orderItemNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
    marginRight: 8,
  },
  deleteQuickBtn: {
    padding: 4,
    opacity: 0.6,
  },
  deleteQuickIcon: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  orderItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderItemPrice: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  orderItemSubtotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981', // Green for money
    marginLeft: 4,
  },
  orderItemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Gap between buttons
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qtyBtnText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
    marginTop: -2,
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    minWidth: 20,
    textAlign: 'center',
  },
  qtyBtnPlus: {
    backgroundColor: '#fff',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  qtyBtnPlusText: {
    color: '#3B82F6',
  },

  totalCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    padding: 24,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    ...Shadows.lg,
  },
  totalRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabelMain: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  totalValueMain: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  clearBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
  },
  clearBtnText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },

  // Tooltip
  tooltipWrap: {
    position: 'absolute',
    bottom: 110, // Reset to normal now that TabBar is hidden
    right: 16,
    left: 16,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  tooltipContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  tooltipText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -8,
    right: 24,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1E293B',
  },

  // NEW BOTTOM BAR STYLES
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 34, // Safe Area padding
  },
  bottomBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gridIconWrap: {
    width: 18,
    height: 18,
    gap: 3,
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridDot: {
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: '#3B82F6', // Blue like reference
  },
  cameraIcon: {
    fontSize: 22,
  },
  inputPill: {
    flex: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    ...Shadows.md,
  },
  pillInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    height: '100%',
  },
  pillSendBtn: {
    padding: 6,
  },
  pillSendIcon: {
    fontSize: 18,
    color: '#3B82F6',
  },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  micGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    fontSize: 22,
    color: '#fff',
  },

  // VOICE BOTTOM SHEET (INLINE)
  voiceSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40, // Extra padding for safe area
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 20,
  },
  voiceInputRow: {
    width: '100%',
    marginBottom: 24,
  },
  voiceInput: {
    fontSize: 18,
    color: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 4,
    fontWeight: '500',
  },
  waveformWrap: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 6,
  },
  waveBar: {
    width: 6,
    height: 12, // Base height
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  recordingHint: {
    marginTop: 10,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    width: '100%',
  },
  recordActionBtn: {
    alignItems: 'center',
    gap: 6,
  },
  recordActionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordActionIcon: {
    fontSize: 22,
  },
  recordActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  stopActionBtn: {
    // Special styling for Send button
  },
  stopBtnGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 6,
  },
  stopBtnIcon: {
    fontSize: 24,
    color: '#fff',
    marginLeft: 3,
  },

  // Edit Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    ...Shadows.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },

  // Confirmation Modal Styles
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  confirmSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '80%',
    ...Shadows.xl,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  confirmCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCloseIcon: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: 'bold',
  },
  confirmTableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  confirmTableIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  confirmTableText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369A1',
  },
  confirmList: {
    maxHeight: 300,
    paddingHorizontal: 24,
  },
  confirmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  confirmItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  confirmItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  confirmItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmItemPrice: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  confirmItemQty: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  confirmItemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  confirmItemRight: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  confirmEditIcon: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '700',
  },
  confirmFooter: {
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 12,
  },
  confirmTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmTotalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmSaveBtn: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  confirmSaveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // ─── Voice Text Edit Modal ───────────────────────
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  voiceEditSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  voiceEditTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  voiceEditHint: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  voiceEditInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    minHeight: 100,
    borderWidth: 2,
    borderColor: '#3B82F6',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  voiceEditTipRow: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  voiceEditTip: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  voiceEditActions: {
    flexDirection: 'row',
    gap: 12,
  },
  voiceEditCancelBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceEditCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  voiceEditConfirmBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  voiceEditGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceEditConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  // ─── Product Grid Modal ─────────────────────────
  productGridSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  productGridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  productGridTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  productGridList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 10,
  },
  productGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productGridTapArea: {
    flex: 1,
    marginRight: 8,
  },
  productGridEditBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productGridEditIcon: {
    fontSize: 16,
  },

  productGridItemInner: {
    flex: 1,
    marginRight: 12,
  },
  productGridItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  productGridItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  productGridAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productGridAddIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
    marginTop: -2,
  },
  productGridEmpty: {
    alignItems: 'center',
    padding: 40,
  },
  productGridEmptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  productGridEmptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  productGridEmptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
