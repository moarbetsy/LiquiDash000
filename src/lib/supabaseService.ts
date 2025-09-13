import { supabase } from '../supabase';
import type { Client, Product, Order, Expense, LogEntry } from '../types';

const TABLES = {
  CLIENTS: 'clients',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  EXPENSES: 'expenses',
  LOGS: 'logs',
};

export class SupabaseService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // CLIENTS
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .select('*')
      .eq('user_id', this.userId)
      .order('display_id', { ascending: true });

    if (error) {
      console.error('Error getting clients:', error);
      return [];
    }

    return data as Client[];
  }

  async addClient(client: Omit<Client, 'id'>): Promise<Client> {
    const { data, error } = await supabase
      .from(TABLES.CLIENTS)
      .insert({ ...client, user_id: this.userId })
      .select()
      .single();

    if (error) {
      console.error('Error adding client:', error);
      throw error;
    }

    return data as Client;
  }

  async updateClient(clientId: string, updates: Partial<Client>): Promise<void> {
    const { error } = await supabase
      .from(TABLES.CLIENTS)
      .update(updates)
      .eq('id', clientId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  async deleteClient(clientId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.CLIENTS)
      .delete()
      .eq('id', clientId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .eq('user_id', this.userId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error getting products:', error);
      return [];
    }

    return data as Product[];
  }

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .insert({ ...product, user_id: this.userId })
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      throw error;
    }

    return data as Product;
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    const { error } = await supabase
      .from(TABLES.PRODUCTS)
      .update(updates)
      .eq('id', productId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.PRODUCTS)
      .delete()
      .eq('id', productId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // ORDERS
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .select('*')
      .eq('user_id', this.userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error getting orders:', error);
      return [];
    }

    return data as Order[];
  }

  async addOrder(order: Omit<Order, 'id'>): Promise<Order> {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .insert({ ...order, user_id: this.userId })
      .select()
      .single();

    if (error) {
      console.error('Error adding order:', error);
      throw error;
    }

    return data as Order;
  }

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    const { error } = await supabase
      .from(TABLES.ORDERS)
      .update(updates)
      .eq('id', orderId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error updating order:', error);
      throw error;
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.ORDERS)
      .delete()
      .eq('id', orderId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }

  // EXPENSES
  async getExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from(TABLES.EXPENSES)
      .select('*')
      .eq('user_id', this.userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error getting expenses:', error);
      return [];
    }

    return data as Expense[];
  }

  async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const { data, error } = await supabase
      .from(TABLES.EXPENSES)
      .insert({ ...expense, user_id: this.userId })
      .select()
      .single();

    if (error) {
      console.error('Error adding expense:', error);
      throw error;
    }

    return data as Expense;
  }

  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<void> {
    const { error } = await supabase
      .from(TABLES.EXPENSES)
      .update(updates)
      .eq('id', expenseId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.EXPENSES)
      .delete()
      .eq('id', expenseId)
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // LOGS
  async getLogs(): Promise<LogEntry[]> {
    const { data, error } = await supabase
      .from(TABLES.LOGS)
      .select('*')
      .eq('user_id', this.userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error getting logs:', error);
      return [];
    }

    return data as LogEntry[];
  }

  async addLog(log: Omit<LogEntry, 'id'>): Promise<LogEntry> {
    const { data, error } = await supabase
      .from(TABLES.LOGS)
      .insert({ ...log, user_id: this.userId })
      .select()
      .single();

    if (error) {
      console.error('Error adding log:', error);
      throw error;
    }

    return data as LogEntry;
  }

  // Real-time listeners
  onClientsChange(callback: (clients: Client[]) => void) {
    const channel = supabase
      .channel('clients_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.CLIENTS,
          filter: `user_id=eq.${this.userId}`,
        },
        async () => {
          const clients = await this.getClients();
          callback(clients);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  onProductsChange(callback: (products: Product[]) => void) {
    const channel = supabase
      .channel('products_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.PRODUCTS,
          filter: `user_id=eq.${this.userId}`,
        },
        async () => {
          const products = await this.getProducts();
          callback(products);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  onOrdersChange(callback: (orders: Order[]) => void) {
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.ORDERS,
          filter: `user_id=eq.${this.userId}`,
        },
        async () => {
          const orders = await this.getOrders();
          callback(orders);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  onExpensesChange(callback: (expenses: Expense[]) => void) {
    const channel = supabase
      .channel('expenses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.EXPENSES,
          filter: `user_id=eq.${this.userId}`,
        },
        async () => {
          const expenses = await this.getExpenses();
          callback(expenses);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  onLogsChange(callback: (logs: LogEntry[]) => void) {
    const channel = supabase
      .channel('logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABLES.LOGS,
          filter: `user_id=eq.${this.userId}`,
        },
        async () => {
          const logs = await this.getLogs();
          callback(logs);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
