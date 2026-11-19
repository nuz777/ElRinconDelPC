import { afterEach, describe, expect, it } from "vitest";
import { closeDialog, dialog, dismissToast, getDialogState, isDialogOpen } from "./dialogStore";

function clearAll() {
  while (getDialogState().dialog) closeDialog(getDialogState().dialog!.id, false);
  getDialogState().toasts.forEach((t) => dismissToast(t.id));
}

describe("dialogStore", () => {
  afterEach(clearAll);

  it("resuelve confirm con true al confirmar y false al cancelar", async () => {
    const yes = dialog.confirm({ title: "¿Seguro?" });
    expect(isDialogOpen()).toBe(true);
    closeDialog(getDialogState().dialog!.id, true);
    await expect(yes).resolves.toBe(true);

    const no = dialog.confirm({ title: "¿Seguro?" });
    closeDialog(getDialogState().dialog!.id, false);
    await expect(no).resolves.toBe(false);
    expect(isDialogOpen()).toBe(false);
  });

  it("encola diálogos y muestra el siguiente al cerrar", async () => {
    const first = dialog.info("Uno");
    const second = dialog.info("Dos");
    expect(getDialogState().dialog?.title).toBe("Uno");
    closeDialog(getDialogState().dialog!.id, true);
    await first;
    expect(getDialogState().dialog?.title).toBe("Dos");
    closeDialog(getDialogState().dialog!.id, true);
    await second;
  });

  it("un resultado reemplaza al loading y cerrar el loading no toca otro diálogo", async () => {
    const stop = dialog.loading("Guardando");
    expect(getDialogState().dialog?.options.variant).toBe("loading");
    void dialog.success("Listo");
    expect(getDialogState().dialog?.title).toBe("Listo");
    stop();
    expect(getDialogState().dialog?.title).toBe("Listo");
  });

  it("limita los toasts visibles a 4", () => {
    for (let i = 0; i < 6; i++) dialog.toast("success", `T${i}`);
    expect(getDialogState().toasts.map((t) => t.title)).toEqual(["T2", "T3", "T4", "T5"]);
  });
});
