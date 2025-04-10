import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Las variables de entorno de Supabase no están configuradas correctamente');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signInWithEmail = async (email: string, password: string) => {
  if (typeof window === 'undefined') {
    throw new Error('Esta función solo puede ser ejecutada en el cliente');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
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
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('El formato del email no es válido');
    }

    // Validar contraseña
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
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

    // Generar un token único para la confirmación de email
    const confirmToken = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    // Guardar registro de este token para validación posterior
    if (typeof window !== 'undefined') {
      const confirmInfo = {
        token: confirmToken,
        email: email,
        created_at: Date.now(),
        expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 días
        is_used: false
      };
      localStorage.setItem(`email_confirm_${confirmToken}`, JSON.stringify(confirmInfo));
    }

    // Registrar usuario con el token personalizado en la URL de redirección
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name.trim(),
          date_of_birth: formattedDate
        },
        emailRedirectTo: `${window.location.origin}/confirm-email?token=${confirmToken}`
      }
    });

    if (error) {
      if (error.message?.toLowerCase().includes('user already registered')) {
        throw new Error('Este email ya está registrado');
      }
      throw error;
    }

    if (!data.user) {
      throw new Error('No se pudo crear el usuario');
    }

    return data;

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

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        skipBrowserRedirect: true,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
          hd: 'domain.com', // Opcional: para restringir a un dominio específico
        },
      },
    });

    if (error) throw error;
    
    return { data, url: data.url };
  } catch (error) {
    console.error('Error en signInWithGoogle:', error);
    return { error };
  }
};

export const resetPassword = async (email: string) => {
  try {
    // Generar un token único para esta solicitud de restablecimiento
    const resetId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    
    // Guardar el token en localStorage para validación posterior
    if (typeof window !== 'undefined') {
      // Guardar información del token con expiración
      const resetTokenInfo = {
        resetId: resetId,
        email: email,
        created_at: Date.now(),
        expires_at: Date.now() + (60 * 60 * 1000), // 1 hora en milisegundos
        is_used: false
      };
      localStorage.setItem(`reset_token_${resetId}`, JSON.stringify(resetTokenInfo));
    }
    
    // Configuración del enlace de restablecimiento
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?token=${resetId}`
    });

    if (error) throw error;
    return { data, success: true };
  } catch (error) {
    console.error('Error en resetPassword:', error);
    return { error, success: false };
  }
};

export const updatePassword = async (password: string) => {
  try {
    // Si estamos en el navegador, intentar obtener el token de recuperación
    if (typeof window !== 'undefined') {
      // Buscar el token en sessionStorage (donde lo guardamos)
      const accessToken = sessionStorage.getItem('reset_token');
      
      if (accessToken) {
        // Primero establecemos temporalmente el token para autorizar la operación
        // pero configuramos para no mantener la sesión
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: ''
        });
        
        // Actualizar la contraseña
        const { data, error } = await supabase.auth.updateUser({
          password: password
        });
        
        if (error) throw error;
        
        // Cerrar inmediatamente la sesión temporal que se creó
        await supabase.auth.signOut({ scope: 'global' });
        
        // Eliminar todos los posibles tokens del localStorage y sessionStorage
        if (typeof window !== 'undefined') {
          // Limpiar localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('supabase.auth.token');
          
          // Limpiar sessionStorage
          sessionStorage.removeItem('reset_token');
          sessionStorage.removeItem('valid_reset_token');
          
          // Buscar y eliminar todas las claves relacionadas con auth de Supabase
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase.auth') || key.includes('token')) {
              // No eliminamos los tokens de restablecimiento usados para mantener registro
              // y evitar su reutilización
              if (!key.includes('reset_token_')) {
                localStorage.removeItem(key);
              }
            }
          });
        }
        
        return { data, success: true };
      }
    }

    throw new Error('No se encontró un token de acceso válido');
  } catch (error) {
    console.error('Error en updatePassword:', error);
    return { error, success: false };
  }
}; 