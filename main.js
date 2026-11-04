// Shared stuff for every page: nav, floating hearts, click sparkles, music, fade-ins.

// ---------- Settings (edit these) ----------
// Your WhatsApp number with country code, digits only (e.g. "919876543210").
// Leave empty to hide the "text me" buttons.
const WHATSAPP_NUMBER = "919905633670";
// Secret question shown before the site opens. Answers are not case-sensitive.
const GATE_QUESTION = "Who made this little world for you? 👀";
const GATE_ANSWERS = ["dhruv"];
// Proposal page + hidden "I love you" (golden heart, tap the ♡ in the letter).
// Set to false to hide all of it again.
const SHOW_LOVE = true;

// Returns a WhatsApp chat link with a ready-typed message, or null if no number is set.
function waLink(text) {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

// ---------- Secret question gate ----------
// Not real security (the files are public), just a cute little door.
(function gate() {
  const KEY = "unlocked";
  try { if (localStorage.getItem(KEY) === "yes") return; } catch (e) {}
  const g = document.createElement("div");
  g.id = "gate";
  g.innerHTML = `
    <form class="gate-box">
      <div class="gate-lock">🔒</div>
      <h2>Hold on, Simran…</h2>
      <p>Quick question before you go in:</p>
      <p class="gate-q"></p>
      <input type="text" autocomplete="off" autocapitalize="off" placeholder="type here…" />
      <button class="btn" type="submit">Let me in ✨</button>
      <p class="gate-msg"></p>
    </form>`;
  g.querySelector(".gate-q").textContent = GATE_QUESTION;
  document.body.appendChild(g);
  document.documentElement.style.overflow = "hidden";
  const input = g.querySelector("input");
  const msg = g.querySelector(".gate-msg");
  const fails = ["Hmm, not quite 🤔", "Nope! Think harder 😜", "So close (maybe) 👀", "Hint: it's the person who made this 💭"];
  let tries = 0;
  g.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (GATE_ANSWERS.includes(input.value.trim().toLowerCase())) {
      try { localStorage.setItem(KEY, "yes"); } catch (err) {}
      g.querySelector(".gate-lock").textContent = "🔓";
      msg.textContent = "Welcome in 💗";
      g.classList.add("bye");
      document.documentElement.style.overflow = "";
      setTimeout(() => g.remove(), 700);
    } else {
      msg.textContent = fails[Math.min(tries++, fails.length - 1)];
      g.querySelector(".gate-box").classList.remove("shake");
      void g.offsetWidth;
      g.querySelector(".gate-box").classList.add("shake");
    }
  });
  setTimeout(() => input.focus(), 100);
})();

document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu
  const menuBtn = document.querySelector(".menu-btn");
  const links = document.querySelector(".nav-links");
  if (menuBtn) menuBtn.addEventListener("click", () => links.classList.toggle("open"));

  // Highlight current page
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if (a.getAttribute("href") === here) a.classList.add("active");
  });

  // Floating hearts / flowers in the background
  const floaties = document.createElement("div");
  floaties.id = "floaties";
  document.body.prepend(floaties);
  const icons = ["💗", "🌸", "✨", "💕", "🌷", "🦋", "☁️", "💖"];
  function spawnFloaty() {
    const el = document.createElement("span");
    el.className = "floaty";
    el.textContent = icons[Math.floor(Math.random() * icons.length)];
    el.style.left = Math.random() * 100 + "vw";
    el.style.fontSize = 14 + Math.random() * 22 + "px";
    const dur = 9 + Math.random() * 10;
    el.style.animationDuration = dur + "s";
    floaties.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000);
  }
  for (let i = 0; i < 6; i++) setTimeout(spawnFloaty, i * 400);
  setInterval(spawnFloaty, 1100);

  // Little sparkles wherever she clicks
  document.addEventListener("click", (e) => {
    const bits = ["💖", "✨", "🌸", "💫"];
    for (let i = 0; i < 6; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      s.textContent = bits[i % bits.length];
      s.style.left = e.clientX - 9 + "px";
      s.style.top = e.clientY - 9 + "px";
      const angle = (Math.PI * 2 * i) / 6;
      s.style.setProperty("--dx", Math.cos(angle) * 55 + "px");
      s.style.setProperty("--dy", Math.sin(angle) * 55 + "px");
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
  });

  // Fade-in on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("show"); io.unobserve(en.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll(".fade-in").forEach((el) => io.observe(el));

  // "Text me" buttons: any element with data-wa="message" opens WhatsApp (hidden if no number)
  document.querySelectorAll("[data-wa]").forEach((el) => {
    const url = waLink(el.dataset.wa);
    if (!url) { el.remove(); return; }
    el.href = url;
    el.target = "_blank";
    el.rel = "noopener";
  });

  setupMusic();
});

