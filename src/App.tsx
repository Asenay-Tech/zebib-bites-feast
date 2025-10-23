import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/components/ui/language-switcher";
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
import CallbackHandler from "./pages/CallbackHandler";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reserve" element={<Reserve />} />
            <Route path="/order" element={<Order />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/auth/v1/callback" element={<CallbackHandler />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />

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
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
