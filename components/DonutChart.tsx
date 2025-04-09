import React from "react";

// Definición del tipo de datos para el gráfico de donut
interface DonutDataItem {
  id: string;
  value: number;
  label: string;
  color: string;
}

// Props para el componente
interface DonutChartProps {
  data: DonutDataItem[];
  size?: number;
  thickness?: number;
  className?: string;
  gap?: number; // Espacio entre secciones en grados
}

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 250,
  thickness = 50,
  className = "",
  gap = 2, // Pequeño espacio en grados entre secciones
}) => {
  // Calcular el valor total para los porcentajes
  const total = data.reduce((acc, item) => acc + item.value, 0);
  
  // Calcular el radio y el centro del círculo
  const radius = size / 2;
  const center = size / 2;
  const innerRadius = radius - thickness;
  
  // Convertir el gap de grados a radianes
  const gapRadians = (gap * Math.PI) / 180;
  // Ajustar el total para incluir los espacios
  const totalWithGaps = total + (data.length * gap / 360) * total;
  
  // Calcular las secciones del donut
  let currentAngle = -Math.PI / 2; // Comenzar desde arriba
  
  const sections = data.map((item, index) => {
    // Calcular el ángulo para este segmento (con ajuste para el gap)
    const angle = (item.value / totalWithGaps) * (Math.PI * 2);
    
    // Calcular puntos iniciales y finales para el arco
    const startX = center + Math.cos(currentAngle) * radius;
    const startY = center + Math.sin(currentAngle) * radius;
    
    const endAngle = currentAngle + angle - gapRadians;
    const endX = center + Math.cos(endAngle) * radius;
    const endY = center + Math.sin(endAngle) * radius;
    
    // Calcular puntos internos para el arco
    const startXInner = center + Math.cos(currentAngle) * innerRadius;
    const startYInner = center + Math.sin(currentAngle) * innerRadius;
    const endXInner = center + Math.cos(endAngle) * innerRadius;
    const endYInner = center + Math.sin(endAngle) * innerRadius;
    
    // Determinar si el arco debe ser grande (> 180 grados)
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    
    // Crear el path para el segmento
    const path = [
      `M ${startX} ${startY}`, // Mover al punto inicial
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arco externo
      `L ${endXInner} ${endYInner}`, // Línea al borde interno
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startXInner} ${startYInner}`, // Arco interno
      "Z", // Cerrar el path
    ].join(" ");
    
    // Calcular posición para la etiqueta
    const labelAngle = currentAngle + (angle - gapRadians) / 2;
    const labelRadius = innerRadius + (radius - innerRadius) / 2 + 2; // +2 para ajuste fino
    const labelX = center + Math.cos(labelAngle) * labelRadius;
    const labelY = center + Math.sin(labelAngle) * labelRadius;
    
    // Actualizar el ángulo actual para el siguiente segmento (incluir gap)
    currentAngle = endAngle + gapRadians;
    
    // Formato para el porcentaje
    const percentage = Math.round((item.value / total) * 100);
    
    return {
      ...item,
      path,
      labelX,
      labelY,
      percentage,
    };
  });

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Fondo circular para el hueco del donut */}
      <div 
        className="absolute rounded-full bg-gray-800"
        style={{
          width: innerRadius * 2,
          height: innerRadius * 2,
          top: (size - innerRadius * 2) / 2,
          left: (size - innerRadius * 2) / 2
        }}
      />
      
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <g className="transform rotate-90">
          {sections.map((section, index) => (
            <g key={section.id}>
              <path
                d={section.path}
                fill={section.color}
                stroke="#1F2025" // Color del borde de cada sección
                strokeWidth="1"
                className="transition-all duration-300 hover:opacity-90 hover:scale-[1.02] origin-center cursor-pointer"
              />
              <g
                transform={`translate(${section.labelX}, ${section.labelY})`}
                className="select-none pointer-events-none"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                <text
                  className="text-xs font-bold fill-white"
                  dy="-0.5em"
                >
                  {section.label}
                </text>
                <text
                  className="text-xs fill-white opacity-80"
                  dy="1.2em"
                >
                  {section.percentage}%
                </text>
              </g>
            </g>
          ))}
        </g>
        
        {/* Sombra sutil interna */}
        <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
          <feComposite in="SourceGraphic" in2="offsetBlur" operator="over" />
        </filter>
      </svg>
    </div>
  );
};

export default DonutChart; 