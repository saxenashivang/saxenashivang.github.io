/* BUG RUNNER — Chrome-dino-style endless runner for the ARCADE screen.
   The player character is a chibi version of the portfolio avatar.
   Exposes window.Arcade.setActive(bool) so main.js can start/stop it. */

(function () {
  "use strict";

  const canvas = document.getElementById("runner-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const W = 800, H = 240, GROUND = 198;
  const COLORS = {
    bg1: "#141022", bg2: "#1d1230",
    ground: "#8b5cf6", grid: "rgba(139, 92, 246, 0.25)",
    skin: "#bd7e4e", hair: "#16161f", beard: "#22222e", jacket: "#13131c",
    gold: "#fbbf24", pink: "#ff2e88", cyan: "#00f0ff", yellow: "#ffe600",
    text: "#e8e8f0", muted: "#9b9bb2",
  };

  // ---------- The work-week cycle ----------
  // Mon-Fri: obstacles (the grind). Sat-Sun: no obstacles, booze bottles.
  const DAY_LEN = 3200; // distance units per in-game day
  const DAYS = [
    { key: "MON", label: "MONDAY", tag: "😮‍💨 BACK TO THE GRIND", sky1: "#10131f", sky2: "#1a2233", ground: "#5c6bc0", spawnMul: 1 },
    { key: "TUE", label: "TUESDAY", tag: "⚙️ SHIPPING MODE", sky1: "#141022", sky2: "#1d1230", ground: "#8b5cf6", spawnMul: 1.05 },
    { key: "WED", label: "WEDNESDAY", tag: "🐪 HUMP DAY", sky1: "#0e1a1c", sky2: "#12262a", ground: "#06b6d4", spawnMul: 1.1 },
    { key: "THU", label: "THURSDAY", tag: "☕ ALMOST THERE", sky1: "#1a1410", sky2: "#27190f", ground: "#f59e0b", spawnMul: 1.15 },
    { key: "FRI", label: "DEPLOY FRIDAY", tag: "🚨 HOLD THE LINE", sky1: "#1d0f1a", sky2: "#2b1024", ground: "#ff2e88", spawnMul: 1.4 },
    { key: "SAT", label: "SATURDAY", tag: "🍾 NO BUGS · JUST BOOZE", sky1: "#190f24", sky2: "#2d1140", ground: "#fbbf24", weekend: true },
    { key: "SUN", label: "SUNDAY", tag: "🛋️ RECHARGE", sky1: "#1c1212", sky2: "#2e1a16", ground: "#fb7185", weekend: true },
  ];

  function hexToRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  function mix(a, b, t) { return a.map((v, i) => v + (b[i] - v) * t); }
  function css(c, alpha) {
    const r = c[0] | 0, g = c[1] | 0, bl = c[2] | 0;
    return alpha === undefined ? "rgb(" + r + "," + g + "," + bl + ")" : "rgba(" + r + "," + g + "," + bl + "," + alpha + ")";
  }

  let raf = null;          // animation frame handle (null = loop stopped)
  let state = "idle";      // idle | running | over
  let frames = 0, speed = 0, score = 0, distance = 0;
  let player, obstacles, coins, bottles, spawnIn, coinIn, stars;
  let dayIdx = 0, dayDist = 0, totalDays = 0, banner = null, god = false;
  let theme = { sky1: hexToRgb(DAYS[0].sky1), sky2: hexToRgb(DAYS[0].sky2), ground: hexToRgb(DAYS[0].ground) };
  let hi = parseInt(localStorage.getItem("runner-hi") || "0", 10);
  let firstGameOver = !localStorage.getItem("runner-played");
  let weekendToastShown = !!localStorage.getItem("runner-weekend");

  function week() { return Math.floor(totalDays / 7) + 1; }

  function reset() {
    player = { x: 80, y: GROUND, vy: 0, ducking: false };
    obstacles = [];
    coins = [];
    bottles = [];
    frames = 0;
    speed = 6;
    score = 0;
    distance = 0;
    spawnIn = 70;
    coinIn = 150;
    dayIdx = 0;
    dayDist = 0;
    totalDays = 0;
    banner = { title: DAYS[0].label, sub: DAYS[0].tag, timer: 150 };
    theme = { sky1: hexToRgb(DAYS[0].sky1), sky2: hexToRgb(DAYS[0].sky2), ground: hexToRgb(DAYS[0].ground) };
  }

  stars = Array.from({ length: 40 }, (_, i) => ({
    x: (i * 97) % W,
    y: (i * 53) % 130 + 10,
    r: (i % 3) * 0.6 + 0.6,
  }));
  reset();

  const sfx = (name) => window.SFX && window.SFX.play(name);

  // ---------- Input ----------
  function jump() {
    if (state !== "running") return start();
    if (player.y >= GROUND) {
      player.vy = -11;
      player.ducking = false;
      sfx("jump");
    }
  }

  function start() {
    if (state === "running") return;
    reset();
    state = "running";
    sfx("powerup");
  }

  function onKey(e) {
    if (!isActive()) return;
    if (["ArrowUp", "ArrowDown", " ", "Spacebar"].includes(e.key)) e.preventDefault();
    if (e.type === "keydown") {
      if (e.key === " " || e.key === "Spacebar" || e.key === "ArrowUp") jump();
      if (e.key === "ArrowDown" && state === "running") {
        if (!player.ducking) sfx("duck");
        player.ducking = true;
      }
    } else if (e.key === "ArrowDown") {
      player.ducking = false;
    }
  }

  function isActive() {
    return raf !== null;
  }

  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);
  canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); jump(); });

  // ---------- Spawning ----------
  function spawnObstacle() {
    const roll = Math.random();
    if (roll < 0.45) {
      obstacles.push({ type: "bug", x: W + 30, y: GROUND, w: 30, h: 20 });
    } else if (roll < 0.8) {
      obstacles.push({ type: "conflict", x: W + 30, y: GROUND, w: 26, h: 44 });
    } else {
      obstacles.push({ type: "alert", x: W + 30, y: GROUND - 52, w: 46, h: 20, wob: Math.random() * 6 });
    }
  }

  function spawnCoins() {
    const n = 3 + Math.floor(Math.random() * 3);
    const baseY = GROUND - 60 - Math.random() * 60;
    for (let i = 0; i < n; i++) {
      coins.push({ x: W + 30 + i * 30, y: baseY + Math.sin(i * 0.9) * 14, r: 8, taken: false });
    }
  }

  function spawnBottles() {
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      bottles.push({ x: W + 30 + i * 46, y: GROUND - 14 - Math.random() * 70, taken: false });
    }
  }

  // ---------- Update ----------
  function update() {
    frames++;
    speed = Math.min(13, speed + 0.0016);
    distance += speed;
    score = Math.floor(distance / 8);
    if (banner && banner.timer > 0) banner.timer--;

    // day/night-shift cycle: another day at the office (or off it)
    dayDist += speed;
    if (dayDist >= DAY_LEN) {
      dayDist -= DAY_LEN;
      dayIdx = (dayIdx + 1) % 7;
      totalDays++;
      const d = DAYS[dayIdx];
      banner = {
        title: dayIdx === 0 ? "WEEK " + week() + " · " + d.label : d.label,
        sub: d.tag,
        timer: 150,
      };
      // each day deserves its own jingle
      const DAY_SOUNDS = { MON: "alarm", FRI: "siren", SAT: "party", SUN: "chill" };
      sfx(DAY_SOUNDS[d.key] || "ding");
      if (d.weekend && !weekendToastShown && window.HUD) {
        weekendToastShown = true;
        localStorage.setItem("runner-weekend", "1");
        window.HUD.toast("🍾", "ACHIEVEMENT UNLOCKED", "Made it to the weekend");
      }
    }
    const day = DAYS[dayIdx];

    // player physics
    player.vy += 0.6;
    player.y = Math.min(GROUND, player.y + player.vy);
    if (player.y === GROUND) player.vy = 0;

    // spawns: weekdays bring obstacles, weekends bring bottles
    if (--spawnIn <= 0) {
      if (day.weekend) {
        spawnBottles();
        spawnIn = 55 + Math.random() * 60;
      } else {
        spawnObstacle();
        spawnIn = (60 + Math.random() * 70 - speed * 2) / (day.spawnMul || 1);
      }
    }
    if (--coinIn <= 0) {
      spawnCoins();
      coinIn = 220 + Math.random() * 200;
    }

    obstacles.forEach((o) => { o.x -= speed; });
    coins.forEach((c) => { c.x -= speed; });
    bottles.forEach((b) => { b.x -= speed; });
    obstacles = obstacles.filter((o) => o.x > -60);
    coins = coins.filter((c) => c.x > -20 && !c.taken);
    bottles = bottles.filter((b) => b.x > -20 && !b.taken);

    // player hitbox (forgiving margins)
    const ph = player.ducking ? 26 : 46;
    const pbox = { x: player.x - 11, y: player.y - ph + 4, w: 22, h: ph - 6 };

    for (const o of obstacles) {
      const oy = o.type === "alert" ? o.y + Math.sin(frames / 8 + o.wob) * 4 : o.y;
      const obox = { x: o.x - o.w / 2 + 3, y: oy - o.h + 3, w: o.w - 6, h: o.h - 5 };
      if (!god &&
          pbox.x < obox.x + obox.w && pbox.x + pbox.w > obox.x &&
          pbox.y < obox.y + obox.h && pbox.y + pbox.h > obox.y) {
        return gameOver();
      }
    }

    for (const c of coins) {
      const dx = c.x - player.x, dy = c.y - (player.y - ph / 2);
      if (dx * dx + dy * dy < (c.r + 16) * (c.r + 16)) {
        c.taken = true;
        score += 25;
        sfx("coin");
        if (window.HUD) window.HUD.addCoins(1);
      }
    }

    for (const b of bottles) {
      const dx = b.x - player.x, dy = (b.y - 20) - (player.y - ph / 2);
      if (dx * dx + dy * dy < 28 * 28) {
        b.taken = true;
        score += 40;
        sfx("pop");
      }
    }
  }

  function gameOver() {
    state = "over";
    sfx("trombone"); // womp womp womp wooomp
    if (score > hi) {
      hi = score;
      localStorage.setItem("runner-hi", String(hi));
    }
    if (firstGameOver && window.HUD) {
      firstGameOver = false;
      localStorage.setItem("runner-played", "1");
      window.HUD.toast("🕹️", "ACHIEVEMENT UNLOCKED", "Played BUG RUNNER in the arcade");
    }
  }

  // ---------- Drawing ----------
  function drawBackground() {
    // ease the palette toward the current day's theme
    const d = DAYS[dayIdx];
    theme.sky1 = mix(theme.sky1, hexToRgb(d.sky1), 0.04);
    theme.sky2 = mix(theme.sky2, hexToRgb(d.sky2), 0.04);
    theme.ground = mix(theme.ground, hexToRgb(d.ground), 0.04);

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, css(theme.sky1));
    grad.addColorStop(1, css(theme.sky2));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (const s of stars) {
      const x = (s.x - distance * 0.15) % W;
      ctx.fillRect(x < 0 ? x + W : x, s.y, s.r, s.r);
    }

    // scrolling floor grid
    ctx.strokeStyle = css(theme.ground, 0.28);
    ctx.lineWidth = 1;
    const off = distance % 40;
    for (let x = -off; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x + 20, GROUND + 2);
      ctx.lineTo(x - 14, H);
      ctx.stroke();
    }
    ctx.strokeStyle = css(theme.ground);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 2);
    ctx.lineTo(W, GROUND + 2);
    ctx.stroke();
  }

  function drawPlayer() {
    const { x, ducking } = player;
    const y = player.y; // feet
    const run = state === "running" && y >= GROUND;
    // weekend = dance mode: groove, wave, shuffle
    const party = DAYS[dayIdx].weekend && state === "running" && !ducking;
    const phase = Math.floor(frames / (party ? 3 : 5)) % 2;

    ctx.save();
    ctx.translate(x, y);
    if (party && y >= GROUND) {
      ctx.translate(0, Math.sin(frames / 4) * 2.5); // bounce to the beat
      ctx.rotate(Math.sin(frames / 9) * 0.08);      // hip sway
    }

    // legs
    ctx.strokeStyle = "#0d0d15";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    if (run) {
      ctx.beginPath();
      ctx.moveTo(-4, ducking ? -10 : -16);
      ctx.lineTo(phase ? -10 : 2, 0);
      ctx.moveTo(4, ducking ? -10 : -16);
      ctx.lineTo(phase ? 8 : -2, 0);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-4, -16); ctx.lineTo(-5, 0);
      ctx.moveTo(4, -16); ctx.lineTo(5, 0);
      ctx.stroke();
    }

    if (ducking) {
      // crouched: wide jacket, head forward
      ctx.fillStyle = COLORS.jacket;
      roundRect(-16, -26, 34, 18, 7);
      drawHead(10, -26);
    } else {
      // jacket body
      ctx.fillStyle = COLORS.jacket;
      roundRect(-11, -36, 22, 22, 6);
      ctx.fillStyle = COLORS.gold;
      ctx.fillRect(-1, -32, 2.5, 2.5);
      ctx.fillRect(-1, -26, 2.5, 2.5);
      ctx.strokeStyle = COLORS.jacket;
      ctx.lineWidth = 5;
      if (party) {
        // both arms in the air like he just don't care
        const wave = Math.sin(frames / 5) * 5;
        ctx.beginPath();
        ctx.moveTo(-6, -32); ctx.lineTo(-14, -46 + wave);
        ctx.moveTo(6, -32); ctx.lineTo(14, -46 - wave);
        ctx.stroke();
        // hands, so the wave reads against the night sky
        ctx.fillStyle = COLORS.skin;
        ctx.beginPath();
        ctx.arc(-14, -46 + wave, 3.2, 0, Math.PI * 2);
        ctx.arc(14, -46 - wave, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // workday arm swing
        ctx.beginPath();
        ctx.moveTo(0, -32);
        ctx.lineTo(run && phase ? 9 : -9, -22);
        ctx.stroke();
      }
      drawHead(0, -36);
    }
    ctx.restore();

    // floating music notes while dancing
    if (party) {
      for (let i = 0; i < 2; i++) {
        const t = (frames / 55 + i * 0.5) % 1;
        ctx.save();
        ctx.globalAlpha = (1 - t) * 0.9;
        ctx.fillStyle = i ? COLORS.pink : COLORS.cyan;
        ctx.font = "14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(i ? "♪" : "♫", x + 22 + Math.sin((t + i) * 9) * 7, y - 58 - t * 32);
        ctx.restore();
      }
    }
  }

  function drawHead(cx, feetY) {
    // head sits on top of the body at (cx, feetY)
    const cy = feetY - 9;
    ctx.fillStyle = COLORS.skin;
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    // beard: lower arc
    ctx.fillStyle = COLORS.beard;
    ctx.beginPath();
    ctx.arc(cx, cy + 2.5, 9.5, Math.PI * 0.12, Math.PI * 0.88);
    ctx.fill();
    // hair: top cap with quiff
    ctx.fillStyle = COLORS.hair;
    ctx.beginPath();
    ctx.arc(cx, cy - 1.5, 10, Math.PI * 0.95, Math.PI * 2.02);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 3, cy - 10, 6, 3.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // eye
    ctx.fillStyle = "#1d120a";
    ctx.beginPath();
    ctx.arc(cx + 4.5, cy - 1, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.fill();
  }

  function drawObstacle(o) {
    ctx.save();
    if (o.type === "bug") {
      ctx.translate(o.x, o.y);
      ctx.fillStyle = COLORS.pink;
      ctx.beginPath();
      ctx.ellipse(0, -9, 13, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.pink;
      ctx.lineWidth = 2;
      const wig = Math.sin(frames / 3) * 3;
      ctx.beginPath();
      ctx.moveTo(-10, -4); ctx.lineTo(-15, 0 + wig * 0.4);
      ctx.moveTo(0, -2); ctx.lineTo(0, 1);
      ctx.moveTo(10, -4); ctx.lineTo(15, 0 - wig * 0.4);
      ctx.moveTo(-5, -16); ctx.lineTo(-8, -21 + wig * 0.5);
      ctx.moveTo(5, -16); ctx.lineTo(8, -21 - wig * 0.5);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-4, -10, 1.6, 0, Math.PI * 2);
      ctx.arc(4, -10, 1.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (o.type === "conflict") {
      ctx.translate(o.x - o.w / 2, o.y - o.h);
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(0, 0, o.w, o.h);
      ctx.fillStyle = "#141022";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("<<<", o.w / 2, 14);
      ctx.fillText("===", o.w / 2, 27);
      ctx.fillText(">>>", o.w / 2, 40);
    } else { // alert (flying)
      const y = o.y + Math.sin(frames / 8 + o.wob) * 4;
      ctx.translate(o.x, y);
      ctx.fillStyle = "#e11d48";
      ctx.beginPath();
      ctx.moveTo(-o.w / 2 + 6, -o.h);
      ctx.arcTo(o.w / 2, -o.h, o.w / 2, 0, 9);
      ctx.arcTo(o.w / 2, 0, -o.w / 2, 0, 9);
      ctx.arcTo(-o.w / 2, 0, -o.w / 2, -o.h, 9);
      ctx.arcTo(-o.w / 2, -o.h, o.w / 2, -o.h, 9);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("PROD!", 0, -6.5);
    }
    ctx.restore();
  }

  function drawCoin(c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    const squish = Math.abs(Math.sin(frames / 10 + c.x / 40));
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.ellipse(0, 0, c.r * (0.4 + 0.6 * squish), c.r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#7a5b10";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawBottle(b) {
    ctx.save();
    ctx.translate(b.x, b.y + Math.sin(frames / 12 + b.x / 50) * 3);
    ctx.fillStyle = "#1d6b3a";
    roundRect(-7, -26, 14, 26, 4);          // body
    ctx.fillRect(-2.5, -38, 5, 13);          // neck
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(-3.5, -43, 7, 6);           // foil cap
    ctx.fillStyle = "#f6e9c9";
    ctx.fillRect(-5, -18, 10, 8);            // label
    ctx.restore();
  }

  function drawHud() {
    const day = DAYS[dayIdx];
    ctx.fillStyle = COLORS.text;
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.textAlign = "right";
    ctx.fillText(String(score).padStart(5, "0"), W - 16, 26);
    ctx.fillStyle = COLORS.muted;
    ctx.fillText("HI " + String(hi).padStart(5, "0"), W - 16, 44);
    // current day, weekend gets the golden treatment
    ctx.textAlign = "left";
    ctx.fillStyle = day.weekend ? COLORS.gold : COLORS.muted;
    ctx.fillText("WK" + week() + " · " + day.key + (day.weekend ? " 🍾" : ""), 16, 26);
    // progress through the day
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(16, 34, 70, 4);
    ctx.fillStyle = day.weekend ? COLORS.gold : COLORS.cyan;
    ctx.fillRect(16, 34, 70 * (dayDist / DAY_LEN), 4);
  }

  function drawBanner() {
    if (!banner || banner.timer <= 0) return;
    const alpha = Math.min(1, banner.timer / 40);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.yellow;
    ctx.font = "17px 'Press Start 2P', monospace";
    ctx.fillText(banner.title, W / 2, 88);
    ctx.fillStyle = COLORS.text;
    ctx.font = "9px 'Press Start 2P', monospace";
    ctx.fillText(banner.sub, W / 2, 112);
    ctx.restore();
  }

  function drawCenterText(big, small) {
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.yellow;
    ctx.font = "20px 'Press Start 2P', monospace";
    ctx.fillText(big, W / 2, 104);
    ctx.fillStyle = COLORS.muted;
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.fillText(small, W / 2, 132);
  }

  // ---------- Main loop (time-based so any refresh rate plays the same) ----------
  const STEP = 1000 / 60;
  let lastTs = 0, acc = 0;

  function frame(ts) {
    if (!lastTs) lastTs = ts;
    acc += Math.min(120, ts - lastTs); // clamp long gaps (tab switch etc.)
    lastTs = ts;
    while (acc >= STEP) {
      if (state === "running") update();
      acc -= STEP;
    }

    drawBackground();
    obstacles.forEach(drawObstacle);
    coins.forEach(drawCoin);
    bottles.forEach(drawBottle);
    drawPlayer();
    drawHud();
    if (state === "running") drawBanner();

    if (state === "idle") drawCenterText("BUG RUNNER", "PRESS SPACE OR TAP TO START");
    if (state === "over") drawCenterText("GAME OVER", "SCORE " + score + " · SPACE / TAP TO RETRY");

    raf = requestAnimationFrame(frame);
  }

  // ---------- Public control ----------
  window.Arcade = {
    setActive(on) {
      if (on && raf === null) {
        lastTs = 0;
        acc = 0;
        raf = requestAnimationFrame(frame);
      } else if (!on && raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
        if (state === "running") {
          state = "idle";
          reset();
        }
      }
    },
    // start a run immediately (used by the fullscreen CTA)
    play() {
      reset();
      state = "running";
    },
    // test/debug helpers
    state: () => state,
    score: () => score,
    day: () => "WK" + week() + " " + DAYS[dayIdx].key,
    _god(on) { god = !!on; },
    _step(n) { for (let i = 0; i < n && state === "running"; i++) update(); },
  };
})();
