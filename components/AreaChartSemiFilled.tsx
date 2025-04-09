import React, { useState, useEffect } from "react";
// @ts-ignore
import { scaleTime, scaleLinear, line as d3line, max, min, area as d3area, curveMonotoneX } from "d3";

// Datos para el gráfico
interface ChartData {
  date: string;
  value: number;
}

// Interfaz para datos de velas japonesas
interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Primer conjunto de datos (el existente)
const dataset1: ChartData[] = [
  { date: "2023-04-30", value: 4 },
  { date: "2023-05-01", value: 6 },
  { date: "2023-05-02", value: 8 },
  { date: "2023-05-03", value: 7 },
  { date: "2023-05-04", value: 10 },
  { date: "2023-05-05", value: 12 },
  { date: "2023-05-06", value: 10.5 },
  { date: "2023-05-07", value: 6 },
  { date: "2023-05-08", value: 8 },
  { date: "2023-05-09", value: 7.5 },
  { date: "2023-05-10", value: 6 },
  { date: "2023-05-11", value: 8 },
  { date: "2023-05-12", value: 9 },
  { date: "2023-05-13", value: 10 },
  { date: "2023-05-14", value: 17 },
  { date: "2023-05-15", value: 14 },
  { date: "2023-05-16", value: 15 },
  { date: "2023-05-17", value: 20 },
  { date: "2023-05-18", value: 18 },
  { date: "2023-05-19", value: 16 },
  { date: "2023-05-20", value: 15 },
  { date: "2023-05-21", value: 16 },
  { date: "2023-05-22", value: 13 },
  { date: "2023-05-23", value: 11 },
  { date: "2023-05-24", value: 11 },
  { date: "2023-05-25", value: 13 },
  { date: "2023-05-26", value: 12 },
  { date: "2023-05-27", value: 9 },
  { date: "2023-05-28", value: 8 },
  { date: "2023-05-29", value: 10 },
  { date: "2023-05-30", value: 11 },
  { date: "2023-05-31", value: 8 },
  { date: "2023-06-01", value: 9 },
  { date: "2023-06-02", value: 10 },
  { date: "2023-06-03", value: 12 },
  { date: "2023-06-04", value: 13 },
  { date: "2023-06-05", value: 15 },
  { date: "2023-06-06", value: 13.5 },
  { date: "2023-06-07", value: 13 },
  { date: "2023-06-08", value: 13 },
  { date: "2023-06-09", value: 14 },
  { date: "2023-06-10", value: 13 },
  { date: "2023-06-11", value: 12.5 },
];

