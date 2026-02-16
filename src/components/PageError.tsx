import { AlertTriangle, RefreshCw, WifiOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageErrorProps {
  title?: string;
  message?: string;
  variant?: "generic" | "network" | "rate-limit" | "not-found";
  onRetry?: () => void;
  retryLabel?: string;
  /** For rate-limit: seconds remaining */
  retryAfter?: number;
}

/**
 * Full-page or inline error state with icon, message, and retry CTA.
 * Supports network, rate-limit, and generic error variants.
 */
const PageError = ({
  title,
  message,
  variant = "generic",
  onRetry,
  retryLabel,
  retryAfter,
}: PageErrorProps) => {
  const configs = {
    generic: {
      icon: AlertTriangle,
      defaultTitle: "Something went wrong",
      defaultMessage: "An unexpected error occurred. Please try again.",
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
    },
    network: {
      icon: WifiOff,
      defaultTitle: "Connection error",
      defaultMessage: "Unable to reach the server. Check your internet connection and try again.",
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
    },
    "rate-limit": {
      icon: Clock,
      defaultTitle: "Too many requests",
      defaultMessage: retryAfter
        ? `Please wait ${retryAfter} seconds before trying again.`
        : "You've made too many requests. Please try again in a moment.",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    "not-found": {
      icon: AlertTriangle,
      defaultTitle: "Not found",
      defaultMessage: "The content you're looking for doesn't exist or has been removed.",
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
    },
  };

  const config = configs[variant];
  const Icon = config.icon;

  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-6 text-center gap-5"
      role="alert"
      aria-live="assertive"
    >
      <div className={`w-16 h-16 rounded-full ${config.iconBg} flex items-center justify-center`}>
        <Icon className={`w-8 h-8 ${config.iconColor}`} aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground font-sans">
          {title || config.defaultTitle}
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {message || config.defaultMessage}
        </p>
      </div>
      {onRetry && variant !== "rate-limit" && (
        <Button onClick={onRetry} variant="outline" className="rounded-full gap-2">
          <RefreshCw className="w-4 h-4" />
          {retryLabel || "Try again"}
        </Button>
      )}
      {variant === "rate-limit" && onRetry && (
        <Button onClick={onRetry} variant="outline" className="rounded-full gap-2" disabled={!!retryAfter}>
          <Clock className="w-4 h-4" />
          {retryAfter ? `Wait ${retryAfter}s` : "Try again"}
        </Button>
      )}
    </div>
  );
};

export default PageError;
