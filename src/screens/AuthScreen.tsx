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
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedButton from '../components/AnimatedButton';
import GlassCard from '../components/GlassCard';
import { Colors, Gradients, Shadows } from '../constants/theme';
import { useStore } from '../store/useStore';
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

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!email || !isValidEmail(email)) { Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ'); return; }
    if (mode === 'register') {
      if (!name || !city || !business) { Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin'); return; }
      if (!agreed) { Alert.alert('Chưa đồng ý', 'Vui lòng chấp nhận điều khoản'); return; }
    }
    setLoading(true);
    const emailExists = await checkEmailExists(email);
    if (mode === 'register' && emailExists) { setLoading(false); Alert.alert('Email đã tồn tại', 'Vui lòng đăng nhập hoặc dùng email khác'); return; }
    if (mode === 'login' && !emailExists) { setLoading(false); Alert.alert('Không tìm thấy', 'Email chưa đăng ký. Vui lòng đăng ký trước.'); return; }
    const result = await sendEmailOTP(email, name);
    setLoading(false);
    if (result.success) {
      setStep('otp'); setCountdown(60); setOtp(['', '', '', '', '', '']); setOtpError('');
      if (result.otp) { Alert.alert('🔐 Mã OTP (Dev Mode)', `Mã của bạn: ${result.otp}\n\nCấu hình EmailJS để gửi email thật.`); }
      else { Alert.alert('✉️ Đã gửi', `Kiểm tra email ${email} để lấy mã OTP`); }
    } else { Alert.alert('Lỗi', result.message); }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp]; newOtp[index] = value; setOtp(newOtp); setOtpError('');
    if (value && index < 5) { otpRefs.current[index + 1]?.focus(); }
    if (index === 5 && value) { const fullOtp = newOtp.join(''); if (fullOtp.length === 6) { handleVerifyOTP(fullOtp); } }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) { otpRefs.current[index - 1]?.focus(); }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    if (code.length !== 6) { setOtpError('Vui lòng nhập đủ 6 số'); return; }
    setLoading(true);
    const result = await verifyEmailOTP(email, code);
    setLoading(false);
    if (result.success) {
      if (mode === 'register') {
        const userObj = { name, email: email.toLowerCase(), phone: phone || undefined, city, business, createdAt: new Date() };
        setUser(userObj); onRegister({ name, email, phone, city, business });
      } else {
        const ok = await loginByEmail(email);
        if (ok) { onLogin(); } else { Alert.alert('Lỗi', 'Đăng nhập thất bại'); }
      }
    } else { setOtpError(result.message); }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setLoading(true); const result = await sendEmailOTP(email, name); setLoading(false);
    if (result.success) {
      setCountdown(60); setOtp(['', '', '', '', '', '']); setOtpError('');
      if (result.otp) { Alert.alert('🔐 Mã OTP mới (Dev)', `Mã của bạn: ${result.otp}`); }
    } else { Alert.alert('Lỗi', result.message); }
  };

  const goBack = () => { setStep('form'); setOtp(['', '', '', '', '', '']); setOtpError(''); };

  const isFormValid = mode === 'register'
    ? name && email && isValidEmail(email) && city && business && agreed
    : email && isValidEmail(email);

  // ─── OTP Screen ───
  if (step === 'otp') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#EDE9FE', '#E0F2FE', '#F0FDF4', '#F8FAFC']} style={styles.gradientFull} />
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Animated.View style={[styles.otpContainer, { opacity: fadeAnim }]}>
              <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                <Text style={styles.backTxt}>← Quay lại</Text>
              </TouchableOpacity>

              <View style={styles.otpHeader}>
                <LinearGradient colors={['#3B82F6', '#7C3AED']} style={styles.otpIconWrap}>
                  <Text style={styles.otpIconEmoji}>✉️</Text>
                </LinearGradient>
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
                    style={[styles.otpInput, digit ? styles.otpInputFilled : undefined, otpError ? styles.otpInputError : undefined]}
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
            </Animated.View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Form Screen ───
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#EDE9FE', '#E0F2FE', '#F0FDF4', '#F8FAFC']} style={styles.gradientFull} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.supportBtn} activeOpacity={0.8}>
              <Text style={styles.supportIcon}>🎧</Text>
              <Text style={styles.supportText}>Hỗ trợ</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentInner}>
            {/* Logo */}
            <Animated.View style={[styles.logoSection, { opacity: fadeAnim }]}>
              <Image source={require('../../assets/hinote-logo.png')} style={styles.logoImage} resizeMode="contain" />
              <Text style={styles.logoSub}>Quản lý bán hàng thông minh</Text>
            </Animated.View>

            {/* Mode toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
                onPress={() => setMode('register')}
                activeOpacity={0.8}
              >
                {mode === 'register' ? (
                  <LinearGradient colors={Gradients.primary} style={styles.modeBtnGradient}>
                    <Text style={styles.modeTxtActive}>Đăng ký</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.modeTxt}>Đăng ký</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
                onPress={() => setMode('login')}
                activeOpacity={0.8}
              >
                {mode === 'login' ? (
                  <LinearGradient colors={Gradients.primary} style={styles.modeBtnGradient}>
                    <Text style={styles.modeTxtActive}>Đăng nhập</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.modeTxt}>Đăng nhập</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Form Card */}
            <GlassCard style={styles.formCard} intensity="strong">
              {mode === 'register' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Họ tên</Text>
                  <TextInput style={styles.input} placeholder="Nhập họ tên của bạn" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput style={styles.input} placeholder="example@email.com" placeholderTextColor="#94A3B8" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>

              {mode === 'register' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Số điện thoại (tuỳ chọn)</Text>
                    <TextInput style={styles.input} placeholder="0912 345 678" placeholderTextColor="#94A3B8" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
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
            </GlassCard>
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
  gradientFull: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },

  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 12 },
  supportBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    ...Shadows.sm,
  },
  supportIcon: { fontSize: 14, marginRight: 6 },
  supportText: { fontSize: 13, color: '#64748B', fontWeight: '600' },

  content: { flex: 1 },
  contentInner: { paddingHorizontal: 24, paddingBottom: 40 },

  logoSection: { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  logoImage: { width: 120, height: 120, borderRadius: 28, marginBottom: 8 },
  logoSub: { fontSize: 14, color: '#64748B', fontWeight: '500', marginTop: 4 },

  modeToggle: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, padding: 4,
    marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  modeBtn: { flex: 1, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  modeBtnActive: {},
  modeBtnGradient: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  modeTxt: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  modeTxtActive: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  formCard: { marginBottom: 20 },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1E293B',
  },

  selectInput: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  selectText: { fontSize: 15, color: '#1E293B' },
  placeholder: { color: '#94A3B8' },
  selectIcon: { fontSize: 12, color: '#94A3B8' },

  pickerOptions: {
    backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 14, marginTop: -8, marginBottom: 16, overflow: 'hidden',
  },
  pickerOption: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  pickerOptionText: { fontSize: 15, color: '#1E293B' },
  pickerOptionActive: { color: Colors.primary, fontWeight: '700' },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#CBD5E1', marginRight: 12, marginTop: 1, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  termsText: { flex: 1, fontSize: 13, color: '#64748B', lineHeight: 20 },
  termsLink: { color: Colors.primary, fontWeight: '600' },

  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  switchText: { fontSize: 14, color: '#64748B' },
  switchLink: { fontSize: 14, color: Colors.primary, fontWeight: '700' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  footerText: { fontSize: 13, color: '#94A3B8' },
  footerBrand: { fontSize: 13, color: '#10B981', fontWeight: '700' },

  // OTP Screen
  otpContainer: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  backBtn: { marginBottom: 20 },
  backTxt: { fontSize: 15, color: Colors.primary, fontWeight: '700' },

  otpHeader: { alignItems: 'center', marginBottom: 32 },
  otpIconWrap: { width: 72, height: 72, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16, ...Shadows.purple },
  otpIconEmoji: { fontSize: 32 },
  otpTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 8, letterSpacing: -0.3 },
  otpSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, fontWeight: '500' },
  otpEmail: { fontWeight: '700', color: Colors.primary },

  otpInputRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 16 },
  otpInput: {
    width: 50, height: 58, borderRadius: 14, borderWidth: 2, borderColor: '#E2E8F0',
    backgroundColor: 'rgba(255,255,255,0.8)', textAlign: 'center', fontSize: 24, fontWeight: '800', color: '#0F172A',
  },
  otpInputFilled: { borderColor: Colors.primary, backgroundColor: '#ECFDF5' },
  otpInputError: { borderColor: '#EF4444' },
  otpErrorTxt: { color: '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 16, fontWeight: '600' },

  resendBtn: { alignSelf: 'center', paddingVertical: 12, marginBottom: 24 },
  resendBtnDisabled: {},
  resendTxt: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  resendTxtDisabled: { color: '#94A3B8' },
});
