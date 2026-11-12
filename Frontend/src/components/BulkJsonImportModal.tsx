import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  FileJson,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Layers,
  HardDrive,
  Cpu,
  Monitor,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "../ThemeContext";
import { parseCatalogJson, type ParsedItemResult } from "../utils/catalogJsonParser";
import { catalogService } from "../services/catalog.service";
import type { CatalogItem } from "../data/catalog";

interface BulkJsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemsImported?: (items: CatalogItem[]) => void;
  onLoadSingleItemIntoForm?: (item: CatalogItem) => void;
}

export default function BulkJsonImportModal({
  isOpen,
  onClose,
  onItemsImported,
  onLoadSingleItemIntoForm,
}: BulkJsonImportModalProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [inputMode, setInputMode] = useState<"file" | "paste">("file");
  const [jsonText, setJsonText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedItemResult[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; title: string } | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setJsonText("");
    setFileName(null);
    setParsedItems([]);
    setParseErrors([]);
    setHasParsed(false);
    setIsImporting(false);
    setImportProgress(null);
    setImportSuccessCount(null);
    setImportError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      alert("Por favor selecciona un archivo con extensión .json");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
      processJsonContent(content);
    };
    reader.onerror = () => {
      alert("Error al leer el archivo JSON.");
    };
    reader.readAsText(file);
  };

  const processJsonContent = (text: string) => {
    setImportSuccessCount(null);
    setImportError(null);
    const result = parseCatalogJson(text);
    setParsedItems(result.items);
    setParseErrors(result.errors);
    setHasParsed(true);
  };

  const handleTextChange = (text: string) => {
    setJsonText(text);
    if (text.trim().length > 5) {
      processJsonContent(text);
    } else {
      setParsedItems([]);
      setParseErrors([]);
      setHasParsed(false);
    }
  };

  const validItems = parsedItems.filter((p) => p.isValid);

  /** Carga masiva en base de datos PostgreSQL mediante catalogService */
  const handleBulkImport = async () => {
    if (validItems.length === 0) return;
    setIsImporting(true);
    setImportError(null);
    setImportProgress({ current: 0, total: validItems.length, title: "Iniciando..." });

    const createdItems: CatalogItem[] = [];
    const errors: string[] = [];

    for (let i = 0; i < validItems.length; i++) {
      const target = validItems[i];
      setImportProgress({
        current: i + 1,
        total: validItems.length,
        title: target.item.title,
      });

      try {
        const created = await catalogService.createItem(target.payload);
        createdItems.push(created);
      } catch (err) {
        console.error(`Error importando "${target.item.title}":`, err);
        errors.push(`"${target.item.title}": ${err instanceof Error ? err.message : "Error desconocido"}`);
      }
    }

    setIsImporting(false);
    setImportProgress(null);

    if (createdItems.length > 0) {
      setImportSuccessCount(createdItems.length);
      if (onItemsImported) {
        onItemsImported(createdItems);
      }
    }

    if (errors.length > 0) {
      setImportError(`Se importaron ${createdItems.length} elementos, pero fallaron ${errors.length}:\n` + errors.join("\n"));
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="bulk-json-modal-backdrop"
          className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm font-share select-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isImporting) handleClose();
          }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border transition-colors overflow-hidden ${
              isLight
                ? "bg-white border-zinc-200 text-zinc-900"
                : "bg-zinc-900 border-zinc-700 text-zinc-100"
            }`}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between p-5 sm:p-6 border-b shrink-0 ${
                isLight ? "border-zinc-200 bg-zinc-50/70" : "border-zinc-800 bg-zinc-950/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <FileJson className="size-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider">
                    Carga Masiva de Catálogo (JSON)
                  </h2>
                  <p className={`text-xs ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                    Importa juegos, peso, especificaciones y descripciones automáticamente.
                  </p>
                </div>
              </div>

              <button
                disabled={isImporting}
                onClick={handleClose}
                className={`p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30 ${
                  isLight
                    ? "text-zinc-500 hover:text-black hover:bg-zinc-100"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Sub-Header Notice */}
            <div
              className={`px-6 py-3 text-xs border-b flex items-start sm:items-center gap-2 ${
                isLight
                  ? "bg-amber-50 text-amber-900 border-amber-200"
                  : "bg-amber-950/30 text-amber-200 border-amber-800/50"
              }`}
            >
              <Sparkles className="size-4 shrink-0 text-amber-500 mt-0.5 sm:mt-0" />
              <span>
                <strong>Regla de portadas y enlaces:</strong> El JSON lee título, apartado, peso,
                etiqueta, descripción y especificaciones de la PC. Las portadas y links no se leen
                (se asignan por defecto para que las personalices luego con el botón <strong>Editar</strong>).
              </span>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Selector de modo: Archivo vs Pegar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode("file")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer border transition-colors ${
                    inputMode === "file"
                      ? "bg-amber-500 text-black border-amber-500 font-bold shadow-sm"
                      : isLight
                      ? "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700"
                  }`}
                >
                  Subir archivo .JSON
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("paste")}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer border transition-colors ${
                    inputMode === "paste"
                      ? "bg-amber-500 text-black border-amber-500 font-bold shadow-sm"
                      : isLight
                      ? "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                      : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700"
                  }`}
                >
                  Pegar texto JSON
                </button>
              </div>

              {/* Zona de Drop o Input File */}
              {inputMode === "file" ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      fileName
                        ? isLight
                          ? "border-amber-500 bg-amber-50/50"
                          : "border-amber-500/50 bg-amber-950/20"
                        : isLight
                        ? "border-zinc-300 hover:border-zinc-400 bg-zinc-50"
                        : "border-zinc-700 hover:border-zinc-600 bg-zinc-900/60"
                    }`}
                  >
                    <Upload className="size-8 mx-auto mb-2 text-amber-500" />
                    {fileName ? (
                      <div>
                        <p className="text-sm font-bold text-amber-500">{fileName}</p>
                        <p className={`text-xs mt-1 ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                          Haz clic para seleccionar otro archivo
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold">
                          Haz clic para elegir un archivo JSON o arrástralo aquí
                        </p>
                        <p className={`text-xs mt-1 ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                          Formatos aceptados: .json con lista de juegos o elemento individual
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    className={`block text-xs uppercase tracking-wider mb-2 font-semibold ${
                      isLight ? "text-zinc-600" : "text-zinc-400"
                    }`}
                  >
                    Pega tu estructura JSON aquí:
                  </label>
                  <textarea
                    rows={7}
                    value={jsonText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder={`[\n  {\n    "titulo": "God of War",\n    "apartado": "juegos",\n    "genero": "Acción / Aventura",\n    "peso": "64.5 GB",\n    "etiqueta": "Popular",\n    "descripcion": "Aventura nórdica de Kratos y Atreus.",\n    "especificaciones": {\n      "so": "Windows 10 64-bit",\n      "cpu": "Intel i5-6600k",\n      "ram": "8 GB RAM",\n      "gpu": "GTX 1060 6GB",\n      "almacenamiento": "70 GB libres"\n    }\n  }\n]`}
                    className={`w-full p-3.5 rounded-xl font-mono text-xs focus:outline-none transition-colors border ${
                      isLight
                        ? "bg-zinc-50 border-zinc-300 text-zinc-900 focus:border-zinc-700"
                        : "bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-zinc-500"
                    }`}
                  />
                </div>
              )}

              {/* Errores globales de parsing */}
              {parseErrors.length > 0 && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-red-500">
                    <AlertTriangle className="size-4" />
                    <span>Error al procesar el archivo JSON:</span>
                  </div>
                  {parseErrors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}

              {/* Barra de progreso de importación */}
              {isImporting && importProgress && (
                <div className={`p-4 rounded-xl border ${isLight ? "bg-zinc-100 border-zinc-300" : "bg-zinc-950 border-zinc-800"}`}>
                  <div className="flex items-center justify-between text-xs mb-2 font-bold">
                    <span className="flex items-center gap-2 text-amber-500">
                      <RefreshCw className="size-4 animate-spin" />
                      Importando {importProgress.current} de {importProgress.total}...
                    </span>
                    <span className="truncate max-w-[200px]">{importProgress.title}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-200"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Mensaje de éxito */}
              {importSuccessCount !== null && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="size-5" />
                    <span>¡Éxito! Se importaron {importSuccessCount} elementos a la biblioteca y base de datos.</span>
                  </div>
                </div>
              )}

              {/* Mensaje de error en la importación */}
              {importError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs whitespace-pre-line">
                  {importError}
                </div>
              )}

              {/* Vista Previa de Items Parseados */}
              {hasParsed && parsedItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase font-bold tracking-wider text-zinc-400">
                      Elementos detectados ({validItems.length} válidos
                      {parsedItems.length - validItems.length > 0
                        ? `, ${parsedItems.length - validItems.length} con advertencia`
                        : ""}
                      ):
                    </h3>

                    {/* Si es 1 solo elemento y se abrió desde el formulario principal */}
                    {validItems.length === 1 && onLoadSingleItemIntoForm && (
                      <button
                        type="button"
                        onClick={() => {
                          onLoadSingleItemIntoForm(validItems[0].item);
                          handleClose();
                        }}
                        className="text-xs text-amber-500 hover:text-amber-400 font-bold underline cursor-pointer"
                      >
                        Autocompletar en el formulario actual
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {parsedItems.map((entry, idx) => {
                      const it = entry.item;
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs transition-colors ${
                            entry.isValid
                              ? isLight
                                ? "bg-zinc-50 border-zinc-200"
                                : "bg-zinc-950/60 border-zinc-800"
                              : "bg-red-500/5 border-red-500/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{it.title || "Sin título"}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                  {it.apartado}
                                </span>
                                <span className="text-[10px] text-zinc-400">· {it.genre}</span>
                              </div>
                              <p className={`text-[11px] mt-1 line-clamp-1 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                                {it.shortDesc}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono text-xs font-semibold text-amber-500 block">
                                {it.size}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                Etiqueta: <strong>{it.tag}</strong>
                              </span>
                            </div>
                          </div>

                          {/* Especificaciones mínimas detectadas (no aplica para adultos) */}
                          {it.apartado !== "adultos" && it.requirements && (
                            <div className="mt-2.5 pt-2 border-t border-zinc-800/50 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-400">
                              <span className="flex items-center gap-1">
                                <Monitor className="size-3 text-zinc-500" />
                                {it.requirements.os}
                              </span>
                              <span className="flex items-center gap-1">
                                <Cpu className="size-3 text-zinc-500" />
                                {it.requirements.cpu}
                              </span>
                              <span className="flex items-center gap-1">
                                <Layers className="size-3 text-zinc-500" />
                                {it.requirements.ram}
                              </span>
                              <span className="flex items-center gap-1">
                                <HardDrive className="size-3 text-zinc-500" />
                                {it.requirements.gpu}
                              </span>
                            </div>
                          )}

                          {entry.errors.length > 0 && (
                            <div className="mt-2 text-[10px] text-red-400">
                              {entry.errors.join(", ")}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div
              className={`p-4 sm:p-5 border-t shrink-0 flex items-center justify-between gap-3 ${
                isLight ? "border-zinc-200 bg-zinc-50" : "border-zinc-800 bg-zinc-950"
              }`}
            >
              <button
                type="button"
                disabled={isImporting}
                onClick={handleClose}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                  isLight
                    ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700"
                }`}
              >
                Cerrar
              </button>

              <div className="flex items-center gap-3">
                {validItems.length === 1 && onLoadSingleItemIntoForm && (
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={() => {
                      onLoadSingleItemIntoForm(validItems[0].item);
                      handleClose();
                    }}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                      isLight
                        ? "bg-white hover:bg-zinc-100 text-zinc-900 border-zinc-300"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-600"
                    }`}
                  >
                    Cargar al Formulario
                  </button>
                )}

                <button
                  type="button"
                  disabled={isImporting || validItems.length === 0}
                  onClick={handleBulkImport}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black text-xs font-bold uppercase tracking-wider shadow-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <span>Importar {validItems.length} {validItems.length === 1 ? "Elemento" : "Elementos"} a la DB</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
