"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, AlertCircle, Loader2, X, Clock } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { signInWithEmail, getSession, signInWithGoogle, supabase, resetPassword, check2FAStatus, verifyTOTPToken } from "@/lib/supabase";
import { toast } from 'react-hot-toast';

// Tipos para los errores de validación
interface ValidationErrors {
  email: string;
  password: string;
}

// Función para validar email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para validar contraseña
const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

type Language = 'es' | 'en' | 'de';

const translations = {
  es: {
    welcomeBack: "Bienvenido de nuevo",
    loginToContinue: "Inicia sesión para continuar con tu experiencia",
    email: "Correo electrónico",
    password: "Contraseña",
    login: "Iniciar sesión",
    loggingIn: "Iniciando sesión...",
    rememberMe: "Recordarme",
    forgotPassword: "¿Olvidaste tu contraseña?",
    invalidEmail: "Introduce un formato de email válido",
    invalidPassword: "Introduce una contraseña válida",
    continueWith: "O continúa con",
    verifyingSession: "Verificando sesión",
    pleaseWait: "Por favor espera...",
    sessionDetected: "Sesión detectada",
    redirecting: "Redirigiendo...",
    noAccount: "¿No tienes una cuenta?",
    signUp: "Regístrate",
    backToHome: "Volver al inicio",
    continueWithGoogle: "Continuar con Google",
    emailConfirmed: "¡Tu email ha sido confirmado! Por favor, inicia sesión.",
    popupBlocked: "La ventana popup no se pudo abrir. Por favor, inténtalo más tarde.",
    googleLoginError: "Error al iniciar sesión con Google. Por favor, inténtalo más tarde.",
    forgotPasswordTitle: "Recuperar contraseña",
    forgotPasswordDesc: "Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.",
    send: "Enviar enlace",
    sending: "Enviando...",
    forgotPasswordSuccess: "Se ha enviado un enlace a tu correo electrónico para restablecer tu contraseña.",
    cancel: "Cancelar",
    emailRequired: "El correo electrónico es requerido",
    close: "Cerrar",
    backToLogin: "Volver al inicio de sesión",
    resetEmailSent: "Enlace enviado",
    checkEmail: "Revisa tu correo electrónico para continuar con el proceso de restablecimiento de contraseña.",
    redirectingIn: "Redirigiendo en {seconds} segundos",
    resetEmailError: "Error al enviar el correo de restablecimiento. Por favor, inténtalo de nuevo.",
    goDashboard: "Ir al dashboard",
    loginSuccess: "¡Inicio de sesión exitoso!",
    preparingDashboard: "Preparando tu dashboard...",
    welcomeUser: "¡Bienvenido(a) a Mulfex Trader!",
    emailNotConfirmed: "Por favor, verifica tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada y la carpeta de spam.",
    accountTemporarilyLocked: "Tu cuenta está bloqueada temporalmente. Por favor, intenta más tarde",
    invalidCredentials: "Credenciales inválidas. Por favor, verifica tu email y contraseña",
    loginError: "Error al iniciar sesión",
    unexpectedError: "Error inesperado al iniciar sesión",
    resendVerification: "Reenviar correo de verificación",
    resendingVerification: "Reenviando...",
    verificationSent: "Correo de verificación reenviado. Por favor, revisa tu bandeja de entrada.",
    tooManyAttempts: "Demasiados intentos. Por favor, espera antes de intentar de nuevo.",
    waitMinutes: "Por favor, espera {minutes} minutos antes de intentar de nuevo.",
    waitSeconds: "Por favor, espera {seconds} segundos antes de intentar de nuevo.",
    contactSupport: "Has excedido el límite diario. Por favor, contacta a soporte.",
    waitingForCooldown: "Esperando tiempo de espera...",
    remainingAttempts: "Intentos restantes: {hourly} por hora, {daily} por día",
    otpCode: "Código de autenticación",
    verifying: "Verificando...",
    verify: "Verificar",
    invalidOtp: "Código de autenticación inválido",
    enterOtp: "Ingresa el código de autenticación de tu aplicación",
    otpRequired: "El código de autenticación es requerido",
    otpInvalid: "El código de autenticación debe tener 6 dígitos",
    otpExpired: "El código de autenticación ha expirado. Por favor, genera uno nuevo.",
    twoFactorTitle: "Verificación en dos pasos",
    twoFactorDesc: "Por favor, ingresa el código de autenticación de tu aplicación para continuar"
  },
  en: {
    welcomeBack: "Welcome back",
    loginToContinue: "Log in to continue your experience",
    email: "Email",
    password: "Password",
    login: "Log in",
    loggingIn: "Logging in...",
    rememberMe: "Remember me",
    forgotPassword: "Forgot your password?",
    invalidEmail: "Please enter a valid email format",
    invalidPassword: "Please enter a valid password",
    continueWith: "Or continue with",
    verifyingSession: "Verifying session",
    pleaseWait: "Please wait...",
    sessionDetected: "Session detected",
    redirecting: "Redirecting...",
    noAccount: "Don't have an account?",
    signUp: "Sign up",
    backToHome: "Back to home",
    continueWithGoogle: "Continue with Google",
    emailConfirmed: "Your email has been confirmed! Please log in.",
    popupBlocked: "The popup window could not be opened. Please try again later.",
    googleLoginError: "Error logging in with Google. Please try again later.",
    forgotPasswordTitle: "Reset Password",
    forgotPasswordDesc: "Enter your email and we'll send you a link to reset your password.",
    send: "Send link",
    sending: "Sending...",
    forgotPasswordSuccess: "Password reset link has been sent to your email.",
    cancel: "Cancel",
    emailRequired: "Email is required",
    close: "Close",
    backToLogin: "Back to login",
    resetEmailSent: "Link sent",
    checkEmail: "Check your email for further instructions to reset your password.",
    redirectingIn: "Redirecting in {seconds} seconds",
    resetEmailError: "Error sending reset email. Please try again.",
    goDashboard: "Go to dashboard",
    loginSuccess: "Login successful!",
    preparingDashboard: "Preparing your dashboard...",
    welcomeUser: "Welcome to Mulfex Trader!",
    emailNotConfirmed: "Please verify your email before logging in. Check your inbox and spam folder.",
    accountTemporarilyLocked: "Your account is temporarily locked. Please try again later",
    invalidCredentials: "Invalid credentials. Please verify your email and password",
    loginError: "Login error",
    unexpectedError: "Unexpected error logging in",
    resendVerification: "Resend verification email",
    resendingVerification: "Resending...",
    verificationSent: "Verification email resent. Please check your inbox.",
    tooManyAttempts: "Too many attempts. Please wait before trying again.",
    waitMinutes: "Please wait {minutes} minutes before trying again.",
    waitSeconds: "Please wait {seconds} seconds before trying again.",
    contactSupport: "You have exceeded the daily limit. Please contact support.",
    waitingForCooldown: "Waiting for cooldown...",
    remainingAttempts: "Remaining attempts: {hourly} per hour, {daily} per day",
    otpCode: "Authentication code",
    verifying: "Verifying...",
    verify: "Verify",
    invalidOtp: "Invalid authentication code",
    enterOtp: "Enter the authentication code from your app",
    otpRequired: "Authentication code is required",
    otpInvalid: "Authentication code must be 6 digits",
    otpExpired: "Authentication code has expired. Please generate a new one.",
    twoFactorTitle: "Two-factor authentication",
    twoFactorDesc: "Please enter the authentication code from your app to continue"
  },
  de: {
    welcomeBack: "Willkommen zurück",
    loginToContinue: "Melden Sie sich an, um fortzufahren",
    email: "E-Mail",
    password: "Passwort",
    login: "Anmelden",
    loggingIn: "Anmeldung...",
    rememberMe: "Angemeldet bleiben",
    forgotPassword: "Passwort vergessen?",
    invalidEmail: "Bitte geben Sie ein gültiges E-Mail-Format ein",
    invalidPassword: "Bitte geben Sie ein gültiges Passwort ein",
    continueWith: "Oder weiter mit",
    verifyingSession: "Sitzung wird überprüft",
    pleaseWait: "Bitte warten...",
    sessionDetected: "Sitzung erkannt",
    redirecting: "Weiterleitung...",
    noAccount: "Noch kein Konto?",
    signUp: "Registrieren",
    backToHome: "Zurück zur Startseite",
    continueWithGoogle: "Weiter mit Google",
    emailConfirmed: "Ihre E-Mail wurde bestätigt! Bitte melden Sie sich an.",
    popupBlocked: "Die Popup-Fenster konnte nicht geöffnet werden. Bitte versuchen Sie es später erneut.",
    googleLoginError: "Fehler beim Anmelden mit Google. Bitte versuchen Sie es später erneut.",
    forgotPasswordTitle: "Passwort zurücksetzen",
    forgotPasswordDesc: "Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.",
    send: "Link senden",
    sending: "Senden...",
    forgotPasswordSuccess: "Ein Link zum Zurücksetzen des Passworts wurde an Ihre E-Mail gesendet.",
    cancel: "Abbrechen",
    emailRequired: "E-Mail ist erforderlich",
    close: "Schließen",
    backToLogin: "Zurück zur Anmeldung",
    resetEmailSent: "Link gesendet",
    checkEmail: "Überprüfen Sie Ihre E-Mail für weitere Anweisungen zum Zurücksetzen Ihres Passworts.",
    redirectingIn: "Weiterleitung in {seconds} Sekunden",
    resetEmailError: "Fehler beim Senden der Reset-E-Mail. Bitte versuchen Sie es erneut.",
    goDashboard: "Zum Dashboard",
    loginSuccess: "Anmeldung erfolgreich!",
    preparingDashboard: "Dashboard wird vorbereitet...",
    welcomeUser: "Willkommen bei Mulfex Trader!",
    emailNotConfirmed: "Bitte bestätigen Sie Ihre E-Mail-Adresse vor dem Login. Überprüfen Sie Ihren Posteingang und Spam-Ordner.",
    accountTemporarilyLocked: "Ihr Konto ist vorübergehend gesperrt. Bitte versuchen Sie es später erneut",
    invalidCredentials: "Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort",
    loginError: "Anmeldefehler",
    unexpectedError: "Unerwarteter Fehler beim Anmelden",
    resendVerification: "Bestätigungsmail erneut senden",
    resendingVerification: "Wird gesendet...",
    verificationSent: "Bestätigungsmail erneut gesendet. Bitte überprüfen Sie Ihren Posteingang.",
    tooManyAttempts: "Zu viele Versuche. Bitte warten Sie, bevor Sie es erneut versuchen.",
    waitMinutes: "Bitte warten Sie {minutes} Minuten, bevor Sie es erneut versuchen.",
    waitSeconds: "Bitte warten Sie {seconds} Sekunden, bevor Sie es erneut versuchen.",
    contactSupport: "Sie haben das Tageslimit überschritten. Bitte kontaktieren Sie den Support.",
    waitingForCooldown: "Warten auf Abklingzeit...",
    remainingAttempts: "Verbleibende Versuche: {hourly} pro Stunde, {daily} pro Tag",
    otpCode: "Authentifizierungscode",
    verifying: "Überprüfung...",
    verify: "Überprüfen",
    invalidOtp: "Ungültiger Authentifizierungscode",
    enterOtp: "Geben Sie den Authentifizierungscode aus Ihrer App ein",
    otpRequired: "Authentifizierungscode ist erforderlich",
    otpInvalid: "Authentifizierungscode muss 6 Ziffern haben",
    otpExpired: "Authentifizierungscode ist abgelaufen. Bitte generieren Sie einen neuen.",
    twoFactorTitle: "Zwei-Faktor-Authentifizierung",
    twoFactorDesc: "Bitte geben Sie den Authentifizierungscode aus Ihrer App ein, um fortzufahren"
  }
};

