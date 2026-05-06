# Manos que Hablan — sitio web

Landing page estática del proyecto. Un solo archivo HTML, sin dependencias
externas, sin tracking, sin Google Fonts. Pesa menos de 30 KB.

## Estructura

```
web/
├── index.html      Página única con todo el contenido + estilos inline
├── favicon.svg     Icono cuadrado, modo oscuro/claro automatico
└── README.md       Este archivo
```

## Probar localmente

Abrir `index.html` directamente en el navegador. No requiere servidor.

```powershell
start index.html
```

## Desplegar en GitHub Pages (gratis, dominio pgreyesm.github.io)

Lo más sencillo es publicar la carpeta `web/` como sitio.

### Opción A: nuevo repositorio dedicado al sitio (recomendado)

1. Crear un repositorio público en GitHub llamado `manos-que-hablan-web`.
2. Subir solo el contenido de esta carpeta `web/` a la raíz del nuevo repo:

   ```powershell
   cd C:\Users\PedroR\Documents\sordo-mudo\web
   git init -b main
   git add -A
   git commit -m "Sitio web inicial"
   git remote add origin https://github.com/PGreyesM/manos-que-hablan-web.git
   git push -u origin main
   ```

3. En GitHub: Settings → Pages → Source: "Deploy from a branch" → Branch:
   `main` / root → Save.
4. Esperar 1-2 minutos. URL final:
   `https://pgreyesm.github.io/manos-que-hablan-web/`

### Opción B: subcarpeta del repo existente

Si querés mantener todo en `manos-que-hablan-app`:

1. Settings → Pages → Source: "Deploy from a branch" → Branch: `main` /
   `web` → Save.
2. URL final: `https://pgreyesm.github.io/manos-que-hablan-app/`

Esta opción es más rápida pero deja la web en una URL menos limpia y
mezclada con el código de la app.

## Conectar dominio propio (opcional, ~10 USD/año)

Cuando tengas un dominio (ej. `manosquehablan.cl` registrado en NIC.cl):

1. En tu DNS, agregar un registro CNAME apuntando a `pgreyesm.github.io`.
2. En el repo del sitio, agregar un archivo `CNAME` con el dominio:

   ```
   manosquehablan.cl
   ```

3. En Settings → Pages → Custom domain → escribir `manosquehablan.cl` →
   esperar verificación (10-30 min) → marcar "Enforce HTTPS".

## Editar el sitio

Todo el contenido está en `index.html`. Los estilos están en el `<style>`
al inicio del mismo archivo. Para cambiar copia, secciones u orden, abrir
con cualquier editor de texto y modificar.

Variables de color en la raíz (`:root` y `@media (prefers-color-scheme: dark)`)
para cambiar la paleta global. Si querés cambiar el azul de marca por
otro color, cambiar `--accent: #1f3864;` a otro hex.

## Lo que NO incluye este sitio (deliberado)

- Google Analytics u otro tracker — privacidad consistente con la app.
- Google Fonts u otros CDNs — usa fuentes del sistema (Iowan/Charter/Georgia
  para serif, system-ui para sans). Carga instantáneo y funciona offline
  una vez visitada.
- Cookies — cero. No necesita banner de cookies.
- Imágenes externas — todo es SVG inline o CSS.
- Animaciones decorativas — minimalismo deliberado.