// Datos para gráfico de velas japonesas - Datos más realistas y coherentes de mercado financiero
const candlestickDataset: CandlestickData[] = [
  { date: "2023-04-30", open: 142.50, high: 145.80, low: 141.20, close: 143.75 },
  { date: "2023-05-01", open: 143.75, high: 146.90, low: 143.10, close: 146.50 },
  { date: "2023-05-02", open: 146.50, high: 147.20, low: 144.30, close: 144.80 },
  { date: "2023-05-03", open: 144.80, high: 145.75, low: 142.60, close: 143.10 },
  { date: "2023-05-04", open: 143.10, high: 144.90, low: 142.20, close: 144.50 },
  { date: "2023-05-05", open: 144.50, high: 147.80, low: 144.20, close: 147.10 },
  { date: "2023-05-06", open: 147.10, high: 148.30, low: 146.20, close: 146.75 },
  { date: "2023-05-07", open: 146.75, high: 147.50, low: 145.40, close: 145.80 },
  { date: "2023-05-08", open: 145.80, high: 146.20, low: 143.60, close: 144.25 },
  { date: "2023-05-09", open: 144.25, high: 145.70, low: 143.90, close: 145.30 },
  { date: "2023-05-10", open: 145.30, high: 148.20, low: 145.00, close: 147.90 },
  { date: "2023-05-11", open: 147.90, high: 150.10, low: 147.20, close: 149.75 },
  { date: "2023-05-12", open: 149.75, high: 151.30, low: 149.10, close: 150.80 },
  { date: "2023-05-13", open: 150.80, high: 153.40, low: 150.20, close: 152.60 },
  { date: "2023-05-14", open: 152.60, high: 154.90, low: 151.70, close: 154.25 },
  { date: "2023-05-15", open: 154.25, high: 155.80, low: 153.10, close: 153.90 },
  { date: "2023-05-16", open: 153.90, high: 154.50, low: 151.40, close: 152.30 },
  { date: "2023-05-17", open: 152.30, high: 153.70, low: 151.20, close: 153.10 },
  { date: "2023-05-18", open: 153.10, high: 155.40, low: 152.70, close: 155.20 },
  { date: "2023-05-19", open: 155.20, high: 156.80, low: 154.50, close: 154.90 },
  { date: "2023-05-20", open: 154.90, high: 155.30, low: 152.40, close: 153.10 },
  { date: "2023-05-21", open: 153.10, high: 154.80, low: 152.60, close: 154.20 },
  { date: "2023-05-22", open: 154.20, high: 155.10, low: 153.30, close: 153.70 },
  { date: "2023-05-23", open: 153.70, high: 154.60, low: 151.90, close: 152.50 },
  { date: "2023-05-24", open: 152.50, high: 153.40, low: 150.30, close: 151.20 },
  { date: "2023-05-25", open: 151.20, high: 153.80, low: 150.90, close: 153.40 },
  { date: "2023-05-26", open: 153.40, high: 154.20, low: 152.30, close: 152.80 },
  { date: "2023-05-27", open: 152.80, high: 153.50, low: 150.70, close: 151.30 },
  { date: "2023-05-28", open: 151.30, high: 152.10, low: 149.60, close: 150.20 },
  { date: "2023-05-29", open: 150.20, high: 151.40, low: 148.80, close: 149.70 },
  { date: "2023-05-30", open: 149.70, high: 152.30, low: 149.20, close: 151.80 },
  { date: "2023-05-31", open: 151.80, high: 153.40, low: 150.90, close: 151.40 },
  { date: "2023-06-01", open: 151.40, high: 152.60, low: 149.90, close: 150.70 },
  { date: "2023-06-02", open: 150.70, high: 152.40, low: 149.80, close: 151.90 },
  { date: "2023-06-03", open: 151.90, high: 154.30, low: 151.60, close: 153.80 },
  { date: "2023-06-04", open: 153.80, high: 156.20, low: 153.40, close: 155.60 },
  { date: "2023-06-05", open: 155.60, high: 158.40, low: 155.10, close: 157.90 },
  { date: "2023-06-06", open: 157.90, high: 159.60, low: 157.20, close: 159.10 },
  { date: "2023-06-07", open: 159.10, high: 160.40, low: 157.80, close: 158.30 },
  { date: "2023-06-08", open: 158.30, high: 159.20, low: 157.10, close: 157.80 },
  { date: "2023-06-09", open: 157.80, high: 159.40, low: 156.90, close: 158.70 },
  { date: "2023-06-10", open: 158.70, high: 160.30, low: 158.20, close: 159.80 },
  { date: "2023-06-11", open: 159.80, high: 161.50, low: 159.20, close: 160.90 },
];

// Colores para los diferentes conjuntos de datos
const chartColors = [
  { 
    areaFrom: "#0EA5E9", 
    areaTo: "#0EA5E9", 
    lineFrom: "#0EA5E9", 
    lineTo: "#2563EB",
    accentColor: "#38BDF8" 
  }
];

// Colores específicos para las velas japonesas - Esquema profesional y moderno
const candlestickColors = {
  positive: {
    fill: "#0ECB81",    // Verde brillante estilo TradingView/Binance
    border: "#0DAB6E",
    glow: "rgba(14, 203, 129, 0.6)"  // Brillo verde más intenso
  },
  negative: {
    fill: "#F6465D",    // Rojo más vibrante y moderno
    border: "#E33E54",
    glow: "rgba(246, 70, 93, 0.6)"   // Brillo rojo más intenso
  },
  neutral: {
    fill: "#5D7793",    // Azul grisáceo más moderno
    border: "#455A84",
    glow: "rgba(93, 119, 147, 0.6)"  // Brillo para velas neutrales
  },
  wick: "#1C1C28"       // Casi negro para mejor contraste
};

