"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Asegúrate que la ruta sea correcta
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea'; // Eliminado
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function TestIaPage() {
  const [prompt, setPrompt] = useState<string>("Escribe un haiku sobre Deno");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInvokeFunction = async () => {
    if (!prompt.trim()) {
      setError("Por favor, introduce un prompt.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      // Llamar a la Edge Function 'IA-1' (asegúrate que el nombre sea exacto)
      const { data, error: invokeError } = await supabase.functions.invoke(
        'IA-1', // El nombre de tu Edge Function
        {
          body: { prompt: prompt }, // Enviar el prompt en el cuerpo
        }
      );

      if (invokeError) {
        // Errores de red, CORS (si aplica), o de la propia función invoke
        console.error("Invoke Error:", invokeError);
        throw new Error(`Error al invocar la función: ${invokeError.message}`);
      }

      console.log("Function Response Data:", data);

      // Verificar la respuesta específica de nuestra función
      if (data?.success && data?.analysis) {
        setResult(data.analysis);
      } else {
        // Si success es false o falta 'analysis'
        throw new Error(data?.error || "La función no devolvió un análisis válido.");
      }

    } catch (err: any) {
      console.error("Catch Block Error:", err);
      setError(err.message || "Ocurrió un error desconocido.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Probar Edge Function OpenAI (IA-1)</h1>

      <div className="space-y-4">
        <div>
          <Label htmlFor="prompt-input">Prompt para la IA:</Label>
          <Input
            id="prompt-input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ej: Escribe un poema corto sobre React"
            disabled={isLoading}
            className="mt-1"
          />
        </div>

        <Button onClick={handleInvokeFunction} disabled={isLoading || !prompt}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            "Enviar Prompt a IA"
          )}
        </Button>

        {result && (
          <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md">
            <h2 className="font-semibold mb-2 text-green-800 dark:text-green-300">Respuesta de la IA:</h2>
            <pre className="text-sm text-green-900 dark:text-green-200 whitespace-pre-wrap font-sans">
              {result}
            </pre>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">
            <h2 className="font-semibold mb-2 text-red-800 dark:text-red-300">Error:</h2>
            <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
} 