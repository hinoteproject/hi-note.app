import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedButton from '../components/AnimatedButton';
import { Colors } from '../constants/theme';
import { useStore } from '../store/useStore';
import { isFirebaseConfigured } from '../config/keys';
import { addUserToFirebase } from '../services/firebaseStore';
import { sendEmailOTP, verifyEmailOTP, checkEmailExists, isValidEmail, isEmailConfigured } from '../services/emailOtp';

interface AuthScreenProps {
  onRegister: (data: { name: string; email: string; phone?: string; city: string; business: string }) => void;
  onLogin: () => void;
}

const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Khác'];
const businesses = ['Quán ăn', 'Cà phê', 'Tạp hóa', 'Thời trang', 'Dịch vụ', 'Khác'];

type Step = 'form' | 'otp';

export function AuthScreen({ onRegister, onLogin }: AuthScreenProps) {
  const { setUser, loginByEmail } = useStore();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [step, setStep] = useState<Step>('form');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [business, setBusiness] = useState('');
  const [agreed, setAgreed] = useState(false);
  
  // OTP fields
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Pickers
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showBusinessPicker, setShowBusinessPicker] = useState(false);
  
  // OTP input refs
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!email || !isValidEmail(email)) {
      Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ');
      return;
    }

    // Validate form for register
    if (mode === 'register') {
      if (!name || !city || !business) {
        Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin');
        return;
      }
      if (!agreed) {
        Alert.alert('Chưa đồng ý', 'Vui lòng chấp nhận điều khoản');
        return;
      }
    }

    setLoading(true);
    
    // Check if email exists
    const emailExists = await checkEmailExists(email);
    
    if (mode === 'register' && emailExists) {
      setLoading(false);
      Alert.alert('Email đã tồn tại', 'Vui lòng đăng nhập hoặc dùng email khác');
      return;
    }
    
    if (mode === 'login' && !emailExists) {
      setLoading(false);
      Alert.alert('Không tìm thấy', 'Email chưa đăng ký. Vui lòng đăng ký trước.');
      return;
    }

    // Send OTP
    const result = await sendEmailOTP(email, name);
    setLoading(false);

    if (result.success) {
      setStep('otp');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      
      // Show OTP in dev mode (when EmailJS not configured)
      if (result.otp) {
        Alert.alert('🔐 Mã OTP (Dev Mode)', `Mã của bạn: ${result.otp}\n\nCấu hình EmailJS để gửi email thật.`);
      } else {
        Alert.alert('✉️ Đã gửi', `Kiểm tra email ${email} để lấy mã OTP`);
      }
    } else {
      Alert.alert('Lỗi', result.message);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) value = value[value.length - 1];
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');

    // Auto focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto verify when complete
    if (index === 5 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 6) {
        handleVerifyOTP(fullOtp);
      }
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    if (code.length !== 6) {
      setOtpError('Vui lòng nhập đủ 6 số');
      return;
    }

    setLoading(true);
    const result = await verifyEmailOTP(email, code);
    setLoading(false);

    if (result.success) {
      if (mode === 'register') {
        // Create new user
        const userObj = { name, email: email.toLowerCase(), phone: phone || undefined, city, business, createdAt: new Date() };
        if (isFirebaseConfigured) {
          try {
            await addUserToFirebase(userObj);
          } catch (e) {
            console.warn('Add user failed', e);
          }
        }
        setUser(userObj);
        onRegister({ name, email, phone, city, business });
      } else {
        // Login existing user
        const ok = await loginByEmail(email);
        if (ok) {
          onLogin();
        } else {
          Alert.alert('Lỗi', 'Đăng nhập thất bại');
        }
      }
    } else {
      setOtpError(result.message);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    const result = await sendEmailOTP(email, name);
    setLoading(false);

    if (result.success) {
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      if (result.otp) {
        Alert.alert('🔐 Mã OTP mới (Dev)', `Mã của bạn: ${result.otp}`);
      }
    } else {
      Alert.alert('Lỗi', result.message);
    }
  };

  const goBack = () => {
    setStep('form');
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
  };

  const isFormValid = mode === 'register' 
    ? name && email && isValidEmail(email) && city && business && agreed 
    : email && isValidEmail(email);

  // OTP Screen
  if (step === 'otp') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#E8F4FE', '#E0EAFC', '#F8FAFC']} style={styles.gradient} />
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.otpContainer}>
              <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                <Text style={styles.backTxt}>← Quay lại</Text>
              </TouchableOpacity>

              <View style={styles.otpHeader}>
                <Text style={styles.otpIcon}>✉️</Text>
                <Text style={styles.otpTitle}>Nhập mã xác thực</Text>
                <Text style={styles.otpSubtitle}>
                  Mã OTP đã được gửi đến{'\n'}
                  <Text style={styles.otpEmail}>{email}</Text>
                </Text>
              </View>

              <View style={styles.otpInputRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => { otpRefs.current[index] = ref; }}
                    style={[styles.otpInput, otpError ? styles.otpInputError : undefined]}
                    value={digit}
                    onChangeText={v => handleOtpChange(v, index)}
                    onKeyPress={e => handleOtpKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {otpError ? <Text style={styles.otpErrorTxt}>{otpError}</Text> : null}

              <TouchableOpacity 
                style={[styles.resendBtn, countdown > 0 && styles.resendBtnDisabled]} 
                onPress={handleResendOTP}
                disabled={countdown > 0}
              >
                <Text style={[styles.resendTxt, countdown > 0 && styles.resendTxtDisabled]}>
                  {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
                </Text>
              </TouchableOpacity>

              <AnimatedButton
                title={loading ? 'Đang xác thực...' : 'Xác nhận'}
                onPress={() => handleVerifyOTP()}
                disabled={loading || otp.join('').length !== 6}
                variant="primary"
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // Form Screen
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#E8F4FE', '#E0EAFC', '#F8FAFC']} style={styles.gradient} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.supportBtn}>
              <Text style={styles.supportIcon}>🎧</Text>
              <Text style={styles.supportText}>Hỗ trợ</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentInner}>
            {/* Logo */}
            <View style={styles.logoSection}>
              <View style={styles.logoWrap}>
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.logoIcon}>
                  <Text style={styles.logoEmoji}>✏️</Text>
                </LinearGradient>
                <Text style={styles.logoStar}>✨</Text>
              </View>
              <Text style={styles.logoText}>Hi-Note</Text>
            </View>

            {/* Mode toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity 
                style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]} 
                onPress={() => setMode('register')}
              >
                <Text style={[styles.modeTxt, mode === 'register' && styles.modeTxtActive]}>Đăng ký</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]} 
                onPress={() => setMode('login')}
              >
                <Text style={[styles.modeTxt, mode === 'login' && styles.modeTxtActive]}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              {mode === 'register' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Họ tên</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập họ tên của bạn"
                    placeholderTextColor={Colors.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {mode === 'register' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Số điện thoại (tuỳ chọn)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0912 345 678"
                      placeholderTextColor={Colors.textMuted}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <TouchableOpacity style={styles.inputGroup} onPress={() => setShowCityPicker(!showCityPicker)}>
                    <Text style={styles.inputLabel}>Tỉnh/Thành phố</Text>
                    <View style={styles.selectInput}>
                      <Text style={[styles.selectText, !city && styles.placeholder]}>{city || 'Chọn tỉnh/thành phố'}</Text>
                      <Text style={styles.selectIcon}>▼</Text>
                    </View>
                  </TouchableOpacity>

                  {showCityPicker && (
                    <View style={styles.pickerOptions}>
                      {cities.map(c => (
                        <TouchableOpacity key={c} style={styles.pickerOption} onPress={() => { setCity(c); setShowCityPicker(false); }}>
                          <Text style={[styles.pickerOptionText, city === c && styles.pickerOptionActive]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity style={styles.inputGroup} onPress={() => setShowBusinessPicker(!showBusinessPicker)}>
                    <Text style={styles.inputLabel}>Ngành kinh doanh</Text>
                    <View style={styles.selectInput}>
                      <Text style={[styles.selectText, !business && styles.placeholder]}>{business || 'Chọn ngành kinh doanh'}</Text>
                      <Text style={styles.selectIcon}>▼</Text>
                    </View>
                  </TouchableOpacity>

                  {showBusinessPicker && (
                    <View style={styles.pickerOptions}>
                      {businesses.map(b => (
                        <TouchableOpacity key={b} style={styles.pickerOption} onPress={() => { setBusiness(b); setShowBusinessPicker(false); }}>
                          <Text style={[styles.pickerOptionText, business === b && styles.pickerOptionActive]}>{b}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)}>
                    <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                      {agreed && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.termsText}>
                      Tôi đồng ý với <Text style={styles.termsLink}>Điều khoản sử dụng</Text> của Hi-Note
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <AnimatedButton
                title={loading ? 'Đang gửi...' : mode === 'register' ? 'Nhận mã OTP' : 'Đăng nhập'}
                onPress={handleSendOTP}
                disabled={!isFormValid || loading}
                variant="primary"
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchText}>{mode === 'register' ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} </Text>
                <TouchableOpacity onPress={() => setMode(mode === 'register' ? 'login' : 'register')}>
                  <Text style={styles.switchLink}>{mode === 'register' ? 'Đăng nhập' : 'Đăng ký ngay'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Một sản phẩm của </Text>
            <Text style={styles.footerBrand}>🌿 HiTeam</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },

  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 12 },
  supportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: Colors.border },
  supportIcon: { fontSize: 14, marginRight: 6 },
  supportText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

  content: { flex: 1 },
  contentInner: { paddingHorizontal: 24, paddingBottom: 40 },

  logoSection: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
  logoWrap: { position: 'relative', marginBottom: 12 },
  logoIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  logoEmoji: { fontSize: 28 },
  logoStar: { position: 'absolute', top: -8, right: -12, fontSize: 20 },
  logoText: { fontSize: 32, fontWeight: '800', color: Colors.text },

  modeToggle: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
  modeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  modeBtnActive: { backgroundColor: Colors.primary },
  modeTxt: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  modeTxtActive: { color: '#fff' },

  formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.border },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.text },

  selectInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  selectText: { fontSize: 15, color: Colors.text },
  placeholder: { color: Colors.textMuted },
  selectIcon: { fontSize: 12, color: Colors.textMuted },

  pickerOptions: { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, marginTop: -8, marginBottom: 16, overflow: 'hidden' },
  pickerOption: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pickerOptionText: { fontSize: 15, color: Colors.text },
  pickerOptionActive: { color: Colors.primary, fontWeight: '600' },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, marginRight: 12, marginTop: 2, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  termsText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  termsLink: { color: Colors.primary, fontWeight: '500' },

  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  switchText: { fontSize: 14, color: Colors.textSecondary },
  switchLink: { fontSize: 14, color: Colors.primary, fontWeight: '600' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  footerText: { fontSize: 13, color: Colors.textMuted },
  footerBrand: { fontSize: 13, color: Colors.green, fontWeight: '600' },

  // OTP Screen
  otpContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  backBtn: { marginBottom: 20 },
  backTxt: { fontSize: 15, color: Colors.primary, fontWeight: '600' },

  otpHeader: { alignItems: 'center', marginBottom: 32 },
  otpIcon: { fontSize: 48, marginBottom: 16 },
  otpTitle: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  otpSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  otpEmail: { fontWeight: '700', color: Colors.primary },

  otpInputRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 },
  otpInput: { width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, backgroundColor: '#fff', textAlign: 'center', fontSize: 22, fontWeight: '700', color: Colors.text },
  otpInputError: { borderColor: Colors.red },
  otpErrorTxt: { color: Colors.red, fontSize: 13, textAlign: 'center', marginBottom: 16 },

  resendBtn: { alignSelf: 'center', paddingVertical: 12, marginBottom: 24 },
  resendBtnDisabled: {},
  resendTxt: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  resendTxtDisabled: { color: Colors.textMuted },
});
