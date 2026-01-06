import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, Fonts, Radius, Spacing } from '../constants/theme';
import { formatMoneyShort } from '../utils/format';

interface HeaderProps {
  todayRevenue: number;
  onAIPress?: () => void;
}

export function Header({ todayRevenue, onAIPress }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <LinearGradient
          colors={[Colors.primaryLight, Colors.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoIcon}
        >
          <Text style={styles.logoEmoji}>⚡</Text>
        </LinearGradient>
        <Text style={styles.appName}>Hi-Note</Text>
      </View>
      
      <View style={styles.rightSection}>
        <View style={styles.revenueSection}>
          <Text style={styles.revenueLabel}>Hôm nay</Text>
          <Text style={styles.revenueAmount}>{formatMoneyShort(todayRevenue)}</Text>
        </View>
        
        {onAIPress && (
          <TouchableOpacity style={styles.aiBtn} onPress={onAIPress} activeOpacity={0.8}>
            <LinearGradient
              colors={['#F5F3FF', '#EDE9FE']}
              style={styles.aiBtnBg}
            >
              <Text style={styles.aiBtnIcon}>🤖</Text>
              <Text style={styles.aiBtnText}>AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  logoEmoji: {
    fontSize: 20,
  },
  appName: {
    fontSize: Fonts['2xl'],
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  revenueSection: {
    alignItems: 'flex-end',
  },
  revenueLabel: {
    fontSize: Fonts.xs,
    color: Colors.textMuted,
  },
  revenueAmount: {
    fontSize: Fonts.lg,
    fontWeight: '700',
    color: Colors.green,
  },
  aiBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  aiBtnBg: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
  },
  aiBtnIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  aiBtnText: {
    fontSize: Fonts.sm,
    fontWeight: '600',
    color: Colors.purple,
  },
});
