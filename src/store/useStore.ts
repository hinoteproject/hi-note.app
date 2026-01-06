import { create } from 'zustand';
import { Product, Order, OrderItem, BankAccount } from '../types';
import { isFirebaseConfigured } from '../config/keys';
import {
  addProductToFirebase,
  updateProductInFirebase,
  deleteProductFromFirebase,
  getProductsFromFirebase,
  addOrderToFirebase,
  updateOrderInFirebase,
  getOrdersFromFirebase,
  addBankToFirebase,
  updateBankInFirebase,
  getBanksFromFirebase,
} from '../services/firebaseStore';

interface StoreState {
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  findProductByName: (name: string) => Product | undefined;
  loadProducts: () => Promise<void>;
  setProducts: (products: Product[]) => void;

  // Orders
  orders: Order[];
  currentOrder: OrderItem[];
  currentTable: string;
  addToCurrentOrder: (item: OrderItem) => void;
  updateCurrentOrderItem: (index: number, updates: Partial<OrderItem>) => void;
  removeFromCurrentOrder: (index: number) => void;
  clearCurrentOrder: () => void;
  setCurrentTable: (table: string) => void;
  createOrder: (paymentMethod: Order['paymentMethod']) => Promise<Order>;
  updateOrderPayment: (orderId: string, status: Order['paymentStatus']) => Promise<void>;
  loadOrders: () => Promise<void>;
  setOrders: (orders: Order[]) => void;

  // Bank Accounts
  bankAccounts: BankAccount[];
  addBankAccount: (account: Omit<BankAccount, 'id'>) => Promise<void>;
  setDefaultBank: (id: string) => Promise<void>;
  getDefaultBank: () => BankAccount | undefined;
  loadBanks: () => Promise<void>;
  setBanks: (banks: BankAccount[]) => void;

  // Loading state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Stats
  getTodayRevenue: () => number;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useStore = create<StoreState>()((set, get) => ({
  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  // Products
  products: [],
  setProducts: (products) => set({ products }),
  
  loadProducts: async () => {
    if (isFirebaseConfigured) {
      const products = await getProductsFromFirebase();
      set({ products });
    }
  },

  addProduct: async (product) => {
    if (isFirebaseConfigured) {
      const id = await addProductToFirebase(product);
      set((state) => ({
        products: [{
          ...product,
          id,
          createdAt: new Date(),
        }, ...state.products]
      }));
    } else {
      set((state) => ({
        products: [{
          ...product,
          id: generateId(),
          createdAt: new Date(),
        }, ...state.products]
      }));
    }
  },

  updateProduct: async (id, updates) => {
    if (isFirebaseConfigured) {
      await updateProductInFirebase(id, updates);
    }
    set((state) => ({
      products: state.products.map(p => 
        p.id === id ? { ...p, ...updates } : p
      )
    }));
  },

  deleteProduct: async (id) => {
    if (isFirebaseConfigured) {
      await deleteProductFromFirebase(id);
    }
    set((state) => ({
      products: state.products.filter(p => p.id !== id)
    }));
  },

  findProductByName: (name) => {
    const { products } = get();
    const lowerName = name.toLowerCase();
    return products.find(p => 
      p.name.toLowerCase() === lowerName ||
      p.aliases.some(a => a.toLowerCase() === lowerName)
    );
  },

  // Orders
  orders: [],
  currentOrder: [],
  currentTable: '',
  setOrders: (orders) => set({ orders }),

  loadOrders: async () => {
    if (isFirebaseConfigured) {
      const orders = await getOrdersFromFirebase();
      set({ orders });
    }
  },

  addToCurrentOrder: (item) => set((state) => {
    const existingIndex = state.currentOrder.findIndex(
      i => i.productId === item.productId
    );
    if (existingIndex >= 0) {
      const updated = [...state.currentOrder];
      updated[existingIndex].quantity += item.quantity;
      updated[existingIndex].subtotal = 
        updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      return { currentOrder: updated };
    }
    return { currentOrder: [...state.currentOrder, item] };
  }),

  updateCurrentOrderItem: (index, updates) => set((state) => {
    const updated = [...state.currentOrder];
    updated[index] = { ...updated[index], ...updates };
    if (updates.quantity || updates.unitPrice) {
      updated[index].subtotal = updated[index].quantity * updated[index].unitPrice;
    }
    return { currentOrder: updated };
  }),

  removeFromCurrentOrder: (index) => set((state) => ({
    currentOrder: state.currentOrder.filter((_, i) => i !== index)
  })),

  clearCurrentOrder: () => set({ currentOrder: [], currentTable: '' }),

  setCurrentTable: (table) => set({ currentTable: table }),

  createOrder: async (paymentMethod) => {
    const { currentOrder, currentTable, orders } = get();
    const orderData = {
      items: currentOrder,
      totalAmount: currentOrder.reduce((sum, item) => sum + item.subtotal, 0),
      tableNumber: currentTable || undefined,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'paid' as const : 'pending' as const,
      createdAt: new Date(),
      paidAt: paymentMethod === 'cash' ? new Date() : undefined,
    };

    let order: Order;
    
    if (isFirebaseConfigured) {
      const id = await addOrderToFirebase(orderData);
      order = { ...orderData, id };
    } else {
      order = { ...orderData, id: generateId() };
    }

    set({ orders: [order, ...orders], currentOrder: [], currentTable: '' });
    return order;
  },

  updateOrderPayment: async (orderId, status) => {
    const updates = { 
      paymentStatus: status, 
      paidAt: status === 'paid' ? new Date() : undefined 
    };
    
    if (isFirebaseConfigured) {
      await updateOrderInFirebase(orderId, updates);
    }
    
    set((state) => ({
      orders: state.orders.map(o => 
        o.id === orderId ? { ...o, ...updates } : o
      )
    }));
  },

  // Bank Accounts
  bankAccounts: [],
  setBanks: (banks) => set({ bankAccounts: banks }),

  loadBanks: async () => {
    if (isFirebaseConfigured) {
      const banks = await getBanksFromFirebase();
      set({ bankAccounts: banks });
    }
  },

  addBankAccount: async (account) => {
    if (isFirebaseConfigured) {
      const id = await addBankToFirebase(account);
      set((state) => ({
        bankAccounts: [...state.bankAccounts, { ...account, id }]
      }));
    } else {
      set((state) => ({
        bankAccounts: [...state.bankAccounts, { ...account, id: generateId() }]
      }));
    }
  },

  setDefaultBank: async (id) => {
    const { bankAccounts } = get();
    
    if (isFirebaseConfigured) {
      // Update all banks
      for (const bank of bankAccounts) {
        await updateBankInFirebase(bank.id, { isDefault: bank.id === id });
      }
    }
    
    set((state) => ({
      bankAccounts: state.bankAccounts.map(b => ({
        ...b,
        isDefault: b.id === id
      }))
    }));
  },

  getDefaultBank: () => {
    const { bankAccounts } = get();
    return bankAccounts.find(b => b.isDefault) || bankAccounts[0];
  },

  // Stats
  getTodayRevenue: () => {
    const { orders } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders
      .filter(o => {
        const orderDate = new Date(o.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime() && o.paymentStatus === 'paid';
      })
      .reduce((sum, o) => sum + o.totalAmount, 0);
  },
}));
