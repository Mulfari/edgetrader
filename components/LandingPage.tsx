"use client"

import Link from "next/link"
import { ArrowRight, Menu, X, Play, Check, Star, ArrowUp, Globe } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import Image from "next/image";

type Language = 'es' | 'en' | 'de';

type TranslationType = {
  [K in Language]: {
    features: string;
    pricingLink: string;
    start: string;
    login: string;
    signup: string;
    hero: {
      title: string;
      subtitle: string;
      startNow: string;
      comingSoon: string;
    };
    mainFeatures: {
      title: string;
      subtitle: string;
      items: Array<{
        title: string;
        description: string;
        icon: string;
      }>;
    };
    testimonials: {
      title: string;
      subtitle: string;
      items: Array<{
        name: string;
        role: string;
        quote: string;
      }>;
      closeButton: string;
    };
    pricing: {
      title: string;
      subtitle: string;
      mostPopular: string;
      annual: string;
      monthly: string;
      save: string;
      startNow: string;
      yearlyPrice: string;
      monthlyPrice: string;
      perMonth: string;
      perYear: string;
      billed: string;
      features: string[];
    };
    faq: {
      title: string;
      items: Array<{
        question: string;
        answer: string;
      }>;
    };
    cta: {
      title: string;
      subtitle: string;
      button: string;
    };
    footer: {
      description: string;
      legal: {
        title: string;
        privacy: string;
        terms: string;
        cookies: string;
        about: string;
        contact: string;
      };
      rights: string;
    };
    videoModal: {
      description: string;
    };
    howItWorks: {
      title: string;
      subtitle: string;
      steps: Array<{
        title: string;
        description: string;
        icon: string;
      }>;
    };
  };
};

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [currentFeature, setCurrentFeature] = useState(0)
  const [language, setLanguage] = useState<Language>('es')
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [annualBilling, setAnnualBilling] = useState(false)
  const [showCookieMessage, setShowCookieMessage] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)
  
  const languageMenuRef = useRef<HTMLDivElement>(null)

  // Efecto para cargar el idioma guardado al iniciar
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language
    if (savedLanguage && ['es', 'en', 'de'].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    } else {
      // Si no hay idioma guardado, intentamos detectar el idioma del navegador
      const browserLanguage = navigator.language.toLowerCase()
      if (browserLanguage.startsWith('es')) {
        setLanguage('es')
      } else if (browserLanguage.startsWith('de')) {
        setLanguage('de')
      } else {
        setLanguage('en')
      }
    }

    // Verificar si el usuario ya aceptó las cookies
    const cookiesAccepted = localStorage.getItem('cookiesAccepted')
    if (cookiesAccepted) {
      setShowCookieMessage(false)
    }
  }, [])

  // Efecto para guardar el idioma cuando cambie
  useEffect(() => {
    localStorage.setItem('preferredLanguage', language)
  }, [language])

  // Función para aceptar cookies
  const acceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true')
    setShowCookieMessage(false)
  }

  const languageIcons = {
    es: '🇪🇸',
    en: '🇬🇧',
    de: '🇩🇪'
  }

  const languageNames = {
    es: 'Español',
    en: 'English',
    de: 'Deutsch'
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const translations: TranslationType = {
    es: {
      features: 'Características',
      pricingLink: 'Precios',
      start: 'Comenzar',
      login: 'Iniciar sesión',
      signup: 'Registrarse',
      hero: {
        title: 'Trading Inteligente con',
        subtitle: 'Potencia tus operaciones con análisis avanzado, señales en tiempo real y gestión de riesgo inteligente.',
        startNow: 'Empezar Ahora',
        comingSoon: 'Próximamente'
      },
      mainFeatures: {
        title: 'Características Principales',
        subtitle: 'Todo lo que necesitas para el trading profesional',
        items: [
          {
            title: "Análisis Avanzado",
            description: "Herramientas de análisis técnico y fundamental con inteligencia artificial.",
            icon: "📊"
          },
          {
            title: "Señales en Tiempo Real",
            description: "Recibe alertas y señales de trading basadas en análisis de mercado.",
            icon: "⚡"
          },
          {
            title: "Gestión de Riesgo",
            description: "Optimiza tus operaciones con gestión de riesgo automatizada.",
            icon: "🛡️"
          },
          {
            title: "Multi-Exchange",
            description: "Opera en múltiples exchanges desde una sola plataforma.",
            icon: "🔄"
          },
          {
            title: "Portfolio Tracking",
            description: "Seguimiento detallado de tu portfolio con métricas avanzadas.",
            icon: "📈"
          },
          {
            title: "Soporte 24/7",
            description: "Asistencia técnica y soporte personalizado cuando lo necesites.",
            icon: "🎯"
          }
        ]
      },
      testimonials: {
        title: "Lo que dicen nuestros usuarios",
        subtitle: "Traders que han transformado sus resultados con TradingDash",
        items: [
          {
            name: "Juan Pérez",
            role: "Trader Profesional",
            quote: "TradingDash ha revolucionado completamente mi forma de operar. ¡Altamente recomendado!"
          },
          {
            name: "María García",
            role: "Gestora de Fondos",
            quote: "Las características que ofrece TradingDash son incomparables. Es un cambio radical para nuestro equipo."
          },
          {
            name: "Carlos Rodríguez",
            role: "Analista de Mercados",
            quote: "No puedo imaginar gestionar mis operaciones sin TradingDash. Es intuitivo y potente."
          }
        ],
        closeButton: "Cerrar"
      },
      pricing: {
        title: "Plan de Membresía",
        subtitle: "Accede a todas las funciones con nuestra membresía única",
        mostPopular: "Más Popular",
        annual: "Anual",
        monthly: "Mensual",
        save: "Ahorra 20%",
        startNow: "Empezar Ahora",
        yearlyPrice: "16,66€",
        monthlyPrice: "19,99€",
        perMonth: "/mes",
        perYear: "/mes",
        billed: "facturado anualmente (199,90€)",
        features: [
          "Análisis técnico avanzado",
          "Alertas ilimitadas",
          "Señales en tiempo real",
          "Gestión de riesgo inteligente",
          "Múltiples exchanges conectados",
          "Soporte prioritario 24/7",
          "Actualizaciones gratuitas",
          "Acceso a nuevas funcionalidades"
        ]
      },
      faq: {
        title: "Preguntas Frecuentes",
        items: [
          {
            question: "¿Qué es TradingDash?",
            answer: "TradingDash es una plataforma integral de trading que combina análisis técnico avanzado, señales en tiempo real y gestión de riesgo automatizada para optimizar tus operaciones."
          },
          {
            question: "¿Cómo funciona el sistema de precios?",
            answer: "Ofrecemos planes flexibles que se adaptan a diferentes niveles de trading. Los planes comienzan desde 29€/mes para funciones básicas, con soluciones personalizadas para enterprise."
          },
          {
            question: "¿Hay periodo de prueba gratuito?",
            answer: "Sí, ofrecemos 14 días de prueba gratuita en todos nuestros planes. No se requiere tarjeta de crédito para comenzar."
          },
          {
            question: "¿Puedo cancelar mi suscripción en cualquier momento?",
            answer: "Puedes cancelar tu suscripción cuando quieras. No creemos en contratos a largo plazo ni en cargos ocultos."
          }
        ]
      },
      cta: {
        title: "¿Listo para revolucionar tu trading?",
        subtitle: "Únete a miles de traders que ya están mejorando sus resultados con TradingDash",
        button: "Comenzar Gratis"
      },
      footer: {
        description: "Plataforma líder en análisis y gestión de trading",
        legal: {
          title: "Legal y Compañía",
          privacy: "Privacidad",
          terms: "Términos",
          cookies: "Cookies",
          about: "Sobre Nosotros",
          contact: "Contacto"
        },
        rights: "Todos los derechos reservados."
      },
      videoModal: {
        description: "Estamos trabajando en un video demostrativo que muestre todas las características de nuestra plataforma. ¡Vuelve pronto para verlo!"
      },
      howItWorks: {
        title: "Cómo Funciona",
        subtitle: "Comienza a operar de manera más inteligente en simples pasos",
        steps: [
          {
            title: "Regístrate",
            description: "Crea tu cuenta en menos de 2 minutos y accede a tu periodo de prueba gratuito de 14 días.",
            icon: "🔐"
          },
          {
            title: "Conecta tus exchanges",
            description: "Integra tus exchanges favoritos de forma segura usando API Keys en modo lectura.",
            icon: "🔄"
          },
          {
            title: "Configura tus alertas",
            description: "Personaliza alertas de precio y condiciones de mercado según tus estrategias.",
            icon: "⚡"
          },
          {
            title: "Analiza y opera",
            description: "Utiliza nuestras herramientas avanzadas para tomar decisiones más inteligentes.",
            icon: "📈"
          }
        ]
      }
    },
    en: {
      features: 'Features',
      pricingLink: 'Pricing',
      start: 'Start',
      login: 'Log in',
      signup: 'Sign up',
      hero: {
        title: 'Smart Trading with',
        subtitle: 'Power up your operations with advanced analysis, real-time signals and intelligent risk management.',
        startNow: 'Start Now',
        comingSoon: 'Coming Soon'
      },
      mainFeatures: {
        title: 'Main Features',
        subtitle: 'Everything you need for professional trading',
        items: [
          {
            title: "Advanced Analysis",
            description: "Technical and fundamental analysis tools powered by artificial intelligence.",
            icon: "📊"
          },
          {
            title: "Real-time Signals",
            description: "Receive alerts and trading signals based on market analysis.",
            icon: "⚡"
          },
          {
            title: "Risk Management",
            description: "Optimize your operations with automated risk management.",
            icon: "🛡️"
          },
          {
            title: "Multi-Exchange",
            description: "Trade on multiple exchanges from a single platform.",
            icon: "🔄"
          },
          {
            title: "Portfolio Tracking",
            description: "Detailed portfolio tracking with advanced metrics.",
            icon: "📈"
          },
          {
            title: "24/7 Support",
            description: "Technical assistance and personalized support when you need it.",
            icon: "🎯"
          }
        ]
      },
      testimonials: {
        title: "What our users say",
        subtitle: "Traders who have transformed their results with TradingDash",
        items: [
          {
            name: "John Smith",
            role: "Professional Trader",
            quote: "TradingDash has completely revolutionized the way I trade. Highly recommended!"
          },
          {
            name: "Mary Johnson",
            role: "Fund Manager",
            quote: "The features offered by TradingDash are unmatched. It's a game-changer for our team."
          },
          {
            name: "Robert Wilson",
            role: "Market Analyst",
            quote: "I can't imagine managing my operations without TradingDash. It's intuitive and powerful."
          }
        ],
        closeButton: "Close"
      },
      pricing: {
        title: "Membership Plan",
        subtitle: "Access all features with our single membership",
        mostPopular: "Most Popular",
        annual: "Annual",
        monthly: "Monthly",
        save: "Save 20%",
        startNow: "Start Now",
        yearlyPrice: "€16.66",
        monthlyPrice: "€19.99",
        perMonth: "/month",
        perYear: "/month",
        billed: "billed annually (€199.90)",
        features: [
          "Advanced technical analysis",
          "Unlimited alerts",
          "Real-time signals",
          "Intelligent risk management",
          "Multiple exchanges connected",
          "24/7 Priority support",
          "Free updates",
          "Access to new features"
        ]
      },
      faq: {
        title: "Frequently Asked Questions",
        items: [
          {
            question: "What is TradingDash?",
            answer: "TradingDash is a comprehensive trading platform that combines advanced technical analysis, real-time signals, and automated risk management to optimize your operations."
          },
          {
            question: "How does the pricing system work?",
            answer: "We offer flexible plans that adapt to different trading levels. Plans start from €29/month for basic features, with custom solutions for enterprise."
          },
          {
            question: "Is there a free trial?",
            answer: "Yes, we offer a 14-day free trial on all our plans. No credit card required to start."
          },
          {
            question: "Can I cancel my subscription at any time?",
            answer: "You can cancel your subscription whenever you want. We don't believe in long-term contracts or hidden charges."
          }
        ]
      },
      cta: {
        title: "Ready to revolutionize your trading?",
        subtitle: "Join thousands of traders who are already improving their results with TradingDash",
        button: "Start Free"
      },
      footer: {
        description: "Leading platform in trading analysis and management",
        legal: {
          title: "Legal & Company",
          privacy: "Privacy",
          terms: "Terms",
          cookies: "Cookies",
          about: "About Us",
          contact: "Contact"
        },
        rights: "All rights reserved."
      },
      videoModal: {
        description: "We're working on a demo video showcasing all the features of our platform. Check back soon!"
      },
      howItWorks: {
        title: "How It Works",
        subtitle: "Start trading smarter in simple steps",
        steps: [
          {
            title: "Sign up",
            description: "Create your account in less than 2 minutes and access your 14-day free trial.",
            icon: "🔐"
          },
          {
            title: "Connect your exchanges",
            description: "Integrate your favorite exchanges securely using read-only API Keys.",
            icon: "🔄"
          },
          {
            title: "Set up alerts",
            description: "Customize price alerts and market conditions based on your strategies.",
            icon: "⚡"
          },
          {
            title: "Analyze and trade",
            description: "Use our advanced tools to make smarter trading decisions.",
            icon: "📈"
          }
        ]
      }
    },
    de: {
      features: 'Funktionen',
      pricingLink: 'Preise',
      start: 'Starten',
      login: 'Anmelden',
      signup: 'Registrieren',
      hero: {
        title: 'Intelligentes Trading mit',
        subtitle: 'Optimieren Sie Ihre Trades mit fortschrittlicher Analyse, Echtzeit-Signalen und intelligentem Risikomanagement.',
        startNow: 'Jetzt Starten',
        comingSoon: 'Demnächst'
      },
      mainFeatures: {
        title: 'Hauptfunktionen',
        subtitle: 'Alles was Sie für professionelles Trading brauchen',
        items: [
          {
            title: "Fortgeschrittene Analyse",
            description: "Technische und fundamentale Analysetools mit künstlicher Intelligenz.",
            icon: "📊"
          },
          {
            title: "Echtzeit-Signale",
            description: "Erhalten Sie Warnungen und Handelssignale basierend auf Marktanalysen.",
            icon: "⚡"
          },
          {
            title: "Risikomanagement",
            description: "Optimieren Sie Ihre Operationen mit automatisiertem Risikomanagement.",
            icon: "🛡️"
          },
          {
            title: "Multi-Börse",
            description: "Handeln Sie an mehreren Börsen von einer einzigen Plattform aus.",
            icon: "🔄"
          },
          {
            title: "Portfolio-Tracking",
            description: "Detaillierte Portfolio-Verfolgung mit erweiterten Metriken.",
            icon: "📈"
          },
          {
            title: "24/7 Support",
            description: "Technische Unterstützung und persönlicher Support wenn Sie ihn brauchen.",
            icon: "🎯"
          }
        ]
      },
      testimonials: {
        title: "Was unsere Nutzer sagen",
        subtitle: "Trader, die ihre Ergebnisse mit TradingDash transformiert haben",
        items: [
          {
            name: "Hans Schmidt",
            role: "Professioneller Trader",
            quote: "TradingDash hat meine Art zu handeln komplett revolutioniert. Sehr empfehlenswert!"
          },
          {
            name: "Maria Weber",
            role: "Fondsmanagerin",
            quote: "Die Funktionen von TradingDash sind unvergleichlich. Ein echter Durchbruch für unser Team."
          },
          {
            name: "Karl Fischer",
            role: "Marktanalyst",
            quote: "Ich kann mir nicht vorstellen, meine Operationen ohne TradingDash zu verwalten. Es ist intuitiv und leistungsstark."
          }
        ],
        closeButton: "Schließen"
      },
      pricing: {
        title: "Mitgliedschaftsplan",
        subtitle: "Zugriff auf alle Funktionen mit unserer einzigen Mitgliedschaft",
        mostPopular: "Beliebteste",
        annual: "Jährlich",
        monthly: "Monatlich",
        save: "Sparen Sie 20%",
        startNow: "Jetzt Starten",
        yearlyPrice: "16,66€",
        monthlyPrice: "19,99€",
        perMonth: "/Monat",
        perYear: "/Monat",
        billed: "jährlich abgerechnet (199,90€)",
        features: [
          "Erweiterte technische Analyse",
          "Unbegrenzte Warnungen",
          "Echtzeit-Signale",
          "Intelligentes Risikomanagement",
          "Mehrere Börsen verbunden",
          "24/7 Prioritäts-Support",
          "Kostenlose Updates",
          "Zugang zu neuen Funktionen"
        ]
      },
      faq: {
        title: "Häufig gestellte Fragen",
        items: [
          {
            question: "Was ist TradingDash?",
            answer: "TradingDash ist eine umfassende Handelsplattform, die fortschrittliche technische Analyse, Echtzeit-Signale und automatisiertes Risikomanagement kombiniert, um Ihre Operationen zu optimieren."
          },
          {
            question: "Wie funktioniert das Preissystem?",
            answer: "Wir bieten flexible Pläne, die sich an verschiedene Handelsstufen anpassen. Die Pläne beginnen bei 29€/Monat für Basisfunktionen, mit individuellen Lösungen für Unternehmen."
          },
          {
            question: "Gibt es eine kostenlose Testversion?",
            answer: "Ja, wir bieten eine 14-tägige kostenlose Testversion für alle unsere Pläne an. Keine Kreditkarte erforderlich."
          },
          {
            question: "Kann ich mein Abonnement jederzeit kündigen?",
            answer: "Sie können Ihr Abonnement jederzeit kündigen. Wir glauben nicht an langfristige Verträge oder versteckte Gebühren."
          }
        ]
      },
      cta: {
        title: "Bereit, Ihr Trading zu revolutionieren?",
        subtitle: "Schließen Sie sich Tausenden von Tradern an, die ihre Ergebnisse bereits mit TradingDash verbessern",
        button: "Kostenlos Starten"
      },
      footer: {
        description: "Führende Plattform für Handelsanalyse und -management",
        legal: {
          title: "Rechtliches & Unternehmen",
          privacy: "Datenschutz",
          terms: "AGB",
          cookies: "Cookies",
          about: "Über uns",
          contact: "Kontakt"
        },
        rights: "Alle Rechte vorbehalten."
      },
      videoModal: {
        description: "Wir arbeiten an einem Demo-Video, das alle Funktionen unserer Plattform zeigt. Schauen Sie bald wieder vorbei!"
      },
      howItWorks: {
        title: "Wie es funktioniert",
        subtitle: "Beginnen Sie in einfachen Schritten intelligenter zu handeln",
        steps: [
          {
            title: "Registrieren",
            description: "Erstellen Sie Ihr Konto in weniger als 2 Minuten und greifen Sie auf Ihre 14-tägige kostenlose Testversion zu.",
            icon: "🔐"
          },
          {
            title: "Verbinden Sie Ihre Börsen",
            description: "Integrieren Sie Ihre Lieblingsbörsen sicher mit API-Schlüsseln im Nur-Lese-Modus.",
            icon: "🔄"
          },
          {
            title: "Alarme einrichten",
            description: "Passen Sie Preisalarme und Marktbedingungen auf der Grundlage Ihrer Strategien an.",
            icon: "⚡"
          },
          {
            title: "Analysieren und handeln",
            description: "Nutzen Sie unsere fortschrittlichen Tools, um intelligentere Handelsentscheidungen zu treffen.",
            icon: "📈"
          }
        ]
      }
    }
  }

  const t = translations[language]

  const heroRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
      setShowScrollTop(window.scrollY > 500)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  
  const testimonials = [
    {
      name: "Juan Pérez",
      role: "Trader Profesional",
      quote: "TradingDash ha revolucionado completamente mi forma de operar. ¡Altamente recomendado!",
      avatar: "/placeholder.svg",
      rating: 5,
    },
    {
      name: "María García",
      role: "Gestora de Fondos",
      quote: "Las características que ofrece TradingDash son incomparables. Es un cambio radical para nuestro equipo.",
      avatar: "/placeholder.svg",
      rating: 5,
    },
    {
      name: "Carlos Rodríguez",
      role: "Analista de Mercados",
      quote: "No puedo imaginar gestionar mis operaciones sin TradingDash. Es intuitivo y potente.",
      avatar: "/placeholder.svg",
      rating: 4,
    },
  ]

  useEffect(() => {
    const testimonialsLength = testimonials.length;
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonialsLength);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  useEffect(() => {
    const featuresLength = t.mainFeatures.items.length;
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % featuresLength);
    }, 5000);
    return () => clearInterval(interval);
  }, [t.mainFeatures.items.length]);

  const faqItems = [
    {
      question: "¿Qué es TradingDash?",
      answer: "TradingDash es una plataforma integral de trading que combina análisis técnico avanzado, señales en tiempo real y gestión de riesgo automatizada para optimizar tus operaciones.",
    },
    {
      question: "¿Cómo funciona el sistema de precios?",
      answer: "Ofrecemos planes flexibles que se adaptan a diferentes niveles de trading. Los planes comienzan desde 29€/mes para funciones básicas, con soluciones personalizadas para enterprise.",
    },
    {
      question: "¿Hay periodo de prueba gratuito?",
      answer: "Sí, ofrecemos 14 días de prueba gratuita en todos nuestros planes. No se requiere tarjeta de crédito para comenzar.",
    },
    {
      question: "¿Puedo cancelar mi suscripción en cualquier momento?",
      answer: "Puedes cancelar tu suscripción cuando quieras. No creemos en contratos a largo plazo ni en cargos ocultos.",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-lg" 
            : "bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-xl text-white">📈</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">
                TradingDash
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="#features" className="text-gray-600 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400">
                {t.features}
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 text-cyan-600 dark:text-cyan-400 border border-cyan-500 dark:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-all duration-300"
              >
                {t.login}
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
              >
                {t.signup}
              </Link>
              <div className="relative" ref={languageMenuRef}>
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center space-x-2 group"
                >
                  <Globe className="h-4 w-4 text-cyan-500 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium">{languageNames[language]}</span>
                </button>
                {showLanguageMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[160px] border border-gray-100 dark:border-gray-700 backdrop-blur-sm">
                    {(['es', 'en', 'de'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                          setShowLanguageMenu(false);
                          localStorage.setItem('preferredLanguage', lang);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors duration-200 ${
                          language === lang 
                            ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 font-medium' 
                            : 'text-gray-600 dark:text-gray-300'
                        } flex items-center justify-between`}
                      >
                        <span>{languageNames[lang]}</span>
                        {language === lang && (
                          <Check className="h-4 w-4 text-cyan-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="px-2 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center space-x-2 group"
                >
                  <Globe className="h-4 w-4 text-cyan-500 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium">{languageNames[language]}</span>
                </button>
                {showLanguageMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[160px] border border-gray-100 dark:border-gray-700 backdrop-blur-sm">
                    {(['es', 'en', 'de'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                          setShowLanguageMenu(false);
                          localStorage.setItem('preferredLanguage', lang);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors duration-200 ${
                          language === lang 
                            ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 font-medium' 
                            : 'text-gray-600 dark:text-gray-300'
                        } flex items-center justify-between`}
                      >
                        <span>{languageNames[lang]}</span>
                        {language === lang && (
                          <Check className="h-4 w-4 text-cyan-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
          >
            <nav className="container mx-auto px-4 py-3 flex flex-col space-y-3">
              <Link
                href="#features"
                className="text-gray-600 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.features}
              </Link>
              <Link
                href="/login"
                className="w-full py-2 text-center text-cyan-600 dark:text-cyan-400 border border-cyan-500 dark:border-cyan-400 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.login}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* Hero Section */}
        <section ref={heroRef} className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-8">
                <span className="block text-gray-900 dark:text-white mb-4">
                  {t.hero.title}
                </span>
                <span 
                  className="block bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 pb-3"
                  style={{ 
                    textShadow: "0 2px 4px rgba(0,0,0,0.1)", 
                    letterSpacing: "-0.015em",
                    padding: "0.1em 0",
                    lineHeight: "1.2" 
                  }}
                >
                  TradingDash
                </span>
              </h1>
              <p className="mt-6 text-xl leading-relaxed text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {t.hero.subtitle}
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {t.hero.startNow}
                  <ArrowRight className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
                </Link>
                <button
                  onClick={() => setShowVideo(true)}
                  className="inline-flex items-center px-8 py-3 border-2 border-cyan-500 text-base font-medium rounded-xl text-cyan-600 dark:text-cyan-400 bg-transparent hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all duration-300 transform hover:scale-105"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {t.hero.comingSoon}
                </button>
              </div>
            </motion.div>
          </div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 dark:opacity-20" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-800 to-transparent" />
        </section>

        {/* Video Modal */}
        <AnimatePresence>
          {showVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVideo(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-3xl w-full"
              >
                <div className="relative flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-br from-cyan-500/10 to-blue-600/10 dark:from-cyan-500/20 dark:to-blue-600/20 rounded-xl p-8">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 dark:opacity-20 rounded-xl" />
                  
                  <h3 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 mb-4">
                    {t.hero.comingSoon}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-center mb-6 max-w-md">
                    {t.videoModal.description}
                  </p>
                  
                  <div className="flex items-center justify-center space-x-2 text-cyan-500 dark:text-cyan-400 animate-pulse">
                    <div className="w-3 h-3 rounded-full bg-cyan-500 dark:bg-cyan-400"></div>
                    <div className="w-3 h-3 rounded-full bg-cyan-500 dark:bg-cyan-400 animation-delay-200"></div>
                    <div className="w-3 h-3 rounded-full bg-cyan-500 dark:bg-cyan-400 animation-delay-500"></div>
                  </div>
                </div>
                
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setShowVideo(false)}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    {t.testimonials.closeButton}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Versión móvil */}
            <div className="md:hidden">
              <motion.div
                key={currentFeature}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-50 dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 hover:border-cyan-100 dark:hover:border-cyan-900/30 group"
              >
                <div className="text-4xl mb-4 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 p-4 rounded-xl inline-block group-hover:from-cyan-500/20 group-hover:to-blue-600/20 transition-all duration-300">
                  {t.mainFeatures.items[currentFeature].icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t.mainFeatures.items[currentFeature].title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t.mainFeatures.items[currentFeature].description}
                </p>
                <div className="flex justify-center mt-6 space-x-2">
                  {t.mainFeatures.items.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentFeature(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentFeature 
                          ? 'bg-cyan-500 w-4' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      aria-label={`Ver característica ${index + 1}`}
                    />
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Versión desktop */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
              {t.mainFeatures.items.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gray-50 dark:bg-gray-900 p-8 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 dark:border-gray-800 hover:border-cyan-100 dark:hover:border-cyan-900/30 group"
                >
                  <div className="text-4xl mb-4 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 p-4 rounded-xl inline-block group-hover:from-cyan-500/20 group-hover:to-blue-600/20 transition-all duration-300">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 dark:opacity-10" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                {t.howItWorks.title}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {t.howItWorks.subtitle}
              </p>
            </motion.div>
            
            <div className="relative max-w-5xl mx-auto">
              {/* Connecting Line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 transform -translate-y-1/2 hidden md:block" />
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {t.howItWorks.steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                    className="relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 text-center group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full p-3 text-white w-12 h-12 flex items-center justify-center z-10">
                      <span className="text-xl">{index + 1}</span>
                    </div>
                    <div className="mt-5 mb-4">
                      <div className="text-4xl mb-4 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 p-4 rounded-xl inline-block group-hover:from-cyan-500/20 group-hover:to-blue-600/20 transition-all duration-300">{step.icon}</div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {step.description}
                    </p>
                </motion.div>
              ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 dark:opacity-10" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                {t.testimonials.title}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t.testimonials.subtitle}
              </p>
            </motion.div>
            <div className="max-w-4xl mx-auto">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl flex flex-col items-center text-center border border-gray-100 dark:border-gray-700"
              >
                <div className="relative mb-6">
                  <Image
                    src={testimonials[currentTestimonial].avatar}
                    alt={t.testimonials.items[currentTestimonial].name}
                    width={100}
                    height={100}
                    className="w-24 h-24 rounded-full object-cover border-4 border-cyan-500"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full p-2">
                    <Star className="h-4 w-4 text-white" fill="currentColor" />
                  </div>
                </div>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 italic">
                  &ldquo;{t.testimonials.items[currentTestimonial].quote}&rdquo;
                </p>
                <div className="font-medium text-gray-900 dark:text-white text-lg">
                  {t.testimonials.items[currentTestimonial].name}
                </div>
                <div className="text-cyan-600 dark:text-cyan-400">
                  {t.testimonials.items[currentTestimonial].role}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 dark:opacity-10" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-12">
              {t.faq.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              {t.faq.items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 h-full flex flex-col"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-start">
                    <span className="text-cyan-500 mr-2 shrink-0">Q:</span>
                    <span>{item.question}</span>
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 pl-6 mt-auto">
                    <span className="text-cyan-500 mr-2">A:</span>
                    <span>{item.answer}</span>
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-20 bg-gradient-to-r from-cyan-500 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
          <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-[2px]"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl mb-6">
                {t.cta.title}
              </h2>
              <p className="text-xl text-blue-50 mb-8">
                {t.cta.subtitle}
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center px-8 py-3 border-2 border-white text-lg font-medium rounded-xl text-white hover:bg-white hover:text-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30"
              >
                {t.cta.button}
                <ArrowRight className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="max-w-lg">
              <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">
                TradingDash
              </Link>
              <p className="mt-4 text-gray-400">
                {t.footer.description}
              </p>
            </div>
            <div className="flex justify-end">
              <div className="w-full max-w-xs">
                <h3 className="text-lg font-semibold mb-4 text-white">
                  {t.footer.legal.title}
                </h3>
              <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.legal.privacy}</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.legal.terms}</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.legal.cookies}</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.legal.about}</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.legal.contact}</Link></li>
              </ul>
            </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© {new Date().getFullYear()} TradingDash. {t.footer.rights}</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-8 right-8 p-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl dark:shadow-cyan-500/20 transition-all duration-300 z-30 transform hover:scale-110 group"
            aria-label="Volver arriba"
          >
            <ArrowUp className="h-5 w-5 group-hover:-translate-y-1 transition-transform duration-300" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cookie Message */}
      <AnimatePresence>
        {showCookieMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 shadow-lg z-50 border-t border-gray-700"
          >
            <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="max-w-3xl">
                <h4 className="font-medium text-cyan-300 mb-1 text-base">Política de Cookies</h4>
                <p className="text-sm text-gray-200">
                  {language === 'es' && (
                    <>
                      Utilizamos cookies para mejorar tu experiencia en nuestra plataforma. Al continuar navegando, aceptas el uso de cookies de acuerdo con nuestra política.{' '}
                      <Link href="#" className="text-gray-300 hover:text-white underline">
                        Más información
                      </Link>
                    </>
                  )}
                  {language === 'en' && (
                    <>
                      We use cookies to enhance your experience on our platform. By continuing to browse, you agree to the use of cookies in accordance with our policy.{' '}
                      <Link href="#" className="text-gray-300 hover:text-white underline">
                        More info
                      </Link>
                    </>
                  )}
                  {language === 'de' && (
                    <>
                      Wir verwenden Cookies, um Ihre Erfahrung auf unserer Plattform zu verbessern. Durch die weitere Nutzung stimmen Sie der Verwendung von Cookies gemäß unserer Richtlinie zu.{' '}
                      <Link href="#" className="text-gray-300 hover:text-white underline">
                        Mehr Informationen
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <div>
                <button
                  onClick={acceptCookies}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg whitespace-nowrap"
                >
                  {language === 'es' && "Aceptar cookies"}
                  {language === 'en' && "Accept cookies"}
                  {language === 'de' && "Cookies akzeptieren"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}