// Componente del gráfico de área
function AreaChartSemiFilled(): React.ReactNode {
  // Estado para controlar qué conjunto de datos mostrar
  const [datasetIndex, setDatasetIndex] = useState(0);
  const [previousDatasetIndex, setPreviousDatasetIndex] = useState(-1);
  const [transitionEffect, setTransitionEffect] = useState(false);
  
  // Elegir el conjunto de datos actual y el anterior
  const dataSets = [dataset1, candlestickDataset];
  const isCandlestick = datasetIndex === 1;
  
  const currentDataset = dataSets[datasetIndex];
  const currentColors = chartColors[datasetIndex % chartColors.length];
  
  const previousDataset = previousDatasetIndex >= 0 ? dataSets[previousDatasetIndex] : null;
  const previousIsCandlestick = previousDatasetIndex === 1;
  const previousColors = previousDatasetIndex >= 0 ? chartColors[previousDatasetIndex % chartColors.length] : null;
  
  // Estado para la animación
  const [progress, setProgress] = useState(0);
  
  // Efecto para la animación con easing
  useEffect(() => {
    // Función de easing para una transición más natural (ease-out)
    const easeOutQuad = (t: number): number => t * (2 - t);
    
    const duration = 4000; // 4 segundos para una animación más lenta y natural
    const interval = 16; // ~60fps para una animación muy fluida
    const steps = duration / interval;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep += 1;
      const rawProgress = Math.min(currentStep / steps, 1);
      // Aplicar función de easing para una transición más natural
      setProgress(easeOutQuad(rawProgress));
      
      if (currentStep >= steps) {
        clearInterval(timer);
        
        // Cuando termina la animación, agregar un pequeño retraso antes de cambiar al siguiente conjunto de datos
        setTimeout(() => {
          setPreviousDatasetIndex(datasetIndex);
          setDatasetIndex((prevIndex) => (prevIndex + 1) % dataSets.length);
          setProgress(0); // Reiniciar el progreso
        }, 300); // Pequeño retraso para permitir que el sombreado se desvanezca
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [datasetIndex]);

  // Interfaz para puntos de datos genéricos
  interface DataPoint {
    date: Date;
    value?: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
  }
  
  // Procesar datos para gráfico actual
  const data: DataPoint[] = isCandlestick 
    ? (currentDataset as CandlestickData[]).map(d => ({ 
        ...d, 
        date: new Date(d.date),
        value: d.close // Usamos el valor de cierre para mantener compatibilidad
      }))
    : (currentDataset as ChartData[]).map(d => ({ 
        ...d, 
        date: new Date(d.date) 
      }));
  
  // Procesar datos para gráfico anterior
  const previousData: DataPoint[] | null = previousDataset 
    ? (previousIsCandlestick 
      ? (previousDataset as CandlestickData[]).map(d => ({ 
          ...d, 
          date: new Date(d.date),
          value: d.close
        }))
      : (previousDataset as ChartData[]).map(d => ({ 
          ...d, 
          date: new Date(d.date) 
        })))
    : null;

  // Configurar escalas para el conjunto actual
  const xScale = scaleTime()
    .domain([data[0].date, data[data.length - 1].date])
    .range([0, 100]);
    
  // Para las velas, necesitamos considerar high y low
  const yScale = scaleLinear()
    .domain([
      isCandlestick 
        ? Math.min(...(data as DataPoint[]).filter(d => d.low !== undefined).map(d => d.low as number)) * 0.9
        : 0, 
      isCandlestick 
        ? Math.max(...(data as DataPoint[]).filter(d => d.high !== undefined).map(d => d.high as number)) * 1.1
        : (max(data.filter(d => d.value !== undefined).map(d => d.value as number)) || 0) * 1.1
    ])
    .range([98, 10]); // Ajustar para dejar espacio arriba y abajo
    
  // Configurar escalas para el conjunto anterior (usando las mismas para mantener consistencia)
  const previousYScale = previousData 
    ? scaleLinear()
        .domain([
          previousIsCandlestick 
            ? Math.min(...(previousData as DataPoint[]).filter(d => d.low !== undefined).map(d => d.low as number)) * 0.9
            : 0, 
          previousIsCandlestick 
            ? Math.max(...(previousData as DataPoint[]).filter(d => d.high !== undefined).map(d => d.high as number)) * 1.1
            : (max(previousData.filter(d => d.value !== undefined).map(d => d.value as number)) || 0) * 1.1
        ])
        .range([98, 10])
    : null;

  // Función para dividir los datos en segmentos para controlar mejor la animación
  const getAnimatedData = () => {
    if (progress >= 1) return data;
    
    // Calcular el índice máximo basado en el progreso actual
    const maxIndex = Math.floor(data.length * progress);
    
    // Para gráficos de línea, incluimos un punto interpolado para suavizar
    if (!isCandlestick && maxIndex < data.length - 1) {
      const nextPoint = data[maxIndex + 1];
      const currentPoint = data[maxIndex];
      const segmentProgress = (data.length * progress) - maxIndex;
      
      // Crear un punto interpolado para una transición más suave
      const interpolatedDate = new Date(
        currentPoint.date.getTime() + 
        segmentProgress * (nextPoint.date.getTime() - currentPoint.date.getTime())
      );
      
      const interpolatedValue = 
        (currentPoint.value || 0) + 
        segmentProgress * ((nextPoint.value || 0) - (currentPoint.value || 0));
      
      // Devolver los datos actuales más el punto interpolado
      return [
        ...data.slice(0, maxIndex + 1),
        { date: interpolatedDate, value: interpolatedValue }
      ];
    }
    
    return data.slice(0, maxIndex + 1);
  };
  
  // Función para el gráfico anterior que se va "borrando" de forma más precisa
  const getFadingData = () => {
    if (!previousData || progress <= 0) return null;
    
    // Para la transición suave entre velas japonesas, mantenemos más datos visibles durante más tiempo
    if (previousIsCandlestick) {
      // Si estamos al 80% o más del progreso, comenzamos a desvanecer gradualmente
      if (progress >= 0.8) {
        // Calcular cuántos datos mostrar basados en el progreso restante
        const remainingProgress = (1 - progress) * 5; // Factor 5 para hacer más lento el desvanecimiento
        // Asegurar que al menos se muestren algunos datos hasta el final
        return previousData.slice(0, Math.max(3, Math.floor(previousData.length * remainingProgress)));
      }
      // Antes del 80%, mostrar todos los datos
      return previousData;
    }
    
    // Para otros tipos de gráficos, mantener la lógica existente
    // Obtener el índice exacto donde se está dibujando el nuevo gráfico
    const currentIndexProgress = data.length * progress;
    
    // Mapear ese índice al rango del gráfico anterior para asegurar alineación perfecta
    const fadeStartIndexRatio = currentIndexProgress / data.length;
    const fadeStartIndex = Math.ceil(previousData.length * fadeStartIndexRatio);
    
    if (fadeStartIndex >= previousData.length) return null;
    
    // Para gráficos de línea, incluimos interpolación para suavizar
    if (!previousIsCandlestick && fadeStartIndex > 0 && fadeStartIndex < previousData.length) {
      const fadeRatio = (previousData.length * fadeStartIndexRatio) - (fadeStartIndex - 1);
      
      if (fadeRatio > 0 && fadeRatio < 1) {
        const prevPoint = previousData[fadeStartIndex - 1];
        const currPoint = previousData[fadeStartIndex];
        
        // Interpolar un punto en el borde exacto
        const interpolatedDate = new Date(
          prevPoint.date.getTime() + 
          fadeRatio * (currPoint.date.getTime() - prevPoint.date.getTime())
        );
        
        const interpolatedValue = 
          (prevPoint.value || 0) + 
          fadeRatio * ((currPoint.value || 0) - (prevPoint.value || 0));
        
        // Devolver los datos que deben seguir visibles más el punto interpolado
        return [
          { date: interpolatedDate, value: interpolatedValue },
          ...previousData.slice(fadeStartIndex)
        ];
      }
    }
    
    return previousData.slice(fadeStartIndex);
  };

  // Obtener los datos actuales basados en la animación
  const currentAnimatedData = getAnimatedData();
  const fadingData = getFadingData();

  // Crear la línea para el conjunto actual (solo si no es candlestick)
  const line = !isCandlestick ? d3line<DataPoint>()
    .x((d: DataPoint) => xScale(d.date))
    .y((d: DataPoint) => yScale(d.value || 0))
    .curve(curveMonotoneX) : null;

  // Crear el área para el conjunto actual (solo si no es candlestick)
  const area = !isCandlestick ? d3area<DataPoint>()
    .x((d: DataPoint) => xScale(d.date))
    .y0(yScale(0))
    .y1((d: DataPoint) => yScale(d.value || 0))
    .curve(curveMonotoneX) : null;
    
  // Crear la línea para el conjunto anterior (solo si no es candlestick)
  const previousLine = previousData && !previousIsCandlestick && previousYScale
    ? d3line<DataPoint>()
        .x((d: DataPoint) => xScale(d.date))
        .y((d: DataPoint) => previousYScale(d.value || 0))
        .curve(curveMonotoneX)
    : null;
    
  // Crear el área para el conjunto anterior (solo si no es candlestick)
  const previousArea = previousData && !previousIsCandlestick && previousYScale
    ? d3area<DataPoint>()
        .x((d: DataPoint) => xScale(d.date))
        .y0(previousYScale(0))
        .y1((d: DataPoint) => previousYScale(d.value || 0))
        .curve(curveMonotoneX)
    : null;

  // Generar paths solo si no estamos en modo candlestick
  const areaPath = !isCandlestick && area ? area(currentAnimatedData) ?? undefined : undefined;
  const d = !isCandlestick && line ? line(currentAnimatedData) : undefined;
  
  const fadingAreaPath = !previousIsCandlestick && fadingData && previousArea ? previousArea(fadingData) : undefined;
  const fadingD = !previousIsCandlestick && fadingData && previousLine ? previousLine(fadingData) : undefined;

  // Calcular el ancho de cada vela basado en el número de datos
  const candleWidth = isCandlestick ? 100 / (data.length * 1.5) : 0; // Velas más anchas

  // Renderizado
  if ((!isCandlestick && !d) || (isCandlestick && currentAnimatedData.length === 0)) {
    return null;
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 h-full w-full bg-[#0D1117]">
        {/* Patrones de fondo */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="h-full w-full grid grid-cols-10 gap-0">
            {Array.from({ length: 200 }).map((_, i) => (
              <div key={i} className="border-r border-t border-gray-600 dark:border-gray-700"></div>
            ))}
          </div>
        </div>
        
        {/* Chart area */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="none"
          style={{ background: 'linear-gradient(180deg, #0D1117 0%, #161B22 100%)' }}
        >
          {/* Definiciones actualizadas */}
          <defs>
            {/* Definición del gradiente vertical actual */}
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={currentColors.areaFrom} stopOpacity="0.3" />
              <stop offset="50%" stopColor={currentColors.areaTo} stopOpacity="0.15" />
              <stop offset="100%" stopColor={currentColors.areaTo} stopOpacity="0.05" />
            </linearGradient>
            
            {/* Definición del gradiente verde para el área bajo las velas japonesas */}
            <linearGradient id="candlestickAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0ECB81" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#0ECB81" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0ECB81" stopOpacity="0.05" />
            </linearGradient>
            
            {/* Definición del gradiente para la línea actual */}
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={currentColors.lineFrom} />
              <stop offset="100%" stopColor={currentColors.lineTo} />
            </linearGradient>
            
            {/* Filtros actualizados para mejor contraste en fondo oscuro */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="1.5" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Definición del gradiente vertical anterior */}
            {previousColors && (
              <linearGradient id="previousAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={previousColors.areaFrom} stopOpacity="0.3" />
                <stop offset="100%" stopColor={previousColors.areaTo} stopOpacity="0.02" />
              </linearGradient>
            )}
            
            {/* Definición del gradiente para la línea anterior */}
            {previousColors && (
              <linearGradient id="previousLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={previousColors.lineFrom} />
                <stop offset="100%" stopColor={previousColors.lineTo} />
              </linearGradient>
            )}
            
            {/* Filtro para las mechas con mayor nitidez */}
            <filter id="wickGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0.05" dy="0.05" stdDeviation="0.05" floodColor="rgba(0,0,0,0.5)" />
            </filter>
            
            {/* Filtro para velas alcistas con iluminación moderna */}
            <filter id="positiveGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.1" result="blur" />
              <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0.8  0 0 0 0 0.4  0 0 0 0.4 0" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Filtro para velas bajistas con iluminación moderna */}
            <filter id="negativeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.1" result="blur" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.95  0 0 0 0 0.2  0 0 0 0 0.3  0 0 0 0.4 0" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Sombra mejorada con mayor nitidez */}
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0.05" dy="0.05" stdDeviation="0.05" floodColor="rgba(0,0,0,0.3)" />
            </filter>
            
            {/* Máscara para crear un efecto de corte más preciso entre los gráficos */}
            <mask id="graphMask">
              <rect x="0" y="0" width={`${progress * 100}%`} height="100" fill="white" />
            </mask>
            
            <mask id="fadeGraphMask">
              <rect x={`${progress * 100}%`} y="0" width={`${100 - (progress * 100)}%`} height="100" fill="white" />
            </mask>
          </defs>
          
          {/* Gráfico anterior que se está desvaneciendo (solo si no es candlestick) */}
          {!previousIsCandlestick && fadingAreaPath && (
            <path 
              d={fadingAreaPath} 
              fill="url(#previousAreaGradient)" 
              mask="url(#fadeGraphMask)"
              className="transition-opacity duration-300"
            />
          )}
          
          {!previousIsCandlestick && fadingD && (
            <path
              d={fadingD}
              fill="none"
              stroke="url(#previousLineGradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              filter="url(#glow)"
              mask="url(#fadeGraphMask)"
              className="transition-opacity duration-300"
            />
          )}
          
          {/* Velas japonesas anteriores que se están desvaneciendo */}
          {previousIsCandlestick && previousData && (
            <g mask="url(#fadeGraphMask)">
              {(previousData as DataPoint[]).map((d: DataPoint, i) => {
                if (!d.open || !d.close || !d.high || !d.low) return null;
                
                const isPositive = d.close > d.open;
                const isNeutral = Math.abs(d.close - d.open) < 0.05;
                const color = isNeutral ? candlestickColors.neutral : 
                              isPositive ? candlestickColors.positive : candlestickColors.negative;
                const x = xScale(d.date);
                
                // Ancho de vela igual al del gráfico actual para coherencia
                const candleWidth = Math.min(2.0, 100 / (previousData.length * 2));
                const candleX = x - (candleWidth / 2);
                
                const openY = previousYScale ? previousYScale(d.open) : 0;
                const closeY = previousYScale ? previousYScale(d.close) : 0;
                const highY = previousYScale ? previousYScale(d.high) : 0;
                const lowY = previousYScale ? previousYScale(d.low) : 0;
                
                // Asegurar una altura mínima para el cuerpo de la vela
                const bodyHeight = Math.max(Math.abs(closeY - openY), 0.5);
                const hasBody = bodyHeight > 0.5;
                
                // Elegir el filtro de brillo según el tipo de vela
                const glowFilter = isPositive ? "url(#positiveGlow)" : "url(#negativeGlow)";
                
                // Calcular si las mechas son significativas
                const topWickHeight = Math.abs(Math.min(openY, closeY) - highY);
                const bottomWickHeight = Math.abs(Math.max(openY, closeY) - lowY);
                const showTopWick = topWickHeight > 0.4;
                const showBottomWick = bottomWickHeight > 0.4;
                
                return (
                  <g key={i} className="transition-all duration-300">
                    {/* Mechas según corresponda */}
                    {showTopWick && (
                      <line 
                        x1={x}
                        y1={highY}
                        x2={x}
                        y2={Math.min(openY, closeY)}
                        stroke="#333333"
                        strokeWidth="0.25"
                        strokeLinecap="round"
                      />
                    )}
                    {showBottomWick && (
                      <line 
                        x1={x}
                        y1={Math.max(openY, closeY)}
                        x2={x}
                        y2={lowY}
                        stroke="#333333"
                        strokeWidth="0.25"
                        strokeLinecap="round"
                      />
                    )}
                    
                    {/* Sombra para efecto 3D */}
                    <rect
                      x={candleX + 0.07}
                      y={(isPositive ? closeY : openY) + 0.07}
                      width={candleWidth}
                      height={bodyHeight}
                      fill="rgba(0,0,0,0.2)"
                      opacity="0.4"
                      filter="url(#shadow)"
                      rx="0.3"
                      ry="0.3"
                    />
                    
                    {/* Cuerpo de la vela */}
                    <rect
                      x={candleX}
                      y={isPositive ? closeY : openY}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={color.fill}
                      stroke={color.border}
                      strokeWidth="0.15"
                      rx="0.3"
                      ry="0.3"
                      filter={glowFilter}
                    />
                    
                    {/* Efectos de luz */}
                    {hasBody && bodyHeight > 1 && (
                      <>
                        {/* Gradiente superior (brillo) */}
                        <rect
                          x={candleX + candleWidth * 0.1}
                          y={(isPositive ? closeY : openY) + bodyHeight * 0.08}
                          width={candleWidth * 0.6}
                          height={bodyHeight * 0.15}
                          fill="rgba(255,255,255,0.15)"
                          rx="0.1"
                          ry="0.1"
                          opacity={isPositive ? 0.4 : 0.2}
                        />
                      </>
                    )}
                  </g>
                );
              })}
            </g>
          )}
          
          {/* Área bajo la curva actual (solo si no es candlestick) */}
          {!isCandlestick && areaPath && (
            <path 
              d={areaPath} 
              fill="url(#areaGradient)" 
              mask="url(#graphMask)"
              className="transition-all duration-300"
            />
          )}
          
          {/* Línea principal con efecto de brillo (solo si no es candlestick) */}
          {!isCandlestick && d && (
            <path
              d={d}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              filter="url(#glow)"
              mask="url(#graphMask)"
              className="transition-all duration-300"
            />
          )}
          
          {/* Área bajo la curva para velas (similar a otros gráficos) */}
          {isCandlestick && (
            <path 
              d={`M0,98 
                 L0,${yScale(currentAnimatedData[0]?.close || 0)} 
                 ${currentAnimatedData.map((d, i) => `L${xScale(d.date)},${yScale(d.close || 0)}`).join(' ')} 
                 L100,${yScale(currentAnimatedData[currentAnimatedData.length - 1]?.close || 0)} 
                 L100,98 Z`}
              fill="url(#candlestickAreaGradient)" 
              mask="url(#graphMask)"
              opacity={0.25}
              className="transition-opacity duration-500"
            />
          )}
          
          {/* Área bajo la curva para velas que se está desvaneciendo */}
          {previousIsCandlestick && previousData && fadingData && (
            <path 
              d={`M0,98 
                 L0,${previousYScale ? previousYScale(fadingData[0]?.close || 0) : 0} 
                 ${fadingData.map((d, i) => `L${xScale(d.date)},${previousYScale ? previousYScale(d.close || 0) : 0}`).join(' ')} 
                 L100,${previousYScale ? previousYScale(fadingData[fadingData.length - 1]?.close || 0) : 0} 
                 L100,98 Z`}
              fill="url(#candlestickAreaGradient)" 
              mask="url(#fadeGraphMask)"
              opacity={0.15 * (1 - progress)}
              className="transition-opacity duration-500"
            />
          )}
          
          {/* Velas japonesas (solo si es candlestick) */}
          {isCandlestick && (
            <g mask="url(#graphMask)">
              {currentAnimatedData.map((d: DataPoint, i) => {
                if (!d.open || !d.close || !d.high || !d.low) return null;
                
                const isPositive = d.close > d.open;
                const isNeutral = Math.abs(d.close - d.open) < 0.05;
                const color = isNeutral ? candlestickColors.neutral : 
                              isPositive ? candlestickColors.positive : candlestickColors.negative;
                const x = xScale(d.date);
                
                // Ajustar ancho de vela según densidad de datos para un aspecto moderno
                const candleWidth = Math.min(2.0, 100 / (data.length * 2));
                const candleX = x - (candleWidth / 2);
                
                const openY = yScale(d.open);
                const closeY = yScale(d.close);
                const highY = yScale(d.high);
                const lowY = yScale(d.low);
                
                // Asegurar una altura mínima para el cuerpo de la vela
                const bodyHeight = Math.max(Math.abs(closeY - openY), 0.5);
                const hasBody = bodyHeight > 0.5;
                
                // Elegir el filtro de brillo según el tipo de vela
                const glowFilter = isPositive ? "url(#positiveGlow)" : "url(#negativeGlow)";
                
                return (
                  <g key={i} className="transition-all duration-300">
                    {/* Mechas solo cuando hay diferencia significativa entre max/min y open/close */}
                    {(() => {
                      // Calcular si las mechas son significativas
                      const topWickHeight = Math.abs(Math.min(openY, closeY) - highY);
                      const bottomWickHeight = Math.abs(Math.max(openY, closeY) - lowY);
                      const showTopWick = topWickHeight > 0.4; // Solo mostrar mechas significativas
                      const showBottomWick = bottomWickHeight > 0.4;
                      
                      return (
                        <>
                          {showTopWick && (
                            <line 
                              x1={x}
                              y1={highY}
                              x2={x}
                              y2={Math.min(openY, closeY)}
                              stroke="#333333"
                              strokeWidth="0.25"
                              strokeLinecap="round"
                            />
                          )}
                          {showBottomWick && (
                            <line 
                              x1={x}
                              y1={Math.max(openY, closeY)}
                              x2={x}
                              y2={lowY}
                              stroke="#333333"
                              strokeWidth="0.25"
                              strokeLinecap="round"
                            />
                          )}
                        </>
                      );
                    })()}
                    
                    {/* Sombra para efecto 3D */}
                    <rect
                      x={candleX + 0.07}
                      y={(isPositive ? closeY : openY) + 0.07}
                      width={candleWidth}
                      height={bodyHeight}
                      fill="rgba(0,0,0,0.2)"
                      opacity="0.4"
                      filter="url(#shadow)"
                      rx="0.3"
                      ry="0.3"
                    />
                    
                    {/* Cuerpo de la vela con efectos mejorados */}
                    <rect
                      x={candleX}
                      y={isPositive ? closeY : openY}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={color.fill}
                      stroke={color.border}
                      strokeWidth="0.15"
                      rx="0.3"
                      ry="0.3"
                      filter={glowFilter}
                    />
                    
                    {/* Reflejo en el cuerpo (efecto de luz más elaborado) */}
                    {hasBody && bodyHeight > 1 && (
                      <>
                        {/* Gradiente superior (brillo) */}
                        <rect
                          x={candleX + candleWidth * 0.1}
                          y={(isPositive ? closeY : openY) + bodyHeight * 0.08}
                          width={candleWidth * 0.6}
                          height={bodyHeight * 0.15}
                          fill="rgba(255,255,255,0.15)"
                          rx="0.1"
                          ry="0.1"
                          opacity={isPositive ? 0.4 : 0.2}
                        />
                      </>
                    )}
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

export default AreaChartSemiFilled; 