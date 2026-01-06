// Product - AI học giá
export interface Product {
  id: string;
  name: string;
  aliases: string[];
  price: number;
  category?: string;
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
  todayRevenue: number;
}
