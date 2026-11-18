import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

interface AgeGateModalProps {
  isOpen: boolean;
  isLight: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AgeGateModal({
  isOpen,
  isLight,
  onConfirm,
  onCancel,
}: AgeGateModalProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="age-gate-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl font-share select-text"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`relative w-full max-w-md  p-6 sm:p-8 border shadow-2xl text-center transition-colors ${
              isLight
                ? "bg-white border-zinc-200 text-zinc-900"
                : "bg-zinc-950 border-zinc-800 text-zinc-100"
            }`}
          >
            <div className="mx-auto mb-5 size-16  bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-inner">
              <span className="text-2xl font-extrabold tracking-tight">+18</span>
            </div>

            <h2
              className={`text-xl sm:text-2xl font-extrabold uppercase tracking-wider mb-2 ${
                isLight ? "text-zinc-950" : "text-white"
              }`}
            >
              Contenido para Adultos
            </h2>

            <p
              className={`text-xs sm:text-sm leading-relaxed mb-6 ${
                isLight ? "text-zinc-600" : "text-zinc-400"
              }`}
            >
              Esta sección contiene juegos y material exclusivo para mayores de edad (+18). Por favor, confirma que tienes al menos 18 años para continuar.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onCancel}
                className={`w-full sm:w-1/2 py-3 px-4  border text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors ${
                  isLight
                    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
                }`}
              >
                Salir
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="w-full sm:w-1/2 py-3 px-4  bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs uppercase tracking-wider font-bold shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
              >
                Tengo +18 años
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
