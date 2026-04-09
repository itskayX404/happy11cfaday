/* ==========================================================
   BIRTHDAY WEBSITE — APP.JS
   Countdown · Gift · Main Site · Albums · Lightbox
========================================================== */

'use strict';

/* ══════════════════════════════════════════════════════════
   CONFIG dimuat dari config.js (harus di-load sebelum app.js)
   ✏️  Edit config.js untuk mengubah semua pengaturan!
══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════════════ */
let lbPhotos     = [];
let lbIndex      = 0;
let musicPlaying = false;
let twDone       = false;
let twTimer      = null;
let albumsData   = [];
let photosData   = [];


/* ══════════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════════ */
const pad = n => String(Math.floor(n)).padStart(2, '0');
const qs  = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);

function showLayer(id) {
  qsa('.layer').forEach(l => {
    l.classList.add('hidden');
    l.classList.remove('exit');
  });
  const el = qs(`#${id}`);
  el.classList.remove('hidden');
}

function exitLayer(id, cb) {
  const el = qs(`#${id}`);
  el.classList.add('exit');
  setTimeout(() => {
    el.classList.add('hidden');
    el.classList.remove('exit');
    if (cb) cb();
  }, 850);
}


/* ══════════════════════════════════════════════════════════
   1. BACKGROUND STARFIELD
══════════════════════════════════════════════════════════ */
(function initStars() {
  const canvas = qs('#bgCanvas');
  const ctx    = canvas.getContext('2d');
  let W, H, stars = [];
  // Colors switch to pink when main site is active
  const COLORS_DEFAULT = ['#9ec8f5','#b8a8e8','#f0b8cc','#cfc2f5','#fff'];
  const COLORS_PINK    = ['#ffb3c6','#ff80a0','#ffd0de','#e8607a','#fff0f5','#ffc0cb'];
  let COLORS = COLORS_DEFAULT;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkStar() {
    return {
      x: Math.random() * (W || 1920),
      y: Math.random() * (H || 1080),
      r: Math.random() * 1.15 + 0.25,
      a: Math.random() * 0.6 + 0.1,
      ad: 1,
      as: Math.random() * 0.011 + 0.003,
      c: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
  }

  function init() {
    resize();
    stars = Array.from({ length: 220 }, mkStar);
    loop();
  }

  function loop() {
    // Switch palette when pink mode is active
    const activePalette = window._pinkMode ? COLORS_PINK : COLORS_DEFAULT;
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      s.a += s.as * s.ad;
      if (s.a > 0.75 || s.a < 0.06) s.ad *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      // Gradually transition star color toward pink palette
      if (window._pinkMode && !s.pinkified) {
        s.c = activePalette[Math.floor(Math.random() * activePalette.length)];
        s.pinkified = true;
      }
      ctx.fillStyle = s.c;
      ctx.globalAlpha = s.a;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  init();
})();


/* ══════════════════════════════════════════════════════════
   2. FLOATING HEARTS
══════════════════════════════════════════════════════════ */
(function initHearts() {
  const wrap   = qs('#particleLayer');
  const HEARTS = ['♡', '♥', '❤', '🤍', '💜', '💙'];

  function spawn() {
    const el = document.createElement('div');
    el.className = 'fp-heart';
    el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
    el.style.left     = Math.random() * 100 + '%';
    el.style.fontSize = (Math.random() * .7 + .5) + 'rem';
    const dur = Math.random() * 6 + 7;
    el.style.animationDuration = dur + 's';
    wrap.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 300);
  }

  window._heartInterval = setInterval(spawn, 2000);
  for (let i = 0; i < 5; i++) setTimeout(spawn, i * 500);
})();


/* ══════════════════════════════════════════════════════════
   3. COUNTDOWN
══════════════════════════════════════════════════════════ */
function getBirthdayTarget() {
  const now   = new Date();
  const year  = now.getFullYear();
  const { month, day } = CONFIG.birthday;

  // This year's birthday at midnight
  let target = new Date(year, month - 1, day, 0, 0, 0, 0);

  // If already passed (strictly past midnight today), use next year
  if (target <= now) {
    target = new Date(year + 1, month - 1, day, 0, 0, 0, 0);
  }

  return target;
}

function isBirthdayToday() {
  const now   = new Date();
  const { month, day } = CONFIG.birthday;
  return now.getMonth() + 1 === month && now.getDate() === day;
}

function formatBirthdayLabel(target) {
  const months = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
  ];
  return `${target.getDate()} ${months[target.getMonth()]} ${target.getFullYear()}`;
}

/* ── Background countdown slideshow — foto dari media.json ── */
function initCountdownBg() {
  fetch('media.json')
    .then(r => r.json())
    .then(data => {
      const imgs = data.countdownBg;
      if (!imgs || imgs.length < 2) return;

      const layer    = qs('#layerCountdown');
      const interval = data.countdownBgInterval || 5000;

      function makeSlide(src, opacity) {
        const el = document.createElement('div');
        el.style.cssText = `
          position: absolute; inset: 0; z-index: 1;
          background: url('${src}') center/cover no-repeat;
          opacity: ${opacity};
          transition: opacity 1.2s ease;
          pointer-events: none;
        `;
        return el;
      }

      const slideA = makeSlide(imgs[0], 1);
      const slideB = makeSlide(imgs[1], 0);
      layer.prepend(slideB);
      layer.prepend(slideA);

      let current = 0;
      let showingA = true;

      setInterval(() => {
        current = (current + 1) % imgs.length;
        const next = (current + 1) % imgs.length;

        if (showingA) {
          slideB.style.backgroundImage = `url('${imgs[current]}')`;
          slideB.style.opacity = '1';
          slideA.style.opacity = '0';
          setTimeout(() => { slideA.style.backgroundImage = `url('${imgs[next]}')`; }, 1300);
        } else {
          slideA.style.backgroundImage = `url('${imgs[current]}')`;
          slideA.style.opacity = '1';
          slideB.style.opacity = '0';
          setTimeout(() => { slideB.style.backgroundImage = `url('${imgs[next]}')`; }, 1300);
        }
        showingA = !showingA;
      }, interval);
    })
    .catch(err => console.warn('countdownBg gagal load:', err));
}

function initCountdown() {
  const el = qs('#cdTargetDate');
  const target = getBirthdayTarget();
  el.textContent = formatBirthdayLabel(target);

  function tick() {
    const now  = new Date();
    const diff = target - now;

    if (diff <= 0) {
      // Time's up — show gift
      qs('#cdDays').textContent    = '00';
      qs('#cdHours').textContent   = '00';
      qs('#cdMinutes').textContent = '00';
      qs('#cdSeconds').textContent = '00';
      startGiftSequence();
      return;
    }

    const days    = diff / (1000 * 60 * 60 * 24);
    const hours   = (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60);
    const minutes = (diff % (1000 * 60 * 60)) / (1000 * 60);
    const seconds = (diff % (1000 * 60)) / 1000;

    // Flip animation on change
    animateNum('cdDays',    pad(days));
    animateNum('cdHours',   pad(hours));
    animateNum('cdMinutes', pad(minutes));
    animateNum('cdSeconds', pad(seconds));

    setTimeout(tick, 1000);
  }

  tick();
}

let lastNums = {};
function animateNum(id, val) {
  const el = qs(`#${id}`);
  if (!el) return;
  if (lastNums[id] === val) return;
  lastNums[id] = val;

  el.style.transform = 'translateY(-8px)';
  el.style.opacity   = '0';
  el.style.transition = 'transform .25s ease, opacity .25s ease';

  setTimeout(() => {
    el.textContent = val;
    el.style.transform = 'translateY(8px)';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transform = 'translateY(0)';
        el.style.opacity   = '1';
      });
    });
  }, 130);
}



/* ══════════════════════════════════════════════════════════
   3.5  DISCORD CHECKPOINT ANIMATION
   Alur: badge → avatar → rank name → XP bar mengisi
         → bar MELEDAK → stamp LEVEL UP → reward card
         → partikel burst → screen flash → masuk gift
══════════════════════════════════════════════════════════ */
function startCheckpoint() {
  showLayer('layerCheckpoint');
  runCheckpoint();
}

function runCheckpoint() {
  /* ── 0. Siapkan state ── */
  const badge    = qs('#cpBadge');
  const avatar   = qs('#cpAvatarWrap');
  const rankWrap = qs('#cpRankWrap');
  const xpWrap   = qs('#cpXpWrap');
  const xpBar    = qs('#cpXpBar');
  const xpGlow   = qs('#cpXpGlow');
  const xpTrack  = qs('.cp-xp-track');
  const xpNum    = qs('#cpXpNum');
  const reward   = qs('#cpReward');
  const burst    = qs('#cpBurst');
  const ctaWrap  = qs('#cpCtaWrap');
  const ctaBtn   = qs('#cpCtaBtn');
  const rankName = qs('#cpRankName');

  // Sync name from CONFIG
  rankName.textContent = CONFIG.name;

  /* ── PHASE 1 (0ms): badge slides in ── */
  setTimeout(() => badge.classList.add('show'), 0);

  /* ── PHASE 2 (300ms): avatar pops in ── */
  setTimeout(() => avatar.classList.add('show'), 300);

  /* ── PHASE 3 (700ms): rank name fades up ── */
  setTimeout(() => rankWrap.classList.add('show'), 700);

  /* ── PHASE 4 (1100ms): XP wrap appears, bar starts filling ── */
  setTimeout(() => {
    xpWrap.classList.add('show');
    setTimeout(() => fillXpBar(xpBar, xpGlow, xpNum), 200);
  }, 1100);

  /* ── PHASE 5 (2800ms): bar EXPLODES ── */
  setTimeout(() => {
    xpBarExplode(xpTrack, xpBar, xpGlow, burst);
  }, 2800);

  /* ── PHASE 6 (3100ms): LEVEL UP stamp slams in ── */
  setTimeout(() => {
    showLevelUpStamp();
  }, 3100);

  /* ── PHASE 7 (3500ms): reward card slides up ── */
  setTimeout(() => {
    reward.classList.add('show');
  }, 3500);

  /* ── PHASE 8 (3800ms): full particle burst ── */
  setTimeout(() => {
    fullParticleBurst(burst);
  }, 3800);

  /* ── PHASE 9 (4200ms): screen flash ── */
  setTimeout(() => {
    screenFlash();
  }, 4200);

  /* ── PHASE 10 (4600ms): "Tiup Lilin" button appears ── */
  setTimeout(() => {
    // Update button text to match cake theme
    const btnText = qs('#cpCtaBtn .cp-cta-text');
    const btnIcon = qs('#cpCtaBtn .cp-cta-icon');
    if (btnText) btnText.textContent = 'Tiup Lilin';
    if (btnIcon) btnIcon.textContent = '🎂';
    ctaWrap.classList.add('show');
  }, 4600);

  /* ── Button click → proceed to gift ── */
  ctaBtn.addEventListener('click', function onCtaClick() {
    ctaBtn.removeEventListener('click', onCtaClick);

    // Button press effect
    ctaBtn.style.transform = 'scale(.93)';
    ctaBtn.style.transition = 'transform .15s ease';

    // Mini burst from button
    const rect = ctaBtn.getBoundingClientRect();
    const bx   = rect.left + rect.width  / 2;
    const by   = rect.top  + rect.height / 2;
    miniButtonBurst(burst, bx, by);

    setTimeout(() => {
      exitLayer('layerCheckpoint', () => {
        showLayer('layerGift');
        runGiftAnimation(); // runGiftAnimation now calls showCake()
      });
    }, 350);
  });
}

/* ── Fill XP bar with counting number ── */
function fillXpBar(bar, glow, numEl) {
  const duration = 1500; // ms to fill
  const start    = performance.now();
  glow.classList.add('active');

  function step(now) {
    const elapsed = now - start;
    const pct     = Math.min(elapsed / duration, 1);
    // Easing: fast then slow near end
    const eased   = pct < .8 ? pct * 1.05 : .84 + (pct - .8) * .8;
    const val     = Math.round(Math.min(eased, 1) * 100);

    bar.style.width = val + '%';
    numEl.textContent = val + ' / 100';
    if (val >= 95) numEl.classList.add('maxed');

    if (pct < 1) requestAnimationFrame(step);
    else {
      bar.style.width = '100%';
      numEl.textContent = '100 / 100';
      numEl.classList.add('maxed');
    }
  }
  requestAnimationFrame(step);
}

