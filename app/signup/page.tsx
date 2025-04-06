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

  useEffect(() => {
    // Cargar el idioma guardado o usar inglés por defecto
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    if (savedLanguage && ['es', 'en', 'de'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

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
        setMessage(
          language === 'es' 
            ? 'Registro exitoso. Por favor, verifica tu correo electrónico.' 
            : language === 'en' 
              ? 'Registration successful. Please verify your email.'
              : 'Registrierung erfolgreich. Bitte bestätigen Sie Ihre E-Mail.'
        );
        
        // Redirigir después de 3 segundos
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch (error: any) {
      console.error("Error de registro:", error);
      
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
        {/* Sección izquierda - Decorativa (visible solo en pantallas grandes) */}
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

        {/* Sección derecha - Registro */}
        <div className="w-full lg:w-1/2 bg-white dark:bg-gray-900 flex flex-col justify-between p-6 lg:p-12 overflow-y-auto relative rounded-tl-[40px] rounded-bl-[40px]">
          {/* Elementos decorativos de fondo */}
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-700/25 bg-[size:20px_20px] opacity-[0.05]"></div>

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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-lg bg-red-50 dark:bg-red-900/50 p-3"
                    >
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <p className="text-sm text-red-500 dark:text-red-200">{message}</p>
                        </div>
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
          </div>
        </div>
      </div>

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