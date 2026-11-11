# El Sótano — Guía de carga masiva de ROMs

Guía para administradores: cómo subir muchas ROMs al catálogo de una sola vez usando el **modal de Carga Masiva (JSON)**.

---

## 1. Requisitos previos

- Tener una cuenta con **permisos de administrador** e iniciar sesión.
- Estar en la página del catálogo (`/catalogo` o `/sotano`).
- Tener listo un archivo `.json` (o el texto JSON para pegar).

---

## 2. Abrir el modal de carga masiva

1. Entra al catálogo con tu cuenta de admin.
2. Presiona el botón **«Carga Masiva (JSON)»** (solo visible para administradores).
3. Elige el modo de entrada:
   - **Subir archivo .JSON**: selecciona o arrastra un archivo `.json`.
   - **Pegar texto JSON**: pega el contenido directamente en el cuadro de texto.

---

## 3. Estructuras JSON aceptadas

El parser acepta cualquiera de estos formatos:

```jsonc
// 1. Lista directa (recomendado)
[
  { "titulo": "Super Mario Bros.", ... },
  { "titulo": "Sonic the Hedgehog", ... }
]

// 2. Un único objeto
{ "titulo": "Super Mario Bros.", ... }

// 3. Contenedores con lista interna
{ "items": [...] }     // también: "juegos", "games", "catalog"
```

---

## 4. Campos que lee el JSON para ROMs

> **Regla de portadas y enlaces:** el JSON **NO** lee portadas ni links de descarga.
> Se asignan valores por defecto (`/img/indicado.webp` y `#`) para que los personalices
> después con el botón **Editar** de cada card.

| Campo | Claves aceptadas | Obligatorio | Valor por defecto |
|---|---|---|---|
| Título | `titulo`, `title`, `nombre`, `name` | ✅ | — |
| Apartado | `apartado`, `seccion`, `section`, `tipo` | — | `juegos` |
| Género | `genero`, `genre`, `categoria`, `category` | — | `Acción` (en ROMs) |
| Peso | `peso`, `tamano`, `tamaño`, `size` | — | `1.0 GB` |
| Versión | `version`, `versión`, `ver` | — | `v1.0` |
| Desarrollador | `desarrollador`, `developer`, `dev`, `autor` | — | `Comunidad El Sótano` |
| Etiqueta | `etiqueta`, `tag`, `badge` | — | `Nuevo` |
| Descripción | `descripcion`, `description`, `resumen`, `detalles` | ✅ | `"{titulo} en El Sótano."` |
| Marca | `marca`, `brand` | — (en ROMs) | `Nintendo` |
| Consola | `consola`, `console` | — (en ROMs) | `NES` |
| Emulador | `emulador`, `emulator`, `emulador_recomendado` | — | *(vacío)* |

### Especificaciones de PC

Van en un objeto `especificaciones` (también acepta `requisitos`, `requirements`,
`minimumRequirements` o `specs`, o los campos sueltos en la raíz):

```json
"especificaciones": {
  "so": "Windows 10 / 11",
  "cpu": "Intel Core i3 / Ryzen 3",
  "ram": "4 GB RAM",
  "gpu": "Gráficos integrados (OpenGL 3.3)",
  "almacenamiento": "100 MB libres"
}
```

---

## 5. Marcas y consolas válidas

Para que el apartado sea **ROMs**, usa `"apartado": "roms"` (o cualquier texto que
empiece con `rom`/`emula`). La combinación `marca` + `consola` **debe existir** en
esta tabla, o la API rechazará el elemento:

| Marca | Consolas |
|---|---|
| **Nintendo** | NES, Game Boy, Super Nintendo, Virtual Boy, Nintendo 64, Game Boy Color, Game Boy Advance, GameCube, Nintendo DS, Wii, Nintendo 3DS, Wii U, Nintendo Switch, Nintendo Switch 2 |
| **Sega** | Master System, Mega Drive / Genesis, Game Gear, Sega Saturn, Dreamcast |
| **PlayStation** | PlayStation, PlayStation 2, PSP, PlayStation 3, PS Vita, PlayStation 4, PlayStation 5 |
| **Atari** | Atari 7800, Atari Lynx, Atari Jaguar |
| **NEC** | TurboGrafx-16 / PC Engine |
| **SNK** | Neo Geo AES, Neo Geo Pocket |
| **Panasonic** | 3DO |

> Si la combinación no es válida, la API responde:
> `La consola "X" no pertenece a la marca "Y"`.

---

## 6. Ejemplo completo

```json
[
  {
    "titulo": "Super Metroid",
    "apartado": "roms",
    "marca": "Nintendo",
    "consola": "Super Nintendo",
    "emulador": "Snes9x",
    "genero": "Acción / Aventura",
    "peso": "3.5 MB",
    "version": "v1.0",
    "etiqueta": "Popular",
    "descripcion": "Samus Aran explora Zebes para rescatar a la cría Metroid.",
    "desarrollador": "Nintendo R&D1",
    "especificaciones": {
      "so": "Windows 7 / 10 / 11, Linux o macOS",
      "cpu": "Cualquier CPU de doble núcleo",
      "ram": "2 GB RAM",
      "gpu": "Gráficos integrados",
      "almacenamiento": "Menos de 100 MB (emulador + ROM)"
    }
  },
  {
    "titulo": "Pokémon Esmeralda",
    "apartado": "roms",
    "marca": "Nintendo",
    "consola": "Game Boy Advance",
    "emulador": "mGBA",
    "genero": "RPG",
    "peso": "16 MB",
    "descripcion": "Aventura clásica de Pokémon en la región de Hoenn."
  }
]
```

---

## 7. Flujo de importación

1. Sube o pega el JSON: el modal muestra una **vista previa** con cada elemento
   detectado (válido o con advertencias) y sus especificaciones.
2. Revisa que todos los elementos aparezcan como **válidos** (los que tienen error
   se excluyen de la importación).
3. Pulsa **«Importar N Elementos a la DB»**. Verás una barra de progreso elemento
   por elemento.
4. Al terminar aparece el mensaje de éxito (o el detalle de los que fallaron).
5. **Importante:** edita cada card con el botón **Editar** (ámbar) para asignar la
   **portada** y los **links de descarga** reales.

> Si el JSON tiene un único elemento, también puedes usar
> **«Autocompletar en el formulario actual»** en vez de importarlo directo a la DB.

---

## 8. Errores comunes

| Error | Causa / Solución |
|---|---|
| `Error de sintaxis JSON` | El texto no es JSON válido (comas faltantes, comillas incorrectas). Valida el archivo en jsonlint.com |
| `El campo "titulo" es obligatorio` | Falta `titulo`/`title` en ese elemento |
| `Debe tener una "descripcion"` | Ni el elemento ni el título aportan descripción |
| `La consola "X" no pertenece a la marca "Y"` | Revisa la tabla de marcas/consolas de la sección 5 |
| Elemento marcado en rojo en la vista previa | Tiene errores y **no se importará**; corrige el JSON y vuelve a cargar |

---

## 9. Notas técnicas

- La importación crea los elementos uno a uno vía `catalogService.createItem` (API REST).
- La lista de marcas/consolas se mantiene en dos archivos que deben estar sincronizados:
  - `Frontend/src/data/romPlatforms.ts` (frontend: agrega emulador y requisitos sugeridos)
  - `API/src/Catalog/Domain/Entities/rom-platforms.ts` (backend: validación)
- Campos extra en el JSON que no estén en la tabla de la sección 4 se **ignoran**.
