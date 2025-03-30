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
      startNow: string;
      plans: Array<{
        name: string;
        price: string;
        features: string[];
      }>;
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
      product: {
        title: string;
        features: string;
        pricing: string;
        guides: string;
      };
      company: {
        title: string;
        about: string;
        blog: string;
        contact: string;
      };
      legal: {
        title: string;
        privacy: string;
        terms: string;
        cookies: string;
      };
      rights: string;
    };
    videoModal: {
      description: string;
    };
  };
};

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [language, setLanguage] = useState<Language>('es')
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  
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
  }, [])

  // Efecto para guardar el idioma cuando cambie
  useEffect(() => {
    localStorage.setItem('preferredLanguage', language)
  }, [language])

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
        title: "Planes y Precios",
        subtitle: "Elige el plan que mejor se adapte a tus necesidades",
        mostPopular: "Más Popular",
        startNow: "Empezar Ahora",
        plans: [
          {
            name: "Básico",
            price: "29€",
            features: [
              "Análisis técnico básico",
              "5 Alertas personalizadas",
              "1 Exchange conectado",
              "Soporte por email"
            ]
          },
          {
            name: "Pro",
            price: "79€",
            features: [
              "Análisis técnico avanzado",
              "Alertas ilimitadas",
              "3 Exchanges conectados",
              "Señales en tiempo real",
              "Soporte prioritario"
            ]
          },
          {
            name: "Enterprise",
            price: "Personalizado",
            features: [
              "Todo incluido en Pro",
              "API personalizada",
              "Exchanges ilimitados",
              "Soporte dedicado 24/7",
              "Setup personalizado"
            ]
          }
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
        product: {
          title: "Producto",
          features: "Características",
          pricing: "Precios",
          guides: "Guías"
        },
        company: {
          title: "Compañía",
          about: "Sobre Nosotros",
          blog: "Blog",
          contact: "Contacto"
        },
        legal: {
          title: "Legal",
          privacy: "Privacidad",
          terms: "Términos",
          cookies: "Cookies"
        },
        rights: "Todos los derechos reservados."
      },
      videoModal: {
        description: "Estamos trabajando en un video demostrativo que muestre todas las características de nuestra plataforma. ¡Vuelve pronto para verlo!"
      }
    },
    en: {
      features: 'Features',
      pricingLink: 'Pricing',
      start: 'Start',
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
        title: "Plans & Pricing",
        subtitle: "Choose the plan that best fits your needs",
        mostPopular: "Most Popular",
        startNow: "Start Now",
        plans: [
          {
            name: "Basic",
            price: "€29",
            features: [
              "Basic technical analysis",
              "5 Custom alerts",
              "1 Connected exchange",
              "Email support"
            ]
          },
          {
            name: "Pro",
            price: "€79",
            features: [
              "Advanced technical analysis",
              "Unlimited alerts",
              "3 Connected exchanges",
              "Real-time signals",
              "Priority support"
            ]
          },
          {
            name: "Enterprise",
            price: "Custom",
            features: [
              "Everything in Pro",
              "Custom API",
              "Unlimited exchanges",
              "24/7 Dedicated support",
              "Custom setup"
            ]
          }
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
        product: {
          title: "Product",
          features: "Features",
          pricing: "Pricing",
          guides: "Guides"
        },
        company: {
          title: "Company",
          about: "About Us",
          blog: "Blog",
          contact: "Contact"
        },
        legal: {
          title: "Legal",
          privacy: "Privacy",
          terms: "Terms",
          cookies: "Cookies"
        },
        rights: "All rights reserved."
      },
      videoModal: {
        description: "We're working on a demo video showcasing all the features of our platform. Check back soon!"
      }
    },
    de: {
      features: 'Funktionen',
      pricingLink: 'Preise',
      start: 'Starten',
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
        title: "Pläne & Preise",
        subtitle: "Wählen Sie den Plan, der am besten zu Ihnen passt",
        mostPopular: "Beliebteste",
        startNow: "Jetzt Starten",
        plans: [
          {
            name: "Basis",
            price: "29€",
            features: [
              "Grundlegende technische Analyse",
              "5 Benutzerdefinierte Warnungen",
              "1 Verbundene Börse",
              "E-Mail-Support"
            ]
          },
          {
            name: "Pro",
            price: "79€",
            features: [
              "Erweiterte technische Analyse",
              "Unbegrenzte Warnungen",
              "3 Verbundene Börsen",
              "Echtzeit-Signale",
              "Prioritäts-Support"
            ]
          },
          {
            name: "Enterprise",
            price: "Individuell",
            features: [
              "Alles in Pro enthalten",
              "Individuelle API",
              "Unbegrenzte Börsen",
              "24/7 Dedizierter Support",
              "Individuelles Setup"
            ]
          }
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
        product: {
          title: "Produkt",
          features: "Funktionen",
          pricing: "Preise",
          guides: "Anleitungen"
        },
        company: {
          title: "Unternehmen",
          about: "Über uns",
          blog: "Blog",
          contact: "Kontakt"
        },
        legal: {
          title: "Rechtliches",
          privacy: "Datenschutz",
          terms: "AGB",
          cookies: "Cookies"
        },
        rights: "Alle Rechte vorbehalten."
      },
      videoModal: {
        description: "Wir arbeiten an einem Demo-Video, das alle Funktionen unserer Plattform zeigt. Schauen Sie bald wieder vorbei!"
      }
    }
  }

  const t = translations[language]

  const heroRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
      setShowScrollTop(window.scrollY > 300)
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
  }, [testimonials.length]); // ✅ Se agregó dependencia  


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
            ? "bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg" 
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-xl text-white">📈</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500">
                TradingDash
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400">
                {t.features}
              </Link>
              <Link href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400">
                {t.pricingLink}
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-white bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg hover:from-violet-600 hover:to-indigo-600 transition-all duration-300"
              >
                {t.start}
              </Link>
              <div className="relative" ref={languageMenuRef}>
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center space-x-2 group"
                >
                  <Globe className="h-4 w-4 text-violet-500 group-hover:rotate-12 transition-transform duration-300" />
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
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors duration-200 ${
                          language === lang 
                            ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 font-medium' 
                            : 'text-gray-600 dark:text-gray-300'
                        } flex items-center justify-between`}
                      >
                        <span>{languageNames[lang]}</span>
                        {language === lang && (
                          <Check className="h-4 w-4 text-violet-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              <div className="relative z-50">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="px-2 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 flex items-center space-x-2 group"
                >
                  <Globe className="h-4 w-4 text-violet-500 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-medium">{languageNames[language]}</span>
                </button>
                {showLanguageMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[160px] border border-gray-100 dark:border-gray-700 backdrop-blur-sm z-50">
                    {(['es', 'en', 'de'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                          setShowLanguageMenu(false);
                          localStorage.setItem('preferredLanguage', lang);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors duration-200 ${
                          language === lang 
                            ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 font-medium' 
                            : 'text-gray-600 dark:text-gray-300'
                        } flex items-center justify-between`}
                      >
                        <span>{languageNames[lang]}</span>
                        {language === lang && (
                          <Check className="h-4 w-4 text-violet-500" />
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
                className="text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.features}
              </Link>
              <Link
                href="#pricing"
                className="text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.pricingLink}
              </Link>
              <Link
                href="/signup"
                className="w-full py-2 text-center text-white bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg hover:from-violet-600 hover:to-indigo-600 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.start}
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
              <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">
                <span className="block text-gray-900 dark:text-white mb-2">{t.hero.title}</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500">
                  TradingDash
                </span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">
                {t.hero.subtitle}
              </p>
              <div className="mt-8 flex justify-center space-x-4">
                <Link
                  href="#cta"
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {t.hero.startNow}
                  <ArrowRight className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
                </Link>
                <button
                  onClick={() => setShowVideo(true)}
                  className="inline-flex items-center px-8 py-3 border-2 border-violet-500 text-base font-medium rounded-xl text-violet-600 dark:text-violet-400 bg-transparent hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all duration-300 transform hover:scale-105"
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
                <div className="relative flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-br from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20 rounded-xl p-8">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 dark:opacity-20 rounded-xl" />
                  
                  <h3 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500 mb-4">
                    {t.hero.comingSoon}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-center mb-6 max-w-md">
                    {t.videoModal.description}
                  </p>
                  
                  <div className="flex items-center justify-center space-x-2 text-violet-500 dark:text-violet-400 animate-pulse">
                    <div className="w-3 h-3 rounded-full bg-violet-500 dark:bg-violet-400"></div>
                    <div className="w-3 h-3 rounded-full bg-violet-500 dark:bg-violet-400 animation-delay-200"></div>
                    <div className="w-3 h-3 rounded-full bg-violet-500 dark:bg-violet-400 animation-delay-500"></div>
                  </div>
                </div>
                
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setShowVideo(false)}
                    className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl hover:from-violet-600 hover:to-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg"
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                {t.mainFeatures.title}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t.mainFeatures.subtitle}
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {t.mainFeatures.items.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gray-50 dark:bg-gray-900 p-8 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <Image
                    src={testimonials[currentTestimonial].avatar}
                    alt={t.testimonials.items[currentTestimonial].name}
                    width={100}
                    height={100}
                    className="w-24 h-24 rounded-full object-cover border-4 border-violet-500"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-violet-500 rounded-full p-2">
                    <Star className="h-4 w-4 text-white" fill="currentColor" />
                  </div>
                </div>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 italic">
                  &ldquo;{t.testimonials.items[currentTestimonial].quote}&rdquo;
                </p>
                <div className="font-medium text-gray-900 dark:text-white text-lg">
                  {t.testimonials.items[currentTestimonial].name}
                </div>
                <div className="text-violet-500 dark:text-violet-400">
                  {t.testimonials.items[currentTestimonial].role}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                {t.pricing.title}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t.pricing.subtitle}
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {t.pricing.plans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`bg-gray-50 dark:bg-gray-900 p-8 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    index === 1 ? "border-2 border-violet-500 relative" : ""
                  }`}
                >
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{plan.name}</h3>
                  <div className="text-4xl font-bold text-violet-600 dark:text-violet-400 mb-6">{plan.price}</div>
                  <ul className="mb-8 space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-600 dark:text-gray-300">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    index === 1
                      ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600"
                      : "bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 border-2 border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  }`}>
                    {t.pricing.startNow}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-12">
              {t.faq.title}
            </h2>
            <div className="max-w-3xl mx-auto">
              {t.faq.items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="mb-6"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{item.question}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{item.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-20 bg-gradient-to-r from-violet-500 to-indigo-500">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
              <p className="text-xl text-indigo-100 mb-8">
                {t.cta.subtitle}
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center px-8 py-3 border-2 border-white text-lg font-medium rounded-xl text-white hover:bg-white hover:text-violet-600 transition-all duration-300 transform hover:scale-105"
              >
                {t.cta.button}
                <ArrowRight className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500">
                TradingDash
              </Link>
              <p className="mt-4 text-gray-400">
                {t.footer.description}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {t.footer.product.title}
              </h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors">{t.footer.product.features}</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-white transition-colors">{t.footer.product.pricing}</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.product.guides}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {t.footer.company.title}
              </h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.company.about}</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.company.blog}</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.company.contact}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {t.footer.legal.title}
              </h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.legal.privacy}</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.legal.terms}</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">{t.footer.legal.cookies}</Link></li>
              </ul>
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
            className="fixed bottom-8 right-8 p-4 bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 rounded-full shadow-lg hover:shadow-xl border border-violet-200 dark:border-violet-700 transition-all duration-300 transform hover:scale-110 group"
            aria-label="Volver arriba"
          >
            <ArrowUp className="h-5 w-5 group-hover:-translate-y-1 transition-transform duration-300" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}