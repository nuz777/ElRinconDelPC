import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Route, Switch, Redirect } from "wouter";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Tools from "./pages/Tools";
import Programming from "./pages/Programming";
import WindowsTools from "./pages/WindowsTools";
import LegacyGameRedirect from "./pages/LegacyGameRedirect";
import Auth from "./pages/Auth";
import LoadingScreen from "./components/LoadingScreen";
import ChatWidget from "./components/ChatWidget";
import { AudioProvider } from "./AudioContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PublicRoute } from "./components/guards/PublicRoute";
import { ProtectedRoute } from "./components/guards/ProtectedRoute";
import { AdminRoute } from "./components/guards/AdminRoute";
import CreateGamePage from "./pages/admin/CreateGamePage";
import UploadModPage from "./pages/admin/UploadModPage";
import { AdService } from "./services/ads.service";

const HERO_IMAGES = [
  "/hero/yui.png",
  "/hero/blue.png",
  "/hero/white.png",
  "/img/celular.jpeg",
];

function preloadImages(urls: string[]): Promise<void> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        }),
    ),
  ).then(() => undefined);
}

function AppInner() {
  const [imageLoading, setImageLoading] = useState(true);
  const { isLoading: authLoading } = useAuth();

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const MIN_TIME = isMobile ? 3000 : 2000;
    const start = Date.now();

    preloadImages(HERO_IMAGES).then(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_TIME - elapsed);
      setTimeout(() => setImageLoading(false), remaining);
    });

    // Inicializa el Popunder globalmente una sola vez por sesión
    AdService.initPopunder();
  }, []);

  const isLoading = imageLoading || authLoading;

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingScreen key="loader" />
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen bg-canvas text-ink transition-colors duration-200"
        >
          <AudioProvider>
            <Switch>
              {/* Ruta raíz pública */}
              <Route path="/" component={Home} />

              {/* Catálogo accesible para todos (público): cada apartado tiene su URL */}
              <Route path="/catalogo" component={Catalog} />
              <Route path="/sotano" component={Catalog} />
              <Route path="/juegos" component={Catalog} />
              <Route path="/mods-shaders" component={Catalog} />
              <Route path="/herramientas" component={Catalog} />
              <Route path="/adultos" component={Catalog} />

              {/* ROMs: siempre con marca y consola (/rom/{marca}/{consola}[/{slug}-{codigo}]) */}
              <Route path="/rom/:brand/:console" component={Catalog} />
              <Route path="/rom/:brand/:console/:slugCode" component={Catalog} />
              <Route path="/rom">
                <Redirect to="/catalogo" replace />
              </Route>
              <Route path="/rom/:brand">
                <Redirect to="/catalogo" replace />
              </Route>

              {/* Herramientas públicas */}
              <Route path="/tools" component={Tools} />
              <Route path="/tools/all" component={Tools} />
              <Route path="/tools/programming" component={Programming} />
              <Route path="/tools/windows" component={WindowsTools} />

              {/* Rutas protegidas - requieren autenticación */}
              <Route path="/publish">
                <ProtectedRoute>
                  <AdminRoute>
                    <Catalog />
                  </AdminRoute>
                </ProtectedRoute>
              </Route>
              <Route path="/dashboard/crear">
                <ProtectedRoute>
                  <AdminRoute>
                    <Catalog />
                  </AdminRoute>
                </ProtectedRoute>
              </Route>

              {/* Administración: publicar nuevo juego (solo ADMIN) */}
              <Route path="/admin/juegos/nuevo">
                <ProtectedRoute>
                  <AdminRoute>
                    <CreateGamePage />
                  </AdminRoute>
                </ProtectedRoute>
              </Route>

              {/* Detalle compartible: abre el modal del catálogo (/{tipo}/{slug}-{codigo}) */}
              <Route path="/juego/:slugCode" component={Catalog} />
              <Route path="/mod-shader/:slugCode" component={Catalog} />
              <Route path="/herramienta/:slugCode" component={Catalog} />
              <Route path="/adulto/:slugCode" component={Catalog} />

              {/* Subida de mods para un juego */}
              <Route path="/juego/:slugCode/subir-mod">
                <ProtectedRoute>
                  <UploadModPage />
                </ProtectedRoute>
              </Route>

              {/* URLs antiguas: redirigen a la URL nueva con el modal abierto */}
              <Route path="/juegos/:id" component={LegacyGameRedirect} />
              <Route path="/juegos/:id/subir-mod" component={LegacyGameRedirect} />

              {/* Rutas públicas de autenticación - solo para no autenticados */}
              <Route path="/login">
                <PublicRoute redirectTo="/catalogo">
                  <Auth initialMode="login" />
                </PublicRoute>
              </Route>
              <Route path="/register">
                <PublicRoute redirectTo="/catalogo">
                  <Auth initialMode="register" />
                </PublicRoute>
              </Route>

              {/* Fallback */}
              <Route>
                <Redirect to="/" />
              </Route>
            </Switch>
            <ChatWidget />
          </AudioProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
