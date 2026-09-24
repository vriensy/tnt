import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
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

  return { updateAvailable, applyUpdate, canInstall, promptInstall };
}
