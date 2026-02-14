import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface ShareData {
  title: string;
  text?: string;
  url?: string;
}

/**
 * Native Share API with clipboard fallback. Shows toast confirmation.
 */
export function useShare() {
  const share = useCallback(async (data: ShareData) => {
    const shareUrl = data.url || window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: data.title, text: data.text, url: shareUrl });
        return true;
      } catch (err) {
        if ((err as Error).name === "AbortError") return false;
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!", description: "Share link copied to clipboard" });
      return true;
    } catch {
      toast({ title: "Share failed", description: "Could not share or copy link", variant: "destructive" });
      return false;
    }
  }, []);

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return { share, canShare };
}