// ---------- Music ----------
// 1. If music/song.mp3 exists, plays just that (audio only, small button).
// 2. Otherwise plays "Tum Se Hi" from YouTube in a small corner player
//    (tries each ID in order if one can't be embedded).
// 3. If YouTube fails too, plays the original tune in music/song.m4a.
const SONG_TITLE = "Tum Se Hi 🎶";
const MP3 = "music/song.mp3";
const YT_IDS = ["mt9xg0mmt28", "_iW51b--Q9w", "3TxI1HH2JK8"];

function setupMusic() {
  const get = (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} };
  const wantsMusic = () => get("music") !== "off";

  const box = document.createElement("div");
  box.id = "mini-player";
  box.className = "audio-only";
  box.innerHTML = `
    <div class="mp-head">
      <span class="mp-title">${SONG_TITLE}</span>
      <button class="mp-btn" title="Play / pause">▶</button>
    </div>`;
  document.body.appendChild(box);
  const btn = box.querySelector(".mp-btn");
  box.addEventListener("click", (e) => e.stopPropagation());

  let player = null, idIndex = 0, audio = null;
  const saveTime = () => {
    const t = audio ? audio.currentTime : player && player.getCurrentTime ? player.getCurrentTime() : 0;
    if (t) set("musicTime", t);
  };
  window.addEventListener("pagehide", saveTime);
  setInterval(saveTime, 2000);
  const startAt = Math.floor(parseFloat(get("musicTime")) || 0);

  const setPlaying = (on) => { btn.textContent = on ? "❚❚" : "▶"; box.classList.toggle("playing", on); };
  const play = () => {
    if (audio) audio.play().catch(() => {});
    else if (player && player.playVideo) player.playVideo();
  };
  const pause = () => {
    if (audio) audio.pause();
    else if (player && player.pauseVideo) player.pauseVideo();
  };
  btn.addEventListener("click", () => {
    if (box.classList.contains("playing")) { pause(); set("music", "off"); }
    else { set("music", "on"); play(); }
  });
  // Browsers block sound until the first tap, so start on her first tap anywhere.
  document.addEventListener("pointerdown", () => { if (wantsMusic() && !box.classList.contains("playing")) play(); }, { once: true });

  function useAudio(el, title) {
    if (player && player.destroy) player.destroy();
    const v = box.querySelector(".mp-video");
    if (v) v.remove();
    box.className = "audio-only";
    if (title) box.querySelector(".mp-title").textContent = title;
    audio = el;
    audio.loop = true;
    audio.volume = 0.7;
    audio.addEventListener("play", () => setPlaying(true));
    audio.addEventListener("pause", () => setPlaying(false));
    const seek = () => { if (startAt && audio.duration) audio.currentTime = startAt % audio.duration; };
    if (audio.readyState >= 1) seek(); else audio.addEventListener("loadedmetadata", seek, { once: true });
    if (wantsMusic()) play();
  }
  const useTune = () => useAudio(new Audio("music/song.m4a"), "a little tune for you 🎵");

  function startYouTube() {
    box.className = "";
    box.insertAdjacentHTML("beforeend", `<div class="mp-video"><div id="yt-slot"></div></div>`);
    window.onYouTubeIframeAPIReady = () => {
      player = new YT.Player("yt-slot", {
        width: 200, height: 113, videoId: YT_IDS[0],
        playerVars: { start: startAt, loop: 1, playlist: YT_IDS[0], playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => { player.setVolume(70); if (wantsMusic()) play(); },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
            if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
            if (e.data === YT.PlayerState.ENDED) { player.seekTo(0); player.playVideo(); }
          },
          onError: () => {
            idIndex++;
            if (idIndex < YT_IDS.length) player.loadVideoById({ videoId: YT_IDS[idIndex], startSeconds: 0 });
            else useTune();
          }
        }
      });
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.onerror = useTune; // offline / blocked
    document.head.appendChild(tag);
  }

  // Check for the mp3 first
  const mp3 = new Audio();
  mp3.preload = "metadata";
  mp3.addEventListener("loadedmetadata", () => useAudio(mp3), { once: true });
  mp3.addEventListener("error", startYouTube, { once: true });
  mp3.src = MP3;
}

