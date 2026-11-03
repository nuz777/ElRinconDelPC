# 🖥️ El Sótano del PC



<p align="center">
  <strong>Tu rincón definitivo para juegos de PC, mods, shaders y herramientas de optimización.</strong><br>
  Plataforma web moderna, rápida y limpia con catálogo interactivo, descargas directas y fichas técnicas en pantalla completa.
</p>

<p align="center">
  <a href="https://github.com/nuz777/ElRinconDelPC"><img src="https://img.shields.io/badge/Versi%C3%B3n-2.0.0-white?style=for-the-badge&logo=github&logoColor=black&labelColor=27272a" alt="Version 2.0.0"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-black?style=for-the-badge&logo=react&logoColor=61DAFB&labelColor=18181b" alt="React 19"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6.0-black?style=for-the-badge&logo=typescript&logoColor=3178C6&labelColor=18181b" alt="TypeScript"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-black?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8&labelColor=18181b" alt="Tailwind CSS v4"></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-8.0-black?style=for-the-badge&logo=vite&logoColor=646CFF&labelColor=18181b" alt="Vite"></a>
  <img src="https://img.shields.io/badge/Licencia-MIT-white?style=for-the-badge&labelColor=27272a" alt="License MIT">
</p>

---

## ⚡ Características Principales

- 🎮 **Catálogo Completo y Organizado**: Sección dedicada (`/catalogo`) estructurada por categorías y géneros:
  - **Juegos de PC**: Acción & Shooters, Lucha / Fighting, Aventura / RPG, Supervivencia & Terror.
  - **Mods & Shaders**: Mejoras gráficas fotorrealistas, expansiones de jugabilidad y parches de rendimiento (Sodium, DXVK).
  - **Herramientas de PC**: Optimización de Windows (CTT), monitorización de hardware (MSI Afterburner, HWiNFO64) y utilidades de drivers (DDU, Ventoy).
- 🔍 **Buscador Instantáneo**: Filtro en tiempo real por título, género, etiquetas o desarrollador.
- 📱 **Menú Hamburguesa & Filtros Rápidos**: Cajón lateral para alternar entre apartados y filtrar por cualquier género con un solo clic.
- 🖥️ **Ficha Fullscreen Animada**: Al pulsar cualquier tarjeta, se despliega una vista que ocupa el 100% de la pantalla con animaciones fluidas, requisitos del sistema (CPU, GPU, RAM, disco), pasos de instalación guiados y zona de descargas verificadas.
- 🌓 **Modo Claro & Modo Oscuro**: Paleta monocromática elegante (blanco, gris y negro) con soporte nativo de alto contraste y alternancia inmediata.
- 🚀 **Rendimiento 120 FPS**: Animaciones aceleradas por hardware GPU en CSS (`transform-gpu`, `will-change-transform`), sin bloqueos en el hilo principal de JavaScript.
- 💻 **Terminal Interactiva**: Terminal retro inspirada en Unix con comandos interactivos (`ls`, `catalogo`, `help`).
- ➕ **Gestor de Items**: Modal para agregar nuevos juegos o herramientas directamente desde la interfaz, persistidos en almacenamiento local.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend Core** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Estilos & Diseño** | [Tailwind CSS v4](https://tailwindcss.com/) (Tokens `@theme`, variables CSS dinámicas) |
| **Animaciones** | [Motion](https://motion.dev/) (Framer Motion v12) + Transiciones CSS compuestas en GPU |
| **Enrutamiento** | [Wouter](https://github.com/molefrog/wouter) (Enrutador ultraligero sin dependencias pesadas) |
| **Iconografía** | [Lucide React](https://lucide.dev/) |
| **Tooling & Build** | [Vite 8](https://vitejs.dev/), [pnpm](https://pnpm.io/) |

---

## 📂 Estructura del Código

```text
ElRinconDelPC/
├── public/
│   ├── audio/                     # Pistas de audio y efectos interactivos
│   ├── hero/                      # Visuales del banner principal
│   ├── img/                       # Imágenes activas, portadas y branding
│   └── agent.webp                 # Asistente virtual
├── src/
│   ├── components/
│   │   ├── AddItemModal.tsx       # Modal para añadir nuevos items al catálogo
│   │   ├── ChatWidget.tsx         # Widget de asistencia rápida de PC
│   │   ├── Footer.tsx             # Pie de página responsivo
│   │   ├── FullscreenDetailModal.tsx # Ficha técnica y descargas en pantalla completa
│   │   ├── Header.tsx             # Navegación flotante con soporte claro/oscuro
│   │   ├── Hero.tsx               # Portada con efecto de máquina de escribir
│   │   ├── LoadingScreen.tsx      # Pantalla de carga animada
│   │   ├── PortfolioModal.tsx     # Modal interactivo con perfil del creador
│   │   └── TeamTerminal.tsx       # Terminal interactiva
│   ├── data/
│   │   ├── catalog.ts             # Base de datos del catálogo (2 cards por género)
│   │   ├── languages.ts           # Información de lenguajes de programación
│   │   ├── team.ts                # Información de Nuz (Desarrollador Fullstack)
│   │   └── windowsItems.ts        # Herramientas esenciales de Windows
│   ├── pages/
│   │   ├── Catalog.tsx            # Página principal del catálogo (/catalogo)
│   │   ├── Home.tsx               # Página de inicio del sitio (/)
│   │   └── WindowsTools.tsx       # Sección de utilidades de sistema
│   ├── AudioContext.tsx           # Contexto de reproducción y visualizador de audio
│   ├── ThemeContext.tsx           # Manejador global de Modo Claro / Modo Oscuro
│   ├── index.css                  # Estilos globales y paleta monocromática
│   ├── main.tsx                   # Punto de entrada de la aplicación
│   └── App.tsx                    # Configuración de rutas y precarga
├── index.html                     # HTML principal
├── package.json                   # Dependencias y scripts
└── vite.config.ts                 # Configuración de Vite
```

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [pnpm](https://pnpm.io/) (recomendado) o `npm`

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/nuz777/ElRinconDelPC.git
   cd ElRinconDelPC
   ```

2. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

3. **Iniciar servidor de desarrollo:**
   ```bash
   pnpm dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

4. **Compilar para producción:**
   ```bash
   pnpm build
   ```
   Los archivos listos para despliegue se generarán en la carpeta `dist/`.

---

## 👨‍💻 Autor

- **Nuz_v** ([@nuz777](https://github.com/nuz777))
  - *Desarrollador Fullstack* enfocado en **C#**, **.NET**, **React** y **TypeScript**.
z  -  mantenedor de **El sótano del pc**.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
