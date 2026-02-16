import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Ticker from "./pages/Ticker";

import Horoscope from "./pages/Horoscope";

import Community from "./pages/Community";
import GroupChat from "./pages/GroupChat";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import ProfileInterests from "./pages/ProfileInterests";
import Search from "./pages/Search";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";
import Invite from "./pages/Invite";
import Members from "./pages/Members";
import MemberProfile from "./pages/MemberProfile";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import MessagesPage from "./pages/MessagesPage";
import Admin from "./pages/Admin";
import AdminEventEditor from "./pages/AdminEventEditor";
import AdminAttendeeManager from "./pages/AdminAttendeeManager";
import Connections from "./pages/Connections";
import DirectMessages from "./pages/DirectMessages";
import ChatRoom from "./pages/ChatRoom";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ProtectedRoute from "./components/ProtectedRoute";

// Video streaming pages
import VideoLayout from "./components/video/VideoLayout";
import VideoForYou from "./pages/video/VideoForYou";
import VideoDiscover from "./pages/video/VideoDiscover";

import VideoSearch from "./pages/video/VideoSearch";

import VideoFeed from "./pages/video/VideoFeed";
import VideoChannel from "./pages/video/VideoChannel";
import VideoUpload from "./pages/video/VideoUpload";
import CreateChannel from "./pages/video/CreateChannel";
import ChannelDashboard from "./pages/video/ChannelDashboard";
import VideoWatch from "./pages/video/VideoWatch";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