/* ── XP bar shatters ── */
function xpBarExplode(track, bar, glow, burstEl) {
  // Spawn horizontal debris particles along bar
  const COLORS = ['#b8a8e8','#9060e8','#d0c0ff','#6040c0','#fff','#e8d0ff'];
  const rect   = track.getBoundingClientRect();

  for (let i = 0; i < 40; i++) {
    const p  = document.createElement('div');
    p.className = 'cp-particle';

    const size   = Math.random() * 6 + 3;
    const startX = rect.left + Math.random() * rect.width;
    const startY = rect.top  + rect.height / 2;
    const angle  = (Math.random() * 200 + 170) * (Math.PI / 180); // mostly upward
    const dist   = Math.random() * 200 + 80;
    const tx     = Math.cos(angle) * dist;
    const ty     = Math.sin(angle) * dist;
    const dur    = Math.random() * 600 + 400;
    const rot    = (Math.random() * 720 - 360) + 'deg';

    p.style.cssText = `
      left: ${startX}px; top: ${startY}px;
      width: ${size}px; height: ${size}px;
      background: ${COLORS[Math.floor(Math.random()*COLORS.length)]};
      box-shadow: 0 0 6px ${COLORS[0]};
      --ptx: translate(${tx}px, ${ty}px);
      --pr: ${rot};
      animation: cpParticle ${dur}ms ease-out forwards;
    `;
    burstEl.appendChild(p);
    setTimeout(() => p.remove(), dur + 100);
  }

  // Trigger track shatter CSS
  track.classList.add('explode');
}

/* ── LEVEL UP stamp ── */
function showLevelUpStamp() {
  const stamp  = document.createElement('div');
  stamp.className = 'cp-levelup-stamp';
  stamp.textContent = 'Level Up!';
  document.body.appendChild(stamp);

  // Remove after 1.2s
  setTimeout(() => {
    stamp.style.transition = 'opacity .4s ease, transform .4s ease';
    stamp.style.opacity    = '0';
    stamp.style.transform  = 'translate(-50%,-50%) scale(1.2) rotate(-1deg)';
    setTimeout(() => stamp.remove(), 450);
  }, 1200);
}

/* ── Full screen particle burst ── */
function fullParticleBurst(burstEl) {
  const COLORS = [
    '#ffb3c6','#b8a8e8','#9ec8f5','#f0d898',
    '#e8b8f8','#d0c0ff','#fff','#ffc0cb','#80d0ff'
  ];
  const CX = window.innerWidth  / 2;
  const CY = window.innerHeight / 2;

  for (let i = 0; i < 80; i++) {
    const p     = document.createElement('div');
    p.className = 'cp-particle';

    const size  = Math.random() * 9 + 3;
    const angle = Math.random() * Math.PI * 2;
    const dist  = Math.random() * (Math.min(CX, CY) * 1.4) + 60;
    const tx    = Math.cos(angle) * dist;
    const ty    = Math.sin(angle) * dist;
    const dur   = Math.random() * 900 + 600;
    const rot   = (Math.random() * 1080 - 540) + 'deg';
    const delay = Math.random() * 200;

    p.style.cssText = `
      left: ${CX}px; top: ${CY}px;
      width: ${size}px; height: ${size}px;
      background: ${COLORS[Math.floor(Math.random()*COLORS.length)]};
      border-radius: ${Math.random() > .5 ? '50%' : '3px'};
      --ptx: translate(${tx}px, ${ty}px);
      --pr: ${rot};
      animation: cpParticle ${dur}ms ${delay}ms ease-out both;
    `;
    burstEl.appendChild(p);
    setTimeout(() => p.remove(), dur + delay + 200);
  }
}


/* ── Mini burst from button click ── */
function miniButtonBurst(burstEl, cx, cy) {
  const COLORS = ['#d0c0ff','#b8a8e8','#fff','#9060e8','#e8d0ff'];
  for (let i = 0; i < 28; i++) {
    const p     = document.createElement('div');
    p.className = 'cp-particle';
    const size  = Math.random() * 7 + 3;
    const angle = Math.random() * Math.PI * 2;
    const dist  = Math.random() * 100 + 40;
    const tx    = Math.cos(angle) * dist;
    const ty    = Math.sin(angle) * dist;
    const dur   = Math.random() * 400 + 300;
    const rot   = (Math.random() * 720 - 360) + 'deg';
    p.style.cssText = `
      left: ${cx}px; top: ${cy}px;
      width: ${size}px; height: ${size}px;
      background: ${COLORS[Math.floor(Math.random()*COLORS.length)]};
      --ptx: translate(${tx}px, ${ty}px);
      --pr: ${rot};
      animation: cpParticle ${dur}ms ease-out both;
    `;
    burstEl.appendChild(p);
    setTimeout(() => p.remove(), dur + 100);
  }
}
/* ── White screen flash ── */
function screenFlash() {
  const flash = document.createElement('div');
  flash.className = 'cp-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 600);
}

/* ══════════════════════════════════════════════════════════
   4. BIRTHDAY CAKE 🎂
   Alur: kue muncul → semua lilin menyala & bergoyang
         → user klik lilin satu per satu atau klik kue
         → tiap lilin: animasi mati + asap mengepul
         → semua mati → confetti + pesan → masuk website
══════════════════════════════════════════════════════════ */
let candlesBlown    = 0;
let totalCandles    = 0;
let candleAnimating = false;

function startGiftSequence() {
  if (CONFIG.prankMode) {
    exitLayer('layerCountdown', () => {
      showLayer('layerPrank');
      initPrank();
    });
  } else {
    exitLayer('layerCountdown', () => {
      startCheckpoint();
    });
  }
}

function runGiftAnimation() {
  // ── Renamed: now this is the cake scene ──
  showCake();
}

function showCake() {
  totalCandles = CONFIG.candleCount || 5;
  candlesBlown = 0;

  const scene    = qs('#cakeScene');
  const blownMsg = qs('#cakeBlownMsg');
  const inst     = qs('#cakeInstruction');

  blownMsg.textContent = CONFIG.cakeBlownText;

  // Show only the correct number of candles
  const allCandles = qsa('.cake-candle');
  allCandles.forEach((c, i) => {
    c.style.display = i < totalCandles ? 'flex' : 'none';
  });

  // Click on the whole cake → blow one candle at a time
  scene.addEventListener('click', onCakeClick);
}

let audioUnlocked = false;

function onCakeClick() {
  if (candleAnimating) return;

  // Unlock audio di klik pertama — wajib dilakukan dalam user gesture langsung
  if (!audioUnlocked) {
    audioUnlocked = true;
    const audio = qs('#bgAudio');
    if (audio) {
      // Play lalu langsung pause — ini "unlocks" audio context di browser
      audio.volume = 0;
      audio.play().then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0;
      }).catch(() => {});
    }
  }

  // Find first unblown candle
  const allCandles = Array.from(qsa('.cake-candle'));
  const active     = allCandles.filter(c => c.style.display !== 'none');
  const nextCandle = active.find((c, i) => {
    const flameWrap = c.querySelector('.candle-flame-wrap');
    return !flameWrap.classList.contains('out');
  });

  if (!nextCandle) return;

  candleAnimating = true;
  blowCandle(nextCandle, () => {
    candleAnimating = false;
    candlesBlown++;

    // 🎵 Auto-play musik saat tiupan ke-4
    const musicTriggerAt = Math.min(1, totalCandles);
    if (candlesBlown === musicTriggerAt) {
      playMusicGlobal(3000);
    }

    if (candlesBlown >= totalCandles) {
      onAllCandlesBlown();
    }
  });
}

function blowCandle(candleEl, cb) {
  const flameWrap = candleEl.querySelector('.candle-flame-wrap');
  const idx       = candleEl.dataset.i;
  const smokeEl   = qs(`#smoke${idx}`);

  // 1. Wind blast effect
  triggerWindBlast(candleEl);

  // 2. Flame flicker then out
  flameWrap.style.transition = 'opacity .15s ease';
  flameWrap.style.opacity    = '0.3';

  setTimeout(() => {
    flameWrap.style.opacity = '0.7';
    setTimeout(() => {
      // Flame bends sideways (wind pushing it)
      const flame = candleEl.querySelector('.candle-flame');
      if (flame) {
        flame.style.transition = 'transform .1s ease';
        flame.style.transform  = 'rotate(35deg) scaleX(.5)';
      }
      setTimeout(() => {
        flameWrap.classList.add('out');
        flameWrap.style.opacity = '';

        // Smoke puff
        if (smokeEl) {
          smokeEl.classList.add('puffing');
          setTimeout(() => smokeEl.classList.remove('puffing'), 1600);
        }

        // Candle wobble from the puff
        candleEl.style.transition = 'transform .12s ease';
        candleEl.style.transform  = 'rotate(-10deg)';
        setTimeout(() => {
          candleEl.style.transform = 'rotate(5deg)';
          setTimeout(() => {
            candleEl.style.transform = '';
            setTimeout(cb, 80);
          }, 100);
        }, 120);
      }, 80);
    }, 100);
  }, 60);
}

/* Wind blast — lines shoot across from left to right */
function triggerWindBlast(targetCandleEl) {
  const windWrap = qs('#cakeWind');
  windWrap.classList.add('active');

  // Get candle position for aiming wind lines
  const candleRect = targetCandleEl.getBoundingClientRect();
  const cx = candleRect.left + candleRect.width / 2;
  const cy = candleRect.top + candleRect.height * 0.15; // aim at flame

  const lineCount = 7;
  for (let i = 0; i < lineCount; i++) {
    const line = document.createElement('div');
    line.className = 'wind-line';

    const spread  = (i - lineCount/2) * 12;
    const width   = 60 + Math.random() * 80;
    const yOffset = spread + (Math.random() * 8 - 4);
    const delay   = i * 25;
    const dur     = 280 + Math.random() * 120;

    line.style.cssText = `
      left: ${cx - width - 10}px;
      top:  ${cy + yOffset}px;
      width: ${width}px;
      height: ${1 + Math.random() * 2}px;
      opacity: 0;
      animation: windBlast ${dur}ms ${delay}ms ease-out forwards;
    `;
    windWrap.appendChild(line);
    setTimeout(() => line.remove(), dur + delay + 50);
  }

  // Clean up active class
  setTimeout(() => windWrap.classList.remove('active'), 500);
}

function onAllCandlesBlown() {
  const inst     = qs('#cakeInstruction');
  const bgGlow   = qs('#cakeBgGlow');
  const tblGlow  = qs('.cake-table-glow');
  const blownMsg = qs('#cakeBlownMsg');
  const scene    = qs('#cakeScene');

  // Remove click listener
  scene.removeEventListener('click', onCakeClick);

  // Fade instruction
  inst.classList.add('hidden-fade');

  // Dim ambient glow (all lights out!)
  setTimeout(() => {
    if (bgGlow)  bgGlow.classList.add('blown');
    if (tblGlow) tblGlow.classList.add('blown');
  }, 150);

  // 👏 CLAP ANIMATION!
  setTimeout(() => triggerClapAnimation(), 300);

  // Confetti burst
  setTimeout(() => burstCakeConfetti(), 600);

  // Show message
  setTimeout(() => blownMsg.classList.add('show'), 1400);

  // Enter main site (atau prank kalau prankMode aktif)
  setTimeout(() => {
    exitLayer('layerGift', () => {
      if (CONFIG.prankMode) {
        showLayer('layerPrank');
        initPrank();
      } else {
        showLayer('layerMain');
        initMainSite();
      }
    });
  }, 3800);
}

