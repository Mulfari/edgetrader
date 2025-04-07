# Migración de Autenticación Firebase a Supabase

## Resumen de cambios

Se ha realizado una migración completa del sistema de autenticación de Firebase a Supabase. A continuación se resumen los principales cambios:

### Nuevos archivos y componentes
- `lib/supabase.ts`: Cliente de Supabase y funciones de autenticación (signIn, signUp, signOut, getSession, getUser)
- `hooks/useSupabaseAuth.ts`: Hook personalizado para manejar la autenticación con Supabase

### Cambios en componentes existentes
- `app/dashboard/page.tsx`: Reemplazo de verificación de token por el hook useSupabaseAuth
- `app/layout.tsx`: Actualización del manejo de sesiones y cierre de sesión
- `app/login/page.tsx`: Implementación de inicio de sesión con Supabase
- `app/signup/page.tsx`: Registro de usuarios con Supabase
- `components/SubAccounts.tsx`: Actualización de peticiones API para usar el token de sesión de Supabase

### Tabla Profiles en Supabase
Se ha creado una tabla `profiles` en Supabase con las siguientes columnas:
- `id`: UUID vinculado al usuario de Supabase Auth
- `display_name`: Nombre del usuario
- `date_of_birth`: Fecha de nacimiento
- `language`: Idioma preferido
- `is_email_verified`: Estado de verificación del email
- `registration_completed`: Estado de registro completo
- `account_type`: Tipo de cuenta (email, google, etc.)
- `last_login`: Timestamp del último inicio de sesión
- `device_info`: Información del dispositivo del usuario
- `created_at`: Timestamp de creación
- `updated_at`: Timestamp de última actualización

### Políticas de Seguridad (RLS)
Se han implementado políticas de seguridad Row Level Security (RLS) en Supabase:
- Los usuarios pueden ver únicamente sus propios perfiles
- Los usuarios pueden actualizar únicamente sus propios perfiles
- Los usuarios pueden insertar únicamente sus propios perfiles

### Trigger para Nuevos Usuarios
Se ha implementado un trigger que crea automáticamente un registro en la tabla `profiles` cuando se registra un nuevo usuario en Supabase Auth.

## Variables de Entorno Requeridas
Para el correcto funcionamiento, asegúrate de tener configuradas las siguientes variables de entorno en el archivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

## Funcionalidades Implementadas
- ✅ Registro de usuarios con email y contraseña
- ✅ Inicio de sesión con email y contraseña
- ✅ Cierre de sesión
- ✅ Protección de rutas
- ✅ Sincronización de perfiles de usuario

## Próximos Pasos
- Implementar métodos de autenticación social (Google, GitHub, etc.)
- Mejorar el manejo de errores
- Implementar recuperación de contraseña
