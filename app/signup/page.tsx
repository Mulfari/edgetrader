"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Loader2, AlertCircle, Calendar } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type React from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signUpWithEmail } from "@/lib/supabase";

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
    fullName: "Nombre",
    lastName: "Apellido",
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
      welcome: "Bienvenido a Mulfex Trader. Al usar nuestros servicios, aceptas estos términos. Por favor, léelos cuidadosamente.",
      usage: "1. Uso del Servicio: Debes seguir todas las políticas disponibles dentro de los Servicios.",
      privacy: "2. Privacidad: Nuestras políticas de privacidad explican cómo tratamos tus datos personales y protegemos tu privacidad cuando usas nuestros Servicios.",
      modifications: "3. Modificaciones: Podemos modificar estos términos o cualquier término adicional que aplique a un Servicio para, por ejemplo, reflejar cambios en la ley o en nuestros Servicios.",
      close: "Cerrar"
    },
    dateOfBirth: "Fecha de nacimiento",
    invalidDateOfBirth: "Debes tener al menos 18 años",
    dateFormat: "DD/MM/AAAA",
    leftSection: {
      userImprovement: "Mejora de Usuarios",
      monthlyProgress: "Progreso mensual",
      satisfaction: "Satisfacción",
      activeUsers: "Usuarios activos",
      testimonials: {
        designer: {
          name: "María González",
          role: "Diseñadora UX",
          quote: "La interfaz es increíblemente intuitiva y fácil de usar. Me encanta la simplicidad y el diseño moderno."
        },
        developer: {
          name: "Juan Rodríguez",
          role: "Desarrollador",
          quote: "La velocidad y eficiencia de la plataforma son excepcionales. El soporte técnico es muy profesional."
        }
      }
    }
  },
  en: {
    createAccount: "Create your account",
    fullName: "First Name",
    lastName: "Last Name",
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
      welcome: "Welcome to Mulfex Trader. By using our services, you accept these terms. Please read them carefully.",
      usage: "1. Service Usage: You must follow all policies available within the Services.",
      privacy: "2. Privacy: Our privacy policies explain how we handle your personal data and protect your privacy when using our Services.",
      modifications: "3. Modifications: We may modify these terms or any additional terms that apply to a Service to, for example, reflect changes in the law or our Services.",
      close: "Close"
    },
    dateOfBirth: "Date of birth",
    invalidDateOfBirth: "You must be at least 18 years old",
    dateFormat: "DD/MM/YYYY",
    leftSection: {
      userImprovement: "User Improvement",
      monthlyProgress: "Monthly progress",
      satisfaction: "Satisfaction",
      activeUsers: "Active users",
      testimonials: {
        designer: {
          name: "Mary González",
          role: "UX Designer",
          quote: "The interface is incredibly intuitive and easy to use. I love the simplicity and modern design."
        },
        developer: {
          name: "John Rodriguez",
          role: "Developer",
          quote: "The speed and efficiency of the platform are exceptional. The technical support is very professional."
        }
      }
    }
  },
  de: {
    createAccount: "Konto erstellen",
    fullName: "Vorname",
    lastName: "Nachname",
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
      welcome: "Willkommen bei Mulfex Trader. Mit der Nutzung unserer Dienste akzeptieren Sie diese Bedingungen. Bitte lesen Sie sie sorgfältig.",
      usage: "1. Nutzung des Dienstes: Sie müssen alle innerhalb der Dienste verfügbaren Richtlinien befolgen.",
      privacy: "2. Datenschutz: Unsere Datenschutzrichtlinien erklären, wie wir Ihre persönlichen Daten verarbeiten und Ihre Privatsphäre bei der Nutzung unserer Dienste schützen.",
      modifications: "3. Änderungen: Wir können diese Bedingungen oder zusätzliche Bedingungen, die für einen Dienst gelten, ändern, um beispielsweise Änderungen im Gesetz oder in unseren Diensten widerzuspiegeln.",
      close: "Schließen"
    },
    dateOfBirth: "Geburtsdatum",
    invalidDateOfBirth: "Sie müssen mindestens 18 Jahre alt sein",
    dateFormat: "TT/MM/JJJJ",
    leftSection: {
      userImprovement: "Benutzerverbesserung",
      monthlyProgress: "Monatlicher Fortschritt",
      satisfaction: "Zufriedenheit",
      activeUsers: "Aktive Benutzer",
      testimonials: {
        designer: {
          name: "Maria González",
          role: "UX-Designerin",
          quote: "Die Benutzeroberfläche ist unglaublich intuitiv und einfach zu bedienen. Ich liebe die Einfachheit und das moderne Design."
        },
        developer: {
          name: "Juan Rodríguez",
          role: "Entwickler",
          quote: "Die Geschwindigkeit und Effizienz der Plattform sind außergewöhnlich. Der technische Support ist sehr professionell."
        }
      }
    }
  }
};