// ---------- Heart rain (used on big moments) ----------
// Drops emojis from the top of the screen for `ms` milliseconds.
function heartRain(ms = 4000, icons = ["💗", "💕", "🌸", "✨", "💖"]) {
  const end = Date.now() + ms;
  (function drop() {
    if (Date.now() > end) return;
    const h = document.createElement("span");
    h.className = "rain";
    h.textContent = icons[Math.floor(Math.random() * icons.length)];
    h.style.left = Math.random() * 100 + "vw";
    h.style.fontSize = 16 + Math.random() * 22 + "px";
    const dur = 2.5 + Math.random() * 2.5;
    h.style.animationDuration = dur + "s";
    document.body.appendChild(h);
    setTimeout(() => h.remove(), dur * 1000);
    setTimeout(drop, 70);
  })();
}

document.addEventListener("DOMContentLoaded", () => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Night mode ----------
  // Turns into a starry sky from 8pm to 6am. The 🌙/☀️ button switches it by hand.
  const getTheme = () => { try { return localStorage.getItem("theme"); } catch (e) { return null; } };
  const hour = new Date().getHours();
  const autoNight = hour >= 20 || hour < 6;
  let night = getTheme() ? getTheme() === "night" : autoNight;

  const sky = document.createElement("div");
  sky.id = "sky";
  for (let i = 0; i < 90; i++) {
    const s = document.createElement("i");
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.animationDelay = Math.random() * 4 + "s";
    const size = Math.random() < 0.15 ? 3 : 2;
    s.style.width = s.style.height = size + "px";
    sky.appendChild(s);
  }
  document.body.prepend(sky);
  if (!calm) setInterval(() => {
    if (!night) return;
    const st = document.createElement("b");
    st.className = "shooting";
    st.style.left = 20 + Math.random() * 70 + "%";
    st.style.top = Math.random() * 40 + "%";
    sky.appendChild(st);
    setTimeout(() => st.remove(), 1500);
  }, 5000);

  const tbtn = document.createElement("button");
  tbtn.id = "theme-btn";
  tbtn.setAttribute("aria-label", "Switch day / night");
  document.body.appendChild(tbtn);
  const applyTheme = () => {
    document.body.classList.toggle("night", night);
    tbtn.textContent = night ? "☀️" : "🌙";
  };
  applyTheme();
  tbtn.addEventListener("click", (e) => {
    e.stopPropagation();
    night = !night;
    try { localStorage.setItem("theme", night ? "night" : "day"); } catch (err) {}
    applyTheme();
  });

  // ---------- Little hearts follow the mouse (computers only) ----------
  if (!calm && matchMedia("(pointer: fine)").matches) {
    let last = 0;
    document.addEventListener("pointermove", (e) => {
      const now = Date.now();
      if (now - last < 60) return;
      last = now;
      const t = document.createElement("span");
      t.className = "trail";
      t.textContent = night ? "✨" : "💗";
      t.style.left = e.clientX + "px";
      t.style.top = e.clientY + "px";
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 800);
    });
  }

  // ---------- Secret: tap her photo on the home page 5 times ----------
  // ✏️ Change the secret note to whatever you want her to find.
  let taps = 0, tapTimer;
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".hero-photo")) return;
    taps++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => (taps = 0), 2500);
    if (taps < 5) return;
    taps = 0;
    heartRain(3000);
    const m = document.createElement("div");
    m.className = "modal open";
    m.innerHTML = `
      <div class="letter-paper">
        <button class="close-x" aria-label="Close">✕</button>
        <h2>You found the secret 🤫</h2>
        <p>Okay, I didn't think you'd actually tap that many times.</p>
        <p>Since you're here: I smile every time I see your name pop up on my phone. Every single time. Don't tell anyone. 🙈</p>
        <p class="sign">— D ♡</p>
      </div>`;
    m.addEventListener("click", (ev) => { if (ev.target === m || ev.target.closest(".close-x")) m.remove(); });
    document.body.appendChild(m);
  });
});

