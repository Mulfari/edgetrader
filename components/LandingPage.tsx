"use client"

import Link from "next/link"
import { ArrowRight, Menu, X, Play, Check, Star, ArrowUp } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import Image from "next/image";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)

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
                Características
              </Link>
              <Link href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400">
                Precios
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-white bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg hover:from-violet-600 hover:to-indigo-600 transition-all duration-300"
              >
                Comenzar
              </Link>
              <ThemeToggle />
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              <ThemeToggle />
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
                Características
              </Link>
              <Link
                href="#pricing"
                className="text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Precios
              </Link>
              <Link
                href="/signup"
                className="w-full py-2 text-center text-white bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg hover:from-violet-600 hover:to-indigo-600 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Comenzar
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
                <span className="block text-gray-900 dark:text-white mb-2">Trading Inteligente con</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500">
                  TradingDash
                </span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">
                Potencia tus operaciones con análisis avanzado, señales en tiempo real y gestión de riesgo inteligente.
              </p>
              <div className="mt-8 flex justify-center space-x-4">
                <Link
                  href="#cta"
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Empezar Ahora
                  <ArrowRight className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
                </Link>
                <button
                  onClick={() => setShowVideo(true)}
                  className="inline-flex items-center px-8 py-3 border-2 border-violet-500 text-base font-medium rounded-xl text-violet-600 dark:text-violet-400 bg-transparent hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all duration-300 transform hover:scale-105"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Ver Demo
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
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl max-w-3xl w-full"
              >
                <div className="relative pt-[56.25%]">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="Product Demo"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <button
                  onClick={() => setShowVideo(false)}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl hover:from-violet-600 hover:to-indigo-600 transition-all duration-300"
                >
                  Cerrar
                </button>
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
                Características Principales
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Todo lo que necesitas para el trading profesional
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Análisis Avanzado",
                  description: "Herramientas de análisis técnico y fundamental con inteligencia artificial.",
                  icon: "📊",
                },
                {
                  title: "Señales en Tiempo Real",
                  description: "Recibe alertas y señales de trading basadas en análisis de mercado.",
                  icon: "⚡",
                },
                {
                  title: "Gestión de Riesgo",
                  description: "Optimiza tus operaciones con gestión de riesgo automatizada.",
                  icon: "🛡️",
                },
                {
                  title: "Multi-Exchange",
                  description: "Opera en múltiples exchanges desde una sola plataforma.",
                  icon: "🔄",
                },
                {
                  title: "Portfolio Tracking",
                  description: "Seguimiento detallado de tu portfolio con métricas avanzadas.",
                  icon: "📈",
                },
                {
                  title: "Soporte 24/7",
                  description: "Asistencia técnica y soporte personalizado cuando lo necesites.",
                  icon: "🎯",
                },
              ].map((feature, index) => (
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
                Lo que dicen nuestros usuarios
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Traders que han transformado sus resultados con TradingDash
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
                    alt={testimonials[currentTestimonial].name}
                    width={100}
                    height={100}
                    className="w-24 h-24 rounded-full object-cover border-4 border-violet-500"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-violet-500 rounded-full p-2">
                    <Star className="h-4 w-4 text-white" fill="currentColor" />
                  </div>
                </div>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 italic">
                  &ldquo;{testimonials[currentTestimonial].quote}&rdquo;
                </p>
                <div className="font-medium text-gray-900 dark:text-white text-lg">
                  {testimonials[currentTestimonial].name}
                </div>
                <div className="text-violet-500 dark:text-violet-400">
                  {testimonials[currentTestimonial].role}
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
                Planes y Precios
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Elige el plan que mejor se adapte a tus necesidades
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Básico",
                  price: "29€",
                  features: [
                    "Análisis técnico básico",
                    "5 Alertas personalizadas",
                    "1 Exchange conectado",
                    "Soporte por email"
                  ],
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
                  ],
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
                  ],
                },
              ].map((plan, index) => (
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
                  {index === 1 && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Más Popular
                      </span>
                    </div>
                  )}
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
                    Empezar Ahora
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
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto">
              {faqItems.map((item, index) => (
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
                ¿Listo para revolucionar tu trading?
              </h2>
              <p className="text-xl text-indigo-100 mb-8">
                Únete a miles de traders que ya están mejorando sus resultados con TradingDash
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center px-8 py-3 border-2 border-white text-lg font-medium rounded-xl text-white hover:bg-white hover:text-violet-600 transition-all duration-300 transform hover:scale-105"
              >
                Comenzar Gratis
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
                Plataforma líder en análisis y gestión de trading
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Producto</h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-gray-400 hover:text-white transition-colors">Características</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-white transition-colors">Precios</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Guías</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Compañía</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Sobre Nosotros</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Contacto</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacidad</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Términos</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© {new Date().getFullYear()} TradingDash. Todos los derechos reservados.</p>
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
            className="fixed bottom-4 right-4 p-3 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl shadow-lg hover:from-violet-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105"
            aria-label="Volver arriba"
          >
            <ArrowUp className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}