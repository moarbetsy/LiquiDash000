import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, displayName: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          }
        }
      });
      if (error) throw error;
      return data.user;
    } catch (error: unknown) {
      console.error('Error signing up:', error);
      throw new Error(this.getErrorMessage(error as Error));
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data.user;
    } catch (error: unknown) {
      console.error('Error signing in:', error);
      throw new Error(this.getErrorMessage(error as Error));
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: unknown) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out');
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user;
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: User | null) => void): () => void {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }

  // Helper method to get user-friendly error messages
  private static getErrorMessage(error: Error): string {
    // You can customize these error messages based on Supabase's error codes
    return error.message || 'An error occurred. Please try again.';
  }
}
