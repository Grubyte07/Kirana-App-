import { useState, useEffect } from 'react';
import { HiOutlineDownload, HiOutlineX } from 'react-icons/hi';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('kirana_install_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('kirana_install_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 no-print">
      <div className="max-w-lg mx-auto bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-4 shadow-2xl animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <HiOutlineDownload className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">Install Kirana Profit App</p>
            <p className="text-white/70 text-xs mt-0.5">Add to home screen for quick access</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleInstall}
              className="px-4 py-2 bg-white text-primary-600 font-semibold text-sm rounded-xl hover:bg-white/90 transition-colors">
              Install
            </button>
            <button onClick={handleDismiss}
              className="p-2 text-white/60 hover:text-white transition-colors">
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
