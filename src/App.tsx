import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import NetworkStatus from "@/components/NetworkStatus";
import InstallPrompt from "@/components/InstallPrompt";
import { usePageTracking } from "@/hooks/usePageTracking";
import ProtectedRoute from "./components/ProtectedRoute";

// ── Every page is lazy-loaded for minimal initial bundle ──
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Home = lazy(() => import("./pages/Home"));
const Explore = lazy(() => import("./pages/Explore"));
const Events = lazy(() => import("./pages/Events"));
const Shop = lazy(() => import("./pages/Shop"));
const Profile = lazy(() => import("./pages/Profile"));
const Feed = lazy(() => import("./pages/Feed"));
const Watch = lazy(() => import("./pages/Watch"));
const Search = lazy(() => import("./pages/Search"));
const VideoDetail = lazy(() => import("./pages/VideoDetail"));
const ChannelProfile = lazy(() => import("./pages/ChannelProfile"));
const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Horoscope = lazy(() => import("./pages/Horoscope"));
const Community = lazy(() => import("./pages/Community"));
const GroupChat = lazy(() => import("./pages/GroupChat"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const ProfileInterests = lazy(() => import("./pages/ProfileInterests"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Members = lazy(() => import("./pages/Members"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const Connections = lazy(() => import("./pages/Connections"));
const DirectMessages = lazy(() => import("./pages/DirectMessages"));
const ChatRoom = lazy(() => import("./pages/ChatRoom"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Friends = lazy(() => import("./pages/Friends"));
const Settings = lazy(() => import("./pages/Settings"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const Ticker = lazy(() => import("./pages/Ticker"));
const PlanSelection = lazy(() => import("./pages/PlanSelection"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));

// SaaS pages
const PricingPage = lazy(() => import("./pages/PricingPage"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const InvitesPage = lazy(() => import("./pages/InvitesPage"));
const InviteLanding = lazy(() => import("./pages/InviteLanding"));
const VideoLibrary = lazy(() => import("./pages/VideoLibrary"));
const VideoPlayerPage = lazy(() => import("./pages/VideoPlayerPage"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEventEditor = lazy(() => import("./pages/AdminEventEditor"));
const AdminAttendeeManager = lazy(() => import("./pages/AdminAttendeeManager"));
const EventBuilder = lazy(() => import("./pages/admin/EventBuilder"));

// ── Stale-while-revalidate query config for slow connections ──
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 min — don't refetch if data is fresh
      gcTime: 30 * 60 * 1000,          // 30 min — keep in cache
      retry: 2,                         // Retry failed requests twice
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,      // Don't refetch when tab regains focus
      refetchOnReconnect: 'always',     // But do refetch when connection restores
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const PageTracker = () => {
  usePageTracking();
  return null;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NetworkStatus />
          <InstallPrompt />
          <BrowserRouter>
            <PageTracker />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/home" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/discover" element={<Navigate to="/explore" replace />} />
                <Route path="/channel/:handle" element={<ChannelProfile />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/watch" element={<Watch />} />
                <Route path="/watch/video/:id" element={<VideoDetail />} />
                <Route path="/horoscope" element={<Horoscope />} />
                <Route path="/events" element={<Events />} />
                <Route path="/event/:id" element={<EventDetail />} />
                <Route path="/community" element={<Community />} />
                <Route path="/search" element={<Search />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:handle" element={<ProductDetail />} />
                <Route path="/members" element={<Members />} />
                <Route path="/members/:id" element={<MemberProfile />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/checkout-success" element={<CheckoutSuccess />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/invite/:code" element={<InviteLanding />} />

                {/* Redirects */}
                <Route path="/index" element={<Navigate to="/" replace />} />
                <Route path="/following" element={<Navigate to="/profile" replace />} />
                <Route path="/network" element={<Navigate to="/members" replace />} />
                <Route path="/gather" element={<Navigate to="/events" replace />} />

                {/* Protected member routes */}
                <Route path="/dashboard" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
                <Route path="/plans" element={<ProtectedRoute><PlanSelection /></ProtectedRoute>} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                <Route path="/profile/interests" element={<ProtectedRoute><ProfileInterests /></ProtectedRoute>} />
                <Route path="/community/:groupId" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
                <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
                <Route path="/dms" element={<ProtectedRoute><DirectMessages /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                <Route path="/messages/:chatId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
                <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
                <Route path="/invites" element={<ProtectedRoute><InvitesPage /></ProtectedRoute>} />
                <Route path="/videos" element={<ProtectedRoute><VideoLibrary /></ProtectedRoute>} />
                <Route path="/videos/:id" element={<ProtectedRoute><VideoPlayerPage /></ProtectedRoute>} />

                {/* Admin routes */}
                <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/events/:id/edit" element={<ProtectedRoute requireAdmin><AdminEventEditor /></ProtectedRoute>} />
                <Route path="/admin/events/:id/attendees" element={<ProtectedRoute requireAdmin><AdminAttendeeManager /></ProtectedRoute>} />
                <Route path="/admin/events/:id/builder" element={<ProtectedRoute requireAdmin><EventBuilder /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
