/* =============================================
   CONFIGURACIÓN — Edita estos valores
   ============================================= */
const CONFIG = {
  // Tu correo donde llegan las notificaciones
  email: 'candresguerrerochavez@gmail.com',

  // Tu número de WhatsApp con código de país (sin +, sin espacios)
  whatsappNumber: 'TU_NUMERO_AQUI',

  // YouTube
  videoId: 'SGj-ORoxD8U',   // Cherry Waves - Deftones (Versión oficial de estudio)
  startAt: 55,              // 0:55 - justo en el redoble y arranque del coro más icónico
};

/* =============================================
   ESTADO GLOBAL
   ============================================= */
let ytPlayer = null;
let ytReady = false;
let isMuted = false;
let escapeCount = 0;

const screens = {
  intro:    document.getElementById('screen-intro'),
  question: document.getElementById('screen-question'),
  plan:     document.getElementById('screen-plan'),
};

/* =============================================
   YOUTUBE IFRAME API
   ============================================= */
function loadYouTubeAPI() {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

// Callback global que YouTube llama cuando la API está lista
window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player('yt-wrap', {
    width: '1',
    height: '1',
    videoId: CONFIG.videoId,
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      playsinline: 1,
      rel: 0,
      start: CONFIG.startAt,
    },
    events: {
      onReady: () => { ytReady = true; },
      onStateChange: (e) => {
        // Cuando termina la canción, vuelve al coro y repite
        if (e.data === YT.PlayerState.ENDED) {
          ytPlayer.seekTo(CONFIG.startAt);
          ytPlayer.playVideo();
        }
      },
    },
  });
};

function playMusic() {
  if (!ytReady || !ytPlayer) return;
  ytPlayer.seekTo(CONFIG.startAt);
  ytPlayer.playVideo();
  ytPlayer.setVolume(60);
}

function toggleMute() {
  if (!ytPlayer) return;
  isMuted = !isMuted;
  const icon = document.getElementById('icon-vol');
  const eq = document.querySelector('.eq');

  if (isMuted) {
    ytPlayer.mute();
    icon.setAttribute('data-lucide', 'volume-x');
    eq.classList.add('paused');
  } else {
    ytPlayer.unMute();
    icon.setAttribute('data-lucide', 'volume-2');
    eq.classList.remove('paused');
  }
  lucide.createIcons();
}

/* =============================================
   TRANSICIONES ENTRE PANTALLAS (GSAP)
   ============================================= */
function goTo(fromId, toId, onComplete) {
  const from = screens[fromId];
  const to = screens[toId];

  const tl = gsap.timeline({
    onComplete: () => {
      from.classList.remove('active');
      if (onComplete) onComplete();
    },
  });

  tl.to(from, {
    opacity: 0,
    y: -30,
    duration: 0.45,
    ease: 'power2.in',
  });

  tl.add(() => {
    to.classList.add('active');
    gsap.set(to, { opacity: 0, y: 40 });
  });

  tl.to(to, {
    opacity: 1,
    y: 0,
    duration: 0.55,
    ease: 'power3.out',
  });
}

/* =============================================
   PANTALLA 1 — INTRO
   ============================================= */
