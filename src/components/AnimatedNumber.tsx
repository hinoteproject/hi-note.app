import React, { useEffect, useRef } from 'react';
import { Animated, Text, TextStyle, StyleProp } from 'react-native';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    formatter?: (n: number) => string;
    style?: StyleProp<TextStyle>;
    prefix?: string;
    suffix?: string;
}

export default function AnimatedNumber({
    value,
    duration = 800,
    formatter,
    style,
    prefix = '',
    suffix = '',
}: AnimatedNumberProps) {
    const animValue = useRef(new Animated.Value(0)).current;
    const displayValue = useRef(0);
    const [display, setDisplay] = React.useState('0');

    useEffect(() => {
        animValue.setValue(0);
        Animated.timing(animValue, {
            toValue: value,
            duration,
            useNativeDriver: false, // We need JS-driven animation for text
        }).start();

        const listener = animValue.addListener(({ value: v }) => {
            displayValue.current = Math.round(v);
            const formatted = formatter
                ? formatter(displayValue.current)
                : new Intl.NumberFormat('vi-VN').format(displayValue.current);
            setDisplay(formatted);
        });

        return () => {
            animValue.removeListener(listener);
        };
    }, [value, duration]);

    return (
        <Text style={style}>
            {prefix}{display}{suffix}
        </Text>
    );
}
