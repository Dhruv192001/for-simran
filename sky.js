// ===== ✨ Our constellation (Memories page) =====
// Tap the stars: each one shows a little line. Light them all and they make a heart.
// ✏️ Edit the lines below (keep 10, one per star, going around the heart).
const SKY_LINES = [
  "The first time you smiled at me. Game over. ✨",
  "Every \"reached home?\" text. 🏡",
  "You saying \"tum mat aao, ulta route hai\". And me coming anyway. 🏍️",
  "12 November. Your arms around me on the bike. 🤍",
  "Your laugh when you're trying really hard not to laugh. 😄",
  "The way you go quiet when you're thinking.",
  "Every time you forgave me. Even when I didn't deserve it.",
  "You telling me before you sleep. Small thing. Big thing. 🌙",
  "That side smile in the garden photo. 🌿",
  "Every day I get to know you a little more. 💫"
];
const SKY_FINAL = "Of all the stars in the sky, you're the one I'd find first. Every single time. 💗";

(function sky() {
  const card = document.getElementById("skyCard");
  if (!card) return;
  const NS = "http://www.w3.org/2000/svg";
  const n = SKY_LINES.length;
  // points on a heart curve
  const pts = [...Array(n)].map((_, k) => {
    const t = (Math.PI * 2 * k) / n;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [50 + x * 2.5, 46 - y * 2.5];
  });

  const ov = document.createElement("div");
  ov.id = "constellation";
  ov.innerHTML = `
    <button class="close-x sky-x" aria-label="Close">×</button>
    <div class="sky-top"><h2>Our constellation</h2><p id="skyHint">Tap a star ✨</p></div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" id="skySvg">
      <defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <g id="skyDust"></g><g id="skyLinks"></g><g id="skyStars"></g>
    </svg>
    <div class="sky-line" id="skyLine"></div>`;
  document.body.appendChild(ov);
  const svg = ov.querySelector("#skySvg");
  const dust = ov.querySelector("#skyDust"), links = ov.querySelector("#skyLinks"), starsG = ov.querySelector("#skyStars");
  const lineEl = ov.querySelector("#skyLine"), hint = ov.querySelector("#skyHint");

  // background twinkles
  for (let k = 0; k < 70; k++) {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", (Math.random() * 100).toFixed(1));
    c.setAttribute("cy", (Math.random() * 100).toFixed(1));
    c.setAttribute("r", (Math.random() * 0.35 + 0.1).toFixed(2));
    c.setAttribute("class", "dust");
    c.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";
    dust.appendChild(c);
  }

  let lit;
  function build() {
    lit = new Array(n).fill(false);
    links.innerHTML = ""; starsG.innerHTML = "";
    ov.classList.remove("done");
    lineEl.classList.remove("show"); lineEl.textContent = "";
    hint.textContent = "Tap a star ✨";
    pts.forEach(([x, y], k) => {
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "star");
      g.style.setProperty("--d", (k * 0.37).toFixed(2) + "s");
      g.innerHTML = `<circle cx="${x}" cy="${y}" r="5" class="hit"/><circle cx="${x}" cy="${y}" r="1.1" class="core" filter="url(#glow)"/>`;
      g.addEventListener("click", () => light(k));
      starsG.appendChild(g);
    });
  }
  function link(a, b) {
    const [x1, y1] = pts[a], [x2, y2] = pts[b];
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", x1); l.setAttribute("y1", y1); l.setAttribute("x2", x2); l.setAttribute("y2", y2);
    const len = Math.hypot(x2 - x1, y2 - y1);
    l.style.strokeDasharray = len; l.style.strokeDashoffset = len;
    links.appendChild(l);
    requestAnimationFrame(() => requestAnimationFrame(() => (l.style.strokeDashoffset = 0)));
  }
  function say(t) {
    lineEl.classList.remove("show");
    setTimeout(() => { lineEl.textContent = t; lineEl.classList.add("show"); }, 200);
  }
  function light(k) {
    say(SKY_LINES[k]);
    if (lit[k]) return;
    lit[k] = true;
    starsG.children[k].classList.add("lit");
    [(k + n - 1) % n, (k + 1) % n].forEach((j) => { if (lit[j]) link(j, k); });
    const count = lit.filter(Boolean).length;
    hint.textContent = count < n ? `${count} of ${n} stars ✨` : "";
    if (count === n) {
      setTimeout(() => {
        // draw a smooth glowing heart over the star lines
        let d = "";
        for (let i = 0; i <= 120; i++) {
          const t = (Math.PI * 2 * i) / 120;
          const x = 50 + 16 * Math.pow(Math.sin(t), 3) * 2.5;
          const y = 46 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 2.5;
          d += (i ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
        }
        const h = document.createElementNS(NS, "path");
        h.setAttribute("d", d); h.setAttribute("class", "sky-heart");
        links.appendChild(h);
        const L = h.getTotalLength();
        h.style.strokeDasharray = L; h.style.strokeDashoffset = L;
        requestAnimationFrame(() => requestAnimationFrame(() => (h.style.strokeDashoffset = 0)));
        ov.classList.add("done");
        say(SKY_FINAL);
        hint.innerHTML = `<button class="btn ghost sky-again">See it again 🔁</button>`;
        hint.querySelector(".sky-again").addEventListener("click", build);
        if (typeof heartRain === "function") heartRain(2600, ["✨", "💗", "⭐", "🤍"]);
        if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
      }, 900);
    }
  }
  build();
  const open = () => { ov.classList.add("open"); document.documentElement.style.overflow = "hidden"; };
  const close = () => { ov.classList.remove("open"); document.documentElement.style.overflow = ""; };
  card.addEventListener("click", open);
  ov.querySelector(".sky-x").addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
})();
