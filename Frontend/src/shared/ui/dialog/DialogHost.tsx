import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  Loader2,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "../../context/useTheme";
import {
  closeDialog,
  dismissToast,
  getDialogState,
  subscribeDialogs,
  type ActiveDialog,
  type DialogVariant,
  type ToastItem,
} from "./dialogStore";

const VARIANTS: Record<
  DialogVariant,
  { icon: LucideIcon; tone: string; box: string; bar: string; button: string }
> = {
  success: {
    icon: CheckCircle2,
    tone: "text-emerald-500",
    box: "bg-emerald-500/10 border-emerald-500/25",
    bar: "bg-emerald-500",
    button: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  error: {
    icon: XCircle,
    tone: "text-red-500",
    box: "bg-red-500/10 border-red-500/25",
    bar: "bg-red-500",
    button: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    icon: AlertTriangle,
    tone: "text-amber-500",
    box: "bg-amber-500/10 border-amber-500/25",
    bar: "bg-amber-500",
    button: "bg-amber-500 hover:bg-amber-600 text-zinc-950",
  },
  info: {
    icon: Info,
    tone: "text-sky-500",
    box: "bg-sky-500/10 border-sky-500/25",
    bar: "bg-sky-500",
    button: "",
  },
  question: {
    icon: HelpCircle,
    tone: "text-zinc-400",
    box: "bg-zinc-500/10 border-zinc-500/25",
    bar: "bg-zinc-400",
    button: "",
  },
  loading: {
    icon: Loader2,
    tone: "text-zinc-400",
    box: "bg-zinc-500/10 border-zinc-500/25",
    bar: "bg-zinc-400",
    button: "",
  },
};

function useDialogState() {
  return useSyncExternalStore(subscribeDialogs, getDialogState, getDialogState);
}

function DialogCard({ entry, isLight }: { entry: ActiveDialog; isLight: boolean }) {
  const { options } = entry;
  const variant = options.variant ?? "info";
  const v = VARIANTS[variant];
  const Icon = v.icon;
  const isLoading = variant === "loading";
  const dismissible = options.dismissible ?? !isLoading;
  const confirmRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const neutralButton = isLight
    ? "bg-zinc-900 hover:bg-black text-white"
    : "bg-zinc-100 hover:bg-white text-zinc-950";
  const confirmClass = options.danger
    ? "bg-red-600 hover:bg-red-700 text-white"
    : v.button || neutralButton;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    (confirmRef.current ?? panelRef.current)?.focus();
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    if (!options.timer) return;
    const t = window.setTimeout(() => closeDialog(entry.id, true), options.timer);
    return () => window.clearTimeout(t);
  }, [entry.id, options.timer]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && dismissible) {
      e.stopPropagation();
      closeDialog(entry.id, false);
    }
    if (e.key === "Tab") {
      // Mantener el foco dentro del diálogo
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>("button");
      if (!focusables || focusables.length === 0) return e.preventDefault();
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <motion.div
      key={entry.id}
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && dismissible) closeDialog(entry.id, false);
      }}
    >
      <motion.div
        ref={panelRef}
        role={isLoading ? "status" : "alertdialog"}
        aria-modal="true"
        aria-labelledby={`dlg-title-${entry.id}`}
        aria-describedby={options.text ? `dlg-text-${entry.id}` : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        className={`relative w-full max-w-md overflow-hidden border shadow-2xl font-share outline-none ${
          isLight ? "bg-white border-zinc-200 text-zinc-900" : "bg-zinc-950 border-zinc-800 text-zinc-100"
        }`}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <motion.div
              initial={reduceMotion ? false : { scale: 0.6, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.05 }}
              className={`shrink-0 p-3 border ${v.box} ${v.tone}`}
            >
              <Icon className={`size-6 ${isLoading ? "animate-spin" : ""}`} aria-hidden />
            </motion.div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2
                id={`dlg-title-${entry.id}`}
                className="font-bold text-lg leading-tight tracking-wide"
              >
                {options.title}
              </h2>
              {(options.text || options.highlight) && (
                <p
                  id={`dlg-text-${entry.id}`}
                  className={`mt-2 text-sm leading-relaxed whitespace-pre-line break-words ${
                    isLight ? "text-zinc-600" : "text-zinc-300"
                  }`}
                >
                  {options.text}
                  {options.highlight && (
                    <>
                      {options.text ? " " : ""}
                      <span className={`font-bold ${options.danger ? "text-red-400" : isLight ? "text-zinc-900" : "text-white"}`}>
                        &quot;{options.highlight}&quot;
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>
            {dismissible && !options.cancelText && (
              <button
                type="button"
                onClick={() => closeDialog(entry.id, false)}
                aria-label="Cerrar"
                className={`-mr-2 -mt-2 p-1.5 cursor-pointer transition-colors ${
                  isLight ? "text-zinc-400 hover:text-zinc-900" : "text-zinc-500 hover:text-white"
                }`}
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {!isLoading && (
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
              {options.cancelText && (
                <button
                  type="button"
                  onClick={() => closeDialog(entry.id, false)}
                  className={`px-4 py-2.5 border text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isLight
                      ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300 focus-visible:outline-zinc-900"
                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700 focus-visible:outline-zinc-200"
                  }`}
                >
                  {options.cancelText}
                </button>
              )}
              <button
                ref={confirmRef}
                type="button"
                onClick={() => closeDialog(entry.id, true)}
                className={`px-5 py-2.5 text-xs uppercase tracking-wider font-bold shadow-lg cursor-pointer transition-[transform,background-color] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  isLight ? "focus-visible:outline-zinc-900" : "focus-visible:outline-zinc-200"
                } ${confirmClass}`}
              >
                {options.confirmText ?? "Entendido"}
              </button>
            </div>
          )}
        </div>

        {(options.timer || isLoading) && (
          <div className={`h-1 w-full ${isLight ? "bg-zinc-100" : "bg-zinc-900"}`} aria-hidden>
            {isLoading ? (
              <motion.div
                className={`h-full w-1/3 ${v.bar}`}
                animate={reduceMotion ? undefined : { x: ["-100%", "300%"] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              />
            ) : (
              <motion.div
                className={`h-full ${v.bar}`}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: (options.timer ?? 0) / 1000, ease: "linear" }}
              />
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Toast({ toast, isLight }: { toast: ToastItem; isLight: boolean }) {
  const v = VARIANTS[toast.variant];
  const Icon = v.icon;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const t = window.setTimeout(() => dismissToast(toast.id), toast.duration);
    return () => window.clearTimeout(t);
  }, [toast.id, toast.duration]);

  return (
    <motion.div
      layout
      role={toast.variant === "error" ? "alert" : "status"}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className={`pointer-events-auto relative w-full sm:w-80 overflow-hidden border shadow-xl font-share ${
        isLight ? "bg-white border-zinc-200 text-zinc-900" : "bg-zinc-950 border-zinc-800 text-zinc-100"
      }`}
    >
      <div className="flex items-start gap-3 p-3.5 pr-9">
        <Icon className={`size-5 shrink-0 mt-px ${v.tone}`} aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-bold leading-snug">{toast.title}</p>
          {toast.text && (
            <p className={`mt-0.5 text-xs leading-snug ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
              {toast.text}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        aria-label="Cerrar aviso"
        className={`absolute top-2.5 right-2.5 p-1 cursor-pointer ${
          isLight ? "text-zinc-400 hover:text-zinc-900" : "text-zinc-500 hover:text-white"
        }`}
      >
        <X className="size-3.5" />
      </button>
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${v.bar}`}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: toast.duration / 1000, ease: "linear" }}
      />
    </motion.div>
  );
}

/** Monta una sola vez en la raíz de la app. */
export default function DialogHost() {
  const { dialog, toasts } = useDialogState();
  const { theme } = useTheme();
  const isLight = theme === "light";

  useEffect(() => {
    if (!dialog) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [dialog]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <AnimatePresence>
        {dialog && <DialogCard key={dialog.id} entry={dialog} isLight={isLight} />}
      </AnimatePresence>
      <div
        className="fixed z-[410] bottom-4 right-4 left-4 sm:left-auto flex flex-col items-end gap-2 pointer-events-none"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} isLight={isLight} />
          ))}
        </AnimatePresence>
      </div>
    </>,
    document.body,
  );
}
