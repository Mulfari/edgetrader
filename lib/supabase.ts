import { createClient } from '@supabase/supabase-js';
import { verifyTokenUsage, checkTokenExpiration } from './tokenVerification';

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

    // Registrar usuario
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name.trim(),
          date_of_birth: formattedDate
        },
        emailRedirectTo: `${window.location.origin}/confirm-email`
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

export const updatePassword = async (password: string) => {
  try {
    // Si estamos en el navegador, intentar obtener el token de recuperación
    if (typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        // Verificar si el token ya ha sido utilizado
        const { used, error: tokenError } = await verifyTokenUsage(accessToken, 'reset-password');
        
        if (tokenError) {
          throw new Error('Error al verificar el token');
        }
        
        if (used) {
          throw new Error('Este enlace de restablecimiento de contraseña ya ha sido utilizado. Por favor, solicita un nuevo enlace.');
        }
        
        // Verificar si el token ha expirado
        const { expired, error: expirationError } = await checkTokenExpiration(accessToken, 'reset-password');
        
        if (expirationError) {
          throw new Error('Error al verificar la expiración del token');
        }
        
        if (expired) {
          throw new Error('Este enlace de restablecimiento de contraseña ha expirado. Por favor, solicita un nuevo enlace.');
        }
        
        // Si tenemos un token de recuperación, establecerlo antes de actualizar
        // Esto es necesario para que la API nos permita actualizar la contraseña
        const { data: { session }, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '',
        });
        
        if (sessionError) throw sessionError;
      }
    }

    // Actualizar la contraseña
    const { data, error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) throw error;
    
    // Cerrar la sesión para que el usuario tenga que iniciar sesión explícitamente
    await supabase.auth.signOut();
    
    // Limpiar tokens de la URL y localStorage
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
      localStorage.removeItem('token');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.refresh_token');
      localStorage.removeItem('supabase.auth.expires_at');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error en updatePassword:', error);
    return { success: false, error };
  }
}; 