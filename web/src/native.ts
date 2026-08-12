import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';

/** Native shell hooks — no-ops extras in plain browser; registers PWA worker on web. */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    registerServiceWorker();
    return;
  }

  document.documentElement.classList.add('native-app');

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#1a3a32' });
    }
  } catch {
    /* plugin may be unavailable in some previews */
  }

  try {
    await SplashScreen.hide();
  } catch {
    /* ignore */
  }

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back();
  });
}

function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return;
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL || '/';
    navigator.serviceWorker.register(`${base}sw.js`).catch(() => undefined);
  });
}
