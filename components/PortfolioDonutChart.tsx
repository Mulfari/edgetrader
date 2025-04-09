import React from "react";
import DonutChart from "./DonutChart";

const PortfolioDonutChart: React.FC = () => {
  // Datos del portfolio - ajustados a los valores exactos de la imagen
  const portfolioData = [
    { id: "aapl", label: "AAPL", value: 30, color: "#6C5DD3" }, // 30%
    { id: "btc", label: "BTC", value: 22, color: "#7B68EE" },   // 22%
    { id: "gold", label: "GOLD", value: 11, color: "#9370DB" }, // 11% 
    { id: "pltr", label: "PLTR", value: 9, color: "#A388EE" },  // 9%
    { id: "ada", label: "ADA", value: 7, color: "#B19CD9" },    // 7%
  ];

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-[#1C1D24] rounded-2xl border border-[#2C2D33]">
      <DonutChart 
        data={portfolioData} 
        size={220} 
        thickness={40} 
        gap={1}
      />
    </div>
  );
};

export default PortfolioDonutChart; 