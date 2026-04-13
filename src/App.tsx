
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from '@/src/components/layout/Header';
import { Home } from '@/src/pages/Home';
import { Marketplace } from '@/src/pages/Marketplace';
import { VehicleDetail } from '@/src/pages/VehicleDetail';
import { Publish } from '@/src/pages/Publish';
import { Login } from '@/src/pages/Login';
import { Messages } from '@/src/pages/Messages';

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased">
      {!isLoginPage && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/vehicle/:id" element={<VehicleDetail />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/login" element={<Login />} />
          <Route path="/messages" element={<Messages />} />
          {/* Fallback to home */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      
      {!isLoginPage && (
        <footer className="border-t py-6 md:py-0 bg-background">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 md:px-8">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              &copy; {new Date().getFullYear()} REVEN. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
              <a href="#" className="hover:underline underline-offset-4">Términos</a>
              <a href="#" className="hover:underline underline-offset-4">Privacidad</a>
              <a href="#" className="hover:underline underline-offset-4">Soporte</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
