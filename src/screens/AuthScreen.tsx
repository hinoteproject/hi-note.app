import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius, Spacing } from '../constants/theme';

interface AuthScreenProps {
  onRegister: (data: { name: string; phone: string; city: string; business: string }) => void;
  onLogin: () => void;
}

const cities = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Khác'];
const businesses = ['Quán ăn', 'Cà phê', 'Tạp hóa', 'Thời trang', 'Dịch vụ', 'Khác'];

export function AuthScreen({ onRegister, onLogin }: AuthScreenProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [business, setBusiness] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showBusinessPicker, setShowBusinessPicker] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleRegister = () => {
    if (name && phone && city && business && agreed) {
      onRegister({ name, phone, city, business });
    }
  };

  const isValid = name && phone && city && business && agreed;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8F4FE', '#E0EAFC', '#F8FAFC']}
        style={styles.gradient}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.supportBtn}>
              <Text style={styles.supportIcon}>🎧</Text>
              <Text style={styles.supportText}>Hỗ trợ</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentInner}
          >
            {/* Logo */}
            <View style={styles.logoSection}>
              <View style={styles.logoWrap}>
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.logoIcon}
                >
                  <Text style={styles.logoEmoji}>✏️</Text>
                </LinearGradient>
                <Text style={styles.logoStar}>✨</Text>
              </View>
              <Text style={styles.logoText}>Hi-Note</Text>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Họ tên"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Số điện thoại"
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity 
                style={styles.inputGroup}
                onPress={() => setShowCityPicker(!showCityPicker)}
              >
                <View style={styles.selectInput}>
                  <Text style={[styles.selectText, !city && styles.placeholder]}>
                    {city || 'Tỉnh/thành phố'}
                  </Text>
                  <Text style={styles.selectIcon}>▼</Text>
                </View>
              </TouchableOpacity>

              {showCityPicker && (
                <View style={styles.pickerOptions}>
                  {cities.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={styles.pickerOption}
                      onPress={() => { setCity(c); setShowCityPicker(false); }}
                    >
                      <Text style={[styles.pickerOptionText, city === c && styles.pickerOptionActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity 
                style={styles.inputGroup}
                onPress={() => setShowBusinessPicker(!showBusinessPicker)}
              >
                <View style={styles.selectInput}>
                  <Text style={[styles.selectText, !business && styles.placeholder]}>
                    {business || 'Ngành kinh doanh'}
                  </Text>
                  <Text style={styles.selectIcon}>▼</Text>
                </View>
              </TouchableOpacity>

              {showBusinessPicker && (
                <View style={styles.pickerOptions}>
                  {businesses.map((b) => (
                    <TouchableOpacity
                      key={b}
                      style={styles.pickerOption}
                      onPress={() => { setBusiness(b); setShowBusinessPicker(false); }}
                    >
                      <Text style={[styles.pickerOptionText, business === b && styles.pickerOptionActive]}>
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Terms */}
              <TouchableOpacity 
                style={styles.termsRow}
                onPress={() => setAgreed(!agreed)}
              >
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                  {agreed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  Tôi đã đọc và đồng ý với{' '}
                  <Text style={styles.termsLink}>Điều khoản và chính sách sử dụng</Text>
                  {' '}của Hi-Note
                </Text>
              </TouchableOpacity>

              {/* Register Button */}
              <TouchableOpacity 
                style={[styles.registerBtn, !isValid && styles.registerBtnDisabled]}
                onPress={handleRegister}
                disabled={!isValid}
              >
                <Text style={[styles.registerBtnText, !isValid && styles.registerBtnTextDisabled]}>
                  Đăng ký
                </Text>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Bạn đã có tài khoản? </Text>
                <TouchableOpacity onPress={onLogin}>
                  <Text style={styles.loginLink}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Một sản phẩm của </Text>
            <Text style={styles.footerBrand}>🌿 KiotViet</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  supportIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  supportText: {
    fontSize: Fonts.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  logoWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 28,
  },
  logoStar: {
    position: 'absolute',
    top: -8,
    right: -12,
    fontSize: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: Fonts.md,
    color: Colors.text,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  selectText: {
    fontSize: Fonts.md,
    color: Colors.text,
  },
  placeholder: {
    color: Colors.textMuted,
  },
  selectIcon: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  pickerOptions: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerOptionText: {
    fontSize: Fonts.md,
    color: Colors.text,
  },
  pickerOptionActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontSize: Fonts.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '500',
  },
  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerBtnDisabled: {
    backgroundColor: Colors.border,
  },
  registerBtnText: {
    color: Colors.white,
    fontSize: Fonts.md,
    fontWeight: '600',
  },
  registerBtnTextDisabled: {
    color: Colors.textMuted,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: Fonts.base,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: Fonts.base,
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: Fonts.sm,
    color: Colors.textMuted,
  },
  footerBrand: {
    fontSize: Fonts.sm,
    color: Colors.green,
    fontWeight: '600',
  },
});
