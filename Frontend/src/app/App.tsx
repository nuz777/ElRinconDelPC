import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Redirect, Route, Switch } from "wouter";
import { AuthProvider } from "../features/auth/context/AuthContext";
import { catalogService } from "../features/catalog/api/catalog.service";
import { useAuth } from "../features/auth/context/useAuth";
import { AdminRoute } from "../features/auth/guards/AdminRoute";
import { ProtectedRoute } from "../features/auth/guards/ProtectedRoute";
import { PublicRoute } from "../features/auth/guards/PublicRoute";
import { AudioProvider } from "../shared/context/AudioContext";
import ChatWidget from "../shared/ui/ChatWidget";
import LoadingScreen from "../shared/ui/LoadingScreen";
import { ROUTES } from "./routes";

const HomePage = lazy(() => import("../features/home/pages/HomePage"));
const CatalogPage = lazy(() => import("../features/catalog/pages/CatalogPage"));
const ToolsPage = lazy(() => import("../features/tools/pages/ToolsPage"));
const ProgrammingPage = lazy(() => import("../features/tools/pages/ProgrammingPage"));
const WindowsToolsPage = lazy(() => import("../features/tools/pages/WindowsToolsPage"));
const AuthPage = lazy(() => import("../features/auth/pages/AuthPage"));
const CreateGamePage = lazy(() => import("../features/games/pages/CreateGamePage"));
const UploadModPage = lazy(() => import("../features/games/pages/UploadModPage"));
const LegacyGameRedirect = lazy(
  () => import("../features/games/pages/LegacyGameRedirect"),
);

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

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="animate-spin  h-10 w-10 border-b-2 border-zinc-400" />
    </div>
  );
}

function AppInner() {
  const [imageLoading, setImageLoading] = useState(true);
  const { isLoading: authLoading } = useAuth();

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const MIN_TIME = isMobile ? 3000 : 2000;
    const start = Date.now();

    void catalogService.prefetchRecentPage("JUEGOS", 12).catch(() => undefined);

    void preloadImages(HERO_IMAGES).then(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_TIME - elapsed);
      window.setTimeout(() => setImageLoading(false), remaining);
    });
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
            <Suspense fallback={<PageFallback />}>
              <Switch>
                <Route path={ROUTES.HOME} component={HomePage} />

                <Route path={ROUTES.CATALOG} component={CatalogPage} />
                <Route path="/sotano" component={CatalogPage} />
                <Route path={ROUTES.GAMES} component={CatalogPage} />
                <Route path={ROUTES.MODS} component={CatalogPage} />
                <Route path={ROUTES.TOOLS} component={CatalogPage} />
                <Route path={ROUTES.ADULT} component={CatalogPage} />
                <Route path="/+18" component={CatalogPage} />

                <Route path="/rom/:brand/:console" component={CatalogPage} />
                <Route path="/rom/:brand/:console/:slugCode" component={CatalogPage} />
                <Route path="/rom">
                  <Redirect to={ROUTES.CATALOG} replace />
                </Route>
                <Route path="/rom/:brand">
                  <Redirect to={ROUTES.CATALOG} replace />
                </Route>

                <Route path="/tools" component={ToolsPage} />
                <Route path="/tools/all" component={ToolsPage} />
                <Route path="/tools/programming" component={ProgrammingPage} />
                <Route path="/tools/windows" component={WindowsToolsPage} />

                <Route path="/publish">
                  <ProtectedRoute>
                    <AdminRoute>
                      <CatalogPage />
                    </AdminRoute>
                  </ProtectedRoute>
                </Route>
                <Route path="/dashboard/crear">
                  <ProtectedRoute>
                    <AdminRoute>
                      <CatalogPage />
                    </AdminRoute>
                  </ProtectedRoute>
                </Route>

                <Route path={ROUTES.ADMIN_CREATE_GAME}>
                  <ProtectedRoute>
                    <AdminRoute>
                      <CreateGamePage />
                    </AdminRoute>
                  </ProtectedRoute>
                </Route>

                <Route path="/juego/:slugCode/subir-mod">
                  <ProtectedRoute>
                    <UploadModPage />
                  </ProtectedRoute>
                </Route>

                <Route path="/juego/:slugCode" component={CatalogPage} />
                <Route path="/mod-shader/:slugCode" component={CatalogPage} />
                <Route path="/herramienta/:slugCode" component={CatalogPage} />
                <Route path="/adulto/:slugCode" component={CatalogPage} />

                <Route path="/juegos/:id" component={LegacyGameRedirect} />
                <Route path="/juegos/:id/subir-mod" component={LegacyGameRedirect} />

                <Route path={ROUTES.LOGIN}>
                  <PublicRoute redirectTo={ROUTES.CATALOG}>
                    <AuthPage initialMode="login" />
                  </PublicRoute>
                </Route>
                <Route path={ROUTES.REGISTER}>
                  <PublicRoute redirectTo={ROUTES.CATALOG}>
                    <AuthPage initialMode="register" />
                  </PublicRoute>
                </Route>

                <Route>
                  <Redirect to={ROUTES.HOME} />
                </Route>
              </Switch>
            </Suspense>
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
