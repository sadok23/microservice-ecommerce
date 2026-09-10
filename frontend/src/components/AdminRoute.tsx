import { Navigate, Outlet } from 'react-router';
import { isAdmin } from '../utils/auth';

export default function AdminRoute() {
  return isAdmin() ? <Outlet /> : <Navigate to="/" replace />;
}