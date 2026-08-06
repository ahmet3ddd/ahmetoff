/* ══ Ses: efektler (WebAudio), seslendirme (TTS), telaffuz dinleme ══ */

var Sound = (function () {
  var ctx = null, master = null;

  function on () { return Store.get('sound') !== false; }
  function ac () {
    if (!on()) return null;
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = 0.14;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* tek nota */
  function tone (freq, t0, dur, type, vol) {
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, c.currentTime + t0);
    g.gain.setValueAtTime(0, c.currentTime + t0);
    g.gain.linearRampToValueAtTime(vol == null ? 1 : vol, c.currentTime + t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, c.currentTime + t0 + dur);
    o.connect(g); g.connect(master);
    o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.02);
  }

  /* Hicaz makamı dizisi — uygulamanın ses kimliği */
  var HICAZ = { D:293.66, Eb:311.13, Fs:369.99, G:392.00, A:440.00, Bb:466.16, Cs:554.37, D2:587.33, A2:880 };

  return {
    unlock: function () { ac(); },
    tap:      function () { tone(HICAZ.A, 0, .05, 'sine', .5); },
    correct:  function () { tone(HICAZ.A, 0, .12, 'triangle', .9); tone(HICAZ.D2, .07, .22, 'triangle', .8); },
    wrong:    function () { tone(146.83, 0, .16, 'sawtooth', .5); tone(138.59, .06, .22, 'sawtooth', .4); },
    finish:   function () { [HICAZ.D, HICAZ.Fs, HICAZ.A, HICAZ.D2].forEach(function (f, i) { tone(f, i*.09, .3, 'triangle', .8); });
                            tone(HICAZ.A2, .42, .55, 'sine', .5); },
    levelUp:  function () { [HICAZ.D, HICAZ.Eb, HICAZ.Fs, HICAZ.G, HICAZ.A].forEach(function (f, i) { tone(f, i*.07, .25, 'triangle', .7); }); },
    heart:    function () { tone(HICAZ.Eb, 0, .1, 'sine', .6); tone(196, .08, .2, 'sine', .5); },
    swipe:    function () { tone(660, 0, .06, 'sine', .3); tone(880, .04, .07, 'sine', .25); }
  };
})();


var Speech = (function () {
  var voices = [], best = null, ready = false;
  var synth = window.speechSynthesis || null;

  function loadVoices () {
    if (!synth) return;
    voices = synth.getVoices() || [];
    var tr = voices.filter(function (v) { return /^tr/i.test(v.lang); });
    best = tr[0] || null;
    ready = voices.length > 0;
  }
  if (synth) { loadVoices(); synth.onvoiceschanged = loadVoices; }

  /* Transkripsiyondaki özel işaretleri Türkçe TTS'in okuyabileceği hâle getirir */
  function plain (s) {
    return String(s || '')
      .replace(/[âāá]/g, 'a').replace(/[îīí]/g, 'i').replace(/[ûūú]/g, 'u')
      .replace(/[ôō]/g, 'o').replace(/[êē]/g, 'e')
      .replace(/ñ/g, 'n').replace(/[ḥḫḳṣṭẓḍ]/g, function (c) { return ({'ḥ':'h','ḫ':'h','ḳ':'k','ṣ':'s','ṭ':'t','ẓ':'z','ḍ':'d'})[c]; })
      .replace(/[ʿʾ’‘'`]/g, ' ')
      .replace(/[‑–—]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  return {
    get supported () { return !!synth; },
    get hasVoice () { return !!best; },
    get voices () { return voices.filter(function (v) { return /^tr/i.test(v.lang); }); },
    plain: plain,

    setVoice: function (uri) {
      var v = voices.filter(function (x) { return x.voiceURI === uri; })[0];
      if (v) best = v;
    },

    speak: function (text, opts) {
      if (!synth) return false;
      opts = opts || {};
      try { synth.cancel(); } catch (e) {}
      var u = new SpeechSynthesisUtterance(plain(text));
      u.lang = 'tr-TR';
      u.rate = opts.rate != null ? opts.rate : (Store.get('ttsRate') || 0.9);
      u.pitch = opts.pitch != null ? opts.pitch : 1;
      u.volume = 1;
      if (best) u.voice = best;
      if (opts.onend) u.onend = opts.onend;
      synth.speak(u);
      return true;
    },
    stop: function () { if (synth) { try { synth.cancel(); } catch (e) {} } },

    /* ── konuşma tanıma ──
       Mikrofon yalnızca güvenli bağlamda çalışır. Sayfa dosyadan (file://)
       açıldığında tarayıcı erişimi engeller; bunu baştan bilip kullanıcıya
       kendi kendine değerlendirme yolunu sunuyoruz.                        */
    get canListen () {
      if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) return false;
      return window.isSecureContext !== false;
    },
    get blockedReason () {
      if (!(window.SpeechRecognition || window.webkitSpeechRecognition))
        return 'Bu tarayıcı konuşma tanımayı desteklemiyor.';
      if (window.isSecureContext === false)
        return 'Sayfa dosyadan açıldığı için tarayıcı mikrofona izin vermiyor.';
      return null;
    },
    listen: function (cb) {
      var R = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!R) { cb({ error:'unsupported' }); return null; }
      var r = new R();
      r.lang = 'tr-TR';
      r.interimResults = true;
      r.maxAlternatives = 3;
      r.continuous = false;
      var finished = false;
      r.onresult = function (e) {
        var alts = [], last = e.results[e.results.length - 1];
        for (var i = 0; i < last.length; i++) alts.push(last[i].transcript);
        if (last.isFinal) { finished = true; cb({ final:true, text:alts[0], alts:alts }); }
        else cb({ final:false, text:alts[0] });
      };
      r.onerror = function (e) { finished = true; cb({ error: e.error || 'error' }); };
      r.onend = function () { if (!finished) cb({ error:'nomatch' }); };
      try { r.start(); } catch (e) { cb({ error:'start' }); return null; }
      return r;
    },

    /* ── benzerlik puanı (0‑1) ── */
    norm: function (s) {
      return plain(s).toLocaleLowerCase('tr')
        .replace(/[.,!?;:]/g, '')
        .replace(/ğ/g, 'g').replace(/ş/g, 's').replace(/ç/g, 'c')
        .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
        .replace(/\s+/g, ' ').trim();
    },
    similarity: function (a, b) {
      a = this.norm(a); b = this.norm(b);
      if (!a || !b) return 0;
      if (a === b) return 1;
      var m = a.length, n = b.length, prev = [], cur = [], i, j;
      for (j = 0; j <= n; j++) prev[j] = j;
      for (i = 1; i <= m; i++) {
        cur[0] = i;
        for (j = 1; j <= n; j++) {
          cur[j] = Math.min(prev[j] + 1, cur[j-1] + 1, prev[j-1] + (a[i-1] === b[j-1] ? 0 : 1));
        }
        prev = cur.slice();
      }
      return Math.max(0, 1 - prev[n] / Math.max(m, n));
    },
    /* Birden çok alternatiften en iyisini alır */
    bestScore: function (alts, target) {
      var self = this, s = 0;
      (alts || []).forEach(function (a) { s = Math.max(s, self.similarity(a, target)); });
      return s;
    }
  };
})();
