import { useState, useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import SplashScreen from "@/components/SplashScreen";
import AppLayout from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import PendingApproval from "@/pages/PendingApproval";
import NotFound from "@/pages/NotFound";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Apartments = lazy(() => import("@/pages/Apartments"));
const ElectricityBills = lazy(() => import("@/pages/ElectricityBills"));
const WaterBills = lazy(() => import("@/pages/WaterBills"));
const Revenue = lazy(() => import("@/pages/Revenue"));
const UserManagement = lazy(() => import("@/pages/UserManagement"));

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const { user, profile, loading, isApproved } = useAuth();

  return (
    <>
      {loading && <LoadingScreen />}

      {!loading && !user && <Auth />}

      {!loading && user && !isApproved && profile && <PendingApproval />}

      {!loading && user && isApproved && (
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/apartments" element={<Apartments />} />
              <Route path="/electricity" element={<ElectricityBills />} />
              <Route path="/water" element={<WaterBills />} />
              <Route path="/revenue" element={<Revenue />} />
              <Route path="/users" element={<UserManagement />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      )}
    </>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1000); // fast splash

    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          {showSplash ? (
            <SplashScreen onComplete={() => setShowSplash(false)} />
          ) : (
            <BrowserRouter>
              <AuthProvider>
                <AuthenticatedApp />
              </AuthProvider>
            </BrowserRouter>
          )}
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;