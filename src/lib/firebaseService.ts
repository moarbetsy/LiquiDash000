import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';
import type { Client, Product, Order, Expense, LogEntry } from '../types';

// Collection names
const COLLECTIONS = {
  CLIENTS: 'clients',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  EXPENSES: 'expenses',
  LOGS: 'logs',
  USER_DATA: 'userData'
};

// Encrypt sensitive data (simple encryption for demo - in production use proper encryption)
const encrypt = (text: string): string => {
  // In production, use a proper encryption library like crypto-js
  return btoa(text); // Base64 encoding for demo
};

const decrypt = (text: string): string => {
  // In production, use a proper decryption library
  return atob(text); // Base64 decoding for demo
};

// Firebase Service Class
export class FirebaseService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Generic collection reference with user scope
  private getUserCollection(collectionName: string) {
    return collection(db, 'users', this.userId, collectionName);
  }

  // Check if user is authenticated
  private isAuthenticated(): boolean {
    const auth = getAuth();
    const user = auth.currentUser;
    console.log('FirebaseService: Current user:', user ? user.uid : 'null');
    return user !== null;
  }

  // CLIENTS
  async getClients(): Promise<Client[]> {
    try {
      if (!this.isAuthenticated()) {
        console.error('FirebaseService: User not authenticated');
        return [];
      }

      console.log('FirebaseService: Getting clients for userId:', this.userId);
      const q = query(this.getUserCollection(COLLECTIONS.CLIENTS), orderBy('displayId', 'asc'));
      const snapshot = await getDocs(q);
      console.log('FirebaseService: Retrieved', snapshot.docs.length, 'clients');
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          name: data.name ? decrypt(data.name) : '',
          email: data.email ? decrypt(data.email) : undefined,
          phone: data.phone ? decrypt(data.phone) : undefined,
          address: data.address ? decrypt(data.address) : undefined,
          notes: data.notes ? decrypt(data.notes) : undefined,
          etransfer: data.etransfer ? decrypt(data.etransfer) : undefined,
        } as Client;
      });
    } catch (error) {
      console.error('Error getting clients:', error);
      console.error('Error details:', error);
      return [];
    }
  }

  async addClient(client: Omit<Client, 'id'>): Promise<Client> {
    try {
      const docRef = doc(this.getUserCollection(COLLECTIONS.CLIENTS));
      const encryptedClient = {
        ...client,
        name: encrypt(client.name),
        email: client.email ? encrypt(client.email) : null,
        phone: client.phone ? encrypt(client.phone) : null,
        address: client.address ? encrypt(client.address) : null,
        notes: client.notes ? encrypt(client.notes) : null,
        etransfer: client.etransfer ? encrypt(client.etransfer) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await setDoc(docRef, encryptedClient);
      return { ...client, id: docRef.id };
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  }

  async updateClient(clientId: string, updates: Partial<Client>): Promise<void> {
    try {
      const encryptedUpdates: any = {
        updatedAt: Timestamp.now()
      };

      if (updates.name) encryptedUpdates.name = encrypt(updates.name);
      if (updates.email !== undefined) encryptedUpdates.email = updates.email ? encrypt(updates.email) : null;
      if (updates.phone !== undefined) encryptedUpdates.phone = updates.phone ? encrypt(updates.phone) : null;
      if (updates.address !== undefined) encryptedUpdates.address = updates.address ? encrypt(updates.address) : null;
      if (updates.notes !== undefined) encryptedUpdates.notes = updates.notes ? encrypt(updates.notes) : null;
      if (updates.etransfer !== undefined) encryptedUpdates.etransfer = updates.etransfer ? encrypt(updates.etransfer) : null;

      // Copy non-sensitive fields
      const nonSensitiveFields = ['displayId', 'orders', 'totalSpent', 'inactive'];
      nonSensitiveFields.forEach(field => {
        if (updates[field as keyof Client] !== undefined) {
          encryptedUpdates[field] = updates[field as keyof Client];
        }
      });

      await updateDoc(doc(this.getUserCollection(COLLECTIONS.CLIENTS), clientId), encryptedUpdates);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  async deleteClient(clientId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.getUserCollection(COLLECTIONS.CLIENTS), clientId));
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    try {
      if (!this.isAuthenticated()) {
        console.error('FirebaseService: User not authenticated');
        return [];
      }

      const q = query(this.getUserCollection(COLLECTIONS.PRODUCTS), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Product));
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      const docRef = doc(this.getUserCollection(COLLECTIONS.PRODUCTS));
      const productData = {
        ...product,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      await setDoc(docRef, productData);
      return { ...product, id: docRef.id };
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    try {
      await updateDoc(doc(this.getUserCollection(COLLECTIONS.PRODUCTS), productId), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.getUserCollection(COLLECTIONS.PRODUCTS), productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // ORDERS
  async getOrders(): Promise<Order[]> {
    try {
      if (!this.isAuthenticated()) {
        console.error('FirebaseService: User not authenticated');
        return [];
      }

      const q = query(this.getUserCollection(COLLECTIONS.ORDERS), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Order));
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  async addOrder(order: Omit<Order, 'id'>): Promise<Order> {
    try {
      const docRef = doc(this.getUserCollection(COLLECTIONS.ORDERS));
      const orderData = {
        ...order,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      await setDoc(docRef, orderData);
      return { ...order, id: docRef.id };
    } catch (error) {
      console.error('Error adding order:', error);
      throw error;
    }
  }

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    try {
      await updateDoc(doc(this.getUserCollection(COLLECTIONS.ORDERS), orderId), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.getUserCollection(COLLECTIONS.ORDERS), orderId));
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }

  // EXPENSES
  async getExpenses(): Promise<Expense[]> {
    try {
      if (!this.isAuthenticated()) {
        console.error('FirebaseService: User not authenticated');
        return [];
      }

      const q = query(this.getUserCollection(COLLECTIONS.EXPENSES), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as Expense));
    } catch (error) {
      console.error('Error getting expenses:', error);
      return [];
    }
  }

  async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    try {
      const docRef = doc(this.getUserCollection(COLLECTIONS.EXPENSES));
      const expenseData = {
        ...expense,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      await setDoc(docRef, expenseData);
      return { ...expense, id: docRef.id };
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<void> {
    try {
      await updateDoc(doc(this.getUserCollection(COLLECTIONS.EXPENSES), expenseId), {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  async deleteExpense(expenseId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.getUserCollection(COLLECTIONS.EXPENSES), expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // LOGS
  async getLogs(): Promise<LogEntry[]> {
    try {
      if (!this.isAuthenticated()) {
        console.error('FirebaseService: User not authenticated');
        return [];
      }

      const q = query(this.getUserCollection(COLLECTIONS.LOGS), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      } as LogEntry));
    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
    }
  }

  async addLog(log: Omit<LogEntry, 'id'>): Promise<LogEntry> {
    try {
      const docRef = doc(this.getUserCollection(COLLECTIONS.LOGS));
      const logData = {
        ...log,
        timestamp: Timestamp.now()
      };
      await setDoc(docRef, logData);
      return { ...log, id: docRef.id };
    } catch (error) {
      console.error('Error adding log:', error);
      throw error;
    }
  }

  // Real-time listeners
  onClientsChange(callback: (clients: Client[]) => void) {
    return onSnapshot(
      query(this.getUserCollection(COLLECTIONS.CLIENTS), orderBy('displayId', 'asc')),
      (snapshot) => {
        const clients = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            name: data.name ? decrypt(data.name) : '',
            email: data.email ? decrypt(data.email) : undefined,
            phone: data.phone ? decrypt(data.phone) : undefined,
            address: data.address ? decrypt(data.address) : undefined,
            notes: data.notes ? decrypt(data.notes) : undefined,
            etransfer: data.etransfer ? decrypt(data.etransfer) : undefined,
          } as Client;
        });
        callback(clients);
      },
      (error) => console.error('Error listening to clients:', error)
    );
  }

  onProductsChange(callback: (products: Product[]) => void) {
    return onSnapshot(
      query(this.getUserCollection(COLLECTIONS.PRODUCTS), orderBy('name', 'asc')),
      (snapshot) => {
        const products = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as Product));
        callback(products);
      },
      (error) => console.error('Error listening to products:', error)
    );
  }

  onOrdersChange(callback: (orders: Order[]) => void) {
    return onSnapshot(
      query(this.getUserCollection(COLLECTIONS.ORDERS), orderBy('date', 'desc')),
      (snapshot) => {
        const orders = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as Order));
        callback(orders);
      },
      (error) => console.error('Error listening to orders:', error)
    );
  }

  onExpensesChange(callback: (expenses: Expense[]) => void) {
    return onSnapshot(
      query(this.getUserCollection(COLLECTIONS.EXPENSES), orderBy('date', 'desc')),
      (snapshot) => {
        const expenses = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as Expense));
        callback(expenses);
      },
      (error) => console.error('Error listening to expenses:', error)
    );
  }

  onLogsChange(callback: (logs: LogEntry[]) => void) {
    return onSnapshot(
      query(this.getUserCollection(COLLECTIONS.LOGS), orderBy('timestamp', 'desc')),
      (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as LogEntry));
        callback(logs);
      },
      (error) => console.error('Error listening to logs:', error)
    );
  }

  // Bulk operations for data migration
  async migrateLocalData(localData: {
    clients: Client[];
    products: Product[];
    orders: Order[];
    expenses: Expense[];
    logs: LogEntry[];
  }): Promise<void> {
    try {
      const batches: any[] = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;
      const BATCH_LIMIT = 400; // Leave some buffer below Firestore's 500 limit

      // Helper function to add operation to batch, creating new batch if needed
      const addToBatch = (collectionName: string, data: any) => {
        if (operationCount >= BATCH_LIMIT) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
        const docRef = doc(this.getUserCollection(collectionName));
        currentBatch.set(docRef, data);
        operationCount++;
      };

      // Migrate clients
      localData.clients.forEach(client => {
        const encryptedClient = {
          ...client,
          name: encrypt(client.name),
          email: client.email ? encrypt(client.email) : null,
          phone: client.phone ? encrypt(client.phone) : null,
          address: client.address ? encrypt(client.address) : null,
          notes: client.notes ? encrypt(client.notes) : null,
          etransfer: client.etransfer ? encrypt(client.etransfer) : null,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        addToBatch(COLLECTIONS.CLIENTS, encryptedClient);
      });

      // Migrate products
      localData.products.forEach(product => {
        const productData = {
          ...product,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        addToBatch(COLLECTIONS.PRODUCTS, productData);
      });

      // Migrate orders
      localData.orders.forEach(order => {
        const orderData = {
          ...order,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        addToBatch(COLLECTIONS.ORDERS, orderData);
      });

      // Migrate expenses
      localData.expenses.forEach(expense => {
        const expenseData = {
          ...expense,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        addToBatch(COLLECTIONS.EXPENSES, expenseData);
      });

      // Migrate logs
      localData.logs.forEach(log => {
        const logData = {
          ...log,
          timestamp: Timestamp.fromDate(new Date(log.timestamp))
        };
        addToBatch(COLLECTIONS.LOGS, logData);
      });

      // Add the final batch if it has operations
      if (operationCount > 0) {
        batches.push(currentBatch);
      }

      // Execute all batches
      console.log(`Migrating data in ${batches.length} batches`);
      for (let i = 0; i < batches.length; i++) {
        console.log(`Committing batch ${i + 1}/${batches.length}`);
        await batches[i].commit();
      }

      console.log('Data migration completed successfully');
    } catch (error) {
      console.error('Error migrating data:', error);
      throw error;
    }
  }
}
