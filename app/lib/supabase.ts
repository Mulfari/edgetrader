import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getUserProfile() {
  try {
    const { data, error } = await supabase
      .rpc('get_current_profile');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    throw error;
  }
}

export async function updateUserAvatar(avatarUrl: string) {
  try {
    const { data, error } = await supabase
      .rpc('update_user_avatar', {
        avatar_url: avatarUrl
      });

    if (error) {
      console.error('Error en updateUserAvatar:', error.message);
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('No se pudo actualizar el avatar');
    }

    return data;
  } catch (error) {
    console.error('Error al actualizar el avatar:', error);
    throw error;
  }
} 