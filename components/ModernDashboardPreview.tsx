import React from "react";
import AreaChartSemiFilled from "./AreaChartSemiFilled";
import DonutChart from "./DonutChart";

// Componente moderno y minimalista para la sección hero
const ModernDashboardPreview = () => {
  // Datos del portfolio personalizados para este dashboard
  const portfolioData = [
    { id: "aapl", label: "AAPL", value: 30, color: "#6C5DD3" }, // 30%
    { id: "btc", label: "BTC", value: 22, color: "#7B68EE" },   // 22%
    { id: "gold", label: "GOLD", value: 11, color: "#9370DB" }, // 11% 
    { id: "pltr", label: "PLTR", value: 9, color: "#A388EE" },  // 9%
    { id: "ada", label: "ADA", value: 7, color: "#B19CD9" },    // 7%
  ];

  // Renderizar segmentos de donut directamente para asegurar visibilidad
  const renderDonutManually = () => {
    const total = portfolioData.reduce((acc, item) => acc + item.value, 0);
    const centerX = 85;
    const centerY = 85;
    const outerRadius = 75;
    const innerRadius = 45;
    
    let currentAngle = -90; // Start from top
    
    const segments = portfolioData.map((item, index) => {
      const angle = (item.value / total) * 360;
      const startAngle = currentAngle * (Math.PI / 180);
      const endAngle = (currentAngle + angle) * (Math.PI / 180);
      
      // Calculate arc points
      const outerStartX = centerX + outerRadius * Math.cos(startAngle);
      const outerStartY = centerY + outerRadius * Math.sin(startAngle);
      const outerEndX = centerX + outerRadius * Math.cos(endAngle);
      const outerEndY = centerY + outerRadius * Math.sin(endAngle);
      
      const innerStartX = centerX + innerRadius * Math.cos(startAngle);
      const innerStartY = centerY + innerRadius * Math.sin(startAngle);
      const innerEndX = centerX + innerRadius * Math.cos(endAngle);
      const innerEndY = centerY + innerRadius * Math.sin(endAngle);
      
      // Determine path
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const path = [
        `M ${outerStartX} ${outerStartY}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}`,
        `L ${innerEndX} ${innerEndY}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`,
        'Z'
      ].join(' ');
      
      // Calculate label position - mejorar posicionamiento
      // Ajustamos el radio para posicionar las etiquetas más cerca del centro
      const labelRadius = (outerRadius + innerRadius) / 2 - 2;
      const labelAngle = (currentAngle + angle / 2) * (Math.PI / 180);
      const labelX = centerX + labelRadius * Math.cos(labelAngle);
      const labelY = centerY + labelRadius * Math.sin(labelAngle);
      
      currentAngle += angle;
      
      // Calculate percentage
      const percentage = Math.round((item.value / total) * 100);
      
      return (
        <g key={index}>
          <defs>
            <linearGradient id={`gradient${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={item.color} />
              <stop offset="100%" stopColor={`${item.color}DD`} />
            </linearGradient>
          </defs>
          <path 
            d={path} 
            fill={`url(#gradient${index})`}
            stroke="#1C1D24" 
            strokeWidth="0.5" 
            className="transition-all duration-300 hover:opacity-90"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#softenEdges)"
          />
          <g transform={`translate(${labelX}, ${labelY})`} textAnchor="middle" dominantBaseline="middle">
            {/* Versión mejorada sin usar el círculo de fondo */}
            <text 
              fill="white" 
              fontSize="10" 
              fontWeight="bold" 
              letterSpacing="0.3"
              dominantBaseline="middle"
              y="-4"
              style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.6)' }}
            >
              {item.label}
            </text>
            <text 
              fill="white" 
              fontSize="9" 
              y="6" 
              opacity="1"
              fontWeight="600"
              dominantBaseline="middle"
              style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}
            >
              {percentage}%
            </text>
          </g>
        </g>
      );
    });

    return (
      <svg viewBox="0 0 170 170" width="170" height="170">
        {/* Fondo del centro del donut */}
        <circle cx={centerX} cy={centerY} r={innerRadius} fill="#1C1D24" />
        <circle cx={centerX} cy={centerY} r={innerRadius} fill="url(#radialGradient)" opacity="0.4" />
        
        {/* Definiciones para gradientes y efectos */}
        <defs>
          <radialGradient id="radialGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1C1D24" stopOpacity="0" />
          </radialGradient>
          
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#000" floodOpacity="0.3" />
          </filter>
          
          <filter id="softenEdges" x="0" y="0" width="100%" height="100%">
            <feGaussianBlur stdDeviation="0.3" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="1.5" intercept="-0.1" />
            </feComponentTransfer>
            <feComposite operator="in" in2="SourceGraphic" />
          </filter>
        </defs>
        
        {/* Borde exterior para mejorar definición */}
        <circle cx={centerX} cy={centerY} r={outerRadius + 2} fill="none" stroke="#2A2C34" strokeWidth="0.5" opacity="0.3" />
        
        {/* El gráfico en sí */}
        <g className="donut-chart">
          {segments}
        </g>
      </svg>
    );
  };

  return (
    <div className="relative w-full h-[600px] bg-gray-950 rounded-xl overflow-hidden shadow-md border border-gray-800">
      <div className="absolute inset-0 p-4">
        <div className="grid grid-cols-3 h-full gap-4">
          {/* Panel principal con el gráfico de área/velas */}
          <div className="col-span-2 bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg">
            <div className="h-full">
              <AreaChartSemiFilled />
            </div>
          </div>
          
          {/* Panel lateral con el gráfico donut y otros elementos */}
          <div className="col-span-1 flex flex-col gap-4">
            {/* Gráfico donut - usando el componente base para mejor control del tamaño */}
            <div className="bg-[#1C1D24] rounded-xl border border-gray-800 p-4 flex-1 flex flex-col shadow-lg bg-gradient-to-br from-[#1C1D24] to-[#17181F]">
              <div className="mb-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mr-2.5 shadow-glow-sm"></div>
                  <div className="text-white text-xs font-medium tracking-wide">Assets Distribution</div>
                </div>
                <div className="mt-1 h-px bg-gradient-to-r from-purple-500/5 via-purple-500/20 to-transparent"></div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                {renderDonutManually()}
              </div>
            </div>
            
            {/* Stats / KPIs con gráficos visuales */}
            <div className="bg-[#1C1D24] rounded-xl border border-gray-800 p-4 flex-1 shadow-lg">
              <div className="mb-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2.5 shadow-glow-sm"></div>
                  <div className="text-white text-xs font-medium tracking-wide">Metrics</div>
                </div>
                <div className="mt-1 h-px bg-gradient-to-r from-cyan-500/5 via-cyan-500/20 to-transparent"></div>
              </div>
              <div className="space-y-5 mt-4">
                {/* ROI Panel con gráfico mini */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-gray-300 text-xs">Daily ROI</div>
                    <div className="text-green-400 text-xs font-medium px-2 py-0.5 bg-green-400/10 rounded-md">+2.4%</div>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                      style={{ width: "72%" }}
                    ></div>
                  </div>
                </div>
                
                {/* Win Rate Panel con gráfico circular */}
                <div className="flex justify-between items-center">
                  <div className="text-gray-300 text-xs">Win Rate</div>
                  <div className="relative">
                    <div className="w-11 h-11 flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-full h-full">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#2A2C34" strokeWidth="3" />
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="15" 
                          fill="none" 
                          stroke="url(#blueGradient)" 
                          strokeWidth="3.5" 
                          strokeDasharray="94.2, 94.2" 
                          strokeDashoffset="22.15"
                          transform="rotate(-90 18 18)"
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22D3EE" />
                            <stop offset="100%" stopColor="#0EA5E9" />
                          </linearGradient>
                        </defs>
                        <text x="18" y="20" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">76.5%</text>
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Open Positions con mini barras */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-gray-300 text-xs">Open Positions</div>
                    <div className="text-white text-xs font-medium px-2 py-0.5 bg-gray-700/40 rounded-md">4</div>
                  </div>
                  <div className="flex gap-1 h-1.5">
                    <div className="flex-1 bg-green-500 rounded-sm"></div>
                    <div className="flex-1 bg-red-500 rounded-sm"></div>
                    <div className="flex-1 bg-green-500 rounded-sm"></div>
                    <div className="flex-1 bg-green-500 rounded-sm"></div>
                    <div className="flex-1 bg-gray-800 rounded-sm"></div>
                    <div className="flex-1 bg-gray-800 rounded-sm"></div>
                  </div>
                </div>
                
                {/* Total PnL con mini-gráfico sparkline */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-gray-300 text-xs">Total PnL</div>
                    <div className="text-green-400 text-xs font-medium px-2 py-0.5 bg-green-400/10 rounded-md">+$12,450</div>
                  </div>
                  <svg viewBox="0 0 100 25" className="w-full h-6">
                    <defs>
                      <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,20 L10,18 L20,19 L30,17 L40,15 L50,16 L60,12 L70,10 L80,8 L90,7 L100,6"
                      fill="none"
                      stroke="url(#sparklineGradient)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="100" cy="6" r="2" fill="#10B981" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Overlay con patrones para dar textura */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>
      </div>
    </div>
  );
};

export default ModernDashboardPreview; 