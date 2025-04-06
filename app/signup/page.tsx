"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Loader2, Github, Twitter, AlertCircle } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type React from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";

const data = [
  { mes: 'Mes 1', rendimiento: 20 },
  { mes: 'Mes 2', rendimiento: 40 },
  { mes: 'Mes 3', rendimiento: 55 },
  { mes: 'Mes 4', rendimiento: 65 },
  { mes: 'Mes 5', rendimiento: 75 },
  { mes: 'Mes 6', rendimiento: 85 },
  { mes: 'Mes 7', rendimiento: 95 },
];

type Language = 'es' | 'en' | 'de';

const translations = {
  es: {
    createAccount: "Crea tu cuenta",
    fullName: "Nombre completo",
    email: "Correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    invalidName: "Introduce un nombre válido",
    invalidEmail: "Introduce un formato de email válido",
    invalidPassword: "Introduce una contraseña válida",
    passwordsDontMatch: "Las contraseñas no coinciden",
    acceptTerms: "Debes aceptar los términos y condiciones",
    termsAndConditions: "términos y condiciones",
    iAccept: "Acepto los",
    createAccountButton: "Crear cuenta",
    creatingAccount: "Creando cuenta...",
    continueWith: "O continúa con",
    alreadyHaveAccount: "¿Ya tienes una cuenta?",
    login: "Inicia sesión",
    backToHome: "Volver al inicio",
    connectionError: "Error de conexión con el servidor.",
    registrationError: "Error al registrar usuario.",
    passwordRequirements: {
      chars: "8+ caracteres",
      uppercase: "Mayúscula",
      lowercase: "Minúscula",
      number: "Número"
    },
    terms: {
      title: "Términos y Condiciones",
      welcome: "Bienvenido a TradingDash. Al usar nuestros servicios, aceptas estos términos. Por favor, léelos cuidadosamente.",
      usage: "1. Uso del Servicio: Debes seguir todas las políticas disponibles dentro de los Servicios.",
      privacy: "2. Privacidad: Nuestras políticas de privacidad explican cómo tratamos tus datos personales y protegemos tu privacidad cuando usas nuestros Servicios.",
      modifications: "3. Modificaciones: Podemos modificar estos términos o cualquier término adicional que aplique a un Servicio para, por ejemplo, reflejar cambios en la ley o en nuestros Servicios.",
      close: "Cerrar"
    }
  },
  en: {
    createAccount: "Create your account",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    invalidName: "Please enter a valid name",
    invalidEmail: "Please enter a valid email format",
    invalidPassword: "Please enter a valid password",
    passwordsDontMatch: "Passwords don't match",
    acceptTerms: "You must accept the terms and conditions",
    termsAndConditions: "terms and conditions",
    iAccept: "I accept the",
    createAccountButton: "Create account",
    creatingAccount: "Creating account...",
    continueWith: "Or continue with",
    alreadyHaveAccount: "Already have an account?",
    login: "Log in",
    backToHome: "Back to home",
    connectionError: "Server connection error.",
    registrationError: "Error registering user.",
    passwordRequirements: {
      chars: "8+ characters",
      uppercase: "Uppercase",
      lowercase: "Lowercase",
      number: "Number"
    },
    terms: {
      title: "Terms and Conditions",
      welcome: "Welcome to TradingDash. By using our services, you accept these terms. Please read them carefully.",
      usage: "1. Service Usage: You must follow all policies available within the Services.",
      privacy: "2. Privacy: Our privacy policies explain how we handle your personal data and protect your privacy when using our Services.",
      modifications: "3. Modifications: We may modify these terms or any additional terms that apply to a Service to, for example, reflect changes in the law or our Services.",
      close: "Close"
    }
  },
  de: {
    createAccount: "Konto erstellen",
    fullName: "Vollständiger Name",
    email: "E-Mail",
    password: "Passwort",
    confirmPassword: "Passwort bestätigen",
    invalidName: "Bitte geben Sie einen gültigen Namen ein",
    invalidEmail: "Bitte geben Sie ein gültiges E-Mail-Format ein",
    invalidPassword: "Bitte geben Sie ein gültiges Passwort ein",
    passwordsDontMatch: "Passwörter stimmen nicht überein",
    acceptTerms: "Sie müssen die Allgemeinen Geschäftsbedingungen akzeptieren",
    termsAndConditions: "Allgemeinen Geschäftsbedingungen",
    iAccept: "Ich akzeptiere die",
    createAccountButton: "Konto erstellen",
    creatingAccount: "Konto wird erstellt...",
    continueWith: "Oder fortfahren mit",
    alreadyHaveAccount: "Haben Sie bereits ein Konto?",
    login: "Anmelden",
    backToHome: "Zurück zur Startseite",
    connectionError: "Verbindungsfehler zum Server.",
    registrationError: "Fehler bei der Benutzerregistrierung.",
    passwordRequirements: {
      chars: "8+ Zeichen",
      uppercase: "Großbuchstabe",
      lowercase: "Kleinbuchstabe",
      number: "Nummer"
    },
    terms: {
      title: "Allgemeine Geschäftsbedingungen",
      welcome: "Willkommen bei TradingDash. Mit der Nutzung unserer Dienste akzeptieren Sie diese Bedingungen. Bitte lesen Sie sie sorgfältig.",
      usage: "1. Nutzung des Dienstes: Sie müssen alle innerhalb der Dienste verfügbaren Richtlinien befolgen.",
      privacy: "2. Datenschutz: Unsere Datenschutzrichtlinien erklären, wie wir Ihre persönlichen Daten verarbeiten und Ihre Privatsphäre bei der Nutzung unserer Dienste schützen.",
      modifications: "3. Änderungen: Wir können diese Bedingungen oder zusätzliche Bedingungen, die für einen Dienst gelten, ändern, um beispielsweise Änderungen im Gesetz oder in unseren Diensten widerzuspiegeln.",
      close: "Schließen"
    }
  }
};

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false
  })
  const [success, setSuccess] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()
  const [language, setLanguage] = useState<Language>('en')
  const [countdown, setCountdown] = useState(5);
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  useEffect(() => {
    // Cargar el idioma guardado o usar inglés por defecto
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage && ['es', 'en', 'de'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (success && countdown === 0) {
      router.push("/login");
    }
    return () => clearInterval(timer);
  }, [success, countdown, router]);

  // Obtener las traducciones para el idioma actual
  const t = translations[language];

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'name':
        return !value.trim() ? t.invalidName : "";
      case 'email':
        return !value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) 
          ? t.invalidEmail : "";
      case 'password':
        return !value || value.length < 8 || !/[A-Z]/.test(value) || 
               !/[a-z]/.test(value) || !/[0-9]/.test(value)
          ? t.invalidPassword : "";
      case 'confirmPassword':
        return value !== password ? t.passwordsDontMatch : "";
      default:
        return "";
    }
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (touched[field as keyof typeof touched]) {
      setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validar todos los campos
    const newErrors = {
      name: validateField('name', name),
      email: validateField('email', email),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword),
      terms: !agreedToTerms ? t.acceptTerms : ""
    };

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true
    });

    if (Object.values(newErrors).some(error => error !== "")) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      // Verificar que auth está inicializado
      if (!auth) {
        throw new Error('Firebase Auth no está inicializado');
      }

      // Crear usuario en Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Actualizar el perfil con el nombre
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name
        });

        // Enviar correo de verificación
        await sendEmailVerification(userCredential.user);

        setSuccess(true);
        setMessageType('success');
        setCountdown(5);
        setMessage(
          language === 'es' 
            ? '¡Registro exitoso! 🎉\n\nHemos enviado un correo de verificación a tu dirección de email. Por favor, revisa tu bandeja de entrada y la carpeta de spam.\n\nSerás redirigido al login en' 
            : language === 'en' 
              ? 'Registration successful! 🎉\n\nWe have sent a verification email to your address. Please check your inbox and spam folder.\n\nYou will be redirected to login in'
              : 'Registrierung erfolgreich! 🎉\n\nWir haben eine Bestätigungs-E-Mail an Ihre Adresse gesendet. Bitte überprüfen Sie Ihren Posteingang und Spam-Ordner.\n\nSie werden weitergeleitet zur Anmeldung in'
        );
      }
    } catch (error: any) {
      console.error("Error de registro:", error);
      setMessageType('error');
      
      // Manejar errores específicos de Firebase
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setMessage(language === 'es' ? 'Este correo electrónico ya está registrado' :
                      language === 'en' ? 'This email is already registered' :
                      'Diese E-Mail ist bereits registriert');
            break;
          case 'auth/invalid-email':
            setMessage(language === 'es' ? 'Correo electrónico inválido' :
                      language === 'en' ? 'Invalid email address' :
                      'Ungültige E-Mail-Adresse');
            break;
          case 'auth/operation-not-allowed':
            setMessage(language === 'es' ? 'El registro con correo y contraseña no está habilitado' :
                      language === 'en' ? 'Email/password registration is not enabled' :
                      'E-Mail/Passwort-Registrierung ist nicht aktiviert');
            break;
          case 'auth/weak-password':
            setMessage(language === 'es' ? 'La contraseña es demasiado débil' :
                      language === 'en' ? 'The password is too weak' :
                      'Das Passwort ist zu schwach');
            break;
          case 'auth/network-request-failed':
            setMessage(language === 'es' ? 'Error de conexión. Por favor, verifica tu conexión a internet.' :
                      language === 'en' ? 'Connection error. Please check your internet connection.' :
                      'Verbindungsfehler. Bitte überprüfen Sie Ihre Internetverbindung.');
            break;
          default:
            setMessage(language === 'es' ? 'Error al registrar usuario. Por favor, intenta de nuevo.' :
                      language === 'en' ? 'Error registering user. Please try again.' :
                      'Fehler bei der Benutzerregistrierung. Bitte versuchen Sie es erneut.');
        }
      } else {
        setMessage(language === 'es' ? 'Error inesperado. Por favor, intenta de nuevo.' :
                  language === 'en' ? 'Unexpected error. Please try again.' :
                  'Unerwarteter Fehler. Bitte versuchen Sie es erneut.');
      }
    } finally {
      setIsLoading(false);
    }
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

      {/* Contenedor flex para las dos secciones principales */}
      <div className="relative z-10 min-h-screen flex">
        {/* Sección izquierda - Decorativa (siempre visible) */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <div className="relative w-full flex flex-col items-center justify-center p-8 text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md space-y-8"
            >
              {/* Gráfico Superior */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-base font-semibold">Mejora de Usuarios</h4>
                    <p className="text-xs text-blue-50/80">Progreso mensual</p>
                  </div>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis 
                        dataKey="mes" 
                        stroke="rgba(255, 255, 255, 0.7)" 
                        tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 10 }}
                      />
                      <YAxis 
                        stroke="rgba(255, 255, 255, 0.7)" 
                        domain={[0, 100]}
                        tick={{ fill: 'rgba(255, 255, 255, 0.7)', fontSize: 10 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          color: '#fff' 
                        }}
                        itemStyle={{ color: '#22d3ee' }}
                        labelStyle={{ color: '#fff', marginBottom: '4px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rendimiento" 
                        stroke="#22d3ee" 
                        strokeWidth={2}
                        dot={{ 
                          r: 4,
                          fill: '#22d3ee',
                          strokeWidth: 2,
                          stroke: 'rgba(34, 211, 238, 0.3)'
                        }}
                        activeDot={{
                          r: 6,
                          stroke: '#22d3ee',
                          strokeWidth: 2,
                          fill: '#fff'
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Estadísticas Rápidas */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-50">95%</div>
                  <div className="text-xs text-blue-50/80">Satisfacción</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-50">+10k</div>
                  <div className="text-xs text-blue-50/80">Usuarios activos</div>
                </div>
              </div>

              {/* Testimonios */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
                >
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white font-semibold">
                      MG
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">María González</p>
                      <p className="text-sm text-blue-50/80">Diseñadora UX</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-50 italic">
                    "La interfaz es increíblemente intuitiva y fácil de usar. Me encanta la simplicidad y el diseño moderno."
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
                >
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white font-semibold">
                      JR
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">Juan Rodríguez</p>
                      <p className="text-sm text-blue-50/80">Desarrollador</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-50 italic">
                    "La velocidad y eficiencia de la plataforma son excepcionales. El soporte técnico es muy profesional."
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Sección derecha - Registro o Confirmación */}
        <div className="w-full lg:w-1/2 bg-white dark:bg-gray-900 flex flex-col justify-between p-6 lg:p-12 overflow-y-auto relative rounded-tl-[40px] rounded-bl-[40px]">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 bg-[size:20px_20px] opacity-[0.05]"></div>

          {/* Mostrar pantalla de éxito o formulario */}
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-[70vh] p-6"
            >
              <div className="w-20 h-20 mb-6 relative">
                <div className="absolute inset-0 bg-cyan-200 dark:bg-cyan-900/50 rounded-full animate-ping opacity-25"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div className="max-w-md bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-800/60 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 text-center mb-3">
                  {language === 'es' ? '¡Cuenta creada con éxito!' : 
                   language === 'en' ? 'Account created successfully!' :
                   'Konto erfolgreich erstellt!'}
                </h3>
                
                <p className="text-center text-gray-600 dark:text-gray-300 mb-5">
                  {language === 'es' ? 'Te hemos enviado un correo de verificación.' : 
                   language === 'en' ? 'We have sent you a verification email.' :
                   'Wir haben Ihnen eine Bestätigungs-E-Mail gesendet.'}
                </p>
                
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16 mb-2">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                      <circle 
                        cx="50" cy="50" r="45" 
                        fill="none" 
                        stroke="#e5e7eb" 
                        strokeWidth="8" 
                        className="dark:stroke-gray-700"
                      />
                      <circle 
                        cx="50" cy="50" r="45" 
                        fill="none" 
                        stroke="url(#countdown-gradient)" 
                        strokeWidth="8" 
                        strokeDasharray="283" 
                        strokeDashoffset={283 - (283 * countdown / 5)}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-cyan-500 dark:text-cyan-400">
                        {countdown}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'es' ? 'Redirigiendo al login' : 
                     language === 'en' ? 'Redirecting to login' :
                     'Weiterleitung zur Anmeldung'}
                  </p>
                </div>
                
                <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                  <motion.div 
                    className="flex flex-col items-center text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <svg className="w-6 h-6 text-cyan-500 dark:text-cyan-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                      {language === 'es' ? 'Revisa tu bandeja de entrada y confirma tu email para activar todas las funciones.' : 
                       language === 'en' ? 'Check your inbox and confirm your email to activate all features.' :
                       'Überprüfen Sie Ihren Posteingang und bestätigen Sie Ihre E-Mail, um alle Funktionen zu aktivieren.'}
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col relative">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="sm:mx-auto sm:w-full sm:max-w-md"
              >
                <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {t.createAccount}
                </h2>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
              >
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-8 px-4 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 sm:px-10">
                  <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t.fullName}
                      </label>
                      <div className="mt-1 relative">
                        <input
                          id="name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onBlur={() => handleBlur('name', name)}
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.name && touched.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                          } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
                        />
                        <AnimatePresence>
                          {errors.name && touched.name && (
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
                        {errors.name && touched.name && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-red-600 dark:text-red-500 mt-1"
                          >
                            {errors.name}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

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
                          onBlur={() => handleBlur('email', email)}
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
                            {errors.email}
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
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onBlur={() => handleBlur('password', password)}
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
                        {errors.password && touched.password && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-red-600 dark:text-red-500 mt-1"
                          >
                            {errors.password}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      
                      {/* Validador de robustez de contraseña */}
                      {password && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-2"
                        >
                          <div className="flex gap-2">
                            {[
                              { met: password.length >= 8, text: t.passwordRequirements.chars },
                              { met: /[A-Z]/.test(password), text: t.passwordRequirements.uppercase },
                              { met: /[a-z]/.test(password), text: t.passwordRequirements.lowercase },
                              { met: /[0-9]/.test(password), text: t.passwordRequirements.number }
                            ].map((requirement, index) => (
                              <div
                                key={index}
                                className={`text-[10px] px-2 py-1 rounded-full ${
                                  requirement.met
                                    ? "bg-green-500/20 text-green-500 dark:bg-green-500/10 dark:text-green-400"
                                    : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                }`}
                              >
                                {requirement.text}
                              </div>
                            ))}
                          </div>
                          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                              initial={{ width: "0%" }}
                              animate={{
                                width: `${
                                  ((password.length >= 8 ? 1 : 0) +
                                  (/[A-Z]/.test(password) ? 1 : 0) +
                                  (/[a-z]/.test(password) ? 1 : 0) +
                                  (/[0-9]/.test(password) ? 1 : 0)) *
                                  25
                                }%`
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t.confirmPassword}
                      </label>
                      <div className="mt-1 relative">
                        <input
                          id="confirm-password"
                          name="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onBlur={() => handleBlur('confirmPassword', confirmPassword)}
                          className={`appearance-none block w-full px-3 py-2 border ${
                            errors.confirmPassword && touched.confirmPassword ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                          } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm dark:bg-gray-700 dark:text-white`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300" />
                          )}
                        </button>
                      </div>
                      <AnimatePresence>
                        {errors.confirmPassword && touched.confirmPassword && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-red-600 dark:text-red-500 mt-1"
                          >
                            {errors.confirmPassword}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center">
                      <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => {
                          setAgreedToTerms(e.target.checked);
                          handleBlur('terms', e.target.checked ? 'true' : '');
                        }}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 transition-colors duration-200 ease-in-out cursor-pointer"
                      />
                      <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer">
                        {t.iAccept}{" "}
                        <button
                          type="button"
                          onClick={() => setShowTerms(true)}
                          className="font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                        >
                          {t.termsAndConditions}
                        </button>
                      </label>
                    </div>
                    <AnimatePresence>
                      {errors.terms && touched.terms && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-xs text-red-600 dark:text-red-500 mt-1"
                        >
                          {errors.terms}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {message && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-4 p-4 rounded-md ${
                          messageType === 'success' 
                            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
                            : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                        }`}
                      >
                        <div className="flex items-start">
                          {messageType === 'success' ? (
                            <svg className="h-5 w-5 text-green-400 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                          <p className={`ml-3 text-sm ${
                            messageType === 'success' 
                              ? 'text-green-700 dark:text-green-200' 
                              : 'text-red-700 dark:text-red-200'
                          }`}>
                            {message}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    <div>
                      <button
                        type="submit"
                        disabled={isLoading || Object.values(errors).some(error => error !== "")}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          t.createAccountButton
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="mt-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                          {t.continueWith}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div>
                        <button
                          type="button"
                          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          <Github className="h-5 w-5" />
                        </button>
                      </div>
                      <div>
                        <button
                          type="button"
                          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          <Twitter className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t.alreadyHaveAccount}{" "}
                        <Link
                          href="/login"
                          className="font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                        >
                          {t.login}
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Botón de volver al inicio - solo visible cuando no hay éxito */}
          {!success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="sm:mx-auto sm:w-full sm:max-w-md mt-4"
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
        </div>
      </div>

      {/* Modal de términos y condiciones */}
      <AnimatePresence>
        {showTerms && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowTerms(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t.terms.title}
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-h-60 overflow-y-auto space-y-4">
                <p>{t.terms.welcome}</p>
                <p>{t.terms.usage}</p>
                <p>{t.terms.privacy}</p>
                <p>{t.terms.modifications}</p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowTerms(false)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-200"
                >
                  {t.terms.close}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}