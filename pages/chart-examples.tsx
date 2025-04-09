import React from 'react';
import AreaChartSemiFilled from '../components/AreaChartSemiFilled';
import PortfolioDonutChart from '../components/PortfolioDonutChart';

const ChartExamples: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-8">Ejemplos de Gráficos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gráfico de Área/Velas */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Gráfico de Área/Velas</h2>
          <div className="h-[300px] w-full">
            <AreaChartSemiFilled />
          </div>
        </div>
        
        {/* Gráfico de Donut */}
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Gráfico de Distribución del Portfolio</h2>
          <div className="flex justify-center">
            <PortfolioDonutChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartExamples; 