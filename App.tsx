import React, { useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ExpenseScreen } from './src/screens/ExpenseScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SellScreen } from './src/screens/SellScreen';
import { PaymentScreen } from './src/screens/PaymentScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { InvoiceDetailScreen } from './src/screens/InvoiceDetail';
import { ProductsScreen } from './src/screens/ProductsScreen';
import { CustomersScreen } from './src/screens/CustomersScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { StockScreen } from './src/screens/StockScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import WelcomeModal from './src/components/WelcomeModal';
import ToastNotification from './src/components/ToastNotification';
import { Colors, Gradients, Shadows } from './src/constants/theme';
import { useStore } from './src/store/useStore';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* ─── Premium Tab Bar ─── */
function CustomTabBar(props: any) {
  const { state, navigation } = props;
  const insets = useSafeAreaInsets();
  const centerScale = useRef(new Animated.Value(1)).current;

  const bottomPadding = insets.bottom || 0;

  const handleTabPress = (route: any, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const handleSellPress = () => {
    // Spring bounce animation
    Animated.sequence([
      Animated.spring(centerScale, { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(centerScale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 300 }),
    ]).start();
    navigation.navigate('Sell');
  };

  const tabConfig = [
    { name: 'Tổng quan', icon: '💎', activeIcon: '💎' },
    { name: 'Hoá đơn', icon: '📋', activeIcon: '📋' },
    null, // center button placeholder
    { name: 'Chi phí', icon: '💸', activeIcon: '💸' },
    { name: 'Nhiều hơn', icon: '⚙️', activeIcon: '⚙️' },
  ];

  return (
    <View style={[tabStyles.wrapper, { paddingBottom: bottomPadding, height: 72 + bottomPadding }]}>
      <View style={[tabStyles.container, { height: 72 + bottomPadding, paddingBottom: bottomPadding }]}>
        {tabConfig.map((tab, i) => {
          if (!tab) {
            // Center Sell Button
            return (
              <TouchableOpacity
                key="center"
                onPress={handleSellPress}
                style={tabStyles.centerWrapper}
                activeOpacity={1}
              >
                <Animated.View style={{ transform: [{ scale: centerScale }] }}>
                  <LinearGradient
                    colors={Gradients.primary}
                    style={tabStyles.centerBtn}
                  >
                    <Text style={tabStyles.centerIcon}>✎</Text>
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            );
          }

          const routeIndex = i > 2 ? i - 1 : i;
          const route = state.routes[routeIndex];
          const isFocused = state.index === routeIndex;

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => handleTabPress(route, isFocused)}
              style={tabStyles.tab}
              activeOpacity={0.7}
            >
              <Text style={[tabStyles.icon, isFocused && tabStyles.iconActive]}>
                {isFocused ? tab.activeIcon : tab.icon}
              </Text>
              <Text style={[tabStyles.label, isFocused && tabStyles.labelActive]}>
                {tab.name}
              </Text>
              {isFocused && (
                <View style={tabStyles.indicator}>
                  <LinearGradient
                    colors={Gradients.primary}
                    style={tabStyles.indicatorGradient}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    height: 72,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    overflow: 'visible',
    ...Shadows.xl,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  centerWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginTop: -36,
    backgroundColor: '#F0FDF4',
    padding: 5,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    ...Shadows.primary,
  },
  centerBtn: {
    flex: 1,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIcon: {
    fontSize: 26,
    color: '#FFFFFF',
  },
  icon: {
    fontSize: 20,
    marginBottom: 3,
    opacity: 0.35,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: 8,
    width: 16,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: 2,
  },
});

/* ─── Tab Navigator ─── */
function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Tổng quan" component={HomeScreen} />
      <Tab.Screen name="Hoá đơn" component={HistoryScreen} />
      <Tab.Screen name="Chi phí" component={ExpenseScreen} />
      <Tab.Screen name="Nhiều hơn" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

/* ─── App ─── */
export default function App() {
  const storeUser = useStore(state => state.user);
  const loadUserFromStorage = useStore(state => state.loadUserFromStorage);
  const loadProducts = useStore(state => state.loadProducts);
  const loadOrders = useStore(state => state.loadOrders);
  const loadBanks = useStore(state => state.loadBanks);
  const loadCustomers = useStore(state => state.loadCustomers);
  const loadStockImports = useStore(state => state.loadStockImports);
  const loadExpenses = useStore(state => state.loadExpenses);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!storeUser);
  const [userName, setUserName] = useState<string>(() => (storeUser ? storeUser.name : ''));
  const [showWelcome, setShowWelcome] = useState(false);

  // Align Android navigation bar color with bottom tab background (safe-guarded)
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const syncNavBar = async () => {
      try {
        const nav = require('expo-navigation-bar');
        if (nav?.setBackgroundColorAsync) {
          // Match tab bar base color (solid) for perfect blend with system nav bar
          await nav.setBackgroundColorAsync('#FFFFFF');
          nav.setButtonStyleAsync?.('dark');
          nav.setVisibilityAsync?.('visible');
        }
      } catch (e: any) {
        // Native module may be unavailable on some builds; ignore quietly
        console.warn('Navigation bar sync skipped:', e?.message || e);
      }
    };
    syncNavBar();
  }, []);

  React.useEffect(() => {
    if (storeUser) {
      setIsLoggedIn(true);
      setUserName(storeUser.name);
    } else {
      setIsLoggedIn(false);
      setUserName('');
    }
  }, [storeUser]);

  React.useEffect(() => {
    (async () => {
      try { await loadUserFromStorage(); } catch (e) { /* ignore */ }
      try {
        await Promise.all([
          loadProducts(), loadOrders(), loadBanks(),
          loadCustomers(), loadStockImports(), loadExpenses(),
        ]);
      } catch (e) {
        console.warn('Error loading data:', e);
      }
    })();
  }, []);

  const handleRegister = (data: { name: string; email: string; phone?: string; city: string; business: string }) => {
    setUserName(data.name);
    setShowWelcome(true);
    setIsLoggedIn(true);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthScreen onRegister={handleRegister} onLogin={handleLogin} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="Sell"
            component={SellScreen}
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="Payment"
            component={PaymentScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
          <Stack.Screen name="Products" component={ProductsScreen} />
          <Stack.Screen name="Customers" component={CustomersScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="Stock" component={StockScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <WelcomeModal visible={showWelcome} userName={userName} onClose={() => setShowWelcome(false)} />
      <ToastNotification />
    </SafeAreaProvider>
  );
}