/* 👏 Clap animation — emojis fly up from bottom + text pops */
function triggerClapAnimation() {
  const overlay  = qs('#cakeClapOverlay');
  const clapText = qs('#clapText');
  overlay.classList.add('active');

  const W = window.innerWidth;
  const H = window.innerHeight;

  // Animate each clap emoji
  const emojis = qsa('.clap-emoji');
  emojis.forEach((el, i) => {
    const startX = 10 + (i / (emojis.length - 1)) * 80; // spread across width
    const endX   = (Math.random() * 30 - 15);            // drift left/right
    const endY   = -(120 + Math.random() * 80);          // float up
    const rot1   = (Math.random() * 20 - 10) + 'deg';
    const rot2   = (Math.random() * 30 - 15) + 'deg';
    const delay  = i * 80 + Math.random() * 60;
    const dur    = 1000 + Math.random() * 400;
    const size   = 1.8 + Math.random() * 0.8;

    el.style.cssText = `
      left: ${startX}vw;
      bottom: 5vh;
      font-size: ${size}rem;
      --cx: ${endX}px;
      --cy: ${endY}px;
      --cr:  ${rot1};
      --cr2: ${rot2};
      animation: clapFloat ${dur}ms ${delay}ms ease-out both;
    `;

    // Repeat clap waves — 3 waves total
    let wave = 0;
    const maxWaves = 3;
    function nextWave() {
      wave++;
      if (wave >= maxWaves) return;
      const newDelay = delay + wave * 420;
      setTimeout(() => {
        el.style.animation = 'none';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.animation = `clapFloat ${dur}ms ease-out both`;
          });
        });
      }, newDelay);
    }
    setTimeout(nextWave, delay + dur + 50);
  });

  // Text pop
  setTimeout(() => {
    clapText.style.animation = 'clapTextPop 2.2s var(--spring) both';
  }, 200);

  // Hide overlay before transition
  setTimeout(() => {
    overlay.classList.remove('active');
  }, 3000);
}


function burstCakeConfetti() {
  const wrap   = qs('#cakeConfetti');
  const COLORS = [
    '#ffb3c6','#f08090','#ffd0e8',
    '#c8a8e8','#b0d8f8','#f8d898',
    '#c8f0d0','#f8c8a8','#ffffff'
  ];

  for (let i = 0; i < 90; i++) {
    const el    = document.createElement('div');
    el.className = 'cake-conf-bit';

    const color  = COLORS[Math.floor(Math.random() * COLORS.length)];
    const size   = Math.random() * 9 + 5;
    const startX = 30 + Math.random() * 40; // % from left, near center
    const startY = 40 + Math.random() * 20; // % from top, near cake
    const angle  = (Math.random() * 360) * (Math.PI / 180);
    const dist   = Math.random() * 55 + 25; // % of viewport
    const tx     = `translate(${Math.cos(angle) * dist}vw, ${Math.sin(angle) * dist}vh)`;
    const dur    = Math.random() * 1000 + 800;
    const shape  = Math.random() > .4 ? '50%' : (Math.random() > .5 ? '2px' : '0');

    el.style.cssText = `
      left: ${startX}vw; top: ${startY}vh;
      width: ${size}px; height: ${size}px;
      background: ${color};
      border-radius: ${shape};
      --cfx: ${tx} rotate(${Math.random()*720}deg);
      animation: cakeConfFall ${dur}ms ${Math.random() * 400}ms ease-out both;
      box-shadow: 0 0 4px ${color};
    `;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), dur + 500);
  }
}



