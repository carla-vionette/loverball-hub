import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Ticker from "./pages/Ticker";
import Following from "./pages/Following";

import Community from "./pages/Community";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import NotFound from "./pages/NotFound";
import Invite from "./pages/Invite";
import Members from "./pages/Members";
import MemberProfile from "./pages/MemberProfile";
import Events from "./pages/Events";
import MessagesPage from "./pages/MessagesPage";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/following" replace />} />
            <Route path="/ticker" element={<Ticker />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/following" element={<Following />} />
            <Route path="/gather" element={<Navigate to="/events" replace />} />
            <Route path="/events" element={<Events />} />
            
            <Route path="/community" element={<Community />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:handle" element={<ProductDetail />} />
            {/* New networking features */}
            <Route path="/invite" element={<Invite />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/:id" element={<MemberProfile />} />
            <Route path="/events" element={<Events />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
