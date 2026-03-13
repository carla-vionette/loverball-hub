import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed or recently dismissed
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // iOS doesn't support beforeinstallprompt — show manual instructions
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-300 md:left-auto md:right-4 md:max-w-sm">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-xl">
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-4">
          <img src="/favicon.png" alt="Loverball" className="h-10 w-10 rounded-xl" />
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">Install Loverball</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS
                ? "Tap the share button then \"Add to Home Screen\""
                : "Add to your home screen for the best experience"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {isIOS ? (
            <Button size="sm" variant="secondary" className="w-full gap-1.5" onClick={dismiss}>
              <Share className="h-3.5 w-3.5" /> Got it
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" className="flex-1" onClick={dismiss}>
                Not now
              </Button>
              <Button size="sm" className="flex-1 gap-1.5" onClick={handleInstall}>
                <Download className="h-3.5 w-3.5" /> Install
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
