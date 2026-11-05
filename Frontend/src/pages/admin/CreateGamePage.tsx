import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { gamesService } from "../../services/games.service";

const GENRES = [
  "Acción / Shooter",
  "Aventura / RPG",
  "Estrategia",
  "Simulación",
  "Deportes",
  "Terror / Supervivencia",
  "Indie",
  "Plataformas",
];

interface CreateGameFormData {
  title: string;
  description: string;
  price: string;
  discountPrice: string;
  stock: string;
  genres: string[];
  coverImage: string;
  bannerImage: string;
  developer: string;
  publisher: string;
  releaseDate: string;
  isActive: boolean;
}

const initialForm: CreateGameFormData = {
  title: "",
  description: "",
  price: "",
  discountPrice: "",
  stock: "0",
  genres: [],
  coverImage: "",
  bannerImage: "",
  developer: "",
  publisher: "",
  releaseDate: "",
  isActive: true,
};

export default function CreateGamePage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [, setNavLocation] = useLocation();

  const [form, setForm] = useState<CreateGameFormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange =
    (key: keyof CreateGameFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleToggleGenre = (genre: string) => {
    setForm((prev) => {
      const genres = prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre];
      return { ...prev, genres };
    });
  };

  const handleToggleActive = () => {
    setForm((prev) => ({ ...prev, isActive: !prev.isActive }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price) || 0,
        discountPrice: form.discountPrice.trim() ? Number(form.discountPrice) : null,
        stock: Number(form.stock) || 0,
        genres: form.genres,
        coverImage: form.coverImage.trim(),
        bannerImage: form.bannerImage.trim() || undefined,
        developer: form.developer.trim(),
        publisher: form.publisher.trim(),
        releaseDate: form.releaseDate || undefined,
        isActive: form.isActive,
      };

      // El slug se genera automáticamente en la API si no se envía.
      await gamesService.createGame(payload);
      setSuccess("Juego publicado correctamente en el catálogo.");
      setForm(initialForm);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error inesperado al publicar el juego.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => setNavLocation("/catalogo");

  return (
    <div
      className={`min-h-screen flex flex-col font-share transition-colors duration-150 ${
        isLight ? "bg-[#f4f4f5] text-zinc-900" : "bg-zinc-950 text-zinc-100"
      }`}
    >
      <header className="border-b">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between border-b">
          <button
            onClick={handleBack}
            className={`inline-flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider transition-colors ${
              isLight
                ? "text-zinc-600 hover:text-black hover:bg-zinc-50"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/30"
            }`}
          >
            <ArrowLeft size={18} /> <span>Volver al Catálogo</span>
          </button>
          <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider">
            Publicar Nuevo Juego
          </h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notificación de éxito */}
        {success && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
              isLight
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-emerald-900/20 border-emerald-900/30 text-emerald-300"
            }`}
          >
            <CheckCircle className="size-5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Publicado</h3>
              <p className="text-xs">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto p-1.5 text-emerald-500 hover:text-emerald-700 transition-colors"
              aria-label="Cerrar notificación"
            >
              <CheckCircle size={16} />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
              isLight
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-red-900/20 border-red-900/30 text-red-300"
            }`}
          >
            <AlertCircle className="size-5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Error</h3>
              <p className="text-xs">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto p-1.5 text-red-500 hover:text-red-700 transition-colors"
              aria-label="Cerrar notificación"
            >
              <AlertCircle size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título y Descripción */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                Título del Juego *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={handleChange("title")}
                placeholder="Ej: Hollow Knight"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                  isLight
                    ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                    : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                }`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                Descripción *
              </label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={handleChange("description")}
                placeholder="Describe el juego, su historia y características principales..."
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border resize-none ${
                  isLight
                    ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                    : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                }`}
              />
            </div>
          </div>

          {/* Precio, Descuento y Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                Precio (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={handleChange("price")}
                placeholder="0.00"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                  isLight
                    ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                    : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                Precio con Descuento
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.discountPrice}
                onChange={handleChange("discountPrice")}
                placeholder="Opcional"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                  isLight
                    ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                    : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                }`}
              />
              <p className="text-[11px] mt-1 text-zinc-400">
                Si se omite, se usa el precio normal.
              </p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                Stock (licencias) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={form.stock}
                onChange={handleChange("stock")}
                placeholder="0"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                  isLight
                    ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                    : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                }`}
              />
            </div>
          </div>

          {/* Géneros */}
          <div>
            <label className="block text-xs uppercase tracking-wider mb-2 font-semibold text-zinc-500">
              Géneros
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((genre) => {
                const active = form.genres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => handleToggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer border ${
                      active
                        ? isLight
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                          : "bg-white text-zinc-950 border-white shadow-sm"
                        : isLight
                        ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-200"
                        : "bg-zinc-900/40 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800/80"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* URLs de imágenes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                URL Portada *
              </label>
              <input
                type="url"
                required
                value={form.coverImage}
                onChange={handleChange("coverImage")}
                placeholder="https://ejemplo.com/portada.jpg"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                  isLight
                    ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                    : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                URL Banner
              </label>
              <input
                type="url"
                value={form.bannerImage}
                onChange={handleChange("bannerImage")}
                placeholder="https://ejemplo.com/banner.jpg"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                  isLight
                    ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                    : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                }`}
              />
              <p className="text-[11px] mt-1 text-zinc-400">
                Opcional. Se omite si no se provee.
              </p>
            </div>
          </div>

          {/* Desarrollador, Editor y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                Desarrollador *
              </label>
              <input
                type="text"
                value={form.developer}
                onChange={handleChange("developer")}
                placeholder="Ej: Team Cherry"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                  isLight
                    ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                    : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                Editor *
              </label>
              <input
                type="text"
                value={form.publisher}
                onChange={handleChange("publisher")}
                placeholder="Ej: Team Cherry"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                  isLight
                    ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                    : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                }`}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1 font-semibold text-zinc-500">
                Fecha Lanzamiento
              </label>
              <input
                type="date"
                value={form.releaseDate}
                onChange={handleChange("releaseDate")}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none transition-colors border ${
                  isLight
                    ? "bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-zinc-700"
                    : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-500"
                }`}
              />
              <p className="text-[11px] mt-1 text-zinc-400">
                Opcional. Formato ISO 8601.
              </p>
            </div>
          </div>

          {/* Estado activo */}
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
              isLight
                ? "bg-zinc-50 border-zinc-200"
                : "bg-zinc-900/40 border-zinc-800"
            }`}
          >
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={handleToggleActive}
              className={`rounded ${
                isLight ? "text-zinc-900 accent-zinc-900" : "text-zinc-100 accent-white"
              }`}
            />
            <label className="text-sm font-medium text-zinc-700">
              ¿Juego activo (visible en el catálogo)?
            </label>
          </div>

          {/* Acciones */}
          <div className="pt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer border ${
                isLight
                  ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300 disabled:opacity-50"
                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 disabled:opacity-50"
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50 ${
                isLight
                  ? "bg-zinc-900 text-white hover:bg-black disabled:bg-zinc-400"
                  : "bg-white text-zinc-950 hover:bg-zinc-200 disabled:bg-zinc-700"
              }`}
            >
              {loading ? (
                <>
                  <span className="animate-spin size-4 border-2 border-current rounded-full" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  <span>Publicar Juego</span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 text-xs text-zinc-400">
          Los campos id, slug, createdAt y updatedAt se generan automáticamente en la API y la base de datos.
        </p>
      </main>
    </div>
  );
}
