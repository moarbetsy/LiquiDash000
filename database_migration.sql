-- Supabase Database Migration
-- This script creates all the necessary tables for the liquid glass dashboard

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  etransfer TEXT,
  orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  inactive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('g', 'ml', 'unit')),
  stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
  increment DECIMAL(10,2) NOT NULL DEFAULT 1,
  tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  inactive BOOLEAN DEFAULT FALSE,
  last_ordered TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Unpaid', 'Completed')),
  date DATE NOT NULL,
  notes TEXT,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  payment_methods JSONB NOT NULL DEFAULT '{"cash": false, "etransfer": false, "other": false}'::jsonb,
  fees JSONB NOT NULL DEFAULT '{"amount": 0, "description": ""}'::jsonb,
  discount JSONB NOT NULL DEFAULT '{"amount": 0, "description": ""}'::jsonb,
  reconciled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LOGS TABLE
CREATE TABLE IF NOT EXISTS logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_display_id ON clients(user_id, display_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(user_id, name);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(user_id, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Clients policies
CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Users can view their own products" ON products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" ON products
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orders" ON orders
  FOR DELETE USING (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Users can view their own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Logs policies
CREATE POLICY "Users can view their own logs" ON logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs" ON logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update client stats when orders change
CREATE OR REPLACE FUNCTION update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update client stats based on their orders
  UPDATE clients
  SET
    orders = (
      SELECT COUNT(*)
      FROM orders
      WHERE orders.client_id = clients.id
      AND orders.status = 'Completed'
    ),
    total_spent = COALESCE((
      SELECT SUM(total)
      FROM orders
      WHERE orders.client_id = clients.id
      AND orders.status = 'Completed'
    ), 0)
  WHERE id = COALESCE(NEW.client_id, OLD.client_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger for updating client stats
CREATE TRIGGER update_client_stats_on_order_change
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_client_stats();

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE logs;
