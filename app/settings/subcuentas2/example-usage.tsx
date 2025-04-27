'use client';

import { useState } from 'react';
import { useSubaccounts } from '../SettingsSubaccounts2';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Componente de ejemplo que muestra cómo utilizar el hook useSubaccounts
 * para acceder a subcuentas y sus claves en otro componente.
 */
export default function ExampleUsage() {
  const { subaccounts, isLoading, error, refresh, getSubaccountById } = useSubaccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [secretKeyVisible, setSecretKeyVisible] = useState(false);
  
  const selectedAccount = selectedAccountId ? getSubaccountById(selectedAccountId) : null;
  
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Ejemplo de uso del hook useSubaccounts</CardTitle>
        <CardDescription>
          Este componente demuestra cómo utilizar el hook personalizado para acceder a las subcuentas en cualquier parte de la aplicación
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Seleccionar subcuenta:
              </label>
              <Select 
                value={selectedAccountId} 
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una subcuenta" />
                </SelectTrigger>
                <SelectContent>
                  {subaccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedAccount && (
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">API Key:</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setApiKeyVisible(!apiKeyVisible)}
                    >
                      {apiKeyVisible ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>
                  <div className="mt-1 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-md font-mono text-sm">
                    {apiKeyVisible 
                      ? selectedAccount.api_key
                      : `${selectedAccount.api_key.substring(0, 3)}...${selectedAccount.api_key.substring(selectedAccount.api_key.length - 3)}`
                    }
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Secret Key:</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSecretKeyVisible(!secretKeyVisible)}
                    >
                      {secretKeyVisible ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>
                  <div className="mt-1 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-md font-mono text-sm">
                    {secretKeyVisible 
                      ? selectedAccount.secret_key
                      : `${selectedAccount.secret_key.substring(0, 3)}...${selectedAccount.secret_key.substring(selectedAccount.secret_key.length - 3)}`
                    }
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Estas claves se pueden utilizar para conectarse a la API del exchange correspondiente.
                    Las claves son recuperadas directamente desde Vault con desencriptación segura.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={refresh} 
          disabled={isLoading}
        >
          Actualizar datos
        </Button>
      </CardFooter>
    </Card>
  );
} 