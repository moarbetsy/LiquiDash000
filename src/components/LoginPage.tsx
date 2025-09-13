import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { AuthService } from '../lib/authService';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        await AuthService.signUp(email, password, displayName || email.split('@')[0]);
        // Firebase will handle the auth state change
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // Firebase will handle the auth state change
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      // Show more specific error message
      const errorMessage = error.message || `${isSignUp ? 'Sign up' : 'Login'} failed. Please try again.`;
      setError(errorMessage);
      if (!isSignUp) setPassword(''); // Clear password on failed login attempt
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-black/50">
      {/* FIX: Correctly type framer-motion component props */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <form onSubmit={handleSubmit} className="glass p-8 space-y-6 bg-black/80 border-white/20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {isSignUp ? 'Sign up to get started with your dashboard.' : 'Enter your credentials to access the dashboard.'}
            </p>
          </div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg p-3 text-center"
            >
              {error}
            </motion.div>
          )}
          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="displayName" className="text-sm font-medium text-white block mb-2">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-sm font-medium text-white block mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="noregrets.john69@gmail.com"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-white block mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full gloss-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setPassword('');
                setDisplayName('');
              }}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
