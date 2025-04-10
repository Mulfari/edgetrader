import { supabase } from './supabase';

/**
 * Verifica si un token ya ha sido utilizado o ha expirado
 * @param token El token a verificar
 * @param type El tipo de token (reset-password o confirm-email)
 * @returns Un objeto con la propiedad 'used' que indica si el token ya fue utilizado o ha expirado
 */
export const verifyTokenUsage = async (token: string, type: 'reset-password' | 'confirm-email'): Promise<{ used: boolean, error?: any, expired?: boolean }> => {
  try {
    // Verificar si el token ya existe en la tabla
    const { data: existingToken, error: fetchError } = await supabase
      .from('used_tokens')
      .select('*')
      .eq('token', token)
      .eq('type', type)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 es el código para "no se encontraron registros"
      console.error('Error al verificar el token:', fetchError);
      return { used: true, error: fetchError };
    }

    // Si el token ya existe, significa que ya fue utilizado
    if (existingToken) {
      return { used: true };
    }

    // Calcular la fecha de expiración según el tipo de token
    const expiresAt = new Date();
    
    // 30 minutos para reset-password, 24 horas para confirm-email
    if (type === 'reset-password') {
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
    } else {
      expiresAt.setHours(expiresAt.getHours() + 24);
    }

    // Si el token no existe, lo registramos como usado con fecha de expiración
    const { error: insertError } = await supabase
      .from('used_tokens')
      .insert([
        { 
          token, 
          type,
          used_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        }
      ]);

    if (insertError) {
      console.error('Error al registrar el token como usado:', insertError);
      return { used: false, error: insertError };
    }

    // El token no ha sido usado previamente
    return { used: false };
  } catch (error) {
    console.error('Error en verifyTokenUsage:', error);
    return { used: true, error };
  }
};

/**
 * Verifica si un token ha expirado
 * @param token El token a verificar
 * @param type El tipo de token (reset-password o confirm-email)
 * @returns Un objeto con la propiedad 'expired' que indica si el token ha expirado
 */
export const checkTokenExpiration = async (token: string, type: 'reset-password' | 'confirm-email'): Promise<{ expired: boolean, error?: any }> => {
  try {
    // Obtener el token de la base de datos
    const { data: tokenData, error: fetchError } = await supabase
      .from('used_tokens')
      .select('expires_at')
      .eq('token', token)
      .eq('type', type)
      .single();

    if (fetchError) {
      console.error('Error al verificar la expiración del token:', fetchError);
      return { expired: true, error: fetchError };
    }

    // Si no hay datos, el token no existe
    if (!tokenData) {
      return { expired: false };
    }

    // Verificar si el token ha expirado
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    return { expired: now > expiresAt };
  } catch (error) {
    console.error('Error en checkTokenExpiration:', error);
    return { expired: true, error };
  }
}; 