import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Trash2 } from "lucide-react";
import type { CatalogItem } from "../domain/catalog.types";

interface DeleteConfirmModalProps {
  item: CatalogItem | null;
  isDeleting: boolean;
  isLight: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  item,
  isDeleting,
  isLight,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!item || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`relative w-full max-w-md  p-6 border shadow-2xl transition-colors ${
            isLight
              ? "bg-white border-zinc-200 text-zinc-900"
              : "bg-zinc-950 border-zinc-800 text-zinc-100"
          }`}
        >
          <div className="flex items-center gap-3 text-red-500 mb-4">
            <div className="p-3  bg-red-500/10 border border-red-500/20">
              <Trash2 className="size-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg uppercase tracking-wide">¿Eliminar elemento?</h3>
              <p className="text-xs text-zinc-400">Esta acción no se puede deshacer.</p>
            </div>
          </div>

          <p className={`text-sm mb-6 ${isLight ? "text-zinc-600" : "text-zinc-300"}`}>
            ¿Estás seguro de que deseas eliminar permanentemente{" "}
            <span className="font-bold text-red-400">&quot;{item.title}&quot;</span> de la
            biblioteca y de la base de datos?
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onCancel}
              className={`px-4 py-2.5  border text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors ${
                isLight
                  ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700"
              }`}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="px-5 py-2.5  bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs uppercase tracking-wider font-bold shadow-lg transition-transform cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? "Eliminando..." : "Sí, eliminar"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
