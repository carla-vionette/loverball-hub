import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

import { ErrorBoundary } from "@/components/ui/error-boundary";
import NetworkStatus from "@/components/NetworkStatus";
import InstallPrompt from "@/components/InstallPrompt";
import { usePageTracking } from "@/hooks/usePageTracking";
import ProtectedRoute from "./components/ProtectedRoute";

// ── Eager-load primary routes ──
import Index from "./pages/Index";
import Friends from "./pages/Friends";

// ── Lazy-loaded secondary pages ──
const Auth = lazy(() => import("./pages/Auth"));
const Signup = lazy(() => import("./pages/Signup"));
const FinishProfile = lazy(() => import("./pages/FinishProfile"));
const Feed = lazy(() => import("./pages/Feed"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const EventPublic = lazy(() => import("./pages/EventPublic"));

const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Club = lazy(() => import("./pages/Club"));
const ClubDrafts = lazy(() => import("./pages/ClubDrafts"));
const StartingXi = lazy(() => import("./pages/StartingXi"));
const StartingXiProfile = lazy(() => import("./pages/StartingXiProfile"));
const StartingXiIncoming = lazy(() => import("./pages/StartingXiIncoming"));

const Onboarding = lazy(() => import("./pages/Onboarding"));
const Horoscope = lazy(() => import("./pages/Horoscope"));
const Settings = lazy(() => import("./pages/Settings"));
const Inbox = lazy(() => import("./pages/Inbox"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ChatRoom = lazy(() => import("./pages/ChatRoom"));
const DirectMessages = lazy(() => import("./pages/DirectMessages"));
const Connections = lazy(() => import("./pages/Connections"));
const Membership = lazy(() => import("./pages/Membership"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const InvitesPage = lazy(() => import("./pages/InvitesPage"));
const InviteLanding = lazy(() => import("./pages/InviteLanding"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Connect = lazy(() => import("./pages/Connect"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEventEditor = lazy(() => import("./pages/AdminEventEditor"));
const AdminAttendeeManager = lazy(() => import("./pages/AdminAttendeeManager"));
const EventBuilder = lazy(() => import("./pages/admin/EventBuilder"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen bg-background animate-pulse">
    <div className="h-16 bg-muted/30" />
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="space-y-3">
            <div className="aspect-video bg-muted rounded-xl" />
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-3 w-1/2 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PageTracker = () => {
  usePageTracking();
  return null;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <NetworkStatus />
            <InstallPrompt />
            <PageTracker />
            <Suspense fallback={<PageFallback />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/invite/:code" element={<InviteLanding />} />
                <Route path="/connect" element={<Connect />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />

                {/* Core tabs: FEED, SCENE, CLUB, PROFILE */}
                <Route path="/feed" element={<Feed />} />
                <Route path="/events" element={<Events />} />
                <Route path="/event/:id" element={<EventDetail />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/e/:id" element={<EventPublic />} />
                <Route path="/members" element={<Navigate to="/club" replace />} />
                <Route path="/members/:id" element={<ProtectedRoute><MemberProfile /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/club" element={<Club />} />
                <Route path="/club/drafts" element={<ProtectedRoute><ClubDrafts /></ProtectedRoute>} />
                <Route path="/club/xi" element={<ProtectedRoute><StartingXi /></ProtectedRoute>} />
                <Route path="/club/xi/incoming" element={<ProtectedRoute><StartingXiIncoming /></ProtectedRoute>} />
                <Route path="/club/xi/:id" element={<ProtectedRoute><StartingXiProfile /></ProtectedRoute>} />
                <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
                <Route path="/profile/interests" element={<Navigate to="/profile/edit" replace />} />

                {/* Profile-linked utilities */}
                <Route path="/finish-profile" element={<ProtectedRoute><FinishProfile /></ProtectedRoute>} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/horoscope" element={<ProtectedRoute><Horoscope /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                <Route path="/messages/:chatId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
                <Route path="/dms" element={<ProtectedRoute><DirectMessages /></ProtectedRoute>} />
                <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
                <Route path="/membership" element={<Membership />} />
                <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
                <Route path="/invites" element={<ProtectedRoute><InvitesPage /></ProtectedRoute>} />
                <Route path="/checkout-success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/events/:id/edit" element={<ProtectedRoute requireAdmin><AdminEventEditor /></ProtectedRoute>} />
                <Route path="/admin/events/:id/attendees" element={<ProtectedRoute requireAdmin><AdminAttendeeManager /></ProtectedRoute>} />
                <Route path="/admin/events/:id/builder" element={<ProtectedRoute requireAdmin><EventBuilder /></ProtectedRoute>} />

                {/* Legacy redirects → 4 core tabs */}
                <Route path="/index" element={<Navigate to="/" replace />} />
                <Route path="/home" element={<Navigate to="/feed" replace />} />
                <Route path="/explore" element={<Navigate to="/feed" replace />} />
                <Route path="/discover" element={<Navigate to="/feed" replace />} />
                <Route path="/watch" element={<Navigate to="/feed" replace />} />
                <Route path="/watch/video/:id" element={<Navigate to="/feed" replace />} />
                <Route path="/videos" element={<Navigate to="/feed" replace />} />
                <Route path="/videos/:id" element={<Navigate to="/feed" replace />} />
                <Route path="/channel/:handle" element={<Navigate to="/feed" replace />} />
                <Route path="/search" element={<Navigate to="/feed" replace />} />
                <Route path="/trending" element={<Navigate to="/feed" replace />} />
                <Route path="/community" element={<Navigate to="/members" replace />} />
                <Route path="/community/:groupId" element={<Navigate to="/members" replace />} />
                <Route path="/network" element={<Navigate to="/members" replace />} />
                
                <Route path="/gather" element={<Navigate to="/events" replace />} />
                <Route path="/following" element={<Navigate to="/profile" replace />} />
                <Route path="/shop" element={<Navigate to="/profile" replace />} />
                <Route path="/product/:handle" element={<Navigate to="/profile" replace />} />
                <Route path="/scores" element={<Navigate to="/events" replace />} />
                <Route path="/team/:slug" element={<Navigate to="/events" replace />} />
                <Route path="/teams/:slug" element={<Navigate to="/events" replace />} />
                <Route path="/dashboard" element={<Navigate to="/profile" replace />} />
                <Route path="/plans" element={<Navigate to="/membership" replace />} />
                <Route path="/apply" element={<Navigate to="/profile" replace />} />
                <Route path="/application-pending" element={<Navigate to="/profile" replace />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
