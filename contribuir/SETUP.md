# Setup de Firebase + App Check para `/contribuir`

Esta guía te lleva paso a paso desde "no tengo nada" hasta "la página de
contribuir funciona y guarda aportes en Firestore con todas las defensas
de seguridad activas". Tiempo estimado: 30–45 minutos la primera vez.

## Resumen de seguridad

Estamos protegiendo el endpoint de captura contra tres amenazas:

1. **Bots automatizados** que llenen la base con basura → **App Check con
   reCAPTCHA v3**.
2. **Aportes malformados** que rompan el panel de validadores → **Reglas
   Firestore con validación estricta** (`firestore.rules`).
3. **Lectura pública del dataset** antes de validación → **Reglas que
   prohíben `read`/`update`/`delete` desde cliente**.

Hay **defense in depth**: el cliente (`contribute.js`) valida ANTES de
enviar, las reglas Firestore vuelven a validar al recibir, y App Check
bloquea cualquier llamada que no venga del navegador con reCAPTCHA OK.

## Paso 1 — Crear el proyecto Firebase

1. Ir a [console.firebase.google.com](https://console.firebase.google.com).
2. Click en **"Add project"** → nombrarlo `manos-que-hablan` (o como prefieras).
3. Desactivar Google Analytics (no lo necesitamos, además lo desactivamos
   por privacidad).
4. Crear el proyecto.

## Paso 2 — Habilitar Firestore

1. Dentro del proyecto, panel izquierdo → **"Firestore Database"** →
   "Create database".
2. Elegir **"Start in production mode"** (NO test mode — eso deja la
   base abierta).
3. Región: `southamerica-east1` (São Paulo) o `us-central1`. Sao Paulo
   tiene menor latencia desde Chile.
4. Crear.

## Paso 3 — Pegar las reglas de seguridad

1. En la pestaña **Rules** del Firestore.
2. Borrar el contenido por defecto.
3. Pegar el contenido COMPLETO del archivo `firestore.rules` que está
   en esta carpeta.
4. Click en **Publish**.

Verificación rápida: en la pestaña Rules, abajo aparece el simulador.
Probá una escritura con datos malos — debe fallar con `permission-denied`.

## Paso 4 — Configurar App Check con reCAPTCHA v3

App Check verifica que cada request venga de un navegador legítimo
en tu dominio, no de un bot.

### 4.1 Crear el site key de reCAPTCHA v3

1. Ir a [google.com/recaptcha/admin/create](https://www.google.com/recaptcha/admin/create).
2. **Label**: `Manos que Hablan - web`
3. **Type**: reCAPTCHA v3
4. **Domains**: agregar
   - `pgreyesm.github.io`
   - `manosquehablan.cl` (si vas a usar dominio propio en el futuro)
   - `localhost` (para desarrollo local)
5. Aceptar términos → Submit.
6. Te muestra un **site key** y un **secret key**.
   - Copiar el **site key** (lo vamos a poner en `contribute.js`).
   - El secret key NO lo necesitamos.

### 4.2 Activar App Check en Firebase

1. En Firebase console, panel izquierdo → **App Check**.
2. Si todavía no registraste tu app web: en Project Settings → General →
   Your apps → click `</>` (Web) → registrarla con nickname `manos-que-hablan-web`.
3. De vuelta en App Check, seleccionar la app web → click **"Register"**.
4. Provider: **reCAPTCHA v3**.
5. Pegar el **site key** de reCAPTCHA del paso 4.1.
6. **Token TTL**: 1 hour está bien.
7. Save.

### 4.3 Hacer App Check obligatorio en Firestore

1. En App Check, ir a la pestaña **APIs** (arriba).
2. Click en **Cloud Firestore**.
3. Cambiar a **Enforced**.

Esto es lo que bloquea los bots: sin token de reCAPTCHA válido, Firestore
rechaza cualquier escritura.

## Paso 5 — Configurar dominios autorizados (cliente)

1. En Firebase console → Authentication → Settings → Authorized domains.
2. (Si no tenés Auth habilitado, saltá este paso. No usamos Auth en esta
   etapa, pero Firebase puede pedírtelo en algunos casos).

## Paso 6 — Copiar el config a `contribute.js`

1. Project Settings (engranaje arriba a la izquierda) → General → bajar a
   **"Your apps"** → la app web → click **"SDK setup and configuration"** →
   **Config**.
2. Vas a ver algo como:

   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "manos-que-hablan.firebaseapp.com",
     projectId: "manos-que-hablan",
     storageBucket: "manos-que-hablan.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123def456"
   };
   ```

3. Abrir `web/contribuir/contribute.js`. Buscar el bloque:

   ```javascript
   const FIREBASE_CONFIG = {
     apiKey: 'PASTE_YOUR_FIREBASE_API_KEY_HERE',
     ...
   };

   const RECAPTCHA_V3_SITE_KEY = 'PASTE_YOUR_RECAPTCHA_SITE_KEY_HERE';
   ```

4. Reemplazar TODOS los valores `PASTE_*` con los reales:
   - Los 6 valores de `firebaseConfig`.
   - El `RECAPTCHA_V3_SITE_KEY` del paso 4.1.

5. Guardar el archivo.

> **Nota sobre el `apiKey`**: NO es un secreto. Está bien que viaje en el
> HTML público. Lo que protege la base es la combinación de App Check
> obligatorio + reglas Firestore + dominios autorizados.

## Paso 7 — Configurar cuotas (opcional pero recomendado)

Para limitar el daño si algo se descontrola:

1. Firebase console → Usage and billing → Spark plan está bien para
   empezar (gratis: 1 GB Firestore, 50K reads/día, 20K writes/día,
   1 GB Storage).
2. Si subís a Blaze: configurar **Budget alerts** en Google Cloud
   Console → Billing → Budgets & alerts.
   Recomiendo alerta a 5 USD/mes para enterarte rápido si algo se
   dispara.

## Paso 8 — Probar

1. Sincronizá la carpeta `web/` al repo de la web:
   ```powershell
   .\sync_web.ps1
   ```
2. Push al repo `manos-que-hablan-web`. GitHub Pages re-deploya automático.
3. Esperá 1-2 minutos.
4. Andá a `https://pgreyesm.github.io/manos-que-hablan-web/contribuir/`.
5. Hacé el flujo completo: onboarding → grabar 3s → revisar → enviar.
6. En Firebase console → Firestore Database, deberías ver la colección
   `contributions` con tu primer documento.

## Paso 9 — Empezar a recibir aportes

Cuando todo funcione end-to-end, agregá un link a `/contribuir/` desde la
landing principal (`web/index.html`), por ejemplo en la sección
"Contribuir" del CTA final.

## Mantenimiento posterior

Cuando agregues nuevas palabras a `prompt_words.js`, también tenés que:

1. Agregarlas en `firestore.rules` en la lista de `wordId in [...]`.
2. Re-publicar las reglas (Firebase console o `firebase deploy --only firestore:rules`).

Si te olvidás de actualizar las reglas, los aportes con la palabra nueva
van a ser rechazados con `permission-denied`. Es por diseño: las reglas
son la verdad, el cliente puede mentir.

## Troubleshooting

**"Firebase: error (auth/...)"** — el `apiKey` está mal.

**"permission-denied" al enviar** — leer las reglas de `firestore.rules`,
verificar que los datos coincidan exactamente. Suele ser:
- Algún campo extra o faltante.
- `wordId` no está en la lista.
- `region` o `fluency` con typo.

**"App Check token verification failed"** — el `RECAPTCHA_V3_SITE_KEY`
está mal, o el dominio del site no está autorizado en reCAPTCHA admin.

**"FirebaseError: Missing or insufficient permissions"** — las reglas
no se publicaron. Volvé a la pestaña Rules → Publish.

**Funciona en localhost pero no en producción** — el dominio `pgreyesm.github.io`
no está en el reCAPTCHA admin (ni en App Check).

## Auditoría posterior

Cuando ya tengas aportes, en Firebase console → Firestore Database
podés explorar la colección `contributions`. Cada documento tiene:

- `wordId`, `wordText`: palabra que se firmó.
- `region`, `fluency`: declarado por el contribuyente.
- `contributorUuid`: identificador anónimo del navegador.
- `animation`: los landmarks (no el video, esos no se guardan nunca).
- `status: pending_review`: esperando validación humana.
- `createdAt`: timestamp del servidor (no del cliente — eso evita backdating).

El siguiente paso del proyecto es construir el panel de validadores
(separado de esta página) que lea esta colección, muestre la animación
de landmarks, y permita aprobar/rechazar.
