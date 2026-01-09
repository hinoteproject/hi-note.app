// Product - AI học giá
export interface Product {
  id: string;
  name: string;
  aliases: string[];
  price: number;
  costPrice?: number; // Giá vốn
  category?: string;
  image?: string;
  unit?: string; // đơn vị: ly, phần, cái...
  stock?: number; // tồn kho
  minStock?: number; // cảnh báo khi dưới mức này
  createdAt: Date;
  learnedFromVoice: boolean;
}

// Order Item
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Order
export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  tableNumber?: string;
  customerId?: string; // Liên kết khách hàng
  note?: string;
  paymentMethod: 'cash' | 'transfer' | 'pending';
  paymentStatus: 'pending' | 'paid';
  qrCodeData?: string;
  createdAt: Date;
  paidAt?: Date;
}

// Bank Account
export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

// Customer - Khách hàng
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  totalSpent: number; // Tổng chi tiêu
  totalOrders: number; // Số đơn
  debt: number; // Công nợ
  createdAt: Date;
}

// Stock Import - Nhập kho
export interface StockImport {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  totalCost: number;
  supplier?: string;
  note?: string;
  createdAt: Date;
}

// Expense - Chi phí (đã có, mở rộng)
export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  note?: string;
  createdAt: Date;
}

// Notification
export interface AppNotification {
  id: string;
  type: 'order' | 'payment' | 'stock' | 'debt';
  title: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: Date;
}

// AI Parser Response
export interface AIParseResult {
  items: {
    name: string;
    quantity: number;
    matchedProductId: string | null;
    price?: number;
  }[];
  table: string | null;
  note: string | null;
  newProducts: string[];
}

// App State
export interface AppState {
  products: Product[];
  orders: Order[];
  bankAccounts: BankAccount[];
  customers: Customer[];
  stockImports: StockImport[];
  expenses: Expense[];
  notifications: AppNotification[];
  todayRevenue: number;
}
