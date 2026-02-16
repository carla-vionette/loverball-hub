import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

// Only eagerly load the landing page and auth (critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load everything else for code splitting
const Home = lazy(() => import("./pages/Home"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Ticker = lazy(() => import("./pages/Ticker"));
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

// Video streaming pages
const VideoLayout = lazy(() => import("./components/video/VideoLayout"));
const VideoForYou = lazy(() => import("./pages/video/VideoForYou"));
const VideoDiscover = lazy(() => import("./pages/video/VideoDiscover"));
const VideoSearch = lazy(() => import("./pages/video/VideoSearch"));
const VideoFeed = lazy(() => import("./pages/video/VideoFeed"));
const VideoChannel = lazy(() => import("./pages/video/VideoChannel"));
const VideoUpload = lazy(() => import("./pages/video/VideoUpload"));
const CreateChannel = lazy(() => import("./pages/video/CreateChannel"));
const ChannelDashboard = lazy(() => import("./pages/video/ChannelDashboard"));
const VideoWatch = lazy(() => import("./pages/video/VideoWatch"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/ticker" element={<ProtectedRoute><Ticker /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/following" element={<Navigate to="/profile" replace />} />
              <Route path="/horoscope" element={<ProtectedRoute><Horoscope /></ProtectedRoute>} />
              <Route path="/network" element={<Navigate to="/members" replace />} />
              <Route path="/gather" element={<Navigate to="/events" replace />} />
              <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
              <Route path="/community/:groupId" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
              <Route path="/profile/interests" element={<ProtectedRoute><ProfileInterests /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
              <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
              <Route path="/product/:handle" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
              <Route path="/invite" element={<ProtectedRoute><Invite /></ProtectedRoute>} />
              <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
              <Route path="/members/:id" element={<ProtectedRoute><MemberProfile /></ProtectedRoute>} />
              <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
              <Route path="/dms" element={<ProtectedRoute><DirectMessages /></ProtectedRoute>} />
              <Route path="/messages/:chatId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
              <Route path="/admin/events/:id/edit" element={<ProtectedRoute requireAdmin><AdminEventEditor /></ProtectedRoute>} />
              <Route path="/admin/events/:id/attendees" element={<ProtectedRoute requireAdmin><AdminAttendeeManager /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* Video Streaming Section */}
              <Route path="/watch" element={<VideoLayout />}>
                <Route index element={<VideoForYou />} />
                <Route path="discover" element={<VideoDiscover />} />
                <Route path="search" element={<VideoSearch />} />
                <Route path="feed" element={<VideoFeed />} />
                <Route path="channel/:id" element={<VideoChannel />} />
                <Route path="video/:id" element={<VideoWatch />} />
                <Route path="upload" element={<VideoUpload />} />
                <Route path="channel/create" element={<CreateChannel />} />
                <Route path="dashboard" element={<ChannelDashboard />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
