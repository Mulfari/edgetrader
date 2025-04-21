import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Las variables de entorno de Supabase no están configuradas correctamente');
}

// Función para crear el cliente de Supabase con persistencia configurable
export function createSupabaseClient(persistSession = false) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession,
        detectSessionInUrl: true,
        autoRefreshToken: true
      }
    }
  );
}

// Cliente por defecto sin persistencia
export const supabase = createSupabaseClient();

// Función para obtener un cliente con persistencia
export function getPersistedClient() {
  return createSupabaseClient(true);
}

// Escuchar cambios en el estado de autenticación
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // El usuario ha iniciado sesión
  } else if (event === 'SIGNED_OUT') {
    // El usuario ha cerrado sesión
    // Limpiar cualquier dato local si es necesario
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
    }
  } else if (event === 'TOKEN_REFRESHED') {
    // El token se ha renovado automáticamente
    console.log('Token renovado:', session?.access_token ? 'success' : 'failed');
  }
});

export type SupabaseClient = typeof supabase;

export const signInWithEmail = async (email: string, password: string) => {
  try {
    if (!email || !password) {
      throw new Error('El correo y la contraseña son requeridos');
    }

    // Intentar iniciar sesión primero
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Manejar específicamente el error de email no confirmado
    if (signInError?.message?.includes('Email not confirmed')) {
      return {
        data: null,
        error: {
          message: 'Email not confirmed',
          status: 400
        }
      };
    }

    // Si hay otro tipo de error en el inicio de sesión
    if (signInError) {
      // Obtener información del cliente solo si es necesario registrar el intento
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip;
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : null;

      // Registrar intento fallido
      try {
        // Obtener el user_id del usuario que intenta iniciar sesión
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;

        await supabase.rpc('log_login_attempt', { 
          p_user_id: userId || '00000000-0000-0000-0000-000000000000', // UUID nulo para intentos fallidos sin usuario
          p_success: false,
          p_ip_address: ipAddress,
          p_user_agent: userAgent
        });
      } catch (logError) {
        console.error('Error al registrar intento de inicio de sesión:', logError);
        // Continuamos con el flujo normal aunque falle el registro
      }

      return {
        data: null,
        error: signInError
      };
    }

    // Si el inicio de sesión fue exitoso
    if (data?.user) {
      try {
        // Obtener información del cliente
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const ipAddress = ipData.ip;
        const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : null;

        // Registrar inicio de sesión exitoso
        await supabase.rpc('log_login_attempt', { 
          p_user_id: data.user.id,
          p_success: true,
          p_ip_address: ipAddress,
          p_user_agent: userAgent
        });
      } catch (logError) {
        console.error('Error al registrar inicio de sesión exitoso:', logError);
        // Continuamos aunque falle el registro
      }
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error en signInWithEmail:', error);
    return {
      data: null,
      error: {
        message: error.message || 'Error al iniciar sesión',
        status: error.status || 500
      }
    };
  }
};

export const signUpWithEmail = async (email: string, password: string, name?: string, dateOfBirth?: string) => {
  if (!email || !password) {
    throw new Error('Email y contraseña son requeridos');
  }

  if (!name) {
    throw new Error('El nombre es requerido');
  }

  if (!dateOfBirth) {
    throw new Error('La fecha de nacimiento es requerida');
  }

  try {
    // Verificar si el email ya existe usando la nueva función
    const { data: exists, error: checkError } = await supabase
      .rpc('check_email_exists', { email });

    if (checkError) {
      console.error('Error al verificar email:', checkError);
      throw new Error('Error al verificar disponibilidad del email');
    }

    if (exists) {
      throw new Error('Este email ya está registrado');
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('El formato del email no es válido');
    }

    // Validar contraseña
    if (password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    if (!/[A-Z]/.test(password)) {
      throw new Error('La contraseña debe contener al menos una letra mayúscula');
    }

    if (!/[a-z]/.test(password)) {
      throw new Error('La contraseña debe contener al menos una letra minúscula');
    }

    if (!/[0-9]/.test(password)) {
      throw new Error('La contraseña debe contener al menos un número');
    }

    if (!/[!@#$%^&*]/.test(password)) {
      throw new Error('La contraseña debe contener al menos un carácter especial (!@#$%^&*)');
    }

    // Parsear y validar la fecha
    let formattedDate;
    try {
      // Asumiendo que dateOfBirth viene en formato DD/MM/YYYY
      const [day, month, year] = dateOfBirth.split('/');
      
      // Validar los componentes de la fecha
      if (!day || !month || !year || 
          isNaN(parseInt(day)) || 
          isNaN(parseInt(month)) || 
          isNaN(parseInt(year))) {
        throw new Error('Formato de fecha inválido');
      }

      // Validar rangos de día y mes
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      if (dayNum < 1 || dayNum > 31) {
        throw new Error('Día inválido');
      }
      if (monthNum < 1 || monthNum > 12) {
        throw new Error('Mes inválido');
      }
      if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
        throw new Error('Año inválido');
      }

      // Crear fecha en formato YYYY-MM-DD
      formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      // Validar que la fecha sea válida
      const testDate = new Date(formattedDate);
      if (isNaN(testDate.getTime())) {
        throw new Error('Fecha inválida');
      }

      // Validar edad mínima (18 años)
      const today = new Date();
      const birthDate = new Date(formattedDate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        throw new Error('Debes ser mayor de 18 años para registrarte');
      }

    } catch (error: any) {
      throw new Error(error.message || 'Formato de fecha inválido. Use DD/MM/YYYY');
    }

    // Registrar usuario
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name.trim(),
          date_of_birth: formattedDate,
          registration_ip: await fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip),
          registration_timestamp: new Date().toISOString(),
          registration_user_agent: window.navigator.userAgent
        },
        emailRedirectTo: `${window.location.origin}/confirm-email`
      }
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        throw new Error('Este email ya está registrado');
      }
      throw error;
    }

    if (!data.user) {
      throw new Error('No se pudo crear el usuario');
    }

    return {
      ...data,
      message: 'Se ha enviado un correo de verificación. Por favor, verifica tu email antes de iniciar sesión.'
    };

  } catch (error: any) {
    console.error('Error en signUpWithEmail:', error);
    throw error;
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  // Limpiar el token del localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
  
  if (error) throw error;
  return { success: true };
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  
  // Si hay una sesión válida, guardar el token en localStorage
  // para mantener compatibilidad con componentes que aún usan token
  if (session?.access_token) {
    localStorage.setItem('token', session.access_token);
  }
  
  return session;
};

