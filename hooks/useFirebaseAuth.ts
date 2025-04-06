import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export function useFirebaseAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convertir usuario de Firebase a nuestro formato
  const formatUser = (user: FirebaseUser): AuthUser => ({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(formatUser(user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      
      // Llamar a tu backend con el token de Firebase
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        throw new Error('Error al autenticar con el backend');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      
      // Llamar a tu backend con el token de Firebase
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        throw new Error('Error al autenticar con el backend');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    loginWithEmail,
    loginWithGoogle,
    logout
  };
} 