/* ══════════════════════════════════════════════════════════
   LETTER SYSTEM 💌
   Pendekatan: envelope & paper SEPENUHNYA terpisah.
   Paper tersembunyi di belakang envelope (z-index lebih rendah).
   JS menggerakkan paper keluar lalu ke tengah via transform.
══════════════════════════════════════════════════════════ */
function initLetterSystem() {
  const btn       = qs('#letterBtn');
  const toast     = qs('#letterToast');
  const overlay   = qs('#letterOverlay');
  const env       = qs('#loEnv');
  const paperCard = qs('#loPaperCard');
  const letterBox = qs('#loLetterBox');
  const loClose   = qs('#loClose');
  const mainEl    = qs('#layerMain');
  if (!btn || !mainEl) return;

  let letterUnlocked = false;
  let toastTimer     = null;

  setTimeout(() => btn.classList.add('visible'), 900);

  /* Scroll watcher */
  mainEl.addEventListener('scroll', () => {
    if (letterUnlocked) return;
    const { scrollTop, scrollHeight, clientHeight } = mainEl;
    if (scrollTop + clientHeight >= scrollHeight - 80) {
      letterUnlocked = true;
      btn.classList.add('unlocked');
      btn.style.transform = 'scale(1.15)';
      setTimeout(() => { btn.style.transform = ''; }, 220);
      clearTimeout(toastTimer);
      const orig = toast.innerHTML;
      toast.innerHTML = '<span class="letter-toast-icon">💌</span><p>Ada surat untukmu ✦</p>';
      toast.classList.add('show');
      toastTimer = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { toast.innerHTML = orig; }, 350);
      }, 2800);
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    if (!letterUnlocked) {
      clearTimeout(toastTimer);
      toast.classList.add('show');
      btn.style.transform = 'translateY(-2px) rotate(-4deg)';
      setTimeout(() => { btn.style.transform = 'translateY(-2px) rotate(3deg)'; }, 110);
      setTimeout(() => { btn.style.transform = ''; }, 230);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
      return;
    }
    openLetter();
  });

  /* ══ OPEN LETTER ══
     Alur:
     1. Overlay open, envelope muncul di tengah
     2. Paper: opacity 0, posisi SAMA dengan envelope (tersembunyi di belakangnya)
     3. Flap buka
     4. Paper: pindah ke atas envelope (masih z-index rendah, tapi kelihatan seolah keluar)
     5. Paper: turun ke tengah layar, envelope dismiss
     6. Paper jadi tappable → letter box muncul
  ═══════════════════ */
  function openLetter() {
    // ── Reset keras: matikan transition dulu biar posisi langsung loncat ──
    env.classList.remove('appeared','flap-open','dismissed');
    letterBox.classList.remove('show');
    loClose.classList.remove('visible');
    paperCard.classList.remove('ready', 'unfolding');
    if (paperCard._tapHandler) {
      paperCard.removeEventListener('click', paperCard._tapHandler);
      paperCard._tapHandler = null;
    }
    paperCard.onclick = null;

    // Matikan transition sementara agar reset posisi tidak ter-animate
    paperCard.style.cssText = `
      opacity: 0;
      pointer-events: none;
      transition: none;
      transform: translate(-50%, -50%);
      z-index: 2;
    `;
    // Force reflow — paksa browser flush perubahan posisi di atas
    void paperCard.offsetWidth;

    // Reset pilihan balikan
    if (window._resetLetterChoice) window._resetLetterChoice();

    overlay.classList.add('open');

    // Step 1 — Envelope muncul
    setTimeout(() => env.classList.add('appeared'), 150);

    // Step 2 — Flap buka
    setTimeout(() => env.classList.add('flap-open'), 880);

    // Step 3 — Paper muncul dari dalam envelope (posisi di tengah, z rendah)
    // Paper berada DI BELAKANG envelope body karena z-index:2 < z-index:3
    // Tapi karena sudah opacity 0 sebelumnya, ini aman
    setTimeout(() => {
      // Tampilkan paper — tapi masih di tengah (tertutup envelope)
      paperCard.style.cssText = `
        opacity: 1;
        pointer-events: none;
        transform: translate(-50%, -50%);
        transition: transform 1s cubic-bezier(.22,1.4,.36,1),
                    opacity .3s ease;
        z-index: 2;
      `;
    }, 900); // muncul saat flap mulai buka — masih tertutup envelope

    // Step 4 — Paper naik ke atas (keluar dari atas envelope)
    // Naik ~(envelope height/2 + paper height/2 + sedikit gap)
    setTimeout(() => {
      paperCard.style.transform = 'translate(-50%, calc(-50% - 175px))';
    }, 1600); // saat flap sudah terbuka penuh

    // Step 5 — Paper turun ke tengah, envelope dismiss
    setTimeout(() => {
      // Paper turun ke tengah viewport
      paperCard.style.transform = 'translate(-50%, -50%)';
      paperCard.style.zIndex    = '5'; // sekarang di atas envelope
      // Envelope mundur
      env.classList.add('dismissed');
    }, 2600);

    // Step 6 — Paper jadi tappable
    setTimeout(() => {
      paperCard.classList.add('ready');
      // Pastikan pointer-events aktif via inline style juga
      paperCard.style.pointerEvents = 'all';

      function onPaperTap(e) {
        e.stopPropagation();
        paperCard.removeEventListener('click', onPaperTap);
        paperCard._tapHandler = null;
        paperCard.onclick = null;

        // Animasi unfold: kertas "membuka" sebelum letter box muncul
        paperCard.classList.add('unfolding');
        paperCard.style.pointerEvents = 'none';

        setTimeout(() => {
          paperCard.style.opacity = '0';
          paperCard.style.transition = 'opacity .3s ease';
          letterBox.classList.add('show');
          loClose.classList.add('visible');
        }, 480);
      }

      paperCard._tapHandler = onPaperTap;
      paperCard.addEventListener('click', onPaperTap);
    }, 3300);
  }

  /* ══ CLOSE ══ */
  function closeLetter() {
    overlay.classList.remove('open');
    setTimeout(() => {
      env.classList.remove('appeared','flap-open','dismissed');
      letterBox.classList.remove('show');
      paperCard.classList.remove('ready', 'unfolding');
      paperCard.style.cssText = 'opacity:0; pointer-events:none; transition:none;';
      if (paperCard._tapHandler) {
        paperCard.removeEventListener('click', paperCard._tapHandler);
        paperCard._tapHandler = null;
      }
      paperCard.onclick = null;
      loClose.classList.remove('visible');

      // Reset pilihan balikan
      if (window._resetLetterChoice) window._resetLetterChoice();
    }, 430);
  }

  loClose.addEventListener('click', closeLetter);
  // HAPUS backdrop click — selalu bikin conflict dengan paper/envelope click
  // Close HANYA via tombol X dan Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeLetter();
  });

  /* ══ PILIHAN BALIKAN — "mau / engga" ══ */
  const btnYes     = qs('#loBtnYes');
  const btnNo      = qs('#loBtnNo');
  const choiceResult = qs('#loChoiceResult');
  const choiceWrap = qs('#loChoiceWrap');

  // State — direset tiap openLetter()
  let noClickCount = 0;
  let choiceDone   = false;

  const noMessages = [
    'beneran engga? 🥺',
    'yakin banget nih?',
    'coba pikir lagi deh...',
    'masa sih engga...',
    'kok tega sih 😢',
  ];
  const noLabels = ['engga', 'engg..', 'eng.', 'e..', '...'];

  /* ── Fungsi reset choice (dipanggil tiap openLetter & closeLetter) ── */
  function resetChoice() {
    noClickCount = 0;
    choiceDone   = false;
    if (choiceWrap) {
      choiceWrap.style.cssText = '';
      choiceWrap.style.display = '';
    }
    if (btnNo) {
      btnNo.textContent = CONFIG.suratChoiceNo || 'engga';
      btnNo.classList.remove('fleeing');
      btnNo.style.cssText = '';
    }
    if (btnYes) btnYes.style.cssText = '';
    if (choiceResult) {
      choiceResult.textContent = '';
      choiceResult.classList.remove('show');
    }
  }

  /* ── Expose reset agar closeLetter bisa panggil ── */
  window._resetLetterChoice = resetChoice;

  /* ── "engga" kabur saat mouse/touch mendekati ── */
  function fleeFromPointer(clientX, clientY) {
    if (choiceDone || noClickCount >= 5) return;

    const box  = btnNo.getBoundingClientRect();
    const wrap = btnNo.parentElement.getBoundingClientRect();

    const btnCX = box.left + box.width  / 2;
    const btnCY = box.top  + box.height / 2;
    const dx = btnCX - clientX;
    const dy = btnCY - clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 80) return;

    const angle = Math.atan2(dy, dx);
    const flee  = 90 + Math.random() * 30;
    const newX  = box.left + Math.cos(angle) * flee - wrap.left;
    const newY  = box.top  + Math.sin(angle) * flee - wrap.top;
    const maxX  = wrap.width  - box.width;
    const maxY  = wrap.height - box.height + 60;

    btnNo.classList.add('fleeing');
    btnNo.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
    btnNo.style.top  = Math.max(0, Math.min(newY, maxY)) + 'px';
  }

  const lbEl = qs('#loLetterBox');
  lbEl.addEventListener('mousemove', e => fleeFromPointer(e.clientX, e.clientY));
  lbEl.addEventListener('touchmove', e => {
    fleeFromPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  /* ── Klik "engga" ── */
  btnNo.addEventListener('click', () => {
    if (choiceDone) return;
    noClickCount++;

    if (noClickCount >= 5) {
      // Menyerah 😈
      btnNo.textContent = 'mau juga ♡';
      btnNo.classList.remove('fleeing');
      btnNo.style.cssText = '';
      btnNo.style.background = 'linear-gradient(135deg, #f9d0e8, #f0b8d8)';
      btnNo.style.color = '#7a2060';
      btnNo.style.transform = 'rotate(1.2deg)';
      setTimeout(() => triggerYes(), 400);
      return;
    }

    btnNo.textContent = noLabels[Math.min(noClickCount, noLabels.length - 1)];
    btnNo.style.fontSize = (1 - noClickCount * 0.1) + 'rem';
    btnNo.style.opacity  = (1 - noClickCount * 0.12).toString();

    const wrap = btnNo.parentElement.getBoundingClientRect();
    const bw   = btnNo.offsetWidth;
    const bh   = btnNo.offsetHeight;
    btnNo.classList.add('fleeing');
    btnNo.style.left = (Math.random() * (wrap.width  - bw)) + 'px';
    btnNo.style.top  = (Math.random() * (wrap.height - bh + 40)) + 'px';

    choiceResult.textContent = noMessages[noClickCount - 1] || '';
    choiceResult.classList.add('show');
    setTimeout(() => choiceResult.classList.remove('show'), 1800);
  });

  /* ── Klik "mau" ── */
  btnYes.addEventListener('click', triggerYes);

  function triggerYes() {
    if (choiceDone) return;
    choiceDone = true;

    choiceWrap.style.transition  = 'opacity .3s ease';
    choiceWrap.style.opacity     = '0';
    choiceWrap.style.pointerEvents = 'none';

    setTimeout(() => {
      choiceWrap.style.display = 'none';
      choiceResult.textContent = CONFIG.suratChoiceResult || 'yayy!! aku seneng banget 🥹♡';
      choiceResult.classList.add('show');

      // Redirect ke WhatsApp setelah 1.2 detik
      setTimeout(() => {
        const waNumber = CONFIG.waNumber || '';          // nomor dari config.js
        const waText   = encodeURIComponent(CONFIG.waText || 'iyaaa aku mau');
        const waUrl    = waNumber
          ? `https://wa.me/${waNumber}?text=${waText}`
          : `https://wa.me/?text=${waText}`;
        window.open(waUrl, '_blank');
      }, 1200);
    }, 320);
  }
}

/* ══════════════════════════════════════════════════════════
   SCRATCH CARD — FOTO FAV
══════════════════════════════════════════════════════════ */

// Foto fav diambil dari media.json (diload saat initMainSite)
// FAV_PHOTOS akan diisi setelah mediaData loaded
let FAV_PHOTOS = [];

const COVER_ICONS = ['🌸','💫','✨','🎀','💕','🌙'];
const SCRATCH_THRESHOLD = 0.55; // 55% scratched = revealed
let scratchRevealedCount = 0;

function initScratchCards() {
  const grid = qs('#scratchGrid');
  if (!grid) return;

  // Prioritas: media.json → config.js fallback
  FAV_PHOTOS = (mediaData && mediaData.favPhotos) ? mediaData.favPhotos : (CONFIG.favPhotos || []);

  FAV_PHOTOS.forEach((photo, idx) => {
    const card = createScratchCard(photo, idx);
    grid.appendChild(card);
  });

  // Add "all done" message after grid
  const done = document.createElement('div');
  done.className = 'scratch-all-done';
  done.id = 'scratchAllDone';
  done.innerHTML = '<p>Terima kasih sudah mau buka semuanya satu per satu 💗</p>';
  grid.parentElement.insertBefore(done, grid.nextSibling);
}

function createScratchCard(photo, idx) {
  const card = document.createElement('div');
  card.className = 'scratch-card';

  // Photo underneath
  const img = document.createElement('img');
  img.className = 'sc-photo';
  img.src = photo.src;
  img.alt = photo.caption;
  img.draggable = false;
  card.appendChild(img);

  // Caption bar
  const cap = document.createElement('div');
  cap.className = 'sc-caption-bar';
  cap.textContent = photo.caption;
  card.appendChild(cap);

  // Sparkle container
  const sparkleWrap = document.createElement('div');
  sparkleWrap.className = 'sc-sparkle';
  card.appendChild(sparkleWrap);

  // Progress ring SVG
  const ringHTML = `
    <svg class="sc-progress-ring" viewBox="0 0 28 28" id="ring${idx}">
      <circle class="sc-ring-track" cx="14" cy="14" r="11"/>
      <circle class="sc-ring-fill" cx="14" cy="14" r="11" id="ringFill${idx}"/>
    </svg>`;
  card.insertAdjacentHTML('beforeend', ringHTML);

  // Canvas for scratching
  const canvas = document.createElement('canvas');
  canvas.className = 'sc-canvas';
  card.appendChild(canvas);

  // Cover design
  const cover = document.createElement('div');
  cover.className = 'sc-cover';
  cover.innerHTML = `
    <span class="sc-cover-icon">${COVER_ICONS[idx % COVER_ICONS.length]}</span>
    <span class="sc-cover-label">Foto Fav #${idx + 1}</span>
    <span class="sc-cover-hint">Geser untuk reveal</span>
  `;
  card.appendChild(cover);

  // Init canvas scratch
  initCardCanvas(card, canvas, cover, sparkleWrap, idx);

  return card;
}

function initCardCanvas(card, canvas, cover, sparkleWrap, idx) {
  let isDrawing   = false;
  let revealed    = false;
  let canvasReady = false;
  let ctx         = null;
  const ringFill  = qs(`#ringFill${idx}`);
  const ring      = qs(`#ring${idx}`);
  const CIRCUM    = 69.1;

  /* ── Setup canvas ONLY when card has real dimensions ──
     Root bug: setupCanvas was called at init time when card
     was not yet rendered/visible, giving 0x0 size.
     Fix: defer until first interaction OR IntersectionObserver. */
  function setupCanvas() {
    const rect = card.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return false; // not ready yet

    const scale = window.devicePixelRatio || 1;
    canvas.width        = rect.width  * scale;
    canvas.height       = rect.height * scale;
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';

    ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset before scale
    ctx.scale(scale, scale);

    // Paint the opaque scratch layer
    ctx.fillStyle = '#3a1840';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Brush: erase mode
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineJoin  = 'round';
    ctx.lineCap   = 'round';
    ctx.lineWidth = 46;

    canvasReady = true;
    return true;
  }

  /* Setup as soon as card scrolls into view */
  const mainEl = qs('#layerMain');
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !canvasReady) {
      setTimeout(() => setupCanvas(), 100); // tiny delay for layout
    }
  }, { threshold: 0.1, root: mainEl });
  obs.observe(card);

  function ensureReady() {
    if (!canvasReady) setupCanvas();
    return canvasReady;
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t    = e.touches ? e.touches[0] : e;
    return {
      x: t.clientX - rect.left,
      y: t.clientY - rect.top,
    };
  }

  function scratchAt(pos) {
    if (!ensureReady()) return;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 23, 0, Math.PI * 2);
    ctx.fill();
    checkProgress();
  }

  let lastPos = null;
  function scratchLine(pos) {
    if (!ensureReady()) return;
    if (lastPos) {
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x,  pos.y);
      ctx.stroke();
    }
    scratchAt(pos);
    lastPos = pos;
  }

  function checkProgress() {
    if (revealed || !ctx) return;
    // Sample every 16th pixel (alpha channel) for perf
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0, total = 0;
    for (let i = 3; i < imgData.data.length; i += 16) {
      total++;
      if (imgData.data[i] < 128) transparent++;
    }
    const pct = transparent / total;

    if (ringFill) {
      const offset = CIRCUM * (1 - Math.min(pct / SCRATCH_THRESHOLD, 1));
      ringFill.style.strokeDashoffset = offset;
    }

    if (pct >= SCRATCH_THRESHOLD) {
      revealed = true;
      fullyReveal();
    }
  }

  function fullyReveal() {
    if (!ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.transition = 'opacity .3s ease';
    canvas.style.opacity    = '0';
    cover.classList.add('scratched-through');
    card.classList.add('fully-revealed');
    if (ring) ring.classList.add('done');
    burstScratchSparkles(sparkleWrap, card);

    scratchRevealedCount++;
    if (scratchRevealedCount >= FAV_PHOTOS.length) {
      setTimeout(() => {
        const done = qs('#scratchAllDone');
        if (done) done.classList.add('show');
      }, 600);
    }
  }

  /* ── Events ── */
  canvas.addEventListener('mousedown', e => {
    e.preventDefault();
    isDrawing = true; lastPos = null;
    scratchAt(getPos(e));
  });
  canvas.addEventListener('mousemove', e => {
    if (!isDrawing) return;
    scratchLine(getPos(e));
  });
  window.addEventListener('mouseup', () => { isDrawing = false; lastPos = null; });
  canvas.addEventListener('mouseleave', () => { lastPos = null; });

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    isDrawing = true; lastPos = null;
    scratchAt(getPos(e));
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!isDrawing) return;
    scratchLine(getPos(e));
  }, { passive: false });
  canvas.addEventListener('touchend',   () => { isDrawing = false; lastPos = null; });
  canvas.addEventListener('touchcancel',() => { isDrawing = false; lastPos = null; });

  /* Re-setup on resize (only if not yet revealed) */
  window.addEventListener('resize', () => {
    if (!revealed) { canvasReady = false; setupCanvas(); }
  });
}

function burstScratchSparkles(wrap, card) {
  const rect   = card.getBoundingClientRect();
  const COLORS = ['#ffb3c6','#e8607a','#ffd0e8','#c8a8e8','#fff','#f8d898'];

  for (let i = 0; i < 22; i++) {
    const s   = document.createElement('div');
    s.className = 'sc-spark-bit';

    const size  = Math.random() * 7 + 3;
    const angle = Math.random() * Math.PI * 2;
    const dist  = Math.random() * 80 + 30;
    const tx    = `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px))`;
    const dur   = Math.random() * 500 + 400;
    const col   = COLORS[Math.floor(Math.random() * COLORS.length)];

    s.style.cssText = `
      left: 50%; top: 45%;
      width: ${size}px; height: ${size}px;
      background: ${col};
      box-shadow: 0 0 6px ${col};
      --stx: ${tx};
      animation: scSparkFly ${dur}ms ease-out both;
    `;
    wrap.appendChild(s);
    setTimeout(() => s.remove(), dur + 100);
  }
}


/* ══════════════════════════════════════════════════════════
   5. MAIN SITE INIT
══════════════════════════════════════════════════════════ */
function initMainSite() {
  applyConfig();
  activatePinkWorld();
  initScrollReveal();
  initScrollProgress();
  initSectionLoaders();
  initTypewriter();
  loadAlbums();          // loadAlbums akan panggil initScratchCards setelah selesai
  initLetterSystem();
  qs('#musicPlayer').classList.add('visible');
  setTimeout(dropPolaroids, 800);
}

