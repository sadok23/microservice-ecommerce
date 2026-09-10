import { Route, Routes } from 'react-router';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import AppLayout from '@/components/layout/AppLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import HomePage from '@/pages/HomePage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderConfirmationPage from '@/pages/OrderConfirmationPage';
import OrderHistoryPage from '@/pages/OrderHistoryPage';
import AdminPage from '@/pages/AdminPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminProductsPage from '@/pages/admin/AdminProductsPage';
import AdminStockPage from '@/pages/admin/AdminStockPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import NotFoundPage from '@/pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* ErrorBoundary per page keeps nav/footer alive if a page throws */}
          <Route index element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
          <Route path="products/:id" element={<ErrorBoundary><ProductDetailPage /></ErrorBoundary>} />
          <Route path="cart" element={<ErrorBoundary><CartPage /></ErrorBoundary>} />
          <Route path="checkout" element={<ErrorBoundary><CheckoutPage /></ErrorBoundary>} />
          <Route path="orders" element={<ErrorBoundary><OrderHistoryPage /></ErrorBoundary>} />
          <Route path="orders/:id" element={<ErrorBoundary><OrderConfirmationPage /></ErrorBoundary>} />
          <Route path="admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<ErrorBoundary><AdminPage /></ErrorBoundary>} />
              <Route path="products" element={<ErrorBoundary><AdminProductsPage /></ErrorBoundary>} />
              <Route path="stock" element={<ErrorBoundary><AdminStockPage /></ErrorBoundary>} />
              <Route path="orders" element={<ErrorBoundary><AdminOrdersPage /></ErrorBoundary>} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}