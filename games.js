// ===== Game corner (Smile Zone) =====
// ✏️ Easy things to edit are at the top of each game.
(function () {
  const overlay = document.getElementById("game");
  if (!overlay) return;
  const title = document.getElementById("gameTitle");
  const body = document.getElementById("gameBody");
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const waBtn = (text, label) => {
    const url = typeof waLink === "function" && waLink(text);
    return url ? `<a class="btn" target="_blank" rel="noopener" href="${url}">${label}</a>` : "";
  };
  let cleanup = null;

  function openGame(name) {
    if (cleanup) cleanup();
    cleanup = null;
    body.innerHTML = "";
    overlay.classList.add("open");
    document.documentElement.style.overflow = "hidden";
    GAMES[name]();
  }
  function closeGame() {
    if (cleanup) cleanup();
    cleanup = null;
    overlay.classList.remove("open");
    document.documentElement.style.overflow = "";
    refreshBests();
  }
  document.getElementById("gameClose").addEventListener("click", closeGame);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("open")) closeGame(); });
  document.querySelectorAll(".game-card").forEach((c) => c.addEventListener("click", () => openGame(c.dataset.game)));

  function refreshBests() {
    const r = store.get("rideBest"), t = store.get("totDone"), p = store.get("puzzleBest");
    document.getElementById("best-ride").textContent = r ? `best: ${r} 🏆` : "";
    document.getElementById("best-tot").textContent = t ? "played ✓" : "";
    document.getElementById("best-puzzle").textContent = p ? `best: ${p} moves 🏆` : "";
  }
  refreshBests();

  const GAMES = {
    // ---------------- 🏍️ Back seat ride ----------------
    ride() {
      const GOOD = [["💗", 1], ["🌸", 1], ["☕", 2], ["🍦", 2], ["💌", 3]]; // emoji, points
      const BAD = "🕳️";      // pothole: lose 3 points
      const SECONDS = 30;
      title.textContent = "Back seat ride 🏍️";
      body.innerHTML = `
        <p class="game-sub">Drag the bike (or use ← →). Catch the good stuff, dodge the 🕳️ potholes.</p>
        <div class="ride-hud"><span id="rScore">0 pts</span><span id="rTime">${SECONDS}s</span></div>
        <div class="ride-wrap"><canvas id="rideCanvas"></canvas>
          <div class="ride-msg" id="rideMsg"><button class="btn" id="rideStart">Start the ride 🏍️</button></div>
        </div>`;
      const cv = document.getElementById("rideCanvas");
      const ctx = cv.getContext("2d");
      const msg = document.getElementById("rideMsg");
      let W, H, dpr, bikeX, items, score, left, last, spawnT, raf, running = false, keys = {}, shake = 0, pops = [];
      function size() {
        const r = cv.getBoundingClientRect();
        dpr = window.devicePixelRatio || 1;
        W = r.width; H = r.height;
        cv.width = W * dpr; cv.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (bikeX == null) bikeX = W / 2;
        draw();
      }
      function reset() { items = []; pops = []; score = 0; left = SECONDS; spawnT = 0; bikeX = W / 2; }
      function spawn() {
        const bad = Math.random() < 0.22 + (SECONDS - left) * 0.006;
        const g = GOOD[Math.floor(Math.random() * GOOD.length)];
        items.push({ x: 24 + Math.random() * (W - 48), y: -30, e: bad ? BAD : g[0], p: bad ? -3 : g[1], v: 140 + Math.random() * 60 + (SECONDS - left) * 6 });
      }
      function draw() {
        ctx.clearRect(0, 0, W, H);
        // road
        ctx.save();
        if (shake > 0) ctx.translate((Math.random() - 0.5) * 8, 0);
        ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 4; ctx.setLineDash([22, 22]);
        ctx.lineDashOffset = -(performance.now() / 6) % 44;
        ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
        ctx.setLineDash([]);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = "30px serif";
        (items || []).forEach((it) => ctx.fillText(it.e, it.x, it.y));
        ctx.font = "44px serif";
        ctx.save(); ctx.translate(bikeX, H - 40); ctx.scale(-1, 1); ctx.fillText("🏍️", 0, 0); ctx.restore();
        ctx.font = "bold 18px Quicksand, sans-serif";
        pops.forEach((p) => { ctx.globalAlpha = p.a; ctx.fillStyle = p.c; ctx.fillText(p.t, p.x, p.y); });
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      function step(t) {
        const dt = Math.min(0.05, (t - last) / 1000); last = t;
        left -= dt;
        if (keys.ArrowLeft) bikeX -= 360 * dt;
        if (keys.ArrowRight) bikeX += 360 * dt;
        bikeX = Math.max(22, Math.min(W - 22, bikeX));
        spawnT -= dt;
        if (spawnT <= 0) { spawn(); spawnT = Math.max(0.32, 0.75 - (SECONDS - left) * 0.012); }
        items.forEach((it) => { it.y += it.v * dt; });
        items = items.filter((it) => {
          if (it.y > H - 66 && it.y < H - 14 && Math.abs(it.x - bikeX) < 34) {
            score = Math.max(0, score + it.p);
            pops.push({ x: it.x, y: it.y - 10, t: (it.p > 0 ? "+" : "") + it.p, c: it.p > 0 ? "#e8507f" : "#555", a: 1 });
            if (it.p < 0) { shake = 0.25; if (navigator.vibrate) navigator.vibrate(60); }
            return false;
          }
          return it.y < H + 30;
        });
        pops.forEach((p) => { p.y -= 40 * dt; p.a -= dt * 1.6; });
        pops = pops.filter((p) => p.a > 0);
        shake -= dt;
        document.getElementById("rScore").textContent = score + " pts";
        document.getElementById("rTime").textContent = Math.max(0, Math.ceil(left)) + "s";
        draw();
        if (left <= 0) return end();
        raf = requestAnimationFrame(step);
      }
      function start() {
        reset(); running = true; msg.style.display = "none";
        last = performance.now(); raf = requestAnimationFrame(step);
      }
      function end() {
        running = false;
        const best = Math.max(score, store.get("rideBest") || 0);
        const isBest = score > 0 && score === best && score !== (store.get("rideBest") || 0);
        store.set("rideBest", best);
        const line = score >= 40 ? "Okay, you're officially the best pillion rider ever. 🏆"
          : score >= 20 ? "Smooth ride! You can sit behind me any day. Every day, actually. 😌"
          : "Bumpy ride… good thing I'm driving the real one. 😜";
        msg.innerHTML = `<div class="ride-end"><div class="big">${score} pts</div>
          <p>${isBest ? "New best! 🎉<br>" : `best: ${best}<br>`}${line}</p>
          <div class="game-btns"><button class="btn" id="rideStart">Ride again 🔁</button>
          ${waBtn(`I scored ${score} on Back seat ride 🏍️ Beat that 😌`, "Send my score 💬")}</div></div>`;
        msg.style.display = "";
        document.getElementById("rideStart").addEventListener("click", start);
        if (score >= 20 && typeof heartRain === "function") heartRain(1800);
      }
      const move = (e) => { const r = cv.getBoundingClientRect(); bikeX = e.clientX - r.left; if (!running) draw(); };
      cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); move(e); });
      cv.addEventListener("pointermove", (e) => { if (e.buttons || e.pointerType !== "mouse") move(e); else if (running) move(e); });
      const kd = (e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { keys[e.key] = true; e.preventDefault(); } };
      const ku = (e) => { keys[e.key] = false; };
      window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
      window.addEventListener("resize", size);
      document.getElementById("rideStart").addEventListener("click", start);
      requestAnimationFrame(size);
      cleanup = () => { cancelAnimationFrame(raf); running = false; window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); window.removeEventListener("resize", size); };
    },

    // ---------------- 🤔 This or That ----------------
    tot() {
      const PAIRS = [
        ["Chai ☕", "Coffee ☕"],
        ["Mountains 🏔️", "Beach 🏖️"],
        ["Sunrise 🌅", "Sunset 🌇"],
        ["Rain 🌧️", "Winter ❄️"],
        ["Calls 📞", "Texts 💬"],
        ["Pani puri 🥟", "Momos 🥟"],
        ["Movie at home 🛋️", "Movie in theatre 🎬"],
        ["Long ride 🏍️", "Long walk 🚶‍♀️"],
        ["Ice cream 🍦", "Chocolate 🍫"],
        ["Hugs 🫂", "Forehead kisses 😚"],
        ["Me picking you up 🏍️", "Me dropping you home 🏡"]
      ];
      const REACT = ["Noted. 📝", "Same!! 🙌", "Good choice 😌", "Knew it 👀", "Interesting… 🤔", "Correct answer 💯", "Saving this for later 😏"];
      title.textContent = "This or That 🤔";
      let i = 0; const picks = [];
      function show() {
        if (i >= PAIRS.length) return finish();
        const [a, b] = PAIRS[i];
        body.innerHTML = `
          <div class="quiz-progress"><div style="width:${(i / PAIRS.length) * 100}%"></div></div>
          <p class="game-sub">${i + 1} of ${PAIRS.length} · pick fast, don't think</p>
          <div class="tot">
            <button class="tot-opt" data-k="0">${esc(a)}</button>
            <span class="tot-or">or</span>
            <button class="tot-opt" data-k="1">${esc(b)}</button>
          </div>
          <p class="tot-react" id="totReact">&nbsp;</p>`;
        body.querySelectorAll(".tot-opt").forEach((btn) => btn.addEventListener("click", () => {
          body.querySelectorAll(".tot-opt").forEach((x) => (x.disabled = true));
          btn.classList.add("picked");
          picks.push(PAIRS[i][+btn.dataset.k]);
          document.getElementById("totReact").textContent = REACT[Math.floor(Math.random() * REACT.length)];
          i++;
          setTimeout(show, 750);
        }));
      }
      function finish() {
        store.set("totDone", true);
        const list = picks.map((p) => `<li>${esc(p)}</li>`).join("");
        const text = "My This or That answers 🤔\n" + picks.map((p) => "• " + p).join("\n");
        body.innerHTML = `
          <p class="game-sub">Okay, so this is you:</p>
          <ul class="tot-list">${list}</ul>
          <p class="tot-end">Now I know exactly how to plan our next day out. 😌</p>
          <div class="game-btns">${waBtn(text, "Send me your answers 💬")}
          <button class="btn ghost" id="totAgain">Play again 🔁</button></div>`;
        document.getElementById("totAgain").addEventListener("click", () => { i = 0; picks.length = 0; show(); });
      }
      show();
    },

    // ---------------- 🧩 Photo puzzle ----------------
    puzzle() {
      // ✏️ Photos for the puzzle: [file, width, height]. Tap "Another photo" to switch.
      const PICS = [
        ["images/simran.jpg", 500, 500],
        ["images/thumbs/photo17.jpg", 600, 527],
        ["images/thumbs/photo16.jpg", 450, 600]
      ];
      const DONE_LINES = [
        "Perfect. Just like the original. 💗",
        "See? You always fit right where you belong. 🧩",
        "Fun fact: you're the missing piece in my life too. 😌"
      ];
      const N = 3;
      title.textContent = "Photo puzzle 🧩";
      let pic = 0, order, sel = null, moves;
      function build() {
        const [src, w, h] = PICS[pic];
        order = [...Array(N * N).keys()];
        do { for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; } }
        while (order.every((v, k) => v === k));
        moves = 0; sel = null;
        body.innerHTML = `
          <p class="game-sub">Tap two pieces to swap them. <span id="pMoves">0 moves</span></p>
          <div class="puzzle" id="board" style="aspect-ratio:${w}/${h};width:min(100%, calc(56dvh * ${w / h}))"></div>
          <div class="puzzle-done" id="pDone"></div>
          <div class="game-btns"><button class="btn ghost" id="pShuffle">Shuffle 🔀</button>
          <button class="btn ghost" id="pNext">Another photo 📸</button></div>`;
        const board = document.getElementById("board");
        board.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
        render();
        board.addEventListener("click", (e) => {
          const t = e.target.closest(".piece");
          if (!t || board.classList.contains("solved")) return;
          const k = +t.dataset.pos;
          if (sel === null) { sel = k; t.classList.add("sel"); return; }
          if (sel !== k) { [order[sel], order[k]] = [order[k], order[sel]]; moves++; }
          sel = null; render();
          if (order.every((v, j) => v === j)) solved();
        });
        document.getElementById("pShuffle").addEventListener("click", build);
        document.getElementById("pNext").addEventListener("click", () => { pic = (pic + 1) % PICS.length; build(); });
      }
      function render() {
        const [src] = PICS[pic];
        const board = document.getElementById("board");
        board.innerHTML = order.map((v, k) => {
          const x = (v % N) * (100 / (N - 1)), y = Math.floor(v / N) * (100 / (N - 1));
          return `<button class="piece${v === k ? " ok" : ""}" data-pos="${k}" style="background-image:url('${src}');background-size:${N * 100}% ${N * 100}%;background-position:${x}% ${y}%"></button>`;
        }).join("");
        document.getElementById("pMoves").textContent = moves + (moves === 1 ? " move" : " moves");
      }
      function solved() {
        const board = document.getElementById("board");
        board.classList.add("solved");
        const best = store.get("puzzleBest");
        if (!best || moves < best) store.set("puzzleBest", moves);
        document.getElementById("pDone").innerHTML = `<b>Solved in ${moves} moves! 🎉</b><br>${DONE_LINES[Math.floor(Math.random() * DONE_LINES.length)]}`;
        if (typeof heartRain === "function") heartRain(2000);
      }
      build();
    }
  };
})();