/* ══════════════════════════════════════════════════════════
   APPLY CONFIG — inject semua konten dari config.js ke DOM
══════════════════════════════════════════════════════════ */
function applyConfig() {

  // ── Nama (semua elemen dengan class atau id nama) ──
  qsa('.hero-name, .closing-name, .cd-for em, #cpRankName').forEach(el => {
    if (el.tagName === 'EM') el.textContent = CONFIG.name;
    else el.textContent = CONFIG.name;
  });

  // ── Hero ──
  const heroDate = qs('.hero-date');
  if (heroDate) heroDate.childNodes[0].textContent = CONFIG.heroDate || heroDate.textContent;

  const heroSub = qs('.hero-sub');
  if (heroSub && CONFIG.heroSub) heroSub.innerHTML = CONFIG.heroSub.replace(/\n/g, '<br/>');

  // ── Polaroid — diisi oleh applyPolaroids() setelah media.json loaded ──
  // (dipanggil lagi dari loadAlbums setelah fetch selesai)
  applyPolaroids();

  // ── Pesan lanjutan (setelah typewriter) ──
  const mcAfter = qs('#mcAfter');
  if (mcAfter && CONFIG.pesanLanjutan) {
    // Bersihkan isi lama, pertahankan .mc-sign
    const sign = mcAfter.querySelector('.mc-sign');
    mcAfter.innerHTML = '';
    CONFIG.pesanLanjutan.forEach(txt => {
      const p = document.createElement('p');
      p.textContent = txt;
      mcAfter.appendChild(p);
    });
    const signEl = document.createElement('p');
    signEl.className = 'mc-sign';
    signEl.textContent = CONFIG.pesanLanjutanSign || (sign ? sign.textContent : '');
    mcAfter.appendChild(signEl);
  }

  // ── Kenangan ──
  if (CONFIG.kenangan && CONFIG.kenangan.length) {
    const wrap = qs('.memories-wrap');
    if (wrap) {
      wrap.innerHTML = '';
      CONFIG.kenangan.forEach((k, i) => {
        const item = document.createElement('div');
        item.className = 'memory-item reveal-up';
        item.dataset.delay = (i * 100).toString();
        item.innerHTML = `
          <div class="mi-icon">${k.icon || '✨'}</div>
          <div class="mi-content">
            <span class="mi-tag">${k.tag || ''}</span>
            <h3>${k.title || ''}</h3>
            <p>${k.text || ''}</p>
          </div>
          <div class="mi-num">${String(i + 1).padStart(2, '0')}</div>
        `;
        wrap.appendChild(item);
      });
    }
  }

  // ── Closing section ──
  const closingMsg = qs('.closing-msg');
  if (closingMsg && CONFIG.closingMsg)
    closingMsg.innerHTML = CONFIG.closingMsg.replace(/\n/g, '<br/>');

  const closingSub = qs('.closing-sub');
  if (closingSub && CONFIG.closingSub)
    closingSub.innerHTML = CONFIG.closingSub.replace(/\n/g, '<br/>');

  const closingFrom = qs('.closing-from');
  if (closingFrom && CONFIG.closingFrom)
    closingFrom.textContent = CONFIG.closingFrom;

  // ── Surat ──
  const loGreeting = qs('.lo-greeting');
  if (loGreeting && CONFIG.suratGreeting)
    loGreeting.textContent = CONFIG.suratGreeting;

  const loBody = qs('.lo-body');
  if (loBody && CONFIG.suratIsi)
    loBody.innerHTML = CONFIG.suratIsi.replace(/\n/g, '<br/>');

  const loSign = qs('.lo-sign');
  if (loSign && CONFIG.suratSign)
    loSign.textContent = CONFIG.suratSign;

  // ── Pilihan balikan ──
  const choiceQ = qs('.lo-choice-question');
  if (choiceQ && CONFIG.suratChoiceQuestion)
    choiceQ.textContent = CONFIG.suratChoiceQuestion;
  const btnYes = qs('#loBtnYes');
  if (btnYes && CONFIG.suratChoiceYes)
    btnYes.textContent = CONFIG.suratChoiceYes;
  const btnNo = qs('#loBtnNo');
  if (btnNo && CONFIG.suratChoiceNo)
    btnNo.textContent = CONFIG.suratChoiceNo;

  // ── Musik ──
  if (CONFIG.musicSrc) {
    const audio = qs('#bgAudio');
    if (audio && !audio.querySelector('source')) {
      const src = document.createElement('source');
      src.src  = CONFIG.musicSrc;
      src.type = 'audio/mpeg';
      audio.appendChild(src);
    }
  }
}

/* ── Inject polaroid dari mediaData (dipanggil juga setelah media.json loaded) ── */
function applyPolaroids() {
  const polaroidSrc = (mediaData && mediaData.polaroids)
    ? mediaData.polaroids
    : (CONFIG.polaroids || []);
  if (!polaroidSrc.length) return;
  const photos = qsa('.hs-photo');
  photos.forEach((p, i) => {
    const data = polaroidSrc[i];
    if (!data) return;
    const img = p.querySelector('img');
    const cap = p.querySelector('.hs-caption');
    if (img) { img.src = data.src; img.alt = data.caption || ''; }
    if (cap) cap.textContent = data.caption || '';
  });
}

/* ── Drop polaroid photos from string ── */
function dropPolaroids() {
  const photos = qsa('.hs-photo');
  photos.forEach(p => {
    p.classList.add('drop');
  });
}

/* ══════════════════════════════════════════════════════════
   5b. PINK WORLD ACTIVATION
══════════════════════════════════════════════════════════ */
function activatePinkWorld() {
  // Tell canvas loop to use pink star colors
  window._pinkMode = true;
  // Add class to body for CSS music/progress bar overrides
  document.body.classList.add("pink-world");

  // Replace floating hearts with bigger, pinker burst
  const wrap    = qs('#particleLayer');
  const HEARTS  = ['♡','♥','❤','🩷','💗','💕'];
  const PCOLORS = ['#ff80a0','#ffb3c6','#e8607a','#ffc0cb','#ff6b8a','#ffccd5'];

  function spawnPink() {
    if (!window._pinkMode) return;
    const el       = document.createElement('div');
    el.className   = 'fp-heart';
    el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
    el.style.left      = Math.random() * 100 + '%';
    el.style.fontSize  = (Math.random() * .8 + .5) + 'rem';
    el.style.color     = PCOLORS[Math.floor(Math.random() * PCOLORS.length)];
    el.style.filter    = 'drop-shadow(0 0 7px rgba(255,112,150,.65))';
    const dur = Math.random() * 5 + 7;
    el.style.animationDuration = dur + 's';
    wrap.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 300);
  }

  // Replace old heart interval with pink one
  if (window._heartInterval) clearInterval(window._heartInterval);
  window._heartInterval = setInterval(spawnPink, 1500);

  // Initial burst of pink hearts
  for (let i = 0; i < 10; i++) setTimeout(spawnPink, i * 200);
}


/* ══════════════════════════════════════════════════════════
   6. SCROLL REVEAL
══════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const mainEl = qs('#layerMain');
  const items  = qsa('.reveal, .reveal-up');

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const delay = parseInt(e.target.dataset.delay || 0);
      setTimeout(() => e.target.classList.add('in'), delay);
      obs.unobserve(e.target);
    });
  }, { threshold: .12, root: mainEl });

  items.forEach(el => obs.observe(el));
}


/* ══════════════════════════════════════════════════════════
   6b. SECTION LOADER — scroll block + reveal
   Loader muncul tepat di bawah section.
   Selama loading: scroll di-lock, ga bisa lewat loader.
   Setelah kondisi + 5 detik: loader hilang, section reveal.
══════════════════════════════════════════════════════════ */
function initSectionLoaders() {

  // demoAll: reveal semua section langsung tanpa loading
  if (CONFIG.demoAll) {
    qsa('.sec-hidden').forEach(el => {
      el.classList.add('sec-revealed');
    });
    qsa('.sec-loader').forEach(el => {
      el.style.display = 'none';
    });
    return;
  }

  const EXTRA_DELAY = 5000;

  const CHAIN = [
    { loader: 'loaderToMessage',  section: 'secMessage',  minWait: 2400, condition: () => true },
    { loader: 'loaderToMemories', section: 'secMemories', minWait: 500,  condition: () => twDone },
    { loader: 'loaderToGallery',  section: 'secGallery',  minWait: 2200, condition: () => true },
    { loader: 'loaderToScratch',  section: 'secScratch',  minWait: 500,  condition: () => albumsData.length > 0 },
    { loader: 'loaderToClosing',  section: 'secClosing',  minWait: 1800, condition: () => true },
  ];

  const mainEl = qs('#layerMain');

  // ── Scroll lock ──
  // Simpan posisi maksimum yang boleh di-scroll
  let scrollCap = Infinity; // Infinity = bebas

  mainEl.addEventListener('scroll', () => {
    if (mainEl.scrollTop > scrollCap) {
      mainEl.scrollTop = scrollCap;
    }
  }, { passive: false });

  // Touch support
  let touchStartY = 0;
  mainEl.addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  mainEl.addEventListener('touchmove', e => {
    if (scrollCap === Infinity) return;
    const swipingDown = e.touches[0].clientY < touchStartY;
    if (swipingDown && mainEl.scrollTop >= scrollCap) {
      e.preventDefault();
    }
  }, { passive: false });

  // ── Setup tiap loader ──
  CHAIN.forEach(item => {
    const loaderEl  = qs(`#${item.loader}`);
    const sectionEl = qs(`#${item.section}`);
    if (!loaderEl || !sectionEl) return;

    let triggered = false;
    let condMetAt = null;

    const obs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting || triggered) return;
      triggered = true;
      obs.disconnect();

      // Hitung posisi top loader relatif ke scrollable container
      // dan set scroll cap tepat di sana
      const loaderTop = loaderEl.offsetTop;
      scrollCap = loaderTop;

      // Loader fade in
      loaderEl.classList.add('visible');

      const startTime = Date.now();

      function tryReveal() {
        const elapsed  = Date.now() - startTime;
        const waitDone = elapsed >= item.minWait;
        const condOk   = item.condition();

        if (condOk && condMetAt === null) condMetAt = Date.now();

        const extraDone = condMetAt !== null && (Date.now() - condMetAt) >= EXTRA_DELAY;

        if (waitDone && condOk && extraDone) {
          // Buka scroll cap
          scrollCap = Infinity;

          // Collapse loader
          loaderEl.classList.add('done');
          setTimeout(() => {
            loaderEl.style.display = 'none';
            sectionEl.classList.add('sec-revealed');
          }, 420);
        } else {
          setTimeout(tryReveal, 200);
        }
      }

      tryReveal();
    }, { threshold: 0.01, root: mainEl });

    obs.observe(loaderEl);
  });
}


function initScrollProgress() {
  const mainEl = qs('#layerMain');
  const bar    = qs('#scrollProgress');

  bar.classList.add('active');

  // ── Buat love icon ──
  const love = document.createElement('div');
  love.style.cssText = `
    position: fixed;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    z-index: 802;
    font-size: .85rem; line-height: 1;
    color: #ff4477;
    text-shadow: 0 0 6px rgba(255,68,119,.9), 0 0 14px rgba(255,68,119,.5);
    pointer-events: none;
    animation: heartPulse 1s ease-in-out infinite alternate;
    will-change: left;
  `;
  love.textContent = '♥';
  document.body.appendChild(love);

  // Posisi awal
  love.style.top  = (bar.offsetHeight / 2) + 'px';
  love.style.left = '0px';

  // ── Partikel ekor ──
  const TRAIL_COLORS = ['#ff4477','#ff80a0','#ffb3c6','#ff6b8a','#ffd0de'];
  let lastX    = 0;
  let lastPct  = 0;

  function spawnTrail(x, goingRight) {
    for (let i = 0; i < 2; i++) {
      const p    = document.createElement('div');
      const size = Math.random() * 5 + 3;
      const color = TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)];
      const dur  = Math.random() * 300 + 250;

      // Ekor selalu ke arah berlawanan gerakan
      // scroll kanan → partikel ke kiri; scroll kiri → partikel ke kanan
      const txVal = goingRight
        ? -(Math.random() * 14 + 6)   // ke kiri
        :  (Math.random() * 14 + 6);  // ke kanan
      const tyVal = (Math.random() * 6 - 3);

      p.style.cssText = `
        position: fixed;
        top: ${bar.offsetHeight / 2}px;
        left: ${x}px;
        width: ${size}px; height: ${size}px;
        border-radius: 50%;
        background: ${color};
        box-shadow: 0 0 5px ${color};
        pointer-events: none;
        z-index: 801;
        --tx: ${txVal}px;
        --ty: ${tyVal}px;
        transform: translate(-50%, -50%);
        animation: loveTrail ${dur}ms ease-out forwards;
      `;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), dur + 50);
    }
  }

  let rafId = null;

  mainEl.addEventListener('scroll', () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const pct      = mainEl.scrollTop / (mainEl.scrollHeight - mainEl.clientHeight) * 100;
      const clamp    = Math.min(Math.max(pct, 0), 100);
      const xPos     = (clamp / 100) * window.innerWidth;
      const goingRight = clamp >= lastPct;

      bar.style.setProperty('--prog', clamp + '%');

      // Love tepat di ujung bar — sama persis, no lag
      love.style.left = xPos + 'px';

      // Spawn partikel kalau posisi berubah cukup
      if (Math.abs(xPos - lastX) > 1) {
        spawnTrail(xPos, goingRight);
        lastX   = xPos;
        lastPct = clamp;
      }
    });
  }, { passive: true });
}


