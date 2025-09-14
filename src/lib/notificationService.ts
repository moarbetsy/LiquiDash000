export class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    // Initialize service worker registration
    this.registerServiceWorker();
  }

  // Request permission for notifications - should be called from user gesture
  async requestPermission(): Promise<boolean> {
    try {
      if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Check if notifications are supported and permitted
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  // Get FCM token - not available in Supabase (push notifications require third-party service)
  async getFCMToken(): Promise<string | null> {
    console.log('FCM tokens not available with Supabase. Push notifications require a third-party service like Firebase Cloud Messaging.');
    return null;
  }

  // Listen for foreground messages - use Supabase real-time instead
  onMessageReceived(_callback: (payload: { notification?: { title?: string; body?: string }; data?: unknown }) => void) {
    console.log('For real-time messaging, use Supabase Realtime channels in SupabaseService. This notification service handles browser notifications only.');
    return () => {}; // Return empty unsubscribe function
  }

  // Show notification using service worker or fallback
  showNotification(title: string, options?: NotificationOptions) {
    if (!this.isSupported()) {
      console.warn('Notifications not supported in this browser');
      return;
    }

    const notificationOptions: NotificationOptions = {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'liquid-glass-notification',
      ...options
    };

    if (this.registration) {
      // Use service worker for better reliability
      this.registration.showNotification(title, notificationOptions);
    } else if (this.getPermissionStatus() === 'granted') {
      // Fallback for browsers without service worker
      new Notification(title, notificationOptions);
    } else {
      console.warn('Notification permission not granted');
    }
  }

  // Register service worker for Supabase
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported in this browser');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, could show update prompt here
              console.log('New service worker available');
            }
          });
        }
      });

      this.registration = registration;
      console.log('Service Worker registered successfully:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  // Unregister service worker (for cleanup/testing)
  async unregisterServiceWorker(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();
      if (result) {
        this.registration = null;
        console.log('Service Worker unregistered');
      }
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();