export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getUserProfile = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) return null;

    const { data, error } = await supabase
      .rpc('get_current_profile');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return null;
  }
};

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
      },
    });

    if (error) throw error;
    
    // La redirección será manejada automáticamente por Supabase
    return { data };
  } catch (error) {
    console.error('Error en signInWithGoogle:', error);
    return { error };
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return { data, success: true };
  } catch (error) {
    console.error('Error en resetPassword:', error);
    return { error, success: false };
  }
};

export const updatePassword = async (newPassword: string, currentPassword?: string) => {
  try {
    // Si estamos en el navegador, intentar obtener el token de recuperación
    if (typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        // Si tenemos un token de recuperación, establecerlo antes de actualizar
        const { data: { session }, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '',
        });
        
        if (sessionError) {
          return { 
            success: false, 
            error: sessionError.message || 'Error al establecer la sesión'
          };
        }
      }
    }

    // Si se proporciona contraseña actual, verificarla primero
    if (currentPassword) {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email!,
        password: currentPassword,
      });

      if (signInError || !data?.user) {
        return {
          success: false,
          error: 'La contraseña actual es incorrecta'
        };
      }
    }

    // Actualizar la contraseña
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { 
        success: false, 
        error: error.message || 'Error al actualizar la contraseña'
      };
    }
    
    return { data, success: true, error: null };
  } catch (error: any) {
    console.error('Error en updatePassword:', error);
    return { 
      success: false, 
      error: error.message || 'Error al actualizar la contraseña'
    };
  }
};

export type UserRole = 'limited' | 'pro' | 'admin';

export const updateUserRole = async (userId: string, newRole: UserRole) => {
  try {
    const { data, error } = await supabase
      .rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

    if (error) {
      if (error.message.includes('Solo los administradores')) {
        throw new Error('No tienes permisos para cambiar roles de usuario');
      }
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error al actualizar rol:', error);
    throw error;
  }
};

// Obtener la URL base del API desde las variables de entorno
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error('La variable de entorno NEXT_PUBLIC_API_URL no está configurada');
}

// Función para generar el secreto TOTP y código QR para 2FA
export async function generateTOTPSecret(userId: string) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Error de sesión: ${sessionError.message}`);
    if (!session) throw new Error('No hay sesión activa');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('La variable de entorno NEXT_PUBLIC_API_URL no está configurada');
    }

    const response = await fetch(`${apiUrl}/2fa/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      secret: result.secret,
      qrCodeDataUrl: result.qr,
      error: null
    };
  } catch (error: any) {
    return {
      secret: null,
      qrCodeDataUrl: null,
      error: error.message || 'Error al generar el secreto TOTP'
    };
  }
}

