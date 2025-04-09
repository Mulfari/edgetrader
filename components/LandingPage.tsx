"use client"

import Link from "next/link"
import { ArrowRight, Menu, X, Play, Check, Star, ArrowUp, Globe, ChevronDown, Layers } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import Image from "next/image";
// @ts-ignore
import { scaleTime, scaleLinear, line as d3line, max, area as d3area, curveMonotoneX } from "d3";
import React from "react";

import HeroSection from "./HeroSection"
import CryptoTickerBar from "./CryptoTickerBar"

// Estilos adicionales para animaciones
const animationStyles = `
@keyframes gradientBg {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

@keyframes move-diagonal {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(10px, 10px);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%);
  background-size: 200% 100%;
  animation: shimmer 3s infinite;
}

.animate-rotate {
  animation: rotate 20s linear infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 4s ease-in-out infinite;
}

.animate-diagonal {
  animation: move-diagonal 15s infinite alternate;
}

.animate-gradient {
  animation: gradientBg 25s ease infinite;
  background-size: 200% 200%;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-marquee {
  animation: marquee 25s linear infinite;
  width: fit-content;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

.animation-delay-1000 {
  animation-delay: 1s;
}

.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.dark .glass-card {
  background: rgba(17, 25, 40, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.125);
}
`;

type Language = 'es' | 'en' | 'de';

type TranslationType = {
  [K in Language]: {
    features: string;
    pricingLink: string;
    start: string;
    login: string;
    signup: string;
    aiPowered: string; // Nuevo texto para la sección de IA
    hero: {
      title: string;
      subtitle: string;
      startNow: string;
      comingSoon: string;
      activeUsers: string; // Para estadísticas en hero
      resultsImprovement: string;
      support: string;
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
      subtitle: string; // Nuevo para el subtítulo de FAQ
      items: Array<{
        question: string;
        answer: string;
      }>;
      moreQuestions: string; // Nuevo para preguntas adicionales
      contactUs: string; // Enlace de contacto
    };
    cta: {
      title: string;
      subtitle: string;
      button: string;
      noCreditCard: string; // Nuevos textos para la sección CTA
      freeTrial: string;
      easyCancel: string;
      daysFreeTrial: string;
    };
    footer: {
      description: string;
      newsletter: string; // Nuevos textos para el footer
      newsletterPlaceholder: string;
      newsletterButton: string;
      quickLinks: string;
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
      stepLabel: string; // Para la etiqueta "Paso X"
      steps: Array<{
        title: string;
        description: string;
        icon: string;
      }>;
    };
    usedByTraders: string; // Para la sección "Utilizado por traders de"
    language: string; // Para la etiqueta de idioma
  };
};

const languageFlags = {
  es: '/icons/flag-es.svg',
  en: '/icons/flag-en.svg',
  de: '/icons/flag-de.svg'
}

