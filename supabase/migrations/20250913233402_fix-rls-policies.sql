-- Fix RLS policies for development
-- This migration updates the Row Level Security policies to allow development access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

DROP POLICY IF EXISTS "Users can view their own products" ON products;
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;

DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete their own orders" ON orders;

DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

DROP POLICY IF EXISTS "Users can view their own logs" ON logs;
DROP POLICY IF EXISTS "Users can insert their own logs" ON logs;

-- Create new policies that allow access for both authenticated and development users
-- For development, we'll allow access if user_id is provided, regardless of auth state

-- Clients policies
CREATE POLICY "Allow access to clients" ON clients
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow insert to clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow update to clients" ON clients
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow delete to clients" ON clients
  FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

-- Products policies
CREATE POLICY "Allow access to products" ON products
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow insert to products" ON products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow update to products" ON products
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow delete to products" ON products
  FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

-- Orders policies
CREATE POLICY "Allow access to orders" ON orders
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow insert to orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow update to orders" ON orders
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow delete to orders" ON orders
  FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

-- Expenses policies
CREATE POLICY "Allow access to expenses" ON expenses
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow insert to expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow update to expenses" ON expenses
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow delete to expenses" ON expenses
  FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

-- Logs policies
CREATE POLICY "Allow access to logs" ON logs
  FOR SELECT USING (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow insert to logs" ON logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id OR auth.uid() IS NULL);
