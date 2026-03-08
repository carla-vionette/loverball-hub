import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import NetworkStatus from "@/components/NetworkStatus";
import { usePageTracking } from "@/hooks/usePageTracking";

// Only eagerly load the landing page and auth (critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load everything else for code splitting
const Home = lazy(() => import("./pages/Home"));
const Discover = lazy(() => import("./pages/Discover"));
const Explore = lazy(() => import("./pages/Explore"));
const ChannelProfile = lazy(() => import("./pages/ChannelProfile"));
const Feed = lazy(() => import("./pages/Feed"));
const Watch = lazy(() => import("./pages/Watch"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Horoscope = lazy(() => import("./pages/Horoscope"));
const Community = lazy(() => import("./pages/Community"));
const GroupChat = lazy(() => import("./pages/GroupChat"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const ProfileInterests = lazy(() => import("./pages/ProfileInterests"));
const Search = lazy(() => import("./pages/Search"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Invite = lazy(() => import("./pages/Invite"));
const Members = lazy(() => import("./pages/Members"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminEventEditor = lazy(() => import("./pages/AdminEventEditor"));
const AdminAttendeeManager = lazy(() => import("./pages/AdminAttendeeManager"));
const Connections = lazy(() => import("./pages/Connections"));
const DirectMessages = lazy(() => import("./pages/DirectMessages"));
const ChatRoom = lazy(() => import("./pages/ChatRoom"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Settings = lazy(() => import("./pages/Settings"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));

// Video streaming pages (kept as lazy imports for sub-routes if needed later)
const Ticker = lazy(() => import("./pages/Ticker"));
const PlanSelection = lazy(() => import("./pages/PlanSelection"));

const queryClient = new QueryClient();

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
          <BrowserRouter>
            <PageTracker />
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<><DesktopNav /><Home /></>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/channel/:handle" element={<ChannelProfile />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/watch" element={<Watch />} />
              <Route path="/plans" element={<ProtectedRoute><PlanSelection /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/following" element={<Navigate to="/profile" replace />} />
              <Route path="/horoscope" element={<Horoscope />} />
              <Route path="/network" element={<Navigate to="/members" replace />} />
              <Route path="/gather" element={<Navigate to="/events" replace />} />
              <Route path="/events" element={<Events />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/community" element={<Community />} />
              <Route path="/community/:groupId" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
              <Route path="/profile/interests" element={<ProtectedRoute><ProfileInterests /></ProtectedRoute>} />
              <Route path="/search" element={<Search />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:handle" element={<ProductDetail />} />
              <Route path="/invite" element={<ProtectedRoute><Invite /></ProtectedRoute>} />
              <Route path="/members" element={<Members />} />
              <Route path="/members/:id" element={<MemberProfile />} />
              <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
              <Route path="/dms" element={<ProtectedRoute><DirectMessages /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/messages/:chatId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
              <Route path="/admin/events/:id/edit" element={<ProtectedRoute requireAdmin><AdminEventEditor /></ProtectedRoute>} />
              <Route path="/admin/events/:id/attendees" element={<ProtectedRoute requireAdmin><AdminAttendeeManager /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/checkout-success" element={<CheckoutSuccess />} />


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
