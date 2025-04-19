import { useEffect, useState } from "react";
import { getUserProfile, updateUserAvatar } from "@/lib/supabase";
import Image from "next/image";
import { 
  UserCircle,
  User,
  Mail,
  Calendar,
  Building2,
  Clock,
  Camera,
  X,
  CheckCircle2,
  Crown,
  Clock3,
  Pencil
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { FaSpinner } from 'react-icons/fa';

const predefinedAvatars = [
  { name: 'Sin avatar', url: null },
  { name: 'Ejecutivo', url: 'https://api.dicebear.com/7.x/personas/svg?seed=John&backgroundColor=b6e3f4,c0aede,d1d4f9&style=circle' },
  { name: 'Directora', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Sarah&backgroundColor=ffd5dc,ffdfbf&style=circle' },
  { name: 'Profesional', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Michael&backgroundColor=d1d4f9&style=circle' },
  { name: 'Creativa', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Emma&backgroundColor=c0aede&style=circle' },
  { name: 'Innovador', url: 'https://api.dicebear.com/7.x/personas/svg?seed=David&backgroundColor=b6e3f4&style=circle' },
  { name: 'Dinámica', url: 'https://api.dicebear.com/7.x/personas/svg?seed=Lisa&backgroundColor=ffd5dc&style=circle' },
  { name: 'Técnico', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tech&backgroundColor=b6e3f4' },
  { name: 'Robot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=robot&backgroundColor=c0aede' },
  { name: 'Pixel', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=pixel&backgroundColor=ffd5dc' },
  { name: 'Retro', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=retro&backgroundColor=d1d4f9' },
  { name: 'Aventurero', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=adventure&backgroundColor=ffdfbf' }
];

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  subscription_info: string;
  last_sign_in_formatted: string;
  avatar_url: string;
  avatar_style?: string;
}

// Tipos de avatares disponibles en DiceBear 7.x
const AVATAR_STYLES = {
  personas: 'personas',
  bottts: 'bottts',
  pixelArt: 'pixel-art',
  adventurer: 'adventurer',
  lorelei: 'lorelei',
  avataaars: 'avataaars',
} as const;

type AvatarStyle = keyof typeof AVATAR_STYLES;

// Función para generar URL de avatar con parámetros personalizados
const generateAvatarUrl = (seed: string, style: AvatarStyle, options: Record<string, string> = {}) => {
  const baseUrl = 'https://api.dicebear.com/7.x';
  const queryParams = new URLSearchParams({
    seed,
    ...options,
  });
  return `${baseUrl}/${style}/svg?${queryParams}`;
};

interface AvatarPreviewProps {
  url: string;
  size?: number;
  isSelected?: boolean;
}

// Componente para previsualizar avatar con fallback y loading
const AvatarPreview = ({ url, size = 100, isSelected = false }: AvatarPreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={`relative rounded-full overflow-hidden ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <FaSpinner className="animate-spin text-gray-400" />
        </div>
      )}
      <Image
        src={url}
        alt="Avatar preview"
        width={size}
        height={size}
        className="object-cover"
        priority={true}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100">
          <span className="text-red-500 text-xs">Error</span>
        </div>
      )}
    </div>
  );
};

interface AvatarPreview {
  url: string;
  id: string;
}

export default function SettingsPerfil() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>('personas');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  // Usar los avatares predefinidos en lugar de generarlos
  const [avatarPreviews] = useState(predefinedAvatars.map((avatar, index) => ({
    url: avatar.url || '',
    id: `avatar-${index}`,
    name: avatar.name
  })));

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfile(data);
        if (data.avatar_style) {
          setSelectedStyle(data.avatar_style as AvatarStyle);
        }
      } catch (error) {
        setError('Error al obtener el perfil');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const selectAvatar = async (avatarUrl: string) => {
    try {
      setIsUpdatingAvatar(true);
      const response = await updateUserAvatar(avatarUrl);

      if (!response.success || response.error) {
        throw new Error(response.error || 'Error al actualizar el avatar');
      }

      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl, avatar_style: selectedStyle } : null);
      toast.success('Avatar actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar avatar:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el avatar');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  if (error) return (
    <div className="mx-auto max-w-md bg-gradient-to-br from-red-100 via-yellow-50 to-white dark:from-red-900/40 dark:via-yellow-900/20 dark:to-zinc-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-6 rounded-xl shadow flex flex-col items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12A9 9 0 11 3 12a9 9 0 0118 0z" />
      </svg>
      <div className="font-semibold text-base">{error}</div>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-4 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-medium shadow transition-all"
      >
        Reintentar
      </button>
    </div>
  );

  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {/* Encabezado de perfil mejorado */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 rounded-lg blur opacity-25 animate-pulse"></div>
            <div className="relative h-14 w-14 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 p-[2px] transform hover:scale-105 transition-transform duration-300">
              <div className="h-full w-full rounded-[7px] bg-white dark:bg-zinc-900 flex items-center justify-center backdrop-blur-xl">
                <User className="h-7 w-7 text-violet-500 dark:text-violet-400" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">
              Perfil
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Gestiona tu información personal
            </p>
        </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Avatar y Nombre mejorado */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-gradient-to-r from-violet-500/[0.03] to-fuchsia-500/[0.03] border border-violet-500/10 hover:border-violet-500/20 transition-all duration-300"
          >
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-4">
                {isLoading ? (
                  <div className="animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700 h-28 w-28" />
                ) : (
                  <>
                    <div className="relative h-28 w-28 rounded-full ring-4 ring-white dark:ring-zinc-900 shadow-xl">
                      {profile?.avatar_url ? (
                        <AvatarPreview
                          url={profile.avatar_url}
                          size={112}
                        />
                      ) : (
                        <div className="h-full w-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center">
                          <UserCircle className="h-14 w-14 text-violet-500/30" />
                        </div>
                      )}
                    </div>
          <button
            onClick={() => setShowAvatarModal(true)}
                      disabled={isLoading}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 shadow-lg 
                        rounded-full p-2 border-2 border-violet-500/20 hover:border-violet-500 
                        transition-all duration-200 group"
                      title="Modificar avatar"
                    >
                      <Pencil className="h-4 w-4 text-violet-500 group-hover:scale-110 transition-transform duration-200" />
          </button>
                  </>
                )}
              </div>
              {isLoading ? (
                <div className="space-y-3 w-full max-w-[200px]">
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded-md w-full animate-pulse mx-auto" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded-md w-4/5 animate-pulse mx-auto" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                      {profile?.full_name}
                    </h3>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{profile?.email}</span>
                  </div>
                </>
              )}
            </div>

            {/* Información de la cuenta */}
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Crown className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Rol</span>
                    {isLoading ? (
                      <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-20 animate-pulse mt-1" />
                    ) : (
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{profile?.role}</p>
                    )}
                  </div>
                </div>
                {!isLoading && (
                  <Badge variant="outline" className="bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20">
                    {profile?.role}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Crown className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Plan</span>
                    {isLoading ? (
                      <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-24 animate-pulse mt-1" />
                    ) : (
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{profile?.subscription_info}</p>
                    )}
                  </div>
                </div>
                {!isLoading && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                    {profile?.subscription_info}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Clock3 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Último acceso</span>
                    {isLoading ? (
                      <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-32 animate-pulse mt-1" />
                    ) : (
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{profile?.last_sign_in_formatted}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        </div>

      {/* Modal de selección de avatar mejorado */}
      <AnimatePresence>
        {showAvatarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative border border-violet-500/10
                bg-gradient-to-b from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-900/50"
            >
              <button
                onClick={() => setShowAvatarModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5 text-zinc-500" />
              </button>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">
                  Elige tu avatar
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Selecciona una imagen que te represente
                </p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {avatarPreviews.map((avatar) => (
                  <motion.button
                    key={avatar.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Number(avatar.id.split('-')[1]) * 0.05 }}
                    onClick={() => {
                      selectAvatar(avatar.url);
                      setShowAvatarModal(false);
                    }}
                    className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 focus:outline-none
                      ${profile?.avatar_url === avatar.url
                        ? 'border-violet-500 ring-2 ring-violet-500/30 bg-violet-500/10 scale-105 shadow-lg shadow-violet-500/20'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-violet-500/40 hover:bg-violet-500/5 hover:scale-105 hover:shadow-lg'}
                      transform hover:-translate-y-1 hover:shadow-violet-500/20
                    `}
                  >
                    <div className="relative w-16 h-16 rounded-lg p-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 group-hover:opacity-100 transition-opacity duration-300">
                    {avatar.url ? (
                        <AvatarPreview
                          url={avatar.url}
                          size={64}
                        />
                    ) : (
                        <div className="w-full h-full rounded-md bg-white dark:bg-zinc-900 flex items-center justify-center">
                          <UserCircle className="w-10 h-10 text-violet-500/30" />
                        </div>
                    )}
                    </div>
                    <span className={`mt-3 text-xs font-medium ${
                      profile?.avatar_url === avatar.url 
                        ? 'text-violet-500' 
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}>
                      {avatar.name}
                    </span>
                    {profile?.avatar_url === avatar.url && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-violet-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