/* ══════════════════════════════════════════════════════════
   8. TYPEWRITER EFFECT
══════════════════════════════════════════════════════════ */
function initTypewriter() {
  const mainEl = qs('#layerMain');
  const secMsg = qs('#secMessage');

  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !twDone) {
      obs.disconnect();
      runTypewriter();
    }
  }, { threshold: .35, root: mainEl });

  obs.observe(secMsg);
}

function runTypewriter() {
  const output = qs('#twOutput');
  const cursor = qs('#twCursor');
  const after  = qs('#mcAfter');
  const raw    = CONFIG.typewriterText;

  let i = 0;
  output.textContent = '';

  // Build segments (handle | as pause, \n as line break)
  const chars = raw.split('');

  function type() {
    if (i >= chars.length) {
      // Done
      cursor.style.animation = 'none';
      cursor.style.opacity   = '0';
      setTimeout(() => { after.classList.add('show'); }, 500);
      twDone = true;
      
      return;
    }

    const ch = chars[i];

    if (ch === '|') {
      // Pause
      i++;
      setTimeout(type, 400);
      return;
    } else if (ch === '\\' && chars[i+1] === 'n') {
      output.innerHTML += '<br/>';
      i += 2;
    } else {
      output.innerHTML += ch;
      i++;
    }

    const speed = CONFIG.typewriterSpeed + Math.random() * 25;
    twTimer = setTimeout(type, speed);
  }

  setTimeout(type, 600);
}


/* ══════════════════════════════════════════════════════════
   9. LOAD MEDIA FROM JSON
══════════════════════════════════════════════════════════ */
let mediaData = null;

async function loadAlbums() {
  try {
    const res = await fetch('media.json');
    mediaData = await res.json();
    albumsData = mediaData.albums || [];

    // Support dua format:
    // Format baru: photos ada di dalam tiap album sebagai album.photos
    // Format lama: photos ada di mediaData.photos (flat array dengan field "album")
    if (mediaData.photos) {
      // Format lama — langsung pakai
      photosData = mediaData.photos;
    } else {
      // Format baru — flatten semua album.photos, tambahkan field "album" otomatis
      photosData = albumsData.flatMap(album =>
        (album.photos || []).map(p => ({ ...p, album: album.id }))
      );
    }

    renderAlbums(albumsData, photosData);
    applyPolaroids();
    initCountdownBg();
  } catch (err) {
    console.warn('Gagal load media.json, pakai fallback:', err);
    loadAlbumsFallback();
  }
  // Init scratch cards SETELAH mediaData loaded
  initScratchCards();
}

function renderAlbums(albums, photos) {
  const grid = qs('#albumGrid');
  grid.innerHTML = '';

  albums.forEach((album, idx) => {
    const count   = photos.filter(p => p.album === album.id).length;
    const isVideo = album.type === 'video';
    const typeLabel = isVideo ? '🎬 Video' : '📷 Foto';

    const card = document.createElement('div');
    card.className  = 'album-card';
    card.dataset.albumId = album.id;
    card.dataset.type    = album.type || 'photo';

    card.innerHTML = `
      <div class="album-thumb">
        <img src="${album.cover}" alt="${album.name}" loading="lazy"/>
      </div>
      <div class="album-grad"></div>
      <div class="album-type-pill">${typeLabel}</div>
      <div class="album-count-pill">${count} item</div>
      ${isVideo ? '<div class="album-play-icon">▶</div>' : ''}
      <div class="album-meta">
        <h3>${album.name}</h3>
        ${album.description ? `<p class="album-desc-text">${album.description}</p>` : ''}
      </div>
      <div class="album-cta">
        <span>${isVideo ? 'Putar Video' : 'Lihat Foto'}</span>
        <span>→</span>
      </div>
    `;

    card.addEventListener('click', () => openAlbum(album.id, album.name, album.type));
    grid.appendChild(card);

    // Stagger appear
    const mainEl = qs('#layerMain');
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setTimeout(() => card.classList.add('in'), idx * 110);
        obs.disconnect();
      }
    }, { threshold: .08, root: mainEl });
    obs.observe(card);
  });
}

/* Fallback data if fetch() fails (e.g. file:// protocol) */
function loadAlbumsFallback() {
  albumsData = [
    { id: 'kenangan', name: 'Kenangan Kita',  cover: 'https://picsum.photos/seed/cov1/800/500', description: 'Momen yang selalu kuingat',   type: 'photo',
      photos: [
        { id:'k1', image:'https://picsum.photos/seed/ken1/800/700', caption:'Momen pertama yang indah ✦' },
        { id:'k2', image:'https://picsum.photos/seed/ken2/800/600', caption:'Waktu bersamamu' },
        { id:'k3', image:'https://picsum.photos/seed/ken3/800/750', caption:'Kenangan tak terganti' },
        { id:'k4', image:'https://picsum.photos/seed/ken4/800/600', caption:'Senyummu' },
        { id:'k5', image:'https://picsum.photos/seed/ken5/800/700', caption:'Hari sempurna' },
        { id:'k6', image:'https://picsum.photos/seed/ken6/800/650', caption:'Terindah' }
      ]
    },
    { id: 'lucu', name: 'Foto Lucu', cover: 'https://picsum.photos/seed/cov3/800/500', description: 'Tawa yang selalu bikin rindu', type: 'photo',
      photos: [
        { id:'l1', image:'https://picsum.photos/seed/luc1/800/700', caption:'Ekspresi terbaik 😂' },
        { id:'l2', image:'https://picsum.photos/seed/luc2/800/650', caption:'Bikin ketawa' },
        { id:'l3', image:'https://picsum.photos/seed/luc3/800/700', caption:'Momen receh' },
        { id:'l4', image:'https://picsum.photos/seed/luc4/800/600', caption:'Side profile wkwk' }
      ]
    },
    { id: 'spesial', name: 'Momen Spesial', cover: 'https://picsum.photos/seed/cov4/800/500', description: 'Hari-hari paling berharga', type: 'photo',
      photos: [
        { id:'s1', image:'https://picsum.photos/seed/sps1/800/700', caption:'Hari paling berharga ✦' },
        { id:'s2', image:'https://picsum.photos/seed/sps2/800/650', caption:'Spesial karena ada kamu' },
        { id:'s3', image:'https://picsum.photos/seed/sps3/800/700', caption:'Kenangan abadi' },
        { id:'s4', image:'https://picsum.photos/seed/sps4/800/600', caption:'Terima kasih' },
        { id:'s5', image:'https://picsum.photos/seed/sps5/800/750', caption:'Untuk selamanya' }
      ]
    },
    { id: 'video', name: 'Video Kita', cover: 'https://picsum.photos/seed/vcov/800/500', description: 'Momen yang terekam kamera', type: 'video',
      photos: [
        { id:'v1', type:'video', src:'https://www.w3schools.com/html/mov_bbb.mp4',  thumb:'https://picsum.photos/seed/vt1/600/400', caption:'Momen paling lucu wkwk 🎬' },
        { id:'v2', type:'video', src:'https://www.w3schools.com/html/movie.mp4',    thumb:'https://picsum.photos/seed/vt2/600/400', caption:'Hari yang menyenangkan 🎥' },
        { id:'v3', type:'video', src:'https://www.w3schools.com/html/mov_bbb.mp4',  thumb:'https://picsum.photos/seed/vt3/600/400', caption:'Kenangan bergerak ✨' }
      ]
    }
  ];

  // Flatten photos dari format baru untuk photosData
  photosData = albumsData.flatMap(album =>
    (album.photos || []).map(p => ({ ...p, album: album.id }))
  );

  renderAlbums(albumsData, photosData);

}
/* ══════════════════════════════════════════════════════════
   10. ALBUM VIEWER — REDESIGNED
══════════════════════════════════════════════════════════ */
function openAlbum(albumId, albumName, albumType) {
  const viewer   = qs('#albumViewer');
  const grid     = qs('#avGrid');
  const empty    = qs('#avEmpty');
  const title    = qs('#avTitle');
  const countEl  = qs('#avCount');
  const blurBg   = qs('#avBlurBg');
  const typeBadge= qs('#avTypeBadge');

  const isVideo  = albumType === 'video';
  const items    = photosData.filter(p => p.album === albumId);

  // Set album cover as blurred background
  const album    = albumsData.find(a => a.id === albumId);
  if (album) blurBg.style.backgroundImage = `url(${album.cover})`;

  title.textContent     = albumName;
  countEl.textContent   = `${items.length} item`;
  typeBadge.textContent = isVideo ? '🎬 Video' : '📷 Foto';
  grid.innerHTML        = '';

  if (items.length === 0) {
    empty.classList.remove('hidden');
    grid.classList.add('hidden');
  } else {
    empty.classList.add('hidden');
    grid.classList.remove('hidden');

    items.forEach((item, idx) => {
      const isVid = item.type === 'video';
      const div   = document.createElement('div');
      div.className = isVid ? 'av-video-item' : 'av-photo';

      if (isVid) {
        div.innerHTML = `
          <img src="${item.thumb || item.image}" alt="${item.caption || ''}" loading="lazy"/>
          <div class="av-video-play">▶</div>
          <div class="av-video-ov">
            <span class="av-item-caption">${item.caption || ''}</span>
          </div>
        `;
      } else {
        div.innerHTML = `
          <img src="${item.image}" alt="${item.caption || ''}" loading="lazy"/>
          <div class="av-photo-ov">
            <span class="av-item-caption">${item.caption || ''}</span>
          </div>
        `;
      }

      div.addEventListener('click', () => openLightbox(items, idx));
      grid.appendChild(div);

      // Stagger in
      div.style.opacity = '0';
      div.style.transform = 'scale(.92)';
      setTimeout(() => {
        div.style.transition = 'opacity .35s ease, transform .35s ease';
        div.style.opacity = '1';
        div.style.transform = 'scale(1)';
      }, idx * 40 + 60);
    });
  }

  viewer.classList.add('open');
}

qs('#avCloseBtn').addEventListener('click', () => {
  qs('#albumViewer').classList.remove('open');
});


