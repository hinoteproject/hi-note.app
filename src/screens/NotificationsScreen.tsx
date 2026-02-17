import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedScreen from '../components/AnimatedScreen';
import { Colors, Shadows } from '../constants/theme';
import { useStore } from '../store/useStore';
import { AppNotification } from '../types';
import { requestNotificationPermissions } from '../services/notificationService';

const ICONS: Record<string, string> = {
  order: '🛒',
  payment: '💰',
  stock: '📦',
  debt: '💳',
};

export function NotificationsScreen() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    // Request notification permissions when screen opens
    requestNotificationPermissions();
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const renderNotification = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={() => markNotificationRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: item.read ? Colors.inputBg : Colors.primaryBg }]}>
        <Text style={styles.icon}>{ICONS[item.type] || '🔔'}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>
      {!item.read && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  return (
    <AnimatedScreen>
      <View style={styles.container}>
        <LinearGradient colors={['#E8F4FE', '#E0EAFC', '#F8FAFC']} style={styles.gradient} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Thông báo</Text>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.markAllBtn} onPress={markAllNotificationsRead}>
                <Text style={styles.markAllText}>Đọc tất cả</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notification Settings */}
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>🔔</Text>
                <View>
                  <Text style={styles.settingTitle}>Thông báo "Ting Ting"</Text>
                  <Text style={styles.settingDesc}>Phát âm thanh khi có tiền về</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#E2E8F0', true: Colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
              <Text style={styles.emptyDesc}>Thông báo về đơn hàng, thanh toán sẽ hiển thị ở đây</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 300 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.primaryBg, borderRadius: 12 },
  markAllText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  settingsCard: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 16, ...Shadows.card },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIcon: { fontSize: 24, marginRight: 12 },
  settingTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  settingDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, ...Shadows.card },
  cardUnread: { backgroundColor: '#F0F9FF' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '500', color: Colors.text, marginBottom: 4 },
  titleUnread: { fontWeight: '700' },
  message: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  time: { fontSize: 11, color: Colors.textMuted, marginTop: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, marginLeft: 8, marginTop: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
