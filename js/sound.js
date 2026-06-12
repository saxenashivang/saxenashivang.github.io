/* Chiptune SFX engine — everything synthesized with the Web Audio API,
   no audio files. Exposes window.SFX = { play(name), toggle(), muted }.
   The AudioContext is created lazily on the first play() so it always
   happens after a user gesture (autoplay policy). */

(function () {
  "use strict";

  let ctx = null;
  let muted = localStorage.getItem("sfx-muted") === "1";

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // One enveloped oscillator note, optionally sliding pitch.
  function tone(opts) {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    const start = c.currentTime + (opts.t0 || 0);
    const dur = opts.dur || 0.1;
    o.type = opts.type || "square";
    o.frequency.setValueAtTime(opts.from, start);
    if (opts.to) {
      if (opts.linear) o.frequency.linearRampToValueAtTime(opts.to, start + dur);
      else o.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), start + dur);
    }
    g.gain.setValueAtTime(opts.vol || 0.1, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(c.destination);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  // A note with vibrato — the secret ingredient of the sad trombone.
  function vibTone(opts) {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    const start = c.currentTime + (opts.t0 || 0);
    const dur = opts.dur || 0.3;
    o.type = opts.type || "sawtooth";
    o.frequency.value = opts.from;
    lfo.frequency.value = opts.vibHz || 8;
    lfoGain.gain.value = opts.vibAmt || 10;
    lfo.connect(lfoGain).connect(o.frequency);
    g.gain.setValueAtTime(opts.vol || 0.1, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(c.destination);
    o.start(start);
    lfo.start(start);
    o.stop(start + dur + 0.05);
    lfo.stop(start + dur + 0.05);
  }

  const SOUNDS = {
    // ---------- UI ----------
    blip() { tone({ from: 520, dur: 0.04, vol: 0.05 }); },
    powerup() {
      tone({ type: "sine", from: 200, to: 900, dur: 0.25, vol: 0.09 });
      tone({ from: 900, to: 1400, t0: 0.22, dur: 0.12, vol: 0.05 });
    },
    toast() {
      tone({ type: "sine", from: 784, dur: 0.08, vol: 0.07 });
      tone({ type: "sine", from: 1175, t0: 0.08, dur: 0.16, vol: 0.07 });
    },
    god() {
      [523, 659, 784, 1047, 1319].forEach((f, i) =>
        tone({ from: f, t0: i * 0.07, dur: 0.1, vol: 0.06 }));
    },
    // mwah: rising squeak + lip pop
    kiss() {
      tone({ type: "sine", from: 300, to: 1000, dur: 0.09, vol: 0.09 });
      tone({ type: "triangle", from: 500, to: 80, t0: 0.1, dur: 0.05, vol: 0.14 });
    },

    // ---------- Gameplay ----------
    jump() { tone({ from: 160, to: 480, dur: 0.12, vol: 0.08 }); },
    duck() { tone({ from: 300, to: 140, dur: 0.08, vol: 0.06 }); },
    coin() {
      tone({ from: 988, dur: 0.06, vol: 0.07 });
      tone({ from: 1319, t0: 0.06, dur: 0.12, vol: 0.07 });
    },
    // champagne: cork pop, then a little glug
    pop() {
      tone({ type: "triangle", from: 700, to: 90, dur: 0.05, vol: 0.18 });
      tone({ type: "sine", from: 160, to: 700, t0: 0.08, dur: 0.14, vol: 0.08 });
    },
    // the sad trombone: womp womp womp wooooomp
    trombone() {
      [392, 370, 349].forEach((f, i) =>
        vibTone({ from: f, dur: 0.22, t0: i * 0.25, vol: 0.1, vibAmt: 4 }));
      vibTone({ from: 311, dur: 0.9, t0: 0.75, vol: 0.11, vibHz: 6, vibAmt: 18 });
    },

    // ---------- Day changes ----------
    // Monday: the alarm clock you hate
    alarm() {
      [0, 0.18, 0.36].forEach((t) => {
        tone({ from: 880, t0: t, dur: 0.08, vol: 0.07 });
        tone({ from: 932, t0: t + 0.09, dur: 0.08, vol: 0.07 });
      });
    },
    // Tue-Thu: dry office "ding"
    ding() {
      tone({ type: "sine", from: 660, dur: 0.25, vol: 0.08 });
      tone({ type: "sine", from: 1320, dur: 0.18, vol: 0.03 });
    },
    // Deploy Friday: the pager goes off
    siren() {
      tone({ type: "triangle", from: 600, to: 950, dur: 0.25, vol: 0.08, linear: true });
      tone({ type: "triangle", from: 950, to: 600, t0: 0.25, dur: 0.25, vol: 0.08, linear: true });
      tone({ type: "triangle", from: 600, to: 950, t0: 0.5, dur: 0.25, vol: 0.08, linear: true });
    },
    // Saturday: party horn + cork
    party() {
      vibTone({ from: 233, dur: 0.5, vol: 0.12, vibHz: 14, vibAmt: 20 });
      tone({ type: "sawtooth", from: 466, to: 520, dur: 0.45, vol: 0.05, linear: true });
      tone({ type: "triangle", from: 700, to: 90, t0: 0.4, dur: 0.05, vol: 0.16 });
    },
    // Sunday: one soft chord, horizontal on the couch
    chill() {
      [261.6, 329.6, 392].forEach((f) =>
        tone({ type: "sine", from: f, dur: 0.9, vol: 0.05 }));
    },
  };

  window.SFX = {
    get muted() { return muted; },
    play(name) {
      if (muted) return;
      const sound = SOUNDS[name];
      if (!sound) return;
      try {
        sound();
      } catch (err) {
        // Audio is a garnish — if the context is unavailable, stay silent.
      }
    },
    toggle() {
      muted = !muted;
      localStorage.setItem("sfx-muted", muted ? "1" : "0");
      return muted;
    },
  };
})();
