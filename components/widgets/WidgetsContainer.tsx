"use client";

import React from 'react';
import MarketTimesWidget from './MarketTimesWidget';
// Importar otros widgets aquí en el futuro
// import AnotherWidget from './AnotherWidget';

export default function WidgetsContainer() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 my-6">
      {/* Renderizar los widgets deseados */}
      <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4"> {/* Hacer que ocupe todo el ancho por ahora */}
        <MarketTimesWidget />
      </div>
      
      {/* Ejemplo de cómo añadir otro widget en el futuro */}
      {/* 
      <div className="col-span-1">
        <AnotherWidget />
      </div> 
      */}
    </div>
  );
} 