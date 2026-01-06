# Hi-Note 📝

App quản lý bán hàng với AI Speech-to-Text.

## Tính năng

- 🎤 **Speech-to-Text**: Nói để tạo đơn hàng (Groq Whisper)
- 🤖 **AI Parser**: Tự động nhận diện sản phẩm, giá, số bàn
- 🔥 **Firebase**: Lưu trữ dữ liệu realtime
- 💰 **Quản lý đơn hàng**: Tạo, xem lịch sử, thanh toán
- 📊 **Chi phí**: Theo dõi chi phí kinh doanh

## Cài đặt

```bash
cd hi-note
npm install
npx expo start
```

## Build APK

```bash
npx eas login
npx eas build -p android --profile preview
```

## Cấu hình

API keys đã được cấu hình sẵn trong `src/config/keys.ts`:
- Groq API (Speech-to-Text + AI)
- Firebase (Database)

## Tech Stack

- React Native + Expo
- TypeScript
- Firebase Firestore
- Groq Whisper API
- Zustand (State management)
