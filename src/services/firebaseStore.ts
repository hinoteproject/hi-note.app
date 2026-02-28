import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Product, Order, BankAccount, Customer, StockImport } from '../types';

// ── Sub-collection helpers (mỗi user có data riêng) ──────────────────────────
// Cấu trúc: users/{userId}/products, users/{userId}/orders, ...
const USERS_COL = 'users';
const PRODUCTS_COL = 'products';
const ORDERS_COL = 'orders';
const BANKS_COL = 'bankAccounts';
const EXPENSES_COL = 'expenses';
const CUSTOMERS_COL = 'customers';
const STOCK_IMPORTS_COL = 'stockImports';

/** Trả về reference đến sub-collection của user */
const userCol = (userId: string, colName: string) =>
  collection(db!, USERS_COL, userId, colName);

/** Trả về reference đến document trong sub-collection của user */
const userDoc = (userId: string, colName: string, docId: string) =>
  doc(db!, USERS_COL, userId, colName, docId);

// ==================== PRODUCTS ====================
export async function addProductToFirebase(userId: string, product: Omit<Product, 'id' | 'createdAt'>): Promise<string> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');

  const docRef = await addDoc(userCol(userId, PRODUCTS_COL), {
    ...product,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateProductInFirebase(userId: string, id: string, updates: Partial<Product>): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  await updateDoc(userDoc(userId, PRODUCTS_COL, id), updates);
}

export async function deleteProductFromFirebase(userId: string, id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  await deleteDoc(userDoc(userId, PRODUCTS_COL, id));
}

export async function getProductsFromFirebase(userId: string): Promise<Product[]> {
  if (!isFirebaseConfigured || !db) return [];

  const q = query(userCol(userId, PRODUCTS_COL), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Product[];
}

export function subscribeToProducts(userId: string, callback: (products: Product[]) => void): () => void {
  if (!isFirebaseConfigured || !db) return () => { };

  const q = query(userCol(userId, PRODUCTS_COL), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Product[];
    callback(products);
  });
}

// ==================== ORDERS ====================
export async function addOrderToFirebase(userId: string, order: Omit<Order, 'id'>): Promise<string> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');

  // Lọc bỏ undefined — Firestore không chấp nhận undefined
  const data: Record<string, any> = {
    items: order.items,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    billName: order.billName || '',
    createdAt: Timestamp.now(),
    paidAt: order.paidAt ? Timestamp.fromDate(new Date(order.paidAt)) : null,
  };
  if (order.tableNumber) data.tableNumber = order.tableNumber;
  if (order.customerId) data.customerId = order.customerId;
  if (order.note) data.note = order.note;

  const docRef = await addDoc(userCol(userId, ORDERS_COL), data);
  return docRef.id;
}

export async function updateOrderInFirebase(userId: string, id: string, updates: Partial<Order>): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');

  const updateData: any = { ...updates };
  if (updates.paidAt) {
    updateData.paidAt = Timestamp.fromDate(new Date(updates.paidAt));
  }

  await updateDoc(userDoc(userId, ORDERS_COL, id), updateData);
}

export async function getOrdersFromFirebase(userId: string): Promise<Order[]> {
  if (!isFirebaseConfigured || !db) return [];

  const q = query(userCol(userId, ORDERS_COL), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    paidAt: doc.data().paidAt?.toDate() || undefined,
  })) as Order[];
}

export function subscribeToOrders(userId: string, callback: (orders: Order[]) => void): () => void {
  if (!isFirebaseConfigured || !db) return () => { };

  const q = query(userCol(userId, ORDERS_COL), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      paidAt: doc.data().paidAt?.toDate() || undefined,
    })) as Order[];
    callback(orders);
  });
}

export async function deleteOrderFromFirebase(userId: string, id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  await deleteDoc(userDoc(userId, ORDERS_COL, id));
}

// ==================== BANK ACCOUNTS ====================
export async function addBankToFirebase(userId: string, bank: Omit<BankAccount, 'id'>): Promise<string> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  const docRef = await addDoc(userCol(userId, BANKS_COL), bank);
  return docRef.id;
}

export async function updateBankInFirebase(userId: string, id: string, updates: Partial<BankAccount>): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  await updateDoc(userDoc(userId, BANKS_COL, id), updates);
}

export async function getBanksFromFirebase(userId: string): Promise<BankAccount[]> {
  if (!isFirebaseConfigured || !db) return [];

  const snapshot = await getDocs(userCol(userId, BANKS_COL));

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as BankAccount[];
}

export function subscribeToBanks(userId: string, callback: (banks: BankAccount[]) => void): () => void {
  if (!isFirebaseConfigured || !db) return () => { };

  return onSnapshot(userCol(userId, BANKS_COL), (snapshot) => {
    const banks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as BankAccount[];
    callback(banks);
  });
}

