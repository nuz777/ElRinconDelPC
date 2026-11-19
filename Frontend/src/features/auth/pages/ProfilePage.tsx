import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "motion/react";
import { ArrowLeft, Camera, Check, Lock, Save, User } from "lucide-react";
import Navbar from "../../../shared/ui/Navbar";
import Footer from "../../../shared/ui/Footer";
import { useTheme } from "../../../shared/context/useTheme";
import { dialog } from "../../../shared/ui/dialog";
import { ROUTES } from "../../../app/routes";
import { DEFAULT_PROFILE_AVATAR, PROFILE_AVATARS } from "../../../shared/config/profileAvatars";
import { useAuth } from "../context/useAuth";
import { authService } from "../services/auth.service";

export default function ProfilePage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { user, checkSession } = useAuth();

  const [name, setName] = useState("");
  const [picture, setPicture] = useState<string>(DEFAULT_PROFILE_AVATAR);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? user.username ?? "");
    setPicture(user.picture ?? DEFAULT_PROFILE_AVATAR);
  }, [user]);

  const displayName = user?.name || user?.username || user?.email || "Usuario";
  const email = user?.email ?? "";
  const canChangePassword = !user?.provider || user.provider === "local" || user.provider === "system";

  const initials = useMemo(() => {
    const base = (user?.name || user?.email || "U").trim();
    return base.slice(0, 1).toUpperCase();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      dialog.toast("error", "Nombre inválido", "Debe tener al menos 2 caracteres.");
      return;
    }

    const payload: { name?: string; picture?: string } = {};
    if (trimmedName !== (user.name ?? "")) payload.name = trimmedName;
    if (picture !== (user.picture ?? "")) payload.picture = picture;

    if (Object.keys(payload).length === 0) {
      dialog.toast("info", "Sin cambios", "No hay cambios para guardar.");
      return;
    }

    setSavingProfile(true);
    try {
      await authService.updateProfile(payload);
      await checkSession();
      dialog.toast("success", "Perfil actualizado", "Tus cambios se guardaron correctamente.");
    } catch (err) {
      dialog.toast(
        "error",
        "No se pudo actualizar",
        err instanceof Error ? err.message : "Intenta de nuevo.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      dialog.toast("error", "Campos incompletos", "Completa todos los campos de contraseña.");
      return;
    }
    if (newPassword.length < 8) {
      dialog.toast("error", "Contraseña corta", "La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      dialog.toast("error", "No coinciden", "La confirmación no coincide con la nueva contraseña.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await authService.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      dialog.toast("success", "Contraseña actualizada", res.message || "Tu contraseña fue cambiada.");
    } catch (err) {
      dialog.toast(
        "error",
        "No se pudo cambiar",
        err instanceof Error ? err.message : "Verifica tu contraseña actual.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const cardClass = `border p-5 sm:p-6 ${
    isLight ? "bg-white border-zinc-200 text-zinc-900" : "bg-zinc-900/60 border-zinc-800 text-zinc-100"
  }`;
  const labelClass = `block text-xs uppercase tracking-wider mb-1.5 ${isLight ? "text-zinc-600" : "text-zinc-400"}`;
  const inputClass = `w-full h-11 px-3 border text-sm focus:outline-none transition ${
    isLight
      ? "bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-zinc-500"
      : "bg-zinc-950 border-zinc-700 text-zinc-100 focus:border-zinc-400"
  }`;

  return (
    <div className={`min-h-screen font-share ${isLight ? "bg-[#f4f4f5] text-zinc-900" : "bg-zinc-950 text-zinc-100"}`}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16 space-y-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        >
          <div>
            <p className={`text-xs uppercase tracking-widest mb-1 ${isLight ? "text-zinc-500" : "text-zinc-500"}`}>
              Cuenta
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wider">Perfil de usuario</h1>
            <p className={`text-sm mt-1 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
              Personaliza tu nombre, foto y contraseña.
            </p>
          </div>
          <Link
            href={ROUTES.CATALOG}
            className={`group inline-flex items-center gap-2 text-xs uppercase tracking-wider px-3 py-2 border transition-all duration-200 self-start hover:-translate-y-0.5 ${
              isLight
                ? "border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-400"
                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-500"
            }`}
          >
            <ArrowLeft className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden />
            Volver al catálogo
          </Link>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
          className={cardClass}
        >
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex flex-col items-center gap-3 sm:w-48 shrink-0">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <motion.img
                  key={picture || "empty"}
                  src={picture || undefined}
                  alt={displayName}
                  initial={{ opacity: 0.7, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={`size-28 sm:size-32 object-cover border-2 ${isLight ? "border-zinc-200" : "border-zinc-700"} ${!picture ? "hidden" : ""}`}
                />
                {!picture && (
                  <div className={`size-28 sm:size-32 flex items-center justify-center text-3xl font-bold border-2 ${isLight ? "bg-zinc-100 border-zinc-200 text-zinc-700" : "bg-zinc-800 border-zinc-700 text-zinc-200"}`}>
                    {initials}
                  </div>
                )}
                <span className={`absolute -bottom-1 -right-1 p-1.5 border ${isLight ? "bg-white border-zinc-300 text-zinc-700" : "bg-zinc-900 border-zinc-700 text-zinc-300"}`}>
                  <Camera className="size-3.5" aria-hidden />
                </span>
              </motion.div>
              <div className="text-center min-w-0 w-full">
                <p className="font-bold truncate">{displayName}</p>
                <p className={`text-xs truncate ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>{email}</p>
                {user?.role === "admin" && (
                  <span className="inline-block mt-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/25">
                    Admin
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="flex-1 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-name" className={labelClass}>Nombre visible</label>
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 -translate-y-1/2 size-4 ${isLight ? "text-zinc-400" : "text-zinc-500"}`} />
                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      minLength={2}
                      maxLength={50}
                      required
                      className={`${inputClass} pl-9`}
                      placeholder="Tu nombre"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Correo</label>
                  <input
                    type="text"
                    value={email}
                    disabled
                    className={`${inputClass} opacity-60 cursor-not-allowed`}
                  />
                </div>
              </div>

              <div>
                <p className={labelClass}>Foto de perfil (estilo Xbox)</p>
                <p className={`text-xs mb-3 ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                  Elige una imagen predefinida para tu avatar.
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {PROFILE_AVATARS.map((avatar, index) => {
                    const selected = picture === avatar.src;
                    return (
                      <motion.button
                        key={avatar.id}
                        type="button"
                        onClick={() => setPicture(avatar.src)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.08 + index * 0.03 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative aspect-square border-2 overflow-hidden transition-colors duration-200 focus:outline-none ${
                          selected
                            ? "border-emerald-500 ring-2 ring-emerald-500/30"
                            : isLight
                              ? "border-zinc-200 hover:border-zinc-400"
                              : "border-zinc-700 hover:border-zinc-500"
                        }`}
                        title={avatar.label}
                        aria-pressed={selected}
                      >
                        <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" loading="lazy" />
                        {selected && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"
                          >
                            <motion.span
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 18 }}
                              className="bg-emerald-500 text-white p-1"
                            >
                              <Check className="size-4" />
                            </motion.span>
                          </motion.span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <motion.button
                  type="submit"
                  disabled={savingProfile}
                  whileHover={{ scale: savingProfile ? 1 : 1.02 }}
                  whileTap={{ scale: savingProfile ? 1 : 0.98 }}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border transition-colors cursor-pointer disabled:opacity-60 ${
                    isLight
                      ? "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800"
                      : "bg-white text-zinc-950 border-white hover:bg-zinc-200"
                  }`}
                >
                  <Save className="size-4" aria-hidden />
                  {savingProfile ? "Guardando..." : "Guardar perfil"}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }}
          className={cardClass}
        >
          <div className="flex items-center gap-2 mb-4">
            <Lock className={`size-4 ${isLight ? "text-zinc-600" : "text-zinc-400"}`} aria-hidden />
            <h2 className="text-lg font-bold uppercase tracking-wider">Cambiar contraseña</h2>
          </div>

          {!canChangePassword ? (
            <p className={`text-sm ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
              Esta cuenta no usa una contraseña local, por lo que no se puede cambiar desde aquí.
            </p>
          ) : (
            <form onSubmit={handleChangePassword} className="grid sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="current-password" className={labelClass}>Contraseña actual</label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label htmlFor="new-password" className={labelClass}>Nueva contraseña</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className={labelClass}>Confirmar nueva</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <motion.button
                  type="submit"
                  disabled={savingPassword}
                  whileHover={{ scale: savingPassword ? 1 : 1.02 }}
                  whileTap={{ scale: savingPassword ? 1 : 0.98 }}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold border transition-colors cursor-pointer disabled:opacity-60 ${
                    isLight
                      ? "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800"
                      : "bg-white text-zinc-950 border-white hover:bg-zinc-200"
                  }`}
                >
                  <Save className="size-4" aria-hidden />
                  {savingPassword ? "Actualizando..." : "Actualizar contraseña"}
                </motion.button>
              </div>
            </form>
          )}
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}
