import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { messaging } from '../firebase';

export class NotificationService {
  private messaging: Messaging;

  constructor() {
    this.messaging = messaging;
  }

  // Request permission for notifications
  async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Get FCM token
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await getToken(this.messaging, {
        vapidKey: 'BLuhTx0c_7WDa-ars3xt73TzcCyyrKKpYLaFerbYEnNy7i4t1ka63Upb6t22LTb0nGbXr3SoWx9333skhB55IRg' // From your FCM config
      });
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Listen for foreground messages
  onMessageReceived(callback: (payload: any) => void) {
    return onMessage(this.messaging, (payload) => {
      console.log('Message received:', payload);
      callback(payload);
    });
  }

  // Show notification
  showNotification(title: string, options?: NotificationOptions) {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/icon-192x192.png', // You'll need to add this icon
          badge: '/icon-192x192.png',
          ...options
        });
      });
    } else {
      // Fallback for browsers without service worker
      new Notification(title, options);
    }
  }

  // Initialize service worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  }
}

// Singleton instance
export const notificationService = new NotificationService();
