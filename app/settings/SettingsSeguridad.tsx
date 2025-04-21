import { useState, useEffect } from "react";
import { 
  Shield,
  Key,
  Smartphone,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  AlertCircle,
  Info,
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { 
  updatePassword, 
  generateTOTPSecret, 
  verifyTOTPToken, 
  check2FAStatus, 
  disable2FA,
  checkPasswordStatus,
  setInitialPassword
} from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface TOTPSetupState {
  qrCode: string | null;
  secret: string | null;
  token: string;
  isLoading: boolean;
  error: string | null;
}

interface UpdatePasswordResponse {
  data?: any;
  error: string | null;
  success: boolean;
}

interface PasswordStatus {
  has_password: boolean;
  can_set_password: boolean;
  can_reset_password: boolean;
  auth_provider?: string;
}

export default function SettingsSeguridad() {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Partial<PasswordForm>>({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<PasswordStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Estados para 2FA
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading2FA, setIsLoading2FA] = useState(true);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [totpSetup, setTotpSetup] = useState<TOTPSetupState>({
    qrCode: null,
    secret: null,
    token: '',
    isLoading: false,
    error: null
  });
  const [disableToken, setDisableToken] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [disable2FAError, setDisable2FAError] = useState<string | null>(null);

  // Verificar estado de contraseña
  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.id) return;
      
      try {
        // Primero verificamos que tengamos una sesión válida
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Intentar refrescar la sesión
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
          if (!refreshedSession) {
            throw new Error('No se pudo recuperar la sesión');
          }
        }

        const { data, error } = await supabase.rpc('check_password_status', { p_user_id: user.id });
        if (error) throw new Error(error.message);
        // Tomamos el primer elemento del array si existe
        setPasswordStatus(Array.isArray(data) && data.length > 0 ? data[0] : data);
      } catch (error: any) {
        console.error('Error al verificar estado de contraseña:', error);
        // Si el error es de sesión, intentamos redirigir al login
        if (typeof error.message === 'string' && error.message.includes('session')) {
          toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          // Opcional: redirigir al login
          // window.location.href = '/login';
        } else {
          toast.error('Error al verificar estado de contraseña');
        }
      } finally {
        setIsLoadingStatus(false);
      }
    };

    checkStatus();
  }, [user]);

  // Verificar estado inicial de 2FA
  useEffect(() => {
    const check2FA = async () => {
      if (!user?.id) {
        setIsLoading2FA(false);
        return;
      }
      
      try {
        setIsLoading2FA(true);
        const { data, error } = await supabase.rpc('check_2fa_status', {
          p_user_id: user.id
        });
        
        if (error) {
          toast.error('Error al verificar estado de 2FA');
          return;
        }

        // Asegurarnos de que data sea un booleano
        const is2FAActive = data === true;
        
        setIs2FAEnabled(is2FAActive);
      } catch (error) {
        toast.error('Error al verificar estado de 2FA');
      } finally {
        setIsLoading2FA(false);
      }
    };

    check2FA();
  }, [user?.id]);

  // Función para iniciar la configuración de 2FA
  const handleSetup2FA = async () => {
    if (!user?.id) {
      toast.error('Usuario no autenticado');
      return;
    }

    setTotpSetup(prev => ({ ...prev, isLoading: true, error: null }));
    setShow2FASetup(true);
    
    try {
      const { secret, qrCodeDataUrl, error } = await generateTOTPSecret(user.id);
      
      // Si el error indica que 2FA ya está habilitado
      if (error?.includes('ya está habilitada')) {
        toast.error(error);
        setShow2FASetup(false);
        setIs2FAEnabled(true); // Actualizamos el estado local
        return;
      }

      if (error) throw new Error(error);
      if (!secret || !qrCodeDataUrl) throw new Error('Error generando códigos');

      setTotpSetup({
        qrCode: qrCodeDataUrl,
        secret: secret,
        token: '',
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setTotpSetup(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Error al configurar 2FA',
        qrCode: null,
        secret: null
      }));
      toast.error(error.message || 'Error al configurar 2FA');
    } finally {
      setTotpSetup(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Función para verificar y activar 2FA
  const handleVerify2FA = async () => {
    if (!user?.id || !totpSetup.token) {
      toast.error('Por favor, ingresa el código de verificación');
      return;
    }

    if (totpSetup.token.length !== 6) {
      setTotpSetup(prev => ({ ...prev, error: 'El código debe tener 6 dígitos' }));
      return;
    }

    setTotpSetup(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { success, error } = await verifyTOTPToken(user.id, totpSetup.token);
      
      if (!success || error) {
        throw new Error(error || 'Error al verificar el código');
      }

      // Actualizar el estado local
      setIs2FAEnabled(true);
      setShow2FASetup(false);
      setTotpSetup({
        qrCode: null,
        secret: null,
        token: '',
        isLoading: false,
        error: null
      });

      toast.success('Autenticación de dos factores activada correctamente');
    } catch (error: any) {
      setTotpSetup(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Error al verificar el código'
      }));
      toast.error(error.message || 'Error al verificar el código');
    }
  };

  // Función para desactivar 2FA
  const handleDisable2FA = async () => {
    if (!user?.id) {
      toast.error('Usuario no autenticado');
      return;
    }

    if (!disableToken) {
      setDisable2FAError('Por favor, ingresa el código de verificación');
      return;
    }

    if (disableToken.length !== 6) {
      setDisable2FAError('El código debe tener 6 dígitos');
      return;
    }

    setIsDisabling2FA(true);
    setDisable2FAError(null);

    try {
      // Primero verificamos el token
      const { success: isValidToken, error: verifyError } = await verifyTOTPToken(user.id, disableToken);
      
      if (!isValidToken || verifyError) {
        throw new Error(verifyError || 'Código de verificación inválido');
      }

      // Si el token es válido, procedemos a desactivar 2FA
      const { error: disableError } = await disable2FA(user.id, disableToken);
      
      if (disableError) {
        throw new Error(disableError);
      }

      // Actualizar estado local
      setIs2FAEnabled(false);
      setShowDisableForm(false);
      setDisableToken('');
      toast.success('Autenticación de dos factores desactivada correctamente');
    } catch (error: any) {
      setDisable2FAError(error.message || 'Error al desactivar 2FA');
      toast.error(error.message || 'Error al desactivar 2FA');
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const validatePasswordForm = () => {
    const errors: Partial<PasswordForm> = {};
    
    // Solo validar contraseña actual si el usuario ya tiene una contraseña configurada
    if (!passwordStatus?.can_set_password) {
      if (!passwordForm.currentPassword) {
        errors.currentPassword = 'La contraseña actual es requerida';
      }
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'La nueva contraseña es requerida';
    } else {
      const hasMinLength = passwordForm.newPassword.length >= 8;
      const hasUpperCase = /[A-Z]/.test(passwordForm.newPassword);
      const hasLowerCase = /[a-z]/.test(passwordForm.newPassword);
      const hasNumber = /\d/.test(passwordForm.newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.newPassword);

      if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
        errors.newPassword = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial';
      }

      // Solo validar que sea diferente si el usuario ya tiene contraseña
      if (!passwordStatus?.can_set_password && passwordForm.newPassword === passwordForm.currentPassword) {
        errors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
      }
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'La confirmación de contraseña es requerida';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    return errors;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('Usuario no autenticado');
      return;
    }

    const errors = validatePasswordForm();
    setPasswordErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setIsChangingPassword(true);

    try {
      let response;
      
      if (passwordStatus?.can_set_password) {
        // Establecer contraseña inicial
        const { data, error } = await supabase.rpc('set_initial_password', {
          p_user_id: user.id,
          p_new_password: passwordForm.newPassword
        });
        
        response = { success: !error, error: error?.message };
      } else {
        // Actualizar contraseña existente
        const { data, error } = await supabase.rpc('update_user_password', {
          p_user_id: user.id,
          p_current_password: passwordForm.currentPassword,
          p_new_password: passwordForm.newPassword
        });
        
        response = { success: !error, error: error?.message };
      }

      if (!response.success) {
        // Si el error está relacionado con la contraseña actual
        if (response.error?.toLowerCase().includes('contraseña actual')) {
          setPasswordErrors(prev => ({
            ...prev,
            currentPassword: response.error
          }));
          return;
        }
        throw new Error(response.error);
      }

      // Actualizar el estado inmediatamente después de una operación exitosa
      setPasswordStatus({
        has_password: true,
        can_set_password: false,
        can_reset_password: true,
        auth_provider: passwordStatus?.auth_provider
      });

      toast.success('Contraseña actualizada correctamente');
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setShowPasswordForm(false);

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar la contraseña';
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Renderizado condicional del formulario de configuración 2FA
  const render2FASetupForm = () => {
    if (!show2FASetup) return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{
          type: "spring",
          duration: 0.5,
          bounce: 0.2
        }}
        className="mt-4 space-y-4"
      >
        <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="text-center space-y-4">
            <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
              Configura la autenticación de dos factores
            </h3>
            
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                1. Instala una aplicación de autenticación como Google Authenticator o Authy
              </p>
              {totpSetup.qrCode && (
                <div className="flex justify-center">
                  <div className="p-2 bg-white rounded-lg w-48 h-48">
                    <img
                      src={totpSetup.qrCode}
                      alt="Código QR para 2FA"
                      width={192}
                      height={192}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}
              {totpSetup.secret && (
                <>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    2. Escanea el código QR o ingresa esta clave manualmente:
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-xs font-mono">
                      {totpSetup.secret}
                    </code>
                  </div>
                </>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                3. Ingresa el código de verificación generado:
              </p>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={totpSetup.token}
                    onChange={(e) => setTotpSetup(prev => ({ ...prev, token: e.target.value, error: null }))}
                    placeholder="000000"
                    disabled={totpSetup.isLoading}
                    className={`block w-full px-3 py-2 text-center border ${
                      totpSetup.error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-zinc-300 dark:border-zinc-600 focus:ring-amber-500 focus:border-amber-500'
                    } rounded-lg shadow-sm dark:bg-zinc-800 dark:text-white text-sm transition-colors duration-200 ${
                      totpSetup.isLoading ? 'bg-zinc-50 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500' : ''
                    }`}
                    maxLength={6}
                  />
                  {totpSetup.isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-800/50 rounded-lg backdrop-blur-[1px]">
                      <div className="relative">
                        <div className="h-4 w-4 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin"></div>
                      </div>
                    </div>
                  )}
                </div>
                <AnimatePresence mode="wait">
                  {totpSetup.error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-red-500 text-center"
                    >
                      {totpSetup.error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShow2FASetup(false);
                  setTotpSetup({
                    qrCode: null,
                    secret: null,
                    token: '',
                    isLoading: false,
                    error: null
                  });
                }}
                disabled={totpSetup.isLoading}
                className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 
                  hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleVerify2FA}
                disabled={totpSetup.isLoading || !totpSetup.token}
                className="relative flex items-center justify-center px-4 py-2 text-sm font-medium text-white 
                  bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 
                  rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[120px]"
              >
                <span className={`${totpSetup.isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}>
                  Verificar y activar
                </span>
                {totpSetup.isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {/* Encabezado mejorado */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-lg blur opacity-25 animate-pulse"></div>
            <div className="relative h-12 w-12 rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-[2px] transform hover:scale-105 transition-transform duration-300">
              <div className="h-full w-full rounded-[7px] bg-white dark:bg-zinc-900 flex items-center justify-center backdrop-blur-xl">
                <Shield className="h-6 w-6 text-amber-500 dark:text-amber-400" />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-500">
              Seguridad
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Protege tu cuenta
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Contraseña */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-r from-amber-500/[0.03] to-orange-500/[0.03] border border-amber-500/10 hover:border-amber-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <Key className="h-4 w-4 text-amber-500" />
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  Contraseña
                </span>
              </div>
              {isLoadingStatus ? (
                <div className="animate-pulse h-6 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" />
              ) : (
                <>
                  {passwordStatus?.can_set_password ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                        No configurada
                      </Badge>
                      <button 
                        onClick={() => setShowPasswordForm(true)}
                        className="px-3 py-1 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 
                          focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 rounded-md
                          transition-all duration-200"
                      >
                        Establecer
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowPasswordForm(prev => !prev)}
                      className="px-3 py-1 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 
                        focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 rounded-md
                        transition-all duration-200"
                    >
                      {showPasswordForm ? 'Cancelar' : 'Cambiar'}
                    </button>
                  )}
                </>
              )}
            </div>

            {!isLoadingStatus && passwordStatus?.auth_provider === 'google' && passwordStatus.can_set_password && (
              <div className="mb-4 flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-500/5 p-2 rounded-lg">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs">
                  Tu cuenta fue creada usando Google. Establecer una contraseña te permitirá también iniciar sesión con tu email y contraseña.
                </p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {showPasswordForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    type: "spring",
                    duration: 0.5,
                    bounce: 0.2
                  }}
                  className="overflow-hidden"
                >
                  <motion.form 
                    onSubmit={handlePasswordChange}
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-4 bg-white/50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700/50"
                  >
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {/* Contraseña actual - solo mostrar si ya tiene contraseña configurada */}
                      {!passwordStatus?.can_set_password && (
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="relative">
                            <input
                              type={showPasswords.current ? "text" : "password"}
                              placeholder="Contraseña actual"
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                              className={`block w-full px-3 py-2 border ${
                                passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                              } rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-zinc-800 dark:text-white text-sm`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPasswords.current ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                          {passwordErrors.currentPassword && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mt-1 text-xs text-red-600"
                            >
                              {passwordErrors.currentPassword}
                            </motion.p>
                          )}
                        </motion.div>
                      )}

                      {/* Nueva contraseña */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <div className="relative">
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            placeholder="Nueva contraseña"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className={`block w-full px-3 py-2 border ${
                              passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                            } rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-zinc-800 dark:text-white text-sm`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.newPassword && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-1 text-xs text-red-600"
                          >
                            {passwordErrors.newPassword}
                          </motion.p>
                        )}
                      </motion.div>

                      {/* Confirmar nueva contraseña */}
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            placeholder="Confirmar nueva contraseña"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className={`block w-full px-3 py-2 border ${
                              passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                            } rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 dark:bg-zinc-800 dark:text-white text-sm`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-1 text-xs text-red-600"
                          >
                            {passwordErrors.confirmPassword}
                          </motion.p>
                        )}
                      </motion.div>
                    </motion.div>

                    <motion.div 
                      className="flex justify-end"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="relative flex items-center justify-center px-4 py-2 text-sm font-medium text-white 
                          bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 
                          rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500
                          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[160px]
                          transform hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20"
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Actualizando...
                          </>
                        ) : (
                          'Actualizar contraseña'
                        )}
                      </button>
                    </motion.div>
                  </motion.form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Autenticación 2FA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-gradient-to-r from-amber-500/[0.03] to-orange-500/[0.03] border border-amber-500/10 hover:border-amber-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <Smartphone className="h-4 w-4 text-amber-500" />
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  Autenticación 2FA
                </span>
              </div>
              <AnimatePresence mode="wait">
                {isLoading2FA ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500/20 border-t-amber-500"/>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    {is2FAEnabled ? (
                      <>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Activado
                        </Badge>
                        <button
                          onClick={() => setShowDisableForm(true)}
                          className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 
                            focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:focus:ring-red-400/20 rounded-md
                            transition-all duration-200"
                        >
                          Desactivar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleSetup2FA}
                        disabled={totpSetup.isLoading}
                        className="px-3 py-1 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 
                          focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:focus:ring-amber-400/20 rounded-md
                          transition-all duration-200"
                      >
                        {totpSetup.isLoading ? 'Generando...' : 'Activar'}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              {render2FASetupForm()}
              {showDisableForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    type: "spring",
                    duration: 0.5,
                    bounce: 0.2
                  }}
                  className="mt-4"
                >
                  <div className="p-4 bg-white/50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">
                          ¿Estás seguro de que deseas desactivar 2FA?
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Ingresa un código de verificación de tu aplicación de autenticación para confirmar:
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={disableToken}
                            onChange={(e) => {
                              setDisableToken(e.target.value);
                              setDisable2FAError(null);
                            }}
                            placeholder="000000"
                            className={`block w-full px-3 py-2 text-center border ${
                              disable2FAError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-zinc-300 dark:border-zinc-600 focus:ring-amber-500 focus:border-amber-500'
                            } rounded-lg shadow-sm dark:bg-zinc-800 dark:text-white text-sm`}
                            maxLength={6}
                          />
                        </div>
                        <AnimatePresence mode="wait">
                          {disable2FAError && (
                            <motion.p
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="text-xs text-red-500 text-center"
                            >
                              {disable2FAError}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setShowDisableForm(false);
                            setDisableToken('');
                            setDisable2FAError(null);
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 
                            hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleDisable2FA}
                          disabled={isDisabling2FA || !disableToken}
                          className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white 
                            bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700
                            rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
                            disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                            transform hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                        >
                          {isDisabling2FA ? (
                            <>
                              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                              Desactivando...
                            </>
                          ) : (
                            'Desactivar 2FA'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 