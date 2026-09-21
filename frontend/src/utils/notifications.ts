/**
 * Browser Notification API utilities
 * Safely handles notification permissions and display
 */

let permissionRequested = false;
let cachedPermission: NotificationPermission | null = null;

/**
 * Synchronously check and update cached permission status.
 * Call this to update the cached permission without blocking.
 */
function updateCachedPermission(): NotificationPermission | null {
  if (!('Notification' in window)) {
    return null;
  }
  cachedPermission = Notification.permission;
  return cachedPermission;
}

/**
 * Request notification permission if not already requested.
 * Returns true if permission is granted or already granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  updateCachedPermission();

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  if (!permissionRequested) {
    permissionRequested = true;
    try {
      const permission = await Notification.requestPermission();
      cachedPermission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  return false;
}

/**
 * Show a browser notification if supported and permitted.
 * Silently fails if notifications are unsupported or permission is denied.
 * Non-blocking: permission request happens in background if needed.
 */
export function showNotification(title: string, options?: NotificationOptions): void {
  if (!('Notification' in window)) {
    return;
  }

  updateCachedPermission();

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, options);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
    return;
  }

  if (Notification.permission === 'denied') {
    return;
  }

  if (!permissionRequested) {
    permissionRequested = true;
    requestNotificationPermission()
      .then((granted) => {
        if (granted) {
          try {
            new Notification(title, options);
          } catch (error) {
            console.error('Failed to show notification after permission granted:', error);
          }
        }
      })
      .catch((error) => {
        console.error('Error requesting notification permission:', error);
      });
  }
}
