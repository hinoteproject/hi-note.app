import { Audio } from 'expo-av';
import { Alert, Platform } from 'react-native';

/**
 * Notification Service — Expo Go compatible
 * 
 * expo-notifications has been removed to avoid the SDK 53 Expo Go error.
 * When building for production (EAS Build), reinstall expo-notifications
 * and restore the full notification functionality.
 * 
 * Currently: plays sound + shows Alert as fallback.
 */

/**
 * Request notification permissions (no-op in Expo Go)
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  return true; // Always succeed — we use Alert fallback
}

/**
 * Play "Ting Ting" sound when payment received
 */
export async function playTingTingSound(): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3' },
      { shouldPlay: true, volume: 1.0 }
    );

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => { });
      }
    });

    setTimeout(() => { sound.unloadAsync().catch(() => { }); }, 10000);
  } catch (error) {
    console.warn('Ting ting sound unavailable:', error);
  }
}

/**
 * Send payment notification (Alert + sound fallback)
 */
export async function sendPaymentNotification(
  orderAmount: number,
  orderName: string
): Promise<void> {
  try {
    await playTingTingSound();
    // Sound plays, notification handled by the Alert in calling code
    console.log(`✅ Payment: ${orderName} - ${new Intl.NumberFormat('vi-VN').format(orderAmount)}đ`);
  } catch (error) {
    console.warn('Payment notification error:', error);
  }
}

/**
 * Send notification for low stock
 */
export async function sendLowStockNotification(
  productName: string,
  currentStock: number
): Promise<void> {
  console.log(`⚠️ Low stock: ${productName} - ${currentStock} left`);
}

/**
 * Send notification for new order
 */
export async function sendNewOrderNotification(
  orderName: string,
  itemCount: number
): Promise<void> {
  console.log(`🛒 New order: ${orderName} - ${itemCount} items`);
}
