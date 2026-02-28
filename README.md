# 📒 Hi-Note — Ứng dụng quản lý bán hàng bằng giọng nói

> Ghi nhận đơn hàng nhanh chóng bằng giọng nói hoặc nhập tay, quản lý sản phẩm, khách hàng, kho và doanh thu — tất cả trong một ứng dụng.

<p align="center">
  <img src="./assets/icon.png" width="120" alt="Hi-Note Logo" />
</p>

---

## ✨ Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| 🎤 **Ghi đơn bằng giọng nói** | Nói tên món và số lượng, AI tự nhận dạng và tạo đơn |
| 🛍️ **Tạo đơn hàng nhanh** | Chọn sản phẩm từ thư viện, thêm ghi chú, xác nhận thanh toán |
| 💳 **Đa phương thức thanh toán** | Tiền mặt hoặc chuyển khoản QR ngân hàng |
| 📦 **Quản lý sản phẩm** | Thêm, sửa, xóa sản phẩm với giá bán và hình ảnh |
| 👥 **Quản lý khách hàng** | Lưu thông tin, lịch sử mua hàng, công nợ |
| 📊 **Báo cáo doanh thu** | Thống kê theo ngày, tuần, tháng, năm với biểu đồ |
| 🏦 **Tài khoản ngân hàng** | Tạo mã QR thanh toán tự động |
| 🔐 **Phân tách dữ liệu** | Mỗi tài khoản có dữ liệu riêng biệt trên Firebase |

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) + [Expo SDK 54](https://expo.dev/)
- **Language**: TypeScript
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Backend / Database**: [Firebase Firestore](https://firebase.google.com/)
- **AI / Voice**: Groq AI (Whisper STT + LLaMA parsing)
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **Build**: [EAS Build](https://docs.expo.dev/build/introduction/)

---

## 🚀 Cài đặt & Chạy

### Yêu cầu
- Node.js >= 18
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)

### Cài dependencies
```bash
cd hi-note.app
npm install
```

### Cấu hình môi trường
Tạo file `src/services/firebase.ts` với config Firebase của bạn:
```ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ...
};
```

Cập nhật Groq API key trong `src/services/rag.ts`:
```ts
const GROQ_API_KEY = "YOUR_GROQ_API_KEY";
```

### Chạy development
```bash
npx expo start
# Quét QR code bằng Expo Go (iOS/Android)
```

---

## 📱 Build APK

### Preview APK (internal testing)
```bash
npx eas-cli build --platform android --profile preview
```

### Production APK
```bash
npx eas-cli build --platform android --profile production
```

Build sẽ chạy trên Expo cloud, sau khi xong có thể tải APK về cài thẳng.

---

## 📁 Cấu trúc thư mục

```
hi-note.app/
├── src/
│   ├── screens/          # Các màn hình chính
│   │   ├── HomeScreen.tsx        # Dashboard + doanh thu
│   │   ├── SellScreen.tsx        # Tạo đơn + voice input
│   │   ├── PaymentScreen.tsx     # Xác nhận thanh toán
│   │   ├── ProductsScreen.tsx    # Quản lý thực đơn
│   │   ├── OrdersScreen.tsx      # Lịch sử đơn hàng
│   │   ├── ReportsScreen.tsx     # Báo cáo doanh thu
│   │   ├── CustomersScreen.tsx   # Quản lý khách hàng
│   │   ├── SettingsScreen.tsx    # Cài đặt tài khoản
│   │   └── AuthScreen.tsx        # Đăng nhập / Đăng ký
│   ├── components/       # UI components tái sử dụng
│   │   ├── GlassCard.tsx         # Card với blur effect
│   │   ├── AnimatedButton.tsx    # Button có spring animation
│   │   └── RevenueChart.tsx      # Biểu đồ doanh thu
│   ├── services/         # Firebase, AI, voice services
│   │   ├── firebase.ts           # Firebase config
│   │   ├── firebaseStore.ts      # CRUD operations (user-scoped)
│   │   ├── rag.ts                # Groq AI integration
│   │   └── voiceRecorder.ts      # Ghi âm và transcription
│   ├── store/
│   │   └── useStore.ts           # Zustand global state
│   ├── constants/
│   │   └── theme.ts              # Colors, gradients, shadows
│   └── types/
│       └── index.ts              # TypeScript types
├── assets/               # Icons, images
├── app.json              # Expo config
└── eas.json              # EAS Build config
```

---

## 🔒 Bảo mật & Dữ liệu

- **Data isolation**: Mỗi user có sub-collection riêng trên Firestore (`users/{userId}/orders`, `users/{userId}/products`, ...)
- **API Keys**: Cần đưa vào environment variables trước khi deploy production
- **Auth**: Hiện dùng phone number / email đơn giản — có thể nâng cấp Firebase Auth

---

## 🌐 Firestore Structure

```
users/
  {userId}/
    products/      { name, price, aliases, ... }
    orders/        { items, totalAmount, paymentMethod, ... }
    bankAccounts/  { bankName, accountNumber, isDefault }
    customers/     { name, phone, totalSpent, debt, ... }
    stockImports/  { productId, quantity, costPrice, ... }
    expenses/      { name, amount, category, ... }
```

---

## 📄 License

MIT © Hi-Note Team
