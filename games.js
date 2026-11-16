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
    const sc = store.get("scanCount"), wl = store.get("wheelLast");
    const bs = document.getElementById("best-scan"), bw = document.getElementById("best-wheel");
    if (bs) bs.textContent = sc ? `machines broken: ${sc} 💥` : "";
    if (bw) bw.textContent = wl ? `last: ${wl}` : "";
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
    },

    // ---------------- 📸 Cuteness scanner ----------------
    scan() {
      // ✏️ The scan steps and the final report.
      const STEPS = [
        "Starting Simran detector…",
        "Face found ✓",
        "Measuring smile… 😊",
        "Checking eyes… dangerously pretty 👀",
        "Analysing vibe… 🌸",
        "Calculating cuteness level…"
      ];
      const REPORT = [
        ["Smile", "10/10"],
        ["Eyes", "11/10 (rule broken)"],
        ["Vibe", "illegal in 3 states"],
        ["Dhruv's heart", "stolen 🫠"]
      ];
      title.textContent = "Cuteness scanner 📸";
      body.innerHTML = `
        <p class="game-sub" id="scSub">Look at the camera. Don't move. Science is happening.</p>
        <div class="scan-frame" id="scFrame">
          <video id="scVid" playsinline muted autoplay></video>
          <img id="scImg" alt="" hidden />
          <i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>
          <div class="scan-line"></div>
          <div class="scan-error" id="scErr">⚠️ ERROR<br><small>CUTENESS LEVEL TOO HIGH</small></div>
        </div>
        <div class="scan-meter"><div id="scBar"></div></div>
        <p class="scan-status" id="scStatus">&nbsp;</p>
        <div id="scResult"></div>
        <div class="game-btns" id="scBtns"><button class="btn" id="scGo">Start scan 🔍</button></div>`;
      const vid = document.getElementById("scVid"), img = document.getElementById("scImg");
      const frame = document.getElementById("scFrame"), bar = document.getElementById("scBar");
      const status = document.getElementById("scStatus");
      let stream = null, timers = [], usingPhoto = false;
      const later = (fn, ms) => timers.push(setTimeout(fn, ms));
      function usePhoto(why) {
        usingPhoto = true;
        vid.hidden = true; img.hidden = false; img.src = "images/simran.jpg";
        document.getElementById("scSub").textContent = why;
      }
      async function camera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return usePhoto("No camera? No problem. Scanning from memory. 😌");
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
          vid.srcObject = stream;
        } catch (e) {
          usePhoto("Camera shy? Fine. Scanning your photo instead. 😌");
        }
      }
      camera();
      function run() {
        timers.forEach(clearTimeout); timers = [];
        frame.classList.remove("broke"); frame.classList.add("scanning");
        document.getElementById("scResult").innerHTML = "";
        document.getElementById("scBtns").innerHTML = "";
        bar.style.transition = "none"; bar.style.width = "0%"; bar.classList.remove("over");
        void bar.offsetWidth;
        const per = 1100;
        bar.style.transition = `width ${per * STEPS.length}ms linear`;
        bar.style.width = "100%";
        STEPS.forEach((t, k) => later(() => (status.textContent = t), k * per));
        later(() => { status.textContent = "Cuteness: 100%… 150%… 400%… 999%…"; bar.classList.add("over"); }, STEPS.length * per);
        later(() => {
          frame.classList.remove("scanning"); frame.classList.add("broke");
          if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
          status.textContent = "💥 Machine broke.";
          const n = (store.get("scanCount") || 0) + 1; store.set("scanCount", n);
          document.getElementById("scResult").innerHTML = `<ul class="scan-report">${REPORT.map(([a, b]) => `<li><span>${esc(a)}</span><b>${esc(b)}</b></li>`).join("")}</ul>
            <p class="tot-end">Conclusion: way too cute. Please be careful with that face. 😌</p>`;
          document.getElementById("scBtns").innerHTML = `<button class="btn" id="scSave">Save my certificate 📸</button>
            ${waBtn("The cuteness scanner broke because of me 😌💥", "Tell him 💬")}
            <button class="btn ghost" id="scGo">Scan again 🔁</button>`;
          document.getElementById("scGo").addEventListener("click", run);
          document.getElementById("scSave").addEventListener("click", save);
          if (typeof heartRain === "function") heartRain(1800);
        }, STEPS.length * per + 1600);
      }
      // A little "Certified cute" picture she can keep.
      function save() {
        const c = document.createElement("canvas");
        c.width = 720; c.height = 900;
        const x = c.getContext("2d");
        const g = x.createLinearGradient(0, 0, 720, 900); g.addColorStop(0, "#ffd6e4"); g.addColorStop(1, "#e3d6ff");
        x.fillStyle = g; x.fillRect(0, 0, 720, 900);
        x.fillStyle = "#fff"; x.fillRect(60, 60, 600, 640);
        const src = usingPhoto ? img : vid;
        const sw = usingPhoto ? img.naturalWidth : vid.videoWidth, sh = usingPhoto ? img.naturalHeight : vid.videoHeight;
        if (sw && sh) {
          const s = Math.max(560 / sw, 560 / sh), dw = sw * s, dh = sh * s;
          x.save(); x.beginPath(); x.rect(80, 80, 560, 560); x.clip();
          if (!usingPhoto) { x.translate(720, 0); x.scale(-1, 1); }
          x.drawImage(src, (720 - dw) / 2, 80 + (560 - dh) / 2, dw, dh);
          x.restore();
        }
        x.fillStyle = "#e8507f"; x.textAlign = "center";
        x.font = "bold 44px Caveat, cursive"; x.fillText("✓ Certified way too cute", 360, 690);
        x.font = "600 26px Quicksand, sans-serif"; x.fillStyle = "#4a2c3a";
        x.fillText("Cuteness level: 999% · Machine: broken", 360, 770);
        x.font = "bold 34px Caveat, cursive"; x.fillStyle = "#e8507f"; x.fillText("for Simran ♡", 360, 840);
        c.toBlob((b) => {
          if (!b) return;
          const a = document.createElement("a");
          a.href = URL.createObjectURL(b); a.download = "certified-cute.png";
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        }, "image/png");
      }
      document.getElementById("scGo").addEventListener("click", run);
      cleanup = () => { timers.forEach(clearTimeout); if (stream) stream.getTracks().forEach((t) => t.stop()); };
    },

    // ---------------- 🎡 Spin the date wheel ----------------
    wheel() {
      // ✏️ Wheel slices: [emoji, plan]. 6–10 works best.
      const SLICES = [
        ["🏍️", "Long ride"],
        ["☕", "Chai date"],
        ["🥟", "Momos run"],
        ["🌇", "Sunset spot"],
        ["🎬", "Movie night"],
        ["🍦", "Ice cream"],
        ["🌙", "Night drive"],
        ["👑", "Your choice"]
      ];
      const COLORS = ["#ffb3c9", "#d9c8ff", "#ffd8a8", "#bfe8d8", "#ffc6e0", "#c8dcff", "#ffe3b3", "#e6c8ff"];
      title.textContent = "Spin the date wheel 🎡";
      body.innerHTML = `
        <p class="game-sub">Tap spin. Whatever it lands on, that's our next plan. No take-backs. 😌</p>
        <div class="wheel-wrap"><div class="wheel-pin">▼</div><canvas id="wheelCv" width="600" height="600"></canvas>
          <button class="wheel-hub" id="wheelHub">SPIN</button></div>
        <div id="wheelOut" class="wheel-out"></div>`;
      const cv = document.getElementById("wheelCv"), x = cv.getContext("2d");
      const n = SLICES.length, arc = (Math.PI * 2) / n;
      let rot = 0, spinning = false;
      function draw() {
        x.clearRect(0, 0, 600, 600);
        x.save(); x.translate(300, 300); x.rotate(rot);
        SLICES.forEach(([e, t], k) => {
          x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 290, k * arc, (k + 1) * arc); x.closePath();
          x.fillStyle = COLORS[k % COLORS.length]; x.fill();
          x.strokeStyle = "#fff"; x.lineWidth = 4; x.stroke();
          x.save(); x.rotate(k * arc + arc / 2);
          x.textAlign = "right"; x.textBaseline = "middle";
          x.font = "42px serif"; x.fillText(e, 270, 0);
          // shrink long names so they never slide under the SPIN button
          let fs = 24;
          x.font = `bold ${fs}px Quicksand, sans-serif`;
          while (x.measureText(t).width > 128 && fs > 14) { fs--; x.font = `bold ${fs}px Quicksand, sans-serif`; }
          x.fillStyle = "#4a2c3a"; x.fillText(t, 222, 2);
          x.restore();
        });
        x.restore();
      }
      draw();
      function spin() {
        if (spinning) return;
        spinning = true;
        document.getElementById("wheelOut").innerHTML = "";
        const pick = Math.floor(Math.random() * n);
        // the pin is at the top (-90°): land the middle of slice `pick` there
        const target = -Math.PI / 2 - (pick * arc + arc / 2) + (Math.random() - 0.5) * arc * 0.6;
        const start = rot;
        let end = target + Math.PI * 2 * 6;
        while (end - start < Math.PI * 2 * 5) end += Math.PI * 2;
        while (end - start > Math.PI * 2 * 7) end -= Math.PI * 2;
        const dur = 4200, t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          rot = start + (end - start) * (1 - Math.pow(1 - p, 4));
          draw();
          if (p < 1) return requestAnimationFrame(tick);
          rot %= Math.PI * 2; spinning = false;
          const [e, plan] = SLICES[pick];
          store.set("wheelLast", `${e} ${plan}`);
          if (navigator.vibrate) navigator.vibrate(40);
          document.getElementById("wheelOut").innerHTML = `<div class="big">${e} ${esc(plan)}</div>
            <p>${plan === "Your choice" ? "You decide. I'll just show up. 🏍️" : "The wheel has spoken. You can't argue with the wheel. 😌"}</p>
            <div class="game-btns">${waBtn(`The wheel says: ${e} ${plan}. When are you picking me up? 🏍️`, "Book it 🏍️")}
            <button class="btn ghost" id="wheelAgain">Spin again 🔁</button></div>`;
          document.getElementById("wheelAgain").addEventListener("click", spin);
          if (typeof heartRain === "function") heartRain(1200, [e, "💗", "✨"]);
        };
        requestAnimationFrame(tick);
      }
      document.getElementById("wheelHub").addEventListener("click", spin);
      cv.addEventListener("click", spin);
    }
  };
})();
