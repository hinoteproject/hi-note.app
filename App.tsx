import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { HomeScreen } from './src/screens/HomeScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { ExpenseScreen } from './src/screens/ExpenseScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SellScreen } from './src/screens/SellScreen';
import { PaymentScreen } from './src/screens/PaymentScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { InvoiceDetailScreen } from './src/screens/InvoiceDetail';
import { ProductsScreen } from './src/screens/ProductsScreen';
import { CustomersScreen } from './src/screens/CustomersScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { StockScreen } from './src/screens/StockScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import WelcomeModal from './src/components/WelcomeModal';
import { Colors } from './src/constants/theme';
import { useStore } from './src/store/useStore';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomTabBar({ state, descriptors, navigation }: any) {
  const tabs = [
    { name: 'Tổng quan', icon: '🏠', iconOutline: '🏠' },
    { name: 'Hoá đơn', icon: '📋', iconOutline: '📋' },
    { name: 'Bán hàng', icon: '🤖', iconOutline: '🤖' },
    { name: 'Chi phí', icon: '💰', iconOutline: '💰' },
    { name: 'Nhiều hơn', icon: '☰', iconOutline: '☰' },
  ];

  return (
    <View style={tabStyles.container}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const isCenter = index === 2;
        const tab = tabs[index];

        const onPress = () => {
          if (!isFocused) {
            navigation.navigate(route.name);
          }
        };

        if (isCenter) {
          return (
            <TouchableOpacity 
              key={route.key} 
              onPress={onPress} 
              style={tabStyles.centerWrapper}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#C4B5FD', '#A78BFA', '#8B5CF6']}
                style={tabStyles.centerBtn}
              >
                <Text style={tabStyles.centerIcon}>{tab.icon}</Text>
                <View style={tabStyles.aiBadge}>
                  <Text style={tabStyles.aiText}>AI</Text>
                  <Text style={tabStyles.aiPlus}>+</Text>
                </View>
              </LinearGradient>
              <Text style={[tabStyles.label, isFocused && tabStyles.labelActive]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity 
            key={route.key} 
            onPress={onPress} 
            style={tabStyles.tab}
            activeOpacity={0.7}
          >
            <Text style={[tabStyles.icon, isFocused && tabStyles.iconActive]}>
              {isFocused ? tab.icon : tab.iconOutline}
            </Text>
            <Text style={[tabStyles.label, isFocused && tabStyles.labelActive]}>
              {tab.name}
            </Text>
            {isFocused && <View style={tabStyles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingBottom: 28,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    marginTop: -28,
  },
  centerBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  centerIcon: {
    fontSize: 26,
  },
  aiBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  aiText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7C3AED',
  },
  aiPlus: {
    fontSize: 8,
    fontWeight: '800',
    color: '#7C3AED',
    marginLeft: 1,
  },
  icon: {
    fontSize: 22,
    marginBottom: 4,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 4,
  },
  labelActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    bottom: -4,
    width: 20,
    height: 3,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
});

function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Tổng quan" component={HomeScreen} />
      <Tab.Screen name="Hoá đơn" component={HistoryScreen} />
      <Tab.Screen name="Bán hàng" component={SellScreen} />
      <Tab.Screen name="Chi phí" component={ExpenseScreen} />
      <Tab.Screen name="Nhiều hơn" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const storeUser = useStore(state => state.user);
  const loadUserFromStorage = useStore(state => state.loadUserFromStorage);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!storeUser);
  const [userName, setUserName] = useState<string>(() => (storeUser ? storeUser.name : ''));
  const [showWelcome, setShowWelcome] = useState(false);

  React.useEffect(() => {
    if (storeUser) {
      setIsLoggedIn(true);
      setUserName(storeUser.name);
    }
    else {
      setIsLoggedIn(false);
      setUserName('');
    }
  }, [storeUser]);

  // try load persisted user on app start
  React.useEffect(() => {
    (async () => {
      try {
        await loadUserFromStorage();
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const handleRegister = (data: { name: string; email: string; phone?: string; city: string; business: string }) => {
    // store.setUser is handled inside AuthScreen; mark logged in and set name
    setUserName(data.name);
    setShowWelcome(true); // Show welcome modal
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
      
      {/* Welcome Modal for new users */}
      <WelcomeModal 
        visible={showWelcome} 
        userName={userName} 
        onClose={() => setShowWelcome(false)} 
      />
    </SafeAreaProvider>
  );
}
