// Manos que Hablan - Contribuir desde web
//
// Flujo:
//   1. Inicializa Firebase + App Check (reCAPTCHA v3) lo antes posible.
//   2. Cuando el usuario completa el onboarding, pide acceso a la camara
//      e inicializa MediaPipe HandLandmarker.
//   3. Al grabar: procesa frames del live stream con HandLandmarker,
//      acumula landmarks en memoria. El video original NUNCA se guarda
//      ni se envia.
//   4. Valida la captura en cliente (tamaño, frames con manos, formato).
//   5. Envia el JSON con landmarks a Firestore via SDK Web.
//
// Privacidad: la promesa "el video nunca sale del dispositivo" se mantiene
// porque MediaPipe corre 100% en el navegador del usuario (WebAssembly +
// WebGL). Lo unico que viaja al servidor son las coordenadas matematicas
// de los landmarks.

// ---- Imports ESM via CDN -----------------------------------------------

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app-check.js';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import {
  HandLandmarker,
  FilesetResolver,
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';

import {
  PROMPT_WORDS,
  CATEGORY_LABELS,
  REGIONS,
  FLUENCY_LEVELS,
  VALID_REGION_IDS,
  VALID_FLUENCY_IDS,
  VALID_WORD_IDS,
  sortedByPriority,
} from './prompt_words.js';

// ---- Configuracion -----------------------------------------------------

// IMPORTANTE: estos valores los reemplaza el usuario tras crear el proyecto
// Firebase. Ver SETUP.md. Mientras esten en su valor placeholder, la app
// muestra una pantalla de error explicando que falta la configuracion.
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyB_y0VBDMCvfemyfs03brjwbyguFcN3QBY',
  authDomain: 'manos-que-hablan-db264.firebaseapp.com',
  projectId: 'manos-que-hablan-db264',
  storageBucket: 'manos-que-hablan-db264.firebasestorage.app',
  messagingSenderId: '701169560377',
  appId: '1:701169560377:web:546cc038b39b43988ed6e8',
};

const RECAPTCHA_V3_SITE_KEY = '6Ld2JN0sAAAAACgPqL8DV-iXhVs6c7y682HPQ9Zu';

const APP_VERSION = '0.4.0-web';
const TARGET_FPS = 30;
const RECORDING_MS = 3000; // 3 segundos
const COUNTDOWN_S = 3;
const MAX_JSON_BYTES = 180 * 1024; // 180 KB margen sobre 200 KB de la regla
const MIN_DETECTION_PERCENT_TO_SUBMIT = 0.10; // 10%, sino bloqueamos envio

// ---- Estado global -----------------------------------------------------

let firebaseApp = null;
let firestore = null;
let appCheckReady = false;
let handLandmarker = null;
let mediaStream = null;

const state = {
  profile: null, // {uuid, region, fluency, acceptedAt}
  queue: [],     // PromptWord[]
  current: null, // PromptWord
  contributedCount: 0,
  pendingCapture: null, // {wordId, wordText, animation, ...}
};

// ---- Helpers -----------------------------------------------------------

function $(id) { return document.getElementById(id); }

function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $('view-' + viewId).classList.add('active');
  window.scrollTo(0, 0);
}

function showError(message) {
  $('error-message').textContent = message;
  showView('error');
}

function generateUuid() {
  // UUID v4-ish con crypto.getRandomValues (criptograficamente seguro)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
}

