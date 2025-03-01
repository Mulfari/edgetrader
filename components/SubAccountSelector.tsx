"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"

interface SubAccount {
  id: string;
  name: string;
  exchange: string;
}

interface SubAccountSelectorProps {
  subAccounts: SubAccount[];
  onSelect: (subAccountId: string) => void;
  onClose?: () => void;
}

export default function SubAccountSelector({ subAccounts, onSelect, onClose }: SubAccountSelectorProps) {
  const [selectedId, setSelectedId] = useState<string>("")
  const { toast } = useToast()

  const handleSelect = () => {
    if (!selectedId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, selecciona una subcuenta",
      })
      return
    }
    onSelect(selectedId)
  }

  // Si no hay subcuentas disponibles, mostrar un mensaje
  if (subAccounts.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">No hay subcuentas disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 mb-3 text-amber-500" />
            <p className="text-lg font-medium mb-4">No se encontraron subcuentas</p>
            <p className="text-sm text-muted-foreground mb-6">
              Debes crear al menos una subcuenta antes de poder editar o eliminar.
            </p>
            {onClose && (
              <Button onClick={onClose}>Volver</Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Seleccionar Subcuenta</CardTitle>
        <CardDescription>
          Elige la subcuenta que deseas editar o eliminar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid gap-4">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una subcuenta" />
              </SelectTrigger>
              <SelectContent>
                {subAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.exchange})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
            {onClose && (
              <Button variant="outline" type="button" onClick={onClose}>
                Cancelar
              </Button>
            )}
            <Button onClick={handleSelect} disabled={!selectedId}>
              Continuar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 