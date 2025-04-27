import SettingsSubaccounts2 from '../SettingsSubaccounts2';
import ExampleUsage from './example-usage';

export default function SubcuentasPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">
        Subcuentas con Vault
      </h1>
      <SettingsSubaccounts2 />
      
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-white">
          Ejemplo de uso del hook personalizado
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          A continuación se muestra un ejemplo de cómo utilizar el hook useSubaccounts para
          acceder a las subcuentas y sus claves desencriptadas desde cualquier componente.
        </p>
        <ExampleUsage />
      </div>
    </div>
  );
} 