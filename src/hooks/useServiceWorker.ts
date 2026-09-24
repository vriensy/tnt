import { useCallback, useEffect, useRef, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type UpdateCheckResult = 'update-found' | 'up-to-date' | 'unsupported';

export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        registrationRef.current = reg;
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      }).catch(() => {
        // SW registration failed — app still works offline from cache attempt
      });
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const applyUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage('SKIP_WAITING');
        }
      });
    }
    setUpdateAvailable(false);
    window.location.reload();
  };

  const promptInstall = async () => {
    if (installPromptEvent) {
      await installPromptEvent.prompt();
      await installPromptEvent.userChoice;
      setInstallPromptEvent(null);
      setCanInstall(false);
    }
  };

  // A home-screen PWA is opened directly, not navigated to through browser
  // chrome, so the browser's automatic "check sw.js for changes" pass often
  // never runs. This forces that check on demand — reg.update() bypasses the
  // normal HTTP cache and re-fetches sw.js, so a bumped CACHE_NAME is picked
  // up immediately instead of waiting for the browser's own schedule.
  const checkForUpdate = useCallback(async (): Promise<UpdateCheckResult> => {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    const reg = registrationRef.current ?? (await navigator.serviceWorker.getRegistration()) ?? null;
    if (!reg) return 'unsupported';
    registrationRef.current = reg;
    await reg.update();
    // Give the browser a moment to move a newly-found worker into
    // installing/waiting before we check — this isn't instantaneous.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (reg.waiting || reg.installing) {
      return 'update-found';
    }
    return 'up-to-date';
  }, []);

  return { updateAvailable, applyUpdate, canInstall, promptInstall, checkForUpdate };
}
