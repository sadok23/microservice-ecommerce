import { Outlet } from 'react-router';
import Navbar from './Navbar';
import Footer from './Footer';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="page-container flex-1 py-8 pb-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}