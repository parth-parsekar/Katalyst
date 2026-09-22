import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import { getUser, clearAuth, isAuthenticated } from './utils/auth';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Restore session from localStorage on mount
    if (isAuthenticated()) {
      setUser(getUser());
    }
  }, []);

  const handleLogin = (userProfile) => {
    setUser(userProfile);
  };

  const handleSignOut = () => {
    clearAuth();
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-4 px-4 sm:py-6 sm:px-8 border-b border-surface/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-textMuted tracking-tight">Katalyst Tracker</h1>
          </div>

          {/* User chip + sign-out */}
          <div className="flex items-center gap-3">
            {user.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-white/20 object-cover"
              />
            )}
            <span className="text-sm text-textMuted hidden sm:block">{user.name || user.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-textMuted hover:text-danger border border-white/10 hover:border-danger/40 rounded-lg px-3 py-1.5 transition-all"
              title="Sign out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8 relative overflow-hidden sm:overflow-visible">
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
