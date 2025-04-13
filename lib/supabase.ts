import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Las variables de entorno de Supabase no están configuradas correctamente');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});


export const signInWithEmail = async (email: string, password: string) => {
  try {
    if (!email || !password) {
      throw new Error('El correo y la contraseña son requeridos');
    }

    // Obtener IP del usuario
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    const ipAddress = ipData.ip;
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : null;

    // Intentar iniciar sesión primero
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Registrar intento fallido
      await supabase.rpc('log_login_attempt', { 
        p_email: email,
        p_success: false,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });
      throw error;
    }

    // Si el inicio de sesión fue exitoso, verificar o crear el perfil
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('is_email_verified, failed_login_attempts, last_failed_login')
      .eq('email', email)
      .single();

    // Si no existe el perfil, crearlo
    if (userError?.message?.includes('Results contain 0 rows')) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: data.user.id,
            email: email,
            is_email_verified: true,
            failed_login_attempts: 0,
            role: 'limited'
          }
        ]);

      if (insertError) {
        console.error('Error al crear perfil:', insertError);
        // No lanzamos error aquí, permitimos continuar
      }
    } else if (userError) {
      console.error('Error al verificar el perfil:', userError);
      throw new Error('Error al verificar el estado de la cuenta');
    } else {
      // Si existe el perfil, verificar bloqueos y estado
      if (!user.is_email_verified) {
        throw new Error('Por favor, verifica tu correo electrónico antes de iniciar sesión');
      }

      // Verificar si la cuenta está bloqueada
      if (user.failed_login_attempts >= 5 && user.last_failed_login) {
        const lockoutTime = new Date(user.last_failed_login);
        const now = new Date();
        const minutesSinceLastAttempt = (now.getTime() - lockoutTime.getTime()) / 1000 / 60;

        if (minutesSinceLastAttempt < 30) {
          throw new Error('Cuenta bloqueada temporalmente. Por favor, intente de nuevo en 30 minutos.');
        }
      }
    }

    // Resetear intentos fallidos
    await supabase.rpc('reset_failed_login_attempts', { user_email: email });
    
    // Registrar inicio de sesión exitoso
    await supabase.rpc('log_login_attempt', { 
      p_email: email,
      p_success: true,
      p_ip_address: ipAddress,
      p_user_agent: userAgent
    });

    return { data, error: null };
  } catch (error: any) {
    console.error('Error en signInWithEmail:', error);
    return {
      data: null,
      error: error.message || 'Error al iniciar sesión'
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
        redirectTo: `${window.location.origin}/dashboard`,
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

export const updatePassword = async (password: string) => {
  try {
    // Si estamos en el navegador, intentar obtener el token de recuperación
    if (typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
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
    
    // Limpiar los tokens del localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    
    return { data, success: true };
  } catch (error) {
    console.error('Error en updatePassword:', error);
    return { error, success: false };
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