// ---------- Hidden "I love you" ----------
// Two secret doors: a rare golden heart that floats by on any page,
// and the ♡ next to the signature in the letter.
// ✏️ Write these in your own words. The lines appear one by one, then the big words, then the last line.
const LOVE_LINES = [
  "I've been trying to find the right way to say this for a while now.",
  "Not in a big, loud way. Just honestly.",
  "You make ordinary days feel softer. Your name on my screen still makes me smile like an idiot.",
  "And on your hardest days, I wished I could carry some of it for you, even a little.",
  "And the best part of my day? You sitting behind me on the bike. Even when your house is the opposite way. Especially then. 🏍️",
  "So here it is. Quietly. No pressure attached:"
];
const LOVE_WORDS = "I love you, Simran.";
const LOVE_AFTER = "Not because you have to say it back. Just because you deserve to know that someone does, completely. 🤍";

function revealLove() {
  if (document.getElementById("love")) return;
  const o = document.createElement("div");
  o.id = "love";
  const box = document.createElement("div");
  box.className = "love-box";
  o.appendChild(box);

  let t = 0.8; // seconds
  LOVE_LINES.forEach((line) => {
    const p = document.createElement("p");
    p.className = "love-line";
    p.textContent = line;
    p.style.animationDelay = t + "s";
    box.appendChild(p);
    t += 0.9 + line.length * 0.035; // longer lines stay a bit longer before the next
  });

  t += 0.6;
  const h = document.createElement("h1");
  // Each word is kept together so a name like "Simran" never breaks across lines.
  let k = 0;
  LOVE_WORDS.split(" ").forEach((word, w) => {
    if (w) { h.appendChild(document.createTextNode(" ")); k++; }
    const wordEl = document.createElement("span");
    wordEl.className = "love-word";
    [...word].forEach((ch) => {
      const sp = document.createElement("span");
      sp.textContent = ch;
      sp.style.animationDelay = t + k++ * 0.14 + "s";
      wordEl.appendChild(sp);
    });
    h.appendChild(wordEl);
  });
  box.appendChild(h);
  const bigAt = t + LOVE_WORDS.length * 0.14;

  const after = document.createElement("p");
  after.className = "love-line love-after";
  after.textContent = LOVE_AFTER;
  after.style.animationDelay = bigAt + 1.2 + "s";
  box.appendChild(after);

  const sign = document.createElement("p");
  sign.className = "love-line love-sign";
  sign.textContent = "— Dhruv ♡";
  sign.style.animationDelay = bigAt + 2.4 + "s";
  box.appendChild(sign);

  const hint = document.createElement("small");
  hint.textContent = "tap anywhere to close";
  hint.style.animationDelay = bigAt + 3.5 + "s";
  o.appendChild(hint);

  // Closing only works once everything has appeared, so a stray tap doesn't cut it short.
  let canClose = false;
  setTimeout(() => (canClose = true), (bigAt + 3.5) * 1000);
  o.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!canClose) return;
    o.classList.add("bye");
    setTimeout(() => o.remove(), 600);
  });
  document.body.appendChild(o);
  setTimeout(() => heartRain(6000, ["💗", "💖", "💕", "❤️"]), (bigAt - 0.5) * 1000);
  try { localStorage.setItem("foundLove", "yes"); } catch (e) {}
}

