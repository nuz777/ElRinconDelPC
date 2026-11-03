import { useState, useId } from "react";
import { useLocation } from "wouter";
import { User, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";

interface AuthProps {
  initialMode?: "login" | "register";
}

function GoogleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function GithubIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const socialButtonClass =
  "w-full h-12 flex items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-100 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 hover:border-zinc-500 hover:text-white active:scale-98 transition cursor-pointer";

export default function Auth({ initialMode }: AuthProps) {
  const [location] = useLocation();
  const isRegisterRoute = initialMode === "register" || location.includes("register");
  const [mode, setMode] = useState<"login" | "register">(isRegisterRoute ? "register" : "login");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loginIdInput = useId();
  const loginPassInput = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier, password }),
      }).catch(() => null);

      if (!res) {
        setMessage({
          type: "error",
          text: "No se pudo conectar con el servidor. Verifica que la API esté encendida.",
        });
        return;
      }

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorText =
          data?.message && Array.isArray(data.message)
            ? data.message.join(", ")
            : data?.message || "Credenciales incorrectas o error en la autenticación.";
        setMessage({
          type: "error",
          text: errorText,
        });
        return;
      }

      if (data?.accessToken) {
        localStorage.setItem("sotano_token", data.accessToken);
        if (data.user) {
          localStorage.setItem("sotano_user", JSON.stringify(data.user));
        }
      }

      setMessage({
        type: "success",
        text: data?.message || "¡Inicio de sesión exitoso!",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch {
      setMessage({
        type: "error",
        text: "Ocurrió un error inesperado al procesar la solicitud.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = (provider: "google" | "github") => {
    window.location.href = `http://localhost:3000/auth/${provider}`;
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
            {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wide">
            {mode === "login"
              ? "Accede a tus configuraciones y favoritos"
              : "Únete a la comunidad de El Sótano del PC"}
          </p>
        </div>

        <div className="grid grid-cols-2 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage(null);
            }}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              mode === "login" ? "bg-white text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"
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
              mode === "register" ? "bg-white text-zinc-950 shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {message && (
          <div
            className={`mb-5 p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              message.type === "success"
                ? "bg-emerald-950/50 border-emerald-700/60 text-emerald-300"
                : "bg-red-950/50 border-red-700/60 text-red-300"
            }`}
          >
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {mode === "login" && (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor={loginIdInput}
                  className="block text-xs uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Usuario o Correo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                  <input
                    id={loginIdInput}
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="ej: nuz o tu@email.com"
                    className="w-full h-11 pl-10 pr-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor={loginPassInput}
                  className="block text-xs uppercase tracking-wider text-zinc-300 mb-1.5"
                >
                  Contraseña
                </label>
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
                {loading ? <span className="animate-pulse">Procesando...</span> : "Ingresar a la plataforma"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">o</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
          </>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSocial("github")}
            className={socialButtonClass}
          >
            <GithubIcon className="size-5" />
            {mode === "login" ? "Iniciar sesión con GitHub" : "Crear cuenta con GitHub"}
          </button>
          <button
            type="button"
            onClick={() => handleSocial("google")}
            className={socialButtonClass}
          >
            <GoogleIcon className="size-5" />
            {mode === "login" ? "Iniciar sesión con Google" : "Crear cuenta con Google"}
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-zinc-500">
          Al continuar, aceptas las políticas de uso de{" "}
          <span className="text-zinc-400">El Sótano del PC</span>.
        </div>
      </div>
    </div>
  );
}