// Datos para el gráfico
interface ChartData {
  date: string;
  value: number;
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [currentFeature, setCurrentFeature] = useState(0)
  const [language, setLanguage] = useState<Language>('es')
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [annualBilling, setAnnualBilling] = useState(false)
  const [showCookieMessage, setShowCookieMessage] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)
  
  const languageMenuRef = useRef<HTMLDivElement>(null)
  const mobileLanguageMenuRef = useRef<HTMLDivElement>(null)

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
      if (
        (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) &&
        (mobileLanguageMenuRef.current && !mobileLanguageMenuRef.current.contains(event.target as Node))
      ) {
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
      aiPowered: 'Plataforma trading potenciada con inteligencia artificial',
      hero: {
        title: 'Trading Inteligente con',
        subtitle: 'Potencia tus operaciones con análisis avanzado, señales en tiempo real y gestión de riesgo inteligente.',
        startNow: 'Empezar Ahora',
        comingSoon: 'Próximamente',
        activeUsers: 'Usuarios activos',
        resultsImprovement: 'Mejora en resultados',
        support: 'Soporte dedicado'
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
        subtitle: "Traders que han transformado sus resultados",
        items: [
          {
            name: "Juan Pérez",
            role: "Trader Profesional",
            quote: "La herramienta para traders de Mulfex ha revolucionado completamente mi forma de operar."
          },
          {
            name: "María García",
            role: "Gestora de Fondos",
            quote: "Las características que ofrece Mulfex Trader son incomparables. Es un cambio radical para nuestro equipo."
          },
          {
            name: "Carlos Rodríguez",
            role: "Analista de Mercados",
            quote: "No puedo imaginar gestionar mis operaciones sin Mulfex Trader. Es intuitivo y potente."
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
        subtitle: "Resolvemos tus dudas para que comiences con confianza",
        items: [
          {
            question: "¿Qué es Mulfex?",
            answer: "Mulfex es una plataforma integral de trading que combina análisis técnico avanzado, señales en tiempo real y gestión de riesgo automatizada para optimizar tus operaciones."
          },
          {
            question: "¿Cómo funciona el sistema de precios?",
            answer: "Es bajo suscripción, pero ofrecemos una versión demo gratuita temporal para que puedas probar todas las funcionalidades antes de decidirte."
          },
          {
            question: "¿Puedo cancelar mi suscripción en cualquier momento?",
            answer: "Puedes cancelar tu suscripción cuando quieras. No creemos en contratos a largo plazo ni en cargos ocultos.",
          },
          {
            question: "¿Tienes alguna otra pregunta?",
            answer: "¿Tienes alguna otra pregunta? Puedes contactarnos para obtener más información."
          }
        ],
        moreQuestions: "¿Tienes alguna otra pregunta?",
        contactUs: "Contáctanos"
      },
      cta: {
        title: "¿Listo para revolucionar tu trading?",
        subtitle: "Únete a miles de traders que ya están mejorando sus resultados con TradingDash",
        button: "Comenzar Gratis",
        noCreditCard: "Sin tarjeta de crédito",
        freeTrial: "Prueba gratuita",
        easyCancel: "Cancelación sencilla",
        daysFreeTrial: "Período gratis"
      },
      footer: {
        description: "Plataforma líder en análisis y gestión de trading",
        newsletter: "Boletín",
        newsletterPlaceholder: "Tu email",
        newsletterButton: "Suscribirse",
        quickLinks: "Enlaces rápidos",
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
        stepLabel: "Paso",
        steps: [
          {
            title: "Regístrate",
            description: "Crea tu cuenta en menos de 2 minutos y accede a tu periodo de prueba gratuito.",
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
      },
      usedByTraders: "UTILIZADO POR TRADERS DE",
      language: "Idioma"
    },
    en: {
      features: 'Features',
      pricingLink: 'Pricing',
      start: 'Start',
      login: 'Login',
      signup: 'Sign up',
      aiPowered: 'Trading platform powered by artificial intelligence',
      hero: {
        title: 'Smart Trading with',
        subtitle: 'Boost your operations with advanced analysis, real-time signals, and intelligent risk management.',
        startNow: 'Start Now',
        comingSoon: 'Coming Soon',
        activeUsers: 'Active users',
        resultsImprovement: 'Results improvement',
        support: 'Dedicated support'
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
        subtitle: "We solve your doubts so you can start with confidence",
        items: [
          {
            question: "What is Mulfex?",
            answer: "Mulfex is a comprehensive trading platform that combines advanced technical analysis, real-time signals, and automated risk management to optimize your operations."
          },
          {
            question: "How does the pricing system work?",
            answer: "It's a subscription-based platform, but we offer a temporary free demo version so you can try all the features before making a decision."
          },
          {
            question: "Can I cancel my subscription at any time?",
            answer: "You can cancel your subscription whenever you want. We don't believe in long-term contracts or hidden charges."
          },
          {
            question: "Is there a free trial?",
            answer: "Yes, we offer a free trial for all our plans. No credit card required to start."
          }
        ],
        moreQuestions: "Do you have any other questions?",
        contactUs: "Contact us"
      },
      cta: {
        title: "Ready to revolutionize your trading?",
        subtitle: "Join thousands of traders who are already improving their results with TradingDash",
        button: "Start Free",
        noCreditCard: "No credit card",
        freeTrial: "Free trial",
        easyCancel: "Easy cancellation",
        daysFreeTrial: "free trial"
      },
      footer: {
        description: "Leading platform for trading analysis and management",
        newsletter: "Newsletter",
        newsletterPlaceholder: "Your email",
        newsletterButton: "Subscribe",
        quickLinks: "Quick Links",
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
        stepLabel: "Step",
        steps: [
          {
            title: "Sign up",
            description: "Create your account in less than 2 minutes and access your free trial.",
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
      },
      usedByTraders: "USED BY TRADERS FROM",
      language: "Language"
    },
    de: {
      features: 'Funktionen',
      pricingLink: 'Preise',
      start: 'Starten',
      login: 'Anmelden',
      signup: 'Registrieren',
      aiPowered: 'Trading-Plattform mit künstlicher Intelligenz',
      hero: {
        title: 'Intelligentes Trading mit',
        subtitle: 'Steigern Sie Ihre Operationen mit fortschrittlicher Analyse, Echtzeit-Signalen und intelligentem Risikomanagement.',
        startNow: 'Jetzt Starten',
        comingSoon: 'Demnächst',
        activeUsers: 'Aktive Benutzer',
        resultsImprovement: 'Ergebnisverbesserung',
        support: 'Dedizierter Support'
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
            quote: "Das Trading-Tool von Mulfex hat meine Art zu handeln komplett revolutioniert."
          },
          {
            name: "Maria Weber",
            role: "Fondsmanagerin",
            quote: "Die Funktionen von Mulfex Trader sind unvergleichlich. Ein echter Durchbruch für unser Team."
          },
          {
            name: "Karl Fischer",
            role: "Marktanalyst",
            quote: "Ich kann mir nicht vorstellen, meine Operationen ohne Mulfex Trader zu verwalten. Es ist intuitiv und leistungsstark."
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
        subtitle: "Wir lösen Ihre Zweifel, damit Sie mit Vertrauen beginnen können",
        items: [
          {
            question: "Was ist Mulfex?",
            answer: "Mulfex ist eine umfassende Handelsplattform, die fortschrittliche technische Analyse, Echtzeit-Signale und automatisiertes Risikomanagement kombiniert, um Ihre Operationen zu optimieren."
          },
          {
            question: "Wie funktioniert das Preissystem?",
            answer: "Es ist ein Abonnement-basiertes System, aber wir bieten eine temporäre kostenlose Demo-Version an, damit Sie alle Funktionen testen können, bevor Sie eine Entscheidung treffen."
          },
          {
            question: "Kann ich mein Abonnement jederzeit kündigen?",
            answer: "Sie können Ihr Abonnement jederzeit kündigen. Wir glauben nicht an langfristige Verträge oder versteckte Gebühren."
          },
          {
            question: "Gibt es eine kostenlose Testversion?",
            answer: "Ja, wir bieten eine kostenlose Testversion für alle unsere Pläne an. Keine Kreditkarte erforderlich zum Start."
          }
        ],
        moreQuestions: "Haben Sie weitere Fragen?",
        contactUs: "Kontaktieren Sie uns"
      },
      cta: {
        title: "Bereit, Ihr Trading zu revolutionieren?",
        subtitle: "Schließen Sie sich Tausenden von Tradern an, die ihre Ergebnisse bereits mit TradingDash verbessern",
        button: "Kostenlos Starten",
        noCreditCard: "Keine Kreditkarte",
        freeTrial: "Kostenlose Testversion",
        easyCancel: "Einfache Kündigung",
        daysFreeTrial: "kostenlose Testversion"
      },
      footer: {
        description: "Führende Plattform für Handelsanalyse und -management",
        newsletter: "Newsletter",
        newsletterPlaceholder: "Ihre E-Mail",
        newsletterButton: "Abonnieren",
        quickLinks: "Schnelllinks",
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
        stepLabel: "Schritt",
        steps: [
          {
            title: "Registrieren",
            description: "Erstellen Sie Ihr Konto in weniger als 2 Minuten und greifen Sie auf Ihre kostenlose Testversion zu.",
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
      },
      usedByTraders: "VERWENDET VON HÄNDLERN AUS",
      language: "Sprache"
    }
  }

  const t = translations[language]

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
      quote: "La herramienta para traders de Mulfex ha revolucionado completamente mi forma de operar.",
      avatar: "/placeholder.svg",
      rating: 5,
    },
    {
      name: "María García",
      role: "Gestora de Fondos",
      quote: "Las características que ofrece Mulfex Trader son incomparables. Es un cambio radical para nuestro equipo.",
      avatar: "/placeholder.svg",
      rating: 5,
    },
    {
      name: "Carlos Rodríguez",
      role: "Analista de Mercados",
      quote: "No puedo imaginar gestionar mis operaciones sin Mulfex Trader. Es intuitivo y potente.",
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
      question: "¿Qué es Mulfex?",
      answer: "Mulfex es una plataforma integral de trading que combina análisis técnico avanzado, señales en tiempo real y gestión de riesgo automatizada para optimizar tus operaciones.",
    },
    {
      question: "¿Cómo funciona el sistema de precios?",
      answer: "Es bajo suscripción, pero ofrecemos una versión demo gratuita temporal para que puedas probar todas las funcionalidades antes de decidirte."
    },
    {
      question: "¿Puedo cancelar mi suscripción en cualquier momento?",
      answer: "Puedes cancelar tu suscripción cuando quieras. No creemos en contratos a largo plazo ni en cargos ocultos.",
    },
    {
      question: "¿Tienes alguna otra pregunta?",
      answer: "¿Tienes alguna otra pregunta? Puedes contactarnos para obtener más información."
    }
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Estilos de animación */}
      <style jsx global>{animationStyles}</style>
      
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-md border-b border-gray-100 dark:border-gray-800" 
            : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo Mejorado */}
            <Link href="/" className="flex items-center group">
              <span className="text-2xl font-extrabold text-[#16243a] dark:text-white tracking-[0.25em] ml-8">
                MULFEX
              </span>
            </Link>

            {/* Desktop Navigation - Mejorada */}
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                href="#features" 
                className="text-gray-700 dark:text-gray-200 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm font-medium relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-cyan-500 after:transition-all after:duration-300"
              >
                {t.features}
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 text-cyan-600 dark:text-cyan-400 border border-cyan-500 dark:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-all duration-300 text-sm font-medium hover:shadow-md flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                {t.login}
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg hover:shadow-cyan-500/20 dark:hover:shadow-cyan-400/20 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
                {t.signup}
              </Link>
              <div className="relative" ref={languageMenuRef}>
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 flex items-center space-x-2 group"
                >
                  <Image 
                    src={languageFlags[language]}
                    alt={languageNames[language]}
                    width={20}
                    height={15}
                    className="rounded-sm object-cover"
                  />
                  <span className="font-medium">{languageNames[language]}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-cyan-500 transition-colors" />
                </button>
                {showLanguageMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 min-w-[160px] border border-gray-100 dark:border-gray-700 backdrop-blur-sm"
                  >
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
                            : 'text-gray-700 dark:text-gray-200'
                        } flex items-center space-x-3`}
                      >
                        <Image 
                          src={languageFlags[lang]}
                          alt={languageNames[lang]}
                          width={20}
                          height={15}
                          className="rounded-sm object-cover"
                        />
                        <span>{languageNames[lang]}</span>
                        {language === lang && (
                          <Check className="h-4 w-4 text-cyan-500 ml-auto" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button - Mejorado */}
            <div className="md:hidden flex items-center space-x-4">
              <div className="relative" ref={mobileLanguageMenuRef}>
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 flex items-center space-x-2 group"
                >
                  <Image 
                    src={languageFlags[language]}
                    alt={languageNames[language]}
                    width={20}
                    height={15}
                    className="rounded-sm object-cover"
                  />
                  <span className="font-medium">{languageNames[language]}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-cyan-500 transition-colors" />
                </button>
                {showLanguageMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 min-w-[160px] border border-gray-100 dark:border-gray-700 backdrop-blur-sm z-50"
                  >
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
                            : 'text-gray-700 dark:text-gray-200'
                        } flex items-center space-x-3`}
                      >
                        <Image 
                          src={languageFlags[lang]}
                          alt={languageNames[lang]}
                          width={20}
                          height={15}
                          className="rounded-sm object-cover"
                        />
                        <span>{languageNames[lang]}</span>
                        {language === lang && (
                          <Check className="h-4 w-4 text-cyan-500 ml-auto" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? 
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div> : 
                  <Menu className="h-6 w-6" />
                }
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Mejorado para deslizarse desde la derecha */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed md:hidden top-0 right-0 bottom-0 w-[85%] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 overflow-y-auto"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Menú</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 flex items-center justify-center"
                  aria-label="Cerrar menú"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 px-6 py-8">
                <div className="space-y-6">
              <Link
                href="#features"
                    className="flex items-center space-x-3 text-gray-700 dark:text-gray-200 hover:text-cyan-600 dark:hover:text-cyan-400 py-3 text-lg font-medium transition-colors duration-200 border-b border-gray-100 dark:border-gray-800 pb-3"
                onClick={() => setIsMenuOpen(false)}
              >
                    <Layers className="h-5 w-5 text-cyan-500" />
                <span>{t.features}</span>
              </Link>
                  <Link
                    href="#pricing"
                    className="flex items-center space-x-3 text-gray-700 dark:text-gray-200 hover:text-cyan-600 dark:hover:text-cyan-400 py-3 text-lg font-medium transition-colors duration-200 border-b border-gray-100 dark:border-gray-800 pb-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
                      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
                      <path d="M7 7h.01"/>
                    </svg>
                    <span>{t.pricingLink}</span>
                  </Link>
                  <Link
                    href="#testimonials"
                    className="flex items-center space-x-3 text-gray-700 dark:text-gray-200 hover:text-cyan-600 dark:hover:text-cyan-400 py-3 text-lg font-medium transition-colors duration-200 border-b border-gray-100 dark:border-gray-800 pb-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
                      <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/>
                      <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>
                    </svg>
                    <span>Testimonios</span>
                  </Link>
                  <Link
                    href="#faq"
                    className="flex items-center space-x-3 text-gray-700 dark:text-gray-200 hover:text-cyan-600 dark:hover:text-cyan-400 py-3 text-lg font-medium transition-colors duration-200 border-b border-gray-100 dark:border-gray-800 pb-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <path d="M12 17h.01"/>
                    </svg>
                    <span>FAQ</span>
                  </Link>
                </div>
              </nav>

              {/* Selector de idioma móvil */}
              <div className="px-6 py-4 mb-2">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.language}</span>
                  <div className="flex space-x-2">
                    {(['es', 'en', 'de'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                          localStorage.setItem('preferredLanguage', lang);
                        }}
                        className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 ${
                          language === lang 
                            ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/30' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Image 
                          src={languageFlags[lang]}
                          alt={languageNames[lang]}
                          width={20}
                          height={15}
                          className="rounded-sm object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 space-y-4">
              <Link
                href="/login"
                  className="w-full py-3 text-center text-cyan-600 dark:text-cyan-400 border border-cyan-500 dark:border-cyan-400 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all duration-300 font-medium flex items-center justify-center"
                onClick={() => setIsMenuOpen(false)}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                {t.login}
              </Link>
                <Link
                  href="/signup"
                  className="w-full py-3 text-center text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 font-medium shadow-md flex items-center justify-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/>
                    <line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                  {t.signup}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay oscuro cuando el menú está abierto */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <main>
        {/* Crypto Ticker Bar */}
        <CryptoTickerBar />
        
        {/* Hero Section - Ahora usando el componente separado */}
        <HeroSection t={t} />

        {/* Features Section */}
        <section id="features" className="py-20 bg-white dark:bg-gray-900 relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 dark:opacity-10"></div>
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-gray-50 dark:from-gray-800 to-transparent"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                {t.mainFeatures.title}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {t.mainFeatures.subtitle}
              </p>
            </motion.div>
            
            {/* Carrusel automático para mobile y tablet */}
            <div className="md:hidden">
              <div className="overflow-hidden pb-8">
                <AnimatePresence mode="wait">
              <motion.div
                key={currentFeature}
                    initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full max-w-sm mx-auto"
                  >
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:border-cyan-200 dark:hover:border-cyan-800/50 group relative overflow-hidden">
                      <div className="absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-full opacity-70"></div>
                      
                      <div className="relative z-10">
                        <div className="text-4xl mb-4 inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-2xl">
                  {t.mainFeatures.items[currentFeature].icon}
                </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {t.mainFeatures.items[currentFeature].title}
                </h3>
                        
                <p className="text-gray-600 dark:text-gray-300">
                  {t.mainFeatures.items[currentFeature].description}
                </p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
                
                {/* Indicadores pasivos (solo visuales) */}
                <div className="flex justify-center mt-8 space-x-2">
                  {t.mainFeatures.items.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentFeature 
                          ? 'bg-cyan-500' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
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
                  className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-gray-100 dark:border-gray-700 hover:border-cyan-200 dark:hover:border-cyan-800/50 group relative overflow-hidden"
                >
                  <div className="absolute -right-16 -top-16 w-32 h-32 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-full opacity-70 group-hover:scale-150 transition-all duration-700 ease-in-out"></div>
                  
                  <div className="relative z-10">
                    <div className="text-4xl mb-4 inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-2xl group-hover:scale-110 transition-all duration-300">
                      {feature.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section - Rediseño Minimalista */}
        <section className="py-24 bg-white dark:bg-gray-900 relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 dark:opacity-10"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                {t.howItWorks.title}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {t.howItWorks.subtitle}
              </p>
            </motion.div>
            
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Línea vertical para conectar los pasos */}
                <div className="absolute left-5 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-blue-500 to-blue-600"></div>
                
                {/* Pasos */}
                <div className="space-y-16">
                {t.howItWorks.steps.map((step, index) => (
                <motion.div
                  key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.15 }}
                  viewport={{ once: true }}
                      className="flex"
                    >
                      {/* Icono del paso */}
                      <div className="relative">
                        {/* Número del paso */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center text-xs font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 z-10">
                          {index + 1}
                    </div>
                        
                        {/* Contenedor del icono */}
                        <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg z-20 relative">
                          <span className="text-xl md:text-2xl">{step.icon}</span>
                    </div>
                      </div>
                      
                      {/* Contenido del paso */}
                      <div className="ml-6 md:ml-8 pt-1">
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {step.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg leading-relaxed">
                      {step.description}
                    </p>
                      </div>
                </motion.div>
              ))}
              </div>
              </div>
              
              {/* CTA final */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="mt-16 text-center"
              >
                <Link
                  href="/signup"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl text-lg font-medium"
                >
                  {t.hero.startNow}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 bg-white dark:bg-gray-900 relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 dark:opacity-10"></div>
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-gray-50 dark:from-gray-800 to-transparent"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                {t.testimonials.title}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {t.testimonials.subtitle}
              </p>
            </motion.div>
            
            {/* Desktop Testimonials */}
            <div className="hidden md:block">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-800/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-4 right-4 text-5xl text-purple-200 dark:text-purple-900/40 font-serif">"</div>
                    
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4 flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
                          fill={i < testimonial.rating ? 'currentColor' : 'none'} 
                        />
                      ))}
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 relative z-10">
                      "{testimonial.quote}"
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Mobile Testimonials */}
            <div className="md:hidden">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
              >
                <div className="text-5xl text-purple-200 dark:text-purple-900/40 font-serif absolute top-4 right-4">"</div>
                
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {testimonials[currentTestimonial].name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{testimonials[currentTestimonial].name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonials[currentTestimonial].role}</p>
                </div>
                </div>
                
                <div className="mb-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={`h-4 w-4 ${i < testimonials[currentTestimonial].rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
                      fill={i < testimonials[currentTestimonial].rating ? 'currentColor' : 'none'} 
                    />
                  ))}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 relative z-10">
                  "{testimonials[currentTestimonial].quote}"
                </p>
                
                <div className="flex justify-center mt-6 space-x-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentTestimonial 
                          ? 'bg-purple-500 scale-125' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      aria-label={`Ver testimonio ${index + 1}`}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 bg-white dark:bg-gray-900 relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 dark:opacity-10"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/10 dark:to-blue-900/10 rounded-full blur-3xl opacity-70"></div>
          <div className="absolute bottom-20 left-10 w-64 h-64 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/10 dark:to-blue-900/10 rounded-full blur-3xl opacity-70"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              {t.faq.title}
            </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {t.faq.subtitle}
              </p>
            </motion.div>
            
            <div className="max-w-4xl mx-auto">
              {t.faq.items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:border-cyan-200 dark:hover:border-cyan-800/50 transition-all duration-300 mb-4 group hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start">
                    <div className="mr-4 mt-1 flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl group-hover:scale-110 transition-all duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform duration-300">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300">
                        {item.question}
                  </h3>
                      <p className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors duration-300">
                        {item.answer}
                  </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Additional FAQ prompt */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto mt-12 text-center"
            >
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t.faq.moreQuestions}
              </p>
              <Link
                href="#"
                className="inline-flex items-center text-cyan-600 dark:text-cyan-400 font-medium hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
              >
                {t.faq.contactUs}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* CTA Section - Reestructurada para mostrar imagen arriba en móvil */}
        <section id="cta" className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 animate-gradient"></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
          
          {/* Floating elements */}
          <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-md animate-float"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-md animate-float animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/3 w-12 h-12 bg-white/10 rounded-full blur-sm animate-float animation-delay-1000"></div>
          <div className="absolute top-20 right-1/4 w-16 h-16 bg-white/10 rounded-full blur-sm animate-float animation-delay-4000"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-white/20 shadow-2xl"
            >
                {/* Reestructuración para dispositivos móviles: imagen arriba, texto abajo */}
                <div className="flex flex-col lg:flex-row gap-10 items-center">
                  {/* Círculo con número - ahora primero en móvil pero último en desktop */}
                  <div className="lg:hidden w-full flex justify-center mb-6">
                    <div className="relative w-56 h-56">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-full animate-pulse-glow"></div>
                      <div className="absolute inset-4 bg-gradient-to-br from-white/30 to-white/10 rounded-full animate-pulse-glow animation-delay-1000"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/95 backdrop-blur-md text-cyan-600 rounded-2xl w-32 h-32 flex flex-col items-center justify-center shadow-lg transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                          <span className="text-2xl font-extrabold">DEMO</span>
                          <span className="text-sm font-medium mt-1">{t.cta.daysFreeTrial}</span>
                          <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-lg shadow-md transform rotate-12">
                            ¡GRATIS!
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contenido de texto */}
                  <div className="lg:w-2/3">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                {t.cta.title}
              </h2>
                    <p className="text-xl text-blue-50 mb-8 max-w-xl">
                {t.cta.subtitle}
              </p>
                    
                    <div className="flex flex-wrap gap-4">
              <Link
                href="/signup"
                        className="px-8 py-4 bg-white text-cyan-600 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl text-lg font-semibold flex items-center"
              >
                {t.cta.button}
                        <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
                      
                      <Link
                        href="/login"
                        className="px-8 py-4 bg-white/20 text-white border border-white/40 rounded-xl hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl text-lg font-semibold"
                      >
                        {t.login}
                      </Link>
                    </div>
                    
                    <div className="mt-8 flex items-center text-white/80 text-sm">
                      <Check className="h-5 w-5 mr-2 text-white" />
                      <span>{t.cta.noCreditCard}</span>
                      <div className="mx-3 h-1 w-1 rounded-full bg-white/40"></div>
                      <Check className="h-5 w-5 mr-2 text-white" />
                      <span>{t.cta.freeTrial}</span>
                      <div className="mx-3 h-1 w-1 rounded-full bg-white/40"></div>
                      <Check className="h-5 w-5 mr-2 text-white" />
                      <span>{t.cta.easyCancel}</span>
                    </div>
                  </div>
                  
                  {/* Círculo con número - solo visible en desktop, a la derecha */}
                  <div className="lg:w-1/3 hidden lg:flex justify-center">
                    <div className="relative w-56 h-56">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-full animate-pulse-glow"></div>
                      <div className="absolute inset-4 bg-gradient-to-br from-white/30 to-white/10 rounded-full animate-pulse-glow animation-delay-1000"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/95 backdrop-blur-md text-cyan-600 rounded-2xl w-32 h-32 flex flex-col items-center justify-center shadow-lg transform -rotate-6 hover:rotate-0 transition-transform duration-300">
                          <span className="text-2xl font-extrabold">DEMO</span>
                          <span className="text-sm font-medium mt-1">{t.cta.daysFreeTrial}</span>
                          <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-lg shadow-md transform rotate-12">
                            ¡GRATIS!
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white pt-20 pb-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600"></div>
          
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
              {/* Logo y descripción */}
              <div className="md:col-span-5">
                <Link href="/" className="flex items-center space-x-3 group">
                  <span className="text-2xl font-extrabold text-white tracking-[0.25em]">
                    MULFEX
                  </span>
                </Link>
                <p className="mt-6 text-gray-400 leading-relaxed">
                {t.footer.description}
              </p>
                <div className="mt-8 flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </a>
            </div>
              </div>
              
              {/* Enlaces y mapa del sitio */}
              <div className="md:col-span-3">
                <h3 className="text-lg font-semibold mb-4 text-white bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                  {t.footer.legal.title}
                </h3>
                <ul className="space-y-3">
                  <li><Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.legal.privacy}</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.legal.terms}</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.legal.cookies}</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.legal.about}</Link></li>
                  <li><Link href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.legal.contact}</Link></li>
              </ul>
            </div>
              
              {/* Enlaces rápidos */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-4 text-white bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                  {t.footer.quickLinks}
                </h3>
                <ul className="space-y-3">
                  <li><Link href="#features" className="text-gray-400 hover:text-cyan-400 transition-colors">Características</Link></li>
                  <li><Link href="#testimonials" className="text-gray-400 hover:text-cyan-400 transition-colors">Testimonios</Link></li>
                  <li><Link href="#faq" className="text-gray-400 hover:text-cyan-400 transition-colors">FAQ</Link></li>
                  <li><Link href="#cta" className="text-gray-400 hover:text-cyan-400 transition-colors">Comenzar</Link></li>
                </ul>
            </div>
              
              {/* Boletín de noticias */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-4 text-white bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                  {t.footer.newsletter}
                </h3>
                <p className="text-gray-400 mb-4">{t.footer.description}</p>
                <div className="flex">
                  <input 
                    type="email" 
                    placeholder={t.footer.newsletterPlaceholder} 
                    className="bg-gray-800 border border-gray-700 text-gray-300 rounded-l-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-r-lg px-4 py-2">
                    {t.footer.newsletterButton}
                  </button>
          </div>
              </div>
          </div>
        </div>
      </footer>

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
      </main>
    </div>
  )
}