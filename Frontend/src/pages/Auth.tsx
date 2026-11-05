import { useState, useId } from "react";
import { useLocation } from "wouter";
import {
  User,
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth.service";

interface AuthProps {
  initialMode?: "login" | "register";
}

type AuthMode = "login" | "register" | "forgot";
type ForgotStep = "request" | "verify";

export default function Auth({ initialMode }: AuthProps) {
  const [location, setLocation] = useLocation();
  const isRegisterRoute = initialMode === "register" || location.includes("register");
  const [mode, setMode] = useState<AuthMode>(isRegisterRoute ? "register" : "login");
  const [forgotStep, setForgotStep] = useState<ForgotStep>("request");

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { checkSession } = useAuth();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const nameInputId = useId();
  const loginIdInput = useId();
  const loginPassInput = useId();
  const resetCodeInputId = useId();
  const newPassInputId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (mode === "register" && name.trim().length < 2) {
      setMessage({ type: "error", text: "El nombre debe tener al menos 2 caracteres." });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        await authService.login({
          email: identifier,
          password,
        });
        setMessage({
          type: "success",
          text: "¡Inicio de sesión exitoso!",
        });
      } else {
        await authService.register({
          name,
          email: identifier,
          password,
        });
        setMessage({
          type: "success",
          text: "¡Cuenta creada e inicio de sesión exitoso!",
        });
      }

      await checkSession();
      setLocation("/catalogo");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al procesar la solicitud.";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!identifier.trim()) {
      setMessage({
        type: "error",
        text: "Por favor, ingresa tu correo electrónico.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await authService.forgotPassword(identifier);
      setForgotStep("verify");
      setMessage({
        type: "success",
        text: response.message,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo procesar la solicitud de recuperación.";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const trimmedCode = resetCode.trim();
    if (trimmedCode.length !== 6) {
      setMessage({
        type: "error",
        text: "El código de verificación debe tener exactamente 6 dígitos.",
      });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "La nueva contraseña debe tener al menos 8 caracteres.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword({
        email: identifier,
        code: trimmedCode,
        newPassword,
      });

      setMessage({
        type: "success",
        text: response.message,
      });

      setPassword("");
      setResetCode("");
      setNewPassword("");

      setTimeout(() => {
        setForgotStep("request");
        setMode("login");
      }, 1500);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "El código ingresado es incorrecto o ha expirado.";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-share">
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:28px_28px] pointer-events-none" />
      <div className="absolute -top-40 -left-40 size-96 rounded-full bg-zinc-800/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-zinc-800/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mb-6 flex items-center justify-between z-10">
        <button
          onClick={handleGoHome}
          type="button"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition cursor-pointer group"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver al inicio</span>
        </button>
        <span className="text-xs uppercase tracking-widest text-zinc-600 font-mono">
          El sótano del pc
        </span>
      </div>

      <div className="w-full max-w-md bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="size-12 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldCheck className="size-6 text-zinc-200" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-white">
            {mode === "login"
              ? "Iniciar Sesión"
              : mode === "register"
                ? "Crear Cuenta"
                : "Recuperar Contraseña"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wide">
            {mode === "login"
              ? "Accede a tus configuraciones y favoritos"
              : mode === "register"
                ? "Únete a la comunidad de El Sótano del PC"
                : forgotStep === "request"
                  ? "Te enviaremos un código de 6 dígitos a tu correo"
                  : "Ingresa el código de 6 dígitos enviado a tu correo"}
          </p>
        </div>

        {mode !== "forgot" && (
          <div className="grid grid-cols-2 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage(null);
              }}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-white text-zinc-950 shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setMessage(null);
              }}
              className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-white text-zinc-950 shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        {message && (
          <div
            className={`mb-5 p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              message.type === "success"
                ? "bg-emerald-950/50 border-emerald-700/60 text-emerald-300"
                : "bg-red-950/50 border-red-700/60 text-red-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertCircle className="size-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {mode !== "forgot" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label
                  htmlFor={nameInputId}
                  className="block text-xs uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Nombre o Alias
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                  <input
                    id={nameInputId}
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej: Nuz"
                    className="w-full h-11 pl-10 pr-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor={loginIdInput}
                className="block text-xs uppercase tracking-wider text-zinc-300 mb-1.5"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <input
                  id={loginIdInput}
                  type="email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ej: tu@email.com"
                  className="w-full h-11 pl-10 pr-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={loginPassInput}
                  className="block text-xs uppercase tracking-wider text-zinc-300"
                >
                  Contraseña
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setForgotStep("request");
                      setMessage(null);
                    }}
                    className="text-[11px] uppercase tracking-wider text-zinc-400 hover:text-white underline underline-offset-4 transition cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <input
                  id={loginPassInput}
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-11 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition p-1"
                  aria-label="Ver contraseña"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-12 bg-white text-zinc-950 font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-zinc-200 active:scale-98 transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Procesando...</span>
              ) : mode === "login" ? (
                "Ingresar a la plataforma"
              ) : (
                "Registrarse en la plataforma"
              )}
            </button>
          </form>
        ) : forgotStep === "request" ? (
          <form onSubmit={handleRequestResetCode} className="space-y-4">
            <div>
              <label
                htmlFor={loginIdInput}
                className="block text-xs uppercase tracking-wider text-zinc-300 mb-1.5"
              >
                Correo Electrónico de tu cuenta
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <input
                  id={loginIdInput}
                  type="email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ej: tu@email.com"
                  className="w-full h-11 pl-10 pr-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-12 bg-white text-zinc-950 font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-zinc-200 active:scale-98 transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Enviando código...</span>
              ) : (
                "Enviar código de verificación"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage(null);
              }}
              className="w-full h-10 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Volver a Iniciar Sesión
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyResetPassword} className="space-y-4">
            <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
              Se ha enviado un código de 6 dígitos a{" "}
              <span className="text-white font-bold">{identifier}</span>. El código caduca en 15
              minutos.
            </div>

            <div>
              <label
                htmlFor={resetCodeInputId}
                className="block text-xs uppercase tracking-wider text-zinc-300 mb-1.5"
              >
                Código de 6 dígitos
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <input
                  id={resetCodeInputId}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full h-11 pl-10 pr-4 bg-zinc-900 border border-zinc-800 rounded-xl text-base font-mono tracking-[0.4em] text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={newPassInputId}
                className="block text-xs uppercase tracking-wider text-zinc-300 mb-1.5"
              >
                Nueva Contraseña (mín. 8 caracteres)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <input
                  id={newPassInputId}
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-11 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition p-1"
                  aria-label="Ver nueva contraseña"
                >
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-12 bg-white text-zinc-950 font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-zinc-200 active:scale-98 transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Verificando código...</span>
              ) : (
                "Verificar código y actualizar contraseña"
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setForgotStep("request");
                  setMessage(null);
                }}
                className="h-10 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-600 text-[11px] uppercase tracking-wider transition cursor-pointer"
              >
                Reenviar código
              </button>
              <button
                type="button"
                onClick={() => {
                  setForgotStep("request");
                  setMode("login");
                  setMessage(null);
                }}
                className="h-10 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-600 text-[11px] uppercase tracking-wider transition cursor-pointer"
              >
                Volver al login
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-zinc-500">
          Al continuar, aceptas las políticas de uso de{" "}
          <span className="text-zinc-400">El Sótano del PC</span>.
        </div>
      </div>
    </div>
  );
}
