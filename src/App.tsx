import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Route } from "wouter";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Tools from "./pages/Tools";
import Programming from "./pages/Programming";
import WindowsTools from "./pages/WindowsTools";
import LoadingScreen from "./components/LoadingScreen";
import ChatWidget from "./components/ChatWidget";
import { AudioProvider } from "./AudioContext";

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

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const MIN_TIME = isMobile ? 3000 : 2000;
    const start = Date.now();

    preloadImages(HERO_IMAGES).then(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MIN_TIME - elapsed);
      setTimeout(() => setIsLoading(false), remaining);
    });
  }, []);

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
            <Route path="/" component={Home} />
            <Route path="/catalogo" component={Catalog} />
            <Route path="/sotano" component={Catalog} />
            <Route path="/tools" component={Catalog} />
            <Route path="/tools/all">
              <Tools />
            </Route>
            <Route path="/tools/programming">
              <Programming />
            </Route>
            <Route path="/tools/windows">
              <WindowsTools />
            </Route>
            <ChatWidget />
          </AudioProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
