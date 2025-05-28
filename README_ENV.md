# Configuración de Variables de Entorno

## Frontend (frontend-app)

Crea un archivo `.env.local` en la carpeta `frontend-app` con las siguientes variables:

```env
# Variables de entorno para el frontend

# URL de Supabase (obtenida del dashboard de Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave anónima de Supabase (obtenida del dashboard de Supabase)
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-aqui

# URL del backend API
# Para desarrollo local:
NEXT_PUBLIC_API_URL=http://localhost:8000

# Para producción (ejemplo con Railway):
# NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
```

## Backend (btrader-backend)

Crea un archivo `.env` en la carpeta `btrader-backend` con las siguientes variables:

```env
# Puerto del servidor (opcional, por defecto 8000)
PORT=8000

# URL de Supabase (la misma que usas en el frontend, sin NEXT_PUBLIC_)
SUPABASE_URL=https://tu-proyecto.supabase.co

# Service Role Key de Supabase (¡MANTÉN ESTA CLAVE SEGURA!)
# Obténla desde: Dashboard de Supabase → Settings → API → service_role
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

## Verificación

Para verificar que las operaciones funcionen correctamente:

1. **Asegúrate de que el backend esté corriendo** en el puerto configurado
2. **Verifica en la consola del navegador** los logs que agregamos:
   - Deberías ver: `📡 Llamando a: http://localhost:8000/api/subaccounts/user/all-open-perpetual-operations`
   - Si ves un error de CORS o conexión, verifica la URL del backend
3. **Verifica que tengas subcuentas configuradas** en Supabase con API keys válidas
4. **Asegúrate de que las API keys de Bybit** tengan permisos para leer posiciones 