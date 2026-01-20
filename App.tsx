import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateGroup } from './pages/CreateGroup';
import { GroupDetail } from './pages/GroupDetail';
import { Profile } from './pages/Profile';
import { ChatIA } from './pages/ChatIA';
import { Subscription } from './pages/Subscription';
import { PaymentSimulation } from './pages/PaymentSimulation';
import { PremiumPaymentCard } from './pages/PremiumPaymentCard';
import { Landing } from './pages/Landing';
import { Register } from './pages/Register';
import { AIInsights } from './pages/AIInsights';
import { db } from './services/db';
import { User } from './types';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SpotlightCursor } from './components/SpotlightCursor';
import { CommandPalette } from './components/CommandPalette';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  // Routing State
  const [page, setPage] = useState<string>('landing');
  const [params, setParams] = useState<any>({});
  const [user, setUser] = useState<User | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const currentUser = db.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setPage('dashboard');
    } else {
      setPage('landing');
    }
  }, []);

  const handleNavigate = (newPage: string, newParams?: any) => {
    setPage(newPage);
    if (newParams) setParams(newParams);
    window.scrollTo(0, 0);
  };

  const handleLogin = (u: User) => {
    setUser(u);
    handleNavigate('dashboard');
  };

  const handleLogout = () => {
    db.logout();
    setUser(null);
    handleNavigate('landing');
  };

  // Rendering logic
  const renderPage = () => {
    if (user) {
      switch (page) {
        case 'dashboard': return <Dashboard user={user} navigate={handleNavigate} />;
        case 'profile': return <Profile user={user} navigate={handleNavigate} />;
        case 'create-group': return <CreateGroup user={user} navigate={handleNavigate} />;
        case 'group-detail': return <GroupDetail user={user} groupId={params.groupId} navigate={handleNavigate} />;
        case 'chat-ia': return <ChatIA user={user} navigate={handleNavigate} />;
        case 'ai-insights': return <AIInsights user={user} navigate={handleNavigate} />;
        case 'subscription': return <Subscription user={user} navigate={handleNavigate} />;
        case 'payment-simulation': return <PaymentSimulation user={user} navigate={handleNavigate} method={params.method} groupId={params.groupId} />;
        case 'premium-payment': return <PremiumPaymentCard user={user} navigate={handleNavigate} />;
        default: return <Dashboard user={user} navigate={handleNavigate} />;
      }
    } else {
      switch (page) {
        case 'landing': return <Landing navigate={handleNavigate} />;
        case 'login': return <Login onLogin={handleLogin} navigate={handleNavigate} />;
        case 'register': return <Register onLogin={handleLogin} navigate={handleNavigate} />; // Nouvelle route
        default: return <Landing navigate={handleNavigate} />;
      }
    }
  };

  const showNavbar = page !== 'landing';

  return (
    <div className="min-h-screen flex flex-col mesh-gradient dark:text-gray-100 transition-colors duration-300">
      <SpotlightCursor />
      {isCommandPaletteOpen && (
        <CommandPalette
          navigate={handleNavigate}
          onClose={() => setIsCommandPaletteOpen(false)}
        />
      )}
      <Navbar user={user} onLogout={handleLogout} currentPage={page} navigate={handleNavigate} />

      <main className="flex-grow pb-20 md:pb-0">
        {renderPage()}
      </main>

      {page !== 'landing' && (
        <footer className="bg-navy-900 text-slate-400 py-6 text-center text-sm border-t border-slate-800 hidden md:block">
          <p>© 2025 Daretna.ma - La Tontine Digitale de Confiance.</p>
        </footer>
      )}

      {user && (
        <BottomNav activePage={page} navigate={handleNavigate} />
      )}
    </div>
  );
}

export default App;