/* ══════════════════════════════════════════════════════════
   11. LIGHTBOX — REDESIGNED WITH FILMSTRIP + VIDEO SUPPORT
══════════════════════════════════════════════════════════ */
function openLightbox(photos, index) {
  lbPhotos = photos;
  lbIndex  = index;
  buildStrip();
  renderLightbox(true);
  qs('#lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb    = qs('#lightbox');
  const video = qs('#lbVideo');
  lb.classList.remove('open');
  video.pause();
  video.src = '';
  document.body.style.overflow = '';
}

/* Build filmstrip thumbnails */
function buildStrip() {
  const strip = qs('#lbStrip');
  strip.innerHTML = '';
  lbPhotos.forEach((item, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'lb-thumb' + (item.type === 'video' ? ' video-thumb' : '');
    const src = item.type === 'video' ? (item.thumb || item.image) : item.image;
    thumb.innerHTML = `<img src="${src}" alt="${item.caption || ''}"/>`;
    thumb.addEventListener('click', () => {
      lbIndex = idx;
      renderLightbox(false);
    });
    strip.appendChild(thumb);
  });
  updateStripActive();
}

function updateStripActive() {
  const thumbs = qsa('#lbStrip .lb-thumb');
  thumbs.forEach((t, i) => t.classList.toggle('active', i === lbIndex));

  // Center strip when few items fit, scroll when overflow
  const strip    = qs('#lbStrip');
  const wrapW    = strip.parentElement.offsetWidth;
  const totalW   = thumbs.length * (52 + 6); // thumb + gap
  if (totalW < wrapW) {
    // Items fit — add auto side padding to center them visually
    const pad = Math.max(0, (wrapW - totalW) / 2);
    strip.style.paddingLeft  = pad + 'px';
    strip.style.paddingRight = pad + 'px';
  } else {
    strip.style.paddingLeft  = '8px';
    strip.style.paddingRight = '8px';
  }

  // Scroll active thumb into view without moving the whole page
  const active = thumbs[lbIndex];
  if (active) {
    active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }
}

function renderLightbox(firstOpen) {
  const img    = qs('#lbImg');
  const video  = qs('#lbVideo');
  const cap    = qs('#lbCaption');
  const cnt    = qs('#lbCounter');
  const loader = qs('#lbLoader');
  const bgBlur = qs('#lbBgBlur');
  const item   = lbPhotos[lbIndex];
  const isVid  = item.type === 'video';

  cnt.textContent = `${lbIndex + 1} / ${lbPhotos.length}`;
  cap.textContent = item.caption || '';
  updateStripActive();

  // Always stop & clear video first when switching items
  if (!video.paused) video.pause();
  video.removeAttribute('src');
  video.load(); // abort any pending network request

  // Update blurred bg
  const blurSrc = isVid
    ? (item.thumb || item.image || '')
    : (item.image || '');
  if (blurSrc) bgBlur.style.backgroundImage = `url(${blurSrc})`;

  if (isVid) {
    // ── VIDEO MODE ──
    img.style.display    = 'none';
    img.style.opacity    = '0';
    video.style.display  = 'block';
    video.style.opacity  = '0';
    video.style.transition = 'none';
    loader.classList.remove('hidden');

    // Set src then load
    video.src = item.src || '';
    video.load();

    // Fade in once enough data is ready
    const onReady = () => {
      loader.classList.add('hidden');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          video.style.transition = 'opacity .35s ease';
          video.style.opacity    = '1';
        });
      });
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('loadeddata', onReady);
    };
    video.addEventListener('canplay',    onReady);
    video.addEventListener('loadeddata', onReady); // fallback

    // Error fallback
    video.onerror = () => {
      loader.classList.add('hidden');
      video.style.opacity = '1';
    };

  } else {
    // ── PHOTO MODE ──
    video.style.display  = 'none';
    video.style.opacity  = '0';
    img.style.display    = 'block';
    loader.classList.remove('hidden');

    // Reset all inline styles — let CSS handle sizing (max-width/height: 100% of grid cell)
    img.style.cssText = `
      display: block;
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      margin: 0 auto;
      border-radius: 8px;
      object-fit: contain;
      transform-origin: center center;
      transform: scale(.93);
      opacity: 0;
      transition: none;
      box-shadow: 0 20px 60px rgba(0,0,0,.65), 0 0 0 1px rgba(255,160,192,.07);
    `;

    const newImg = new Image();
    newImg.onload = () => {
      img.src = item.image;
      img.alt = item.caption || '';
      loader.classList.add('hidden');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          img.style.transition = 'opacity .3s ease, transform .4s var(--spring)';
          img.style.opacity    = '1';
          img.style.transform  = 'scale(1)';
        });
      });
    };
    newImg.onerror = () => {
      loader.classList.add('hidden');
      img.style.opacity = '1';
      img.style.transform = 'scale(1)';
    };
    newImg.src = item.image;
  }
}

function lbPrev() {
  lbIndex = (lbIndex - 1 + lbPhotos.length) % lbPhotos.length;
  renderLightbox(false);
}
function lbNext() {
  lbIndex = (lbIndex + 1) % lbPhotos.length;
  renderLightbox(false);
}

qs('#lbClose').addEventListener('click', closeLightbox);
qs('#lbPrev').addEventListener('click', lbPrev);
qs('#lbNext').addEventListener('click', lbNext);
qs('#lightbox').addEventListener('click', e => {
  if (e.target.id === 'lightbox') closeLightbox();
});

// Keyboard
document.addEventListener('keydown', e => {
  if (!qs('#lightbox').classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  lbPrev();
  if (e.key === 'ArrowRight') lbNext();
});

// Touch swipe
let lbTX = 0;
qs('#lightbox').addEventListener('touchstart', e => { lbTX = e.changedTouches[0].screenX; }, { passive: true });
qs('#lightbox').addEventListener('touchend',   e => {
  const dx = lbTX - e.changedTouches[0].screenX;
  if (Math.abs(dx) > 45) dx > 0 ? lbNext() : lbPrev();
}, { passive: true });


/* ══════════════════════════════════════════════════════════
   12. MUSIC PLAYER
══════════════════════════════════════════════════════════ */
/* ── Music helpers (global so cake can trigger them) ── */
function playMusicGlobal(fadeDuration) {
  const btn    = qs('#musicToggle');
  const title  = qs('#musicTitle');
  const audio  = qs('#bgAudio');
  if (!audio) return;
  if (!audio.querySelector('source') && !audio.src) return; // no source, silently skip
  if (musicPlaying) return;

  audio.volume = 0;
  audio.play().then(() => {
    // Fade in over fadeDuration ms (default 2s)
    const dur   = fadeDuration || 2000;
    const steps = 40;
    const inc   = 0.45 / steps;
    let   v     = 0;
    const iv    = setInterval(() => {
      v = Math.min(v + inc, 0.45);
      audio.volume = v;
      if (v >= 0.45) clearInterval(iv);
    }, dur / steps);

    const icPlay = btn.querySelector('.ic-play');
    const icPaus = btn.querySelector('.ic-pause');
    btn.classList.add('playing');
    if (icPlay) icPlay.classList.add('hidden');
    if (icPaus) icPaus.classList.remove('hidden');
    title.textContent = 'Now Playing ♪';
    musicPlaying = true;
  }).catch(() => {
    // Autoplay blocked or no file — silently ignore
  });
}

(function initMusic() {
  const btn    = qs('#musicToggle');
  const title  = qs('#musicTitle');
  const audio  = qs('#bgAudio');
  const icPlay = btn.querySelector('.ic-play');
  const icPaus = btn.querySelector('.ic-pause');

  btn.addEventListener('click', () => {
    if (!audio.querySelector('source') && !audio.src) {
      showMusicHint('🎵 Taruh file musik di assets/music/ dan uncomment tag <source> di index.html');
      return;
    }
    if (musicPlaying) {
      pauseMusic();
    } else {
      playMusicGlobal();
    }
  });

  function pauseMusic() {
    audio.pause();
    btn.classList.remove('playing');
    icPlay.classList.remove('hidden');
    icPaus.classList.add('hidden');
    title.textContent = 'Putar Musik';
    musicPlaying = false;
  }

  function showMusicHint(msg) {
    const h = document.createElement('div');
    h.style.cssText = `
      position:fixed; bottom:4.5rem; left:1.5rem; z-index:999;
      background:rgba(15,10,30,.97); border:1px solid rgba(184,168,232,.2);
      border-radius:8px; padding:.75rem 1.1rem; font-size:.73rem;
      color:#cfc2f5; max-width:260px; line-height:1.7;
      backdrop-filter:blur(14px);
    `;
    h.textContent = msg;
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 5000);
  }
})();


/* ══════════════════════════════════════════════════════════
   13. CURSOR GLOW (Desktop only)
══════════════════════════════════════════════════════════ */
if (!window.matchMedia('(hover: none)').matches) {
  const glow = document.createElement('div');
  glow.style.cssText = `
    position:fixed; width:380px; height:380px; border-radius:50%;
    background:radial-gradient(circle, rgba(184,168,232,.05), transparent 70%);
    transform:translate(-50%,-50%); pointer-events:none; z-index:1;
    transition: left .5s ease, top .5s ease; mix-blend-mode:screen;
  `;
  document.body.appendChild(glow);
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
}


