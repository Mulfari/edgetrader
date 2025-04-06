import { createContext, useContext, ReactNode } from 'react';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import type { AuthUser } from '@/hooks/useFirebaseAuth';

interface FirebaseAuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  loginWithEmail: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth();

  return (
    <FirebaseAuthContext.Provider value={auth}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}

export { type FirebaseAuthContextType }; 