const STORAGE_KEY = 'mqh_profile_v1';
const COUNT_KEY = 'mqh_count_v1';
const CONTRIBUTED_IDS_KEY = 'mqh_contributed_ids_v1';

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveProfile(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function loadCount() {
  return parseInt(localStorage.getItem(COUNT_KEY) || '0', 10);
}

function bumpCount() {
  const n = loadCount() + 1;
  localStorage.setItem(COUNT_KEY, String(n));
  return n;
}

function loadContributedIds() {
  try {
    const raw = localStorage.getItem(CONTRIBUTED_IDS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function addContributedId(id) {
  const s = loadContributedIds();
  s.add(id);
  localStorage.setItem(CONTRIBUTED_IDS_KEY, JSON.stringify([...s]));
}

// ---- Firebase init -----------------------------------------------------

function isFirebaseConfigured() {
  return !FIREBASE_CONFIG.apiKey.startsWith('PASTE_') &&
         !RECAPTCHA_V3_SITE_KEY.startsWith('PASTE_');
}

async function initFirebase() {
  if (!isFirebaseConfigured()) {
    showError(
      'La configuración de Firebase falta. Si sos quien deploya, revisá ' +
      'web/contribuir/SETUP.md y reemplazá los valores placeholder en ' +
      'contribute.js con los del proyecto Firebase.'
    );
    return false;
  }
  try {
    firebaseApp = initializeApp(FIREBASE_CONFIG);
    initializeAppCheck(firebaseApp, {
      // reCAPTCHA Enterprise (no el v3 clasico). Google migra los sites
      // nuevos a Enterprise automaticamente, asi que usamos el provider
      // que matchea con el panel donde el site quedo registrado.
      provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_V3_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
    firestore = getFirestore(firebaseApp);
    appCheckReady = true;
    return true;
  } catch (e) {
    console.error('[firebase] init falló', e);
    showError(
      'No se pudo inicializar Firebase. Si tenés un bloqueador de ' +
      'anuncios, desactívalo para este sitio. Detalle: ' + (e.message || e)
    );
    return false;
  }
}

// ---- MediaPipe init ----------------------------------------------------

async function initHandLandmarker() {
  if (handLandmarker) return handLandmarker;
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.3,
    minHandPresenceConfidence: 0.3,
    minTrackingConfidence: 0.3,
  });
  return handLandmarker;
}

async function initCamera() {
  if (mediaStream) return mediaStream;
  mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 30 },
    },
    audio: false,
  });
  const videoEl = $('video');
  videoEl.srcObject = mediaStream;
  await new Promise((resolve) => {
    videoEl.onloadedmetadata = resolve;
  });
  return mediaStream;
}

// ---- Onboarding --------------------------------------------------------

function setupOnboarding() {
  // Region dropdown
  const regionSelect = $('region');
  regionSelect.innerHTML = '';
  for (const r of REGIONS) {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = r.label;
    regionSelect.appendChild(opt);
  }

  // Fluency options
  const fluencyContainer = $('fluency-options');
  fluencyContainer.innerHTML = '';
  let selectedFluency = null;

  for (const f of FLUENCY_LEVELS) {
    const div = document.createElement('div');
    div.className = 'fluency-option';
    div.dataset.fluencyId = f.id;
    div.innerHTML = `
      <div class="radio"></div>
      <div class="text">
        <div class="title-line"></div>
        <div class="desc"></div>
      </div>
    `;
    div.querySelector('.title-line').textContent = f.label;
    div.querySelector('.desc').textContent = f.description;
    div.addEventListener('click', () => {
      selectedFluency = f.id;
      fluencyContainer.querySelectorAll('.fluency-option').forEach(el =>
        el.classList.toggle('selected', el === div)
      );
      validateForm();
    });
    fluencyContainer.appendChild(div);
  }

  function validateForm() {
    const ok =
      regionSelect.value !== 'unspecified' &&
      regionSelect.value !== '' &&
      selectedFluency !== null &&
      VALID_REGION_IDS.includes(regionSelect.value) &&
      VALID_FLUENCY_IDS.includes(selectedFluency);
    $('onboarding-submit').disabled = !ok;
  }

  regionSelect.addEventListener('change', validateForm);

  // Si ya hay perfil cargado, precargar valores (modo edicion)
  if (state.profile) {
    regionSelect.value = state.profile.region;
    const opt = fluencyContainer.querySelector(
      `[data-fluency-id="${state.profile.fluency}"]`
    );
    if (opt) {
      opt.classList.add('selected');
      selectedFluency = state.profile.fluency;
    }
    $('onboarding-submit').textContent = 'Guardar cambios';
    validateForm();
  }

  $('onboarding-submit').addEventListener('click', async () => {
    const region = regionSelect.value;
    const fluency = selectedFluency;
    if (!VALID_REGION_IDS.includes(region) || !VALID_FLUENCY_IDS.includes(fluency)) {
      return;
    }
    const existing = state.profile;
    state.profile = {
      uuid: existing?.uuid ?? generateUuid(),
      region,
      fluency,
      acceptedAt: existing?.acceptedAt ?? new Date().toISOString(),
    };
    saveProfile(state.profile);
    await goToCapture();
  });
}

// ---- Capture flow ------------------------------------------------------

