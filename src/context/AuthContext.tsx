import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppUser = { nombre: string; email: string };

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  signIn: (nombre: string, password: string, remember: boolean) => boolean;
  signOut: () => Promise<void>;
};

const SOCIOS = [
  { nombre: 'Dani', email: 'dani@dasan.auto', password: 'Dasan2026' },
  { nombre: 'Santi', email: 'santi@dasan.auto', password: 'Dasan2026' },
];

const SESSION_KEY = 'dasan_session';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((data) => {
      if (data) setUser(JSON.parse(data));
      setLoading(false);
    });
  }, []);

  const signIn = (nombre: string, password: string, remember: boolean): boolean => {
    const socio = SOCIOS.find((s) => s.nombre === nombre && s.password === password);
    if (!socio) return false;
    const u: AppUser = { nombre: socio.nombre, email: socio.email };
    setUser(u);
    if (remember) AsyncStorage.setItem(SESSION_KEY, JSON.stringify(u));
    return true;
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
