import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { LanguageProvider } from "@/components/ui/language-switcher";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Reserve from "./pages/Reserve";
import Order from "./pages/Order";
import NotFound from "./pages/NotFound";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Customers from "./pages/admin/Customers";
import Orders from "./pages/admin/Orders";
import Reservations from "./pages/admin/Reservations";
import MenuManager from "./pages/admin/MenuManager";
import Checkout from "./pages/Checkout";

const queryClient = new QueryClient();

// ✅ Session restoration + redirect wrapper
const AppRoutes = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const restoreSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const target = localStorage.getItem("post_oauth_redirect") || "/";
        navigate(target, { replace: true });
      }
    };

    // Listen to Supabase auth events
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          const target = localStorage.getItem("post_oauth_redirect") || "/";
          navigate(target, { replace: true });
        }
      }
    );

    restoreSession();
    return () => subscription.subscription.unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reserve" element={<Reserve />} />
      <Route path="/order" element={<Order />} />
      <Route path="/checkout" element={<Checkout />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <Customers />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <Orders />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/reservations"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <Reservations />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/menu"
        element={
          <ProtectedAdminRoute>
            <AdminLayout>
              <MenuManager />
            </AdminLayout>
          </ProtectedAdminRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
