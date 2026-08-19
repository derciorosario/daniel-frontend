import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';


import ProtectedRoute from './ProtectedRoute';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { isNative, APP_VERSION, getVersion } from './api/client';
import { useState, useEffect } from 'react';
import Home from './pages/Home';

const AppInner = () => {
  const { user, loading } = useAuth();
 

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }


  return (
    <>
      <Routes>
        <Route path="/" element={<Home/>} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <SocketProvider>
          <AppInner />
        </SocketProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
