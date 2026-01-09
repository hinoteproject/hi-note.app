import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc,
  Timestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

const OTP_COL = 'otpCodes';
const OTP_EXPIRY_MINUTES = 10;

// EmailJS config - Hi-Team
const EMAILJS_SERVICE_ID = 'service_dgyt6ez';
const EMAILJS_TEMPLATE_ID = 'template_ztu8jw3';
const EMAILJS_PUBLIC_KEY = 'IupxXr0X3EJKqgWbA';

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send email via EmailJS REST API
async function sendEmailViaEmailJS(params: {
  to_email: string;
  to_name: string;
  otp_code: string;
  app_name: string;
  expiry_minutes: string;
}): Promise<boolean> {
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'origin': 'http://localhost',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: params,
      }),
    });

    if (response.ok) {
      console.log('✅ Email sent successfully');
      return true;
    } else {
      const errorText = await response.text();
      console.warn('EmailJS error:', errorText);
      return false;
    }
  } catch (error) {
    console.warn('Send email failed:', error);
    return false;
  }
}

// Send OTP via Email
export async function sendEmailOTP(email: string, userName?: string): Promise<{ success: boolean; message: string; otp?: string }> {
  if (!isFirebaseConfigured || !db) {
    return { success: false, message: 'Firebase chưa được cấu hình' };
  }

  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP in Firestore
    await setDoc(doc(db, OTP_COL, email.toLowerCase()), {
      otp,
      email: email.toLowerCase(),
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      verified: false,
    });

    // Send email
    const emailSent = await sendEmailViaEmailJS({
      to_email: email,
      to_name: userName || 'Bạn',
      otp_code: otp,
      app_name: 'Hi-Note',
      expiry_minutes: OTP_EXPIRY_MINUTES.toString(),
    });

    console.log(`📧 OTP for ${email}: ${otp}`);

    if (emailSent) {
      return { 
        success: true, 
        message: `Mã OTP đã được gửi đến ${email}`,
      };
    } else {
      // Email failed but OTP stored - show OTP for testing
      return { 
        success: true, 
        message: `Mã OTP đã được tạo`,
        otp: otp,
      };
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    return { success: false, message: 'Không thể gửi mã OTP. Vui lòng thử lại.' };
  }
}

// Verify OTP
export async function verifyEmailOTP(email: string, inputOTP: string): Promise<{ success: boolean; message: string }> {
  if (!isFirebaseConfigured || !db) {
    return { success: false, message: 'Firebase chưa được cấu hình' };
  }

  try {
    const otpDoc = await getDoc(doc(db, OTP_COL, email.toLowerCase()));

    if (!otpDoc.exists()) {
      return { success: false, message: 'Mã OTP không tồn tại. Vui lòng gửi lại.' };
    }

    const data = otpDoc.data();
    const expiresAt = data.expiresAt?.toDate();

    if (expiresAt && new Date() > expiresAt) {
      await deleteDoc(doc(db, OTP_COL, email.toLowerCase()));
      return { success: false, message: 'Mã OTP đã hết hạn. Vui lòng gửi lại.' };
    }

    if (data.otp !== inputOTP) {
      return { success: false, message: 'Mã OTP không đúng. Vui lòng kiểm tra lại.' };
    }

    await deleteDoc(doc(db, OTP_COL, email.toLowerCase()));
    return { success: true, message: 'Xác thực thành công!' };
  } catch (error) {
    console.error('Verify OTP error:', error);
    return { success: false, message: 'Lỗi xác thực. Vui lòng thử lại.' };
  }
}

// Check if email exists
export async function checkEmailExists(email: string): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  
  try {
    const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Check email error:', error);
    return false;
  }
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const isEmailConfigured = true;