function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isExistingSession, setIsExistingSession] = useState(false);
  const router = useRouter();
  const [errors, setErrors] = useState<ValidationErrors>({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [language, setLanguage] = useState<Language>('en');
  const searchParams = useSearchParams();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showCountdown, setShowCountdown] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [step, setStep] = useState<'credentials'|'otp'>('credentials');
  const [userId, setUserId] = useState<string|null>(null);
  const [otp, setOtp] = useState('');
  const [resendState, setResendState] = useState<{
    lastAttempt: Date | null;
    remainingAttempts: { hourly: number; daily: number } | null;
    cooldown: { seconds: number | null; minutes: number | null; hours: number | null } | null;
  }>({
    lastAttempt: null,
    remainingAttempts: null,
    cooldown: null
  });

  useEffect(() => {
    // Cargar el idioma guardado o usar español por defecto
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage && ['es', 'en', 'de'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }

    // Rellena los campos de correo electrónico y contraseña si hay datos almacenados
    const storedEmail = localStorage.getItem("email");
    const storedPassword = localStorage.getItem("password");
    if (storedEmail && storedPassword) {
      setEmail(storedEmail);
      setPassword(storedPassword);
      setRememberMe(true);
    }

    setIsCheckingSession(false);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();
        if (session) {
          toast.success(t.loginSuccess);
          toast.success(t.preparingDashboard);
          setIsExistingSession(true);
          setRedirectCountdown(3);
          
          const timer = setInterval(() => {
            setRedirectCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  // Efecto separado para la redirección cuando el contador llega a cero
  useEffect(() => {
    if (redirectCountdown === 0 && (isExistingSession || success)) {
      router.push("/dashboard");
    }
  }, [redirectCountdown, isExistingSession, success, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((success || isExistingSession) && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [redirectCountdown, success, isExistingSession]);

  useEffect(() => {
    // Mostrar mensaje si el usuario viene de confirmar su email
    const fromConfirmation = searchParams?.get('fromConfirmation');
    if (fromConfirmation === 'true') {
      toast.success(translations[language].emailConfirmed);
    }
  }, [searchParams, language]);

  // Obtener las traducciones para el idioma actual
  const t = translations[language];

  // Validación en tiempo real del email
  useEffect(() => {
    if (touched.email) {
      if (!email || !isValidEmail(email)) {
        setErrors(prev => ({ ...prev, email: "Introduce un formato de email válido" }));
      } else {
        setErrors(prev => ({ ...prev, email: "" }));
      }
    }
  }, [email, touched.email]);

  // Validación en tiempo real de la contraseña
  useEffect(() => {
    if (touched.password) {
      if (!password || !validatePassword(password)) {
        setErrors(prev => ({ ...prev, password: "Introduce una contraseña válida" }));
      } else {
        setErrors(prev => ({ ...prev, password: "" }));
      }
    }
  }, [password, touched.password]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showCountdown && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (showCountdown && countdown === 0) {
      setShowForgotPassword(false);
      setShowCountdown(false);
      setCountdown(5);
    }
    return () => clearTimeout(timer);
  }, [countdown, showCountdown]);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error(t.invalidEmail);
      return;
    }

    setIsResendingVerification(true);
    try {
      // Obtener información del cliente
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip;
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : null;

      // Verificar límites de reenvío
      const { data: limitCheck, error: limitError } = await supabase.rpc('check_verification_email_limit', {
        p_email: email,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (limitError) throw limitError;

      if (!limitCheck.allowed) {
        setResendState(prev => ({
          ...prev,
          lastAttempt: new Date(),
          cooldown: {
            seconds: limitCheck.wait_seconds || null,
            minutes: limitCheck.wait_minutes || null,
            hours: limitCheck.wait_hours || null
          }
        }));

        if (limitCheck.wait_seconds) {
          toast.error(t.waitSeconds.replace('{seconds}', limitCheck.wait_seconds));
        } else if (limitCheck.wait_minutes) {
          toast.error(t.waitMinutes.replace('{minutes}', limitCheck.wait_minutes));
        } else if (limitCheck.wait_hours) {
          toast.error(t.contactSupport);
        } else {
          toast.error(t.tooManyAttempts);
        }
        return;
      }

      // Intentar reenviar el correo
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) throw error;
      
      setResendState(prev => ({
        ...prev,
        lastAttempt: new Date(),
        remainingAttempts: {
          hourly: 2, // 3 intentos por hora - 1 intento actual
          daily: 9   // 10 intentos por día - 1 intento actual
        }
      }));

      toast.success(t.verificationSent);
    } catch (error: any) {
      console.error('Error al reenviar correo de verificación:', error);
      toast.error(error.message);
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!isValidEmail(email)) {
      setErrors(prev => ({ ...prev, email: t.invalidEmail }));
      return;
    }

    if (!password) {
      setErrors(prev => ({ ...prev, password: t.invalidPassword }));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        let errorMessage = '';
        let isEmailNotConfirmed = false;
        
        switch (true) {
          case error.message.includes('verifica tu correo'):
          case error.message.includes('Email not confirmed'):
            errorMessage = t.emailNotConfirmed;
            isEmailNotConfirmed = true;
            break;
          case error.message.includes('bloqueada temporalmente'):
            errorMessage = t.accountTemporarilyLocked;
            break;
          case error.message.includes('Invalid login credentials'):
            errorMessage = t.invalidCredentials;
            break;
          default:
            errorMessage = error.message || t.loginError;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      if (data?.session) {
        if (rememberMe) {
          localStorage.setItem("email", email);
          localStorage.setItem("password", password);
        } else {
          localStorage.removeItem("email");
          localStorage.removeItem("password");
        }

        // Guardamos el userId para el siguiente paso
        setUserId(data.user.id);

        try {
          // Comprobamos si tiene 2FA activado
          const { data: twoFactorData, error: statusErr } = await supabase.rpc('check_2fa_status', {
            p_user_id: data.user.id
          });
          
          if (statusErr) {
            toast.error(`Error al verificar 2FA: ${statusErr.message}`);
            setError(statusErr.message);
            setIsLoading(false);
            return;
          }

          if (twoFactorData === true) {
            // Pasamos al paso OTP
            setStep('otp');
            setIsLoading(false);
          } else {
            // No tiene 2FA, procedemos normalmente
            toast.success(t.loginSuccess);
            toast.success(t.preparingDashboard);
            setSuccess(true);
            setRedirectCountdown(3);
          }
        } catch (error) {
          // En lugar de hacer bypass, mostramos el error
          console.error('Error inesperado al verificar 2FA:', error);
          toast.error(`Error inesperado al verificar 2FA: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          setError('Error al verificar estado de autenticación de dos factores');
          setIsLoading(false);
        }
      }
    } catch (error) {
      setError(t.unexpectedError);
    } finally {
      setIsLoading(false);
    }
  };

  // Nueva función para manejar la verificación del OTP
  const handleSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsLoading(true);
    const { success: otpSuccess, error: otpErr } = await verifyTOTPToken(userId, otp);
    
    if (!otpSuccess) {
      setError(otpErr || t.invalidOtp);
      setIsLoading(false);
      return;
    }

    // OTP verificado correctamente
    toast.success(t.loginSuccess);
    toast.success(t.preparingDashboard);
    setSuccess(true);
    setRedirectCountdown(3);
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        console.error('Error al iniciar sesión con Google:', error);
        toast.error(t.googleLoginError);
        setIsGoogleLoading(false);
        return;
      }

      // La redirección será manejada automáticamente por Supabase
      // No necesitamos hacer nada más aquí ya que la página se recargará

    } catch (error) {
      console.error('Error en handleGoogleLogin:', error);
      toast.error(t.googleLoginError);
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success(t.resetEmailSent);
      setShowCountdown(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error(t.resetEmailError);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cambiar al formulario de login
  const showLoginForm = () => {
    setShowForgotPassword(false);
    setShowCountdown(false);
  };

  const renderVerificationAlert = () => {
    if (!error?.includes(t.emailNotConfirmed)) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-800"
      >
        <div className="flex flex-col space-y-3">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-400 dark:text-amber-300 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-amber-500 dark:text-amber-200">{t.emailNotConfirmed}</p>
              {resendState.lastAttempt && (
                <p className="text-xs text-amber-400 dark:text-amber-300 mt-1">
                  {resendState.remainingAttempts && (
                    <>
                      {t.remainingAttempts
                        .replace('{hourly}', resendState.remainingAttempts.hourly.toString())
                        .replace('{daily}', resendState.remainingAttempts.daily.toString())}
                    </>
                  )}
                  {resendState.cooldown?.seconds && (
                    <>
                      {t.waitSeconds.replace('{seconds}', resendState.cooldown.seconds.toString())}
                    </>
                  )}
                  {resendState.cooldown?.minutes && (
                    <>
                      {t.waitMinutes.replace('{minutes}', resendState.cooldown.minutes.toString())}
                    </>
                  )}
                  {resendState.cooldown?.hours && (
                    <>
                      {t.contactSupport}
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleResendVerification}
            disabled={isResendingVerification || Boolean(resendState.cooldown)}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isResendingVerification ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                {t.resendingVerification}
              </>
            ) : resendState.cooldown ? (
              <>
                <Clock className="h-5 w-5 mr-2" />
                {t.waitingForCooldown}
              </>
            ) : (
              t.resendVerification
            )}
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fondo azul que ocupará toda la pantalla */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-600/30 backdrop-blur-sm"></div>
        
        {/* Elementos decorativos flotantes con efecto de cristal */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-4 top-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute -left-4 top-3/4 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute right-1/4 bottom-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Sección izquierda - Decorativa (visible solo en pantallas grandes) */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <div className="relative w-full flex flex-col items-center justify-center p-8 text-white">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center relative z-10"
            >
              <h3 className="text-3xl font-bold mb-4 [text-shadow:0_2px_10px_rgba(0,0,0,0.1)]">
                Mulfex Trader
              </h3>
              <p className="text-lg mb-6 text-blue-50">
                La plataforma más avanzada para trading profesional
              </p>
              
              <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl p-4 hover:from-white/15 hover:to-white/10 transition-all duration-300 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)]"
                >
                  <div className="text-3xl mb-2">📊</div>
                  <h4 className="text-lg font-semibold mb-1">Análisis Avanzado</h4>
                  <p className="text-sm text-gray-200">Herramientas potentes para tomar mejores decisiones</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl p-4 hover:from-white/15 hover:to-white/10 transition-all duration-300 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)]"
                >
                  <div className="text-3xl mb-2">⚡</div>
                  <h4 className="text-lg font-semibold mb-1">Tiempo Real</h4>
                  <p className="text-sm text-gray-200">Datos y alertas instantáneas del mercado</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl p-4 hover:from-white/15 hover:to-white/10 transition-all duration-300 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)]"
                >
                  <div className="text-3xl mb-2">🛡️</div>
                  <h4 className="text-lg font-semibold mb-1">Seguridad Total</h4>
                  <p className="text-sm text-gray-200">Tu inversión protegida en todo momento</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-xl p-4 hover:from-white/15 hover:to-white/10 transition-all duration-300 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.1)] hover:shadow-[0_0_20px_rgba(0,0,0,0.15)]"
                >
                  <div className="text-3xl mb-2">🎯</div>
                  <h4 className="text-lg font-semibold mb-1">Soporte 24/7</h4>
                  <p className="text-sm text-gray-200">Estamos aquí para ayudarte siempre</p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mt-6 bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-3 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.1)]"
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="flex -space-x-2">
                    <img className="w-8 h-8 rounded-full border-2 border-cyan-200 shadow-lg" src="https://randomuser.me/api/portraits/men/1.jpg" alt="Usuario" />
                    <img className="w-8 h-8 rounded-full border-2 border-cyan-200 shadow-lg" src="https://randomuser.me/api/portraits/women/2.jpg" alt="Usuario" />
                    <img className="w-8 h-8 rounded-full border-2 border-cyan-200 shadow-lg" src="https://randomuser.me/api/portraits/men/3.jpg" alt="Usuario" />
                  </div>
                  <p className="text-sm text-blue-50 [text-shadow:0_1px_2px_rgba(0,0,0,0.1)]">
                    Más de 10,000 traders confían en nosotros
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Sección derecha - Login o Forgot Password */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white dark:bg-gray-900 p-8 relative rounded-tl-[40px] rounded-bl-[40px]">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 bg-[size:20px_20px] opacity-[0.05] rounded-tl-[40px] rounded-bl-[40px]"></div>

          <AnimatePresence mode="wait">
            <motion.div
              key={showForgotPassword ? "forgot-container" : step === 'otp' ? "otp-container" : "login-container"}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md flex flex-col relative z-10"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-6"
              >
                <h2 className="text-center text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">
                  {showForgotPassword ? t.forgotPasswordTitle : step === 'otp' ? t.verifying : t.welcomeBack}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                  {showForgotPassword ? t.forgotPasswordDesc : step === 'otp' ? t.pleaseWait : t.loginToContinue}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-8 px-4 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 sm:px-10">
                  <AnimatePresence mode="wait">
                    {isCheckingSession ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                            delay: 0.1 
                          }}
                          className="mx-auto mb-4"
                        >
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-xl opacity-50"></div>
                            <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
                              <Loader2 className="w-10 h-10 text-white animate-spin" />
                            </div>
                          </div>
                        </motion.div>
                        <motion.h3 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 mb-2"
                        >
                            {t.verifyingSession}
                        </motion.h3>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-center space-y-4"
                        >
                          <p className="text-base text-gray-600 dark:text-gray-400">
                              {t.pleaseWait}
                          </p>
                          <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              {t.redirectingIn.replace('{seconds}', redirectCountdown.toString())} 
                            </p>
                            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                              />
                            </div>
                            <button
                              onClick={() => router.push("/dashboard")}
                              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02]"
                            >
                              {t.goDashboard}
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    ) : success || isExistingSession ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                            delay: 0.1 
                          }}
                          className="mx-auto mb-4"
                        >
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-xl opacity-50"></div>
                            <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
                              <Loader2 className="w-10 h-10 text-white animate-spin" />
                            </div>
                          </div>
                        </motion.div>
                        <motion.h3 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 mb-2"
                        >
                            {t.loginSuccess}
                        </motion.h3>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-center space-y-4"
                        >
                          <p className="text-base text-gray-600 dark:text-gray-400">
                              {t.preparingDashboard}
                            </p>
                          <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-500">
                              {t.redirectingIn.replace('{seconds}', redirectCountdown.toString())} 
                            </p>
                            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 5, ease: "linear" }}
                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                              />
                            </div>
                            <button
                              onClick={() => router.push("/dashboard")}
                              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02]"
                            >
                              {t.goDashboard}
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    ) : step === 'otp' ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-8 px-4 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 sm:px-10">
                          <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                              {t.twoFactorTitle}
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {t.twoFactorDesc}
                            </p>
                          </div>

                          <form onSubmit={handleSubmitOtp} className="space-y-6">
                            <div>
                              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t.otpCode}
                              </label>
                              <div className="mt-1 relative">
                                <input
                                  id="otp"
                                  name="otp"
                                  type="text"
                                  value={otp}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    if (value.length <= 6) setOtp(value);
                                  }}
                                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm dark:bg-gray-700 dark:text-white text-center tracking-[0.5em] font-mono"
                                  placeholder="000000"
                                  maxLength={6}
                                  pattern="[0-9]*"
                                  inputMode="numeric"
                                  autoComplete="one-time-code"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                  {otp.length === 6 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                                      className="text-green-500"
                                    >
                                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                                    </motion.div>
                                  )}
                            </div>
                          </div>
                              <div className="mt-2 flex justify-between items-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {t.enterOtp}
                                </p>
                                <p className="text-xs font-mono text-gray-400 dark:text-gray-500">
                                  {otp.length}/6
                                </p>
                            </div>
                          </div>

                            {error && (
                      <motion.div
                                initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-lg bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800"
                              >
                                <div className="flex">
                                  <AlertCircle className="h-5 w-5 text-red-400 dark:text-red-300" />
                                  <div className="ml-3">
                                    <p className="text-sm text-red-500 dark:text-red-200">{error}</p>
                                  </div>
                                </div>
                                      </motion.div>
                                    )}

                            <div className="space-y-3">
                                <button
                                  type="submit"
                                disabled={isLoading || otp.length !== 6}
                                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02]"
                                >
                                  {isLoading ? (
                                  <>
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                    {t.verifying}
                                  </>
                                  ) : (
                                  t.verify
                                  )}
                                </button>
                                
                                <button
                                  type="button"
                                onClick={() => {
                                  setStep('credentials');
                                  setError('');
                                  setOtp('');
                                }}
                                  className="w-full flex justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transform transition-all duration-200 hover:scale-[1.02]"
                                >
                                  {t.backToLogin}
                                </button>
                              </div>
                          </form>
                        </div>
                      </motion.div>
                        ) : (
                          <motion.form 
                            className="space-y-6" 
                            onSubmit={handleSubmit}
                            noValidate
                          >
                            <div>
                              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t.email}
                              </label>
                              <div className="mt-1 relative">
                                <input
                                  id="email"
                                  name="email"
                                  type="email"
                                  autoComplete="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                                  className={`appearance-none block w-full px-3 py-2 border ${
                                    errors.email && touched.email ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
                                />
                                <AnimatePresence>
                                  {errors.email && touched.email && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
                                    >
                                      <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              <AnimatePresence>
                                {errors.email && touched.email && (
                                  <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-xs text-red-600 dark:text-red-500 mt-1"
                                  >
                                      {t.invalidEmail}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>

                            <div>
                              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t.password}
                              </label>
                              <div className="mt-1 relative">
                                <input
                                  id="password"
                                  name="password"
                                  type={showPassword ? "text" : "password"}
                                  autoComplete="current-password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                                  className={`appearance-none block w-full px-3 py-2 border ${
                                    errors.password && touched.password ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                                  } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                                  ) : (
                                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                                  )}
                                </button>
                              </div>
                              <AnimatePresence>
                                {touched.password && errors.password && (
                                  <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-xs text-red-600 dark:text-red-500 mt-1"
                                  >
                                      {t.invalidPassword}
                                  </motion.p>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="relative flex items-center">
                                  <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 transition-colors duration-200 ease-in-out cursor-pointer"
                                  />
                                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer">
                                      {t.rememberMe}
                                  </label>
                                </div>
                              </div>

                              <div className="text-sm">
                                <button
                                  type="button"
                                  onClick={() => setShowForgotPassword(true)}
                                  className="font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                                >
                                    {t.forgotPassword}
                                </button>
                              </div>
                            </div>

                            {error && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-3 rounded-lg ${
                                  error === t.emailNotConfirmed
                                    ? 'bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-800'
                                    : 'bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800'
                                }`}
                              >
                                <div className="flex flex-col space-y-3">
                                  <div className="flex">
                                    <AlertCircle className={`h-5 w-5 ${
                                      error === t.emailNotConfirmed
                                        ? 'text-amber-400 dark:text-amber-300'
                                        : 'text-red-400 dark:text-red-300'
                                    }`} />
                                    <div className="ml-3">
                                      <p className={`text-sm ${
                                        error === t.emailNotConfirmed
                                          ? 'text-amber-500 dark:text-amber-200'
                                          : 'text-red-500 dark:text-red-200'
                                      }`}>{error}</p>
                                    </div>
                                  </div>
                                  {error === t.emailNotConfirmed && (
                                    <button
                                      onClick={handleResendVerification}
                                      disabled={isResendingVerification || Boolean(resendState.cooldown)}
                                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isResendingVerification ? (
                                        <>
                                          <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                          {t.resendingVerification}
                                        </>
                                      ) : resendState.cooldown ? (
                                        <>
                                          <Clock className="h-5 w-5 mr-2" />
                                          {t.waitingForCooldown}
                                        </>
                                      ) : (
                                        t.resendVerification
                                      )}
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            )}

                            <div>
                              <button
                                type="submit"
                                disabled={isLoading || (touched.email && touched.password && (!!errors.email || !!errors.password))}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02]"
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                      {t.loggingIn}
                                  </>
                                ) : (
                                    t.login
                                )}
                              </button>
                            </div>
                          </motion.form>
                    )}
                  </AnimatePresence>

                  {(!success && !showForgotPassword && !isExistingSession) && (
                    <>
                      <div className="mt-8">
                        <div className="flex items-center justify-center gap-4 my-6">
                          <div className="w-16 h-px bg-gray-300 dark:bg-gray-600"></div>
                          <span className="uppercase text-xs tracking-wider font-medium text-gray-500 dark:text-gray-400">
                            {t.continueWith}
                          </span>
                          <div className="w-16 h-px bg-gray-300 dark:bg-gray-600"></div>
                        </div>

                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading}
                            className="relative flex items-center justify-center w-full px-4 py-3 rounded-lg 
                                     bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl dark:shadow-gray-900/30 
                                     transition-all duration-300 border border-gray-100 dark:border-gray-700 
                                     hover:border-gray-200 dark:hover:border-gray-600 hover:transform 
                                     hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed gap-3
                                     group overflow-hidden"
                          >
                            {/* Efecto de hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 
                                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            {/* Contenido del botón */}
                            <div className="relative z-10 flex items-center gap-3">
                              <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                              </svg>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                {isGoogleLoading ? 'Conectando con Google...' : t.continueWithGoogle}
                              </span>
                            </div>
                            
                            {/* Indicador de carga */}
                            {isGoogleLoading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                                </div>
                              </div>
                            )}
                          </button>
                        </div>

                        <div className="mt-6">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t.noAccount}{" "}
                                <Link
                                  href="/signup"
                                  className="font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                                >
                                    {t.signUp}
                                </Link>
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Botón para volver al inicio */}
              {!success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-4 flex justify-start"
                >
                  <a
                    href="/"
                    className="group w-2/5 flex items-center justify-center px-4 py-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 hover:shadow-xl"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5 text-cyan-500 dark:text-cyan-400 transition-transform duration-300 group-hover:-translate-x-1" />
                    <span className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500">
                      {t.backToHome}
                    </span>
                  </a>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}