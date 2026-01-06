import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Product, Order, BankAccount } from '../types';

// Collections
const PRODUCTS_COL = 'products';
const ORDERS_COL = 'orders';
const BANKS_COL = 'bankAccounts';
const EXPENSES_COL = 'expenses';

// ==================== PRODUCTS ====================
export async function addProductToFirebase(product: Omit<Product, 'id' | 'createdAt'>): Promise<string> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  
  const docRef = await addDoc(collection(db, PRODUCTS_COL), {
    ...product,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateProductInFirebase(id: string, updates: Partial<Product>): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  
  await updateDoc(doc(db, PRODUCTS_COL, id), updates);
}

export async function deleteProductFromFirebase(id: string): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  
  await deleteDoc(doc(db, PRODUCTS_COL, id));
}

export async function getProductsFromFirebase(): Promise<Product[]> {
  if (!isFirebaseConfigured || !db) return [];
  
  const q = query(collection(db, PRODUCTS_COL), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Product[];
}

export function subscribeToProducts(callback: (products: Product[]) => void): () => void {
  if (!isFirebaseConfigured || !db) return () => {};
  
  const q = query(collection(db, PRODUCTS_COL), orderBy('createdAt', 'desc'));
  
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
export async function addOrderToFirebase(order: Omit<Order, 'id'>): Promise<string> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  
  const docRef = await addDoc(collection(db, ORDERS_COL), {
    ...order,
    createdAt: Timestamp.now(),
    paidAt: order.paidAt ? Timestamp.fromDate(new Date(order.paidAt)) : null,
  });
  return docRef.id;
}

export async function updateOrderInFirebase(id: string, updates: Partial<Order>): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  
  const updateData: any = { ...updates };
  if (updates.paidAt) {
    updateData.paidAt = Timestamp.fromDate(new Date(updates.paidAt));
  }
  
  await updateDoc(doc(db, ORDERS_COL, id), updateData);
}

export async function getOrdersFromFirebase(): Promise<Order[]> {
  if (!isFirebaseConfigured || !db) return [];
  
  const q = query(collection(db, ORDERS_COL), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    paidAt: doc.data().paidAt?.toDate() || undefined,
  })) as Order[];
}

export function subscribeToOrders(callback: (orders: Order[]) => void): () => void {
  if (!isFirebaseConfigured || !db) return () => {};
  
  const q = query(collection(db, ORDERS_COL), orderBy('createdAt', 'desc'));
  
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

// ==================== BANK ACCOUNTS ====================
export async function addBankToFirebase(bank: Omit<BankAccount, 'id'>): Promise<string> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  
  const docRef = await addDoc(collection(db, BANKS_COL), bank);
  return docRef.id;
}

export async function updateBankInFirebase(id: string, updates: Partial<BankAccount>): Promise<void> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  
  await updateDoc(doc(db, BANKS_COL, id), updates);
}

export async function getBanksFromFirebase(): Promise<BankAccount[]> {
  if (!isFirebaseConfigured || !db) return [];
  
  const snapshot = await getDocs(collection(db, BANKS_COL));
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as BankAccount[];
}

export function subscribeToBanks(callback: (banks: BankAccount[]) => void): () => void {
  if (!isFirebaseConfigured || !db) return () => {};
  
  return onSnapshot(collection(db, BANKS_COL), (snapshot) => {
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

export async function addExpenseToFirebase(expense: Omit<Expense, 'id'>): Promise<string> {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase chưa được cấu hình');
  
  const docRef = await addDoc(collection(db, EXPENSES_COL), {
    ...expense,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getExpensesFromFirebase(): Promise<Expense[]> {
  if (!isFirebaseConfigured || !db) return [];
  
  const q = query(collection(db, EXPENSES_COL), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Expense[];
}

export function subscribeToExpenses(callback: (expenses: Expense[]) => void): () => void {
  if (!isFirebaseConfigured || !db) return () => {};
  
  const q = query(collection(db, EXPENSES_COL), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Expense[];
    callback(expenses);
  });
}
