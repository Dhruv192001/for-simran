// Shared stuff for every page: nav, floating hearts, click sparkles, music, fade-ins.

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