function initIntro() {
  const btnPlay = document.getElementById('btn-play');
  const disc = document.getElementById('disc');
  const arm = document.getElementById('arm');

  // Animación de entrada sutil
  gsap.from('.turntable', { opacity: 0, scale: 0.9, duration: 0.8, ease: 'power3.out', delay: 0.2 });
  gsap.from('.intro__name', { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out', delay: 0.45 });
  gsap.from('.intro__line', { opacity: 0, y: 15, duration: 0.5, ease: 'power2.out', delay: 0.6 });
  gsap.from('#btn-play', { opacity: 0, y: 15, duration: 0.5, ease: 'power2.out', delay: 0.75 });

  btnPlay.addEventListener('click', () => {
    // Animación: brazo cae sobre el disco
    arm.classList.add('playing');
    setTimeout(() => disc.classList.add('spinning'), 600);

    // Empieza la música
    playMusic();

    // Transición a la pregunta
    setTimeout(() => goTo('intro', 'question'), 1200);
  });
}

/* =============================================
   PANTALLA 2 — PREGUNTA & BOTÓN NO
   ============================================= */
const escapeMessages = [
  '',
  '',
  '...no va a funcionar',
  'ese botón tiene un bug',
  'ya en serio, no se deja',
  'ya ríndete 😄',
  'anda, dale que sí',
];

function initQuestion() {
  const btnYes = document.getElementById('btn-yes');
  const btnNo = document.getElementById('btn-no');
  const arena = document.getElementById('arena');
  const msg = document.getElementById('escape-msg');

  // ---------- Botón NO se escapa ----------
  let noActivated = false; // No se mueve hasta que hagan click
  let notified = false;    // Solo notificar una vez

  function escapeNo(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    escapeCount++;

    // Notificar al correo la primera vez que intenta dar No
    if (!notified) {
      notified = true;
      fetch(`https://formsubmit.co/ajax/${CONFIG.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _subject: '😬 Daniela intentó darle al No (Halloween)',
          mensaje: `Daniela presionó el botón No en la invitación de Halloween (intento #${escapeCount}). Pero no pudo 😄`,
        }),
      }).catch(() => {}); // silencioso, no importa si falla
    }

    // Al primer intento, convertir inmediatamente a posición fija para no alterar el layout
    if (!noActivated) {
      noActivated = true;
      const initialRect = btnNo.getBoundingClientRect();
      btnNo.style.width = `${initialRect.width}px`;
      btnNo.style.position = 'fixed';
      btnNo.style.left = `${initialRect.left}px`;
      btnNo.style.top = `${initialRect.top}px`;
      btnNo.style.margin = '0';
      btnNo.style.zIndex = '999';

      btnNo.addEventListener('pointerenter', escapeNo);
      btnNo.addEventListener('touchstart', escapeNo, { passive: false });
    }

    // Dimensiones de la ventana visible
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const btnW = btnNo.offsetWidth || 100;
    const btnH = btnNo.offsetHeight || 48;

    // Márgenes seguros para que NUNCA toque los bordes ni las barras de navegación del móvil
    const padX = 20;
    const minY = Math.max(90, Math.floor(vh * 0.14)); // debajo del mini-player
    const maxY = Math.min(vh - btnH - 65, Math.floor(vh * 0.80)); // bien arriba del borde inferior

    const minX = padX;
    const maxX = Math.max(minX, vw - btnW - padX);

    // Evitar caer justo encima del botón Sí
    const yesRect = btnYes.getBoundingClientRect();
    let newX, newY;
    let attempts = 0;

    do {
      newX = minX + Math.random() * (maxX - minX);
      newY = minY + Math.random() * (maxY - minY);
      attempts++;

      const overlapsYes = !(
        newX + btnW < yesRect.left - 16 ||
        newX > yesRect.right + 16 ||
        newY + btnH < yesRect.top - 16 ||
        newY > yesRect.bottom + 16
      );

      if (!overlapsYes || attempts > 12) break;
    } while (attempts < 12);

    // Asegurar 100% que quede dentro de los límites estrictos
    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));

    gsap.to(btnNo, {
      left: newX,
      top: newY,
      duration: 0.22,
      ease: 'power3.out',
    });

    // El botón SÍ crece un poco con cada intento
    const newScale = Math.min(1 + escapeCount * 0.08, 1.5);
    gsap.to(btnYes, {
      scale: newScale,
      duration: 0.35,
      ease: 'elastic.out(1, 0.5)',
    });

    // Mostrar un mensaje sutil después del 3er intento
    if (escapeCount < escapeMessages.length) {
      msg.textContent = escapeMessages[escapeCount];
    }

    // Después de muchos intentos, el botón No se hace chiquito y desaparece
    if (escapeCount >= 6) {
      gsap.to(btnNo, {
        scale: 0.55,
        opacity: 0.45,
        duration: 0.3,
      });
    }
    if (escapeCount >= 9) {
      gsap.to(btnNo, {
        scale: 0,
        opacity: 0,
        duration: 0.25,
        onComplete: () => {
          btnNo.style.display = 'none';
        },
      });
    }
  }

  // Click inicial
  btnNo.addEventListener('click', escapeNo);

  // ---------- Botón SÍ ----------
  btnYes.addEventListener('click', () => {
    btnNo.style.display = 'none';

    // Confeti sutil (colores cálidos, no exagerado)
    const defaults = {
      spread: 55,
      ticks: 50,
      gravity: 1.2,
      decay: 0.94,
      startVelocity: 20,
      colors: ['#e08a3a', '#f5c26b', '#9e4452', '#e8e6e3'],
    };
    confetti({ ...defaults, particleCount: 25, origin: { x: 0.3, y: 0.6 } });
    confetti({ ...defaults, particleCount: 25, origin: { x: 0.7, y: 0.6 } });

    // Transición al formulario
    setTimeout(() => goTo('question', 'plan'), 700);
  });
}

/* =============================================
   PANTALLA 3 — FORMULARIO
   ============================================= */
function initForm() {
  const form = document.getElementById('the-form');
  const formView = document.getElementById('form-view');
  const successView = document.getElementById('success-view');
  const btnSend = document.getElementById('btn-send');
  const btnWA = document.getElementById('btn-wa');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const plan = 'Fiesta de Halloween';
    const day = data.get('day');
    const note = data.get('note') || '(sin nota)';

    // Disable button mientras envía
    btnSend.disabled = true;
    btnSend.querySelector('span').textContent = 'Enviando...';

    try {
      const res = await fetch(`https://formsubmit.co/ajax/${CONFIG.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _subject: '🎃 Daniela aceptó salir en Halloween',
          plan: plan,
          dia: day,
          veces_que_dijo_no: escapeCount,
          nota: note,
        }),
      });

      if (!res.ok) throw new Error('Error en el envío');

      // Éxito: mostrar confirmación
      gsap.to(formView, {
        opacity: 0,
        y: -20,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          formView.classList.add('hidden');
          successView.classList.remove('hidden');
          gsap.from(successView, { opacity: 0, y: 30, duration: 0.5, ease: 'power3.out' });
          gsap.from('.success__icon-wrap', { scale: 0, duration: 0.5, ease: 'elastic.out(1, 0.6)', delay: 0.2 });
        },
      });

      // Configurar link de WhatsApp si existe número
      if (CONFIG.whatsappNumber && CONFIG.whatsappNumber !== 'TU_NUMERO_AQUI') {
        const waText = encodeURIComponent(
          `Hola! Ya confirmé en tu invitación:\n• Plan: ${plan}\n• Día: ${day}\n• Nota: ${note}`
        );
        btnWA.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${waText}`;
      } else {
        btnWA.style.display = 'none';
      }

    } catch (err) {
      console.error(err);
      btnSend.querySelector('span').textContent = 'Error, intenta de nuevo';
      btnSend.disabled = false;

      setTimeout(() => {
        btnSend.querySelector('span').textContent = 'Listo, enviar';
      }, 3000);
    }
  });
}

/* =============================================
   INIT
   ============================================= */
function init() {
  lucide.createIcons();
  loadYouTubeAPI();
  initIntro();
  initQuestion();
  initForm();

  // Mute toggle
  document.getElementById('btn-mute').addEventListener('click', toggleMute);
}

document.addEventListener('DOMContentLoaded', init);
