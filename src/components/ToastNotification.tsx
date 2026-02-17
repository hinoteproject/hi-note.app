import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastConfig {
    message: string;
    title?: string;
    type?: ToastType;
    duration?: number;
}

// Global callback for Toast.show()
let _showToast: ((config: ToastConfig) => void) | null = null;
let _hideToast: (() => void) | null = null;

export const Toast = {
    show: (config: ToastConfig) => _showToast?.(config),
    hide: () => _hideToast?.(),
};

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
    success: { bg: '#ECFDF5', border: '#10B981', icon: '✅', text: '#065F46' },
    info: { bg: '#EFF6FF', border: '#3B82F6', icon: '💡', text: '#1E40AF' },
    warning: { bg: '#FFFBEB', border: '#F59E0B', icon: '⚠️', text: '#92400E' },
    error: { bg: '#FEF2F2', border: '#EF4444', icon: '❌', text: '#991B1B' },
};

export default function ToastNotification() {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-150)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState<ToastConfig>({ message: '' });
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const show = (cfg: ToastConfig) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setConfig(cfg);
        setVisible(true);
        Animated.parallel([
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
        timerRef.current = setTimeout(() => hide(), cfg.duration || 3000);
    };

    const hide = () => {
        Animated.parallel([
            Animated.timing(translateY, { toValue: -150, duration: 250, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => setVisible(false));
    };

    useEffect(() => {
        _showToast = show;
        _hideToast = hide;
        return () => { _showToast = null; _hideToast = null; };
    }, []);

    if (!visible) return null;

    const type = config.type || 'success';
    const colors = TOAST_COLORS[type];

    return (
        <Animated.View
            style={[
                styles.container,
                { top: insets.top + 8, transform: [{ translateY }], opacity },
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={hide}
                style={[styles.toast, { backgroundColor: colors.bg, borderColor: colors.border }]}
            >
                <Text style={styles.icon}>{colors.icon}</Text>
                <View style={styles.textWrap}>
                    {config.title && <Text style={[styles.title, { color: colors.text }]}>{config.title}</Text>}
                    <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>{config.message}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 9999,
        elevation: 9999,
        alignItems: 'center',
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    icon: { fontSize: 20, marginRight: 12 },
    textWrap: { flex: 1 },
    title: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    message: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
});
