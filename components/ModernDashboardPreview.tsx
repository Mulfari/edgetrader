import React from "react";
import AreaChartSemiFilled from "./AreaChartSemiFilled";

// Componente moderno y minimalista para la sección hero
const ModernDashboardPreview = () => {
  return (
    <div className="relative w-full h-[600px] bg-gray-950 rounded-xl overflow-hidden shadow-md border border-gray-800">
      {/* Área principal con el gráfico */}
      <div className="absolute inset-0">
        <AreaChartSemiFilled />
      </div>
    </div>
  );
};

export default ModernDashboardPreview; 