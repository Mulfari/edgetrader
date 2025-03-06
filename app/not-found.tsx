import Link from "next/link";

export default function NotFound() {
  return (
    <html className="dark:bg-[#0A0A0F]">
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-50/50 via-white/50 to-zinc-100/50 dark:from-[#0A0A0F] dark:via-[#12121A] dark:to-[#0A0A0F]">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl blur-2xl opacity-30"></div>
              <div className="relative bg-gradient-to-br from-violet-500 to-indigo-500 w-24 h-24 mx-auto rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-4xl font-bold text-white">404</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500">
              Página no encontrada
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Lo sentimos, la página que buscas no existe.
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-4 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
} 