/* ══════════════════════════════════════════════════════════
   PRANK — slot machine + kotak berlapis + surat 🎰
══════════════════════════════════════════════════════════ */
function initPrank() {

  const SYMBOLS    = ['🎀','⭐','💫','🌸','💝','🎁'];
  const MAX_SPINS  = 6;
  const JACKPOT_AT = MAX_SPINS; // jackpot HANYA di spin ke-6
  const LAYER_MSGS = [
    'hampir...', 'sebentar lagi...', 'udah deket nih...',
    'ini dia...', 'beneran nih...', 'buka deh! 🎁'
  ];

  let spinCount = 0;
  let spinning  = false;

  // ── Step helpers ──
  function showStep(id) {
    ['prankReady','prankSlot','prankBoxes','prankLetter'].forEach(s => {
      const el = qs(`#${s}`);
      if (el) el.classList.remove('active');
    });
    const el = qs(`#${id}`);
    if (el) setTimeout(() => el.classList.add('active'), 50);
  }
  // ── STEP 1: Pertanyaan ──
  const btnYes = qs('#prankBtnYes');
  const btnNo  = qs('#prankBtnNo');
  let noCount  = 0;

  setTimeout(() => showStep('prankReady'), 300);

  btnNo.addEventListener('click', () => {
    noCount++;
    if (noCount >= 4) { btnNo.textContent = 'iya juga deh 😅'; setTimeout(() => showStep('prankSlot'), 300); return; }
    const msgs = ['yakin?? 🥺', 'masa sih...', 'coba lagi!'];
    btnNo.textContent = msgs[noCount - 1];
    const wrap = btnNo.parentElement.getBoundingClientRect();
    btnNo.style.position = 'absolute';
    btnNo.style.left = (Math.random() * (wrap.width - 90)) + 'px';
    btnNo.style.top  = (Math.random() * 30) + 'px';
  });
  btnYes.addEventListener('click', () => showStep('prankSlot'));

  // ── STEP 2: Slot Machine ──
  const reels     = [qs('#reel0'), qs('#reel1'), qs('#reel2')];
  const spinBtn   = qs('#prankSpinBtn');
  const resultEl  = qs('#prankSlotResult');
  const countEl   = qs('#prankSpinCount');
  const photos    = (mediaData && mediaData.prankPhotos && mediaData.prankPhotos.length)
                    ? mediaData.prankPhotos
                    : (CONFIG.prankPhotos && CONFIG.prankPhotos.length)
                    ? CONFIG.prankPhotos : SYMBOLS;

  // Isi tiap reel dengan urutan foto yang SAMA persis
  // supaya jackpot (stop di index sama) tampil foto yang sama
  const REEL_REPEAT = 4; // ulang 4x biar reel panjang
  reels.forEach(reel => {
    for (let r = 0; r < REEL_REPEAT; r++) {
      photos.forEach(sym => {
        const item = document.createElement('div');
        item.className = 'prank-reel-item';
        if (typeof sym === 'string' && (sym.startsWith('http') || sym.startsWith('assets'))) {
          const img = document.createElement('img');
          img.src = sym; item.appendChild(img);
        } else {
          item.textContent = sym;
        }
        reel.appendChild(item);
      });
    }
  });

  spinBtn.addEventListener('click', () => {
    if (spinning) return;
    spinCount++;
    spinning = true;
    spinBtn.disabled = true;
    resultEl.textContent = '';
    resultEl.className = 'prank-slot-result';
    countEl.textContent = `kesempatan: ${Math.max(0, MAX_SPINS - spinCount)}x lagi`;

    const isJackpot = (spinCount === JACKPOT_AT);

    // Animasi spin tiap reel dengan durasi berbeda
    const durations = [1200, 1600, 2000];
    const itemH = 68;

    reels.forEach((reel, ri) => {
      const items    = reel.querySelectorAll('.prank-reel-item');
      const total    = items.length;
      let   current  = 0;
      const speed    = 80;

      // Tentukan target item untuk stop
      // Jackpot (spin ke-6): semua reel stop di foto yang SAMA
      // Zonk (spin 1-5): random, tapi TIDAK boleh semua sama
      let targetIdx;
      if (isJackpot) {
        targetIdx = 0; // semua reel stop di foto pertama
      } else {
        // Random per reel, tapi pastikan tidak semua sama
        if (ri === 0) {
          targetIdx = Math.floor(Math.random() * photos.length);
          // Simpan target reel 0 untuk dicek reel berikutnya
          reels._zonkTarget0 = targetIdx;
        } else if (ri === 1) {
          targetIdx = Math.floor(Math.random() * photos.length);
          reels._zonkTarget1 = targetIdx;
        } else {
          // Reel terakhir: cek apakah reel 0 dan 1 sudah sama
          // Kalau sama, paksa reel 2 berbeda biar jelas zonk
          if (reels._zonkTarget0 === reels._zonkTarget1) {
            const diff = (reels._zonkTarget0 + 1 + Math.floor(Math.random() * (photos.length - 1))) % photos.length;
            targetIdx = diff;
          } else {
            targetIdx = Math.floor(Math.random() * photos.length);
          }
        }
      }

      const spinInterval = setInterval(() => {
        current = (current + 1) % total;
        reel.style.transform = `translateY(-${current * itemH}px)`;
      }, speed);

      setTimeout(() => {
        clearInterval(spinInterval);
        reel.style.transition = 'transform .3s var(--spring)';
        reel.style.transform  = `translateY(-${targetIdx * itemH}px)`;
        setTimeout(() => { reel.style.transition = ''; }, 350);

        // Setelah reel terakhir stop
        if (ri === 2) {
          setTimeout(() => {
            spinning = false;
            if (isJackpot) {
              // JACKPOT — konfeti + lanjut ke kotak
              resultEl.textContent = '🎉 JACKPOT!! 🎉';
              resultEl.classList.add('win');
              burstPrankConfetti();
              spinBtn.disabled = true;
              setTimeout(() => showStep('prankBoxes'), 1800);
            } else {
              resultEl.textContent = spinCount < MAX_SPINS ? 'ZONK... coba lagi!' : '';
              if (spinCount < MAX_SPINS) {
                spinBtn.disabled = false;
                spinBtn.textContent = 'PUTAR LAGI 🎰';
              }
            }
          }, 400);
        }
      }, durations[ri]);
    });
  });

  // ── STEP 3: Kotak berlapis ──
  let currentLayer = 1;
  const TOTAL_LAYERS = 6;

  function buildBox(layer) {
    const wrap = qs('#prankBoxWrap');
    wrap.innerHTML = '';

    const boxWrap = document.createElement('div');
    boxWrap.className = 'prank-box-wrap';
    boxWrap.dataset.layer = layer;

    const box = document.createElement('div');
    box.className = 'prank-box';

    const lid = document.createElement('div');
    lid.className = 'prank-box-lid';
    lid.innerHTML = `<div class="prank-box-ribbon-h"></div>
                     <div class="prank-box-ribbon-v"></div>
                     <div class="prank-box-bow">🎀</div>`;

    const body = document.createElement('div');
    body.className = 'prank-box-body';

    box.appendChild(lid); box.appendChild(body);
    boxWrap.appendChild(box);
    wrap.appendChild(boxWrap);

    // Update teks
    const hintEl  = qs('#prankBoxHint');
    const layerEl = qs('#prankBoxLayerText');
    hintEl.textContent  = 'ketuk kotak untuk membuka ✦';
    layerEl.textContent = '';

    // Klik kotak
    boxWrap.addEventListener('click', () => {
      lid.classList.add('open');

      setTimeout(() => {
        layerEl.textContent = LAYER_MSGS[layer - 1] || '';
      }, 300);

      setTimeout(() => {
        if (layer < TOTAL_LAYERS) {
          currentLayer++;
          buildBox(currentLayer);
        } else {
          // Layer terakhir → ke surat
          showStep('prankLetter');
          initPrankLetter();
        }
      }, 900);
    });
  }

  // Inisialisasi kotak saat step boxes aktif
  const boxesObs = new MutationObserver(() => {
    if (qs('#prankBoxes').classList.contains('active')) {
      boxesObs.disconnect();
      setTimeout(() => buildBox(1), 300);
    }
  });
  boxesObs.observe(qs('#prankBoxes'), { attributes: true });

  // ── STEP 4: Surat — pakai sistem persis sama kayak openLetter ──
  function initPrankLetter() {
    const env       = qs('#prankLoEnv');
    const paperCard = qs('#prankLoPaperCard');
    const letterBox = qs('#prankLoLetterBox');
    const bodyEl    = qs('#prankLoBody');

    bodyEl.textContent = CONFIG.prankText ||
      'ZONK HAHA, mau coba lagi? refresh aja web nya, atau tunggu di bulan april ya hehe 🌸';

    // Reset state
    env.classList.remove('appeared','flap-open','dismissed');
    letterBox.classList.remove('show');
    paperCard.classList.remove('ready','unfolding');
    paperCard.style.cssText = `
      opacity: 0; pointer-events: none; transition: none;
      transform: translate(-50%, -50%); z-index: 2;
    `;
    void paperCard.offsetWidth;

    // Step 1 — Envelope muncul
    setTimeout(() => env.classList.add('appeared'), 150);

    // Step 2 — Flap buka
    setTimeout(() => env.classList.add('flap-open'), 880);

    // Step 3 — Paper muncul (tersembunyi di balik envelope)
    setTimeout(() => {
      paperCard.style.cssText = `
        opacity: 1; pointer-events: none;
        transform: translate(-50%, -50%);
        transition: transform 1s cubic-bezier(.22,1.4,.36,1), opacity .3s ease;
        z-index: 2;
      `;
    }, 900);

    // Step 4 — Paper naik ke atas
    setTimeout(() => {
      paperCard.style.transform = 'translate(-50%, calc(-50% - 175px))';
    }, 1600);

    // Step 5 — Paper turun ke tengah, envelope dismiss
    setTimeout(() => {
      paperCard.style.transform = 'translate(-50%, -50%)';
      paperCard.style.zIndex    = '5';
      env.classList.add('dismissed');
    }, 2600);

    // Step 6 — Paper jadi tappable → letter box muncul
    setTimeout(() => {
      paperCard.classList.add('ready');
      paperCard.style.pointerEvents = 'all';

      function onPaperTap(e) {
        e.stopPropagation();
        paperCard.removeEventListener('click', onPaperTap);

        paperCard.classList.add('unfolding');
        paperCard.style.pointerEvents = 'none';

        setTimeout(() => {
          paperCard.style.opacity = '0';
          paperCard.style.transition = 'opacity .3s ease';
          letterBox.classList.add('show');
        }, 480);
      }

      paperCard.addEventListener('click', onPaperTap);
    }, 3300);
  }

  // ── Confetti helper ──
  function burstPrankConfetti() {
    const container = qs('#prankConfetti');
    const COLORS = ['#f0d060','#ff80a0','#80d0ff','#c080ff','#80ff80','#ffa040'];
    for (let i = 0; i < 80; i++) {
      const p = document.createElement('div');
      p.className = 'prank-conf-piece';
      const size = Math.random() * 8 + 4;
      p.style.cssText = `
        left: ${Math.random() * 100}%;
        top: -10px;
        width: ${size}px; height: ${size}px;
        background: ${COLORS[Math.floor(Math.random() * COLORS.length)]};
        border-radius: ${Math.random() > .5 ? '50%' : '2px'};
        animation-duration: ${Math.random() * 2 + 1.5}s;
        animation-delay: ${Math.random() * .5}s;
      `;
      container.appendChild(p);
      setTimeout(() => p.remove(), 3500);
    }
  }
}


/* ══════════════════════════════════════════════════════════
   14. BOOT
══════════════════════════════════════════════════════════ */

/* Cek apakah jam unlock prank sudah lewat (WIB = UTC+7) */
function isPrankUnlocked() {
  const nowWIB    = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const total     = nowWIB.getUTCHours() * 60 + nowWIB.getUTCMinutes();
  const unlock    = (CONFIG.prankUnlockHour || 0) * 60 + (CONFIG.prankUnlockMinute || 0);
  return total >= unlock;
}

/* Countdown khusus prank — jam:menit:detik saja, tampilan sama */
function initPrankCountdown() {
  // Sembunyikan unit Hari + colon pertama
  const daysUnit = qs('#cdDays') && qs('#cdDays').closest('.cd-unit');
  const colons   = qsa('.cd-colon');
  if (daysUnit)  daysUnit.style.display = 'none';
  if (colons[0]) colons[0].style.display = 'none';

  // Ganti teks
  const h = String(CONFIG.prankUnlockHour || 0).padStart(2,'0');
  const m = String(CONFIG.prankUnlockMinute || 0).padStart(2,'0');
  const headline   = qs('.cd-headline');
  const sub        = qs('.cd-sub');
  const targetDate = qs('#cdTargetDate');
  const foot       = qs('.cd-foot');
  if (headline)    headline.innerHTML = 'Sebentar lagi<br/>bisa dibuka';
  if (sub)         sub.textContent   = 'hadiahmu bisa dilihat mulai jam';
  if (targetDate)  targetDate.textContent = `${h}:${m} WIB`;
  if (foot)        foot.textContent  = 'ga usah di tunggu 🌸';

  let unlocked = false; // flag biar tidak double-trigger

  function tick() {
    if (unlocked) return;

    const nowWIB = new Date(Date.now() + 7 * 60 * 60 * 1000);

    // Target jam unlock hari ini WIB
    let target = new Date(nowWIB);
    target.setUTCHours(CONFIG.prankUnlockHour || 0, CONFIG.prankUnlockMinute || 0, 0, 0);

    const diff = target - nowWIB;

    // Sudah lewat jam unlock → langsung masuk prank
    if (diff <= 0) {
      if (unlocked) return;
      unlocked = true;
      animateNum('cdHours',   '00');
      animateNum('cdMinutes', '00');
      animateNum('cdSeconds', '00');
      setTimeout(() => exitLayer('layerCountdown', () => {
        showLayer('layerPrank');
        initPrank();
      }), 800);
      return;
    }

    animateNum('cdHours',   pad(Math.floor(diff / 3600000)));
    animateNum('cdMinutes', pad(Math.floor((diff % 3600000) / 60000)));
    animateNum('cdSeconds', pad(Math.floor((diff % 60000) / 1000)));
    setTimeout(tick, 1000);
  }

  tick();
}

// Load media.json dulu, baru boot
fetch('media.json')
  .then(r => r.json())
  .then(data => { window.mediaData = data; })
  .catch(() => { window.mediaData = {}; })
  .finally(() => boot());

function boot() {

  // Inject source musik sejak awal — biar siap saat lilin ke-4 ditiup
  try {
    if (CONFIG.musicSrc) {
      const audio = qs('#bgAudio');
      if (audio && !audio.querySelector('source') && !audio.src) {
        const src = document.createElement('source');
        src.src   = CONFIG.musicSrc;
        src.type  = 'audio/mpeg';
        audio.appendChild(src);
        // Tidak pakai audio.load() — biarkan browser load otomatis saat play
      }
    }
  } catch(e) {}

  if (CONFIG.demoAll) {
    setTimeout(() => {
      showLayer('layerMain');
      initMainSite();
    }, 400);
    return;
  }

  if (CONFIG.prankMode) {
    if (CONFIG.demoMode || isPrankUnlocked()) {
      setTimeout(() => { showLayer('layerPrank'); initPrank(); }, 400);
    } else {
      showLayer('layerCountdown');
      initCountdownBg();
      initPrankCountdown();
    }
  } else if (CONFIG.demoMode) {
    qs('#layerCountdown').classList.add('hidden');
    setTimeout(startCheckpoint, 400);
  } else if (isBirthdayToday()) {
    qs('#layerCountdown').classList.add('hidden');
    setTimeout(startCheckpoint, 600);
  } else {
    showLayer('layerCountdown');
    initCountdownBg();
    initCountdown();
  }
}
