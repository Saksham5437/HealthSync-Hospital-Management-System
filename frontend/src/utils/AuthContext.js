import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('hs_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = (userData) => {
    const profile = {
      ...userData,
      id: userData.profileId || userData.id,
      profileId: userData.profileId || userData.id,
      username: userData.username || userData.email,
      signedInAt: new Date().toISOString(),
    };
    localStorage.setItem('hs_user', JSON.stringify(profile));
    setUser(profile);
  };

  const logout = () => {
    localStorage.removeItem('hs_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
