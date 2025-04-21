import { useState } from 'react';
import { signInWithEmail, check2FAStatus, verifyTOTPToken, supabase, getPersistedClient } from '@/lib/supabase';

type Step = 'credentials' | 'otp';

interface Credentials {
  email: string;
  password: string;
  remember?: boolean;
}

export function useTwoFactorFlow() {
  const [step, setStep] = useState<Step>('credentials');
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => {
    setStep('credentials');
    setError(null);
    setFactorId(null);
    setChallengeId(null);
    setIsLoading(false);
  };

  const submitCredentials = async ({ email, password, remember }: Credentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Usar el cliente apropiado según la opción de recordar
      const client = remember ? getPersistedClient() : supabase;
      
      const { data, error: signInError } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Verificar si 2FA está habilitado
      const { data: factorsData, error: factorsError } = await client.auth.mfa.listFactors();
      
      if (factorsError) throw factorsError;

      if (factorsData.totp && factorsData.totp.length > 0) {
        const totpFactor = factorsData.totp[0];
        setFactorId(totpFactor.id);
        
        const challenge = await client.auth.mfa.challenge({ factorId: totpFactor.id });
        if (challenge.error) {
          throw challenge.error;
        }
        
        setChallengeId(challenge.data.id);
        setStep('otp');
      }
      // Si no hay 2FA, el login está completo
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const submitOtp = async (code: string, remember?: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!factorId || !challengeId) {
        throw new Error('Información de verificación 2FA no disponible');
      }

      const client = remember ? getPersistedClient() : supabase;
      
      const { error: verifyError } = await client.auth.mfa.verify({
        factorId,
        challengeId,
        code
      });

      if (verifyError) throw verifyError;
      
      // OTP verificado exitosamente, el usuario está autenticado
      setStep('credentials');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    step,
    error,
    isLoading,
    submitCredentials,
    submitOtp,
    reset,
  };
} 