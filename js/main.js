/* PORTFOLIO: THE GAME — renders everything from CONFIG (config.js). */

(function () {
  "use strict";

  // ---------- Helpers ----------
  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function esc(str) {
    const div = document.createElement("div");
    div.textContent = String(str ?? "");
    return div.innerHTML;
  }

  const game = CONFIG.game || {};

  // ---------- Level / XP math ----------
  const totalXP =
    (CONFIG.experience || []).reduce((sum, job) => sum + 350 + (job.points || []).length * 120, 0) +
    (CONFIG.skills || []).reduce((sum, group) => sum + (group.items || []).length * 40, 0) +
    (CONFIG.projects || []).length * 150 +
    (((CONFIG.blog || {}).posts) || []).length * 90;
  const level = game.level || Math.max(1, Math.floor(Math.sqrt(totalXP / 30)));
  const xpPct = 35 + (totalXP % 60); // always mid-bar: there's forever more to learn

  // ---------- Title screen ----------
  document.title = CONFIG.name + " · Press Start";
  document.getElementById("boot-firstname").textContent = CONFIG.firstName.toUpperCase();
  document.getElementById("boot-logo").textContent = CONFIG.name;
  document.getElementById("boot-sub").textContent =
    game.subtitle || "THE PORTFOLIO · " + (CONFIG.roles || [""])[0].toUpperCase();
  document.getElementById("boot-year").textContent = new Date().getFullYear();

  const boot = document.getElementById("boot");
  const gameEl = document.getElementById("game");
  let started = false;

  const sfx = (name) => window.SFX && window.SFX.play(name);

  function startGame() {
    if (started) return;
    started = true;
    sfx("powerup");
    boot.classList.add("exit");
    gameEl.classList.remove("hidden");
    setTimeout(() => boot.remove(), 550);
    setTimeout(() => {
      document.getElementById("xp-fill").style.width = xpPct + "%";
      document.querySelectorAll(".stat-fill").forEach((bar) => {
        bar.style.width = bar.dataset.target + "%";
      });
    }, 250);
    toast("🏆", "ACHIEVEMENT UNLOCKED", "New challenger: you found " + CONFIG.firstName + "'s portfolio!");
  }

  document.getElementById("press-start").addEventListener("click", startGame);
  window.addEventListener("keydown", function bootKey(e) {
    if (!started && e.key !== "Tab") startGame();
  });

  // ---------- HUD ----------
  const hearts = document.getElementById("hud-hearts");
  for (let i = 0; i < 5; i++) hearts.appendChild(el("span", "", "❤️"));

  document.getElementById("hud-player").textContent = CONFIG.name.toUpperCase();
  document.getElementById("hud-level").textContent = "LV." + level;

  // Coins: every click earns one; the arcade pays out too. Persisted, because economy.
  const coinEl = document.getElementById("coin-count");
  let coins = parseInt(localStorage.getItem("coins") || "0", 10);
  coinEl.textContent = coins;

  function addCoins(n) {
    coins += n;
    coinEl.textContent = coins;
    localStorage.setItem("coins", String(coins));
    if (coins >= 50 && coins - n < 50) toast("🪙", "ACHIEVEMENT UNLOCKED", "Coin economist — 50 coins collected");
  }

  document.addEventListener("click", () => addCoins(1));

  // Shared HUD API for the arcade mini-game (js/game.js)
  window.HUD = { addCoins, toast };

  // CRT toggle
  const crtBtn = document.getElementById("crt-toggle");
  if (localStorage.getItem("crt") === "1") {
    document.body.classList.add("crt");
    crtBtn.classList.add("on");
  }
  crtBtn.addEventListener("click", () => {
    const on = document.body.classList.toggle("crt");
    crtBtn.classList.toggle("on", on);
    localStorage.setItem("crt", on ? "1" : "0");
    sfx("blip");
  });

  // Sound toggle
  const soundBtn = document.getElementById("sound-toggle");
  function renderSoundBtn() {
    const muted = window.SFX ? window.SFX.muted : true;
    soundBtn.textContent = muted ? "🔇" : "🔊";
    soundBtn.classList.toggle("on", !muted);
  }
  renderSoundBtn();
  soundBtn.addEventListener("click", () => {
    if (window.SFX) {
      const muted = window.SFX.toggle();
      if (!muted) sfx("coin"); // a little "you're back" ding
    }
    renderSoundBtn();
  });

  // ---------- Screen router ----------
  const menuBtns = Array.from(document.querySelectorAll(".menu-btn"));
  const screens = Array.from(document.querySelectorAll(".screen"));
  const visited = new Set(["stats"]);
  let currentScreen = "stats";
  const SCREEN_NAMES = {
    quests: "Quest Log",
    inventory: "Inventory",
    achievements: "Trophy Room",
    sidequests: "Side Quests",
    codex: "Codex",
    arcade: "Arcade",
    tavern: "Tavern",
  };

  function showScreen(id) {
    currentScreen = id;
    menuBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.screen === id));
    screens.forEach((screen) => screen.classList.toggle("active", screen.id === "screen-" + id));
    if (!visited.has(id) && SCREEN_NAMES[id]) {
      visited.add(id);
      toast("🗺️", "AREA DISCOVERED", SCREEN_NAMES[id]);
    }
    if (window.Arcade) window.Arcade.setActive(id === "arcade");
  }

  menuBtns.forEach((btn) => btn.addEventListener("click", () => {
    sfx("blip");
    showScreen(btn.dataset.screen);
  }));

  window.addEventListener("keydown", (e) => {
    if (!started || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!fsOverlay.classList.contains("hidden")) return; // arcade fullscreen owns the keyboard
    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= menuBtns.length) showScreen(menuBtns[num - 1].dataset.screen);
  });

  // ---------- Arcade fullscreen ----------
  const fsOverlay = document.getElementById("arcade-fs");
  const fsStage = document.getElementById("arcade-fs-stage");
  const runnerCanvas = document.getElementById("runner-canvas");
  const arcadeWrap = document.querySelector(".arcade-wrap");

  function openArcadeFullscreen() {
    fsStage.appendChild(runnerCanvas); // moving the canvas keeps its 2d context
    fsOverlay.classList.remove("hidden");
    document.body.classList.add("fs-lock");
    if (fsOverlay.requestFullscreen) fsOverlay.requestFullscreen().catch(() => {});
    if (window.Arcade) {
      window.Arcade.setActive(true);
      window.Arcade.play();
    }
  }

  function closeArcadeFullscreen() {
    if (fsOverlay.classList.contains("hidden")) return;
    fsOverlay.classList.add("hidden");
    document.body.classList.remove("fs-lock");
    arcadeWrap.appendChild(runnerCanvas);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (window.Arcade) window.Arcade.setActive(currentScreen === "arcade");
  }

  document.getElementById("arcade-fs-close").addEventListener("click", closeArcadeFullscreen);
  document.getElementById("arcade-fs-btn").addEventListener("click", openArcadeFullscreen);
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) closeArcadeFullscreen();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeArcadeFullscreen();
  });

  // ---------- Avatar emotes: tap the hero, get love ----------
  const EMOTES = [
    { text: "HI THERE! 👋", anim: "emote-wave", sound: "toast", parts: ["👋"] },
    { text: "MWAH! 😘", anim: "emote-kiss", sound: "kiss", parts: ["💋", "❤️", "💕"] },
    { text: "BIG HUG! 🤗", anim: "emote-hug", sound: "chill", parts: ["🤗", "💛"] },
    { text: "NAMASTE 🙏", anim: "emote-bow", sound: "ding", parts: ["🙏", "✨"] },
    { text: "GYM? MONDAY. 💪", anim: "emote-flex", sound: "powerup", parts: ["💪", "🔥"] },
    { text: "HIGH FIVE! ✋", anim: "emote-wave", sound: "coin", parts: ["✋", "⭐"] },
  ];
  let emoteIdx = 0;
  let bubbleTimer = null;
  const emoteAvatar = document.getElementById("char-avatar");
  const charCard = emoteAvatar.closest(".char-card");

  emoteAvatar.style.cursor = "pointer";
  emoteAvatar.title = "tap me!";
  emoteAvatar.addEventListener("click", () => {
    const emote = EMOTES[emoteIdx % EMOTES.length];
    emoteIdx++;
    sfx(emote.sound);

    EMOTES.forEach((e) => emoteAvatar.classList.remove(e.anim));
    void emoteAvatar.offsetWidth; // restart animation on rapid taps
    emoteAvatar.classList.add(emote.anim);

    // floating emoji burst, along the sides of the card so the
    // panel's clip-path never cuts them off
    for (let i = 0; i < 6; i++) {
      const part = el("span", "emote-pop", emote.parts[i % emote.parts.length]);
      part.style[i % 2 ? "left" : "right"] = 5 + Math.random() * 14 + "%";
      part.style.top = 95 + Math.random() * 60 + "px";
      part.style.setProperty("--dx", (Math.random() * 40 - 20).toFixed(0) + "px");
      part.style.setProperty("--rot", (Math.random() * 50 - 25).toFixed(0) + "deg");
      part.style.animationDelay = i * 0.06 + "s";
      charCard.appendChild(part);
      setTimeout(() => part.remove(), 1500);
    }

    // speech bubble
    let bubble = charCard.querySelector(".emote-bubble");
    if (!bubble) {
      bubble = el("div", "emote-bubble");
      charCard.appendChild(bubble);
    }
    bubble.textContent = emote.text;
    bubble.classList.remove("show");
    void bubble.offsetWidth;
    bubble.classList.add("show");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove("show"), 1500);
  });

  // Character-screen CTA: the avatar takes a hop, then the arcade opens
  document.getElementById("play-arcade-cta").addEventListener("click", () => {
    const avatar = document.getElementById("char-avatar");
    sfx("jump");
    avatar.classList.remove("avatar-jump");
    void avatar.offsetWidth; // restart the animation if clicked again
    avatar.classList.add("avatar-jump");
    setTimeout(() => {
      avatar.classList.remove("avatar-jump");
      openArcadeFullscreen();
    }, 640);
  });

  // ---------- Character ----------
  const avatarEl = document.getElementById("char-avatar");
  if (CONFIG.avatar) {
    avatarEl.innerHTML = '<img src="' + esc(CONFIG.avatar) + '" alt="' + esc(CONFIG.name) + '" />';
  } else {
    avatarEl.textContent = CONFIG.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  }
  document.getElementById("char-name").textContent = CONFIG.name;

  const badges = document.getElementById("char-badges");
  [
    "📍 " + (CONFIG.location || "The Internet"),
    "⚡ LV." + level,
    "🎯 " + (CONFIG.experience || []).length + " quests done",
  ].forEach((text) => badges.appendChild(el("span", "badge", esc(text))));

  const bio = document.getElementById("char-bio");
  (CONFIG.about || []).forEach((para) => bio.appendChild(el("p", "", esc(para))));

  // Stats: from config override, else derived from skill categories
  const stats =
    (game.stats && game.stats.length ? game.stats : null) ||
    (CONFIG.skills || []).slice(0, 6).map((group) => ({
      label: group.category,
      value: Math.min(99, 58 + (group.items || []).length * 6),
    }));
  const statBars = document.getElementById("stat-bars");
  stats.forEach((stat) => {
    const row = el("div", "stat-row");
    row.appendChild(el("span", "stat-name", esc(stat.label.toUpperCase())));
    const track = el("div", "stat-track");
    const fill = el("div", "stat-fill");
    fill.dataset.target = stat.value;
    track.appendChild(fill);
    row.appendChild(track);
    row.appendChild(el("span", "stat-val", esc(stat.value)));
    statBars.appendChild(row);
  });

  // ---------- Typewriter (class) ----------
  const typeTarget = document.getElementById("typewriter");
  const roles = CONFIG.roles && CONFIG.roles.length ? CONFIG.roles : ["Adventurer"];
  let roleIdx = 0, charIdx = 0, deleting = false;
  (function typeLoop() {
    const word = roles[roleIdx].toUpperCase();
    typeTarget.textContent = word.slice(0, charIdx);
    let delay = deleting ? 40 : 90;
    if (!deleting && charIdx === word.length) { delay = 1900; deleting = true; }
    else if (deleting && charIdx === 0) { deleting = false; roleIdx = (roleIdx + 1) % roles.length; delay = 350; }
    else charIdx += deleting ? -1 : 1;
    setTimeout(typeLoop, delay);
  })();

  // ---------- Quest Log ----------
  const questList = document.getElementById("quest-list");
  (CONFIG.experience || []).forEach((job) => {
    const live = /present|current|now/i.test(job.period || "");
    const xp = 350 + (job.points || []).length * 120;
    const company = job.companyUrl
      ? '<a href="' + esc(job.companyUrl) + '" target="_blank" rel="noopener">' + esc(job.company) + "</a>"
      : esc(job.company);
    const objectives = (job.points || []).map((p) => "<li>" + esc(p) + "</li>").join("");
    const loot = (job.tags || []).map((t) => '<span class="loot">' + esc(t) + "</span>").join("");
    questList.appendChild(
      el("article", "quest",
        '<div class="quest-top"><span class="quest-kind">★ MAIN QUEST</span>' +
        '<span class="quest-status ' + (live ? "live" : "done") + '">' + (live ? "IN PROGRESS" : "COMPLETED") + "</span></div>" +
        "<h3>" + esc(job.role) + " · " + company + "</h3>" +
        '<p class="quest-meta">' + esc(job.period) + (job.location ? " · " + esc(job.location) : "") + "</p>" +
        '<ul class="quest-objectives">' + objectives + "</ul>" +
        '<div class="quest-foot"><span class="xp-chip">+' + xp + ' XP</span>' + loot + "</div>"
      )
    );
  });

  // ---------- Inventory ----------
  const RARITIES = ["common", "rare", "epic", "legendary"];
  const ICONS = ["🗡️", "🛡️", "🔮", "🏹", "🪄", "⚗️", "📦", "🧪", "💎", "🔧", "🧭", "🗝️"];

  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  function itemMeta(raw) {
    if (typeof raw === "object") return { name: raw.name, rarity: raw.rarity || RARITIES[hash(raw.name) % 4] };
    return { name: raw, rarity: RARITIES[hash(raw) % 4] };
  }

  const invTabs = document.getElementById("inv-tabs");
  const invGrid = document.getElementById("inv-grid");

  function renderItems(group) {
    invGrid.innerHTML = "";
    (group.items || []).forEach((raw, idx) => {
      const { name, rarity } = itemMeta(raw);
      const item = el("div", "item",
        '<div class="item-icon">' + ICONS[hash(name) % ICONS.length] + "</div>" +
        '<div class="item-name">' + esc(name) + "</div>" +
        '<div class="item-rarity">' + rarity + "</div>"
      );
      item.dataset.rarity = rarity;
      item.title = name + " · " + rarity.toUpperCase() + " " + group.category + " item";
      item.style.animationDelay = idx * 0.04 + "s";
      invGrid.appendChild(item);
    });
  }

  (CONFIG.skills || []).forEach((group, idx) => {
    const tab = el("button", "inv-tab" + (idx === 0 ? " active" : ""),
      "<span>" + esc(group.icon || "✨") + " " + esc(group.category) + "</span>");
    tab.addEventListener("click", () => {
      invTabs.querySelectorAll(".inv-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      renderItems(group);
    });
    invTabs.appendChild(tab);
  });
  if ((CONFIG.skills || []).length) renderItems(CONFIG.skills[0]);

  // ---------- Trophies ----------
  const trophyGrid = document.getElementById("trophy-grid");
  (CONFIG.education || []).forEach((edu) => {
    trophyGrid.appendChild(
      el("div", "trophy",
        '<div class="trophy-icon">🏆</div><div>' +
        "<h3>" + esc(edu.degree) + "</h3>" +
        '<span class="trophy-school">' + esc(edu.school) + "</span>" +
        '<span class="trophy-period">UNLOCKED ' + esc(edu.period) + "</span>" +
        "<p>" + esc(edu.details || "") + "</p></div>"
      )
    );
  });

  // ---------- Side quests ----------
  const sideGrid = document.getElementById("side-grid");
  const projects = CONFIG.projects || [];
  if (!projects.length) sideGrid.appendChild(el("p", "screen-sub", "No side quests discovered yet."));
  projects.forEach((project) => {
    const links = [];
    if (project.repoUrl) links.push('<a href="' + esc(project.repoUrl) + '" target="_blank" rel="noopener">CODE ↗</a>');
    if (project.liveUrl) links.push('<a href="' + esc(project.liveUrl) + '" target="_blank" rel="noopener">PLAY ↗</a>');
    const tags = (project.tech || []).map((t) => '<span class="tag">' + esc(t) + "</span>").join("");
    sideGrid.appendChild(
      el("div", "side-card",
        '<div class="side-top"><span class="quest-kind">◆ SIDE QUEST</span>' +
        '<div class="side-links">' + links.join("") + "</div></div>" +
        "<h3>" + esc(project.title) + "</h3>" +
        "<p>" + esc(project.description) + "</p>" +
        '<div class="side-tags">' + tags + "</div>"
      )
    );
  });

  // ---------- Codex (blog) ----------
  const codexList = document.getElementById("codex-list");
  const posts = ((CONFIG.blog || {}).enabled ? (CONFIG.blog || {}).posts : []) || [];
  if (!posts.length) codexList.appendChild(el("p", "screen-sub", "No lore entries discovered yet — check back soon."));
  posts.forEach((post, idx) => {
    const entry = el("a", "codex-entry");
    entry.href = "blog.html#" + encodeURIComponent(post.slug);
    const tags = (post.tags || []).map((t) => '<span class="tag">#' + esc(t) + "</span>").join("");
    entry.innerHTML =
      '<div class="codex-top"><span class="codex-date">' + esc(post.date) + "</span>" +
      (idx === 0 ? '<span class="codex-new">NEW</span>' : "") + "</div>" +
      "<h3>📖 " + esc(post.title) + "</h3>" +
      "<p>" + esc(post.summary) + "</p>" +
      '<div class="blog-tags">' + tags + '</div>' +
      '<span class="codex-read">▶ READ ENTRY</span>';
    codexList.appendChild(entry);
  });

  // ---------- Tavern ----------
  document.getElementById("contact-btn").href = "mailto:" + CONFIG.email;

  const resumeBtn = document.getElementById("resume-btn");
  if (CONFIG.resumeUrl) {
    resumeBtn.href = CONFIG.resumeUrl;
    resumeBtn.classList.remove("hidden");
  }

  const SOCIAL_ICONS = {
    github: '<svg viewBox="0 0 24 24"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.05.78 2.12v3.15c0 .3.2.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.15a4 4 0 1 1 0-7.98 4 4 0 0 1 0 7.98zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>',
    email: '<svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4.24-8 5-8-5V6.5l8 5 8-5v1.74z"/></svg>',
  };

  const tavernSocials = document.getElementById("tavern-socials");
  const links = [];
  Object.entries(CONFIG.socials || {}).forEach(([key, url]) => { if (url) links.push({ key, url }); });
  if (CONFIG.email) links.push({ key: "email", url: "mailto:" + CONFIG.email });
  links.forEach(({ key, url }) => {
    const a = el("a", "social-link");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", key);
    a.innerHTML = SOCIAL_ICONS[key] || esc(key);
    tavernSocials.appendChild(a);
  });

  document.getElementById("footer-note").textContent =
    "© " + new Date().getFullYear() + " " + CONFIG.name + " · " + (CONFIG.footerNote || "");

  const arcadeSub = document.getElementById("arcade-sub");
  if (arcadeSub) {
    arcadeSub.textContent =
      "BUG RUNNER · survive " + CONFIG.firstName + "'s Mon–Fri grind — then it's bottles & vibes all weekend";
  }

  // ---------- Toasts ----------
  const toastZone = document.getElementById("toast-zone");
  function toast(emoji, title, text) {
    sfx("toast");
    const node = el("div", "toast",
      '<span class="toast-emoji">' + emoji + "</span>" +
      "<div><b>" + esc(title) + "</b><span>" + esc(text) + "</span></div>"
    );
    toastZone.appendChild(node);
    setTimeout(() => node.remove(), 4200);
  }

  // ---------- Konami code → GOD MODE ----------
  const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let konamiIdx = 0;
  window.addEventListener("keydown", (e) => {
    konamiIdx = e.key === KONAMI[konamiIdx] ? konamiIdx + 1 : (e.key === KONAMI[0] ? 1 : 0);
    if (konamiIdx === KONAMI.length) {
      konamiIdx = 0;
      const on = document.body.classList.toggle("godmode");
      sfx("god");
      toast("🌈", on ? "GOD MODE ACTIVATED" : "GOD MODE DEACTIVATED", on ? "30 lives granted. Use them wisely." : "Back to mortal rendering.");
    }
  });
})();