document.addEventListener("DOMContentLoaded", () => {
  if (!SHOW_LOVE) {
    document.querySelectorAll('a[href="question.html"]').forEach((a) => a.remove());
    return;
  }
  // Golden heart: sits quietly in the bottom-left corner, above the 🌙 button. Tap it to open the message.
  // The "tap me" label shows until she's opened it once.
  const g = document.createElement("button");
  g.className = "golden";
  g.setAttribute("aria-label", "a golden heart, tap me");
  let found = false;
  try { found = localStorage.getItem("foundLove") === "yes"; } catch (e) {}
  g.innerHTML = found ? "💛" : "💛<small>tap me</small>";
  g.addEventListener("click", (e) => {
    e.stopPropagation();
    const label = g.querySelector("small");
    if (label) label.remove();
    revealLove();
  });
  document.body.appendChild(g);

  // The ♡ in the letter's signature
  document.querySelectorAll(".sign").forEach((sig) => {
    if (!sig.innerHTML.includes("♡")) return;
    sig.innerHTML = sig.innerHTML.replace("♡", '<span class="secret-heart">♡</span>') + '<small class="tap-hint">psst… tap the ♡</small>';
    const sh = sig.querySelector(".secret-heart");
    if (sh) sh.addEventListener("click", (e) => { e.stopPropagation(); revealLove(); });
  });
});

// ---------- Little secrets ----------
// Small surprises she finds on her own. ✏️ Change any of the lines below.

// A small message that slides in from the top for a few seconds.
function toast(text, ms = 3800) {
  if (document.body.classList.contains("stage-mode")) return; // stay quiet during the proposal
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("bye"), ms);
  setTimeout(() => t.remove(), ms + 500);
}
// Runs fn once the lock screen is gone.
function afterGate(fn) {
  if (document.getElementById("gate")) return setTimeout(() => afterGate(fn), 400);
  fn();
}

document.addEventListener("DOMContentLoaded", () => {
  const sGet = (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
  const sSet = (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} };

  // 1. Greeting by time of day + visit counter (once per visit, on the first page she lands on)
  if (!sGet("greeted")) {
    sSet("greeted", "1");
    let visits = 1;
    try { visits = (parseInt(localStorage.getItem("visits"), 10) || 0) + 1; localStorage.setItem("visits", visits); } catch (e) {}
    const now = new Date();
    const h = now.getHours();
    const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const hello =
      h >= 1 && h < 5 ? `It's ${time}. Why are you awake? Go sleep 😴 (after this, obviously)` :
      h < 12 ? "Good morning, sunshine ☀️" :
      h < 17 ? "Hope your day is being nice to you 🌼" :
      h < 21 ? "Evening! Did you eat something? 🍜" :
      "Night owl mode on 🌙";
    const visitLines = [
      "Welcome back 🌷",
      "Back again? I'm not complaining 😌",
      "Someone's obsessed 👀",
      "At this point you live here 🏡",
      "Okay, I'm officially flattered 🙈"
    ];
    afterGate(() => {
      setTimeout(() => toast(hello), 1500);
      if (visits > 1) setTimeout(() => toast(`Visit #${visits}. ${visitLines[Math.min(visits - 2, visitLines.length - 1)]}`), 6000);
    });
  }

  // 2. Tab title changes when she leaves and comes back
  const title = document.title;
  let backTimer;
  document.addEventListener("visibilitychange", () => {
    clearTimeout(backTimer);
    if (document.hidden) document.title = "Come back 🥺";
    else { document.title = "Yay, you're back 💗"; backTimer = setTimeout(() => (document.title = title), 2500); }
  });

  // 3. Press and hold the ♡ in the logo
  const logo = document.querySelector(".logo");
  if (logo) {
    logo.innerHTML = logo.innerHTML.replace("♡", '<span class="logo-heart">♡</span>');
    let holdTimer, held = false;
    const start = () => {
      held = false;
      holdTimer = setTimeout(() => {
        held = true;
        logo.classList.add("held");
        toast("Careful… you're holding my heart 🫣");
        heartRain(1500);
        setTimeout(() => logo.classList.remove("held"), 1200);
      }, 800);
    };
    const stop = () => clearTimeout(holdTimer);
    logo.addEventListener("pointerdown", start);
    logo.addEventListener("pointerup", stop);
    logo.addEventListener("pointerleave", stop);
    logo.addEventListener("contextmenu", (e) => e.preventDefault());
    logo.addEventListener("click", (e) => { if (held) { e.preventDefault(); held = false; } });
  }

  // 4. Sitting still on a page for a while
  let idleTimer, idleShown = false;
  const resetIdle = () => {
    clearTimeout(idleTimer);
    if (idleShown) return;
    idleTimer = setTimeout(() => {
      if (document.hidden || document.getElementById("gate") || document.getElementById("love")) return resetIdle();
      idleShown = true;
      toast("Still here? I like that. 🙈");
    }, 45000);
  };
  ["pointerdown", "keydown", "scroll", "pointermove"].forEach((ev) => addEventListener(ev, resetIdle, { passive: true }));
  resetIdle();

  // 5. Copying text from the site
  document.addEventListener("copy", () => toast("Stealing my words? Keep them, they're yours 💌"));

  // 6. Typing "dhruv" on a keyboard (not inside a text box)
  let typed = "";
  document.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea")) return;
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-5);
    if (typed === "dhruv") { typed = ""; toast("You called? 👀 I'm one text away."); }
  });
});

