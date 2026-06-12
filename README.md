# PORTFOLIO: THE GAME 🎮

A portfolio website that plays like a video game — title screen, character stats, quest log, inventory with item rarities, trophies, a lore codex (the blog), and a tavern to recruit you. No frameworks, no build step, fully config-driven. Deploys straight to GitHub Pages.

## 🕹️ The concept

| Game element | What it really is |
|---|---|
| **Title screen** | Landing page — "PRESS START" to enter |
| **CHARACTER** | About you: avatar, class (typewriter), level, bio, animated stat bars |
| **QUEST LOG** | Professional journey — jobs as main quests with objectives + XP rewards |
| **INVENTORY** | Skills as collectible items with rarity tiers (common → legendary, with holo shine) |
| **TROPHIES** | Education as unlocked achievements |
| **SIDE QUESTS** | Projects |
| **CODEX** | Blog — markdown posts as lore entries |
| **TAVERN** | Contact — "Send party invite" |

Plus: a HUD with hearts, your level + XP bar, a coin counter that rewards every click, achievement toasts, a CRT scanline toggle, keyboard navigation (keys **1–7**), and a Konami code easter egg (**↑↑↓↓←→←→BA**).

## 🚀 Getting started

### 1. Edit your details — one file

Open [`config.js`](config.js). Everything on the site reads from it:

- `name`, `firstName`, `roles` (cycle as your "class"), `about`, `location`, `email`
- `skills` — categories become inventory tabs; items become loot (rarity is auto-assigned, or pass `{ name: "Vue.js", rarity: "legendary" }` to choose)
- `experience` — becomes the quest log (a `period` containing "Present" shows **IN PROGRESS**)
- `education` — becomes trophies
- `projects` — becomes side quests
- `blog.posts` — becomes the codex
- `game` — optional: title-screen subtitle, level override, custom stat bars

Your **level and XP are computed automatically** from how much is in your config.

### 2. Preview locally

The codex loads markdown with `fetch()`, which browsers block on `file://` URLs — so use a tiny local server:

```bash
cd portfolio
npx serve        # or: python3 -m http.server 8000
```

### 3. Write a blog post (codex entry)

1. Add a markdown file to `posts/`, e.g. `posts/my-first-post.md`
2. Add an entry to `blog.posts` in `config.js`:

```js
{
  slug: "my-first-post",            // URL: blog.html#my-first-post
  title: "My First Post",
  date: "2026-06-12",
  summary: "One or two lines shown on the codex card.",
  tags: ["javascript", "learning"],
  file: "posts/my-first-post.md",
}
```

> Tip: don't start the markdown with a `# Title` — the reader page already renders the title from the config. Start with content and use `##` for sections.

## 🌐 Deploy to GitHub Pages

1. Create a repo (e.g. `<your-username>.github.io`, or any name)
2. Push this folder:

```bash
git init
git add .
git commit -m "feat: portfolio — the game"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo>.git
git push -u origin main
```

3. **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**
4. Live at `https://<your-username>.github.io/<repo>/`

> `.nojekyll` is included so GitHub Pages serves files as-is.

## 🗂 Structure

```
portfolio/
├── index.html        # The game: title screen, HUD, all screens
├── blog.html         # Codex entry reader (reads blog.html#<slug>)
├── config.js         # ← THE file you edit
├── css/style.css     # Game UI styles
├── js/main.js        # Game engine: screens, XP, toasts, easter eggs
├── js/blog.js        # Markdown rendering (marked + DOMPurify via CDN)
├── posts/            # Blog posts (markdown)
├── serve.json        # Disables URL rewriting for local `npx serve`
└── .nojekyll         # Tells GitHub Pages to skip Jekyll
```

## 🎨 Customizing the look

The palette lives at the top of [`css/style.css`](css/style.css):

```css
:root {
  --yellow: #ffe600;   /* primary accent  */
  --pink:   #ff2e88;   /* secondary       */
  --cyan:   #00f0ff;   /* tertiary        */
  --violet: #8b5cf6;
}
```

Swap those and the whole game re-skins itself.
