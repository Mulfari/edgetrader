import { ArrowRight } from "lucide-react"
import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import Link from "next/link"
import ModernDashboardPreview from "./ModernDashboardPreview"
import AreaChartSemiFilled from "./AreaChartSemiFilled"
import BitcoinIcon from './BitcoinIcon'
import EthereumIcon from './EthereumIcon'
import USDTIcon from './USDTIcon'
import USDCIcon from './USDCIcon'

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
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
        {/* Grid pattern - optimizado */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center bg-repeat-space opacity-5 dark:opacity-10"></div>
        
        {/* Animación de gradiente suave */}
        <motion.div 
          className="absolute -top-48 -right-48 w-96 h-96 rounded-full blur-3xl opacity-50 dark:opacity-20"
          style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.4) 0%, rgba(37,99,235,0.4) 100%)' }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.6, 0.5]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div 
          className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full blur-3xl opacity-40 dark:opacity-15"
          style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.3) 0%, rgba(37,99,235,0.3) 100%)' }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.5, 0.4]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        {/* Sutiles líneas de diseño */}
        <motion.div 
          className="absolute top-1/4 left-10 w-64 h-64 border border-cyan-500/10 dark:border-cyan-500/5 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ opacity: 0.6 }}
        />
        
        <motion.div 
          className="absolute bottom-1/3 right-10 w-48 h-48 border border-blue-500/10 dark:border-blue-500/5 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ opacity: 0.6 }}
        />
        
        {/* Iconos de criptomonedas en el fondo */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Bitcoin - Esquina superior derecha */}
          <motion.div 
            className="absolute top-20 right-20 opacity-5 dark:opacity-3"
            style={{
              filter: 'blur(1px)'
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 0.05,
              y: [0, -15, 0, -10, 0],
              rotate: [0, 5, 0, -5, 0]
            }}
            transition={{ 
              opacity: { duration: 1.2, delay: 0.2 },
              y: { duration: 12, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 15, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <BitcoinIcon size={120} rotation={15} />
          </motion.div>
          
          {/* Ethereum - Esquina inferior izquierda */}
          <motion.div 
            className="absolute bottom-20 left-20 opacity-5 dark:opacity-3"
            style={{
              filter: 'blur(1px)'
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 0.05,
              y: [0, 15, 0, 10, 0],
              rotate: [0, -7, 0, 7, 0]
            }}
            transition={{ 
              opacity: { duration: 1.2, delay: 0.4 },
              y: { duration: 14, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 17, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <EthereumIcon size={100} rotation={-10} />
          </motion.div>
          
          {/* USDT - Centro superior */}
          <motion.div 
            className="absolute top-10 left-1/2 transform -translate-x-1/2 opacity-5 dark:opacity-3"
            style={{
              filter: 'blur(1px)'
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 0.05,
              y: [0, -12, 0, -8, 0],
              rotate: [0, 3, 0, -3, 0]
            }}
            transition={{ 
              opacity: { duration: 1.2, delay: 0.6 },
              y: { duration: 10, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 13, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <USDTIcon size={90} rotation={5} />
          </motion.div>
          
          {/* USDC - Centro inferior */}
          <motion.div 
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 opacity-5 dark:opacity-3"
            style={{
              filter: 'blur(1px)'
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 0.05,
              y: [0, 10, 0, 6, 0],
              rotate: [0, -4, 0, 4, 0]
            }}
            transition={{ 
              opacity: { duration: 1.2, delay: 0.8 },
              y: { duration: 11, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 14, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <USDCIcon size={80} rotation={-5} />
          </motion.div>
          
          {/* Bitcoin adicional - Esquina superior izquierda */}
          <motion.div 
            className="absolute top-20 left-10 opacity-5 dark:opacity-3"
            style={{
              filter: 'blur(1px)'
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 0.05,
              y: [0, -13, 0, -7, 0],
              rotate: [0, 6, 0, -6, 0]
            }}
            transition={{ 
              opacity: { duration: 1.2, delay: 1.0 },
              y: { duration: 13, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 16, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <BitcoinIcon size={110} rotation={30} />
          </motion.div>
          
          {/* Ethereum adicional - Esquina inferior derecha */}
          <motion.div 
            className="absolute bottom-40 right-40 opacity-5 dark:opacity-3"
            style={{
              filter: 'blur(1px)'
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 0.05,
              y: [0, 14, 0, 9, 0],
              rotate: [0, -5, 0, 5, 0]
            }}
            transition={{ 
              opacity: { duration: 1.2, delay: 1.2 },
              y: { duration: 15, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 18, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <EthereumIcon size={90} rotation={-20} />
          </motion.div>
        </div>
        
        {/* Dots grid optimizado */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full max-w-7xl mx-auto px-4">
            <div className="w-full h-full grid grid-cols-12 md:grid-cols-24 gap-8">
              {Array.from({ length: 48 }).map((_, i) => (
                <motion.div 
                  key={i} 
                  className="w-1 h-1 rounded-full bg-cyan-500/10 dark:bg-cyan-500/5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.01 }}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Efecto de gradiente superior sutil */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white dark:from-gray-900 to-transparent" />
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
              <div className="relative bg-[#0D1117] p-5 rounded-2xl shadow-2xl border border-gray-800/30 overflow-hidden backdrop-blur-sm">
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