async function goToCapture() {
  // Refrescar cola excluyendo palabras ya enviadas
  const excluded = loadContributedIds();
  state.queue = sortedByPriority(excluded);
  state.current = state.queue[0] ?? null;
  state.contributedCount = loadCount();

  if (!state.current) {
    showError(
      'Has aportado todas las palabras de la lista actual. Pronto agregamos más. ' +
      'Gracias por construir esto.'
    );
    return;
  }

  showView('capture');
  updateCaptureUI();

  // Inicializar camara y MediaPipe en paralelo (perezoso, primera vez tarda ~2s)
  try {
    await Promise.all([initCamera(), initHandLandmarker()]);
  } catch (e) {
    console.error('[capture] init falló', e);
    showError(
      'No pudimos acceder a la cámara. Permití el acceso desde el ícono ' +
      'del candado de la barra de direcciones y volvé a intentar. Detalle: ' +
      (e.message || e)
    );
  }
}

function updateCaptureUI() {
  if (!state.current) return;
  $('word-text').textContent = state.current.text;
  $('word-category').textContent = CATEGORY_LABELS[state.current.category] || '';
  $('capture-counter').textContent =
    state.contributedCount === 0
      ? 'Tu primer aporte'
      : `${state.contributedCount} aporte${state.contributedCount === 1 ? '' : 's'}`;
}

function setupCaptureHandlers() {
  $('record-btn').addEventListener('click', startCountdown);
  $('skip-btn').addEventListener('click', () => {
    if (state.queue.length <= 1) return;
    state.queue = state.queue.slice(1);
    state.current = state.queue[0] ?? null;
    updateCaptureUI();
  });
  $('edit-profile-btn').addEventListener('click', () => {
    showView('onboarding');
    setupOnboarding();
  });
}

let recordTimerId = null;

function startCountdown() {
  $('record-btn').disabled = true;
  $('skip-btn').disabled = true;
  const cd = $('countdown');
  cd.classList.add('active');
  let remaining = COUNTDOWN_S;
  cd.textContent = remaining;
  const tick = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(tick);
      cd.classList.remove('active');
      startRecording();
    } else {
      cd.textContent = remaining;
    }
  }, 1000);
}

