/* =============================================
   CONFIGURACIÓN — Edita estos valores
   ============================================= */
const CONFIG = {
  // 1. Ve a https://web3forms.com → pon tu correo → te llega un access key gratis
  accessKey: 'TU_ACCESS_KEY_AQUI',

  // 2. Tu número de WhatsApp con código de país (sin +, sin espacios)
  //    Ejemplo Ecuador: 593991234567 | México: 521234567890
  whatsappNumber: 'TU_NUMERO_AQUI',

  // 3. YouTube
  videoId: 'cchuAJOLJ3Q',   // Cherry Waves - Deftones
  startAt: 53,                // segundo donde arranca (el coro)
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
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: CONFIG.accessKey,
          subject: '😬 Daniela intentó darle al No (Halloween)',
          message: `Daniela presionó el botón No en la invitación de Halloween (intento #${escapeCount}). Pero no pudo 😄`,
          from_name: 'Invitación Web',
        }),
      }).catch(() => {}); // silencioso, no importa si falla
    }

    // Después del primer click, activar escape por hover/touch también
    if (!noActivated) {
      noActivated = true;
      btnNo.addEventListener('pointerenter', escapeNo);
      btnNo.addEventListener('touchstart', escapeNo, { passive: false });
    }

    // Calcular nueva posición dentro del viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const btnW = btnNo.offsetWidth;
    const btnH = btnNo.offsetHeight;
    const margin = 20;

    let newX, newY;
    // En las primeras escapadas, se queda dentro del arena; después vuela por toda la pantalla
    if (escapeCount <= 2) {
      const arenaRect = arena.getBoundingClientRect();
      newX = arenaRect.left + Math.random() * (arenaRect.width - btnW);
      newY = arenaRect.top + Math.random() * (arenaRect.height - btnH);
    } else {
      // Cambiar a posición fija para que vuele por toda la pantalla
      btnNo.style.position = 'fixed';
      btnNo.style.zIndex = '100';
      newX = margin + Math.random() * (vw - btnW - margin * 2);
      newY = margin + Math.random() * (vh - btnH - margin * 2);
    }

    gsap.to(btnNo, {
      left: newX,
      top: newY,
      duration: 0.2,
      ease: 'power4.out',
    });

    // El botón SÍ crece un poco con cada intento
    const newScale = Math.min(1 + escapeCount * 0.08, 1.6);
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
        scale: 0.5,
        opacity: 0.4,
        duration: 0.3,
      });
    }
    if (escapeCount >= 9) {
      gsap.to(btnNo, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        onComplete: () => { btnNo.style.pointerEvents = 'none'; },
      });
    }
  }

  // Solo click al principio — no se mueve con hover hasta que intente darle
  btnNo.addEventListener('click', escapeNo);

  // ---------- Botón SÍ ----------
  btnYes.addEventListener('click', () => {
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
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: CONFIG.accessKey,
          subject: '🎃 Daniela aceptó salir en Halloween',
          plan: plan,
          dia: day,
          veces_que_dijo_no: escapeCount,
          nota: note,
          from_name: 'Daniela (invitación web)',
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

      // Configurar link de WhatsApp
      const waText = encodeURIComponent(
        `Hola! Ya confirmé en tu invitación:\n• Plan: ${plan}\n• Día: ${day}\n• Nota: ${note}`
      );
      btnWA.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${waText}`;

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