// Función para verificar si un email es válido
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Función para verificar si una contraseña es válida
const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
};

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [name, setName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [touched, setTouched] = useState({
    name: false,
    lastName: false,
    email: false,
    password: false,
    confirmPassword: false,
    dateOfBirth: false,
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
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

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

  // Calcular la fecha máxima (18 años atrás)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split('T')[0];
  
  // Función para validar la edad (al menos 18 años)
  const validateAge = (dateString: string): boolean => {
    if (!dateString) return false;
    
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 18;
  };

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'name':
        return !value.trim() ? t.invalidName : "";
      case 'lastName':
        return !value.trim() ? t.invalidName : "";
      case 'email':
        return !value.trim() || !isValidEmail(value) 
          ? t.invalidEmail : "";
      case 'password':
        return !value || !isValidPassword(value)
          ? t.invalidPassword : "";
      case 'confirmPassword':
        return value !== password ? t.passwordsDontMatch : "";
      case 'dateOfBirth':
        return !value ? t.invalidDateOfBirth : !validateAge(value) ? t.invalidDateOfBirth : "";
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

  // Generar opciones para los selectores de fecha
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const months = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" }
  ];
  const monthLabels = {
    es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
  };
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - 18 - i));

  // Cerrar el selector de fecha al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [datePickerRef]);

  // Actualizar dateOfBirth cuando cambian los componentes individuales
  useEffect(() => {
    if (dobYear && dobMonth && dobDay) {
      setDateOfBirth(`${dobYear}-${dobMonth}-${dobDay}`);
      
      // Cerrar automáticamente el selector cuando se han seleccionado los 3 valores
      setTimeout(() => {
        setShowDatePicker(false);
      }, 300); // Pequeño retraso para permitir ver la selección antes de cerrar
    } else {
      setDateOfBirth("");
    }
  }, [dobDay, dobMonth, dobYear]);

  // Formatear fecha para mostrar
  const getFormattedDate = () => {
    if (!dobDay || !dobMonth || !dobYear) return "";
    
    // Asegurarse de que los valores tengan dos dígitos
    const day = dobDay.padStart(2, '0');
    const month = dobMonth.padStart(2, '0');
    
    // Devolver en formato DD/MM/YYYY
    return `${day}/${month}/${dobYear}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Marcar todos los campos como tocados para mostrar errores
    setTouched({
      name: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
      dateOfBirth: true,
      terms: true
    });

    // Validar todos los campos
    if (!name || name.length < 2) {
      setErrors(prev => ({ ...prev, name: t.invalidName }));
      return;
    }

    if (!lastName || lastName.length < 2) {
      setErrors(prev => ({ ...prev, lastName: t.invalidName }));
      return;
    }

    if (!isValidEmail(email)) {
      setErrors(prev => ({ ...prev, email: t.invalidEmail }));
      return;
    }

    if (!isValidPassword(password)) {
      setErrors(prev => ({ ...prev, password: t.invalidPassword }));
      return;
    }

    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: t.passwordsDontMatch }));
      return;
    }

    if (!agreedToTerms) {
      setErrors(prev => ({ ...prev, terms: t.acceptTerms }));
      return;
    }

    const formattedDate = getFormattedDate();
    if (!formattedDate) {
      setErrors(prev => ({ ...prev, dateOfBirth: t.invalidDateOfBirth }));
      return;
    }

    setIsLoading(true);
    setMessage("");
    setErrors({});

    try {
      const fullName = `${name} ${lastName}`.trim();
      const { user } = await signUpWithEmail(email, password, fullName, formattedDate);
      
      if (user) {
        setMessageType('success');
        setMessage('¡Registro exitoso! Por favor, verifica tu correo electrónico para confirmar tu cuenta.');
        setSuccess(true);
        
        // Iniciar cuenta regresiva para redirección
        let count = 5;
        setCountdown(count);
        const interval = setInterval(() => {
          count--;
          setCountdown(count);
          if (count === 0) {
            clearInterval(interval);
            router.push('/login');
          }
        }, 1000);
      }
    } catch (error: any) {
      setMessageType('error');
      console.error("Error detallado:", error);

      // Manejar diferentes tipos de errores
      if (error.message?.includes('User already registered') || 
          error.message?.includes('already exists') ||
          error.code === '23505') {
        setMessage('Este correo electrónico ya está registrado. Por favor, utiliza otro o inicia sesión.');
        setErrors(prev => ({ ...prev, email: 'Este correo electrónico ya está registrado' }));
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        setMessage('La contraseña debe tener al menos 6 caracteres.');
        setErrors(prev => ({ ...prev, password: 'La contraseña debe tener al menos 6 caracteres' }));
      } else if (error.message?.includes('Invalid email')) {
        setMessage('El formato del correo electrónico no es válido.');
        setErrors(prev => ({ ...prev, email: 'El formato del correo electrónico no es válido' }));
      } else if (error.message?.includes('rate limit')) {
        setMessage('Has excedido el límite de intentos. Por favor, espera unos minutos.');
      } else {
        setMessage(t.registrationError);
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
                    <h4 className="text-base font-semibold">{t.leftSection.userImprovement}</h4>
                    <p className="text-xs text-blue-50/80">{t.leftSection.monthlyProgress}</p>
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
                  <div className="text-xs text-blue-50/80">{t.leftSection.satisfaction}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-50">+10k</div>
                  <div className="text-xs text-blue-50/80">{t.leftSection.activeUsers}</div>
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
                      <p className="font-medium">{t.leftSection.testimonials.designer.name}</p>
                      <p className="text-sm text-blue-50/80">{t.leftSection.testimonials.designer.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-50 italic">
                    "{t.leftSection.testimonials.designer.quote}"
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
                      <p className="font-medium">{t.leftSection.testimonials.developer.name}</p>
                      <p className="text-sm text-blue-50/80">{t.leftSection.testimonials.developer.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-50 italic">
                    "{t.leftSection.testimonials.developer.quote}"
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
                    {/* Grid para nombre y apellido */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t.fullName}
                        </label>
                        <div className="mt-1 relative">
                          <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="given-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={() => handleBlur('name', name)}
                            className={`appearance-none block w-full px-3 py-2 border ${
                              errors.name && touched.name 
                                ? 'border-red-300 dark:border-red-600' 
                                : touched.name && name.trim().length >= 2
                                  ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-gray-800 dark:text-cyan-50 font-medium'
                                  : 'border-gray-300 dark:border-gray-600'
                            } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                              touched.name && name.trim().length >= 2
                                ? 'hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-md dark:hover:shadow-cyan-900/10' 
                                : 'hover:border-gray-400 dark:hover:border-gray-500'
                            } dark:bg-gray-700 dark:text-white`}
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
                            {touched.name && name.trim().length >= 2 && !errors.name && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
                              >
                                <svg className="h-5 w-5 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
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
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t.lastName}
                        </label>
                        <div className="mt-1 relative">
                          <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            autoComplete="family-name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            onBlur={() => handleBlur('lastName', lastName)}
                            className={`appearance-none block w-full px-3 py-2 border ${
                              errors.lastName && touched.lastName 
                                ? 'border-red-300 dark:border-red-600' 
                                : touched.lastName && lastName.trim().length >= 2
                                  ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-gray-800 dark:text-cyan-50 font-medium'
                                  : 'border-gray-300 dark:border-gray-600'
                            } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                              touched.lastName && lastName.trim().length >= 2
                                ? 'hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-md dark:hover:shadow-cyan-900/10' 
                                : 'hover:border-gray-400 dark:hover:border-gray-500'
                            } dark:bg-gray-700 dark:text-white`}
                          />
                          <AnimatePresence>
                            {errors.lastName && touched.lastName && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
                              >
                                <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                              </motion.div>
                            )}
                            {touched.lastName && lastName.trim().length >= 2 && !errors.lastName && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
                              >
                                <svg className="h-5 w-5 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <AnimatePresence>
                          {errors.lastName && touched.lastName && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-xs text-red-600 dark:text-red-500 mt-1"
                            >
                              {errors.lastName}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
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
                            errors.email && touched.email 
                              ? 'border-red-300 dark:border-red-600' 
                              : touched.email && isValidEmail(email)
                                ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-gray-800 dark:text-cyan-50 font-medium'
                                : 'border-gray-300 dark:border-gray-600'
                          } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                            touched.email && isValidEmail(email)
                              ? 'hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-md dark:hover:shadow-cyan-900/10' 
                              : 'hover:border-gray-400 dark:hover:border-gray-500'
                          } dark:bg-gray-700 dark:text-white`}
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
                          {touched.email && isValidEmail(email) && !errors.email && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
                            >
                              <svg className="h-5 w-5 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
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
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t.dateOfBirth}
                      </label>
                      <div className="mt-1 relative">
                        {/* Campo que muestra la fecha seleccionada */}
                        <div 
                          className={`flex items-center justify-between w-full px-3 py-2 border ${
                            errors.dateOfBirth && touched.dateOfBirth 
                              ? 'border-red-300 dark:border-red-600' 
                              : touched.dateOfBirth && dateOfBirth
                                ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-gray-800 dark:text-cyan-50 font-medium'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                          } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                            touched.dateOfBirth && dateOfBirth
                              ? 'hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-md dark:hover:shadow-cyan-900/10' 
                              : 'hover:border-gray-400 dark:hover:border-gray-500'
                          } text-gray-700 dark:text-gray-200 cursor-pointer active:scale-[0.98]`}
                          onClick={() => setShowDatePicker(!showDatePicker)}
                        >
                          <div>
                            <span className={`text-sm ${!dateOfBirth ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-cyan-50 font-medium'}`}>
                              {dateOfBirth ? getFormattedDate() : t.dateFormat}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className={`h-5 w-5 ${dateOfBirth ? 'text-cyan-600 dark:text-cyan-300' : 'text-gray-400 dark:text-gray-500'} transition-colors duration-200`} />
                          </div>
                        </div>
                        
                        {/* Selector de fecha desplegable */}
                        <AnimatePresence>
                          {showDatePicker && (
                            <motion.div
                              ref={datePickerRef}
                              initial={{ opacity: 0, y: -5, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -5, scale: 0.98 }}
                              transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 25 }}
                              className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-3 px-4"
                            >
                              <div className="grid grid-cols-3 gap-3">
                                {/* Selector de día */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'es' ? 'Día' : language === 'en' ? 'Day' : 'Tag'}</label>
                                  <div className="relative overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 h-28 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors duration-200 shadow-sm hover:shadow-md dark:hover:shadow-cyan-900/10">
                                    <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white dark:from-gray-800 to-transparent z-10 pointer-events-none"></div>
                                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white dark:from-gray-800 to-transparent z-10 pointer-events-none"></div>
                                    <div className="h-full overflow-y-auto custom-scrollbar px-2 py-10">
                                      {days.map(day => (
                                        <motion.div
                                          key={day}
                                          whileHover={{ scale: 1.08, translateX: 1 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => setDobDay(day)}
                                          className={`py-1 px-2 mb-1 text-center rounded-md cursor-pointer transition-all duration-200 ${
                                            dobDay === day 
                                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium shadow-sm'
                                              : 'hover:bg-cyan-50 dark:hover:bg-cyan-900/30 hover:text-cyan-600 dark:hover:text-cyan-300'
                                          }`}
                                        >
                                          {day}
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Selector de mes */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'es' ? 'Mes' : language === 'en' ? 'Month' : 'Monat'}</label>
                                  <div className="relative overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 h-28 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors duration-200 shadow-sm hover:shadow-md dark:hover:shadow-cyan-900/10">
                                    <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white dark:from-gray-800 to-transparent z-10 pointer-events-none"></div>
                                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white dark:from-gray-800 to-transparent z-10 pointer-events-none"></div>
                                    <div className="h-full overflow-y-auto custom-scrollbar px-2 py-10">
                                      {months.map(month => (
                                        <motion.div
                                          key={month.value}
                                          whileHover={{ scale: 1.08, translateX: 1 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => setDobMonth(month.value)}
                                          className={`py-1 px-2 mb-1 text-center rounded-md cursor-pointer transition-all duration-200 ${
                                            dobMonth === month.value
                                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium shadow-sm'
                                              : 'hover:bg-cyan-50 dark:hover:bg-cyan-900/30 hover:text-cyan-600 dark:hover:text-cyan-300'
                                          }`}
                                        >
                                          {language === 'es' ? month.label : month.value}
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Selector de año */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{language === 'es' ? 'Año' : language === 'en' ? 'Year' : 'Jahr'}</label>
                                  <div className="relative overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 h-28 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors duration-200 shadow-sm hover:shadow-md dark:hover:shadow-cyan-900/10">
                                    <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white dark:from-gray-800 to-transparent z-10 pointer-events-none"></div>
                                    <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white dark:from-gray-800 to-transparent z-10 pointer-events-none"></div>
                                    <div className="h-full overflow-y-auto custom-scrollbar px-2 py-10">
                                      {years.map(year => (
                                        <motion.div
                                          key={year}
                                          whileHover={{ scale: 1.08, translateX: 1 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => setDobYear(year)}
                                          className={`py-1 px-2 mb-1 text-center rounded-md cursor-pointer transition-all duration-200 ${
                                            dobYear === year
                                              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium shadow-sm'
                                              : 'hover:bg-cyan-50 dark:hover:bg-cyan-900/30 hover:text-cyan-600 dark:hover:text-cyan-300'
                                          }`}
                                        >
                                          {year}
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-3 flex justify-between">
                                <motion.button
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.98 }}
                                  type="button"
                                  onClick={() => {
                                    setDobDay("");
                                    setDobMonth("");
                                    setDobYear("");
                                  }}
                                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  {language === 'es' ? 'Limpiar' : language === 'en' ? 'Clear' : 'Löschen'}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.98 }}
                                  type="button"
                                  onClick={() => setShowDatePicker(false)}
                                  className="text-xs font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors px-2 py-1 rounded bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-900/20 dark:hover:bg-cyan-900/30"
                                >
                                  {language === 'es' ? 'Aceptar' : language === 'en' ? 'Accept' : 'Akzeptieren'}
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <AnimatePresence>
                          {errors.dateOfBirth && touched.dateOfBirth && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-xs text-red-600 dark:text-red-500 mt-1"
                            >
                              {errors.dateOfBirth}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
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
                            errors.password && touched.password 
                              ? 'border-red-300 dark:border-red-600' 
                              : touched.password && isValidPassword(password)
                                ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-gray-800 dark:text-cyan-50 font-medium'
                                : 'border-gray-300 dark:border-gray-600'
                          } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                            touched.password && isValidPassword(password)
                              ? 'hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-md dark:hover:shadow-cyan-900/10' 
                              : 'hover:border-gray-400 dark:hover:border-gray-500'
                          } dark:bg-gray-700 dark:text-white pr-10`}
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
                        {touched.password && isValidPassword(password) && !errors.password && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-y-0 right-10 flex items-center pointer-events-none"
                          >
                            <svg className="h-5 w-5 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        )}
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
                            errors.confirmPassword && touched.confirmPassword 
                              ? 'border-red-300 dark:border-red-600' 
                              : touched.confirmPassword && confirmPassword === password && password.length >= 8
                                ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-gray-800 dark:text-cyan-50 font-medium'
                                : 'border-gray-300 dark:border-gray-600'
                          } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                            touched.confirmPassword && confirmPassword === password && password.length >= 8
                              ? 'hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-md dark:hover:shadow-cyan-900/10' 
                              : 'hover:border-gray-400 dark:hover:border-gray-500'
                          } dark:bg-gray-700 dark:text-white pr-10`}
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
                        {touched.confirmPassword && confirmPassword === password && password.length >= 8 && !errors.confirmPassword && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-y-0 right-10 flex items-center pointer-events-none"
                          >
                            <svg className="h-5 w-5 text-cyan-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        )}
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

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.8);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(75, 85, 99, 0.8);
        }
      `}</style>
    </div>
  )
}