import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'userName';

interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  isLoading: boolean; // true mientras leemos el storage por primera vez
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Al arrancar la app, leemos lo que haya guardado
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((savedName) => {
        if (savedName) {
          setUserNameState(savedName);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Esta función reemplaza al setUserName original:
  // actualiza la memoria Y guarda en el storage al mismo tiempo
  const setUserName = (name: string) => {
    setUserNameState(name);
    AsyncStorage.setItem(STORAGE_KEY, name);
  };

  return (
    <UserContext.Provider value={{ userName, setUserName, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe usarse dentro de un <UserProvider>');
  }
  return context;
}