async function startRecording() {
  $('rec-indicator').classList.add('active');
  const videoEl = $('video');
  const startTime = performance.now();
  const frames = [];
  let lastProcessedAt = 0;

  function loop(now) {
    const elapsed = now - startTime;
    if (elapsed >= RECORDING_MS) {
      finishRecording(frames);
      return;
    }
    // Limitar a TARGET_FPS para no sobrecargar (CPU sigue procesando entre)
    if (now - lastProcessedAt < (1000 / TARGET_FPS) - 1) {
      requestAnimationFrame(loop);
      return;
    }
    lastProcessedAt = now;

    try {
      const result = handLandmarker.detectForVideo(videoEl, now);
      // Estructura SIN nested arrays (Firestore no las soporta).
      // frame = { hands: [ {handedness, landmarks: [{x,y,z}, ...] } ] }
      const handsInFrame = (result.landmarks || []).map((handLandmarks, i) => {
        const handedness =
          result.handedness?.[i]?.[0]?.categoryName ||
          result.handednesses?.[i]?.[0]?.categoryName ||
          'Unknown';
        return {
          handedness,
          landmarks: handLandmarks.map(lm => ({
            x: roundFloat(lm.x),
            y: roundFloat(lm.y),
            z: roundFloat(lm.z),
          })),
        };
      });
      frames.push({ hands: handsInFrame });
    } catch (e) {
      console.warn('[capture] frame skip:', e);
      frames.push({ hands: [] }); // mantener cadencia
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

function roundFloat(n) {
  // 5 decimales es suficiente, reduce tamaño JSON y ruido numerico
  return Math.round(n * 100000) / 100000;
}

function finishRecording(frames) {
  $('rec-indicator').classList.remove('active');
  $('record-btn').disabled = false;
  $('skip-btn').disabled = false;

  state.pendingCapture = {
    wordId: state.current.id,
    wordText: state.current.text,
    animation: {
      gestureId: state.current.id,
      fps: TARGET_FPS,
      frames,
    },
  };

  goToReview();
}

// ---- Review ------------------------------------------------------------

function goToReview() {
  showView('processing');
  // Pequeño delay para mostrar el spinner aunque la operacion sea instantanea.
  setTimeout(() => {
    showView('review');
    renderReview();
    startPreviewAnimation();
  }, 600);
}

function renderReview() {
  const cap = state.pendingCapture;
  if (!cap) return;
  const total = cap.animation.frames.length;
  const withHands = cap.animation.frames.filter(f => f.hands && f.hands.length > 0).length;
  const detectionPct = total === 0 ? 0 : (withHands / total) * 100;

  $('stat-frames').textContent = total;
  $('stat-fps').textContent = cap.animation.fps;
  $('stat-detection').textContent = detectionPct.toFixed(0) + '%';

  const warningContainer = $('review-warning');
  warningContainer.innerHTML = '';
  if (detectionPct < 30) {
    const div = document.createElement('div');
    div.className = 'alert alert-warn';
    div.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <div>Detectamos tus manos en pocos frames (${detectionPct.toFixed(0)}%).
      Te recomendamos regrabar con mejor luz o tus manos más visibles.</div>
    `;
    warningContainer.appendChild(div);
  }
  $('submit-btn').disabled = false;
}

let previewRafId = null;
function startPreviewAnimation() {
  cancelAnimationFrame(previewRafId);
  const cap = state.pendingCapture;
  if (!cap) return;
  const canvas = $('preview-canvas');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);

  const frames = cap.animation.frames;
  const fps = cap.animation.fps;
  const startTime = performance.now();

  // Bbox normalization
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const frame of frames) {
    for (const hand of (frame.hands || [])) {
      for (const lm of hand.landmarks) {
        if (lm.x < minX) minX = lm.x;
        if (lm.y < minY) minY = lm.y;
        if (lm.x > maxX) maxX = lm.x;
        if (lm.y > maxY) maxY = lm.y;
      }
    }
  }
  let scale = 1, offX = 0, offY = 0;
  if (minX !== Infinity) {
    const w = maxX - minX, h = maxY - minY;
    const maxSide = Math.max(w, h);
    if (maxSide > 0) {
      scale = 0.8 / maxSide;
      offX = (1 - w * scale) / 2 - minX * scale;
      offY = (1 - h * scale) / 2 - minY * scale;
    }
  }

  function draw(now) {
    const elapsed = (now - startTime) / 1000;
    const idx = Math.floor(elapsed * fps) % frames.length;
    const frame = frames[idx];
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    const side = Math.min(W, H);
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, 0, W, H);

    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],
      [0,17],
    ];

    for (const hand of (frame.hands || [])) {
      const isRight = hand.handedness === 'Right';
      const color = isRight ? '#9bb6e8' : '#e0a070';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = side * 0.012;
      ctx.lineCap = 'round';

      const pts = hand.landmarks.map(lm => [
        (lm.x * scale + offX) * W,
        (lm.y * scale + offY) * H,
      ]);

      for (const [a, b] of connections) {
        if (a >= pts.length || b >= pts.length) continue;
        ctx.beginPath();
        ctx.moveTo(pts[a][0], pts[a][1]);
        ctx.lineTo(pts[b][0], pts[b][1]);
        ctx.stroke();
      }
      const dotR = side * 0.008;
      for (const [px, py] of pts) {
        ctx.beginPath();
        ctx.arc(px, py, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    previewRafId = requestAnimationFrame(draw);
  }
  previewRafId = requestAnimationFrame(draw);
}

function setupReviewHandlers() {
  $('retake-btn').addEventListener('click', () => {
    cancelAnimationFrame(previewRafId);
    state.pendingCapture = null;
    showView('capture');
    updateCaptureUI();
  });
  $('submit-btn').addEventListener('click', submitContribution);
  $('continue-btn').addEventListener('click', () => {
    state.contributedCount = loadCount();
    state.queue = sortedByPriority(loadContributedIds());
    state.current = state.queue[0] ?? null;
    if (!state.current) {
      showError(
        'Has aportado todas las palabras disponibles. Gracias por construir esto.'
      );
      return;
    }
    showView('capture');
    updateCaptureUI();
  });
}

// ---- Submit a Firestore ------------------------------------------------

function validateContribution(cap) {
  if (!cap) return 'No hay aporte para enviar.';
  if (!state.profile) return 'Perfil no cargado.';
  if (!VALID_WORD_IDS.includes(cap.wordId)) {
    return 'wordId inválido.';
  }
  if (!VALID_REGION_IDS.includes(state.profile.region)) {
    return 'Región inválida.';
  }
  if (!VALID_FLUENCY_IDS.includes(state.profile.fluency)) {
    return 'Fluencia inválida.';
  }
  const total = cap.animation.frames.length;
  if (total < 30 || total > 200) {
    return `Cantidad de frames fuera de rango: ${total}.`;
  }
  const withHands = cap.animation.frames.filter(f => f.hands && f.hands.length > 0).length;
  if (withHands / total < MIN_DETECTION_PERCENT_TO_SUBMIT) {
    return `Detectamos manos en muy pocos frames. Por favor regrabá.`;
  }
  if (cap.animation.fps !== TARGET_FPS) {
    return `FPS inválido: ${cap.animation.fps}.`;
  }
  // Validar estructura: cada frame es {hands:[...]}, cada hand tiene
  // 21 landmarks de tipo {x,y,z}. Sin nested arrays (Firestore lo prohibe).
  for (const frame of cap.animation.frames) {
    if (!frame || typeof frame !== 'object' || !Array.isArray(frame.hands)) {
      return 'Frame invalido.';
    }
    for (const hand of frame.hands) {
      if (!hand.handedness || !Array.isArray(hand.landmarks)) return 'Hand invalido.';
      if (hand.landmarks.length !== 21) {
        return `Esperabamos 21 landmarks por mano, recibimos ${hand.landmarks.length}.`;
      }
      for (const lm of hand.landmarks) {
        if (typeof lm !== 'object' ||
            typeof lm.x !== 'number' ||
            typeof lm.y !== 'number' ||
            typeof lm.z !== 'number') {
          return 'Landmark invalido.';
        }
      }
    }
  }
  return null;
}

async function submitContribution() {
  const cap = state.pendingCapture;
  const validation = validateContribution(cap);
  const errorContainer = $('submit-error');
  errorContainer.innerHTML = '';

  if (validation) {
    showInlineError(errorContainer, validation);
    return;
  }

  $('submit-btn').disabled = true;
  $('submit-btn').textContent = 'Enviando...';

  const docPayload = {
    schemaVersion: 2,
    wordId: cap.wordId,
    wordText: cap.wordText,
    contributorUuid: state.profile.uuid,
    region: state.profile.region,
    fluency: state.profile.fluency,
    appVersion: APP_VERSION,
    source: 'web',
    status: 'pending_review',
    animation: cap.animation,
    createdAt: serverTimestamp(),
  };

  // Validar tamaño total antes de enviar (defense in depth con la regla server)
  const sizeBytes = new Blob([JSON.stringify(docPayload)]).size;
  if (sizeBytes > MAX_JSON_BYTES) {
    showInlineError(
      errorContainer,
      `El aporte pesa ${(sizeBytes/1024).toFixed(0)} KB, supera el limite. Probá grabando menos tiempo o con menos manos en cuadro.`
    );
    $('submit-btn').disabled = false;
    $('submit-btn').textContent = 'Enviar aporte';
    return;
  }

  try {
    await addDoc(collection(firestore, 'contributions'), docPayload);
    bumpCount();
    addContributedId(cap.wordId);
    state.pendingCapture = null;
    cancelAnimationFrame(previewRafId);
    showView('success');
  } catch (e) {
    console.error('[submit] error:', e);
    showInlineError(
      errorContainer,
      'No se pudo enviar el aporte. ' +
      (e.code === 'permission-denied'
        ? 'Permiso denegado por el servidor (verificá las reglas de Firestore).'
        : e.message || 'Verificá tu conexion.')
    );
    $('submit-btn').disabled = false;
    $('submit-btn').textContent = 'Enviar aporte';
  }
}

function showInlineError(container, message) {
  const div = document.createElement('div');
  div.className = 'alert alert-error';
  div.innerHTML = `
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <div></div>
  `;
  div.querySelector('div').textContent = message;
  container.appendChild(div);
}

// ---- Bootstrap ---------------------------------------------------------

(async function main() {
  // 1. Verifica configuracion / inicializa Firebase
  const fbOk = await initFirebase();
  if (!fbOk) return;

  // 2. Carga perfil existente si lo hay
  state.profile = loadProfile();
  state.contributedCount = loadCount();

  // 3. Wiring de event handlers
  setupOnboarding();
  setupCaptureHandlers();
  setupReviewHandlers();

  // 4. Vista inicial: si ya tiene perfil, va directo a capture
  if (state.profile) {
    await goToCapture();
  } else {
    showView('onboarding');
  }
})();
