import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  OAuthProvider,
  FacebookAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  linkWithPopup,
  AuthErrorCodes,
  getAuth
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerData: {
    providerId: string;
  }[];
}

// Función para generar un nonce seguro
const generateNonce = (length: number = 32): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
};

export function useFirebaseAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convertir usuario de Firebase a nuestro formato
  const formatUser = (user: FirebaseUser): AuthUser => ({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    providerData: user.providerData
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

  const handleAuthError = (error: any) => {
    let errorMessage = 'Error al iniciar sesión';
    
    switch (error.code) {
      case 'auth/invalid-credential':
        errorMessage = 'El correo electrónico o la contraseña son incorrectos';
        break;
      case 'auth/popup-closed-by-user':
        errorMessage = 'Ventana de inicio de sesión cerrada';
        break;
      case 'auth/popup-blocked':
        errorMessage = 'El navegador bloqueó la ventana emergente';
        break;
      case 'auth/account-exists-with-different-credential':
        errorMessage = 'Ya existe una cuenta con este correo electrónico. Por favor, use otro método de inicio de sesión.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Correo electrónico inválido';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Esta cuenta ha sido deshabilitada';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Este método de inicio de sesión no está habilitado';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Contraseña incorrecta';
        break;
      case 'auth/user-not-found':
        errorMessage = 'No existe una cuenta con este correo electrónico';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos fallidos. Por favor, intente más tarde';
        break;
      default:
        errorMessage = error.message;
    }
    
    setError(errorMessage);
    throw error;
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return formatUser(result.user);
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      const result = await signInWithPopup(auth, provider);
      return formatUser(result.user);
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const loginWithApple = async () => {
    try {
      const auth = getAuth();
      const provider = new OAuthProvider('apple.com');
      
      // Configurar el scope para solicitar el nombre y email
      provider.addScope('name');
      provider.addScope('email');

      // Generar y guardar el nonce
      const rawNonce = generateNonce();
      // En producción, deberías hashear el nonce con SHA-256
      
      provider.setCustomParameters({
        // Pasar el nonce a Apple
        nonce: rawNonce,
      });

      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      return result.user;
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const loginWithFacebook = async () => {
    try {
      setError(null);
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      const result = await signInWithPopup(auth, provider);
      return formatUser(result.user);
    } catch (error: any) {
      handleAuthError(error);
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