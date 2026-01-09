# 📱 Hi-Note - Ứng dụng quản lý bán hàng thông minh

<p align="center">
  <img src="assets/icon.png" width="120" alt="Hi-Note Logo">
</p>

**Hi-Note** là ứng dụng quản lý bán hàng dành cho các cửa hàng nhỏ, quán cafe, quán ăn... Được phát triển bởi **Hi-Team** với công nghệ React Native + Expo.

## ✨ Tính năng chính

### 🏠 Tổng quan (Dashboard)
- Xem doanh thu theo ngày/tháng/năm
- Biểu đồ doanh thu trực quan
- Thống kê nhanh số đơn, doanh thu

### 🛒 Bán hàng với AI
- Nhập đơn hàng bằng giọng nói
- AI tự động nhận diện sản phẩm và số lượng
- Hỗ trợ nhiều bàn/khách hàng

### 📋 Quản lý hóa đơn
- Xem lịch sử đơn hàng
- Lọc theo ngày, trạng thái thanh toán
- In hóa đơn / Chia sẻ PDF

### 📦 Quản lý sản phẩm
- Thêm/sửa/xóa sản phẩm
- Phân loại theo danh mục
- Hỗ trợ hình ảnh sản phẩm
- Quản lý giá vốn, giá bán

### 👥 Quản lý khách hàng
- Lưu thông tin khách hàng
- Theo dõi công nợ
- Lịch sử mua hàng

### 📊 Kho hàng
- Quản lý tồn kho
- Nhập hàng, theo dõi lịch sử nhập
- Cảnh báo hết hàng

### 📈 Báo cáo
- Báo cáo doanh thu, lợi nhuận
- Top sản phẩm bán chạy
- Chia sẻ báo cáo

### 💰 Chi phí
- Ghi nhận chi phí nhanh
- Phân loại chi phí
- Tính lãi ròng tự động

### 🔔 Thông báo
- Thông báo đơn hàng mới
- Cảnh báo thanh toán, tồn kho

### 🖨️ In hóa đơn
- In hóa đơn trực tiếp
- Xuất PDF chia sẻ qua Zalo, Messenger...

## 🛠️ Công nghệ sử dụng

- **React Native** + **Expo SDK 54**
- **TypeScript**
- **Firebase** (Firestore, Authentication)
- **Zustand** (State Management)
- **EmailJS** (OTP Authentication)
- **Expo Print/Sharing** (In hóa đơn)

## 🚀 Cài đặt

### Yêu cầu
- Node.js 18+
- npm hoặc yarn
- Expo CLI
- Expo Go app (để test trên điện thoại)

### Các bước

```bash
# Clone repo
git clone https://github.com/your-username/hi-note.app.git
cd hi-note.app

# Cài dependencies
npm install

# Cấu hình Firebase (tùy chọn)
cp src/config/keys.example.ts src/config/keys.ts
# Sửa file keys.ts với thông tin Firebase của bạn

# Chạy app
npx expo start
```

## ⚙️ Cấu hình

### Firebase (tùy chọn)
Tạo project Firebase và cập nhật `src/config/keys.ts`:

```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### EmailJS (cho OTP)
Đăng ký tại [emailjs.com](https://emailjs.com) và cập nhật trong `src/services/emailOtp.ts`

## 📁 Cấu trúc thư mục

```
hi-note.app/
├── App.tsx                 # Entry point
├── src/
│   ├── components/         # UI Components
│   ├── screens/            # Màn hình
│   ├── store/              # Zustand store
│   ├── services/           # Firebase, EmailJS
│   ├── types/              # TypeScript types
│   ├── utils/              # Utilities
│   ├── constants/          # Theme, colors
│   └── config/             # API keys
├── assets/                 # Images, icons
└── package.json
```

## 📱 Screenshots

| Tổng quan | Bán hàng | Hóa đơn |
|-----------|----------|---------|
| Dashboard với biểu đồ | AI voice input | Lịch sử đơn hàng |

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo Pull Request hoặc Issue.

## 📄 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 👨‍💻 Tác giả

**Hi-Team**
- Nguyễn Thanh Liêm

---

⭐ Nếu thấy hữu ích, hãy cho repo một star nhé!