// ---------- UI polish ----------
document.addEventListener("DOMContentLoaded", () => {
  const page = location.pathname.split("/").pop() || "index.html";

  // Remember which pages she has opened, and show progress on the home page.
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem("seenPages")) || []; } catch (e) {}
  if (!seen.includes(page)) { seen.push(page); try { localStorage.setItem("seenPages", JSON.stringify(seen)); } catch (e) {} }
  const cards = document.querySelectorAll(".cards .card");
  if (cards.length) {
    let done = 0;
    cards.forEach((c) => {
      if (seen.includes(c.getAttribute("href"))) { c.classList.add("seen"); done++; }
    });
    const p = document.createElement("div");
    p.className = "explored";
    p.innerHTML = `<span></span><div class="explored-bar"><div></div></div>`;
    p.querySelector("span").textContent = done === cards.length
      ? "You've explored everything 🌸 (but the secrets are still hiding 👀)"
      : `You've explored ${done} of ${cards.length} 🌸`;
    p.querySelector(".explored-bar div").style.width = (done / cards.length) * 100 + "%";
    cards[0].parentElement.before(p);
  }

  // Gradient ring around her photo on the home page
  const photo = document.querySelector(".hero-photo");
  if (photo) {
    const ring = document.createElement("div");
    ring.className = "photo-ring";
    photo.before(ring);
    ring.appendChild(photo);
  }

  // Thin progress bar at the top while scrolling
  const bar = document.createElement("div");
  bar.id = "scroll-bar";
  document.body.appendChild(bar);
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Phone menu: ☰ turns into ✕, and closes after picking a page or tapping outside
  const menuBtn = document.querySelector(".menu-btn");
  const links = document.querySelector(".nav-links");
  if (menuBtn && links) {
    const sync = () => (menuBtn.textContent = links.classList.contains("open") ? "✕" : "☰");
    menuBtn.addEventListener("click", () => setTimeout(sync));
    links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { links.classList.remove("open"); sync(); }));
    document.addEventListener("click", (e) => {
      if (links.classList.contains("open") && !e.target.closest("nav")) { links.classList.remove("open"); sync(); }
    });
  }

  // Cards tilt a little toward the mouse (computers only)
  if (matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".card").forEach((c) => {
      c.addEventListener("pointermove", (e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = `perspective(700px) rotateX(${-y * 10}deg) rotateY(${x * 12}deg) translateY(-6px)`;
        c.style.setProperty("--mx", (x + 0.5) * 100 + "%");
        c.style.setProperty("--my", (y + 0.5) * 100 + "%");
      });
      c.addEventListener("pointerleave", () => (c.style.transform = ""));
    });
  }
});
