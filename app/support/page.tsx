import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soporte - bTrader",
  description: "Centro de soporte y ayuda de bTrader",
};

export default function SupportPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-8">Centro de Soporte</h1>
      
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Sección de FAQ */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Preguntas Frecuentes</h2>
          <ul className="space-y-4">
            <li>
              <h3 className="font-medium">¿Cómo funciona la suscripción?</h3>
              <p className="text-gray-600">Nuestra suscripción te da acceso completo a todas las funcionalidades premium de la plataforma.</p>
            </li>
            <li>
              <h3 className="font-medium">¿Puedo cancelar en cualquier momento?</h3>
              <p className="text-gray-600">Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de control.</p>
            </li>
          </ul>
        </div>

        {/* Sección de Contacto */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Contacto Directo</h2>
          <p className="text-gray-600 mb-4">
            Nuestro equipo de soporte está disponible 24/7 para ayudarte con cualquier consulta.
          </p>
          <div className="space-y-2">
            <p className="flex items-center">
              <span className="font-medium mr-2">Email:</span>
              <a href="mailto:soporte@btrader.com" className="text-blue-600 hover:text-blue-800">
                soporte@btrader.com
              </a>
            </p>
            <p className="flex items-center">
              <span className="font-medium mr-2">WhatsApp:</span>
              <a href="https://wa.me/1234567890" className="text-blue-600 hover:text-blue-800">
                +1 (234) 567-890
              </a>
            </p>
          </div>
        </div>

        {/* Sección de Recursos */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Recursos</h2>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-blue-600 hover:text-blue-800">
                Guía de inicio rápido
              </a>
            </li>
            <li>
              <a href="#" className="text-blue-600 hover:text-blue-800">
                Documentación API
              </a>
            </li>
            <li>
              <a href="#" className="text-blue-600 hover:text-blue-800">
                Tutoriales en video
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 