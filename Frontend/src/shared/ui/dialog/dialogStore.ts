/**
 * Popups estilo SweetAlert con el diseño de El Sótano.
 * API imperativa: se puede llamar desde cualquier handler sin hooks.
 *
 *   await dialog.success("Juego publicado", "Ya aparece en /juegos.");
 *   if (await dialog.confirm({ title: "¿Eliminar?", danger: true })) { ... }
 *   const stop = dialog.loading("Guardando..."); ... stop();
 *   dialog.toast("success", "Cambios guardados");
 */

export type DialogVariant = "success" | "error" | "warning" | "info" | "question" | "loading";

export interface DialogOptions {
  variant?: DialogVariant;
  title: string;
  text?: string;
  /** Texto destacado dentro del mensaje (ej. el título del juego). */
  highlight?: string;
  confirmText?: string;
  /** Si se define, se muestra el botón de cancelar. */
  cancelText?: string;
  /** Pinta el botón de confirmar en rojo (acciones destructivas). */
  danger?: boolean;
  /** Cierra solo tras N ms y muestra la barra de tiempo. */
  timer?: number;
  /** Permite cerrar con Escape o clic fuera (por defecto true, salvo en loading). */
  dismissible?: boolean;
}

export interface ActiveDialog extends Required<Pick<DialogOptions, "title">> {
  id: number;
  options: DialogOptions;
  resolve: (confirmed: boolean) => void;
}

export interface ToastItem {
  id: number;
  variant: Exclude<DialogVariant, "question" | "loading">;
  title: string;
  text?: string;
  duration: number;
}

interface DialogState {
  dialog: ActiveDialog | null;
  toasts: ToastItem[];
}

let state: DialogState = { dialog: null, toasts: [] };
let nextId = 1;
const listeners = new Set<() => void>();
const queue: ActiveDialog[] = [];

function emit(next: DialogState) {
  state = next;
  listeners.forEach((l) => l());
}

export function subscribeDialogs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDialogState(): DialogState {
  return state;
}

/** true si hay un popup abierto (los modales lo usan para no cerrarse con Escape a la vez). */
export function isDialogOpen(): boolean {
  return state.dialog !== null;
}

function push(options: DialogOptions): { id: number; promise: Promise<boolean> } {
  const id = nextId++;
  const promise = new Promise<boolean>((resolve) => {
    const entry: ActiveDialog = { id, title: options.title, options, resolve };
    const current = state.dialog;
    // Un "cargando" se reemplaza directamente por el resultado de la acción.
    if (!current || current.options.variant === "loading") {
      current?.resolve(false);
      emit({ ...state, dialog: entry });
    } else {
      queue.push(entry);
    }
  });
  return { id, promise };
}

function open(options: DialogOptions): Promise<boolean> {
  return push(options).promise;
}

/** Cierra el diálogo activo resolviendo su promesa y muestra el siguiente en cola. */
export function closeDialog(id: number, confirmed: boolean): void {
  const current = state.dialog;
  if (!current || current.id !== id) return;
  current.resolve(confirmed);
  emit({ ...state, dialog: queue.shift() ?? null });
}

/** Cierra cualquier "cargando" activo (útil en bloques finally). */
export function closeLoading(): void {
  if (state.dialog?.options.variant === "loading") closeDialog(state.dialog.id, false);
}

export function dismissToast(id: number): void {
  emit({ ...state, toasts: state.toasts.filter((t) => t.id !== id) });
}

type Shortcut = (title: string, text?: string, extra?: Partial<DialogOptions>) => Promise<boolean>;

const shortcut =
  (variant: DialogVariant): Shortcut =>
  (title, text, extra) =>
    open({ variant, title, text, ...extra });

export const dialog = {
  open,
  success: shortcut("success"),
  error: shortcut("error"),
  warning: shortcut("warning"),
  info: shortcut("info"),

  confirm(options: Omit<DialogOptions, "variant"> & { variant?: DialogVariant }): Promise<boolean> {
    return open({
      variant: options.danger ? "warning" : "question",
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      ...options,
    });
  },

  /** Muestra un diálogo de carga no cancelable. Devuelve una función para cerrarlo. */
  loading(title: string, text?: string): () => void {
    const { id } = push({ variant: "loading", title, text, dismissible: false });
    return () => {
      if (state.dialog?.id === id) {
        closeDialog(id, false);
        return;
      }
      // Seguía en cola: se descarta sin mostrarse.
      const index = queue.findIndex((q) => q.id === id);
      if (index >= 0) queue.splice(index, 1)[0].resolve(false);
    };
  },

  toast(variant: ToastItem["variant"], title: string, text?: string, duration = 3200): void {
    const toast: ToastItem = { id: nextId++, variant, title, text, duration };
    emit({ ...state, toasts: [...state.toasts.slice(-3), toast] });
  },
};
