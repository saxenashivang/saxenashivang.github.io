/* Renders a single Codex entry (blog post) from a markdown file listed in
   CONFIG.blog.posts. Markdown is parsed with marked and sanitized with
   DOMPurify before rendering. */

(function () {
  "use strict";

  const contentEl = document.getElementById("post-content");
  const titleEl = document.getElementById("post-title");
  const dateEl = document.getElementById("post-date");
  const tagsEl = document.getElementById("post-tags");

  document.getElementById("footer-note").textContent =
    "© " + new Date().getFullYear() + " " + CONFIG.name + " · " + (CONFIG.footerNote || "");

  // Respect the CRT setting chosen in the game
  if (localStorage.getItem("crt") === "1") document.body.classList.add("crt");

  function showError(message) {
    titleEl.textContent = "Entry not found";
    contentEl.innerHTML = "<p>" + message + ' <a href="index.html">Back to the game</a>.</p>';
  }

  // Slug comes from the hash (blog.html#my-post) — survives any server
  // redirect. ?post=my-post is also supported as a fallback.
  const slug =
    decodeURIComponent(window.location.hash.replace(/^#/, "")) ||
    new URLSearchParams(window.location.search).get("post");
  const post = ((CONFIG.blog || {}).posts || []).find((p) => p.slug === slug);

  if (!post) {
    showError("This lore entry doesn't exist (or hasn't been discovered yet).");
    return;
  }

  document.title = post.title + " · Codex · " + CONFIG.name;
  titleEl.textContent = post.title;
  dateEl.textContent = "LORE ENTRY · " + post.date;
  (post.tags || []).forEach((tag) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = "#" + tag;
    tagsEl.appendChild(span);
  });

  fetch(post.file)
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then((markdown) => {
      const html = marked.parse(markdown);
      contentEl.innerHTML = DOMPurify.sanitize(html);
    })
    .catch((err) => {
      showError(
        "Could not load the entry (" + err.message + "). " +
        "If you opened this page directly from disk, run a local server instead — " +
        "e.g. <code>npx serve</code> — because browsers block " +
        "<code>fetch()</code> on <code>file://</code> URLs."
      );
    });
})();
