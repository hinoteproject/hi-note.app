import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, Shadows } from '../constants/theme';

interface GlassCardProps {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: 'light' | 'medium' | 'strong';
    noPadding?: boolean;
}

export default function GlassCard({ children, style, intensity = 'light', noPadding }: GlassCardProps) {
    const getGlassStyle = () => {
        switch (intensity) {
            case 'strong':
                return {
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                };
            case 'medium':
                return {
                    backgroundColor: 'rgba(255, 255, 255, 0.78)',
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                };
            default:
                return {
                    backgroundColor: 'rgba(255, 255, 255, 0.65)',
                    borderColor: 'rgba(255, 255, 255, 0.45)',
                };
        }
    };

    const glassStyle = getGlassStyle();

    return (
        <View
            style={[
                styles.card,
                { backgroundColor: glassStyle.backgroundColor, borderColor: glassStyle.borderColor },
                noPadding && { padding: 0 },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1.5,
        ...Shadows.card,
    },
});
