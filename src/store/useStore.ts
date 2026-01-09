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
  deleteOrderFromFirebase,
  addUserToFirebase,
  getUserByPhoneFromFirebase,
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
  setCurrentOrder: (items: OrderItem[], table?: string) => void;
  deleteOrder: (id: string) => Promise<void>;
  // User
  user: {
    name: string;
    phone: string;
    city?: string;
    business?: string;
    createdAt: Date;
  } | null;
  setUser: (user: { name: string; phone: string; city?: string; business?: string; createdAt?: Date }) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useStore = create<StoreState>()((set, get) => ({
  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  // User
  user: null,
  setUser: (user) => {
    const u = {
      name: user.name,
      phone: user.phone,
      city: user.city,
      business: user.business,
      createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    };
    set({ user: u });
    // If firebase configured, create user doc in firestore (best-effort)
    (async () => {
      try {
        if (isFirebaseConfigured) {
          // call addUserToFirebase to ensure remote copy
          await addUserToFirebase(u);
        }
      } catch (e) {
        // ignore remote errors
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('hi_note_user', JSON.stringify(u));
      } catch (e) {
        // ignore if not available
      }
    })();
  },
  loadUserFromStorage: async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const raw = await AsyncStorage.getItem('hi_note_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date();
        set({ user: parsed });
      }
    } catch (e) {
      // ignore
    }
  },

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
 
  setCurrentOrder: (items, table) => {
    set({ currentOrder: items, currentTable: table || '' });
  },

  deleteOrder: async (id) => {
    const { orders } = get();
    if (isFirebaseConfigured) {
      try {
        await deleteOrderFromFirebase(id);
      } catch (err) {
        console.warn('Delete order failed', err);
      }
    }
    set((state) => ({
      orders: state.orders.filter(o => o.id !== id)
    }));
  },
  login: async (phone) => {
    if (isFirebaseConfigured) {
      try {
        const remote = await getUserByPhoneFromFirebase(phone);
        if (remote) {
          set({ user: { name: remote.name, phone: remote.phone, city: remote.city, business: remote.business, createdAt: remote.createdAt } });
          // persist locally too
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem('hi_note_user', JSON.stringify(remote));
          } catch {}
          return true;
        }
        return false;
      } catch (e) {
        console.warn('Firebase login error', e);
        return false;
      }
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const raw = await AsyncStorage.getItem('hi_note_user');
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (parsed.phone === phone) {
          parsed.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date();
          set({ user: parsed });
          return true;
        }
        return false;
      } catch (e) {
        const { user } = get();
        return !!(user && user.phone === phone);
      }
    }
  },
  logout: async () => {
    set({ user: null });
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('hi_note_user');
    } catch (e) {
      // ignore
    }
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
