import { ArrowRight } from "lucide-react"
import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import Link from "next/link"
import ModernDashboardPreview from "./ModernDashboardPreview"

type HeroSectionProps = {
  t: {
    aiPowered: string;
    hero: {
      title: string;
      subtitle: string;
      startNow: string;
      comingSoon: string;
      activeUsers: string;
      resultsImprovement: string;
      support: string;
    };
    usedByTraders: string;
  };
}

const HeroSection = ({ t }: HeroSectionProps) => {
  const heroRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })

  return (
    <section ref={heroRef} className="relative pt-0 pb-28 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 dark:opacity-15"></div>
        
        {/* Animated gradient blur */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl opacity-70 dark:opacity-30 animate-pulse-glow"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl opacity-70 dark:opacity-20 animate-pulse-glow animation-delay-2000"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-10 w-64 h-64 border border-cyan-500/10 dark:border-cyan-500/5 rounded-full animate-rotate opacity-70"></div>
        <div className="absolute bottom-1/3 right-10 w-40 h-40 border-2 border-blue-500/10 dark:border-blue-500/5 rounded-full animate-rotate opacity-70" style={{ animationDuration: '30s', animationDirection: 'reverse' }}></div>
        
        {/* Decorative dots grid */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-full h-full max-w-7xl grid grid-cols-12 gap-8">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-500/20 dark:bg-cyan-500/10"></div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="lg:w-1/2 text-center lg:text-left pt-10 lg:pt-0"
          >
            {/* Nuevo diseño simple para el banner */}
            <div className="mb-8 max-w-xl mx-auto lg:mx-0">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-6 rounded-lg shadow-md">
                <p className="font-medium">{t.aiPowered}</p>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 lg:mb-8 leading-tight tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600 animate-gradient">
                {t.hero.title}
              </span>
              <br />
              <span className="relative inline-block mt-2">
                Mulfex Trader
                <div className="absolute -bottom-3 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"></div>
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto lg:mx-0">
              {t.hero.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              {/* Botón de Empezar Ahora mejorado */}
              <Link
                href="#"
                className="w-full sm:w-auto px-8 py-4 text-white bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 dark:hover:shadow-blue-500/10 flex items-center justify-center gap-2 font-medium group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  {t.hero.startNow}
                  <ArrowRight className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0"></span>
                <span className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700 z-0"></span>
              </Link>
            </div>
            
            {/* Hero stats */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card rounded-xl p-4 text-center">
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">{t.hero.activeUsers}</div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{t.hero.resultsImprovement}</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">24/7</div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{t.hero.support}</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">87%</div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Mejora en resultados</p>
              </div>
            </div>
          </motion.div>
          
          {/* Dashboard Preview Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:w-1/2 lg:pt-10 hidden lg:block relative"
          >
            <div className="relative">
              {/* Main dashboard container */}
              <div className="relative bg-gradient-to-br from-gray-950 to-gray-900 p-5 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
                {/* Dashboard header mockup */}
                <ModernDashboardPreview />
                
                {/* Badges */}
                <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 -rotate-90 origin-left z-20">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-1 px-3 text-xs font-medium tracking-wider uppercase shadow-md rounded-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M16 12l-4 4-4-4M12 8v7"/>
                    </svg>
                    Dashboard en vivo
                  </div>
                </div>
                
                {/* AI Badge */}
                <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 rotate-90 origin-right z-20">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-1 px-3 text-xs font-medium tracking-wider uppercase shadow-md rounded-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                    Inteligencia Artificial
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">{t.usedByTraders}</p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
            {['Binance', 'Coinbase', 'Kraken', 'Bitfinex', 'Kucoin'].map((exchange, index) => (
              <div key={exchange} className="text-gray-400 dark:text-gray-500 font-semibold text-lg flex items-center">
                <div className="w-5 h-5 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full mr-2 flex items-center justify-center text-xs">
                  {index + 1}
                </div>
                {exchange}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-800 to-transparent" />
    </section>
  )
}

export default HeroSection 