// Función para verificar el token TOTP y activar 2FA
export const verifyTOTPToken = async (userId: string, token: string) => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('No hay sesión activa');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('La variable de entorno NEXT_PUBLIC_API_URL no está configurada');
    }

    const response = await fetch(`${apiUrl}/2fa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ userId, token })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al verificar el token TOTP');
    }

    const result = await response.json();
    return {
      success: result.success,
      error: result.error || null
    };
  } catch (error: any) {
    console.error('Error en verifyTOTPToken:', error);
    // Si hay un error de CORS o de red, consideramos que la verificación falló
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Error de conexión al verificar el token'
      };
    }
    return {
      success: false,
      error: error.message || 'Error al verificar el token TOTP'
    };
  }
};

// Función para verificar si 2FA está habilitado
export const check2FAStatus = async (userId: string) => {
  try {
    console.log('Iniciando verificación de 2FA para usuario:', userId);
    
    if (!userId) {
      throw new Error('ID de usuario no proporcionado');
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`Error de sesión: ${sessionError.message}`);
    }
    if (!session) {
      throw new Error('No hay sesión activa');
    }

    console.log('Obteniendo estado 2FA desde RPC...');
    
    // Llamar directamente a la función RPC de Supabase
    const { data, error } = await supabase.rpc('check_2fa_status', {
      p_user_id: userId
    });

    console.log('Respuesta RPC check_2fa_status:', { data, error });

    if (error) {
      throw new Error(`Error en RPC check_2fa_status: ${error.message}`);
    }

    return {
      is2FAEnabled: data?.is_enabled || false,
      error: null
    };

  } catch (error) {
    console.error('Error detallado en check2FAStatus:', {
      error,
      message: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });

    return {
      is2FAEnabled: false,
      error: error instanceof Error ? error.message : 'Error al verificar el estado de 2FA'
    };
  }
};

// Función para desactivar 2FA
export const disable2FA = async (userId: string, token: string) => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('No hay sesión activa');

    const response = await fetch(`${apiBaseUrl}/2fa/disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      credentials: 'include',
      body: JSON.stringify({ userId, token })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al desactivar 2FA');
    }

    const result = await response.json();
    return {
      success: result.success,
      error: result.error || null
    };
  } catch (error: any) {
    console.error('Error en disable2FA:', error);
    return {
      success: false,
      error: error.message || 'Error al desactivar 2FA'
    };
  }
};

export const updateUserAvatar = async (avatarUrl: string): Promise<{ success: boolean; error: string | null; data?: any }> => {
  try {
    console.log('Iniciando actualización de avatar con URL:', avatarUrl);

    // Validar que tenemos una sesión activa
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error de sesión:', sessionError);
      return {
        success: false,
        error: 'Error de autenticación: ' + sessionError.message
      };
    }

    if (!session?.user) {
      console.error('No hay sesión de usuario');
      return {
        success: false,
        error: 'Usuario no autenticado'
      };
    }

    console.log('Usuario autenticado:', session.user.id);

    // Usar la función RPC update_user_avatar en lugar de actualizar directamente
    const { data, error: updateError } = await supabase
      .rpc('update_user_avatar', {
        avatar_url: avatarUrl
      });

    if (updateError) {
      console.error('Error completo al actualizar avatar:', {
        error: updateError,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        message: updateError.message
      });
      return {
        success: false,
        error: updateError.message || 'Error al actualizar el avatar en la base de datos'
      };
    }

    if (!data) {
      console.error('No se recibieron datos después de la actualización');
      return {
        success: false,
        error: 'No se pudo actualizar el perfil'
      };
    }

    console.log('Avatar actualizado exitosamente:', data);

    return {
      success: true,
      error: null,
      data
    };

  } catch (error: any) {
    console.error('Error detallado al actualizar avatar:', {
      error,
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      details: error?.details,
      hint: error?.hint
    });

    return {
      success: false,
      error: error?.message || 'Error inesperado al actualizar el avatar'
    };
  }
};

export const checkPasswordStatus = async () => {
  try {
    // Intentar obtener la sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) throw sessionError;
    if (!session) {
      // Intentar refrescar la sesión
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;
      if (!refreshedSession) throw new Error('No hay sesión activa');
    }

    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No hay usuario autenticado');

    // Llamar al RPC con el nombre correcto del parámetro
    const { data, error } = await supabase.rpc('check_password_status', {
      p_user_id: user.id
    });

    if (error) throw error;

    // Procesar el resultado
    const status = Array.isArray(data) ? data[0] : data;
    return {
      data: {
        ...status,
        auth_provider: user.app_metadata?.provider || 'email'
      },
      error: null
    };
  } catch (error: any) {
    console.error('Error al verificar estado de contraseña:', error);
    return {
      data: null,
      error: error.message || 'Error al verificar estado de contraseña'
    };
  }
};

export const setInitialPassword = async (password: string, currentPassword?: string) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    if (!user) throw new Error('No hay usuario autenticado');

    const { data, error } = await supabase.rpc('set_initial_password', {
      p_user_id: user.id,
      p_new_password: password,
      p_current_password: currentPassword
    });

    if (error) throw error;

    // Verificar si hay un error en la respuesta
    if (data && !data.success) {
      return {
        success: false,
        error: data.error || 'Error al establecer la contraseña'
      };
    }

    return {
      success: true,
      error: null
    };
  } catch (error: any) {
    console.error('Error al establecer contraseña inicial:', error);
    return {
      success: false,
      error: error.message || 'Error al establecer contraseña inicial'
    };
  }
};

export const rpcVerifyTOTP = async (userId: string, token: string) => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('No hay sesión activa');

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/2fa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId, token })
    });

    if (!response.ok) {
      throw new Error('Error al verificar el token TOTP');
    }

    const result = await response.json();
    return {
      success: result.success,
      error: result.error || null
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al verificar el token TOTP'
    };
  }
}; 