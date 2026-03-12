import { create } from 'zustand';
import { Product, Order, OrderItem, BankAccount, Customer, StockImport, Expense, AppNotification } from '../types';
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
  getUserByEmailFromFirebase,
  addBankToFirebase,
  updateBankInFirebase,
  getBanksFromFirebase,
  addCustomerToFirebase,
  updateCustomerInFirebase,
  deleteCustomerFromFirebase,
  getCustomersFromFirebase,
  addStockImportToFirebase,
  getStockImportsFromFirebase,
  getExpensesFromFirebase,
  updateUserInFirebase,
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
  currentBillName: string;
  addToCurrentOrder: (item: OrderItem) => void;
  updateCurrentOrderItem: (index: number, updates: Partial<OrderItem>) => void;
  removeFromCurrentOrder: (index: number) => void;
  clearCurrentOrder: () => void;
  setCurrentTable: (table: string) => void;
  setCurrentBillName: (name: string) => void;
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

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  loadCustomers: () => Promise<void>;

  // Stock Imports
  stockImports: StockImport[];
  addStockImport: (data: Omit<StockImport, 'id' | 'createdAt'>) => Promise<void>;
  loadStockImports: () => Promise<void>;

  // Expenses
  expenses: Expense[];
  loadExpenses: () => Promise<void>;

  // Notifications
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Loading state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Settings
  useMenuMatching: boolean;
  setUseMenuMatching: (value: boolean) => void;

  // Stats
  getTodayRevenue: () => number;
  setCurrentOrder: (items: OrderItem[], table?: string) => void;
  deleteOrder: (id: string) => Promise<void>;
  // User
  user: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    city?: string;
    business?: string;
    createdAt: Date;
  } | null;
  setUser: (user: { name: string; phone?: string; email?: string; city?: string; business?: string; createdAt?: Date }) => void;
  updateUserProfile: (updates: Partial<{ name: string; phone?: string; email?: string; city?: string; business?: string }>) => Promise<void>;
  login: (phone: string) => Promise<boolean>;
  loginByEmail: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useStore = create<StoreState>()((set, get) => ({
  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  // Settings
  useMenuMatching: true, // Mặc định bật
  setUseMenuMatching: (value) => set({ useMenuMatching: value }),

  // User
  user: null,
  setUser: (user) => {
    const u = {
      id: (user as any).id || generateId(), // dùng id có sẵn hoặc tạo local id tạm
      name: user.name,
      phone: user.phone,
      email: user.email,
      city: user.city,
      business: user.business,
      createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    };
    set({ user: u });
    // If firebase configured, create user doc in firestore (best-effort)
    (async () => {
      try {
        if (isFirebaseConfigured) {
          // call addUserToFirebase to ensure remote copy — returns real Firestore ID
          const firebaseId = await addUserToFirebase(u);
          // update user with real firebase id
          set((state) => state.user ? { user: { ...state.user, id: firebaseId } } : {});
        }
      } catch (e) {
        // ignore remote errors
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('hi_note_user', JSON.stringify(get().user));
      } catch (e) {
        // ignore if not available
      }
    })();
  },
  updateUserProfile: async (updates) => {
    const current = get().user;
    if (!current) return;

    const merged = { ...current, ...updates } as any;
    set({ user: merged });

    // persist locally
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('hi_note_user', JSON.stringify(merged));
    } catch (e) {
      // ignore
    }

    // update remote user doc if possible
    try {
      if (isFirebaseConfigured && current.id) {
        await updateUserInFirebase(current.id, updates as any);
      } else if (isFirebaseConfigured) {
        // try locate remote by email/phone and update
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { getUserByEmailFromFirebase, getUserByPhoneFromFirebase } = require('../services/firebaseStore');
        let remote = null;
        if ((merged as any).email) remote = await getUserByEmailFromFirebase((merged as any).email);
        if (!remote && (merged as any).phone) remote = await getUserByPhoneFromFirebase((merged as any).phone);
        if (remote) {
          await updateUserInFirebase(remote.id, updates as any);
          // ensure local id matches remote
          set({ user: { ...merged, id: remote.id } });
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem('hi_note_user', JSON.stringify({ ...merged, id: remote.id }));
          } catch {}
        }
      }
    } catch (e) {
      // ignore remote errors
    }
  },
  loadUserFromStorage: async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const raw = await AsyncStorage.getItem('hi_note_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date();

        // Migration: user cũ không có id field — tìm lại từ Firebase
        if (!parsed.id) {
          try {
            let remote = null;
            if (parsed.phone) remote = await getUserByPhoneFromFirebase(parsed.phone);
            else if (parsed.email) remote = await getUserByEmailFromFirebase(parsed.email);
            parsed.id = remote?.id || generateId(); // fallback: local id tạm
          } catch {
            parsed.id = generateId();
          }
          // Lưu lại với id mới
          try { await AsyncStorage.setItem('hi_note_user', JSON.stringify(parsed)); } catch { }
        }

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
    const uid = get().user?.id as string | undefined;
    if (isFirebaseConfigured && uid) {
      const products = await getProductsFromFirebase(uid);
      set({ products });
    }
  },

  addProduct: async (product) => {
    const uid = get().user?.id as string | undefined;
    if (isFirebaseConfigured && uid) {
      const id = await addProductToFirebase(uid, product);
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
    const uid = get().user?.id as string | undefined;
    if (isFirebaseConfigured && uid) {
      await updateProductInFirebase(uid, id, updates);
    }
    set((state) => ({
      products: state.products.map(p =>
        p.id === id ? { ...p, ...updates } : p
      )
    }));
  },

  deleteProduct: async (id) => {
    const uid = get().user?.id as string | undefined;
    if (isFirebaseConfigured && uid) {
      await deleteProductFromFirebase(uid, id);
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
  currentBillName: '',
  setOrders: (orders) => set({ orders }),

  loadOrders: async () => {
    const uid = get().user?.id as string | undefined;
    if (isFirebaseConfigured && uid) {
      const orders = await getOrdersFromFirebase(uid);
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
    if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
      updated[index].subtotal = updated[index].quantity * updated[index].unitPrice;
    }
    return { currentOrder: updated };
  }),

  removeFromCurrentOrder: (index) => set((state) => ({
    currentOrder: state.currentOrder.filter((_, i) => i !== index)
  })),

  clearCurrentOrder: () => set({ currentOrder: [], currentTable: '', currentBillName: '' }),

  setCurrentTable: (table) => set({ currentTable: table }),
  setCurrentBillName: (name) => set({ currentBillName: name }),

  createOrder: async (paymentMethod) => {
    const { currentOrder, currentTable, currentBillName, orders } = get();

    // Auto-generate bill name nếu không nhập
    const generateDefaultBillName = () => {
      const today = new Date();
      const dateStr = today.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      const todayOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d.toDateString() === today.toDateString();
      });
      return `Đơn ${todayOrders.length + 1} ngày ${dateStr}`;
    };

    const orderData = {
      items: currentOrder,
      totalAmount: currentOrder.reduce((sum, item) => sum + item.subtotal, 0),
      tableNumber: currentTable || undefined,
      billName: currentBillName.trim() || generateDefaultBillName(),
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'paid' as const : 'pending' as const,
      createdAt: new Date(),
      paidAt: paymentMethod === 'cash' ? new Date() : undefined,
    };

    let order: Order;

    if (isFirebaseConfigured) {
      const uid = get().user?.id as string | undefined;
      // Nếu không có uid (user cưa đã có id), vẫn tạo đơn nhưng không lưu Firebase
      if (uid) {
        const id = await addOrderToFirebase(uid, orderData);
        order = { ...orderData, id };
      } else {
        order = { ...orderData, id: generateId() };
        console.warn('⚠️ Tạo đơn local vì user chưa có ID — đăng xuất và đăng nhập lại để đồng bộ dữ liệu');
      }
    } else {
      order = { ...orderData, id: generateId() };
    }

    set({ orders: [order, ...orders], currentOrder: [], currentTable: '', currentBillName: '' });

    // Bug #13: Auto-update customer stats when creating an order
    const { customers } = get();
    const billName = orderData.billName || '';
    const matchedCustomer = customers.find(c =>
      c.name.toLowerCase() === billName.toLowerCase()
    );
    if (matchedCustomer) {
      const updatedCustomers = customers.map(c =>
        c.id === matchedCustomer.id
          ? {
            ...c,
            totalSpent: (c.totalSpent || 0) + orderData.totalAmount,
            totalOrders: (c.totalOrders || 0) + 1,
          }
          : c
      );
      set({ customers: updatedCustomers });
    }

    return order;
  },

  updateOrderPayment: async (orderId, status) => {
    const updates = {
      paymentStatus: status,
      paidAt: status === 'paid' ? new Date() : undefined
    };

    if (isFirebaseConfigured) {
      const uid = get().user?.id as string | undefined;
      if (uid) await updateOrderInFirebase(uid, orderId, updates);
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
    if (isFirebaseConfigured) {
      const uid = get().user?.id as string | undefined;
      try {
        if (uid) await deleteOrderFromFirebase(uid, id);
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
          set({ user: { id: remote.id, name: remote.name, phone: remote.phone, city: remote.city, business: remote.business, createdAt: remote.createdAt } });
          // persist locally too
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem('hi_note_user', JSON.stringify(remote));
          } catch { }
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
  loginByEmail: async (email) => {
    if (isFirebaseConfigured) {
      try {
        const remote = await getUserByEmailFromFirebase(email);
        if (remote) {
          set({ user: { id: remote.id, name: remote.name, phone: remote.phone, email: remote.email, city: remote.city, business: remote.business, createdAt: remote.createdAt } });
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem('hi_note_user', JSON.stringify(remote));
          } catch { }
          return true;
        }
        return false;
      } catch (e) {
        console.warn('Firebase login by email error', e);
        return false;
      }
    } else {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const raw = await AsyncStorage.getItem('hi_note_user');
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (parsed.email?.toLowerCase() === email.toLowerCase()) {
          parsed.createdAt = parsed.createdAt ? new Date(parsed.createdAt) : new Date();
          set({ user: parsed });
          return true;
        }
        return false;
      } catch (e) {
        const { user } = get();
        return !!(user && user.email?.toLowerCase() === email.toLowerCase());
      }
    }
  },

  // Bank Accounts
  bankAccounts: [],
  setBanks: (banks) => set({ bankAccounts: banks }),

  loadBanks: async () => {
    const uid = get().user?.id as string | undefined;
    if (isFirebaseConfigured && uid) {
      const banks = await getBanksFromFirebase(uid);
      set({ bankAccounts: banks });
    }
  },

  addBankAccount: async (account) => {
    const uid = get().user?.id as string | undefined;
    if (isFirebaseConfigured && uid) {
      const id = await addBankToFirebase(uid, account);
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
    const uid = get().user?.id as string | undefined;

    if (isFirebaseConfigured && uid) {
      for (const bank of bankAccounts) {
        await updateBankInFirebase(uid, bank.id, { isDefault: bank.id === id });
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

  // Customers
  customers: [],
  loadCustomers: async () => {
    const uid = get().user?.id as string | undefined;
    if (isFirebaseConfigured && uid) {
      const customers = await getCustomersFromFirebase(uid);
      set({ customers });
    }
  },
  addCustomer: async (customer) => {
    const uid = get().user?.id as string | undefined;
    if (isFirebaseConfigured && uid) {
      const id = await addCustomerToFirebase(uid, customer);
      set((state) => ({
        customers: [{ ...customer, id, createdAt: new Date() }, ...state.customers]
      }));
    } else {
      set((state) => ({
        customers: [{ ...customer, id: generateId(), createdAt: new Date() }, ...state.customers]
      }));
    }
  },
  updateCustomer: async (id, updates) => {
    const uid = get().user?.id as string | undefined;
    if (isFirebaseConfigured && uid) {
      await updateCustomerInFirebase(uid, id, updates);
    }
    set((state) => ({
      customers: state.customers.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  },
  deleteCustomer: async (id) => {
    const uid = get().user?.id as string | undefined;
    if (isFirebaseConfigured && uid) {
      await deleteCustomerFromFirebase(uid, id);
    }
    set((state) => ({
      customers: state.customers.filter(c => c.id !== id)
    }));
  },

  // Stock Imports
  stockImports: [],
  loadStockImports: async () => {
    const uid = get().user?.id as string | undefined;
    if (isFirebaseConfigured && uid) {
      const stockImports = await getStockImportsFromFirebase(uid);
      set({ stockImports });
    }
  },
  addStockImport: async (data) => {
    const uid = get().user?.id as string | undefined;
    if (isFirebaseConfigured && uid) {
      const id = await addStockImportToFirebase(uid, data);
      set((state) => ({
        stockImports: [{ ...data, id, createdAt: new Date() }, ...state.stockImports]
      }));
    } else {
      set((state) => ({
        stockImports: [{ ...data, id: generateId(), createdAt: new Date() }, ...state.stockImports]
      }));
    }
  },

  // Expenses
  expenses: [],
  loadExpenses: async () => {
    const uid = get().user?.id as string | undefined;
    if (isFirebaseConfigured && uid) {
      const expenses = await getExpensesFromFirebase(uid);
      set({ expenses });
    }
  },

  // Notifications
  notifications: [],
  addNotification: (notification) => {
    const newNotif: AppNotification = {
      ...notification,
      id: generateId(),
      read: false,
      createdAt: new Date(),
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications]
    }));
  },
  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },
  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));
  },
}));