// ==================== EXPENSES ====================
export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  createdAt: Date;
}

export async function addExpenseToFirebase(userId: string, expense: Omit<Expense, 'id'>): Promise<string> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');

  const docRef = await addDoc(userCol(userId, EXPENSES_COL), {
    ...expense,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getExpensesFromFirebase(userId: string): Promise<Expense[]> {
  if (!isFirebaseConfigured || !db) return [];

  const q = query(userCol(userId, EXPENSES_COL), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Expense[];
}

export function subscribeToExpenses(userId: string, callback: (expenses: Expense[]) => void): () => void {
  if (!isFirebaseConfigured || !db) return () => { };

  const q = query(userCol(userId, EXPENSES_COL), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Expense[];
    callback(expenses);
  });
}

// ==================== USERS (flat — không phân tách theo user) ====================
export async function addUserToFirebase(user: { name: string; phone?: string; email?: string; city?: string; business?: string; createdAt?: Date }): Promise<string> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');

  const userData: Record<string, any> = {
    name: user.name,
    createdAt: user.createdAt ? Timestamp.fromDate(new Date(user.createdAt)) : Timestamp.now(),
  };
  if (user.email) userData.email = user.email.toLowerCase();
  if (user.phone) userData.phone = user.phone;
  if (user.city) userData.city = user.city;
  if (user.business) userData.business = user.business;

  const docRef = await addDoc(collection(db, USERS_COL), userData);
  return docRef.id;
}

export async function getUserByPhoneFromFirebase(phone: string): Promise<({ id: string } & any) | null> {
  if (!isFirebaseConfigured || !db) return null;
  const q = query(collection(db, USERS_COL), where('phone', '==', phone));
  const snapshot = await getDocs(q);
  if (snapshot.docs.length === 0) return null;
  const doc0 = snapshot.docs[0];
  return {
    id: doc0.id,
    ...doc0.data(),
    createdAt: doc0.data().createdAt?.toDate() || new Date(),
  };
}

export async function getUserByEmailFromFirebase(email: string): Promise<({ id: string } & any) | null> {
  if (!isFirebaseConfigured || !db) return null;
  const q = query(collection(db, USERS_COL), where('email', '==', email.toLowerCase()));
  const snapshot = await getDocs(q);
  if (snapshot.docs.length === 0) return null;
  const doc0 = snapshot.docs[0];
  return {
    id: doc0.id,
    ...doc0.data(),
    createdAt: doc0.data().createdAt?.toDate() || new Date(),
  };
}

export async function updateUserInFirebase(id: string, updates: Partial<any>): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  await updateDoc(doc(db, USERS_COL, id), updates);
}

// ==================== CUSTOMERS ====================
export async function addCustomerToFirebase(userId: string, customer: Omit<Customer, 'id' | 'createdAt'>): Promise<string> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');

  const data: Record<string, any> = {
    name: customer.name,
    totalSpent: customer.totalSpent || 0,
    totalOrders: customer.totalOrders || 0,
    debt: customer.debt || 0,
    createdAt: Timestamp.now(),
  };
  if (customer.phone) data.phone = customer.phone;
  if (customer.email) data.email = customer.email;
  if (customer.address) data.address = customer.address;
  if (customer.note) data.note = customer.note;

  const docRef = await addDoc(userCol(userId, CUSTOMERS_COL), data);
  return docRef.id;
}

export async function updateCustomerInFirebase(userId: string, id: string, updates: Partial<Customer>): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');

  const data: Record<string, any> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) data[key] = value;
  });

  await updateDoc(userDoc(userId, CUSTOMERS_COL, id), data);
}

export async function deleteCustomerFromFirebase(userId: string, id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  await deleteDoc(userDoc(userId, CUSTOMERS_COL, id));
}

export async function getCustomersFromFirebase(userId: string): Promise<Customer[]> {
  if (!isFirebaseConfigured || !db) return [];

  const q = query(userCol(userId, CUSTOMERS_COL), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Customer[];
}

// ==================== STOCK IMPORTS ====================
export async function addStockImportToFirebase(userId: string, data: Omit<StockImport, 'id' | 'createdAt'>): Promise<string> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');

  const importData: Record<string, any> = {
    productId: data.productId,
    productName: data.productName,
    quantity: data.quantity,
    costPrice: data.costPrice,
    totalCost: data.totalCost,
    createdAt: Timestamp.now(),
  };
  if (data.supplier) importData.supplier = data.supplier;
  if (data.note) importData.note = data.note;

  const docRef = await addDoc(userCol(userId, STOCK_IMPORTS_COL), importData);
  return docRef.id;
}

export async function getStockImportsFromFirebase(userId: string): Promise<StockImport[]> {
  if (!isFirebaseConfigured || !db) return [];

  const q = query(userCol(userId, STOCK_IMPORTS_COL), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as StockImport[];
}
