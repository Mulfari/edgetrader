import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface SubAccount {
  id: string;
  userId: string;
  name: string;
  exchange: string;
  apiKey?: string;
  apiSecret?: string;
  isDemo?: boolean;
}

interface SubAccountActionsProps {
  onRefresh: () => void;
  subAccount?: SubAccount;
  mode: "add" | "edit" | "delete";
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SubAccountActions({ onRefresh, subAccount, mode }: SubAccountActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: subAccount?.name || "",
    exchange: subAccount?.exchange || "bybit",
    apiKey: "",
    apiSecret: "",
    isDemo: subAccount?.isDemo || false,
  });
  const router = useRouter();

  // Función para manejar la creación de una nueva subcuenta
  const handleCreateSubAccount = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No hay token, redirigiendo a login.");
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/subaccounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          exchange: formData.exchange,
          apiKey: formData.apiKey,
          apiSecret: formData.apiSecret,
          isDemo: formData.isDemo,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error al crear subcuenta - Código ${res.status}`);
      }

      const data = await res.json();
      console.log("Subcuenta creada:", data);
      
      // Actualizar la lista de subcuentas
      onRefresh();
      
      // Cerrar el diálogo y limpiar el formulario
      setIsOpen(false);
      setFormData({
        name: "",
        exchange: "bybit",
        apiKey: "",
        apiSecret: "",
        isDemo: false,
      });
      
      alert("Subcuenta creada correctamente");
    } catch (error) {
      console.error("❌ Error al crear subcuenta:", error);
      alert("Error al crear subcuenta. Inténtalo de nuevo.");
    }
  };

  // Función para manejar la actualización de una subcuenta
  const handleUpdateSubAccount = async () => {
    if (!subAccount) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No hay token, redirigiendo a login.");
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/subaccounts/${subAccount.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          exchange: formData.exchange,
          apiKey: formData.apiKey || subAccount.apiKey,
          apiSecret: formData.apiSecret || subAccount.apiSecret,
          isDemo: formData.isDemo,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error al actualizar subcuenta - Código ${res.status}`);
      }

      const data = await res.json();
      console.log("Subcuenta actualizada:", data);
      
      // Actualizar la lista de subcuentas
      onRefresh();
      
      // Cerrar el diálogo y limpiar el formulario
      setIsOpen(false);
      
      alert("Subcuenta actualizada correctamente");
    } catch (error) {
      console.error("❌ Error al actualizar subcuenta:", error);
      alert("Error al actualizar subcuenta. Inténtalo de nuevo.");
    }
  };

  // Función para manejar la eliminación de una subcuenta
  const handleDeleteSubAccount = async () => {
    if (!subAccount) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No hay token, redirigiendo a login.");
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/subaccounts/${subAccount.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Error al eliminar subcuenta - Código ${res.status}`);
      }

      // Actualizar la lista de subcuentas
      onRefresh();
      
      // Cerrar el diálogo
      setIsOpen(false);
      
      alert("Subcuenta eliminada correctamente");
    } catch (error) {
      console.error("❌ Error al eliminar subcuenta:", error);
      alert("Error al eliminar subcuenta. Inténtalo de nuevo.");
    }
  };

  const handleSubmit = () => {
    if (mode === "add") {
      handleCreateSubAccount();
    } else if (mode === "edit") {
      handleUpdateSubAccount();
    } else if (mode === "delete") {
      handleDeleteSubAccount();
    }
  };

  const getButtonContent = () => {
    switch (mode) {
      case "add":
        return (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Subcuenta
          </>
        );
      case "edit":
        return (
          <>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </>
        );
      case "delete":
        return (
          <>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Eliminar</span>
          </>
        );
      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    switch (mode) {
      case "add":
        return "Agregar Nueva Subcuenta";
      case "edit":
        return "Editar Subcuenta";
      case "delete":
        return "Eliminar Subcuenta";
      default:
        return "";
    }
  };

  const getDialogDescription = () => {
    switch (mode) {
      case "add":
        return "Ingresa los detalles de tu nueva subcuenta de trading.";
      case "edit":
        return "Actualiza los detalles de tu subcuenta de trading.";
      case "delete":
        return "¿Estás seguro de que deseas eliminar esta subcuenta? Esta acción no se puede deshacer.";
      default:
        return "";
    }
  };

  const getButtonVariant = () => {
    switch (mode) {
      case "add":
        return "default";
      case "edit":
        return "ghost";
      case "delete":
        return "ghost";
      default:
        return "default";
    }
  };

  const getButtonSize = () => {
    switch (mode) {
      case "add":
        return "default";
      case "edit":
        return "icon";
      case "delete":
        return "icon";
      default:
        return "default";
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case "add":
        return "Guardar";
      case "edit":
        return "Guardar Cambios";
      case "delete":
        return "Eliminar";
      default:
        return "Guardar";
    }
  };

  const getSubmitButtonVariant = () => {
    switch (mode) {
      case "add":
      case "edit":
        return "default";
      case "delete":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={getButtonVariant() as any} 
          size={getButtonSize() as any}
          className={mode === "add" ? "w-full md:w-auto" : ""}
        >
          {getButtonContent()}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>
        {mode !== "delete" ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nombre
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="exchange" className="text-right">
                Exchange
              </Label>
              <Input
                id="exchange"
                value={formData.exchange}
                onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="text-right">
                API Key
              </Label>
              <Input
                id="apiKey"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="col-span-3"
                placeholder={mode === "edit" ? "Ingresa nueva API Key o deja en blanco para mantener la actual" : ""}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiSecret" className="text-right">
                API Secret
              </Label>
              <Input
                id="apiSecret"
                type="password"
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                className="col-span-3"
                placeholder={mode === "edit" ? "Ingresa nueva API Secret o deja en blanco para mantener la actual" : ""}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isDemo" className="text-right">
                Cuenta Demo
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDemo"
                  checked={formData.isDemo}
                  onChange={(e) => setFormData({ ...formData, isDemo: e.target.checked })}
                  className="h-4 w-4"
                />
                <label
                  htmlFor="isDemo"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Esta es una cuenta de prueba
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Se eliminará la subcuenta <strong>{subAccount?.name}</strong> del exchange{" "}
              <strong>{subAccount?.exchange}</strong>.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button variant={getSubmitButtonVariant() as any} onClick={handleSubmit}>
            {getSubmitButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 